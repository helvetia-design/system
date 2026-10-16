import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalNavbar } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-navbar.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-navbar-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalNavbar', () => {
  it('lists React tags, children and the import symbols and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalNavbar, BalNavbarBrand, BalNavbarMenu } from '@baloise/ds-react'",
        "const _note = 'bal-navbar'",
        "const _example = '<BalNavbar light></BalNavbar>'",
        'const _markup = `<BalNavbarMenuStart />`',
        'const _trailing = true // <BalNavbar />',
        'const _hidden = /* <bal-navbar></bal-navbar> */ null',
        'export function App() {',
        '  return (',
        '    <BalNavbar light>',
        '      <BalNavbarBrand href="/">Home</BalNavbarBrand>',
        '      <BalNavbarMenu>',
        '        <BalNavbarMenuStart>Start</BalNavbarMenuStart>',
        '        <BalNavbarMenuEnd>End</BalNavbarMenuEnd>',
        '      </BalNavbarMenu>',
        '    </BalNavbar>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<bal-navbar></bal-navbar>\n<BalNavbar />\n')

    const result = scanBalNavbar(root)

    expect(result.total).toBe(13)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].findings.slice(3)).toEqual([
      { line: 9, snippet: '<BalNavbar light>' },
      { line: 10, snippet: '<BalNavbarBrand href="/">' },
      { line: 10, snippet: '</BalNavbarBrand>' },
      { line: 11, snippet: '<BalNavbarMenu>' },
      { line: 12, snippet: '<BalNavbarMenuStart>' },
      { line: 12, snippet: '</BalNavbarMenuStart>' },
      { line: 13, snippet: '<BalNavbarMenuEnd>' },
      { line: 13, snippet: '</BalNavbarMenuEnd>' },
      { line: 14, snippet: '</BalNavbarMenu>' },
      { line: 15, snippet: '</BalNavbar>' },
    ])
  })

  it('does not match longer names or the ambient BalNavbar types', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-navbar-other></bal-navbar-other>\n<bal-navbars></bal-navbars>\n')
    write(
      root,
      'types.ts',
      [
        'type A = BalProps.BalNavbarInterface',
        'type B = BalEvents.BalNavbarBrandNavigationChange',
        'const BalNavbarish = 1',
        '',
      ].join('\n'),
    )

    expect(scanBalNavbar(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and inline templates', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-navbar></bal-navbar> -->',
        '<div title="bal-navbar">text</div>',
        '<bal-navbar interface="app" (balWillAnimate)="moved($event)">',
        '  <bal-navbar-brand href="/"></bal-navbar-brand>',
        '  <bal-navbar-menu>',
        '    <bal-navbar-menu-start></bal-navbar-menu-start>',
        '    <bal-navbar-menu-end></bal-navbar-menu-end>',
        '  </bal-navbar-menu>',
        '</bal-navbar>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalNavbar } from '@baloise/ds-angular'",
        '@Component({',
        '  imports: [BalNavbar],',
        '  template: `<bal-navbar></bal-navbar>`,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    const result = scanBalNavbar(root)

    expect(result.total).toBe(14)
    expect(result.files.map(file => file.file)).toEqual(['app.component.html', 'inline.component.ts'])
    expect(result.files[0].findings).toEqual([
      { line: 3, snippet: '<bal-navbar interface="app" (balWillAnimate)="moved($event)">' },
      { line: 4, snippet: '<bal-navbar-brand href="/">' },
      { line: 4, snippet: '</bal-navbar-brand>' },
      { line: 5, snippet: '<bal-navbar-menu>' },
      { line: 6, snippet: '<bal-navbar-menu-start>' },
      { line: 6, snippet: '</bal-navbar-menu-start>' },
      { line: 7, snippet: '<bal-navbar-menu-end>' },
      { line: 7, snippet: '</bal-navbar-menu-end>' },
      { line: 8, snippet: '</bal-navbar-menu>' },
      { line: 9, snippet: '</bal-navbar>' },
    ])
    expect(result.files[1].findings).toEqual([
      { line: 1, snippet: "import { BalNavbar } from '@baloise/ds-angular'" },
      { line: 3, snippet: 'imports: [BalNavbar],' },
      { line: 4, snippet: '<bal-navbar>' },
      { line: 4, snippet: '</bal-navbar>' },
    ])
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-navbar', '  light', '  container="fluid"', '></bal-navbar>', ''].join('\n'))
    write(root, 'notes.md', '<bal-navbar></bal-navbar>\n')

    expect(scanBalNavbar(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-navbar light container="fluid">' },
            { line: 4, snippet: '</bal-navbar>' },
          ],
        },
      ],
    })
  })

  it('lists self-closing brand tags in HTML and JSX', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-navbar-brand href="/" />\n<bal-navbar-brand/>\n')
    write(
      root,
      'Brand.tsx',
      [
        'export const Brand = () => <BalNavbarBrand href="/" />',
        'export const Bare = () => <BalNavbarBrand/>',
        '',
      ].join('\n'),
    )

    expect(scanBalNavbar(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'Brand.tsx',
          findings: [
            { line: 1, snippet: '<BalNavbarBrand href="/" />' },
            { line: 2, snippet: '<BalNavbarBrand/>' },
          ],
        },
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-navbar-brand href="/" />' },
            { line: 2, snippet: '<bal-navbar-brand/>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-navbar></bal-navbar>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-navbar></bal-navbar>\n')
      write(root, `src/${dir}/nested.html`, '<BalNavbar></BalNavbar>\n')
    }

    expect(scanBalNavbar(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-navbar>' },
            { line: 1, snippet: '</bal-navbar>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-navbar></bal-navbar>\n'
    write(root, 'index.html', contents)
    let text = ''

    const code = run(root, {
      write(chunk: string) {
        text += chunk
      },
    })

    expect(code).toBe(0)
    expect(JSON.parse(text)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-navbar>' },
            { line: 1, snippet: '</bal-navbar>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests navbar when the project uses it', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-navbar></bal-navbar>\n')

    const { suggested } = scanMigratable(root)

    expect(suggested).toEqual(expect.arrayContaining([{ name: 'navbar', total: 2 }]))
  })

  it('folds the child tags into navbar instead of listing them as unmigratable', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-navbar-brand></bal-navbar-brand>',
        '<bal-navbar-menu></bal-navbar-menu>',
        '<bal-navbar-menu-start></bal-navbar-menu-start>',
        '<bal-navbar-menu-end></bal-navbar-menu-end>',
        '',
      ].join('\n'),
    )

    const result = scanMigratable(root)

    expect(JSON.stringify(result)).not.toContain('navbar-')
    expect(result.suggested).toEqual(expect.arrayContaining([{ name: 'navbar', total: 8 }]))
  })
})

describe('navbar migration.md', () => {
  it('titles the component navbar and documents the prop, tag, import, event, and report mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/navbar/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# navbar\n')).toBe(true)
    for (const phrase of [
      'scan-bal-navbar.mjs',
      'one yes/no',
      'ds-app-navbar',
      'DsAppNavbar',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'interface="simple"',
      'slot="brand"',
      'slot="menu-start"',
      'slot="menu-end"',
      'detail-page',
      'dsMenuOpenStart',
      'balNavigate',
      'toggleSidebar',
      'BalProps.BalNavbarInterface',
      'part="hamburger"',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
