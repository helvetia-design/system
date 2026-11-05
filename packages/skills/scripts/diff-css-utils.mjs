#!/usr/bin/env node
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const MAP = JSON.parse(
  readFileSync(new URL('../skills/ds-migrate-from-baloise/shared/css-utils-map.json', import.meta.url), 'utf8'),
)
const VARIANT_RENAMES = MAP.variants.renamed
const STRUCTURE_RENAMES = MAP.structure
const SUFFIX_RENAMES = [
  ['-hovered', '-hover'],
  ['-pressed', '-active'],
]

const EXTRACTORS = { classes: extractClasses }

/** Returns the sorted, unescaped class names used in the selectors of a stylesheet. */
export function extractClasses(css) {
  const classes = new Set()
  for (const selector of selectors(css)) {
    for (const match of selector.matchAll(/\.((?:\\.|[\w-])+)/g)) {
      const name = match[1].replace(/\\(.)/g, '$1')
      if (/^-?[A-Za-z_]/.test(name)) classes.add(name)
    }
  }
  return [...classes].sort()
}

function selectors(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const found = []
  let start = 0
  const stack = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"' || ch === "'") {
      const end = text.indexOf(ch, i + 1)
      i = end === -1 ? text.length : end
      continue
    }
    if (ch === '{') {
      const prelude = text.slice(start, i).trim()
      const declarations = stack.length > 0 && stack[stack.length - 1] === 'rule'
      const kind = declarations ? 'rule' : prelude.startsWith('@') ? atRuleKind(prelude) : 'rule'
      if (kind === 'rule' && !declarations) found.push(prelude)
      stack.push(kind)
      start = i + 1
      continue
    }
    if (ch === '}') {
      stack.pop()
      start = i + 1
      continue
    }
    if (ch === ';') start = i + 1
  }
  return found
}

// Keyframe selectors such as `33.3%` are not class selectors, so their blocks are skipped as declarations.
function atRuleKind(prelude) {
  return /^@(?:-\w+-)?keyframes\b/.test(prelude) ? 'rule' : 'group'
}

/** Returns `<structure> <modifier>` pairs for every class that shares a compound selector with a structure class. */
export function extractModifiers(css, structures) {
  const pairs = new Set()
  for (const selector of selectors(css)) {
    for (const compound of selector.split(/[\s>+~,()]+/)) {
      const classes = [...compound.matchAll(/\.((?:\\.|[\w-])+)/g)].map(match => match[1].replace(/\\(.)/g, '$1'))
      for (const structure of structures) {
        if (!classes.includes(structure)) continue
        for (const name of classes) if (name !== structure) pairs.add(`${structure} ${name}`)
      }
    }
  }
  return [...pairs].sort()
}

/** Splits `widescreen:mb-small` into its variant prefix and base when the prefix is a known variant. */
export function splitVariant(name, variants) {
  const index = name.indexOf(':')
  if (index === -1) return { variant: '', base: name }
  const variant = name.slice(0, index)
  return variants.has(variant) ? { variant, base: name.slice(index + 1) } : { variant: '', base: name }
}

function variantsOf(names) {
  const variants = new Set()
  for (const name of names) {
    const index = name.indexOf(':')
    if (index > 0) variants.add(name.slice(0, index))
  }
  return variants
}

function proposeBase(base) {
  const candidates = []
  if (Object.hasOwn(STRUCTURE_RENAMES, base)) candidates.push(STRUCTURE_RENAMES[base])
  for (const [from, to] of SUFFIX_RENAMES) {
    if (base.endsWith(from)) candidates.push(base.slice(0, -from.length) + to)
  }
  if (/(^|-)title(-|$)/.test(base)) candidates.push(base.replace(/(^|-)title(-|$)/, '$1heading$2'))
  return candidates
}

/** Compares two class lists and proposes renames whose target exists on the Helvetia side. */
export function diffClasses(baloise, helvetia) {
  const helvetiaSet = new Set(helvetia)
  const baloiseSet = new Set(baloise)
  const variants = variantsOf([...baloise, ...helvetia])
  const identical = baloise.filter(name => helvetiaSet.has(name))
  const baloiseOnly = baloise.filter(name => !helvetiaSet.has(name))
  const helvetiaOnly = helvetia.filter(name => !baloiseSet.has(name))
  const proposed = {}
  for (const name of baloiseOnly) {
    const { variant, base } = splitVariant(name, variants)
    const prefixes = variant
      ? [variant, Object.hasOwn(VARIANT_RENAMES, variant) && VARIANT_RENAMES[variant]].filter(Boolean)
      : ['']
    const bases = [base, ...proposeBase(base)]
    for (const prefix of prefixes) {
      const target = bases
        .map(candidate => (prefix ? `${prefix}:${candidate}` : candidate))
        .find(candidate => candidate !== name && helvetiaSet.has(candidate))
      if (target) {
        proposed[name] = target
        break
      }
    }
  }
  return { identical, baloiseOnly, helvetiaOnly, proposed }
}

/** Builds the diff for one kind of name; only `classes` exists so far. */
export function diffStylesheets({ kind = 'classes', baloise, helvetia }) {
  const extract = EXTRACTORS[kind]
  if (!extract) throw new Error(`Unknown kind: ${kind}`)
  const collect = sources => [...new Set(sources.flatMap(source => extract(source.css)))].sort()
  const baloiseNames = collect(baloise)
  return { baloiseNames, ...diffClasses(baloiseNames, collect(helvetia)) }
}

// `--baloise core.css#container` keeps only the listed classes and the modifiers that share a rule with them.
function readSource(argument) {
  const [file, filter] = argument.split('#')
  const css = readFileSync(resolve(file), 'utf8')
  if (!filter) return { css }
  const keep = filter.split(',')
  const rules = selectors(css).filter(selector =>
    keep.some(name => new RegExp(`\\.${name}(?![\\w-])`).test(selector.replace(/\\(.)/g, '$1'))),
  )
  return { css: rules.map(rule => `${rule} {}`).join('\n') }
}

export function parseArgs(argv) {
  const options = { kind: 'classes', baloise: [], helvetia: [], classesOut: undefined, modifiersOut: undefined }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const value = argv[i + 1]
    if (!value) throw new Error(`Missing value for ${flag}`)
    if (flag === '--baloise') options.baloise.push(value)
    else if (flag === '--helvetia') options.helvetia.push(value)
    else if (flag === '--classes-out') options.classesOut = value
    else if (flag === '--modifiers-out') options.modifiersOut = value
    else if (flag === '--kind') options.kind = value
    else throw new Error(`Unknown argument: ${flag}`)
    i++
  }
  if (options.baloise.length === 0 || options.helvetia.length === 0) {
    throw new Error(
      'Usage: diff-css-utils.mjs --baloise <file>[#class,...] [...] --helvetia <file> [...] [--classes-out <path>] [--modifiers-out <path>]',
    )
  }
  return options
}

export function run(argv, stdout) {
  const options = parseArgs(argv)
  const baloise = options.baloise.map(readSource)
  const { baloiseNames, ...diff } = diffStylesheets({
    kind: options.kind,
    baloise,
    helvetia: options.helvetia.map(readSource),
  })
  if (options.classesOut) writeFileSync(resolve(options.classesOut), `${baloiseNames.join('\n')}\n`)
  if (options.modifiersOut) {
    const pairs = [...new Set(baloise.flatMap(source => extractModifiers(source.css, Object.keys(STRUCTURE_RENAMES))))]
    writeFileSync(resolve(options.modifiersOut), `${pairs.sort().join('\n')}\n`)
  }
  stdout.write(`${JSON.stringify(diff, null, 2)}\n`)
  return 0
}

function isMainModule() {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(entry))
  } catch {
    return pathToFileURL(resolve(entry)).href === import.meta.url
  }
}

if (isMainModule()) {
  try {
    process.exit(run(process.argv.slice(2), process.stdout))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  }
}
