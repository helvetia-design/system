import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalSteps } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-steps.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-steps-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalSteps', () => {
  it('lists React tags, the child, and imports, and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalSteps, BalStepItem } from '@baloise/ds-react'",
        "const _note = 'bal-steps'",
        'const _example = \'<BalSteps value="a"></BalSteps>\'',
        'const _markup = `<BalStepItem value="a"></BalStepItem>`',
        'const _trailing = true // <BalSteps color="purple" />',
        'const _hidden = /* <bal-steps>Hi</bal-steps> */ null',
        'void BalButton',
        'export function App() {',
        '  return (',
        '    <BalSteps value="a">',
        '      <BalStepItem value="a" label="One" />',
        '    </BalSteps>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<bal-steps>Hi</bal-steps>\n<BalSteps>Hi</BalSteps>\n')
    write(root, 'packed.tsx', 'const _value = 1// <BalSteps color="purple" />\n')

    expect(scanBalSteps(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalSteps, BalStepItem } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalSteps, BalStepItem } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalSteps value="a">' },
            { line: 11, snippet: '<BalStepItem value="a" label="One" />' },
            { line: 12, snippet: '</BalSteps>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags and the bundle, and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-steps>Hi</bal-steps> -->',
        '<div title="bal-steps">text</div>',
        '<p>Mention bal-steps in text only.</p>',
        '<bal-steps value="a" (balChange)="onChange($event)">',
        '  <bal-step-item value="a" label="One">Hi</bal-step-item>',
        '</bal-steps>',
        '<script>',
        "  const decoy = '<bal-steps></bal-steps>'",
        '</script>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalStepsBundle } from '@baloise/ds-angular'",
        "const _decoy = 'bal-steps'",
        'const _markup = \'<bal-steps value="a"></bal-steps>\'',
        '// <bal-steps color="purple"></bal-steps>',
        '@Component({',
        "  selector: 'app-root',",
        '  imports: [BalStepsBundle],',
        '  template: `',
        '    <!-- <bal-steps></bal-steps> -->',
        '    <bal-steps value="a"></bal-steps>',
        '  `,',
        '})',
        'export class AppComponent {}',
        '@Component({',
        '  template: \'<bal-steps><bal-step-item value="a" href="/a"></bal-step-item></bal-steps>\',',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalSteps(root)).toEqual({
      total: 12,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-steps value="a" (balChange)="onChange($event)">' },
            { line: 5, snippet: '<bal-step-item value="a" label="One">' },
            { line: 5, snippet: '</bal-step-item>' },
            { line: 6, snippet: '</bal-steps>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 2, snippet: "import { BalStepsBundle } from '@baloise/ds-angular'" },
            { line: 8, snippet: 'imports: [BalStepsBundle],' },
            { line: 11, snippet: '<bal-steps value="a">' },
            { line: 11, snippet: '</bal-steps>' },
            { line: 16, snippet: '<bal-steps>' },
            { line: 16, snippet: '<bal-step-item value="a" href="/a">' },
            { line: 16, snippet: '</bal-step-item>' },
            { line: 16, snippet: '</bal-steps>' },
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
        '<!doctype html>',
        '<html>',
        '  <body>',
        '    <!-- <bal-steps color="purple">Hi</bal-steps> -->',
        '    <p>bal-steps</p>',
        '    <bal-steps value="a"></bal-steps>',
        '    <span data-note="<bal-steps></bal-steps>">x</span>',
        '    <!-- prettier-ignore -->',
        '    <bal-steps',
        '      value="b"',
        '      color="green"',
        '    ></bal-steps>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    )
    write(root, 'notes.md', '<bal-steps>Hi</bal-steps>\n')

    expect(scanBalSteps(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 6, snippet: '<bal-steps value="a">' },
            { line: 6, snippet: '</bal-steps>' },
            { line: 9, snippet: '<bal-steps value="b" color="green">' },
            { line: 12, snippet: '</bal-steps>' },
          ],
        },
      ],
    })
  })

  it('lists every tag of steps with step items, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-steps [value]="current">',
        '  <bal-step-item value="1" label="One"></bal-step-item>',
        '  <bal-step-item value="2" label="Two">',
        '    <span>Two</span>',
        '  </bal-step-item>',
        '</bal-steps>',
        '',
      ].join('\n'),
    )

    expect(scanBalSteps(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-steps [value]="current">' },
            { line: 2, snippet: '<bal-step-item value="1" label="One">' },
            { line: 2, snippet: '</bal-step-item>' },
            { line: 3, snippet: '<bal-step-item value="2" label="Two">' },
            { line: 5, snippet: '</bal-step-item>' },
            { line: 6, snippet: '</bal-steps>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-step-item at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-steps>',
        '  <bal-step-item',
        '    value="1"',
        '    label="One"',
        '    done',
        '  ></bal-step-item>',
        '</bal-steps>',
        '',
      ].join('\n'),
    )

    expect(scanBalSteps(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-steps>' },
            { line: 2, snippet: '<bal-step-item value="1" label="One" done>' },
            { line: 6, snippet: '</bal-step-item>' },
            { line: 7, snippet: '</bal-steps>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [prop] and :prop bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-steps [value]="current" (balChange)="onChange($event)">',
        '  <bal-step-item [value]="s.id" [label]="s.label" [done]="s.done"></bal-step-item>',
        '</bal-steps>',
        '<bal-steps :value="current">',
        '  <bal-step-item :value="s.id" :label="s.label"></bal-step-item>',
        '</bal-steps>',
        '',
      ].join('\n'),
    )

    expect(scanBalSteps(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-steps [value]="current" (balChange)="onChange($event)">' },
            { line: 2, snippet: '<bal-step-item [value]="s.id" [label]="s.label" [done]="s.done">' },
            { line: 2, snippet: '</bal-step-item>' },
            { line: 3, snippet: '</bal-steps>' },
            { line: 4, snippet: '<bal-steps :value="current">' },
            { line: 5, snippet: '<bal-step-item :value="s.id" :label="s.label">' },
            { line: 5, snippet: '</bal-step-item>' },
            { line: 6, snippet: '</bal-steps>' },
          ],
        },
      ],
    })
  })

  it('lists the option type that is not next to a tag', () => {
    const root = createScratchDir()
    write(
      root,
      'steps.ts',
      [
        "import { BalStepOption } from '@baloise/ds-core'",
        "const options: BalStepOption[] = [{ value: 'a', label: 'One' }]",
        '',
      ].join('\n'),
    )

    expect(scanBalSteps(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'steps.ts',
          findings: [
            { line: 1, snippet: "import { BalStepOption } from '@baloise/ds-core'" },
            { line: 2, snippet: "const options: BalStepOption[] = [{ value: 'a', label: 'One' }]" },
          ],
        },
      ],
    })
  })

  it('does not match sibling tags, ambient types, or other components that share an event name', () => {
    const root = createScratchDir()
    write(
      root,
      'other.html',
      [
        '<bal-steps-foo>nope</bal-steps-foo>',
        '<bal-step-item-foo>nope</bal-step-item-foo>',
        '<bal-input-stepper (balChange)="x()">nope</bal-input-stepper>',
        '<bal-tabs (balChange)="x()">nope</bal-tabs>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'let color: BalProps.BalStepsColor',
        'let ev: BalEvents.BalStepsChange',
        'let el: HTMLBalStepsElement',
        'let item: HTMLBalStepItemElement',
        'let comp: Components.BalSteps',
        '',
      ].join('\n'),
    )

    expect(scanBalSteps(root)).toEqual({
      total: 1,
      files: [{ file: 'types.ts', findings: [{ line: 5, snippet: 'let comp: Components.BalSteps' }] }],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-steps></bal-steps>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-steps></bal-steps>\n')
      write(root, `src/${dir}/nested.html`, '<BalSteps></BalSteps>\n')
    }

    expect(scanBalSteps(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-steps>' },
            { line: 1, snippet: '</bal-steps>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-steps value="a"></bal-steps>\n'
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
            { line: 1, snippet: '<bal-steps value="a">' },
            { line: 1, snippet: '</bal-steps>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('steps migration.md', () => {
  it('titles the component steps and documents the prop, mode, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/steps/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# steps\n')).toBe(true)
    for (const phrase of [
      'scan-bal-steps.mjs',
      'one yes/no',
      '<ds-steps>',
      'bal-step-item',
      'ds-step-panel',
      'panels mode',
      'navigation mode',
      'aria-current',
      'failed',
      'invalid',
      'invisible',
      'hidden',
      'light-blue',
      'clickable',
      'debounce',
      'options',
      'BalStepsBundle',
      'DsSteps',
      'DsStep',
      'DsStepPanel',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'balChange',
      'dsChange',
      'getOptionByValue',
      'same basename',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
