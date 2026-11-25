#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  closingIndex,
  endOfString,
  endOfSubstitution,
  JSX_EXTENSIONS,
  lineIndex,
  lineText,
  MARKUP_EXTENSIONS,
  readTag,
  scanSourceFiles,
  SOURCE_EXTENSIONS,
  STYLE_EXTENSIONS,
  toSnippet,
} from './source-scan.mjs'

const EXTENSIONS = new Set([...SOURCE_EXTENSIONS, ...STYLE_EXTENSIONS])
const CLASS_ATTRIBUTES = new Set(['ngClass', 'active-class', 'exact-active-class'])
const GROUP_STRENGTH = ['variant', 'structure', 'core', 'renamed', 'approximated', 'core-lost', 'lost']
export const CORE_GROUPS = new Set(['core', 'core-lost'])
const CLASS_TOKEN_RE = /^[a-z0-9][\w:./-]*$/
const SELECTOR_TAGS =
  'a|article|aside|body|button|div|footer|form|h[1-6]|header|img|input|label|li|main|nav|ol|p|section|span|table|td|th|tr|ul'
// Code strings also hold dotted keys such as `nav.grid.title`, so a tag prefix only counts at the end of a compound.
const SELECTOR_RE = new RegExp(
  `(?:(?<![\\w-])|(?<=\\bclass)|(?<=(?:^|[\\s>+~,(])(?:${SELECTOR_TAGS})(?:\\.[\\w-]+)*)(?=\\.[\\w-]+(?:$|[\\s>+~,)[:]))|(?<=(?:^|[\\s>+~,(])(?:\\.-?[A-Za-z_][\\w-]*)+))\\.(-?[A-Za-z_](?:\\\\+.|[\\w-])*)`,
  'g',
)
const STYLESHEET_SELECTOR_RE = /(?<!\d)\.(-?[A-Za-z_](?:\\+.|[\w-])*)/g
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
    structureLost: new Map([
      ...Object.entries(map.structureLost).map(([structure, modifiers]) => [structure, { modifiers, group: 'lost' }]),
      ...Object.entries(map.core.structureLost).map(([structure, modifiers]) => [
        structure,
        { modifiers, group: 'core-lost' },
      ]),
    ]),
    lost: new Set(map.lost),
    core: lookup(map.core.structure),
    coreLost: new Set(map.core.lost),
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
  // Baloise ships no variant of a `core.css` class, so only a bare token is one.
  if (chain.length === 0 && index.core.has(base)) return { from: token, to: index.core.get(base), group: 'core' }
  if (chain.length === 0 && index.coreLost.has(base)) return { from: token, to: null, group: 'core-lost' }
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

/**
 * Maps every token of one class context; a structure class next to a modifier its counterpart lacks is lost as a pair.
 * `siblings` are the class names of the other class contexts on the same element.
 */
export function mapClassTokens(tokens, index, siblings = []) {
  const names = new Set([...tokens.map(token => token.value), ...siblings])
  const pinned = new Set()
  const pairs = new Map()
  for (const [structure, { modifiers, group }] of index.structureLost) {
    if (!names.has(structure)) continue
    const lost = modifiers.filter(modifier => names.has(modifier))
    if (lost.length === 0) continue
    pinned.add(structure)
    for (const modifier of lost) pinned.add(modifier)
    pairs.set(structure, { group, from: lost.map(modifier => `${structure} ${modifier}`) })
  }

  const moves = []
  for (const token of tokens) {
    if (!pinned.has(token.value)) {
      const move = mapToken(token.value, index)
      if (move) moves.push({ offset: token.offset, ...move })
      continue
    }
    const pair = pairs.get(token.value)
    for (const from of pair?.from ?? []) moves.push({ offset: token.offset, from, to: null, group: pair.group })
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
  const unmatched = scanSourceFiles(rootDir, source => collect(source, index, found, dynamic), {
    extensions: EXTENSIONS,
    paths: files,
  })
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

// A merged place without `group` still blocks the utilities line, so it drops `core` from the kept entry.
function sortDynamic(dynamic) {
  const seen = new Map()
  for (const entry of dynamic) {
    const key = `${entry.file}:${entry.line}:${entry.reason}`
    const first = seen.get(key)
    if (!first) {
      seen.set(key, { ...entry })
      continue
    }
    const core = Boolean(first.group || first.core || entry.group || entry.core)
    if (!entry.group) delete first.group
    if (!first.group && core) first.core = true
    if (entry.classes) first.classes = [...(first.classes ?? []), ...entry.classes]
  }
  return [...seen.values()].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
}

function coreOnly(moves) {
  return moves.every(move => CORE_GROUPS.has(move.group))
}

function hasCore(moves) {
  return moves.some(move => CORE_GROUPS.has(move.group))
}

// A place that mixes `css/core` and other classes keeps both legacy lines, so it gets `core` instead of the `core` group.
function coreMark(moves) {
  if (moves.length > 0 && coreOnly(moves)) return { group: 'core' }
  return hasCore(moves) ? { core: true } : {}
}

function mappedMoves(names, index) {
  return names.map(name => mapToken(name, index)).filter(Boolean)
}

function collect({ file, text, comments }, index, found, dynamic) {
  const extension = extname(file)
  const lineOf = lineIndex(text)
  const snippets = new Map()
  const snippetAt = offset => {
    const line = lineOf(offset)
    if (!snippets.has(line)) snippets.set(line, toSnippet(lineText(text, offset)))
    return snippets.get(line)
  }
  const report = (offset, reason, moves = [], extra = {}) =>
    dynamic.push({
      file,
      line: lineOf(offset),
      snippet: snippetAt(offset),
      reason,
      ...coreMark(moves),
      ...extra,
    })
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
  const active = []
  for (const context of findContexts(text)) {
    // Object keys inside a call such as `cx({ grid: x })` cannot be rewritten in place, and the call's strings stay uncovered.
    if (context.keys) {
      const keyMoves = mappedMoves(context.keys, index)
      if (!inComment(context.start) && keyMoves.length > 0) {
        const classes = keyMoves.map(({ from, to, group }) => ({ from, to, group }))
        report(context.start, 'non-literal class binding', keyMoves, { classes })
      }
      continue
    }
    if (inComment(context.start)) {
      // JSX detection is a heuristic, so JSX text it misses can read as a comment; report the context, do not drop it.
      if (JSX_EXTENSIONS.has(extension)) {
        covered.push([context.start, context.end])
        report(context.start, 'possibly commented')
      }
      continue
    }
    covered.push([context.start, context.end])
    const tokens = context.strings.flatMap(({ value, offset }) => tokensOf(value, offset))
    active.push({ context, tokens, element: context.element ? elementStart(text, context.start) : -1 })
  }

  for (const { context, tokens, element } of active) {
    const siblings =
      element === -1
        ? []
        : active
            .filter(other => other.element === element && other.context !== context)
            .flatMap(other => other.tokens.map(token => token.value))
    for (const move of mapClassTokens(tokens, index, siblings)) {
      found.push({ file, line: lineOf(move.offset), snippet: snippetAt(move.offset), ...move })
    }
    const inner = hasCore(mappedMoves(context.inner ?? [], index)) ? { core: true } : {}
    for (const reason of context.reasons) report(context.start, reason, [], inner)
  }

  const literals = [...codeLiterals(text, comments, extension), ...boundAttributeLiterals(text)]
  for (const literal of literals) {
    if (inComment(literal.start) || covered.some(([start, end]) => literal.start < end && literal.end > start)) continue
    const found = literalReason(literal, index)
    if (found) report(literal.start, found.reason, found.moves)
  }

  for (const input of classInputs(text)) {
    const inputMoves = mappedMoves(
      tokensOf(input.value, 0).map(token => token.value),
      index,
    )
    if (inComment(input.start) || inputMoves.length === 0) continue
    report(input.start, 'class input', inputMoves)
  }
}

// A component input such as `styleClass` or `body-class` holds classes the component places itself, so it is only reported.
function classInputs(text) {
  const inputs = []
  for (const match of text.matchAll(/(?<![\w$.:@[-])([A-Za-z][\w-]*(?:Class|-class))\s*=\s*(\\?["'])/g)) {
    if (CLASS_ATTRIBUTES.has(match[1]) || elementStart(text, match.index) === -1) continue
    const open = match.index + match[0].length
    const close = text.indexOf(match[2], open)
    if (close !== -1) inputs.push({ start: match.index, value: text.slice(open, close) })
  }
  return inputs
}

// A `<` that opens no tag, such as in `v-if="a < b"`, is skipped; the first real tag decides.
function elementStart(text, offset) {
  let start = text.lastIndexOf('<', offset)
  while (start !== -1 && !/[A-Za-z]/.test(text[start + 1] ?? '')) start = text.lastIndexOf('<', start - 1)
  if (start === -1) return -1
  return start + readTag(text, start).length > offset ? start : -1
}

// `core.css` names such as `'button'` and `'link'` are common code values.
function literalReason({ value, quote }, index) {
  const mapped = tokens =>
    mappedMoves(
      tokens.filter(token => CLASS_TOKEN_RE.test(token)),
      index,
    )
  if (quote === '`' && value.includes('${')) {
    const parts = staticParts(value, 0, '${')
    const moves = mapped(parts.flatMap(part => tokensOf(part.value, 0).map(token => token.value)))
    if (moves.length > 0 && !coreOnly(moves)) return { reason: 'template substitution', moves }
  } else {
    const tokens = tokensOf(value, 0).map(token => token.value)
    const moves = mapped(tokens)
    if (
      tokens.length > 0 &&
      tokens.every(token => CLASS_TOKEN_RE.test(token)) &&
      moves.length > 0 &&
      !coreOnly(moves)
    ) {
      return { reason: 'string literal outside a class context', moves }
    }
  }
  const selectorText = quote === '`' ? withoutSubstitutions(value) : value
  const moves = selectorNames(selectorText)
    .map(({ name, tagged }) => ({ move: mapToken(name, index), tagged }))
    .filter(({ move, tagged }) => move && !(tagged && CORE_GROUPS.has(move.group)))
    .map(({ move }) => move)
  return moves.length > 0 ? { reason: 'selector', moves } : undefined
}

function withoutSubstitutions(value) {
  let text = ''
  let cursor = 0
  for (;;) {
    const at = value.indexOf('${', cursor)
    if (at === -1) return text + value.slice(cursor)
    text += `${value.slice(cursor, at)} `
    cursor = endOfSubstitution(value, at + 2)
  }
}

// Translation keys such as `header.title` look like tag-qualified selectors.
function selectorNames(value) {
  return [...value.matchAll(SELECTOR_RE)].map(match => {
    const compound = /[\w.:\\-]*$/.exec(value.slice(0, match.index))[0]
    return { name: match[1].replace(/\\+/g, ''), tagged: /^[A-Za-z]/.test(compound) && compound !== 'class' }
  })
}

function checkStylesheet(source, offset, index, report) {
  for (const match of source.matchAll(STYLESHEET_SELECTOR_RE)) {
    const move = mapToken(match[1].replace(/\\+/g, ''), index)
    if (move) report(offset + match.index, 'selector in a stylesheet', [move])
  }
}

function blocks(text, tag) {
  return [...text.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))].map(match => {
    const offset = match.index + match[0].indexOf('>') + 1
    return { offset, end: offset + match[1].length }
  })
}

function findContexts(text) {
  const contexts = []
  const quoted = (re, build) => {
    for (const match of text.matchAll(re)) {
      const quote = [...match]
        .slice(1)
        .filter(group => group !== undefined)
        .pop()
      const open = match.index + match[0].length
      const close = text.indexOf(quote, open)
      if (close !== -1) contexts.push(build(match.index, open, close, close + quote.length))
    }
  }

  // `\"` covers markup inside a JS string, such as `'<div class=\"grid\">'`.
  quoted(
    /(?<![\w$.:@[-])(?:class|ngClass|routerLinkActive|active-class|exact-active-class)\s*=\s*(\\?["'])/g,
    (start, open, close, end) => ({ ...interpolated(start, end, text.slice(open, close), open), element: true }),
  )

  for (const match of text.matchAll(/(?<![\w$.:@[-])class\s*=\s*([^\s"'`={}<>\\][^\s"'`={}<>]*)/g)) {
    const offset = match.index + match[0].length - match[1].length
    contexts.push({ ...plain(match.index, offset + match[1].length, match[1], offset), element: true })
  }

  for (const match of text.matchAll(/\bclassName\s*=\s*(["'{])|(?<![\w$.:@[-])class\s*=\s*(\{)/g)) {
    const delimiter = match[1] ?? match[2]
    const open = match.index + match[0].length
    if (delimiter !== '{') {
      const close = text.indexOf(delimiter, open)
      if (close !== -1)
        contexts.push({ ...plain(match.index, close + 1, text.slice(open, close), open), element: true })
      continue
    }
    const close = closingBrace(text, open - 1)
    const context = jsxExpressionContext(text, match.index, open, close)
    if (context) contexts.push({ ...context, element: true })
  }

  quoted(
    /\[(?:class|ngClass|routerLinkActive)\]\s*=\s*(["'])|(?<![\w-])(?:v-bind)?:(?:class|active-class|exact-active-class)\s*=\s*(["'])/g,
    (start, open, close, end) => ({ ...bindingContext(text, start, open, close), end, element: true }),
  )

  for (const match of text.matchAll(/\[class\.([^\]\s]+)\]|@HostBinding\(\s*(["'])class\.([^"']+)\2/g)) {
    const name = match[1] ?? match[3]
    const offset = match.index + match[0].lastIndexOf(name)
    contexts.push({
      ...plain(match.index, match.index + match[0].length, name, offset),
      element: match[1] !== undefined,
    })
  }

  for (const match of text.matchAll(/@HostBinding\(\s*(["'])class\1\s*\)[ \t]*\n?/g)) {
    const open = match.index + match[0].length
    const lineEnd = text.indexOf('\n', open)
    const close = lineEnd === -1 ? text.length : lineEnd
    const context = { start: match.index, end: close, strings: [], reasons: [] }
    addLiterals(context, literalsIn(text.slice(open, close), open))
    contexts.push(context)
  }

  for (const match of text.matchAll(
    /\b(?:classList\s*\.\s*(?:add|remove|toggle|contains)|addClass|removeClass)\s*\(/g,
  )) {
    const open = match.index + match[0].length
    const close = closingParen(text, open - 1)
    const context = { start: match.index, end: close + 1, strings: [], reasons: [] }
    addLiterals(context, literalsIn(text.slice(open, close), open))
    contexts.push(context)
  }

  for (const match of text.matchAll(/\bsetAttribute\s*\(/g)) {
    const open = match.index + match[0].length
    const close = closingParen(text, open - 1)
    const args = splitTopLevel(text.slice(open, close), open)
    const name = args.findIndex(arg => /^\s*(["'])class\1\s*$/.test(arg.value))
    if (name === -1) continue
    const context = { start: match.index, end: close + 1, strings: [], reasons: [] }
    for (const arg of args.slice(name + 1)) addLiterals(context, literalsIn(arg.value, arg.offset))
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
  if (!value.includes(open)) return plain(start, end, value, offset)
  const reason = open === '{{' ? 'interpolation' : 'template substitution'
  return { start, end, strings: staticParts(value, offset, open), reasons: [reason], inner: innerClasses(value, open) }
}

// The literals inside `${…}` or `{{ … }}`, such as `{{ on ? 'table' : '' }}`, cannot be rewritten in place, but name classes.
function innerClasses(value, open) {
  const names = []
  let at = value.indexOf(open)
  while (at !== -1) {
    const from = at + open.length
    const end = open === '${' ? endOfSubstitution(value, from) - 1 : value.indexOf('}}', from)
    const stop = end < 0 ? value.length : end
    for (const literal of literalsIn(value.slice(from, stop), 0)) {
      if (literal.compared) continue
      names.push(...literal.parts.flatMap(part => tokensOf(part.value, 0).map(token => token.value)), ...literal.inner)
    }
    at = value.indexOf(open, stop)
  }
  return names.filter(name => CLASS_TOKEN_RE.test(name))
}

function staticParts(value, offset, open) {
  const strings = []
  let cursor = 0
  while (cursor < value.length) {
    const at = value.indexOf(open, cursor)
    const stop = at === -1 ? value.length : at
    strings.push(...staticPart(value, cursor, stop, offset))
    if (at === -1) break
    if (open === '${') {
      cursor = endOfSubstitution(value, at + open.length)
      continue
    }
    const after = value.indexOf('}}', at + open.length)
    cursor = after === -1 ? value.length : after + 2
  }
  return strings
}

// A token glued to a substitution or a concatenation, such as `mb-${size}` or `'mb-' + size`, is not a whole class, so it is dropped.
function staticPart(value, from, to, offset, gluedStart = from > 0, gluedEnd = to < value.length) {
  let start = from
  let end = to
  if (gluedStart && /\S/.test(value[start])) while (start < end && /\S/.test(value[start])) start++
  if (gluedEnd && /\S/.test(value[end - 1])) while (end > start && /\S/.test(value[end - 1])) end--
  return start < end ? [{ value: value.slice(start, end), offset: offset + start }] : []
}

// Literals joined by operators, such as `ok ? 'table' : ''`, are a class context; a call such as `cx(…)` is not.
function jsxExpressionContext(text, start, open, close) {
  const expression = text.slice(open, close)
  if (wrapped(expression.trim(), '{', '}')) return bindingContext(text, start, open, close)
  const literals = literalsIn(expression, open)
  const lone = literals.length === 1 && /^\s*["'`]/.test(expression) && /["'`]\s*$/.test(expression)
  if (!lone && !literals.some(literal => literal.concatenated)) {
    if (literals.length > 0 && !readsValue(expression)) return bindingContext(text, start, open, close)
    const keys = [...expression.matchAll(/[{,]\s*(?:(["'])([^"'\n]+)\1|([A-Za-z_$][\w$-]*))\s*:/g)].flatMap(match =>
      (match[2] ?? match[3]).split(/\s+/).filter(Boolean),
    )
    return keys.length > 0 ? { start, end: close + 1, keys } : undefined
  }
  const context = { start, end: close + 1, strings: [], reasons: [] }
  addLiterals(context, literals)
  return context
}

function addLiterals(context, literals) {
  for (const literal of literals) {
    if (literal.compared) continue
    if (literal.substitution) context.reasons.push('template substitution')
    if (literal.concatenated) context.reasons.push('string concatenation')
    context.strings.push(...literal.parts)
    context.inner = [...(context.inner ?? []), ...literal.inner]
  }
}

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
  if (literals.length === 0 || readsValue(source)) {
    context.reasons.push('non-literal class binding')
    return
  }
  if (outsideLiterals(source).includes('{')) context.reasons.push('non-literal class binding')
  addLiterals(context, literals)
}

// A literal after a member access or call, such as `map['grid']` or `theme('grid')`, is a key or argument, not a class.
function readsValue(source) {
  return /[\w$\])]\s*[[(]/.test(outsideLiterals(source))
}

function outsideLiterals(source) {
  const code = source.split('')
  for (const literal of stringLiterals(source)) code.fill(' ', literal.start, literal.end)
  return code.join('')
}

function wrapped(body, left, right) {
  return body.startsWith(left) && closingIndex(body, 0, left, right) === body.length - 1
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
  const key = /^[\w$-]+(?=\s*:)/.exec(entry)
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
    const joinedBefore = before.endsWith('+')
    const joinedAfter = after.startsWith('+')
    literals.push({
      // An operand of `===` or a ternary test, such as `mode === 'grid' ? …`, is a value, not a class.
      compared: /[!=]=$/.test(before) || /^[!=]=/.test(after) || /^\?(?![.?])/.test(after),
      concatenated: joinedBefore || joinedAfter,
      substitution,
      parts: substitution
        ? staticParts(value, offset + literal.start + 1, '${')
        : staticPart(value, 0, value.length, offset + literal.start + 1, joinedBefore, joinedAfter),
      inner: substitution ? innerClasses(value, '${') : [],
    })
  }
  return literals
}

function stringLiterals(source, from = 0, to = source.length, jsx = false) {
  const literals = []
  let i = from
  while (i < to) {
    const quote = source[i]
    if (quote !== '"' && quote !== "'" && quote !== '`') {
      i++
      continue
    }
    // An apostrophe inside a word of JSX text, such as `It's`, opens no string.
    if (jsx && quote === "'" && /[A-Za-z0-9]/.test(source[i - 1] ?? '') && /[A-Za-z]/.test(source[i + 1] ?? '')) {
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
  return closingIndex(text, open, '{', '}')
}

function closingParen(text, open) {
  return closingIndex(text, open, '(', ')')
}

// Comments are already blanked in `comments`, so every quote left there opens a string literal.
function codeLiterals(text, comments, extension) {
  const regions = MARKUP_EXTENSIONS.has(extension) ? blocks(text, 'script') : [{ offset: 0, end: text.length }]
  const jsx = JSX_EXTENSIONS.has(extension)
  return regions.flatMap(({ offset, end }) =>
    stringLiterals(comments, offset, end, jsx).map(literal => ({
      ...literal,
      value: text.slice(literal.start + 1, literal.end - 1),
    })),
  )
}

// Bound attributes hold expressions, so their literals get the same check as code literals.
function boundAttributeLiterals(text) {
  const literals = []
  for (const match of text.matchAll(/(?:(?<![\w-])(?:v-bind)?:[\w.-]+|\[[\w.@-]+\]|(?<![\w:-])v-bind)\s*=\s*(["'])/g)) {
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
