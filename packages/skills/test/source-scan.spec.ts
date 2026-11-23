import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  endOfString,
  lineAt,
  lineIndex,
  maskComments,
  scanSourceFiles,
} from '../skills/ds-migrate-from-baloise/scripts/source-scan.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-source-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

function masked(rel: string, contents: string) {
  const root = createScratchDir()
  write(root, rel, contents)
  const result: string[] = []
  scanSourceFiles(root, (source: { masked: string }) => result.push(source.masked), {
    extensions: new Set([extname(rel)]),
  })
  return result[0]
}

const gap = (text: string) => ' '.repeat(text.length)

function maskedFiles(root: string) {
  const masked: Record<string, string> = {}
  scanSourceFiles(root, (source: { file: string; masked: string }) => {
    masked[source.file] = source.masked
  })
  return masked
}

describe('maskComments', () => {
  it('keeps `//` inside a string and blanks a real line comment', () => {
    const text = "const url = 'https://x.ch' // note"
    expect(maskComments(text, 'script')).toBe("const url = 'https://x.ch'        ")
  })

  it('keeps every string and blanks block and HTML comments in script', () => {
    const text = 'const a = "/* no */" /* yes */ + `<!-- gone --> kept`'
    expect(maskComments(text, 'script')).toBe(`const a = "/* no */"${' '.repeat(11)}+ \`${' '.repeat(13)} kept\``)
  })

  it('treats only `<!--` as a comment in HTML markup outside script and style', () => {
    const text = '<input accept="image/*"><p>a // b</p><!-- c --><div class="x"></div>'
    expect(maskComments(text, 'markup')).toBe('<input accept="image/*"><p>a // b</p>          <div class="x"></div>')
  })

  it('applies script and style rules inside their blocks only', () => {
    const text = '<p>https://x.ch</p><script>const a = 1 // c\n</script><style>/* s */ .a {}</style>'
    expect(maskComments(text, 'markup')).toBe(
      '<p>https://x.ch</p><script>const a = 1     \n</script><style>        .a {}</style>',
    )
  })

  it('keeps a URL in Vue template text', () => {
    const text = '<template><p>See https://x.ch <span class="a">b</span></p></template>'
    expect(maskComments(text, 'markup')).toBe(text)
  })

  it('keeps an unclosed `/*`', () => {
    const text = "const re = /^\\/*/\nel.classList.add('grid')"
    expect(maskComments(text, 'script')).toBe(text)
  })

  it('keeps a `/*` and a `//` inside a regex literal', () => {
    const text = "u.replace(/\\/*$/, '')\nconst re = /https?:\\/\\//\n/** Doc. */"
    expect(maskComments(text, 'script')).toBe(`u.replace(/\\/*$/, '')\nconst re = /https?:\\/\\//\n${' '.repeat(11)}`)
  })

  it('reads a `/` after an operand as division, not as a regex', () => {
    const text = 'const half = total / 2 // note'
    expect(maskComments(text, 'script')).toBe(`const half = total / 2 ${' '.repeat(7)}`)
  })

  it('keeps `//` in JSX text', () => {
    const text = '<p>see http://x <BalButton/></p>'
    expect(maskComments(text, 'jsx')).toBe(text)
    expect(maskComments(text, 'script')).toBe(`<p>see http:${gap('//x <BalButton/></p>')}`)
  })

  it('reads `//` as a comment in SCSS but not in CSS or after a colon', () => {
    expect(maskComments('// .a\nb { c: url(http://x) }', 'scss')).toBe('     \nb { c: url(http://x) }')
    expect(maskComments('// .a', 'css')).toBe('// .a')
  })
})

describe('masked source', () => {
  it('keeps an apostrophe in HTML text', () => {
    const text = "<p>Don't panic <bal-button>x</bal-button></p>"
    expect(masked('a.html', text)).toBe(text)
  })

  it('keeps apostrophes of several languages in HTML text', () => {
    const text = [
      "<p>l'assurance <bal-tag>a</bal-tag> dell'anno <bal-card></bal-card></p>",
      "<p>Don't <bal-button>x</bal-button> c'est <bal-badge>1</bal-badge></p>",
      '',
    ].join('\n')
    expect(masked('a.html', text)).toBe(text)
  })

  it('blanks HTML comments, attribute values and strings in interpolation only', () => {
    const text = `<!-- <bal-button> --><bal-tag title="it's">{{ 'key' | translate }} {{ '<bal-card>' }}</bal-tag>`
    expect(masked('a.html', text)).toBe(
      `${gap('<!-- <bal-button> -->')}<bal-tag title=${gap('"it\'s"')}>{{ ${gap("'key'")} | translate }} {{ ${gap("'<bal-card>'")} }}</bal-tag>`,
    )
  })

  it('keeps an apostrophe in an inline Angular template', () => {
    const text =
      '@Component({ template: `<p>Don\'t forget</p> <bal-button>Save</bal-button> <bal-tag class="a">x</bal-tag>` })'
    expect(masked('a.component.ts', text)).toBe(text.replace('"a"', gap('"a"')))
  })

  it('blanks strings in an inline Angular template interpolation only', () => {
    const text = "@Component({ template: `<p>{{ 'key' | translate }} Don't</p><bal-button>x</bal-button>` })"
    expect(masked('a.component.ts', text)).toBe(text.replace("'key'", gap("'key'")))
  })

  it('keeps `//` in JSX text', () => {
    const text = 'const A = () => <p>see http://x <BalButton/></p>'
    expect(masked('a.tsx', text)).toBe(text)
    expect(masked('a.js', text)).toBe(text)
  })

  it('keeps an apostrophe and `//` in multi-line JSX children', () => {
    const text = "function A() {\n  return (\n    <p>\n      Don't see http://x\n      <BalButton/>\n    </p>\n  )\n}\n"
    expect(masked('a.tsx', text)).toBe(text)
  })

  it('reads a regex literal with a quote as a regex', () => {
    expect(masked('a.tsx', 'const r = /"/; <BalButton/>')).toBe('const r = /"/; <BalButton/>')
    const text = 'const r = /"/; const B = () => <BalButton/>'
    expect(masked('a.tsx', text)).toBe(text)
  })

  it('reads script blocks in markup as code and their JSX by `lang`', () => {
    const vue =
      '<script lang="tsx">\nconst A = () => <p>Don\'t http://x <BalButton/></p>\n</script>\n<template><p>l\'x <bal-tag/></p></template>\n'
    expect(masked('a.vue', vue)).toBe(vue.replace('"tsx"', gap('"tsx"')))
    const html = "<script>const x = '<bal-a>' // <bal-c>\n</script><p>it's <bal-b/></p>"
    expect(masked('a.html', html)).toBe(
      `<script>const x = ${gap("'<bal-a>'")} ${gap('// <bal-c>')}\n</script><p>it's <bal-b/></p>`,
    )
  })

  it('reads JSX expressions as code', () => {
    const text =
      "const A = () => <p className=\"x\">{cond ? 'a' : '<bal-button>'} {/* <BalCard/> */} <bal-tag>x</bal-tag></p>"
    expect(masked('a.tsx', text)).toBe(
      `const A = () => <p className=${gap('"x"')}>{cond ? ${gap("'a'")} : ${gap("'<bal-button>'")}} {${gap('/* <BalCard/> */')}} <bal-tag>x</bal-tag></p>`,
    )
  })

  it('keeps TS generics and comparisons as code', () => {
    const text = [
      'const f = <T,>(x: T) => x // <BalButton/>',
      'type F = (g: <T>(x: T) => T) => void',
      "const s = '<bal-tag>'",
      '',
    ].join('\n')
    expect(masked('a.tsx', text)).toBe(
      [
        'const f = <T,>(x: T) => x ' + gap('// <BalButton/>'),
        'type F = (g: <T>(x: T) => T) => void',
        `const s = ${gap("'<bal-tag>'")}`,
        '',
      ].join('\n'),
    )
    expect(masked('a.ts', "if (a < b) x = '<bal-button>'")).toBe(`if (a < b) x = ${gap("'<bal-button>'")}`)
  })

  it('reads a generic call signature in a function body as code without rescanning the file', () => {
    const fn = 'export function f() {\n  const id: <T>(x: T) => T = x => x\n  return id\n}\n'
    const text = `${fn.repeat(500)}const s = '<bal-button>'`
    const started = performance.now()
    const result = masked('a.tsx', text)
    expect(performance.now() - started).toBeLessThan(2000)
    expect(result).toBe(`${fn.repeat(500)}const s = ${gap("'<bal-button>'")}`)
  })

  it('stops reading `<` as JSX once unbalanced braces use up the budget', () => {
    const text = `${'x = (<a>{\n'.repeat(3000)}const s = '<bal-button>'`
    const started = performance.now()
    const result = masked('a.tsx', text)
    expect(performance.now() - started).toBeLessThan(2000)
    expect(result).toHaveLength(text.length)
  })

  it('keeps code after a template literal whose substitution nests a template with an apostrophe', () => {
    const text = [
      'const note = `',
      "  ${ready ? `it's here` : ''}",
      '`',
      'export const A = () => <BalInput label="x" />',
      'const ref = useRef<HTMLBalInputElement>(null)',
      '',
    ].join('\n')
    const result = masked('a.tsx', text)
    expect(result).toContain('<BalInput label=')
    expect(result).toContain('useRef<HTMLBalInputElement>(null)')
  })

  it('reads a quote as an attribute value delimiter only after `=`', () => {
    const text =
      "<bal-input placeholder=l'adresse></bal-input>\n<bal-button>x</bal-button>\n<p title=\"it's\">C'est</p>"
    expect(masked('a.html', text)).toBe(text.replace('"it\'s"', gap('"it\'s"')))
  })

  it('keeps indices aligned after a blanked emoji', () => {
    const text = "const s = '\u{1F600}'; const t = 1"
    const result = masked('a.ts', text)
    expect(result).toHaveLength(text.length)
    expect(result.indexOf('const t')).toBe(text.indexOf('const t'))
  })

  it('masks many unclosed `<` runs without overflowing the stack', () => {
    const line = "x = (<div>text {y} '<bal-tag>'\n"
    const text = `${line.repeat(5000)}// <BalCard/>\nconst s = '<bal-button>'`
    const result = masked('a.jsx', text)
    expect(result).toHaveLength(text.length)
    expect(result).not.toContain('<BalCard')
    expect(result).not.toContain('<bal-button>')
    expect(result.slice(0, line.length)).toBe(`x = (<div>text {y} ${gap("'<bal-tag>'")}\n`)
  })

  it('reads many generic call signatures in TSX as code without retrying each `<`', () => {
    const hook = 'export function useN() {\n  const run: <T>(value: T) => T = v => v\n  return run\n}\n'
    const text = `${hook.repeat(60)}const s = '<bal-button>'`
    const started = performance.now()
    const result = masked('a.tsx', text)
    expect(performance.now() - started).toBeLessThan(2000)
    expect(result).toBe(`${hook.repeat(60)}const s = ${gap("'<bal-button>'")}`)
  })
})

describe('endOfString', () => {
  it('skips nested strings in a substitution only when asked', () => {
    const text = '`a ${"`"} b` rest'
    expect(endOfString(text, 0)).toBe(7)
    expect(endOfString(text, 0, true)).toBe(12)
  })
})

describe('scanSourceFiles masked text', () => {
  it('masks a Vue file as markup outside <script> and as script inside it', () => {
    const root = createScratchDir()
    const template = '<template>\n  <p>a // <bal-button>Go</bal-button></p>\n</template>\n'
    write(root, 'g.vue', `${template}<script setup>\n// <bal-button>\n/* <bal-tag> */\nconst a = 1\n</script>\n`)

    expect(maskedFiles(root)['g.vue']).toBe(
      `${template}<script setup>\n${' '.repeat(15)}\n${' '.repeat(15)}\nconst a = 1\n</script>\n`,
    )
  })

  it('masks a Vue template that follows a <script> block as markup', () => {
    const root = createScratchDir()
    const template = '<template>\n  <p>a // b</p><bal-button>Go</bal-button><!-- x -->\n</template>\n'
    write(root, 'g.vue', `<script setup>\n// x\n</script>\n${template}<script>\n// y\n</script>\n`)

    expect(maskedFiles(root)['g.vue']).toBe(
      `<script setup>\n    \n</script>\n${template.replace('<!-- x -->', ' '.repeat(10))}<script>\n    \n</script>\n`,
    )
  })

  it('keeps a Vue template tag after text such as image/*', () => {
    const root = createScratchDir()
    const text = '<template>\n  <p>Accepted: image/*</p>\n  <bal-button>x</bal-button>\n</template>\n'
    write(root, 'g.vue', text)

    expect(maskedFiles(root)['g.vue']).toBe(text)
  })

  it('masks // comments in a Vue <style lang="scss"> block and keeps the url', () => {
    const root = createScratchDir()
    write(root, 'g.vue', '<style lang="scss">\n// <bal-button>\na { b: url(//x) }\n</style>\n')

    expect(maskedFiles(root)['g.vue']).toBe(
      `<style lang=${gap('"scss"')}>\n${' '.repeat(15)}\na { b: url(//x) }\n</style>\n`,
    )
  })

  it('does not treat a Vue element named script-loader as a script block', () => {
    const root = createScratchDir()
    const text = '<template><script-loader>a // b</script-loader></template>\n'
    write(root, 'g.vue', text)

    expect(maskedFiles(root)['g.vue']).toBe(text)
  })

  it('masks a .htm file like a .html file', () => {
    const root = createScratchDir()
    const text = '<p>a // <bal-button>b</bal-button></p><!-- <bal-tag> -->\n'
    write(root, 'a.html', text)
    write(root, 'a.htm', text)

    const masked = maskedFiles(root)
    expect(masked['a.htm']).toBe(`<p>a // <bal-button>b</bal-button></p>${' '.repeat(18)}\n`)
    expect(masked['a.htm']).toBe(masked['a.html'])
  })

  it('masks a line comment in a .mjs file', () => {
    const root = createScratchDir()
    write(root, 'a.mjs', '// <bal-button>\nexport const a = 1\n')

    expect(maskedFiles(root)['a.mjs']).toBe(`${' '.repeat(15)}\nexport const a = 1\n`)
  })
})

describe('lineAt and lineIndex', () => {
  const text = 'ab\ncd\n\nef'

  it('numbers lines from 1 and counts a newline character as part of its own line', () => {
    expect(lineAt(text, 0)).toBe(1)
    expect(lineAt(text, 2)).toBe(1)
    expect(lineAt(text, 3)).toBe(2)
    expect(lineAt(text, 5)).toBe(2)
    expect(lineAt(text, 6)).toBe(3)
    expect(lineAt(text, 7)).toBe(4)
    expect(lineAt(text, text.length)).toBe(4)
  })

  it('counts an emoji as two UTF-16 units', () => {
    const emoji = 'a\u{1F600}\nb'
    expect(lineAt(emoji, emoji.indexOf('b'))).toBe(2)
    expect(lineAt(emoji, 3)).toBe(1)
    expect(lineAt(emoji, 4)).toBe(2)
  })

  it('rebuilds the index when the text changes', () => {
    const other = 'x\ny\nz\n'
    expect(lineAt(text, 7)).toBe(4)
    expect(lineAt(other, 4)).toBe(3)
    expect(lineAt(text, 7)).toBe(4)
  })

  it('returns the same lines from lineIndex', () => {
    const lookup = lineIndex(text)
    expect([0, 2, 3, 6, 7].map(lookup)).toEqual([1, 1, 2, 3, 4])
  })
})
