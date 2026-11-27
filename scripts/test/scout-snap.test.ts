import { describe, expect, it } from 'vitest'

const { brandSiblings, candidatesFor, contrast, deltaE, familyOf, parseColor, preferFor, snapColor, snapPx } =
  await import('../../.claude/skills/ds-scout-component/scripts/snap.mjs')

const tokens = [
  { name: 'ds-device-space-sm', px: 12 },
  { name: 'ds-device-space-md', px: 16 },
  { name: 'ds-device-space-md-mobile', px: 15 },
  { name: 'ds-global-dimension-space-20', px: 20 },
  { name: 'ds-alias-surface-green', color: 'rgb(168, 224, 215)' },
  { name: 'ds-global-color-green-3', color: 'rgb(168, 224, 215)' },
  { name: 'ds-alias-surface-white', color: 'rgb(255, 255, 255)' },
]

describe('familyOf', () => {
  it.each([
    ['padding-top', 'space'],
    ['column-gap', 'space'],
    ['border-top-left-radius', 'radius'],
    ['font-size', 'text-size'],
    ['border-bottom-width', 'border-width'],
    ['background-color', 'surface'],
    ['color', 'text-color'],
    ['outline-color', 'border-color'],
    ['display', null],
  ])('%s → %s', (prop, family) => expect(familyOf(prop)).toBe(family))
})

describe('snapPx', () => {
  const space = candidatesFor('space', tokens)

  it('drops retired per-device tokens', () => {
    expect(space.map(t => t.name)).not.toContain('ds-device-space-md-mobile')
  })
  it('exact match is a token', () => {
    expect(snapPx(16, space)).toMatchObject({ token: 'ds-device-space-md', status: 'token', delta: 0 })
  })
  it('within ±2px is drift', () => {
    expect(snapPx(14.5, space)).toMatchObject({ token: 'ds-device-space-md', status: 'drift', delta: -1.5 })
  })
  it('beyond ±2px is no-token but names the nearest', () => {
    expect(snapPx(40, space)).toMatchObject({
      token: null,
      status: 'no-token',
      nearest: 'ds-global-dimension-space-20',
    })
  })
  it('flags a Global-layer match', () => {
    expect(snapPx(20, space)).toMatchObject({ status: 'token', global: true })
  })
  it('snaps negative gutters on |px|', () => {
    expect(snapPx(-16, space)).toMatchObject({ token: 'ds-device-space-md', status: 'token', negative: true })
  })
  it('breaks a same-value tie by the property group', () => {
    const tied = candidatesFor('space', [
      { name: 'ds-alias-space-gap-lg', px: 24 },
      { name: 'ds-alias-space-padding-md', px: 24 },
    ])
    expect(snapPx(24, tied, { prefer: preferFor('padding-top') }).token).toBe('ds-alias-space-padding-md')
    expect(snapPx(24, tied, { prefer: preferFor('column-gap') }).token).toBe('ds-alias-space-gap-lg')
  })
})

describe('color', () => {
  it('parses rgb, rgba and hex', () => {
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3, 1])
    expect(parseColor('rgba(1, 2, 3, 0.5)')).toEqual([1, 2, 3, 0.5])
    expect(parseColor('#ff0000')).toEqual([255, 0, 0, 1])
  })
  it('ΔE is 0 for equal colors and ~100 for black/white', () => {
    expect(deltaE([10, 20, 30], [10, 20, 30])).toBe(0)
    expect(deltaE([0, 0, 0], [255, 255, 255])).toBeCloseTo(100, 0)
  })
  it('prefers the Alias token over an equal Global one', () => {
    const surface = candidatesFor('surface', tokens)
    expect(snapColor('rgb(168, 224, 215)', surface)).toMatchObject({
      token: 'ds-alias-surface-green',
      status: 'token',
      global: false,
    })
  })
  it('a clearly different color is no-token', () => {
    expect(snapColor('rgb(200, 0, 0)', candidatesFor('surface', tokens)).status).toBe('no-token')
  })
  it('WCAG contrast', () => {
    expect(contrast('rgb(0, 0, 0)', 'rgb(255, 255, 255)')).toBe(21)
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 1)
  })
  it('brand siblings keep the shade suffix', () => {
    expect(brandSiblings('ds-alias-surface-green-light')).toEqual({
      green: 'ds-alias-surface-green-light',
      purple: 'ds-alias-surface-purple-light',
      red: 'ds-alias-surface-red-light',
      yellow: 'ds-alias-surface-yellow-light',
    })
    expect(brandSiblings('ds-alias-surface-white')).toBeNull()
  })
})
