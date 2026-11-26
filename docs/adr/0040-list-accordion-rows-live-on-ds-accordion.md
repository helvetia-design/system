# 40. List accordion rows live on ds-accordion

Package: `packages/core`, `packages/tokens`, `packages/skills`

Date: 2026-11-26

## Status

Accepted

## Context

`ds-item` could switch into an accordion with `variant="accordion"`. That gave it a second, partial
accordion API (`accordion*` props, `dsAccordion*` events, an `accordion-content` slot and part, a
list-specific token) that duplicated `ds-accordion`. Group relationships, heading levels and
one-open-at-a-time are already solved by `ds-accordion`, while the list row look (border, padding,
hover/active backgrounds, `lg`, inverted) only existed on the `ds-item` side.

## Decision

- `ds-accordion` gets a `list` boolean (host class `is-list`) that renders the list row look, and an
  `inverted` boolean (see ADR 0038). `list` wins visually over `button` and title styling props; this
  is documented, not validated.
- A list of accordions is composed as `ds-list > li > ds-accordion[list]`. Nesting is a `ds-list` inside a
  `<section slot="content">` of the parent, with no nesting prop or CSS: the row border lines are absolutely positioned at
  the bottom of the summary and of the open content, so nested rows overlap the parent line and render once.
- All list-look values are `accordion-list-*` component tokens consumed only under `.is-list`, so a
  non-list accordion slotted in a list is unaffected. Defaults go through `vars.local`, and
  the size mods (`--mod-accordion-list-size-min-height`, `--mod-accordion-list-size-padding-y`) are never set on the accordion itself, so the inherited `ds-list.is-lg` values are not shadowed. `.is-inverted` does set the color mods (`--mod-accordion-list-color-border-*`, `--mod-accordion-list-color-background-*`) on the accordion: it is the inverted state, and `ds-list.is-inverted` sets the identical values, so the two cascades agree.
- `ds-list.is-lg` and `ds-list.is-inverted` set `--mod-accordion-*` on the list, the same cascade it
  already uses for `ds-item`. This is an intentional cascade, not token borrowing. Both include one shared SCSS mixin (`accordion/_inverted.scss`), so the inverted values are defined once, and
  both set an inherited `color` (the inverted summary token) so slotted content is readable on the dark surface.
- All accordion API is removed from `ds-item` and `ds-list`, including the CSS-only `li details` block and
  `List.Item.Accordion.PaddingY`. No deprecation shim, by human decision.

## Consequences

- The accordion API on `ds-item`/`ds-list` is removed outright: consumers must migrate to `ds-accordion list`. By explicit human decision every release note for this change is a `minor`, and there is no deprecation step or shim.
- CSS-only users lose the list-style `details` accordion until a follow-up adds it to the accordion styles.
- The Figma variable for the removed token is retired by the CI token sync.
- The Baloise migration skill rewrites `bal-list-item-accordion-*` into `<li><ds-accordion list>`.
- The nested `ds-list` must sit in a `<section slot="content">`, never carry `slot="content"` itself. The HTML `li` start-tag rule treats custom elements, `div`, `p` and `address` as transparent, so in plain HTML, `innerHTML` and SSR the first nested `<li>` would close the outer `<li>`. `section` stops the rule. The wrapper adds no padding or margin, so border lines still overlap.
- A nested `ds-list` must not get extra vertical padding, or its border lines no longer overlap.
