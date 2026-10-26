#!/usr/bin/env node
/**
 * inventory.mjs — independent leftover check for a Baloise → Helvetia migration.
 *
 * Counts every Baloise reference in a consumer app: `bal-*` tags, `Bal*`/`bal*` symbols,
 * `onBal*` handler props, controllers and services, and `@baloise/*` specifiers. Run it against
 * the baseline before a migration and against the migrated copy after. Every occurrence must
 * end up either rewritten to a `ds-*` counterpart or named in the skill's own report; anything
 * else is a miss.
 *
 * Deliberately independent of the skill: it shares no code with `scan-migratable.mjs` or the
 * `scan-bal-*.mjs` family, because a checker that reuses the scanners it is checking would
 * grade the skill with the skill's own blind spots. It is also deliberately dumb — one flat
 * regex, no parsing — so that what it misses is obvious rather than subtle.
 *
 * Usage:
 *   node inventory.mjs <app-path> [--allow <allowlist.json>]   JSON to stdout
 *   node inventory.mjs <app-path> --text                       human summary
 *   node inventory.mjs --diff <before.json> <after.json>       what went, what stayed
 *
 * This directory is excluded from the published package by `files` in package.json, and must
 * stay outside any app project root: the skill's scanners read every source file below their
 * root, so a checker containing the string `bal-card` would be counted as a finding.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage'])
const SKIP_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'])
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.css', '.scss', '.sass', '.json'])

/**
 * Alternatives are ordered most specific first, because JavaScript's alternation is
 * leftmost-first at each position: `balToastController` must classify as a controller, not as
 * the generic event-name shape that also matches it.
 */
const HIT_RE = new RegExp(
  [
    String.raw`@baloise\/[a-z0-9.-]+`,
    String.raw`<\/?bal-[a-z][a-z0-9-]*`,
    String.raw`<\/?Bal[A-Z][A-Za-z0-9]*`,
    String.raw`\bonBal[A-Z][A-Za-z0-9]*\b`,
    String.raw`\b[Bb]al[A-Z][A-Za-z0-9]*(?:Controller|Service)\b`,
    String.raw`\bBal[A-Z][A-Za-z0-9]*\b`,
    String.raw`\bbal[A-Z][A-Za-z0-9]*\b`,
  ].join('|'),
  'g',
)

export function inventory(rootDir, allowlist = []) {
  const root = realpathSync(resolve(rootDir))
  if (!statSync(root).isDirectory()) throw new Error(`Inventory root is not a directory: ${root}`)

  const files = []
  walk(root, root, files)
  files.sort((a, b) => a.file.localeCompare(b.file))

  const byCategory = {}
  let total = 0
  let allowed = 0

  for (const entry of files) {
    for (const hit of entry.hits) {
      total++
      if (hit.allowed) allowed++
      else byCategory[hit.category] = (byCategory[hit.category] ?? 0) + 1
    }
  }

  return { root, total, allowed, leftover: total - allowed, byCategory, files }

  function walk(rootPath, dir, out) {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue
      const entryPath = canonicalChild(rootPath, join(dir, entry.name))
      if (!entryPath) continue
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(rootPath, entryPath, out)
        continue
      }
      if (!entry.isFile()) continue
      if (SKIP_FILES.has(entry.name) || !EXTENSIONS.has(extname(entry.name))) continue

      const rel = relative(rootPath, entryPath).split(sep).join('/')
      const hits = scanFile(entryPath, rel, allowlist)
      if (hits.length > 0) out.push({ file: rel, total: hits.length, hits })
    }
  }
}

function canonicalChild(rootDir, entryPath) {
  let candidate
  try {
    candidate = realpathSync(entryPath)
  } catch {
    return undefined
  }
  const child = relative(rootDir, candidate)
  return child && child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child) ? candidate : undefined
}

function scanFile(filePath, rel, allowlist) {
  let text
  try {
    text = readFileSync(filePath, 'utf8')
  } catch {
    return []
  }

  const hits = []
  const lines = text.split('\n')

  for (let index = 0; index < lines.length; index++) {
    const lineText = lines[index]
    HIT_RE.lastIndex = 0
    let match
    while ((match = HIT_RE.exec(lineText)) !== null) {
      const allow = allowlist.find(rule => matches(rule, rel, match[0]))
      hits.push({
        line: index + 1,
        column: match.index + 1,
        match: match[0],
        category: categorize(match[0]),
        inComment: inComment(lineText, match.index),
        snippet: lineText.replace(/\s+/g, ' ').trim().slice(0, 200),
        ...(allow ? { allowed: true, reason: allow.reason ?? '' } : {}),
      })
    }
  }

  return hits
}

function categorize(match) {
  if (match.startsWith('@baloise/')) return 'import'
  if (match.startsWith('<')) return 'tag'
  if (match.startsWith('onBal')) return 'handler'
  if (/(?:Controller|Service)$/.test(match)) return 'controller'
  if (/^Bal[A-Z]/.test(match)) return 'symbol'
  return 'event'
}

/**
 * Line-level heuristic only — enough to tell a stale prose mention from live code, not a
 * substitute for parsing. A hit flagged here still counts toward the total; it is the human's
 * call whether a comment matters.
 */
function inComment(lineText, column) {
  const trimmed = lineText.trimStart()
  if (/^(\/\/|\/\*|\*|<!--|#)/.test(trimmed)) return true
  return /(^|[^:])\/\//.test(lineText.slice(0, column))
}

function matches(rule, file, match) {
  if (rule.file && rule.file !== file) return false
  if (rule.match && rule.match !== match) return false
  return Boolean(rule.file || rule.match)
}

export function diff(before, after) {
  const key = hit => `${hit.match}`
  const index = report => {
    const map = new Map()
    for (const entry of report.files ?? []) {
      for (const hit of entry.hits) {
        const id = `${entry.file}::${key(hit)}`
        map.set(id, (map.get(id) ?? 0) + 1)
      }
    }
    return map
  }

  const b = index(before)
  const a = index(after)
  const remaining = []
  const introduced = []

  for (const [id, count] of a) {
    if (b.has(id)) remaining.push({ id, count })
    else introduced.push({ id, count })
  }

  return {
    before: before.total ?? 0,
    after: after.total ?? 0,
    removed: (before.total ?? 0) - (after.total ?? 0),
    remaining: remaining.sort((x, y) => x.id.localeCompare(y.id)),
    introduced: introduced.sort((x, y) => x.id.localeCompare(y.id)),
    remainingByCategory: after.byCategory ?? {},
  }
}

function toText(report) {
  const lines = []
  lines.push(`Baloise references under ${report.root}`)
  lines.push(`  total ${report.total}   leftover ${report.leftover}   allowlisted ${report.allowed}`)
  const categories = Object.entries(report.byCategory).sort((a, b) => b[1] - a[1])
  if (categories.length > 0) lines.push(`  by category: ${categories.map(([k, v]) => `${k} ${v}`).join(', ')}`)
  const commented = report.files.reduce((n, f) => n + f.hits.filter(h => h.inComment).length, 0)
  if (commented > 0) lines.push(`  ${commented} of them sit in a comment`)
  lines.push('')
  for (const entry of report.files) {
    lines.push(`${entry.file}  (${entry.total})`)
    for (const hit of entry.hits) {
      const flags = [hit.category, hit.inComment ? 'comment' : '', hit.allowed ? 'allowed' : ''].filter(Boolean)
      lines.push(`  ${String(hit.line).padStart(5)}  ${hit.match}  [${flags.join(', ')}]`)
    }
  }
  return lines.join('\n')
}

export function run(argv, stdout) {
  const args = argv.slice()

  if (args[0] === '--diff') {
    const [, beforePath, afterPath] = args
    if (!beforePath || !afterPath) {
      stdout.write('usage: inventory.mjs --diff <before.json> <after.json>\n')
      return 1
    }
    const before = JSON.parse(readFileSync(resolve(beforePath), 'utf8'))
    const after = JSON.parse(readFileSync(resolve(afterPath), 'utf8'))
    stdout.write(`${JSON.stringify(diff(before, after), null, 2)}\n`)
    return 0
  }

  const text = args.includes('--text')
  const allowAt = args.indexOf('--allow')
  const allowPath = allowAt === -1 ? undefined : args[allowAt + 1]
  const allowlist = allowPath ? JSON.parse(readFileSync(resolve(allowPath), 'utf8')) : []
  const rootDir = args.find(arg => !arg.startsWith('--') && arg !== allowPath)

  if (!rootDir) {
    stdout.write('usage: inventory.mjs <app-path> [--text] [--allow <allowlist.json>]\n')
    return 1
  }

  const report = inventory(rootDir, allowlist)
  stdout.write(`${text ? toText(report) : JSON.stringify(report, null, 2)}\n`)
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Set exitCode rather than calling process.exit(): a full inventory is megabytes of JSON, and
  // exiting outright truncates stdout before the pipe has drained.
  process.exitCode = run(process.argv.slice(2), process.stdout)
}
