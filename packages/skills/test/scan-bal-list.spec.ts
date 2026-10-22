import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalList } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-list.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-list-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalList', () => {
  it('lists the parent tag and every legacy child tag', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-list border>',
        '  <bal-list-item clickable>',
        '    <bal-list-item-icon><bal-icon name="account"></bal-icon></bal-list-item-icon>',
        '    <bal-list-item-content>',
        '      <bal-list-item-title>Policy</bal-list-item-title>',
        '      <bal-list-item-subtitle>12.345</bal-list-item-subtitle>',
        '    </bal-list-item-content>',
        '  </bal-list-item>',
        '  <bal-list-item accordion>',
        '    <bal-list-item-accordion-head icon="plus"></bal-list-item-accordion-head>',
        '    <bal-list-item-accordion-body><p>Details</p></bal-list-item-accordion-body>',
        '  </bal-list-item>',
        '</bal-list>',
        '',
      ].join('\n'),
    )

    const result = scanBalList(root)

    expect(result.files).toHaveLength(1)
    expect(result.files[0].file).toBe('index.html')
    expect(result.total).toBe(18)
    expect(result.files[0].findings[0]).toEqual({ line: 1, snippet: '<bal-list border>' })
    expect(result.files[0].findings).toContainEqual({ line: 5, snippet: '<bal-list-item-title>' })
    expect(result.files[0].findings).toContainEqual({
      line: 10,
      snippet: '<bal-list-item-accordion-head icon="plus">',
    })
    expect(result.files[0].findings).toContainEqual({ line: 11, snippet: '</bal-list-item-accordion-body>' })
  })

  it('does not match sibling tags or longer names that merely start with BalList', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-list-item-foo></bal-list-item-foo>',
        '<bal-listbox></bal-listbox>',
        '<bal-list-item-accordion></bal-list-item-accordion>',
        '<bal-data-list></bal-data-list>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'class BalListItemValueAccessor {}',
        'const a: BalProps.BalListSize = ""',
        'const b: BalProps.BalListBackground = "light"',
        'const c: BalProps.BalListItemTarget = "_self"',
        'const d: BalProps.BalListItemAccordionHeadIcon = "plus"',
        'const e: BalEvents.BalListItemNavigateDetail = ev',
        '',
      ].join('\n'),
    )

    expect(scanBalList(root)).toEqual({ total: 0, files: [] })
  })

  it('lists React tags and every list import symbol and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalList, BalListItem, BalListItemTitle } from '@baloise/ds-react'",
        "const _note = 'bal-list'",
        "const _example = '<BalListItem clickable></BalListItem>'",
        'const _markup = `<BalList />`',
        'const _trailing = true // <BalListItem />',
        'const _hidden = /* <bal-list></bal-list> */ null',
        'export function App() {',
        '  return (',
        '    <BalList>',
        '      <BalListItem>',
        '        <BalListItemTitle>Policy</BalListItemTitle>',
        '      </BalListItem>',
        '    </BalList>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<bal-list></bal-list>\n<BalListItem />\n')

    const result = scanBalList(root)

    expect(result.files.map(file => file.file)).toEqual(['App.tsx'])
    expect(result.files[0].findings).toContainEqual({
      line: 1,
      snippet: "import { BalList, BalListItem, BalListItemTitle } from '@baloise/ds-react'",
    })
    expect(result.files[0].findings).toContainEqual({ line: 11, snippet: '<BalListItemTitle>' })
    expect(result.files[0].findings).toContainEqual({ line: 13, snippet: '</BalList>' })
  })

  it('lists Angular template tags, inline templates, and the BalListBundle binding', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-list></bal-list> -->',
        '<div title="bal-list">text</div>',
        '<bal-list background="dark">',
        '  <bal-list-item [href]="url"></bal-list-item>',
        '</bal-list>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalListBundle } from '@baloise/ds-angular'",
        "const _decoy = 'bal-list'",
        '// <bal-list></bal-list>',
        '@Component({',
        '  imports: [BalListBundle],',
        '  template: `',
        '    <!-- <bal-list></bal-list> -->',
        '    <bal-list><bal-list-item></bal-list-item></bal-list>',
        '  `,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    const result = scanBalList(root)

    expect(result.files.map(file => file.file)).toEqual(['app.component.html', 'inline.component.ts'])
    expect(result.files[0].findings).toEqual([
      { line: 3, snippet: '<bal-list background="dark">' },
      { line: 4, snippet: '<bal-list-item [href]="url">' },
      { line: 4, snippet: '</bal-list-item>' },
      { line: 5, snippet: '</bal-list>' },
    ])
    expect(result.files[1].findings).toContainEqual({
      line: 1,
      snippet: "import { BalListBundle } from '@baloise/ds-angular'",
    })
    expect(result.files[1].findings).toContainEqual({ line: 5, snippet: 'imports: [BalListBundle],' })
    expect(result.files[1].findings).toContainEqual({ line: 8, snippet: '<bal-list-item>' })
  })

  it('lists every tag of nested lists, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-list>',
        '  <bal-list-item>',
        '    <bal-list>',
        '      <bal-list-item><bal-list-item-title>Inner</bal-list-item-title></bal-list-item>',
        '    </bal-list>',
        '  </bal-list-item>',
        '</bal-list>',
        '',
      ].join('\n'),
    )

    expect(scanBalList(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-list>' },
            { line: 2, snippet: '<bal-list-item>' },
            { line: 3, snippet: '<bal-list>' },
            { line: 4, snippet: '<bal-list-item>' },
            { line: 4, snippet: '<bal-list-item-title>' },
            { line: 4, snippet: '</bal-list-item-title>' },
            { line: 4, snippet: '</bal-list-item>' },
            { line: 5, snippet: '</bal-list>' },
            { line: 6, snippet: '</bal-list-item>' },
            { line: 7, snippet: '</bal-list>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-list-item-title at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-list>',
        '  <bal-list-item',
        '    clickable',
        '    href="/policy"',
        '  >',
        '    <bal-list-item-title',
        '      class="title"',
        '    >Policy</bal-list-item-title>',
        '  </bal-list-item>',
        '</bal-list>',
        '',
      ].join('\n'),
    )

    expect(scanBalList(root)).toEqual({
      total: 6,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-list>' },
            { line: 2, snippet: '<bal-list-item clickable href="/policy">' },
            { line: 6, snippet: '<bal-list-item-title class="title">' },
            { line: 8, snippet: '</bal-list-item-title>' },
            { line: 9, snippet: '</bal-list-item>' },
            { line: 10, snippet: '</bal-list>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [size] and :size bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-list [size]="size" [border]="border">',
        '  <bal-list-item *ngFor="let row of rows" [clickable]="row.link" [disabled]="row.off"></bal-list-item>',
        '</bal-list>',
        '<bal-list :size="size" :border="border">',
        '  <bal-list-item :clickable="row.link" :disabled="row.off"></bal-list-item>',
        '</bal-list>',
        '',
      ].join('\n'),
    )

    expect(scanBalList(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-list [size]="size" [border]="border">' },
            {
              line: 2,
              snippet: '<bal-list-item *ngFor="let row of rows" [clickable]="row.link" [disabled]="row.off">',
            },
            { line: 2, snippet: '</bal-list-item>' },
            { line: 3, snippet: '</bal-list>' },
            { line: 4, snippet: '<bal-list :size="size" :border="border">' },
            { line: 5, snippet: '<bal-list-item :clickable="row.link" :disabled="row.off">' },
            { line: 5, snippet: '</bal-list-item>' },
            { line: 6, snippet: '</bal-list>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-list></bal-list>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-list></bal-list>\n')
      write(root, `src/${dir}/nested.html`, '<BalListItem />\n')
    }

    expect(scanBalList(root).total).toBe(2)
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-list><bal-list-item></bal-list-item></bal-list>\n'
    write(root, 'index.html', contents)
    let text = ''

    const code = run(root, {
      write(chunk: string) {
        text += chunk
      },
    })

    expect(code).toBe(0)
    expect(JSON.parse(text)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-list>' },
            { line: 1, snippet: '<bal-list-item>' },
            { line: 1, snippet: '</bal-list-item>' },
            { line: 1, snippet: '</bal-list>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests list and folds every bal-list child tag into it', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-list>',
        '  <bal-list-item>',
        '    <bal-list-item-icon></bal-list-item-icon>',
        '    <bal-list-item-content>',
        '      <bal-list-item-title></bal-list-item-title>',
        '      <bal-list-item-subtitle></bal-list-item-subtitle>',
        '    </bal-list-item-content>',
        '    <bal-list-item-accordion-head></bal-list-item-accordion-head>',
        '    <bal-list-item-accordion-body></bal-list-item-accordion-body>',
        '  </bal-list-item>',
        '</bal-list>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root).suggested).toEqual([{ name: 'list', total: 16 }])
  })

  it('does not list BalListBundle as its own unmigratable component', () => {
    const root = createScratchDir()
    write(root, 'inline.component.ts', 'imports: [BalListBundle],\n')

    expect(scanMigratable(root).notYet).toEqual([])
  })
})

describe('list migration.md', () => {
  it('titles the component list and documents the shape, prop, tag, import, event, and method mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/list/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# list')).toBe(true)
    for (const phrase of [
      'scan-bal-list.mjs',
      'one yes/no',
      'ds-list',
      'ds-item',
      'DsList',
      'DsItem',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'BalListBundle',
      'variant="link"',
      'variant="button"',
      'variant="accordion"',
      'labelLevel',
      'labelSize',
      'description',
      'slot="icon"',
      'slot="content"',
      'slot="accordion-content"',
      'accordion-group',
      'accordion-marker',
      'accordion-open',
      'action-icon',
      'inverted',
      'ordered',
      'accordionOneLevel',
      'subAccordionItem',
      'contentSpace',
      'contentAlignment',
      'selected',
      'balNavigate',
      'balAccordionChange',
      'balGroupStateChanged',
      'balWillAnimate',
      'dsClick',
      'dsAccordionToggle',
      'dsAccordionOpened',
      'present()',
      'dismiss(',
      'toggle()',
      'event no longer emitted, needs manual rework',
      'method no longer available, needs manual rework',
      'report, do not rewrite',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
