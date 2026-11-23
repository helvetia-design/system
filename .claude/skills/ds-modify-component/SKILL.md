---
name: ds-modify-component
description: Fix a bug in or extend an existing design system component while preserving its architecture and backward compatibility — impact assessment, smallest sufficient change, regression coverage. Use for component bug fixes and additive changes to components that already ship.
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

  Writing that one test is **yours**, even though test-engineer owns these files — a fix
  without a test that pins it is how the same bug ships twice. Escalate to test-engineer only
  when the coverage is a new suite, a new file, or a broad variant matrix.

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

## Phase 3: Implement

- Make the smallest sufficient change.
- Reuse the patterns the component already uses — match its style even where you'd differ.
- **Read tokens, never create them.** `packages/tokens/` belongs to the token-engineer. If the
  change needs a token that doesn't exist, reference the name it should have, hardcode
  nothing, and report it as a blocking handoff.
- Preserve backward compatibility; deprecate before removing
  (`docs/ARCHITECTURE.md#deprecation-policy`).
- The Phase 1 reproduction test is the regression coverage — don't add a second one.
- No unrelated refactoring. Remove only the imports and variables _your_ change orphaned.

## Phase 4: Validate

Follow the `ds-validate-component` skill. The reproduction test from Phase 1 must now pass,
and the component's existing suite must stay green.

## Phase 5: Deliver

Report:

- Root cause, when there was a defect
- Implementation changes
- Compatibility impact — explicitly state whether anything is breaking
- Validation results, with evidence
- Remaining risks

Create a changeset with the `ds-changeset` skill (patch for a fix, minor for an addition).
Leave every change unstaged — never commit.
