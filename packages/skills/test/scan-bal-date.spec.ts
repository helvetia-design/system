import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalDate } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-date.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-date-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalDate', () => {
  it('lists React tags and imports and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalDate } from '@baloise/ds-react'",
        '// <BalDate /> in a comment',
        "const note = '<BalDate />'",
        'export const App = () => (',
        '  <>',
        '    <BalDate required />',
        '    <BalDate',
        '      allowInvalidValue',
        '    >',
        '    </BalDate>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalDate />\n')

    expect(scanBalDate(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalDate } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalDate required />' },
            { line: 7, snippet: '<BalDate allowInvalidValue>' },
            { line: 10, snippet: '</BalDate>' },
          ],
        },
      ],
    })
  })

  it('lists Angular template tags, inline templates, and the BalDate binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      ['<!-- <bal-date></bal-date> -->', '<bal-date [(ngModel)]="d"></bal-date>'].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalDate } from '@baloise/ds-angular'",
        "const label = '<bal-date>'",
        '@Component({',
        '  imports: [BalDate],',
        '  template: `<bal-date required></bal-date>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalDate(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-date [(ngModel)]="d">' },
            { line: 2, snippet: '</bal-date>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalDate } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalDate],' },
            { line: 5, snippet: '<bal-date required>' },
            { line: 5, snippet: '</bal-date>' },
          ],
        },
      ],
    })
  })

  it('does not match the internal calendar tags, longer names, or the BalDate type exports', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-date-calendar></bal-date-calendar>',
        '<bal-date-calendar-cell></bal-date-calendar-cell>',
        '<bal-datepicker>',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        "import type { BalDateCallback } from '@baloise/ds-core'",
        'type Q = BalDateCalendar',
        'const x = <BalDateable />',
      ].join('\n'),
    )

    expect(scanBalDate(root)).toEqual({ total: 0, files: [] })
  })

  it('lists HTML tags including a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-date', '  required', '  free-solo', '></bal-date>'].join('\n'))
    write(root, 'notes.md', '<bal-date></bal-date>\n')

    const result = scanBalDate(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[0].snippet).toContain('free-solo')
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-date>' })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-date></bal-date>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-date></bal-date>\n')
      write(root, `src/${dir}/nested.html`, '<BalDate />\n')
    }

    expect(scanBalDate(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-date>' },
            { line: 1, snippet: '</bal-date>' },
          ],
        },
      ],
    })
  })

  it('does not edit files and prints grouped findings as JSON', () => {
    const root = createScratchDir()
    const html = '<bal-date required></bal-date>\n'
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
            { line: 1, snippet: '<bal-date required>' },
            { line: 1, snippet: '</bal-date>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('date migration.md', () => {
  it('titles the component date and documents the mapping, confirm gate, and unstaged result', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/date/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# date\n')).toBe(true)
    for (const phrase of [
      'scan-bal-date.mjs',
      'one yes/no',
      '<ds-datepicker>',
      'DsDatepicker',
      '@helvetia-design/react',
      '@helvetia-design/angular',
      'required',
      'allowInvalidValue',
      'INVALID_VALUE',
      'triggerIcon',
      'closeOnSelect',
      'balChange',
      'dsChange',
      'balIconClick',
      'bal-date__popup',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration).toContain(phrase)
    }
  })
})
