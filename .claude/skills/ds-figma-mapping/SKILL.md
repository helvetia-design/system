---
name: ds-figma-mapping
description: Create or update a component family's <name>.figma.md mapping file — the record of props, anatomy, states, resolved Figma variable ids, nested component keys, variations and the measurements triage. Resolves token ids locally with css-token-lookup.mjs and measures the component on the dev server. Every other Figma skill reads or writes this file.
---

# ds-figma-mapping

Own the mapping file — `<name>.figma.md`, one per family member, sitting next to each `.tsx`.

This file is the **contract between code and Figma**. Nothing else records which Figma variable
a CSS var resolves to, which component key a nested child has, or which measured values the
human agreed to show. Build it first; every other Figma skill reads it.

Format: [`examples/mapping-file-format.md`](../ds-code-to-figma/examples/mapping-file-format.md).
Full field semantics: [`PHASE-1-ANALYZE.md`](../ds-code-to-figma/PHASE-1-ANALYZE.md).

## Input

- The architect's plan from `ds-plan-figma-component` — props, anatomy, variant axes, the
  token table
- A running dev server for the measurement step

## Phase 1: Resolve the family

One mapping file per family member — the owner and every sub-component
([`conventions/families.md`](../ds-code-to-figma/conventions/families.md)). The sub-component's
file carries `owner:` pointing at the owner's; the owner's frame is where everything is built.

## Phase 2: Resolve every token to a Figma variable **id**

**Locally. No Figma call.** Every token this repo has already pushed carries its real Figma
variable id in `packages/tokens/tokens/Base.tokens.json` under
`$extensions["com.figma.variableId"]` — written back by `scripts/figma-sync`
(`docs/adr/0017-direct-commit-variableid-backfill.md`).

```bash
node scripts/figma-sync/lib/css-token-lookup.mjs <css-var>
```

Do **not** enumerate Figma's `Design Tokens` collections through `use_figma` to answer "does a
variable exist for this CSS var". It is 1,900+ variables: slow, context-hungry, and a large read
risks truncating into a wrong answer. The repo's own JSON already holds it.

Record the **id**, not just the token name — that is what a binding needs. Note responsive
bindings under `device:`.

A CSS var with no variable id is a **hard stop**: a token-engineer handoff, never a guess and
never a hardcoded fallback.

## Phase 3: Record the structure

From the plan, write into the file:

- `props:` — every public prop, typed, with its default; mark consumer-authored text (string
  props, text-only slots) separately from generated text
- `anatomy:` — the lettered `@part` list, each cross-checked against a real `part="..."` in
  `render()`. A mismatch is resolved with the human, not silently dropped. Omit the key
  entirely if there are no `@part` tags.
- states from `.host.scss`
- `nested:` — each nested DS component's own Figma component key, read from its
  `<child>.figma.md`. Missing ⇒ hard stop; that family is built first.
- `slots:` — one per `@slot` that takes sub-component instances
- `variations:` — per covered set, each entry's visual-test snapshot case or `missing`

## Phase 4: Measure and triage

Run the dev server and measure the **rendered** component — computed styles and box model — so
derived and inherited values are exact. Read the SCSS only to decide _why_ a value exists, which
assigns its group.

Classify every value per
[`conventions/measurements.md`](../ds-code-to-figma/conventions/measurements.md) and apply each
group's default proposal. **Only the rows the convention marks "ask" go to the human.** Then
stop and get the triage confirmed, and record it under `measurements:` — value, group, token,
proposal.

A measured value that disagrees with its token is decided with the human, not averaged away.

`ds-figma-measurements` later _renders_ this triage. It does not re-derive it.

## Phase 5: Completeness checklist

Before handing off, every one of these or a recorded hard stop:

- every public prop extracted and typed; every parent-set prop carries `drivenBy`
- every `@part` matches a real `part="..."`
- every CSS var resolved to a real variable id — none guessed, none defaulted
- responsive bindings recorded under `device:`
- every measured value grouped, proposed, and confirmed
- every nested component key present

## Phase 6: Deliver

- One `<name>.figma.md` per family member, unstaged
- The hard stops, routed: missing tokens → token-engineer, missing nested keys → build that
  family first, `@part` mismatches → component-engineer
- Confirm the checklist has no unresolved gaps, then hand to `ds-figma-component-set`

`sets:` and the component keys are filled in later by `ds-figma-component-set` — leave them
empty here. Never commit.
