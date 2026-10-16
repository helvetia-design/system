import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalNumberInput } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-number-input.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-number-input-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalNumberInput', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalNumberInput } from '@baloise/ds-react'",
        "const _note = 'bal-number-input'",
        'const _example = \'<BalNumberInput name="a"></BalNumberInput>\'',
        'const _markup = `<BalNumberInput name="a" />`',
        'const _trailing = true // <BalNumberInput name="a" />',
        'const _hidden = /* <bal-number-input></bal-number-input> */ null',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalNumberInput name="a" onBalChange={handle}>',
        '      </BalNumberInput>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalNumberInput decimal={2} />\n')
    write(root, 'dist/ignored.tsx', '<bal-number-input></bal-number-input>\n<BalNumberInput />\n')

    expect(scanBalNumberInput(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalNumberInput } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalNumberInput name="a" onBalChange={handle}>' },
            { line: 11, snippet: '</BalNumberInput>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalNumberInput decimal={2} />' }] },
      ],
    })
  })

  it('does not match sibling components or longer names that merely start with BalNumberInput', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-input></bal-input>',
        '<bal-input-stepper></bal-input-stepper>',
        '<bal-number-input-thumb></bal-number-input-thumb>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      ['class BalNumberInputValueAccessor {}', 'const BalInput = 1', 'const BalInputStepper = 1', ''].join('\n'),
    )

    expect(scanBalNumberInput(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-number-input></bal-number-input> -->',
        '<div title="bal-number-input">text</div>',
        '<bal-number-input formControlName="v" (balChange)="onChange($event)"></bal-number-input>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalNumberInput } from '@baloise/ds-angular'",
        "const _decoy = 'bal-number-input'",
        '// <bal-number-input></bal-number-input>',
        '@Component({',
        '  imports: [BalNumberInput],',
        '  template: `',
        '    <!-- <bal-number-input></bal-number-input> -->',
        '    <bal-number-input [(ngModel)]="v"></bal-number-input>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalNumberInput(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 3, snippet: '<bal-number-input formControlName="v" (balChange)="onChange($event)">' },
            { line: 3, snippet: '</bal-number-input>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 1, snippet: "import { BalNumberInput } from '@baloise/ds-angular'" },
            { line: 5, snippet: 'imports: [BalNumberInput],' },
            { line: 8, snippet: '<bal-number-input [(ngModel)]="v">' },
            { line: 8, snippet: '</bal-number-input>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-number-input', '  name="b"', '  decimal="2"', '></bal-number-input>', ''].join('\n'),
    )
    write(root, 'notes.md', '<bal-number-input></bal-number-input>\n')

    expect(scanBalNumberInput(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-number-input name="b" decimal="2">' },
            { line: 4, snippet: '</bal-number-input>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-number-input></bal-number-input>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-number-input></bal-number-input>\n')
      write(root, `src/${dir}/nested.html`, '<BalNumberInput />\n')
    }

    expect(scanBalNumberInput(root).total).toBe(2)
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-number-input></bal-number-input>\n'
    write(root, 'index.html', contents)
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
            { line: 1, snippet: '<bal-number-input>' },
            { line: 1, snippet: '</bal-number-input>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests number-input as its own component, separate from input', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-number-input></bal-number-input>\n')

    expect(scanMigratable(root).suggested).toEqual([{ name: 'number-input', total: 2 }])
  })
})

describe('number-input migration.md', () => {
  it('titles the component number-input and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/number-input/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# number-input')).toBe(true)
    for (const phrase of [
      'scan-bal-number-input.mjs',
      'one yes/no',
      'ds-number-input',
      'DsNumberInput',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'required',
      'dsChange',
      'dsInput',
      'dsBlur',
      'dsFocus',
      'dsKeyPress',
      'aria-labelledby',
      'setAriaForm',
      'getInputElement',
      '::part(input)',
      '::part(increment)',
      'BalEvents.BalNumberInput',
      'invalid-text',
      '.is-danger',
      '.is-disabled',
      'pattern',
      'number | null',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
