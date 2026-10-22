import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalRadio } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-radio.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-radio-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalRadio', () => {
  it('lists React tags and the import symbols and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalRadio, BalRadioGroup } from '@baloise/ds-react'",
        '// <BalRadio /> in a comment',
        "const note = '<BalRadioGroup />'",
        'export const App = () => (',
        '  <BalRadioGroup value="1">',
        '    <BalRadio',
        '      value="1"',
        '    >',
        '      One',
        '    </BalRadio>',
        '  </BalRadioGroup>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalRadio />\n')

    expect(scanBalRadio(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalRadio, BalRadioGroup } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalRadio, BalRadioGroup } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalRadioGroup value="1">' },
            { line: 6, snippet: '<BalRadio value="1">' },
            { line: 10, snippet: '</BalRadio>' },
            { line: 11, snippet: '</BalRadioGroup>' },
          ],
        },
      ],
    })
  })

  it('lists the group and icon tags as findings but not longer names or the ambient types', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-radio-group></bal-radio-group>',
        '<bal-radio-icon></bal-radio-icon>',
        '<bal-radiofoo>',
        '<bal-radio-unknown>',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'const el: HTMLBalRadioElement | null = null',
        'type A = BalEvents.BalRadioChangeDetail',
        "const b: BalProps.BalRadioInterface = 'tile'",
        'type C = BalRadioOption',
      ].join('\n'),
    )

    expect(scanBalRadio(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-radio-group>' },
            { line: 1, snippet: '</bal-radio-group>' },
            { line: 2, snippet: '<bal-radio-icon>' },
            { line: 2, snippet: '</bal-radio-icon>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-radio></bal-radio> -->',
        '<bal-radio-group [(ngModel)]="v"><bal-radio value="1">A</bal-radio></bal-radio-group>',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalRadio, BalRadioGroup } from '@baloise/ds-angular'",
        "const label = '<bal-radio>'",
        '@Component({',
        '  imports: [BalRadio, BalRadioGroup],',
        '  template: `<bal-radio value="2"></bal-radio>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalRadio(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-radio-group [(ngModel)]="v">' },
            { line: 2, snippet: '<bal-radio value="1">' },
            { line: 2, snippet: '</bal-radio>' },
            { line: 2, snippet: '</bal-radio-group>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalRadio, BalRadioGroup } from '@baloise/ds-angular'" },
            { line: 1, snippet: "import { BalRadio, BalRadioGroup } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalRadio, BalRadioGroup],' },
            { line: 4, snippet: 'imports: [BalRadio, BalRadioGroup],' },
            { line: 5, snippet: '<bal-radio value="2">' },
            { line: 5, snippet: '</bal-radio>' },
          ],
        },
      ],
    })
  })

  it('lists newBalRadioOption in a file that never names a tag', () => {
    const root = createScratchDir()
    write(root, 'options.ts', "export const options = [newBalRadioOption({ value: 1, label: 'One' })]\n")

    expect(scanBalRadio(root)).toEqual({
      total: 1,
      files: [
        {
          file: 'options.ts',
          findings: [{ line: 1, snippet: "export const options = [newBalRadioOption({ value: 1, label: 'One' })]" }],
        },
      ],
    })
  })

  it('does not list the shared event names on their own', () => {
    const root = createScratchDir()
    write(root, 'listener.ts', "el.addEventListener('balChange', handler)\nconst x = '(balFocus)'\n")

    expect(scanBalRadio(root)).toEqual({ total: 0, files: [] })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-radio', '  value="1"', '  interface="tile"', '></bal-radio>'].join('\n'))
    write(root, 'notes.md', '<bal-radio></bal-radio>\n')

    const result = scanBalRadio(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[0].snippet).toContain('interface="tile"')
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-radio>' })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-radio></bal-radio>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-radio></bal-radio>\n')
      write(root, `src/${dir}/nested.html`, '<BalRadio />\n')
    }

    expect(scanBalRadio(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-radio>' },
            { line: 1, snippet: '</bal-radio>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-radio value="1"></bal-radio>\n'
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
            { line: 1, snippet: '<bal-radio value="1">' },
            { line: 1, snippet: '</bal-radio>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests radio when the project uses bal-radio and folds the group and icon tags in', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-radio-group>',
        '  <bal-radio value="1"><bal-radio-icon></bal-radio-icon></bal-radio>',
        '</bal-radio-group>',
        '',
      ].join('\n'),
    )

    // bal-radio-group and bal-radio-icon have no migration of their own; the radio
    // migration covers them, so they count towards radio rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'radio', total: 6 }],
      notYet: [],
    })
  })
})

describe('radio migration.md', () => {
  it('titles the component radio and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/radio/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# radio')).toBe(true)
    for (const phrase of [
      'scan-bal-radio.mjs',
      'one yes/no',
      'ds-radio',
      'ds-radio-group',
      'DsRadio',
      'DsRadioGroup',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'bal-radio-icon',
      'newBalRadioOption',
      'tileColor',
      'hideTrigger',
      'slight design deviation',
      'labelHidden',
      'nonSubmit',
      'getInputElement',
      'getOptionByValue',
      'dsChange',
      'balChange',
      'HTMLBalRadioElement',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
