---
name: ds-ui-polish-audit
description: Audit a component's SCSS/TSX for UI polish beyond WCAG and tokens — motion, long content, typography, forms, touch, forced colors, copy. Report only. Use when reviewing a component or PR, or in an audit sweep.
---

# ds-ui-polish-audit

Find UI polish defects by reading the component's source: the rules that make a component feel
finished but that no WCAG criterion or token rule catches.

This skill **reports findings**. It fixes nothing — hand findings to `ds-repair-component`.
Accessibility belongs to `ds-a11y-audit`, token layering to `ds-audit-tokens`; leave those
findings to them.

## Phase 1: Read the rules

Read [references/web-interface-guidelines.md](references/web-interface-guidelines.md) — Vercel's
Web Interface Guidelines, vendored and pinned (see **Updating the rules**). Then apply the
**DS adaptation** below, which wins wherever the two disagree.

## Phase 2: Read the implementation

For the component and each sub-component: `<name>.tsx`, `<name>.interfaces.ts`, every
`<name>*.scss`, and its `CONTEXT.md` if it has one.

## Phase 3: Audit

Apply every rule in scope, citing `file:line` for each finding.

### DS adaptation

**Out of scope** — app-level or React-only, a component library cannot own them: skip link,
`<meta name="theme-color">`, `color-scheme` on `<html>`, `Accept-Language`, `preconnect` /
font preload, URL-synced state, `beforeunload`, `priority`, React controlled-input and
`suppressHydrationWarning` rules, Tailwind class names (read them as the plain CSS they stand
for). The **Accessibility** and **Focus States** sections are `ds-a11y-audit`'s.

**Overrides**

- The **Content & Copy** section is replaced by [`docs/STYLE_GUIDE.md` → Copy](../../../docs/STYLE_GUIDE.md#copy) (sentence case, not Title Case).
- Literal durations, easings and colors are `ds-audit-tokens` findings, not this skill's.
- SSR hydration: Stencil `ds-*` components must render the same on server and client — a
  date, random id or `window` read in `render()` is a finding.
- "Animate `transform`/`opacity` only" exempts a fill whose size _is_ the value (progress bar,
  meter): animating `width` / `inline-size` there is fine; `will-change` on it is a no-op.
- A `ds-token-check: intentional` comment silences token findings only; the polish rules
  still apply to that line.

**Additions** — checked on every component:

- **Motion** — every `transition` / `animation` lists its properties (never `all`) and is
  disabled or reduced under `prefers-reduced-motion` (in the file or a shared mixin it uses).
- **Forced colors** — borders, focus rings and selected/checked states stay visible under
  `@media (forced-colors: active)`; a state shown only by `background-color` or `box-shadow`
  disappears there. Fix to suggest: outline the shape with a `1px solid` system color
  (`CanvasText`, `ButtonBorder`), show selected/filled state with `Highlight` (text on it:
  `HighlightText`) and `GrayText` for disabled; `forced-color-adjust: none` only on the element
  that sets those system colors itself, never on the host.
- **Long content** — every text slot and label prop survives a very long, unbroken string:
  flex children carry `min-width: 0`, text wraps (`overflow-wrap: anywhere`) or truncates on
  purpose. Empty slot / empty string renders no broken chrome (stray gap, empty pill, divider).
- **Numbers** — counters, dates, prices and table numbers use `font-variant-numeric:
tabular-nums`; formatting goes through `Intl.*`, never a hardcoded pattern.
- **Overlays** — modal, drawer, popover and sheet scroll containers set
  `overscroll-behavior: contain`.
- **Touch** — interactive hosts set `touch-action: manipulation`; nothing is reachable by
  hover only.
- **Default strings** — built-in user-facing text (labels, live-region text, placeholders,
  loading states) follows [`docs/STYLE_GUIDE.md` → Copy](../../../docs/STYLE_GUIDE.md#copy).

### Completion criterion

Every rule in scope applied to every file read; each one either has a finding or appears in
the clean list. Rules that cannot apply (no text, no interaction) go on one "n/a" line.

## Phase 4: Report

Vercel's output format — grouped by file, one terse line per finding:

```text
## packages/core/src/components/structure/card/card.style.scss

card.style.scss:526 - transition: all → list properties (major)
```

Severity per finding: **major** (visible defect a user hits: broken layout on long text,
vanishing state in forced colors, motion ignoring reduced-motion) or **minor** (polish).

Close with the rules checked clean and what reading cannot settle (actual wrapping at 320px,
forced-colors rendering) — say it needs a rendered check rather than guessing.

## Updating the rules

The reference is pinned to an upstream commit; never fetch rules from the network at audit
time.

- Source: https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md
- SHA-256: `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`

To update: `gh api repos/vercel-labs/web-interface-guidelines/commits/main --jq .sha`, then
`curl -fsSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/<SHA>/command.md -o references/web-interface-guidelines.md`,
review the diff, and update the Source URL and SHA-256 above (`shasum -a 256`). Re-check the
DS adaptation against any new section.
