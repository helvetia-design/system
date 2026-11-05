import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { diffClasses, extractClasses, extractModifiers, parseArgs, run } from '../scripts/diff-css-utils.mjs'

const scratches: string[] = []

afterEach(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true })
  scratches.length = 0
})

describe('extractClasses', () => {
  it('reads selectors only, unescapes variants, and skips keyframe steps and comments', () => {
    const css = [
      '/* .commented {} */',
      '.a, .widescreen\\:mb-small:hover > .b { width: 0.5em; margin: .01em }',
      '@media (min-width: 1280px) { .c { top: 0 } }',
      '@keyframes spin { 33.3% { opacity: 0 } }',
    ].join('\n')

    expect(extractClasses(css)).toEqual(['a', 'b', 'c', 'widescreen:mb-small'])
  })
})

describe('extractModifiers', () => {
  it('pairs every class that shares a compound selector with a structure class', () => {
    const css = '.grid.is-mobile > .col.is-half {} .container.is-fluid {} .other.is-x {}'

    expect(extractModifiers(css, ['grid', 'col', 'container'])).toEqual([
      'col is-half',
      'container is-fluid',
      'grid is-mobile',
    ])
  })
})

describe('diffClasses', () => {
  it('splits the lists and proposes only renames whose target Helvetia ships', () => {
    const diff = diffClasses(
      ['border-primary-hovered', 'text-red-pressed', 'grid', 'widescreen:flex', 'font-family-title', 'mb-small'],
      ['border-primary-hover', 'ds-grid', 'desktop-lg:flex', 'font-family-heading', 'mb-small', 'gap-sm'],
    )

    expect(diff.identical).toEqual(['mb-small'])
    expect(diff.helvetiaOnly).toEqual([
      'border-primary-hover',
      'ds-grid',
      'desktop-lg:flex',
      'font-family-heading',
      'gap-sm',
    ])
    expect(diff.proposed).toEqual({
      'border-primary-hovered': 'border-primary-hover',
      'grid': 'ds-grid',
      'widescreen:flex': 'desktop-lg:flex',
      'font-family-title': 'font-family-heading',
    })
  })
})

describe('parseArgs and run', () => {
  it('rejects a missing side and an unknown flag', () => {
    expect(() => parseArgs(['--baloise', 'a.css'])).toThrow(/Usage/)
    expect(() => parseArgs(['--nope', 'x'])).toThrow(/Unknown argument/)
    expect(() => parseArgs(['--baloise'])).toThrow(/Missing value/)
  })

  it('keeps only the rules of the classes after `#` and writes the class list', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ds-diff-css-utils-'))
    scratches.push(dir)
    writeFileSync(join(dir, 'core.css'), '.container, .other {} .container.is-fluid {} .columns {}')
    writeFileSync(join(dir, 'h.css'), '.ds-container {} .is-fluid {}')
    let out = ''

    const code = run(
      [
        '--baloise',
        `${join(dir, 'core.css')}#container`,
        '--helvetia',
        join(dir, 'h.css'),
        '--classes-out',
        join(dir, 'out.txt'),
      ],
      { write: (chunk: string) => (out += chunk) } as NodeJS.WritableStream,
    )

    expect(code).toBe(0)
    expect(JSON.parse(out).baloiseOnly).toEqual(['container', 'other'])
    expect(JSON.parse(out).proposed).toEqual({ container: 'ds-container' })
  })
})
