import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const skillDir = fileURLToPath(new URL('../skills/ds-migrate-from-baloise/', import.meta.url))

function read(rel: string) {
  return readFileSync(`${skillDir}${rel}`, 'utf8')
}

function section(markdown: string, heading: string) {
  const start = markdown.indexOf(`${heading}\n`)
  if (start === -1) return ''
  const level = heading.split(' ')[0]
  const rest = markdown.slice(start + heading.length + 1)
  const next = rest.search(new RegExp(`^#{1,${level.length}} `, 'm'))
  return next === -1 ? rest : rest.slice(0, next)
}

function numberedItems(report: string) {
  return [...report.matchAll(/^(\d+)\. (.+)$/gm)].map(([, number, text]) => ({ number: Number(number), text }))
}

const coverageHeader = 'Coverage only, written to the file:'

function buckets(report: string) {
  const split = report.indexOf(`${coverageHeader}\n`)
  const attention = split === -1 ? report : report.slice(0, split)
  const coverage = split === -1 ? '' : report.slice(split)
  return { attention: numberedItems(attention), coverage: numberedItems(coverage) }
}

const expectedCounts: Record<string, { attention: number; coverage: number }> = {
  'accordion': { attention: 13, coverage: 3 },
  'app': { attention: 8, coverage: 5 },
  'badge': { attention: 3, coverage: 3 },
  'button': { attention: 13, coverage: 4 },
  'card': { attention: 9, coverage: 3 },
  'carousel': { attention: 21, coverage: 6 },
  'checkbox': { attention: 16, coverage: 2 },
  'close': { attention: 2, coverage: 1 },
  'content': { attention: 4, coverage: 2 },
  'data': { attention: 6, coverage: 1 },
  'date': { attention: 11, coverage: 4 },
  'divider': { attention: 4, coverage: 2 },
  'dropdown': { attention: 15, coverage: 3 },
  'field': { attention: 2, coverage: 2 },
  'file-upload': { attention: 3, coverage: 1 },
  'form': { attention: 9, coverage: 4 },
  'footer': { attention: 8, coverage: 4 },
  'heading': { attention: 6, coverage: 4 },
  'hint': { attention: 1, coverage: 0 },
  'icon': { attention: 7, coverage: 0 },
  'input-slider': { attention: 9, coverage: 4 },
  'input-stepper': { attention: 8, coverage: 2 },
  'input': { attention: 15, coverage: 3 },
  'label': { attention: 5, coverage: 2 },
  'list': { attention: 26, coverage: 7 },
  'logo': { attention: 5, coverage: 0 },
  'modal': { attention: 24, coverage: 7 },
  'navbar': { attention: 12, coverage: 0 },
  'notification': { attention: 6, coverage: 2 },
  'number-input': { attention: 8, coverage: 2 },
  'pagination': { attention: 6, coverage: 4 },
  'popup': { attention: 18, coverage: 5 },
  'progress-bar': { attention: 6, coverage: 3 },
  'radio': { attention: 14, coverage: 2 },
  'segment': { attention: 8, coverage: 0 },
  'select': { attention: 12, coverage: 1 },
  'shape': { attention: 4, coverage: 1 },
  'sheet': { attention: 6, coverage: 0 },
  'snackbar': { attention: 21, coverage: 7 },
  'spinner': { attention: 0, coverage: 1 },
  'stack': { attention: 4, coverage: 1 },
  'steps': { attention: 20, coverage: 9 },
  'table': { attention: 5, coverage: 3 },
  'tabs': { attention: 28, coverage: 8 },
  'tag': { attention: 5, coverage: 6 },
  'text': { attention: 5, coverage: 1 },
  'textarea': { attention: 7, coverage: 2 },
  'time-input': { attention: 15, coverage: 5 },
  'toast': { attention: 16, coverage: 8 },
  'tooltip': { attention: 6, coverage: 2 },
}

const components = readdirSync(`${skillDir}components`, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()

describe.each(components)('components/%s/migration.md Report', name => {
  const migration = read(`components/${name}/migration.md`)
  const report = section(migration, '## 4. Report')

  it('has exactly one Report section that points at shared/report.md', () => {
    expect(migration.match(/^## 4\. Report$/gm)).toHaveLength(1)
    expect(report).toMatch(/^Write the report as `shared\/report\.md` describes/m)
  })

  it('keeps the expected number of attention and coverage items', () => {
    const { attention, coverage } = buckets(report)

    expect({ attention: attention.length, coverage: coverage.length }).toEqual(expectedCounts[name])
  })

  it('ends the step with the checklist, then only the unstaged and done paragraphs', () => {
    const lastItem = [...report.matchAll(/^\d+\. .+$/gm)].at(-1)
    const rest = lastItem ? report.slice((lastItem.index ?? 0) + lastItem[0].length) : ''
    const paragraphs = rest
      .split(/\n{2,}/)
      .map(paragraph => paragraph.trim())
      .filter(Boolean)

    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(/^Leave every change unstaged/)
    expect(paragraphs[1]).toMatch(/^Done when/)
  })

  it('ends with a numbered checklist that starts at 1 and has no gaps', () => {
    const numbers = numberedItems(report).map(item => item.number)

    expect(numbers.length).toBeGreaterThan(0)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })

  it('is done only when every item has its line in ds-migration-report.md', () => {
    expect(report).toContain(
      'Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.',
    )
    expect(report).not.toContain('Print a per-file summary')
  })
})

describe('Report items the issue requires by name', () => {
  function singleLine(text: string, start: string) {
    const lines = text.split('\n').filter(line => line.startsWith(start))
    expect(lines, start).toHaveLength(1)
    return lines[0]
  }

  function bucketsOf(name: string) {
    return buckets(section(read(`components/${name}/migration.md`), '## 4. Report'))
  }

  function itemNumbers(name: string, phrases: string[]) {
    const { attention, coverage } = bucketsOf(name)
    const items = [...attention, ...coverage]

    return phrases.map(phrase => {
      const matches = items.filter(item => item.text.includes(phrase))
      expect(matches, phrase).toHaveLength(1)
      return matches[0].number
    })
  }

  const buttonCollisions = [
    ['tertiary', 'ghost'],
    ['light', 'tertiary'],
    ['info', 'secondary'],
    ['info-light', 'info'],
  ].map(([from, to]) => `from \`${from}\` to \`${to}\``)

  it('select checks every option with child elements as an attention item', () => {
    const { attention } = bucketsOf('select')

    expect(attention.filter(item => item.text.includes('option with child elements'))).toHaveLength(1)
  })

  it('accordion checks expanded, openIcon and closeIcon on their own lines', () => {
    const numbers = itemNumbers('accordion', ['`button-wide`', '`openIcon`', '`closeIcon`'])

    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('accordion checks every single-icon trigger on its own line', () => {
    const { attention } = bucketsOf('accordion')

    expect(attention.filter(item => item.text.includes('single-icon trigger'))).toHaveLength(1)
  })

  it('accordion maps legacy open labels and icons to the ds-accordion close props', () => {
    const migration = read('components/accordion/migration.md')
    const lineOf = (start: string) => singleLine(migration, start)
    const targetOf = (start: string) => lineOf(start).split('|')[2]
    const shape1After = lineOf('<ds-accordion button ')

    expect(shape1After).toContain('button-label-close="Show more"')
    expect(shape1After).toContain('button-label-open="Show less"')
    expect(targetOf('| `bal-accordion` `openLabel`')).toContain('`buttonLabelClose`')
    expect(targetOf('| `bal-accordion` `closeLabel`')).toContain('`buttonLabelOpen`')
    expect(targetOf('| `bal-accordion` `openIcon`')).toContain('`buttonIconClose`')
    expect(targetOf('| `bal-accordion` `closeIcon`')).toContain('`buttonIconOpen`')
    expect(targetOf('| `bal-accordion-trigger` `openLabel`')).toMatch(/^\s*`button-label-close` \/ `button-label-open`/)
    expect(targetOf('| `bal-accordion-trigger` `openIcon`')).toMatch(/^\s*`button-icon-close` \/ `button-icon-open`/)
    expect(lineOf('- **Trigger, `openIcon` set and `closeIcon` empty or absent.**')).toMatch(
      /both `button-icon-close` and `button-icon-open`/,
    )
    expect(lineOf('| `bal-accordion` bound `active`')).toContain('`[open]="x"`')
  })

  it('radio writes tile layout on the group, tile colour as attribute, and removes bal-radio-icon from tiles', () => {
    const migration = read('components/radio/migration.md')
    const lineOf = (start: string) => singleLine(migration, start)
    const colorRow = lineOf('| `color`')
    const colSizeRow = lineOf('| `colSize`')

    expect(colorRow.split('|')[2]).toContain('`tile-color`')
    expect(colorRow).toContain('[attr.tile-color]="x"')
    expect(colSizeRow).toContain('Drop from the child')
    expect(colSizeRow).toContain('`[attr.col-size*]`')
    expect(colorRow).toContain('Never write the `tileColor` property')
    expect(lineOf('| `"tile"`')).toContain('`tile` on `ds-radio-group`')
    expect(lineOf('| `"button"`')).toContain('`tile` + `hideTrigger` on `ds-radio-group`')
    expect(migration).toContain('add `tile` and `hideTrigger` to the group only')
    expect(migration).toContain('Delete every `<bal-radio-icon>` inside a migrated `<ds-radio>`')
    expect(migration).toContain('Remove `BalRadioIcon` from the `@baloise/ds-react` import')
    expect(migration).not.toContain('exactly as it is')

    const numbers = itemNumbers('radio', ['removed from a tile', 'differs from its siblings or from the group'])

    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('button checks each of the four colour collisions on its own line', () => {
    const numbers = itemNumbers('button', buttonCollisions)

    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('button lists the four colour collisions as attention items', () => {
    const { attention } = bucketsOf('button')

    for (const phrase of buttonCollisions) {
      expect(
        attention.filter(item => item.text.includes(phrase)),
        phrase,
      ).toHaveLength(1)
    }
  })

  describe.each(['toast', 'snackbar'])('%s notice controller rules', name => {
    const migration = () => read(`components/${name}/migration.md`)
    const sharedBalClose =
      '`balClose` is emitted only by `bal-toast` and `bal-snackbar`, and `balAction` only by `bal-snackbar`.'

    it.each(['`useEffect` cleanup', `more than one ${name} through one hook`, 'its target is unknown'])(
      'has exactly one attention item about %s',
      phrase => {
        const { attention, coverage } = bucketsOf(name)

        expect(
          attention.filter(item => item.text.includes(phrase)),
          phrase,
        ).toHaveLength(1)
        expect(
          coverage.filter(item => item.text.includes(phrase)),
          phrase,
        ).toHaveLength(0)
      },
    )

    it('shares the balClose emitter sentence and drops the wrong justification', () => {
      expect(migration()).toContain(sharedBalClose)
      expect(migration()).not.toContain('Both names are emitted by other legacy components')
    })

    it('no longer maps remove(id) to the dismiss hook function', () => {
      const dismiss = name === 'toast' ? 'dismissToast' : 'dismissSnackbar'

      expect(migration()).not.toContain(`\`${dismiss}()\` where it used \`remove(id)\``)
      expect(migration()).toContain(`\`${dismiss}()\` takes no id`)
    })

    it('uses the hook inside components and the controller with defineCustomElement outside', () => {
      const hook = name === 'toast' ? 'useToast' : 'useSnackbar'
      const controller = name === 'toast' ? 'dsToastController' : 'dsSnackbarController'

      expect(migration()).toContain(`\`${hook}\` from \`@helvetia-design/react\``)
      expect(migration()).toContain(`import \`${controller}\` from \`@helvetia-design/core\``)
      expect(migration()).toContain('`@helvetia-design/core/components/ds-alert-container.js`')
      expect(migration()).toContain(`\`@helvetia-design/core/components/ds-${name}.js\``)
    })
  })

  it('app writes the legacy brand default, reports forms and adds the ds-* language call', () => {
    const migration = read('components/app/migration.md')
    const { attention, coverage } = bucketsOf('app')

    expect(migration).toContain('Write `brand="baloise"`')
    expect(migration).toContain('add `provideDesignSystem()` with no arguments')
    expect(migration).toContain('call `updateDsLanguage(language)` from `@helvetia-design/core`')
    expect(migration).toContain('call `setLanguage(language)` on an injected `DsConfigService`')
    expect(migration).not.toContain('write no config attributes')
    expect(migration).toContain(
      'Skip an `updateBalLanguage` call that already has a `setLanguage(` or `updateDsLanguage(` call with the same argument directly after it.',
    )
    expect(migration).toContain(
      'call `updateDsLanguage(language)` from `@helvetia-design/core` instead of `DsConfigService`',
    )
    expect(migration).toContain('throws `NG0203`')
    expect(
      migration.match(
        /unless `ds-root`, `DsRootProvider` or an existing `initializeDesignSystem` call already sets `brand`/g,
      ),
    ).toHaveLength(2)
    expect(migration.match(/needs no replacement/g)).toHaveLength(1)
    expect(attention.filter(item => item.text.includes('`brand="baloise"`'))).toHaveLength(1)
    expect(
      attention.filter(item => item.text.includes('the note from the `forms.*` row of the Config table')),
    ).toHaveLength(1)
    expect(attention.filter(item => item.text.includes('because the legacy call set no `brand` key'))).toHaveLength(1)
    expect(attention.filter(item => item.text.includes('Every `forms` key left in the legacy call'))).toHaveLength(1)
    expect(attention.filter(item => item.text.includes('`provideDesignSystem()` added'))).toHaveLength(1)
    expect(coverage.filter(item => item.text.includes('Every `updateBalLanguage` call'))).toHaveLength(1)
  })

  describe.each([
    ['toast', 'snackbar'],
    ['snackbar', 'toast'],
  ])('%s bal-notices rule', (name, other) => {
    it('deletes its own interface and defers the shared container to the other migration', () => {
      const migration = read(`components/${name}/migration.md`)
      const { attention, coverage } = bucketsOf(name)

      expect(migration).toContain(`Delete a \`<bal-notices>\` element whose static \`interface\` is \`${name}\``)
      expect(migration).toContain(`go only when no ${other} is left`)
      expect(migration).toContain(
        `A \`<bal-notices>\` with a static \`interface="${other}"\` follows the next bullet, so it goes only when no ${other} is left.`,
      )
      expect(migration).not.toContain(`stays until the ${other} migration runs`)
      expect(migration).toContain(`scripts/scan-bal-${other}.mjs <project-root>`)
      expect(migration).not.toContain('`bal-notices` is not this component and stays unchanged.')
      expect(attention.filter(item => item.text.includes(`kept because a ${other} is left`))).toHaveLength(1)
      expect(coverage.filter(item => item.text.includes('`bal-notices` comment block deleted'))).toHaveLength(1)
    })
  })

  it('toast has an attention item for Angular and React heading=""', () => {
    const { attention, coverage } = bucketsOf('toast')
    const items = attention.filter(item => item.text.includes('`heading=""`'))

    expect(items).toHaveLength(1)
    expect(items[0].text).toContain('Angular and React')
    expect(coverage.filter(item => item.text.includes('`heading=""`'))).toHaveLength(0)
  })
})

describe('expectedCounts', () => {
  it('has one entry per component directory', () => {
    expect(Object.keys(expectedCounts).sort()).toEqual(components)
  })
})

describe('shared/report.md', () => {
  const contract = read('shared/report.md')

  it('defines the file, its sections, and the chat pointer line', () => {
    for (const phrase of [
      'ds-migration-report.md',
      '### Needs your attention',
      '### Coverage checklist',
      '### Files changed',
      '### Setup',
      'Full coverage checklist written to ds-migration-report.md: <N> items checked, <M> found.',
      'Nothing needs your attention.',
      'not checked',
      'git add',
    ]) {
      expect(contract, phrase).toContain(phrase)
    }
  })

  it('defines the not applicable outcome and the not checked pointer suffix', () => {
    expect(contract).toContain('`- [x] <n>. <item>: not applicable, <reason>`')
    expect(contract).toContain(
      'Full coverage checklist written to ds-migration-report.md: <N> items checked, <M> found, <K> not checked.',
    )
  })
})

describe('SKILL.md', () => {
  const skill = read('SKILL.md')

  it('writes the Init, CSS utils, Assets and Cleanup reports through shared/report.md', () => {
    expect(section(skill, '### Init')).toContain('`shared/report.md`')
    expect(section(skill, '### CSS utils')).toContain('`shared/report.md`')
    expect(section(skill, '### Assets')).toContain('`shared/report.md`')
    expect(section(skill, '### Cleanup')).toContain('`shared/report.md`')
  })

  it('reports .vue findings in a component migration instead of rewriting them', () => {
    const components = section(skill, '### Components')

    expect(components).toContain('Vue is not a supported target.')
    expect(components).toContain('never rewrites a `.vue` file')
    expect(components).toContain('"Needs your attention"')
  })

  it('lists Cleanup as the fifth menu item', () => {
    expect(section(skill, '## Menu')).toMatch(/^5\. \*\*Cleanup\*\* /m)
  })

  it('gates the Cleanup step on scan-cleanup.mjs and shared/cleanup.md, with C items', () => {
    const cleanup = section(skill, '### Cleanup')

    expect(read('shared/cleanup.md')).toContain('scripts/scan-cleanup.mjs')
    expect(cleanup).toContain('`scan-cleanup.mjs`')
    expect(cleanup).toContain('`shared/cleanup.md`')
    expect(cleanup).toContain('`incomplete`')
    expect(cleanup).toContain('`outstanding.suggested`')
    expect(cleanup).toContain('`outstanding.notYet`')
    expect(cleanup).toContain('`outstanding.hidden`')
    expect(cleanup).toContain('`nothing-to-clean-up`')
    expect(cleanup).toContain('one yes/no')
    expect(cleanup).toContain('`C1.`')
  })

  it('runs scan-assets.mjs and shared/fonts-favicons.md in the Assets step', () => {
    const assets = section(skill, '### Assets')

    expect(assets).toContain('`scan-assets.mjs`')
    expect(assets).toContain('`shared/fonts-favicons.md`')
  })

  it('lists the Vite config lines in every Assets run, also when nothing else was found', () => {
    const assets = section(skill, '### Assets')

    expect(assets).toContain('Then read the Vite config section of `shared/fonts-favicons.md` without editing anything')
    expect(assets).toContain('The Vite config lines need no confirmation')
    expect(assets).toMatch(/^\d+\. Apply the Vite config section of `shared\/fonts-favicons\.md` in every case\./m)
    expect(assets).not.toContain('Apply its Vite config section')
  })

  it('orders the Assets checklist as I items, then A items, then L items', () => {
    const assets = section(skill, '### Assets')
    const icons = assets.indexOf('`I1.`')
    const fonts = assets.indexOf('`A1.`')
    const config = assets.indexOf('`L1.`')

    expect(icons).toBeGreaterThan(-1)
    expect(fonts).toBeGreaterThan(icons)
    expect(config).toBeGreaterThan(fonts)
  })

  it('keeps the report file unstaged', () => {
    expect(skill).toContain('leaves every change unstaged, including the report file `ds-migration-report.md`')
    expect(skill).toContain('never runs `git add` or `git commit`')
  })

  it('keeps scratch files inside the project and deletes them', () => {
    const intro = skill.slice(0, skill.indexOf('## Menu'))

    expect(intro).toContain('Read script output from stdout. Do not write scratch files.')
    expect(intro).toContain('`<project-root>/.claude/ds-migrate-scratch/`')
    expect(intro).toContain('Never write outside `<project-root>`.')
  })

  it('tells the user what to do when Init refuses a version below the minimum', () => {
    const init = section(skill, '### Init')

    expect(init).toContain('Do not hardcode a version.')
    expect(init).toContain('a resolved version below the minimum `@helvetia-design/core` version of this skill')
    expect(init).toContain('rerun with `--version` and the minimum or a later version once that version is published')
  })

  it('chooses the Init local form by the target file type', () => {
    const init = section(skill, '### Init')

    expect(init).toContain('The target file type decides the local form, not `framework`.')
    expect(init).toContain('Local form in an `.html` file:')
    expect(init).toContain('relative from that HTML file to the `node_modules` folder of `<project-root>`')
    expect(init).toContain('the path must resolve from where the server serves the page')
    expect(init).toContain('the `ds-*` components still need to be registered. Do not invent a loader call.')
    expect(init).not.toContain('Local form when `framework` is `html`')
  })

  it('lets the user confirm non-literal class bindings in CSS utils', () => {
    const cssUtils = section(skill, '### CSS utils')
    const rules = read('shared/css-utils.md')

    expect(cssUtils).toContain('which of these places can hold a Baloise class?')
    expect(cssUtils).toContain('A `dynamic` place with any other reason always keeps the line')
    expect(cssUtils).toContain('skips the places the user confirmed in step 1')
    expect(section(rules, '## Legacy utilities line')).toContain(
      'A `dynamic` place with reason `non-literal class binding` that the user confirmed',
    )
    expect(section(rules, '## Report')).toContain('"confirmed by the user", with file and line')
  })
})

describe('shared/batch.md', () => {
  it('stops a batch with more than eight migrations and splits it by folder', () => {
    const batch = read('shared/batch.md')

    expect(batch).toContain('When the migration list has more than eight entries, the batch is too large.')
    expect(batch).toContain('Do not ask whether to continue.')
    expect(batch).toContain('Split a folder that still uses more than eight by file.')
    expect(batch).toContain('It is exempt from the limit.')
    expect(batch).toContain('Then ask for one yes/no for this batch or part:')
    expect(batch).toContain('The user starts each next part with **Scope**.')
    expect(batch).not.toContain('continue only on an explicit yes')
  })
})

describe('Unmapped props and handlers', () => {
  const instruction = /\b[Aa]pply Unmapped props and handlers\b/

  const unmappedComponents = [
    'data',
    'date',
    'file-upload',
    'hint',
    'input',
    'input-slider',
    'input-stepper',
    'label',
    'list',
    'modal',
    'navbar',
    'notification',
    'number-input',
    'popup',
    'radio',
    'segment',
    'select',
    'shape',
    'sheet',
    'steps',
    'tabs',
    'textarea',
  ]

  // Rows marked "no equivalent" that are structural, so the unmapped rule does not cover them.
  const notUnmapped: Record<string, string> = {
    'steps: `options`': 'the steps are rebuilt as `ds-step` children by hand (issue #174)',
    'tabs: `accordion`, `options`': 'the whole group stays in place, see Groups left in place (issue #174)',
    'tabs: `handleAsTabList`': 'with `href` items the whole group stays in place',
    'tabs: `disabled`, `invisible`': 'a static `true` or a dynamic value keeps the whole group in place',
  }

  function cells(line: string) {
    return line
      .split(/(?<!\\)\|/)
      .slice(1, -1)
      .map(cell => cell.trim())
  }

  function row(name: string, cell: string) {
    const line = read(`components/${name}/migration.md`)
      .split('\n')
      .find(candidate => candidate.startsWith(`| ${cell} `))
    if (!line) throw new Error(`components/${name}/migration.md has no table row for ${cell}`)
    return cells(line)
  }

  function instructionLines(markdown: string) {
    return markdown.split('\n').filter(line => instruction.test(line) && !/^\d+\. /.test(line))
  }

  const skill = read('SKILL.md')
  const rule = section(skill, '#### Unmapped props and handlers')

  it('defines the rule in SKILL.md under Components, before Manual', () => {
    const componentsSection = section(skill, '### Components')

    expect(componentsSection).toContain('#### Unmapped props and handlers\n')
    expect(componentsSection.indexOf('#### Unmapped props and handlers')).toBeLessThan(
      componentsSection.indexOf('#### Manual'),
    )
    expect(rule).toContain('TODO(ds-migrate)')
  })

  it.each([
    '- HTML: leave',
    '- React and Angular, prop or attribute: remove',
    '- React and Angular, event handler: remove',
    'standalone statement',
    'Report every item this rule handles under Needs your attention.',
    '`undefined as unknown as <Type>`',
    '`Promise.resolve(undefined as unknown as <Type>)`',
    'receives `undefined` at runtime',
    'replaced by a typed placeholder because its result is used',
  ])('SKILL.md rule states %s', phrase => {
    expect(rule).toContain(phrase)
  })

  it.each(unmappedComponents)('components/%s/migration.md applies the rule on a row or instruction line', name => {
    expect(instructionLines(read(`components/${name}/migration.md`))).not.toHaveLength(0)
  })

  it.each(components)('components/%s/migration.md handles every no-equivalent row', name => {
    const unhandled = read(`components/${name}/migration.md`)
      .split('\n')
      .filter(line => line.startsWith('|') && line.includes('_(no equivalent'))
      .map(cells)
      .filter(([old]) => !notUnmapped[`${name}: ${old}`])
      .filter(rowCells => {
        const handling = rowCells.at(-1) ?? ''
        return !instruction.test(handling) && !/\b(drop|delete)\b|\bRemoved\b|Do not carry it over/i.test(handling)
      })
      .map(([old]) => old)

    expect(unhandled).toEqual([])
  })

  it('lists only rows that exist in notUnmapped', () => {
    for (const key of Object.keys(notUnmapped)) {
      const [name, old] = key.split(': ')
      expect(row(name, old)[1], key).toMatch(/_\(no equivalent/)
    }
  })

  const wordingFiles = [
    ...components.map(name => `components/${name}/migration.md`),
    'SKILL.md',
    ...readdirSync(`${skillDir}shared`)
      .filter(file => file.endsWith('.md'))
      .map(file => `shared/${file}`),
  ]

  it.each(wordingFiles)('%s has no vague compile wording', file => {
    expect(read(file)).not.toMatch(/(may|might|does|do) not compile|fails? to compile/i)
  })

  it.each(components)('components/%s/migration.md drops the leave-in-place wording', name => {
    const migration = read(`components/${name}/migration.md`)

    expect(migration).not.toMatch(/Leave the (attribute|handler|listener|call) in place/)
    expect(migration).not.toMatch(/Do not rewrite (these|handlers)\b/)
    for (const phrase of ['In strictly typed React', 'Do not rewrite or remove the handler']) {
      expect(migration, phrase).not.toContain(phrase)
    }
  })

  it('popup splits balChange into dsDidPresent and dsDidDismiss', () => {
    const [, target, handling] = row('popup', '`balChange`')

    expect(target).toContain('`dsDidPresent`')
    expect(target).toContain('`dsDidDismiss`')
    expect(handling).toContain('TS17001')
  })

  it.each([
    ['tabs', '`select(tab)`'],
    ['steps', '`select(step)`'],
  ])('%s rewrites %s to value without emitting dsChange', (name, old) => {
    const rowCells = row(name, old)

    expect(rowCells[1]).toBe('`value`')
    expect(rowCells.join(' | ')).not.toMatch(/no equivalent/i)
    expect(rowCells.at(-1)).toContain('Setting `value` does not emit `dsChange`.')
  })

  it('notification maps light with info or primary to outline-default as an approximation', () => {
    const rowCells = row('notification', '`light` with `color="info"` / `"primary"`')

    expect(rowCells[1]).toBe('`color="outline-default"`')
    expect(rowCells.at(-1)).toMatch(/approximation/)
  })

  describe('cleanup after row-prescribed drops (issue #185)', () => {
    function attentionItems(name: string) {
      return buckets(section(read(`components/${name}/migration.md`), '## 4. Report')).attention
    }

    it('SKILL.md widens the cleanup to drops and deletions a row prescribes on its own', () => {
      expect(rule).toContain(
        'also apply after every drop or deletion that a `migration.md` row prescribes on its own, without "Apply Unmapped props and handlers"',
      )
      expect(rule).toContain('`// TODO(ds-migrate): unused after <name> was removed: <declaration>`')
      expect(rule).toContain('Drop the whole import line when no binding is left.')
      expect(rule).toContain('Never touch an exported symbol.')
      expect(rule).toContain('Structural rules stay excluded from both.')
    })

    it('SKILL.md scopes the row-prescribed cleanup per framework', () => {
      expect(rule).toContain(
        'In an Angular class file, unused imports, module-level declarations and private members that only the removed code used get the same treatment.',
      )
      expect(rule).toContain('Public methods stay')
      expect(rule).toContain('A multi-line declaration gets one `//` per line, with the TODO text on the first line.')
    })

    it('SKILL.md keeps an emptied method or function and reports its callers', () => {
      expect(rule).toContain('- React and Angular, emptied method or function:')
      expect(rule).toContain('`// TODO(ds-migrate): <method>() had no ds-* target: <statement>`')
      expect(rule).toContain('"now does nothing"')
      expect(rule).toContain('`.component.html`')
      expect(rule).toContain('calls in the same class or module file (`this.<method>(` in Angular, `<fn>(` in React)')
    })

    it('button maps isActive to a11yCurrent', () => {
      const [, target, handling] = row('button', '`isActive`')

      expect(target).toBe('`a11yCurrent` on a navigation entry, otherwise _(no equivalent)_')
      expect(handling).toContain('Rewrite it only when the button is a navigation entry.')
      expect(handling).toContain("`el.a11yCurrent = cond ? 'page' : ''`")
      expect(handling).toContain('When the button is not a navigation entry, drop `isActive`.')
      expect(handling).toContain('`aria-current="page"` in HTML')
      expect(handling).toContain("`a11yCurrent={cond ? 'page' : undefined}`")
      expect(handling).toContain("`[a11yCurrent]=\"cond ? 'page' : ''\"`")
      expect(handling).toContain('`aria-current`')
      expect(handling).toContain(
        'On a navigation entry, also rewrite `color` as the current-navigation-entry section above describes.',
      )
      expect(handling).not.toContain('with no replacement')
    })

    it('button binds color so the current navigation entry keeps its highlight', () => {
      const shape = section(
        read('components/button/migration.md'),
        '### Shape: the current navigation entry keeps its highlight through `color`',
      )

      expect(shape).toContain('bind `color` to the same condition as `a11yCurrent`')
      expect(shape).toContain('An omitted `color` maps to `primary`')
      expect(shape).toContain('The other entries keep `<mapped>`')
      expect(shape).toContain('The current entry gets `<current>`, which is `primary`.')
      expect(shape).toContain('When `<mapped>` is `primary`, `<current>` is `secondary` instead.')
      expect(shape).toContain('Leave `inverted` as it is.')
      expect(shape).toContain(
        'on an inverted button, `<current>` is `primary` when `<mapped>` is `secondary`, `tertiary`, `ghost` or `link`, and `secondary` otherwise.',
      )
      expect(shape).toContain("`color={cond ? '<current>' : '<mapped>'}`")
      expect(shape).toContain("`[color]=\"cond ? '<current>' : '<mapped>'\"`")
      expect(shape).toContain("`el.color = cond ? '<current>' : '<mapped>'`")
      expect(shape).toContain('A true literal sets `color="<current>"`.')
      expect(shape).toContain('A static navbar entry without `color` becomes `color="secondary"`.')
      expect(shape).toContain("The binding replaces the button's existing `color`.")
      expect(shape).toContain('so the non-literal rule above does not apply to it')
      expect(shape).toContain('add no binding, and report the entry as a highlight to restore by hand')
    })

    it('button reports every isActive rewrite and drop with the lost pressed look', () => {
      const items = attentionItems('button').filter(item => item.text.includes('`isActive`'))

      expect(items).toHaveLength(1)
      expect(items[0].text).toContain('"the forced pressed look is gone"')
      expect(items[0].text).toContain('"pressed look lost, check whether it was a toggle"')
      expect(items[0].text).toContain('with the `color` binding that now marks the current entry')
      expect(items[0].text).toContain('"highlight not restored, non-literal `color`"')
    })

    describe.each(['toast', 'snackbar'])('%s', name => {
      it.each([
        ['`closeIn(duration)`', '`closeIn`'],
        ['`setQueue()`', '`setQueue`'],
      ])('%s row applies the cleanup and its report names emptied methods', (cell, method) => {
        expect(row(name, cell).at(-1)).toContain('"Unmapped props and handlers" in `SKILL.md`')
        expect(
          attentionItems(name).filter(item => item.text.includes(method) && item.text.includes('"now does nothing"')),
        ).toHaveLength(1)
      })
    })
  })
})

describe('shared/icons.md Report', () => {
  it('lists the icon items as a continuous I-numbered checklist', () => {
    const report = section(read('shared/icons.md'), '## Report')
    const numbers = [...report.matchAll(/^- I(\d+)\. /gm)].map(([, number]) => Number(number))

    expect(report).toContain('`shared/report.md`')
    expect(numbers.length).toBeGreaterThan(0)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })
})

describe('shared/field.md Report', () => {
  it('lists the field items as a continuous F-numbered checklist', () => {
    const report = section(read('shared/field.md'), '## Report')
    const numbers = [...report.matchAll(/^- F(\d+)\. /gm)].map(([, number]) => Number(number))

    expect(report).toContain('`shared/report.md`')
    expect(report).not.toContain('summary')
    expect(numbers.length).toBeGreaterThan(0)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })

  it('reports every migrated bal-ng-error and every one left in place', () => {
    const report = section(read('shared/field.md'), '## Report')
    const { attention } = buckets(report.replace(/^- F(\d+)\. /gm, '$1. '))
    const migrated = attention.filter(item => item.text.startsWith('Every migrated `bal-ng-error`'))
    const left = attention.filter(item => item.text.startsWith('Every `bal-ng-error` left in place'))

    expect(migrated).toHaveLength(1)
    expect(migrated[0].text).toContain('template order')
    expect(migrated[0].text).toContain('validator order')
    expect(left).toHaveLength(1)
    expect(left[0].text).toContain('`bal-field-message` left in place')
    for (const reason of ['control cannot be resolved', 'legacy `bal-*` control', 'no `invalid-text` slot']) {
      expect(left[0].text, reason).toContain(reason)
    }
    expect(migrated[0].text).toContain('`bal-ng-error` without `error`')
  })

  it('does not map a bal-field-message that only wraps bal-ng-error to description', () => {
    const row = read('shared/field.md')
      .split('\n')
      .find(line => line.startsWith('| `bal-field-message` with `color=""`'))

    expect(row).toContain('contains `bal-ng-error` follows the `bal-ng-error` row')
  })
})

describe('shared/legacy-config.md Report', () => {
  it('lists the legacy config items as a continuous L-numbered checklist', () => {
    const report = section(read('shared/legacy-config.md'), '## Report')
    const numbers = [...report.matchAll(/^- L(\d+)\. /gm)].map(([, number]) => Number(number))

    expect(report).toContain('`shared/report.md`')
    expect(report).not.toContain('summary')
    expect(numbers.length).toBeGreaterThan(0)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })
})

describe('shared/fonts-favicons.md', () => {
  const rules = read('shared/fonts-favicons.md')

  it('lists the asset items as a continuous A-numbered checklist', () => {
    const report = section(rules, '## Report')
    const numbers = [...report.matchAll(/^- A(\d+)\. /gm)].map(([, number]) => Number(number))

    expect(report).toContain('`shared/report.md`')
    expect(report).not.toContain('summary')
    expect(numbers.length).toBeGreaterThan(0)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })

  it('lists Baloise-only Vite config lines as removable and never edits the config', () => {
    const report = section(rules, '## Report')

    expect(section(rules, '## Vite config')).toContain('Never edit a Vite config.')
    expect(report).toContain('removable once no `@baloise/*` import is left')
  })

  it('forbids fonts.css and fonts.cdn.css and never instructs writing them', () => {
    expect(rules).toContain(
      'Never write an import of `@helvetia-design/assets/src/fonts/css/fonts.css` or `@helvetia-design/assets/src/fonts/css/fonts.cdn.css`.',
    )

    const instructions = rules
      .split('\n')
      .filter(line => /fonts(?:\.cdn)?\.css/.test(line) && /\b(?:write|import|add|use)\b/i.test(line))
      .filter(line => !line.startsWith('Never write an import of'))
    expect(instructions).toEqual([])
  })

  it('never points $font-path at a remote host', () => {
    expect(rules).not.toMatch(/\$font-path:\s*['"]?https?:/)
    expect(rules).toContain("with ($font-path: '/assets/fonts')")
  })
})

describe('shared/css-utils.md Report', () => {
  it('lists the CSS utils items as a continuous U-numbered checklist', () => {
    const report = section(read('shared/css-utils.md'), '## Report')
    const numbers = [...report.matchAll(/^- U(\d+)\. /gm)].map(([, number]) => Number(number))

    expect(report).toContain('`shared/report.md`')
    expect(report).not.toContain('summary')
    expect(numbers.length).toBeGreaterThan(0)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })
})

describe('shared/cleanup.md Report', () => {
  it('lists the cleanup items as a continuous C-numbered checklist', () => {
    const report = section(read('shared/cleanup.md'), '## Report')
    const numbers = [...report.matchAll(/^- C(\d+)\. /gm)].map(([, number]) => Number(number))

    expect(report).toContain('`shared/report.md`')
    expect(report).not.toContain('summary')
    expect(numbers.length).toBeGreaterThan(0)
    expect(numbers).toEqual(numbers.map((_, index) => index + 1))
  })
})
