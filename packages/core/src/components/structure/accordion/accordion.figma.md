# accordion → Figma mapping

```yaml
sets: # filled in by Phase 3
  - name: Accordion
    figmaComponentKey: d13c3342aa7aa7f21d6d6f94b317d22abe5c020e
    figmaMasterNodeId: '6304:4823'
figmaPage: Core / Structure
figmaDocFrameNodeId: '6302:1291'

anatomy: # letters follow the drawing left → right (Phase 7, 19.11.2026)
  - letter: A
    part: header
    description: 'The header element that contains the summary and marker.'
  - letter: B
    part: summary
    description: 'The summary element that serves as the toggle button.'
  - letter: C
    part: content
    description: 'The content element that contains the collapsible content of the accordion.'
  - letter: D
    part: marker
    description: 'The marker element that indicates the open/close state of the accordion.'
anatomySectionNodeId: '6302:1297' # diagram: open=true default variant, 480 wide
# `@part accordion` ("The accordion container element.") has no part= in render() — the host is the
# container. Mismatch accepted, part left out of the anatomy (user's call 19.11.2026, TODO.md).

props:
  - name: open
    type: boolean
    default: false
    figmaProperty: open
    figmaPropertyType: variant # marker glyph / rotation + content shown
    figmaOptions: [false, true]
  - name: summaryVisualLevel
    type: enum
    options: [h1, h2, h3, h4, h5]
    default: '(unset → Summary/Typo)'
    figmaProperty: summary visual level
    figmaPropertyType: variant
    figmaOptions: [base, h1, h2, h3, h4, h5] # base = unset (user's call 19.11.2026, renamed from `typography`)
  - name: summaryTitle
    type: boolean
    figmaPropertyType: excluded
    note: 'Same look as summary visual level=h5 — TitleTypo aliases Heading Level 5 (measured 16 / 20.8 / 700). The `title` option was removed (user decision 19.11.2026).'
  - name: marker
    type: enum
    options: [plus, plus-minus, none]
    default: '(unset → caret-down)'
    figmaProperty: marker
    figmaPropertyType: variant
    figmaOptions: [base, plus, plus-minus, none]
  - name: markerPosition
    type: enum
    options: [left, right]
    default: '(unset → right)'
    figmaProperty: marker position
    figmaPropertyType: variant
    figmaOptions: [right, left]
  - name: summary # text-only slot → text property (user's call 19.11.2026)
    type: slot
    figmaProperty: summary
    figmaPropertyType: text
    node: label
    default: Summary
  - name: group
    figmaPropertyType: excluded # no visual effect
  - name: summaryLevel
    figmaPropertyType: excluded # semantic heading tag only (<h1>…<h5> id=header); measured: no margin, typography from #summary → no visual effect
  - name: button, buttonWide, buttonColor, buttonSize, buttonLabelOpen, buttonLabelClose, buttonIconOpen, buttonIconClose
    figmaPropertyType: excluded # button mode out of scope until Button is in Figma (user's call 19.11.2026, TODO.md)

states:
  figmaProperty: state
  options: [default, hover, focus, active]
  sources:
    hover: ':hover / .is-hovered (accordion.host.scss, #summary)'
    focus: ':focus-visible / .is-focused (accordion.host.scss, #summary:before)'
    active: ':active / .is-pressed (accordion.host.scss, #summary)'
componentStates: {} # none

nested:
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    fixedIcon: # name derived from marker + open, never consumer-set → no INSTANCE_SWAP
      glyph: 'base: caret-down (open: rotated 180°) · plus: plus (open: rotated 45°) · plus-minus: plus / minus · none: hidden'
      size: base (16) inside the 24 × 16 marker frame (Marker/Width × Marker/Size)
      colorSource:
        default: 'Component/Icon/Color/Primary (icon default, accordion sets no --icon-color)'
        hover: 'Component/Accordion/Summary/Color/Hover (--icon-color)'
        active: 'Component/Accordion/Summary/Color/Active (--icon-color)'

slots:
  - codeSlot: content # plus the default slot, same #inner
    figmaSlot: content
    part: content
    position: only child
    content: open # any content
    preferred: []
    defaultFill: 'text node "Lorem ipsum dolor sit amet, consectetur adipisicing elit." — Text/Typo/Paragraph, Alias/Text/Color/Primary (user decision 19.11.2026; Text instance later, TODO.md)'
    shownWhen: open=true # code: hidden={!open}; no show boolean, the open axis decides (user's call 19.11.2026)
    figmaPropertyKey: 'content#6304:393'

variations: [] # no show booleans — placeholder deleted
# summary text property key: summary#6304:0

tokens: # all checked in Foundation 19.11.2026
  - { cssVar: --ds-accordion-header-min-height, figmaVariable: 🧩 Component/Accordion/Header/MinHeight, resolved: true } # 40
  - { cssVar: --ds-accordion-marker-size, figmaVariable: 🧩 Component/Accordion/Marker/Size, resolved: true } # 16
  - { cssVar: --ds-accordion-marker-width, figmaVariable: 🧩 Component/Accordion/Marker/Width, resolved: true } # 24
  - { cssVar: --ds-accordion-summary-gap, figmaVariable: 🧩 Component/Accordion/Summary/Gap, resolved: true } # 8
  - { cssVar: --ds-accordion-summary-color-base, figmaVariable: 🧩 Component/Accordion/Summary/Color/Base, resolved: true }
  - { cssVar: --ds-accordion-summary-color-hover, figmaVariable: 🧩 Component/Accordion/Summary/Color/Hover, resolved: true }
  - { cssVar: --ds-accordion-summary-color-active, figmaVariable: 🧩 Component/Accordion/Summary/Color/Active, resolved: true }
  - { cssVar: --ds-accordion-radius, figmaVariable: 🧩 Component/Accordion/Radius, resolved: true } # 4, focus ring
  - { cssVar: --ds-icon-padding-base, figmaVariable: 🧩 Component/Icon/Padding/Base, resolved: true } # 1, marker padding (ds-icon default size)
  - { cssVar: --ds-icon-color-primary, figmaVariable: 🧩 Component/Icon/Color/Primary, resolved: true } # marker glyph, state default/focus
  - { cssVar: --ds-alias-interaction-focus-color-base, figmaVariable: 🔗 Alias/✨ Interaction/Focus/Color/Base, resolved: true } # outer ring
  - { cssVar: --ds-alias-interaction-focus-color-border, figmaVariable: 🔗 Alias/✨ Interaction/Focus/Color/Border, resolved: true } # inner ring
  - cssVar: null # vars.focus-styles: literal 2px / 5px box-shadow spreads
    figmaVariable: [🔗 Alias/✨ Interaction/Focus/Size/Inner, 🔗 Alias/✨ Interaction/Focus/Size/Outer] # 2 / 5
    resolved: true
    note: 'Code uses literals; matching tokens exist → bound (user decision A, 19.11.2026). Code drift, follow-up.'
  # Typography — per option of `summary visual level`, <T> = Typo (base) | Level/<N> (hN); TitleTypo unused (no option):
  #   🧩 Component/Accordion/Summary/<T>/FontSize      → bound (Device routing: base/h5 16, h4 18, h3 20/24/24, h2 24/32/32, h1 28/40/40)
  #   🧩 Component/Accordion/Summary/<T>/FontWeight    → bound (base 400, hN 700)
  #   🧩 Component/Accordion/Summary/<T>/FontFamily    → bind: false, literal `Baloise Create Text` (base) / `Baloise Create Headline` (hN) — CSS name in the variable (TODO.md)
  #   🧩 Component/Accordion/Summary/<T>/LineHeight    → bind: false, STRING — literal 1.5 (base) / 1.3 (hN)
  #   🧩 Component/Accordion/Summary/<T>/LetterSpacing → bind: false, STRING "0%" — literal
  #   🧩 Component/Accordion/Summary/<T>/TextDecoration, /TextTransform → none, nothing to apply
  # Content slot default fill (Figma only, consumer content in code — user decision 19.11.2026):
  - { cssVar: --ds-text-typo-paragraph-font-size, figmaVariable: 🧩 Component/Text/Typo/Paragraph/FontSize, resolved: true } # bound
  - { cssVar: --ds-text-typo-paragraph-font-weight, figmaVariable: 🧩 Component/Text/Typo/Paragraph/FontWeight, resolved: true } # bound (fontStyle)
  - { cssVar: null, figmaVariable: 🔗 Alias/🔤 Text/Color/Primary, resolved: true } # inherited-context color
  # family `Baloise Create Text`, line height 150%, letter spacing 0 as literals (same exceptions as the summary)
# No breakpoint mixins → no device: section (font sizes are responsive through the Device alias).

completeness:
  - node: root (host) # vertical auto-layout: header, content
    width: fill (behavior)
  - node: header (A)
    min-height: Accordion/Header/MinHeight · align center
  - node: summary (B) # horizontal auto-layout, space-between (marker right) / start (marker left)
    gap: Accordion/Summary/Gap
    color: Accordion/Summary/Color/Base | Hover | Active (per state)
  - node: label (text, summary)
    typography: see tokens
    color: as summary
  - node: marker (C) # 24 × 16 frame, Icon instance base centered
    width / height: Accordion/Marker/Width / Size
    glyph fill: see nested.colorSource
  - node: focus ring (state=focus, on summary)
    inner stroke: Focus/Color/Border, weight Focus/Size/Inner
    outer stroke: Focus/Color/Base, weight Focus/Size/Outer
    radius: Accordion/Radius
  - node: content (D) # open=true only
    slot: content
# No gaps.

measurementsSectionNodeId: '6302:1298' # Phase 8, numbers 1–6 in rows order (size → spacing → shape → type)
measurements: # confirmed by the user 19.11.2026, measured on the dev server (1440 / 800 / 375)
  drawnOption: base
  options: [] # no table axis
  behavior:
    width: fill # 600px wrapper → 600; 0px wrapper → 0
    overflow: wrap # long summary in 160px wraps (72px tall), marker stays
  rows:
    - property: Min height
      kind: size
      group: limit
      show: drawn
      instance: main
      source: accordion.host.scss (#header min-height)
      reason: 'binds: summary line 24 < 40'
      values: { base: { px: 40, token: 🧩 Component/Accordion/Header/MinHeight } }
    - property: Marker (W × H)
      kind: size
      group: fixed
      show: drawn
      instance: main
      source: accordion.host.scss (:host(:not(.is-button)) #marker)
      values: { base: { px: '24 × 16', token: '🧩 Component/Accordion/Marker/Width × /Size' } }
    - property: Gap
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: accordion.host.scss (#summary gap)
      values: { base: { px: 8, token: 🧩 Component/Accordion/Summary/Gap } }
    - property: Focus ring
      kind: shape
      group: fixed
      show: drawn
      instance: focus
      source: vars.scss focus-styles (literals)
      values: { base: { px: '2 / 5', token: '🔗 Alias/✨ Interaction/Focus/Size/Inner / Outer' } }
    - property: Radius
      kind: shape
      group: fixed
      show: drawn
      instance: focus
      source: accordion.host.scss (#summary:before border-radius)
      values: { base: { px: 4, token: 🧩 Component/Accordion/Radius } }
    - property: Text (summary)
      kind: type
      group: typography
      show: drawn
      instance: main
      source: accordion.host.scss (typo.local / typo.mod)
      values: # M / T / D; hN unmeasured (no visual case) → from tokens
        base: { px: '16 / 24 · 400', token: 🧩 Component/Accordion/Summary/Typo }
                h1: { px: { mobile: 28, tablet: 40, desktop: 40 }, token: 🧩 Component/Accordion/Summary/Level/1, note: unmeasured }
        h2: { px: { mobile: 24, tablet: 32, desktop: 32 }, token: 🧩 Component/Accordion/Summary/Level/2, note: unmeasured }
        h3: { px: { mobile: 20, tablet: 24, desktop: 24 }, token: 🧩 Component/Accordion/Summary/Level/3, note: unmeasured }
        h4: { px: 18, token: 🧩 Component/Accordion/Summary/Level/4, note: unmeasured }
        h5: { px: 16, token: 🧩 Component/Accordion/Summary/Level/5, note: unmeasured }
    - property: Height (host, content)
      kind: size
      group: derived
      show: skip
      reason: 'host = header min-height; content height comes from the slot'
```

## Proposal (Phase 2) — signed off 19.11.2026

| Prop / state                        | Figma                          | Options (default first)          | Why                                                                                                                       |
| ----------------------------------- | ------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `open`                              | variant `open`                 | false · true                     | same layers; marker glyph/rotation changes, `content` slot shown only when `true`                                         |
| `summaryVisualLevel`                | variant `summary visual level` | base · h1 · h2 · h3 · h4 · h5    | same text node, only the typography tokens differ; `summaryTitle` = the `h5` look, no own option (user's call 19.11.2026) |
| `marker`                            | variant `marker`               | base · plus · plus-minus · none  | same marker frame, glyph swapped per variant (fixed icon, no instance swap); `none` hides it                              |
| `markerPosition`                    | variant `marker position`      | right · left                     | marker order in the summary row                                                                                           |
| `:hover` `:focus-visible` `:active` | variant `state`                | default · hover · focus · active | interaction states; focus = two ring frames on the summary                                                                |
| `summary` slot                      | text `summary`                 | "Summary"                        | text-only use                                                                                                             |
| `content` slot                      | `SLOT` `content`               | empty                            | open slot, no `show` boolean — `open` decides visibility                                                                  |

- Excluded: `group`, `summaryLevel` (no visual effect); button mode (TODO.md).
- No variations (no `show` booleans), no top-level split.

Grid (`state` on columns; rows nested by option count: `open` (2) › `marker position` (2) ›
`marker` (4) › `summary visual level` (6)):

```
                                    default  hover  focus  active
false  right  base        base      [ ]      [ ]    [ ]    [ ]
                          h1 … h5   [ ]
              plus        base …    [ ]
              plus-minus  base …    [ ]
              none        base …    [ ]
       left   base        base …    [ ]
              plus        …
              plus-minus  …
              (none — not built, same as right)
true   right  …
       left   …
```

Count: `marker=none` exists only with `marker position=right` (no visual difference) →
2 × (3 × 2 + 1) × 6 × 4 = **336** ≤ 500 (was 392 with `title`, removed 19.11.2026).

## Notes

- Measured on the dev server (`accordion.visual.html`). Every measured value matches its token.
- `plus-minus` closed looks like `plus` closed; kept, since open differs.
- Code-side: `vars.focus-styles` uses literal 2px / 5px although `Focus/Size/Inner` / `Outer` exist.
- Code-side: JSDoc of `buttonIconOpen` / `buttonIconClose` says "BalIcon".

## Unresolved

- Font family and line height / letter spacing as literals (TODO.md).
