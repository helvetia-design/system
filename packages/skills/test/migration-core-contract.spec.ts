import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const componentsDir = join(here, '../skills/ds-migrate-from-baloise/components')
const coreDir = join(here, '../../core/src/components')

type Case = {
  doc: string
  tag: string
  source: string
  values?: Record<string, string>
}

const cases: Case[] = [
  { doc: 'close', tag: 'ds-close', source: 'actions/close/close', values: { size: 'CLOSE_SIZES' } },
  { doc: 'text', tag: 'ds-text', source: 'structure/text/text', values: { color: 'TEXT_COLORS' } },
  { doc: 'button', tag: 'ds-button', source: 'actions/button/button' },
  { doc: 'tag', tag: 'ds-tag', source: 'indicators/tag/tag' },
  { doc: 'badge', tag: 'ds-badge', source: 'indicators/badge/badge', values: { color: 'BADGE_COLORS' } },
  { doc: 'date', tag: 'ds-datepicker', source: 'forms/datepicker/datepicker' },
]

const PURE_LIST = /^`[\w-]+`(?:\s*[,/]\s*`[\w-]+`)*$/

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const backticked = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map(m => m[1])

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

function coreProps(source: string): Map<string, string> {
  const props = new Map<string, string>()
  const pattern = /@Prop\(([^)]*)\)\s*(?:@\w+\([^)]*\)\s*)*(?:readonly\s+)?(\w+)/g
  for (const [, options, name] of stripComments(source).matchAll(pattern)) {
    const attribute = /attribute:\s*'([^']+)'/.exec(options)?.[1] ?? kebab(name)
    props.set(name, attribute)
  }
  return props
}

function coreConstant(source: string, name: string): string[] {
  const match = new RegExp(`export const ${name} = \\[([^\\]]*)\\]`).exec(source)
  if (!match) throw new Error(`${name} not found`)
  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1])
}

function splitRow(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let inCode = false
  for (let i = 1; i < line.length; i++) {
    const char = line[i]
    if (char === '`') inCode = !inCode
    if (char === '|' && !inCode && line[i - 1] !== '\\') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }
  return cells
}

function propsRows(doc: string, tag: string): string[][] {
  const rows: string[][] = []
  let inProps = false
  let collecting = false
  for (const line of doc.split('\n')) {
    if (line.startsWith('#')) {
      inProps = line.startsWith('### Props')
      collecting = false
      continue
    }
    if (!line.startsWith('|')) {
      collecting = false
      continue
    }
    const cells = splitRow(line)
    if (inProps && cells[1] === `new (\`${tag}\`)`) {
      collecting = true
      continue
    }
    if (collecting && !cells[0].startsWith('---')) rows.push(cells)
  }
  return rows
}

describe.each(cases)('$doc migration.md against core $tag', ({ doc, tag, source, values }) => {
  const markdown = readFileSync(join(componentsDir, doc, 'migration.md'), 'utf8')
  const component = readFileSync(join(coreDir, `${source}.tsx`), 'utf8')
  const props = coreProps(component)
  const attributes = new Set(props.values())
  const rows = propsRows(markdown, tag)
  const constants = Object.fromEntries(
    Object.entries(values ?? {}).map(([attr, name]) => [
      attr,
      coreConstant(readFileSync(join(coreDir, `${source}.interfaces.ts`), 'utf8'), name),
    ]),
  )
  const allValues = new Set(Object.values(constants).flat())

  it('finds the props table', () => {
    expect(rows.length).toBeGreaterThan(0)
  })

  it('names only props that core declares', () => {
    const named = rows.flatMap(([oldCell, newCell]) => {
      if (newCell === 'same') return PURE_LIST.test(oldCell) ? backticked(oldCell) : []
      return PURE_LIST.test(newCell) ? backticked(newCell) : []
    })
    const unknown = named.filter(name => !props.has(name) && !attributes.has(name))
    expect(unknown).toEqual([])
  })

  it.runIf(values)('writes only values that core accepts', () => {
    for (const [attr, accepted] of Object.entries(constants)) {
      const written = rows.flatMap(([oldCell, newCell]) => {
        const cell = newCell === 'same' ? oldCell : newCell
        return [...cell.matchAll(new RegExp(`\\b${attr}="([^"]+)"`, 'g'))].map(m => m[1])
      })
      expect(written.filter(value => !accepted.includes(value))).toEqual([])
    }
  })

  it('does not claim core lacks a prop or value it has', () => {
    const claims = [...markdown.matchAll(new RegExp(`\`${tag}\` has no ([^.,:;]*)`, 'g'))].map(m => m[1])
    const contradicted = claims.flatMap(claim => [
      ...backticked(claim).filter(token => props.has(token) || allValues.has(token)),
      ...claim.split(/\W+/).filter(word => allValues.has(word)),
    ])
    expect(contradicted).toEqual([])
  })

  it('names the property for every attribute that differs from it', () => {
    const renamed = [...props].filter(([name, attribute]) => attribute !== kebab(name))
    const missing = renamed.filter(
      ([name, attribute]) => markdown.includes(`\`${attribute}\``) && !markdown.includes(name),
    )
    expect(missing.map(([name]) => name)).toEqual([])
  })
})
