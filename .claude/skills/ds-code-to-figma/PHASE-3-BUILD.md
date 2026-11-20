# Phase 3 — Build incrementally

## Objective

Build the real Figma component set from the variant grouping and grid sketch that Phase 2 got
explicit user confirmation on.

## Inputs

- The confirmed `<name>.figma.md` — variant grouping and grid sketch from Phase 2.
- `figma.config.json`'s `componentLibraryFileKey` and `foundationLibraryFileKey`.
- The component's name, category folder, JSDoc lead, and `packages/core/package.json` `version`.
- Every Foundation variable name from Phase 1 (`tokens:` list) and every nested DS component's
  Figma component key (Phase 1, step 4).

## References

- `figma-use` skill — mandatory before any `use_figma` call.
- `CONVENTIONS.md` — for the seeded category-copy table.
- The Figma page **`🗂️ Template / Category`** in the library file — the only source of page and
  documentation-frame styling (see [Category pages](#category-pages)). This skill holds no layout,
  spacing, colour or font values for it.

## Instructions

**Family** (`conventions/families.md` §2, §4, §7): step 2 runs once, for the owner. Steps 3–5
run **per set, in build order** — contained sub-components → owner → wrapping sub-components —
each set getting its own first-variant checkpoint (step 4), all stacks in the owner's one `Sets`
frame. Instances of a sub-component's set replace the code's slotted children: build each code
`@slot` from `slots:` as a native Figma `SLOT` with its preferred instances and the confirmed
default fill, and pre-set every `drivenBy` prop on those instances to match the variant. Step 6
runs once, for the whole frame; step 7 writes back into every member's mapping file.

1. Load `figma-use` (mandatory before any `use_figma` call) and create a session against
   `figma.config.json`'s `componentLibraryFileKey`.
2. **Find or create the component's shared category page and its documentation frame**, per
   [Category pages](#category-pages) and [Documentation frame header](#documentation-frame-header)
   below — never create a page named after the component itself.
3. Build **the default variant first** (every variant property at its code default,
   `state=default`). **Create it directly inside this
   component's own documentation frame on the category page:** the parent is
   `<Component> Documentation` › `body` › `Component Sets` › `Sets` (from step 2). Never build it
   on a scratch page, at the page root, or off-canvas and move it in later. Wire up:
   - The component's shape/layout.
   - Every styled value bound to its Foundation variable from Phase 1 (never a literal).
     **Import by key, then bind** — `figma.variables.importVariableByKeyAsync(key)` with the key
     for the `figmaVariable` name, from the name → key map read once per run from the Foundation
     file (`conventions/tokens-and-props.md` → "Binding Foundation variables"). Never bind to a
     variable of the component file's own local collections, and never by an id from
     `Base.tokens.json`.
   - **Create every bound paint from the variable's resolved value** —
     `variable.resolveForConsumer(node).value`, alpha included — **before**
     `setBoundVariableForPaint`. Never a placeholder colour: the master keeps rendering the
     placeholder even though the binding is correct (e.g. a transparent background shows as solid
     black). See `conventions/build-mechanics.md` → "Color and paint".
   - Every nested component as an **instance of the existing Figma component** resolved in
     Phase 1, step 4 — never redrawn from scratch. **Icon slots** (nested `ds-icon` /
     `ds-brand-icon`) get an `INSTANCE_SWAP` property with preferred values and the glyph library
     component nested directly (no Icon wrapper, no question to the user), per `conventions/content-selection-and-mitigations.md` → "Icon slots in a parent
     component". Bind the glyph's vector fill on every variant to the slot's `colorSource` entry
     for that variant's state.
   - Every text node for consumer-authored text, with its sentence-case default characters and
     its tokens; the text properties themselves come after combining, per
     [Text properties](#text-properties).
   - **No Figma default layer names** (`Frame 1`, `Line`, `Ellipse`, `Vector`, `Group 1`). Name
     built layers after their part (`icon`, `label`, `track`); cloned layers keep their template
     name.
   - **Text property bindings — what the Plugin API can and can't bind** (tested 04.11.2026):

     | Property         | Figma variable                                    | Bind?                                                     |
     | ---------------- | ------------------------------------------------- | --------------------------------------------------------- |
     | `letterSpacing`  | `Alias/Text/LetterSpacing/*` — FLOAT              | Yes, `setRangeBoundVariable`. Applies as `PIXELS`.        |
     | `lineHeight`     | `Alias/Text/LineHeight/*` — STRING (`"150%"`)     | No: "variable of resolved type 'STRING' cannot be bound". |
     | `textDecoration` | `Alias/Text/TextDecoration/*` — STRING (`"NONE"`) | No: not a bindable text field.                            |

     For the two that cannot be bound: read the imported variable's value with
     `variable.resolveForConsumer(node).value`, then set it as a **literal, unbound** value —
     `lineHeight = { unit: 'PERCENT', value: parseFloat("150%") }`, `textDecoration = "NONE"`.
     Record each in `<name>.figma.md`'s tokens list with its `figmaVariable` and as an exception
     (resolved but intentionally unbound, with the reason), not as a hard stop — the token exists
     and its value is applied, it's just not a live binding. `letterSpacing` binds as `PIXELS`,
     which is right for the current `0` tokens; for a non-zero token, compare the bound pixel
     value against the code's rem value and hard stop if they differ.

   - **Binding `fontFamily`/`lineHeight` on an empty text node doesn't survive setting
     `characters` afterward** — text styling is per character-range, so writing new characters
     resets any binding applied while the node was empty. Set `characters` (and load whatever
     font that content needs) **before** calling `setRangeBoundVariable` for text properties, not
     after.
   - **Font-loading gotcha:** binding `fontFamily` to an Alias text-family variable (e.g.
     resolving to `Baloise Create Text`) changes the node's effective font. Any further text
     property write on that node then requires that exact font to be loaded first
     (`figma.loadFontAsync`), even if a different font (e.g. Inter) was loaded earlier in the
     same script — load the _resolved_ font family, not just a default.
   - **Responsive (`device:`) bindings.** For every entry in `<name>.figma.md`'s `device:` section
     (from Phase 1 step 5a), import the routing variable `<path>/Device` from Foundation's
     `Design Responsive Tokens` by key and bind the node's property (height / width / padding /
     gap / whatever `device:` recorded) to it **once** — never to one of the three
     per-breakpoint variables. The file's Mobile / Tablet / Desktop mode switcher then changes the
     rendered value natively; don't create a `device` variant property or separate instances per
     breakpoint. Before binding, check its three mode values resolve to the per-breakpoint
     variables recorded in `device:`; a mismatch is a hard stop. **Never create a variable** —
     a missing routing variable was already listed in Phase 1 (stop and list); if one is missing
     at build time, stop and list it the same way.
4. **Stop and have the user confirm this one variant directly in Figma** — give them the node link
   (`https://www.figma.com/design/<fileKey>?node-id=<id>`) and wait. Don't send a screenshot as
   the checkpoint. This catches a structural mistake (wrong variable bound, wrong nested
   instance) once, before it's replicated across the whole component set. List the text
   properties it carries, so the user can try them from the right panel.
5. On confirmation, fan out: build the remaining variants, reusing the same
   bindings and nested instances, and present them as a labeled set per
   [Labeled component set](#labeled-component-set) below — inside the same `Sets` frame.
   Then fill the Variations placeholder, per [Variations](#variations).
6. **Stop and have the user approve the documentation frame directly in Figma** — the filled
   `Header`, the finished component set(s) and the Variations section — give them the link to the frame and wait. Any change loops back to step 5. Don't continue to Phase 4 on an
   assumed approval.
7. Write `sets:` (name, `figmaComponentKey`, `figmaMasterNodeId` per set, default set first),
   `figmaPage`, `figmaDocFrameNodeId` and the `variations:` node ids back into the mapping file. For a family: into every
   member's file (`figmaDocFrameNodeId` is the owner's frame in all of them), and each
   sub-component's key into the owner's matching `nested:` entry.

### Category pages

Components are grouped onto one shared Figma page per code category, not one page per component.
The category is the folder under `packages/core/src/components/<category>/` (see
`packages/core/CONTEXT.md`'s Usage-Category Taxonomy). The target page name is
**`Core / <Category>`** — Title Case, plural, matching the folder name (`indicators` →
`Core / Indicators`).

**All styling comes from the template page `🗂️ Template / Category`.** Never hand-build the shell
and never write layout, spacing, colour or font values in this skill — clone, then change only
what's listed below.

1. Find the template page by exact name. **Hard stop** if it's missing.
2. Search `figma.root.children` for a page named exactly `Core / <Category>`.
   - **Not found → clone the whole template page** (`templatePage.clone()`), rename it
     `Core / <Category>`, and override `Category Header`'s `component` and `lead` text from the
     fixed category-copy table in `CONVENTIONS.md`. Never invent copy; if the category is missing
     from the table, **hard stop** and ask for title/lead text.
   - **Found → reuse it.** Clone only the template's `Component Documentation` frame and move it
     into the existing page's `Documentation Frames` row, **appended last** (`framesRow.appendChild`) — never inserted at a sorted position, never repositioning a sibling component's frame (clone from the template every time,
     never from a sibling component, so styling can't drift).
3. In the cloned page/frame, keep `Component Documentation` as this component's frame: rename it
   `<Component> Documentation` (the template holds only this one frame since 18.11.2026), and leave
   `body`'s placeholder content for Phases 6–8 (the Variations placeholder is filled in step 5).
4. Fill the header, per [Documentation frame header](#documentation-frame-header).

**Layer-name contract.** This skill addresses the template by these layer names only. If any is
missing, **hard stop** and report which — never fall back to hand-building.

| Where               | Layer names touched                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page                | `Category Frame` › `Category Header` (`component`, `lead`) › `Documentation Frames`                                                                                                                 |
| Documentation frame | `Component Documentation` › `Header`, `body` › `Documentation` › 4 `Section` placeholders (`Title` `kind` = `copy-me`, `anatomy`, `measurements`, `variations`), `body` › `Component Sets` › `Sets` |
| Variations          | `kind=variations` `Section` › nested `Preview` › `variations-set` (`title`, `entries` › `entry` (`Component`, `caption`))                                                                           |
| Sets stack          | `Sets` › `Primary` (`sub-label`, `Labeled Set` › `Row Labels` › `lane-<axis>` › `bracket-<n>`, `Column + Box` › `Column Labels`, set, `Grid` › `divider-row-<n>` / `divider-col-<n>`)               |
| `Header`            | `kicker`, `title` › `component`, `review-status`, `body` › `lead`, `meta` › `row` (`label`/`value`)                                                                                                 |
| `Header` links      | `links` › `link-row-storybook` / `link-row-toky` / `link-row-github` › `link-storybook`, `link-toky`, `link-github`                                                                                 |

### Labeled component set

The template's `Sets` frame is a worked example: one stack per split, each a `Labeled Set` of
`Row Labels` + `Column + Box` (`Column Labels`, the `COMPONENT_SET`, a dashed `Grid` overlay). Build
the real set by cloning from it — **this skill writes no fill, stroke, font, dash or spacing
values**; clone a prototype and change only text and positions.

1. **Stacks — one per top-level split option from Phase 2** (`PHASE-2-PROPOSE.md` → "Top-level
   splits"). Name each set and its stack's `sub-label`:

   | Top-level split             | Stacks                                    | Set name = `sub-label` (e.g.)                                                  |
   | --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
   | None                        | one                                       | `Button` (`sub-label` removed — the frame title already names it)              |
   | Rule 1 or 3 only            | one per option of the split axis          | `Pagination`, `PaginationDots`                                                 |
   | Rule 2 (inverted axis) only | default, inverted                         | `Button`, `ButtonInverted`                                                     |
   | Rule 1 or 3 **and** rule 2  | one per combination, rule 1/3 split outer | `Pagination`, `PaginationInverted`, `PaginationDots`, `PaginationDotsInverted` |

   Set names follow `PHASE-2-PROPOSE.md` → "Naming": PascalCase, flat, the default set bare. Each
   stack's `sub-label` is **exactly its set name**, so the heading matches what designers find in
   the assets panel.

   **Family:** every member adds its own stacks per this table, in build order
   (`Tab`, `TabPanel`, `Tabs`). With more than one stack in `Sets`, every stack keeps its
   `sub-label` — the "None" row's removal applies only to a family of one.

   Source every inverted stack from the template's `Inverted` stack and every other stack from its
   `Primary` stack. Delete template stacks that aren't needed.

2. **Combine** the stack's variants into a `COMPONENT_SET` with `combineAsVariants()`. **First put
   the variants in grid reading order as layers in one parent** (`insertChild`), default variant
   first: Figma sets each property's option order once, at combine time, from the first layer that
   uses each value, and ignores the order of the array passed in. Reordering layers or renaming
   afterwards doesn't change it, and the Plugin API has no setter. Check
   `componentPropertyDefinitions[axis].variantOptions` right after combining. Clone the
   template set's fill, stroke (dashed, purple, variable-bound) and corner radius onto it by
   copying them from the template set — never recreate them. Put the new set **in the template
   set's place** in `Column + Box` (between `Column Labels` and `Grid`), never after `Grid`.
3. **Axes → grid.** Per `PHASE-2-PROPOSE.md` step 2: `state` is the column axis (`size` only when
   there is no `state` axis), followed by one column per component-state variant (`disabled`, `loading`, …,
   `PHASE-2-PROPOSE.md` → "Component-state columns"); every other axis is a row, nested outer→inner by ascending option count (ties: prop declaration order).
   Order the options within each axis per `conventions/component-set-rendering.md` → "Option and
   axis ordering" — code default first (top-left cell = default variant), then smallest left/top,
   largest right/bottom.
4. **Fixed cell grid, not Figma's native arrangement.** Cell = the largest variant in the whole set
   **plus 16px on every side** (width from the widest variant, height from the tallest). One
   uniform cell size. Centre each variant in its cell by computed x/y, then resize the set to
   cols × rows cells. Order the variant layers in grid reading order — rows top→bottom, then
   columns left→right (`insertChild`) — because Figma's variant picker lists options in layer
   order. **Lay out the grid after the component properties are added and bound** (`show <name>`
   booleans, swaps, text properties): binding a layer's `visible` or a text default changes the
   variant's width, so variants placed before stay off-centre. Changing a text property's default
   later (e.g. `Button` → `Label`) needs the variants re-centred (seen on `ds-button`: up to 6px).
   **Taller than the `Documentation` column:** the cloned `Component Sets` column is `FILL`
   height and clips anything below it. Set it to `layoutSizingVertical = 'HUG'` (seen on
   `ds-input`, 120 variants: the lower 9 row dividers reported no render bounds). Only then:
   on a frame whose `Documentation` column is taller, `HUG` cuts the column's background panel
   short, so keep `FILL` (the template stays `FILL`). **Width:** `Component Sets` and `body` hug
   their content (template, 18.11.2026), so the column is as wide as the widest stack and the
   header follows; `Documentation` stays fixed at 764 (its sections fill it).
5. **Every set is labeled — no axis count is exempt, not even a single-axis set.** With no row axis
   (e.g. a lone `size` axis) there are just `Column Labels` and no `Row Labels`.
6. **Labels and grid lines, cloned from template prototypes** — a `Column Labels` text, a
   `lane-<axis>` text, a `bracket-<n>`, a `divider-row-<n>` / `divider-col-<n>`. Name every
   column/row axis and option outside the set. Label text repeats the property value exactly
   (`base`, `sm`, `none`, `leading`) — never title-cased, abbreviated or reworded.
   - **`Column Labels`:** keep the cloned strip as is. Centre the axis name on the set and each
     value text on its column; `Column Labels` width = set width. With component-state columns,
     centre `state` on the interaction-state columns only, and label each component-state column with its prop name
     (`disabled`, `loading`) on the value line.
   - **`Row Labels`: one lane (`lane-<axis>`) per row axis**, outer→inner, left→right. Lane width =
     longest text in the lane, axis name included. Labels are left-aligned in their lane and
     vertically centred on the rows they cover; the axis name sits at the lane's left edge, on the
     same line as the column values. Every lane but the innermost is followed by 8px, its brackets
     (the cloned bracket's own width), 8px. Each bracket spans its group's rows minus 8px at both
     ends. `Row Labels` width = sum of the lanes, height = `Column + Box` height. One row axis →
     one lane, no bracket.
   - **`Grid`:** the dividers are **children of this stack's own `Grid` frame** (the set's sibling
     inside `Column + Box`), which covers the set and sits above it in layer order.
     1. Keep one `divider-col` and one `divider-row` from the cloned template as prototypes and
        delete every other divider in this `Grid` — the clone carries the template example's
        count, not this set's.
     2. Clone exactly `cols − 1` × `divider-col-<n>` and `rows − 1` × `divider-row-<n>` from the
        prototypes, each on its cell boundary and spanning the full set height (col) or width
        (row); then delete the prototypes. Change **only length and position** — keep everything
        else from the prototype: type, thickness, fills, strokes, stroke weights, `dashPattern`
        (today `divider-col` is a `RECTANGLE`, 0.01 wide, `strokeLeftWeight` 2, dashed;
        `divider-row` is a `LINE`, stroke 2, dashed). Never use a rotated `LINE` (see
        `conventions/component-set-rendering.md` → "Sizing and layout mechanics").
     3. Read back from **this `Grid` node's `children`** — never a name search across the page:
        every documentation frame (and the template) has nodes named `divider-col-1` etc. Confirm
        the count, that each divider's styling matches the prototype, a non-empty
        `absoluteRenderBounds` on every `divider-row` (`divider-col` reports `null` even when it
        renders — check it on a screenshot), and the **layer order**: `Grid` comes after the set in
        `Column + Box` (`Column Labels`, set, `Grid`), so it draws on top. A `Grid` below the set is
        covered by the set's fill and every divider disappears.

**Special case — asset components** (open-ended content prop such as icon `name`, later brand
icons): build the wrapper `COMPONENT_SET` + Instance Swap library per
`conventions/content-selection-and-mitigations.md`, and show the wrapper set in the labeled `Sets`
stack as usual. These components also get a "🖼️ \<Plural noun\> names" browsing section for the
content axis. The template has no placeholder for it: insert a `Section` instance (`Flat`) last
in the `Documentation` column, after Measurements, set its nested `Title` to `kind=names`, set
`layoutSizingHorizontal = 'FILL'`, and change the `Title` instance's text to `🖼️ <Plural noun>
names` (`🖼️ Icon names`). Never detach it. The slot's content isn't defined yet: on the first
asset component, **stop and ask the user** how it should look before building it, then record the
answer here.

**Hard rules (check before asking for approval):** default variant in the top-left cell and first
in layer order · `state` on the column axis · remaining options ordered per convention · every
property name and option value lowercase, every set name PascalCase and every `sub-label` equal
to its set name per `PHASE-2-PROPOSE.md` → "Naming" · fixed uniform cell grid · dashed outer stroke
**and** inner dashed grid lines — per set `(cols − 1) + (rows − 1)` dividers, styled like the prototypes, `Grid` above the set · outside labels naming every axis and option · variant layers in
grid reading order · every consumer-authored text bound to its text property on every variant ·
no Figma default layer names · no styling literal written by this skill.

### Text properties

Every `figmaPropertyType: text` prop from the mapping file becomes a `TEXT` component property
(`PHASE-2-PROPOSE.md` → mapping table and "Naming").

1. After `combineAsVariants()`, add them on the set **in render order** (top → bottom):
   `set.addComponentProperty('<name>', 'TEXT', '<Sentence case default>')`. Store the returned key
   (it comes back suffixed, `label#123:4`) and use it for every reference and `setProperties`.
2. On **every** variant, set `textNode.componentPropertyReferences = { characters: key }` on the
   matching node. A node can carry both `characters` and `visible` references (text property +
   `show <name>`). Mechanics: `conventions/build-mechanics.md` → "Text properties".
3. **Two nodes for one part** (mapping table, "One node, two props" rows): build both nodes in
   every variant. With the `filled` axis, set each node's `visible` statically per variant
   (`filled=false` → placeholder node, `filled=true` → value node). With an existing axis
   deciding (`color=invalid`), the `show <name>` boolean binds only to the default node
   (`description`); the node that option stands for (`invalid text`, with its fixed icon) is
   always visible there, because the option already means that text is set.
   - **Wrapping a text node in a new frame** (e.g. `label` + generated `optional`): keep the text
     `FILL` with `textAutoResize = 'HEIGHT'` so it still wraps like code. Next to a second node in
     a horizontal row, use `HUG` + `maxWidth` (row width − the other node), since Figma can't flow
     two text nodes inline.
4. **Nested non-slot DS instance whose text the parent passes in:** set `isExposedInstance = true`
   on it in every variant. Never on an icon slot, never on a child whose text properties the
   parent's code doesn't set.
5. **Slot default fills** (`conventions/families.md` §4, e.g. 3 × `Tab`): set their text with
   `instance.setProperties({ [key]: 'Tab 1' })`, never by editing `characters`.
6. Generated text stays a plain text node with no reference.

### Slots

Every `slots:` entry becomes one native `SLOT` component property on the set, shared by every
variant (mechanics: `conventions/build-mechanics.md` → "Slots").

1. After `combineAsVariants()`, add the properties on the set, **one slot at a time in render
   order, each slot's `show` boolean first, then the slot** (`show start`, `start`, `show end`,
   `end`). Figma lists component properties in the order they were created and the Plugin API
   can't reorder them, so this order is final.
   - **Open slot only:** `set.addComponentProperty('show <figmaSlot>', 'BOOLEAN', false)`. An
     empty Figma slot keeps a size and takes the part's gap; an empty code slot takes no space,
     so the slot is hidden until a designer turns it on.
   - Then `set.addComponentProperty('<figmaSlot>', 'SLOT', '')`. Store the returned keys. Set the
     preferred instances with
     `set.editComponentProperty(key, { preferredValues: [{ type: 'COMPONENT_SET', key }] })`, in
     the mapping file's order.
2. On **every** variant, add an empty frame named after the slot at its code position inside the
   part (`start` first in `control`, `end` after the value / placeholder text, before a loading
   spinner): horizontal auto-layout, centered, no fill, `resize` to the main content's size
   (16 × 16 for an icon), then `HUG` both ways, so a shown but empty slot keeps that size. Bind it:
   `frame.componentPropertyReferences = { slotContentId: key, visible: showKey }` (`visible` only
   for an open slot). It turns into a `SLOT` node. The part's own gap and padding space it — the
   skill writes no spacing here.
3. Default fill: the confirmed `defaultFill` (family slots), or empty for an open slot. Fill a
   slot in an instance by `appendChild`, never with `setProperties`; turn on its `show` boolean
   first, or the slot isn't reachable.
4. Add slots before the grid layout (step 4 of "Labeled component set"), like text properties.

### Interactions

When the set has a `state` axis, wire the interaction states as prototype reactions on the
variants (`setReactionsAsync`), so an instance reacts like the code in prototypes. Per row (every
other axis fixed), once for the group with every component state `false` and once per
interactive component state's group (its `true` variants, e.g. `invalid=true`):

| From variant    | Trigger                     | To             |
| --------------- | --------------------------- | -------------- |
| `state=default` | `ON_HOVER` (while hovering) | `state=hover`  |
| `state=default` | `ON_PRESS` (while pressing) | `state=active` |
| `state=hover`   | `ON_PRESS` (while pressing) | `state=active` |

- Action: `{ type: 'NODE', destinationId: <target variant id>, navigation: 'CHANGE_TO',
transition: null }` (instant). Both triggers revert by themselves on mouse-leave / release — no
  return reactions.
- Only the options the component has: no `hover` → no hover reaction; no `active` → no press
  reaction.
- **No reactions** on `state=focus` (Figma has no keyboard-focus trigger, and a click must not show
  the `:focus-visible` ring), on `state=active`, and on every blocked component state's `true`
  variant (`disabled` doesn't react in code). Reactions stay inside their group: `invalid=true`
  hover goes to `invalid=true` active, never to the `invalid=false` one.
- A CSS `transition` in code is not copied into Figma — note it in the mapping file.
- Set reactions after the grid is final (variants recreated later lose them).

### Variations

The second section of the `Documentation` column, right after Copy me, shows every `show <name>` layer turned on, so
Phase 4 can check it against the visual test snapshots. Built from the mapping file's confirmed
`variations:`, after the labeled sets and their text properties, booleans and reactions are final.

1. Find the cloned frame's `Section` whose `Title` is `kind=variations`. 🛑 **Hard stop** if it's
   missing — never build the chrome.
2. **No `show` boolean defaulting to `false` anywhere in the family** (empty `variations:`):
   delete the placeholder and skip the rest.
3. **One nested `Default` `Preview` per covered set**, in build order: clone the template's
   `Preview` (with its `variations-set` card) for each set, delete the unused ones, set
   `layoutSizingHorizontal = 'FILL'` on each (`conventions/document-sections.md` → "Sizing"). Set
   the card's `title` to the set name.
4. **One `entry` per variation**: clone the card's first `entry`, delete the unused ones. Replace
   its `Component` with `variant.createInstance()` of the set's default variant, named after the
   set, then `setProperties` with the entry's `props` (booleans and dependent-axis options) —
   nothing else. Never place a variant node, never `detachInstance()`. Set `caption` to the
   entry's caption (`show label · bottom`, `all on`).
5. Fixes found later go on the master variant, never on these instances
   (`PHASE-5-REPAIR.md`).

### Documentation frame header

Override text on the cloned `Header` instance by finding each node by name and setting
`.characters` (load the node's current fonts first). Never edit the `Header` master or detach the
instance.

| Layer           | Value                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `kicker`        | `Core / <Category>` — breadcrumb only, no component name                                                                               |
| `component`     | Component name (e.g. `Badge`)                                                                                                          |
| `review-status` | **Always `status=review`**, swapped via `swapComponent()` — never `status=approved`                                                    |
| `lead`          | The component's JSDoc lead paragraph                                                                                                   |
| `meta` rows     | Value of the `VERSION` row → `v<core package version>`; `LAST UPDATED` row → `DD.MM.YYYY` today. Labels never change.                  |
| `link-*` text   | Text stays (`View in Storybook ↗` etc.); set a hyperlink on each via `setRangeHyperlink(0, characters.length, { type: 'URL', value })` |

Link URLs (all mechanically derivable — none may ship blank):

- **Storybook** → `https://helvetia-design.vercel.app/?path=/docs/<storyId>`, where `<storyId>` is
  `<NAME>_DOC_CONFIG.tabs[0].storyId` from
  `apps/storybook/src/components/<category>/<name>/<name>.doc-config.ts` — read it, never derive
  it from the name. If `doc-config.ts` doesn't exist, **hard stop** and ask.
- **Toky** → `https://helvetia-toky.vercel.app?filter=<component name, lowercase>`
- **GitHub** → `https://github.com/helvetia-design/system/tree/main/packages/core/src/components/<category>/<name>`

**Standing rule — applies to every write to a component's frame, not only the first build:**
reset `review-status` to `status=review`, re-read the version and today's date, and recompute and
re-set all three hyperlinks, unconditionally, even if they look correct. A human may have set
`status=approved` on an earlier version; any further skill edit invalidates that approval.

## Output

- The full component set(s), inside the component's own documentation frame
  (`body` › `Component Sets` › `Sets`)
- The component's shared category page (`Core / <Category>`) with its documentation frame
  (`<Component> Documentation`) cloned from the template and its `Header` filled
- The resulting Figma component

## Completion Criteria

- The default variant was confirmed by the user in Figma before the rest of the component set
  was fanned out.
- The finished labeled component set(s) satisfy the hard rules above and were approved by the user
  in Figma before Phase 4.
- Every styled value is bound to a Foundation library variable — never a literal, never a local
  variable of the component file — except the documented `lineHeight`/`textDecoration`
  exceptions (resolved value, intentionally unbound).
- Every `device:` responsive binding is bound to its Foundation `<path>/Device` routing variable,
  never directly to one of the three per-breakpoint variables; no variable was created.
- The category page and the component's documentation frame exist, cloned from
  `🗂️ Template / Category` (no styling values written by this skill), with the header filled,
  `review-status` at `status=review` and all three links hyperlinked.
- `sets:` (every set, default first), `figmaPage` and `figmaDocFrameNodeId` are written back into
  every family member's mapping file.
- The Variations section holds one `Preview` per covered set and one instance per confirmed
  variation (or its placeholder was deleted), and its node ids are in `variations:`.
- Every `slots:` entry is a native `SLOT` on every variant, with its preferred instances and
  default fill.
- For a family: every sub-component set was built before the sets that instantiate it, each with
  its own confirmed first variant; every `drivenBy` prop matches its owner variant.

## Next Phase

Proceed to [`PHASE-4-VALIDATE.md`](PHASE-4-VALIDATE.md) once the full component set is built, the
category page exists, and the mapping-file fields are written back.

🛑 **Hard stop before Phase 4** while any variation has no `*-Desktop-Chrome-linux.png` snapshot
yet (cases added in Phase 2, created by `/update-screenshots` in CI). Name the missing cases and
wait for the user.
