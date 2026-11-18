# 38. Inverted is a boolean, not a color

Package: `packages/core`, `packages/tokens`

Date: 2026-11-18

## Status

Accepted

## Context

**Inverted** (see `packages/core/CONTEXT.md`) describes the surface a component sits on, not a hue.
`ds-button`, `ds-icon`, `ds-spinner`, `ds-text` and `ds-heading` already expose it as a boolean
`inverted` prop. `ds-logo` and `ds-divider` exposed it as a `color` value (`color="inverted"`), so
consumers had to learn two APIs for the same idea, and `ds-divider` could not combine a color with a
dark surface (`primary` on a dark background was not expressible).

## Decision

- Every component that can sit on a dark surface exposes a boolean `inverted` prop. `inverted` is
  never a value of a `color` prop.
- `inverted` combines with `color`: each color has its own inverted Component token, named
  `<Component>.Color.Inverted<Color>` (e.g. `Divider.Color.InvertedPrimary` →
  `--ds-divider-color-inverted-primary`). Tokens may share a value (all divider inverted tokens are
  white), but each color keeps its own token so a brand can tell them apart.
- A component whose only color was `primary` drops its `color` prop (`ds-logo`).
- Hybrid CSS uses `.is-inverted` as a modifier next to the color class (`.is-primary.is-inverted`).
  `.is-inverted` alone means the default color, inverted.

## Considered options

- **Keep `color="inverted"` as a deprecated alias.** Non-breaking, but both APIs would live until the
  next major. Rejected in favour of one clean break.
- **One shared inverted token per component.** Fewer tokens, but a brand could not tint an inverted
  primary divider differently from an inverted default one, and Figma could not bind per variant.
  Rejected.
- **A token group (`Divider.Color.Inverted.Primary`).** DTCG does not allow the existing
  `Divider.Color.Inverted` token to also be a group, and flat `Inverted<Color>` names match the alias
  layer (`Border.Color.InvertedPrimary`). Rejected.

## Consequences

- Breaking change: `ds-logo` loses `color`, `ds-divider` loses `color="inverted"`, and
  `--ds-divider-color-inverted` becomes `--ds-divider-color-inverted-default` (same Figma variable).
- New components with a dark-surface variant add `inverted` plus one inverted token per color.
