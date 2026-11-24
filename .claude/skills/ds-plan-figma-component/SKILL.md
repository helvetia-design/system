---
name: ds-plan-figma-component
description: Analyze a component's code for its Figma representation — props/states to variant axes, @part anatomy, which design token every styled value resolves to, and the proposed variant grouping with a variant-count budget check. Produces the plan the UX designer builds from. Read-only; touches no Figma.
---

# ds-plan-figma-component

Turn a shipped component's code into a Figma build plan: what the variant axes are, what the
anatomy is, and which token every value resolves to.

**Read-only, code-side only.** You have no Figma access and no dev server — you analyze the
source and _name_ what Figma must contain. The UX designer verifies the variables exist and
measures the rendered component.

This is the analysis half of `ds-code-to-figma` Phases 1–2. Its
[`PHASE-1-ANALYZE.md`](../ds-code-to-figma/PHASE-1-ANALYZE.md) and
[`PHASE-2-PROPOSE.md`](../ds-code-to-figma/PHASE-2-PROPOSE.md) hold the full detail — read them
rather than working from this summary alone.

## Phase 1: Resolve the family

The unit of work is a **family**: the documentation owner (the component with a Storybook page)
plus its sub-components. Resolve it per
[`conventions/families.md`](../ds-code-to-figma/conventions/families.md) and state which member
is the owner. A sub-component is never planned alone.

## Phase 2: Read the code

For the owner and every sub-component:

- `<name>.tsx` — every `@Prop()` with its type and default, `@part` tags, slots, and the
  pseudo-states the render applies (`.is-*` classes).
- `<name>.interfaces.ts` — the `const` arrays behind each enum prop. These are the candidate
  variant values, and they are authoritative: a value not in the array does not exist.
- `<name>.host.scss` / `.style.scss` — every styled value and the CSS variable behind it.

## Phase 3: Resolve every value to a token

Walk the cascade (`--_` → `--` → `--mod-` → `--ds-`) to the Component-layer token each value
ultimately resolves to, per
[`conventions/tokens-and-props.md`](../ds-code-to-figma/conventions/tokens-and-props.md) and
`packages/tokens/CONTEXT.md`.

Figma binds to a variable **id**, not a token name, and those ids already live in this repo —
`packages/tokens/tokens/Base.tokens.json`, under `$extensions["com.figma.variableId"]`
(`docs/adr/0017-direct-commit-variableid-backfill.md`). So **no Figma access is needed for this
step**, and none should be attempted: enumerating Figma's 1,900+ variables is slow and a
truncated read gives a confidently wrong answer.

You have no Bash, so you cannot run `scripts/figma-sync/lib/css-token-lookup.mjs` yourself.
Read the ids out of `Base.tokens.json` directly and name the CSS var → token → variable-id
triple per row. `ds-figma-mapping` re-resolves them with the script and records them.

**A responsive token needs a `device` id.** A token with `com.helvetia.responsive` is bound in
Figma through its Device variable, so its `com.figma.variableId` must carry a `device` key next to
`mobile`/`tablet`/`desktop`. No `device` key → blocking handoff to the token-engineer
(`ds-sync-figma-tokens`). Mobile/tablet/desktop ids alone are not enough.

**A value with no token behind it is a hard stop.** List it as a blocking handoff to the
token-engineer with the value it needs and where it is used. Do not propose a hardcoded Figma
value as a fallback — Figma cannot represent an untokenized value without lying about it.

If a `<family>.token-check.md` report exists, read it; it may already name the gaps. If it does
not and the component looks token-messy, say so and ask for `ds-audit-tokens` to run first
rather than guessing.

## Phase 4: Define the anatomy

From the `@part` tags: each part's name, what it is, and whether it is always present or
conditional. This list is what both the Figma 📐 Anatomy section and Storybook's
`ComponentParts` block describe, so it is written once, here.

A component with no `@part` tags has no anatomy section — say so explicitly.

## Phase 5: Propose the variant grouping

Decide, per axis, whether it becomes a Figma **variant property**, an **instance-swap**, or a
**top-level split** into separate sets. Sketch the variant grid.

Then **multiply the axes out and check the total against Figma's 500-variant ceiling.** Over
budget is a hard stop: recommend a mitigation by axis type
([`conventions/content-selection-and-mitigations.md`](../ds-code-to-figma/conventions/content-selection-and-mitigations.md))
and let the human choose. Blowing the budget is discovered in Figma at build time, which is the
expensive place to find it.

Name which single variant is the **default** — the one the UX designer builds and gets approved
first.

## Phase 6: Deliver

**Write** the plan to `docs/plans/components/<component>-figma-plan.md` (gitignored — a handoff,
not a document; the durable record is `<name>.figma.md`), then return a summary — the path,
the blocking handoffs, and the budget verdict. Not the plan body: it survives a human gate and is
then read by the ux-designer, so routing it through the orchestrator's context pays for the same
content twice.

Your `Write` access is scoped to `docs/plans/components/**`. **Do not touch `<name>.figma.md`** — the
ux-designer owns that file and creates it with `ds-figma-mapping`, which takes this plan as its
input.

The file must contain:

1. Family: owner and sub-components
2. Props and states → proposed variant axes, with each axis's values
3. Variant grid sketch, total count, and the budget verdict
4. The default variant
5. Anatomy: every `@part`, described
6. Token resolution table — value → token, one row per styled property
7. **Blocking handoffs** — unresolved tokens, responsive tokens with no `device` id, missing
   nested-component mappings
8. Open questions, each with a recommended answer

Mark every statement as a decision (backed by a file you read) or an assumption.

**Not yours:** measuring the rendered component (needs Bash and the dev server) and writing the
mapping file (needs Write). Both are `ds-figma-mapping`'s. Hand over the plan and say so.
