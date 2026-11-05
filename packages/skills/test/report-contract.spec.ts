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
  'accordion': { attention: 12, coverage: 3 },
  'app': { attention: 5, coverage: 4 },
  'badge': { attention: 3, coverage: 3 },
  'button': { attention: 11, coverage: 4 },
  'card': { attention: 9, coverage: 3 },
  'carousel': { attention: 21, coverage: 6 },
  'checkbox': { attention: 10, coverage: 2 },
  'close': { attention: 2, coverage: 1 },
  'content': { attention: 4, coverage: 2 },
  'data': { attention: 6, coverage: 1 },
  'date': { attention: 10, coverage: 4 },
  'divider': { attention: 4, coverage: 2 },
  'field': { attention: 1, coverage: 2 },
  'file-upload': { attention: 3, coverage: 1 },
  'footer': { attention: 8, coverage: 4 },
  'heading': { attention: 6, coverage: 4 },
  'hint': { attention: 1, coverage: 0 },
  'icon': { attention: 6, coverage: 0 },
  'input-slider': { attention: 9, coverage: 5 },
  'input-stepper': { attention: 8, coverage: 2 },
  'input': { attention: 13, coverage: 2 },
  'label': { attention: 5, coverage: 2 },
  'list': { attention: 26, coverage: 7 },
  'logo': { attention: 5, coverage: 0 },
  'modal': { attention: 18, coverage: 3 },
  'navbar': { attention: 12, coverage: 0 },
  'notification': { attention: 6, coverage: 2 },
  'number-input': { attention: 8, coverage: 2 },
  'pagination': { attention: 6, coverage: 4 },
  'popup': { attention: 17, coverage: 4 },
  'progress-bar': { attention: 6, coverage: 3 },
  'radio': { attention: 11, coverage: 2 },
  'segment': { attention: 8, coverage: 0 },
  'select': { attention: 13, coverage: 0 },
  'shape': { attention: 5, coverage: 1 },
  'sheet': { attention: 7, coverage: 0 },
  'snackbar': { attention: 14, coverage: 5 },
  'spinner': { attention: 0, coverage: 1 },
  'stack': { attention: 4, coverage: 1 },
  'steps': { attention: 16, coverage: 5 },
  'tabs': { attention: 26, coverage: 5 },
  'tag': { attention: 5, coverage: 6 },
  'text': { attention: 5, coverage: 1 },
  'textarea': { attention: 7, coverage: 2 },
  'toast': { attention: 8, coverage: 5 },
  'tooltip': { attention: 5, coverage: 2 },
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

  it('writes the Init, CSS utils and Assets reports through shared/report.md', () => {
    expect(section(skill, '### Init')).toContain('`shared/report.md`')
    expect(section(skill, '### CSS utils')).toContain('`shared/report.md`')
    expect(section(skill, '### Assets')).toContain('`shared/report.md`')
  })

  it('keeps the report file unstaged', () => {
    expect(skill).toContain('leaves every change unstaged, including the report file `ds-migration-report.md`')
    expect(skill).toContain('never runs `git add` or `git commit`')
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
