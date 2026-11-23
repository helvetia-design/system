#!/usr/bin/env node
// Phase 1–2 / 4 check: does the mapping file cover the code?
//   node .claude/skills/ds-code-to-figma/scripts/check-mapping-coverage.mjs <component>
// Reads the code (each member's .tsx: @Prop()s and @part tags) and every member's
// `<name>.figma.md`, and prints one Markdown table row per check. Exit code 1 if any check fails.
// It never reads Figma and never judges a mapping decision — only that every prop, part and
// family member has one.
import fs from 'node:fs'
import path from 'node:path'
import { REPO_ROOT, resolveComponentDir, readMapping, findMembers } from './lib/mapping.mjs'

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: check-mapping-coverage.mjs <component name | folder | mapping file>')
  process.exit(2)
}

const rows = []
const row = (check, verdict, found, expected, details = '') => rows.push({ check, verdict, found, expected, details })

const componentDir = resolveComponentDir(arg)
const componentsRoot = path.join(REPO_ROOT, 'packages/core/src/components')
const [category, family] = path.relative(componentsRoot, componentDir).split(path.sep)
const familyDir = path.join(componentsRoot, category, family)

// --- family --------------------------------------------------------------------------------------
const members = findMembers(familyDir)
const docConfig = tag => {
  const short = tag.replace(/^ds-/, '')
  return path.join(REPO_ROOT, 'apps/storybook/src/components', category, short, `${short}.doc-config.ts`)
}
const owners = members.filter(m => fs.existsSync(docConfig(m.tag)))
const subs = members.filter(m => !owners.includes(m))
row(
  'family members',
  owners.length === 1 || subs.length === 0 ? 'pass' : 'fail',
  `${owners.length} owner, ${subs.length} sub`,
  '1 owner',
  `owner: ${owners.map(m => m.tag).join(', ') || 'none'}; sub-components: ${subs.map(m => m.tag).join(', ') || 'none'}`,
)

const ownerMapping = owners[0] && path.join(path.dirname(owners[0].file), `${owners[0].name}.figma.md`)
const ownerYaml = ownerMapping && fs.existsSync(ownerMapping) ? readMapping(ownerMapping) : null

for (const member of members) {
  const mappingFile = path.join(path.dirname(member.file), `${member.name}.figma.md`)
  const rel = path.relative(REPO_ROOT, mappingFile)
  if (!fs.existsSync(mappingFile)) {
    row(`${member.tag}: mapping file`, 'fail', 'missing', rel)
    continue
  }
  const map = readMapping(mappingFile)
  row(`${member.tag}: mapping file`, 'pass', 'exists', rel)
  row(
    `${member.tag}: valid YAML`,
    map.__errors.length ? 'fail' : 'pass',
    map.__errors.length ? `${map.__errors.length} section(s) broken` : 'all sections parse',
    'all sections parse',
    map.__errors.map(e => `\`${e.key}\` line ${e.line + 1} of the section: ${e.message}`).join('; '),
  )

  // Sub-component listed in the owner's nested: with subComponent: true.
  if (subs.includes(member)) {
    const listed = (ownerYaml?.nested || []).find(n => n.childTag === member.tag && n.subComponent)
    row(`${member.tag}: listed in owner`, listed ? 'pass' : 'fail', listed ? 'yes' : 'no', 'nested: subComponent: true')
  }

  const meta = readSource(member.file)

  // Every name the mapping file accounts for: props[].name (`a / b` lists several), a grouped
  // entry's `props:` list (e.g. `name: '[excluded]'`), and componentStates keys. Names only in a
  // note don't count — any word there would match a prop by accident.
  const covered = new Map()
  const add = (name, how) => name && !covered.has(name) && covered.set(name, how)
  for (const p of map.props || []) {
    for (const n of String(p.name).split(/\s*\/\s*/)) add(n, p.figmaPropertyType || 'listed')
    for (const n of [].concat(p.props || [])) add(String(n), p.figmaPropertyType || 'listed')
  }
  for (const key of Object.keys(map.componentStates || {})) add(key, 'component state')

  const props = meta.props
  const missing = props.filter(n => !covered.has(n))
  row(
    `${member.tag}: props`,
    missing.length ? 'fail' : 'pass',
    `${props.length - missing.length} / ${props.length}`,
    `${props.length} / ${props.length}`,
    missing.length ? `not in the mapping: ${missing.join(', ')}` : '',
  )

  // Every @part has an anatomy entry (the owner's merged list covers a family).
  const parts = meta.parts
  const anatomyYaml = subs.includes(member) && ownerYaml ? ownerYaml : map
  const anatomy = new Set((anatomyYaml.anatomy || []).map(a => a.part).filter(Boolean))
  const partsMissing = parts.filter(p => !anatomy.has(p))
  if (parts.length) {
    row(
      `${member.tag}: parts in anatomy`,
      partsMissing.length ? 'fail' : 'pass',
      `${parts.length - partsMissing.length} / ${parts.length}`,
      `${parts.length} / ${parts.length}`,
      partsMissing.length ? `missing: ${partsMissing.join(', ')}` : '',
    )
  }

  // Focus is never a state (user decision 19.11.2026).
  const stateOptions = map.states?.options || []
  row(
    `${member.tag}: no focus state`,
    stateOptions.includes('focus') ? 'fail' : 'pass',
    stateOptions.join(' · ') || 'no state axis',
    'no `focus`',
  )

  // Text property defaults: the property name in sentence case (PHASE-2-PROPOSE.md → Naming).
  for (const p of (map.props || []).filter(p => p.figmaPropertyType === 'text')) {
    const want = sentenceCase(p.figmaProperty || p.name)
    row(
      `${member.tag}: text default \`${p.figmaProperty}\``,
      p.default === want ? 'pass' : 'fail',
      String(p.default),
      want,
    )
  }
}

console.log('| check | verdict | found | expected | details |')
console.log('| --- | --- | --- | --- | --- |')
for (const r of rows) console.log(`| ${r.check} | ${r.verdict} | ${r.found} | ${r.expected} | ${r.details} |`)
process.exit(rows.some(r => r.verdict === 'fail') ? 1 : 0)

/** Public props (`@Prop()` fields) and `@part` JSDoc tags, straight from the .tsx. */
function readSource(file) {
  const text = fs.readFileSync(file, 'utf8')
  // `@Prop(…)`, then any other decorators, comments and whitespace (same line or the next ones),
  // then the field: covers both `@Prop() readonly x` on one line and the multi-line form.
  const args = String.raw`\((?:[^()]|\([^()]*\))*\)`
  const between = String.raw`(?:\s|@\w+${args}|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*`
  const field = String.raw`(?:(?:readonly|public|protected|private)\s+)*(\w+)[?!]?\s*[:=;]`
  // Commented-out props (`// @Prop() dsPopup …` in button.tsx) are not props: drop comments first.
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const props = [...code.matchAll(new RegExp(`@Prop${args}${between}${field}`, 'g'))].map(m => m[1])
  const parts = [...text.matchAll(/@part\s+([\w-]+)/g)].map(m => m[1])
  return { props, parts }
}

function sentenceCase(name) {
  const s = String(name).trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}
