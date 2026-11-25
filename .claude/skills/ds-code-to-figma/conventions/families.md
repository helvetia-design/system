# Conventions — component families (sub-components)

Relevant to every phase. See
[ADR-0036](../../../../docs/adr/0036-figma-doc-unit-follows-storybook-page.md) for why the
documentation unit follows the Storybook page.

Terms (defined in `packages/core/CONTEXT.md` → "Component Relationships — Language"):

- **family**: every `@Component` under one family folder.
- **documentation owner** (short: **owner**): the family member with its own Storybook page.
- **sub-component**: a family member without one. It's documented under the owner.
- **nested component**: an independent component from _another_ family that a member uses
  (`ds-icon` in `ds-button`). Unchanged rule: it must already be in Figma, otherwise hard stop.

A component with no siblings is a family of one: everything below collapses to today's flow.

## 1. Resolve the family (Phase 1, step 0)

1. **Family folder** = the direct child of the category folder that contains the named
   component: `packages/core/src/components/<category>/<family>/` (`navigation/tabs/`,
   `structure/card/`, `actions/button/`).
2. **Members** = every `.tsx` under it (excluding `test/`) with an `@Component({ tag })`
   decorator. Ignore everything else (`*.util.tsx`, `logo.icons.tsx`, `shape.data.tsx`,
   `*.interfaces.tsx`).
3. **Owner** = the member whose Storybook page exists:
   `apps/storybook/src/components/<category>/<tag without ds->/<tag without ds->.doc-config.ts`.
4. **🛑 Hard stop** if any member is left without an owner: no owner at all, or several owners
   plus an orphan member (`overlays/alert/`: `snackbar` and `toast` each have a page,
   `alert-container` has none). Several owners and **no** orphan means independent components that
   share a folder: run only the named one, as a family of one.
5. **Entry point**: the skill always runs on the owner. If the user named a sub-component, say so in
   one line ("`ds-tab` is a sub-component of `ds-tabs` — running the `ds-tabs` family") and continue
   with the owner. A sub-component never runs alone.
6. **Relation** of each sub-component to the owner, from the owner's and the sub-component's
   `render()`/`@slot` JSDoc:
   - **contained**: it renders inside the owner (`ds-tab`, `ds-tab-panel` in `ds-tabs`; the
     `ds-card-*` in `ds-card`).
   - **wrapping**: it renders the owner inside itself (`ds-button-group` around `ds-button`).

Print the family (owner, every sub-component with its relation, every nested component) at the
start of Phase 1, together with the anatomy review.

## 2. Lockstep phases

Phases 1–5 cover the whole family; Phases 6–8 cover the owner only.

| Phase      | Family behaviour                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 Analyze  | One mapping file per member, next to its `.tsx`. **One** anatomy review (merged list, §5), **one** measurements triage (grouped by set, §6), **one** batch of token gaps for the family.                                                                                                                                                   |
| 2 Propose  | **One** proposal and **one** sign-off covering every set of the family, including the parent-set props (§3) and slot default fills (§4). The 500-variant check runs per mapping file.                                                                                                                                                      |
| 3 Build    | One documentation frame (the owner's). **Build order**: contained sub-components → owner → wrapping sub-components (each set needs the sets it instantiates). The **first-variant checkpoint runs per set**. Variations covers owner and sub-component sets alike, in build order. The documentation-frame approval runs once, at the end. |
| 4 Validate | Run per mapping file, one `<name>.figma-validation.md` each. Header checks only on the owner's. The **family verdict** is the worst of all reports (`fail` > `blocked` > `pass`).                                                                                                                                                          |
| 5 Repair   | Per failing mapping file; the 3-iteration limit counts family re-validations, not per file.                                                                                                                                                                                                                                                |
| 6–8 Docs   | Owner only. Copy me is the owner's default variant. Anatomy and Measurements cover sub-components per §5 and §6.                                                                                                                                                                                                                           |

## 3. Parent-set props (`drivenBy`)

A sub-component prop that the owner sets — JSDoc `@internal` and "Set by ds-…" (on `ds-tab`:
`fullwidth`, `inverted`, `navigation`, `vertical`) — is mapped like any other prop (Phase 2
table). If it changes visuals it becomes a variant axis on the sub-component's set. In the
sub-component's mapping file it carries `drivenBy: <owner tag>.<owner prop>`.

- Every owner variant pre-configures its sub-component instances to match
  (`Tabs inverted=true` → every `Tab` instance `inverted=true`). Designers can change them by hand;
  that is the accepted risk.
- **Inverted mirror**: when the owner has a rule-2 inverted split **and** the sub-component has a
  `drivenBy` inverted prop, the sub-component splits too (`Tab` / `TabInverted`), so sets pair 1:1.
  `TabsInverted` instantiates `TabInverted`. A sub-component without an inverted prop
  (`ds-tab-panel`) doesn't split.
- Public props the owner also sets on the sub-component (`selected` on `ds-tab`) stay
  designer-facing: no `drivenBy`, the designer picks them per instance.
- Identifier props with no visual effect (`name`, `for`) are excluded, per the Phase 2 table's
  no-visual-effect row: they aren't rendered as text, so they get no text property either.

## 4. Composition — native Figma slots

**One Figma `SLOT` per code `@slot` that takes sub-component instances**, on the component whose
code declares the `@slot` (the owner for contained sub-components; the wrapping sub-component for
the owner, e.g. `ButtonGroup`'s slot holds `Button` instances).

- Slot name = the code slot name (`tab`), or the plural of the sub-component when it's the default
  slot (`ds-tabs`' default slot takes panels → `tab panels`). Lowercase per Phase 2 "Naming".
- **Preferred instances** = the matching sets (`Tab`; `TabInverted` in `TabsInverted`).
- **Default fill** is part of the Phase 2 proposal and sign-off: how many instances, which one
  shows non-default props, placeholder text. Tabs: 3 × `Tab` (first `selected=true`, labels
  `Tab 1`, `Tab 2`, `Tab 3`) and 1 × `TabPanel` (the selected one). The labels are set through
  each instance's text property (`setProperties`), never by editing `characters`.
- Record it under `slots:` in the mapping file of the component that owns the slot
  (`../examples/mapping-file-format.md`).
- Build mechanics are the same as for an open slot outside a family: `../PHASE-3-BUILD.md` →
  "Slots".

## 5. Anatomy

The owner's `anatomy:` list merges, in DOM order of the owner's default instance (the final
letters follow the drawing, left to right — `../PHASE-7-DOCUMENT-ANATOMY.md` step 2):

- the owner's own `@part`s (`A tablist`),
- **one entry per contained sub-component** (`B Tab (ds-tab)`, `C Tab panel (ds-tab-panel)`),
  described by the first sentence of its class JSDoc,
- a sub-component's own `@part`s as sub-letters (`B1`, `B2`) **only when it has more than one**.
  A single `@part` (`card-title`) collapses into the sub-component's entry.

Wrapping sub-components get **no** entry: they aren't inside the owner's diagram instance.
Phase 7 deletes the Anatomy placeholder only when the owner has no `@part`s **and** no contained
sub-components.

## 6. Measurements

- **Phase 1 measures the whole family.** The triage table gets a `set` column and is grouped by set
  (`Tabs` / `Tab` / `TabPanel`); still one checkpoint. All rows live in the **owner's** `measurements:`
  (each with `set:`); sub-component mapping files have no `measurements:`.
- **Drawing** = the owner's default instance only. It already contains contained sub-component
  instances, so their padding, gap and indicator are drawn in context.
- **Wrapping sub-components** can't be drawn on the owner's instance: their rows are `table` only.
- The Sizes table prefixes every sub-component row's property with its set name
  (`Tab · Padding X`).

## 7. Documentation frame

- One documentation frame per owner, never per sub-component (`PHASE-3-BUILD.md` → "Category pages").
- Every set of the family is a stack in the owner's `Sets`, **owner's sets first** (default set, then
  its `…Inverted`), then each sub-component's sets in build order (§2) — display order, not build
  order (decided 23.11.2026, `ds-list`). With more than one
  stack, **every** stack keeps its `sub-label`, the owner's default set included.
- Every sub-component set is **published** (no `.`/`_` prefix) and named per Phase 2 "Naming"
  (`Tab`, `TabPanel`, `ButtonGroup`, `CardTitle`).
