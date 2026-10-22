import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalDivider } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-divider.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-divider-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalDivider', () => {
  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalDivider } from '@baloise/ds-react'",
        '// <BalDivider /> in a comment',
        "const note = '<BalDivider />'",
        'export const App = () => (',
        '  <>',
        '    <BalDivider space="small" />',
        '    <BalDivider layout="vertical" color={"white"}>',
        '    </BalDivider>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const W = () => <BalDivider />\n')
    write(root, 'dist/ignored.tsx', '<BalDivider />\n')
    write(root, 'Other.tsx', 'type S = BalDividerSize\nconst x = <BalDividerable />\n')

    expect(scanBalDivider(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalDivider } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalDivider space="small" />' },
            { line: 7, snippet: '<BalDivider layout="vertical" color={"white"}>' },
            { line: 8, snippet: '</BalDivider>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalDivider />' }] },
      ],
    })
  })

  it('lists Angular template tags, inline templates, and the BalDivider binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-divider></bal-divider> -->',
        '<bal-divider space="small"></bal-divider>',
        '<bal-divider color="white"></bal-divider>',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalDivider } from '@baloise/ds-angular'",
        "const label = '<bal-divider>'",
        '@Component({',
        '  imports: [BalDivider],',
        '  template: `<bal-divider borderStyle="dashed"></bal-divider>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalDivider(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-divider space="small">' },
            { line: 2, snippet: '</bal-divider>' },
            { line: 3, snippet: '<bal-divider color="white">' },
            { line: 3, snippet: '</bal-divider>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalDivider } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalDivider],' },
            { line: 5, snippet: '<bal-divider borderStyle="dashed">' },
            { line: 5, snippet: '</bal-divider>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags including a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-divider', '  color="white"', '  space="small"', '></bal-divider>'].join('\n'))
    write(root, 'notes.md', '<bal-divider></bal-divider>\n')

    const result = scanBalDivider(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-divider>' })
  })

  it('lists tags that carry [layout] and :layout bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-divider [layout]="layout" [space]="space"></bal-divider>',
        '<bal-divider :layout="layout" :space="space"></bal-divider>',
        '',
      ].join('\n'),
    )

    expect(scanBalDivider(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-divider [layout]="layout" [space]="space">' },
            { line: 1, snippet: '</bal-divider>' },
            { line: 2, snippet: '<bal-divider :layout="layout" :space="space">' },
            { line: 2, snippet: '</bal-divider>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-divider></bal-divider>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-divider></bal-divider>\n')
      write(root, `src/${dir}/nested.html`, '<BalDivider />\n')
    }

    expect(scanBalDivider(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-divider>' },
            { line: 1, snippet: '</bal-divider>' },
          ],
        },
      ],
    })
  })

  it('does not edit files and prints grouped findings as JSON', () => {
    const root = createScratchDir()
    const html = '<bal-divider color="white"></bal-divider>\n'
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
            { line: 1, snippet: '<bal-divider color="white">' },
            { line: 1, snippet: '</bal-divider>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('divider migration.md', () => {
  it('titles the component divider and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/divider/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# divider\n')).toBe(true)
    for (const phrase of [
      'scan-bal-divider.mjs',
      'one yes/no',
      'space="2xs"',
      'color="inverted"',
      'dashed="true"',
      'no slot',
      '<ds-divider>',
      'DsDivider',
      '@helvetia-design/react',
      '@helvetia-design/angular',
      'no event changes',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
