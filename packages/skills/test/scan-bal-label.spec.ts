import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalLabel } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-label.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-label-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalLabel', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalLabel } from '@baloise/ds-react'",
        "const _note = 'bal-label'",
        'const _example = \'<BalLabel size="small"></BalLabel>\'',
        'const _markup = `<BalLabel size="small" />`',
        'const _trailing = true // <BalLabel />',
        'const _hidden = /* <bal-label></bal-label> */ null',
        'type BalLabelValueAccessor = string',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalLabel size="small">',
        '        Name',
        '      </BalLabel>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalLabel weight="regular" />\n')
    write(root, 'dist/ignored.tsx', '<bal-label></bal-label>\n<BalLabel />\n')

    expect(scanBalLabel(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalLabel } from '@baloise/ds-react'" },
            { line: 11, snippet: '<BalLabel size="small">' },
            { line: 13, snippet: '</BalLabel>' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [{ line: 1, snippet: '<BalLabel weight="regular" />' }],
        },
      ],
    })
  })

  it('does not match a longer name that merely starts with bal-label or BalLabel', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-label-other></bal-label-other>',
        '<bal-data-label>x</bal-data-label>',
        '<bal-field-label>y</bal-field-label>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      ['type BalLabeled = string', 'const BalLabelish = 1', 'class BalLabelValueAccessor {}', ''].join('\n'),
    )

    expect(scanBalLabel(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-label></bal-label> -->',
        '<div title="bal-label">text</div>',
        '<p>Mention bal-label in text only.</p>',
        '<bal-label htmlFor="name" [required]="false" size="small">Name</bal-label>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalLabel } from '@baloise/ds-angular'",
        "const _decoy = 'bal-label'",
        '// <bal-label></bal-label>',
        '@Component({',
        '  imports: [BalLabel],',
        '  template: `',
        '    <!-- <bal-label></bal-label> -->',
        '    <bal-label htmlFor="x">X</bal-label>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalLabel(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-label htmlFor="name" [required]="false" size="small">' },
            { line: 4, snippet: '</bal-label>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 2, snippet: "import { BalLabel } from '@baloise/ds-angular'" },
            { line: 6, snippet: 'imports: [BalLabel],' },
            { line: 9, snippet: '<bal-label htmlFor="x">' },
            { line: 9, snippet: '</bal-label>' },
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
        '    <!-- <bal-label></bal-label> -->',
        '    <p>bal-label</p>',
        '    <bal-label>Name</bal-label>',
        '    <span data-note="<bal-label></bal-label>">x</span>',
        '    <bal-label',
        '      htmlFor="name"',
        '      multiline',
        '    ></bal-label>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    )
    write(root, 'nested/page.html', '<bal-label>Label</bal-label>\n')
    write(root, 'notes.md', '<bal-label></bal-label>\n')

    expect(scanBalLabel(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 6, snippet: '<bal-label>' },
            { line: 6, snippet: '</bal-label>' },
            { line: 8, snippet: '<bal-label htmlFor="name" multiline>' },
            { line: 11, snippet: '</bal-label>' },
          ],
        },
        {
          file: 'nested/page.html',
          findings: [
            { line: 1, snippet: '<bal-label>' },
            { line: 1, snippet: '</bal-label>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-label>Name</bal-label>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-label>Name</bal-label>\n')
      write(root, `src/${dir}/nested.html`, '<BalLabel>Name</BalLabel>\n')
    }

    expect(scanBalLabel(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-label>' },
            { line: 1, snippet: '</bal-label>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-label>Name</bal-label>\n'
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
            { line: 1, snippet: '<bal-label>' },
            { line: 1, snippet: '</bal-label>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests label when the project uses it and keeps data-label under data', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-label>Name</bal-label>\n<bal-data-label>x</bal-data-label>\n')

    const { suggested } = scanMigratable(root)

    expect(suggested).toEqual(
      expect.arrayContaining([
        { name: 'label', total: 2 },
        { name: 'data', total: 2 },
      ]),
    )
  })
})

describe('label migration.md', () => {
  it('titles the component label and documents the prop, tag, import, and method mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/label/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# label\n')).toBe(true)
    for (const phrase of [
      'scan-bal-label.mjs',
      'one yes/no',
      'htmlFor',
      'htmlId',
      'readonly',
      'multiline',
      'weight',
      '`2xl`',
      'ds-label',
      'DsLabel',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'bal-field',
      'setAriaForm()',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
