# Phase 4 — Validate

## Objective

Verify the built Figma component set against the confirmed mapping file `<name>.figma.md` and the template.

## Inputs

- The confirmed `<name>.figma.md` — variant grouping and grid sketch from Phase 2.
- `figma.config.json`'s `componentLibraryFileKey`.
- The component's name, category folder, JSDoc lead, and `packages/core/package.json` `version`.
- Every resolved Figma variable id from Phase 1 (`tokens:` list) and every nested DS component's
  Figma component key (Phase 1, step 4).
- The component's visual test: `test/<name>.visual.html` and the `*-Desktop-Chrome-linux.png`
  snapshots in `test/<name>.visual.play.ts-snapshots/`.

## References

- The Figma page **`🗂️ Template / Category`** in the library file — the only source of page and
  documentation-frame styling (see [Category pages](PHASE-3-BUILD.md#category-pages)). This skill holds no layout,
  spacing, colour or font values for it.

## Instructions

**Family** (`conventions/families.md` §2): run steps 1 and 3–7 per member's mapping file, one
`<name>.figma-validation.md` each; step 2 (header) only for the owner. The family verdict is the
worst of all reports (`fail` > `blocked` > `pass`) and decides [Next Phase](#next-phase).

1. Load `figma-use` (mandatory before any `use_figma` call; all calls in this phase are read-only,
   except the temporary instances in step 4c)
   and create a session against `figma.config.json`'s `componentLibraryFileKey`. **Locate the
   nodes** by the mapping-file fields Phase 3 wrote (`sets:` → each `figmaMasterNodeId`,
   `figmaDocFrameNodeId`, `figmaPage`, `variations:` → `figmaSectionNodeId` and each entry's
   `nodeId`). If a node is missing, mark every check on it `fail` (`node not found`).
2. **Check the documentation frame header** against `PHASE-3-BUILD.md` → "Documentation frame
   header": `kicker` reads `Core / <Category>` (breadcrumb only, no component name), `component`
   matches the component's real name, `lead` matches the component's JSDoc lead paragraph verbatim,
   `review-status` is `status=review` (never `status=approved`), the `VERSION` row reads
   `v<packages/core/package.json version>`, the `LAST UPDATED` row is a `DD.MM.YYYY` date equal to
   the last Phase 3/5 run that wrote the frame, and all three links (`link-storybook`, `link-toky`,
   `link-github`) carry the correct, non-blank hyperlink per that section's URL rules.
3. **Check the prop/state mapping against the confirmed `<name>.figma.md`** from Phase 2:
   a. Every prop and state listed there is present on the built component set(s) — nothing
   dropped, nothing extra. Every name in `componentPropertyDefinitions`, every variant option
   value is lowercase with spaces, every set name is flat PascalCase with the default set bare,
   and every `sub-label` equals its set name, per `PHASE-2-PROPOSE.md` → "Naming"
   (list each wrong name). Same layers/different token → a variant property on the
   `COMPONENT_SET`, never a shared "style" variant. `state` holds interaction states only; every
   component-state prop (`disabled`, `loading`, `invalid`, …) is its own `false` / `true` variant — a
   `disabled` / `loading` option inside `state` is a `fail`. A blocked one (`interactive: false`)
   has `true` only on `state=default`; an interactive one has `true` on every interaction state.
   **Text properties** (`PHASE-3-BUILD.md` → "Text properties"): every `figmaPropertyType: text`
   prop exists as a `TEXT` property with the agreed name and sentence-case default, created in
   render order, and is bound (`componentPropertyReferences.characters`) on every variant where
   its node exists. No consumer-authored text node is left unbound; no generated text is bound.
   Report found vs. expected bindings per property.
   b. **Top-level splits** — walk `PHASE-2-PROPOSE.md` → "Top-level splits" in order, per prop:
   1. Different layers/structure per option → one `COMPONENT_SET` per option, not a variant
      property.
   2. Inverted axis → separate `<Component>` and `<Component>Inverted` sets.
   3. Over-500 split → the split axis and set names match the mitigation recorded in
      `<name>.figma.md`, and every set has ≤500 variants (count the real children).

   c. No set exists without one of these three rules behind it, and the number and names of the
   sets match `<name>.figma.md`. Flag any prop/state that was merged, split, or skipped
   differently than the confirmed mapping file.

4. **Check token and nested-component bindings** on every variant:
   a. Every fill, stroke, spacing, radius, size and text style is bound to a variable from the
   Phase 1 `tokens:` list — no hardcoded value, no variable outside that list. **Every bound
   paint's stored colour and opacity equal the variable's resolved value for that node**
   (`variable.resolveForConsumer(node).value`, alpha included); a mismatch is a `fail` even when
   the binding itself is correct (see `conventions/build-mechanics.md` → "Color and paint").
   b. Every nested instance except icon slots (see c) has a main component key matching the Phase 1 key for that DS component —
   no detached instance, no local copy. Sub-component instances match the key the
   sub-component's own mapping file recorded in Phase 3 (the `…Inverted` set inside an
   `…Inverted` owner set). A nested non-slot instance whose text the parent passes in has
   `isExposedInstance = true`; every other nested instance and every icon slot has `false`.
   d. Every `slots:` entry is a native `SLOT` on every variant, at its recorded position in its
   part, with the recorded preferred instances and the confirmed default fill (count, non-default
   props, text; empty for an open slot). **Family only:** every `drivenBy` prop on every
   sub-component instance matches the owner variant it sits in (e.g. every `Tab` inside
   `Tabs vertical=true` has `vertical=true`).
   c. Every icon slot and fixed icon (`conventions/content-selection-and-mitigations.md` → "Fixed icons": same checks, minus the swap property and preferred values) from the mapping file is a directly nested glyph library instance (no Icon wrapper); every icon slot has its `INSTANCE_SWAP` property (lowercase name,
   bound on every variant), the right `preferredValues` (icon library, plus brand-icon library
   where applicable), and no exposed nested instance properties. The glyph's size and vector fill
   match code on **every variant and state**: the fill's bound variable id equals the slot's
   `colorSource` entry for that state. An unbound fill is a `fail` even when it looks right — the
   glyphs default to navy, which matches navy parents by accident.
   **Hidden icons:** a layer hidden in the main component (a `show` boolean that defaults to
   false) returns no children, so read it on a temporary instance instead: per variant,
   `createInstance()`, `setProperties` with every `show` boolean of an icon slot set to `true`,
   read the glyph, `remove()`. A fresh instance has no overrides, so it shows the main
   component's bindings. Create and remove them in the same script, off-canvas, and return
   "created N, removed N"; never change the main component (e.g. the boolean's default) instead.
   Layers that are hidden without a boolean (Badge `sm`) are never shown: skip them.
   e. **Interactions** (`PHASE-3-BUILD.md` → "Interactions"): every `state=default` / `state=hover`
   variant with all component states `false`, or in an interactive component state's group, has
   exactly the listed reactions (trigger type, `CHANGE_TO`, instant), each pointing at the variant
   with the same other axes (component states included) and the target `state`; every other
   variant has none. Report found vs. expected counts per set.
5. **Check the component set's layout against the template** (`🗂️ Template / Category` →
   `Labeled component set` in `PHASE-3-BUILD.md`):
   a. **Outer stroke and grid dividers**, per set. Find the set's own `Grid` through its parent
   (`set.parent` → the sibling named `Grid` in the same `Column + Box`) and check only that node's
   `children` — never a name search across the page, which picks up other frames' dividers.
   - The outer dashed stroke around the whole grid exists, with stroke colour, `dashPattern` and
     weight identical to the template node.
   - **Count:** exactly `cols − 1` × `divider-col-<n>` and `rows − 1` × `divider-row-<n>`.
     Report found vs. expected for each (e.g. `divider-col: 0 / 4`).
   - **Geometry:** each divider sits on its cell boundary (±1px) and spans the full set height
     (`divider-col`) or width (`divider-row`).
   - **Layer order:** `Grid`'s index in `Column + Box` is greater than the set's (`Column
Labels`, set, `Grid`). Below the set, the set's fill covers every divider.
   - **Renders:** each is `visible` with opacity > 0. `divider-row` (`LINE`) also has a non-empty
     `absoluteRenderBounds` — a rotated `LINE` can report correct values and still not render (see
     `conventions/component-set-rendering.md`). `divider-col` (a 0.01-wide `RECTANGLE` drawn by its
     left stroke) reports `null` even when it renders, the template's own prototype included: its
     render is checked on the screenshot in step 6b instead.
   - **Styling:** type, width/height on the thin axis, fills, strokes, stroke weights
     (incl. `strokeLeftWeight`) and `dashPattern` identical to the template prototype — quote
     both values.
     Any miss is a `fail`; styling alone never passes this check.
     b. Every column and row label is present and centred within ±1px: column values centred on
     their column, the column axis name centred on the set, row values vertically centred on the
     rows they cover, and the row axis name on the lane's left edge, on the same line as the column
     values.
     c. **Ordering** per `conventions/component-set-rendering.md` → "Option and axis ordering": the
     top-left cell and the first variant layer is the default variant (every axis at its code
     default), `state` is the column axis when the component has one (without `state`, either placement
     of `size` passes), and every
     axis's remaining options follow canonical order.
     d. **Inverted background:** every `…Inverted` stack sits on a dark background cloned from the
     template's `Inverted` stack — same fill and variable binding as that template node (the dark
     `Alias/Surface/Primary`, per `conventions/page-structure.md`). A light or missing background is a
     `fail`.
     e. **Variations structure** (`PHASE-3-BUILD.md` → "Variations"): the `kind=variations`
     `Section` comes right after the `kind=copy-me` section in the `Documentation` column, with one `Preview` per covered set (none
     for an `…Inverted` set) and one instance per expected variation. Each instance's
     `componentProperties` match its caption (booleans and dependent-axis options) and everything
     else stays at the default variant. A `width` / `height` override on a `HUG` instance is not a
     change: Figma records it as soon as a boolean resizes the instance (seen on `ds-button`). Report found vs. expected per set. No `show` boolean defaulting to `false` in the
     family → the placeholder is gone.
6. **Compare against the visual test snapshots** — a quick look, not a pixel diff:
   a. Read `packages/core/src/components/<category>/<name>/test/<name>.visual.html` to see which
   attributes each test case renders, and the matching `*-Desktop-Chrome-linux.png` files in
   `test/<name>.visual.play.ts-snapshots/` (one per case, e.g. `close-sizes-…`, `close-inverted-…`).
   b. Take one `get_screenshot` of each labeled set (set, labels and `Grid`) and name its node id
   in the report. Check every vertical and horizontal grid line is visible in it; a missing line
   is a `fail` even if step 5a passed.
   c. For every snapshot case, compare it with the Figma variant(s) that have the same props
   (default state): shape and silhouette, background present or not, glyph, colours (incl. the
   inverted set against the dark background), and the size relation between `size` options. Any
   visible difference is a `fail` naming the case, the variant, and what differs (e.g.
   `close-sizes: snapshot shows a navy × with no background, Figma shows a black filled circle`).
   d. Skip, and don't list as checks: states the snapshots don't show (hover, focus, active,
   disabled) and snapshot cases for props the confirmed mapping file deliberately excludes (e.g. a
   `button` mode). No snapshot folder → mark this check `not verified`.
   e. **Every variation**, one check each: take one `get_screenshot` per variations `Preview` and
   compare each instance with its `snapshot` case — part present, its position relative to its
   neighbor (right / bottom), gap, size relation, color. The skip in d doesn't apply here. A
   variation whose snapshot doesn't exist is `not verified`. Say whether a difference is in the
   shown part (gap, position) or in the default variant itself (size, color of the whole
   component): the latter is a set bug that every instance has (seen on `ds-spinner`: default
   `size=sm`).
7. **Write the validation report** (see [Output](#output)).

## Rules

- MUST validate actual Figma nodes — never assume a tool operation succeeded.
- MUST quote evidence for every `pass`: the node id(s) read and the measured values (count,
  x/y, width/height, variable id, `absoluteRenderBounds`, screenshot node id). A check without
  evidence is `not verified`, never `pass`.
- MUST NOT turn a `not verified` check into `pass` (e.g. by calling it "expected"); any
  `not verified` makes the verdict `blocked`.
- MUST NOT modify Figma during validation.

## Output

`<name>.figma-validation.md` next to `<name>.figma.md`: one entry per check from steps 2–6 with its
result (`pass` / `fail` / `not verified`), the affected node name/id, and for each failure what was
expected vs. found — with the evidence required by [Rules](#rules). End with an overall verdict:

- `pass` — every check passed.
- `fail` — at least one check failed.
- `blocked` — no failures, but at least one check is `not verified`.

On a re-run, overwrite the check results but keep any existing `## Repair log` section unchanged.

## Completion Criteria

All checks pass.

## Next Phase

- `pass` → [`PHASE-6-DOCUMENT-COPY-ME.md`](PHASE-6-DOCUMENT-COPY-ME.md)
- `fail` → [`PHASE-5-REPAIR.md`](PHASE-5-REPAIR.md)
- `blocked` → stop, list the `not verified` checks and why, and ask the user how to proceed.
