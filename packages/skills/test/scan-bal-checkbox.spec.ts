import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalCheckbox } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-checkbox.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-checkbox-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalCheckbox', () => {
  it('lists React tags, the group tag, and the import symbols, and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalCheckbox, BalCheckboxGroup } from '@baloise/ds-react'",
        "const _note = 'bal-checkbox'",
        'const _example = \'<BalCheckbox value="1"></BalCheckbox>\'',
        'const _markup = `<BalCheckboxGroup />`',
        'const _trailing = true // <BalCheckbox />',
        'const _hidden = /* <bal-checkbox></bal-checkbox> */ null',
        'type BalCheckboxOption = string',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalCheckboxGroup control>',
        '        <BalCheckbox value="1">',
        '          Label',
        '        </BalCheckbox>',
        '      </BalCheckboxGroup>',
        '      <BalCheckbox interface="switch">Switch</BalCheckbox>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalCheckbox value="1">Hi</BalCheckbox>\n')
    write(root, 'dist/ignored.tsx', '<bal-checkbox></bal-checkbox>\n<BalCheckbox />\n')
    write(root, 'packed.tsx', 'const _value = 1// <BalCheckbox />\n')

    const importLine = "import { BalCheckbox, BalCheckboxGroup } from '@baloise/ds-react'"

    expect(scanBalCheckbox(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: importLine },
            { line: 1, snippet: importLine },
            { line: 11, snippet: '<BalCheckboxGroup control>' },
            { line: 12, snippet: '<BalCheckbox value="1">' },
            { line: 14, snippet: '</BalCheckbox>' },
            { line: 15, snippet: '</BalCheckboxGroup>' },
            { line: 16, snippet: '<BalCheckbox interface="switch">' },
            { line: 16, snippet: '</BalCheckbox>' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [
            { line: 1, snippet: '<BalCheckbox value="1">' },
            { line: 1, snippet: '</BalCheckbox>' },
          ],
        },
      ],
    })
  })

  it('does not match a longer PascalCase name that merely starts with BalCheckbox', () => {
    const root = createScratchDir()
    write(root, 'types.ts', ['type BalCheckboxOption = string', 'const BalCheckboxish = 1', ''].join('\n'))

    expect(scanBalCheckbox(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags, the group child tag, and separate imports (no bundle), skipping comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-checkbox></bal-checkbox> -->',
        '<div title="bal-checkbox">text</div>',
        '<p>Mention bal-checkbox in text only.</p>',
        '<bal-checkbox-group #cg control value="1">',
        '  <bal-checkbox value="1" interface="switch"></bal-checkbox>',
        '</bal-checkbox-group>',
        '<script>',
        "  const decoy = '<bal-checkbox></bal-checkbox>'",
        '</script>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalCheckbox, BalCheckboxGroup } from '@baloise/ds-angular'",
        "const _decoy = 'bal-checkbox'",
        '// <bal-checkbox></bal-checkbox>',
        '@Component({',
        '  imports: [BalCheckbox, BalCheckboxGroup],',
        '  template: `',
        '    <!-- <bal-checkbox></bal-checkbox> -->',
        '    <bal-checkbox-group control value="1">',
        '      <bal-checkbox value="1"></bal-checkbox>',
        '    </bal-checkbox-group>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    const importLine = "import { BalCheckbox, BalCheckboxGroup } from '@baloise/ds-angular'"

    expect(scanBalCheckbox(root)).toEqual({
      total: 12,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-checkbox-group #cg control value="1">' },
            { line: 5, snippet: '<bal-checkbox value="1" interface="switch">' },
            { line: 5, snippet: '</bal-checkbox>' },
            { line: 6, snippet: '</bal-checkbox-group>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 2, snippet: importLine },
            { line: 2, snippet: importLine },
            { line: 6, snippet: 'imports: [BalCheckbox, BalCheckboxGroup],' },
            { line: 6, snippet: 'imports: [BalCheckbox, BalCheckboxGroup],' },
            { line: 9, snippet: '<bal-checkbox-group control value="1">' },
            { line: 10, snippet: '<bal-checkbox value="1">' },
            { line: 10, snippet: '</bal-checkbox>' },
            { line: 11, snippet: '</bal-checkbox-group>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags outside src, including a multiline group tag, and skips markdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<!doctype html>',
        '<html>',
        '  <body>',
        '    <!-- <bal-checkbox></bal-checkbox> -->',
        '    <p>bal-checkbox</p>',
        '    <bal-checkbox value="1"></bal-checkbox>',
        '    <span data-note="<bal-checkbox></bal-checkbox>">x</span>',
        '    <!-- prettier-ignore -->',
        '    <bal-checkbox-group',
        '      control',
        '      value="1"',
        '    ></bal-checkbox-group>',
        '    <div>// <bal-checkbox value="2"></bal-checkbox></div>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    )
    write(root, 'nested/page.html', '<bal-checkbox-group control></bal-checkbox-group>\n')
    write(root, 'notes.md', '<bal-checkbox></bal-checkbox>\n')

    expect(scanBalCheckbox(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 6, snippet: '<bal-checkbox value="1">' },
            { line: 6, snippet: '</bal-checkbox>' },
            { line: 9, snippet: '<bal-checkbox-group control value="1">' },
            { line: 12, snippet: '</bal-checkbox-group>' },
            { line: 13, snippet: '<bal-checkbox value="2">' },
            { line: 13, snippet: '</bal-checkbox>' },
          ],
        },
        {
          file: 'nested/page.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox-group control>' },
            { line: 1, snippet: '</bal-checkbox-group>' },
          ],
        },
      ],
    })
  })

  it('lists every tag of a checkbox group and the checkboxes inside it, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-checkbox-group>',
        '  <bal-checkbox value="a">A</bal-checkbox>',
        '  <bal-checkbox-group>',
        '    <bal-checkbox value="b">B</bal-checkbox>',
        '  </bal-checkbox-group>',
        '</bal-checkbox-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox-group>' },
            { line: 2, snippet: '<bal-checkbox value="a">' },
            { line: 2, snippet: '</bal-checkbox>' },
            { line: 3, snippet: '<bal-checkbox-group>' },
            { line: 4, snippet: '<bal-checkbox value="b">' },
            { line: 4, snippet: '</bal-checkbox>' },
            { line: 5, snippet: '</bal-checkbox-group>' },
            { line: 6, snippet: '</bal-checkbox-group>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-checkbox inside a group at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-checkbox-group>',
        '  <bal-checkbox',
        '    value="a"',
        '    name="opt"',
        '  >A</bal-checkbox>',
        '</bal-checkbox-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox-group>' },
            { line: 2, snippet: '<bal-checkbox value="a" name="opt">' },
            { line: 5, snippet: '</bal-checkbox>' },
            { line: 6, snippet: '</bal-checkbox-group>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [checked] and :checked bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-checkbox-group [disabled]="locked" [vertical]="stacked">',
        '  <bal-checkbox [value]="item.id" [checked]="item.on" *ngFor="let item of items"></bal-checkbox>',
        '</bal-checkbox-group>',
        '<bal-checkbox :value="item.id" :checked="item.on" :invalid="bad"></bal-checkbox>',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox-group [disabled]="locked" [vertical]="stacked">' },
            { line: 2, snippet: '<bal-checkbox [value]="item.id" [checked]="item.on" *ngFor="let item of items">' },
            { line: 2, snippet: '</bal-checkbox>' },
            { line: 3, snippet: '</bal-checkbox-group>' },
            { line: 4, snippet: '<bal-checkbox :value="item.id" :checked="item.on" :invalid="bad">' },
            { line: 4, snippet: '</bal-checkbox>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-checkbox value="1"></bal-checkbox>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-checkbox value="1"></bal-checkbox>\n')
      write(root, `src/${dir}/nested.html`, '<BalCheckbox value="1" />\n')
    }

    expect(scanBalCheckbox(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox value="1">' },
            { line: 1, snippet: '</bal-checkbox>' },
          ],
        },
      ],
    })
  })

  it('lists a bare newBalCheckboxOption() call as a usage signal, skipping it inside strings and comments', () => {
    const root = createScratchDir()
    write(
      root,
      'options.ts',
      [
        "import { newBalCheckboxOption } from '@baloise/ds-core'",
        'const options = [newBalCheckboxOption({ value: "1", label: "Label 1" })]',
        "const decoy = 'newBalCheckboxOption'",
        '// newBalCheckboxOption',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'options.ts',
          findings: [
            { line: 1, snippet: "import { newBalCheckboxOption } from '@baloise/ds-core'" },
            { line: 2, snippet: 'const options = [newBalCheckboxOption({ value: "1", label: "Label 1" })]' },
          ],
        },
      ],
    })
  })

  it('lists bal-check and bal-switch tags and the BalCheck and BalSwitch symbols, without matching them inside bal-checkbox', () => {
    const root = createScratchDir()
    write(
      root,
      'indicators.html',
      [
        '<bal-check checked></bal-check>',
        '<bal-switch [checked]="on" inverted></bal-switch>',
        '<bal-checkbox value="1"></bal-checkbox>',
        '<bal-check-list></bal-check-list>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'Indicators.tsx',
      [
        "import { BalCheck, BalCheckbox, BalSwitch } from '@baloise/ds-react'",
        'type BalCheckOption = string',
        'export const Indicators = () => <BalCheck checked />',
        'export const Toggle = () => <BalSwitch checked />',
        '',
      ].join('\n'),
    )

    const importLine = "import { BalCheck, BalCheckbox, BalSwitch } from '@baloise/ds-react'"

    expect(scanBalCheckbox(root)).toEqual({
      total: 11,
      files: [
        {
          file: 'indicators.html',
          findings: [
            { line: 1, snippet: '<bal-check checked>' },
            { line: 1, snippet: '</bal-check>' },
            { line: 2, snippet: '<bal-switch [checked]="on" inverted>' },
            { line: 2, snippet: '</bal-switch>' },
            { line: 3, snippet: '<bal-checkbox value="1">' },
            { line: 3, snippet: '</bal-checkbox>' },
          ],
        },
        {
          file: 'Indicators.tsx',
          findings: [
            { line: 1, snippet: importLine },
            { line: 1, snippet: importLine },
            { line: 1, snippet: importLine },
            { line: 3, snippet: '<BalCheck checked />' },
            { line: 4, snippet: '<BalSwitch checked />' },
          ],
        },
      ],
    })
  })

  it('flags a switch group with a bound value or a forms binding as switchGroup', () => {
    const root = createScratchDir()
    write(
      root,
      'Topics.tsx',
      [
        'export const Topics = () => (',
        '  <BalCheckboxGroup name="topics" value={topics} interface="switch" onBalChange={onChange}>',
        '    <BalCheckbox value="news">News</BalCheckbox>',
        '  </BalCheckboxGroup>',
        ')',
        '',
      ].join('\n'),
    )
    write(
      root,
      'topics.component.html',
      [
        '<bal-checkbox-group formControlName="topics">',
        '  <bal-checkbox value="news" interface="switch"></bal-checkbox>',
        '</bal-checkbox-group>',
        '<bal-checkbox-group [value]="topics">',
        '  <bal-checkbox value="news" [interface]="\'switch\'"></bal-checkbox>',
        '</bal-checkbox-group>',
        '<bal-checkbox-group interface="switch">',
        '  <bal-checkbox value="news"></bal-checkbox>',
        '</bal-checkbox-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root)).toEqual({
      total: 16,
      files: [
        {
          file: 'topics.component.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox-group formControlName="topics">', switchGroup: true },
            { line: 2, snippet: '<bal-checkbox value="news" interface="switch">' },
            { line: 2, snippet: '</bal-checkbox>' },
            { line: 3, snippet: '</bal-checkbox-group>' },
            { line: 4, snippet: '<bal-checkbox-group [value]="topics">', switchGroup: true },
            { line: 5, snippet: '<bal-checkbox value="news" [interface]="\'switch\'">' },
            { line: 5, snippet: '</bal-checkbox>' },
            { line: 6, snippet: '</bal-checkbox-group>' },
            { line: 7, snippet: '<bal-checkbox-group interface="switch">' },
            { line: 8, snippet: '<bal-checkbox value="news">' },
            { line: 8, snippet: '</bal-checkbox>' },
            { line: 9, snippet: '</bal-checkbox-group>' },
          ],
        },
        {
          file: 'Topics.tsx',
          findings: [
            {
              line: 2,
              snippet: '<BalCheckboxGroup name="topics" value={topics} interface="switch" onBalChange={onChange}>',
              switchGroup: true,
            },
            { line: 3, snippet: '<BalCheckbox value="news">' },
            { line: 3, snippet: '</BalCheckbox>' },
            { line: 4, snippet: '</BalCheckboxGroup>' },
          ],
        },
      ],
    })
  })

  it('flags a bound group without control as unboundControl and a forms-bound single checkbox as formsBinding', () => {
    const root = createScratchDir()
    write(
      root,
      'form.component.html',
      [
        '<bal-checkbox-group [formControl]="topics"></bal-checkbox-group>',
        '<bal-checkbox-group [(ngModel)]="topics"></bal-checkbox-group>',
        '<bal-checkbox-group control [value]="topics"></bal-checkbox-group>',
        '<bal-checkbox-group control value="a"></bal-checkbox-group>',
        '<bal-checkbox formControlName="terms"></bal-checkbox>',
        '<bal-checkbox [(ngModel)]="terms"></bal-checkbox>',
        '<bal-checkbox [checked]="terms" (ngModelChange)="x"></bal-checkbox>',
        '',
      ].join('\n'),
    )
    write(root, 'Group.tsx', 'export const Group = () => <BalCheckboxGroup value={topics} onBalChange={onChange} />\n')

    expect(scanBalCheckbox(root)).toEqual({
      total: 15,
      files: [
        {
          file: 'form.component.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox-group [formControl]="topics">', unboundControl: true },
            { line: 1, snippet: '</bal-checkbox-group>' },
            { line: 2, snippet: '<bal-checkbox-group [(ngModel)]="topics">', unboundControl: true },
            { line: 2, snippet: '</bal-checkbox-group>' },
            { line: 3, snippet: '<bal-checkbox-group control [value]="topics">' },
            { line: 3, snippet: '</bal-checkbox-group>' },
            { line: 4, snippet: '<bal-checkbox-group control value="a">' },
            { line: 4, snippet: '</bal-checkbox-group>' },
            { line: 5, snippet: '<bal-checkbox formControlName="terms">', formsBinding: true },
            { line: 5, snippet: '</bal-checkbox>' },
            { line: 6, snippet: '<bal-checkbox [(ngModel)]="terms">', formsBinding: true },
            { line: 6, snippet: '</bal-checkbox>' },
            { line: 7, snippet: '<bal-checkbox [checked]="terms" (ngModelChange)="x">' },
            { line: 7, snippet: '</bal-checkbox>' },
          ],
        },
        {
          file: 'Group.tsx',
          findings: [
            {
              line: 1,
              snippet: '<BalCheckboxGroup value={topics} onBalChange={onChange} />',
              unboundControl: true,
            },
          ],
        },
      ],
    })
  })

  it('flags setValue() on a legacy group ref in the sibling .ts, but not a FormControl.setValue', () => {
    const root = createScratchDir()
    write(root, 'topics.component.html', '<bal-checkbox-group #topicsGroup></bal-checkbox-group>\n')
    write(
      root,
      'topics.component.ts',
      [
        'export class TopicsComponent {',
        "  @ViewChild('topicsGroup') topicsGroup?: ElementRef<HTMLBalCheckboxGroupElement>",
        '  readonly form = new FormGroup({ topics: new FormControl<string[]>([]) })',
        '  reset() {',
        '    this.topicsGroup?.nativeElement.setValue([])',
        "    this.form.controls.topics.setValue(['news'])",
        "    this.form.get('topics')?.setValue([])",
        '    // this.topicsGroup?.nativeElement.setValue([])',
        '  }',
        '}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'other.ts',
      [
        'export function reset(group: HTMLBalCheckboxGroupElement, control: FormControl) {',
        '  group.setValue([])',
        '  control.setValue([])',
        "  ;(document.querySelector('bal-checkbox-group') as HTMLBalCheckboxGroupElement).setValue([])",
        '}',
        '',
      ].join('\n'),
    )

    const expected = {
      total: 8,
      files: [
        {
          file: 'other.ts',
          findings: [
            { line: 1, snippet: 'export function reset(group: HTMLBalCheckboxGroupElement, control: FormControl) {' },
            { line: 2, snippet: 'group.setValue([])', setValue: true },
            {
              line: 4,
              snippet: ";(document.querySelector('bal-checkbox-group') as HTMLBalCheckboxGroupElement).setValue([])",
            },
            {
              line: 4,
              snippet: ";(document.querySelector('bal-checkbox-group') as HTMLBalCheckboxGroupElement).setValue([])",
              setValue: true,
            },
          ],
        },
        {
          file: 'topics.component.html',
          findings: [
            { line: 1, snippet: '<bal-checkbox-group #topicsGroup>' },
            { line: 1, snippet: '</bal-checkbox-group>' },
          ],
        },
        {
          file: 'topics.component.ts',
          findings: [
            { line: 2, snippet: "@ViewChild('topicsGroup') topicsGroup?: ElementRef<HTMLBalCheckboxGroupElement>" },
            { line: 5, snippet: 'this.topicsGroup?.nativeElement.setValue([])', setValue: true },
          ],
        },
      ],
    }

    expect(scanBalCheckbox(root)).toEqual(expected)
    expect(scanBalCheckbox(root, ['topics.component.html'])).toEqual({
      total: 3,
      files: [
        expected.files[1],
        {
          file: 'topics.component.ts',
          findings: [{ line: 5, snippet: 'this.topicsGroup?.nativeElement.setValue([])', setValue: true }],
        },
      ],
    })
  })

  it('flags setValue() on a typed group ref in .mts and Vue script files', () => {
    const root = createScratchDir()
    const reset = 'export function reset(group: HTMLBalCheckboxGroupElement) {\n  group.setValue([])\n}\n'
    write(root, 'reset.mts', reset)
    write(root, 'g.vue', `<script setup lang="ts">\n${reset}</script>\n`)

    expect(scanBalCheckbox(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'g.vue',
          findings: [
            { line: 2, snippet: 'export function reset(group: HTMLBalCheckboxGroupElement) {' },
            { line: 3, snippet: 'group.setValue([])', setValue: true },
          ],
        },
        {
          file: 'reset.mts',
          findings: [
            { line: 1, snippet: 'export function reset(group: HTMLBalCheckboxGroupElement) {' },
            { line: 2, snippet: 'group.setValue([])', setValue: true },
          ],
        },
      ],
    })
  })

  it('reads JSX arrow handlers inside a tag when it computes the flags', () => {
    const root = createScratchDir()
    write(
      root,
      'Arrows.tsx',
      [
        'export const Arrows = () => (',
        '  <>',
        '    <BalCheckboxGroup onBalChange={e => setTopics(e.detail)} value={topics} interface="switch">',
        '      <BalCheckbox value="news">News</BalCheckbox>',
        '    </BalCheckboxGroup>',
        '    <BalCheckboxGroup value={topics} onBalChange={e => setTopics(e.detail)}>',
        '      <BalCheckbox onBalChange={e => track(e, { a: "}" })} interface="switch" value="a">A</BalCheckbox>',
        '    </BalCheckboxGroup>',
        '  </>',
        ')',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root).files[0].findings).toEqual([
      {
        line: 3,
        snippet: '<BalCheckboxGroup onBalChange={e => setTopics(e.detail)} value={topics} interface="switch">',
        switchGroup: true,
      },
      { line: 4, snippet: '<BalCheckbox value="news">' },
      { line: 4, snippet: '</BalCheckbox>' },
      { line: 5, snippet: '</BalCheckboxGroup>' },
      {
        line: 6,
        snippet: '<BalCheckboxGroup value={topics} onBalChange={e => setTopics(e.detail)}>',
        switchGroup: true,
      },
      {
        line: 7,
        snippet: '<BalCheckbox onBalChange={e => track(e, { a: "}" })} interface="switch" value="a">',
      },
      { line: 7, snippet: '</BalCheckbox>' },
      { line: 8, snippet: '</BalCheckboxGroup>' },
    ])
  })

  it('flags each sibling group on its own and lets switchGroup win over control and unboundControl', () => {
    const root = createScratchDir()
    write(
      root,
      'groups.component.html',
      [
        '<bal-checkbox-group [formControl]="plain">',
        '  <bal-checkbox value="x"></bal-checkbox>',
        '</bal-checkbox-group>',
        '<bal-checkbox-group [formControl]="switches">',
        '  <bal-checkbox value="y" interface="switch"></bal-checkbox>',
        '</bal-checkbox-group>',
        '<bal-checkbox-group value="a"></bal-checkbox-group>',
        '<bal-checkbox-group [control]="c" [value]="v"></bal-checkbox-group>',
        '<bal-checkbox-group control interface="switch" [(ngModel)]="t"></bal-checkbox-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root).files[0].findings).toEqual([
      { line: 1, snippet: '<bal-checkbox-group [formControl]="plain">', unboundControl: true },
      { line: 2, snippet: '<bal-checkbox value="x">' },
      { line: 2, snippet: '</bal-checkbox>' },
      { line: 3, snippet: '</bal-checkbox-group>' },
      { line: 4, snippet: '<bal-checkbox-group [formControl]="switches">', switchGroup: true },
      { line: 5, snippet: '<bal-checkbox value="y" interface="switch">' },
      { line: 5, snippet: '</bal-checkbox>' },
      { line: 6, snippet: '</bal-checkbox-group>' },
      { line: 7, snippet: '<bal-checkbox-group value="a">' },
      { line: 7, snippet: '</bal-checkbox-group>' },
      { line: 8, snippet: '<bal-checkbox-group [control]="c" [value]="v">' },
      { line: 8, snippet: '</bal-checkbox-group>' },
      { line: 9, snippet: '<bal-checkbox-group control interface="switch" [(ngModel)]="t">', switchGroup: true },
      { line: 9, snippet: '</bal-checkbox-group>' },
    ])
  })

  it('flags setValue() through useRef, casts, viewChild.required, multiline chains and aliases only', () => {
    const root = createScratchDir()
    write(
      root,
      'refs.component.ts',
      [
        'export class RefsComponent {',
        "  @ViewChild('g') g?: ElementRef<HTMLBalCheckboxGroupElement>",
        '  a!: ElementRef<HTMLBalCheckboxGroupElement>',
        "  readonly req = viewChild.required<ElementRef<HTMLBalCheckboxGroupElement>>('g')",
        '  reset() {',
        '    this.g',
        '      ?.nativeElement.setValue([])',
        '    const el = this.g?.nativeElement',
        '    el?.setValue([])',
        '    this.req().nativeElement.setValue([])',
        '    this.a.setValue([])',
        '  }',
        '}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'Refs.tsx',
      [
        'export function Refs() {',
        '  const group = useRef<HTMLBalCheckboxGroupElement>(null)',
        '  const reset = () => group.current?.setValue([])',
        '  const clear = (el: Element) => {',
        '    const g = el as HTMLBalCheckboxGroupElement',
        '    g.setValue([])',
        '  }',
        '  return null',
        '}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'radio.ts',
      ['export function reset(group: HTMLBalRadioGroupElement) {', "  group.setValue('a')", '}', ''].join('\n'),
    )

    expect(scanBalCheckbox(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'refs.component.ts',
          findings: [
            { line: 2, snippet: "@ViewChild('g') g?: ElementRef<HTMLBalCheckboxGroupElement>" },
            { line: 3, snippet: 'a!: ElementRef<HTMLBalCheckboxGroupElement>' },
            { line: 4, snippet: "readonly req = viewChild.required<ElementRef<HTMLBalCheckboxGroupElement>>('g')" },
            { line: 7, snippet: '?.nativeElement.setValue([])', setValue: true },
            { line: 9, snippet: 'el?.setValue([])', setValue: true },
            { line: 10, snippet: 'this.req().nativeElement.setValue([])', setValue: true },
          ],
        },
        {
          file: 'Refs.tsx',
          findings: [
            { line: 2, snippet: 'const group = useRef<HTMLBalCheckboxGroupElement>(null)' },
            { line: 3, snippet: 'const reset = () => group.current?.setValue([])', setValue: true },
            { line: 5, snippet: 'const g = el as HTMLBalCheckboxGroupElement' },
            { line: 6, snippet: 'g.setValue([])', setValue: true },
          ],
        },
      ],
    })
  })

  it('keeps the plain { line, snippet } shape for an unbound group', () => {
    const root = createScratchDir()
    write(root, 'plain.html', '<bal-checkbox-group interface="switch" name="a"></bal-checkbox-group>\n')

    expect(scanBalCheckbox(root).files[0].findings[0]).toEqual({
      line: 1,
      snippet: '<bal-checkbox-group interface="switch" name="a">',
    })
  })

  it('lists the bundle spread in application.component.ts and BalEvents types once per occurrence, but not the bal-check and bal-switch types that stay legacy', () => {
    const root = createScratchDir()
    write(
      root,
      'application.component.ts',
      [
        "import { BalCheckboxBundle, BalFormBundle } from '@baloise/ds-angular'",
        '@Component({ imports: [...BalCheckboxBundle, ...BalFormBundle] })',
        'export class ApplicationComponent {',
        '  onTerms(event: BalEvents.BalCheckboxCustomEvent<boolean>) {}',
        '  onTopics(event: BalEvents.BalCheckboxGroupCustomEvent<string[]>) {}',
        '  onBare(event: BalCheckboxCustomEvent<boolean>) {}',
        '  detail?: BalEvents.BalCheckboxChangeDetail',
        '  both(a: BalEvents.BalCheckboxBlur, b: BalCheckboxGroupCustomEvent<string[]>) {}',
        '  onCheck(event: BalEvents.BalCheckCustomEvent<boolean>) {}',
        '  onSwitch(event: BalEvents.BalSwitchCustomEvent<boolean>) {}',
        '  onBareCheck(event: BalCheckCustomEvent<boolean>) {}',
        '  onBareSwitch(event: BalSwitchCustomEvent<boolean>) {}',
        '  look?: BalProps.BalCheckboxInterface',
        '}',
        '',
      ].join('\n'),
    )

    expect(scanBalCheckbox(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'application.component.ts',
          findings: [
            { line: 1, snippet: "import { BalCheckboxBundle, BalFormBundle } from '@baloise/ds-angular'" },
            { line: 2, snippet: '@Component({ imports: [...BalCheckboxBundle, ...BalFormBundle] })' },
            { line: 4, snippet: 'onTerms(event: BalEvents.BalCheckboxCustomEvent<boolean>) {}' },
            { line: 5, snippet: 'onTopics(event: BalEvents.BalCheckboxGroupCustomEvent<string[]>) {}' },
            { line: 6, snippet: 'onBare(event: BalCheckboxCustomEvent<boolean>) {}' },
            { line: 7, snippet: 'detail?: BalEvents.BalCheckboxChangeDetail' },
            { line: 8, snippet: 'both(a: BalEvents.BalCheckboxBlur, b: BalCheckboxGroupCustomEvent<string[]>) {}' },
            { line: 8, snippet: 'both(a: BalEvents.BalCheckboxBlur, b: BalCheckboxGroupCustomEvent<string[]>) {}' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-checkbox value="1"></bal-checkbox>\n'
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
            { line: 1, snippet: '<bal-checkbox value="1">' },
            { line: 1, snippet: '</bal-checkbox>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('checkbox migration.md', () => {
  it('titles the component checkbox and documents the bundled group, shape, prop, tag, import, event, and method mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/checkbox/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# checkbox\n')).toBe(true)
    for (const phrase of [
      'scan-bal-checkbox.mjs',
      'one yes/no',
      'bal-checkbox-group',
      'querySelectorAll',
      'ds-toggle',
      'control',
      'visual benefit persists, but value binding breaks',
      '`switchGroup: true`',
      '`unboundControl: true`',
      '`formsBinding: true`',
      '`setValue: true`',
      'role="group"',
      '`bal-check`',
      'bal-switch',
      'hideTrigger',
      'slight design deviation',
      'tileColor',
      'newBalCheckboxOption',
      'bal-field',
      'labelHidden',
      'nonSubmit',
      'verticalOnMobile',
      'expanded',
      'getOptionByValue',
      'setFocus()',
      'setBlur()',
      'getInputElement()',
      'getOption()',
      'DsCheckbox',
      'DsCheckboxGroup',
      'DsToggle',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'dsChange',
      'dsFocus',
      'dsBlur',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
