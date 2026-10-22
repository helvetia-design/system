import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalData } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-data.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-data-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalData', () => {
  it('lists the three child tags and their React symbols', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-data>',
        '  <bal-data-item>',
        '    <bal-data-label>L</bal-data-label>',
        '    <bal-data-value>V</bal-data-value>',
        '  </bal-data-item>',
        '</bal-data>',
      ].join('\n'),
    )
    write(root, 'App.tsx', "import { BalDataItem, BalDataLabel, BalDataValue } from '@baloise/ds-react'\n")

    expect(scanBalData(root).total).toBe(8 + 3)
  })

  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalData } from '@baloise/ds-react'",
        '// <BalData /> in a comment',
        "const note = '<BalData />'",
        'export const App = () => (',
        '  <>',
        '    <BalData horizontal />',
        '    <BalData border>',
        '    </BalData>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const W = () => <BalData />\n')
    write(root, 'dist/ignored.tsx', '<BalData />\n')
    write(root, 'Other.tsx', 'type S = BalDataSize\nconst x = <BalDataable />\n')

    expect(scanBalData(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalData } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalData horizontal />' },
            { line: 7, snippet: '<BalData border>' },
            { line: 8, snippet: '</BalData>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalData />' }] },
      ],
    })
  })

  it('lists Angular template tags, inline templates, and the BalData binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      ['<!-- <bal-data></bal-data> -->', '<bal-data horizontal></bal-data>', '<bal-data border></bal-data>'].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalData } from '@baloise/ds-angular'",
        "const label = '<bal-data>'",
        '@Component({',
        '  imports: [BalData],',
        '  template: `<bal-data border></bal-data>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalData(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-data horizontal>' },
            { line: 2, snippet: '</bal-data>' },
            { line: 3, snippet: '<bal-data border>' },
            { line: 3, snippet: '</bal-data>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalData } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalData],' },
            { line: 5, snippet: '<bal-data border>' },
            { line: 5, snippet: '</bal-data>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags including a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-data', '  border', '  horizontal', '></bal-data>'].join('\n'))
    write(root, 'notes.md', '<bal-data></bal-data>\n')

    const result = scanBalData(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-data>' })
  })

  it('lists every tag of bal-data with its items, labels and values, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-data>',
        '  <bal-data-item>',
        '    <bal-data-label>Name</bal-data-label>',
        '    <bal-data-value>Jane</bal-data-value>',
        '  </bal-data-item>',
        '</bal-data>',
        '',
      ].join('\n'),
    )

    expect(scanBalData(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-data>' },
            { line: 2, snippet: '<bal-data-item>' },
            { line: 3, snippet: '<bal-data-label>' },
            { line: 3, snippet: '</bal-data-label>' },
            { line: 4, snippet: '<bal-data-value>' },
            { line: 4, snippet: '</bal-data-value>' },
            { line: 5, snippet: '</bal-data-item>' },
            { line: 6, snippet: '</bal-data>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-data-value at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-data>',
        '  <bal-data-item>',
        '    <bal-data-value',
        '      editable="true"',
        '      multiline="true"',
        '    >Jane</bal-data-value>',
        '  </bal-data-item>',
        '</bal-data>',
        '',
      ].join('\n'),
    )

    expect(scanBalData(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-data>' },
            { line: 2, snippet: '<bal-data-item>' },
            { line: 3, snippet: '<bal-data-value editable="true" multiline="true">' },
            { line: 6, snippet: '</bal-data-value>' },
            { line: 7, snippet: '</bal-data-item>' },
            { line: 8, snippet: '</bal-data>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [editable] and :editable bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-data-value [editable]="canEdit" [multiline]="long">{{ value }}</bal-data-value>',
        '<bal-data-value :editable="canEdit" :multiline="long">{{ value }}</bal-data-value>',
        '',
      ].join('\n'),
    )

    expect(scanBalData(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-data-value [editable]="canEdit" [multiline]="long">' },
            { line: 1, snippet: '</bal-data-value>' },
            { line: 2, snippet: '<bal-data-value :editable="canEdit" :multiline="long">' },
            { line: 2, snippet: '</bal-data-value>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-data></bal-data>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-data></bal-data>\n')
      write(root, `src/${dir}/nested.html`, '<BalData />\n')
    }

    expect(scanBalData(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-data>' },
            { line: 1, snippet: '</bal-data>' },
          ],
        },
      ],
    })
  })

  it('does not edit files and prints grouped findings as JSON', () => {
    const root = createScratchDir()
    const html = '<bal-data border></bal-data>\n'
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
            { line: 1, snippet: '<bal-data border>' },
            { line: 1, snippet: '</bal-data>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('data migration.md', () => {
  it('titles the component data and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/data/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# data\n')).toBe(true)
    for (const phrase of [
      'scan-bal-data.mjs',
      'one yes/no',
      '<ds-data>',
      '<ds-data-item>',
      'DsData',
      'DsDataItem',
      '@helvetia-design/react',
      '@helvetia-design/angular',
      'editable',
      'multiline',
      'balClick',
      'no longer emitted',
      'bal-data-value-button',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
