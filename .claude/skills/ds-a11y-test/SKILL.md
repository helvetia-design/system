---
name: ds-a11y-test
description: Write or extend a component's accessibility tests in `.a11y.play.ts` — the axe scan across every variant and state, plus keyboard, focus and ARIA-state coverage. Use when a component has no a11y tests, after adding a variant or interaction, or when an audit finding needs regression coverage.
---

# ds-a11y-test

Write the automated accessibility coverage for a component.

## Where tests live

**Everything a11y lives in `test/<name>.a11y.play.ts`** — the axe scans _and_ the keyboard,
focus-order and ARIA-state tests. It is your file alone; you never write
`.component.play.ts` (test-engineer's behavior suite) or `.po.ts`.

It is one ordinary Playwright suite: the `a11y` fixture is an extra scan helper on a live
page, so the same test can press keys, open overlays and assert focus.

Pre-existing keyboard tests in a shipped component's `.component.play.ts` stay there — read
them so you don't duplicate, and report, don't move them. Everything you add goes in
`.a11y.play.ts`.

## The axe fixture

```ts
import { test } from '@helvetia-design/playwright'

test('basic', async ({ page, a11y }) => {
  await page.mount(`<ds-button>Button</ds-button>`)
  await a11y('ds-button')
})
```

`a11y(selector)` (`packages/playwright/src/lib/functions/a11y.ts`) runs AxeBuilder scoped to
the selector and asserts zero violations.

**Know its limits.** It is configured with `wcag2a, wcag2aa, wcag21a, wcag21aa` — so it does
**not** run WCAG 2.2 rules, even though the installed `@axe-core/playwright` 4.14 ships them
(notably `target-size` for 2.5.8). A green a11y suite is not WCAG 2.2 AA evidence. Treat
2.4.11, 2.5.7 and 2.5.8 as manual checks in `ds-a11y-verify`.

## Phase 1: Enumerate the cases

From the component's `@Prop()`s and the plan's keyboard map, derive the matrix:

- Default/basic mount.
- Every value of every visual variant prop (`color`, `size`, …) — iterate with a `forEach`
  over a `const` array, as `button.a11y.play.ts` does, rather than writing them out.
- Every state: disabled, invalid, required, loading, expanded/collapsed, selected, empty.
- The inverted-on-dark rendering, if the component supports it.
- Icon-only / no-visible-label variants — these are where accessible names break.
- Each slot configuration that changes the tree.

## Phase 2: Write the axe tests

- One `test()` per case, named for the case.
- Group variant loops in a `test.describe()`.
- Mount the **smallest markup** that produces the state.
- For a state only reachable by interaction (an open overlay, an expanded panel), drive it
  first, then scan — a scan of the closed state proves nothing about the open one.
- Scope the selector to the component, not the page.

## Phase 3: Write the keyboard and focus tests

In the same `.a11y.play.ts`, under a `test.describe('keyboard')`, one test per row of the
plan's keyboard map:

- Every key: press it, assert the action _and_ where focus landed.
- Tab order through the component, and that Tab does not enter a closed overlay.
- Overlays: focus moves in on open, is trapped (Tab from the last element wraps), Esc closes,
  and focus returns to the trigger.
- ARIA state transitions: assert `aria-expanded`, `aria-selected`, `aria-invalid` actually
  change, not just the visual class.
- Mouse-only paths: if a pointer action has no keyboard equivalent, that's a defect — report
  it rather than writing a mouse-only test.

Use the component's Page Object from `@helvetia-design/playwright` where it has what you need.
`.po.ts` is test-engineer's file: if a locator is missing, use a local locator in your test and
report the gap instead of editing the PO.

## Phase 4: Run and report

```bash
pnpm play:a11y                          # the ♿️ A11Y project — your whole suite
pnpm play:file -- --grep="<test name>"  # one test
```

Report the tests added, the matrix they cover, and — explicitly — the cases you did **not**
cover and why. Never weaken an assertion to make a test pass; a failing a11y test is a finding
for `ds-a11y-audit` or `ds-repair-component`.
