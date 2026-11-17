import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { tokenNameToCssVar as realTokenNameToCssVar } from '../../../packages/tokens/src/css-naming.ts'
import { buildCssVarIndex, resolveCssVars, tokenNameToCssVar } from '../lib/css-token-lookup.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_TOKENS_PATH = resolve(__dirname, '../../../packages/tokens/tokens/Base.tokens.json')

describe('tokenNameToCssVar', () => {
  it('matches the real packages/tokens/src/css-naming.ts implementation it duplicates', () => {
    const samples = [
      ['🧩 Component', 'Spinner', 'Circle', 'Primary', 'Background'],
      ['🔗 Alias', '🔤 Text', 'LineHeight', 'Text'],
      ['📱 Device', '↔️ Space', '2XS'],
      ['🧩 Component', 'Logo', 'Size', 'Base'],
      ['🌐 Global', '📏 Dimension', 'Radius', '12'],
    ]
    for (const path of samples) {
      expect(tokenNameToCssVar(path)).toBe(realTokenNameToCssVar(path))
    }
  })
})

describe('buildCssVarIndex / resolveCssVars', () => {
  const index = buildCssVarIndex(BASE_TOKENS_PATH)

  it('resolves a plain component token to its real Figma variable id', () => {
    const [entry] = resolveCssVars(index, ['--ds-spinner-circle-primary-background'])
    expect(entry).not.toBeNull()
    expect(entry.variableId).toMatch(/^VariableID:/)
    expect(entry.path).toEqual(['🧩 Component', 'Spinner', 'Circle', 'Primary', 'Background'])
  })

  it("resolves a responsive-dimension token's breakpoint-suffixed CSS vars to each sibling id", () => {
    const [mobile, desktop, bare] = resolveCssVars(index, [
      '--ds-logo-size-base-mobile',
      '--ds-logo-size-base-desktop',
      '--ds-logo-size-base',
    ])
    expect(mobile.variableId).toMatch(/^VariableID:/)
    expect(desktop.variableId).toMatch(/^VariableID:/)
    expect(mobile.variableId).not.toBe(desktop.variableId)
    expect(bare.variableId).toEqual({
      mobile: mobile.variableId,
      tablet: expect.any(String),
      desktop: desktop.variableId,
    })
  })

  it('returns null for a CSS var with no matching token', () => {
    const [entry] = resolveCssVars(index, ['--ds-this-does-not-exist'])
    expect(entry).toBeNull()
  })

  it('accepts the var name with or without a leading --', () => {
    const [withDashes] = resolveCssVars(index, ['--ds-spinner-circle-primary-background'])
    const [withoutDashes] = resolveCssVars(index, ['ds-spinner-circle-primary-background'])
    expect(withoutDashes).toEqual(withDashes)
  })
})
