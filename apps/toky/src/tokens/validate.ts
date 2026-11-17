import { pathFor } from './edit'
import type { WorkingToken } from './edit'
import { KEY_BY_LAYER } from './flatten'
import { toSlashPath } from './format'
import { flattenFigmaId } from './figma-map'
import { invalidSegments } from './path'
import { TEXT_DECORATION_VALUES, TEXT_TRANSFORM_VALUES } from '@helvetia-design/tokens/css-preview'

export interface ValidationError {
  tokenKey: string
  message: string
  // 'warning' issues are worth surfacing but never block staging/submitting —
  // unlike 'error', which the caller treats as blocking.
  severity: 'error' | 'warning'
}

const REQUIRED_NEW_TYPOGRAPHY_FIELDS = [
  { key: 'letterSpacing', label: 'letter spacing' },
  { key: 'textDecoration', label: 'text decoration' },
  { key: 'textTransform', label: 'text transform' },
] as const

function isEmptyValue(value: unknown): boolean {
  return value === '' || value === undefined || value === null
}

export function validateWorkingTokens(working: WorkingToken[]): ValidationError[] {
  const errors: ValidationError[] = []

  const pathCounts = new Map<string, number>()
  for (const { token } of working) {
    const key = pathFor(token.layer, token.name).join('.')
    pathCounts.set(key, (pathCounts.get(key) ?? 0) + 1)
  }

  const validPaths = new Set(pathCounts.keys())

  // A shadow token's figmaId is 5 sub-ids, not 1 (see
  // docs/plans/shadow-token-type-plan.md) — flattenFigmaId turns either
  // shape into a uniform list so a collision on *any* single sub-id (even
  // if the other 4 differ) still gets caught, same as every other type's
  // single id.
  const figmaIdCounts = new Map<string, number>()
  for (const { token } of working) {
    for (const { id } of flattenFigmaId(token.figmaId)) {
      figmaIdCounts.set(id, (figmaIdCounts.get(id) ?? 0) + 1)
    }
  }

  for (const { id, token } of working) {
    const path = pathFor(token.layer, token.name).join('.')

    if (token.name.trim() === '') {
      errors.push({ tokenKey: id, message: 'Name cannot be empty.', severity: 'error' })
    } else if (invalidSegments(token.name).length > 0) {
      errors.push({
        tokenKey: id,
        message: `"${invalidSegments(token.name).join('", "')}" must be PascalCase, e.g. "BackgroundBlue".`,
        severity: 'error',
      })
    } else if ((pathCounts.get(path) ?? 0) > 1) {
      errors.push({
        tokenKey: id,
        message: `Another token already uses "${toSlashPath(token.name)}" in this layer.`,
        severity: 'error',
      })
    }

    // Two tokens can never legitimately share a Figma variableId — Pull
    // indexes tokens by figmaId (see figma-pull.ts), so a collision here
    // means one of the two would silently shadow the other on the next Pull.
    const collidingSubIds = flattenFigmaId(token.figmaId).filter(({ id: subId }) => (figmaIdCounts.get(subId) ?? 0) > 1)
    if (collidingSubIds.length > 0) {
      errors.push({
        tokenKey: id,
        message: `Another token already uses the same Figma variable (${collidingSubIds.map(s => s.id).join(', ')}).`,
        severity: 'error',
      })
    }

    if (!token.referenceTarget && isEmptyValue(token.rawValue)) {
      errors.push({ tokenKey: id, message: 'Value cannot be empty.', severity: 'error' })
    }

    // docs/plans/typography-letter-spacing-text-decoration-plan.md: a typography token's
    // letterSpacing / textDecoration / textTransform are required (a whole-token reference inherits
    // them from its target, so only a literal typography value is checked).
    if (token.type === 'typography' && !token.referenceTarget && !isEmptyValue(token.rawValue)) {
      const typography = token.rawValue as Record<string, unknown> | null
      const missing = REQUIRED_NEW_TYPOGRAPHY_FIELDS.filter(
        field => typeof typography !== 'object' || typography === null || isEmptyValue(typography[field.key]),
      )
      if (missing.length > 0) {
        errors.push({
          tokenKey: id,
          message: `Typography is missing ${missing.map(field => field.label).join(', ')}.`,
          severity: 'error',
        })
      }
    }

    // textDecoration / textTransform primitives may only hold the CSS keywords the build accepts
    // (packages/tokens/src/css-value.ts's TEXT_DECORATION_VALUES / TEXT_TRANSFORM_VALUES) — the
    // build throws on anything else, so catch it here first.
    if (!token.referenceTarget && !isEmptyValue(token.rawValue)) {
      const allowed =
        token.type === 'textDecoration'
          ? TEXT_DECORATION_VALUES
          : token.type === 'textTransform'
            ? TEXT_TRANSFORM_VALUES
            : null
      if (allowed && !(allowed as readonly unknown[]).includes(token.rawValue)) {
        errors.push({
          tokenKey: id,
          message: `${token.type} must be one of: ${allowed.join(', ')}.`,
          severity: 'error',
        })
      }
    }

    // No partial responsive tokens (docs/plans/responsive-dimension-token-plan.md decision 6) —
    // unlike every other sub-field in this file, this is an explicit hard rule, not left lax.
    if (token.responsive) {
      const missing = (['mobile', 'tablet', 'desktop'] as const).filter(bp => isEmptyValue(token.responsive?.[bp]))
      if (missing.length > 0) {
        errors.push({
          tokenKey: id,
          message: `Responsive value is missing ${missing.join(', ')}.`,
          severity: 'error',
        })
      }
    }

    if (token.referenceTarget === path) {
      errors.push({ tokenKey: id, message: 'A token cannot reference itself.', severity: 'error' })
    } else if (token.referenceTarget && !validPaths.has(token.referenceTarget)) {
      errors.push({
        tokenKey: id,
        message: `"${toSlashPath(token.referenceTarget)}" does not match an existing token.`,
        severity: 'error',
      })
    }

    // Component tokens should alias through the Alias layer rather than
    // reaching straight into Global — not incorrect, just a shortcut that
    // skips the layer meant to carry semantic meaning. Dimension/Size is
    // exempt: there's no semantic aliasing to gain for raw size scale steps.
    if (
      token.layer === 'Component' &&
      token.referenceTarget?.startsWith(`${KEY_BY_LAYER.Global}.`) &&
      !token.referenceTarget?.startsWith(`${KEY_BY_LAYER.Global}.📏 Dimension.Size.`)
    ) {
      errors.push({
        tokenKey: id,
        message: `References "${toSlashPath(token.referenceTarget)}" directly from Global — consider aliasing it instead.`,
        severity: 'warning',
      })
    }
  }

  return errors
}
