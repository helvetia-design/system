import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalInputStepper } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-input-stepper.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-input-stepper-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalInputStepper', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalInputStepper } from '@baloise/ds-react'",
        "const _note = 'bal-input-stepper'",
        'const _example = \'<BalInputStepper name="a"></BalInputStepper>\'',
        'const _markup = `<BalInputStepper name="a" />`',
        'const _trailing = true // <BalInputStepper name="a" />',
        'const _hidden = /* <bal-input-stepper></bal-input-stepper> */ null',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalInputStepper name="a" onBalChange={handle}>',
        '      </BalInputStepper>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalInputStepper steps={2} />\n')
    write(root, 'dist/ignored.tsx', '<bal-input-stepper></bal-input-stepper>\n<BalInputStepper />\n')

    expect(scanBalInputStepper(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalInputStepper } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalInputStepper name="a" onBalChange={handle}>' },
            { line: 11, snippet: '</BalInputStepper>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalInputStepper steps={2} />' }] },
      ],
    })
  })

  it('does not match sibling components or longer names that merely start with BalInputStepper', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-input></bal-input>',
        '<bal-input-group></bal-input-group>',
        '<bal-input-slider></bal-input-slider>',
        '<bal-input-stepper-thumb></bal-input-stepper-thumb>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      ['class BalInputStepperValueAccessor {}', 'const BalInput = 1', 'const BalInputSlider = 1', ''].join('\n'),
    )

    expect(scanBalInputStepper(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-input-stepper></bal-input-stepper> -->',
        '<div title="bal-input-stepper">text</div>',
        '<bal-input-stepper formControlName="v" (balChange)="onChange($event)"></bal-input-stepper>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalInputStepper } from '@baloise/ds-angular'",
        "const _decoy = 'bal-input-stepper'",
        '// <bal-input-stepper></bal-input-stepper>',
        '@Component({',
        '  imports: [BalInputStepper],',
        '  template: `',
        '    <!-- <bal-input-stepper></bal-input-stepper> -->',
        '    <bal-input-stepper [(ngModel)]="v"></bal-input-stepper>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalInputStepper(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 3, snippet: '<bal-input-stepper formControlName="v" (balChange)="onChange($event)">' },
            { line: 3, snippet: '</bal-input-stepper>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 1, snippet: "import { BalInputStepper } from '@baloise/ds-angular'" },
            { line: 5, snippet: 'imports: [BalInputStepper],' },
            { line: 8, snippet: '<bal-input-stepper [(ngModel)]="v">' },
            { line: 8, snippet: '</bal-input-stepper>' },
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
      ['<bal-input-stepper', '  name="b"', '  steps="2"', '></bal-input-stepper>', ''].join('\n'),
    )
    write(root, 'notes.md', '<bal-input-stepper></bal-input-stepper>\n')

    expect(scanBalInputStepper(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-input-stepper name="b" steps="2">' },
            { line: 4, snippet: '</bal-input-stepper>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-input-stepper></bal-input-stepper>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-input-stepper></bal-input-stepper>\n')
      write(root, `src/${dir}/nested.html`, '<BalInputStepper />\n')
    }

    expect(scanBalInputStepper(root).total).toBe(2)
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-input-stepper></bal-input-stepper>\n'
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
            { line: 1, snippet: '<bal-input-stepper>' },
            { line: 1, snippet: '</bal-input-stepper>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests input-stepper as its own component, separate from input', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-input-stepper></bal-input-stepper>\n')

    expect(scanMigratable(root).suggested).toEqual([{ name: 'input-stepper', total: 2 }])
  })
})

describe('input-stepper migration.md', () => {
  it('titles the component input-stepper and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/input-stepper/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# input-stepper')).toBe(true)
    for (const phrase of [
      'scan-bal-input-stepper.mjs',
      'one yes/no',
      'ds-counter',
      'DsCounter',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'steps',
      'step',
      'required',
      'dsChange',
      'dsIncrease',
      'dsDecrease',
      'dsFocus',
      'dsBlur',
      'getInputElement',
      'setAriaForm',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
