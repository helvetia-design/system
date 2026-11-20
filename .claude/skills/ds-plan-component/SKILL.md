---
name: ds-plan-component
description: Turn a component specification or GitHub issue into a technical implementation plan for the design system — public API, slots, responsive behavior, tokens, accessibility, files to touch, and ordered steps. Use when planning a new component, reworking an existing one, or scoping a breaking change. Produces a plan only; writes no production code.
---

# ds-plan-component

Transform a component specification into an actionable technical implementation plan.

**This skill produces a plan. It does not implement production code.**

## Phase 1: Understand

- Read the provided specification or GitHub issue.
- Extract requirements and acceptance criteria.
- Identify missing or conflicting requirements — name them, never fill them in.
- Separate mandatory from optional requirements.

For each open question, give your **recommended answer** and order them by dependency —
questions whose answer depends on another open question come later. Finding facts is your
job; only genuine decisions go to the human.

If the requirements are too unsettled to plan against, say so and stop. Ask the orchestrator
to run `/grill-with-docs` with the user first — that is a user-invoked skill, so you cannot
run it yourself, and guessing the decisions produces a plan nobody agreed to.

## Phase 2: Explore

Read, in this order:

1. The relevant package `CONTEXT.md` (`packages/core/CONTEXT.md` for components), plus the
   per-component `CONTEXT.md` next to the closest existing component if one exists (see the
   "Per-Component Deep Dives" list in `packages/core/CONTEXT.md`).
2. The nearest precedent component's actual source in
   `packages/core/src/components/<category>/<name>/` — its `.tsx`, `.interfaces.ts`, and
   `.host.scss`.
3. `docs/STYLE_GUIDE.md` and `docs/ARCHITECTURE.md` for naming and file conventions.
4. `docs/adr/` for decisions that already bind this area.

Establish:

- Which component is the nearest precedent, and what its API, slots and SCSS actually do.
- Which utilities, nested components and design tokens are already available.

**Docs give you the conventions; code gives you the behavior.** Where a doc and the source
disagree, the source wins — `CONTEXT.md` files and ADRs can drift. Verify every claim about an
existing component's API, slots, or behavior against a file you read in this session.

## Phase 3: Design

Define only the sections the component actually needs:

- Anatomy and composition — which existing components it is built from.
- `@Prop()` / `@Event()` / `@Method()`, including defaults and prop validation.
- Named and default slots, and what belongs in a slot rather than a prop.
- Internal state and the Stencil lifecycle hooks it depends on.
- CSS variable cascade (`--_` → `--` → `--mod-` → `--ds-`) and the Component-layer tokens
  behind it.
- Responsive behavior across 320px–2560px: what reflows, and at which boundaries.
- Keyboard interaction and WCAG 2.2 AA requirements.
- Framework integration (React/Angular output targets), SSR and hydration compatibility.

## Phase 4: Plan

- Files to create or modify.
- Ordered implementation steps, with dependencies between them called out.
- Required Storybook stories and documentation pages.
- Tests: unit (`.spec.ts`), interaction (`.component.play.ts`), visual (`.visual.play.ts`),
  a11y (`.a11y.play.ts`), and the Page Object in `packages/playwright/`.
- Whether a changeset is needed, and at what bump level.

## Phase 5: Validate

Before delivering, re-check the plan against:

- The original acceptance criteria — every one is addressed or explicitly deferred.
- Existing architecture docs and component patterns.
- Public API conventions (`ds-` prefix, `ds<Name>` events, `listenTo*`/`*Changed`/`handle*`
  handlers, `readonly` props).
- Backward compatibility — is anything here a breaking change?

Resolve inconsistencies before returning the plan, or report them as blocking.

## Phase 6: Deliver

**Return** the plan — do not write it to a file. The orchestrator saves it to
`docs/plans/<component>-plan.md` and dispatches from there, which is what keeps the planner
read-only and safe to run in parallel with the a11y planner.

Return a structured plan containing:

1. Requirements summary, and open questions — each with a recommended answer, ordered so
   nothing depends on a question further down the list
2. Context and references — with file paths
3. Technical decisions
4. Component specification (API, slots, tokens, responsive, accessibility)
5. Files to create or modify
6. Implementation steps
7. Testing strategy
8. Risks and open questions

Mark every statement as either a **decision** (backed by a file path you read) or an
**assumption**. Do not silently resolve ambiguous requirements — mark blocking decisions for
human approval.

## Done when

Whoever implements this can do so without making further architectural decisions on their own.
