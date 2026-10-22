import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalModal } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-modal.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-modal-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalModal', () => {
  it('lists React tags, children and the import symbols and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalModal, BalModalHeader, BalModalBody } from '@baloise/ds-react'",
        "const _note = 'bal-modal'",
        "const _example = '<BalModal isClosable></BalModal>'",
        'const _markup = `<BalModalBody />`',
        'const _trailing = true // <BalModal />',
        'const _hidden = /* <bal-modal></bal-modal> */ null',
        'export function App() {',
        '  return (',
        '    <BalModal isClosable={false}>',
        '      <BalModalHeader>Title</BalModalHeader>',
        '      <BalModalBody>Text</BalModalBody>',
        '    </BalModal>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<bal-modal></bal-modal>\n<BalModal />\n')

    expect(scanBalModal(root)).toEqual({
      total: 9,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalModal, BalModalHeader, BalModalBody } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalModal, BalModalHeader, BalModalBody } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalModal, BalModalHeader, BalModalBody } from '@baloise/ds-react'" },
            { line: 9, snippet: '<BalModal isClosable={false}>' },
            { line: 10, snippet: '<BalModalHeader>' },
            { line: 10, snippet: '</BalModalHeader>' },
            { line: 11, snippet: '<BalModalBody>' },
            { line: 11, snippet: '</BalModalBody>' },
            { line: 12, snippet: '</BalModal>' },
          ],
        },
      ],
    })
  })

  it('does not match longer names or the ambient BalModal types', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-modal-other></bal-modal-other>\n<bal-modals></bal-modals>\n')
    write(
      root,
      'types.ts',
      ['type A = BalProps.BalModalSpace', 'const BalModalish = 1', 'const BalModalProps = 2', ''].join('\n'),
    )

    expect(scanBalModal(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags, inline templates, the service and the controller', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-modal></bal-modal> -->',
        '<div title="bal-modal">text</div>',
        '<bal-modal modalWidth="480" (balModalDidDismiss)="closed()">',
        '  <bal-modal-header>Title</bal-modal-header>',
        '  <bal-modal-body>Text</bal-modal-body>',
        '</bal-modal>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'open.service.ts',
      [
        "import { BalModalService } from '@baloise/ds-angular'",
        "import { balModalController, BalModalOptions } from '@baloise/ds-core'",
        "const _decoy = 'balModalController'",
        '// BalModalService',
        'export class OpenService {',
        '  constructor(private modals: BalModalService) {}',
        '  open(options: BalModalOptions) {',
        '    return balModalController.create(options)',
        '  }',
        '}',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalModalBundle } from '@baloise/ds-angular'",
        '@Component({',
        '  imports: [BalModalBundle],',
        '  template: `<bal-modal-body>Text</bal-modal-body>`,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    const result = scanBalModal(root)

    expect(result.total).toBe(16)
    expect(result.files.map(file => file.file)).toEqual([
      'app.component.html',
      'inline.component.ts',
      'open.service.ts',
    ])
    expect(result.files[0].findings).toEqual([
      { line: 3, snippet: '<bal-modal modalWidth="480" (balModalDidDismiss)="closed()">' },
      { line: 4, snippet: '<bal-modal-header>' },
      { line: 4, snippet: '</bal-modal-header>' },
      { line: 5, snippet: '<bal-modal-body>' },
      { line: 5, snippet: '</bal-modal-body>' },
      { line: 6, snippet: '</bal-modal>' },
    ])
    expect(result.files[1].findings).toEqual([
      { line: 1, snippet: "import { BalModalBundle } from '@baloise/ds-angular'" },
      { line: 3, snippet: 'imports: [BalModalBundle],' },
      { line: 4, snippet: '<bal-modal-body>' },
      { line: 4, snippet: '</bal-modal-body>' },
    ])
    expect(result.files[2].findings).toEqual([
      { line: 1, snippet: "import { BalModalService } from '@baloise/ds-angular'" },
      { line: 2, snippet: "import { balModalController, BalModalOptions } from '@baloise/ds-core'" },
      { line: 2, snippet: "import { balModalController, BalModalOptions } from '@baloise/ds-core'" },
      { line: 6, snippet: 'constructor(private modals: BalModalService) {}' },
      { line: 7, snippet: 'open(options: BalModalOptions) {' },
      { line: 8, snippet: 'return balModalController.create(options)' },
    ])
  })

  it('lists a multiline HTML opening tag and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-modal', '  modalWidth="480"', '  isClosable', '></bal-modal>', ''].join('\n'))
    write(root, 'notes.md', '<bal-modal></bal-modal>\n')

    expect(scanBalModal(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-modal modalWidth="480" isClosable>' },
            { line: 4, snippet: '</bal-modal>' },
          ],
        },
      ],
    })
  })

  it('lists every tag of a modal nested in a modal body, each on its own line', () => {
    const root = createScratchDir()
    write(
      root,
      'nested.html',
      [
        '<bal-modal>',
        '  <bal-modal-header>Title</bal-modal-header>',
        '  <bal-modal-body>',
        '    <bal-modal>',
        '      <bal-modal-body>Confirm</bal-modal-body>',
        '    </bal-modal>',
        '  </bal-modal-body>',
        '</bal-modal>',
        '',
      ].join('\n'),
    )

    expect(scanBalModal(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'nested.html',
          findings: [
            { line: 1, snippet: '<bal-modal>' },
            { line: 2, snippet: '<bal-modal-header>' },
            { line: 2, snippet: '</bal-modal-header>' },
            { line: 3, snippet: '<bal-modal-body>' },
            { line: 4, snippet: '<bal-modal>' },
            { line: 5, snippet: '<bal-modal-body>' },
            { line: 5, snippet: '</bal-modal-body>' },
            { line: 6, snippet: '</bal-modal>' },
            { line: 7, snippet: '</bal-modal-body>' },
            { line: 8, snippet: '</bal-modal>' },
          ],
        },
      ],
    })
  })

  it('lists a multiline bal-modal-header at its opening line with a single-line snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'multiline.html',
      [
        '<bal-modal>',
        '  <bal-modal-header',
        '    id="header"',
        '    class="custom"',
        '  ></bal-modal-header>',
        '</bal-modal>',
        '',
      ].join('\n'),
    )

    expect(scanBalModal(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'multiline.html',
          findings: [
            { line: 1, snippet: '<bal-modal>' },
            { line: 2, snippet: '<bal-modal-header id="header" class="custom">' },
            { line: 5, snippet: '</bal-modal-header>' },
            { line: 6, snippet: '</bal-modal>' },
          ],
        },
      ],
    })
  })

  it('lists tags that carry [isClosable] and :isClosable bindings and keeps the binding in the snippet', () => {
    const root = createScratchDir()
    write(
      root,
      'bindings.html',
      [
        '<bal-modal [isClosable]="closable" [modalWidth]="width"></bal-modal>',
        '<bal-modal :isClosable="closable" :modalWidth="width"></bal-modal>',
        '',
      ].join('\n'),
    )

    expect(scanBalModal(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'bindings.html',
          findings: [
            { line: 1, snippet: '<bal-modal [isClosable]="closable" [modalWidth]="width">' },
            { line: 1, snippet: '</bal-modal>' },
            { line: 2, snippet: '<bal-modal :isClosable="closable" :modalWidth="width">' },
            { line: 2, snippet: '</bal-modal>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-modal></bal-modal>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-modal></bal-modal>\n')
      write(root, `src/${dir}/nested.html`, '<BalModal></BalModal>\n')
    }

    expect(scanBalModal(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-modal>' },
            { line: 1, snippet: '</bal-modal>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-modal></bal-modal>\n'
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
            { line: 1, snippet: '<bal-modal>' },
            { line: 1, snippet: '</bal-modal>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests modal when the project uses it', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-modal></bal-modal>\n')

    const { suggested } = scanMigratable(root)

    expect(suggested).toEqual(expect.arrayContaining([{ name: 'modal', total: 2 }]))
  })

  it('folds the header and body children into modal instead of listing them as unmigratable', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-modal-header>Title</bal-modal-header>\n<bal-modal-body>Text</bal-modal-body>\n')

    const result = scanMigratable(root)

    expect(JSON.stringify(result)).not.toContain('modal-header')
    expect(JSON.stringify(result)).not.toContain('modal-body')
    expect(result.suggested).toEqual(expect.arrayContaining([{ name: 'modal', total: 4 }]))
  })
})

describe('modal migration.md', () => {
  it('titles the component modal and documents the prop, tag, import, event, and report mapping', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/modal/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# modal\n')).toBe(true)
    for (const phrase of [
      'scan-bal-modal.mjs',
      'one yes/no',
      'isClosable',
      '`closable`',
      'ds-modal-header',
      'ds-modal-body',
      'DsModal',
      '@helvetia-design/angular',
      '@helvetia-design/react',
      'dsDidDismiss',
      'onBalModalDidDismiss',
      'dsModalController',
      'DsModalService',
      'modal-close',
      'BalProps.BalModal',
      'part="dialog"',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
