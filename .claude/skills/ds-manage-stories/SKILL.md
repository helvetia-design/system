---
name: ds-manage-stories
description: Add, change or remove stories, controls and args for an already-documented component without regenerating its docs. Use when a prop or variant is added or a story/control is wrong.
---

# ds-manage-stories

Maintain the stories of an already-documented component.

Creating a component's full documentation set from scratch is `ds-document-component`. This
skill is the modify half — one story, one control, one variant at a time.

**Conventions are not repeated here.** `ds-document-component` owns the structure of
`<component>.stories.ts` and `<component>.doc-config.ts` (meta title literals, `withRender`,
`${props(args)}`, the `🧩`/`🌍` pairs, storyId naming). Read those sections before writing.

## Phase 1: Read the component, then the stories

1. The component's `.tsx` — its current `@Prop()`, `@Event()` and slots. This is the truth;
   the stories may have drifted from it.
2. `<component>.stories.ts` and `<component>.doc-config.ts`.
3. `3-Variants.mdx`, which renders these stories — a new story usually needs a canvas there.

## Phase 2: Change the stories

**Every variant difference goes in `args`, never hardcoded into the template string.** A story
whose template hardcodes `variant="primary"` breaks controls for everyone who opens it.

- A new `@Prop()` → add it to the meta `args` so it appears as a control.
- A new enum value → one story per meaningful variant, not one story showing all of them,
  unless the existing component already uses a combined section.
- A new state (disabled, invalid, loading) → its own story; states are what consumers come to
  check.
- A removed or renamed prop → fix every story that passes it, and the `doc-config` storyIds
  that point at a story you renamed.

Match the component's own existing stories in style. Where this component and the `tag`
reference disagree, follow `tag`.

## Phase 3: Keep the pages in sync

A story that no page renders is invisible. After adding one, check:

- `3-Variants.mdx` has a canvas for it.
- `doc-config.ts` storyIds still resolve — a renamed export silently breaks the page.
- `1-Overview.mdx` still points at a story that exists.

## Phase 4: Validate

Follow `ds-validate-documentation`. A story that throws takes the whole Storybook page with
it, so a visual check of the rendered page is part of the job, not an extra.

## Constraints

- Do not invent props, slots or events. Everything a story passes must exist in the `.tsx`
  you read this session.
- Do not edit the component to make a story work — that's a finding for the
  component-engineer.
- Stories are documentation, not test fixtures. Playwright in this repo mounts
  `.visual.html` fixtures and Page Objects, never Storybook — so never reshape a story to
  serve a test, and never delete one believing a test depends on it.

## Report

Stories added, changed or removed; the props/variants now covered; pages updated; anything
the component's API prevented you from documenting.
