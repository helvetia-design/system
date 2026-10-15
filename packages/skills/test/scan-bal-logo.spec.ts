import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalLogo } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-logo.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-logo-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalLogo', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalLogo } from '@baloise/ds-react'",
        "const _note = 'bal-logo'",
        'const _example = \'<BalLogo color="white"></BalLogo>\'',
        'const _markup = `<BalLogo size="small" />`',
        'const _trailing = true // <BalLogo />',
        'const _hidden = /* <bal-logo></bal-logo> */ null',
        'export function App() {',
        '  return (',
        '    <>',
        '      <BalLogo color="white">',
        '      </BalLogo>',
        '    </>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'Widget.jsx', 'export const Widget = () => <BalLogo animated />\n')
    write(root, 'dist/ignored.tsx', '<bal-logo></bal-logo>\n<BalLogo />\n')

    expect(scanBalLogo(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalLogo } from '@baloise/ds-react'" },
            { line: 10, snippet: '<BalLogo color="white">' },
            { line: 11, snippet: '</BalLogo>' },
          ],
        },
        {
          file: 'Widget.jsx',
          findings: [{ line: 1, snippet: '<BalLogo animated />' }],
        },
      ],
    })
  })

  it('does not match a longer name or the ambient BalLogo types', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-logo-other></bal-logo-other>\n')
    write(
      root,
      'types.ts',
      [
        'type A = BalProps.BalLogoColor',
        'type B = BalProps.BalLogoSize',
        'type C = BalProps.BalLogoBrand',
        'const BalLogoish = 1',
        '',
      ].join('\n'),
    )

    expect(scanBalLogo(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags, including inline template strings, and skips comments', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-logo></bal-logo> -->',
        '<div title="bal-logo">text</div>',
        '<bal-logo color="white" size="small"></bal-logo>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { Component } from '@angular/core'",
        "import { BalLogo } from '@baloise/ds-angular'",
        "const _decoy = 'bal-logo'",
        '// <bal-logo></bal-logo>',
        '@Component({',
        '  imports: [BalLogo],',
        '  template: `',
        '    <bal-logo brand="helvetia"></bal-logo>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalLogo(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 3, snippet: '<bal-logo color="white" size="small">' },
            { line: 3, snippet: '</bal-logo>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 2, snippet: "import { BalLogo } from '@baloise/ds-angular'" },
            { line: 6, snippet: 'imports: [BalLogo],' },
            { line: 8, snippet: '<bal-logo brand="helvetia">' },
            { line: 8, snippet: '</bal-logo>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-logo', '  color="white"', '  animated', '></bal-logo>', ''].join('\n'))
    write(root, 'notes.md', '<bal-logo></bal-logo>\n')

    expect(scanBalLogo(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-logo color="white" animated>' },
            { line: 4, snippet: '</bal-logo>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-logo></bal-logo>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-logo></bal-logo>\n')
      write(root, `src/${dir}/nested.html`, '<BalLogo></BalLogo>\n')
    }

    expect(scanBalLogo(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-logo>' },
            { line: 1, snippet: '</bal-logo>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-logo></bal-logo>\n'
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
            { line: 1, snippet: '<bal-logo>' },
            { line: 1, snippet: '</bal-logo>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests logo when the project uses it', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-logo></bal-logo>\n')

    const { suggested } = scanMigratable(root)

    expect(suggested).toEqual(expect.arrayContaining([{ name: 'logo', total: 2 }]))
  })
})

describe('logo migration.md', () => {
  it('titles the component logo and documents the prop, tag, import, and report mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/logo/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# logo\n')).toBe(true)
    for (const phrase of [
      'scan-bal-logo.mjs',
      'one yes/no',
      '`primary`',
      '`inverted`',
      '`sm`',
      'brand=""',
      'ds-logo',
      'DsLogo',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'BalProps.BalLogo',
      'part="animated"',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
