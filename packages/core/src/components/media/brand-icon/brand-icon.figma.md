# brand-icon → Figma mapping

> **Status: Phases 1–8 built (23.11.2026)** — Phase 8 awaiting user confirmation. Core Components file, page `Core / Media`. Phase 4: 2 accepted deviations (brand-icon.figma-validation.md).
> Scope decision (user, 23.11.2026): glyph library starts with **4 of ~416** brand icons
> (`car`, `rocket`, `garage`, `light-bulb`); the rest (and Icon's) are planned for a separate assets file.
> **Tile is out of scope for now** (user, 23.11.2026): tile sizes need the `Device` routing variables
> `🧩 Component/BrandIcon/Tile/Size/{Base,SM,LG}/Device`, missing in Foundation (hard stop, 23.11.2026).
> Add them via the token sync, then extend this file with `tile` + `device:`.

```yaml
sets:
  - name: BrandIcon
    figmaComponentKey: 8bcd39edd2f3b7d17f96b98e62793b7827660bd0
    figmaMasterNodeId: '6628:1214'
figmaPage: Core / Media
figmaDocFrameNodeId: '6627:1126'
glyphLibraryNodeId: '6627:685' # BrandIconCar 6627:694, Rocket 6627:705, Garage 6627:717, LightBulb 6627:729; 4 single COMPONENTs, built from packages/assets/src/brand-icons/svg/<name>-purple.svg
variations: [] # no show boolean

anatomy:
  - letter: A
    part: inner
    description: 'The SVG icon element wrapper.'
# @part inner matches part="inner" in render(). JSDoc summary still says "Icon displays…" (copy drift, not fixed here).

props:
  - name: svg / src # the glyph — open-ended content (~416 icons): asset component, not a variant
    type: string
    figmaProperty: icon
    figmaPropertyType: instance swap # over the glyph library, default `car`
    note: 'Asset component, same architecture as Icon (icon.figma.md).'
  - name: size
    type: enum
    options: [sm, lg]
    default: '(unset → Component/BrandIcon/Size/Base)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, lg]
  - name: color
    type: enum
    options: [purple, red, yellow, green]
    default: '(unset → purple level tokens)'
    figmaProperty: color
    figmaPropertyType: variant # user decision 23.11.2026: color variant axis, not variable override
    figmaOptions: [purple, red, green, yellow] # purple = code default
  - name: disabled
    type: boolean
    figmaProperty: disabled
    figmaPropertyType: variant # options false / true; true only with color=purple (blocked: it overrides color, no interaction states)
    figmaOptions: ['false', 'true']
    interactive: false
    source: 'brand-icon.host.scss:171 — no hover/active styles exist, color tokens only'
  - name: invalid
    type: boolean
    figmaProperty: invalid
    figmaPropertyType: variant # options false / true; true only with color=purple
    figmaOptions: ['false', 'true']
    interactive: false
    source: 'brand-icon.host.scss:179 — color tokens only'
  - name: tile
    type: boolean
    figmaPropertyType: excluded
    note: 'DEFERRED (user 23.11.2026): tile sizes are responsive and the Device routing variables are missing in Foundation.'

states: [] # no pseudo-classes
componentStates:
  disabled:
    {
      figmaProperty: disabled,
      options: ['false', 'true'],
      interactive: false,
      source: 'overrides color tokens only (brand-icon.host.scss:171)',
    }
  invalid:
    {
      figmaProperty: invalid,
      options: ['false', 'true'],
      interactive: false,
      source: 'overrides color tokens only (brand-icon.host.scss:179)',
    }
nested: [] # none — glyphs are this component's own content library

tokens:
  - { cssVar: --ds-brand-icon-size-base, figmaVariable: 🧩 Component/BrandIcon/Size/Base, resolved: true } # 80
  - { cssVar: --ds-brand-icon-size-sm, figmaVariable: 🧩 Component/BrandIcon/Size/SM, resolved: true } # 40
  - { cssVar: --ds-brand-icon-size-lg, figmaVariable: 🧩 Component/BrandIcon/Size/LG, resolved: true } # 176
  # Per color C in Purple, Red, Green, Yellow, Disabled, Invalid — all 18 exist in Foundation (23.11.2026):
  #   Component/BrandIcon/Color/<C>/Level1  (#000d6e navy fill, → Alias/Surface/Primary; Disabled/Invalid: Alias/Text/Color/{Disabled,Danger})
  #   Component/BrandIcon/Color/<C>/Level2  (mid fill: #6c2273 / #d9304c / #1b5951 / #fa9319)
  #   Component/BrandIcon/Color/<C>/Level3  (light fill: #b8b2ff / #ffaca6 / #94e3d4 / #fae052)
  # Tile (deferred, exist except Device): Tile/Radius, Tile/Size/{Base,SM,LG}/{Mobile,Tablet,Desktop}, Color/<C>/Background

completeness:
  - node: wrapper (component root)
    width / height: Component/BrandIcon/Size/<size>
  - node: glyph instance (fills the wrapper)
    vector fills: level 1 / 2 / 3 → Component/BrandIcon/Color/<color>/Level1 | Level2 | Level3
# No text nodes, no padding, no gap, no radius (tile deferred). Level mapping in code: SCSS recolors by source hex (#000d6e → L1;
# #fa9319 #d9304c #1b5951 #6c2273 → L2; #fae052 #ffaca6 #b8b2ff #94e3d4 → L3). Fills outside that list stay unrecolored.

measurements: # measured on the dev server 23.11.2026, confirmed by the user
  drawnOption: base
  options: [base, sm, lg]
  rows:
    - property: Size (w = h)
      kind: size
      group: fixed
      show: drawn
      instance: main
      source: brand-icon.host.scss:39
      values:
        base: { px: 80, token: 🧩 Component/BrandIcon/Size/Base }
        sm: { px: 40, token: 🧩 Component/BrandIcon/Size/SM }
        lg: { px: 176, token: 🧩 Component/BrandIcon/Size/LG }
    - property: Glyph size
      kind: size
      group: derived
      show: skip
      reason: 'inner = host box (no padding); same number as Size'
```

## Notes

- Measured: host, `inner` and `svg` are identical boxes (40 / 80 / 176), no padding, margin, min or max. Measured = token.
- No Behavior card (size never changes with content). Padding and limits: none declared.
- Code drift (follow-up, not fixed): JSDoc summary says "Icon" and an `@part inner` is the only part.

## Phase 2 — proposed grouping (23.11.2026)

**Asset component** (open-ended icon content): glyph library + one wrapper set, same as Icon.

### Glyph library

- 4 single `COMPONENT`s: `BrandIconCar`, `BrandIconRocket`, `BrandIconGarage`, `BrandIconLightBulb` (from `*-purple.svg`, 40 × 40 viewBox).
- Structure: component › `box` › vectors; fills kept as 3 levels (navy `#000d6e` L1, mid L2, light L3), bound by the wrapper per variant. Frame "BrandIcon glyphs" on `Core / Media`, next to the Icon glyphs. Not counted toward the 500.
- Risk: multi-path glyphs need 3 fill groups that each take one level variable; Phase 3 checks that every vector's hex falls in the list above (SCSS recolors only those).

### Wrapper set `BrandIcon`

| Prop / state  | Mapping                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `svg` / `src` | `INSTANCE_SWAP` property `icon`, default `BrandIconCar`, preferred = the 4 glyphs                                |
| `size`        | variant `size`: `base · sm · lg`                                                                                 |
| `color`       | variant `color`: `purple · red · green · yellow` — fills bound to `Color/<color>/Level1–3`                       |
| `disabled`    | variant `disabled` (`false`/`true`), blocked: `true` only with `color=purple`; fills → `Color/Disabled/Level1–3` |
| `invalid`     | variant `invalid` (`false`/`true`), blocked: `true` only with `color=purple`; fills → `Color/Invalid/Level1–3`   |
| `tile`        | excluded for now (needs Device routing variables)                                                                |

Each variant: frame width / height bound to `BrandIcon/Size/<size>`, glyph instance filling it.
`disabled` and `invalid` both `true` is not built (not an approved combination).

```
                      base    sm      lg
color=purple          [cell]  [cell]  [cell]
color=red             [cell]  [cell]  [cell]
color=green           [cell]  [cell]  [cell]
color=yellow          [cell]  [cell]  [cell]
disabled=true         [cell]  [cell]  [cell]
invalid=true          [cell]  [cell]  [cell]
```

No `state` axis, so `size` is on the columns. Rows are the sparse color/state combinations (no nested matrix).

**Variant count:** 3 sizes × (4 colors + 1 disabled + 1 invalid) = **18** (≤ 500). No top-level split, no text properties, no Variations, no `show` booleans.

### Documentation

- Copy me: one default instance (`base`, `purple`, `BrandIconCar`).
- Anatomy: A · inner.
- Measurements: Size (w = h), drawn on `base`; Glyph size skipped. No Behavior card.
- No "names" section proposed for 4 glyphs (add when the library grows).

## Phase 3 — build notes (23.11.2026)

- Set `BrandIcon`: 18 variants, 3 × 6 fixed grid (cell 208 = 176 + 32), props `icon` (swap, default `BrandIconCar`, preferred = 4 glyphs), `size`, `color`, `disabled`, `invalid`. Variant option order verified: size base·sm·lg, color purple·red·green·yellow.
- Glyph structure: component › `box` › `level 1/2/3` (one flattened vector per level, z-order level 3 → 1 bottom to top, same as the SVGs). Scale constraints so the instance resizes with the variant. Level fills are bound per variant to `BrandIcon/Color/<color>/Level1–3` (Disabled, Invalid for those variants).
- Variations: no `show` boolean → placeholder deleted. Stack `sub-label` removed (single set).
- Known (code): `garage-*.svg` use uppercase hex fills (`#000D6E`, `#6C2273`, `#B8B2FF`); the SCSS selectors are lowercase attribute matches, so the browser may not recolor them. Mapped to the levels in Figma regardless. Not verified on the dev server.
- Documentation frame header `lead` is the JSDoc lead verbatim ("Icon displays…"); the JSDoc says "Icon", not "Brand Icon".
