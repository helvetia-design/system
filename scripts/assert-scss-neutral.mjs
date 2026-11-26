#!/usr/bin/env node
/**
 * assert-scss-neutral — prove a `.scss` refactor did not change the compiled CSS.
 *
 * Compiles the file as it is at HEAD and as it is in the working tree, then compares. Use when
 * extracting a mixin or moving rules between files and the rendered result must not change —
 * e.g. sharing a picker's CSS between two components. Replaces improvising a
 * compile → diff → normalize → re-diff loop by hand.
 *
 *   node scripts/assert-scss-neutral.mjs packages/core/src/components/forms/phone-input/phone-input.host.scss
 *   node scripts/assert-scss-neutral.mjs --self-test
 *
 * Verdicts:
 *   IDENTICAL   — same CSS after stripping comments and normalizing whitespace. Strongest.
 *   EQUIVALENT  — same after sorting declarations and rules, and no rule declares the same
 *                 property twice (so sorting cannot have hidden a last-one-wins change).
 *                 Caveat printed: reordering two equal-specificity selectors is NOT detected.
 *   DIFFERENT   — a real difference, printed.
 *   UNDECIDED   — order differs AND some rule declares a property twice. Needs human eyes.
 *
 * Exits 0 on IDENTICAL/EQUIVALENT, 1 otherwise.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, rmSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import assert from 'node:assert/strict'

const SASS = join(process.cwd(), 'node_modules/.bin/sass')

/** Strip comments and `@charset`, which carry no rendering meaning. */
function stripNoise(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*@charset[^;]*;/gm, '')
}

const squash = s => s.replace(/\s+/g, ' ').trim()

/** `color : red` and `color:red` are the same declaration — compare them as one. */
function normDecl(raw) {
  const s = squash(raw)
  const i = s.indexOf(':')
  if (i === -1) return s
  const prop = s.slice(0, i).trim()
  const value = s.slice(i + 1).trim()
  // Custom properties are case-sensitive; standard properties are not.
  return `${prop.startsWith('--') ? prop : prop.toLowerCase()}:${value}`
}

/** `a , b` and `a,b` select the same thing. */
const normSel = raw => squash(raw).replace(/\s*([,>+~])\s*/g, '$1')

/**
 * Parse compiled CSS into a tree of { sel, decls[], children[] }. Dart Sass expanded output is
 * regular enough that brace/semicolon tokenizing is sufficient — no CSS parser dependency.
 */
function parse(css) {
  const root = { sel: '', decls: [], children: [] }
  const stack = [root]
  let buf = ''
  const flush = () => {
    const d = normDecl(buf)
    if (d) stack[stack.length - 1].decls.push(d)
    buf = ''
  }
  for (const ch of css) {
    if (ch === '{') {
      const node = { sel: normSel(buf), decls: [], children: [] }
      stack[stack.length - 1].children.push(node)
      stack.push(node)
      buf = ''
    } else if (ch === '}') {
      flush()
      if (stack.length > 1) stack.pop()
    } else if (ch === ';') {
      flush()
    } else {
      buf += ch
    }
  }
  flush()
  return root
}

/** True when any rule declares the same property more than once — then order is load-bearing. */
function hasDuplicateProps(node) {
  const props = node.decls.map(d => d.slice(0, d.indexOf(':')).trim()).filter(Boolean)
  if (new Set(props).size !== props.length) return true
  return node.children.some(hasDuplicateProps)
}

/** Canonical form: declarations sorted, children sorted by their own canonical text. */
function canonical(node) {
  const decls = [...node.decls].sort().map(d => `${d};`)
  const kids = node.children.map(canonical).sort()
  const body = [...decls, ...kids].join('\n')
  return node.sel === '' ? body : `${node.sel} {\n${body}\n}`
}

/** Exact form: comments gone, whitespace normalized, order preserved. */
function exact(node) {
  const decls = node.decls.map(d => `${d};`)
  const kids = node.children.map(exact)
  const body = [...decls, ...kids].join('\n')
  return node.sel === '' ? body : `${node.sel} {\n${body}\n}`
}

/**
 * Every `node_modules` from the file's directory up to the repo root — mirrors the
 * `includePaths` in `packages/core/stencil.config.ts`, so bare specifiers like
 * `@helvetia-design/styles/...` resolve the same way they do in the real build.
 */
function loadPaths(file) {
  const paths = []
  const root = resolve(process.cwd())
  let dir = resolve(dirname(file))
  for (;;) {
    const nm = join(dir, 'node_modules')
    if (existsSync(nm)) paths.push(nm)
    if (dir === root || dir === dirname(dir)) break
    dir = dirname(dir)
  }
  return paths
}

function compileFile(file, forFile = file) {
  const args = [file, '--no-source-map', '--style=expanded']
  for (const p of loadPaths(forFile)) args.push(`--load-path=${p}`)
  return execFileSync(SASS, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // stderr piped, not inherited: deprecation warnings stay quiet, real errors still throw with their message.
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

/**
 * Compile the HEAD revision. Written as a sibling of the real file so relative `@use` paths
 * still resolve; a temp dir elsewhere would break them.
 */
function compileHead(file) {
  const head = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const tmp = join(dirname(file), '__scss-neutral-head__.scss')
  try {
    writeFileSync(tmp, head)
    return compileFile(tmp)
  } finally {
    if (existsSync(tmp)) rmSync(tmp)
  }
}

function compare(beforeCss, afterCss) {
  const before = parse(stripNoise(beforeCss))
  const after = parse(stripNoise(afterCss))

  if (exact(before) === exact(after)) return { verdict: 'IDENTICAL' }

  const canonBefore = canonical(before)
  const canonAfter = canonical(after)
  if (canonBefore === canonAfter) {
    if (hasDuplicateProps(before) || hasDuplicateProps(after)) {
      return {
        verdict: 'UNDECIDED',
        note: 'order changed and some rule declares a property twice — sorting could hide a last-one-wins change',
      }
    }
    return { verdict: 'EQUIVALENT' }
  }

  const a = canonBefore.split('\n')
  const b = canonAfter.split('\n')
  const at = a.findIndex((line, i) => line !== b[i])
  return {
    verdict: 'DIFFERENT',
    note: `first difference at canonical line ${at + 1}:\n  HEAD: ${a[at] ?? '<end>'}\n  work: ${b[at] ?? '<end>'}`,
  }
}

function selfTest() {
  const reordered = compare('a{color:red}b{color:blue}', 'b{color:blue}\na{color:red}')
  assert.equal(reordered.verdict, 'EQUIVALENT', 'pure reordering should be EQUIVALENT')

  const same = compare('a{color:red}', 'a{  color : red  }')
  assert.equal(same.verdict, 'IDENTICAL', 'whitespace-only change should be IDENTICAL')

  const changed = compare('a{color:red}', 'a{color:green}')
  assert.equal(changed.verdict, 'DIFFERENT', 'a value change should be DIFFERENT')

  const dup = compare('a{color:red;color:blue}', 'a{color:blue;color:red}')
  assert.equal(dup.verdict, 'UNDECIDED', 'reordered duplicate properties must not pass as equivalent')

  const commented = compare('/* x */a{color:red}', 'a{color:red}/* y */')
  assert.equal(commented.verdict, 'IDENTICAL', 'comments should be ignored')

  console.log('self-test: 5/5 passed')
}

const args = process.argv.slice(2)

if (args.includes('--self-test')) {
  selfTest()
  process.exit(0)
}

if (args.length === 0) {
  console.error('usage: node scripts/assert-scss-neutral.mjs <file.scss>... | --self-test')
  process.exit(2)
}

let failed = false
for (const file of args) {
  const { verdict, note } = compare(compileHead(file), compileFile(file))
  const ok = verdict === 'IDENTICAL' || verdict === 'EQUIVALENT'
  console.log(`${ok ? '✓' : '✗'} ${verdict}  ${file}`)
  if (note) console.log(`  ${note}`)
  if (verdict === 'EQUIVALENT') {
    console.log('  caveat: reordering two equal-specificity selectors is not detected by sorting')
  }
  if (!ok) failed = true
}
process.exit(failed ? 1 : 0)
