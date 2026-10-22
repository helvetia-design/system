import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalPagination } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-pagination.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-pagination-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalPagination', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalPagination } from '@baloise/ds-react'",
        '// <BalPagination /> in a comment',
        "const note = '<BalPagination />'",
        'export const App = () => (',
        '  <>',
        '    <BalPagination totalPages={20} />',
        '    <BalPagination',
        '      interface="small"',
        '    >',
        '    </BalPagination>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalPagination />\n')

    expect(scanBalPagination(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalPagination } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalPagination totalPages={20} />' },
            { line: 7, snippet: '<BalPagination interface="small">' },
            { line: 10, snippet: '</BalPagination>' },
          ],
        },
      ],
    })
  })

  it('does not match longer tag names or the ambient BalPagination types', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-pagination-foo></bal-pagination-foo>', '<bal-paginationpicker>'].join('\n'))
    write(
      root,
      'types.ts',
      [
        "const a: BalProps.BalPaginationAlignment = 'start'",
        'type B = BalEvents.BalPaginationChangeDetail',
        "const c: BalPaginationSize = 'small'",
        'const d = balPaginationFindOther()',
      ].join('\n'),
    )

    expect(scanBalPagination(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-pagination></bal-pagination> -->',
        '<bal-pagination [value]="page" (balChange)="onPage($event)"></bal-pagination>',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalPagination } from '@baloise/ds-angular'",
        "const label = '<bal-pagination>'",
        '@Component({',
        '  imports: [BalPagination],',
        '  template: `<bal-pagination size="small"></bal-pagination>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalPagination(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-pagination [value]="page" (balChange)="onPage($event)">' },
            { line: 2, snippet: '</bal-pagination>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalPagination } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalPagination],' },
            { line: 5, snippet: '<bal-pagination size="small">' },
            { line: 5, snippet: '</bal-pagination>' },
          ],
        },
      ],
    })
  })

  it('lists the legacy Cypress commands in a spec that never names the tag', () => {
    const root = createScratchDir()
    write(
      root,
      'e2e/pager.cy.ts',
      [
        "describe('pager', () => {",
        "  it('pages', () => {",
        '    cy.balPaginationFindNextButton().click()',
        "    cy.balPaginationFindCurrentPage().should('have.text', '2')",
        '  })',
        '})',
      ].join('\n'),
    )

    const result = scanBalPagination(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['e2e/pager.cy.ts'])
    expect(result.files[0].findings).toEqual([
      { line: 3, snippet: 'cy.balPaginationFindNextButton().click()' },
      { line: 4, snippet: "cy.balPaginationFindCurrentPage().should('have.text', '2')" },
    ])
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-pagination', '  interface="small"', '  size="small"', '></bal-pagination>'].join('\n'),
    )
    write(root, 'notes.md', '<bal-pagination></bal-pagination>\n')

    const result = scanBalPagination(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[0].snippet).toContain('size="small"')
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-pagination>' })
  })

  it('lists tags that carry [totalPages] and :totalPages bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-pagination [value]="page" [totalPages]="total"></bal-pagination>',
        '<bal-pagination :value="page" :totalPages="total"></bal-pagination>',
        '',
      ].join('\n'),
    )

    expect(scanBalPagination(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-pagination [value]="page" [totalPages]="total">' },
            { line: 1, snippet: '</bal-pagination>' },
            { line: 2, snippet: '<bal-pagination :value="page" :totalPages="total">' },
            { line: 2, snippet: '</bal-pagination>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-pagination></bal-pagination>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-pagination></bal-pagination>\n')
      write(root, `src/${dir}/nested.html`, '<BalPagination />\n')
    }

    expect(scanBalPagination(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-pagination>' },
            { line: 1, snippet: '</bal-pagination>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-pagination size="small"></bal-pagination>\n'
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
            { line: 1, snippet: '<bal-pagination size="small">' },
            { line: 1, snippet: '</bal-pagination>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests pagination when the project uses bal-pagination', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-pagination></bal-pagination>\n')

    expect(scanMigratable(root).suggested).toEqual([{ name: 'pagination', total: 2 }])
  })
})

describe('pagination migration.md', () => {
  it('titles the component pagination and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/pagination/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# pagination')).toBe(true)
    for (const phrase of [
      'scan-bal-pagination.mjs',
      'one yes/no',
      'ds-pagination',
      'DsPagination',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'variant="dots"',
      'size="sm"',
      'align="center"',
      'textPrevious',
      'dsChange',
      'balPaginationFindNextButton',
      'bal-pagination-controls-left',
      'bal-pagination-page-number',
      'BalProps.BalPaginationAlignment',
      'aria-label="pagination"',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
