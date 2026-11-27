---
name: ds-a11y-verify
description: Run a component's a11y suites and manual checks for per-criterion WCAG 2.2 AA PASS/FAIL/NOT_VERIFIED evidence. Use for a11y sign-off or to confirm an a11y fix landed.
---

# ds-a11y-verify

Prove — with evidence — which accessibility criteria a component meets.

**The core rule: automated tests verify a subset. Never report WCAG 2.2 AA compliance on the
strength of a green axe run.**

## Phase 1: Run what can be run

```bash
pnpm play:a11y                          # ♿️ A11Y project — axe scans, keyboard, focus, ARIA state
pnpm play:file -- --grep="<name>"       # a single test
```

Capture the actual output. "Tests pass" without it is not evidence. Older components still keep
their keyboard tests in `.component.play.ts` — add `pnpm play:components` when that is the case.

## Phase 2: Know the automation gap

`packages/playwright/CONTEXT.md#accessibility-testing` explains why: the axe fixture's tag list
excludes WCAG 2.2, so **2.4.11**, **2.5.7** and **2.5.8** are never automatically checked. Axe
also never covers, at any version: whether an accessible name is _meaningful_, logical focus
order, real AT announcements, keyboard operability of custom widgets, or whether an `aria-live`
update is actually useful.

Everything in that list is a manual check. Do not silently mark it PASS.

## Phase 3: Verify manually

For each item, state what you did and what you observed:

- **Keyboard** — walk the component with Tab/Shift+Tab/arrows/Enter/Space/Esc. Every action
  reachable, focus always visible, never trapped where it shouldn't be.
- **Focus visibility** — indicator present in each state and against each background,
  contrast ≥ 3:1.
- **2.4.11 Focus Not Obscured** — with an overlay or sticky bar open, is the focused element
  still visible?
- **2.5.8 Target Size** — measure interactive targets; ≥ 24×24px.
- **2.5.7 Dragging** — every drag interaction has a keyboard/click alternative.
- **Accessible name quality** — not just present, but describes the action. "Button" fails in
  practice while passing axe.
- **Contrast** — every `color` variant and the inverted state, text ≥ 4.5:1, UI ≥ 3:1.
- **Reduced motion** — with `prefers-reduced-motion: reduce`, animations are suppressed.
- **Zoom / reflow** — usable at 200% zoom and 320px width.
- **Screen reader** — if you cannot run one, mark affected criteria `NOT_VERIFIED`. Do not
  infer announcements from the markup.

## Phase 4: Report per criterion

For every criterion from the plan or audit, exactly one status:

| Status           | Means                                                           |
| ---------------- | --------------------------------------------------------------- |
| `PASS`           | Verified, with the command output or observation that proves it |
| `FAIL`           | Verified broken, with the failing output                        |
| `NOT_VERIFIED`   | No way to check it here — say why                               |
| `NOT_APPLICABLE` | Cannot apply to this component — say why                        |

Then:

- Commands run, with their output
- Manual checks performed, with observations
- Failures, each as an actionable finding for `ds-repair-component`
- What remains unverified, and what it would take to verify it

Close with a plain statement of scope — which criteria were verified and by what means. A
component with a green suite and no manual pass is "axe-clean", not "WCAG 2.2 AA conformant".
