import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

// Tool folders are never source, wherever they sit, and stay skipped at any depth.
export const TOOL_DIRS = new Set(['node_modules', '.angular', '.git', '.claude', '.nx'])
// Build-output names double as ordinary source folder names (e.g. an Angular `coverage.component`
// folder), so these are only build output directly beside the `package.json` that produces them.
export const BUILD_OUTPUT_DIRS = new Set([
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.output',
  'storybook-static',
])

/** Whether a directory named `name` directly inside `parentDir` should be skipped while walking `root`. */
export function isSkippedDir(name, parentDir, root) {
  if (TOOL_DIRS.has(name)) return true
  if (!BUILD_OUTPUT_DIRS.has(name)) return false
  return parentDir === root || existsSync(join(parentDir, 'package.json'))
}
export const SOURCE_EXTENSIONS = new Set([
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
  '.htm',
])
export const MARKUP_EXTENSIONS = new Set(['.html', '.htm', '.vue'])
export const STYLE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less'])

/**
 * Walks the source files under `rootDir`, or only the files and directories in `paths`, and returns the paths that match no source file.
 */
export function scanSourceFiles(rootDir, collect, { extensions = SOURCE_EXTENSIONS, paths = [] } = {}) {
  const root = realpathSync(resolve(rootDir))
  if (!statSync(root).isDirectory()) throw new Error(`Scan root is not a directory: ${root}`)
  if (paths.length === 0) {
    walk(root, root, collect, extensions)
    return []
  }

  const seen = new Set()
  const collectOnce = source => {
    if (seen.has(source.file)) return
    seen.add(source.file)
    collect(source)
  }
  const unmatched = new Set()
  for (const path of paths) {
    const target = resolvePath(root, path)
    if (target.real === root) {
      walk(root, root, collectOnce, extensions)
    } else if (!target.real || isAbsolute(target.rel) || hasSkippedSegment(root, target.rel)) {
      unmatched.add(target.rel)
    } else if (statSync(target.real).isDirectory()) {
      walk(root, target.real, collectOnce, extensions)
    } else if (extensions.has(extname(target.real))) {
      readSource(root, target.real, collectOnce)
    } else {
      unmatched.add(target.rel)
    }
  }
  return [...unmatched].sort()
}

function hasSkippedSegment(root, relPath) {
  let dir = root
  for (const part of relPath.split('/')) {
    if (part === '..' || isSkippedDir(part, dir, root)) return true
    dir = join(dir, part)
  }
  return false
}

function resolvePath(root, path) {
  const absolute = resolve(root, path)
  let real
  try {
    real = realpathSync(absolute)
  } catch {
    return { rel: toPosix(relative(root, absolute)) }
  }
  return { real, rel: toPosix(relative(root, real)) }
}

function toPosix(path) {
  return path.split(sep).join('/')
}

function walk(rootDir, dir, collect, extensions) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    const entryPath = canonicalChild(rootDir, join(dir, entry.name))
    if (!entryPath) continue
    if (entry.isDirectory()) {
      if (isSkippedDir(entry.name, dir, rootDir)) continue
      walk(rootDir, entryPath, collect, extensions)
      continue
    }
    if (!entry.isFile() || !extensions.has(extname(entry.name))) continue
    readSource(rootDir, entryPath, collect)
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

function readSource(rootDir, filePath, collect) {
  let text
  try {
    text = readFileSync(filePath, 'utf8')
  } catch {
    return
  }

  const mode = sourceMode(extname(filePath))
  let masked
  let comments
  collect({
    file: toPosix(relative(rootDir, filePath)),
    text,
    get masked() {
      masked ??= maskText(text, mode, true)
      return masked
    },
    get comments() {
      comments ??= maskText(text, mode, false)
      return comments
    },
  })
}

export const JSX_EXTENSIONS = new Set(['.tsx', '.jsx', '.js'])

export function sourceMode(extension) {
  if (MARKUP_EXTENSIONS.has(extension)) return 'markup'
  if (extension === '.css') return 'css'
  if (extension === '.scss' || extension === '.sass' || extension === '.less') return 'scss'
  if (JSX_EXTENSIONS.has(extension)) return 'jsx'
  return 'script'
}

const SCSS_LANG_RE = /\blang\s*=\s*["']?(?:scss|sass|less)\b/i

/**
 * Blanks comments only and keeps every string. `kind` is `script`, `jsx` (script that may hold JSX), `css`, `scss`
 * (with `//` line comments) or `markup`, where only `<!--` is a comment outside `<script>` and `<style>` blocks.
 */
export function maskComments(text, kind) {
  return maskText(text, kind, false)
}

// Markup text and JSX children keep their quotes and `//`; only attribute values and `{…}` or `{{ … }}` hold strings.
function maskText(text, mode, blankStrings) {
  const ctx = {
    text,
    mask: text.split(''),
    blankStrings,
    blankedTo: 0,
    jsxDepth: 0,
    depthCapped: false,
    failedJsx: new Set(),
    jsxSteps: 0,
    jsxBudget: JSX_STEPS_PER_CHAR * text.length + 10_000,
    htmlCommentFrom: -1,
    htmlCommentAt: -1,
  }
  if (mode === 'markup') scanMarkup(ctx, 0, text.length)
  else if (mode === 'css' || mode === 'scss') scanStyle(ctx, 0, text.length, mode === 'scss')
  else scanCode(ctx, 0, text.length, { jsx: mode === 'jsx' })
  return ctx.mask.join('')
}

// A `/` opens a regex and a `<` opens JSX only where an operand is expected, so `a / b` and `a < b` stay operators.
const REGEX_START_RE =
  /(?:[(,=:[!&|?{};~^%]|=>|(?:^|[^\w$])(?:return|typeof|case|void|delete|throw|yield|await|else|do|in|of|new))$/

function expectsOperand(text, start) {
  let i = start - 1
  while (i >= 0 && /\s/.test(text[i])) i--
  return i < 0 || REGEX_START_RE.test(text.slice(Math.max(0, i - 15), i + 1))
}

function endOfRegex(text, start) {
  if (text[start + 1] === '/' || text[start + 1] === '*') return -1
  if (!expectsOperand(text, start)) return -1
  let inClass = false
  let i = start + 1
  while (i < text.length) {
    const ch = text[i]
    if (ch === '\n') return -1
    if (ch === '\\') {
      i += 2
      continue
    }
    if (ch === '[') inClass = true
    else if (ch === ']') inClass = false
    else if (ch === '/' && !inClass) {
      i++
      while (/[a-z]/.test(text[i] ?? '')) i++
      return i
    }
    i++
  }
  return -1
}

// With `inExpression`, returns the index of the `}` that closes the expression, or -1 when none does before `stop`.
function scanCode(ctx, start, stop, { jsx, inExpression = false }) {
  const { text } = ctx
  let depth = 0
  let i = start
  while (i < stop) {
    if (inExpression) ctx.jsxSteps++
    const ch = text[i]
    if (text.startsWith('<!--', i)) {
      i = blankHtmlComment(ctx, i, stop)
      continue
    }
    if (ch === '/') {
      const end = commentEnd(text, i, stop)
      if (end !== -1) {
        i = blank(ctx, i, end)
        continue
      }
      const regexEnd = endOfRegex(text, i)
      i = regexEnd !== -1 && regexEnd <= stop ? regexEnd : i + 1
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      i = scanString(ctx, i, stop)
      continue
    }
    if (jsx && ch === '<' && ctx.jsxSteps < ctx.jsxBudget && expectsOperand(text, i)) {
      const end = scanJsxElement(ctx, i, stop, true)
      if (end !== -1) {
        i = end
        continue
      }
    }
    if (inExpression && ch === '{') depth++
    if (inExpression && ch === '}') {
      if (depth === 0) return i
      depth--
    }
    i++
  }
  return inExpression ? -1 : stop
}

function blankHtmlComment(ctx, start, stop) {
  return blank(ctx, start, Math.min(closeAt(ctx.text, '-->', start + 4), stop))
}

// Returns the index after the `}` that closes the JSX expression opening at `open`, or -1.
function jsxExpressionEnd(ctx, open, stop) {
  const close = scanCode(ctx, open + 1, stop, { jsx: true, inExpression: true })
  return close === -1 ? -1 : close + 1
}

// An unclosed `/*` is a regex such as `/^\/*/` or stray text, not a comment that runs to the end of the file.
function commentEnd(text, start, stop) {
  if (text[start + 1] === '/') {
    const end = text.indexOf('\n', start)
    return end === -1 || end > stop ? stop : end
  }
  if (text[start + 1] === '*') {
    const end = text.indexOf('*/', start + 2)
    if (end !== -1 && end + 2 <= stop) return end + 2
  }
  return -1
}

function scanString(ctx, start, stop) {
  const { text } = ctx
  const end = Math.min(endOfString(text, start, true), stop)
  if (!isTemplatePropertyString(text, start)) return skipString(ctx, start, end)
  const closed = end - 1 > start && text[end - 1] === text[start]
  scanMarkup(ctx, start + 1, closed ? end - 1 : end)
  return end
}

function skipString(ctx, start, end) {
  const { text, blankStrings } = ctx
  if (blankStrings) return blank(ctx, start, end)
  let i = start + 1
  while (i < end) {
    const open = nextHtmlComment(ctx, i)
    if (open === -1 || open >= end) break
    const close = closeAt(text, '-->', open + 4)
    if (close > end) break
    i = blank(ctx, open, close)
  }
  return end
}

// Caches the last search so a file with many strings and no `<!--` is not rescanned to its end per string.
function nextHtmlComment(ctx, from) {
  const cached = ctx.htmlCommentFrom !== -1 && ctx.htmlCommentFrom <= from
  if (cached && (ctx.htmlCommentAt === -1 || ctx.htmlCommentAt >= from)) return ctx.htmlCommentAt
  ctx.htmlCommentFrom = from
  ctx.htmlCommentAt = ctx.text.indexOf('<!--', from)
  return ctx.htmlCommentAt
}

function isTemplatePropertyString(text, quoteIndex) {
  let index = quoteIndex - 1
  while (index >= 0 && /\s/.test(text[index])) index--
  if (text[index] !== ':') return false
  index--
  while (index >= 0 && /\s/.test(text[index])) index--
  const end = index + 1
  while (index >= 0 && /[A-Za-z0-9_$]/.test(text[index])) index--
  return text.slice(index + 1, end) === 'template'
}

const JSX_NAME_RE = /[A-Za-z][\w.:-]*/y
const JSX_CLOSE_RE = /<\/\s*([^\s>]*)\s*>/y
const TS_GENERIC_RE = /\s*(?:[,=]|extends\b)/y
// Unclosed `<` runs would otherwise nest once per line, overflow the stack and rescan the rest of the file each time.
const MAX_JSX_DEPTH = 128
// Invalid code such as unbalanced `{` after `<a>` makes every later `<` rescan to the end; past this budget `<` stays code.
const JSX_STEPS_PER_CHAR = 20

// Returns the index after the element, or -1. From code, a failed attempt restores the mask so `<` reads as an operator.
function scanJsxElement(ctx, start, stop, fromCode) {
  const { text, mask } = ctx
  let name = ''
  if (text[start + 1] !== '>') {
    JSX_NAME_RE.lastIndex = start + 1
    name = JSX_NAME_RE.exec(text)?.[0] ?? ''
    if (!name) return -1
    TS_GENERIC_RE.lastIndex = start + 1 + name.length
    if (fromCode && TS_GENERIC_RE.test(text)) return -1
  }
  // Without remembering failures, nested retries of the same `<` grow exponentially, e.g. `const f: <T>(v: T) => T`.
  const key = `${start}:${stop}`
  if (ctx.failedJsx.has(key)) return -1
  if (ctx.jsxDepth >= MAX_JSX_DEPTH) {
    ctx.depthCapped = true
    return -1
  }
  const outerBlankedTo = ctx.blankedTo
  const outerDepthCapped = ctx.depthCapped
  ctx.blankedTo = start
  ctx.depthCapped = false
  ctx.jsxDepth++
  const end = jsxElementEnd(ctx, name, start + 1 + name.length, stop)
  ctx.jsxDepth--
  // A failure caused by the depth cap may succeed when retried from a shallower depth.
  if (end === -1 && !ctx.depthCapped) ctx.failedJsx.add(key)
  if (end === -1 && fromCode) {
    for (let i = start; i < Math.min(stop, ctx.blankedTo); i++) mask[i] = text[i]
    ctx.blankedTo = start
  }
  ctx.blankedTo = Math.max(outerBlankedTo, ctx.blankedTo)
  ctx.depthCapped ||= outerDepthCapped
  return end
}

function jsxElementEnd(ctx, name, from, stop) {
  const { text, blankStrings } = ctx
  let i = from
  while (i < stop) {
    ctx.jsxSteps++
    const ch = text[i]
    if (ch === '"' || ch === "'") {
      const close = text.indexOf(ch, i + 1)
      if (close === -1 || close >= stop) return -1
      i = blankStrings ? blank(ctx, i, close + 1) : close + 1
      continue
    }
    if (ch === '{') {
      i = jsxExpressionEnd(ctx, i, stop)
      if (i === -1) return -1
      continue
    }
    if (ch === '/' && text[i + 1] === '>') return i + 2
    if (ch === '/') {
      const end = commentEnd(text, i, stop)
      if (end === -1) return -1
      i = blank(ctx, i, end)
      continue
    }
    if (ch === '>') return jsxChildrenEnd(ctx, name, i + 1, stop)
    if ('<;()}'.includes(ch)) return -1
    i++
  }
  return -1
}

function jsxChildrenEnd(ctx, name, from, stop) {
  const { text } = ctx
  let i = from
  while (i < stop) {
    ctx.jsxSteps++
    const ch = text[i]
    if (ch === '{') {
      i = jsxExpressionEnd(ctx, i, stop)
      if (i === -1) return -1
      continue
    }
    if (text.startsWith('<!--', i)) {
      i = blankHtmlComment(ctx, i, stop)
      continue
    }
    if (text.startsWith('</', i)) {
      JSX_CLOSE_RE.lastIndex = i
      const match = JSX_CLOSE_RE.exec(text)
      if (!match || match[1] !== name || JSX_CLOSE_RE.lastIndex > stop) return -1
      return JSX_CLOSE_RE.lastIndex
    }
    // JSX text cannot hold a bare `}`, so reaching one means this was a TS generic such as `const f: <T>(x: T) => T`.
    if (ch === '}') return -1
    if (ch === '<' && /[A-Za-z>]/.test(text[i + 1] ?? '')) {
      const end = scanJsxElement(ctx, i, stop, false)
      if (end === -1) return -1
      i = end
      continue
    }
    i++
  }
  return -1
}

const MARKUP_TAG_RE = /<([A-Za-z][\w:-]*)/y

function scanMarkup(ctx, start, stop) {
  const { text } = ctx
  let i = start
  while (i < stop) {
    if (text.startsWith('<!--', i)) {
      const end = closeAt(text, '-->', i + 4)
      i = end <= stop ? blank(ctx, i, end) : i + 4
      continue
    }
    if (text.startsWith('{{', i)) {
      i = scanInterpolation(ctx, i, stop)
      continue
    }
    MARKUP_TAG_RE.lastIndex = i
    const tag = text[i] === '<' ? MARKUP_TAG_RE.exec(text) : null
    i = tag ? scanMarkupTag(ctx, i, tag[1].toLowerCase(), stop) : i + 1
  }
  return stop
}

function scanMarkupTag(ctx, start, name, stop) {
  const { text, blankStrings } = ctx
  let i = start + 1 + name.length
  while (i < stop && text[i] !== '>') {
    const ch = text[i]
    if (ch === '<') return i
    const isValue = (ch === '"' || ch === "'") && /=\s*$/.test(text.slice(Math.max(start, i - 16), i))
    const close = isValue ? text.indexOf(ch, i + 1) : -1
    if (close !== -1 && close < stop) {
      i = blankStrings ? blank(ctx, i, close + 1) : close + 1
      continue
    }
    i++
  }
  if (i >= stop) return stop
  const tagClose = i + 1
  if ((name !== 'script' && name !== 'style') || text[i - 1] === '/') return tagClose

  const closing = new RegExp(`</${name}\\b`, 'gi')
  closing.lastIndex = tagClose
  const blockEnd = Math.min(closing.exec(text)?.index ?? stop, stop)
  const attributes = text.slice(start, tagClose)
  if (name === 'script') scanCode(ctx, tagClose, blockEnd, { jsx: /\blang\s*=\s*["']?[jt]sx\b/i.test(attributes) })
  else scanStyle(ctx, tagClose, blockEnd, SCSS_LANG_RE.test(attributes))
  return blockEnd
}

function scanInterpolation(ctx, start, stop) {
  const { text } = ctx
  const close = text.indexOf('}}', start + 2)
  if (close === -1 || close + 2 > stop) return start + 2
  let i = start + 2
  while (i < close) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(ctx, i, Math.min(endOfString(text, i), close))
      continue
    }
    i++
  }
  return close + 2
}

function scanStyle(ctx, start, stop, scss) {
  const { text } = ctx
  let i = start
  while (i < stop) {
    const ch = text[i]
    if (text.startsWith('<!--', i)) {
      i = blankHtmlComment(ctx, i, stop)
      continue
    }
    const lineComment = scss && text[i + 1] === '/' && text[i - 1] !== ':' && text[i - 1] !== '('
    const end = ch === '/' && (lineComment || text[i + 1] === '*') ? commentEnd(text, i, stop) : -1
    if (end !== -1) {
      i = blank(ctx, i, end)
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(ctx, i, Math.min(endOfString(text, i), stop))
      continue
    }
    i++
  }
}

/** Returns the index after the string that opens at `start`; with `substitutions`, `${…}` may hold nested strings. */
export function endOfString(text, start, substitutions = false) {
  const quote = text[start]
  let i = start + 1
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2
      continue
    }
    if (substitutions && quote === '`' && text.startsWith('${', i)) {
      i = endOfSubstitution(text, i + 2)
      continue
    }
    if (text[i] === quote) return i + 1
    if (quote !== '`' && text[i] === '\n') return i
    i++
  }
  return text.length
}

/** Returns the index after the `}` that closes a `${` whose body starts at `from`. */
export function endOfSubstitution(text, from) {
  const close = closingIndex(text, from - 1, '{', '}')
  return close === text.length ? close : close + 1
}

/** Returns the index of the `right` that closes the `left` at `open`, skipping strings, or `text.length`. */
export function closingIndex(text, open, left, right) {
  let depth = 0
  let i = open
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = endOfString(text, i, true)
      continue
    }
    if (ch === left) depth++
    if (ch === right && --depth === 0) return i
    i++
  }
  return text.length
}

function blank(ctx, from, to) {
  const { mask } = ctx
  for (let i = from; i < to; i++) {
    if (mask[i] !== '\n') mask[i] = ' '
  }
  if (to > ctx.blankedTo) ctx.blankedTo = to
  return to
}

function closeAt(text, token, from) {
  const end = text.indexOf(token, from)
  return end === -1 ? text.length : end + token.length
}

export function readTag(text, start) {
  return text.slice(start, tagEnd(text, start))
}

/**
 * Returns the index after the `>` that closes the tag opening at `start`, or `text.length`. It skips quoted values
 * and balanced JSX `{…}` expressions, so the `>` of an arrow function inside a handler does not end the tag.
 */
export function tagEnd(text, start) {
  let i = start + 1
  let quote = ''
  while (i < text.length) {
    const ch = text[i]
    if (quote) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === quote) quote = ''
      i++
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      i++
      continue
    }
    if (ch === '{') {
      const close = closingIndex(text, i, '{', '}')
      if (close < text.length) {
        i = close + 1
        continue
      }
    }
    if (ch === '>') return i + 1
    i++
  }
  return text.length
}

export function lineStart(text, index) {
  return text.lastIndexOf('\n', index - 1) + 1
}

export function lineText(text, index) {
  const start = lineStart(text, index)
  const end = text.indexOf('\n', index)
  return text.slice(start, end === -1 ? text.length : end)
}

export function lineIndex(text) {
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

// Holds one file's index; callers must not alternate texts, or every call rebuilds it.
let cachedText
let cachedLookup

export function lineAt(text, index) {
  if (text !== cachedText) cachedLookup = lineIndex(text)
  // An equal-content copy left in the cache would cost a full string compare on every call.
  cachedText = text
  return cachedLookup(index)
}

export function toSnippet(raw) {
  return raw.replace(/\s+/g, ' ').replace(/ >/g, '>').trim().slice(0, 240)
}

/**
 * Blanks the `HTML` and `Element` around every `HTMLBal*Element` type (`HTMLBalInputElement` reads `    BalInput       `),
 * so a scanner's `\bBalInput\b` matches the type at the same index.
 */
export function unwrapElementTypes(masked) {
  return masked.replace(/\bHTML(Bal[A-Z]\w*?)Element\b/g, (_, name) => `    ${name}       `)
}

/** Returns the `.ts` file beside an Angular `.html` template, or `undefined` for any other file. */
export function siblingScript(file) {
  return file.endsWith('.html') ? `${file.slice(0, -'.html'.length)}.ts` : undefined
}

const SCRIPT_RE = /\.(?:[cm]?[jt]s|[jt]sx|vue)$/

/**
 * Runs `scanSourceFiles` and then pushes a `setValue: true` finding into `found` for every `.setValue(` call on a ref
 * typed `elementType`, in each scanned script and in the `.ts` beside each scanned `.html`. Returns the unmatched paths.
 */
export function scanSourceFilesWithSetValue(rootDir, collect, { paths = [], elementType, found }) {
  const pushSetValue = ({ file, masked, text }) => {
    for (const index of typedSetValueCalls(masked, elementType)) {
      found.push({ file, index, line: lineAt(text, index), snippet: toSnippet(lineText(text, index)), setValue: true })
    }
  }
  const scanned = new Set()
  const unmatched = scanSourceFiles(
    rootDir,
    source => {
      scanned.add(source.file)
      collect(source)
      if (SCRIPT_RE.test(source.file)) pushSetValue(source)
    },
    { paths },
  )
  for (const file of scanned) {
    const sibling = siblingScript(file)
    if (sibling && !scanned.has(sibling)) scanSourceFiles(rootDir, pushSetValue, { paths: [sibling] })
  }
  return unmatched
}

const IDENT = '([A-Za-z_$][\\w$]*)'
const CHAIN = '(?:[A-Za-z_$][\\w$]*(?:\\(\\))?\\s*[?!]?\\s*\\.\\s*)*[A-Za-z_$][\\w$]*(?:\\(\\))?[?!]?'
const RECEIVER_RE = new RegExp(`(${CHAIN})\\s*$`)
const ALIAS_RE = new RegExp(`\\b(?:const|let|var)\\s+${IDENT}\\s*=\\s*(${CHAIN})\\s*(?:;|$)`, 'gm')
const CONTINUATION_RE = /^\s*[?!]?\s*\./
const declarationCache = new Map()

function declarationsFor(type) {
  let cached = declarationCache.get(type)
  if (!cached) {
    cached = {
      declarations: [
        [`${IDENT}\\s*[!?]?\\s*:\\s*ElementRef\\s*<\\s*${type}\\s*>`, 'nativeElement'],
        [`${IDENT}\\s*=\\s*viewChild(?:\\.required)?\\s*<\\s*ElementRef\\s*<\\s*${type}\\s*>`, 'nativeElement'],
        [`${IDENT}\\s*=\\s*useRef\\s*<\\s*${type}\\b`, 'current'],
        [`${IDENT}\\s*[!?]?\\s*:\\s*${type}\\b`, ''],
        [`${IDENT}\\s*=[^;\\n]*?(?:\\bas\\s+${type}\\b|<\\s*${type}\\s*>\\s*\\()`, ''],
      ].map(([source, wrapper]) => [new RegExp(source, 'g'), wrapper]),
      inlineCast: new RegExp(`\\bas\\s+${type}\\s*\\)\\s*$`),
    }
    declarationCache.set(type, cached)
  }
  return cached
}

function chainParts(receiver) {
  return receiver.replace(/\(\)|[?!\s]/g, '').split('.')
}

function isTypedRef(refs, parts) {
  return refs.some(({ name, wrapper }) =>
    wrapper ? parts.at(-1) === wrapper && parts.at(-2) === name : parts.at(-1) === name,
  )
}

/**
 * Returns the index of every `.setValue(` call in `masked` whose receiver is a reference typed as `elementType`,
 * so a `FormControl.setValue` call on the same line shape is never returned.
 */
export function typedSetValueCalls(masked, elementType) {
  if (!masked.includes(elementType)) return []
  const { declarations, inlineCast } = declarationsFor(elementType)
  const refs = []
  for (const [re, wrapper] of declarations) {
    for (const match of masked.matchAll(re)) refs.push({ name: match[1], wrapper })
  }
  for (const match of masked.matchAll(ALIAS_RE)) {
    if (isTypedRef(refs, chainParts(match[2]))) refs.push({ name: match[1], wrapper: '' })
  }

  const calls = []
  for (const match of masked.matchAll(/\.\s*setValue\s*\(/g)) {
    let start = masked.lastIndexOf('\n', match.index - 1) + 1
    while (start > 0 && CONTINUATION_RE.test(masked.slice(start, match.index + 1))) {
      start = masked.lastIndexOf('\n', start - 2) + 1
    }
    const prefix = masked.slice(start, match.index)
    if (inlineCast.test(prefix)) {
      calls.push(match.index)
      continue
    }
    const receiver = RECEIVER_RE.exec(prefix)?.[1]
    if (receiver && isTypedRef(refs, chainParts(receiver))) calls.push(match.index)
  }
  return calls
}
