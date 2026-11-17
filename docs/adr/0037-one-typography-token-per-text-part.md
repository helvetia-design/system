# 37. One typography token per text part, canonical typography CSS API

Package: `packages/core`, `packages/tokens`, `packages/styles`

Date: 2026-11-11

## Status

Accepted

## Context

[ADR-0035](0035-typography-letter-spacing-text-decoration-text-transform.md) gave every typography
token seven parts, but component stylesheets still wire only four of them (family, size, weight, line
height). Components style their text in three different ways: through a typography token, through loose
per-property Component tokens with no typography token behind them, or through Alias/Device tokens
directly. Text decoration is hardcoded (`ds-link`, the button link variant). The public CSS custom
properties mix two naming styles: `--button-font-family` next to `--link-family`, `--text-size`,
`--form-label-weight`.

A designer must be able to bind one text node in Figma to one token, and a brand must be able to
change any of the seven parts of any text in any component (for example, underline every level-1
heading) by overriding one token.

## Decision

- Every **text part** of a component (see `packages/tokens/CONTEXT.md`) is backed by exactly one
  Component-layer typography token. It may alias a shared one (`Notification.Body →
Text.Typo.Paragraph`). Loose per-property Component tokens are migrated into a typography token.
- New typography tokens are named `<Component>.[<Variant/State>.]<Part>.Typo`. Existing names stay.
- All seven parts are wired by one shared SCSS mixin family in `packages/core`, never by hand.
- An **inline text part** (a link in running text) applies weight, letter spacing, text decoration and
  text transform, and inherits family, size and line height from the surrounding text.
- A **part modifier** (single-property Component token) may override exactly one part for a prop or
  state that changes only that part (`ds-text` weight, a selected datepicker day). Two or more changed
  parts need their own typography token.
- Every typography token's `fontSize` resolves to a `Device.Text.Size.*` token. The tokens build fails
  otherwise.
- Text decoration that depends on a variant or state comes from the typography token. A pure element
  reset (`text-decoration: none` on `<a>`/`<button>`) stays hardcoded.
- Public CSS custom properties use one canonical shape:
  `--<component>[-<part>]-{font-family,font-size,font-weight,line-height,letter-spacing,text-decoration,text-transform}`.
  The short names (`--link-family`, `--text-size`, …) are removed, not deprecated.
- Color is not part of a typography token and is not covered by this decision.

## Considered options

- **Keep the short public names as deprecated fallbacks.** Non-breaking, but every component would
  carry two names per part until the next major, and the mixin would need a legacy parameter. Rejected
  in favour of one clean break.
- **Allow per-component naming in the mixin.** Keeps the inconsistency forever. Rejected.
- **Loose per-property tokens instead of one typography token.** Figma cannot bind a text part in one
  step, and a brand override touches many tokens. Rejected.
- **Size variants for links instead of inheritance.** Breaks links inside larger running text and forces
  consumers to choose a size. Rejected.

## Consequences

- Breaking change for consumers that override the short custom properties: major changeset with a
  migration table.
- Every component's public CSS API gains `letter-spacing`, `text-decoration` and `text-transform`.
- A brand override of an inline text part's size or line height has no effect in code.
- A token that should not change across breakpoints still needs a Device token (with equal values).
