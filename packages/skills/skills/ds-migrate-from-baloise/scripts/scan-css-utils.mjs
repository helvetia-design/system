#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { endOfString, lineText, scanSelectedFiles, toSnippet } from './source-scan.mjs'

const EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.html',
  '.css',
  '.scss',
  '.sass',
  '.less',
])
const MARKUP_EXTENSIONS = new Set(['.html', '.vue'])
const STYLE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less'])
const JSX_EXTENSIONS = new Set(['.tsx', '.jsx', '.js'])
const GROUP_STRENGTH = ['variant', 'structure', 'renamed', 'approximated', 'lost']
const CLASS_TOKEN_RE = /^[a-z0-9][\w:./-]*$/
const SELECTOR_RE = /(?:(?<![\w-])|(?<=\bclass))\.(-?[A-Za-z_](?:\\+.|[\w-])*)/g
const MAP_PATH = fileURLToPath(new URL('../shared/css-utils-map.json', import.meta.url))

/** Builds the lookup tables the scanner and the map spec share. */
export function loadMap(map = JSON.parse(readFileSync(MAP_PATH, 'utf8'))) {
  const pairs = groups =>
    new Set(groups.flatMap(({ variants, bases }) => variants.flatMap(v => bases.map(b => `${v}|${b}`))))
  const lookup = record => new Map(Object.entries(record))
  return {
    variantRenamed: lookup(map.variants.renamed),
    variantLost: new Set(map.variants.lost),
    variantNames: new Set([...map.variants.unchanged, ...Object.keys(map.variants.renamed), ...map.variants.lost]),
    identical: pairs(map.variants.identical),
    unsupported: pairs(map.variants.unsupported),
    bases: [lookup(map.structure), lookup(map.renamed), lookup(map.approximated)],
    structureLost: lookup(map.structureLost),
    lost: new Set(map.lost),
  }
}

function splitVariants(token, index) {
  const chain = []
  let base = token
  for (;;) {
    const colon = base.indexOf(':')
    if (colon <= 0 || !index.variantNames.has(base.slice(0, colon))) break
    chain.push(base.slice(0, colon))
    base = base.slice(colon + 1)
  }
  return { chain, base }
}

function stronger(a, b) {
  return GROUP_STRENGTH.indexOf(a) >= GROUP_STRENGTH.indexOf(b) ? a : b
}

/** Maps one class token; returns `null` when the token stays as it is. */
export function mapToken(token, index) {
  const { chain, base } = splitVariants(token, index)
  const key = `${chain.join(':')}|${base}`
  if (chain.length > 0 && index.identical.has(key)) return null
  if (chain.some(v => index.variantLost.has(v)) || index.lost.has(base) || index.unsupported.has(key)) {
    return { from: token, to: null, group: 'lost' }
  }

  let group = ''
  const prefixes = chain.map(v => {
    if (!index.variantRenamed.has(v)) return v
    group = 'variant'
    return index.variantRenamed.get(v)
  })
  let to = base
  ;['structure', 'renamed', 'approximated'].forEach((name, position) => {
    const mapped = index.bases[position].get(base)
    if (mapped === undefined) return
    to = mapped
    group = group ? stronger(group, name) : name
  })
  if (!group) return null
  return { from: token, to: [...prefixes, to].join(':'), group }
}

/** Maps every token of one class context; a structure class next to a modifier its counterpart lacks is lost as a pair. */
export function mapClassTokens(tokens, index) {
  const names = new Set(tokens.map(token => token.value))
  const pinned = new Set()
  const pairs = new Map()
  for (const [structure, modifiers] of index.structureLost) {
    if (!names.has(structure)) continue
    const lost = modifiers.filter(modifier => names.has(modifier))
    if (lost.length === 0) continue
    pinned.add(structure)
    for (const modifier of lost) pinned.add(modifier)
    pairs.set(
      structure,
      lost.map(modifier => `${structure} ${modifier}`),
    )
  }

  const moves = []
  for (const token of tokens) {
    if (!pinned.has(token.value)) {
      const move = mapToken(token.value, index)
      if (move) moves.push({ offset: token.offset, ...move })
      continue
    }
    for (const from of pairs.get(token.value) ?? []) moves.push({ offset: token.offset, from, to: null, group: 'lost' })
    pairs.delete(token.value)
  }
  return moves
}

function tokensOf(value, offset) {
  return [...value.matchAll(/\S+/g)].map(match => ({ value: match[0], offset: offset + match.index }))
}

export function scanCssUtils(rootDir, files = []) {
  const index = loadMap()
  const found = []
  const dynamic = []
  const unmatched = scanSelectedFiles(rootDir, files, source => collect(source, index, found, dynamic), EXTENSIONS)
  const result = { ...group(found), dynamic: sortDynamic(dynamic) }
  return unmatched.length > 0 ? { ...result, unmatched } : result
}

export function run(rootDir, stdout, files = []) {
  stdout.write(`${JSON.stringify(scanCssUtils(rootDir, files), null, 2)}\n`)
  return 0
}

function group(found) {
  const byFile = new Map()
  for (const finding of found) {
    const lines = byFile.get(finding.file) ?? new Map()
    const entry = lines.get(finding.line) ?? { line: finding.line, snippet: finding.snippet, moves: [] }
    entry.moves.push(finding)
    lines.set(finding.line, entry)
    byFile.set(finding.file, lines)
  }
  const files = [...byFile.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([file, lines]) => ({
      file,
      findings: [...lines.values()]
        .sort((a, b) => a.line - b.line)
        .map(({ line, snippet, moves }) => ({
          line,
          snippet,
          classes: moves.sort((a, b) => a.offset - b.offset).map(({ from, to, group }) => ({ from, to, group })),
        })),
    }))
  return { total: files.reduce((sum, file) => sum + file.findings.length, 0), files }
}

function sortDynamic(dynamic) {
  const seen = new Set()
  return dynamic
    .filter(entry => {
      const key = `${entry.file}:${entry.line}:${entry.reason}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
}

function collect({ file, text, comments }, index, found, dynamic) {
  const extension = extname(file)
  const lineOf = lineIndex(text)
  const report = (offset, reason) =>
    dynamic.push({ file, line: lineOf(offset), snippet: toSnippet(lineText(text, offset)), reason })
  const inComment = offset => comments[offset] !== text[offset]

  if (STYLE_EXTENSIONS.has(extension)) {
    checkStylesheet(comments, 0, index, report)
    return
  }
  if (MARKUP_EXTENSIONS.has(extension)) {
    for (const block of blocks(text, 'style')) {
      checkStylesheet(comments.slice(block.offset, block.end), block.offset, index, report)
    }
  }

  const covered = []
  for (const context of findContexts(text)) {
    if (inComment(context.start)) {
      if (JSX_EXTENSIONS.has(extension) && lineCommentAt(text, comments, context.start)) {
        covered.push([context.start, context.end])
        report(context.start, 'possibly commented')
      }
      continue
    }
    covered.push([context.start, context.end])
    const tokens = context.strings.flatMap(({ value, offset }) => tokensOf(value, offset))
    for (const move of mapClassTokens(tokens, index)) {
      found.push({ file, line: lineOf(move.offset), snippet: toSnippet(lineText(text, move.offset)), ...move })
    }
    for (const reason of context.reasons) report(context.start, reason)
  }

  const literals = [...codeLiterals(text, comments, extension), ...boundAttributeLiterals(text)]
  for (const literal of literals) {
    if (inComment(literal.start) || covered.some(([start, end]) => literal.start < end && literal.end > start)) continue
    const reason = literalReason(literal, index)
    if (reason) report(literal.start, reason)
  }
}

// JSX text such as `https://x.ch` reads as a `//` comment, so a class context behind one is reported, not dropped.
function lineCommentAt(text, comments, offset) {
  let start = text.lastIndexOf('\n', offset - 1) + 1
  while (start < offset && comments[start] === text[start]) start++
  return text.startsWith('//', start)
}

function literalReason({ value, quote }, index) {
  const mapped = token => CLASS_TOKEN_RE.test(token) && mapToken(token, index) !== null
  if (quote === '`' && value.includes('${')) {
    const parts = interpolated(0, 0, value, 0, '${').strings
    if (parts.some(part => tokensOf(part.value, 0).some(token => mapped(token.value)))) return 'template substitution'
  } else {
    const tokens = tokensOf(value, 0).map(token => token.value)
    if (tokens.length > 0 && tokens.every(token => CLASS_TOKEN_RE.test(token)) && tokens.some(mapped)) {
      return 'string literal outside a class context'
    }
  }
  return selectorNames(value).some(name => mapToken(name, index)) ? 'selector' : undefined
}

function selectorNames(value) {
  return [...value.matchAll(SELECTOR_RE)].map(match => match[1].replace(/\\+/g, ''))
}

function checkStylesheet(source, offset, index, report) {
  for (const match of source.matchAll(SELECTOR_RE)) {
    if (mapToken(match[1].replace(/\\+/g, ''), index)) report(offset + match.index, 'selector in a stylesheet')
  }
}

function blocks(text, tag) {
  return [...text.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))].map(match => {
    const offset = match.index + match[0].indexOf('>') + 1
    return { offset, end: offset + match[1].length }
  })
}

function lineIndex(text) {
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1)
  return offset => {
    let low = 0
    let high = starts.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (starts[mid] <= offset) low = mid
      else high = mid - 1
    }
    return low + 1
  }
}

function findContexts(text) {
  const contexts = []
  const quoted = (re, build) => {
    for (const match of text.matchAll(re)) {
      const quote = match[match.length - 1]
      const open = match.index + match[0].length
      const close = text.indexOf(quote, open)
      if (close !== -1) contexts.push(build(match.index, open, close))
    }
  }

  quoted(/(?<![\w$.:@[-])class\s*=\s*(["'])/g, (start, open, close) =>
    interpolated(start, close + 1, text.slice(open, close), open),
  )

  for (const match of text.matchAll(/(?<![\w$.:@[-])class\s*=\s*([^\s"'`={}<>]+)/g)) {
    const offset = match.index + match[0].length - match[1].length
    contexts.push(plain(match.index, offset + match[1].length, match[1], offset))
  }

  for (const match of text.matchAll(/\bclassName\s*=\s*(["'{])/g)) {
    const open = match.index + match[0].length
    if (match[1] !== '{') {
      const close = text.indexOf(match[1], open)
      if (close !== -1) contexts.push(plain(match.index, close + 1, text.slice(open, close), open))
      continue
    }
    const close = closingBrace(text, open - 1)
    const context = jsxExpressionContext(text, match.index, open, close)
    if (context) contexts.push(context)
  }

  quoted(/\[(?:class|ngClass)\]\s*=\s*(["'])/g, (start, open, close) => bindingContext(text, start, open, close))
  quoted(/(?<![\w-])(?:v-bind)?:class\s*=\s*(["'])/g, (start, open, close) => bindingContext(text, start, open, close))

  for (const match of text.matchAll(/\[class\.([^\]\s]+)\]|@HostBinding\(\s*(["'])class\.([^"']+)\2/g)) {
    const name = match[1] ?? match[3]
    const offset = match.index + match[0].lastIndexOf(name)
    contexts.push(plain(match.index, match.index + match[0].length, name, offset))
  }

  for (const match of text.matchAll(/\bclassList\s*\.\s*(?:add|remove|toggle|contains)\s*\(/g)) {
    const open = match.index + match[0].length
    const close = closingParen(text, open - 1)
    const context = { start: match.index, end: close + 1, strings: [], reasons: [] }
    for (const literal of literalsIn(text.slice(open, close), open)) {
      if (literal.substitution) context.reasons.push('template substitution')
      context.strings.push(...literal.parts)
    }
    contexts.push(context)
  }

  for (const match of text.matchAll(/\bhost\s*:\s*\{/g)) {
    const open = match.index + match[0].length - 1
    const close = closingBrace(text, open)
    const body = text.slice(open, close)
    for (const entry of body.matchAll(/(?:^|[{,\s])(?:class|'class'|"class")\s*:\s*(["'`])/g)) {
      const start = open + entry.index + entry[0].length
      const end = text.indexOf(entry[1], start)
      if (end === -1 || end > close) continue
      contexts.push(interpolated(open + entry.index, end + 1, text.slice(start, end), start, '${'))
    }
  }

  return contexts
}

function plain(start, end, value, offset) {
  return { start, end, strings: [{ value, offset }], reasons: [] }
}

function interpolated(start, end, value, offset, marker) {
  const open = marker ?? (value.includes('{{') ? '{{' : '${')
  const closeMarker = open === '{{' ? '}}' : '}'
  if (!value.includes(open)) return plain(start, end, value, offset)
  const strings = []
  let cursor = 0
  while (cursor < value.length) {
    const at = value.indexOf(open, cursor)
    const stop = at === -1 ? value.length : at
    strings.push(...staticPart(value, cursor, stop, offset))
    if (at === -1) break
    const after = value.indexOf(closeMarker, at + open.length)
    cursor = after === -1 ? value.length : after + closeMarker.length
  }
  const reason = open === '{{' ? 'interpolation' : 'template substitution'
  return { start, end, strings, reasons: [reason] }
}

// A token glued to a substitution, such as `mb-${size}`, is not a whole class, so it is dropped.
function staticPart(value, from, to, offset) {
  let start = from
  let end = to
  if (start > 0 && /\S/.test(value[start])) while (start < end && /\S/.test(value[start])) start++
  if (end < value.length && /\S/.test(value[end - 1])) while (end > start && /\S/.test(value[end - 1])) end--
  return start < end ? [{ value: value.slice(start, end), offset: offset + start }] : []
}

// Only a lone literal or a concatenation of literals is a class context; a call such as `cx(…)` is not.
function jsxExpressionContext(text, start, open, close) {
  const expression = text.slice(open, close)
  const literals = literalsIn(expression, open)
  const lone = literals.length === 1 && /^\s*["'`]/.test(expression) && /["'`]\s*$/.test(expression)
  if (!lone && !literals.some(literal => literal.concatenated)) return undefined
  const context = { start, end: close + 1, strings: [], reasons: [] }
  addLiterals(context, literals)
  return context
}

function addLiterals(context, literals) {
  for (const literal of literals) {
    if (literal.substitution) context.reasons.push('template substitution')
    if (literal.concatenated) context.reasons.push('string concatenation')
    context.strings.push(...literal.parts)
  }
}

// Reads an Angular `[ngClass]`/`[class]` or Vue `:class` value: a string, an array, or an object of class keys.
function bindingContext(text, start, open, close) {
  const context = { start, end: close + 1, strings: [], reasons: [] }
  readBinding(text.slice(open, close), open, context)
  return context
}

function readBinding(source, offset, context) {
  const lead = source.length - source.trimStart().length
  const body = source.trim()
  if (!body) return
  if (wrapped(body, '{', '}')) {
    for (const entry of splitTopLevel(body.slice(1, -1), offset + lead + 1)) readObjectEntry(entry, context)
    return
  }
  if (wrapped(body, '[', ']')) {
    for (const entry of splitTopLevel(body.slice(1, -1), offset + lead + 1))
      readBinding(entry.value, entry.offset, context)
    return
  }
  const literals = literalsIn(source, offset)
  if (literals.length === 0) context.reasons.push('non-literal class binding')
  addLiterals(context, literals)
}

function wrapped(body, left, right) {
  return body.startsWith(left) && closing(body, 0, left, right) === body.length - 1
}

function readObjectEntry({ value, offset }, context) {
  const entry = value.trim()
  const at = offset + value.length - value.trimStart().length
  if (!entry) return
  const quote = entry[0]
  if (quote === '"' || quote === "'" || quote === '`') {
    addLiterals(context, literalsIn(entry.slice(0, endOfString(entry, 0, true)), at))
    return
  }
  const key = /^[\w$-]+(?=\s*(?::|$))/.exec(entry)
  if (key) context.strings.push({ value: key[0], offset: at })
  else context.reasons.push('non-literal class binding')
}

function splitTopLevel(source, offset) {
  const parts = []
  let depth = 0
  let from = 0
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = endOfString(source, i, true)
      continue
    }
    if ('([{'.includes(ch)) depth++
    if (')]}'.includes(ch)) depth--
    if (ch === ',' && depth === 0) {
      parts.push({ value: source.slice(from, i), offset: offset + from })
      from = i + 1
    }
    i++
  }
  parts.push({ value: source.slice(from), offset: offset + from })
  return parts
}

function literalsIn(source, offset) {
  const literals = []
  for (const literal of stringLiterals(source)) {
    const value = source.slice(literal.start + 1, literal.end - 1)
    const before = source.slice(0, literal.start).trimEnd()
    const after = source.slice(literal.end).trimStart()
    const substitution = literal.quote === '`' && value.includes('${')
    literals.push({
      concatenated: before.endsWith('+') || after.startsWith('+'),
      substitution,
      parts: substitution
        ? interpolated(0, 0, value, offset + literal.start + 1, '${').strings
        : [{ value, offset: offset + literal.start + 1 }],
    })
  }
  return literals
}

function stringLiterals(source, from = 0, to = source.length) {
  const literals = []
  let i = from
  while (i < to) {
    const quote = source[i]
    if (quote !== '"' && quote !== "'" && quote !== '`') {
      i++
      continue
    }
    const end = endOfString(source, i, true)
    literals.push({ start: i, end, quote })
    i = end
  }
  return literals
}

function closingBrace(text, open) {
  return closing(text, open, '{', '}')
}

function closingParen(text, open) {
  return closing(text, open, '(', ')')
}

function closing(text, open, left, right) {
  let depth = 0
  let i = open
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = endOfString(text, i, true)
      continue
    }
    if (ch === left) depth++
    if (ch === right) {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return text.length
}

// Comments are already blanked in `comments`, so every quote left there opens a string literal.
function codeLiterals(text, comments, extension) {
  const regions = MARKUP_EXTENSIONS.has(extension) ? blocks(text, 'script') : [{ offset: 0, end: text.length }]
  return regions.flatMap(({ offset, end }) =>
    stringLiterals(comments, offset, end).map(literal => ({
      ...literal,
      value: text.slice(literal.start + 1, literal.end - 1),
    })),
  )
}

// Bound attributes hold expressions, so their literals get the same check as code literals.
function boundAttributeLiterals(text) {
  const literals = []
  for (const match of text.matchAll(/(?:(?<![\w-])(?:v-bind)?:[\w.-]+|\[[\w.@-]+\])\s*=\s*(["'])/g)) {
    const open = match.index + match[0].length
    const close = text.indexOf(match[1], open)
    if (close === -1) continue
    const source = text.slice(open, close)
    for (const literal of stringLiterals(source)) {
      literals.push({
        start: open + literal.start,
        end: open + literal.end,
        quote: literal.quote,
        value: source.slice(literal.start + 1, literal.end - 1),
      })
    }
  }
  return literals
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
