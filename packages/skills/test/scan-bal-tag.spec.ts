import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalTag } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-tag.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-tag-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalTag', () => {
  it('lists React tags, the group, and imports, and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalTag, BalTagGroup } from '@baloise/ds-react'",
        "const _note = 'bal-tag'",
        'const _example = \'<BalTag color="purple"></BalTag>\'',
        'const _markup = `<BalTagGroup></BalTagGroup>`',
        'const _trailing = true // <BalTag light />',
        'const _hidden = /* <bal-tag>Hi</bal-tag> */ null',
        'void BalButton',
        'export function App() {',
        '  return (',
        '    <BalTagGroup>',
        '      <BalTag color="purple" light onBalCloseClick={close}>Hi</BalTag>',
        '    </BalTagGroup>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<bal-tag>Hi</bal-tag>\n<BalTag>Hi</BalTag>\n')

    expect(scanBalTag(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalTag, BalTagGroup } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalTag, BalTagGroup } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalTagGroup>' },
            { line: 11, snippet: '<BalTag color="purple" light onBalCloseClick={close}>' },
            { line: 11, snippet: '</BalTag>' },
            { line: 12, snippet: '</BalTagGroup>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags, the close event, and the bundle, and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-tag>Hi</bal-tag> -->',
        '<div title="bal-tag">text</div>',
        '<p>Mention bal-tag in text only.</p>',
        '<bal-tag-group>',
        '  <bal-tag closable (balCloseClick)="remove()">Hi</bal-tag>',
        '</bal-tag-group>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalTagBundle } from '@baloise/ds-angular'",
        "const _decoy = 'bal-tag'",
        '// <bal-tag></bal-tag>',
        '@Component({',
        '  imports: [BalTagBundle],',
        '  template: `',
        '    <bal-tag color="red">Hi</bal-tag>',
        '  `,',
        '})',
        'export class AppComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalTag(root)).toEqual({
      total: 9,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-tag-group>' },
            { line: 5, snippet: '<bal-tag closable (balCloseClick)="remove()">' },
            { line: 5, snippet: '<bal-tag closable (balCloseClick)="remove()">Hi</bal-tag>' },
            { line: 5, snippet: '</bal-tag>' },
            { line: 6, snippet: '</bal-tag-group>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 2, snippet: "import { BalTagBundle } from '@baloise/ds-angular'" },
            { line: 6, snippet: 'imports: [BalTagBundle],' },
            { line: 8, snippet: '<bal-tag color="red">' },
            { line: 8, snippet: '</bal-tag>' },
          ],
        },
      ],
    })
  })

  it('does not report other bal-tag-* names or other components that start with the same letters', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-tags></bal-tags>\n<bal-tab></bal-tab>\n<bal-tag-foo></bal-tag-foo>\n')
    write(root, 'other.tsx', 'const x = <BalTagline />\n')

    expect(scanBalTag(root)).toEqual({ total: 0, files: [] })
  })

  it('does not edit files and prints JSON through run()', () => {
    const root = createScratchDir()
    const source = '<bal-tag color="grey">Hi</bal-tag>\n'
    write(root, 'index.html', source)

    let out = ''
    expect(run(root, { write: (chunk: string) => (out += chunk) } as unknown as NodeJS.WriteStream)).toBe(0)
    expect(JSON.parse(out).total).toBe(2)
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(source)
  })

  it('lists every tag of tags nested in a tag group, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-tag-group>',
        '  <bal-tag color="green">A</bal-tag>',
        '  <bal-tag color="blue">',
        '    <bal-tag size="small">B</bal-tag>',
        '  </bal-tag>',
        '</bal-tag-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalTag(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-tag-group>' },
            { line: 2, snippet: '<bal-tag color="green">' },
            { line: 2, snippet: '</bal-tag>' },
            { line: 3, snippet: '<bal-tag color="blue">' },
            { line: 4, snippet: '<bal-tag size="small">' },
            { line: 4, snippet: '</bal-tag>' },
            { line: 5, snippet: '</bal-tag>' },
            { line: 6, snippet: '</bal-tag-group>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-tag-group at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<div>',
        '  <bal-tag-group',
        '    class="tags"',
        '    space="small"',
        '  >',
        '    <bal-tag>A</bal-tag>',
        '  </bal-tag-group>',
        '</div>',
        '',
      ].join('\n'),
    )

    expect(scanBalTag(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 2, snippet: '<bal-tag-group class="tags" space="small">' },
            { line: 6, snippet: '<bal-tag>' },
            { line: 6, snippet: '</bal-tag>' },
            { line: 7, snippet: '</bal-tag-group>' },
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
        '<bal-tag [color]="tone" [closable]="canClose" (balCloseClick)="remove(t)">{{ t }}</bal-tag>',
        '<bal-tag :color="tone" :closable="canClose">{{ t }}</bal-tag>',
        '',
      ].join('\n'),
    )

    expect(scanBalTag(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-tag [color]="tone" [closable]="canClose" (balCloseClick)="remove(t)">' },
            {
              line: 1,
              snippet: '<bal-tag [color]="tone" [closable]="canClose" (balCloseClick)="remove(t)">{{ t }}</bal-tag>',
            },
            { line: 1, snippet: '</bal-tag>' },
            { line: 2, snippet: '<bal-tag :color="tone" :closable="canClose">' },
            { line: 2, snippet: '</bal-tag>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-tag></bal-tag>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-tag></bal-tag>\n')
      write(root, `src/${dir}/nested.html`, '<BalTag></BalTag>\n')
    }

    expect(scanBalTag(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-tag>' },
            { line: 1, snippet: '</bal-tag>' },
          ],
        },
      ],
    })
  })
})
