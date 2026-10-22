import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalShape } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-shape.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-shape-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalShape', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalShape } from '@baloise/ds-react'",
        '// <BalShape /> in a comment',
        "const note = '<BalShape />'",
        'export const App = () => (',
        '  <BalShape variation="2" color="red" />',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalShape />\n')

    expect(scanBalShape(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalShape } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalShape variation="2" color="red" />' },
          ],
        },
      ],
    })
  })

  it('lists the HTML tag but not longer names or the type references', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-shape></bal-shape>', '<bal-shapes>', '<bal-shape-unknown>'].join('\n'))
    write(
      root,
      'types.ts',
      [
        'const a: BalProps.BalShapeColor = "green"',
        'type B = BalProps.BalShapeVariation',
        'type C = BalShapeRotation',
      ].join('\n'),
    )

    expect(scanBalShape(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-shape>' },
            { line: 1, snippet: '</bal-shape>' },
          ],
        },
      ],
    })
  })

  it('lists Angular inline template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'shape.component.ts',
      [
        "import { Component } from '@angular/core'",
        '// <bal-shape> in a comment',
        "const note = '<bal-shape>'",
        '@Component({',
        "  selector: 'app-shape',",
        '  template: `',
        '    <bal-shape [color]="color" rotation="90"></bal-shape>',
        '  `,',
        '})',
        'export class ShapeComponent {}',
      ].join('\n'),
    )

    expect(scanBalShape(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'shape.component.ts',
          findings: [
            { line: 7, snippet: '<bal-shape [color]="color" rotation="90">' },
            { line: 7, snippet: '</bal-shape>' },
          ],
        },
      ],
    })
  })

  it('lists an Angular .html template and a multiline opening tag, and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'shape.component.html', '<bal-shape\n  variation="3"\n  color="yellow"\n></bal-shape>\n')
    write(root, 'README.md', '<bal-shape></bal-shape>\n')

    expect(scanBalShape(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'shape.component.html',
          findings: [
            { line: 1, snippet: '<bal-shape variation="3" color="yellow">' },
            { line: 4, snippet: '</bal-shape>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']) {
      write(root, `${dir}/x.html`, '<bal-shape></bal-shape>\n')
    }

    expect(scanBalShape(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-shape variation="1"></bal-shape>\n'
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
            { line: 1, snippet: '<bal-shape variation="1">' },
            { line: 1, snippet: '</bal-shape>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests shape when the project uses bal-shape', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-shape></bal-shape>\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'shape', total: 2 }],
      notYet: [],
    })
  })
})

describe('shape migration.md', () => {
  it('titles the component shape and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/shape/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# shape')).toBe(true)
    for (const phrase of [
      'scan-bal-shape.mjs',
      'one yes/no',
      'ds-shape',
      'DsShape',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'variation',
      'rotation',
      'color="green"',
      'purple',
      'grey',
      'BalProps.BalShapeColor',
      'border radius',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
