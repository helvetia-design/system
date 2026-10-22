import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalTextarea } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-textarea.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-textarea-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalTextarea', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalTextarea } from '@baloise/ds-react'",
        "const _note = 'bal-textarea'",
        'const _example = \'<BalTextarea name="a"></BalTextarea>\'',
        'const _markup = `<BalTextarea name="a" />`',
        'const _trailing = true // <BalTextarea name="a" />',
        'const _hidden = /* <bal-textarea></bal-textarea> */ null',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalTextarea name="a" onBalChange={handle}>',
        '        Content',
        '      </BalTextarea>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalTextarea clickable />\n')
    write(root, 'dist/ignored.tsx', '<bal-textarea></bal-textarea>\n<BalTextarea />\n')

    expect(scanBalTextarea(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalTextarea } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalTextarea name="a" onBalChange={handle}>' },
            { line: 12, snippet: '</BalTextarea>' },
          ],
        },
        { file: 'Widget.jsx', findings: [{ line: 1, snippet: '<BalTextarea clickable />' }] },
      ],
    })
  })

  it('does not match longer names that merely start with BalTextarea or bal-textarea', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-textarea-group></bal-textarea-group>\n')
    write(
      root,
      'types.ts',
      [
        'class BalTextareaValueAccessor {}',
        'type BalTextareaCustomEvent<T> = T',
        'type BalTextareaInputs = string',
        '',
      ].join('\n'),
    )

    expect(scanBalTextarea(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-textarea></bal-textarea> -->',
        '<div title="bal-textarea">text</div>',
        '<p>Mention bal-textarea in text only.</p>',
        '<bal-textarea formControlName="note" (balChange)="onChange($event)"></bal-textarea>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalTextarea } from '@baloise/ds-angular'",
        "const _decoy = 'bal-textarea'",
        '// <bal-textarea></bal-textarea>',
        '@Component({',
        '  imports: [BalTextarea],',
        '  template: `',
        '    <!-- <bal-textarea></bal-textarea> -->',
        '    <bal-textarea [(ngModel)]="note"></bal-textarea>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalTextarea(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-textarea formControlName="note" (balChange)="onChange($event)">' },
            { line: 4, snippet: '</bal-textarea>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 2, snippet: "import { BalTextarea } from '@baloise/ds-angular'" },
            { line: 6, snippet: 'imports: [BalTextarea],' },
            { line: 9, snippet: '<bal-textarea [(ngModel)]="note">' },
            { line: 9, snippet: '</bal-textarea>' },
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
        '  <!-- <bal-textarea></bal-textarea> -->',
        '  <p>bal-textarea</p>',
        '  <bal-textarea name="a"></bal-textarea>',
        '  <bal-textarea',
        '    name="b"',
        '    clickable="true"',
        '  ></bal-textarea>',
        '</body>',
        '',
      ].join('\n'),
    )
    write(root, 'notes.md', '<bal-textarea></bal-textarea>\n')

    expect(scanBalTextarea(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 4, snippet: '<bal-textarea name="a">' },
            { line: 4, snippet: '</bal-textarea>' },
            { line: 5, snippet: '<bal-textarea name="b" clickable="true">' },
            { line: 8, snippet: '</bal-textarea>' },
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
        '<bal-textarea [value]="note" [rows]="3" (balChange)="onChange($event)"></bal-textarea>',
        '<bal-textarea :value="note" :rows="3"></bal-textarea>',
        '',
      ].join('\n'),
    )

    expect(scanBalTextarea(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-textarea [value]="note" [rows]="3" (balChange)="onChange($event)">' },
            { line: 1, snippet: '</bal-textarea>' },
            { line: 2, snippet: '<bal-textarea :value="note" :rows="3">' },
            { line: 2, snippet: '</bal-textarea>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-textarea name="a"></bal-textarea>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-textarea name="a"></bal-textarea>\n')
      write(root, `src/${dir}/nested.html`, '<BalTextarea name="a" />\n')
    }

    expect(scanBalTextarea(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-textarea name="a">' },
            { line: 1, snippet: '</bal-textarea>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-textarea name="a"></bal-textarea>\n'
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
            { line: 1, snippet: '<bal-textarea name="a">' },
            { line: 1, snippet: '</bal-textarea>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('textarea migration.md', () => {
  it('titles the component textarea and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/textarea/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# textarea\n')).toBe(true)
    for (const phrase of [
      'scan-bal-textarea.mjs',
      'one yes/no',
      'ds-textarea',
      'DsTextarea',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'required',
      'clickable',
      'dsClick',
      'dsKeyPress',
      'dsChange',
      'setAriaForm',
      'slot content needs manual rework',
      'BalTextareaCustomEvent',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
