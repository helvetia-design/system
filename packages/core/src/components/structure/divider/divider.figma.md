# divider → Figma mapping

```yaml
sets: # filled in by Phase 3
  - name: Divider
    figmaComponentKey: null
    figmaMasterNodeId: null
figmaPage: Core / Structure
figmaDocFrameNodeId: null

anatomy:
  - letter: A
    part: divider
    description: 'The divider line element.'
    note: 'No part="divider" in render() — the host itself is the line. Mismatch accepted by the user (18.11.2026), see TODO.md.'

props:
  - name: layout
    type: enum
    options: [horizontal, vertical]
    default: horizontal
    figmaProperty: layout
    figmaPropertyType: variant # proposed in Phase 2
    figmaOptions: [horizontal, vertical]
  - name: space
    type: enum
    options: [none, 2xs, xs, sm, base, md, lg, xl, 2xl, 3xl]
    default: none
    figmaProperty: space
    figmaPropertyType: variant # proposed in Phase 2 (margin → padding on the component frame)
    figmaOptions: [none, 2xs, xs, sm, base, md, lg, xl, 2xl, 3xl]
  - name: color
    type: enum
    options: [primary, secondary, default, inverted]
    default: default
    figmaProperty: color
    figmaPropertyType: variant # proposed in Phase 2 (inverted: top-level split question)
    figmaOptions: [default, primary, secondary, inverted]
  - name: dashed
    type: boolean
    default: false
    figmaProperty: dashed
    figmaPropertyType: variant
    figmaOptions: [false, true]

# No text props: render() returns an empty <Host>, no slot, no generated text.
# No `states:` section — divider.style.scss has no :hover/:focus/:active/:disabled selectors.
# No `nested:` section — no <ds-*> children.
# No `variations:` section — no render-guarded parts, no `show <name>` booleans.
# No `device:` section — no breakpoint mixins in the SCSS. The space tokens are responsive through
# their alias target (Device/Space/*, sync-managed routing variables), not through a mixin.

tokens:
  - cssVar: --ds-divider-size
    figmaVariable: 🧩 Component/Divider/Size
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-radius
    figmaVariable: 🧩 Component/Divider/Radius
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-color-default
    figmaVariable: 🧩 Component/Divider/Color/Default
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-color-primary
    figmaVariable: 🧩 Component/Divider/Color/Primary
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-color-secondary
    figmaVariable: 🧩 Component/Divider/Color/Secondary
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-color-inverted
    figmaVariable: 🧩 Component/Divider/Color/Inverted
    foundation: ✓ # checked 18.11.2026
    resolved: true
  # Space: each Component/Divider/Space/<X> aliases 📱 Device/↔️ Space/<X>/Device in every brand mode
  # (checked in Foundation 18.11.2026) → responsive without a device: section.
  - cssVar: --ds-divider-space-none
    figmaVariable: 🧩 Component/Divider/Space/None
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-2xs
    figmaVariable: 🧩 Component/Divider/Space/2XS
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-xs
    figmaVariable: 🧩 Component/Divider/Space/XS
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-sm
    figmaVariable: 🧩 Component/Divider/Space/SM
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-base
    figmaVariable: 🧩 Component/Divider/Space/Base
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-md
    figmaVariable: 🧩 Component/Divider/Space/MD
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-lg
    figmaVariable: 🧩 Component/Divider/Space/LG
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-xl
    figmaVariable: 🧩 Component/Divider/Space/XL
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-2xl
    figmaVariable: 🧩 Component/Divider/Space/2XL
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: --ds-divider-space-3xl
    figmaVariable: 🧩 Component/Divider/Space/3XL
    foundation: ✓ # checked 18.11.2026
    resolved: true
  - cssVar: null # $dash-length literal, divider.style.scss (dashed mixin)
    figmaVariable: null
    resolved: false
    resolution: 'Hardcoded dash pattern [8, 8] accepted by the user (18.11.2026) — code literal marked intentional, Figma dash patterns are not bindable. Listed in TODO.md → "Hardcoded values in Figma".'

completeness: # every node the build needs, every attribute → token
  line: # the divider shape (horizontal: full-width × Size; vertical: Size × full-height)
    fill: Divider/Color/<color> # solid, dashed=false
    dashedStroke: Divider/Color/<color> + dash pattern [8, 8] (hardcoded) # dashed=true
    thickness: Divider/Size
    radius: Divider/Radius
    length: fill (behavior) — no token
  frame: # carries the space margin
    padding (block axis when horizontal, inline axis when vertical): Divider/Space/<space>
  gaps: none

measurements:
  drawnOption: none # default space
  options: [] # no table axis for the main rows; the Space row lists its own options
  behavior:
    width: fill # horizontal: 600px wrapper → 600, 0px wrapper → 0
    height: fill # vertical: align-self: stretch
  rows:
    - property: Size (thickness)
      kind: size
      group: fixed
      show: drawn
      instance: main
      source: divider.style.scss (basic(), horizontalLayout(), verticalLayout() → var(--_divider-size))
      values:
        base: { px: 2, token: 🧩 Component/Divider/Size }
    - property: Dash
      kind: size
      group: fixed
      show: drawn
      instance: dashed # extra dashed=true instance (user's call)
      source: divider.style.scss ($dash-length, dashed mixin)
      values:
        base: { px: { dash: 8, gap: 8 }, token: null, note: 'hardcoded — see tokens: and TODO.md' }
    - property: Space (margin)
      kind: spacing
      group: context-dependent # outer margin by declaration, but it is the purpose of the public `space` prop
      show: drawn
      instance: space-base # extra space=base instance (user's call); table lists every option M / T / D
      source: divider.style.scss (horizontalLayout()/verticalLayout() margins → var(--_divider-margin))
      reason: 'outer margin default is skip; kept because `space` exists to set it — user chose table + drawn instance'
      values:
        none: { px: 0, token: 🧩 Component/Divider/Space/None }
        2xs: { px: { mobile: 4, tablet: 4, desktop: 4 }, token: 🧩 Component/Divider/Space/2XS }
        xs: { px: { mobile: 8, tablet: 8, desktop: 8 }, token: 🧩 Component/Divider/Space/XS }
        sm: { px: { mobile: 12, tablet: 12, desktop: 12 }, token: 🧩 Component/Divider/Space/SM }
        base: { px: { mobile: 16, tablet: 16, desktop: 16 }, token: 🧩 Component/Divider/Space/Base }
        md: { px: { mobile: 20, tablet: 20, desktop: 24 }, token: 🧩 Component/Divider/Space/MD }
        lg: { px: { mobile: 24, tablet: 24, desktop: 32 }, token: 🧩 Component/Divider/Space/LG }
        xl: { px: { mobile: 32, tablet: 40, desktop: 48 }, token: 🧩 Component/Divider/Space/XL }
        2xl: { px: { mobile: 48, tablet: 56, desktop: 64 }, token: 🧩 Component/Divider/Space/2XL }
        3xl: { px: { mobile: 56, tablet: 72, desktop: 96 }, token: 🧩 Component/Divider/Space/3XL }
    - property: Radius
      kind: shape
      group: fixed
      show: skip
      reason: 'pill — 9999px ≥ half of the 2px thickness; the shape says it'
      values:
        base: { px: 9999, token: 🧩 Component/Divider/Radius }
```

## Proposal (Phase 2) — signed off 18.11.2026 (Foundation name check still pending)

| Prop     | Figma            | Options (default first)                                | Why                                                                                                                                                                                                                                                        |
| -------- | ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout` | variant `layout` | horizontal · vertical                                  | same layer, only width/height swap                                                                                                                                                                                                                         |
| `space`  | variant `space`  | none · 2xs · xs · sm · base · md · lg · xl · 2xl · 3xl | margin → padding on the component frame (top/bottom horizontal, left/right vertical), bound to `Divider/Space/<X>`                                                                                                                                         |
| `color`  | variant `color`  | default · primary · secondary · inverted               | fill token only; `inverted` is a color option, not a prop → no rule-2 split (precedent: Icon, Logo in `rebuild-decisions.md`)                                                                                                                              |
| `dashed` | variant `dashed` | false · true                                           | two layers, visibility fixed per variant (no boolean): `line` rectangle (fill `Divider/Color/<color>`, radius `Divider/Radius`) when `false`; `dash` line (stroke `Divider/Color/<color>`, weight `Divider/Size`, dash `[8, 8]`) when `true` (user's call) |

- No text properties, no generated text, no states, no slots, no variations.
- Line length: instances stretch (`Fill`); master placeholder length 320px (horizontal width) / 64px
  (vertical height) — no token, layout only (user's call).

Grid (no `state`/`size` axis → `space` on columns; rows nested by option count: `layout` (2) ›
`dashed` (2) › `color` (4)):

```
                               none  2xs  xs  sm  base  md  lg  xl  2xl  3xl
horizontal  false  default     [ ]   [ ]  …
                   primary     [ ]
                   secondary   [ ]
                   inverted    [ ]
            true   default     [ ]
                   …
vertical    false  default     [ ]
                   …
            true   …
```

Count: 2 × 2 × 4 × 10 = **160** ≤ 500.

## Notes

- Measured on the dev server (`divider.visual.html`, viewports 375 / 800 / 1440 for M / T / D).
  Every measured value matches its token.
- Colors (measured): default `#E8E8E8`, primary `#000D6E`, secondary `#B3B6D4`, inverted `#FFFFFF`.
  No border; default is visible on white → drawn in `default`.
- Dashed in code is a `repeating-linear-gradient` background (90deg horizontal, 180deg vertical),
  not a border.
- `space` is a margin on the host in code; Figma has no margin, so Phase 2 proposes how to model it.
- Code-side: JSDoc of `layout` says "Default is verticaly" — the default is `horizontal`. Follow-up,
  not fixed here.

## Unresolved

- Dash pattern `[8, 8]` hardcoded.
- `@part divider` has no matching `part=` attribute (accepted).
- **Paused 18.11.2026 in Phase 3**: only the default variant exists (6231:1063, page `Core / Structure`,
  frame 6231:427). `color=inverted` should become an `inverted` boolean in code first, see TODO.md.
