import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalFooter } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-footer.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-footer-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalFooter', () => {
  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalFooter } from '@baloise/ds-react'",
        '// <BalFooter /> in a comment',
        "const note = '<BalFooter />'",
        'export const App = () => (',
        '  <>',
        '    <BalFooter showSocialMedia />',
        '    <BalFooter',
        '      hideLinks',
        '    >',
        '    </BalFooter>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalFooter />\n')

    expect(scanBalFooter(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalFooter } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalFooter showSocialMedia />' },
            { line: 7, snippet: '<BalFooter hideLinks>' },
            { line: 10, snippet: '</BalFooter>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags, inline templates, and the BalFooter binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      ['<!-- <bal-footer></bal-footer> -->', '<bal-footer [(ngModel)]="d"></bal-footer>'].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalFooter } from '@baloise/ds-angular'",
        "const label = '<bal-footer>'",
        '@Component({',
        '  imports: [BalFooter],',
        '  template: `<bal-footer showSocialMedia></bal-footer>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalFooter(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-footer [(ngModel)]="d">' },
            { line: 2, snippet: '</bal-footer>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalFooter } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalFooter],' },
            { line: 5, snippet: '<bal-footer showSocialMedia>' },
            { line: 5, snippet: '</bal-footer>' },
          ],
        },
      ],
    })
  })

  it('does not match longer tag names or the BalFooter-prefixed type exports', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-footer-links></bal-footer-links>', '<bal-footerpicker>'].join('\n'))
    write(
      root,
      'types.ts',
      [
        "import type { BalFooterLink } from '@baloise/ds-core'",
        'type Q = BalFooterLinks',
        'const x = <BalFooterable />',
      ].join('\n'),
    )

    expect(scanBalFooter(root)).toEqual({ total: 0, files: [] })
  })

  it('lists HTML tags including a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-footer', '  hide-links', '  show-social-media', '></bal-footer>'].join('\n'))
    write(root, 'notes.md', '<bal-footer></bal-footer>\n')

    const result = scanBalFooter(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[0].snippet).toContain('show-social-media')
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-footer>' })
  })

  it('lists tags that carry [hideLinks] and :hideLinks bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-footer [hideLinks]="hideLinks" [hideLanguageSelection]="hideLang"></bal-footer>',
        '<bal-footer :hideLinks="hideLinks" :hideLanguageSelection="hideLang"></bal-footer>',
        '',
      ].join('\n'),
    )

    expect(scanBalFooter(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-footer [hideLinks]="hideLinks" [hideLanguageSelection]="hideLang">' },
            { line: 1, snippet: '</bal-footer>' },
            { line: 2, snippet: '<bal-footer :hideLinks="hideLinks" :hideLanguageSelection="hideLang">' },
            { line: 2, snippet: '</bal-footer>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-footer></bal-footer>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-footer></bal-footer>\n')
      write(root, `src/${dir}/nested.html`, '<BalFooter />\n')
    }

    expect(scanBalFooter(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-footer>' },
            { line: 1, snippet: '</bal-footer>' },
          ],
        },
      ],
    })
  })

  it('does not edit files and prints grouped findings as JSON', () => {
    const root = createScratchDir()
    const html = '<bal-footer showSocialMedia></bal-footer>\n'
    write(root, 'index.html', html)
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
            { line: 1, snippet: '<bal-footer showSocialMedia>' },
            { line: 1, snippet: '</bal-footer>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('footer migration.md', () => {
  it('titles the component footer and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/footer/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# footer\n')).toBe(true)
    for (const phrase of [
      'scan-bal-footer.mjs',
      'one yes/no',
      '<ds-app-footer>',
      'DsAppFooter',
      '@helvetia-design/react',
      '@helvetia-design/angular',
      'hideLinks',
      'disableDefaultLinks',
      'showSocialMedia',
      'disableDefaultSocialLinks',
      'hideLanguageSelection',
      'logoBrand',
      'logoHref',
      'logoSvg',
      'overrideLinks',
      'dsLanguageChange',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
