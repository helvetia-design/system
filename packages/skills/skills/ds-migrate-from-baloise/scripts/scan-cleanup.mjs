#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { basename, extname, posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  baloiseDependencies,
  DEPENDENCY_FIELDS,
  dependencyNames,
  detectPackageManager,
  IMPORT_EXTENSIONS,
  installCommand,
  LOCKFILES,
} from './detect-baloise.mjs'
import { CORE_GROUPS, scanCssUtils } from './scan-css-utils.mjs'
import { scanMigratable } from './scan-migratable.mjs'
import { scanSourceFiles, toSnippet } from './source-scan.mjs'

const GATE_EXTENSIONS = new Set([...IMPORT_EXTENSIONS, '.less'])
const TAG_EXTENSIONS = new Set([...GATE_EXTENSIONS].filter(ext => ext !== '.json'))
const YAML_EXTENSIONS = new Set(['.yml', '.yaml'])
const EXTENSIONS = new Set([...GATE_EXTENSIONS, ...YAML_EXTENSIONS])
const STRING_ENTRY_FILES = new Set(['angular.json', 'project.json'])
const LEGACY_RE = /@baloise\/ds-[a-z]/
const TAG_RE = /<\/?(?:bal-[a-z]|Bal[A-Z])/
const LEGACY_KEY_RE = /^@baloise\/ds-[a-z]/
const PACKAGE_RE = /@baloise\/ds-[a-z0-9-]+/g
const DEPENDENCY_LINE_RE = /^\s*"@baloise\/ds-[a-z0-9-]+"\s*:/
const TODO_RE = /TODO: remove these legacy Baloise imports once the Helvetia migration is verified/
const stylesPath = names => String.raw`@baloise\/ds-styles\/(?:dist\/)?css\/(?:${names})(?:\.min)?(?:\.css)?`
const CORE_RE = new RegExp(`${stylesPath('core')}(?![\\w/-])`)
const REMOVE_RE = new RegExp(`${stylesPath('structure|core')}(?![\\w/-])`)
const TARGET = `[^'"\\s]*${stylesPath('structure|core')}`
const STATEMENT_RES = [
  new RegExp(`^@(?:import|use)\\s+(['"])${TARGET}\\1\\s*;?$`),
  new RegExp(`^import\\s+(['"])${TARGET}\\1\\s*;?$`),
  new RegExp(`^<link\\b[^<>]*\\shref\\s*=\\s*(["'])${TARGET}\\1[^<>]*>$`, 'i'),
]
const STRING_ENTRY_RE = new RegExp(`^"${TARGET}"\\s*,?$`)
const ASSETS_RES = [
  /@baloise\/ds-styles\/(?:(?:dist\/)?css|sass)\/font(?:\.min)?(?:\.css|\.sass|\.scss)?(?![\w/-])/,
  /@baloise\/ds-fonts\b/,
  /@baloise\/ds-favicons\b/,
  /@baloise\/ds-(?:brand-)?icons\b/,
]
const UTILITIES_RE = /@baloise\/ds-styles\/(?:dist\/)?css\/utilities\//
const LEGACY_CONFIG_RE =
  /\b(?:initializeBaloiseDesignSystem|useBaloiseDesignSystem|provideBaloiseDesignSystem|BaloiseDesignSystemModule|updateBalLanguage)\b/

export function scanCleanup(rootDir) {
  const root = realpathSync(resolve(rootDir))
  const { suggested, notYet, types, byHand = [] } = scanMigratable(root, [], { extensions: GATE_EXTENSIONS })
  const coreClassesLeft = hasCoreClasses(scanCssUtils(root))

  const hidden = []
  const lines = []
  const manifests = []
  const unreadable = []
  scanSourceFiles(
    root,
    source => {
      const { file, text } = source
      const name = basename(file)
      if (LOCKFILES.has(name)) return
      if (TAG_EXTENSIONS.has(extname(file))) collectHiddenTags(file, text, source, hidden)
      let dependencyKeys = []
      if (name === 'package.json') {
        const manifest = parseJson(text)
        if (!manifest) {
          unreadable.push(file)
          return
        }
        manifests.push({ packageJsonPath: file, manifest })
        dependencyKeys = findDependencyKeys(text)
      }
      collectLines(file, text, source.comments, dependencyKeys, coreClassesLeft, lines)
    },
    { extensions: EXTENSIONS },
  )

  if (suggested.length > 0 || notYet.length > 0 || types.length > 0 || byHand.length > 0 || hidden.length > 0) {
    const outstanding = { suggested, notYet, types, hidden: hidden.sort(byPosition) }
    return { status: 'incomplete', outstanding: byHand.length > 0 ? { ...outstanding, byHand } : outstanding }
  }

  const removeLines = lines
    .filter(entry => entry.type === 'remove')
    .sort(byPosition)
    .map(({ file, line, snippet, kind }) => ({ file, line, snippet, kind }))
  const keptLines = lines.filter(entry => entry.type === 'keep').sort(byPosition)
  const commented = lines
    .filter(entry => entry.type === 'commented')
    .sort(byPosition)
    .map(({ file, line, snippet }) => ({ file, line, snippet }))
  const dependencies = planDependencies(manifests, keptLines)
  const packageManager = detectPackageManager(root)

  return {
    status: removeLines.length > 0 || dependencies.remove.length > 0 ? 'ready' : 'nothing-to-clean-up',
    packageManager,
    installCommand: installCommand(packageManager),
    remove: { lines: removeLines, dependencies: dependencies.remove },
    keep: {
      lines: keptLines.map(({ file, line, snippet, reason }) => ({ file, line, snippet, reason })),
      dependencies: dependencies.keep,
    },
    commented,
    unreadable: unreadable.sort(),
  }
}

export function run(rootDir, stdout) {
  stdout.write(`${JSON.stringify(scanCleanup(rootDir), null, 2)}\n`)
  return 0
}

function byPosition(a, b) {
  return a.file.localeCompare(b.file) || a.line - b.line
}

// The completeness gate reads masked source, where a tag inside a string literal is blanked.
function collectHiddenTags(file, text, source, found) {
  if (!TAG_RE.test(source.comments)) return
  const raw = text.split('\n')
  const active = source.comments.split('\n')
  const visible = source.masked.split('\n')
  active.forEach((line, index) => {
    if (TAG_RE.test(line) && !TAG_RE.test(visible[index] ?? '')) {
      found.push({ file, line: index + 1, snippet: toSnippet(raw[index]) })
    }
  })
}

// `css/core` also styles plain classes such as `table` and `link`, not only `bal-*` components.
// A selector in the app's own stylesheet does not use `css/core`, and CSS utils never edits stylesheets.
function hasCoreClasses({ files, dynamic }) {
  const moves = files.flatMap(entry => entry.findings.flatMap(finding => finding.classes))
  return (
    moves.some(move => CORE_GROUPS.has(move.group)) ||
    dynamic.some(entry => (entry.group === 'core' || entry.core) && entry.reason !== 'selector in a stylesheet')
  )
}

function collectLines(file, text, comments, dependencyKeys, coreClassesLeft, found) {
  const isYaml = YAML_EXTENSIONS.has(extname(file))
  const raw = text.split('\n')
  const plain = blankRanges(text, dependencyKeys).split('\n')
  // YAML comments start with `#` only, so the script masking would cut a line at the `//` of a URL.
  const active = isYaml ? plain : blankRanges(comments, dependencyKeys).split('\n')
  const context = {
    isPackageJson: basename(file) === 'package.json',
    isYaml,
    hasStringEntries: STRING_ENTRY_FILES.has(basename(file)),
    coreClassesLeft,
  }
  const entries = plain.map((line, index) => classify(line, active[index] ?? '', context, importOf(active, index)))

  entries.forEach((entry, index) => {
    if (!entry) return
    if (entry.type === 'todo') Object.assign(entry, resolveTodo(plain, entries, index))
    found.push({ file, line: index + 1, snippet: toSnippet(raw[index]), ...entry })
  })
}

function blankRanges(text, ranges) {
  let result = text
  for (const [start, end] of ranges) result = result.slice(0, start) + ' '.repeat(end - start) + result.slice(end)
  return result
}

// A multi-line import or export names its specifiers above the `from` line that names the package.
function importOf(lines, index) {
  if (!/^\s*\}\s*from\s/.test(lines[index])) return lines[index]
  let start = Math.max(index - 1, 0)
  while (start > 0 && !lines[start].includes('{')) start--
  return lines.slice(start, index + 1).join('\n')
}

function classify(line, activeLine, { isPackageJson, isYaml, hasStringEntries, coreClassesLeft }, statementText) {
  const statement = activeLine.trim()
  if (TODO_RE.test(line) && statement === '') return { type: 'todo' }
  if (!LEGACY_RE.test(line)) return null
  if (!LEGACY_RE.test(activeLine) || (isYaml && statement.startsWith('#'))) return { type: 'commented' }

  const packages = [...new Set(activeLine.match(PACKAGE_RE))]
  const keep = reason => ({ type: 'keep', reason, packages })
  if (isPackageJson && DEPENDENCY_LINE_RE.test(activeLine)) return keep('manual')
  if (STATEMENT_RES.some(re => re.test(statement)) || (hasStringEntries && STRING_ENTRY_RE.test(statement))) {
    return coreClassesLeft && CORE_RE.test(activeLine)
      ? keep('css-utils')
      : { type: 'remove', kind: 'import', packages }
  }
  if (REMOVE_RE.test(activeLine)) return keep('manual')
  if (ASSETS_RES.some(re => re.test(activeLine))) return keep('assets')
  if (UTILITIES_RE.test(activeLine)) return keep('css-utils')
  if (LEGACY_CONFIG_RE.test(statementText)) return keep('legacy-config')
  return keep('manual')
}

// The Init TODO covers the contiguous block of legacy lines below it; a commented-out line in that block is no legacy import.
function resolveTodo(raw, entries, index) {
  let next = index + 1
  let blocked = false
  while (next < raw.length && LEGACY_RE.test(raw[next])) {
    const below = entries[next]
    if (below && below.type !== 'commented' && below.type !== 'remove') blocked = true
    next++
  }
  return blocked
    ? { type: 'keep', reason: 'legacy-below', packages: [] }
    : { type: 'remove', kind: 'todo', packages: [] }
}

function parseJson(text) {
  try {
    const value = JSON.parse(text)
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

// Returns the [start, end) offsets of every quoted key directly inside a top-level dependency field, such as `dependencies`.
function findDependencyKeys(text) {
  const ranges = []
  const stack = []
  let pendingKey = null
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"') {
      let end = i + 1
      while (end < text.length && text[end] !== '"') end += text[end] === '\\' ? 2 : 1
      const value = text.slice(i + 1, end)
      let after = end + 1
      while (/\s/.test(text[after] ?? '')) after++
      if (text[after] === ':') {
        pendingKey = value
        const parent = stack.at(-1)
        if (stack.length === 2 && parent.type === 'object' && DEPENDENCY_FIELDS.includes(parent.key)) {
          ranges.push([i, end + 1])
        }
      }
      i = after
      continue
    }
    if (ch === '{' || ch === '[') {
      stack.push({ type: ch === '{' ? 'object' : 'array', key: pendingKey })
      pendingKey = null
    } else if (ch === '}' || ch === ']') {
      stack.pop()
    } else if (ch === ',') {
      pendingKey = null
    }
    i++
  }
  return ranges
}

function legacyKeys(manifest) {
  return [...new Set(dependencyNames(manifest).filter(name => LEGACY_KEY_RE.test(name)))].sort()
}

function planDependencies(manifests, keptLines) {
  const declared = manifests
    .filter(({ manifest }) => legacyKeys(manifest).length > 0)
    .sort((a, b) => a.packageJsonPath.localeCompare(b.packageJsonPath))
    .map(({ packageJsonPath, manifest }) => ({
      packageJsonPath,
      manifest,
      dir: posix.dirname(packageJsonPath),
      names: legacyKeys(manifest),
      migratable: new Set(baloiseDependencies(manifest)),
    }))

  const usage = new Map()
  for (const entry of keptLines) {
    for (const name of entry.packages) {
      const declaring = declared.filter(owner => owner.names.includes(name))
      const scoped = declaring.filter(owner => owner.dir === '.' || entry.file.startsWith(`${owner.dir}/`))
      // A workspace library may import a package that only the app manifest declares.
      for (const owner of scoped.length > 0 ? scoped : declaring) {
        const key = `${owner.packageJsonPath}\0${name}`
        usage.set(key, [...(usage.get(key) ?? []), `${entry.file}:${entry.line}`])
      }
    }
  }

  const remove = []
  const keep = []
  for (const { packageJsonPath, manifest, names, migratable } of declared) {
    for (const name of names) {
      const usedBy = usage.get(`${packageJsonPath}\0${name}`) ?? []
      for (const field of DEPENDENCY_FIELDS) {
        const block = manifest[field]
        if (!block || typeof block !== 'object' || !Object.hasOwn(block, name)) continue
        if (!migratable.has(name)) keep.push({ packageJsonPath, field, name, reason: 'manual', usedBy })
        else if (usedBy.length > 0) keep.push({ packageJsonPath, field, name, reason: 'used', usedBy })
        else remove.push({ packageJsonPath, field, name })
      }
    }
  }
  return { remove, keep }
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
  const root = process.argv[2] ? resolve(process.argv[2]) : process.cwd()
  try {
    process.exit(run(root, process.stdout))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  }
}
