import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalSegment } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-segment.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-segment-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalSegment', () => {
  it('lists React tags and the import symbols and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalSegment, BalSegmentItem } from '@baloise/ds-react'",
        '// <BalSegment /> in a comment',
        "const note = '<BalSegmentItem />'",
        'export const App = () => (',
        '  <BalSegment value="1">',
        '    <BalSegmentItem',
        '      value="1"',
        '    >',
        '      One',
        '    </BalSegmentItem>',
        '  </BalSegment>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalSegment />\n')

    expect(scanBalSegment(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalSegment, BalSegmentItem } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalSegment, BalSegmentItem } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalSegment value="1">' },
            { line: 6, snippet: '<BalSegmentItem value="1">' },
            { line: 10, snippet: '</BalSegmentItem>' },
            { line: 11, snippet: '</BalSegment>' },
          ],
        },
      ],
    })
  })

  it('lists the item tag but not longer names or the ambient types', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-segment-item></bal-segment-item>', '<bal-segmentfoo>', '<bal-segment-unknown>'].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'const el: HTMLBalSegmentElement | null = null',
        'type A = BalEvents.BalSegmentChangeDetail',
        'const b: BalProps.BalSegmentValue = 1',
        'type C = BalSegmentValue',
      ].join('\n'),
    )

    expect(scanBalSegment(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-segment-item>' },
            { line: 1, snippet: '</bal-segment-item>' },
          ],
        },
      ],
    })
  })

  it('lists Angular inline template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'segment.component.ts',
      [
        "import { Component } from '@angular/core'",
        '// <bal-segment> in a comment',
        "const note = '<bal-segment-item>'",
        '@Component({',
        "  selector: 'app-segment',",
        '  template: `',
        '    <bal-segment (balChange)="onChange($event)">',
        '      <bal-segment-item value="1"></bal-segment-item>',
        '    </bal-segment>',
        '  `,',
        '})',
        'export class SegmentComponent {}',
      ].join('\n'),
    )

    expect(scanBalSegment(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'segment.component.ts',
          findings: [
            { line: 7, snippet: '<bal-segment (balChange)="onChange($event)">' },
            { line: 8, snippet: '<bal-segment-item value="1">' },
            { line: 8, snippet: '</bal-segment-item>' },
            { line: 9, snippet: '</bal-segment>' },
          ],
        },
      ],
    })
  })

  it('does not list the shared event names on their own', () => {
    const root = createScratchDir()
    write(root, 'listener.ts', "el.addEventListener('balChange', handler)\nconst x = '(balFocus)'\n")

    expect(scanBalSegment(root)).toEqual({ total: 0, files: [] })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-segment\n  value="1"\n  vertical\n>\n</bal-segment>\n')
    write(root, 'README.md', '<bal-segment></bal-segment>\n')

    expect(scanBalSegment(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-segment value="1" vertical>' },
            { line: 5, snippet: '</bal-segment>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of ['node_modules', 'dist', 'build', '.angular', '.git']) {
      write(root, `${dir}/x.html`, '<bal-segment></bal-segment>\n')
    }

    expect(scanBalSegment(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-segment value="1"></bal-segment>\n'
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
            { line: 1, snippet: '<bal-segment value="1">' },
            { line: 1, snippet: '</bal-segment>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests segment when the project uses bal-segment and folds the item tag in', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-segment>', '  <bal-segment-item value="1"></bal-segment-item>', '</bal-segment>', ''].join('\n'),
    )

    // bal-segment-item has no migration of its own; the segment migration covers it,
    // so it counts towards segment rather than showing up as notYet.
    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'segment', total: 4 }],
      notYet: [],
    })
  })
})

describe('segment migration.md', () => {
  it('titles the component segment and documents the prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/segment/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# segment')).toBe(true)
    for (const phrase of [
      'scan-bal-segment.mjs',
      'one yes/no',
      'ds-segment',
      'ds-segment-item',
      'DsSegment',
      'DsSegmentItem',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'expanded',
      'wide',
      'scrollable',
      'check behaviour',
      'required',
      'dsChange',
      'balChange',
      'balSelect',
      'HTMLBalSegmentElement',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
