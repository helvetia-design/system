# Conventions — content-selection props and threshold mitigations (Phase 2, Phase 3)

Relevant to Phase 2's grouping proposal when a component has an open-ended content prop or
exceeds the variant threshold, and to Phase 3 when building wrapper sets. See `../CONVENTIONS.md` for the index
(the core "same layers → variant, different layers → top-level split" test lives in
`../PHASE-2-PROPOSE.md` step 1).

## Prop-to-variant mapping

The prop-to-variant mapping rules (no-static-effect booleans excluded, conditional props keep their
own axis, a text property for every consumer-authored text, paired `show <name>` boolean for
conditionally rendered text, two nodes when one part renders two props) are canonical in
`../PHASE-2-PROPOSE.md` step 1 — not duplicated here.

## Open-ended content-selection props (current rule)

- **A pure open-ended content-selection prop with no crossed sub-props** (e.g. an icon `name`
  backed by an unbounded set of SVGs) becomes N separate top-level components, one per option
  (`<Component><Option>`, e.g. `IconXing` — flat PascalCase per `../PHASE-2-PROPOSE.md` → "Naming"), swapped via Figma's native Instance Swap — never a crossed variant
  property, however many options it has. These are single `COMPONENT`s, not a top-level split.
- **A large open-ended content-selection prop that also has crossed same-layers sub-props** (e.g.
  `ds-icon`'s `size`/`color` on top of 79 names) gets **one wrapper `COMPONENT_SET`** crossing
  only the sub-props, with each variant containing a nested `INSTANCE` bound to an
  `INSTANCE_SWAP` component property (`addComponentProperty('icon', 'INSTANCE_SWAP', defaultId)`
  on the set, `componentPropertyReferences = { mainComponent: propKey }` on each variant's nested
  instance), **plus a lightweight Instance Swap library** of single-vector `COMPONENT`s (not
  sets) parked off-canvas — not N top-level sets each repeating the full cross-product. Figma
  preserves per-instance overrides (resize, fill rebinds) across an Instance Swap when the
  overridden node has a name-matching counterpart in the new component — verify this explicitly by
  testing an actual swap, don't just assume it propagates. Reduced `ds-icon` from a 2,370-component
  attempt to 109 (30 wrapper variants + 79 library members). Apply this pattern by default for any
  future component with this shape.
  - **A glyph/content library item needs exactly one fill-bearing node, name-matched to the
    wrapper's default's own structure, for color overrides to propagate fully on swap.** An icon
    with more than one top-level `VECTOR` (e.g. a 2-path logo) only gets one path recolored on
    swap (or none, if nesting differs from the default). Fix: `figma.flatten()` any multi-vector
    library item into one `VECTOR` before adding it to the library, **then immediately reassign
    `vector.fills = JSON.parse(JSON.stringify(vector.fills))`** (a value-preserving reassignment,
    not a real change) — `flatten()` otherwise leaves the new vector's fills reading correctly on
    the master but empty when read through a swapped instance. (From: `ds-icon`'s `xing` /
    `information`, the only 2 of 79 icons with multi-path source SVGs.)

## Icon slots in a parent component

A nested `ds-icon` or `ds-brand-icon` inside the component being built (e.g. `ds-button`'s
`icon` / `iconRight`) is an **icon slot**. Icon slots always use instance swap — never a variant
property, never an exposed nested instance, never a separate set per icon.

- **Nest the glyph directly — always, without asking.** The icon layer is an instance of a glyph
  library component (the 79 single `COMPONENT`s on the Icon page), a direct child of the parent
  variant — never the Icon wrapper set. The Plugin API can't bind a parent `INSTANCE_SWAP` two
  levels down (parent → wrapper instance → glyph): property references can't be set on a layer
  inside an instance.
- **One `INSTANCE_SWAP` component property per icon slot** on the parent set, named after the code
  prop per `../PHASE-2-PROPOSE.md` → "Naming" (`icon`, `icon right`), bound to the glyph
  instance via `componentPropertyReferences = { mainComponent: propKey }` on every variant.
- **Preferred values** (`preferredValues`): the icon swap library; plus the brand-icon library when
  code lets `ds-brand-icon` fill the same slot (in `ds-button`, `brandIcon` replaces `icon` in
  `part="icon"`).
- **Never expose the glyph instance** (`isExposedInstance = false`). Its size and color are set
  per parent variant, matching code: bind the glyph's `width` / `height` and its vector's fill to
  the variables the code uses for that variant (`ds-badge`: `Size/*/Icon` and the badge's text
  color).
- **Conditionally rendered slot** (`hasValue(this.icon) && …`) → also a `show <name>` boolean per
  the Phase 2 mapping table.
- Every other nested DS component (e.g. `ds-spinner`) stays a plain nested instance.
- **Color source per variant and state:** the glyphs are unbound navy, so a missed binding still
  looks right on navy parents. Phase 1 records, per variant and state, where the code takes the
  icon color from: the parent's `--icon-color` (usually its text token), `ds-icon`'s `color` /
  `inverted` / `disabled` props, or nothing (Icon primary), as the slot's `colorSource`. Phase 3
  binds the vector fill to exactly that on every variant; Phase 4 compares variable ids against it.
- **Build order:** read the glyph and its vector **before** binding `visible` to a `show` boolean
  that defaults to false: the hidden layer's children can't be read afterwards.

### Fixed icons

A nested `ds-icon` whose `name` is hardcoded in code (not driven by a prop, e.g. `ds-input`'s
`<ds-icon name="alert">` in `field.util.tsx`) is a **fixed icon**. It follows every icon-slot rule
above except the swap:

- **Nest the glyph directly** (that exact glyph from the Icon page), never the Icon wrapper set.
- **No `INSTANCE_SWAP` property** and no preferred values — code offers no choice. Not exposed.
- **Size, padding and color bound per variant like a slot:** `width` / `height` to the size the code
  renders (the `size` prop, or `ds-icon`'s default `base` when none is set; a parent
  `--icon-size` wins), padding per `ds-icon`'s size, and the vector fill per the icon's
  `colorSource` (recorded in Phase 1, checked in Phase 4 step 4c).
- **Conditionally rendered** (`invalid && invalidText && <ds-icon>`) → visible only on the variants
  where code renders it, or a `show <name>` boolean when a text/prop guard decides it.

## The 500-variant threshold

- The count formula and hard-stop loop are canonical in `../PHASE-2-PROPOSE.md` step 3.
- **When over threshold, a token-swap axis** (same layers, only a different bound-Variable value —
  color is the common case, but this generalizes to border-width, elevation, or any
  variable-bound attribute) **can be resolved via a per-instance Figma Variable override** instead
  of a crossed variant property, using `setBoundVariableForPaint` (or the matching bound-variable
  setter for non-paint fields). Reserved for when the threshold is actually exceeded, not a
  universal default — a small, harmless token-swap axis still gets a normal crossed variant
  dropdown by default, since that's more discoverable for consumers. **Size axes are never
  eligible for this mitigation** — resolve a size-driven explosion via a crossed variant (if it
  fits on its own) or a top-level split (rule 3), never a variable swap.
- **An open-ended/structural axis contributing to a threshold breach uses the existing wrapper + swap
  library pattern** above, rather than a new technique — the mitigation for this axis
  type was already solved; the hard-stop check just surfaces when it's needed sooner than a human
  would have noticed.
