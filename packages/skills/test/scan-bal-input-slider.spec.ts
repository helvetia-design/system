import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalInputSlider } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-input-slider.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-input-slider-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalInputSlider', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalInputSlider } from '@baloise/ds-react'",
        "const _note = 'bal-input-slider'",
        'const _example = \'<BalInputSlider name="a"></BalInputSlider>\'',
        'const _markup = `<BalInputSlider name="a" />`',
        'const _trailing = true // <BalInputSlider name="a" />',
        'const _hidden = /* <bal-input-slider></bal-input-slider> */ null',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalInputSlider name="a" onBalChange={handle}>',
        '      </BalInputSlider>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalInputSlider hasTicks />\n')
    write(root, 'dist/ignored.tsx', '<bal-input-slider></bal-input-slider>\n<BalInputSlider />\n')

    expect(scanBalInputSlider(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalInputSlider } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalInputSlider name="a" onBalChange={handle}>' },
            { line: 11, snippet: '</BalInputSlider>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalInputSlider hasTicks />' }] },
      ],
    })
  })

  it('does not match sibling components or longer names that merely start with BalInputSlider', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-input></bal-input>',
        '<bal-input-group></bal-input-group>',
        '<bal-input-stepper></bal-input-stepper>',
        '<bal-input-slider-thumb></bal-input-slider-thumb>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      ['class BalInputSliderValueAccessor {}', 'const BalInput = 1', 'const BalInputStepper = 1', ''].join('\n'),
    )

    expect(scanBalInputSlider(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-input-slider></bal-input-slider> -->',
        '<div title="bal-input-slider">text</div>',
        '<bal-input-slider formControlName="v" (balChange)="onChange($event)"></bal-input-slider>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalInputSlider } from '@baloise/ds-angular'",
        "const _decoy = 'bal-input-slider'",
        '// <bal-input-slider></bal-input-slider>',
        '@Component({',
        '  imports: [BalInputSlider],',
        '  template: `',
        '    <!-- <bal-input-slider></bal-input-slider> -->',
        '    <bal-input-slider [(ngModel)]="v"></bal-input-slider>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalInputSlider(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 3, snippet: '<bal-input-slider formControlName="v" (balChange)="onChange($event)">' },
            { line: 3, snippet: '</bal-input-slider>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 1, snippet: "import { BalInputSlider } from '@baloise/ds-angular'" },
            { line: 5, snippet: 'imports: [BalInputSlider],' },
            { line: 8, snippet: '<bal-input-slider [(ngModel)]="v">' },
            { line: 8, snippet: '</bal-input-slider>' },
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
      ['<bal-input-slider', '  name="b"', '  has-ticks="true"', '></bal-input-slider>', ''].join('\n'),
    )
    write(root, 'notes.md', '<bal-input-slider></bal-input-slider>\n')

    expect(scanBalInputSlider(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-input-slider name="b" has-ticks="true">' },
            { line: 4, snippet: '</bal-input-slider>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [min] and :min bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-input-slider [min]="min" [max]="max" [step]="step" [(ngModel)]="value"></bal-input-slider>',
        '<bal-input-slider :min="min" :max="max" :step="step" :hasTicks="ticks"></bal-input-slider>',
        '',
      ].join('\n'),
    )

    expect(scanBalInputSlider(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-input-slider [min]="min" [max]="max" [step]="step" [(ngModel)]="value">' },
            { line: 1, snippet: '</bal-input-slider>' },
            { line: 2, snippet: '<bal-input-slider :min="min" :max="max" :step="step" :hasTicks="ticks">' },
            { line: 2, snippet: '</bal-input-slider>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-input-slider></bal-input-slider>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-input-slider></bal-input-slider>\n')
      write(root, `src/${dir}/nested.html`, '<BalInputSlider />\n')
    }

    expect(scanBalInputSlider(root).total).toBe(2)
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-input-slider></bal-input-slider>\n'
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
            { line: 1, snippet: '<bal-input-slider>' },
            { line: 1, snippet: '</bal-input-slider>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests input-slider as its own component, separate from input', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-input-slider></bal-input-slider>\n')

    expect(scanMigratable(root).suggested).toEqual([{ name: 'input-slider', total: 2 }])
  })
})

describe('input-slider migration.md', () => {
  it('titles the component input-slider and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/input-slider/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# input-slider\n')).toBe(true)
    for (const phrase of [
      'scan-bal-input-slider.mjs',
      'one yes/no',
      'ds-slider',
      'DsSlider',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'required',
      'step="any"',
      'balTabindex',
      'hasTicks',
      'dsChange',
      'balKeyPress',
      'getInputElement',
      'setAriaForm',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
