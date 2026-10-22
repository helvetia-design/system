import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalTabs } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-tabs.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-tabs-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalTabs', () => {
  it('lists React tags, the child, and imports, and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalTabs, BalTabItem } from '@baloise/ds-react'",
        "const _note = 'bal-tabs'",
        'const _example = \'<BalTabs value="a"></BalTabs>\'',
        'const _markup = `<BalTabItem value="a"></BalTabItem>`',
        'const _trailing = true // <BalTabs color="purple" />',
        'const _hidden = /* <bal-tabs>Hi</bal-tabs> */ null',
        'void BalButton',
        'export function App() {',
        '  return (',
        '    <BalTabs value="a">',
        '      <BalTabItem value="a" label="One" />',
        '    </BalTabs>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<bal-tabs>Hi</bal-tabs>\n<BalTabs>Hi</BalTabs>\n')
    write(root, 'packed.tsx', 'const _value = 1// <BalTabs color="purple" />\n')

    expect(scanBalTabs(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalTabs, BalTabItem } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalTabs, BalTabItem } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalTabs value="a">' },
            { line: 11, snippet: '<BalTabItem value="a" label="One" />' },
            { line: 12, snippet: '</BalTabs>' },
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
        '<!-- <bal-tabs>Hi</bal-tabs> -->',
        '<div title="bal-tabs">text</div>',
        '<p>Mention bal-tabs in text only.</p>',
        '<bal-tabs value="a" (balChange)="onChange($event)">',
        '  <bal-tab-item value="a" label="One">Hi</bal-tab-item>',
        '</bal-tabs>',
        '<script>',
        "  const decoy = '<bal-tabs></bal-tabs>'",
        '</script>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalTabsBundle } from '@baloise/ds-angular'",
        "const _decoy = 'bal-tabs'",
        'const _markup = \'<bal-tabs value="a"></bal-tabs>\'',
        '// <bal-tabs color="purple"></bal-tabs>',
        '@Component({',
        "  selector: 'app-root',",
        '  imports: [BalTabsBundle],',
        '  template: `',
        '    <!-- <bal-tabs></bal-tabs> -->',
        '    <bal-tabs value="a"></bal-tabs>',
        '  `,',
        '})',
        'export class AppComponent {}',
        '@Component({',
        '  template: \'<bal-tabs><bal-tab-item value="a" href="/a"></bal-tab-item></bal-tabs>\',',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalTabs(root)).toEqual({
      total: 12,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-tabs value="a" (balChange)="onChange($event)">' },
            { line: 5, snippet: '<bal-tab-item value="a" label="One">' },
            { line: 5, snippet: '</bal-tab-item>' },
            { line: 6, snippet: '</bal-tabs>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 2, snippet: "import { BalTabsBundle } from '@baloise/ds-angular'" },
            { line: 8, snippet: 'imports: [BalTabsBundle],' },
            { line: 11, snippet: '<bal-tabs value="a">' },
            { line: 11, snippet: '</bal-tabs>' },
            { line: 16, snippet: '<bal-tabs>' },
            { line: 16, snippet: '<bal-tab-item value="a" href="/a">' },
            { line: 16, snippet: '</bal-tab-item>' },
            { line: 16, snippet: '</bal-tabs>' },
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
        '    <!-- <bal-tabs color="purple">Hi</bal-tabs> -->',
        '    <p>bal-tabs</p>',
        '    <bal-tabs value="a"></bal-tabs>',
        '    <span data-note="<bal-tabs></bal-tabs>">x</span>',
        '    <!-- prettier-ignore -->',
        '    <bal-tabs',
        '      value="b"',
        '      color="green"',
        '    ></bal-tabs>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    )
    write(root, 'notes.md', '<bal-tabs>Hi</bal-tabs>\n')

    expect(scanBalTabs(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 6, snippet: '<bal-tabs value="a">' },
            { line: 6, snippet: '</bal-tabs>' },
            { line: 9, snippet: '<bal-tabs value="b" color="green">' },
            { line: 12, snippet: '</bal-tabs>' },
          ],
        },
      ],
    })
  })

  it('lists the option type that is not next to a tag', () => {
    const root = createScratchDir()
    write(
      root,
      'tabs.ts',
      [
        "import { BalTabOption } from '@baloise/ds-core'",
        "const options: BalTabOption[] = [{ value: 'a', label: 'One' }]",
        '',
      ].join('\n'),
    )

    expect(scanBalTabs(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'tabs.ts',
          findings: [
            { line: 1, snippet: "import { BalTabOption } from '@baloise/ds-core'" },
            { line: 2, snippet: "const options: BalTabOption[] = [{ value: 'a', label: 'One' }]" },
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
        '<bal-tabs-foo>nope</bal-tabs-foo>',
        '<bal-tab-item-foo>nope</bal-tab-item-foo>',
        '<bal-steps (balChange)="x()">nope</bal-steps>',
        '<bal-tab-bar (balChange)="x()">nope</bal-tab-bar>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'let color: BalProps.BalTabsColor',
        'let ev: BalEvents.BalTabsChange',
        'let el: HTMLBalTabsElement',
        'let item: HTMLBalTabItemElement',
        'let comp: Components.BalTabs',
        '',
      ].join('\n'),
    )

    expect(scanBalTabs(root)).toEqual({
      total: 1,
      files: [{ file: 'types.ts', findings: [{ line: 5, snippet: 'let comp: Components.BalTabs' }] }],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-tabs></bal-tabs>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-tabs></bal-tabs>\n')
      write(root, `src/${dir}/nested.html`, '<BalTabs></BalTabs>\n')
    }

    expect(scanBalTabs(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-tabs>' },
            { line: 1, snippet: '</bal-tabs>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-tabs value="a"></bal-tabs>\n'
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
            { line: 1, snippet: '<bal-tabs value="a">' },
            { line: 1, snippet: '</bal-tabs>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('tabs migration.md', () => {
  it('titles the component tabs and documents the prop, mode, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/tabs/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# tabs\n')).toBe(true)
    for (const phrase of [
      'scan-bal-tabs.mjs',
      'one yes/no',
      '<ds-tabs>',
      'bal-tab-item',
      'ds-tab-panel',
      'panels mode',
      'navigation mode',
      'aria-current',
      'accordion',
      'options',
      'disabled',
      'invisible',
      'handleAsTabList',
      'optionalTabSelection',
      'noPanel',
      'expanded',
      'BalTabsBundle',
      'DsTabs',
      'DsTab',
      'DsTabPanel',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'balChange',
      'dsChange',
      'balWillAnimate',
      'getOptionByValue',
      'same basename',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
