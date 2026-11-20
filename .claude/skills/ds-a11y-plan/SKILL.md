---
name: ds-a11y-plan
description: Define the accessibility requirements for a component before or during implementation — semantics, ARIA, keyboard map, focus management, and the specific WCAG 2.2 AA criteria that apply. Use when planning a new component or adding an interactive feature, so the engineer knows what to build and the verifier knows what to check.
---

# ds-a11y-plan

Define what "accessible" concretely means for one component, before it is built.

Output is a requirements set the engineer implements and the verifier checks — not an audit of
existing code (that's `ds-a11y-audit`).

## Phase 1: Classify the component

Accessibility requirements follow from what the component _is_:

- **Static/presentational** (icon, logo, picture, divider) — name, decorative vs meaningful,
  contrast.
- **Interactive control** (button, link, close) — role, accessible name, focus visibility,
  target size, activation keys.
- **Form control** (input, select, checkbox, slider, datepicker) — label association, state
  announcement (invalid/required/disabled), error text wiring, native form participation.
- **Composite widget** (tabs, carousel, accordion, pagination, segment) — the ARIA pattern it
  implements, arrow-key navigation, which element owns focus.
- **Overlay** (modal, drawer, popup, tooltip, sheet, notification) — focus trap, return focus,
  Esc, scroll lock, `aria-modal`, and what gets `aria-hidden`.

Name the [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern it
matches. Follow that pattern rather than inventing keyboard behavior.

## Phase 2: Define the requirements

Specify, concretely enough to test:

- **Semantics** — host `role`, the native element used inside, and what is in the light DOM
  vs shadow DOM. Prefer native elements; see `docs/STYLE_GUIDE.md#accessibility--seo-for-web-components`
  for light-DOM exposure and host semantics.
- **Accessible name** — where it comes from (slot content, `label` prop, `a11yTitle`), and
  what happens when it's absent. State the fallback, don't leave it undefined.
- **ARIA attributes** — each one, its values, and when it changes. Prefer a native attribute
  over an ARIA one wherever both exist.
- **Keyboard map** — every key, as a table: key → action → resulting focus.
- **Focus management** — initial focus, focus order, where focus returns to, and what is
  focusable at all. Tab reaches widgets; arrow keys move within them.
- **State announcement** — how a screen reader learns about disabled, invalid, expanded,
  selected, loading, and live-region updates.
- **Reduced motion** — what `prefers-reduced-motion` changes.

## Phase 3: Select the WCAG 2.2 AA criteria

List only the criteria this component can actually violate, each with how it will be
satisfied. Do not paste the full WCAG spec.

The **WCAG 2.2 additions** are the ones most often missed, and three matter at AA for a
component library:

| Criterion                            | Applies to                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| **2.4.11** Focus Not Obscured (Min)  | Overlays, sticky headers — focused element must stay visible |
| **2.5.7** Dragging Movements         | Slider, carousel — needs a non-drag alternative              |
| **2.5.8** Target Size (Min), 24×24px | Every interactive target, including icon-only buttons        |

Flag explicitly which criteria **cannot be verified automatically** — axe covers a subset, so
these become manual checks in `ds-a11y-verify`.

## Phase 4: Deliver

**Return** the plan — do not write it to a file. The orchestrator saves it to
`docs/plans/<component>-a11y-plan.md`. Planning stays read-only on both sides, which is what
makes this safe to run in parallel with `ds-plan-component`.

Return:

1. Component classification and the ARIA pattern it follows
2. Semantics and accessible name
3. ARIA attributes, with their state transitions
4. Keyboard map (key → action → focus)
5. Focus management rules
6. Applicable WCAG 2.2 AA criteria, and how each is met
7. Which criteria need manual verification, and why

Hand the keyboard map and criteria list to `ds-a11y-test` — they become the test cases.
