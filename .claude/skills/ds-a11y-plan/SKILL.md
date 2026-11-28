---
name: ds-a11y-plan
description: Define a component's accessibility requirements — semantics, ARIA, keyboard map, focus, applicable WCAG 2.2 AA criteria. Use when planning a component or an interactive feature.
---

# ds-a11y-plan

Define what "accessible" concretely means for one component, before it is built.

Output is a requirements set the engineer implements and the verifier checks — not an audit of
existing code (that's `ds-a11y-audit`).

**Read `docs/plans/components/<component>-brief.md` first if it exists** — the orchestrator's
grilling round settled scope, the real data set and what is explicitly out. Plan the keyboard
map for what is in scope, not for the complete domain.

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

### Mirroring a component that already ships? Plan the delta.

When the component copies a pattern already in the repo ("the picker is phone-input's picker"),
do **not** re-derive the whole pattern from the model's source. Instead:

1. Audit the model for what it gets **wrong** — those defects are the valuable output, and the
   new component must not inherit them.
2. State only what **changes** for the new component.
3. Reference the model for everything unchanged.

Re-deriving a shipped pattern costs a full planning run and produces a document that mostly
restates working code. The three real `ds-phone-input` defects found this way (misplaced
`aria-activedescendant`, a dead `tabindex`, a missing live region) were worth more than the
pages of correct-pattern description around them.

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
- **Target size** — every pointer target and its rendered size; each must be ≥ 24×24 px
  (2.5.8), or name the spacing exception it relies on.

### Stay in your lane

State the a11y **requirement**, not the implementation that satisfies it. "The endonym needs a
`lang` attribute" is yours. "Call `getCountryName(code, language)` to get it" is not — naming a
specific function, data source or dependency is the architect's call, and when the two plans
disagree the engineer only finds out mid-implementation and has to adjudicate between them.

Name a function or util only when it **is** the requirement — a shared focus-trap utility, an
existing `a11yTitle` prop, the `Field` wrapper's ARIA wiring.

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

**Write** the plan to `docs/plans/components/<component>-a11y-plan.md` yourself (that directory
is gitignored — a throwaway handoff, not a document), then return a **summary,
not the plan body** — the path, the blocking decisions, the criteria that will need manual
verification, and the **out-of-scope findings** (defects outside the brief's scope, e.g. in a
model component, one line each with `file:line`). The orchestrator files those as issues — left
only in the gitignored plan, they are lost on the next run. The orchestrator reads the file when it needs
detail; passing the body through its context so it can be written back out pays for the same
content twice.

`ds-plan-component` writes `docs/plans/components/<component>-plan.md` — a different file, so
the two planners stay safe to run in parallel. A criterion that must outlive the task belongs in
the component's `CONTEXT.md` or an ADR, not in a preserved plan.

The file must contain:

1. Component classification and the ARIA pattern it follows
2. Semantics and accessible name
3. ARIA attributes, with their state transitions
4. Keyboard map (key → action → focus)
5. Focus management rules
   5a. Target sizes (2.5.8) — each pointer target and how it reaches 24×24 px
6. Applicable WCAG 2.2 AA criteria, and how each is met
7. Which criteria need manual verification, and why

Hand the keyboard map and criteria list to `ds-a11y-test` — they become the test cases.
