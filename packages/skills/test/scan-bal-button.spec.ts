import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalButton } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-button.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-button-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalButton', () => {
  it('lists React tags, the group tag, and the import symbols, and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalButtonGroup } from '@baloise/ds-react'",
        "const _note = 'bal-button'",
        'const _example = \'<BalButton color="primary"></BalButton>\'',
        'const _markup = `<BalButtonGroup />`',
        'const _trailing = true // <BalButton />',
        'const _hidden = /* <bal-button></bal-button> */ null',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalButtonGroup position="right">',
        '        <BalButton color="tertiary">',
        '          Save',
        '        </BalButton>',
        '      </BalButtonGroup>',
        '      <BalButton expanded>Wide</BalButton>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalButton color="light">Hi</BalButton>\n')
    write(root, 'dist/ignored.tsx', '<bal-button></bal-button>\n<BalButton />\n')

    expect(scanBalButton(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalButtonGroup } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalButtonGroup } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalButtonGroup position="right">' },
            { line: 11, snippet: '<BalButton color="tertiary">' },
            { line: 13, snippet: '</BalButton>' },
            { line: 14, snippet: '</BalButtonGroup>' },
            { line: 15, snippet: '<BalButton expanded>' },
            { line: 15, snippet: '</BalButton>' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [
            { line: 1, snippet: '<BalButton color="light">' },
            { line: 1, snippet: '</BalButton>' },
          ],
        },
      ],
    })
  })

  it('does not match a longer PascalCase name that merely starts with BalButton', () => {
    const root = createScratchDir()
    write(root, 'types.ts', ['type BalButtonColor = string', 'const BalButtonish = 1', ''].join('\n'))

    expect(scanBalButton(root)).toEqual({ total: 0, files: [] })
  })

  it('lists the Angular bundle import and inline template tags, skipping comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'src/app.component.ts',
      [
        "import { BalButtonBundle } from '@baloise/ds-angular'",
        "const _label = '<bal-button>not markup</bal-button>'",
        '@Component({',
        '  imports: [BalButtonBundle],',
        '  template: `',
        '    <bal-button-group direction="column">',
        '      <bal-button (balClick)="go()" rounded>Go</bal-button>',
        '    </bal-button-group>',
        '    <!-- <bal-button>commented</bal-button> -->',
        '  `,',
        '})',
        'export class AppComponent {}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'src/app.component.html',
      [
        '<bal-button-group position="center">',
        '  <bal-button is-active>Hi</bal-button>',
        '</bal-button-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalButton(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'src/app.component.html',
          findings: [
            { line: 1, snippet: '<bal-button-group position="center">' },
            { line: 2, snippet: '<bal-button is-active>' },
            { line: 2, snippet: '</bal-button>' },
            { line: 3, snippet: '</bal-button-group>' },
          ],
        },
        {
          file: 'src/app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalButtonBundle } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalButtonBundle],' },
            { line: 6, snippet: '<bal-button-group direction="column">' },
            { line: 7, snippet: '<bal-button (balClick)="go()" rounded>' },
            { line: 7, snippet: '</bal-button>' },
            { line: 8, snippet: '</bal-button-group>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags including a multiline group tag, and skips markdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-button-group',
        '  position="right"',
        '  direction="row">',
        '  <bal-button color="tertiary-purple" bal-popup>Open</bal-button>',
        '</bal-button-group>',
        '',
      ].join('\n'),
    )
    write(root, 'notes.md', '<bal-button>docs only</bal-button>\n')

    expect(scanBalButton(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-button-group position="right" direction="row">' },
            { line: 4, snippet: '<bal-button color="tertiary-purple" bal-popup>' },
            { line: 4, snippet: '</bal-button>' },
            { line: 5, snippet: '</bal-button-group>' },
          ],
        },
      ],
    })
  })

  it('lists every tag of a button group and the buttons inside it, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-button-group>',
        '  <bal-button color="primary">Save</bal-button>',
        '  <bal-button-group>',
        '    <bal-button color="secondary">Cancel</bal-button>',
        '  </bal-button-group>',
        '</bal-button-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalButton(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-button-group>' },
            { line: 2, snippet: '<bal-button color="primary">' },
            { line: 2, snippet: '</bal-button>' },
            { line: 3, snippet: '<bal-button-group>' },
            { line: 4, snippet: '<bal-button color="secondary">' },
            { line: 4, snippet: '</bal-button>' },
            { line: 5, snippet: '</bal-button-group>' },
            { line: 6, snippet: '</bal-button-group>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-button inside a group at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-button-group>',
        '  <bal-button',
        '    color="primary"',
        '    href="/save"',
        '  >Save</bal-button>',
        '</bal-button-group>',
        '',
      ].join('\n'),
    )

    expect(scanBalButton(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-button-group>' },
            { line: 2, snippet: '<bal-button color="primary" href="/save">' },
            { line: 5, snippet: '</bal-button>' },
            { line: 6, snippet: '</bal-button-group>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [color] and :color bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-button [color]="color" [disabled]="busy" (click)="save()">Save</bal-button>',
        '<bal-button :color="color" :loading="busy" @click="save">Save</bal-button>',
        '',
      ].join('\n'),
    )

    expect(scanBalButton(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-button [color]="color" [disabled]="busy" (click)="save()">' },
            { line: 1, snippet: '</bal-button>' },
            { line: 2, snippet: '<bal-button :color="color" :loading="busy" @click="save">' },
            { line: 2, snippet: '</bal-button>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of SKIP_DIRS) {
      write(root, join(dir, 'ignored.html'), '<bal-button></bal-button>\n')
      write(root, join('src', dir, 'nested.tsx'), '<BalButton />\n')
    }

    expect(scanBalButton(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-button color="primary"></bal-button>\n'
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
            { line: 1, snippet: '<bal-button color="primary">' },
            { line: 1, snippet: '</bal-button>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('button migration.md', () => {
  it('titles the component button and documents the bundled group, colour, prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/button/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# button\n')).toBe(true)
    for (const phrase of [
      'scan-bal-button.mjs',
      'one yes/no',
      'bal-button-group',
      '::slotted(ds-button)',
      'ghost',
      'brand-purple',
      'name/value no longer reach the submitted form data',
      'requestSubmit()',
      'expanded',
      'wide',
      'rounded',
      'isActive',
      'bal-popup',
      'ds-popup',
      'components/icon/migration.md',
      'brandIcon',
      'BalButtonBundle',
      'DsButton',
      'DsButtonGroup',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'dsClick',
      'dsNavigate',
      'dsFocus',
      'dsBlur',
      'dsDidRender',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
