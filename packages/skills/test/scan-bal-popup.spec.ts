import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalPopup } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-popup.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-popup-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalPopup', () => {
  it('lists React tags and the import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton, BalPopup } from '@baloise/ds-react'",
        '// <BalPopup /> in a comment',
        "const note = '<BalPopup />'",
        'export const App = () => (',
        '  <>',
        '    <BalPopup id="p1" label="T" />',
        '    <BalPopup',
        '      closable',
        '    >',
        '    </BalPopup>',
        '  </>',
        ')',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalPopup />\n')

    expect(scanBalPopup(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalPopup } from '@baloise/ds-react'" },
            { line: 6, snippet: '<BalPopup id="p1" label="T" />' },
            { line: 7, snippet: '<BalPopup closable>' },
            { line: 10, snippet: '</BalPopup>' },
          ],
        },
      ],
    })
  })

  it('does not match longer tag names or the ambient BalPopup types', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-popupfoo>', '<bal-popup-unknown>'].join('\n'))
    write(
      root,
      'types.ts',
      [
        "const a: BalProps.BalPopupVariant = 'popover'",
        'type B = BalEvents.BalPopupChangeDetail',
        "const c: BalPopupPlacement = 'top'",
      ].join('\n'),
    )

    expect(scanBalPopup(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      ['<!-- <bal-popup></bal-popup> -->', '<bal-popup id="p1" [active]="isOpen"></bal-popup>'].join('\n'),
    )
    write(
      root,
      'app.component.ts',
      [
        "import { BalPopup } from '@baloise/ds-angular'",
        "const label = '<bal-popup>'",
        '@Component({',
        '  imports: [BalPopup],',
        '  template: `<bal-popup id="p2" closable></bal-popup>`,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
    )

    expect(scanBalPopup(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 2, snippet: '<bal-popup id="p1" [active]="isOpen">' },
            { line: 2, snippet: '</bal-popup>' },
          ],
        },
        {
          file: 'app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalPopup } from '@baloise/ds-angular'" },
            { line: 4, snippet: 'imports: [BalPopup],' },
            { line: 5, snippet: '<bal-popup id="p2" closable>' },
            { line: 5, snippet: '</bal-popup>' },
          ],
        },
      ],
    })
  })

  it('lists the trigger attribute and its overrides in a file that never names the tag', () => {
    const root = createScratchDir()
    const line = '<bal-button bal-popup="p1" bal-popup-placement="right"></bal-button>'
    write(root, 'trigger.html', `${line}\n`)

    expect(scanBalPopup(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'trigger.html',
          findings: [
            { line: 1, snippet: line },
            { line: 1, snippet: line },
          ],
        },
      ],
    })
  })

  it('lists the legacy Cypress commands in a spec that never names the tag', () => {
    const root = createScratchDir()
    write(root, 'e2e/popup.cy.ts', ["cy.get('#p1').balPopupIsOpen()", "cy.get('#p1').balPopupIsClosed()"].join('\n'))

    expect(scanBalPopup(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'e2e/popup.cy.ts',
          findings: [
            { line: 1, snippet: "cy.get('#p1').balPopupIsOpen()" },
            { line: 2, snippet: "cy.get('#p1').balPopupIsClosed()" },
          ],
        },
      ],
    })
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-popup', '  id="p1"', '  closable', '></bal-popup>'].join('\n'))
    write(root, 'notes.md', '<bal-popup></bal-popup>\n')

    const result = scanBalPopup(root)

    expect(result.total).toBe(2)
    expect(result.files.map(file => file.file)).toEqual(['index.html'])
    expect(result.files[0].findings[0].line).toBe(1)
    expect(result.files[0].findings[0].snippet).toContain('closable')
    expect(result.files[0].findings[1]).toEqual({ line: 4, snippet: '</bal-popup>' })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-popup></bal-popup>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-popup></bal-popup>\n')
      write(root, `src/${dir}/nested.html`, '<BalPopup />\n')
    }

    expect(scanBalPopup(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-popup>' },
            { line: 1, snippet: '</bal-popup>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-popup id="p1" closable></bal-popup>\n'
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
            { line: 1, snippet: '<bal-popup id="p1" closable>' },
            { line: 1, snippet: '</bal-popup>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests popup when the project uses bal-popup', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-popup id="p1"></bal-popup>\n')

    expect(scanMigratable(root).suggested).toEqual([{ name: 'popup', total: 2 }])
  })

  it('does not suggest popup from a trigger attribute alone', () => {
    const root = createScratchDir()
    write(root, 'trigger.html', '<bal-button bal-popup="p1"></bal-button>\n')

    const result = scanMigratable(root)

    expect(JSON.stringify(result)).not.toContain('popup')
    expect(result.suggested).toEqual([{ name: 'button', total: 2 }])
  })
})

describe('popup migration.md', () => {
  it('titles the component popup and documents the trigger, prop, tag, import, and event mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/popup/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# popup')).toBe(true)
    for (const phrase of [
      'scan-bal-popup.mjs',
      'one yes/no',
      'ds-popup',
      'DsPopup',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'data-popup',
      'bal-popup-placement',
      'bal-popup-reference',
      'variant="drawer"',
      'ds-drawer',
      'dsWillPresent',
      'dsDidDismiss',
      'balChange',
      'balPopupIsOpen',
      'bal-popup-content',
      'aria-presented',
      'BalProps.BalPopupVariant',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
