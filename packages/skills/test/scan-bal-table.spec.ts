import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalTable } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-table.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-table-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalTable', () => {
  it('lists React tags and the import symbol and skips comments, strings and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'DocumentTable.tsx',
      [
        "import { BalPagination, BalTable } from '@baloise/ds-react'",
        '// <BalTable expanded> in a comment',
        "const note = '<BalTable />'",
        'export const DocumentTable = () => (',
        '  <BalTable',
        '    expanded',
        '  >',
        '    <table className="table is-striped"></table>',
        '  </BalTable>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalTable />\n')

    expect(scanBalTable(root)).toEqual({
      total: 3,
      files: [
        {
          file: 'DocumentTable.tsx',
          findings: [
            { line: 1, snippet: "import { BalPagination, BalTable } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalTable expanded>' },
            { line: 9, snippet: '</BalTable>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags, the class file binding and the HTMLBalTableElement type, but not longer names', () => {
    const root = createScratchDir()
    write(
      root,
      'profile.component.html',
      [
        '<bal-table [expanded]="true">',
        '  <table class="table"></table>',
        '</bal-table>',
        '<bal-table-row></bal-table-row>',
        '<bal-tables></bal-tables>',
      ].join('\n'),
    )
    write(
      root,
      'profile.component.ts',
      [
        "import { BalTable, BalComponentBundle } from '@baloise/ds-angular'",
        '@Component({ imports: [BalTable, ...BalComponentBundle] })',
        'export class ProfileComponent {',
        '  el?: HTMLBalTableElement',
        '  other?: BalTableRow',
        '}',
      ].join('\n'),
    )

    expect(scanBalTable(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'profile.component.html',
          findings: [
            { line: 1, snippet: '<bal-table [expanded]="true">' },
            { line: 3, snippet: '</bal-table>' },
          ],
        },
        {
          file: 'profile.component.ts',
          findings: [
            { line: 1, snippet: "import { BalTable, BalComponentBundle } from '@baloise/ds-angular'" },
            { line: 2, snippet: '@Component({ imports: [BalTable, ...BalComponentBundle] })' },
            { line: 4, snippet: 'el?: HTMLBalTableElement' },
          ],
        },
      ],
    })
  })

  it('lists a bal-table around an AG Grid like any other, so the migration can report it', () => {
    const root = createScratchDir()
    write(
      root,
      'grid.component.html',
      ['<bal-table>', '  <ag-grid-angular class="ag-theme-alpine"></ag-grid-angular>', '</bal-table>', ''].join('\n'),
    )

    expect(scanBalTable(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'grid.component.html',
          findings: [
            { line: 1, snippet: '<bal-table>' },
            { line: 3, snippet: '</bal-table>' },
          ],
        },
      ],
    })
  })

  it('reports paths that match no source file', () => {
    const root = createScratchDir()
    write(root, 'src/index.html', '<bal-table></bal-table>\n')

    expect(scanBalTable(root, ['src', 'missing'])).toEqual({
      total: 2,
      files: [
        {
          file: 'src/index.html',
          findings: [
            { line: 1, snippet: '<bal-table>' },
            { line: 1, snippet: '</bal-table>' },
          ],
        },
      ],
      unmatched: ['missing'],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-table expanded><table class="table"></table></bal-table>\n'
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
            { line: 1, snippet: '<bal-table expanded>' },
            { line: 1, snippet: '</bal-table>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests table when the project uses bal-table', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-table><table class="table"></table></bal-table>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'table', total: 1 }],
      notYet: [],
      types: [],
    })
  })
})

describe('table migration.md', () => {
  it('titles the component table and documents the wrapper, AG Grid and import rules', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/table/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# table\n')).toBe(true)
    for (const phrase of [
      'scan-bal-table.mjs',
      'one yes/no',
      'ds-table',
      'is-wide',
      'expanded',
      'ag-theme-alpine',
      'ag-grid-angular',
      'AgGridReact',
      'createGrid(',
      '@helvetia-design/ag-grid',
      '**Cleanup** stays incomplete',
      'HTMLBalTableElement',
      'HTMLTableElement',
      '@baloise/ds-react',
      '@baloise/ds-angular',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
