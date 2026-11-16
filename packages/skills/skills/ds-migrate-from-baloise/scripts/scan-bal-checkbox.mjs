#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  lineAt,
  lineText,
  readTag,
  scanSourceFilesWithSetValue,
  toSnippet,
  unwrapElementTypes,
} from './source-scan.mjs'

const USAGE_RE =
  /<\/?bal-(?:checkbox(?:-group)?|check|switch)(?![\w-])|<\/?Bal(?:Checkbox(?:Group)?|Check|Switch)\b|\bBalEvents\.BalCheckbox[A-Z]\w*|\bBalCheckbox(?:Group)?CustomEvent\b|\bBal(?:Checkbox(?:Group)?|Check|Switch)\b|\bBalCheckboxBundle\b|\bnewBalCheckboxOption\b/g
const GROUP_OPEN_RE = /^<(bal-checkbox-group|BalCheckboxGroup)(?![\w-])/
const CHECKBOX_OPEN_RE = /^<(?:bal-checkbox|BalCheckbox)(?![\w-])/
const CHILD_CHECKBOX_RE = /<(?:bal-checkbox|BalCheckbox)(?![\w-])/g
const FORMS_BINDING_RE = /[\s[(](?:formControlName|formControl|ngModel)(?![\w-])/
const BOUND_VALUE_RE = /\[value\]\s*=|\svalue\s*=\s*\{/
const CONTROL_RE = /[\s[]control(?![\w-])/
const SWITCH_RE = /[\s[]\[?interface\]?\s*=\s*(?:["']\s*'?switch'?\s*["']|\{\s*["']switch["']\s*\})/

export function scanBalCheckbox(rootDir, paths = []) {
  const found = []
  const unmatched = scanSourceFilesWithSetValue(
    rootDir,
    ({ file, masked, text }) => collect(file, text, masked, found),
    {
      paths,
      elementType: 'HTMLBalCheckboxGroupElement',
      found,
    },
  )
  const result = group(found)
  return unmatched.length > 0 ? { ...result, unmatched } : result
}

export function run(rootDir, stdout, paths = []) {
  stdout.write(`${JSON.stringify(scanBalCheckbox(rootDir, paths), null, 2)}\n`)
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
      findings: findings.sort((a, b) => a.index - b.index).map(({ file: _file, index: _index, ...finding }) => finding),
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
    found.push({ file, index, line: lineAt(text, index), snippet: toSnippet(raw), ...flags(raw, text, masked, index) })
  }
}

function flags(tag, text, masked, index) {
  const groupTag = GROUP_OPEN_RE.exec(tag)
  if (groupTag) {
    const bound = FORMS_BINDING_RE.test(tag) || BOUND_VALUE_RE.test(tag)
    if (!bound) return {}
    const body = groupBody(groupTag[1], tag, text, masked, index)
    if (SWITCH_RE.test(tag) || hasSwitchChild(body)) return { switchGroup: true }
    return CONTROL_RE.test(tag) ? {} : { unboundControl: true }
  }
  return CHECKBOX_OPEN_RE.test(tag) && FORMS_BINDING_RE.test(tag) ? { formsBinding: true } : {}
}

function groupBody(name, tag, text, masked, index) {
  const start = index + tag.length
  if (tag.endsWith('/>')) return { text: '', masked: '' }
  const tagRe = new RegExp(`<(/?)${name}(?![\\w-])`, 'g')
  tagRe.lastIndex = start
  let depth = 1
  let match
  while ((match = tagRe.exec(masked)) !== null) {
    depth += match[1] ? -1 : 1
    if (depth === 0) return { text: text.slice(start, match.index), masked: masked.slice(start, match.index) }
  }
  return { text: text.slice(start), masked: masked.slice(start) }
}

function hasSwitchChild(body) {
  for (const match of body.masked.matchAll(CHILD_CHECKBOX_RE)) {
    if (SWITCH_RE.test(readTag(body.text, match.index))) return true
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
