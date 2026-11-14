#!/usr/bin/env node

// Mechanical extraction + classification pass for ds-token-check. Does NOT propose
// aliases, component token names, or Figma gaps — that judgment stays with the agent
// (see SKILL.md "Workflow"). This script only answers: "which --ds-* var() calls exist
// in this component family's .scss/.tsx files, and which layer does each belong to?"

const fs = require('fs')
const path = require('path')
const { globSync } = require('glob')
const postcssScss = require('postcss-scss')
const { checkNamingForKey, pascalToKebab } = require('./naming-rules')

const COMPONENTS_ROOT = 'packages/core/src/components'
const TOKENS_CSS_PATH = 'packages/tokens/dist/css/base.tokens.css'
const TOKENS_JSON_PATH = 'packages/tokens/tokens/Base.tokens.json'
const COMPONENT_TOKENS_KEY = '🧩 Component'

// Component-layer namespaces a whole category deliberately shares instead of each
// family owning its own key. Every form control (input, textarea, select, datepicker,
// number-input, …) styles its field box/label/description/control through the shared
// `Form` tokens (`--ds-form-*`) via form.mixin.scss / input.mixin.scss — confirmed
// intentional design. For a family in one of these categories, usages of the shared
// namespace classify as `component-shared` (treated like `component-own`: no REVIEW
// finding, its 🧩 key is naming-checked, and it gets a token inventory for the Figma
// checklist) instead of `component-foreign`.
const SHARED_OWNERS_BY_CATEGORY = {
  forms: ['form'],
}

function findDSRoot() {
  let current = process.cwd()
  while (current !== '/') {
    if (fs.existsSync(path.join(current, COMPONENTS_ROOT))) return current
    current = path.dirname(current)
  }
  throw new Error("Could not find design system root. Make sure you're in the DS repo.")
}

// Finds the family directory for a component name — e.g. "tabs" or "tab" both resolve
// to packages/core/src/components/navigation/tabs/, the shared parent of tabs/, tab/,
// tab-panel/. Sub-components live as SIBLING directories under this same parent, never
// nested inside one another, per packages/core/CONTEXT.md's <category>/<name>/ layout.
function findFamilyDir(dsRoot, componentName) {
  const categoryDirs = fs
    .readdirSync(path.join(dsRoot, COMPONENTS_ROOT), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  for (const category of categoryDirs) {
    const categoryPath = path.join(dsRoot, COMPONENTS_ROOT, category)
    const familyDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    for (const family of familyDirs) {
      if (family === componentName) {
        return { familyDir: path.join(categoryPath, family), familyKebab: family, category }
      }
    }
  }

  // Fallback: componentName might be a sub-component (e.g. "tab" inside the "tabs"
  // family) whose own directory doesn't match the family's name. Search one level
  // deeper for a directory literally named componentName, then return its parent.
  for (const category of categoryDirs) {
    const categoryPath = path.join(dsRoot, COMPONENTS_ROOT, category)
    const familyDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    for (const family of familyDirs) {
      const subDirs = fs
        .readdirSync(path.join(categoryPath, family), { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
      if (subDirs.includes(componentName)) {
        return { familyDir: path.join(categoryPath, family), familyKebab: family, category }
      }
    }
  }

  return null
}

// Every directory name that exists anywhere under packages/core/src/components — used
// to tell "component-foreign" (a real token belonging to some OTHER component, e.g.
// --ds-button-color-tertiary-base-text used inside ds-tabs) apart from "unknown"
// (doesn't match any known component namespace at all).
function listAllComponentDirNames(dsRoot) {
  const names = new Set()
  const categoryDirs = fs
    .readdirSync(path.join(dsRoot, COMPONENTS_ROOT), { withFileTypes: true })
    .filter(d => d.isDirectory())
  for (const category of categoryDirs) {
    const categoryPath = path.join(dsRoot, COMPONENTS_ROOT, category.name)
    const familyDirs = fs.readdirSync(categoryPath, { withFileTypes: true }).filter(d => d.isDirectory())
    for (const family of familyDirs) {
      names.add(family.name)
      const subDirs = fs
        .readdirSync(path.join(categoryPath, family.name), { withFileTypes: true })
        .filter(d => d.isDirectory())
      for (const sub of subDirs) names.add(sub.name)
    }
  }
  return names
}

function siblingComponentNames(familyDir) {
  return fs
    .readdirSync(familyDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'test')
    .map(d => d.name)
}

function collectSourceFiles(familyDir) {
  return [
    ...globSync(`${familyDir}/**/*.scss`, { ignore: `${familyDir}/test/**` }),
    ...globSync(`${familyDir}/**/*.tsx`, { ignore: `${familyDir}/test/**` }),
  ].sort()
}

// Pulls every `--ds-xxx` var() reference out of a line, alongside enough context to
// show the agent where it came from: the full line, and whether it's the 2nd argument
// of an `@include vars.local(name, ...)` call (the "resolution target" position) or a
// raw reference used directly in a CSS declaration.
const VAR_RE = /var\((--ds-[a-z0-9-]+)\)/g
const VARS_LOCAL_RE = /@include\s+vars\.local\(\s*([a-z0-9-]+)\s*,/

function extractUsages(file, dsRoot) {
  const relFile = path.relative(dsRoot, file)
  const lines = fs.readFileSync(file, 'utf-8').split('\n')
  const usages = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const varsLocalMatch = line.match(VARS_LOCAL_RE)
    let match
    VAR_RE.lastIndex = 0
    while ((match = VAR_RE.exec(line))) {
      usages.push({
        file: relFile,
        line: i + 1,
        token: match[1],
        context: line.trim(),
        viaVarsLocal: varsLocalMatch ? varsLocalMatch[1] : null,
      })
    }
  }

  return usages
}

function classify(token, familyKebab, siblingNames, allComponentNames, definedTokens, sharedOwners = []) {
  if (!definedTokens.has(token)) return 'missing'
  if (token.startsWith('--ds-global-')) return 'global'
  if (token.startsWith('--ds-alias-')) return 'alias'
  if (token.startsWith('--ds-device-')) return 'device'

  const rest = token.slice('--ds-'.length)
  for (const name of [familyKebab, ...siblingNames]) {
    if (rest === name || rest.startsWith(`${name}-`)) return 'component-own'
  }
  for (const name of sharedOwners) {
    if (rest === name || rest.startsWith(`${name}-`)) return 'component-shared'
  }
  for (const name of allComponentNames) {
    if (rest === name || rest.startsWith(`${name}-`)) return 'component-foreign'
  }
  return 'unknown'
}

function loadComponentLayer(dsRoot) {
  const tokensFile = path.join(dsRoot, TOKENS_JSON_PATH)
  const data = JSON.parse(fs.readFileSync(tokensFile, 'utf-8'))
  return data[COMPONENT_TOKENS_KEY] || {}
}

// Resolves every `component-own` token the family's CODE actually uses to the
// top-level 🧩 Component key it belongs to — NOT by guessing from folder names (a sub-
// component like "tab" may have no own key at all; its tokens live nested inside
// "Tabs", see SKILL.md's "Question 4" design note). Longest-kebab-prefix-match across
// every real top-level key disambiguates cases like "TabPanel" vs "Tabs" sharing the
// "tab" prefix.
function deriveComponentKeys(usages, componentLayer) {
  const topLevelKeys = Object.keys(componentLayer).filter(k => !k.startsWith('$'))
  const found = new Map() // key -> kebab

  for (const usage of usages) {
    if (usage.layer !== 'component-own' && usage.layer !== 'component-shared') continue
    const rest = usage.token.slice('--ds-'.length)

    let best = null
    for (const key of topLevelKeys) {
      const kebab = pascalToKebab(key)
      if (rest === kebab || rest.startsWith(`${kebab}-`)) {
        if (!best || kebab.length > best.kebab.length) best = { key, kebab }
      }
    }
    if (best) found.set(best.key, best.kebab)
  }

  return found
}

function loadDefinedTokens(dsRoot) {
  const cssPath = path.join(dsRoot, TOKENS_CSS_PATH)
  if (!fs.existsSync(cssPath)) {
    throw new Error(`${TOKENS_CSS_PATH} not found — run \`pnpm tokens\` first.`)
  }
  const css = fs.readFileSync(cssPath, 'utf-8')
  const defined = new Set()
  const re = /(--ds-[a-z0-9-]+)\s*:/g
  let match
  while ((match = re.exec(css))) defined.add(match[1])
  return defined
}

// ─────────────────────────────────────────────────────────────────────────
// Figma Property Checklist
//
// Builds the "is every Figma-bindable property backed by a Component token"
// matrix (border/background/radius/typography/text-color/opacity/padding/
// gap/margin, crossed per @Prop() variant×state). Two independent passes:
//
//  1. buildFigmaChecklist — for the "found token" side. Doesn't parse SCSS
//     at all: it generates CANDIDATE token names from the naming convention
//     (--ds-<family>-<dimension>-<value>-<state>-<suffix>) and checks each
//     against the already-compiled token set. This sidesteps a real problem
//     with parsing SCSS source directly — components like button build their
//     per-variant tokens via `@each $color in $colors { @include
//     color($color) }` with `#{$color}` interpolation, so the literal
//     `--ds-button-color-secondary-hover-background` string never appears
//     anywhere in the .scss source text for scan.js to find; it only exists
//     in the compiled CSS. Generating candidates and checking existence
//     against the compiled set is the only reliable way to catch gaps in
//     that pattern.
//
//  2. findHardcodedDeclarations — for the "no token at all, literal value"
//     side, which generation+existence-checking can't find (there's no name
//     to guess). This still needs to read the actual SCSS declarations via a
//     real parser (postcss-scss, not line regex) so it survives SCSS nesting
//     and mixin bodies the old line-based VAR_RE never had to deal with.
//
// Both passes are mechanical and produce candidates/findings for the agent
// to interpret — same division of labor as the rest of this script: scan.js
// extracts, the agent judges GAP vs N/A vs false positive before writing
// the report.
// ─────────────────────────────────────────────────────────────────────────

// Which @Prop()-declared enum crosses which category's candidate tokens.
// Suffix lists are the naming-convention guesses this generator tries —
// tuned against what's actually in the repo today (see button.figma.md),
// not an exhaustive spec. A category that matches zero suffixes for a given
// component is reported as "not found anywhere" rather than silently
// dropped — the agent still has to look and decide GAP vs N/A.
const CATEGORY_SUFFIXES = {
  'Border': ['border', 'border-color', 'border-width', 'border-style'],
  'Background': ['background', 'background-color'],
  'Radius': ['radius', 'border-radius'],
  // ADR-0037: a typography token wires all 7 parts, not 4 — letter-spacing/text-decoration/
  // text-transform are real, checkable suffixes now (no longer blanket-EXEMPT, see SKILL.md).
  'Typography': [
    'font-family',
    'font-weight',
    'font-size',
    'line-height',
    'letter-spacing',
    'text-decoration',
    'text-transform',
  ],
  'Text-Color': ['text', 'color', 'text-color'],
  'Opacity': ['opacity'],
  'Padding': ['padding-x', 'padding-y', 'padding', 'padding-inline', 'padding-block'],
  'Gap': ['gap', 'row-gap', 'column-gap'],
  'Margin': ['margin', 'margin-inline', 'margin-block'],
}

// Closed vocabulary of interaction-state suffixes to probe for, lowercased
// to match CSS custom property naming. Mirrors naming-rules.js's STATE_WORDS
// (its canonical casing lives there; this is the generator's own probe list,
// kept separate since this one drives token-NAME GENERATION, not JSON key
// validation).
const STATE_CANDIDATES = ['base', 'hover', 'active', 'focus', 'disabled', 'selected']

// Maps a raw CSS property name (direct declaration, e.g. `border-radius:`)
// to a checklist category. Used by findHardcodedDeclarations.
const PROPERTY_CATEGORY_MAP = {
  'border': 'Border',
  'border-color': 'Border',
  'border-width': 'Border',
  'border-style': 'Border',
  'border-top': 'Border',
  'border-right': 'Border',
  'border-bottom': 'Border',
  'border-left': 'Border',
  'background': 'Background',
  'background-color': 'Background',
  'border-radius': 'Radius',
  'font-family': 'Typography',
  'font-weight': 'Typography',
  'font-size': 'Typography',
  'line-height': 'Typography',
  'letter-spacing': 'Typography',
  'text-decoration': 'Typography',
  'text-transform': 'Typography',
  'color': 'Text-Color',
  'opacity': 'Opacity',
  'padding': 'Padding',
  'padding-inline': 'Padding',
  'padding-block': 'Padding',
  'padding-top': 'Padding',
  'padding-right': 'Padding',
  'padding-bottom': 'Padding',
  'padding-left': 'Padding',
  'padding-inline-start': 'Padding',
  'padding-inline-end': 'Padding',
  'gap': 'Gap',
  'row-gap': 'Gap',
  'column-gap': 'Gap',
  'margin': 'Margin',
  'margin-inline': 'Margin',
  'margin-block': 'Margin',
  'margin-top': 'Margin',
  'margin-right': 'Margin',
  'margin-bottom': 'Margin',
  'margin-left': 'Margin',
}

// Keyword heuristic for CUSTOM property names (--mod-button-color-text,
// --_button-px, the vars.local() local-name position) where there's no
// standard CSS property to look up directly. Order matters: check the more
// specific word ("radius") before the word it's a substring neighbour of
// ("border-radius" contains both "border" and "radius" — radius must win).
function categorizeLocalName(name) {
  const n = name.toLowerCase()
  if (n.includes('radius')) return 'Radius'
  if (n.includes('background')) return 'Background'
  if (n.includes('border')) return 'Border'
  if (n.includes('opacity')) return 'Opacity'
  if (
    n.includes('font') ||
    n.includes('line-height') ||
    n.includes('lineheight') ||
    n.includes('letter-spacing') ||
    n.includes('text-decoration') ||
    n.includes('text-transform')
  )
    return 'Typography'
  if (n.includes('gap')) return 'Gap'
  if (n.includes('margin')) return 'Margin'
  if (/(^|[-_])(padding|px|py)([-_]|$)/.test(n)) return 'Padding'
  if (n.includes('color')) return 'Text-Color'
  return null
}

function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

const PROP_BLOCK_RE = /@Prop\([^)]*\)([\s\S]*?)readonly\s+(\w+)/g
const ONE_OF_RE = /@OneOf\((\w+)\)/
const TYPE_RE = /@Type\('(\w+)'\)/
const CONST_ARRAY_RE = /export\s+const\s+([A-Z][A-Z0-9_]*)\s*=\s*\[([\s\S]*?)\]\s*as\s+const/g
const STRING_LITERAL_RE = /['"]([^'"]+)['"]/g

function parseConstArrays(content) {
  const consts = new Map()
  let m
  CONST_ARRAY_RE.lastIndex = 0
  while ((m = CONST_ARRAY_RE.exec(content))) {
    const values = []
    let sm
    STRING_LITERAL_RE.lastIndex = 0
    while ((sm = STRING_LITERAL_RE.exec(m[2]))) values.push(sm[1])
    consts.set(m[1], values)
  }
  return consts
}

// Reads every @Prop() in the family's .tsx files and resolves it to its
// variant dimension, via the repo-wide @OneOf(SOME_CONST) / @Type('boolean')
// decorator convention (confirmed in use across 56+ components, not
// button-specific). SOME_CONST is then resolved against the sibling
// `export const SOME_CONST = [...] as const` arrays in *.interfaces.ts.
// Only enum props with >=2 options and boolean props are kept — string/
// number props (href, label, …) aren't variant dimensions.
function parseFamilyProps(familyDir) {
  const tsxFiles = globSync(`${familyDir}/**/*.tsx`, { ignore: `${familyDir}/test/**` })
  const interfaceFiles = globSync(`${familyDir}/**/*.interfaces.ts`, { ignore: `${familyDir}/test/**` })

  const consts = new Map()
  for (const file of interfaceFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const [name, values] of parseConstArrays(content)) consts.set(name, values)
  }

  const propEnums = {}
  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    let m
    PROP_BLOCK_RE.lastIndex = 0
    while ((m = PROP_BLOCK_RE.exec(content))) {
      const [, blob, propName] = m
      const oneOf = blob.match(ONE_OF_RE)
      const typeMatch = blob.match(TYPE_RE)
      if (oneOf && consts.has(oneOf[1])) {
        const values = consts.get(oneOf[1])
        if (values.length >= 2) propEnums[propName] = { kind: 'enum', values, source: path.basename(file) }
      } else if (typeMatch && typeMatch[1] === 'boolean') {
        propEnums[propName] = { kind: 'boolean', source: path.basename(file) }
      }
    }
  }
  return propEnums
}

// Generates the property×variant×state matrix by candidate-name generation
// + existence check against the compiled token set (see file-header comment
// for why this can't be done by parsing SCSS source for component-own
// categories gated by an @Prop() enum (color, size, …). Each (category,
// suffix) is probed against every enum dimension using the dimension's
// FIRST value to discover whether that dimension gates it at all, and if
// so, which state words it uses — then the full value×state grid is
// generated and checked. A (category, suffix) matching no dimension falls
// back to an "ungated" probe (a single component-level token, optionally
// stateful, not crossed by any variant) before being reported as not found.
function buildFigmaChecklist(familyKebab, propEnums, definedTokens) {
  const enumDims = Object.entries(propEnums).filter(([, p]) => p.kind === 'enum')
  const rows = []

  for (const [category, suffixes] of Object.entries(CATEGORY_SUFFIXES)) {
    for (const suffix of suffixes) {
      let matchedAnyDimension = false

      for (const [dimName, dim] of enumDims) {
        const dimKebab = camelToKebab(dimName)
        const probeValue = dim.values[0]
        const statefulHits = STATE_CANDIDATES.filter(state =>
          definedTokens.has(`--ds-${familyKebab}-${dimKebab}-${probeValue}-${state}-${suffix}`),
        )
        const statelessHit = definedTokens.has(`--ds-${familyKebab}-${dimKebab}-${probeValue}-${suffix}`)
        if (statefulHits.length === 0 && !statelessHit) continue

        matchedAnyDimension = true
        const states = statefulHits.length > 0 ? statefulHits : [null]
        const cells = []
        for (const value of dim.values) {
          for (const state of states) {
            const token = state
              ? `--ds-${familyKebab}-${dimKebab}-${value}-${state}-${suffix}`
              : `--ds-${familyKebab}-${dimKebab}-${value}-${suffix}`
            cells.push({ dimension: dimName, value, state, token, found: definedTokens.has(token) })
          }
        }
        rows.push({ category, suffix, dimension: dimName, states, cells })
      }

      if (!matchedAnyDimension) {
        const statefulHits = STATE_CANDIDATES.filter(state =>
          definedTokens.has(`--ds-${familyKebab}-${state}-${suffix}`),
        )
        const statelessToken = `--ds-${familyKebab}-${suffix}`
        const statelessHit = definedTokens.has(statelessToken)

        if (statefulHits.length > 0 || statelessHit) {
          const states = statefulHits.length > 0 ? statefulHits : [null]
          const cells = states.map(state => {
            const token = state ? `--ds-${familyKebab}-${state}-${suffix}` : statelessToken
            return { dimension: null, value: null, state, token, found: definedTokens.has(token) }
          })
          rows.push({ category, suffix, dimension: null, states, cells })
        } else {
          rows.push({ category, suffix, dimension: null, states: [], cells: [], notFoundAnywhere: true })
        }
      }
    }
  }

  return rows
}

// Inventory of a shared owner's tokens (e.g. every `--ds-form-*`), bucketed into the 9
// checklist categories by longest matching suffix. buildFigmaChecklist can't cross these
// against the family's @Prop() enums: the shared namespace has its own anatomy
// (`--ds-form-<state>-<part>-<suffix>`, e.g. `--ds-form-danger-container-border`, with
// `default` where the family prop says `primary`), so the agent maps them to variant ×
// state by hand. `referencedInFamilySource` is a literal match against the family's own
// files only — tokens applied indirectly through the owner's mixins (e.g.
// form.mixin.scss's container/label/description) show `false` while still rendering.
function buildSharedOwnerInventory(sharedOwners, definedTokens, usages) {
  const referenced = new Set(usages.map(u => u.token))
  const suffixEntries = Object.entries(CATEGORY_SUFFIXES)
    .flatMap(([category, suffixes]) => suffixes.map(suffix => ({ category, suffix })))
    .sort((a, b) => b.suffix.length - a.suffix.length)

  return sharedOwners.map(owner => {
    const byCategory = Object.fromEntries(Object.keys(CATEGORY_SUFFIXES).map(c => [c, []]))
    const uncategorized = []
    for (const token of definedTokens) {
      if (!token.startsWith(`--ds-${owner}-`)) continue
      const match = suffixEntries.find(({ suffix }) => token.endsWith(`-${suffix}`))
      const entry = { token, referencedInFamilySource: referenced.has(token) }
      if (match) byCategory[match.category].push(entry)
      else uncategorized.push(entry)
    }
    return { owner, byCategory, uncategorized }
  })
}

// Value strings that are never a token candidate regardless of property —
// generic CSS keywords/resets, not design values.
const HARDCODED_SKIP_VALUES = new Set(['none', 'inherit', 'initial', 'unset', 'auto', '0', 'normal'])

// Finds literal (non-var()) values on properties this skill cares about, by
// walking a real SCSS AST (postcss-scss) instead of line regex — survives
// nested rules, @mixin bodies, and @each loops the old VAR_RE never handled.
// This is strictly the "no token at all" side; anything resolving through
// ANY var(--...) — including the component's own private indirection layer
// (var(--_button-color-background)), not just a direct var(--ds-*) — is
// skipped here, because that hop is already covered by the existing
// --ds-* usage extraction elsewhere in this script (classify()) and by
// buildFigmaChecklist's existence check. This pass only wants declarations
// with NO variable indirection at all.
function findHardcodedDeclarations(scssFiles, dsRoot) {
  const findings = []
  for (const file of scssFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    let root
    try {
      root = postcssScss.parse(content, { from: file })
    } catch {
      // Unparsable fragment (rare SCSS syntax) — not fatal, the agent's
      // manual file read during the report pass is the fallback for this.
      continue
    }

    root.walkDecls(decl => {
      const value = decl.value.trim()
      if (value.includes('var(--')) return
      if (HARDCODED_SKIP_VALUES.has(value)) return
      if (/^(transition|animation)/.test(decl.prop)) return

      const category = decl.prop.startsWith('--') ? categorizeLocalName(decl.prop) : PROPERTY_CATEGORY_MAP[decl.prop]
      if (!category) return

      findings.push({
        file: path.relative(dsRoot, file),
        line: decl.source?.start?.line ?? null,
        property: decl.prop,
        value,
        category,
      })
    })
  }
  return findings
}

function scan(componentName) {
  const dsRoot = findDSRoot()
  const found = findFamilyDir(dsRoot, componentName)
  if (!found) {
    throw new Error(`No component family directory found for "${componentName}" under ${COMPONENTS_ROOT}.`)
  }

  const { familyDir, familyKebab, category } = found
  const siblingNames = siblingComponentNames(familyDir)
  const allComponentNames = listAllComponentDirNames(dsRoot)
  const definedTokens = loadDefinedTokens(dsRoot)
  const files = collectSourceFiles(familyDir)
  const sharedOwners = (SHARED_OWNERS_BY_CATEGORY[category] || []).filter(
    owner => owner !== familyKebab && !siblingNames.includes(owner),
  )

  const usages = []
  for (const file of files) {
    usages.push(...extractUsages(file, dsRoot))
  }

  for (const usage of usages) {
    usage.layer = classify(usage.token, familyKebab, siblingNames, allComponentNames, definedTokens, sharedOwners)
  }

  const componentLayer = loadComponentLayer(dsRoot)
  const componentKeys = deriveComponentKeys(usages, componentLayer)

  const naming = []
  for (const [key, kebab] of componentKeys) {
    naming.push({ key, kebab, violations: checkNamingForKey(kebab, componentLayer[key]) })
  }

  const propEnums = parseFamilyProps(familyDir)
  const figmaChecklist = buildFigmaChecklist(familyKebab, propEnums, definedTokens)
  const sharedOwnerInventory = buildSharedOwnerInventory(sharedOwners, definedTokens, usages)
  const scssFiles = files.filter(f => f.endsWith('.scss'))
  const hardcodedDeclarations = findHardcodedDeclarations(scssFiles, dsRoot)

  return {
    dsRoot,
    category,
    familyKebab,
    familyDir: path.relative(dsRoot, familyDir),
    siblingNames,
    sharedOwners,
    files: files.map(f => path.relative(dsRoot, f)),
    usages,
    componentKeys: [...componentKeys.keys()],
    naming,
    propEnums,
    figmaChecklist,
    sharedOwnerInventory,
    hardcodedDeclarations,
  }
}

module.exports = {
  scan,
  findFamilyDir,
  findDSRoot,
  parseFamilyProps,
  buildFigmaChecklist,
  findHardcodedDeclarations,
  CATEGORY_SUFFIXES,
  PROPERTY_CATEGORY_MAP,
}

if (require.main === module) {
  const componentName = process.argv[2]
  if (!componentName) {
    console.log('Usage: node scan.js <component-name>')
    process.exit(1)
  }
  try {
    const result = scan(componentName)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}
