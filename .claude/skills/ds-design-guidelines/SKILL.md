---
name: ds-design-guidelines
description: Author a component's usage guidance — when to use it, when not to, and concrete do's and don'ts with real markup — plus the anatomy copy, in the exact shape Storybook's UsageExamples and ComponentParts blocks consume. Hands the result to the documentation-engineer to place. Writes no Storybook files.
---

# ds-design-guidelines

Write the design guidance for a component: when to use it, when not to, and the do's and don'ts.

**You author the content. The documentation-engineer places it.** `apps/storybook/src/**` is
theirs — you produce copy in the shape their blocks consume, and hand it over. That split exists
because the judgment ("is a long tag label wrong?") is design work, while the MDX wiring,
`storyId` resolution and build are documentation work.

## What Storybook will render it with

Match these shapes exactly, or the docs agent has to rewrite your work.

**Do's and don'ts** → the `UsageExamples` block in `2-Usage.mdx`, under `## Do's and Don'ts`,
grouped by `###` theme headings. One item per example:

```tsx
{
  type: 'correct' | 'incorrect',
  title: 'Correct: Short, clear label',
  content: (<ds-tag>JavaScript</ds-tag>),   // real markup, rendered live
  description: 'Quick to scan and understand at a glance',
}
```

**Accessibility guidance** → the `A11yGuidelines` block in `5-Accessibility.mdx`, with
`type: 'do' | 'dont'`. Scope yourself to _usage_ guidance here; the a11y-expert owns the
accessibility criteria themselves, so coordinate rather than inventing a11y claims.

**Anatomy** → the `ComponentParts` block, which binds to `components.json` `@part` data. Your
contribution is the per-part description, which you already wrote in `ds-figma-anatomy` — reuse
that text verbatim so Figma and Storybook say the same thing.

The canonical worked example is `apps/storybook/src/components/indicators/tag/2-Usage.mdx`.

## Phase 1: Ground the guidance

Read the component's props and `@part` tags, the Figma component you built, and the existing
stories. Guidance must describe the component that _exists_ — not a better one you'd like.

If a do/don't you want to write is really a feature request or a defect ("don't use `color` for
emphasis because it looks wrong"), that is a finding for the architect or component-engineer,
not a guideline. Report it.

## Phase 2: When to use / when not to

Two short lists. "When NOT to use" is the more valuable one and the more often skipped — it
should name the _other_ component to reach for instead, by tag name. A "when not to" with no
alternative just leaves the reader stuck.

## Phase 3: Do's and don'ts

Group by theme (content and length, color and semantic meaning, placement, …) with a `###`
heading and one sentence of context per group, then the correct/incorrect pair.

Rules that keep these useful:

- **Pair them.** An `incorrect` with no matching `correct` tells a reader what to avoid but not
  what to do.
- **Show, don't assert.** `content` is live markup; make the problem _visible_. A too-long tag
  label has to actually overflow on screen.
- **One idea per pair.** A pair demonstrating three things at once teaches none of them.
- **No invented props.** Every attribute in your markup must exist — the docs agent's
  `ds-validate-documentation` checks exactly this, and an invented prop fails the build.
- **Earn each one.** Three sharp pairs beat ten obvious ones. "Don't put a paragraph in a badge"
  is not guidance.

## Phase 4: Deliver

Return, ready to paste:

1. When to use — short list
2. When NOT to use — each with the alternative component to use instead
3. Do's and don'ts — grouped, each item as a complete `ExampleItem` object with real markup
4. Anatomy — per-part descriptions, identical to the Figma legend
5. Findings routed elsewhere: defects, missing features, a11y claims for the a11y-expert

Do not create or edit any file under `apps/storybook/`. Hand off to the documentation-engineer
(`ds-manage-stories` for an existing page, `ds-document-component` for a new one).
