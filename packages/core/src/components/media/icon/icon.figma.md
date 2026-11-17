# icon → Figma mapping

> **Status: done (17.11.2026)** — Phases 1–8 built and confirmed by the user — rebuild of the Icon component in the DS Core Components
> file, tokens from the DS Foundation library. Decisions from earlier runs:
> `.claude/skills/ds-code-to-figma/rebuild-decisions.md` → "Icon".

```yaml
sets:
  - name: Icon # the wrapper set (size axis only) with the `icon` instance swap
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    figmaMasterNodeId: '6185:252'
glyphLibraryNodeId: '6161:234' # "Icon glyphs" frame, 79 single COMPONENTs IconAlert … IconYoutube
figmaPage: Core / Media
figmaDocFrameNodeId: '6160:425'
variations: [] # no show boolean — placeholder deleted
namesSectionNodeId: '6189:316' # "🖼️ Icon names": 79 `size=md` instances, kebab `name` value underneath

anatomy:
  - letter: A
    part: inner
    description: 'The SVG icon element wrapper.'
# JSDoc fixed 17.11.2026 (user decision): it said `@part icon`, render() sets part="inner".

props:
  - name: name # the glyph — open-ended content (79 icons): asset component, not a variant
    type: string
    figmaProperty: icon
    figmaPropertyType: instance swap # over the glyph library (79 components from packages/assets/src/icons/svg), default `check`
    note: 'Asset component (PHASE-3-BUILD.md → "Special case — asset components"): glyph library + wrapper set, plus the "🖼️ Icon names" section.'
  - name: size
    type: enum
    options: [sm, md, lg, xl]
    default: '(unset → Component/Icon/Size/Base)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, md, lg, xl] # implicit default named `base`, then smallest → largest
  - name: color
    type: enum
    options: [primary, info, grey, success, danger, warning]
    figmaPropertyType: excluded
    note: 'No color axis (user decision 17.11.2026, Gery''s note "Set color with variables"): the glyph''s vector fill is bound to Component/Icon/Color/Primary and designers or parent components set another color variable on it. Replaces the earlier 8-option color axis (rebuild-decisions.md).'
  - name: inverted
    type: boolean
    figmaPropertyType: excluded
    note: 'A color — set via the Component/Icon/Color/Inverted variable, like color.'
  - name: disabled
    type: boolean
    figmaPropertyType: excluded
    note: 'A color — set via the Component/Icon/Color/Disabled variable, like color.'
  - name: invalid
    type: boolean
    figmaPropertyType: excluded
    note: 'Same look as color=danger, no own token (rebuild-decisions.md).'
  - name: inline
    type: boolean
    figmaPropertyType: excluded
    note: 'No static visual effect in an isolated swatch.'
  - name: turn
    type: boolean
    figmaPropertyType: excluded
    note: 'User decision 17.11.2026. Instance override: rotate the glyph 225° (plus) or 180° (caret-up / caret-down); no effect on other icons.'
  - name: shadow
    type: boolean
    figmaPropertyType: excluded
    note: 'User decision 17.11.2026. Literal drop-shadow in icon.host.scss with no token ("ds-token-check: intentional").'
  - name: svg
    type: string
    figmaPropertyType: excluded
    note: 'Alternative content source (raw SVG) — the glyph library covers named icons.'
  - name: src
    type: string
    figmaPropertyType: excluded
    note: 'Alternative content source (SVG URL).'

states: [] # no pseudo-classes in icon.host.scss
componentStates: {} # disabled / invalid are colors here, excluded above

nested: [] # none — the glyphs are this component's own content library

tokens:
  - { cssVar: --ds-icon-size-base, figmaVariable: 🧩 Component/Icon/Size/Base, resolved: true } # 16
  - { cssVar: --ds-icon-size-sm, figmaVariable: 🧩 Component/Icon/Size/SM, resolved: true } # 14
  - { cssVar: --ds-icon-size-md, figmaVariable: 🧩 Component/Icon/Size/MD, resolved: true } # 24
  - { cssVar: --ds-icon-size-lg, figmaVariable: 🧩 Component/Icon/Size/LG, resolved: true } # 32
  - { cssVar: --ds-icon-size-xl, figmaVariable: 🧩 Component/Icon/Size/XL, resolved: true } # 40
  - { cssVar: --ds-icon-padding-base, figmaVariable: 🧩 Component/Icon/Padding/Base, resolved: true } # 1
  - { cssVar: --ds-icon-padding-sm, figmaVariable: 🧩 Component/Icon/Padding/SM, resolved: true } # 0.875
  - { cssVar: --ds-icon-padding-md, figmaVariable: 🧩 Component/Icon/Padding/MD, resolved: true } # 1.5
  - { cssVar: --ds-icon-padding-lg, figmaVariable: 🧩 Component/Icon/Padding/LG, resolved: true } # 2
  - { cssVar: --ds-icon-padding-xl, figmaVariable: 🧩 Component/Icon/Padding/XL, resolved: true } # 2.5
  - { cssVar: --ds-icon-color-primary, figmaVariable: 🧩 Component/Icon/Color/Primary, resolved: true } # #000d6e — default glyph fill
  # Not bound in the set (no color axis), available to designers as overrides:
  - { cssVar: --ds-icon-color-info, figmaVariable: 🧩 Component/Icon/Color/Info, resolved: true }
  - { cssVar: --ds-icon-color-success, figmaVariable: 🧩 Component/Icon/Color/Success, resolved: true }
  - { cssVar: --ds-icon-color-danger, figmaVariable: 🧩 Component/Icon/Color/Danger, resolved: true }
  - { cssVar: --ds-icon-color-warning, figmaVariable: 🧩 Component/Icon/Color/Warning, resolved: true }
  - { cssVar: --ds-icon-color-grey, figmaVariable: 🧩 Component/Icon/Color/Grey, resolved: true }
  - { cssVar: --ds-icon-color-inverted, figmaVariable: 🧩 Component/Icon/Color/Inverted, resolved: true }
  - { cssVar: --ds-icon-color-disabled, figmaVariable: 🧩 Component/Icon/Color/Disabled, resolved: true }
# All 18 checked in the Foundation file (17.11.2026). No breakpoint mixins → no device: section.

completeness: # every node the build needs, every attribute → token
  - node: wrapper (component root) # host box
    width / height: Component/Icon/Size/<size>
  - node: glyph instance (nested directly, inside the wrapper)
    padding: Component/Icon/Padding/<size> # code pads #inner; the glyph sits inside it
    vector fill: Component/Icon/Color/Primary
# No text nodes. No gaps.

measurements: # confirmed by the user 17.11.2026, measured on the dev server
  drawnOption: base
  options: [base, sm, md, lg, xl]
  # behavior: none — the box stays 16px in a 600px container (size never changes)
  rows:
    - property: Size (w = h)
      kind: size
      group: fixed
      show: drawn
      instance: main
      source: icon.host.scss:43
      values:
        base: { px: 16, token: 🧩 Component/Icon/Size/Base }
        sm: { px: 14, token: 🧩 Component/Icon/Size/SM }
        md: { px: 24, token: 🧩 Component/Icon/Size/MD }
        lg: { px: 32, token: 🧩 Component/Icon/Size/LG }
        xl: { px: 40, token: 🧩 Component/Icon/Size/XL }
    - property: Padding
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: icon.host.scss:53
      values:
        base: { px: 1, token: 🧩 Component/Icon/Padding/Base }
        sm: { px: 0.875, token: 🧩 Component/Icon/Padding/SM }
        md: { px: 1.5, token: 🧩 Component/Icon/Padding/MD }
        lg: { px: 2, token: 🧩 Component/Icon/Padding/LG }
        xl: { px: 2.5, token: 🧩 Component/Icon/Padding/XL }
    - property: Glyph size
      kind: size
      group: derived
      show: skip
      reason: 'size − 2 × padding (14 / 12.25 / 21 / 28 / 35)'
      values:
        base: { px: 14 }
```

## Notes

- **Glyph library:** the 79 SVGs in `packages/assets/src/icons/svg` become one component each,
  built per `conventions/content-selection-and-mitigations.md` (component › `box` › `Vector`,
  unbound navy; `information`, `triangle` and `whats-app` flattened to one `Vector`). They live in
  the Core Components file for now; the DS Assets file is planned to take them later.
- **"🖼️ Icon names" section** (rebuild-decisions.md): a 9 × 9 grid of all 79 icons at
  `size=md`, each an instance of the wrapper's default variant with its `icon` swap set to the
  glyph, the name underneath. Inserted after Measurements with `Title` `kind=names`.
- **No Variations section:** no `show` boolean defaulting to `false`.
- **Measurements drawing:** padding is 1px on every side, so the 4 padding pills (row 2) sit
  bottom-left (`end`), bottom-right (`start`), right (top padding) and left (bottom padding —
  moved off the right side, where it would collide with the top padding pill). Width only on top
  (w = h, one row). No Behavior card.
- **Orphaned token:** `Component/Icon/Color/InvertedDisabled` exists in Foundation but no code uses it.

## Phase 2 — proposed grouping (17.11.2026)

**Asset component** (open-ended `name` prop): a glyph library plus one wrapper set
(`conventions/content-selection-and-mitigations.md`).

### Glyph library

- **79 single `COMPONENT`s**, one per SVG in `packages/assets/src/icons/svg`, named flat
  PascalCase after the file: `IconCheck`, `IconCaretLeft`, `IconAlertTriangle`, … `IconXing`.
- Structure per component: auto-layout component › `box` › `Vector` (one fill-bearing node;
  multi-path SVGs flattened — `information`, `triangle`, `whats-app`, `xing` if needed). Fill
  unbound navy `#000D6E`, as in the SVGs; the wrapper binds the color.
- Parked in a frame **"Icon glyphs"** on the `Core / Media` page, next to the documentation frame
  (not part of the documented sets). Not counted toward the 500.

### Wrapper set `Icon`

| Prop / state                                        | Mapping                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                                              | `INSTANCE_SWAP` property `icon`, default `IconCheck`, preferred = all 79 glyphs                                                              |
| `size`                                              | variant `size`: `base · sm · md · lg · xl`                                                                                                   |
| `color`, `inverted`, `disabled`                     | not a variant — the glyph's vector fill is bound to `Component/Icon/Color/Primary`; designers / parents bind another `Icon/Color/*` variable |
| `invalid`, `inline`, `turn`, `shadow`, `svg`, `src` | excluded                                                                                                                                     |

Each variant: the component frame `width` / `height` bound to `Icon/Size/<size>`, padding bound to
`Icon/Padding/<size>`, the glyph instance filling the inner box, bound to the `icon` swap.

**One axis, no `state`:** `size` on the columns, one row.

```
       base    sm      md      lg      xl
       [cell]  [cell]  [cell]  [cell]  [cell]
```

**Variant count:** 5 (≤ 500). No top-level split, no text properties, no generated text, no
Variations.

### Documentation

- Copy me: one `Icon` default instance (`base`, `IconCheck`).
- Anatomy: A · inner.
- Measurements: Size, Padding (drawn on `base`); glyph size skipped.
- "🖼️ Icon names": 9 × 9 grid of all 79 glyphs at `size=md`, name underneath.

### Deviation from the conventions (user decision)

The skill's rule keeps a small token-swap axis like `color` as a variant and offers a
variable override only above 500 variants. Here the user chose the variable override for Icon on
purpose (Gery: "Set color with variables"). Worth adding to the conventions if it should apply to
other components (Brand Icon has the same note).
