---
name: ds-figma-anatomy
description: Build the 📐 Anatomy section of a component's Figma doc frame — labeled @part diagram and legend; also yields part descriptions for Storybook's ComponentParts.
---

# ds-figma-anatomy

Document what a component is **made of**, as a labeled diagram in Figma.

**Mechanics live in [`PHASE-7-DOCUMENT-ANATOMY.md`](../ds-code-to-figma/PHASE-7-DOCUMENT-ANATOMY.md)**
and [`conventions/document-sections.md`](../ds-code-to-figma/conventions/document-sections.md)
(the `Section`/`Preview`/`Title` masters and how to insert into a `SLOT`). Read those; this skill
is the contract.

Load `figma-use` once, before the first `use_figma` call (skip if already loaded this run).

## Input

- A built component set (`ds-figma-component-set` done and approved)
- The anatomy list from the architect's plan — every `@part`, described

## The source of truth is `@part`

Anatomy is **not** a visual opinion. It is the component's `@part` tags, which are its public
styling surface — a consumer can target each one. So:

- One legend entry per `@part` tag. No more, no less.
- A part the plan didn't list is a gap: check the source, and if the tag is really missing report
  it to the component-engineer rather than inventing a label for it.
- **A component with no `@part` tags has no anatomy.** Delete the template's Anatomy placeholder
  rather than leaving an empty bordered box, and say you did.

## Phase 1: Structure

`Section` `Flat`, with one nested `Default` `Preview` inside the outer slot holding both the
diagram and the legend. Never resize the `Preview` itself — it hugs its content.

## Phase 2: Diagram

A default-variant **instance** (never a detached copy) with numbered callouts pointing at each
part. Point at what the part actually is: if `part="label"` is the text node, the callout lands
on the text, not near it.

Pick the variant that shows the **most parts at once** — a conditional part (an icon slot, a
close button) needs a variant where it is present, or the diagram documents a part nobody can
see. State which variant you chose and why.

## Phase 3: Legend

One entry per part: the number, the `part` name exactly as it appears in the tag, and one line
saying what it is and whether it is always present or conditional.

Copy each description verbatim from the `@part` JSDoc — Storybook's `ComponentParts` reads only
that, so both surfaces say the same thing. Do not reword it here; a description that needs
changing is a code finding for the component-engineer.

## Phase 4: Confirm

Stop and let the human approve the Anatomy section in Figma before moving on.

## Deliver

- The built Anatomy section, by node name — or a note that the placeholder was deleted
- The part table: number, `part` name, description, always/conditional — **ready to hand to the
  documentation-engineer** for the Storybook page
- Any `@part` tag that appears in code but not in the plan, or vice versa
