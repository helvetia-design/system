# Phase 2 — Propose variant grouping

## Objective

Turn Phase 1's draft mapping into a concrete Figma variant-grouping proposal — and get explicit
user sign-off on it — before anything is built.

## Inputs

- The draft `<name>.figma.md` produced by Phase 1: props, anatomy, states, and resolved tokens all written down.
- For a family: every member's draft mapping file. **One proposal, one sign-off for the whole
  family** — steps 1–4 run per member, step 5 waits once (`conventions/families.md` §2).

## References

- `conventions/content-selection-and-mitigations.md` — wrapper + Instance Swap pattern and
  over-threshold mitigation mechanics. Read only if the component has an open-ended content prop
  or the step 3 count exceeds 500.
- `conventions/component-set-rendering.md` → "Option and axis ordering" — **required read before
  step 2**; it governs `figmaOptions:` order and the grid sketch.
- `CONVENTIONS.md` — cross-phase rules; not a required read in this phase.

## Instructions

### 1. Map every prop and state

#### Naming

- **Properties — lowercase, words separated by spaces:** component property names (variant,
  boolean, instance swap, text) and variant option values. Convert camelCase by
  splitting words — `labelPosition` → `label position`, `brandIcon` → `brand icon`; a boolean show
  property is `show <name>` (e.g. `show icon`), except a toggle named after the state it shows
  (`optional`, see the mapping table). A text property is named after its code prop
  (`invalidText` → `invalid text`); a text-only slot after its `@part` (button's default slot →
  `label`).
- **Text property defaults — the property name in sentence case:** `Label`, `Placeholder`,
  `Value`, `Description`, `Invalid text`.
- **Text property order — render order:** create text properties top → bottom as they appear in
  the component, so the panel reads like the component.
- **`sub-label` = its set's name**, exactly (`Spinner`, `SpinnerInverted`), so the canvas shows
  what Assets and instance names show.
- **Component set and swap-library component names — PascalCase, flat, no `/`:** the default set (the one holding the code
  default of every split axis) gets the bare component name; every other set appends its split
  option(s) — `Button` + `ButtonInverted`, `Pagination` + `PaginationDots` +
  `PaginationDotsInverted`. The category page already groups sets in the assets panel, so no
  slash folders. Each stack's `sub-label` shows its exact set name.
- Template layer names and the header's `component` text keep their own case.

#### Top-level splits

**Top-level split = one `COMPONENT_SET` per option**, each with its own stack and sub-label.
Split only when one of these applies:

1. **Different layers/structure per option** (enum or boolean) — e.g. `ds-pagination`'s numbered
   variant (many page buttons + prev/next) vs. its dot variant (prev/next + a grey context area):
   different HTML in `render()` → separate sets.
2. **Inverted axis** — always split (`<Component>` / `<Component>Inverted`), even though it's
   same-layers/different-token. The one exception to the test below.
3. **Variant count > 500** — split along the axis that brings each set under the limit; offered
   alongside variable-override, for any axis type (see [step 3](#3-check-the-variant-count-500-hard-stop)).

#### Mapping table

Apply this table to each prop/state from Phase 1. **The deciding test is never the prop's name or
whether it's an enum: same layers, different token → variant; different layers/structure →
top-level split (rule 1).**

| Code construct                                                                                                                                                            | Figma mapping                                                                                                                                                                                                                                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Enum (`@OneOf([...])`), every option re-skins the **same layers**                                                                                                         | One variant property, same name, same options                                                                                                                                                                                                                  | e.g. `size: sm/base`, badge `color` swapping a fill token on the same pill.                                                                                                                                                                                                                                                                                                                                        |
| Enum or boolean, options need **different layers/structure**                                                                                                              | Top-level split (rule 1) — one component set per option                                                                                                                                                                                                        | e.g. `ds-pagination` `variant`: numbered (page buttons + prev/next) vs. `dots` (prev/next + a counter badge) → `Pagination` / `PaginationDots`. Not `ds-button` `color`: `primary` (fill), `secondary` (border) and `link` (underline) all re-skin the same layers with tokens → one `color` variant.                                                                                                              |
| `inverted` prop (inverted axis)                                                                                                                                           | Top-level split (rule 2) — `<Component>` / `<Component>Inverted` sets                                                                                                                                                                                          | Exception to the same-layers test.                                                                                                                                                                                                                                                                                                                                                                                 |
| Open-ended content-selection prop (unbounded options, e.g. icon `name`)                                                                                                   | **Never** a variant property. No crossed sub-props → N top-level components (`<Component><Option>`, e.g. `IconXing`). With crossed same-layers sub-props → one wrapper set + swap library                                                                      | Full pattern in `conventions/content-selection-and-mitigations.md`.                                                                                                                                                                                                                                                                                                                                                |
| Nested `ds-icon` / `ds-brand-icon` (icon slot, e.g. button `icon`, `iconRight`)                                                                                           | One `INSTANCE_SWAP` property per icon slot on the parent, named after the code prop (`icon`, `icon right`); nested icon `size`/`color` never exposed                                                                                                           | Always instance swap — no other approach. Full rule in `conventions/content-selection-and-mitigations.md` → "Icon slots in a parent component".                                                                                                                                                                                                                                                                    |
| Nested `ds-icon` with a hardcoded `name` (fixed icon, e.g. input `alert`)                                                                                                 | The glyph nested directly, no `INSTANCE_SWAP` property; size and color bound per variant                                                                                                                                                                       | Full rule in `conventions/content-selection-and-mitigations.md` → "Fixed icons".                                                                                                                                                                                                                                                                                                                                   |
| Boolean with a static visual effect                                                                                                                                       | One boolean Figma property                                                                                                                                                                                                                                     |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Boolean whose only visual effect is showing or hiding one node (`ds-input` `required` → the generated " (optional)" text after the label, from the shared `Field` helper) | One boolean property bound to that node's `visible` — never a variant axis. Named after the state that shows the node: `required=false` shows " (optional)", so the property is `optional`, default `false`                                                    | A Figma boolean can only show its layer when on, never hide it, so a property that keeps the code name (`required`, default `true`) can't drive the node. Write the code mapping into the property description (`optional = required=false`). Halves the variant count (`ds-input`: 208 → 104). Applies to every form component built on `Field`.                                                                  |
| Boolean with **no static visual effect**                                                                                                                                  | Excluded from the mapping                                                                                                                                                                                                                                      | e.g. `ds-spinner`'s `deactivated` (animation only). List it as "excluded" in the draft so the omission is visible.                                                                                                                                                                                                                                                                                                 |
| Interaction state (`:hover`, `:active`)                                                                                                                                   | **One** `state` variant property: `default` / `hover` / `active` (only those the component has)                                                                                                                                                                | Interaction states only (caused by the user, no prop sets them) — never `disabled`, `loading`, `invalid` or any other component state in `state`. Hover / press are also wired as prototype reactions (`PHASE-3-BUILD.md` → "Interactions").                                                                                                                                                                       |
| Focus (`:focus`, `:focus-visible`, `:focus-within`)                                                                                                                       | **Ignored** — no `focus` option, no focus ring, no focus measurement                                                                                                                                                                                           | User decision 19.11.2026. Not listed as excluded either; the focus ring is documented in code, not in Figma.                                                                                                                                                                                                                                                                                                       |
| Component-state prop (`disabled`, `loading`, `invalid`, …)                                                                                                                | One **variant** property per prop, options `false` / `true`, named after the prop (`disabled`, `loading`, `invalid`). **Blocked** state (Phase 1 step 3): `true` only with `state=default`. **Interactive** state: `true` crossed with every interaction state | Set by the developer as a prop. A variant, not a `BOOLEAN` component property: the state changes tokens (and sometimes layers). Blocked vs interactive comes from the code (Phase 1 step 3), never from the name: `ds-input`'s `loading` stays interactive, `ds-button`'s is blocked. two component states both `true` only when code renders that combination differently and the user approves it in this phase. |
| Consumer-authored text (string prop rendered as text, or a text-only slot)                                                                                                | **Text property**: one `TEXT` component property on the set, bound to the node's `characters` on every variant — never a variant property                                                                                                                      | Named per [Naming](#naming); the default text is the property name in sentence case (`Label`, `Invalid text`), never empty, never looked up in Storybook. Generated text (page numbers, counter digits) gets no property.                                                                                                                                                                                          |
| Consumer-authored text guarded in `render()` (e.g. `hasValue(label) && <span>`)                                                                                           | Text property **plus** a boolean `show <name>` component property bound to the layer's `visible` via `componentPropertyReferences` on every variant                                                                                                            | Default the boolean to the code's real default. Empty text alone isn't enough — Figma won't collapse the auto-layout gap/width the way code omits the element. Check every text prop's `render()`.                                                                                                                                                                                                                 |
| One node, two props, **different token** (`ds-input` `value` / `placeholder`)                                                                                             | Two text nodes, each with its own text property and color token, plus a **`filled`** variant property (`false` default)                                                                                                                                        | `filled=false` variants show only the placeholder node, `filled=true` only the value node (static `visible`, no boolean). The `filled` axis counts in [step 3](#3-check-the-variant-count-500-hard-stop).                                                                                                                                                                                                          |
| One node, two props, **an existing axis decides** (`description` / `invalid text`)                                                                                        | Two text nodes, each with its own text property; visibility per variant from that axis, no new axis                                                                                                                                                            | `color=invalid` variants show `invalid text`, the others `description`. The `show <name>` boolean binds only to `description`; `invalid text` is always visible on `color=invalid`, which stands for `invalid` with `invalidText` set.                                                                                                                                                                             |
| Nested non-slot DS instance whose text the parent passes in from consumer-authored text (e.g. a nested `ds-badge` with the parent's `badge` text)                         | `isExposedInstance = true`, so its properties appear on the parent instance                                                                                                                                                                                    | Only when the parent's code passes consumer text into the child. A child text property the parent never sets (e.g. `ds-spinner`'s `label` inside `ds-button`) stays unexposed — code never renders it. Accepted risk: parent-driven props of the child (e.g. its size) become editable too. Icon slots stay unexposed. Sub-components in a native `SLOT` carry their own text properties (selected directly).      |
| Parent-set prop on a sub-component (`@internal`, "Set by ds-…", `drivenBy`)                                                                                               | Mapped by the rows above like any prop (visual → variant axis on the sub-component's set; no visual effect → excluded). Every owner variant pre-sets its sub-component instances to match                                                                      | `conventions/families.md` §3. An inverted parent-set prop mirrors the owner's rule-2 split (`Tab` / `TabInverted`).                                                                                                                                                                                                                                                                                                |
| Code `@slot` that takes sub-component instances                                                                                                                           | One native Figma `SLOT`, preferred instances = the sub-component's sets, default fill proposed here                                                                                                                                                            | `conventions/families.md` §4. Propose count, which instance shows non-default props, placeholder text (tabs: 3 × `Tab`, first `selected=true`).                                                                                                                                                                                                                                                                    |
| Open slot: a code `@slot` that takes any content inside a part (`ds-input` `start` / `end`)                                                                               | One native Figma `SLOT` at the same place in the part, empty by default, preferred instances = the DS sets the docs and tests put there (Icon first when icons are the main use), plus a `show <slot>` boolean (default `false`) on its visibility             | `PHASE-3-BUILD.md` → "Slots". The boolean is needed because an empty Figma slot still takes space and gap, while an empty code slot takes none. Propose the preferred instances; never a swap property instead of the slot.                                                                                                                                                                                        |
| Prop whose effect depends on another prop                                                                                                                                 | Its own independent variant axis                                                                                                                                                                                                                               | Never collapsed or special-cased (e.g. `labelPosition` only shows when `label` is set, but stays an axis).                                                                                                                                                                                                                                                                                                         |
| Anything else / ambiguous                                                                                                                                                 | Flag explicitly                                                                                                                                                                                                                                                | Never guess.                                                                                                                                                                                                                                                                                                                                                                                                       |

### 2. Sketch the variant grid

Sketch the grid itself, not just the property list, so the user can picture the layout before
Phase 3. This ASCII sketch is a planning/counting aid, **not** a literal rendering of Phase 3's
"Labeled component set" (that section places the real `COMPONENT_SET` and lets Figma's
`combineAsVariants()` arrange it). Put the sketch in the same draft and **state which case
applies** before asking for approval. Order every axis's options per
`conventions/component-set-rendering.md` → "Option and axis ordering" (code default first, so the
top-left cell is the default variant; then smallest left/top, largest right/bottom) so the approved
sketch already shows the final order:

**Column axis — hard rule, overrides the `size` placement:** `state` is always the single column
axis, so each row reads left to right from the default variant through its states (`default ·
hover · active · …`). `size` then moves to the rows. Only a component with no `state`
axis puts `size` on the column — there the placement doesn't matter; the default just keeps
runs consistent.

**Component-state columns:** after the interaction-state columns (every component state `false`),
each component state adds its `true` variants, in prop declaration order, with every other
component state `false`:

- **Blocked** (`disabled` on `ds-button`, `ds-close`, `ds-input`): one column, `state=default`,
  labeled with the prop name on the value line. `hover` × `disabled=true` doesn't exist — the set
  is sparse on purpose, because code has no such look.
- **Interactive** (`invalid`, `loading` on `ds-input`): one column per interaction state, with the
  prop name as a group label on the axis line above its `default · hover · active`.

E.g. Button: `default · hover · active · disabled · loading`; Input: `state` (3) ·
`loading` (3) · `invalid` (3) · `disabled`. The `state` axis label spans only the first group.
Two component states `true` at once only when code renders that combination differently and the
user approves it.

- **2 axes (normal case)**: one grid, e.g. `size` (rows) × `state` (columns).
  ```
          default  hover   active
  base    [cell]   [cell]  [cell]
  sm      [cell]   [cell]  [cell]
  ```
- **3+ same-layer axes (Primer-style nested matrix)**: fold all axes into one matrix with nested
  row groups — don't stack repeated 2-axis grids. Fixed assignment, no per-component judgment:
  - The column axis per the hard rule above (`state`, else `size`).
  - Every other axis goes on **rows**, nested outer→inner by **ascending option count** (fewest
    options outermost; ties broken by prop declaration order, first-declared outermost). No
    height-based rebalancing.
  - In ASCII, print the outermost row label once per group, blank beneath (merged-cell look).
  - Example — `size` (base/lg), `color` (6 options), `pulse` (2 options): `pulse` outermost,
    `color` inside it, `size` on columns (no `state` axis).
    ```
                      base    lg
    false   default  [cell]  [cell]
            disabled [cell]  [cell]
            info     [cell]  [cell]
            danger   [cell]  [cell]
            warning  [cell]  [cell]
            success  [cell]  [cell]
    true    default  [cell]  [cell]
            ...      ...     ...
    ```
- **Top-level split** (any rule in [Top-level splits](#top-level-splits)): the split axis is not a
  matrix dimension. Sketch each set's own matrix with its own stack and sub-label (e.g.
  `Pagination` and `PaginationDots`, or `Button` and `ButtonInverted`). Set names per `PHASE-3-BUILD.md`
  → "Labeled component set".

### 3. Check the variant count (500 hard stop)

Compute the total before presenting anything. 500 is this skill's own conservative ceiling, not a
Figma limit (Figma only warns about "thousands" per set and a shared ~2 GB per-tab memory budget
across the whole library file) — staying under it leaves headroom for other components.

- For a family, check each member's mapping file on its own.
- **Count** = sum, across every top-level split, of the product of that split's crossed
  variant-property option counts (every property, including `state`). Component-state variants
  aren't fully crossed: count the column axis as `state` options + one per blocked component
  state + `state` options per interactive one (+ one per approved combination), e.g. Button:
  4 + `disabled` + `loading` = 6 columns; Input: 4 + 4 (`loading`) + 4 (`invalid`) + 1 (`disabled`) = 13.
- **Exclude** lightweight Instance Swap library members (single `COMPONENT`s, not crossed sets).
- **≤500** → continue.
- **>500** → stop; do not present for approval. Find the axes driving the count, classify each with
  the table's test, and recommend a mitigation:
  - **Token-swap axis** (same layers, only a Variable-bound value differs — color, border-width,
    elevation, …) → **variable-override mitigation**: bind the attribute to a Figma Variable once
    and let consumers override it per instance instead of crossing it. Zero new nodes, but less
    discoverable than a dropdown — offer it only because the threshold was exceeded, never as a
    default. **Never offered for a size axis.**
  - **Structural or open-ended content axis** → **wrapper + swap library** (one wrapper set
    crossing only the remaining same-layers props, plus a swap library for the content axis).
  - **Size-driven explosion** → a crossed variant (if it fits on its own) or a top-level split (rule 3).
  - **Any axis** → **top-level split** ([rule 3](#top-level-splits)): one component set per option
    of the axis that brings every set ≤500.

  Present the count, the dominant-axis breakdown, and the recommendation(s); let the user choose
  or combine. Recompute against the new structure and **repeat until ≤500**. Mechanics:
  `conventions/content-selection-and-mitigations.md`.

### 4. Write and present

Write the proposed grouping (table result + grid sketch + count) into `<name>.figma.md` and
present it to the user for review. **Pre-flight before presenting:** verify every axis's
`figmaOptions:` and the ASCII sketch follow both ordering hard rules (code default first —
top-left cell = default variant; then smallest at the left or top, e.g. `base · sm · lg`),
`state` is the column axis and every name follows [Naming](#naming) — checked, not assumed.

Add a **Variations** block from Phase 1's `variations:`: per covered set, each variation with its
caption (`show label · bottom`, `all on`) and the snapshot cases still `missing`.

### 5. Wait for confirmation

**Stop and wait for the user to confirm or edit** the mapping in the file before proceeding to
Phase 3. Do not proceed on an assumed approval. The proposal lists every text property (name,
node, default) and every generated text left without one. The sign-off also covers the variation
list and the cases to add to `test/<name>.visual.html`. For a family, present every member's grouping,
the `drivenBy` props and the slot default fills together and wait once.

**After sign-off, add the missing snapshot cases** to `test/<name>.visual.html` and leave them
unstaged. Add them to an existing block that fits (e.g. `ds-button`'s `icon` block for icon
variations): a new block needs a new `data-testid` in `<name>.visual.play.ts`'s `VARIANTS`, which
the `style` tests share, so it would also need a block in `<name>.style.html`. A new block only when
none fits. Snapshots are created
in CI: tell the user to run `/update-screenshots` on the PR. Phase 3 can start meanwhile; Phase 4
can't (`PHASE-3-BUILD.md` → [Next Phase](PHASE-3-BUILD.md#next-phase)).

### 6. Propose new heuristics

Once confirmed, propose any heuristic worth keeping (e.g. a grouping decision that didn't fit the
table) as a new or edited row in this file's step 1 table. A lesson about content-selection props or
threshold mitigations goes to `conventions/content-selection-and-mitigations.md` instead. Show the
exact diff and get approval before writing it — never auto-append.

## Output

- The proposed grouping, its grid sketch (2-axis / nested-matrix / top-level-split) and the
  variant count against the 500 threshold (with a mitigation proposal if exceeded), written into
  `<name>.figma.md`.
- Any new heuristic worth keeping, proposed as an explicit diff against the step 1 table (or the
  content-selection topic file).

## Completion Criteria

- The variant count is ≤500 (after any mitigation round-trip with the user).
- Every axis's options are ordered code default first, then canonical order (checked, not
  assumed).
- The user has explicitly confirmed or edited the grouping and sketch — not an assumed approval.
- The confirmed variation list's missing snapshot cases are added to `test/<name>.visual.html`.
- Any new heuristic was shown as a diff and approved before being written.

## Next Phase

Proceed to [`PHASE-3-BUILD.md`](PHASE-3-BUILD.md) only once step 5's user confirmation is
received.
