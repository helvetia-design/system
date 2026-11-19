import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalNav } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-nav.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-nav-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalNav', () => {
  it('lists React tags, the import symbol and the element type and skips comments, strings and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'Header.tsx',
      [
        "import { BalNav } from '@baloise/ds-react'",
        "const _note = '<bal-nav></bal-nav>'",
        'const _hidden = /* <BalNav /> */ null',
        'export function Header({ options }: { options: BalProps.BalNavOptions }) {',
        '  const ref = useRef<HTMLBalNavElement>(null)',
        '  return <BalNav ref={ref} options={options} onBalNavItemClick={track}></BalNav>',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalNav />\n')

    expect(scanBalNav(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'Header.tsx',
          findings: [
            { line: 1, snippet: "import { BalNav } from '@baloise/ds-react'" },
            { line: 5, snippet: 'const ref = useRef<HTMLBalNavElement>(null)' },
            { line: 6, snippet: '<BalNav ref={ref} options={options} onBalNavItemClick={track}>' },
            { line: 6, snippet: '</BalNav>' },
          ],
        },
      ],
    })
  })

  it('lists Angular templates, inline templates and the child tags', () => {
    const root = createScratchDir()
    write(
      root,
      'header.component.html',
      [
        '<!-- <bal-nav></bal-nav> -->',
        '<bal-nav [options]="options" [logo]="logo" (balNavItemClick)="track($event)">',
        '  <bal-nav-meta-bar></bal-nav-meta-bar>',
        '  <bal-nav-menu-bar></bal-nav-menu-bar>',
        '  <bal-nav-menu-flyout>',
        '    <bal-nav-link-grid><bal-nav-link-grid-col>',
        '      <bal-nav-link-group><bal-nav-link href="/a">A</bal-nav-link></bal-nav-link-group>',
        '    </bal-nav-link-grid-col></bal-nav-link-grid>',
        '  </bal-nav-menu-flyout>',
        '</bal-nav>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalNav } from '@baloise/ds-angular'",
        '@Component({',
        '  imports: [BalNav],',
        '  template: `<bal-nav></bal-nav>`,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    const result = scanBalNav(root)

    expect(result.files.map(file => file.file)).toEqual(['header.component.html', 'inline.component.ts'])
    expect(result.files[0].findings.map(finding => finding.snippet)).toEqual([
      '<bal-nav [options]="options" [logo]="logo" (balNavItemClick)="track($event)">',
      '<bal-nav-meta-bar>',
      '</bal-nav-meta-bar>',
      '<bal-nav-menu-bar>',
      '</bal-nav-menu-bar>',
      '<bal-nav-menu-flyout>',
      '<bal-nav-link-grid>',
      '<bal-nav-link-grid-col>',
      '<bal-nav-link-group>',
      '<bal-nav-link href="/a">',
      '</bal-nav-link>',
      '</bal-nav-link-group>',
      '</bal-nav-link-grid-col>',
      '</bal-nav-link-grid>',
      '</bal-nav-menu-flyout>',
      '</bal-nav>',
    ])
    expect(result.files[1].findings).toEqual([
      { line: 1, snippet: "import { BalNav } from '@baloise/ds-angular'" },
      { line: 3, snippet: 'imports: [BalNav],' },
      { line: 4, snippet: '<bal-nav>' },
      { line: 4, snippet: '</bal-nav>' },
    ])
    expect(result.total).toBe(20)
  })

  it('lists React child components with one finding per opening, closing and self-closing tag', () => {
    const root = createScratchDir()
    write(
      root,
      'Menu.tsx',
      [
        'export const Menu = () => (',
        '  <BalNav>',
        '    <BalNavMetaBar></BalNavMetaBar>',
        '    <BalNavMenuBar></BalNavMenuBar>',
        '    <BalNavMenuFlyout>',
        '      <BalNavLinkGrid>',
        '        <BalNavLinkGridCol>',
        '          <BalNavLinkGroup>',
        '            <BalNavLink href="/a">A</BalNavLink>',
        '            <BalNavLink href="/b" />',
        '          </BalNavLinkGroup>',
        '        </BalNavLinkGridCol>',
        '      </BalNavLinkGrid>',
        '    </BalNavMenuFlyout>',
        '  </BalNav>',
        ')',
        '',
      ].join('\n'),
    )

    expect(scanBalNav(root).files[0].findings).toEqual([
      { line: 2, snippet: '<BalNav>' },
      { line: 3, snippet: '<BalNavMetaBar>' },
      { line: 3, snippet: '</BalNavMetaBar>' },
      { line: 4, snippet: '<BalNavMenuBar>' },
      { line: 4, snippet: '</BalNavMenuBar>' },
      { line: 5, snippet: '<BalNavMenuFlyout>' },
      { line: 6, snippet: '<BalNavLinkGrid>' },
      { line: 7, snippet: '<BalNavLinkGridCol>' },
      { line: 8, snippet: '<BalNavLinkGroup>' },
      { line: 9, snippet: '<BalNavLink href="/a">' },
      { line: 9, snippet: '</BalNavLink>' },
      { line: 10, snippet: '<BalNavLink href="/b" />' },
      { line: 11, snippet: '</BalNavLinkGroup>' },
      { line: 12, snippet: '</BalNavLinkGridCol>' },
      { line: 13, snippet: '</BalNavLinkGrid>' },
      { line: 14, snippet: '</BalNavMenuFlyout>' },
      { line: 15, snippet: '</BalNav>' },
    ])
  })

  it('lists a plain HTML bal-nav and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-nav', '  id="main-nav"', '></bal-nav>', ''].join('\n'))
    write(root, 'notes.md', '<bal-nav></bal-nav>\n')

    expect(scanBalNav(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-nav id="main-nav">' },
            { line: 3, snippet: '</bal-nav>' },
          ],
        },
      ],
    })
  })

  it('does not match navbar, balNavigate, longer names or the ambient BalNav types', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-navbar><bal-navbar-brand href="/"></bal-navbar-brand></bal-navbar>',
        '<bal-nav-other></bal-nav-other>',
        '<bal-list-item (balNavigate)="go($event)"></bal-list-item>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'Navbar.tsx',
      [
        "import { BalNavbar, BalNavbarBrand } from '@baloise/ds-react'",
        'type A = BalProps.BalNavOptions',
        'type B = BalEvents.BalNavItemClickDetail',
        'type C = BalNavigate',
        'const BalNavish = 1',
        'const handler = (e: BalNavbarBrandCustomEvent<string>) => e',
        'export const N = () => <BalNavbar><BalNavbarBrand onBalNavigate={handler} /></BalNavbar>',
        '',
      ].join('\n'),
    )

    expect(scanBalNav(root)).toEqual({ total: 0, files: [] })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-nav></bal-nav>\n')
    }
    for (const dir of ['node_modules', '.angular', '.git', '.claude']) {
      write(root, `src/${dir}/nested.html`, '<BalNav />\n')
    }

    expect(scanBalNav(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-nav></bal-nav>\n'
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
            { line: 1, snippet: '<bal-nav>' },
            { line: 1, snippet: '</bal-nav>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests nav and folds its child tags in, while bal-navbar stays navbar', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-nav></bal-nav>',
        '<bal-nav-meta-bar></bal-nav-meta-bar>',
        '<bal-nav-link></bal-nav-link>',
        '<bal-navbar><bal-navbar-brand></bal-navbar-brand></bal-navbar>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [
        { name: 'nav', total: 3 },
        { name: 'navbar', total: 2 },
      ],
      notYet: [],
      types: [],
    })
  })
})

describe('nav migration.md', () => {
  it('is a report-only migration that names the reason and the suggested replacement', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/nav/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# nav (report only)\n')).toBe(true)
    for (const phrase of [
      'scan-bal-nav.mjs',
      'one yes/no',
      'Nothing is rewritten.',
      'ds-app-navbar',
      'slot="brand"',
      'slot="menu-start"',
      'balNavItemClick',
      'BalProps.BalNavOptions',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
