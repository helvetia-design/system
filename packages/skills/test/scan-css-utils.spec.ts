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

describe('review findings', () => {
  it('C1: does not take `/*` in HTML markup for a comment', () => {
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

  it('C2: reads Vue class bindings and checks literals in other bound attributes', () => {
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

  it('I1: ignores Object.prototype names in class strings', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<div class="toString constructor __proto__ hasOwnProperty"></div>\n')
    write(root, 'a.ts', "export const x = 'toString constructor'\n")

    expect(scanCssUtils(root)).toEqual({ total: 0, files: [], dynamic: [] })
  })

  it('I2: reports a template literal with a mapped class and a substitution outside a class context', () => {
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

  it('I3: does not take a URL in Vue template text for a comment, and reports a JSX context behind `//`', () => {
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
      { file: 'src/Comp.vue', from: 'radius-normal' },
    ])
    expect(dynamicPlaces(result)).toEqual([
      { file: 'src/App.tsx', line: 1, reason: 'possibly commented' },
      { file: 'src/App.tsx', line: 2, reason: 'possibly commented' },
    ])
  })

  it('I4: reads bare and computed ngClass keys, also in an inline template', () => {
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

  it('I5: rewrites HostBinding and unquoted class, and reports selectors', () => {
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

  it('I6: reports mapped selectors in stylesheets and style blocks, and skips comments', () => {
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

  it('D6: reads the {{ }} interpolation branch of a class attribute', () => {
    const root = createScratchDir()
    write(root, 'a.component.html', '<p class="radius-normal mb-{{ size }} {{ extra }} shadow-small">x</p>\n')

    const result = scanCssUtils(root)

    expect(moves(result).map(({ from }) => from)).toEqual(['radius-normal', 'shadow-small'])
    expect(dynamicPlaces(result)).toEqual([{ file: 'a.component.html', line: 1, reason: 'interpolation' }])
  })
})
