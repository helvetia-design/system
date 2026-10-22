import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalContent } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-content.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-content-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalContent', () => {
  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalContent } from '@baloise/ds-react'",
        '// <BalContent /> in a comment',
        "const note = '<BalContent />'",
        'export const App = () => (',
        '  <>',
        '    <BalContent space="small" />',
        '    <BalContent align="center" layout={"horizontal"}>',
        '    </BalContent>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const W = () => <BalContent />\n')
    write(root, 'dist/ignored.tsx', '<BalContent />\n')
    write(root, 'Other.tsx', 'type S = BalContentSize\nconst x = <BalContentable />\n')

    expect(scanBalContent(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalContent } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalContent space="small" />' },
            { line: 7, snippet: '<BalContent align="center" layout={"horizontal"}>' },
            { line: 8, snippet: '</BalContent>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalContent />' }] },
      ],
    })
  })

  it('lists Angular template tags, inline templates, and the BalContent binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-content></bal-content> -->',
        '<bal-content space="small"></bal-content>',
        '<bal-content align="center"></bal-content>',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalContent } from '@baloise/ds-angular'",
        "const label = '<bal-content>'",
        '@Component({',
        '  imports: [BalContent],',
        '  template: `<bal-content space="normal"></bal-content>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalContent(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-content space="small">' },
            { line: 2, snippet: '</bal-content>' },
            { line: 3, snippet: '<bal-content align="center">' },
            { line: 3, snippet: '</bal-content>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalContent } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalContent],' },
            { line: 5, snippet: '<bal-content space="normal">' },
            { line: 5, snippet: '</bal-content>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags including a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-content', '  align="center"', '  space="small"', '></bal-content>'].join('\n'))
    write(root, 'notes.md', '<bal-content></bal-content>\n')

    const result = scanBalContent(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-content>' })
  })

  it('lists every tag of nested content, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-content layout="vertical">',
        '  <bal-content layout="horizontal" space="small">',
        '    <p>Inner</p>',
        '  </bal-content>',
        '</bal-content>',
        '',
      ].join('\n'),
    )

    expect(scanBalContent(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-content layout="vertical">' },
            { line: 2, snippet: '<bal-content layout="horizontal" space="small">' },
            { line: 4, snippet: '</bal-content>' },
            { line: 5, snippet: '</bal-content>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [layout] and :layout bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-content [layout]="layout" [align]="align" [space]="gap"></bal-content>',
        '<bal-content :layout="layout" :align="align" :space="gap"></bal-content>',
        '',
      ].join('\n'),
    )

    expect(scanBalContent(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-content [layout]="layout" [align]="align" [space]="gap">' },
            { line: 1, snippet: '</bal-content>' },
            { line: 2, snippet: '<bal-content :layout="layout" :align="align" :space="gap">' },
            { line: 2, snippet: '</bal-content>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-content></bal-content>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-content></bal-content>\n')
      write(root, `src/${dir}/nested.html`, '<BalContent />\n')
    }

    expect(scanBalContent(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-content>' },
            { line: 1, snippet: '</bal-content>' },
          ],
        },
      ],
    })
  })

  it('does not edit files and prints grouped findings as JSON', () => {
    const root = createScratchDir()
    const html = '<bal-content align="center"></bal-content>\n'
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
            { line: 1, snippet: '<bal-content align="center">' },
            { line: 1, snippet: '</bal-content>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('content migration.md', () => {
  it('titles the component content and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/content/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# content\n')).toBe(true)
    for (const phrase of [
      'scan-bal-content.mjs',
      'one yes/no',
      'direction="row"',
      'direction="column"',
      'space="3xs"',
      'space="2xs"',
      'space="xs"',
      'space="sm"',
      'space="base"',
      '<ds-content>',
      'DsContent',
      '@helvetia-design/react',
      '@helvetia-design/angular',
      'textAlign',
      'ds-stack-content',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
