import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { run, scanBalTimeInput } from '../skills/ds-migrate-from-baloise/scripts/scan-bal-time-input.mjs'
import { scanMigratable } from '../skills/ds-migrate-from-baloise/scripts/scan-migratable.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-time-input-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

describe('scanBalTimeInput', () => {
  it('lists a multiline Angular tag and the class file types, but not BalProps or bundles', () => {
    const root = createScratchDir()
    write(
      root,
      'form-section.component.html',
      [
        '<bal-time-input',
        '  name="time-default"',
        '  [(ngModel)]="timeValue"',
        '  (balChange)="onTimeChange($event)"',
        '></bal-time-input>',
        '<bal-time-inputs></bal-time-inputs>',
        '',
      ].join('\n'),
    )
    write(
      root,
      'form-section.component.ts',
      [
        "import { BalFormBundle, BalTimeInput } from '@baloise/ds-angular'",
        '@Component({ imports: [BalTimeInput, ...BalFormBundle] })',
        'export class FormSectionComponent {',
        '  onTimeChange(event: BalEvents.BalTimeInputCustomEvent<string | undefined>) {}',
        '  onBare(event: BalTimeInputCustomEvent<string>) {}',
        '  detail?: BalEvents.BalTimeInputChangeDetail',
        '  el?: HTMLBalTimeInputElement',
        '  other?: BalTimeInputs',
        '}',
        '',
      ].join('\n'),
    )

    expect(scanBalTimeInput(root)).toEqual({
      total: 8,
      files: [
        {
          file: 'form-section.component.html',
          findings: [
            {
              line: 1,
              snippet:
                '<bal-time-input name="time-default" [(ngModel)]="timeValue" (balChange)="onTimeChange($event)">',
            },
            { line: 5, snippet: '</bal-time-input>' },
          ],
        },
        {
          file: 'form-section.component.ts',
          findings: [
            { line: 1, snippet: "import { BalFormBundle, BalTimeInput } from '@baloise/ds-angular'" },
            { line: 2, snippet: '@Component({ imports: [BalTimeInput, ...BalFormBundle] })' },
            { line: 4, snippet: 'onTimeChange(event: BalEvents.BalTimeInputCustomEvent<string | undefined>) {}' },
            { line: 5, snippet: 'onBare(event: BalTimeInputCustomEvent<string>) {}' },
            { line: 6, snippet: 'detail?: BalEvents.BalTimeInputChangeDetail' },
            { line: 7, snippet: 'el?: HTMLBalTimeInputElement' },
          ],
        },
      ],
    })
  })

  it('lists React tags and skips comments, strings and dist', () => {
    const root = createScratchDir()
    write(
      root,
      'Booking.tsx',
      [
        "import { BalTimeInput } from '@baloise/ds-react'",
        '// <BalTimeInput /> in a comment',
        "const note = '<BalTimeInput />'",
        'export const Booking = () => <BalTimeInput value="14:30" onBalChange={e => setTime(e.detail)} />',
      ].join('\n'),
    )
    write(root, 'dist/ignored.tsx', '<BalTimeInput />\n')

    expect(scanBalTimeInput(root)).toEqual({
      total: 2,
      files: [
        {
          file: 'Booking.tsx',
          findings: [
            { line: 1, snippet: "import { BalTimeInput } from '@baloise/ds-react'" },
            { line: 4, snippet: '<BalTimeInput value="14:30" onBalChange={e => setTime(e.detail)} />' },
          ],
        },
      ],
    })
  })

  it('does not list the shared event names on their own', () => {
    const root = createScratchDir()
    write(root, 'listener.ts', "el.addEventListener('balChange', handler)\nconst x = '(balFocus)'\n")

    expect(scanBalTimeInput(root)).toEqual({ total: 0, files: [] })
  })

  it('prints grouped findings as JSON and does not edit files', () => {
    const root = createScratchDir()
    const html = '<bal-time-input value="09:00"></bal-time-input>\n'
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
            { line: 1, snippet: '<bal-time-input value="09:00">' },
            { line: 1, snippet: '</bal-time-input>' },
          ],
        },
      ],
    })
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(html)
  })
})

describe('Detect', () => {
  it('suggests time-input for the tag and its event types', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-time-input></bal-time-input>\n')
    write(root, 'handler.ts', 'export const f = (event: BalTimeInputCustomEvent<string>) => event\n')

    expect(scanMigratable(root)).toEqual({
      suggested: [{ name: 'time-input', total: 2 }],
      notYet: [],
      types: [],
    })
  })
})

describe('time-input migration.md', () => {
  it('titles the component time-input and documents the native input, field markup and event rules', () => {
    const migration = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../skills/ds-migrate-from-baloise/components/time-input/migration.md',
      ),
      'utf8',
    )

    expect(migration.trimStart().startsWith('# time-input\n')).toBe(true)
    for (const phrase of [
      'scan-bal-time-input.mjs',
      'one yes/no',
      '<input type="time" class="ds-time-input">',
      '`shared/field.md` does not apply',
      'ds-field',
      'ds-label',
      'ds-control',
      'ds-help',
      'aria-invalid',
      'is-danger',
      'aria-describedby',
      'DefaultValueAccessor',
      'debounce',
      'autoInvalidOff',
      'Apply Unmapped props and handlers',
      'setFocus()',
      'focus()',
      'event.target.value',
      'check behaviour',
      'HTMLBalTimeInputElement',
      'HTMLInputElement',
      'per-file summary',
      'git commit',
    ]) {
      expect(migration, phrase).toContain(phrase)
    }
  })
})
