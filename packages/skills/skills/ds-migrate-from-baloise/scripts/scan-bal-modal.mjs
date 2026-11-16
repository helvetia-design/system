#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { lineAt, lineText, readTag, scanSourceFiles, toSnippet, unwrapElementTypes } from './source-scan.mjs'

const USAGE_RE =
  /<\/?bal-modal(?:-header|-body)?(?![\w-])|<\/?BalModal(?:Header|Body)?\b|\b(?:balModalController|BalModalController|BalModalService|BalModalOptions|BalModalBundle|BalModalHeader|BalModalBody|BalModal|HTMLBalModal(?:Header|Body)?Element)\b/g

const REF_CALL_RE =
  /(?<![\w$])[\w$]*[mM]odal[\w$]*(?:\(\))?(?:(?:\?\.|!\.|\.)(?:current|nativeElement))*(?:\?\.|!\.|\.)(?:open|close)\s*\(/g
const COMPONENT_PROPS_RE = /\bcomponentProps\s*:\s*\{/g
const CREATE_RESULT_RE =
  /(?<![\w$.])(?:(?:const|let|var)\s+|this\.)([\w$]+)\s*(?::[^=;\n]+?)?\s*=\s*await[ \t]+(?:[\w$]+(?:\?\.|\.))*[\w$]*[mM]odal[\w$]*(?:\?\.|\.)create\s*\(/g

export function scanBalModal(rootDir, paths = []) {
  const found = []
  const unmatched = scanSourceFiles(rootDir, ({ file, masked, text }) => collect(file, text, masked, found), { paths })
  const result = group(found)
  return unmatched.length > 0 ? { ...result, unmatched } : result
}

export function run(rootDir, stdout, paths = []) {
  stdout.write(`${JSON.stringify(scanBalModal(rootDir, paths), null, 2)}\n`)
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
      findings: findings.sort((a, b) => a.index - b.index).map(({ line, snippet }) => ({ line, snippet })),
    }))

  return {
    total: files.reduce((sum, file) => sum + file.findings.length, 0),
    files,
  }
}

function collect(file, text, masked, found) {
  USAGE_RE.lastIndex = 0
  const usage = unwrapElementTypes(masked)
  let match
  while ((match = USAGE_RE.exec(usage)) !== null) {
    const index = match.index
    const raw = match[0].startsWith('<') ? readTag(text, index) : lineText(text, index)
    found.push({ file, index, line: lineAt(text, index), snippet: toSnippet(raw) })
  }
  if (found.some(finding => finding.file === file)) collectImperative(file, text, masked, found)
}

function collectImperative(file, text, masked, found) {
  const seen = new Set(found.filter(finding => finding.file === file).map(finding => finding.line))
  const add = index => {
    const line = lineAt(text, index)
    if (seen.has(line)) return
    seen.add(line)
    found.push({ file, index, line, snippet: toSnippet(lineText(text, index)) })
  }

  REF_CALL_RE.lastIndex = 0
  let match
  while ((match = REF_CALL_RE.exec(masked)) !== null) add(match.index)

  COMPONENT_PROPS_RE.lastIndex = 0
  while ((match = COMPONENT_PROPS_RE.exec(masked)) !== null) add(match.index)

  CREATE_RESULT_RE.lastIndex = 0
  while ((match = CREATE_RESULT_RE.exec(masked)) !== null) {
    const name = match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const presentRe = new RegExp(`(?<![\\w$.])(?:this\\.)?${name}\\s*\\??\\.present\\s*\\(`, 'g')
    let call
    while ((call = presentRe.exec(masked)) !== null) add(call.index)
  }
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
