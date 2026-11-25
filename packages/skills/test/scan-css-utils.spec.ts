import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanCssUtils } from '../skills/ds-migrate-from-baloise/scripts/scan-css-utils.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-css-utils-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

type Scan = ReturnType<typeof scanCssUtils>

function moves(result: Scan) {
  return result.files.flatMap(({ file, findings }) =>
    findings.flatMap(({ line, classes }) => classes.map(move => ({ file, line, ...move }))),
  )
}

function dynamicPlaces(result: Scan) {
  return result.dynamic.map(({ file, line, reason }) => ({ file, line, reason }))
}

describe('scanCssUtils', () => {
  it('rewrites HTML class attributes and skips comments', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<!-- <div class="radius-normal"></div> -->',
        '<div class="widescreen:mb-small widescreen-only:flex mb-small">',
        '  <div class="grid is-multiline"><div class="col is-half">x</div></div>',
        '</div>',
        '<script>',
        "  // document.body.classList.add('radius-large')",
        "  document.body.classList.add('radius-large', 'mb-small')",
        '</script>',
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(result.total).toBe(3)
    expect(moves(result)).toEqual([
      { file: 'index.html', line: 2, from: 'widescreen:mb-small', to: 'desktop-lg:mb-small', group: 'variant' },
      { file: 'index.html', line: 2, from: 'widescreen-only:flex', to: null, group: 'lost' },
      { file: 'index.html', line: 3, from: 'grid', to: 'ds-grid', group: 'structure' },
      { file: 'index.html', line: 3, from: 'col', to: 'ds-col', group: 'structure' },
      { file: 'index.html', line: 7, from: 'radius-large', to: 'radius-lg', group: 'renamed' },
    ])
    expect(result.dynamic).toEqual([])
    expect(result.files[0].findings[0].snippet).toBe('<div class="widescreen:mb-small widescreen-only:flex mb-small">')
  })

  it('keeps a variant that the Helvetia grid shares and reports a structure class with a lost modifier as a pair', () => {
    const root = createScratchDir()
    write(
      root,
      'src/Page.tsx',
      [
        'export const Page = () => (',
        '  <div className="container is-detail-page py-large radius-normal">',
        '    <div className="col widescreen:is-half">x</div>',
        '    <div className="container is-fluid">y</div>',
        '  </div>',
        ')',
        '',
      ].join('\n'),
    )

    expect(moves(scanCssUtils(root))).toEqual([
      { file: 'src/Page.tsx', line: 2, from: 'container is-detail-page', to: null, group: 'lost' },
      { file: 'src/Page.tsx', line: 2, from: 'radius-normal', to: 'radius', group: 'renamed' },
      { file: 'src/Page.tsx', line: 3, from: 'col', to: 'ds-col', group: 'structure' },
      { file: 'src/Page.tsx', line: 4, from: 'container', to: 'ds-container', group: 'structure' },
    ])
  })

  it('combines a variant and a base change into one move with the stronger group', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      '<div class="widescreen:flex widescreen:shadow-small hover:border-primary-hovered desktop:w-full"></div>\n',
    )

    expect(moves(scanCssUtils(root)).map(({ from, to, group }) => ({ from, to, group }))).toEqual([
      { from: 'widescreen:flex', to: 'desktop-lg:flex', group: 'variant' },
      { from: 'widescreen:shadow-small', to: 'desktop-lg:shadow', group: 'approximated' },
      { from: 'hover:border-primary-hovered', to: 'hover:border-primary-hover', group: 'renamed' },
      { from: 'desktop:w-full', to: null, group: 'lost' },
    ])
  })

  it('reads Angular bindings, host metadata and inline templates', () => {
    const root = createScratchDir()
    write(
      root,
      'src/app/app.component.html',
      [
        `<div [ngClass]="{ 'mb-small': cond, 'shadow-small': raised }"></div>`,
        `<div [ngClass]="['opacity-40', 'mb-small']" [class]="'radius-large'"></div>`,
        '<div [class.mb-small]="a" [class.radius-normal]="b"></div>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'src/app/app.component.ts',
      [
        '@Component({',
        "  selector: 'app-root',",
        "  host: { class: 'radius-large flex', '[class.shadow-normal]': 'raised' },",
        '  template: `<div class="text-primary-pressed"></div>`,',
        '})',
        'export class AppComponent {}',
        '',
      ].join('\n'),
    )

    expect(moves(scanCssUtils(root)).map(({ file, line, from, to }) => ({ file, line, from, to }))).toEqual([
      { file: 'src/app/app.component.html', line: 1, from: 'shadow-small', to: 'shadow' },
      { file: 'src/app/app.component.html', line: 2, from: 'opacity-40', to: 'opacity-half' },
      { file: 'src/app/app.component.html', line: 2, from: 'radius-large', to: 'radius-lg' },
      { file: 'src/app/app.component.html', line: 3, from: 'radius-normal', to: 'radius' },
      { file: 'src/app/app.component.ts', line: 3, from: 'radius-large', to: 'radius-lg' },
      { file: 'src/app/app.component.ts', line: 3, from: 'shadow-normal', to: 'shadow' },
      { file: 'src/app/app.component.ts', line: 4, from: 'text-primary-pressed', to: 'text-primary' },
    ])
  })

  it('rewrites the static parts of className and reports substitutions, concatenations and other literals', () => {
    const root = createScratchDir()
    write(
      root,
      'src/App.tsx',
      [
        'export const App = ({ extra }) => (',
        '  <div className={`radius-normal mb-${size} ${extra}`}>',
        "    <span className={'shadow-small'}>a</span>",
        "    <span className={'mb-small ' + extra}>b</span>",
        "    <span className={cx('radius-large')}>c</span>",
        '  </div>',
        ')',
        '',
      ].join('\n'),
    )
    write(
      root,
      'src/constants.ts',
      [
        "export const SPACING = 'mt-normal'",
        "export const ROUND = 'radius-normal p-small'",
        "export const LABEL = 'Use the radius-normal class'",
        "// export const OLD = 'radius-large'",
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result).map(({ line, from, to }) => ({ line, from, to }))).toEqual([
      { line: 2, from: 'radius-normal', to: 'radius' },
      { line: 3, from: 'shadow-small', to: 'shadow' },
    ])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'src/App.tsx', line: 2, reason: 'template substitution' },
      { file: 'src/App.tsx', line: 4, reason: 'string concatenation' },
      { file: 'src/App.tsx', line: 5, reason: 'string literal outside a class context' },
      { file: 'src/constants.ts', line: 2, reason: 'string literal outside a class context' },
    ])
  })

  it('scans only the given files and lists unknown paths as unmatched', () => {
    const root = createScratchDir()
    write(root, 'a.html', '<div class="radius-normal"></div>\n')
    write(root, 'b.html', '<div class="radius-large"></div>\n')

    const result = scanCssUtils(root, ['a.html', 'missing.html'])

    expect(result.files.map(file => file.file)).toEqual(['a.html'])
    expect(result.unmatched).toEqual(['missing.html'])
  })

  it('prints JSON with an always present dynamic list', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<div class="mb-small"></div>\n')
    let out = ''

    expect(run(root, { write: (chunk: string) => (out += chunk) } as NodeJS.WritableStream)).toBe(0)
    expect(JSON.parse(out)).toEqual({ total: 0, files: [], dynamic: [] })
  })
})

describe('acceptance projects', () => {
  it('HTML: rewrites four classes, reports the approximation and the lost class, and a second run leaves only the loss', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<div class="widescreen:mb-small radius-normal border-primary-hovered shadow-small">',
        '  <div class="grid is-multiline">',
        '    <span class="is-sr-only">Hidden</span>',
        '  </div>',
        '</div>',
        '',
      ].join('\n'),
    )

    expect(moves(scanCssUtils(root)).map(({ from, to, group }) => ({ from, to, group }))).toEqual([
      { from: 'widescreen:mb-small', to: 'desktop-lg:mb-small', group: 'variant' },
      { from: 'radius-normal', to: 'radius', group: 'renamed' },
      { from: 'border-primary-hovered', to: 'border-primary-hover', group: 'renamed' },
      { from: 'shadow-small', to: 'shadow', group: 'approximated' },
      { from: 'grid', to: 'ds-grid', group: 'structure' },
      { from: 'is-sr-only', to: null, group: 'lost' },
    ])

    write(
      root,
      'index.html',
      [
        '<div class="desktop-lg:mb-small radius border-primary-hover shadow">',
        '  <div class="ds-grid is-multiline">',
        '    <span class="is-sr-only">Hidden</span>',
        '  </div>',
        '</div>',
        '',
      ].join('\n'),
    )

    const second = scanCssUtils(root)
    expect(moves(second).every(move => move.group === 'lost')).toBe(true)
    expect(moves(second).map(move => move.from)).toEqual(['is-sr-only'])
  })

  it('Angular: rewrites ngClass keys and classList arguments', () => {
    const root = createScratchDir()
    write(root, 'src/app/app.component.html', `<div [ngClass]="{ 'mb-small': cond, 'widescreen:flex': wide }"></div>\n`)
    write(
      root,
      'src/app/app.component.ts',
      [
        'export class AppComponent {',
        '  init(el: HTMLElement) {',
        "    el.classList.add('radius-large')",
        '  }',
        '}',
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result).map(({ file, from, to }) => ({ file, from, to }))).toEqual([
      { file: 'src/app/app.component.html', from: 'widescreen:flex', to: 'desktop-lg:flex' },
      { file: 'src/app/app.component.ts', from: 'radius-large', to: 'radius-lg' },
    ])

    write(root, 'src/app/app.component.html', `<div [ngClass]="{ 'mb-small': cond, 'desktop-lg:flex': wide }"></div>\n`)
    write(
      root,
      'src/app/app.component.ts',
      [
        'export class AppComponent {',
        '  init(el: HTMLElement) {',
        "    el.classList.add('radius-lg')",
        '  }',
        '}',
        '',
      ].join('\n'),
    )
    expect(scanCssUtils(root)).toEqual({ total: 0, files: [], dynamic: [] })
  })

  it('React: leaves an identical class in a template literal and reports the literal as dynamic', () => {
    const root = createScratchDir()
    write(
      root,
      'src/App.tsx',
      [
        'export const App = ({ extra }) => <div className={`mb-small ${extra}`} />',
        "export const spacing = 'mt-normal'",
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(result.total).toBe(0)
    expect(dynamicPlaces(result)).toEqual([{ file: 'src/App.tsx', line: 1, reason: 'template substitution' }])
  })
})

describe('markup, bindings and comments', () => {
  it('does not take `/*` in HTML markup for a comment', () => {
    const root = createScratchDir()
    write(
      root,
      'page.html',
      ['<input accept="image/*" alt="a/*b">', '<div class="radius-normal"></div>', ''].join('\n'),
    )

    expect(moves(scanCssUtils(root)).map(({ line, from }) => ({ line, from }))).toEqual([
      { line: 2, from: 'radius-normal' },
    ])
  })

  it('reads Vue class bindings and checks literals in other bound attributes', () => {
    const root = createScratchDir()
    write(
      root,
      'src/Comp.vue',
      [
        '<template>',
        `  <div class="radius-normal" :class="{ 'shadow-small': on, container: wide }"></div>`,
        `  <div v-bind:class="['opacity-40', cls]" :title="'radius-large'" [attr.class]="'text-black'"></div>`,
        '  <div :class="classes"></div>',
        '</template>',
        '<script setup>',
        "const round = 'radius-normal'",
        "const spacing = 'mt-normal'",
        '</script>',
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result).map(({ line, from, to }) => ({ line, from, to }))).toEqual([
      { line: 2, from: 'radius-normal', to: 'radius' },
      { line: 2, from: 'shadow-small', to: 'shadow' },
      { line: 2, from: 'container', to: 'ds-container' },
      { line: 3, from: 'opacity-40', to: 'opacity-half' },
    ])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'src/Comp.vue', line: 3, reason: 'non-literal class binding' },
      { file: 'src/Comp.vue', line: 3, reason: 'string literal outside a class context' },
      { file: 'src/Comp.vue', line: 4, reason: 'non-literal class binding' },
      { file: 'src/Comp.vue', line: 7, reason: 'string literal outside a class context' },
    ])
  })

  it('reads .mts, .cts and .htm files and skips comments in .htm markup', () => {
    const root = createScratchDir()
    write(root, 'src/a.mts', "document.body.classList.add('radius-large')\n")
    write(root, 'src/b.cts', "document.body.classList.add('radius-large')\n")
    write(root, 'page.htm', '<!-- <div class="col"></div> -->\n<div class="grid">x</div>\n')

    expect(moves(scanCssUtils(root))).toEqual([
      { file: 'page.htm', line: 2, from: 'grid', to: 'ds-grid', group: 'structure' },
      { file: 'src/a.mts', line: 1, from: 'radius-large', to: 'radius-lg', group: 'renamed' },
      { file: 'src/b.cts', line: 1, from: 'radius-large', to: 'radius-lg', group: 'renamed' },
    ])
  })

  it('ignores Object.prototype names in class strings', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<div class="toString constructor __proto__ hasOwnProperty"></div>\n')
    write(root, 'a.ts', "export const x = 'toString constructor'\n")

    expect(scanCssUtils(root)).toEqual({ total: 0, files: [], dynamic: [] })
  })

  it('reports a template literal with a mapped class and a substitution outside a class context', () => {
    const root = createScratchDir()
    write(
      root,
      'a.ts',
      ['const t = `radius-normal ${size}`', 'const c = cx(`shadow-small ${x}`)', 'const ok = `mb-small ${x}`', ''].join(
        '\n',
      ),
    )

    expect(dynamicPlaces(scanCssUtils(root))).toEqual([
      { file: 'a.ts', line: 1, reason: 'template substitution' },
      { file: 'a.ts', line: 2, reason: 'template substitution' },
    ])
  })

  it('does not take a URL in Vue or JSX text for a comment, and reports a JSX context behind `//`', () => {
    const root = createScratchDir()
    write(
      root,
      'src/Comp.vue',
      ['<template>', '  <p>See https://x.ch <span class="radius-normal">a</span></p>', '</template>', ''].join('\n'),
    )
    write(
      root,
      'src/App.tsx',
      [
        'export const A = () => <p>Visit https://x.ch <span className="radius-normal">x</span></p>',
        '// <span className="radius-large" />',
        '',
      ].join('\n'),
    )
    write(root, 'src/plain.ts', "// el.classList.add('radius-large')\n")

    const result = scanCssUtils(root)

    expect(moves(result).map(({ file, from }) => ({ file, from }))).toEqual([
      { file: 'src/App.tsx', from: 'radius-normal' },
      { file: 'src/Comp.vue', from: 'radius-normal' },
    ])
    expect(dynamicPlaces(result)).toEqual([{ file: 'src/App.tsx', line: 2, reason: 'possibly commented' }])
  })

  it('reads bare and computed ngClass keys, also in an inline template', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.component.ts',
      [
        '@Component({',
        '  template: `<div [ngClass]="{ container: wide, active: on, [key]: v, ...rest }"></div>`,',
        '})',
        'export class A {}',
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result).map(({ from, to }) => ({ from, to }))).toEqual([{ from: 'container', to: 'ds-container' }])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'src/a.component.ts', line: 2, reason: 'non-literal class binding' },
    ])
  })

  it('rewrites HostBinding and unquoted class, and reports selectors', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.component.ts',
      [
        'export class A {',
        "  @HostBinding('class.grid') grid = true",
        "  el = document.querySelector('.grid > .col')",
        "  key = 'class.container'",
        "  ok = document.querySelector('.mb-small')",
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'src/a.spec.ts', "fixture.debugElement.query(By.css('.container'))\n")
    write(root, 'index.html', '<div class=radius-large></div>\n')

    const result = scanCssUtils(root)

    expect(moves(result).map(({ file, line, from, to }) => ({ file, line, from, to }))).toEqual([
      { file: 'index.html', line: 1, from: 'radius-large', to: 'radius-lg' },
      { file: 'src/a.component.ts', line: 2, from: 'grid', to: 'ds-grid' },
    ])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'src/a.component.ts', line: 3, reason: 'selector' },
      { file: 'src/a.component.ts', line: 4, reason: 'selector' },
      { file: 'src/a.spec.ts', line: 1, reason: 'selector' },
    ])
  })

  it('reports mapped selectors in stylesheets and style blocks, and skips comments', () => {
    const root = createScratchDir()
    write(
      root,
      'src/styles.scss',
      [
        '// .grid',
        '/* .container */',
        '.container.is-fluid { margin: 0 }',
        '.widescreen\\:mb-small { color: red }',
        '.mb-small, .p-normal { color: red }',
        'a { background: url(http://x.ch/a.png) } .shadow-small { color: red }',
        '.btn { @extend .grid; }',
        '',
      ].join('\n'),
    )
    write(root, 'src/plain.css', '// .border-primary-hovered\n')
    write(
      root,
      'src/Comp.vue',
      ['<template><p /></template>', '<style>', '/* .grid */', '.col { gap: 0 }', '</style>', ''].join('\n'),
    )

    expect(dynamicPlaces(scanCssUtils(root))).toEqual([
      { file: 'src/Comp.vue', line: 4, reason: 'selector in a stylesheet' },
      { file: 'src/plain.css', line: 1, reason: 'selector in a stylesheet' },
      { file: 'src/styles.scss', line: 3, reason: 'selector in a stylesheet' },
      { file: 'src/styles.scss', line: 4, reason: 'selector in a stylesheet' },
      { file: 'src/styles.scss', line: 6, reason: 'selector in a stylesheet' },
      { file: 'src/styles.scss', line: 7, reason: 'selector in a stylesheet' },
    ])
  })

  it('reads the {{ }} interpolation branch of a class attribute', () => {
    const root = createScratchDir()
    write(root, 'a.component.html', '<p class="radius-normal mb-{{ size }} {{ extra }} shadow-small">x</p>\n')

    const result = scanCssUtils(root)

    expect(moves(result).map(({ from }) => from)).toEqual(['radius-normal', 'shadow-small'])
    expect(dynamicPlaces(result)).toEqual([{ file: 'a.component.html', line: 1, reason: 'interpolation' }])
  })
})

describe('class contexts on one element', () => {
  it('reports a structure class and its modifier as a lost pair when they sit in different class contexts', () => {
    const root = createScratchDir()
    write(
      root,
      'src/Page.vue',
      ['<template>', `  <div class="container" :class="{ 'is-detail-page': detail }">x</div>`, '</template>', ''].join(
        '\n',
      ),
    )
    write(root, 'src/page.component.html', '<div class="container" [class.is-blog-page]="blog">x</div>\n')

    expect(moves(scanCssUtils(root))).toEqual([
      { file: 'src/page.component.html', line: 1, from: 'container is-blog-page', to: null, group: 'lost' },
      { file: 'src/Page.vue', line: 2, from: 'container is-detail-page', to: null, group: 'lost' },
    ])
  })

  it('keeps separate elements apart', () => {
    const root = createScratchDir()
    write(root, 'a.component.html', '<div class="container"></div><p [class.is-blog-page]="blog"></p>\n')

    expect(moves(scanCssUtils(root))).toEqual([
      { file: 'a.component.html', line: 1, from: 'container', to: 'ds-container', group: 'structure' },
    ])
  })
})

describe('other class attributes', () => {
  it('reads static ngClass, routerLinkActive, active-class and a JSX class object', () => {
    const root = createScratchDir()
    write(
      root,
      'tpl/attrs.component.html',
      ['<div ngClass="grid">x</div>', '<a routerLinkActive="shadow-small">x</a>', ''].join('\n'),
    )
    write(
      root,
      'src/Nav.vue',
      [
        '<template>',
        '  <router-link active-class="shadow-small" exact-active-class="radius-normal">x</router-link>',
        '</template>',
        '',
      ].join('\n'),
    )
    write(root, 'src/j.tsx', 'export const J = () => <div class={{ grid: true }}>x</div>\n')

    const result = scanCssUtils(root)

    expect(moves(result)).toEqual([
      { file: 'src/j.tsx', line: 1, from: 'grid', to: 'ds-grid', group: 'structure' },
      { file: 'src/Nav.vue', line: 2, from: 'shadow-small', to: 'shadow', group: 'approximated' },
      { file: 'src/Nav.vue', line: 2, from: 'radius-normal', to: 'radius', group: 'renamed' },
      { file: 'tpl/attrs.component.html', line: 1, from: 'grid', to: 'ds-grid', group: 'structure' },
      { file: 'tpl/attrs.component.html', line: 2, from: 'shadow-small', to: 'shadow', group: 'approximated' },
    ])
    expect(result.dynamic).toEqual([])
  })
})

describe('class bindings that read a value', () => {
  it('reports a lookup key or call argument instead of rewriting it', () => {
    const root = createScratchDir()
    write(
      root,
      'src/lookup.component.html',
      [`<div [ngClass]="classMap['container']">x</div>`, `<div [class]="theme('grid')">x</div>`, ''].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result)).toEqual([])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'src/lookup.component.html', line: 1, reason: 'non-literal class binding' },
      { file: 'src/lookup.component.html', line: 2, reason: 'non-literal class binding' },
    ])
  })

  it('still reads literals in a ternary', () => {
    const root = createScratchDir()
    write(root, 'a.component.html', `<div [ngClass]="wide ? 'container' : 'grid'">x</div>\n`)

    expect(moves(scanCssUtils(root)).map(({ from }) => from)).toEqual(['container', 'grid'])
  })
})

describe('HTML comment markers in script strings', () => {
  it('keeps scanning after a string that holds an unclosed <!--', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.ts',
      ["const open = '<!--'", 'const tpl = `<div class="grid"></div>`', "el.className = 'container'", ''].join('\n'),
    )

    expect(moves(scanCssUtils(root)).map(({ line, from }) => ({ line, from }))).toEqual([
      { line: 2, from: 'grid' },
      { line: 3, from: 'container' },
    ])
  })
})

describe('places a rewrite would break', () => {
  it('does not rename a literal glued to a concatenated suffix, in className or classList', () => {
    const root = createScratchDir()
    write(
      root,
      'src/a.tsx',
      [
        "export const A = () => <div className={'bg-light-blue' + (shade ? '-' + shade : '')} />",
        "export const B = () => <div className={'grid ' + extra} />",
        "el.classList.add('bg-light-blue' + x)",
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result).map(({ line, from }) => ({ line, from }))).toEqual([{ line: 2, from: 'grid' }])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'src/a.tsx', line: 1, reason: 'string concatenation' },
      { file: 'src/a.tsx', line: 2, reason: 'string concatenation' },
      { file: 'src/a.tsx', line: 3, reason: 'string concatenation' },
    ])
  })

  it('reports tag-qualified and compound selectors, but not dotted keys', () => {
    const root = createScratchDir()
    write(root, 'src/a.scss', ['div.grid { color: red }', '.card.container {}', ''].join('\n'))
    write(
      root,
      'src/b.ts',
      [
        "document.querySelector('div.grid')",
        "t('nav.grid.title')",
        "document.querySelector('.card.container')",
        '',
      ].join('\n'),
    )

    expect(dynamicPlaces(scanCssUtils(root))).toEqual([
      { file: 'src/a.scss', line: 1, reason: 'selector in a stylesheet' },
      { file: 'src/a.scss', line: 2, reason: 'selector in a stylesheet' },
      { file: 'src/b.ts', line: 1, reason: 'selector' },
      { file: 'src/b.ts', line: 3, reason: 'selector' },
    ])
  })

  it('pairs class contexts on one element when an attribute value holds `<`', () => {
    const root = createScratchDir()
    write(
      root,
      'a.vue',
      `<template><div v-if="a < b" class="container" :class="{ 'is-detail-page': detail }"></div></template>\n`,
    )

    expect(moves(scanCssUtils(root)).map(({ from, group }) => ({ from, group }))).toEqual([
      { from: 'container is-detail-page', group: 'lost' },
    ])
  })

  it('reports a mapped object key inside a className call', () => {
    const root = createScratchDir()
    write(root, 'src/a.tsx', "export const A = () => <div className={cx('foo', { container: wide })} />\n")

    expect(dynamicPlaces(scanCssUtils(root))).toEqual([
      { file: 'src/a.tsx', line: 1, reason: 'non-literal class binding' },
    ])
  })

  it('lists the mapped classes of an object key inside a className call, and only there', () => {
    const root = createScratchDir()
    write(root, 'src/a.tsx', 'export const A = () => <div className={cx({ grid: on, table: t })} />\n')
    write(root, 'src/b.html', '<div [ngClass]="classes"></div>\n')

    expect(scanCssUtils(root).dynamic.map(({ file, line, classes }) => ({ file, line, classes }))).toEqual([
      {
        file: 'src/a.tsx',
        line: 1,
        classes: [
          { from: 'grid', to: 'ds-grid', group: 'structure' },
          { from: 'table', to: 'ds-table', group: 'core' },
        ],
      },
      { file: 'src/b.html', line: 1, classes: undefined },
    ])
  })

  it('skips line comments in a Vue SCSS style block', () => {
    const root = createScratchDir()
    write(root, 'a.vue', ['<style lang="scss">', '// old: .grid was used here', '.y {}', '</style>', ''].join('\n'))

    expect(scanCssUtils(root).dynamic).toEqual([])
  })

  it('reports an object inside a ternary class binding', () => {
    const root = createScratchDir()
    write(root, 'a.html', `<div [ngClass]="cond ? { grid: true } : 'col'"></div>\n`)

    const result = scanCssUtils(root)
    expect(moves(result).map(({ from, to }) => ({ from, to }))).toEqual([{ from: 'col', to: 'ds-col' }])
    expect(dynamicPlaces(result)).toEqual([{ file: 'a.html', line: 1, reason: 'non-literal class binding' }])
  })

  it('reports a shorthand object key instead of moving it', () => {
    const root = createScratchDir()
    write(root, 'a.vue', '<template><div :class="{ grid }"></div></template>\n')

    const result = scanCssUtils(root)
    expect(moves(result)).toEqual([])
    expect(dynamicPlaces(result)).toEqual([{ file: 'a.vue', line: 1, reason: 'non-literal class binding' }])
  })

  it('keeps reading code literals after an apostrophe in JSX text', () => {
    const root = createScratchDir()
    write(root, 'src/a.tsx', "export const A = () => <><p>It's here</p><div className={clsx('container')} /></>\n")

    expect(dynamicPlaces(scanCssUtils(root))).toEqual([
      { file: 'src/a.tsx', line: 1, reason: 'string literal outside a class context' },
    ])
  })

  it('keeps reading code literals after a string that holds HTML', () => {
    const root = createScratchDir()
    write(root, 'src/a.js', "const tpl = '<span>Hi</span>'; const c = 'grid'\n")

    expect(dynamicPlaces(scanCssUtils(root))).toEqual([
      { file: 'src/a.js', line: 1, reason: 'string literal outside a class context' },
    ])
  })

  it('skips a nested brace inside a template substitution', () => {
    const root = createScratchDir()
    write(root, 'src/a.tsx', 'export const A = () => <div className={`${f({ k: 1 }) ? cls : grid } col`} />\n')

    expect(moves(scanCssUtils(root)).map(({ from }) => from)).toEqual(['col'])
  })

  it('reads a stylesheet selector after a protocol-relative url', () => {
    const root = createScratchDir()
    write(root, 'a.scss', '.x { background: url(//cdn.x/a.png); } .grid {}\n')

    expect(dynamicPlaces(scanCssUtils(root))).toEqual([{ file: 'a.scss', line: 1, reason: 'selector in a stylesheet' }])
  })

  it('does not move a literal that a binding compares or tests', () => {
    const root = createScratchDir()
    write(
      root,
      'a.component.html',
      [
        `<div [ngClass]="mode === 'grid' ? 'grid' : 'list'"></div>`,
        `<div :class="[view !== 'container' ? '' : 'container']"></div>`,
        '',
      ].join('\n'),
    )
    write(root, 'b.tsx', "export const B = () => <div className={'grid ' + (mode == 'col' ? 'col' : '')} />\n")
    write(root, 'c.ts', "el.classList.toggle('grid', layout === 'col')\n")

    expect(moves(scanCssUtils(root)).map(({ file, line, from }) => ({ file, line, from }))).toEqual([
      { file: 'a.component.html', line: 1, from: 'grid' },
      { file: 'a.component.html', line: 1, from: 'list' },
      { file: 'a.component.html', line: 2, from: 'container' },
      { file: 'b.tsx', line: 1, from: 'grid' },
      { file: 'b.tsx', line: 1, from: 'col' },
      { file: 'c.ts', line: 1, from: 'grid' },
    ])
  })

  it('does not take an unclosed `/*` in JSX text or a regex for a comment', () => {
    const root = createScratchDir()
    write(
      root,
      'a.tsx',
      ['export const A = () => <p>Upload to /tmp/* here</p>', '<span className="grid" />', ''].join('\n'),
    )
    write(root, 'b.ts', ['const re = /^\\/*/', "el.classList.add('container')", ''].join('\n'))

    expect(moves(scanCssUtils(root)).map(({ file, line, from }) => ({ file, line, from }))).toEqual([
      { file: 'a.tsx', line: 2, from: 'grid' },
      { file: 'b.ts', line: 2, from: 'container' },
    ])
  })

  it('reads `/*` in JSX text as text and reports a JSX class context inside a block comment', () => {
    const root = createScratchDir()
    write(
      root,
      'a.tsx',
      [
        'export const A = () => <p>From /tmp/* <span className="grid" /> to */x</p>',
        'export const B = () => <p>{/* <span className="container" /> */}</p>',
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)
    expect(moves(result).map(({ line, from }) => ({ line, from }))).toEqual([{ line: 1, from: 'grid' }])
    expect(dynamicPlaces(result)).toEqual([{ file: 'a.tsx', line: 2, reason: 'possibly commented' }])
  })

  it('reports a class after `//` in an unclosed JSX element instead of dropping it', () => {
    const root = createScratchDir()
    write(root, 'a.tsx', 'export const A = () => <p>see http://x <span className="grid" />\n')

    const result = scanCssUtils(root)
    expect(moves(result)).toEqual([])
    expect(dynamicPlaces(result)).toEqual([{ file: 'a.tsx', line: 1, reason: 'possibly commented' }])
  })

  it('builds the snippet once per line', { timeout: 30_000 }, () => {
    const root = createScratchDir()
    write(root, 'a.html', '<div class="grid"></div>'.repeat(20000))

    const result = scanCssUtils(root)
    expect(result.files[0].findings).toHaveLength(1)
    expect(result.files[0].findings[0].classes).toHaveLength(20000)
  })

  it('does not read a `/*` or `//` in a regex as a comment when a later comment closes it', () => {
    const root = createScratchDir()
    write(
      root,
      'a.ts',
      [
        "const trimmed = url.replace(/\\/*$/, '')",
        "el.classList.add('container')",
        'const re = /https?:\\/\\//; const t = { template: \'<div class="grid"></div>\' }',
        '/** Doc. */',
        '',
      ].join('\n'),
    )

    expect(moves(scanCssUtils(root)).map(({ line, from }) => ({ line, from }))).toEqual([
      { line: 2, from: 'container' },
      { line: 3, from: 'grid' },
    ])
  })

  it('rewrites class attributes with escaped quotes inside a JS string', () => {
    const root = createScratchDir()
    write(root, 'a.ts', 'el.innerHTML = "<div class=\\"grid\\"><span class=\\"shadow-small\\"></span></div>"\n')

    const result = scanCssUtils(root)
    expect(moves(result).map(({ from, to }) => ({ from, to }))).toEqual([
      { from: 'grid', to: 'ds-grid' },
      { from: 'shadow-small', to: 'shadow' },
    ])
    expect(result.dynamic).toEqual([])
  })

  it('reports component class inputs and Vue `v-bind` objects', () => {
    const root = createScratchDir()
    write(
      root,
      'a.vue',
      [
        '<template>',
        '  <p-panel styleClass="shadow-small"></p-panel>',
        '  <my-card body-class="container"></my-card>',
        '  <my-card body-class="mt-normal"></my-card>',
        `  <div v-bind="{ class: 'grid' }"></div>`,
        '</template>',
        '',
      ].join('\n'),
    )
    write(root, 'b.ts', "const panelClass = 'mt-normal'\n")

    const result = scanCssUtils(root)
    expect(moves(result)).toEqual([])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'a.vue', line: 2, reason: 'class input' },
      { file: 'a.vue', line: 3, reason: 'class input' },
      { file: 'a.vue', line: 5, reason: 'string literal outside a class context' },
    ])
  })

  it('renames core.css classes in class contexts and reports those without counterpart as core-lost', () => {
    const root = createScratchDir()
    write(
      root,
      'a.component.html',
      [
        '<table class="table is-striped is-hoverable w-full"></table>',
        '<a class="link" routerLink="/">Home</a>',
        '<div class="file"><input class="file-input" type="file" /></div>',
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)
    expect(moves(result).map(({ line, from, to, group }) => ({ line, from, to, group }))).toEqual([
      { line: 1, from: 'table', to: 'ds-table', group: 'core' },
      { line: 2, from: 'link', to: 'ds-link', group: 'core' },
      { line: 3, from: 'file', to: null, group: 'core-lost' },
      { line: 3, from: 'file-input', to: null, group: 'core-lost' },
    ])
    expect(result.dynamic).toEqual([])
  })

  it('reports a core.css class with a modifier its counterpart lacks as a core-lost pair, and the modifier alone not at all', () => {
    const root = createScratchDir()
    write(
      root,
      'a.tsx',
      [
        'export const A = () => <table className="table is-bordered" />',
        'export const B = () => <div className="field has-addons" />',
        'export const C = () => <li className="is-selected is-bordered" />',
        '',
      ].join('\n'),
    )

    expect(moves(scanCssUtils(root)).map(({ line, from, to, group }) => ({ line, from, to, group }))).toEqual([
      { line: 1, from: 'table is-bordered', to: null, group: 'core-lost' },
      { line: 2, from: 'field has-addons', to: null, group: 'core-lost' },
    ])
  })

  it('does not report a code literal that holds only core.css classes', () => {
    const root = createScratchDir()
    write(
      root,
      'a.ts',
      [
        "const type = 'button'",
        "const variants = ['button', 'reset', 'submit']",
        "const icon = { name: 'file' }",
        'const text = `${option?.label} link`',
        "t('header.title') + t('nav.grid.title')",
        '',
      ].join('\n'),
    )
    write(root, 'b.component.html', `<ds-button [color]="'link'"></ds-button>\n`)

    expect(scanCssUtils(root)).toEqual({ total: 0, files: [], dynamic: [] })
  })

  it('marks dynamic places whose only mapped classes are core.css classes with the core group', () => {
    const root = createScratchDir()
    write(root, 'a.scss', ['.table td { padding: 0 }', '.grid .link {}', '.shadow-small {}', ''].join('\n'))
    write(
      root,
      'b.ts',
      ["document.querySelector('.table')", "const round = 'radius-normal button'", "el.closest('.grid')", ''].join(
        '\n',
      ),
    )
    write(root, 'c.vue', '<template><my-card body-class="title"></my-card></template>\n')

    expect(scanCssUtils(root).dynamic.map(({ file, line, reason, group }) => ({ file, line, reason, group }))).toEqual([
      { file: 'a.scss', line: 1, reason: 'selector in a stylesheet', group: 'core' },
      { file: 'a.scss', line: 2, reason: 'selector in a stylesheet', group: undefined },
      { file: 'a.scss', line: 3, reason: 'selector in a stylesheet', group: undefined },
      { file: 'b.ts', line: 1, reason: 'selector', group: 'core' },
      { file: 'b.ts', line: 2, reason: 'string literal outside a class context', group: undefined },
      { file: 'b.ts', line: 3, reason: 'selector', group: undefined },
      { file: 'c.vue', line: 1, reason: 'class input', group: 'core' },
    ])
  })

  it('drops the core group when a merged place also names a non-core class', () => {
    const root = createScratchDir()
    write(root, 'a.scss', '.link .grid {}\n')
    write(root, 'b.ts', "document.querySelector('div.grid')\n")

    expect(scanCssUtils(root).dynamic.map(({ file, line, reason, group }) => ({ file, line, reason, group }))).toEqual([
      { file: 'a.scss', line: 1, reason: 'selector in a stylesheet', group: undefined },
      { file: 'b.ts', line: 1, reason: 'selector', group: undefined },
    ])
  })

  it('marks an object key in a className call with the core group only when every key is a core.css class', () => {
    const root = createScratchDir()
    write(
      root,
      'a.tsx',
      [
        'export const A = () => <div className={cx({ table: a })} />',
        'export const B = () => <div className={cx({ table: a, grid: b })} />',
        '',
      ].join('\n'),
    )

    expect(scanCssUtils(root).dynamic.map(({ line, reason, group }) => ({ line, reason, group }))).toEqual([
      { line: 1, reason: 'non-literal class binding', group: 'core' },
      { line: 2, reason: 'non-literal class binding', group: undefined },
    ])
  })

  it('renames a core.css class in a conditional className expression', () => {
    const root = createScratchDir()
    write(root, 'a.tsx', "export const A = () => <div className={ok ? 'table' : ''} />\n")

    const result = scanCssUtils(root)
    expect(moves(result)).toEqual([{ file: 'a.tsx', line: 1, from: 'table', to: 'ds-table', group: 'core' }])
    expect(result.dynamic).toEqual([])
  })

  it('marks an interpolation or substitution whose literals name a core.css class with core, not the core group', () => {
    const root = createScratchDir()
    write(root, 'a.component.html', `<table class="{{ striped ? 'table is-striped' : 'table' }}"></table>\n`)
    write(
      root,
      'b.tsx',
      [
        "export const B = () => <table className={`${s ? 'table is-striped' : 'table'}`} />",
        "export const C = () => <div className={`${mode === 'grid' ? 'mb-small' : ''}`} />",
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result)).toEqual([])
    expect(result.dynamic.map(({ file, line, reason, group, core }) => ({ file, line, reason, group, core }))).toEqual([
      { file: 'a.component.html', line: 1, reason: 'interpolation', group: undefined, core: true },
      { file: 'b.tsx', line: 1, reason: 'template substitution', group: undefined, core: true },
      { file: 'b.tsx', line: 2, reason: 'template substitution', group: undefined, core: undefined },
    ])
  })

  it('reads HostBinding class, Renderer2 addClass and setAttribute class like classList', () => {
    const root = createScratchDir()
    write(
      root,
      'a.component.ts',
      [
        'export class A {',
        "  @HostBinding('class') cls = 'table'",
        "  @HostBinding('class')",
        "  other = 'radius-large'",
        '  constructor(renderer: Renderer2, el: ElementRef) {',
        "    renderer.addClass(el.nativeElement, 'link')",
        "    renderer.setAttribute(el.nativeElement, 'class', 'button')",
        "    el.nativeElement.setAttribute('class', 'field')",
        "    el.nativeElement.setAttribute('type', 'button')",
        '  }',
        '}',
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(moves(result).map(({ line, from, to, group }) => ({ line, from, to, group }))).toEqual([
      { line: 2, from: 'table', to: 'ds-table', group: 'core' },
      { line: 4, from: 'radius-large', to: 'radius-lg', group: 'renamed' },
      { line: 6, from: 'link', to: 'ds-link', group: 'core' },
      { line: 7, from: 'button', to: 'ds-button', group: 'core' },
      { line: 8, from: 'field', to: 'ds-field', group: 'core' },
    ])
    expect(result.dynamic).toEqual([])
  })

  it('reads quoted object keys in a className call and marks a mixed place with core, without the core group that would free the utilities line', () => {
    const root = createScratchDir()
    write(
      root,
      'a.tsx',
      [
        "export const A = () => <div className={cx({ 'table': a })} />",
        'export const B = () => <div className={cx({ "table": a, grid: b })} />',
        "const mixed = 'table shadow-small'",
        '',
      ].join('\n'),
    )

    const result = scanCssUtils(root)

    expect(
      result.dynamic.map(({ line, reason, group, core, classes }) => ({ line, reason, group, core, classes })),
    ).toEqual([
      {
        line: 1,
        reason: 'non-literal class binding',
        group: 'core',
        core: undefined,
        classes: [{ from: 'table', to: 'ds-table', group: 'core' }],
      },
      {
        line: 2,
        reason: 'non-literal class binding',
        group: undefined,
        core: true,
        classes: [
          { from: 'table', to: 'ds-table', group: 'core' },
          { from: 'grid', to: 'ds-grid', group: 'structure' },
        ],
      },
      { line: 3, reason: 'string literal outside a class context', group: undefined, core: true, classes: undefined },
    ])
  })
})
