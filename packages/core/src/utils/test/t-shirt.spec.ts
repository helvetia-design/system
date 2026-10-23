import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { normalizeDeprecatedTShirtSize, toShortTShirtSize } from '../t-shirt'

describe('normalizeDeprecatedTShirtSize', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each([
    ['xx-small', '2xs'],
    ['x-small', 'xs'],
    ['small', 'sm'],
    ['normal', 'base'],
    ['medium', 'md'],
    ['large', 'lg'],
    ['x-large', 'xl'],
    ['xx-large', '2xl'],
  ])('maps the deprecated value "%s" to "%s" and warns', (verbose, short) => {
    expect(normalizeDeprecatedTShirtSize(verbose)).toBe(short)
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  test('passes short values through without a warning', () => {
    expect(normalizeDeprecatedTShirtSize('2xs')).toBe('2xs')
    expect(normalizeDeprecatedTShirtSize('2xl')).toBe('2xl')
    expect(console.warn).not.toHaveBeenCalled()
  })

  test('passes unknown values through unchanged', () => {
    expect(normalizeDeprecatedTShirtSize('xxl')).toBe('xxl')
  })

  test('returns empty values unchanged', () => {
    expect(normalizeDeprecatedTShirtSize(undefined)).toBeUndefined()
    expect(normalizeDeprecatedTShirtSize(null)).toBeNull()
    expect(normalizeDeprecatedTShirtSize('')).toBe('')
  })
})

describe('toShortTShirtSize', () => {
  test('resolves xx-small to 2xs, not 3xs', () => {
    expect(toShortTShirtSize('xx-small')).toBe('2xs')
  })

  test('returns unknown values unchanged', () => {
    expect(toShortTShirtSize('2xl')).toBe('2xl')
  })
})
