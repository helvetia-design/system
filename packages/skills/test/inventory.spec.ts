import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { diff, inventory } from '../harness/inventory.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

function createScratchDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ds-migrate-inventory-'))
  scratches.push(dir)
  return dir
}

function write(root: string, rel: string, contents: string) {
  const file = join(root, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

function matchesIn(report: ReturnType<typeof inventory>, file: string) {
  return report.files.find(entry => entry.file === file)?.hits.map(hit => `${hit.match}:${hit.category}`) ?? []
}

describe('inventory', () => {
  it('categorises every shape of Baloise reference', () => {
    const root = createScratchDir()
    write(
      root,
      'App.tsx',
      [
        "import { BalButton } from '@baloise/ds-react'",
        "import { balToastController } from '@baloise/ds-core'",
        'export const App = () => <BalButton onBalChange={handle}>ok</BalButton>',
      ].join('\n'),
    )

    // Hits are reported in source order, so the bound symbol precedes the specifier it is
    // imported from.
    expect(matchesIn(inventory(root), 'App.tsx')).toEqual([
      'BalButton:symbol',
      '@baloise/ds-react:import',
      'balToastController:controller',
      '@baloise/ds-core:import',
      '<BalButton:tag',
      'onBalChange:handler',
      '</BalButton:tag',
    ])
  })

  it('matches legacy custom element tags in html', () => {
    const root = createScratchDir()
    write(root, 'index.html', '<bal-card><bal-card-title>Hi</bal-card-title></bal-card>')

    expect(matchesIn(inventory(root), 'index.html')).toEqual([
      '<bal-card:tag',
      '<bal-card-title:tag',
      '</bal-card-title:tag',
      '</bal-card:tag',
    ])
  })

  it('classifies a controller as a controller rather than the generic event shape', () => {
    const root = createScratchDir()
    write(root, 'a.ts', ['balToastController.create({})', 'el.addEventListener("balChange", handle)'].join('\n'))

    expect(matchesIn(inventory(root), 'a.ts')).toEqual(['balToastController:controller', 'balChange:event'])
  })

  it('counts a hit but flags it when the line is a comment', () => {
    const root = createScratchDir()
    write(root, 'a.ts', ['// balToastController creates its own container', 'const x = 1'].join('\n'))

    const report = inventory(root)
    expect(report.total).toBe(1)
    expect(report.files[0].hits[0].inComment).toBe(true)
  })

  it('skips node_modules, build output and lockfiles', () => {
    const root = createScratchDir()
    write(root, 'node_modules/@baloise/ds-react/index.js', 'export const BalButton = {}')
    write(root, 'dist/bundle.js', 'BalButton')
    write(root, 'package-lock.json', '{"@baloise/ds-react": "19"}')
    write(root, 'src/App.tsx', '<BalButton />')

    const report = inventory(root)
    expect(report.files.map(entry => entry.file)).toEqual(['src/App.tsx'])
  })

  it('moves allowlisted hits out of the leftover count', () => {
    const root = createScratchDir()
    write(root, 'Profile.tsx', '<DsPopup onBalChange={handle} />')

    const allowed = inventory(root, [
      { file: 'Profile.tsx', match: 'onBalChange', reason: 'popup/migration.md:85 — leave in place' },
    ])

    expect(allowed.total).toBe(1)
    expect(allowed.allowed).toBe(1)
    expect(allowed.leftover).toBe(0)
    expect(allowed.byCategory).toEqual({})
    expect(allowed.files[0].hits[0].reason).toBe('popup/migration.md:85 — leave in place')
  })

  it('does not allowlist a matching identifier in a different file', () => {
    const root = createScratchDir()
    write(root, 'Other.tsx', '<DsTabs onBalChange={handle} />')

    const report = inventory(root, [{ file: 'Profile.tsx', match: 'onBalChange' }])
    expect(report.leftover).toBe(1)
  })
})

describe('diff', () => {
  it('reports what went, what stayed and what appeared', () => {
    const before = {
      total: 3,
      files: [{ file: 'App.tsx', total: 3, hits: [{ match: 'BalButton' }, { match: 'BalCard' }, { match: 'BalTag' }] }],
    }
    const after = {
      total: 2,
      byCategory: { symbol: 2 },
      files: [{ file: 'App.tsx', total: 2, hits: [{ match: 'BalTag' }, { match: 'onBalChange' }] }],
    }

    expect(diff(before, after)).toEqual({
      before: 3,
      after: 2,
      removed: 1,
      remaining: [{ id: 'App.tsx::BalTag', count: 1 }],
      introduced: [{ id: 'App.tsx::onBalChange', count: 1 }],
      remainingByCategory: { symbol: 2 },
    })
  })
})
