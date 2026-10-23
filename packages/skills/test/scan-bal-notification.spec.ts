import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalNotification } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-notification.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-notification-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalNotification', () => {
  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalNotification } from '@baloise/ds-react'",
        "const _note = 'bal-notification'",
        'const _example = \'<BalNotification color="info">Hi</BalNotification>\'',
        'const _trailing = true // <BalNotification light />',
        'type BalNotificationColor = string',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalNotification color="primary" light>',
        '        Saved',
        '      </BalNotification>',
        '      <BalNotification color={tone} noIcon />',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'Widget.jsx',
      'export const Widget = () => <BalNotification light color="danger">Hi</BalNotification>\n',
    )
    write(root, 'dist/ignored.tsx', '<bal-notification>Hi</bal-notification>\n<BalNotification>Hi</BalNotification>\n')

    expect(scanBalNotification(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalNotification } from '@baloise/ds-react'" },
            { line: 9, snippet: '<BalNotification color="primary" light>' },
            { line: 11, snippet: '</BalNotification>' },
            { line: 12, snippet: '<BalNotification color={tone} noIcon />' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [
            { line: 1, snippet: '<BalNotification light color="danger">' },
            { line: 1, snippet: '</BalNotification>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags, including inline template strings, and skips comments', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-notification>commented</bal-notification> -->',
        '<bal-notification color="success" no-icon>Done</bal-notification>',
        '<bal-notification [light]="compact" [color]="tone"></bal-notification>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { Component } from '@angular/core'",
        "const _label = 'bal-notification'",
        '@Component({',
        '  selector: "app-root",',
        '  template: `<bal-notification light color="warning">Hi</bal-notification>`,',
        '})',
        'export class AppComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalNotification(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-notification color="success" no-icon>' },
            { line: 2, snippet: '</bal-notification>' },
            { line: 3, snippet: '<bal-notification [light]="compact" [color]="tone">' },
            { line: 3, snippet: '</bal-notification>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 5, snippet: '<bal-notification light color="warning">' },
            { line: 5, snippet: '</bal-notification>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags, including a multiline opening tag', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-notification color="info">',
        '  Hi',
        '</bal-notification>',
        '<bal-notification',
        '  light',
        '  color="danger"',
        '>Oops</bal-notification>',
        '',
      ].join('\n'),
    )

    expect(scanBalNotification(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-notification color="info">' },
            { line: 3, snippet: '</bal-notification>' },
            { line: 4, snippet: '<bal-notification light color="danger">' },
            { line: 7, snippet: '</bal-notification>' },
          ],
        },
      ],
    })
  })

  it('does not match longer tags, CSS selectors, or test ids that only start with bal-notification', () => {
    const root = createScratchDir()
    write(
      root,
      'page.html',
      [
        '<bal-notification-content>Hi</bal-notification-content>',
        '<div data-testid="bal-notification-content" class="bal-notification"></div>',
        '',
      ].join('\n'),
    )
    write(root, 'styles.ts', "export const css = '.bal-notification { color: red }'\n")

    expect(scanBalNotification(root)).toEqual({ total: 0, files: [] })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-notification></bal-notification>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-notification></bal-notification>\n')
      write(root, `src/${dir}/nested.html`, '<BalNotification />\n')
    }

    expect(scanBalNotification(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-notification>' },
            { line: 1, snippet: '</bal-notification>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-notification color="info"></bal-notification>\n')
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
            { line: 1, snippet: '<bal-notification color="info">' },
            { line: 1, snippet: '</bal-notification>' },
          ],
        },
      ],
    })
  })
})

describe('notification migration.md', () => {
  it('titles the component notification and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/notification/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# notification\n')).toBe(true)
    for (const phrase of [
      'scan-bal-notification.mjs',
      'one yes/no',
      'color="info"',
      'BalProps.BalNotificationColor',
      'role="status"',
      'outline-red',
      'outline-green',
      'outline-yellow',
      'outline-default',
      'check manually',
      '@helvetia-design/react',
      'DsNotification',
      '<ds-notification>',
      'There are no event changes',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
