/**
 * Maps a resolved DTCG literal value + `$type` to what Figma's Variables
 * REST API expects — both the `resolvedType` used when creating a
 * variable, and the mode-value shape itself. Only the `$type`s actually
 * present in packages/tokens/tokens/Base.tokens.json today (color, number,
 * string, fontWeight, fontFamily) plus boolean (present in the DTCG spec,
 * absent from this file today but cheap to support correctly) are handled —
 * anything else fails loudly rather than guessing at an unverified mapping,
 * since there's no live Figma file to check the guess against yet
 * (docs/plans/figma-sync-action-plan.md §8).
 *
 * Figma Variables have no native font-weight type, so `fontWeight` projects
 * onto `STRING`, same as `string` does — two DTCG types sharing one Figma
 * resolvedType (see docs/plans/font-weight-token-type-plan.md). `fontFamily`
 * shares it too, for the same reason plus Figma having no font-stack/array
 * concept — only the first (primary) font of the array is ever sent (see
 * docs/plans/font-family-token-type-plan.md). `dimension` maps onto `FLOAT`
 * instead — Figma variables are always raw px floats, no rem concept, so a
 * rem-unit dimension token is converted (×16) on the way out (see
 * docs/plans/dimension-token-type-plan.md). `shadow` doesn't go through this
 * table/switch at all — see figmaShadowSubValuesFor below. Figma has no
 * shadow-object variable type, so one shadow token maps to 5 separate Figma
 * variables (one per sub-value), not 1 (see
 * docs/plans/shadow-token-type-plan.md).
 */

import { parseReferencePath, pathKey, resolveLiteral } from './alias.mjs'

const RESOLVED_TYPE_BY_DTCG_TYPE = {
  color: 'COLOR',
  number: 'FLOAT',
  string: 'STRING',
  boolean: 'BOOLEAN',
  fontWeight: 'STRING',
  fontFamily: 'STRING',
  dimension: 'FLOAT',
  textDecoration: 'STRING',
  textTransform: 'STRING',
}

// 1rem = 16px, this repo's fixed base font size (matches
// packages/tokens/src/config.base.ts's basePxFontSize).
const PX_PER_REM = 16

// Figma's line-height convention is a percentage string ("150%"), not the raw CSS-style multiplier
// this codebase stores in JSON (1.5) — so a LineHeight Figma variable is a `STRING`, not a `FLOAT`
// (a FLOAT has nowhere to carry the `%`). Only this push-side transform changes; the JSON tokens
// themselves stay on the multiplier. Applies to both a standalone `number`-typed LineHeight token
// (isLineHeightNumberToken below) and a `typography` composite token's `lineHeight` sub-value
// (figmaTypographySubEntriesFor) — every LineHeight-shaped Figma variable in the file, so aliases
// between them never mix types. Inverse (strict, throws on anything but "NNN%"):
// apps/toky/src/tokens/figma-map.ts's lineHeightFromFigmaPercent (reimplemented there, not
// imported — Node-only module, outside apps/toky's module boundary).
export const LINE_HEIGHT_PERCENT_MULTIPLIER = 100

// Decimals kept when scaling to a percentage — enough to round-trip any realistic multiplier while
// dropping float noise (1.15 * 100 === 114.99999999999999).
const LINE_HEIGHT_PERCENT_DECIMALS = 4

// A standalone `number` token is this codebase's LineHeight primitive/alias/component-override
// group (Global.Font.LineHeight.*, Alias.Text.LineHeight.*, Component.*.LineHeight) whenever
// "LineHeight" appears anywhere in its path — `$type: "number"` alone can't tell it apart from
// Opacity/ZIndex/Radius tokens, which share the same type but must stay a raw unitless number.
export function isLineHeightNumberToken(token) {
  return token.type === 'number' && token.path.includes('LineHeight')
}

function formatFigmaPercent(multiplier) {
  return `${Number((multiplier * LINE_HEIGHT_PERCENT_MULTIPLIER).toFixed(LINE_HEIGHT_PERCENT_DECIMALS))}%`
}

export function figmaLineHeightPercentFor(literalValue) {
  if (typeof literalValue !== 'number') {
    throw new Error(`Unsupported LineHeight value "${JSON.stringify(literalValue)}" — expected a number.`)
  }
  return formatFigmaPercent(literalValue)
}

/**
 * A typography token's letter-spacing, as Figma's percentage string ("20%"). The token stores a rem
 * `dimension` (DTCG), but Figma's letter spacing is relative to the font size, so the percentage is
 * letterSpacingPx / fontSizePx — computed here against the same token's resolved desktop font size
 * (docs/plans/typography-letter-spacing-text-decoration-plan.md decision 2). A zero letter-spacing
 * is "0%" at every size, so it never needs a font size at all.
 *
 * @param {unknown} letterSpacing resolved `{value, unit}` dimension literal
 * @param {unknown} fontSize resolved desktop `{value, unit}` dimension literal
 */
export function figmaLetterSpacingPercentFor(letterSpacing, fontSize) {
  const letterSpacingPx = figmaValueFor('dimension', letterSpacing)
  if (letterSpacingPx === 0) return formatFigmaPercent(0)
  const fontSizePx = figmaValueFor('dimension', fontSize)
  if (fontSizePx === 0) {
    throw new Error('Cannot express a non-zero letter-spacing as a percentage of a zero font size.')
  }
  return formatFigmaPercent(letterSpacingPx / fontSizePx)
}

// textDecoration / textTransform have no native Figma variable type yet, so they ride on STRING
// variables holding Figma's own text-property names (plan decisions 4 and 6) — a future native
// binding then needs no migration. The CSS keyword is what the token stores.
export const FIGMA_TEXT_DECORATION_BY_KEYWORD = {
  'none': 'NONE',
  'underline': 'UNDERLINE',
  'line-through': 'STRIKETHROUGH',
}
export const FIGMA_TEXT_TRANSFORM_BY_KEYWORD = {
  none: 'ORIGINAL',
  uppercase: 'UPPER',
  lowercase: 'LOWER',
  capitalize: 'TITLE',
}

function figmaTextKeywordFor(table, label, literalValue) {
  const figmaName = table[literalValue]
  if (!figmaName) {
    throw new Error(`Unsupported ${label} value "${literalValue}" — expected one of: ${Object.keys(table).join(', ')}.`)
  }
  return figmaName
}

// Figma doesn't understand a numeric font weight — its "Font Weight"
// variable binding expects the font's named style (e.g. "Bold"), not "700".
// Generic DTCG first-listed keyword per weight
// (https://www.designtokens.org/tr/drafts/format/#font-weight), Title Case
// + hyphenated, matching apps/toky's FONT_WEIGHT_OPTIONS labels. A
// best-effort default — the real BaloiseCreateHeadline/BaloiseCreateText
// style names in Figma may differ and should be verified
// (docs/plans/font-weight-token-type-plan.md).
export const FONT_WEIGHT_KEYWORD_BY_NUMBER = {
  100: 'Thin',
  200: 'Extra-Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi-Bold',
  700: 'Bold',
  800: 'Extra-Bold',
  900: 'Black',
  950: 'Extra-Black',
}

/**
 * Maps a literal-valued token's resolved `$value` to the exact Figma shape write.mjs writes for
 * it — shared so the conflict check compares against the same shape it would actually sync,
 * rather than re-deriving (and risking drifting from) write.mjs's own mapping. Only covers the
 * standalone-token path (not shadow/border/typography's multi-variable fan-out), matching
 * conflict.mjs's current literal-token-only scope.
 */
export function figmaLiteralValueFor(token, literalValue) {
  return isLineHeightNumberToken(token)
    ? figmaLineHeightPercentFor(literalValue)
    : figmaValueFor(token.type, literalValue)
}

function channelToByte(value) {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
}

// Figma's REST API round-trips color floats through float32 (e.g. 0.5 comes back as
// 0.5000000074505806) — bit-exact comparison flags spurious "changes" on every read. Byte-rounds
// each channel, the same tolerance apps/toky/src/tokens/figma-map.ts's isColorEqual uses
// (reimplemented here, not imported — Node-only module, outside apps/toky's module boundary, same
// reasoning as LINE_HEIGHT_PERCENT_MULTIPLIER above).
export function isFigmaColorValueEqual(a, b) {
  if (!a || !b) return a === b
  return (
    channelToByte(a.r) === channelToByte(b.r) &&
    channelToByte(a.g) === channelToByte(b.g) &&
    channelToByte(a.b) === channelToByte(b.b) &&
    channelToByte(a.a) === channelToByte(b.a)
  )
}

/** Equality for any Figma mode-value shape the conflict check compares — colors get the
 * byte-rounded tolerance above; every other literal type (number/string/boolean) compares exactly. */
export function isFigmaValueEqual(dtcgType, a, b) {
  return dtcgType === 'color' ? isFigmaColorValueEqual(a, b) : JSON.stringify(a) === JSON.stringify(b)
}

export function resolvedTypeFor(dtcgType) {
  const resolvedType = RESOLVED_TYPE_BY_DTCG_TYPE[dtcgType]
  if (!resolvedType) {
    throw new Error(`Unsupported token $type "${dtcgType}" — no known Figma resolvedType mapping.`)
  }
  return resolvedType
}

// Token-aware variant of resolvedTypeFor — a LineHeight `number` token is a Figma STRING ("150%"),
// every other token follows its `$type`.
export function resolvedTypeForToken(token) {
  return isLineHeightNumberToken(token) ? 'STRING' : resolvedTypeFor(token.type)
}

/**
 * @param {string} dtcgType
 * @param {unknown} literalValue already-resolved (non-reference) `$value`
 */
export function figmaValueFor(dtcgType, literalValue) {
  switch (dtcgType) {
    case 'color': {
      // DTCG color: { colorSpace: 'srgb', components: [r, g, b], alpha, hex }.
      // Figma color variable value: { r, g, b, a }, each a 0-1 float — the
      // same 0-1 range DTCG's "components" already uses for srgb, so this
      // is a direct field rename, not a conversion.
      const { components, alpha } = literalValue
      const [r, g, b] = components
      return { r, g, b, a: alpha }
    }
    case 'number':
    case 'string':
    case 'boolean':
      return literalValue
    case 'fontWeight': {
      // Figma doesn't accept a numeric weight — it needs the font's named
      // style (e.g. "Bold"), not "700".
      const keyword = FONT_WEIGHT_KEYWORD_BY_NUMBER[literalValue]
      if (!keyword) {
        throw new Error(`Unsupported fontWeight value "${literalValue}" — no known Figma keyword mapping.`)
      }
      return keyword
    }
    case 'textDecoration':
      return figmaTextKeywordFor(FIGMA_TEXT_DECORATION_BY_KEYWORD, 'textDecoration', literalValue)
    case 'textTransform':
      return figmaTextKeywordFor(FIGMA_TEXT_TRANSFORM_BY_KEYWORD, 'textTransform', literalValue)
    case 'fontFamily': {
      // Figma has no font-stack concept — only the primary (first) font is
      // ever sent, never the fallback chain.
      if (!Array.isArray(literalValue) || literalValue.length === 0) {
        throw new Error(`Unsupported fontFamily value "${JSON.stringify(literalValue)}" — expected a non-empty array.`)
      }
      return String(literalValue[0])
    }
    case 'dimension': {
      const { value, unit } = literalValue ?? {}
      if (typeof value !== 'number' || (unit !== 'px' && unit !== 'rem')) {
        throw new Error(
          `Unsupported dimension value "${JSON.stringify(literalValue)}" — expected {value, unit: 'px'|'rem'}.`,
        )
      }
      return unit === 'rem' ? value * PX_PER_REM : value
    }
    default:
      throw new Error(`Unsupported token $type "${dtcgType}" — no known Figma value mapping.`)
  }
}

// The DTCG literal a "no shadow" empty-array token (e.g. Alias.Shadow.Box.None) decomposes to —
// an explicit all-zero, fully transparent single layer, rather than leaving the token unsynced
// (see isSyncableShadowToken below). Visually equivalent to no shadow at all in Figma.
const ZERO_TRANSPARENT_SHADOW_LAYER = {
  color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0, hex: '#000000' },
  offsetX: { value: 0, unit: 'px' },
  offsetY: { value: 0, unit: 'px' },
  blur: { value: 0, unit: 'px' },
  spread: { value: 0, unit: 'px' },
}

/**
 * `shadow` doesn't fit figmaValueFor's one-DTCG-value -> one-Figma-value shape — Figma has no
 * shadow-object variable type, so a shadow token needs 5 separate Figma variables (offsetX,
 * offsetY, blur, spread as FLOAT; color as COLOR), one per sub-value. Figma also has no
 * multi-layer-shadow variable concept, so an array `$value` is lossy either way it's handled: an
 * empty array ("no shadow") decomposes to `ZERO_TRANSPARENT_SHADOW_LAYER` above; a non-empty
 * (multi-layer) array decomposes its first (closest/most prominent) layer only — an approximation,
 * not a guess, since there's no single-layer Figma equivalent for the rest until Figma adds
 * multi-layer shadow variable support.
 *
 * @param {unknown} literalValue already-resolved (non-reference) `$value` of a shadow token —
 *   either a single-layer object or an array of layers (possibly empty)
 * @returns {{ offsetX: number, offsetY: number, blur: number, spread: number, color: { r: number, g: number, b: number, a: number } } | null}
 */
export function figmaShadowSubValuesFor(literalValue) {
  const layer = Array.isArray(literalValue) ? (literalValue[0] ?? ZERO_TRANSPARENT_SHADOW_LAYER) : literalValue

  if (typeof layer !== 'object' || layer === null) return null

  const { color, offsetX, offsetY, blur, spread } = layer
  return {
    offsetX: figmaValueFor('dimension', offsetX),
    offsetY: figmaValueFor('dimension', offsetY),
    blur: figmaValueFor('dimension', blur),
    spread: figmaValueFor('dimension', spread),
    color: figmaValueFor('color', color),
  }
}

// Sub-property suffixes appended to a shadow token's path to name its 5 decomposed Figma
// variables, e.g. '🌐 Global/🗂️ Elevation/Shadow/1/OffsetX'. Order matches
// figmaShadowSubValuesFor's return shape; FLOAT for the first 4, COLOR for the last.
export const SHADOW_SUB_PROPERTIES = ['offsetX', 'offsetY', 'blur', 'spread', 'color']
export const SHADOW_SUB_PROPERTY_SUFFIX = {
  offsetX: 'OffsetX',
  offsetY: 'OffsetY',
  blur: 'Blur',
  spread: 'Spread',
  color: 'Color',
}
export const SHADOW_SUB_PROPERTY_RESOLVED_TYPE = {
  offsetX: 'FLOAT',
  offsetY: 'FLOAT',
  blur: 'FLOAT',
  spread: 'FLOAT',
  color: 'COLOR',
}

// Every shadow token is eligible for sync — reference, single-layer object, multi-layer array, or
// empty array all decompose via figmaShadowSubValuesFor above (which handles the array cases'
// lossy-but-visible fallback), so there's no unsyncable shadow shape left to exclude here.
export function isSyncableShadowToken(token) {
  return token.type === 'shadow'
}

// Whether this token can have a Figma identity at all — every type otherwise handled here, plus
// every shadow shape (isSyncableShadowToken is now unconditional for `shadow`).
export function isPushableToken(token) {
  return token.type !== 'shadow' || isSyncableShadowToken(token)
}

/**
 * `border` doesn't fit figmaValueFor's one-DTCG-value -> one-Figma-value shape either — Figma has
 * no border-object variable type, so a border token needs 3 separate Figma variables (color,
 * width, style), one per sub-value. Unlike shadow, there's no unsyncable shape to filter out first
 * (no multi-layer/array case) — every border composite token is eligible.
 *
 * Unlike shadow's sub-values (always inline literals), `color`/`width`/`style` are each typically a
 * `{reference}` string pointing at an Alias-layer primitive that already has its own Figma
 * variable (docs/plans/border-token-type-plan.md decision 4) — same "direct reference stays a live
 * link, not a flattened copy" policy as a responsive dimension breakpoint
 * (`figmaResponsiveDimensionSubEntriesFor` above): only one hop is checked, so write.mjs's pass 2
 * can bind a `VARIABLE_ALIAS` straight to that primitive's variable instead of this baking the
 * primitive's own literal value into the border's sub-variable, which would leave the Figma side
 * with a raw hex/px/keyword instead of a visible link to the primitive it actually tracks.
 *
 * @param {unknown} literalValue already-resolved (non-reference) `$value` of a border token —
 *   its `color`/`width`/`style` fields may themselves still be `{reference}` strings
 * @returns {{
 *   color: { kind: 'literal', value: { r: number, g: number, b: number, a: number } } | { kind: 'reference', path: string[] },
 *   width: { kind: 'literal', value: number } | { kind: 'reference', path: string[] },
 *   style: { kind: 'literal', value: string } | { kind: 'reference', path: string[] },
 * } | null}
 */
export function figmaBorderSubEntriesFor(literalValue) {
  if (typeof literalValue !== 'object' || literalValue === null) return null
  const { color, width, style } = literalValue
  const entryFor = (raw, dtcgType) => {
    const refPath = parseReferencePath(raw)
    if (refPath) return { kind: 'reference', path: refPath }
    return { kind: 'literal', value: figmaValueFor(dtcgType, raw) }
  }
  const styleEntry = entryFor(style, 'string')
  if (styleEntry.kind === 'literal' && typeof styleEntry.value !== 'string') return null
  return { color: entryFor(color, 'color'), width: entryFor(width, 'dimension'), style: styleEntry }
}

// Sub-property suffixes appended to a border token's path to name its 3 decomposed Figma
// variables, e.g. '🔗 Alias/▭ Border/Composite/Grey/BorderColor'. Order matches
// figmaBorderSubEntriesFor's return shape.
export const BORDER_SUB_PROPERTIES = ['color', 'width', 'style']
export const BORDER_SUB_PROPERTY_SUFFIX = {
  color: 'BorderColor',
  width: 'BorderWidth',
  style: 'BorderStyle',
}
export const BORDER_SUB_PROPERTY_RESOLVED_TYPE = {
  color: 'COLOR',
  width: 'FLOAT',
  style: 'STRING',
}

// Every border composite token is eligible for sync — no unsyncable shape to exclude (unlike
// shadow's multi-layer/empty-array case).
export function isSyncableBorderToken(token) {
  return token.type === 'border'
}

/**
 * `typography` doesn't fit figmaValueFor's one-DTCG-value -> one-Figma-value shape either — Figma
 * has no typography-object variable type, so a typography token needs 7 separate Figma variables
 * (fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textDecoration, textTransform), one
 * per sub-value. Same "no unsyncable shape"
 * situation as border — no array/multi-layer case exists for typography either (see
 * docs/plans/typography-token-type-plan.md decision 5 — a typography token's $value is always a
 * single flat object).
 *
 * fontFamily/fontWeight are always `{reference}` strings (decision 4), same as border's
 * color/width/style; fontSize/lineHeight/textDecoration/textTransform are free literal-or-
 * reference. Every one of those 6 keeps a direct single-hop `{reference}` as a live link (same
 * policy as border's sub-values and a responsive dimension breakpoint) rather than flattening it to
 * a copy of the primitive's value — each one's target is itself a plain token whose own Figma
 * variable already has the exact resolvedType this sub-property expects (e.g. a LineHeight-path
 * `number` token is STRING-typed on the Figma side too, via `isLineHeightNumberToken`, so lineHeight
 * can alias straight to it). `letterSpacing` is the one exception: Figma's letter-spacing is always
 * expressed as a percentage of *this* composite's own fontSize (see
 * `figmaLetterSpacingPercentFor`), a value derived from two inputs rather than a 1:1 copy of any
 * single variable, so it's always computed here, never tagged 'reference' — there's no primitive it
 * could alias to.
 *
 * @param {unknown} literalValue already-resolved (non-reference) `$value` of a typography token —
 *   its `fontFamily`/`fontSize`/`fontWeight`/`lineHeight`/`textDecoration`/`textTransform` fields
 *   may themselves still be `{reference}` strings
 * @param {Map<string, import('./tokens.mjs').Token>} tokenIndex
 * @returns {{
 *   fontFamily: { kind: 'literal', value: string } | { kind: 'reference', path: string[] },
 *   fontSize: { kind: 'literal', value: number } | { kind: 'reference', path: string[] },
 *   fontWeight: { kind: 'literal', value: string } | { kind: 'reference', path: string[] },
 *   lineHeight: { kind: 'literal', value: string } | { kind: 'reference', path: string[] },
 *   letterSpacing: { kind: 'literal', value: string },
 *   textDecoration: { kind: 'literal', value: string } | { kind: 'reference', path: string[] },
 *   textTransform: { kind: 'literal', value: string } | { kind: 'reference', path: string[] },
 * } | null}
 */
export function figmaTypographySubEntriesFor(literalValue, tokenIndex) {
  if (typeof literalValue !== 'object' || literalValue === null) return null
  const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textDecoration, textTransform } = literalValue

  const entryFor = (raw, dtcgType) => {
    const refPath = parseReferencePath(raw)
    if (refPath) return { kind: 'reference', path: refPath }
    return { kind: 'literal', value: figmaValueFor(dtcgType, raw) }
  }

  const lineHeightRefPath = parseReferencePath(lineHeight)
  let lineHeightEntry
  if (lineHeightRefPath) {
    lineHeightEntry = { kind: 'reference', path: lineHeightRefPath }
  } else {
    const lineHeightLiteral = resolveLiteral(lineHeight, tokenIndex)
    if (typeof lineHeightLiteral !== 'number') return null
    lineHeightEntry = { kind: 'literal', value: figmaLineHeightPercentFor(lineHeightLiteral) }
  }

  const letterSpacingLiteral = resolveLiteral(letterSpacing, tokenIndex)
  const textDecorationLiteral = resolveLiteral(textDecoration, tokenIndex)
  const textTransformLiteral = resolveLiteral(textTransform, tokenIndex)
  if (letterSpacingLiteral === undefined || textDecorationLiteral === undefined || textTransformLiteral === undefined) {
    return null
  }

  return {
    fontFamily: entryFor(fontFamily, 'fontFamily'),
    fontSize: entryFor(fontSize, 'dimension'),
    fontWeight: entryFor(fontWeight, 'fontWeight'),
    lineHeight: lineHeightEntry,
    letterSpacing: {
      kind: 'literal',
      value: figmaLetterSpacingPercentFor(letterSpacingLiteral, resolveDesktopDimension(fontSize, tokenIndex)),
    },
    textDecoration: entryFor(textDecoration, 'textDecoration'),
    textTransform: entryFor(textTransform, 'textTransform'),
  }
}

// A responsive dimension token's own `$value` mirrors its mobile breakpoint (plan decision 4), so
// following it like any other reference would give the *mobile* size. Letter-spacing percentages
// are expressed against the desktop font size, so a reference to a responsive token is followed
// through its `responsive.desktop` value instead (which may itself be a reference).
function resolveDesktopDimension(rawValue, tokenIndex) {
  const refPath = parseReferencePath(rawValue)
  const target = refPath ? tokenIndex.get(pathKey(refPath)) : undefined
  if (target && isRawResponsiveDimensionValue(target.responsive)) {
    return resolveLiteral(target.responsive.desktop, tokenIndex)
  }
  return resolveLiteral(rawValue, tokenIndex)
}

// Sub-property suffixes appended to a typography token's path to name its 7 decomposed Figma
// variables, e.g. '🌐 Global/🔤 Font/Typography/Test/FontFamily'. Order matches
// figmaTypographySubEntriesFor's return shape.
export const TYPOGRAPHY_SUB_PROPERTIES = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textDecoration',
  'textTransform',
]
export const TYPOGRAPHY_SUB_PROPERTY_SUFFIX = {
  fontFamily: 'FontFamily',
  fontSize: 'FontSize',
  fontWeight: 'FontWeight',
  lineHeight: 'LineHeight',
  letterSpacing: 'LetterSpacing',
  textDecoration: 'TextDecoration',
  textTransform: 'TextTransform',
}
export const TYPOGRAPHY_SUB_PROPERTY_RESOLVED_TYPE = {
  fontFamily: 'STRING',
  fontSize: 'FLOAT',
  fontWeight: 'STRING',
  lineHeight: 'STRING',
  letterSpacing: 'STRING',
  textDecoration: 'STRING',
  textTransform: 'STRING',
}

// Every typography token is eligible for sync — no unsyncable shape to exclude, same as border.
export function isSyncableTypographyToken(token) {
  return token.type === 'typography'
}

/**
 * A responsive dimension token doesn't fit figmaValueFor's one-DTCG-value -> one-Figma-value shape
 * either — Figma has no native responsive/breakpoint concept, so a responsive dimension token
 * needs 3 separate Figma variables (mobile, tablet, desktop), one per breakpoint (see
 * docs/plans/responsive-dimension-token-plan.md decision 8 — sibling variables, not modes, mirrors
 * shadow/border/typography's own fan-out rather than the brand-mode mechanism). Unlike shadow (a
 * distinct `$type`), this lives inside a plain `$type: "dimension"` token's `$extensions` (decision
 * 2) — `isSyncableResponsiveDimensionToken` below is what actually detects it, not a `$type` check
 * alone.
 *
 * Each breakpoint is free literal-or-reference (decision 3), same as border's width/color — but
 * unlike border/typography's sub-values (always flattened to a literal via `resolveLiteral`,
 * however many reference hops that takes), a breakpoint that's a *direct* `{reference}` string
 * stays a reference here: Figma has a real variable for the thing it points at (a `Global`/`Alias`
 * dimension primitive), so it's bound with a `VARIABLE_ALIAS` rather than flattened to a number —
 * the whole point being that the value shown in Figma stays a live link to that primitive, not a
 * copy of it. A multi-hop reference (a reference to a reference) still isn't supported here — only
 * one hop is checked; write.mjs falls back to treating an unresolvable case as ineligible, same
 * "not eligible" policy as elsewhere in this file, rather than guessing.
 *
 * @param {unknown} literalValue a responsive dimension token's raw `$extensions.com.helvetia.responsive`
 *   value — its `mobile`/`tablet`/`desktop` fields may themselves still be `{reference}` strings
 * @returns {{
 *   mobile: { kind: 'literal', value: number } | { kind: 'reference', path: string[] },
 *   tablet: { kind: 'literal', value: number } | { kind: 'reference', path: string[] },
 *   desktop: { kind: 'literal', value: number } | { kind: 'reference', path: string[] },
 * } | null}
 */
export function figmaResponsiveDimensionSubEntriesFor(literalValue) {
  if (typeof literalValue !== 'object' || literalValue === null) return null
  const { mobile, tablet, desktop } = literalValue
  const entryFor = raw => {
    const refPath = parseReferencePath(raw)
    if (refPath) return { kind: 'reference', path: refPath }
    return { kind: 'literal', value: figmaValueFor('dimension', raw) }
  }
  return { mobile: entryFor(mobile), tablet: entryFor(tablet), desktop: entryFor(desktop) }
}

// Sub-property suffixes appended to a responsive dimension token's path to name its 3 decomposed
// Figma variables, e.g. '📱 Device/↔️ Space/Lg/Mobile'. Order matches
// figmaResponsiveDimensionSubValuesFor's return shape.
export const RESPONSIVE_DIMENSION_SUB_PROPERTIES = ['mobile', 'tablet', 'desktop']
export const RESPONSIVE_DIMENSION_SUB_PROPERTY_SUFFIX = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
}
export const RESPONSIVE_DIMENSION_SUB_PROPERTY_RESOLVED_TYPE = {
  mobile: 'FLOAT',
  tablet: 'FLOAT',
  desktop: 'FLOAT',
}

function isRawResponsiveDimensionValue(value) {
  return typeof value === 'object' && value !== null && 'mobile' in value && 'tablet' in value && 'desktop' in value
}

// A responsive dimension token is a `dimension` token carrying a well-formed
// `$extensions.com.helvetia.responsive` — every *other* dimension token (the overwhelming
// majority) stays on the single-Figma-variable path, so this can't just check `token.type` the
// way isSyncableBorderToken/isSyncableTypographyToken do.
export function isSyncableResponsiveDimensionToken(token) {
  return token.type === 'dimension' && isRawResponsiveDimensionValue(token.responsive)
}

// MVP scope for the "Design Responsive Tokens" collection — the collection replaces nothing; it
// *adds* one Device variable per in-scope token, whose 3 breakpoint modes each alias the matching
// Mobile/Tablet/Desktop sibling variable already written into "Design Tokens". Hardcoded rather than
// a new `$extensions` marker — deliberately provisional, expected to grow (e.g. to Component-level
// responsive tokens like `Component.Text.Space`/`Component.Logo.Size.*`, which already carry the
// responsive extension today but aren't in this list) by editing this array, not by touching token
// JSON schema. These 3 groups moved from `🔗 Alias` to their own `📱 Device` top-level layer (see
// docs/plans/device-token-layer-plan.md) — this array tracks that move, but the Figma-side
// mechanism itself (3 sibling variables in "Design Tokens" + this collection's derived 4th Device
// variable) is deliberately unchanged; consolidating the siblings themselves into this collection
// was considered and rejected (would drop per-brand override support for these tokens, since a
// Figma collection has exactly one mode axis and this one's is already spent on breakpoint).
const DEVICE_ELIGIBLE_PATH_PREFIXES = [
  ['📱 Device', '🔤 Text', 'Size'],
  ['📱 Device', '↔️ Space'],
  ['📱 Device', '🗃️ Container', 'Space'],
]

function pathStartsWith(path, prefix) {
  return prefix.every((segment, i) => path[i] === segment)
}

/**
 * Whether a responsive dimension token is in the "Design Responsive Tokens" collection's MVP scope
 * — i.e. whether it gets a 4th `device` id and a Device variable, on top of its 3 Mobile/Tablet/
 * Desktop siblings which every responsive dimension token already gets regardless of this. Callers
 * must check `isSyncableResponsiveDimensionToken` first; this doesn't re-check the shape.
 */
export function isDeviceEligibleResponsiveDimensionToken(token) {
  return DEVICE_ELIGIBLE_PATH_PREFIXES.some(prefix => pathStartsWith(token.path, prefix))
}

// The Device variable's name mirrors the existing CSS `-mobile/-tablet/-desktop` -> `-device`
// convention (packages/tokens/src/formatter.ts) — same path as the sibling variables, `Device`
// appended, e.g. '📱 Device/↔️ Space/Lg/Device'. Lives in the "Design Responsive Tokens" collection,
// not alongside its siblings, so the shared name isn't a collision (different collection = different
// id namespace).
export function figmaResponsiveDimensionDeviceVariableName(path) {
  return `${path.join('/')}/Device`
}

/**
 * Flattens a token's variableId into a list of plain string ids, tagged with which sub-property
 * (if any) each one represents — every other type has exactly one untagged id; a shadow token has
 * 5 (one per SHADOW_SUB_PROPERTIES entry), a border token has 3 (one per BORDER_SUB_PROPERTIES
 * entry), a typography token has 7 (one per TYPOGRAPHY_SUB_PROPERTIES entry), a responsive
 * dimension token has 3 (one per RESPONSIVE_DIMENSION_SUB_PROPERTIES entry). Used anywhere that
 * needs to treat "this token's Figma identity" as a set of ids regardless of how many it is
 * (baseline bookkeeping, deletion detection) — see docs/plans/shadow-token-type-plan.md,
 * docs/plans/border-token-type-plan.md, docs/plans/typography-token-type-plan.md, and
 * docs/plans/responsive-dimension-token-plan.md.
 *
 * Distinguished by shape, not a type tag: a shadow id-set carries 'offsetX' (the others never do),
 * a typography id-set carries 'fontFamily', a responsive dimension id-set carries 'mobile' —
 * everything else object-shaped is treated as a border id-set.
 *
 * @param {unknown} variableId a token's raw $extensions.com.figma.variableId (string, object, or undefined)
 * @returns {{ id: string, subProperty: string | undefined }[]}
 */
export function flattenVariableId(variableId) {
  if (!variableId) return []
  if (typeof variableId === 'string') return [{ id: variableId, subProperty: undefined }]
  if (typeof variableId === 'object') {
    const subProperties = subPropertiesForVariableIdShape(variableId)
    return subProperties
      .filter(sub => variableId[sub])
      .map(sub => ({
        id: variableId[sub],
        subProperty: sub,
      }))
  }
  return []
}

// Shared shape-detection used by flattenVariableId and write.mjs's resolveTempIds — kept in one
// place so a 4th composite type only needs one new branch, not one per caller.
export function subPropertiesForVariableIdShape(variableId) {
  if ('offsetX' in variableId) return SHADOW_SUB_PROPERTIES
  if ('fontFamily' in variableId) return TYPOGRAPHY_SUB_PROPERTIES
  // 'device' is a 4th id alongside mobile/tablet/desktop, present only for a Device-eligible
  // responsive dimension token (isDeviceEligibleResponsiveDimensionToken) — the filter in
  // flattenVariableId drops it for every other (still 3-key) responsive dimension token, so
  // listing it unconditionally here is safe.
  if ('mobile' in variableId) return [...RESPONSIVE_DIMENSION_SUB_PROPERTIES, 'device']
  return BORDER_SUB_PROPERTIES
}
