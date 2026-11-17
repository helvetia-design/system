import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalForm } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-form.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-form-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalForm', () => {
  it('lists the bal-form tag but not the grid, column or field tags', () => {
    const root = createScratchDir()
    write(
      root,
      'application.component.html',
      [
        '<bal-form',
        '  #wizardForm',
        '  [novalidate]="true"',
        '  formClass="mt-large"',
        '  [formGroup]="form"',
        '>',
        '  <bal-form-grid>',
        '    <bal-form-col size="half"><bal-field></bal-field></bal-form-col>',
        '  </bal-form-grid>',
        '</bal-form>',
        '<bal-forms></bal-forms>',
        '',
      ].join('\n'),
    )

    expect(scanBalForm(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'application.component.html',
          findings: [
            {
              line: 1,
              snippet: '<bal-form #wizardForm [novalidate]="true" formClass="mt-large" [formGroup]="form">',
            },
            { line: 10, snippet: '</bal-form>' },
          ],
        },
      ],
    })
  })

  it('lists BalForm and the HTMLBalFormElement type but not BalFormGrid, BalFormCol or BalFormBundle', () => {
    const root = createScratchDir()
    write(
      root,
      'application.component.ts',
      [
        "import { BalForm, BalFormBundle, BalFormCol, BalFormGrid, BalFormGridBundle } from '@baloise/ds-angular'",
        '@Component({ imports: [BalForm, BalFormGrid, BalFormCol, ...BalFormGridBundle, ...BalFormBundle] })',
        'export class ApplicationComponent {',
        "  @ViewChild('wizardForm') wizardForm?: ElementRef<HTMLBalFormElement>",
        '  submit() {',
        '    this.wizardForm?.nativeElement.scrollToFirstInvalidField()',
        '  }',
        '}',
        '',
      ].join('\n'),
    )

    expect(scanBalForm(root)).toEqual({
      total: 3,
      files: [
        {
          file: 'application.component.ts',
          findings: [
            {
              line: 1,
              snippet:
                "import { BalForm, BalFormBundle, BalFormCol, BalFormGrid, BalFormGridBundle } from '@baloise/ds-angular'",
            },
            {
              line: 2,
              snippet:
                '@Component({ imports: [BalForm, BalFormGrid, BalFormCol, ...BalFormGridBundle, ...BalFormBundle] })',
            },
            { line: 4, snippet: "@ViewChild('wizardForm') wizardForm?: ElementRef<HTMLBalFormElement>" },
          ],
        },
      ],
    })
  })

  it('lists React tags and skips comments, strings and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'Wizard.tsx',
      [
        "import { BalForm, BalFormGrid } from '@baloise/ds-react'",
        '// <BalForm native> in a comment',
        "const note = '<BalForm />'",
        'export const Wizard = () => (',
        '  <BalForm native novalidate formClass="mt-large">',
        '    <BalFormGrid />',
        '  </BalForm>',
        ')',
      ].join('\n'),
    )
    write(root, 'build/ignored.tsx', '<BalForm />\n')

    expect(scanBalForm(root)).toEqual({
      total: 3,
      files: [
        {
          file: 'Wizard.tsx',
          findings: [
            { line: 1, snippet: "import { BalForm, BalFormGrid } from '@baloise/ds-react'" },
            { line: 5, snippet: '<BalForm native novalidate formClass="mt-large">' },
            { line: 7, snippet: '</BalForm>' },
          ],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-form native><input /></bal-form>\n'
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
            { line: 1, snippet: '<bal-form native>' },
            { line: 1, snippet: '</bal-form>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('counts bal-form for form, the grid for field, and ignores BalFormBundle', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      ['<bal-form>', '  <bal-form-grid><bal-form-col></bal-form-col></bal-form-grid>', '</bal-form>', ''].join('\n'),
    )
    write(root, 'app.ts', "import { BalFormBundle } from '@baloise/ds-angular'\n")

    expect(scanMigratable(root)).toEqual({
      suggested: [
        { name: 'field', total: 2 },
        { name: 'form', total: 1 },
      ],
      notYet: [],
      types: [],
    })
  })
})

describe('form migration.md', () => {
  it('titles the component form and documents the native element, novalidate and method rules', () => {
    const migration = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise/components/form/migration.md'),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# form\n')).toBe(true)
    for (const phrase of [
      'scan-bal-form.mjs',
      'one yes/no',
      '`native`',
      '`<form>`',
      '`<div>`',
      'formClass',
      'novalidate',
      'noValidate',
      'ngNativeValidate',
      '[formGroup]',
      '(ngSubmit)',
      'scrollToFirstInvalidField()',
      'Apply Unmapped props and handlers',
      'BalFormBundle',
      'HTMLBalFormElement',
      'HTMLFormElement',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
