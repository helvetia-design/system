import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalSelect } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-select.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-select-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalSelect', () => {
  it('lists React tags and the import symbols and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalSelect, BalSelectOption } from '@baloise/ds-react'",
        '// <BalSelect /> in a comment',
        "const note = '<BalSelectOption />'",
        'export const App = () => (',
        '  <BalSelect value="1">',
        '    <BalSelectOption',
        '      value="1"',
        '    >',
        '      One',
        '    </BalSelectOption>',
        '  </BalSelect>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalSelect />\n')

    expect(scanBalSelect(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalSelect, BalSelectOption } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalSelect, BalSelectOption } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalSelect value="1">' },
            { line: 6, snippet: '<BalSelectOption value="1">' },
            { line: 10, snippet: '</BalSelectOption>' },
            { line: 11, snippet: '</BalSelect>' },
          ],
        },
      ],
    })
  })

  it('lists the option tag but not longer names or the ambient types', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-select-option></bal-select-option>', '<bal-selection>', '<bal-select-unknown>'].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'const el: HTMLBalSelectElement | null = null',
        'const opt: HTMLBalSelectOptionElement | null = null',
        'type A = BalEvents.BalSelectChangeDetail',
        'const b: BalProps.BalSelectFilter = "includes"',
        'type C = BalSelectValue',
      ].join('\n'),
    )

    expect(scanBalSelect(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-select-option>' },
            { line: 1, snippet: '</bal-select-option>' },
          ],
        },
      ],
    })
  })

  it('lists Angular inline template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'select.component.ts',
      [
        "import { Component } from '@angular/core'",
        '// <bal-select> in a comment',
        "const note = '<bal-select-option>'",
        '@Component({',
        "  selector: 'app-select',",
        '  template: `',
        '    <bal-select (balChange)="onChange($event)">',
        '      <bal-select-option value="1" label="One"></bal-select-option>',
        '    </bal-select>',
        '  `,',
        '})',
        'export class SelectComponent {}',
      ].join('\n'),
    )

    expect(scanBalSelect(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'select.component.ts',
          findings: [
            { line: 7, snippet: '<bal-select (balChange)="onChange($event)">' },
            { line: 8, snippet: '<bal-select-option value="1" label="One">' },
            { line: 8, snippet: '</bal-select-option>' },
            { line: 9, snippet: '</bal-select>' },
          ],
        },
      ],
    })
  })

  it('does not list the shared event names on their own', () => {
    const root = createScratchDir()
    write(root, 'listener.ts', "el.addEventListener('balChange', handler)\nconst x = '(balFocus)'\n")

    expect(scanBalSelect(root)).toEqual({ total: 0, files: [] })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-select\n  value="1"\n  multiple\n>\n</bal-select>\n')
    write(root, 'README.md', '<bal-select></bal-select>\n')

    expect(scanBalSelect(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-select value="1" multiple>' },
            { line: 5, snippet: '</bal-select>' },
          ],
        },
      ],
    })
  })

  it('lists every tag of a select with its options, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-select placeholder="Pick">',
        '  <bal-select-option value="a" label="A"></bal-select-option>',
        '  <bal-select-option value="b" label="B"></bal-select-option>',
        '</bal-select>',
        '',
      ].join('\n'),
    )

    expect(scanBalSelect(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-select placeholder="Pick">' },
            { line: 2, snippet: '<bal-select-option value="a" label="A">' },
            { line: 2, snippet: '</bal-select-option>' },
            { line: 3, snippet: '<bal-select-option value="b" label="B">' },
            { line: 3, snippet: '</bal-select-option>' },
            { line: 4, snippet: '</bal-select>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-select-option at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-select>',
        '  <bal-select-option',
        '    value="b"',
        '    label="B"',
        '    disabled',
        '  ></bal-select-option>',
        '</bal-select>',
        '',
      ].join('\n'),
    )

    expect(scanBalSelect(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-select>' },
            { line: 2, snippet: '<bal-select-option value="b" label="B" disabled>' },
            { line: 6, snippet: '</bal-select-option>' },
            { line: 7, snippet: '</bal-select>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [value] and :value bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-select [value]="current" [multiple]="many">',
        '  <bal-select-option [value]="o.id" [label]="o.label" *ngFor="let o of options"></bal-select-option>',
        '</bal-select>',
        '<bal-select :value="current" :multiple="many">',
        '  <bal-select-option :value="o.id" :label="o.label"></bal-select-option>',
        '</bal-select>',
        '',
      ].join('\n'),
    )

    expect(scanBalSelect(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-select [value]="current" [multiple]="many">' },
            { line: 2, snippet: '<bal-select-option [value]="o.id" [label]="o.label" *ngFor="let o of options">' },
            { line: 2, snippet: '</bal-select-option>' },
            { line: 3, snippet: '</bal-select>' },
            { line: 4, snippet: '<bal-select :value="current" :multiple="many">' },
            { line: 5, snippet: '<bal-select-option :value="o.id" :label="o.label">' },
            { line: 5, snippet: '</bal-select-option>' },
            { line: 6, snippet: '</bal-select>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']) {
      write(root, `${dir}/x.html`, '<bal-select></bal-select>\n')
    }

    expect(scanBalSelect(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-select value="1"></bal-select>\n'
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
            { line: 1, snippet: '<bal-select value="1">' },
            { line: 1, snippet: '</bal-select>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests select when the project uses bal-select and folds the option tag in', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-select>', '  <bal-select-option value="1" label="One"></bal-select-option>', '</bal-select>', ''].join(
        '\n',
      ),
    )

    // bal-select-option has no migration of its own; the select migration covers it,
    // so it counts towards select rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'select', total: 4 }],
      notYet: [],
    })
  })
})

describe('select migration.md', () => {
  it('titles the component select and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/select/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# select')).toBe(true)
    for (const phrase of [
      'scan-bal-select.mjs',
      'one yes/no',
      'ds-select',
      'ds-select-option',
      'DsSelect',
      'DsSelectOption',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'typeahead',
      'searchable',
      'balTabindex',
      'check behaviour',
      'required',
      'dsChange',
      'balChange',
      'dsClick',
      'balInputClick',
      'getValue',
      'HTMLBalSelectElement',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
