import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalStage } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-stage.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-stage-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalStage', () => {
  it('lists React tags, children and import symbols and skips comments, strings and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'Hero.tsx',
      [
        "import { BalStage, BalStageBody, BalStageHead, BalStageImage } from '@baloise/ds-react'",
        "const _note = '<bal-stage></bal-stage>'",
        'const _hidden = /* <BalStage /> */ null',
        'export function Hero() {',
        '  return (',
        '    <BalStage color="green" shape>',
        '      <BalStageImage srcSet="/a.jpg 1x" />',
        '      <BalStageHead>Title</BalStageHead>',
        '      <BalStageBody>Text</BalStageBody>',
        '    </BalStage>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalStage />\n')

    const result = scanBalStage(root)

    const importLine = "import { BalStage, BalStageBody, BalStageHead, BalStageImage } from '@baloise/ds-react'"
    expect(result).toEqual({
      total: 11,
      files: [
        {
          file: 'Hero.tsx',
          findings: [
            { line: 1, snippet: importLine },
            { line: 1, snippet: importLine },
            { line: 1, snippet: importLine },
            { line: 1, snippet: importLine },
            { line: 6, snippet: '<BalStage color="green" shape>' },
            { line: 7, snippet: '<BalStageImage srcSet="/a.jpg 1x" />' },
            { line: 8, snippet: '<BalStageHead>' },
            { line: 8, snippet: '</BalStageHead>' },
            { line: 9, snippet: '<BalStageBody>' },
            { line: 9, snippet: '</BalStageBody>' },
            { line: 10, snippet: '</BalStage>' },
          ],
        },
      ],
    })
  })

  it('lists Angular templates, the bundle, inline templates and element types', () => {
    const root = createScratchDir()
    write(
      root,
      'hero.component.html',
      [
        '<!-- <bal-stage></bal-stage> -->',
        '<bal-stage [color]="color" containerSize="compact">',
        '  <bal-stage-back-link href="/back" inverted></bal-stage-back-link>',
        '  <bal-stage-head>Title</bal-stage-head>',
        '  <bal-stage-foot></bal-stage-foot>',
        '</bal-stage>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'hero.component.ts',
      [
        "import { BalStageBundle } from '@baloise/ds-angular'",
        '@Component({ imports: [...BalStageBundle], template: `<bal-stage></bal-stage>` })',
        'export class HeroComponent {',
        '  @ViewChild("stage") stage?: ElementRef<HTMLBalStageElement>',
        '}',
        '',
      ].join('\n'),
    )

    const result = scanBalStage(root)

    expect(result.files.map(file => file.file)).toEqual(['hero.component.html', 'hero.component.ts'])
    expect(result.files[0].findings).toEqual([
      { line: 2, snippet: '<bal-stage [color]="color" containerSize="compact">' },
      { line: 3, snippet: '<bal-stage-back-link href="/back" inverted>' },
      { line: 3, snippet: '</bal-stage-back-link>' },
      { line: 4, snippet: '<bal-stage-head>' },
      { line: 4, snippet: '</bal-stage-head>' },
      { line: 5, snippet: '<bal-stage-foot>' },
      { line: 5, snippet: '</bal-stage-foot>' },
      { line: 6, snippet: '</bal-stage>' },
    ])
    expect(result.files[1].findings).toEqual([
      { line: 1, snippet: "import { BalStageBundle } from '@baloise/ds-angular'" },
      { line: 2, snippet: '@Component({ imports: [...BalStageBundle], template: `<bal-stage></bal-stage>` })' },
      { line: 2, snippet: '<bal-stage>' },
      { line: 2, snippet: '</bal-stage>' },
      { line: 4, snippet: '@ViewChild("stage") stage?: ElementRef<HTMLBalStageElement>' },
    ])
    expect(result.total).toBe(13)
  })

  it('lists a plain HTML bal-stage and skips markdown', () => {
    const root = createScratchDir()
    write(root, 'index.html', ['<bal-stage', '  size="large"', '></bal-stage>', ''].join('\n'))
    write(root, 'notes.md', '<bal-stage></bal-stage>\n')

    expect(scanBalStage(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-stage size="large">' },
            { line: 3, snippet: '</bal-stage>' },
          ],
        },
      ],
    })
  })

  it('does not match longer names or the ambient BalStage types', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-stage-other></bal-stage-other>\n<bal-stages></bal-stages>\n')
    write(
      root,
      'types.ts',
      ['type A = BalProps.BalStageColor', 'type B = BalProps.BalStageSize', 'const BalStageish = 1', ''].join('\n'),
    )

    expect(scanBalStage(root)).toEqual({ total: 0, files: [] })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-stage></bal-stage>\n')
    }
    for (const dir of ['node_modules', '.angular', '.git', '.claude']) {
      write(root, `src/${dir}/nested.html`, '<BalStage />\n')
    }

    expect(scanBalStage(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-stage></bal-stage>\n'
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
            { line: 1, snippet: '<bal-stage>' },
            { line: 1, snippet: '</bal-stage>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests stage and folds its child tags in', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-stage>',
        '  <bal-stage-back-link></bal-stage-back-link>',
        '  <bal-stage-image></bal-stage-image>',
        '  <bal-stage-head></bal-stage-head>',
        '  <bal-stage-body></bal-stage-body>',
        '  <bal-stage-foot></bal-stage-foot>',
        '</bal-stage>',
        '',
      ].join('\n'),
    )

    expect(scanMigratable(root)).toEqual({ suggested: [{ name: 'stage', total: 6 }], notYet: [], types: [] })
  })
})

describe('stage migration.md', () => {
  it('is a report-only migration that names the reason and the suggested replacement', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/stage/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# stage (report only)\n')).toBe(true)
    for (const phrase of [
      'scan-bal-stage.mjs',
      'one yes/no',
      'Nothing is rewritten.',
      'ds-heading',
      'ds-text',
      'ds-shape',
      '<picture>',
      'design team',
      'BalStageBundle',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
