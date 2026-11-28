---
name: ds-modify-component
description: Fix a bug in or extend a shipped component, preserving architecture and backward compatibility — smallest change, test-first (TDD). Use for bug fixes and additive changes.
---

# ds-modify-component

Change an existing component without breaking its consumers.

## Input

- Change request or bug report
- Acceptance criteria
- Architecture plan, if the change needed one

## Phase 1: Analyze

- Understand the requested change.
- Read the component's own source — `.tsx`, `.interfaces.ts`, `.host.scss` — and its
  per-component `CONTEXT.md` if it has one.
- **Grep every caller before editing anything shared.** A change to a mixin, the `Field`
  wrapper, a util or a sub-component reaches every consumer of it; fix the root cause once in
  the shared code rather than patching each call site.
- **Reproduce the defect as a failing test first**, in the component's existing test file —
  `test/<name>.component.play.ts` for behavior, `test/<name>.spec.ts` for pure logic. Follow
  the file's existing style; `button.component.play.ts`'s
  `test('should not fire dsClick when disabled')` is the shape for an
  "interaction should not happen" bug.

  These files and the Page Object are **yours** — a fix without a test that pins it is how the
  same bug ships twice. Name the seam the test sits at in your report (one line: what it
  catches, what it misses); the human confirms it at review. Hand to test-engineer only a new
  `visual.html` section (it regenerates `.variants.ts`) or integration tests.

  Run it and watch it fail before you change any source. A test that passes before the fix
  is testing the wrong thing.

- **For a feature addition** (not a bug fix), check the matching component at
  [shadcn/ui](https://ui.shadcn.com/docs/components) for prior art on the API shape — whether
  the capability is usually a prop or a slot, what it's named, which states come with it.
  Take the shape only: no React, Radix or Tailwind patterns, no copied source. The
  component's own existing API always wins — a new prop must look like it was there from the
  start.
- **If the feature needs a Stencil mechanism with no precedent here**, check
  [Swiss Post DS](https://github.com/swisspost/design-system) (nearest peer — a design system
  on Stencil) and [Ionic](https://github.com/ionic-team/ionic-framework) (deep runtime
  mechanics). The mechanism only, never their design or UX. See `ds-implement-component`
  Phase 2 for the full scope.

## Phase 2: Assess

Evaluate the impact on:

- Public API — any prop/event/method rename, removal, type or default change is **breaking**
  (see `docs/ARCHITECTURE.md#semantic-versioning-policy`).
- Existing behavior and Shadow DOM structure — removing or renaming a slot or `part` breaks
  consumer styling.
- Accessibility, design tokens, framework integrations (React/Angular output targets), and
  existing tests.

**Escalate breaking changes and architectural decisions** rather than deciding them here. A
breaking change needs an approved plan (`ds-plan-component`) and a deprecation path.

## Phase 3: Implement — test-first

Call the Skill tool with `mattpocock-skills:tdd` and follow it. **Bug fix:** one cycle — the
Phase 1 test goes green. **Feature / deprecation:** one cycle per seam in the plan's
`## Test seams` section — failing test → run, see red → minimal code → run, see green → next
seam. Never all tests first; no test at an unlisted seam; no refactoring inside the loop.
Conventions: [`ds-test-component/REFERENCE.md`](../ds-test-component/REFERENCE.md); add PO
locators only as a test needs them.

**Touch seams** (from the plan's `## Touch`) are ordinary cycles: tag the test `@touch`
(`test('opens on tap', { tag: '@touch' }, …)`), drive it with `tap()` from the Page Object —
it then runs only in the `⚙️ Component / 👆 Touch` project (Pixel 5, `hasTouch`). Emulation
only; say so in the report. A change to tap, hover or gesture behavior
always gets a touch seam.

- Make the smallest sufficient change.
- Reuse the patterns the component already uses — match its style even where you'd differ.
- **Read tokens, never create them.** `packages/tokens/` belongs to the token-engineer. If the
  change needs a token that doesn't exist, reference the name it should have, hardcode
  nothing, and report it as a blocking handoff.
- Preserve backward compatibility; deprecate before removing
  (`docs/ARCHITECTURE.md#deprecation-policy`).
- The Phase 1 reproduction test is a bug fix's regression coverage — don't add a second one.
- No unrelated refactoring. Remove only the imports and variables _your_ change orphaned.

## Phase 4: Validate

Run the narrowest suite that covers your change: the reproduction test from Phase 1 must now
pass, and the component's existing suite must stay green. A change to anything visible (SCSS,
markup, a new state) also gets the screenshot self-critique from
[`ds-implement-component` → Look at it](../ds-implement-component/SKILL.md#look-at-it); report
what you saw. The full `ds-validate-component` pass
is a separate workflow step (Workflow B), not part of this skill — Workflow C has none.

## Phase 5: Deliver

Report:

- Root cause, when there was a defect
- Implementation changes
- Compatibility impact — explicitly state whether anything is breaking
- Validation results, with evidence
- **Per seam: test name, red output line, green output line**
- Remaining risks

Write no changeset here — the workflow's changeset step writes it (patch for a fix, minor for an addition).

**Started from a Figma-plan findings file** (`docs/plans/components/<name>-findings.md`)? Tick
each finding there and update the rows your fix changed in the plan it names — see
`ds-repair-component` → Findings from a Figma plan. `/figma` resumes without a re-plan.
