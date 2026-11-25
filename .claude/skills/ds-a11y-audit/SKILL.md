---
name: ds-a11y-audit
description: Audit a component's source against WCAG 2.2 AA; reports findings, fixes nothing. Use when reviewing a component's accessibility or before a11y sign-off.
---

# ds-a11y-audit

Find accessibility defects by reading the component's source.

This skill **reports findings**. It does not fix them — hand findings to
`ds-repair-component` — and it does not run tests, which is `ds-a11y-verify`.

## Phase 1: Read the implementation

Read, for the component and each of its sub-components:

- `<name>.tsx` — the `render()`, host attributes, `@Listen()` handlers, focus calls.
- `<name>.interfaces.ts` — which states are representable.
- `<name>.host.scss` — focus indicators, `prefers-reduced-motion`, target sizing, and any
  `outline: none`.
- Its per-component `CONTEXT.md` if it has one, and the relevant `docs/adr/` entries.
- Existing `test/<name>.a11y.play.ts` and `.component.play.ts` to see what is already covered.

## Phase 2: Audit

Work through these, citing `file:line` for every finding:

**Semantics**

- Is a native element used where one exists, instead of a `div` plus ARIA?
- Is meaningful content in the light DOM (slots) rather than shadow-only? (shadow-only content
  is invisible to search engines and some AT — `docs/STYLE_GUIDE.md#light-dom-exposure`)
- Does the host carry the right `role`, or wrongly duplicate a native one?

**Accessible name**

- Does every interactive element have a name, from slot content, `label`, or `a11yTitle`?
- Icon-only controls: is there a name, and is the icon `aria-hidden`?
- Is a decorative image/flag `aria-hidden` rather than carrying a redundant name?

**ARIA**

- Every `aria-*` value: correct, and kept in sync when state changes?
- `aria-expanded` / `aria-controls` / `aria-haspopup` present on triggers that need them?
- Does an `aria-labelledby` point at an element that can be empty? (an empty target yields
  _no_ accessible name — the browser does not fall back to `aria-label`; see the
  `ds-modal` note in `packages/core/src/components/overlays/modal/CONTEXT.md`)
- `aria-live` regions: right politeness, and actually re-rendered on change?

**Keyboard**

- Is every mouse action reachable by keyboard? Click handlers without a key equivalent are a
  defect.
- Does the component match its ARIA pattern's expected keys (arrows within a widget, Tab
  between widgets, Esc to dismiss, Enter/Space to activate)?
- Any positive `tabindex`, or a focusable element that should not be?

**Focus**

- Visible focus indicator in every state, and not suppressed by `outline: none` without a
  replacement.
- Overlays: focus moves in, is trapped, and returns to the trigger on close.
- Is focus ever left on a removed or `aria-hidden` element?
- **WCAG 2.2 2.4.11** — can a focused element end up hidden behind an overlay or sticky bar?

**Visual**

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components and focus indicators — including every
  `color` variant and the inverted-on-dark state.
- **WCAG 2.2 2.5.8** — interactive targets at least 24×24px.
- **WCAG 2.2 2.5.7** — any drag interaction has a non-drag alternative (slider: arrow keys).
- Is `prefers-reduced-motion` honored by every transition and animation?
- Does the component still work at 200% zoom and 320px width?

**State**

- Are disabled, invalid, required, loading and selected states each exposed to AT, not only
  styled?
- Is `disabled` real (native attribute / `aria-disabled`) rather than only visual?

## Phase 3: Report

For each finding:

- `file:line`
- What is wrong, and the WCAG criterion it fails (or "best practice" if it fails none)
- **Severity** — Critical (blocks an AT user), Major (degrades the experience), Minor (polish)
- The concrete fix, in one or two lines

Close with what you checked and found clean, and what you could **not** determine by reading —
contrast ratios of computed/token colors, actual AT announcements, and real focus order often
need `ds-a11y-verify` to run. Say so rather than guessing.
