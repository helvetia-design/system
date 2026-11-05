#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { lineAt, lineText, scanSelectedFiles, toSnippet } from './source-scan.mjs'

const EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.html'])
const SPECIFIER_RE = /['"]@baloise\/ds-(?:brand-)?icons['"]/g
const SYMBOL_RE = /\bbal(?:Brand)?Icon[A-Z]\w*/g
const NAMESPACE_RE = /\bimport\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from\s*['"]@baloise\/ds-(?:brand-)?icons['"]/g
// The specifier is a string, which source-scan masks, so a real import is told apart from a
// commented one by the keyword that survives masking on the same line.
const IMPORT_KEYWORD_RE = /\b(?:from|import|require)\b/

export function scanIconImports(rootDir, files = []) {
  const found = []
  const unmatched = scanSelectedFiles(
    rootDir,
    files,
    ({ file, masked, text }) => collect(file, text, masked, found),
    EXTENSIONS,
  )
  const result = group(found)
  return unmatched.length > 0 ? { ...result, unmatched } : result
}

export function run(rootDir, stdout, files = []) {
  stdout.write(`${JSON.stringify(scanIconImports(rootDir, files), null, 2)}\n`)
  return 0
}

function group(found) {
  const byFile = new Map()
  for (const finding of found) {
    const list = byFile.get(finding.file) ?? []
    list.push(finding)
    byFile.set(finding.file, list)
  }

  const files = [...byFile.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([file, findings]) => ({
      file,
      findings: findings.sort((a, b) => a.line - b.line).map(({ line, snippet }) => ({ line, snippet })),
    }))

  return {
    total: files.reduce((sum, file) => sum + file.findings.length, 0),
    files,
  }
}

function collect(file, text, masked, found) {
  const lines = new Set()
  const namespaces = []
  const add = index => {
    const line = lineAt(text, index)
    if (lines.has(line)) return
    lines.add(line)
    found.push({ file, line, snippet: toSnippet(lineText(text, index)) })
  }

  SPECIFIER_RE.lastIndex = 0
  let match
  while ((match = SPECIFIER_RE.exec(text)) !== null) {
    if (IMPORT_KEYWORD_RE.test(lineText(masked, match.index))) add(match.index)
  }

  NAMESPACE_RE.lastIndex = 0
  while ((match = NAMESPACE_RE.exec(text)) !== null) {
    if (masked.startsWith('import', match.index)) namespaces.push(match[1])
  }

  const visible = index => masked[index] !== ' ' || inTemplateSubstitution(text, index)

  SYMBOL_RE.lastIndex = 0
  while ((match = SYMBOL_RE.exec(text)) !== null) if (visible(match.index)) add(match.index)

  for (const name of namespaces) {
    const usage = new RegExp(`(?<![\\w$])(?<![^.]\\.)${escapeRegExp(name)}(?![\\w$])`, 'g')
    while ((match = usage.exec(text)) !== null) if (visible(match.index)) add(match.index)
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// source-scan blanks whole template literals, so `${…}` substitutions are found by walking back to an
// unclosed `${` before the enclosing backtick.
function inTemplateSubstitution(text, index) {
  let depth = 0
  for (let i = index - 1; i >= 0; i--) {
    const ch = text[i]
    if (ch === '`' && depth === 0) return false
    if (ch === '}') depth++
    if (ch === '{') {
      if (depth === 0) return text[i - 1] === '$'
      depth--
    }
  }
  return false
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
    process.exit(run(root, process.stdout, process.argv.slice(3)))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  }
}
