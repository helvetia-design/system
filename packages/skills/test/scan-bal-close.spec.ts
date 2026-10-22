import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalClose } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-close.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-close-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalClose', () => {
  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalClose } from '@baloise/ds-react'",
        '// <BalClose /> in a comment',
        "const note = '<BalClose />'",
        'export const App = () => (',
        '  <>',
        '    <BalClose size="small" />',
        '    <BalClose inverted size={"medium"}>',
        '    </BalClose>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const W = () => <BalClose />\n')
    write(root, 'dist/ignored.tsx', '<BalClose />\n')
    write(root, 'Other.tsx', 'type S = BalCloseSize\nconst x = <BalCloseable />\n')

    expect(scanBalClose(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalClose } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalClose size="small" />' },
            { line: 7, snippet: '<BalClose inverted size={"medium"}>' },
            { line: 8, snippet: '</BalClose>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalClose />' }] },
      ],
    })
  })

  it('lists Angular template tags, inline templates, and the BalClose binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-close></bal-close> -->',
        '<bal-close size="small"></bal-close>',
        '<bal-close inverted></bal-close>',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalClose } from '@baloise/ds-angular'",
        "const label = '<bal-close>'",
        '@Component({',
        '  imports: [BalClose],',
        '  template: `<bal-close size="medium"></bal-close>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalClose(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-close size="small">' },
            { line: 2, snippet: '</bal-close>' },
            { line: 3, snippet: '<bal-close inverted>' },
            { line: 3, snippet: '</bal-close>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalClose } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalClose],' },
            { line: 5, snippet: '<bal-close size="medium">' },
            { line: 5, snippet: '</bal-close>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags including a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-close', '  inverted', '  size="small"', '></bal-close>'].join('\n'))
    write(root, 'notes.md', '<bal-close></bal-close>\n')

    const result = scanBalClose(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-close>' })
  })

  it('lists tags that carry [size] and :size bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-close [size]="size" [inverted]="dark"></bal-close>',
        '<bal-close :size="size" :inverted="dark"></bal-close>',
        '',
      ].join('\n'),
    )

    expect(scanBalClose(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-close [size]="size" [inverted]="dark">' },
            { line: 1, snippet: '</bal-close>' },
            { line: 2, snippet: '<bal-close :size="size" :inverted="dark">' },
            { line: 2, snippet: '</bal-close>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-close></bal-close>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-close></bal-close>\n')
      write(root, `src/${dir}/nested.html`, '<BalClose />\n')
    }

    expect(scanBalClose(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-close>' },
            { line: 1, snippet: '</bal-close>' },
          ],
        },
      ],
    })
  })

  it('does not edit files and prints grouped findings as JSON', () => {
    const root = createScratchDir()
    const html = '<bal-close inverted></bal-close>\n'
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
            { line: 1, snippet: '<bal-close inverted>' },
            { line: 1, snippet: '</bal-close>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('close migration.md', () => {
  it('titles the component close and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/close/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# close\n')).toBe(true)
    for (const phrase of [
      'scan-bal-close.mjs',
      'one yes/no',
      'size="sm"',
      'size="md"',
      'inverted',
      '<ds-close>',
      'DsClose',
      '@helvetia-design/react',
      '@helvetia-design/angular',
      'no event changes',
      'data-testid="bal-close"',
      'part="button"',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
