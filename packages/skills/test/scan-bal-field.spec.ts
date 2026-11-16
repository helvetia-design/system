import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalField } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-field.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const SKIP_DIRS = ['node_modules', 'dist', 'build', 'out', '.next', '.angular', '.git', '.claude', 'coverage']

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-field-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

function fieldRow(start: string) {
  const row = readFileSync(join(SKILL_DIR, 'shared/field.md'), 'utf8')
    .split('\n')
    .find(line => line.startsWith(start))

  expect(row, start).toBeDefined()
  return row as string
}

function writeNgErrorApp(root: string) {
  write(
    root,
    'src/app/app.component.html',
    [
      '<form [formGroup]="form">',
      '  <bal-field>',
      '    <bal-field-message>',
      '      <bal-ng-error controlName="email" error="required">Please enter an email</bal-ng-error>',
      '      <bal-ng-error controlName="email" error="email">Please enter a valid email</bal-ng-error>',
      '    </bal-field-message>',
      '  </bal-field>',
      '</form>',
      '',
    ].join('\n'),
  )
  write(
    root,
    'src/app/app.component.ts',
    [
      "import { BalNgErrorComponent } from '@baloise/ds-angular'",
      '@Component({',
      '  imports: [BalNgErrorComponent],',
      "  templateUrl: './app.component.html',",
      '})',
      'export class AppComponent {}',
      '',
    ].join('\n'),
  )
  write(
    root,
    'src/app/app.config.ts',
    [
      'export const appConfig = {',
      "  providers: [provideBaloiseDesignSystem({ forms: { invalidateOn: 'dirty' } })],",
      '}',
      '',
    ].join('\n'),
  )
}

describe('scanBalField', () => {
  it('lists React tags and import symbols and skips comments, strings, and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalField, BalFieldLabel, BalFormGrid } from '@baloise/ds-react'",
        "const _note = 'bal-field'",
        "const _example = '<BalField invalid></BalField>'",
        'const _trailing = true // <BalFormCol />',
        'type Size = BalProps.BalFormColSize',
        'export function App() {',
        '  return (',
        '    <BalFormGrid>',
        '      <BalFormCol size="half">',
        '        <BalField>',
        '          <BalFieldLabel>Name</BalFieldLabel>',
        '        </BalField>',
        '      </BalFormCol>',
        '    </BalFormGrid>',
        '  )',
        '}',
        '',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<bal-field></bal-field>\n<BalField />\n')

    expect(scanBalField(root)).toEqual({
      total: 11,
      files: [
        {
          file: 'App.tsx',
          findings: [
            { line: 1, snippet: "import { BalField, BalFieldLabel, BalFormGrid } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalField, BalFieldLabel, BalFormGrid } from '@baloise/ds-react'" },
            { line: 1, snippet: "import { BalField, BalFieldLabel, BalFormGrid } from '@baloise/ds-react'" },
            { line: 8, snippet: '<BalFormGrid>' },
            { line: 9, snippet: '<BalFormCol size="half">' },
            { line: 10, snippet: '<BalField>' },
            { line: 11, snippet: '<BalFieldLabel>' },
            { line: 11, snippet: '</BalFieldLabel>' },
            { line: 12, snippet: '</BalField>' },
            { line: 13, snippet: '</BalFormCol>' },
            { line: 14, snippet: '</BalFormGrid>' },
          ],
        },
      ],
    })
  })

  it('does not match bal-form, longer names, event types, or ambient size types', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-form></bal-form>',
        '<bal-field-foo></bal-field-foo>',
        '<bal-form-gridx></bal-form-gridx>',
        '<bal-form-col-other></bal-form-col-other>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'types.ts',
      [
        'type B = BalProps.BalFormColSize',
        'type C = BalProps.BalFieldLabelSize',
        'const BalForm = 1',
        'const BalFieldish = 2',
        '',
      ].join('\n'),
    )

    expect(scanBalField(root)).toEqual({ total: 0, files: [] })
  })

  it('lists Angular template tags and skips comments and non-template strings', () => {
    const root = createScratchDir()
    write(
      root,
      'app.component.html',
      [
        '<!-- <bal-field></bal-field> -->',
        '<p>Mention bal-field in text only.</p>',
        '<bal-form-grid>',
        '  <bal-form-col size="half">',
        '    <bal-field [invalid]="bad">',
        '      <bal-field-message color="danger">Required</bal-field-message>',
        '    </bal-field>',
        '  </bal-form-col>',
        '</bal-form-grid>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'inline.component.ts',
      [
        "import { BalField } from '@baloise/ds-angular'",
        '@Component({',
        '  imports: [BalField],',
        '  template: `<bal-field-hint subject="x">y</bal-field-hint>`,',
        '})',
        'export class InlineComponent {}',
        '',
      ].join('\n'),
    )

    expect(scanBalField(root)).toEqual({
      total: 12,
      files: [
        {
          file: 'app.component.html',
          findings: [
            { line: 3, snippet: '<bal-form-grid>' },
            { line: 4, snippet: '<bal-form-col size="half">' },
            { line: 5, snippet: '<bal-field [invalid]="bad">' },
            { line: 6, snippet: '<bal-field-message color="danger">' },
            { line: 6, snippet: '</bal-field-message>' },
            { line: 7, snippet: '</bal-field>' },
            { line: 8, snippet: '</bal-form-col>' },
            { line: 9, snippet: '</bal-form-grid>' },
          ],
        },
        {
          file: 'inline.component.ts',
          findings: [
            { line: 1, snippet: "import { BalField } from '@baloise/ds-angular'" },
            { line: 3, snippet: 'imports: [BalField],' },
            { line: 4, snippet: '<bal-field-hint subject="x">' },
            { line: 4, snippet: '</bal-field-hint>' },
          ],
        },
      ],
    })
  })

  it('lists HTML tags outside src, including a multiline opening tag, and skips markdown', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-field',
        '  horizontal',
        '  required',
        '>',
        '  <bal-field-control iconLeft="search"></bal-field-control>',
        '</bal-field>',
        '',
      ].join('\n'),
    )
    write(root, 'notes.md', '<bal-field></bal-field>\n')

    expect(scanBalField(root)).toEqual({
      total: 4,
      files: [
        {
          file: 'index.html',
          findings: [
            { line: 1, snippet: '<bal-field horizontal required>' },
            { line: 5, snippet: '<bal-field-control iconLeft="search">' },
            { line: 5, snippet: '</bal-field-control>' },
            { line: 6, snippet: '</bal-field>' },
          ],
        },
      ],
    })
  })

  it('skips usages that live only under dependency or build directory names', () => {
    const root = createScratchDir()
    write(root, 'page.html', '<bal-form-col></bal-form-col>\n')
    for (const dir of SKIP_DIRS) {
      write(root, `${dir}/page.html`, '<bal-form-col></bal-form-col>\n')
    }
    for (const dir of ['node_modules', '.angular', '.git', '.claude']) {
      write(root, `src/${dir}/nested.html`, '<BalFormCol></BalFormCol>\n')
    }

    expect(scanBalField(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'page.html',
          findings: [
            { line: 1, snippet: '<bal-form-col>' },
            { line: 1, snippet: '</bal-form-col>' },
          ],
        },
      ],
    })
  })

  it('lists both bundles and BalEvents types once per occurrence, but not BalForm or BalFormBundle', () => {
    const root = createScratchDir()
    write(
      root,
      'application.component.ts',
      [
        "import { BalFieldBundle, BalFormBundle, BalFormGridBundle } from '@baloise/ds-angular'",
        '@Component({ imports: [...BalFieldBundle, ...BalFormGridBundle, ...BalFormBundle] })',
        'export class ApplicationComponent {',
        '  onField(event: BalEvents.BalFieldCustomEvent<string>) {}',
        '  onBare(event: BalFieldCustomEvent<string>) {}',
        '  labelledBy?: BalEvents.BalFieldAriaLabelledBy',
        '  onForm(event: BalEvents.BalFormCustomEvent<string>) {}',
        '  form?: BalForm',
        '  size?: BalProps.BalFormColSize',
        '  onGridChange(event: BalEvents.BalFormGridChange) {}',
        '  onColChange(event: BalEvents.BalFormColChange) {}',
        '  onLabel(event: BalFieldLabelCustomEvent<string>) {}',
        '}',
        '',
      ].join('\n'),
    )

    expect(scanBalField(root)).toEqual({
      total: 10,
      files: [
        {
          file: 'application.component.ts',
          findings: [
            {
              line: 1,
              snippet: "import { BalFieldBundle, BalFormBundle, BalFormGridBundle } from '@baloise/ds-angular'",
            },
            {
              line: 1,
              snippet: "import { BalFieldBundle, BalFormBundle, BalFormGridBundle } from '@baloise/ds-angular'",
            },
            {
              line: 2,
              snippet: '@Component({ imports: [...BalFieldBundle, ...BalFormGridBundle, ...BalFormBundle] })',
            },
            {
              line: 2,
              snippet: '@Component({ imports: [...BalFieldBundle, ...BalFormGridBundle, ...BalFormBundle] })',
            },
            { line: 4, snippet: 'onField(event: BalEvents.BalFieldCustomEvent<string>) {}' },
            { line: 5, snippet: 'onBare(event: BalFieldCustomEvent<string>) {}' },
            { line: 6, snippet: 'labelledBy?: BalEvents.BalFieldAriaLabelledBy' },
            { line: 10, snippet: 'onGridChange(event: BalEvents.BalFormGridChange) {}' },
            { line: 11, snippet: 'onColChange(event: BalEvents.BalFormColChange) {}' },
            { line: 12, snippet: 'onLabel(event: BalFieldLabelCustomEvent<string>) {}' },
          ],
        },
      ],
    })
  })

  it('lists bal-ng-error tags, BalNgError symbols and the invalidateOn config key', () => {
    const root = createScratchDir()
    writeNgErrorApp(root)

    expect(scanBalField(root)).toEqual({
      total: 11,
      files: [
        {
          file: 'src/app/app.component.html',
          findings: [
            { line: 2, snippet: '<bal-field>' },
            { line: 3, snippet: '<bal-field-message>' },
            { line: 4, snippet: '<bal-ng-error controlName="email" error="required">' },
            { line: 4, snippet: '</bal-ng-error>' },
            { line: 5, snippet: '<bal-ng-error controlName="email" error="email">' },
            { line: 5, snippet: '</bal-ng-error>' },
            { line: 6, snippet: '</bal-field-message>' },
            { line: 7, snippet: '</bal-field>' },
          ],
        },
        {
          file: 'src/app/app.component.ts',
          findings: [
            { line: 1, snippet: "import { BalNgErrorComponent } from '@baloise/ds-angular'" },
            { line: 3, snippet: 'imports: [BalNgErrorComponent],' },
          ],
        },
        {
          file: 'src/app/app.config.ts',
          findings: [
            { line: 2, snippet: "providers: [provideBaloiseDesignSystem({ forms: { invalidateOn: 'dirty' } })]," },
          ],
        },
      ],
    })
  })

  it('lists only the invalidateOn object key and not a property access or a longer tag name', () => {
    const root = createScratchDir()
    write(
      root,
      'src/app/app.config.ts',
      ['const mode = opts.invalidateOn', "export const config = { forms: { invalidateOn: 'dirty' } }", ''].join('\n'),
    )
    write(root, 'src/app/app.component.html', '<bal-ng-error-wrapper></bal-ng-error-wrapper>\n')

    expect(scanBalField(root)).toEqual({
      total: 1,
      files: [
        {
          file: 'src/app/app.config.ts',
          findings: [{ line: 2, snippet: "export const config = { forms: { invalidateOn: 'dirty' } }" }],
        },
      ],
    })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const contents = '<bal-form-grid></bal-form-grid>\n'
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
            { line: 1, snippet: '<bal-form-grid>' },
            { line: 1, snippet: '</bal-form-grid>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(contents)
  })
})

describe('Detect', () => {
  it('suggests field once and folds every child tag into it', () => {
    const root = createScratchDir()
    write(
      root,
      'index.html',
      [
        '<bal-form-grid><bal-form-col>',
        '<bal-field><bal-field-label>x</bal-field-label><bal-field-message>y</bal-field-message></bal-field>',
        '</bal-form-col></bal-form-grid>',
        '',
      ].join('\n'),
    )

    const { suggested, notYet } = scanMigratable(root)

    expect(suggested).toEqual([{ name: 'field', total: 5 }])
    expect(notYet).toEqual([])
  })

  it('suggests field for a lone bal-form-grid', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-form-grid></bal-form-grid>\n')

    expect(scanMigratable(root).suggested).toEqual([{ name: 'field', total: 1 }])
  })
})

const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), '../skills/ds-migrate-from-baloise')

describe('field migration.md', () => {
  it('titles the component field → form and documents the mapping', () => {
    const migration = readFileSync(join(SKILL_DIR, 'components/field/migration.md'), 'utf8')

    expect(migration.trimStart().startsWith('# field → form\n')).toBe(true)
    for (const phrase of [
      'scan-bal-field.mjs',
      'one yes/no',
      'ds-form-col',
      'ds-form',
      'className',
      'shared/field.md',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })

  it('pairs each legacy size with its desktop column class per table row', () => {
    const migration = readFileSync(join(SKILL_DIR, 'components/field/migration.md'), 'utf8')

    for (const [size, columns] of [
      ['half', 6],
      ['one-third', 4],
      ['two-thirds', 8],
      ['one-quarter', 3],
      ['three-quarters', 9],
    ] as const) {
      expect(migration, size).toMatch(new RegExp(`size="${size}"[^\\n]*desktop:is-${columns}\\b`))
    }
  })

  it('does not unwrap a bal-field around a native element', () => {
    const migration = readFileSync(join(SKILL_DIR, 'components/field/migration.md'), 'utf8')

    expect(migration).not.toContain('or native')
    expect(readFileSync(join(SKILL_DIR, 'shared/field.md'), 'utf8')).not.toContain('or native')
  })
})

describe('shared/field.md wiring', () => {
  it('is referenced from SKILL.md and from every form component migration', () => {
    expect(readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8')).toContain('shared/field.md')

    for (const component of [
      'checkbox',
      'radio',
      'segment',
      'select',
      'dropdown',
      'input',
      'textarea',
      'number-input',
      'label',
      'input-slider',
      'input-stepper',
      'date',
      'file-upload',
    ]) {
      const migration = readFileSync(join(SKILL_DIR, `components/${component}/migration.md`), 'utf8')
      expect(migration, component).toContain('shared/field.md')
      expect(migration, component).not.toContain('Leave every `bal-field*` tag exactly as it is')
    }
  })

  it('documents the unwrap rules', () => {
    const rules = readFileSync(join(SKILL_DIR, 'shared/field.md'), 'utf8')

    for (const phrase of [
      'invalidText',
      'description',
      'ds-hint',
      'DsHint',
      'DsIcon',
      'helper',
      '(optional)',
      'slot="start"',
      'slot="end"',
      'ds-checkbox-group',
    ]) {
      expect(rules, phrase).toContain(phrase)
    }
  })
})

describe('required default rule', () => {
  const read = (rel: string) => readFileSync(join(SKILL_DIR, rel), 'utf8')
  const bullet = (text: string, label: string) => {
    const start = text.indexOf(`- **${label}**`)
    expect(start, label).toBeGreaterThan(-1)
    return text.slice(start, text.indexOf('\n', start))
  }
  const covered = ['ds-input', 'ds-textarea', 'ds-datepicker', 'ds-number-input', 'ds-select']
  const excluded = ['ds-counter', 'ds-radio-group', 'ds-checkbox-group', 'ds-segment', 'ds-slider']

  it('lists the covered and the excluded controls in separate bullets of SKILL.md', () => {
    const skill = read('SKILL.md')
    const coveredBullet = bullet(skill, 'Covered controls')
    const excludedBullet = bullet(skill, 'Excluded controls')

    for (const control of covered) {
      expect(coveredBullet, control).toContain(`\`${control}\``)
      expect(excludedBullet, control).not.toContain(`\`${control}\``)
    }
    for (const control of excluded) {
      expect(excludedBullet, control).toContain(`\`${control}\``)
      expect(coveredBullet, control).not.toContain(`\`${control}\``)
    }
  })

  it('states the order and adds the false for a bal-field left in place', () => {
    const order = bullet(read('SKILL.md'), 'Order')

    expect(order).toContain('read the enclosing field first')
    expect(order).toContain('leaves the `bal-field` in place')
  })

  it('keeps the three syntaxes in SKILL.md only', () => {
    expect(read('SKILL.md').match(/\[required\]="false"/g)).toHaveLength(1)
  })

  it.each(['input', 'textarea', 'date', 'number-input', 'select'])(
    '%s migration.md references the rule instead of restating it',
    component => {
      const migration = read(`components/${component}/migration.md`)

      expect(migration).toContain('required default rule in `SKILL.md`')
      expect(migration).toContain('`required` omitted')
      expect(migration).not.toContain('The default flipped')
      expect(migration).not.toContain('[required]="false"')
    },
  )

  it.each(['segment', 'input-slider', 'checkbox', 'radio', 'input-stepper'])(
    '%s migration.md points at the exclusion and adds no required false',
    component => {
      const migration = read(`components/${component}/migration.md`)

      expect(migration).toContain('excluded from the required default rule in `SKILL.md`')
      expect(migration).not.toContain('validates as required')
      expect(migration).not.toContain('`required` omitted')
    },
  )
})

describe('shared/field.md Angular form binding', () => {
  it('moves a danger message into a conditional invalid-text slot and reports raw validator keys', () => {
    const row = fieldRow('| Angular control bound with')

    expect(row).toContain('slot="invalid-text"')
    expect(row).toContain('<control>.touched && <control>.invalid')
    expect(row).toContain('autoInvalidOff')
    expect(row).toContain('raw validator key')
    expect(readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8')).toContain('Angular form binding row')
  })
})

describe('shared/field.md bal-ng-error', () => {
  it('moves every bal-ng-error of a control into one invalid-text chain', () => {
    const rules = readFileSync(join(SKILL_DIR, 'shared/field.md'), 'utf8')
    const row = fieldRow('| `bal-ng-error`')

    for (const phrase of [
      'slot="invalid-text"',
      '@else if',
      "hasError('<error>')",
      'invalidateOn',
      'dirty',
      '*ngIf',
      'formGroupName',
      'formArrayName',
      "form.get(['items', i, 'name'])",
      'leave the whole `bal-field` in place',
      'BalFormBundle',
    ]) {
      expect(row, phrase).toContain(phrase)
    }
    expect(rules).toContain('`BalNgErrorComponent`')
    expect(rules).toContain("form.get('email')?.touched && form.get('email')?.hasError('required')")
    expect(readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8')).toContain('`bal-ng-error` row')
  })

  it('sends every bal-field-message that contains bal-ng-error to the bal-ng-error row', () => {
    for (const start of [
      '| `bal-field-message` with `color="danger"`',
      '| `bal-field-message` with `color="success"`',
      '| `bal-field-message` with `color=""`',
      '| message with markup content',
    ]) {
      expect(fieldRow(start), start).toContain('contains `bal-ng-error` follows the `bal-ng-error` row')
    }
    for (const start of ['| Angular control bound with', '| more than one `bal-field-message`']) {
      expect(fieldRow(start), start).toContain('`bal-ng-error`')
    }
    expect(fieldRow('| Angular control bound with')).toContain('the whole `bal-field` stays in place')
  })
})
