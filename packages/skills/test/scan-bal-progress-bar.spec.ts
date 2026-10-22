import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalProgressBar } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-progress-bar.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-progress-bar-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalProgressBar', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalProgressBar } from '@baloise/ds-react'",
        '// <BalProgressBar /> in a comment',
        "const note = '<BalProgressBar />'",
        'export const App = () => (',
        '  <>',
        '    <BalProgressBar value={50} />',
        '    <BalProgressBar',
        '      color="green"',
        '    >',
        '    </BalProgressBar>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalProgressBar />\n')

    expect(scanBalProgressBar(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalProgressBar } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalProgressBar value={50} />' },
            { line: 7, snippet: '<BalProgressBar color="green">' },
            { line: 10, snippet: '</BalProgressBar>' },
          ],
        },
      ],
    })
  })

  it('does not match longer tag names or the ambient BalProgressBar types', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-progress-bar-foo></bal-progress-bar-foo>', '<bal-progress-barfoo>'].join('\n'))
    write(
      root,
      'types.ts',
      ["const a: BalProps.BalProgressBarBackground = 'white'", 'type B = BalProgressBarColor'].join('\n'),
    )

    expect(scanBalProgressBar(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      ['<!-- <bal-progress-bar></bal-progress-bar> -->', '<bal-progress-bar [value]="p"></bal-progress-bar>'].join(
        '\n',
      ),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalProgressBar } from '@baloise/ds-angular'",
        "const label = '<bal-progress-bar>'",
        '@Component({',
        '  imports: [BalProgressBar],',
        '  template: `<bal-progress-bar color="red"></bal-progress-bar>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalProgressBar(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-progress-bar [value]="p">' },
            { line: 2, snippet: '</bal-progress-bar>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalProgressBar } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalProgressBar],' },
            { line: 5, snippet: '<bal-progress-bar color="red">' },
            { line: 5, snippet: '</bal-progress-bar>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-progress-bar', '  value="50"', '  color="red"', '></bal-progress-bar>'].join('\n'))
    write(root, 'notes.md', '<bal-progress-bar></bal-progress-bar>\n')

    const result = scanBalProgressBar(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[0].snippet).toContain('color="red"')
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-progress-bar>' })
  })

  it('lists tags that carry [value] and :value bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-progress-bar [value]="progress" [color]="tone"></bal-progress-bar>',
        '<bal-progress-bar :value="progress" :color="tone"></bal-progress-bar>',
        '',
      ].join('\n'),
    )

    expect(scanBalProgressBar(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-progress-bar [value]="progress" [color]="tone">' },
            { line: 1, snippet: '</bal-progress-bar>' },
            { line: 2, snippet: '<bal-progress-bar :value="progress" :color="tone">' },
            { line: 2, snippet: '</bal-progress-bar>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-progress-bar></bal-progress-bar>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-progress-bar></bal-progress-bar>\n')
      write(root, `src/${dir}/nested.html`, '<BalProgressBar />\n')
    }

    expect(scanBalProgressBar(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-progress-bar>' },
            { line: 1, snippet: '</bal-progress-bar>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-progress-bar value="50" background="white"></bal-progress-bar>\n'
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
            { line: 1, snippet: '<bal-progress-bar value="50" background="white">' },
            { line: 1, snippet: '</bal-progress-bar>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests progress-bar when the project uses bal-progress-bar', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-progress-bar value="50"></bal-progress-bar>\n')

    expect(scanMigratable(root).suggested).toEqual([{ name: 'progress-bar', total: 2 }])
  })
})

describe('progress-bar migration.md', () => {
  it('titles the component progress-bar and documents the prop, tag, and import mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/progress-bar/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# progress-bar')).toBe(true)
    for (const phrase of [
      'scan-bal-progress-bar.mjs',
      'one yes/no',
      'ds-progress-bar',
      'DsProgressBar',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'background="light"',
      'background="dark"',
      'role="progressbar"',
      'aria-hidden="true"',
      'part="line"',
      '--ds-progress-bar',
      'BalProps.BalProgressBarBackground',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
