import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalInput } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-input.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-input-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalInput', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalInput } from '@baloise/ds-react'",
        "const _note = 'bal-input'",
        'const _example = \'<BalInput name="a"></BalInput>\'',
        'const _markup = `<BalInput name="a" />`',
        'const _trailing = true // <BalInput name="a" />',
        'const _hidden = /* <bal-input></bal-input> */ null',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalInput name="a" onBalChange={handle}>',
        '        Content',
        '      </BalInput>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalInput clickable />\n')
    write(root, 'dist/ignored.tsx', '<bal-input></bal-input>\n<BalInput />\n')

    expect(scanBalInput(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalInput } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalInput name="a" onBalChange={handle}>' },
            { line: 12, snippet: '</BalInput>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalInput clickable />' }] },
      ],
    })
  })

  it('lists bal-input-date and BalInputDate', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-input-date name="d"></bal-input-date>', '<bal-input name="n"></bal-input>', ''].join('\n'),
    )
    write(root, 'App.tsx', 'import { BalInputDate } from \'@baloise/ds-react\'\nconst _a = <BalInputDate name="d" />\n')

    expect(scanBalInput(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalInputDate } from '@baloise/ds-react'" },
            { line: 2, snippet: '<BalInputDate name="d" />' },
          ],
        },
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-input-date name="d">' },
            { line: 1, snippet: '</bal-input-date>' },
            { line: 2, snippet: '<bal-input name="n">' },
            { line: 2, snippet: '</bal-input>' },
          ],
        },
      ],
    })
  })

  it('does not match sibling components or longer names that merely start with BalInput', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-input-group></bal-input-group>',
        '<bal-input-slider></bal-input-slider>',
        '<bal-input-stepper></bal-input-stepper>',
        '<bal-number-input></bal-number-input>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'class BalInputValueAccessor {}',
        'const BalInputGroup = 1',
        'const BalInputSlider = 1',
        'const BalInputStepper = 1',
        'type BalInputInputType = string',
        '',
      ].join('\n'),
    )

    expect(scanBalInput(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-input></bal-input> -->',
        '<div title="bal-input">text</div>',
        '<p>Mention bal-input in text only.</p>',
        '<bal-input formControlName="name" (balChange)="onChange($event)"></bal-input>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalInput } from '@baloise/ds-angular'",
        "const _decoy = 'bal-input'",
        '// <bal-input></bal-input>',
        '@Component({',
        '  imports: [BalInput],',
        '  template: `',
        '    <!-- <bal-input></bal-input> -->',
        '    <bal-input [(ngModel)]="name"></bal-input>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalInput(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-input formControlName="name" (balChange)="onChange($event)">' },
            { line: 4, snippet: '</bal-input>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 2, snippet: "import { BalInput } from '@baloise/ds-angular'" },
            { line: 6, snippet: 'imports: [BalInput],' },
            { line: 9, snippet: '<bal-input [(ngModel)]="name">' },
            { line: 9, snippet: '</bal-input>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags outside src, including a multiline opening tag, and skips markdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<body>',
        '  <!-- <bal-input></bal-input> -->',
        '  <p>bal-input</p>',
        '  <bal-input name="a"></bal-input>',
        '  <bal-input',
        '    name="b"',
        '    clickable="true"',
        '  ></bal-input>',
        '</body>',
        '',
      ].join('\n'),
    )
    write(root, 'notes.md', '<bal-input></bal-input>\n')

    expect(scanBalInput(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 4, snippet: '<bal-input name="a">' },
            { line: 4, snippet: '</bal-input>' },
            { line: 5, snippet: '<bal-input name="b" clickable="true">' },
            { line: 8, snippet: '</bal-input>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-input name="a"></bal-input>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-input name="a"></bal-input>\n')
      write(root, `src/${dir}/nested.html`, '<BalInput name="a" />\n')
    }

    expect(scanBalInput(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-input name="a">' },
            { line: 1, snippet: '</bal-input>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-input name="a"></bal-input>\n'
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
            { line: 1, snippet: '<bal-input name="a">' },
            { line: 1, snippet: '</bal-input>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('input migration.md', () => {
  it('titles the component input and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/input/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# input\n')).toBe(true)
    for (const phrase of [
      'scan-bal-input.mjs',
      'one yes/no',
      'ds-input',
      'ds-datepicker',
      'bal-input-date',
      'DsInput',
      'DsDatepicker',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'required',
      'textAlign',
      'clickable',
      'hasIconRight',
      'allowInvalidValue',
      'dsKeyPress',
      'dsChange',
      'setAriaForm',
      'bal-input-group',
      'bal-input-slider',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
