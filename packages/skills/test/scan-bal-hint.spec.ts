import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalHint } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-hint.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-hint-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalHint', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalHint } from '@baloise/ds-react'",
        "const _note = 'bal-hint'",
        'const _example = \'<BalHint closeLabel="Close"></BalHint>\'',
        'const _markup = `<BalHint closeLabel="Close" />`',
        'const _trailing = true // <BalHint closeLabel="Close" />',
        'const _hidden = /* <bal-hint></bal-hint> */ null',
        'type BalHinting = string',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalHint closeLabel="Close">',
        '        Content',
        '      </BalHint>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalHint small />\n')
    write(root, 'dist/ignored.tsx', '<bal-hint></bal-hint>\n<BalHint />\n')
    write(root, 'packed.tsx', 'const _value = 1// <BalHint />\n')

    const importLine = "import { BalHint } from '@baloise/ds-react'"

    expect(scanBalHint(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: importLine },
            { line: 11, snippet: '<BalHint closeLabel="Close">' },
            { line: 13, snippet: '</BalHint>' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [{ line: 1, snippet: '<BalHint small />' }],
        },
      ],
    })
  })

  it('does not match a longer PascalCase name that merely starts with BalHint', () => {
    const root = createScratchDir()
    write(
      root,
      'types.ts',
      ['type BalHinting = string', 'const BalHintish = 1', 'class BalHintValueAccessor {}', ''].join('\n'),
    )

    expect(scanBalHint(root)).toEqual({ total: 0, files: [] })
  })

  it('lists the title and text child tags and does not match bal-field-hint or other bal-hint-* names', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-hint>',
        '  <bal-hint-title>Title</bal-hint-title>',
        '  <bal-hint-text>Text</bal-hint-text>',
        '</bal-hint>',
        '<bal-field-hint subject="x">y</bal-field-hint>',
        '<bal-hint-other></bal-hint-other>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'App.tsx',
      "import { BalHintTitle, BalHintText } from '@baloise/ds-react'\nconst _a = <BalHintTitle>T</BalHintTitle>\n",
    )

    expect(scanBalHint(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalHintTitle, BalHintText } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalHintTitle, BalHintText } from '@baloise/ds-react'" },
            { line: 2, snippet: '<BalHintTitle>' },
            { line: 2, snippet: '</BalHintTitle>' },
          ],
        },
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-hint>' },
            { line: 2, snippet: '<bal-hint-title>' },
            { line: 2, snippet: '</bal-hint-title>' },
            { line: 3, snippet: '<bal-hint-text>' },
            { line: 3, snippet: '</bal-hint-text>' },
            { line: 4, snippet: '</bal-hint>' },
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
        '<!-- <bal-hint></bal-hint> -->',
        '<div title="bal-hint">text</div>',
        '<p>Mention bal-hint in text only.</p>',
        '<bal-hint formControlName="files" closeLabel="Close" (balChange)="onChange($event)"></bal-hint>',
        '<script>',
        "  const decoy = '<bal-hint></bal-hint>'",
        '</script>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalHint } from '@baloise/ds-angular'",
        "const _decoy = 'bal-hint'",
        '// <bal-hint></bal-hint>',
        '@Component({',
        '  imports: [BalHint],',
        '  template: `',
        '    <!-- <bal-hint></bal-hint> -->',
        '    <bal-hint [(ngModel)]="files"></bal-hint>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalHint(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            {
              line: 4,
              snippet: '<bal-hint formControlName="files" closeLabel="Close" (balChange)="onChange($event)">',
            },
            { line: 4, snippet: '</bal-hint>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 2, snippet: "import { BalHint } from '@baloise/ds-angular'" },
            { line: 6, snippet: 'imports: [BalHint],' },
            { line: 9, snippet: '<bal-hint [(ngModel)]="files">' },
            { line: 9, snippet: '</bal-hint>' },
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
        '    <!-- <bal-hint></bal-hint> -->',
        '    <p>bal-hint</p>',
        '    <bal-hint closeLabel="Close"></bal-hint>',
        '    <span data-note="<bal-hint></bal-hint>">x</span>',
        '    <!-- prettier-ignore -->',
        '    <bal-hint',
        '      closeLabel="Close"',
        '      small="true"',
        '    ></bal-hint>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    )
    write(root, 'nested/page.html', '<bal-hint accept="image/png"></bal-hint>\n')
    write(root, 'notes.md', '<bal-hint></bal-hint>\n')

    expect(scanBalHint(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 6, snippet: '<bal-hint closeLabel="Close">' },
            { line: 6, snippet: '</bal-hint>' },
            { line: 9, snippet: '<bal-hint closeLabel="Close" small="true">' },
            { line: 12, snippet: '</bal-hint>' },
          ],
        },
        {
          file: 'nested/page.html',
          findings: [
            { line: 1, snippet: '<bal-hint accept="image/png">' },
            { line: 1, snippet: '</bal-hint>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [closeLabel] and :closeLabel bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-hint [closeLabel]="closeLabel" [small]="small"></bal-hint>',
        '<bal-hint :closeLabel="closeLabel" :small="small"></bal-hint>',
        '',
      ].join('\n'),
    )

    expect(scanBalHint(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-hint [closeLabel]="closeLabel" [small]="small">' },
            { line: 1, snippet: '</bal-hint>' },
            { line: 2, snippet: '<bal-hint :closeLabel="closeLabel" :small="small">' },
            { line: 2, snippet: '</bal-hint>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-hint-title and bal-hint-text at their opening lines with single-line snippets', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-hint>',
        '  <bal-hint-title',
        '    class="title"',
        '    id="hint-title"',
        '  >Title</bal-hint-title>',
        '  <bal-hint-text',
        '    class="text"',
        '  >Text</bal-hint-text>',
        '</bal-hint>',
        '',
      ].join('\n'),
    )

    expect(scanBalHint(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-hint>' },
            { line: 2, snippet: '<bal-hint-title class="title" id="hint-title">' },
            { line: 5, snippet: '</bal-hint-title>' },
            { line: 6, snippet: '<bal-hint-text class="text">' },
            { line: 8, snippet: '</bal-hint-text>' },
            { line: 9, snippet: '</bal-hint>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-hint closeLabel="Close"></bal-hint>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-hint closeLabel="Close"></bal-hint>\n')
      write(root, `src/${dir}/nested.html`, '<BalHint closeLabel="Close" />\n')
    }

    expect(scanBalHint(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-hint closeLabel="Close">' },
            { line: 1, snippet: '</bal-hint>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-hint closeLabel="Close"></bal-hint>\n'
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
            { line: 1, snippet: '<bal-hint closeLabel="Close">' },
            { line: 1, snippet: '</bal-hint>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('hint migration.md', () => {
  it('titles the component hint and documents the prop, tag, import, and method mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/hint/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# hint\n')).toBe(true)
    for (const phrase of [
      'scan-bal-hint.mjs',
      'one yes/no',
      'closeLabel',
      'small',
      'ds-hint-title',
      'ds-hint-text',
      'DsHintTitle',
      'DsHintText',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'DsHint',
      'bal-field-hint',
      'toggle()',
      'present()',
      'dismiss()',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
