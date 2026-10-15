import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalHeading } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-heading.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-heading-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalHeading', () => {
  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalHeading } from '@baloise/ds-react'",
        '// <BalHeading /> in a comment',
        "const note = '<BalHeading />'",
        'export const App = () => (',
        '  <>',
        '    <BalHeading level="h2" />',
        '    <BalHeading',
        '      subtitle',
        '    >',
        '    </BalHeading>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalHeading />\n')

    expect(scanBalHeading(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalHeading } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalHeading level="h2" />' },
            { line: 7, snippet: '<BalHeading subtitle>' },
            { line: 10, snippet: '</BalHeading>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags, inline templates, and the BalHeading binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      ['<!-- <bal-heading></bal-heading> -->', '<bal-heading [level]="l"></bal-heading>'].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalHeading } from '@baloise/ds-angular'",
        "const label = '<bal-heading>'",
        '@Component({',
        '  imports: [BalHeading],',
        '  template: `<bal-heading level="h3"></bal-heading>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalHeading(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-heading [level]="l">' },
            { line: 2, snippet: '</bal-heading>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalHeading } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalHeading],' },
            { line: 5, snippet: '<bal-heading level="h3">' },
            { line: 5, snippet: '</bal-heading>' },
          ],
        },
      ],
    })
  })

  it('does not match longer tag names or the BalHeading-prefixed type exports', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-heading-foo></bal-heading-foo>', '<bal-headingpicker>'].join('\n'))
    write(
      root,
      'types.ts',
      [
        "import type { BalHeadingLevel } from '@baloise/ds-core'",
        'type Q = BalHeadingVisualLevel',
        'const x = <BalHeadingColor />',
      ].join('\n'),
    )

    expect(scanBalHeading(root)).toEqual({ total: 0, files: [] })
  })

  it('lists HTML tags including a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-heading', '  level="h2"', '  subtitle', '></bal-heading>'].join('\n'))
    write(root, 'notes.md', '<bal-heading></bal-heading>\n')

    const result = scanBalHeading(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[0].snippet).toContain('subtitle')
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-heading>' })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-heading></bal-heading>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-heading></bal-heading>\n')
      write(root, `src/${dir}/nested.html`, '<BalHeading />\n')
    }

    expect(scanBalHeading(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-heading>' },
            { line: 1, snippet: '</bal-heading>' },
          ],
        },
      ],
    })
  })

  it('does not edit files and prints grouped findings as JSON', () => {
    const root = createScratchDir()
    const html = '<bal-heading level="h2"></bal-heading>\n'
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
            { line: 1, snippet: '<bal-heading level="h2">' },
            { line: 1, snippet: '</bal-heading>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('heading migration.md', () => {
  it('titles the component heading and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/heading/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# heading\n')).toBe(true)
    for (const phrase of [
      'scan-bal-heading.mjs',
      'one yes/no',
      '<ds-heading>',
      'DsHeading',
      '@helvetia-design/react',
      '@helvetia-design/angular',
      'visualLevel',
      'autoLevel',
      'x-large',
      '2xl',
      'color="white"',
      'inverted',
      'BalProps.BalHeadingLevel',
      'data-testid="bal-heading"',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
