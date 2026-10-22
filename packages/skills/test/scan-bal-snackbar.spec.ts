import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalSnackbar } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-snackbar.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-snackbar-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalSnackbar', () => {
  it('lists React tags and imports, and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalSnackbar } from '@baloise/ds-react'",
        "const _note = 'bal-snackbar'",
        'const _example = \'<BalSnackbar subject="Hi">Hi</BalSnackbar>\'',
        'const _markup = `<BalSnackbar subject="Hi"></BalSnackbar>`',
        'const _trailing = true // <BalSnackbar color="info" />',
        'const _hidden = /* <bal-snackbar>Hi</bal-snackbar> */ null',
        'void BalButton',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalSnackbar subject="Saved" message="Done" />',
        '      <BalSnackbar color="danger" duration={3000} />',
        '      <BalSnackbar subject="Queued">',
        '      </BalSnackbar>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'Widget.jsx',
      'const _label = \'bal-snackbar\'\nexport const Widget = () => <BalSnackbar subject="Hi">Hi</BalSnackbar>\n',
    )
    write(root, 'dist/ignored.tsx', '<bal-snackbar>Hi</bal-snackbar>\n<BalSnackbar>Hi</BalSnackbar>\n')
    write(root, 'packed.tsx', 'const _value = 1// <BalSnackbar color="info" />\n')

    expect(scanBalSnackbar(root)).toEqual({
      total: 7,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalSnackbar } from '@baloise/ds-react'" },
            { line: 11, snippet: '<BalSnackbar subject="Saved" message="Done" />' },
            { line: 12, snippet: '<BalSnackbar color="danger" duration={3000} />' },
            { line: 13, snippet: '<BalSnackbar subject="Queued">' },
            { line: 14, snippet: '</BalSnackbar>' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [
            { line: 2, snippet: '<BalSnackbar subject="Hi">' },
            { line: 2, snippet: '</BalSnackbar>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags and the snackbar service, and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-snackbar>Hi</bal-snackbar> -->',
        '<div title="bal-snackbar">text</div>',
        '<p>Mention bal-snackbar in text only.</p>',
        '<bal-snackbar subject="Hi" (balClose)="onClose($event)">Hi</bal-snackbar>',
        '<bal-snackbar color="danger" duration="3000">Hi</bal-snackbar>',
        '<script>',
        "  const decoy = '<bal-snackbar>Hi</bal-snackbar>'",
        '</script>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalSnackbar } from '@baloise/ds-angular'",
        "import { BalSnackbarService } from '@baloise/ds-angular'",
        "const _decoy = 'bal-snackbar'",
        'const _markup = \'<bal-snackbar subject="Hi">Hi</bal-snackbar>\'',
        '// <bal-snackbar color="danger">Hi</bal-snackbar>',
        '@Component({',
        "  selector: 'app-root',",
        '  template: `',
        '    <!-- <bal-snackbar>Hi</bal-snackbar> -->',
        '    <bal-snackbar subject="Saved" color="info">Hi</bal-snackbar>',
        '  `,',
        '})',
        'export class AppComponent {}',
        '@Component({',
        '  template: \'<bal-snackbar subject="Queued" action="Undo">Hi</bal-snackbar>\',',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalSnackbar(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 4, snippet: '<bal-snackbar subject="Hi" (balClose)="onClose($event)">' },
            { line: 4, snippet: '</bal-snackbar>' },
            { line: 5, snippet: '<bal-snackbar color="danger" duration="3000">' },
            { line: 5, snippet: '</bal-snackbar>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 2, snippet: "import { BalSnackbar } from '@baloise/ds-angular'" },
            { line: 3, snippet: "import { BalSnackbarService } from '@baloise/ds-angular'" },
            { line: 11, snippet: '<bal-snackbar subject="Saved" color="info">' },
            { line: 11, snippet: '</bal-snackbar>' },
            { line: 16, snippet: '<bal-snackbar subject="Queued" action="Undo">' },
            { line: 16, snippet: '</bal-snackbar>' },
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
        '    <!-- <bal-snackbar color="danger">Hi</bal-snackbar> -->',
        '    <p>bal-snackbar</p>',
        '    <bal-snackbar subject="Saved" message="Done"></bal-snackbar>',
        '    <span data-note="<bal-snackbar></bal-snackbar>">x</span>',
        '    <!-- prettier-ignore -->',
        '    <bal-snackbar',
        '      subject="Queued"',
        '      href="/undo"',
        '    >Hi</bal-snackbar>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    )
    write(root, 'nested/page.html', '<bal-snackbar subject="Hi">Hi</bal-snackbar>\n')
    write(root, 'notes.md', '<bal-snackbar>Hi</bal-snackbar>\n')

    expect(scanBalSnackbar(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 6, snippet: '<bal-snackbar subject="Saved" message="Done">' },
            { line: 6, snippet: '</bal-snackbar>' },
            { line: 9, snippet: '<bal-snackbar subject="Queued" href="/undo">' },
            { line: 12, snippet: '</bal-snackbar>' },
          ],
        },
        {
          file: 'nested/page.html',
          findings: [
            { line: 1, snippet: '<bal-snackbar subject="Hi">' },
            { line: 1, snippet: '</bal-snackbar>' },
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
        '<bal-snackbar [subject]="title" [message]="text" [color]="tone" (balClose)="onClose()"></bal-snackbar>',
        '<bal-snackbar :subject="title" :message="text" :color="tone"></bal-snackbar>',
        '',
      ].join('\n'),
    )

    expect(scanBalSnackbar(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            {
              line: 1,
              snippet: '<bal-snackbar [subject]="title" [message]="text" [color]="tone" (balClose)="onClose()">',
            },
            { line: 1, snippet: '</bal-snackbar>' },
            { line: 2, snippet: '<bal-snackbar :subject="title" :message="text" :color="tone">' },
            { line: 2, snippet: '</bal-snackbar>' },
          ],
        },
      ],
    })
  })

  it('lists a controller that is not next to a tag', () => {
    const root = createScratchDir()
    write(
      root,
      'snackbar.ts',
      [
        "import { BalSnackbarController, balSnackbarController } from '@baloise/ds-core'",
        'balSnackbarController.create({ message: "Saved", subject: "Hi", icon: "info-circle" })',
        'const ctrl: BalSnackbarController = balSnackbarController',
        'const opts: BalSnackbarOptions = { message: "Hi", subject: "Hi", icon: "" }',
        '',
      ].join('\n'),
    )

    expect(scanBalSnackbar(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'snackbar.ts',
          findings: [
            { line: 1, snippet: "import { BalSnackbarController, balSnackbarController } from '@baloise/ds-core'" },
            { line: 1, snippet: "import { BalSnackbarController, balSnackbarController } from '@baloise/ds-core'" },
            {
              line: 2,
              snippet: 'balSnackbarController.create({ message: "Saved", subject: "Hi", icon: "info-circle" })',
            },
            { line: 3, snippet: 'const ctrl: BalSnackbarController = balSnackbarController' },
            { line: 3, snippet: 'const ctrl: BalSnackbarController = balSnackbarController' },
            { line: 4, snippet: 'const opts: BalSnackbarOptions = { message: "Hi", subject: "Hi", icon: "" }' },
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
        '<bal-snackbar-foo>nope</bal-snackbar-foo>',
        '<bal-notices>nope</bal-notices>',
        '<bal-toast (balClose)="x()">nope</bal-toast>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'let color: BalProps.BalSnackbarColor',
        'let ev: BalEvents.BalSnackbarClose',
        'let el: HTMLBalSnackbarElement',
        'let comp: Components.BalSnackbar',
        '',
      ].join('\n'),
    )

    expect(scanBalSnackbar(root)).toEqual({
      total: 1,
      files: [{ file: 'types.ts', findings: [{ line: 4, snippet: 'let comp: Components.BalSnackbar' }] }],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-snackbar>Hi</bal-snackbar>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-snackbar>Hi</bal-snackbar>\n')
      write(root, `src/${dir}/nested.html`, '<BalSnackbar>Hi</BalSnackbar>\n')
    }

    expect(scanBalSnackbar(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-snackbar>' },
            { line: 1, snippet: '</bal-snackbar>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-snackbar subject="Saved">Hi</bal-snackbar>\n'
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
            { line: 1, snippet: '<bal-snackbar subject="Saved">' },
            { line: 1, snippet: '</bal-snackbar>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('snackbar migration.md', () => {
  it('titles the component snackbar and documents the prop, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/snackbar/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# snackbar\n')).toBe(true)
    for (const phrase of [
      'scan-bal-snackbar.mjs',
      'one yes/no',
      'subject',
      'heading',
      'actionHref',
      'actionTarget="_self"',
      'closable',
      'duration',
      'closeIn',
      'balClose',
      'dsCloseClick',
      'balAction',
      'dsActionClick',
      'balSnackbarController',
      'dsSnackbarController',
      'BalSnackbarService',
      'DsSnackbarService',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      '@helvetia-design/core',
      'DsSnackbar',
      '<ds-snackbar>',
      'useSnackbar',
      'same basename',
      'no child',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
