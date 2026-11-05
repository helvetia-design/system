import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage'])
const EXTENSIONS = new Set(['.tsx', '.jsx', '.html', '.ts'])

export function scanSourceFiles(rootDir, collect, extensions = EXTENSIONS) {
  const root = realpathSync(resolve(rootDir))
  if (!statSync(root).isDirectory()) throw new Error(`Scan root is not a directory: ${root}`)
  walk(root, root, collect, extensions)
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
      if (SKIP_DIRS.has(entry.name)) continue
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

  const extension = extname(filePath)
  let masked
  let comments
  collect({
    file: relative(rootDir, filePath).split(sep).join('/'),
    text,
    get masked() {
      masked ??= maskSource(text, extension === '.html')
      return masked
    },
    get comments() {
      comments ??= maskComments(text, commentKind(extension))
      return comments
    },
  })
}

/** Scans the whole root, or only `files` (paths relative to the root), and returns the paths that matched no source file. */
export function scanSelectedFiles(rootDir, files, collect, extensions) {
  const root = realpathSync(resolve(rootDir))
  const only = files.length > 0 ? new Set(files.map(file => toRootRelative(root, file))) : undefined
  const scanned = new Set()
  scanSourceFiles(
    root,
    source => {
      if (only && !only.has(source.file)) return
      scanned.add(source.file)
      collect(source)
    },
    extensions,
  )
  return only ? [...only].filter(file => !scanned.has(file)).sort() : []
}

export function toRootRelative(root, file) {
  const absolute = resolve(root, file)
  let real = absolute
  try {
    real = realpathSync(absolute)
  } catch {
    // A missing file keeps its resolved path and ends up in `unmatched`.
  }
  return relative(root, real).split(sep).join('/')
}

function commentKind(extension) {
  if (extension === '.html' || extension === '.vue') return 'markup'
  if (extension === '.css') return 'css'
  if (extension === '.scss' || extension === '.sass' || extension === '.less') return 'scss'
  return 'script'
}

/**
 * Blanks comments only and keeps every string. `kind` is `script`, `css`, `scss` (with `//` line comments) or
 * `markup`, where only `<!--` is a comment outside `<script>` and `<style>` blocks.
 */
export function maskComments(text, kind) {
  const mask = text.split('')
  let region = kind === 'markup' ? 'markup' : kind
  let i = 0
  while (i < text.length) {
    if (kind === 'markup') {
      const tag = /^<(\/?)(script|style)\b/i.exec(text.slice(i, i + 9))
      if (tag) {
        region = tag[1] ? 'markup' : tag[2].toLowerCase() === 'script' ? 'script' : 'css'
        i = tag[1] ? i + tag[0].length : closeAt(text, '>', i)
        continue
      }
    }
    if (text.startsWith('<!--', i)) {
      i = blank(mask, i, closeAt(text, '-->', i + 4))
      continue
    }
    if (region === 'markup') {
      i++
      continue
    }
    if (text.startsWith('//', i) && (region === 'script' || (region === 'scss' && text[i - 1] !== ':'))) {
      const end = text.indexOf('\n', i)
      i = blank(mask, i, end === -1 ? text.length : end)
      continue
    }
    if (text.startsWith('/*', i)) {
      i = blank(mask, i, closeAt(text, '*/', i + 2))
      continue
    }
    const quote = text[i]
    if (quote === '"' || quote === "'" || quote === '`') {
      i = keepTemplate(text, mask, i, false)
      continue
    }
    i++
  }
  return mask.join('')
}

function maskSource(text, html) {
  const mask = Array.from(text)
  let i = 0
  while (i < text.length) {
    if (text.startsWith('<!--', i)) {
      i = blank(mask, i, closeAt(text, '-->', i + 4))
      continue
    }
    if (!html && text.startsWith('//', i)) {
      const end = text.indexOf('\n', i)
      i = blank(mask, i, end === -1 ? text.length : end)
      continue
    }
    if (text.startsWith('/*', i)) {
      i = blank(mask, i, closeAt(text, '*/', i + 2))
      continue
    }

    const quote = text[i]
    if (quote === '"' || quote === "'" || quote === '`') {
      i = !html && isTemplatePropertyString(text, i) ? keepTemplate(text, mask, i, true) : blankString(text, mask, i)
      continue
    }
    i++
  }
  return mask.join('')
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

function keepTemplate(text, mask, start, blankNested) {
  const quote = text[start]
  let i = start + 1
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2
      continue
    }
    if (text.startsWith('<!--', i)) {
      i = blank(mask, i, closeAt(text, '-->', i + 4))
      continue
    }
    if (blankNested && (text[i] === '"' || text[i] === "'") && text[i] !== quote) {
      i = blankString(text, mask, i)
      continue
    }
    if (text[i] === quote) return i + 1
    if (quote !== '`' && text[i] === '\n') return i
    i++
  }
  return i
}

function blankString(text, mask, start) {
  return blank(mask, start, endOfString(text, start))
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

function endOfSubstitution(text, from) {
  let depth = 1
  let i = from
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = endOfString(text, i, true)
      continue
    }
    if (ch === '{') depth++
    if (ch === '}' && --depth === 0) return i + 1
    i++
  }
  return text.length
}

function blank(mask, from, to) {
  for (let i = from; i < to; i++) {
    if (mask[i] !== '\n') mask[i] = ' '
  }
  return to
}

function closeAt(text, token, from) {
  const end = text.indexOf(token, from)
  return end === -1 ? text.length : end + token.length
}

export function readTag(text, start) {
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
    if (ch === '>') return text.slice(start, i + 1)
    i++
  }
  return text.slice(start)
}

export function lineText(text, index) {
  const start = text.lastIndexOf('\n', index - 1) + 1
  const end = text.indexOf('\n', index)
  return text.slice(start, end === -1 ? text.length : end)
}

export function lineAt(text, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (text[i] === '\n') line++
  return line
}

export function toSnippet(raw) {
  return raw.replace(/\s+/g, ' ').replace(/ >/g, '>').trim().slice(0, 240)
}
