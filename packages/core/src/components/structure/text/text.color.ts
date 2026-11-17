import { hasValue } from '@utils'

/**
 * The one color class `ds-text` paints. Disabled wins, then invalid, then inverted.
 * A later color must not override those states. Disabled on a dark background pairs
 * with inverted to paint `inverted-disabled`.
 */
export function resolveTextColor(state: {
  disabled?: boolean
  invalid?: boolean
  inverted?: boolean
  color?: string
}): string | undefined {
  if (state.disabled) return state.inverted ? 'inverted-disabled' : 'disabled'
  if (state.invalid) return 'danger'
  if (state.inverted) return 'inverted'
  return hasValue(state.color) ? state.color : undefined
}
