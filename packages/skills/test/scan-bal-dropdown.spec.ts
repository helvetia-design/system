import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalDropdown } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-dropdown.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-dropdown-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalDropdown', () => {
  it('lists React tags and the import symbols and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalDropdown, BalOption } from '@baloise/ds-react'",
        '// <BalDropdown /> in a comment',
        "const note = '<BalOption />'",
        'export const App = () => (',
        '  <BalDropdown name="sort">',
        '    <BalOption',
        '      value="1"',
        '      label="One"',
        '    >',
        '      One',
        '    </BalOption>',
        '  </BalDropdown>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalDropdown />\n')

    expect(scanBalDropdown(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalDropdown, BalOption } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalDropdown, BalOption } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalDropdown name="sort">' },
            { line: 6, snippet: '<BalOption value="1" label="One">' },
            { line: 11, snippet: '</BalOption>' },
            { line: 12, snippet: '</BalDropdown>' },
          ],
        },
      ],
    })
  })

  it('lists the dropdown, option and option-list tags and their HTMLBal*Element types, but not longer names or the select option', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-dropdown>',
        '  <bal-option-list>',
        '    <bal-option value="a">A</bal-option>',
        '  </bal-option-list>',
        '</bal-dropdown>',
        '<bal-option-foo></bal-option-foo>',
        '<bal-dropdown-menu></bal-dropdown-menu>',
        '<bal-select-option></bal-select-option>',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'const el: HTMLBalDropdownElement | null = null',
        'const opt: HTMLBalOptionElement | null = null',
        'const list: HTMLBalOptionListElement | null = null',
        "const f: BalProps.BalOptionListFilter = 'includes'",
        "const s: BalProps.BalDropdownSize = 'small'",
        'type V = BalOptionValue',
        'type W = BalOptionListFilter',
        'type A = BalDropdownValueAccessor',
        "const o = newBalOptionValue('a', 'A')",
      ].join('\n'),
    )

    expect(scanBalDropdown(root)).toEqual({
      total: 9,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-dropdown>' },
            { line: 2, snippet: '<bal-option-list>' },
            { line: 3, snippet: '<bal-option value="a">' },
            { line: 3, snippet: '</bal-option>' },
            { line: 4, snippet: '</bal-option-list>' },
            { line: 5, snippet: '</bal-dropdown>' },
          ],
        },
        {
          file: 'types.ts',
          findings: [
            { line: 1, snippet: 'const el: HTMLBalDropdownElement | null = null' },
            { line: 2, snippet: 'const opt: HTMLBalOptionElement | null = null' },
            { line: 3, snippet: 'const list: HTMLBalOptionListElement | null = null' },
          ],
        },
      ],
    })
  })

  it('lists a self-closing bal-option, a React BalOptionList and the BalOptionChange event alias', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-dropdown><bal-option value="a" label="A" /></bal-dropdown>\n')
    write(
      root,
      'List.tsx',
      [
        '<BalOptionList>',
        '  <BalOption value="a" label="A" />',
        '</BalOptionList>',
        'function onOption(e: BalEvents.BalOptionChange) {}',
      ].join('\n'),
    )

    expect(scanBalDropdown(root)).toEqual({
      total: 7,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-dropdown>' },
            { line: 1, snippet: '<bal-option value="a" label="A" />' },
            { line: 1, snippet: '</bal-dropdown>' },
          ],
        },
        {
          file: 'List.tsx',
          findings: [
            { line: 1, snippet: '<BalOptionList>' },
            { line: 2, snippet: '<BalOption value="a" label="A" />' },
            { line: 3, snippet: '</BalOptionList>' },
            { line: 4, snippet: 'function onOption(e: BalEvents.BalOptionChange) {}' },
          ],
        },
      ],
    })
  })

  it('lists Angular inline template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'dropdown.component.ts',
      [
        "import { Component } from '@angular/core'",
        '// <bal-dropdown> in a comment',
        "const note = '<bal-option>'",
        '@Component({',
        "  selector: 'app-dropdown',",
        '  template: `',
        '    <bal-dropdown (balChange)="onChange($event)">',
        '      <bal-option value="1" label="One">One</bal-option>',
        '    </bal-dropdown>',
        '  `,',
        '})',
        'export class DropdownComponent {}',
      ].join('\n'),
    )

    expect(scanBalDropdown(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'dropdown.component.ts',
          findings: [
            { line: 7, snippet: '<bal-dropdown (balChange)="onChange($event)">' },
            { line: 8, snippet: '<bal-option value="1" label="One">' },
            { line: 8, snippet: '</bal-option>' },
            { line: 9, snippet: '</bal-dropdown>' },
          ],
        },
      ],
    })
  })

  it('does not list the shared event names on their own', () => {
    const root = createScratchDir()
    write(
      root,
      'listener.ts',
      "el.addEventListener('balChange', handler)\nconst x = '(balFocus)'\nel.addEventListener('balOptionChange', h)\n",
    )

    expect(scanBalDropdown(root)).toEqual({ total: 0, files: [] })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-dropdown\n  value="1"\n  multiple\n>\n</bal-dropdown>\n')
    write(root, 'README.md', '<bal-dropdown></bal-dropdown>\n')

    expect(scanBalDropdown(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-dropdown value="1" multiple>' },
            { line: 5, snippet: '</bal-dropdown>' },
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
        '<bal-dropdown [value]="current" [multiple]="many">',
        '  <bal-option [value]="o.id" [label]="o.label" *ngFor="let o of options">{{ o.label }}</bal-option>',
        '</bal-dropdown>',
        '<bal-dropdown :value="current" :multiple="many">',
        '  <bal-option :value="o.id" :label="o.label"></bal-option>',
        '</bal-dropdown>',
        '',
      ].join('\n'),
    )

    expect(scanBalDropdown(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-dropdown [value]="current" [multiple]="many">' },
            { line: 2, snippet: '<bal-option [value]="o.id" [label]="o.label" *ngFor="let o of options">' },
            { line: 2, snippet: '</bal-option>' },
            { line: 3, snippet: '</bal-dropdown>' },
            { line: 4, snippet: '<bal-dropdown :value="current" :multiple="many">' },
            { line: 5, snippet: '<bal-option :value="o.id" :label="o.label">' },
            { line: 5, snippet: '</bal-option>' },
            { line: 6, snippet: '</bal-dropdown>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']) {
      write(root, `${dir}/x.html`, '<bal-dropdown></bal-dropdown>\n')
    }

    expect(scanBalDropdown(root)).toEqual({ total: 0, files: [] })
  })

  it('lists newBalOption calls and imports', () => {
    const root = createScratchDir()
    write(
      root,
      'options.ts',
      [
        "import { newBalOption } from '@baloise/ds-core'",
        "export const options = [newBalOption({ value: 'a', label: 'A' }, { disabled: true })]",
        '',
      ].join('\n'),
    )

    expect(scanBalDropdown(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'options.ts',
          findings: [
            { line: 1, snippet: "import { newBalOption } from '@baloise/ds-core'" },
            {
              line: 2,
              snippet: "export const options = [newBalOption({ value: 'a', label: 'A' }, { disabled: true })]",
            },
          ],
        },
      ],
    })
  })

  it('lists the bundle and BalEvents types once per occurrence, but not BalProps or multi-family bundles', () => {
    const root = createScratchDir()
    write(
      root,
      'profile.component.ts',
      [
        "import { BalFormBundle, BalDropdownBundle } from '@baloise/ds-angular'",
        '@Component({ imports: [...BalDropdownBundle, ...BalFormBundle] })',
        'export class ProfileComponent {',
        '  onChange(event: BalEvents.BalDropdownCustomEvent<string>) {}',
        '  onOption(event: BalEvents.BalOptionCustomEvent<BalEvents.BalOption>) {}',
        '  onBare(event: BalDropdownCustomEvent<string>) {}',
        '  detail?: BalEvents.BalDropdownChangeDetail',
        '  both(a: BalEvents.BalDropdownBlur, b: BalOptionCustomEvent<string>) {}',
        '  list(c: BalOptionListCustomEvent<void>) {}',
        '  size?: BalProps.BalDropdownSize',
        '  el?: HTMLBalDropdownElement',
        '}',
        '',
      ].join('\n'),
    )

    const line = (n: number, snippet: string) => ({ line: n, snippet })
    expect(scanBalDropdown(root)).toEqual({
      total: 11,
      files: [
        {
          file: 'profile.component.ts',
          findings: [
            line(1, "import { BalFormBundle, BalDropdownBundle } from '@baloise/ds-angular'"),
            line(2, '@Component({ imports: [...BalDropdownBundle, ...BalFormBundle] })'),
            line(4, 'onChange(event: BalEvents.BalDropdownCustomEvent<string>) {}'),
            line(5, 'onOption(event: BalEvents.BalOptionCustomEvent<BalEvents.BalOption>) {}'),
            line(5, 'onOption(event: BalEvents.BalOptionCustomEvent<BalEvents.BalOption>) {}'),
            line(6, 'onBare(event: BalDropdownCustomEvent<string>) {}'),
            line(7, 'detail?: BalEvents.BalDropdownChangeDetail'),
            line(8, 'both(a: BalEvents.BalDropdownBlur, b: BalOptionCustomEvent<string>) {}'),
            line(8, 'both(a: BalEvents.BalDropdownBlur, b: BalOptionCustomEvent<string>) {}'),
            line(9, 'list(c: BalOptionListCustomEvent<void>) {}'),
            line(11, 'el?: HTMLBalDropdownElement'),
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-dropdown value="1"></bal-dropdown>\n'
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
            { line: 1, snippet: '<bal-dropdown value="1">' },
            { line: 1, snippet: '</bal-dropdown>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests dropdown when the project uses bal-dropdown and folds the option and option-list tags in', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-dropdown>',
        '  <bal-option-list>',
        '    <bal-option value="1" label="One">One</bal-option>',
        '  </bal-option-list>',
        '</bal-dropdown>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'dropdown', total: 3 }],
      notYet: [],
      types: [],
    })
  })
})

describe('dropdown migration.md', () => {
  it('titles the component dropdown and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/dropdown/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# dropdown → select')).toBe(true)
    for (const phrase of [
      'scan-bal-dropdown.mjs',
      'one yes/no',
      'ds-select',
      'ds-select-option',
      'bal-option-list',
      'DsSelect',
      'DsSelectOption',
      'BalDropdownBundle',
      'newBalOption',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'check behaviour',
      'required',
      'dsChange',
      'balChange',
      'balOptionChange',
      'getValue',
      'HTMLBalDropdownElement',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
