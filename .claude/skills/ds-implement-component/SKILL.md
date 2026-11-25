---
name: ds-implement-component
description: Implement a new design system component from an approved technical specification and architecture plan — files, public API, behavior, styling, tokens and accessibility. Use after an architecture plan has been approved and it's time to write the component.
---

# ds-implement-component

Implement a new component from an approved architecture plan.

## Input

- Original requirements and acceptance criteria
- Approved architecture plan (see the `ds-plan-component` skill)
- Component specification

## Phase 1: Understand

- Read the requirements and the architecture plan.
- Verify that blocking decisions in the plan have been resolved.
- Identify implementation tasks and their dependencies.

**Stop and ask if essential requirements or an approved plan are missing.** Do not design the
component yourself — that is `ds-plan-component`'s job.

**Read `docs/plans/components/<name>-brief.md` first, then the plan, then the a11y plan.** The
brief's `## Gate decisions` section is the human's ruling at the plan gate and overrides both
plans where they differ.

**A behaviour deviation is a question, not a footnote.** If the plan asks for something you
can't or shouldn't build as written — skipping validation, an extra user-facing string, dropping
an a11y requirement, a different default, a missing open-state fixture — stop and return it as a
blocking question before writing it. Only non-behavioural deviations (file layout, helper names)
belong in the final report's "Deviations" line.

## Phase 2: Load context

Read:

1. `packages/core/CONTEXT.md`, plus the per-component `CONTEXT.md` of the nearest precedent
   (see its "Per-Component Deep Dives" list).
2. The precedent component's own source — `.tsx`, `.interfaces.ts`, `.host.scss` — in
   `packages/core/src/components/<category>/<name>/`.
3. `docs/STYLE_GUIDE.md` for code standards, `docs/ARCHITECTURE.md` for file structure.

Identify the reusable utilities, nested components and existing tokens the plan depends on.

**When this repo has no precedent for a Stencil mechanism**, check these two before inventing
one:

- **[Swiss Post DS](https://github.com/swisspost/design-system)** — the nearest peer: a Swiss
  enterprise design system on Stencil, desktop web, multi-framework. Go here first for
  design-system-shaped problems — component-family decomposition, `@Prop()`/slot API
  conventions, the token pipeline, Angular/React wrapper generation, composite-widget a11y.
- **[Ionic](https://github.com/ionic-team/ionic-framework)** — the largest production Stencil
  codebase in the open. Go here for hard runtime mechanics: slot forwarding and delegated
  focus in Shadow DOM, form-control participation (`formAssociated`, value accessors),
  overlay/portal and scroll-lock handling, React/Angular output-target behavior, SSR and
  hydration edge cases, `@Method()` design across an async boundary.

Take the **mechanism only, never the design**. Ionic is mobile-first (its sizing, touch
targets, density, gestures, theming system and `ios`/`md` modes are wrong for us); Swiss Post
carries its own brand and UX. This system is desktop-oriented and styles through the token
cascade.

A precedent inside this repo always beats both — if `ds-modal` already solves focus return,
copy `ds-modal`.

## Phase 3: Implement

Component files live in `packages/core/src/components/<category>/<name>/` — the category
folder comes from the taxonomy in `packages/core/CONTEXT.md`:

- `<name>.tsx` — `shadow: true`, implements `ComponentInterface` and `Loggable`
- `<name>.interfaces.ts` — types, enums, interfaces
- `<name>.host.scss` — Shadow DOM styles
- `<name>.style.scss` — only for CSS-only or hybrid components
- `test/<name>.visual.html` — the visual fixture (see Phase 5; note the `test/` subfolder)
- `test/<name>.style.html` — only for CSS-only or hybrid components

See [REFERENCE.md](REFERENCE.md) for a working template of each, plus the token rules.

**Sub-components nest inside their owner's folder** — `tabs/tab/tab.tsx`, never `tabs/` and
`tab/` as siblings.

Then:

- Implement the public API exactly as the plan specifies — `@Prop()` (all `readonly`),
  `@Event()` named `ds<Name>`, `@Method()`, with prop validation.
- Implement behavior and internal state, using the lifecycle hooks the plan names.
- Compose from existing components rather than reimplementing them.
- Style through the CSS variable cascade (`--_` → `--` → `--mod-` → `--ds-`), referencing
  Component-layer tokens — never hardcoded values or raw Global tokens.

**You read tokens. You never create them.** `packages/tokens/` is owned by the token-engineer.
When the component needs a Component-layer token that does not exist yet:

1. Reference it anyway, by the name it _should_ have under the anatomy convention —
   `--ds-<component>-<element>-<property>-<variant>-<state>`.
2. Do **not** add a fallback value, hardcode the literal, or reach for a Global/Alias token
   instead. Each of those hides the gap; an unresolved `var()` makes it visible and the visual
   test catches it.
3. List every missing token in your report as a **blocking handoff to the token-engineer**,
   with the value it needs and where it's used.

The component is not finished until the token-engineer has defined them. Your proposed names
are a request, not a decision — the token-engineer may rename them.

- Implement keyboard interaction and the WCAG 2.2 AA requirements from the plan.

Avoid unrelated changes, speculative options, and abstractions the plan didn't ask for.

## Phase 4: Register

- **Framework wrappers** — the component ships through Stencil's generated `Components`; you
  add only the hand-written parts with the `ds-framework-wrappers` skill — React re-export
  lists (both files) for every component, the Angular value-accessor wrapper for every form
  component. Run `pnpm build` in `packages/core` first to regenerate `components.d.ts` and the
  framework `generated/*` files — never hand-edit them.
- **`packages/core/src/index.ts`** — only when the plan names a public interface type to export
  (see [REFERENCE.md](REFERENCE.md#registration-in-indexts)); a new component needs no entry.
- Create the mirrored Storybook folder `apps/storybook/src/components/<category>/<name>/`
  (empty folder only — its contents belong to the documentation agent).
- Document for the linter as you go: JSDoc on every `@Prop`/`@Event`/`@Method`, every
  `@slot` and `@part` in the component-level JSDoc, section divider comments in order, and a
  `@Type`/`@OneOf` validator on every prop. `ds-lint-component` checks all of it.

## Phase 5: Build the visual fixture

**This is yours, and it is the gate.** `test/<name>.visual.html` is how a human sees the
component before any test is written. Build it complete — a reviewer who has to imagine the
missing variants cannot approve anything.

Copy the structure from an existing fixture (`packages/core/src/components/indicators/tag/test/tag.visual.html`):
the standard `<head>` with the token/design-system stylesheets and the `design-system.esm.js`
module, then `<main class="ds-container">` holding one `<section>` per variant group:

```html
<section data-testid="colors">
  <span>Colors</span>
  <ds-tag color="purple-light">Title</ds-tag>
</section>
```

Rules:

- **One `<section data-testid="…">` per variant group**, with a `<span>` label. Those
  `data-testid` values are the contract: `ds-test-component` reads them into
  `test/<name>.variants.ts`, which drives **both** the visual suite and the SSR suite
  (`.ssr.play.ts` renders this same page with `renderToString` and screenshots it before and
  after hydration). A variant with no section gets no screenshot in either.
- Cover **every** prop value, state (disabled, invalid, loading, selected), size, slot
  arrangement and the inverted-on-dark rendering. This is the one artifact that shows the
  whole surface at once.
- A CSS-only or hybrid component also gets `test/<name>.style.html`, the same sections
  rendered with classes instead of the custom element.

Then verify it yourself before handing over: run `pnpm start` and open
`/components/<category>/<name>/test/<name>.visual.html`. Report what you saw. If a variant
renders wrong, fix it now — a screenshot baseline taken over a broken variant bakes the bug in.

## Phase 6: Hand off tests and docs

Everything else is owned by other agents — do not write it here:

| Artifact                                                         | Owner         |
| ---------------------------------------------------------------- | ------------- |
| `.spec.ts`, `.component.play.ts`, `.visual.play.ts`, Page Object | test-engineer |
| `.a11y.play.ts`                                                  | a11y-expert   |
| `apps/storybook/src/components/<category>/<name>/**`             | documentation |

State in your report which test set and which stories the plan calls for, so the orchestrator
can dispatch them — and name the `data-testid` sections you created, since the visual tests
derive from them.

## Phase 7: Validate

**First, check your render output against the a11y plan.** If
`docs/plans/components/<name>-a11y-plan.md`
exists, walk its semantics, ARIA and state-announcement sections and confirm every structural
requirement actually appears in what you built. This is a grep-level check and it is cheap. The
plan is a specification you were handed, not a suggestion.

> Real case: an a11y plan required the no-results message in a `role="status"` live region and
> explicitly forbade a bare `div` inside the listbox. The component shipped the forbidden version
> anyway. It reached an axe run, a repair dispatch and a test rewrite before being fixed — one
> grep for `no-results` against the plan would have caught it here, at zero rework cost.

Then follow the `ds-validate-component` skill for the new component and anything it touches.

Run the narrowest suite that covers your own files. Do not run other agents' suites or whole-package
builds to "be safe" — step 7 of the workflow does the cross-cutting pass once.

Fix defects within the approved scope. If a fix needs an architectural change, stop and
escalate — do not redesign.

## Phase 8: Deliver

Return:

- Implementation summary
- Changed and created files
- Acceptance criteria status
- Validation results, with evidence
- Deviations from the plan and unresolved issues

Create a changeset with the `ds-changeset` skill (minor for a new component). Leave every
change unstaged — never commit.

**Do not silently change the approved architecture.**
