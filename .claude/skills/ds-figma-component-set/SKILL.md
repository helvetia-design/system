---
name: ds-figma-component-set
description: Build a component family's Figma COMPONENT_SET from an approved plan — default variant, full labeled set bound to Figma variables, component key written to <name>.figma.md.
---

# ds-figma-component-set

Build the real Figma `COMPONENT_SET` for a component family.

**Mechanics live in [`PHASE-3-BUILD.md`](../ds-code-to-figma/PHASE-3-BUILD.md)** — the template
clone, header fields, labeled-set layout, Variations cards and the asset-component special case.
This skill is the contract around it. **Read it by section** (`grep -n '^#'` first), only what
this family needs:

| Section of `PHASE-3-BUILD.md`                                                              | Read when                                             |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `## Instructions`, `Category pages`, `Labeled component set`, `Documentation frame header` | always                                                |
| `Text properties`                                                                          | the mapping file has a `figmaPropertyType: text` prop |
| `Slots`                                                                                    | the mapping file has `slots:`                         |
| `Interactions`                                                                             | the set has a `state` axis                            |
| `Variations`                                                                               | the mapping file has `variations:` entries            |

Load the `figma-use` skill once, before the first `use_figma` call.

## Input

- An approved plan from `ds-plan-figma-component`: variant axes, grid, default variant, token
  table
- `figma.config.json` with a real `componentLibraryFileKey`

**Stop if there is no approved plan.** Do not derive the grouping yourself — the variant budget
and the axis decisions are the architect's analysis plus a human sign-off.

## Phase 1: Prerequisites

Check, and hard-stop on any failure rather than working around it:

- The `componentLibraryFileKey` is real, not `REPLACE_WITH_FIGMA_FILE_KEY`.
- Every **nested** component (an independent DS component from another family, e.g. `ds-icon`
  inside `ds-button`) already has its own `<child>.figma.md` with a recorded component key. If
  not, stop: that family must be built first. Never recreate it, never substitute a plain shape.
- Every binding in the mapping file has a recorded **library key** (`ds-figma-mapping` Phase 2
  checked it is published). Import each with `importVariableByKeyAsync` — never look ids up again,
  never a hardcoded value. A missing key is that skill's hard stop, not something to fix here.

**Sub-components** of this family are the exception — this run builds them
([`conventions/families.md`](../ds-code-to-figma/conventions/families.md)).

## Phase 2: Frame

Clone the category page or documentation frame from the `🗂️ Template / Category` page and fill
its header. A missing template layer, category copy or story ID is a hard stop — ask.

## Phase 3: Default variant, then confirm

Build **only the default variant** named in the plan, bind every value to its variable, then
**stop and let the human look at it in Figma.**

This checkpoint is the cheapest point of failure in the whole workflow: a wrong token binding or
a wrong auto-layout decision replicated across 200 variants is 200 fixes. One variant is one
fix. Never fan out before approval.

## Phase 4: Fan out

Build the rest as a labeled, fixed-grid set per the plan's sketch. Every variant:

- binds values to Figma variables — never a raw hex, px or string
- uses **instances** of sub-components' and nested components' own sets, never copies
- gives each icon slot exactly one `INSTANCE_SWAP` property

Then fill **🔀 Variations** (second left-column section, right after Copy me), turning on every
`show <name>` layer. Hard-stop before review until every variation has its visual-test snapshot —
`ds-update-screenshots` is user-invoked, so ask.

## Phase 5: Confirm and record

Get the human's approval of the header, the component set and Variations in Figma. Then write
the Figma component key back to `<name>.figma.md` for every family member — owner and each
sub-component. Without that key the next family that nests this one cannot find it.

## Deliver

- The built documentation frame and component set, by node name
- `<name>.figma.md` per family member, each with its component key
- Every value that bound to a variable, and every one that did not
- Handoffs: missing tokens, missing nested-component mappings
- Hand off to `ds-figma-review` to check the result against the code

Never generate Code Connect mappings.
