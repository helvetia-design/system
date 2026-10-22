import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalStack } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-stack.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-stack-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalStack', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalStack } from '@baloise/ds-react'",
        '// <BalStack /> in a comment',
        "const note = '<BalStack />'",
        'export const App = () => (',
        '  <BalStack layout="vertical" />',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalStack />\n')

    expect(scanBalStack(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalStack } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalStack layout="vertical" />' },
          ],
        },
      ],
    })
  })

  it('lists the HTML tag but not longer names or the type references', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-stack></bal-stack>', '<bal-stacks>', '<bal-stack-unknown>'].join('\n'))
    write(
      root,
      'types.ts',
      [
        'const a: BalProps.BalStackLayout = "vertical"',
        'type B = BalProps.BalStackLayout',
        'type C = BalStackLayout',
      ].join('\n'),
    )

    expect(scanBalStack(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-stack>' },
            { line: 1, snippet: '</bal-stack>' },
          ],
        },
      ],
    })
  })

  it('lists Angular inline template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'stack.component.ts',
      [
        "import { Component } from '@angular/core'",
        '// <bal-stack> in a comment',
        "const note = '<bal-stack>'",
        '@Component({',
        "  selector: 'app-stack',",
        '  template: `',
        '    <bal-stack [layout]="size" layout="horizontal"></bal-stack>',
        '  `,',
        '})',
        'export class StackComponent {}',
      ].join('\n'),
    )

    expect(scanBalStack(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'stack.component.ts',
          findings: [
            { line: 7, snippet: '<bal-stack [layout]="size" layout="horizontal">' },
            { line: 7, snippet: '</bal-stack>' },
          ],
        },
      ],
    })
  })

  it('lists an Angular .html template and a multiline opening tag, and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'stack.component.html', '<bal-stack\n  layout="vertical-reverse"\n  class="x"\n></bal-stack>\n')
    write(root, 'README.md', '<bal-stack></bal-stack>\n')

    expect(scanBalStack(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'stack.component.html',
          findings: [
            { line: 1, snippet: '<bal-stack layout="vertical-reverse" class="x">' },
            { line: 4, snippet: '</bal-stack>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']) {
      write(root, `${dir}/x.html`, '<bal-stack></bal-stack>\n')
    }

    expect(scanBalStack(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-stack layout="vertical"></bal-stack>\n'
    write(root, 'index.html', html)
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
            { line: 1, snippet: '<bal-stack layout="vertical">' },
            { line: 1, snippet: '</bal-stack>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests stack when the project uses bal-stack', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-stack></bal-stack>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'stack', total: 2 }],
      notYet: [],
    })
  })
})

describe('stack migration.md', () => {
  it('titles the component stack and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/stack/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# stack')).toBe(true)
    for (const phrase of [
      'scan-bal-stack.mjs',
      'one yes/no',
      'ds-stack',
      'DsStack',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'direction="row"',
      'row-reverse',
      'column-reverse',
      '`xx-large`',
      '`2xl`',
      '`2xs`',
      'row gap',
      'column gap',
      'BalProps.BalStackLayout',
      '.bal-stack',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
