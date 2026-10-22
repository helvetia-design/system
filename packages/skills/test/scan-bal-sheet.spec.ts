import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalSheet } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-sheet.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-sheet-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalSheet', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalSheet } from '@baloise/ds-react'",
        '// <BalSheet /> in a comment',
        "const note = '<BalSheet />'",
        'export const App = () => (',
        '  <BalSheet containerSize="fluid" />',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalSheet />\n')

    expect(scanBalSheet(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalSheet } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalSheet containerSize="fluid" />' },
          ],
        },
      ],
    })
  })

  it('lists the HTML tag but not longer names or the type references', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-sheet></bal-sheet>', '<bal-sheets>', '<bal-sheet-unknown>'].join('\n'))
    write(
      root,
      'types.ts',
      [
        'const a: BalProps.BalSheetContainer = "fluid"',
        'type B = BalProps.BalSheetContainer',
        'type C = BalSheetContainer',
      ].join('\n'),
    )

    expect(scanBalSheet(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-sheet>' },
            { line: 1, snippet: '</bal-sheet>' },
          ],
        },
      ],
    })
  })

  it('lists Angular inline template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'sheet.component.ts',
      [
        "import { Component } from '@angular/core'",
        '// <bal-sheet> in a comment',
        "const note = '<bal-sheet>'",
        '@Component({',
        "  selector: 'app-sheet',",
        '  template: `',
        '    <bal-sheet [containerSize]="size" container-size="compact"></bal-sheet>',
        '  `,',
        '})',
        'export class SheetComponent {}',
      ].join('\n'),
    )

    expect(scanBalSheet(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'sheet.component.ts',
          findings: [
            { line: 7, snippet: '<bal-sheet [containerSize]="size" container-size="compact">' },
            { line: 7, snippet: '</bal-sheet>' },
          ],
        },
      ],
    })
  })

  it('lists an Angular .html template and a multiline opening tag, and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'sheet.component.html', '<bal-sheet\n  container-size="detail-page"\n  class="x"\n></bal-sheet>\n')
    write(root, 'README.md', '<bal-sheet></bal-sheet>\n')

    expect(scanBalSheet(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'sheet.component.html',
          findings: [
            { line: 1, snippet: '<bal-sheet container-size="detail-page" class="x">' },
            { line: 4, snippet: '</bal-sheet>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']) {
      write(root, `${dir}/x.html`, '<bal-sheet></bal-sheet>\n')
    }

    expect(scanBalSheet(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-sheet container-size="fluid"></bal-sheet>\n'
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
            { line: 1, snippet: '<bal-sheet container-size="fluid">' },
            { line: 1, snippet: '</bal-sheet>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests sheet when the project uses bal-sheet', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-sheet></bal-sheet>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'sheet', total: 2 }],
      notYet: [],
    })
  })
})

describe('sheet migration.md', () => {
  it('titles the component sheet and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/sheet/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# sheet')).toBe(true)
    for (const phrase of [
      'scan-bal-sheet.mjs',
      'one yes/no',
      'ds-sheet',
      'DsSheet',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'container-size',
      'detail-page',
      'blog-page',
      'BalProps.BalSheetContainer',
      '--bal-sheet-background',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
