import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalFileUpload } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-file-upload.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-file-upload-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalFileUpload', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalFileUpload } from '@baloise/ds-react'",
        "const _note = 'bal-file-upload'",
        'const _example = \'<BalFileUpload label="Drop"></BalFileUpload>\'',
        'const _markup = `<BalFileUpload label="Drop" />`',
        'const _trailing = true // <BalFileUpload label="Drop" />',
        'const _hidden = /* <bal-file-upload></bal-file-upload> */ null',
        'type BalFileUploading = string',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalFileUpload label="Drop" onBalChange={noop}>',
        '        Content',
        '      </BalFileUpload>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalFileUpload multiple={false} />\n')
    write(root, 'dist/ignored.tsx', '<bal-file-upload></bal-file-upload>\n<BalFileUpload />\n')
    write(root, 'packed.tsx', 'const _value = 1// <BalFileUpload />\n')

    const importLine = "import { BalFileUpload } from '@baloise/ds-react'"

    expect(scanBalFileUpload(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: importLine },
            { line: 11, snippet: '<BalFileUpload label="Drop" onBalChange={noop}>' },
            { line: 13, snippet: '</BalFileUpload>' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [{ line: 1, snippet: '<BalFileUpload multiple={false} />' }],
        },
      ],
    })
  })

  it('does not match a longer PascalCase name that merely starts with BalFileUpload', () => {
    const root = createScratchDir()
    write(
      root,
      'types.ts',
      ['type BalFileUploading = string', 'const BalFileUploadish = 1', 'class BalFileUploadValueAccessor {}', ''].join(
        '\n',
      ),
    )

    expect(scanBalFileUpload(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-file-upload></bal-file-upload> -->',
        '<div title="bal-file-upload">text</div>',
        '<p>Mention bal-file-upload in text only.</p>',
        '<bal-file-upload formControlName="files" label="Drop" (balChange)="onChange($event)"></bal-file-upload>',
        '<script>',
        "  const decoy = '<bal-file-upload></bal-file-upload>'",
        '</script>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalFileUpload } from '@baloise/ds-angular'",
        "const _decoy = 'bal-file-upload'",
        '// <bal-file-upload></bal-file-upload>',
        '@Component({',
        '  imports: [BalFileUpload],',
        '  template: `',
        '    <!-- <bal-file-upload></bal-file-upload> -->',
        '    <bal-file-upload [(ngModel)]="files"></bal-file-upload>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalFileUpload(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            {
              line: 4,
              snippet: '<bal-file-upload formControlName="files" label="Drop" (balChange)="onChange($event)">',
            },
            { line: 4, snippet: '</bal-file-upload>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 2, snippet: "import { BalFileUpload } from '@baloise/ds-angular'" },
            { line: 6, snippet: 'imports: [BalFileUpload],' },
            { line: 9, snippet: '<bal-file-upload [(ngModel)]="files">' },
            { line: 9, snippet: '</bal-file-upload>' },
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
        '    <!-- <bal-file-upload></bal-file-upload> -->',
        '    <p>bal-file-upload</p>',
        '    <bal-file-upload label="Drop"></bal-file-upload>',
        '    <span data-note="<bal-file-upload></bal-file-upload>">x</span>',
        '    <!-- prettier-ignore -->',
        '    <bal-file-upload',
        '      label="Drop"',
        '      multiple="false"',
        '    ></bal-file-upload>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    )
    write(root, 'nested/page.html', '<bal-file-upload accept="image/png"></bal-file-upload>\n')
    write(root, 'notes.md', '<bal-file-upload></bal-file-upload>\n')

    expect(scanBalFileUpload(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 6, snippet: '<bal-file-upload label="Drop">' },
            { line: 6, snippet: '</bal-file-upload>' },
            { line: 9, snippet: '<bal-file-upload label="Drop" multiple="false">' },
            { line: 12, snippet: '</bal-file-upload>' },
          ],
        },
        {
          file: 'nested/page.html',
          findings: [
            { line: 1, snippet: '<bal-file-upload accept="image/png">' },
            { line: 1, snippet: '</bal-file-upload>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [label] and :label bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-file-upload [label]="label" [multiple]="multiple" (balChange)="onChange($event)"></bal-file-upload>',
        '<bal-file-upload :label="label" :accept="accept" :multiple="multiple"></bal-file-upload>',
        '',
      ].join('\n'),
    )

    expect(scanBalFileUpload(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            {
              line: 1,
              snippet: '<bal-file-upload [label]="label" [multiple]="multiple" (balChange)="onChange($event)">',
            },
            { line: 1, snippet: '</bal-file-upload>' },
            { line: 2, snippet: '<bal-file-upload :label="label" :accept="accept" :multiple="multiple">' },
            { line: 2, snippet: '</bal-file-upload>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-file-upload label="Drop"></bal-file-upload>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-file-upload label="Drop"></bal-file-upload>\n')
      write(root, `src/${dir}/nested.html`, '<BalFileUpload label="Drop" />\n')
    }

    expect(scanBalFileUpload(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-file-upload label="Drop">' },
            { line: 1, snippet: '</bal-file-upload>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-file-upload label="Drop"></bal-file-upload>\n'
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
            { line: 1, snippet: '<bal-file-upload label="Drop">' },
            { line: 1, snippet: '</bal-file-upload>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('file-upload migration.md', () => {
  it('titles the component file-upload and documents the prop, tag, import, event, and method mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/file-upload/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# file-upload\n')).toBe(true)
    for (const phrase of [
      'scan-bal-file-upload.mjs',
      'one yes/no',
      'dropZoneLabel',
      'subTitle',
      'getInputElement()',
      'FileUploadRejectionReason',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'DsFileUpload',
      'dsChange',
      'dsFilesAdded',
      'dsFilesRemoved',
      'dsRejectedFile',
      'dsInputClick',
      'dsBlur',
      'dsFocus',
      'clear()',
      'setFocus()',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
