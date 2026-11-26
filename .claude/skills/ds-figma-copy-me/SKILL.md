---
name: ds-figma-copy-me
description: Fill the 👉 Copy me section of a component's Figma doc frame with one default-variant instance. Never skipped; run after Figma review, before Anatomy.
---

# ds-figma-copy-me

Fill "👉 Copy me" — the first section of the documentation frame's left column.

**Mechanics live in
[`PHASE-6-DOCUMENT-COPY-ME.md`](../ds-code-to-figma/PHASE-6-DOCUMENT-COPY-ME.md)** and
[`conventions/document-sections.md`](../ds-code-to-figma/conventions/document-sections.md).
Read those; this skill is the contract.

Load `figma-use` once, before the first `use_figma` call (skip if already loaded this run).

## When

After `ds-figma-review` returns `pass`, before `ds-figma-anatomy`.

**Copy me is never skipped.** Unlike Anatomy — which is conditional on the component having
`@part` tags — Copy me is always the first child of the `Documentation` column. A frame shipped
without it has an empty bordered placeholder where the one thing a designer actually drags out
should be.

## Phase 1: Find the placeholder

Fill the existing `Section` whose `Title` is `kind=copy-me` (`Default` variant) in the cloned
frame's `body` › `Documentation` column. **Do not create a new `Section`.**

No `kind=copy-me` placeholder ⇒ hard stop and ask. The Variations section directly below it was
filled in Phase 3 — leave it where it is.

## Phase 2: Insert the instance

One `variant.createInstance()` of the finished component set's **default variant**, inserted
directly into the `Preview`'s slot — no further nesting.

Two rules that are easy to get wrong:

- **An `INSTANCE`, never the variant node itself.** Dropping the variant in moves it out of the
  set and breaks the set.
- **Override nothing.** Every property keeps the set's default — `show <name>` booleans and text
  properties included, so they display their sentence-case defaults. Copy me must show exactly
  what the component renders with no props set, i.e. the set's top-left cell. An override here
  quietly teaches designers a non-default starting point.

For a **family**, this is the **owner's** default variant only, slots keeping their default
fill. Sub-components get no Copy me of their own
([`conventions/families.md`](../ds-code-to-figma/conventions/families.md) §2).

## Phase 3: Confirm

Iterate with the human in Figma before moving on — same discipline as every other section.

## Deliver

- The filled `kind=copy-me` `Section`, by node name
- Confirmation that no property was overridden
- Next: `ds-figma-anatomy` ∥ `ds-figma-measurements` ∥ `ds-design-guidelines` (anatomy skipped
  if the component has no `@part` tags)
