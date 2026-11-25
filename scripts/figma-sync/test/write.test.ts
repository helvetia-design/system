import { describe, expect, it } from 'vitest'
import { buildTokenIndex } from '../lib/alias.mjs'
import { buildNameIndex, findCollectionAndModes, findResponsiveCollectionAndModes } from '../lib/figma.mjs'
import {
  figmaBorderSubEntriesFor,
  figmaLineHeightPercentFor,
  figmaResponsiveDimensionSubEntriesFor,
  figmaShadowSubValuesFor,
  figmaTypographySubEntriesFor,
  figmaValueFor,
  flattenVariableId,
  isLineHeightNumberToken,
  resolvedTypeFor,
  resolvedTypeForToken,
} from '../lib/figma-value.mjs'
import {
  assignVariableIds,
  buildAliasPassPayload,
  buildCreatePassPayload,
  buildDescriptionUpdatePayload,
  buildNameUpdatePayload,
  collectNewlyCreatedIds,
  dropUnknownVariableIds,
  figmaBorderSubVariableName,
  figmaResponsiveDimensionSubVariableName,
  figmaShadowSubVariableName,
  figmaTypographySubVariableName,
  figmaVariableName,
  findResolvedTypeMismatches,
  isLikelyDifferentFigmaFile,
  resolveTempIds,
} from '../lib/write.mjs'

describe('figma-value', () => {
  it('maps a DTCG color to a Figma RGBA value (components already 0-1 srgb floats)', () => {
    expect(figmaValueFor('color', { colorSpace: 'srgb', components: [1, 0.5, 0], alpha: 0.8, hex: '#FF8000' })).toEqual(
      {
        r: 1,
        g: 0.5,
        b: 0,
        a: 0.8,
      },
    )
  })

  it('passes number/string/boolean straight through', () => {
    expect(figmaValueFor('number', 16)).toBe(16)
    expect(figmaValueFor('string', '0 2px 8px rgba(0,0,0,0.1)')).toBe('0 2px 8px rgba(0,0,0,0.1)')
    expect(figmaValueFor('boolean', true)).toBe(true)
  })

  it("maps a fontWeight number to its DTCG keyword — Figma needs the font's named style, not a number", () => {
    expect(figmaValueFor('fontWeight', 100)).toBe('Thin')
    expect(figmaValueFor('fontWeight', 400)).toBe('Regular')
    expect(figmaValueFor('fontWeight', 700)).toBe('Bold')
    expect(figmaValueFor('fontWeight', 950)).toBe('Extra-Black')
  })

  it('fails loudly on a fontWeight value outside the 10 known weights', () => {
    expect(() => figmaValueFor('fontWeight', 650)).toThrow(/Unsupported fontWeight value "650"/)
  })

  it('sends only the first entry of a fontFamily array — Figma has no font-stack concept', () => {
    expect(figmaValueFor('fontFamily', ['Baloise Create Headline', 'Arial', 'sans-serif'])).toBe(
      'Baloise Create Headline',
    )
    expect(figmaValueFor('fontFamily', ['inherit'])).toBe('inherit')
  })

  it('fails loudly on an empty or non-array fontFamily value', () => {
    expect(() => figmaValueFor('fontFamily', [])).toThrow(/Unsupported fontFamily value/)
    expect(() => figmaValueFor('fontFamily', 'Arial')).toThrow(/Unsupported fontFamily value/)
  })

  it('maps a rem-unit dimension to px by multiplying by 16 — Figma is always raw px floats', () => {
    expect(figmaValueFor('dimension', { value: 1.5, unit: 'rem' })).toBe(24)
    expect(figmaValueFor('dimension', { value: 0.0625, unit: 'rem' })).toBe(1)
  })

  it('passes a px-unit dimension straight through, unconverted', () => {
    expect(figmaValueFor('dimension', { value: 769, unit: 'px' })).toBe(769)
    expect(figmaValueFor('dimension', { value: 9999, unit: 'px' })).toBe(9999)
  })

  it('fails loudly on a malformed dimension value', () => {
    expect(() => figmaValueFor('dimension', { value: 1.5, unit: 'em' })).toThrow(/Unsupported dimension value/)
    expect(() => figmaValueFor('dimension', 24)).toThrow(/Unsupported dimension value/)
  })

  it('fails loudly on an unmapped $type instead of guessing', () => {
    expect(() => figmaValueFor('duration', '200ms')).toThrow(/Unsupported token \$type "duration"/)
  })

  it('maps $type to the matching Figma resolvedType', () => {
    expect(resolvedTypeFor('color')).toBe('COLOR')
    expect(resolvedTypeFor('number')).toBe('FLOAT')
    expect(resolvedTypeFor('string')).toBe('STRING')
    expect(resolvedTypeFor('boolean')).toBe('BOOLEAN')
  })

  it('maps fontWeight to STRING, same as string — Figma has no native font-weight type', () => {
    expect(resolvedTypeFor('fontWeight')).toBe('STRING')
  })

  it('maps dimension to FLOAT, same as number — Figma variables are always raw px floats', () => {
    expect(resolvedTypeFor('dimension')).toBe('FLOAT')
  })

  it('maps fontFamily to STRING too — Figma has no font-stack/array type', () => {
    expect(resolvedTypeFor('fontFamily')).toBe('STRING')
  })
})

describe('isLineHeightNumberToken / figmaLineHeightPercentFor', () => {
  it('recognizes a number token as LineHeight whenever "LineHeight" appears anywhere in its path', () => {
    expect(isLineHeightNumberToken({ type: 'number', path: ['🌐 Global', '🔤 Font', 'LineHeight', '2'] })).toBe(true)
    expect(isLineHeightNumberToken({ type: 'number', path: ['🔗 Alias', '🔤 Text', 'LineHeight', 'Single'] })).toBe(
      true,
    )
    expect(isLineHeightNumberToken({ type: 'number', path: ['🧩 Component', 'Badge', 'Typo', 'LineHeight'] })).toBe(
      true,
    )
  })

  it('does not flag a same-type number token with no "LineHeight" in its path, e.g. Opacity', () => {
    expect(isLineHeightNumberToken({ type: 'number', path: ['🔗 Alias', '🌫️ Opacity', 'Half'] })).toBe(false)
  })

  it('does not flag a non-number token even if "LineHeight" is in its path', () => {
    expect(isLineHeightNumberToken({ type: 'string', path: ['🌐 Global', 'LineHeight'] })).toBe(false)
  })

  it("converts a raw CSS-style multiplier into Figma's percentage string", () => {
    expect(figmaLineHeightPercentFor(1)).toBe('100%')
    expect(figmaLineHeightPercentFor(1.3)).toBe('130%')
    expect(figmaLineHeightPercentFor(1.5)).toBe('150%')
    expect(figmaLineHeightPercentFor(2)).toBe('200%')
  })

  it('drops float noise instead of leaking it into the string', () => {
    expect(figmaLineHeightPercentFor(1.15)).toBe('115%')
    expect(figmaLineHeightPercentFor(1.3333)).toBe('133.33%')
  })

  it('maps a LineHeight number token to a STRING variable, any other number token to FLOAT', () => {
    expect(resolvedTypeForToken({ type: 'number', path: ['🌐 Global', 'LineHeight', '2'] })).toBe('STRING')
    expect(resolvedTypeForToken({ type: 'number', path: ['🔗 Alias', 'Opacity', 'Half'] })).toBe('FLOAT')
  })

  it('throws on a non-number value', () => {
    expect(() => figmaLineHeightPercentFor('1.3')).toThrow(/Unsupported LineHeight value/)
  })
})

describe('figmaShadowSubValuesFor', () => {
  const singleLayer = {
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.15, hex: '#000000' },
    offsetX: { value: 0, unit: 'rem' },
    offsetY: { value: 0.25, unit: 'rem' },
    blur: { value: 0.75, unit: 'rem' },
    spread: { value: 0, unit: 'rem' },
  }

  it('decomposes a single-layer shadow into 5 Figma-ready sub-values, converting dimensions to px', () => {
    expect(figmaShadowSubValuesFor(singleLayer)).toEqual({
      offsetX: 0,
      offsetY: 4,
      blur: 12,
      spread: 0,
      color: { r: 0, g: 0, b: 0, a: 0.15 },
    })
  })

  it('decomposes a multi-layer (array) shadow using its first layer only — a lossy approximation, not a null', () => {
    const secondLayer = { ...singleLayer, offsetY: { value: 1, unit: 'rem' } }
    expect(figmaShadowSubValuesFor([singleLayer, secondLayer])).toEqual({
      offsetX: 0,
      offsetY: 4,
      blur: 12,
      spread: 0,
      color: { r: 0, g: 0, b: 0, a: 0.15 },
    })
  })

  it('decomposes the empty-array "none" shadow into an all-zero, fully transparent layer', () => {
    expect(figmaShadowSubValuesFor([])).toEqual({
      offsetX: 0,
      offsetY: 0,
      blur: 0,
      spread: 0,
      color: { r: 0, g: 0, b: 0, a: 0 },
    })
  })
})

describe('flattenVariableId', () => {
  it('wraps a normal string variableId in a single untagged entry', () => {
    expect(flattenVariableId('VariableID:1:1')).toEqual([{ id: 'VariableID:1:1', subProperty: undefined }])
  })

  it('flattens a shadow variableId object into 5 tagged entries', () => {
    const id = { offsetX: 'id-x', offsetY: 'id-y', blur: 'id-b', spread: 'id-s', color: 'id-c' }
    expect(flattenVariableId(id)).toEqual([
      { id: 'id-x', subProperty: 'offsetX' },
      { id: 'id-y', subProperty: 'offsetY' },
      { id: 'id-b', subProperty: 'blur' },
      { id: 'id-s', subProperty: 'spread' },
      { id: 'id-c', subProperty: 'color' },
    ])
  })

  it('flattens a border variableId object into 3 tagged entries', () => {
    const id = { color: 'id-c', width: 'id-w', style: 'id-s' }
    expect(flattenVariableId(id)).toEqual([
      { id: 'id-c', subProperty: 'color' },
      { id: 'id-w', subProperty: 'width' },
      { id: 'id-s', subProperty: 'style' },
    ])
  })

  it('flattens a typography variableId object into 4 tagged entries', () => {
    const id = { fontFamily: 'id-ff', fontSize: 'id-fs', fontWeight: 'id-fw', lineHeight: 'id-lh' }
    expect(flattenVariableId(id)).toEqual([
      { id: 'id-ff', subProperty: 'fontFamily' },
      { id: 'id-fs', subProperty: 'fontSize' },
      { id: 'id-fw', subProperty: 'fontWeight' },
      { id: 'id-lh', subProperty: 'lineHeight' },
    ])
  })

  it('returns an empty list for a missing/undefined variableId', () => {
    expect(flattenVariableId(undefined)).toEqual([])
  })
})

describe('figmaBorderSubEntriesFor', () => {
  // Unlike shadow, a border token's color/width/style are each typically a {reference} string
  // pointing at a real primitive token — figmaBorderSubEntriesFor tags each as 'reference' (so
  // write.mjs's pass 2 can alias straight to that primitive's own variable) rather than resolving
  // it to a literal.
  const borderValue = {
    color: '{Alias.Border.Color.Grey}',
    width: '{Alias.Border.Width.Base}',
    style: '{Alias.Border.Style.Solid}',
  }

  it('tags a {reference}-string sub-value as a reference, without resolving it', () => {
    expect(figmaBorderSubEntriesFor(borderValue)).toEqual({
      color: { kind: 'reference', path: ['Alias', 'Border', 'Color', 'Grey'] },
      width: { kind: 'reference', path: ['Alias', 'Border', 'Width', 'Base'] },
      style: { kind: 'reference', path: ['Alias', 'Border', 'Style', 'Solid'] },
    })
  })

  it('tags an already-literal sub-value as a literal, converting width to px', () => {
    expect(
      figmaBorderSubEntriesFor({
        color: { colorSpace: 'srgb', components: [0.816, 0.816, 0.816], alpha: 1, hex: '#D0D0D0' },
        width: { value: 0.125, unit: 'rem' },
        style: 'solid',
      }),
    ).toEqual({
      color: { kind: 'literal', value: { r: 0.816, g: 0.816, b: 0.816, a: 1 } },
      width: { kind: 'literal', value: 2 },
      style: { kind: 'literal', value: 'solid' },
    })
  })

  it('returns null for a malformed value (missing sub-value)', () => {
    expect(figmaBorderSubEntriesFor({ color: borderValue.color, width: borderValue.width })).toBeNull()
  })

  it('returns null when a literal style is not a string', () => {
    expect(figmaBorderSubEntriesFor({ ...borderValue, style: 5 })).toBeNull()
  })
})

describe('figmaTypographySubEntriesFor', () => {
  // fontFamily/fontWeight are always {reference} strings (docs/plans/typography-token-type-
  // plan.md decision 4) — tagged 'reference' rather than resolved, same policy as border's
  // sub-values. fontSize/lineHeight are free literal-or-reference; this fixture exercises both
  // shapes (fontSize a literal, lineHeight a reference).
  const familyToken = {
    path: ['Global', 'Font', 'Family', 'Heading'],
    type: 'fontFamily',
    value: { kind: 'literal', value: ['Baloise Create Headline', 'Arial', 'sans-serif'] },
  }
  const weightToken = {
    path: ['Global', 'Font', 'Weight', '700'],
    type: 'fontWeight',
    value: { kind: 'literal', value: 700 },
  }
  const lineHeightToken = {
    path: ['Global', 'Font', 'LineHeight', '2'],
    type: 'number',
    value: { kind: 'literal', value: 1.3 },
  }
  const letterSpacingToken = {
    path: ['Global', 'Font', 'LetterSpacing', '0'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 0, unit: 'rem' } },
  }
  const decorationToken = {
    path: ['Global', 'Font', 'TextDecoration', 'None'],
    type: 'textDecoration',
    value: { kind: 'literal', value: 'none' },
  }
  const transformToken = {
    path: ['Global', 'Font', 'TextTransform', 'Uppercase'],
    type: 'textTransform',
    value: { kind: 'literal', value: 'uppercase' },
  }
  const tokenIndex = buildTokenIndex([
    familyToken,
    weightToken,
    lineHeightToken,
    letterSpacingToken,
    decorationToken,
    transformToken,
  ])

  const typographyValue = {
    fontFamily: '{Global.Font.Family.Heading}',
    fontSize: { value: 16, unit: 'px' },
    fontWeight: '{Global.Font.Weight.700}',
    lineHeight: '{Global.Font.LineHeight.2}',
    letterSpacing: '{Global.Font.LetterSpacing.0}',
    textDecoration: '{Global.Font.TextDecoration.None}',
    textTransform: '{Global.Font.TextTransform.Uppercase}',
  }

  it('tags each {reference}-string sub-value as a reference, except letterSpacing (always computed) and the literal fontSize', () => {
    expect(figmaTypographySubEntriesFor(typographyValue, tokenIndex)).toEqual({
      fontFamily: { kind: 'reference', path: ['Global', 'Font', 'Family', 'Heading'] },
      fontSize: { kind: 'literal', value: 16 },
      fontWeight: { kind: 'reference', path: ['Global', 'Font', 'Weight', '700'] },
      lineHeight: { kind: 'reference', path: ['Global', 'Font', 'LineHeight', '2'] },
      letterSpacing: { kind: 'literal', value: '0%' },
      textDecoration: { kind: 'reference', path: ['Global', 'Font', 'TextDecoration', 'None'] },
      textTransform: { kind: 'reference', path: ['Global', 'Font', 'TextTransform', 'Uppercase'] },
    })
  })

  it('expresses a non-zero letter-spacing as a percentage of the literal font size, always as a literal', () => {
    // 0.2rem = 3.2px, against a 16px font = 20%
    const value = { ...typographyValue, letterSpacing: { value: 0.2, unit: 'rem' } }
    expect(figmaTypographySubEntriesFor(value, tokenIndex).letterSpacing).toEqual({ kind: 'literal', value: '20%' })
  })

  it("uses the referenced responsive font size's desktop breakpoint, not its mobile-mirroring $value", () => {
    const responsiveSize = {
      path: ['Device', 'Text', 'Size', 'SM'],
      type: 'dimension',
      value: { kind: 'literal', value: { value: 12, unit: 'px' } }, // mirrors mobile
      responsive: {
        mobile: { value: 12, unit: 'px' },
        tablet: { value: 14, unit: 'px' },
        desktop: { value: 32, unit: 'px' },
      },
    }
    const index = buildTokenIndex([...tokenIndex.values(), responsiveSize])
    const value = { ...typographyValue, fontSize: '{Device.Text.Size.SM}', letterSpacing: { value: 0.2, unit: 'rem' } }
    // 3.2px / 32px (desktop) = 10%, not 3.2 / 12 = 26.6667%
    expect(figmaTypographySubEntriesFor(value, index).letterSpacing).toEqual({ kind: 'literal', value: '10%' })
  })

  it('returns null for a malformed value (missing sub-value)', () => {
    expect(
      figmaTypographySubEntriesFor(
        { fontFamily: typographyValue.fontFamily, fontSize: typographyValue.fontSize },
        tokenIndex,
      ),
    ).toBeNull()
  })

  it.each(['letterSpacing', 'textDecoration', 'textTransform'])(
    'returns null when the required %s sub-value is missing',
    field => {
      expect(figmaTypographySubEntriesFor({ ...typographyValue, [field]: undefined }, tokenIndex)).toBeNull()
    },
  )

  it('returns null when a literal lineHeight does not resolve to a number', () => {
    expect(figmaTypographySubEntriesFor({ ...typographyValue, lineHeight: 'not-a-number' }, tokenIndex)).toBeNull()
  })

  it('tags even a reference to a non-LineHeight-shaped token as a reference, untyped-checked here (same single-hop-trust policy as border)', () => {
    const stringLineHeightToken = { path: ['Global', 'Bad'], type: 'string', value: { kind: 'literal', value: 'nope' } }
    const badIndex = buildTokenIndex([
      familyToken,
      weightToken,
      stringLineHeightToken,
      letterSpacingToken,
      decorationToken,
      transformToken,
    ])
    expect(
      figmaTypographySubEntriesFor({ ...typographyValue, lineHeight: '{Global.Bad}' }, badIndex).lineHeight,
    ).toEqual({ kind: 'reference', path: ['Global', 'Bad'] })
  })
})

describe('figmaResponsiveDimensionSubEntriesFor', () => {
  // mobile/tablet/desktop are each free literal-or-reference (docs/plans/responsive-dimension-
  // token-plan.md decision 3) — this fixture exercises both shapes (mobile a reference, tablet/
  // desktop literals). Unlike border/typography's sub-values, a direct reference here stays a
  // reference (bound as a Figma VARIABLE_ALIAS to the target's own variable) rather than being
  // flattened through to a copy of its value.
  const responsiveValue = {
    mobile: '{Global.Dimension.Space.16}',
    tablet: { value: 24, unit: 'px' },
    desktop: { value: 32, unit: 'px' },
  }

  it('splits a responsive dimension value into per-breakpoint reference/literal entries, converting literal rem->px', () => {
    expect(figmaResponsiveDimensionSubEntriesFor(responsiveValue)).toEqual({
      mobile: { kind: 'reference', path: ['Global', 'Dimension', 'Space', '16'] },
      tablet: { kind: 'literal', value: 24 },
      desktop: { kind: 'literal', value: 32 },
    })
  })

  it('returns null for a non-object value', () => {
    expect(figmaResponsiveDimensionSubEntriesFor(null)).toBeNull()
    expect(figmaResponsiveDimensionSubEntriesFor('nope')).toBeNull()
  })
})

describe('LineHeight number token push (two-pass write payload)', () => {
  const lineHeightToken = {
    path: ['🌐 Global', '🔤 Font', 'LineHeight', '2'],
    type: 'number',
    value: { kind: 'literal', value: 1.3 },
  }
  const opacityToken = {
    path: ['🔗 Alias', '🌫️ Opacity', 'Half'],
    type: 'number',
    value: { kind: 'literal', value: 0.5 },
  }
  const tokens = [lineHeightToken, opacityToken]

  it("writes a LineHeight number token's mode-value as a percentage string, but leaves a same-type Opacity token unscaled", () => {
    const idByPath = assignVariableIds(tokens)
    const { variableModeValues } = buildCreatePassPayload({
      baseTokens: tokens,
      brandTokensByName: { Base: tokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })
    const byId = Object.fromEntries(variableModeValues.map(v => [v.variableId, v.value]))
    expect(byId[idByPath.get('🌐 Global.🔤 Font.LineHeight.2')]).toBe('130%')
    expect(byId[idByPath.get('🔗 Alias.🌫️ Opacity.Half')]).toBe(0.5)
  })
})

describe('shadow push (two-pass write payload)', () => {
  const shadowValue = {
    color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.15, hex: '#000000' },
    offsetX: { value: 0, unit: 'rem' },
    offsetY: { value: 0.25, unit: 'rem' },
    blur: { value: 0.75, unit: 'rem' },
    spread: { value: 0, unit: 'rem' },
  }
  const shadowToken = {
    path: ['Global', 'Shadow', 'Base'],
    type: 'shadow',
    value: { kind: 'literal', value: shadowValue },
  }
  const shadowRefToken = {
    path: ['Alias', 'Shadow', 'Base'],
    type: 'shadow',
    value: { kind: 'reference', path: ['Global', 'Shadow', 'Base'] },
  }
  const multiLayerToken = {
    path: ['Global', 'Shadow', 'Stacked'],
    type: 'shadow',
    value: { kind: 'literal', value: [shadowValue, shadowValue] },
  }
  const noneToken = {
    path: ['Global', 'Shadow', 'None'],
    type: 'shadow',
    value: { kind: 'literal', value: [] },
  }
  const shadowBaseTokens = [shadowToken, shadowRefToken, multiLayerToken, noneToken]

  it('assigns 5 temp sub-ids to a never-synced single-layer shadow token', () => {
    const idByPath = assignVariableIds(shadowBaseTokens)
    expect(idByPath.get('Global.Shadow.Base')).toEqual({
      offsetX: 'temp-Global.Shadow.Base-offsetX',
      offsetY: 'temp-Global.Shadow.Base-offsetY',
      blur: 'temp-Global.Shadow.Base-blur',
      spread: 'temp-Global.Shadow.Base-spread',
      color: 'temp-Global.Shadow.Base-color',
    })
  })

  it('assigns 5 temp sub-ids to a multi-layer or empty-array shadow token too — every shadow shape is now eligible for sync', () => {
    const idByPath = assignVariableIds(shadowBaseTokens)
    expect(idByPath.get('Global.Shadow.Stacked')).toEqual({
      offsetX: 'temp-Global.Shadow.Stacked-offsetX',
      offsetY: 'temp-Global.Shadow.Stacked-offsetY',
      blur: 'temp-Global.Shadow.Stacked-blur',
      spread: 'temp-Global.Shadow.Stacked-spread',
      color: 'temp-Global.Shadow.Stacked-color',
    })
    expect(idByPath.get('Global.Shadow.None')).toEqual({
      offsetX: 'temp-Global.Shadow.None-offsetX',
      offsetY: 'temp-Global.Shadow.None-offsetY',
      blur: 'temp-Global.Shadow.None-blur',
      spread: 'temp-Global.Shadow.None-spread',
      color: 'temp-Global.Shadow.None-color',
    })
  })

  it('pass 1 creates 5 named sub-variables for a temp single-layer shadow token, with the right resolvedType each', () => {
    const idByPath = assignVariableIds(shadowBaseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens: shadowBaseTokens,
      brandTokensByName: { Base: shadowBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    // 20, not 5 — the reference token (Alias.Shadow.Base), the multi-layer token, and the
    // empty-array token are each their own temp shadow token too and get their own 5 variables
    // created, same as any other reference/array type (a reference aliases to the target in pass
    // 2, but still needs its own variables to exist first; the array shapes are now syncable too).
    expect(variables).toHaveLength(20)
    const literalVariables = variables.filter(v => v.name.startsWith('Global/Shadow/Base/'))
    expect(literalVariables.map(v => v.name)).toEqual([
      'Global/Shadow/Base/OffsetX',
      'Global/Shadow/Base/OffsetY',
      'Global/Shadow/Base/Blur',
      'Global/Shadow/Base/Spread',
      'Global/Shadow/Base/Color',
    ])
    expect(literalVariables.map(v => v.resolvedType)).toEqual(['FLOAT', 'FLOAT', 'FLOAT', 'FLOAT', 'COLOR'])
    expect(figmaShadowSubVariableName(shadowToken.path, 'color')).toBe('Global/Shadow/Base/Color')
  })

  it('pass 1 writes 5 literal mode-values each for the single-layer, multi-layer, and empty-array shadow tokens, none for the reference', () => {
    const idByPath = assignVariableIds(shadowBaseTokens)
    const { variableModeValues } = buildCreatePassPayload({
      baseTokens: shadowBaseTokens,
      brandTokensByName: { Base: shadowBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variableModeValues).toHaveLength(15)
    const byId = Object.fromEntries(variableModeValues.map(v => [v.variableId, v.value]))
    expect(byId['temp-Global.Shadow.Base-offsetY']).toBe(4)
    expect(byId['temp-Global.Shadow.Base-color']).toEqual({ r: 0, g: 0, b: 0, a: 0.15 })
    // Stacked (multi-layer) decomposes its first layer only, same values as Base's single layer.
    expect(byId['temp-Global.Shadow.Stacked-offsetY']).toBe(4)
    expect(byId['temp-Global.Shadow.Stacked-color']).toEqual({ r: 0, g: 0, b: 0, a: 0.15 })
    // None (empty array) decomposes to an all-zero, fully transparent layer.
    expect(byId['temp-Global.Shadow.None-offsetY']).toBe(0)
    expect(byId['temp-Global.Shadow.None-color']).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })

  it('pass 2 writes 5 alias mode-values for a shadow reference, each pointing at the matching sub-property of the target', () => {
    const idByPath = assignVariableIds(shadowBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Global.Shadow.Base-offsetX': 'real-x',
      'temp-Global.Shadow.Base-offsetY': 'real-y',
      'temp-Global.Shadow.Base-blur': 'real-b',
      'temp-Global.Shadow.Base-spread': 'real-s',
      'temp-Global.Shadow.Base-color': 'real-c',
      'temp-Alias.Shadow.Base-offsetX': 'real-alias-x',
      'temp-Alias.Shadow.Base-offsetY': 'real-alias-y',
      'temp-Alias.Shadow.Base-blur': 'real-alias-b',
      'temp-Alias.Shadow.Base-spread': 'real-alias-s',
      'temp-Alias.Shadow.Base-color': 'real-alias-c',
    })

    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: shadowBaseTokens,
      brandTokensByName: { Base: shadowBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variableModeValues).toHaveLength(5)
    const colorAlias = variableModeValues.find(v => v.variableId === 'real-alias-c')
    expect(colorAlias.value).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-c' })
  })

  it('collectNewlyCreatedIds returns the whole 5-id object as one entry for each shadow token, including the multi-layer and empty-array ones', () => {
    const idByPath = assignVariableIds(shadowBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Global.Shadow.Base-offsetX': 'real-x',
      'temp-Global.Shadow.Base-offsetY': 'real-y',
      'temp-Global.Shadow.Base-blur': 'real-b',
      'temp-Global.Shadow.Base-spread': 'real-s',
      'temp-Global.Shadow.Base-color': 'real-c',
      'temp-Global.Shadow.Stacked-offsetX': 'real-stacked-x',
      'temp-Global.Shadow.Stacked-offsetY': 'real-stacked-y',
      'temp-Global.Shadow.Stacked-blur': 'real-stacked-b',
      'temp-Global.Shadow.Stacked-spread': 'real-stacked-s',
      'temp-Global.Shadow.Stacked-color': 'real-stacked-c',
      'temp-Global.Shadow.None-offsetX': 'real-none-x',
      'temp-Global.Shadow.None-offsetY': 'real-none-y',
      'temp-Global.Shadow.None-blur': 'real-none-b',
      'temp-Global.Shadow.None-spread': 'real-none-s',
      'temp-Global.Shadow.None-color': 'real-none-c',
    })

    const created = collectNewlyCreatedIds([shadowToken, multiLayerToken, noneToken], idByPath)
    expect(created).toEqual([
      {
        path: shadowToken.path,
        variableId: { offsetX: 'real-x', offsetY: 'real-y', blur: 'real-b', spread: 'real-s', color: 'real-c' },
      },
      {
        path: multiLayerToken.path,
        variableId: {
          offsetX: 'real-stacked-x',
          offsetY: 'real-stacked-y',
          blur: 'real-stacked-b',
          spread: 'real-stacked-s',
          color: 'real-stacked-c',
        },
      },
      {
        path: noneToken.path,
        variableId: {
          offsetX: 'real-none-x',
          offsetY: 'real-none-y',
          blur: 'real-none-b',
          spread: 'real-none-s',
          color: 'real-none-c',
        },
      },
    ])
  })
})

describe('border push (two-pass write payload)', () => {
  const colorPrimitive = {
    path: ['Alias', 'Border', 'Color', 'Grey'],
    type: 'color',
    value: {
      kind: 'literal',
      value: { colorSpace: 'srgb', components: [0.816, 0.816, 0.816], alpha: 1, hex: '#D0D0D0' },
    },
  }
  const widthPrimitive = {
    path: ['Alias', 'Border', 'Width', 'Base'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 0.125, unit: 'rem' } },
  }
  const stylePrimitive = {
    path: ['Alias', 'Border', 'Style', 'Solid'],
    type: 'string',
    value: { kind: 'literal', value: 'solid' },
  }
  const borderToken = {
    path: ['Alias', 'Border', 'Composite', 'Grey'],
    type: 'border',
    value: {
      kind: 'literal',
      value: {
        color: '{Alias.Border.Color.Grey}',
        width: '{Alias.Border.Width.Base}',
        style: '{Alias.Border.Style.Solid}',
      },
    },
  }
  const borderRefToken = {
    path: ['Zurich', 'Border', 'Composite', 'Grey'],
    type: 'border',
    value: { kind: 'reference', path: ['Alias', 'Border', 'Composite', 'Grey'] },
  }
  const borderBaseTokens = [colorPrimitive, widthPrimitive, stylePrimitive, borderToken, borderRefToken]

  it('assigns 3 temp sub-ids to a never-synced border token', () => {
    const idByPath = assignVariableIds(borderBaseTokens)
    expect(idByPath.get('Alias.Border.Composite.Grey')).toEqual({
      color: 'temp-Alias.Border.Composite.Grey-color',
      width: 'temp-Alias.Border.Composite.Grey-width',
      style: 'temp-Alias.Border.Composite.Grey-style',
    })
  })

  it('pass 1 creates 3 named sub-variables for a temp border token, with the right resolvedType each', () => {
    const idByPath = assignVariableIds(borderBaseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens: borderBaseTokens,
      brandTokensByName: { Base: borderBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    const borderVariables = variables.filter(v => v.name.startsWith('Alias/Border/Composite/Grey/'))
    expect(borderVariables.map(v => v.name)).toEqual([
      'Alias/Border/Composite/Grey/BorderColor',
      'Alias/Border/Composite/Grey/BorderWidth',
      'Alias/Border/Composite/Grey/BorderStyle',
    ])
    expect(borderVariables.map(v => v.resolvedType)).toEqual(['COLOR', 'FLOAT', 'STRING'])
    expect(figmaBorderSubVariableName(borderToken.path, 'width')).toBe('Alias/Border/Composite/Grey/BorderWidth')
  })

  it("pass 1 writes no mode-values for the composite's own sub-properties, since color/width/style are each a single-hop reference deferred to pass 2's alias binding", () => {
    const idByPath = assignVariableIds(borderBaseTokens)
    const { variableModeValues } = buildCreatePassPayload({
      baseTokens: borderBaseTokens,
      brandTokensByName: { Base: borderBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    const byId = Object.fromEntries(variableModeValues.map(v => [v.variableId, v.value]))
    expect(byId['temp-Alias.Border.Composite.Grey-color']).toBeUndefined()
    expect(byId['temp-Alias.Border.Composite.Grey-width']).toBeUndefined()
    expect(byId['temp-Alias.Border.Composite.Grey-style']).toBeUndefined()
    // The primitives themselves are plain (non-composite) tokens — still written as literals here.
    expect(byId['temp-Alias.Border.Color.Grey']).toEqual({ r: 0.816, g: 0.816, b: 0.816, a: 1 })
    expect(byId['temp-Alias.Border.Width.Base']).toBe(2)
    expect(byId['temp-Alias.Border.Style.Solid']).toBe('solid')
  })

  it("pass 2 writes an alias mode-value per sub-property for both the composite's own color/width/style references and a border token that references the whole composite", () => {
    const idByPath = assignVariableIds(borderBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Alias.Border.Color.Grey': 'real-color-prim',
      'temp-Alias.Border.Width.Base': 'real-width-prim',
      'temp-Alias.Border.Style.Solid': 'real-style-prim',
      'temp-Alias.Border.Composite.Grey-color': 'real-c',
      'temp-Alias.Border.Composite.Grey-width': 'real-w',
      'temp-Alias.Border.Composite.Grey-style': 'real-s',
      'temp-Zurich.Border.Composite.Grey-color': 'real-alias-c',
      'temp-Zurich.Border.Composite.Grey-width': 'real-alias-w',
      'temp-Zurich.Border.Composite.Grey-style': 'real-alias-s',
    })

    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: borderBaseTokens,
      brandTokensByName: { Base: borderBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variableModeValues).toHaveLength(6)
    const byVariableId = Object.fromEntries(variableModeValues.map(v => [v.variableId, v.value]))
    expect(byVariableId['real-c']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-color-prim' })
    expect(byVariableId['real-w']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-width-prim' })
    expect(byVariableId['real-s']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-style-prim' })
    expect(byVariableId['real-alias-w']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-w' })
  })

  it('collectNewlyCreatedIds returns the whole 3-id object as one entry for a border token', () => {
    const idByPath = assignVariableIds(borderBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Alias.Border.Composite.Grey-color': 'real-c',
      'temp-Alias.Border.Composite.Grey-width': 'real-w',
      'temp-Alias.Border.Composite.Grey-style': 'real-s',
    })

    const created = collectNewlyCreatedIds([borderToken], idByPath)
    expect(created).toEqual([
      { path: borderToken.path, variableId: { color: 'real-c', width: 'real-w', style: 'real-s' } },
    ])
  })
})

describe('typography push (two-pass write payload)', () => {
  const familyPrimitive = {
    path: ['Global', 'Font', 'Family', 'Heading'],
    type: 'fontFamily',
    value: { kind: 'literal', value: ['Baloise Create Headline', 'Arial', 'sans-serif'] },
  }
  const weightPrimitive = {
    path: ['Global', 'Font', 'Weight', '700'],
    type: 'fontWeight',
    value: { kind: 'literal', value: 700 },
  }
  const lineHeightPrimitive = {
    path: ['Global', 'Font', 'LineHeight', '2'],
    type: 'number',
    value: { kind: 'literal', value: 1.3 },
  }
  const letterSpacingPrimitive = {
    path: ['Global', 'Font', 'LetterSpacing', '0'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 0, unit: 'rem' } },
  }
  const decorationPrimitive = {
    path: ['Global', 'Font', 'TextDecoration', 'None'],
    type: 'textDecoration',
    value: { kind: 'literal', value: 'none' },
  }
  const transformPrimitive = {
    path: ['Global', 'Font', 'TextTransform', 'None'],
    type: 'textTransform',
    value: { kind: 'literal', value: 'none' },
  }
  const typographyToken = {
    path: ['Global', 'Font', 'Typography', 'Test'],
    type: 'typography',
    value: {
      kind: 'literal',
      value: {
        fontFamily: '{Global.Font.Family.Heading}',
        fontSize: { value: 16, unit: 'px' },
        fontWeight: '{Global.Font.Weight.700}',
        lineHeight: '{Global.Font.LineHeight.2}',
        letterSpacing: '{Global.Font.LetterSpacing.0}',
        textDecoration: '{Global.Font.TextDecoration.None}',
        textTransform: '{Global.Font.TextTransform.None}',
      },
    },
  }
  const typographyRefToken = {
    path: ['Zurich', 'Font', 'Typography', 'Test'],
    type: 'typography',
    value: { kind: 'reference', path: ['Global', 'Font', 'Typography', 'Test'] },
  }
  const typographyBaseTokens = [
    familyPrimitive,
    weightPrimitive,
    lineHeightPrimitive,
    letterSpacingPrimitive,
    decorationPrimitive,
    transformPrimitive,
    typographyToken,
    typographyRefToken,
  ]

  it('assigns 7 temp sub-ids to a never-synced typography token', () => {
    const idByPath = assignVariableIds(typographyBaseTokens)
    expect(idByPath.get('Global.Font.Typography.Test')).toEqual({
      fontFamily: 'temp-Global.Font.Typography.Test-fontFamily',
      fontSize: 'temp-Global.Font.Typography.Test-fontSize',
      fontWeight: 'temp-Global.Font.Typography.Test-fontWeight',
      lineHeight: 'temp-Global.Font.Typography.Test-lineHeight',
      letterSpacing: 'temp-Global.Font.Typography.Test-letterSpacing',
      textDecoration: 'temp-Global.Font.Typography.Test-textDecoration',
      textTransform: 'temp-Global.Font.Typography.Test-textTransform',
    })
  })

  it('pass 1 creates 7 named sub-variables for a temp typography token, with the right resolvedType each', () => {
    const idByPath = assignVariableIds(typographyBaseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens: typographyBaseTokens,
      brandTokensByName: { Base: typographyBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    const typographyVariables = variables.filter(v => v.name.startsWith('Global/Font/Typography/Test/'))
    expect(typographyVariables.map(v => v.name)).toEqual([
      'Global/Font/Typography/Test/FontFamily',
      'Global/Font/Typography/Test/FontSize',
      'Global/Font/Typography/Test/FontWeight',
      'Global/Font/Typography/Test/LineHeight',
      'Global/Font/Typography/Test/LetterSpacing',
      'Global/Font/Typography/Test/TextDecoration',
      'Global/Font/Typography/Test/TextTransform',
    ])
    expect(typographyVariables.map(v => v.resolvedType)).toEqual([
      'STRING',
      'FLOAT',
      'STRING',
      'STRING',
      'STRING',
      'STRING',
      'STRING',
    ])
    expect(figmaTypographySubVariableName(typographyToken.path, 'fontSize')).toBe(
      'Global/Font/Typography/Test/FontSize',
    )
  })

  it("pass 1 writes only fontSize (literal) and letterSpacing (always computed); fontFamily/fontWeight/lineHeight/textDecoration/textTransform are single-hop references deferred to pass 2's alias binding", () => {
    const idByPath = assignVariableIds(typographyBaseTokens)
    const { variableModeValues } = buildCreatePassPayload({
      baseTokens: typographyBaseTokens,
      brandTokensByName: { Base: typographyBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    const byId = Object.fromEntries(variableModeValues.map(v => [v.variableId, v.value]))
    expect(byId['temp-Global.Font.Typography.Test-fontFamily']).toBeUndefined()
    expect(byId['temp-Global.Font.Typography.Test-fontSize']).toBe(16)
    expect(byId['temp-Global.Font.Typography.Test-fontWeight']).toBeUndefined()
    expect(byId['temp-Global.Font.Typography.Test-lineHeight']).toBeUndefined()
    expect(byId['temp-Global.Font.Typography.Test-letterSpacing']).toBe('0%')
    expect(byId['temp-Global.Font.Typography.Test-textDecoration']).toBeUndefined()
    expect(byId['temp-Global.Font.Typography.Test-textTransform']).toBeUndefined()
  })

  it("pass 2 writes an alias mode-value per referenced sub-property for both the composite's own fontFamily/fontWeight/lineHeight/textDecoration/textTransform and a typography token that references the whole composite", () => {
    const idByPath = assignVariableIds(typographyBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Global.Font.Family.Heading': 'real-family-prim',
      'temp-Global.Font.Weight.700': 'real-weight-prim',
      'temp-Global.Font.LineHeight.2': 'real-lineheight-prim',
      'temp-Global.Font.TextDecoration.None': 'real-decoration-prim',
      'temp-Global.Font.TextTransform.None': 'real-transform-prim',
      'temp-Global.Font.Typography.Test-fontFamily': 'real-ff',
      'temp-Global.Font.Typography.Test-fontSize': 'real-fs',
      'temp-Global.Font.Typography.Test-fontWeight': 'real-fw',
      'temp-Global.Font.Typography.Test-lineHeight': 'real-lh',
      'temp-Global.Font.Typography.Test-letterSpacing': 'real-ls',
      'temp-Global.Font.Typography.Test-textDecoration': 'real-td',
      'temp-Global.Font.Typography.Test-textTransform': 'real-tt',
      'temp-Zurich.Font.Typography.Test-fontFamily': 'real-alias-ff',
      'temp-Zurich.Font.Typography.Test-fontSize': 'real-alias-fs',
      'temp-Zurich.Font.Typography.Test-fontWeight': 'real-alias-fw',
      'temp-Zurich.Font.Typography.Test-lineHeight': 'real-alias-lh',
      'temp-Zurich.Font.Typography.Test-letterSpacing': 'real-alias-ls',
      'temp-Zurich.Font.Typography.Test-textDecoration': 'real-alias-td',
      'temp-Zurich.Font.Typography.Test-textTransform': 'real-alias-tt',
    })

    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: typographyBaseTokens,
      brandTokensByName: { Base: typographyBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variableModeValues).toHaveLength(12)
    const byVariableId = Object.fromEntries(variableModeValues.map(v => [v.variableId, v.value]))
    expect(byVariableId['real-ff']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-family-prim' })
    expect(byVariableId['real-fw']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-weight-prim' })
    expect(byVariableId['real-lh']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-lineheight-prim' })
    expect(byVariableId['real-td']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-decoration-prim' })
    expect(byVariableId['real-tt']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-transform-prim' })
    expect(byVariableId['real-alias-fs']).toEqual({ type: 'VARIABLE_ALIAS', id: 'real-fs' })
  })

  it('collectNewlyCreatedIds returns the whole 7-id object as one entry for a typography token', () => {
    const idByPath = assignVariableIds(typographyBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Global.Font.Typography.Test-fontFamily': 'real-ff',
      'temp-Global.Font.Typography.Test-fontSize': 'real-fs',
      'temp-Global.Font.Typography.Test-fontWeight': 'real-fw',
      'temp-Global.Font.Typography.Test-lineHeight': 'real-lh',
      'temp-Global.Font.Typography.Test-letterSpacing': 'real-ls',
      'temp-Global.Font.Typography.Test-textDecoration': 'real-td',
      'temp-Global.Font.Typography.Test-textTransform': 'real-tt',
    })

    const created = collectNewlyCreatedIds([typographyToken], idByPath)
    expect(created).toEqual([
      {
        path: typographyToken.path,
        variableId: {
          fontFamily: 'real-ff',
          fontSize: 'real-fs',
          fontWeight: 'real-fw',
          lineHeight: 'real-lh',
          letterSpacing: 'real-ls',
          textDecoration: 'real-td',
          textTransform: 'real-tt',
        },
      },
    ])
  })

  describe('a typography token committed before letterSpacing/textDecoration/textTransform existed', () => {
    const legacyIds = { fontFamily: 'ff', fontSize: 'fs', fontWeight: 'fw', lineHeight: 'lh' }
    const legacyToken = { ...typographyToken, variableId: legacyIds }

    it('keeps its 4 existing ids and mints temp ids for only the 3 new sub-properties', () => {
      const idByPath = assignVariableIds([legacyToken])
      expect(idByPath.get('Global.Font.Typography.Test')).toEqual({
        ...legacyIds,
        letterSpacing: 'temp-Global.Font.Typography.Test-letterSpacing',
        textDecoration: 'temp-Global.Font.Typography.Test-textDecoration',
        textTransform: 'temp-Global.Font.Typography.Test-textTransform',
      })
    })

    it('pass 1 creates exactly the 3 missing variables', () => {
      const tokens = [...typographyBaseTokens.slice(0, 6), legacyToken]
      const idByPath = assignVariableIds(tokens)
      const { variables } = buildCreatePassPayload({
        baseTokens: tokens,
        brandTokensByName: { Base: tokens },
        idByPath,
        collectionId: 'coll-1',
        modeIdByBrand: { Base: 'm-base' },
      })
      const created = variables.filter(v => v.name.startsWith('Global/Font/Typography/Test/'))
      expect(created.map(v => v.name)).toEqual([
        'Global/Font/Typography/Test/LetterSpacing',
        'Global/Font/Typography/Test/TextDecoration',
        'Global/Font/Typography/Test/TextTransform',
      ])
    })

    it('collectNewlyCreatedIds reports it, with the completed 7-id set', () => {
      const idByPath = assignVariableIds([legacyToken])
      resolveTempIds(idByPath, {
        'temp-Global.Font.Typography.Test-letterSpacing': 'real-ls',
        'temp-Global.Font.Typography.Test-textDecoration': 'real-td',
        'temp-Global.Font.Typography.Test-textTransform': 'real-tt',
      })
      expect(collectNewlyCreatedIds([legacyToken], idByPath)).toEqual([
        {
          path: legacyToken.path,
          variableId: { ...legacyIds, letterSpacing: 'real-ls', textDecoration: 'real-td', textTransform: 'real-tt' },
        },
      ])
    })

    it('collectNewlyCreatedIds ignores a fully-synced typography token', () => {
      const full = {
        ...legacyIds,
        letterSpacing: 'ls',
        textDecoration: 'td',
        textTransform: 'tt',
      }
      const synced = { ...typographyToken, variableId: full }
      const idByPath = assignVariableIds([synced])
      expect(collectNewlyCreatedIds([synced], idByPath)).toEqual([])
    })
  })
})

describe('responsive dimension push (two-pass write payload)', () => {
  const space16Primitive = {
    path: ['Global', 'Dimension', 'Space', '16'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 1, unit: 'rem' } },
  }
  const responsiveToken = {
    path: ['Alias', 'Space', 'Lg'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 16, unit: 'px' } },
    responsive: {
      mobile: '{Global.Dimension.Space.16}',
      tablet: { value: 24, unit: 'px' },
      desktop: { value: 32, unit: 'px' },
    },
  }
  // A plain (non-responsive) dimension token that references the responsive one by whole value —
  // exercises the buildAliasPassPayload guard: there's no single Figma variable a {mobile, tablet,
  // desktop} target resolves to, so this alias must be skipped, not miswritten.
  const dimensionRefToken = {
    path: ['Zurich', 'Space', 'Lg'],
    type: 'dimension',
    value: { kind: 'reference', path: ['Alias', 'Space', 'Lg'] },
  }
  const responsiveBaseTokens = [space16Primitive, responsiveToken, dimensionRefToken]

  it('assigns 3 temp sub-ids to a never-synced responsive dimension token', () => {
    const idByPath = assignVariableIds(responsiveBaseTokens)
    expect(idByPath.get('Alias.Space.Lg')).toEqual({
      mobile: 'temp-Alias.Space.Lg-mobile',
      tablet: 'temp-Alias.Space.Lg-tablet',
      desktop: 'temp-Alias.Space.Lg-desktop',
    })
  })

  it('pass 1 creates 3 named sub-variables for a temp responsive dimension token, all FLOAT', () => {
    const idByPath = assignVariableIds(responsiveBaseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens: responsiveBaseTokens,
      brandTokensByName: { Base: responsiveBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    const responsiveVariables = variables.filter(v => v.name.startsWith('Alias/Space/Lg/'))
    expect(responsiveVariables.map(v => v.name)).toEqual([
      'Alias/Space/Lg/Mobile',
      'Alias/Space/Lg/Tablet',
      'Alias/Space/Lg/Desktop',
    ])
    expect(responsiveVariables.map(v => v.resolvedType)).toEqual(['FLOAT', 'FLOAT', 'FLOAT'])
    expect(figmaResponsiveDimensionSubVariableName(responsiveToken.path, 'tablet')).toBe('Alias/Space/Lg/Tablet')
  })

  it('pass 1 writes literal mode-values only for the tablet/desktop breakpoints, leaving the referenced mobile breakpoint for pass 2', () => {
    const idByPath = assignVariableIds(responsiveBaseTokens)
    const { variableModeValues } = buildCreatePassPayload({
      baseTokens: responsiveBaseTokens,
      brandTokensByName: { Base: responsiveBaseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    const byId = Object.fromEntries(variableModeValues.map(v => [v.variableId, v.value]))
    expect(byId['temp-Alias.Space.Lg-mobile']).toBeUndefined()
    expect(byId['temp-Alias.Space.Lg-tablet']).toBe(24)
    expect(byId['temp-Alias.Space.Lg-desktop']).toBe(32)
  })

  it('pass 2 binds a referenced breakpoint as a VARIABLE_ALIAS to its target primitive, not a flattened copy', () => {
    const idByPath = assignVariableIds(responsiveBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Global.Dimension.Space.16': 'real-space-16',
      'temp-Alias.Space.Lg-mobile': 'real-mobile',
      'temp-Alias.Space.Lg-tablet': 'real-tablet',
      'temp-Alias.Space.Lg-desktop': 'real-desktop',
      'temp-Zurich.Space.Lg': 'real-ref',
    })

    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: responsiveBaseTokens,
      brandTokensByName: { Base: responsiveBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variableModeValues).toEqual([
      { variableId: 'real-mobile', modeId: 'm-base', value: { type: 'VARIABLE_ALIAS', id: 'real-space-16' } },
    ])
  })

  it('pass 2 skips a plain dimension token that references a responsive dimension token by whole value', () => {
    const idByPath = assignVariableIds(responsiveBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Global.Dimension.Space.16': 'real-space-16',
      'temp-Alias.Space.Lg-mobile': 'real-mobile',
      'temp-Alias.Space.Lg-tablet': 'real-tablet',
      'temp-Alias.Space.Lg-desktop': 'real-desktop',
      'temp-Zurich.Space.Lg': 'real-ref',
    })

    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: responsiveBaseTokens,
      brandTokensByName: { Base: responsiveBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variableModeValues.find(v => v.variableId === 'real-ref')).toBeUndefined()
  })

  it('collectNewlyCreatedIds returns the whole 3-id object as one entry for a responsive dimension token', () => {
    const idByPath = assignVariableIds(responsiveBaseTokens)
    resolveTempIds(idByPath, {
      'temp-Alias.Space.Lg-mobile': 'real-mobile',
      'temp-Alias.Space.Lg-tablet': 'real-tablet',
      'temp-Alias.Space.Lg-desktop': 'real-desktop',
    })

    const created = collectNewlyCreatedIds([responsiveToken], idByPath)
    expect(created).toEqual([
      {
        path: responsiveToken.path,
        variableId: { mobile: 'real-mobile', tablet: 'real-tablet', desktop: 'real-desktop' },
      },
    ])
  })
})

describe('Device variable (responsive collection) push — MVP scope', () => {
  // Real emoji path segments, matching DEVICE_ELIGIBLE_PATH_PREFIXES in figma-value.mjs
  // (['📱 Device', '↔️ Space'] etc.) — unlike the plain-ASCII fixtures above (which deliberately stay
  // out of MVP scope and double as the "not eligible" regression check), these need the real
  // prefixes to exercise isDeviceEligibleResponsiveDimensionToken at all.
  const space16Primitive = {
    path: ['🌐 Global', '📏 Dimension', 'Space', '16'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 16, unit: 'px' } },
  }
  const space40Primitive = {
    path: ['🌐 Global', '📏 Dimension', 'Space', '40'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 40, unit: 'px' } },
  }
  const deviceEligibleToken = {
    path: ['📱 Device', '↔️ Space', 'Lg'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 16, unit: 'px' } },
    responsive: {
      mobile: '{🌐 Global.📏 Dimension.Space.16}',
      tablet: '{🌐 Global.📏 Dimension.Space.40}',
      desktop: { value: 48, unit: 'px' },
    },
  }
  // The real bug from the reported issue: a Component token (e.g. Component.Badge.Size.Base.Height)
  // referencing a responsive Alias token by whole value — previously silently skipped because the
  // target's variableId was a {mobile,tablet,desktop} object with no single id to alias to.
  const componentRefToken = {
    path: ['🧩 Component', 'Badge', 'Size', 'Base', 'Height'],
    type: 'dimension',
    value: { kind: 'reference', path: ['📱 Device', '↔️ Space', 'Lg'] },
  }
  const deviceBaseTokens = [space16Primitive, space40Primitive, deviceEligibleToken, componentRefToken]

  it('assignVariableIds assigns a 4th temp "device" id, alongside the 3 breakpoint sub-ids, for an in-scope token', () => {
    const idByPath = assignVariableIds(deviceBaseTokens)
    expect(idByPath.get('📱 Device.↔️ Space.Lg')).toEqual({
      mobile: 'temp-📱 Device.↔️ Space.Lg-mobile',
      tablet: 'temp-📱 Device.↔️ Space.Lg-tablet',
      desktop: 'temp-📱 Device.↔️ Space.Lg-desktop',
      device: 'temp-📱 Device.↔️ Space.Lg-device',
    })
  })

  it('pass 1 creates the Device variable in the responsive collection, FLOAT, named with a /Device suffix', () => {
    const idByPath = assignVariableIds(deviceBaseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens: deviceBaseTokens,
      brandTokensByName: { Base: deviceBaseTokens },
      idByPath,
      collectionId: 'coll-brand',
      modeIdByBrand: { Base: 'm-base' },
      responsiveCollectionId: 'coll-responsive',
    })

    const deviceVariable = variables.find(v => v.name === '📱 Device/↔️ Space/Lg/Device')
    expect(deviceVariable).toMatchObject({ variableCollectionId: 'coll-responsive', resolvedType: 'FLOAT' })
  })

  it('pass 1 writes no mode-value for the Device variable — it is alias-only, deferred entirely to pass 2', () => {
    const idByPath = assignVariableIds(deviceBaseTokens)
    const { variableModeValues } = buildCreatePassPayload({
      baseTokens: deviceBaseTokens,
      brandTokensByName: { Base: deviceBaseTokens },
      idByPath,
      collectionId: 'coll-brand',
      modeIdByBrand: { Base: 'm-base' },
      responsiveCollectionId: 'coll-responsive',
    })

    const deviceId = idByPath.get('📱 Device.↔️ Space.Lg').device
    expect(variableModeValues.find(v => v.variableId === deviceId)).toBeUndefined()
  })

  const resolvedIdByPath = () => {
    const idByPath = assignVariableIds(deviceBaseTokens)
    resolveTempIds(idByPath, {
      'temp-🌐 Global.📏 Dimension.Space.16': 'real-g16',
      'temp-🌐 Global.📏 Dimension.Space.40': 'real-g40',
      'temp-📱 Device.↔️ Space.Lg-mobile': 'real-mobile',
      'temp-📱 Device.↔️ Space.Lg-tablet': 'real-tablet',
      'temp-📱 Device.↔️ Space.Lg-desktop': 'real-desktop',
      'temp-📱 Device.↔️ Space.Lg-device': 'real-device',
      'temp-🧩 Component.Badge.Size.Base.Height': 'real-height',
    })
    return idByPath
  }

  it('pass 2 writes 3 breakpoint-mode aliases for the Device variable, each pointing at the matching sibling', () => {
    const idByPath = resolvedIdByPath()
    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: deviceBaseTokens,
      brandTokensByName: { Base: deviceBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base' },
      modeIdByBreakpoint: { Mobile: 'm-mobile', Tablet: 'm-tablet', Desktop: 'm-desktop' },
    })

    const deviceAliases = variableModeValues.filter(v => v.variableId === 'real-device')
    expect(deviceAliases).toEqual([
      { variableId: 'real-device', modeId: 'm-mobile', value: { type: 'VARIABLE_ALIAS', id: 'real-mobile' } },
      { variableId: 'real-device', modeId: 'm-tablet', value: { type: 'VARIABLE_ALIAS', id: 'real-tablet' } },
      { variableId: 'real-device', modeId: 'm-desktop', value: { type: 'VARIABLE_ALIAS', id: 'real-desktop' } },
    ])
  })

  it('pass 2 writes the Device aliases once, not once per brand', () => {
    const idByPath = resolvedIdByPath()
    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: deviceBaseTokens,
      brandTokensByName: { Base: deviceBaseTokens, Zurich: deviceBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base', Zurich: 'm-zurich' },
      modeIdByBreakpoint: { Mobile: 'm-mobile', Tablet: 'm-tablet', Desktop: 'm-desktop' },
    })

    expect(variableModeValues.filter(v => v.variableId === 'real-device')).toHaveLength(3)
  })

  it('pass 2 aliases a Component token referencing a Device-eligible responsive token to its Device id — the fix for the reported "0 values" bug', () => {
    const idByPath = resolvedIdByPath()
    const { variableModeValues } = buildAliasPassPayload({
      baseTokens: deviceBaseTokens,
      brandTokensByName: { Base: deviceBaseTokens },
      idByPath,
      modeIdByBrand: { Base: 'm-base' },
      modeIdByBreakpoint: { Mobile: 'm-mobile', Tablet: 'm-tablet', Desktop: 'm-desktop' },
    })

    expect(variableModeValues.find(v => v.variableId === 'real-height')).toEqual({
      variableId: 'real-height',
      modeId: 'm-base',
      value: { type: 'VARIABLE_ALIAS', id: 'real-device' },
    })
  })

  it('does not assign a "device" id for a responsive dimension token outside MVP scope', () => {
    const outOfScopeToken = {
      path: ['🧩 Component', 'Text', 'Space'],
      type: 'dimension',
      value: { kind: 'literal', value: { value: 16, unit: 'px' } },
      responsive: {
        mobile: { value: 16, unit: 'px' },
        tablet: { value: 16, unit: 'px' },
        desktop: { value: 16, unit: 'px' },
      },
    }
    const idByPath = assignVariableIds([outOfScopeToken])
    expect(idByPath.get('🧩 Component.Text.Space')).toEqual({
      mobile: 'temp-🧩 Component.Text.Space-mobile',
      tablet: 'temp-🧩 Component.Text.Space-tablet',
      desktop: 'temp-🧩 Component.Text.Space-desktop',
    })
  })
})

describe('findCollectionAndModes', () => {
  const meta = {
    variableCollections: {
      'VariableCollectionId:1': {
        id: 'VariableCollectionId:1',
        name: 'Design Tokens',
        modes: [
          { modeId: 'm1', name: 'Base' },
          { modeId: 'm2', name: 'Zurich' },
        ],
      },
    },
  }

  it('maps each brand name to its mode id by exact name match', () => {
    const { collectionId, modeIdByBrand } = findCollectionAndModes(meta, ['Zurich'], 'Design Tokens', ['Base'])
    expect(collectionId).toBe('VariableCollectionId:1')
    expect(modeIdByBrand).toEqual({ Base: 'm1', Zurich: 'm2' })
  })

  it('throws if a brand has no matching Figma mode', () => {
    expect(() => findCollectionAndModes(meta, ['Unknown'], 'Design Tokens', ['Base'])).toThrow(
      /No Figma mode named "Unknown"/,
    )
  })

  it('throws if no collection is named "Design Tokens"', () => {
    expect(() => findCollectionAndModes({ variableCollections: {} }, [], 'Design Tokens', ['Base'])).toThrow(
      /No Figma variable collection named "Design Tokens"/,
    )
  })

  it('resolves a collection by a custom name, ignoring other collections in the file', () => {
    const multiCollectionMeta = {
      variableCollections: {
        ...meta.variableCollections,
        'VariableCollectionId:2': {
          id: 'VariableCollectionId:2',
          name: 'Design Responsive Tokens',
          modes: [{ modeId: 'm3', name: 'Mobile' }],
        },
      },
    }
    const { collectionId, modeIdByBrand } = findCollectionAndModes(multiCollectionMeta, ['Zurich'], 'Design Tokens', [
      'Base',
    ])
    expect(collectionId).toBe('VariableCollectionId:1')
    expect(modeIdByBrand).toEqual({ Base: 'm1', Zurich: 'm2' })
  })
})

describe('findResponsiveCollectionAndModes', () => {
  const meta = {
    variableCollections: {
      'VariableCollectionId:1': {
        id: 'VariableCollectionId:1',
        name: 'Design Tokens',
        modes: [{ modeId: 'm1', name: 'Base' }],
      },
      'VariableCollectionId:2': {
        id: 'VariableCollectionId:2',
        name: 'Design Responsive Tokens',
        modes: [
          { modeId: 'm3', name: 'Mobile' },
          { modeId: 'm4', name: 'Tablet' },
          { modeId: 'm5', name: 'Desktop' },
        ],
      },
    },
  }

  it('maps each breakpoint name to its mode id by exact name match, ignoring the brand collection', () => {
    const { collectionId, modeIdByBreakpoint } = findResponsiveCollectionAndModes(meta)
    expect(collectionId).toBe('VariableCollectionId:2')
    expect(modeIdByBreakpoint).toEqual({ Mobile: 'm3', Tablet: 'm4', Desktop: 'm5' })
  })

  it('throws if no collection is named "Design Responsive Tokens" (the default)', () => {
    expect(() => findResponsiveCollectionAndModes({ variableCollections: {} })).toThrow(
      /No Figma variable collection named "Design Responsive Tokens"/,
    )
  })

  it('throws if a required breakpoint mode is missing', () => {
    const missingDesktop = {
      variableCollections: {
        'VariableCollectionId:2': {
          id: 'VariableCollectionId:2',
          name: 'Design Responsive Tokens',
          modes: [
            { modeId: 'm3', name: 'Mobile' },
            { modeId: 'm4', name: 'Tablet' },
          ],
        },
      },
    }
    expect(() => findResponsiveCollectionAndModes(missingDesktop)).toThrow(/No Figma mode named "Desktop"/)
  })
})

describe('two-pass write payload', () => {
  const baseTokens = [
    {
      path: ['Global', 'White'],
      type: 'color',
      value: { kind: 'literal', value: { components: [1, 1, 1], alpha: 1 } },
      variableId: 'VariableID:1:1',
    },
    { path: ['Global', 'Spacing', 'Lg'], type: 'number', value: { kind: 'literal', value: 24 } }, // no variableId — new
    { path: ['Alias', 'Background'], type: 'color', value: { kind: 'reference', path: ['Global', 'White'] } }, // no variableId — new
  ]
  const brandTokensByName = {
    Base: baseTokens,
    Zurich: [
      { ...baseTokens[0], value: { kind: 'literal', value: { components: [0.9, 0.9, 0.9], alpha: 1 } } }, // brand override
      baseTokens[1],
      baseTokens[2],
    ],
  }

  it('assigns a temp id only to tokens without an existing variableId', () => {
    const idByPath = assignVariableIds(baseTokens)
    expect(idByPath.get('Global.White')).toBe('VariableID:1:1')
    expect(idByPath.get('Global.Spacing.Lg')).toBe('temp-Global.Spacing.Lg')
    expect(idByPath.get('Alias.Background')).toBe('temp-Alias.Background')
  })

  it('pass 1 creates only never-synced variables, once each, regardless of brand count', () => {
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens,
      brandTokensByName,
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base', Zurich: 'm-zurich' },
    })

    expect(variables).toHaveLength(2)
    expect(variables.map(v => v.name)).toEqual(['Global/Spacing/Lg', 'Alias/Background'])
    expect(variables.every(v => v.action === 'CREATE')).toBe(true)
  })

  it('pass 1 writes literal mode-values for every brand, excluding references', () => {
    const idByPath = assignVariableIds(baseTokens)
    const { variableModeValues } = buildCreatePassPayload({
      baseTokens,
      brandTokensByName,
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base', Zurich: 'm-zurich' },
    })

    // Global.White (2 brands) + Global.Spacing.Lg (2 brands) = 4; Alias.Background is a reference, excluded.
    expect(variableModeValues).toHaveLength(4)
    expect(variableModeValues.every(v => v.value.type !== 'VARIABLE_ALIAS')).toBe(true)

    const zurichWhite = variableModeValues.find(v => v.variableId === 'VariableID:1:1' && v.modeId === 'm-zurich')
    expect(zurichWhite.value).toEqual({ r: 0.9, g: 0.9, b: 0.9, a: 1 })
  })

  it('pass 2 writes alias mode-values for every brand, resolving against Base regardless of which brand tree is passed', () => {
    const idByPath = assignVariableIds(baseTokens)
    resolveTempIds(idByPath, { 'temp-Global.Spacing.Lg': 'VariableID:9:1', 'temp-Alias.Background': 'VariableID:9:2' })

    const { variableModeValues } = buildAliasPassPayload({
      baseTokens,
      brandTokensByName,
      idByPath,
      modeIdByBrand: { Base: 'm-base', Zurich: 'm-zurich' },
    })

    expect(variableModeValues).toHaveLength(2) // Alias.Background in Base and Zurich
    for (const entry of variableModeValues) {
      expect(entry.variableId).toBe('VariableID:9:2')
      expect(entry.value).toEqual({ type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' })
    }
  })

  it('resolveTempIds patches every occurrence of a temp id, not just the first', () => {
    const idByPath = assignVariableIds(baseTokens)
    resolveTempIds(idByPath, { 'temp-Global.Spacing.Lg': 'VariableID:9:1', 'temp-Alias.Background': 'VariableID:9:2' })

    expect(idByPath.get('Global.Spacing.Lg')).toBe('VariableID:9:1')
    expect(idByPath.get('Alias.Background')).toBe('VariableID:9:2')
    expect(idByPath.get('Global.White')).toBe('VariableID:1:1') // untouched — wasn't a temp id
  })

  it('collectNewlyCreatedIds returns only tokens that started without a variableId, with their resolved real id', () => {
    const idByPath = assignVariableIds(baseTokens)
    resolveTempIds(idByPath, { 'temp-Global.Spacing.Lg': 'VariableID:9:1', 'temp-Alias.Background': 'VariableID:9:2' })

    const created = collectNewlyCreatedIds(baseTokens, idByPath)
    expect(created).toEqual([
      { path: ['Global', 'Spacing', 'Lg'], variableId: 'VariableID:9:1' },
      { path: ['Alias', 'Background'], variableId: 'VariableID:9:2' },
    ])
  })
})

describe('description push', () => {
  it('folds description into a CREATE variable payload', () => {
    const baseTokens = [
      {
        path: ['Global', 'Spacing', 'Lg'],
        type: 'number',
        value: { kind: 'literal', value: 24 },
        description: 'The large spacing step.',
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens,
      brandTokensByName: { Base: baseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variables).toHaveLength(1)
    expect(variables[0].description).toBe('The large spacing step.')
  })

  it('writes an empty description on CREATE for a token with none', () => {
    const baseTokens = [{ path: ['Global', 'Spacing', 'Lg'], type: 'number', value: { kind: 'literal', value: 24 } }]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildCreatePassPayload({
      baseTokens,
      brandTokensByName: { Base: baseTokens },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })

    expect(variables[0].description).toBe('')
  })

  it('proposes an UPDATE for an already-synced variable whose description changed', () => {
    const baseTokens = [
      {
        path: ['Global', 'White'],
        type: 'color',
        value: { kind: 'literal', value: { components: [1, 1, 1], alpha: 1 } },
        variableId: 'VariableID:1:1',
        description: 'Pure white.',
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildDescriptionUpdatePayload({
      baseTokens,
      idByPath,
      remoteVariablesById: { 'VariableID:1:1': { description: 'An outdated description.' } },
    })

    expect(variables).toEqual([{ action: 'UPDATE', id: 'VariableID:1:1', description: 'Pure white.' }])
  })

  it('skips an already-synced variable whose description already matches Figma', () => {
    const baseTokens = [
      {
        path: ['Global', 'White'],
        type: 'color',
        value: { kind: 'literal', value: { components: [1, 1, 1], alpha: 1 } },
        variableId: 'VariableID:1:1',
        description: 'Pure white.',
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildDescriptionUpdatePayload({
      baseTokens,
      idByPath,
      remoteVariablesById: { 'VariableID:1:1': { description: 'Pure white.' } },
    })

    expect(variables).toHaveLength(0)
  })

  it('never emits an UPDATE for a still-temp (not-yet-created) id', () => {
    const baseTokens = [
      { path: ['Global', 'Spacing', 'Lg'], type: 'number', value: { kind: 'literal', value: 24 }, description: 'x' },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildDescriptionUpdatePayload({ baseTokens, idByPath, remoteVariablesById: {} })

    expect(variables).toHaveLength(0)
  })

  it('writes the same description onto every sub-variable of a composite (shadow) token', () => {
    const baseTokens = [
      {
        path: ['Global', 'Shadow', 'Sm'],
        type: 'shadow',
        value: {
          kind: 'literal',
          value: {
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 1, unit: 'px' },
            blur: { value: 2, unit: 'px' },
            spread: { value: 0, unit: 'px' },
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
          },
        },
        variableId: {
          offsetX: 'VariableID:s:1',
          offsetY: 'VariableID:s:2',
          blur: 'VariableID:s:3',
          spread: 'VariableID:s:4',
          color: 'VariableID:s:5',
        },
        description: 'A small drop shadow.',
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildDescriptionUpdatePayload({
      baseTokens,
      idByPath,
      remoteVariablesById: Object.fromEntries(
        Object.values(baseTokens[0].variableId).map(id => [id, { description: '' }]),
      ),
    })

    expect(variables).toHaveLength(5)
    expect(variables.every(v => v.description === 'A small drop shadow.')).toBe(true)
    expect(new Set(variables.map(v => v.id))).toEqual(new Set(Object.values(baseTokens[0].variableId)))
  })
})

describe('buildNameUpdatePayload', () => {
  it('proposes an UPDATE for an already-synced variable whose token path was renamed', () => {
    const baseTokens = [
      {
        path: ['🌐 Global', '🌈 Color', 'BlackRename'],
        type: 'color',
        value: { kind: 'literal', value: { components: [0, 0, 0], alpha: 1 } },
        variableId: 'VariableID:137:2689',
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildNameUpdatePayload({
      baseTokens,
      idByPath,
      remoteVariablesById: { 'VariableID:137:2689': { name: '🌐 Global/🌈 Color/Black' } },
    })

    expect(variables).toEqual([{ action: 'UPDATE', id: 'VariableID:137:2689', name: '🌐 Global/🌈 Color/BlackRename' }])
  })

  it('skips an already-synced variable whose name already matches its current path', () => {
    const baseTokens = [
      {
        path: ['Global', 'White'],
        type: 'color',
        value: { kind: 'literal', value: { components: [1, 1, 1], alpha: 1 } },
        variableId: 'VariableID:1:1',
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildNameUpdatePayload({
      baseTokens,
      idByPath,
      remoteVariablesById: { 'VariableID:1:1': { name: 'Global/White' } },
    })

    expect(variables).toHaveLength(0)
  })

  it('never emits an UPDATE for a still-temp (not-yet-created) id', () => {
    const baseTokens = [{ path: ['Global', 'Spacing', 'Lg'], type: 'number', value: { kind: 'literal', value: 24 } }]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildNameUpdatePayload({ baseTokens, idByPath, remoteVariablesById: {} })

    expect(variables).toHaveLength(0)
  })

  it("skips a real id absent from remoteVariablesById (this run's own fresh CREATE, already named correctly)", () => {
    const baseTokens = [
      {
        path: ['Global', 'White'],
        type: 'color',
        value: { kind: 'literal', value: { components: [1, 1, 1], alpha: 1 } },
        variableId: 'VariableID:1:1',
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildNameUpdatePayload({ baseTokens, idByPath, remoteVariablesById: {} })

    expect(variables).toHaveLength(0)
  })

  it('renames the same-shaped path onto every sub-variable of a composite (shadow) token', () => {
    const baseTokens = [
      {
        path: ['Global', 'Shadow', 'SmRename'],
        type: 'shadow',
        value: {
          kind: 'literal',
          value: {
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 1, unit: 'px' },
            blur: { value: 2, unit: 'px' },
            spread: { value: 0, unit: 'px' },
            color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1 },
          },
        },
        variableId: {
          offsetX: 'VariableID:s:1',
          offsetY: 'VariableID:s:2',
          blur: 'VariableID:s:3',
          spread: 'VariableID:s:4',
          color: 'VariableID:s:5',
        },
      },
    ]
    const idByPath = assignVariableIds(baseTokens)
    const { variables } = buildNameUpdatePayload({
      baseTokens,
      idByPath,
      remoteVariablesById: {
        'VariableID:s:1': { name: 'Global/Shadow/Sm/OffsetX' },
        'VariableID:s:2': { name: 'Global/Shadow/Sm/OffsetY' },
        'VariableID:s:3': { name: 'Global/Shadow/Sm/Blur' },
        'VariableID:s:4': { name: 'Global/Shadow/Sm/Spread' },
        'VariableID:s:5': { name: 'Global/Shadow/Sm/Color' },
      },
    })

    expect(variables).toHaveLength(5)
    expect(new Set(variables.map(v => v.name))).toEqual(
      new Set([
        'Global/Shadow/SmRename/OffsetX',
        'Global/Shadow/SmRename/OffsetY',
        'Global/Shadow/SmRename/Blur',
        'Global/Shadow/SmRename/Spread',
        'Global/Shadow/SmRename/Color',
      ]),
    )
  })
})

describe('figmaVariableName', () => {
  it('joins the token path with "/", matching Figma variable naming', () => {
    expect(figmaVariableName(['🔗 Alias', 'Color', 'Background'])).toBe('🔗 Alias/Color/Background')
  })

  it('replaces "." within a segment, which Figma rejects as an invalid name character', () => {
    expect(figmaVariableName(['🌐 Global', '📏 Dimension', 'Size', '0.875'])).toBe('🌐 Global/📏 Dimension/Size/0_875')
  })
})

describe('buildNameIndex', () => {
  const meta = {
    variables: {
      'VariableID:1:1': { id: 'VariableID:1:1', name: 'Global/White', variableCollectionId: 'coll-1' },
      'VariableID:1:2': { id: 'VariableID:1:2', name: 'Global/Black', variableCollectionId: 'coll-2' }, // different collection
    },
  }

  it('maps variable name to id, scoped to the given collection', () => {
    expect(buildNameIndex(meta, 'coll-1')).toEqual(new Map([['Global/White', 'VariableID:1:1']]))
  })

  it('excludes variables from other collections', () => {
    expect(buildNameIndex(meta, 'coll-1').has('Global/Black')).toBe(false)
  })
})

describe('assignVariableIds path/name fallback match (docs/adr/0001-figma-variable-identity-key.md)', () => {
  const unsynced = { path: ['Global', 'Spacing', 'Lg'], type: 'number', value: { kind: 'literal', value: 24 } }

  it('links to an existing Figma variable of the same name instead of minting a temp id', () => {
    const nameIndex = new Map([['Global/Spacing/Lg', 'VariableID:9:9']])
    const idByPath = assignVariableIds([unsynced], nameIndex)
    expect(idByPath.get('Global.Spacing.Lg')).toBe('VariableID:9:9')
  })

  it('falls through to a temp id when no existing variable matches the name', () => {
    const idByPath = assignVariableIds([unsynced], new Map([['Some/Other/Name', 'VariableID:9:9']]))
    expect(idByPath.get('Global.Spacing.Lg')).toBe('temp-Global.Spacing.Lg')
  })

  it('an existing $extensions variableId always wins over a name match — id identity is never overridden by a name coincidence', () => {
    const withId = { ...unsynced, variableId: 'VariableID:1:1' }
    const idByPath = assignVariableIds([withId], new Map([['Global/Spacing/Lg', 'VariableID:9:9']]))
    expect(idByPath.get('Global.Spacing.Lg')).toBe('VariableID:1:1')
  })

  it('a name-fallback-linked token is excluded from the CREATE pass — this is the bug a real sandbox run caught: re-running against an already-populated file 400ed on a duplicate name', () => {
    const nameIndex = new Map([['Global/Spacing/Lg', 'VariableID:9:9']])
    const idByPath = assignVariableIds([unsynced], nameIndex)
    const { variables } = buildCreatePassPayload({
      baseTokens: [unsynced],
      brandTokensByName: { Base: [unsynced] },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })
    expect(variables).toEqual([])
  })

  it('collectNewlyCreatedIds still reports a name-fallback-linked token — GitHub never had this id committed, so it still needs the backfill commit', () => {
    const nameIndex = new Map([['Global/Spacing/Lg', 'VariableID:9:9']])
    const idByPath = assignVariableIds([unsynced], nameIndex)
    expect(collectNewlyCreatedIds([unsynced], idByPath)).toEqual([
      { path: unsynced.path, variableId: 'VariableID:9:9' },
    ])
  })
})

describe('findResolvedTypeMismatches', () => {
  const lineHeightToken = {
    path: ['🌐 Global', '🔤 Font', 'LineHeight', '2'],
    type: 'number',
    value: { kind: 'literal', value: 1.3 },
    variableId: 'VariableID:lh',
  }
  const opacityToken = {
    path: ['🔗 Alias', '🌫️ Opacity', 'Half'],
    type: 'number',
    value: { kind: 'literal', value: 0.5 },
    variableId: 'VariableID:op',
  }

  it('flags a LineHeight token whose existing Figma variable is still a FLOAT', () => {
    const remote = { 'VariableID:lh': { resolvedType: 'FLOAT' }, 'VariableID:op': { resolvedType: 'FLOAT' } }
    const mismatches = findResolvedTypeMismatches([lineHeightToken, opacityToken], remote)
    expect(mismatches).toEqual([{ token: lineHeightToken, ids: ['VariableID:lh'] }])
  })

  it('flags nothing once the LineHeight variable is already a STRING', () => {
    const remote = { 'VariableID:lh': { resolvedType: 'STRING' }, 'VariableID:op': { resolvedType: 'FLOAT' } }
    expect(findResolvedTypeMismatches([lineHeightToken, opacityToken], remote)).toEqual([])
  })

  it("recreates all of a typography token's sub-variables together when only lineHeight mismatches", () => {
    const typography = {
      path: ['🌐 Global', '🔤 Font', 'Typography', 'Test'],
      type: 'typography',
      value: { kind: 'literal', value: {} },
      variableId: { fontFamily: 'f', fontSize: 's', fontWeight: 'w', lineHeight: 'l' },
    }
    const remote = {
      f: { resolvedType: 'STRING' },
      s: { resolvedType: 'FLOAT' },
      w: { resolvedType: 'STRING' },
      l: { resolvedType: 'FLOAT' },
    }
    const [mismatch] = findResolvedTypeMismatches([typography], remote)
    expect(mismatch.ids).toEqual(['f', 's', 'w', 'l'])
  })

  it('ignores a token with no variableId or no matching remote variable', () => {
    expect(findResolvedTypeMismatches([{ ...lineHeightToken, variableId: undefined }], {})).toEqual([])
    expect(findResolvedTypeMismatches([lineHeightToken], {})).toEqual([])
  })
})

describe('findResolvedTypeMismatches with idByPath (name-matched variables)', () => {
  const lineHeightToken = {
    path: ['🌐 Global', '🔤 Font', 'LineHeight', '2'],
    type: 'number',
    value: { kind: 'literal', value: 1.3 },
  }

  it('lists a token without variableId whose name-matched Figma variable has another type, and recreates it after the delete', () => {
    const remote: Record<string, { id: string; name: string; variableCollectionId: string; resolvedType: string }> = {
      'VariableID:9:9': {
        id: 'VariableID:9:9',
        name: '🌐 Global/🔤 Font/LineHeight/2',
        variableCollectionId: 'coll-1',
        resolvedType: 'FLOAT',
      },
    }
    const nameIndexOf = () => buildNameIndex({ variables: remote }, 'coll-1')

    const idByPath = assignVariableIds([lineHeightToken], nameIndexOf())
    expect(idByPath.get('🌐 Global.🔤 Font.LineHeight.2')).toBe('VariableID:9:9')
    expect(findResolvedTypeMismatches([lineHeightToken], remote, idByPath)).toEqual([
      { token: lineHeightToken, ids: ['VariableID:9:9'] },
    ])

    delete remote['VariableID:9:9']
    const reassigned = assignVariableIds([lineHeightToken], nameIndexOf())
    expect(reassigned.get('🌐 Global.🔤 Font.LineHeight.2')).toBe('temp-🌐 Global.🔤 Font.LineHeight.2')
    const { variables } = buildCreatePassPayload({
      baseTokens: [lineHeightToken],
      brandTokensByName: { Base: [lineHeightToken] },
      idByPath: reassigned,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })
    expect(variables).toEqual([
      expect.objectContaining({ action: 'CREATE', id: 'temp-🌐 Global.🔤 Font.LineHeight.2', resolvedType: 'STRING' }),
    ])
  })

  it('skips temp ids', () => {
    const idByPath = assignVariableIds([lineHeightToken])
    const remote = { 'temp-🌐 Global.🔤 Font.LineHeight.2': { resolvedType: 'FLOAT' } }
    expect(findResolvedTypeMismatches([lineHeightToken], remote, idByPath)).toEqual([])
  })

  it('does not name-match a variable another token still commits under its old name', () => {
    const renamed = { path: ['A', 'C'], type: 'string', value: { kind: 'literal', value: 'c' }, variableId: 'V' }
    const added = { path: ['A', 'B'], type: 'number', value: { kind: 'literal', value: 1 } }
    const idByPath = assignVariableIds([renamed, added], new Map([['A/B', 'V']]))
    expect(idByPath.get('A.B')).toBe('temp-A.B')
    expect(idByPath.get('A.C')).toBe('V')
    expect(findResolvedTypeMismatches([renamed, added], { V: { resolvedType: 'STRING' } }, idByPath)).toEqual([])
  })
})

describe('dropUnknownVariableIds', () => {
  it('drops a plain id Figma does not have and keeps one it has', () => {
    const unknown = { path: ['A'], type: 'string', value: { kind: 'literal', value: 'x' }, variableId: 'gone' }
    const known = { path: ['B'], type: 'string', value: { kind: 'literal', value: 'y' }, variableId: 'here' }
    const dropped = dropUnknownVariableIds([unknown, known], { here: {} })
    expect(dropped).toEqual(['gone'])
    expect(unknown.variableId).toBeUndefined()
    expect(known.variableId).toBe('here')
  })

  it('drops only the missing sub-ids of a composite id and the whole id once none remain', () => {
    const partial = {
      path: ['Global', 'Shadow', 'Base'],
      type: 'shadow',
      value: { kind: 'literal', value: [] },
      variableId: { offsetX: 'x', offsetY: 'y', blur: 'b', spread: 's', color: 'c' } as
        Record<string, string> | undefined,
    }
    const allGone = {
      path: ['Alias', 'Border', 'Grey'],
      type: 'border',
      value: { kind: 'literal', value: {} },
      variableId: { color: 'bc', width: 'bw', style: 'bs' } as Record<string, string> | undefined,
    }
    const dropped = dropUnknownVariableIds([partial, allGone], { x: {}, y: {}, b: {}, s: {} })
    expect(dropped).toEqual(['c', 'bc', 'bw', 'bs'])
    expect(partial.variableId).toEqual({ offsetX: 'x', offsetY: 'y', blur: 'b', spread: 's' })
    expect(allGone.variableId).toBeUndefined()
  })

  it('completes only the dropped shadow sub-id as a CREATE, even when the dropped key is the shape discriminator', () => {
    const shadow = {
      path: ['Global', 'Shadow', 'Base'],
      type: 'shadow',
      value: {
        kind: 'literal',
        value: {
          color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.15, hex: '#000000' },
          offsetX: { value: 0, unit: 'rem' },
          offsetY: { value: 0.25, unit: 'rem' },
          blur: { value: 0.75, unit: 'rem' },
          spread: { value: 0, unit: 'rem' },
        },
      },
      variableId: { offsetX: 'x', offsetY: 'y', blur: 'b', spread: 's', color: 'c' } as Record<string, string>,
    }
    dropUnknownVariableIds([shadow], { y: {}, b: {}, s: {}, c: {} })
    const idByPath = assignVariableIds([shadow])
    expect(idByPath.get('Global.Shadow.Base')).toEqual({
      offsetX: 'temp-Global.Shadow.Base-offsetX',
      offsetY: 'y',
      blur: 'b',
      spread: 's',
      color: 'c',
    })
    const { variables } = buildCreatePassPayload({
      baseTokens: [shadow],
      brandTokensByName: { Base: [shadow] },
      idByPath,
      collectionId: 'coll-1',
      modeIdByBrand: { Base: 'm-base' },
    })
    expect(variables).toEqual([expect.objectContaining({ action: 'CREATE', id: 'temp-Global.Shadow.Base-offsetX' })])
    resolveTempIds(idByPath, { 'temp-Global.Shadow.Base-offsetX': 'real-x' })
    expect(collectNewlyCreatedIds([shadow], idByPath)).toEqual([
      {
        path: shadow.path,
        variableId: { offsetX: 'real-x', offsetY: 'y', blur: 'b', spread: 's', color: 'c' },
      },
    ])
  })
})

describe('isLikelyDifferentFigmaFile', () => {
  it('is fatal when most committed ids are unknown', () => {
    expect(isLikelyDifferentFigmaFile(100, 100)).toBe(true)
    expect(isLikelyDifferentFigmaFile(100, 51)).toBe(true)
  })

  it('is not fatal for a few unknown ids, or none', () => {
    expect(isLikelyDifferentFigmaFile(100, 1)).toBe(false)
    expect(isLikelyDifferentFigmaFile(100, 50)).toBe(false)
    expect(isLikelyDifferentFigmaFile(100, 0)).toBe(false)
    expect(isLikelyDifferentFigmaFile(0, 0)).toBe(false)
  })
})

describe('collectNewlyCreatedIds for a composite token that lacks sub-ids', () => {
  const deviceToken = {
    path: ['📱 Device', '↔️ Space', 'Lg'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 16, unit: 'px' } },
    responsive: {
      mobile: { value: 16, unit: 'px' },
      tablet: { value: 24, unit: 'px' },
      desktop: { value: 32, unit: 'px' },
    },
    variableId: { mobile: 'm', tablet: 't', desktop: 'd' } as Record<string, string>,
  }

  it('backfills the new device id of a responsive dimension token that has the 3 breakpoint ids', () => {
    const idByPath = assignVariableIds([deviceToken])
    expect(idByPath.get('📱 Device.↔️ Space.Lg')).toEqual({
      mobile: 'm',
      tablet: 't',
      desktop: 'd',
      device: 'temp-📱 Device.↔️ Space.Lg-device',
    })
    resolveTempIds(idByPath, { 'temp-📱 Device.↔️ Space.Lg-device': 'real-device' })
    expect(collectNewlyCreatedIds([deviceToken], idByPath)).toEqual([
      { path: deviceToken.path, variableId: { mobile: 'm', tablet: 't', desktop: 'd', device: 'real-device' } },
    ])
  })

  it('does not report a composite token whose ids are already complete', () => {
    const complete = { ...deviceToken, variableId: { mobile: 'm', tablet: 't', desktop: 'd', device: 'dev' } }
    const idByPath = assignVariableIds([complete])
    expect(collectNewlyCreatedIds([complete], idByPath)).toEqual([])
  })
})

describe('assignVariableIds for a composite token missing sub-ids', () => {
  it('name-matches the missing sub-id of a border token', () => {
    const border = {
      path: ['Alias', 'Border', 'Composite', 'Grey'],
      type: 'border',
      value: { kind: 'literal', value: { color: '{A.Color}', width: '{A.Width}', style: '{A.Style}' } },
      variableId: { color: 'bc', width: 'bw' } as Record<string, string>,
    }
    const nameIndex = new Map([[figmaBorderSubVariableName(border.path, 'style'), 'bs']])
    expect(assignVariableIds([border], nameIndex).get('Alias.Border.Composite.Grey')).toEqual({
      color: 'bc',
      width: 'bw',
      style: 'bs',
    })
  })

  const responsiveToken = {
    path: ['Alias', 'Space', 'Lg'],
    type: 'dimension',
    value: { kind: 'literal', value: { value: 16, unit: 'px' } },
    responsive: {
      mobile: { value: 16, unit: 'px' },
      tablet: { value: 24, unit: 'px' },
      desktop: { value: 32, unit: 'px' },
    },
  }

  it('gives a responsive token missing its tablet id a temp id for it', () => {
    const token = { ...responsiveToken, variableId: { mobile: 'm', desktop: 'd' } }
    expect(assignVariableIds([token]).get('Alias.Space.Lg')).toEqual({
      mobile: 'm',
      tablet: 'temp-Alias.Space.Lg-tablet',
      desktop: 'd',
    })
  })

  it('keeps the existing device id of a responsive token that is not Device-eligible', () => {
    const token = { ...responsiveToken, variableId: { mobile: 'm', tablet: 't', desktop: 'd', device: 'dev' } }
    expect(assignVariableIds([token]).get('Alias.Space.Lg')).toEqual({
      mobile: 'm',
      tablet: 't',
      desktop: 'd',
      device: 'dev',
    })
  })
})
