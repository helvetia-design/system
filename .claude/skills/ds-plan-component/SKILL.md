---
name: ds-plan-component
description: Turn a component specification or GitHub issue into a technical implementation plan for the design system — public API, slots, responsive behavior, tokens, accessibility, files to touch, and ordered steps. Use when planning a new component, reworking an existing one, or scoping a breaking change. Produces a plan only; writes no production code.
---

# ds-plan-component

Transform a component specification into an actionable technical implementation plan.

**This skill produces a plan. It does not implement production code.**

## Phase 0: Gate — contradictions and scale

**Cheap, and before any exploration.** A handful of targeted `grep`s at most — do not read a
precedent component yet. Phase 2 is the expensive phase; this gate exists so you don't pay for
it twice.

Two checks, both on the request itself:

**1. Does the request contradict itself?** Read the user's own examples literally and confirm
they all describe the same thing. An example list that straddles two categories means the
component's identity is unsettled, not that one example is sloppy.

> Real case: _"each country shown in their native language like Schweiz, Deutschland, Espana,
> English"_ — the first three are country endonyms, "English" is a language name. A country
> picker and a language picker are different components with different data sources. This
> surfaced only after a full plan had been written, whose first open question was then "is this
> even the right component?"

**2. Is the scale requested, or assumed?** When the request implies a data set, state its size
and ask whether that size was actually asked for. Default to the business's real footprint, not
the complete domain.

> Real case: "country selection" silently became all ~250 ISO countries — a hand-maintained
> endonym table, a bootstrap script and a sync-guard spec — when the existing allow-list prop
> meant the ~10–40 markets Helvetia sells in would have shipped the same feature for a fraction
> of the work.

**If either check fails, return immediately with the question and your recommended answer —
nothing else.** A plan whose first line is "Q1, blocking: is this the right component?" is a
plan that should not have been written yet. Three lines costs the orchestrator one question; a
hedged plan costs a full planning run that may be thrown away.

If the requirements are too unsettled to plan against at all, say so and stop. Ask the
orchestrator to run `/grill-with-docs` with the user first — that is a user-invoked skill, so
you cannot run it yourself, and guessing the decisions produces a plan nobody agreed to.

## Phase 1: Understand

- Read the provided specification or GitHub issue.
- Extract requirements and acceptance criteria.
- Identify missing or conflicting requirements — name them, never fill them in.
- Separate mandatory from optional requirements.

For each open question, give your **recommended answer** and order them by dependency —
questions whose answer depends on another open question come later. Finding facts is your
job; only genuine decisions go to the human.

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
5. **External references** — [shadcn/ui](https://ui.shadcn.com/docs/components) for the
   matching component, and [Ionic](https://github.com/ionic-team/ionic-framework) when the
   component needs a non-obvious Stencil pattern (see below).

Establish:

- Which component is the nearest precedent, and what its API, slots and SCSS actually do.
- Which utilities, nested components and design tokens are already available.

### External references

Three references, two questions. **One answers what to build; two answer how. Never swap
them.**

| Reference                                                   | Answers             | Why it fits                                                                                    | Where it doesn't                                         |
| ----------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [shadcn/ui](https://ui.shadcn.com/docs/components)          | **What to build**   | Desktop-oriented UX, like this system                                                          | React/Radix/Tailwind stack — nothing to copy technically |
| [Ionic](https://github.com/ionic-team/ionic-framework)      | **How to build it** | The largest production Stencil codebase there is — deep runtime mechanics                      | Mobile-first UX. **Never a design reference.**           |
| [Swiss Post DS](https://github.com/swisspost/design-system) | **How to build it** | The nearest peer — a Swiss enterprise _design system_ on Stencil, desktop web, multi-framework | Its own brand and UX. **Never a design reference.**      |

**Ionic vs. Swiss Post:** Ionic is an app framework — go there for a hard Stencil runtime
problem at scale. Swiss Post is a design system with the same shape as this one — go there
for how a _design system_ on Stencil is put together. When both have an answer, Swiss Post is
usually the closer fit.

#### shadcn/ui — design and API shape

shadcn/ui is a mature, widely-reviewed catalogue. Reading its version of the component you're
planning is a cheap way to catch a missing state, a sub-component you hadn't decomposed, or a
composition pattern that solves a case you'd have hit later.

**Take:** the anatomy and sub-component split, the set of variants and states worth
supporting, what is composed rather than configured, which concerns are separate components,
and the edge cases its docs call out.

**Never take:** React, Radix or Tailwind anything. No `class-variance-authority`, no `cn()`,
no utility-class styling, no `asChild`, no hook-based API, no copy-paste source. This repo is
Stencil web components styled through the token cascade — a prop named after a Tailwind
concept is a bug.

#### Ionic — Stencil implementation patterns

Ionic is the largest production Stencil codebase in the open. When a component needs a
Stencil mechanism this repo has no precedent for, look at how Ionic solved it before
inventing something.

Worth reading it for: slot forwarding and delegated focus in Shadow DOM, form-control
participation (`formAssociated`, value accessors), overlay/portal and scroll-lock handling,
framework output-target behavior for React/Angular, SSR and hydration edge cases, and
`@Method()` design on an async boundary.

**Never read it for design.** Ionic is mobile-first — its sizing, touch targets, density,
gestures, navigation model and visual language are built for phones. This system is desktop-
oriented and covers 320px–2560px. Take the Stencil mechanism, never the UX.

Also skip: Ionic's theming system (we have the token cascade), its CSS custom-property
conventions, its mode/platform switching (`ios`/`md`), and its component API naming.

#### Swiss Post Design System — design-system architecture on Stencil

The closest peer this system has: a Swiss enterprise design system built on Stencil, aimed at
desktop web, shipping framework wrappers — the same problem shape, solved by another team.

Worth reading it for: how a component family is decomposed across a monorepo, the token
pipeline and how tokens reach components, `@Prop()` and slot API conventions for a design
system rather than an app, Angular/React wrapper generation, versioning and the changeset
flow, Storybook documentation structure, and its accessibility approach to composite widgets.

**Never read it for design.** It carries Swiss Post's brand, visual language and UX
decisions, which are not ours. Take the architecture, never the look or the interaction
choices.

#### Precedence

**Highest first:** this repo's existing components → `docs/STYLE_GUIDE.md` and ADRs → the
ARIA Authoring Practices pattern → shadcn/ui (design) / Swiss Post and Ionic (Stencil
mechanics). Where an external reference disagrees with anything above it, the higher one wins
and the external one is not mentioned again. Consistency with the components that already ship beats
consistency with another library.

Cite either as a **reference**, never as a justification on its own. "shadcn does X" and
"Ionic does Y" are not reasons; "X, because this component needs a loading state and
`ds-button` already models one the same way" is.

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

- Files to create or modify, **each with the agent that owns it** (see `docs/agents/ds-team.md`).
  A file with no named owner turns into an extra dispatch after the tests are already green: the
  integration leftovers — per-component `CONTEXT.md`, the React/Angular barrels, the ADR, the
  changeset — are real work and belong in a build-out agent's scope from the start.
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

**Write** the plan to `docs/plans/<component>-plan.md` yourself, then return a **summary, not
the plan body**. Your `Write` access is scoped to `docs/plans/**` — everything else stays
read-only, which is what keeps you safe to run in parallel with the a11y planner (it writes
`docs/plans/<component>-a11y-plan.md`, a different file).

Return to the orchestrator, in under 30 lines:

- the plan's path
- the blocking decisions a human must approve, each with your recommended answer
- the token gaps the token-engineer must fill
- nothing else — the orchestrator reads the file when it needs detail

Routing the plan body through the orchestrator's context so it can be written back out pays for
the same content twice, once as input and once as output.

The file must contain:

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
