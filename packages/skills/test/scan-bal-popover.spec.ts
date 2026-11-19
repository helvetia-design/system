import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalPopover } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-popover.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-popover-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalPopover', () => {
  it('lists React tags, the trigger attribute, import symbols and element types and skips comments and strings', () => {
    const root = createScratchDir()
    write(
      root,
      'PortfolioSummary.tsx',
      [
        "import { BalButton, BalPopover, BalPopoverContent } from '@baloise/ds-react'",
        "const _note = '<bal-popover></bal-popover>'",
        'const _hidden = /* <BalPopover /> */ null',
        'export function PortfolioSummary() {',
        '  const ref = useRef<HTMLBalPopoverElement>(null)',
        '  return (',
        '    <BalPopover ref={ref} onBalChange={e => setOpen(e.detail)}>',
        '      <BalButton bal-popover-trigger onClick={() => ref.current?.toggle()}>Details</BalButton>',
        '      <BalPopoverContent contentWidth={320}>Text</BalPopoverContent>',
        '    </BalPopover>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalPopover />\n')

    expect(scanBalPopover(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'PortfolioSummary.tsx',
          findings: [
            { line: 1, snippet: "import { BalButton, BalPopover, BalPopoverContent } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalButton, BalPopover, BalPopoverContent } from '@baloise/ds-react'" },
            { line: 5, snippet: 'const ref = useRef<HTMLBalPopoverElement>(null)' },
            { line: 7, snippet: '<BalPopover ref={ref} onBalChange={e => setOpen(e.detail)}>' },
            {
              line: 8,
              snippet: '<BalButton bal-popover-trigger onClick={() => ref.current?.toggle()}>Details</BalButton>',
            },
            { line: 9, snippet: '<BalPopoverContent contentWidth={320}>' },
            { line: 9, snippet: '</BalPopoverContent>' },
            { line: 10, snippet: '</BalPopover>' },
          ],
        },
      ],
    })
  })

  it('lists Angular templates, inline templates and the trigger attribute', () => {
    const root = createScratchDir()
    write(
      root,
      'help.component.html',
      [
        '<!-- <bal-popover></bal-popover> -->',
        '<bal-popover #popover position="top" (balChange)="changed($event)">',
        '  <bal-button bal-popover-trigger (click)="popover.toggle()">Help</bal-button>',
        '  <bal-popover-content spaceless>Text</bal-popover-content>',
        '</bal-popover>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalPopover, BalPopoverContent } from '@baloise/ds-angular'",
        '@Component({',
        '  imports: [BalPopover, BalPopoverContent],',
        '  template: `<bal-popover><span bal-popover-trigger>?</span></bal-popover>`,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    const result = scanBalPopover(root)

    expect(result.files.map(file => file.file)).toEqual(['help.component.html', 'inline.component.ts'])
    expect(result.files[0].findings).toEqual([
      { line: 2, snippet: '<bal-popover #popover position="top" (balChange)="changed($event)">' },
      { line: 3, snippet: '<bal-button bal-popover-trigger (click)="popover.toggle()">Help</bal-button>' },
      { line: 4, snippet: '<bal-popover-content spaceless>' },
      { line: 4, snippet: '</bal-popover-content>' },
      { line: 5, snippet: '</bal-popover>' },
    ])
    expect(result.files[1].findings).toEqual([
      { line: 1, snippet: "import { BalPopover, BalPopoverContent } from '@baloise/ds-angular'" },
      { line: 1, snippet: "import { BalPopover, BalPopoverContent } from '@baloise/ds-angular'" },
      { line: 3, snippet: 'imports: [BalPopover, BalPopoverContent],' },
      { line: 3, snippet: 'imports: [BalPopover, BalPopoverContent],' },
      { line: 4, snippet: '<bal-popover>' },
      { line: 4, snippet: 'template: `<bal-popover><span bal-popover-trigger>?</span></bal-popover>`,' },
      { line: 4, snippet: '</bal-popover>' },
    ])
    expect(result.total).toBe(12)
  })

  it('lists a plain HTML popover with a multiline opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-popover',
        '  id="help"',
        '  arrow',
        '>',
        '  <button bal-popover-trigger>Help</button>',
        '  <bal-popover-content>Text</bal-popover-content>',
        '</bal-popover>',
        '',
      ].join('\n'),
    )
    write(root, 'notes.md', '<bal-popover></bal-popover>\n')

    expect(scanBalPopover(root)).toEqual({
      total: 5,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-popover id="help" arrow>' },
            { line: 5, snippet: '<button bal-popover-trigger>Help</button>' },
            { line: 6, snippet: '<bal-popover-content>' },
            { line: 6, snippet: '</bal-popover-content>' },
            { line: 7, snippet: '</bal-popover>' },
          ],
        },
      ],
    })
  })

  it('lists the trigger attribute in a file that never names the tag', () => {
    const root = createScratchDir()
    write(root, 'trigger.html', '<button bal-popover-trigger>Help</button>\n')

    expect(scanBalPopover(root)).toEqual({
      total: 1,
      files: [{ file: 'trigger.html', findings: [{ line: 1, snippet: '<button bal-popover-trigger>Help</button>' }] }],
    })
  })

  it('does not match bal-popup, BalPopup, longer names or the ambient BalPopover types', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<button bal-popup="p1">Open</button>',
        '<bal-popup id="p1" bal-popup-placement="bottom"></bal-popup>',
        '<bal-popover-other></bal-popover-other>',
        '<span bal-popover-trigger-x></span>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'Popup.tsx',
      [
        "import { BalPopup } from '@baloise/ds-react'",
        'type A = BalProps.BalPopoverPlacement',
        'type B = BalEvents.BalPopoverChangeDetail',
        'const handler = (e: BalPopoverCustomEvent<boolean>) => e',
        'const BalPopoverish = 1',
        'export const P = () => <BalPopup id="p1" />',
        '',
      ].join('\n'),
    )

    expect(scanBalPopover(root)).toEqual({ total: 0, files: [] })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-popover></bal-popover>\n')
    }
    for (const dir of ['node_modules', '.angular', '.git', '.claude']) {
      write(root, `src/${dir}/nested.html`, '<BalPopover />\n')
    }

    expect(scanBalPopover(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-popover></bal-popover>\n'
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
            { line: 1, snippet: '<bal-popover>' },
            { line: 1, snippet: '</bal-popover>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests popover and folds bal-popover-content in, separate from popup', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-popover>',
        '  <button bal-popover-trigger>?</button>',
        '  <bal-popover-content></bal-popover-content>',
        '</bal-popover>',
        '<bal-popup id="p1"></bal-popup>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({
      suggested: [
        { name: 'popover', total: 2 },
        { name: 'popup', total: 1 },
      ],
      notYet: [],
      types: [],
    })
  })
})

describe('popover migration.md', () => {
  it('titles the migration popover → popup and documents the structure, prop, method, event and import mapping', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/popover/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# popover → popup\n')).toBe(true)
    for (const phrase of [
      'scan-bal-popover.mjs',
      'one yes/no',
      'data-popup="<id>"',
      'portfolio-summary-popover-1',
      'placement="bottom-start"',
      'backdropDismiss',
      '`trigger` prop',
      'ds-tooltip',
      'components/popup/migration.md',
      'DsPopup',
      'HTMLDsPopupElement',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'BalProps.BalPopoverPlacement',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
