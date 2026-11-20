import { deserializeBooleanAttribute } from '../attributes'

describe('deserializeBooleanAttribute', () => {
  test('returns booleans unchanged', () => {
    expect(deserializeBooleanAttribute(true)).toBe(true)
    expect(deserializeBooleanAttribute(false)).toBe(false)
  })

  test('returns false for null and undefined', () => {
    expect(deserializeBooleanAttribute(null)).toBe(false)
    expect(deserializeBooleanAttribute(undefined)).toBe(false)
  })

  test('returns false for the string "false"', () => {
    expect(deserializeBooleanAttribute('false')).toBe(false)
  })

  test('returns true for an empty string and "true"', () => {
    expect(deserializeBooleanAttribute('')).toBe(true)
    expect(deserializeBooleanAttribute('true')).toBe(true)
  })
})
