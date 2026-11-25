# spinner → Figma mapping

> **Status: done (18.11.2026)** — Phases 1–8 built and confirmed by the user — rebuild of the Spinner component in the DS Core
> Components file, tokens from the DS Foundation library.

```yaml
sets: # default set first
  - name: Spinner # variation=logo
    figmaComponentKey: 8c6b86b1d794f09808f16b3759bf486e6a1b83b8
    figmaMasterNodeId: '6198:242'
  - name: SpinnerInverted
    figmaComponentKey: 7e4bea555e88f91af5b15cbcdc22195b0113e322
    figmaMasterNodeId: '6199:315'
  - name: SpinnerCircle # variation=circle
    figmaComponentKey: 2f13ce3e2214a1a16224a9de0b7e430676d24aa4
    figmaMasterNodeId: '6199:261'
  - name: SpinnerCircleInverted
    figmaComponentKey: e890a8ec0239d735efea07dfbc89752c5ae688bf
    figmaMasterNodeId: '6199:344'
figmaPage: Core / Indicators
figmaDocFrameNodeId: '6193:548'

anatomy: # DOM order in render(); both @part tags match a part="…" attribute
  - letter: A
    part: inner
    description: 'The spinner animation container element.'
  - letter: B
    part: label
    description: 'The visible label rendered next to the spinner.'

props:
  - name: variation
    type: enum
    options: [logo, circle]
    default: logo
    figmaPropertyType: top-level-split (rule 1) # logo and circle have different layers → Spinner / SpinnerCircle
  - name: inverted
    type: boolean
    default: false
    figmaPropertyType: top-level-split (rule 2) # → …Inverted sets
  - name: size
    type: enum
    options: [sm]
    default: '(unset → MD tokens)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm] # implicit default named `base`
  - name: label
    type: string # code default '' (the Figma default is `default:` below)
    figmaProperty: label
    figmaPropertyType: text
    node: label
    default: Label # property name in sentence case (PHASE-2-PROPOSE.md → Naming); was `Loading` until 23.11.2026
    showBoolean: show label # hasValue(this.label) && <span part="label"> → `show label`, default false
  - name: labelPosition
    type: enum
    options: [right, bottom]
    default: right
    figmaProperty: label position
    figmaPropertyType: variant
    figmaOptions: [right, bottom]
    dependsOn: show label # .is-label-right / .is-label-bottom only apply when a label is set
  - name: deactivated
    type: boolean
    figmaPropertyType: excluded
    note: 'Stops the animation only — no static visual effect.'
  # Generated: the translated aria-label ("Laden") is not rendered — no property.

states: [] # no pseudo-classes in spinner.host.scss
componentStates: {}

nested: [] # none — the logo glyph and the circle are this component's own shapes

variations:
  figmaSectionNodeId: '6193:553'
  sets:
    - set: Spinner
      previewNodeId: 'I6193:553;2192:7515;2192:5066;6193:767'
      entries:
        - caption: 'show label · right'
          props: { show label: true, label position: right }
          snapshot: spinner-label # <ds-spinner label="Loading..."> (spinner.visual.html:26)
          nodeId: 'I6193:553;2192:7515;2192:5066;6193:767;2192:7499;6199:377'
        - caption: 'show label · bottom'
          props: { show label: true, label position: bottom }
          snapshot: spinner-label # label-position="bottom" (spinner.visual.html:27)
          nodeId: 'I6193:553;2192:7515;2192:5066;6193:767;2192:7499;6199:391'
    - set: SpinnerCircle
      previewNodeId: 'I6193:553;2192:7515;2192:5066;6199:424'
      entries:
        - caption: 'show label · right'
          props: { show label: true, label position: right }
          snapshot: spinner-circle-variation # spinner.visual.html:49
          nodeId: 'I6193:553;2192:7515;2192:5066;6199:424;2192:7499;6199:436'
        - caption: 'show label · bottom'
          props: { show label: true, label position: bottom }
          snapshot: spinner-circle-variation # spinner.visual.html:50
          nodeId: 'I6193:553;2192:7515;2192:5066;6199:424;2192:7499;6199:452'

tokens: # all checked in the Foundation file (18.11.2026)
  # logo
  - { cssVar: --ds-spinner-logo-size-md, figmaVariable: 🧩 Component/Spinner/Logo/Size/MD, resolved: true } # 64
  - { cssVar: --ds-spinner-logo-size-sm, figmaVariable: 🧩 Component/Spinner/Logo/Size/SM, resolved: true } # 32
  - { cssVar: --ds-spinner-logo-color-primary, figmaVariable: 🧩 Component/Spinner/Logo/Color/Primary, resolved: true } # read by getColor() in spinner.tsx, not by SCSS
  - {
      cssVar: --ds-spinner-logo-color-inverted,
      figmaVariable: 🧩 Component/Spinner/Logo/Color/Inverted,
      resolved: true,
    }
  # circle
  - { cssVar: --ds-spinner-circle-size-md, figmaVariable: 🧩 Component/Spinner/Circle/Size/MD, resolved: true } # 24
  - { cssVar: --ds-spinner-circle-size-sm, figmaVariable: 🧩 Component/Spinner/Circle/Size/SM, resolved: true } # 16
  - {
      cssVar: --ds-spinner-circle-thickness-md,
      figmaVariable: 🧩 Component/Spinner/Circle/Thickness/MD,
      resolved: true,
    } # 4
  - {
      cssVar: --ds-spinner-circle-thickness-sm,
      figmaVariable: 🧩 Component/Spinner/Circle/Thickness/SM,
      resolved: true,
    } # 2
  - {
      cssVar: --ds-spinner-circle-primary-background,
      figmaVariable: 🧩 Component/Spinner/Circle/Primary/Background,
      resolved: true,
    } # ring
  - {
      cssVar: --ds-spinner-circle-primary-progress,
      figmaVariable: 🧩 Component/Spinner/Circle/Primary/Progress,
      resolved: true,
    } # arc
  - {
      cssVar: --ds-spinner-circle-inverted-background,
      figmaVariable: 🧩 Component/Spinner/Circle/Inverted/Background,
      resolved: true,
    }
  - {
      cssVar: --ds-spinner-circle-inverted-progress,
      figmaVariable: 🧩 Component/Spinner/Circle/Inverted/Progress,
      resolved: true,
    } # = Text/Color/Primary (navy) — arc invisible on dark, same in code
  - {
      cssVar: --ds-spinner-circle-border-style,
      figmaVariable: 🧩 Component/Spinner/Circle/Border/Style,
      resolved: true,
    } # STRING "solid" — not bindable; solid stroke
  # label
  - { cssVar: --ds-spinner-label-gap, figmaVariable: 🧩 Component/Spinner/Label/Gap, resolved: true } # 8, label right
  - { cssVar: --ds-spinner-label-gap-bottom, figmaVariable: 🧩 Component/Spinner/Label/GapBottom, resolved: true } # 4, label bottom
  - {
      cssVar: --ds-spinner-label-color-primary,
      figmaVariable: 🧩 Component/Spinner/Label/Color/Primary,
      resolved: true,
    }
  - {
      cssVar: --ds-spinner-label-color-inverted,
      figmaVariable: 🧩 Component/Spinner/Label/Color/Inverted,
      resolved: true,
    }
  - {
      cssVar: --ds-spinner-label-typo-font-family,
      figmaVariable: 🧩 Component/Spinner/Label/Typo/FontFamily,
      resolved: true,
    } # bound (Figma font name `Baloise Create Text` synced 24.11.2026)
  - {
      cssVar: --ds-spinner-label-typo-font-size,
      figmaVariable: 🧩 Component/Spinner/Label/Typo/FontSize,
      resolved: true,
    } # → 📱 Device/🔤 Text/Size/Base/Device (16 on M / T / D)
  - {
      cssVar: --ds-spinner-label-typo-font-weight,
      figmaVariable: 🧩 Component/Spinner/Label/Typo/FontWeight,
      resolved: true,
    } # 400
  - {
      cssVar: --ds-spinner-label-typo-line-height,
      figmaVariable: 🧩 Component/Spinner/Label/Typo/LineHeight,
      resolved: true,
      bind: false,
    } # STRING — applied as a literal (1.5), PHASE-3-BUILD.md exception
  - {
      cssVar: --ds-spinner-label-typo-letter-spacing,
      figmaVariable: 🧩 Component/Spinner/Label/Typo/LetterSpacing,
      resolved: true,
      bind: false,
    } # STRING "0%" — applied as a literal
  - {
      cssVar: --ds-spinner-label-typo-text-decoration,
      figmaVariable: 🧩 Component/Spinner/Label/Typo/TextDecoration,
      resolved: true,
      bind: false,
    } # STRING — literal NONE
  - {
      cssVar: --ds-spinner-label-typo-text-transform,
      figmaVariable: 🧩 Component/Spinner/Label/Typo/TextTransform,
      resolved: true,
      bind: false,
    } # none — nothing to apply
# No breakpoint mixins → no device: section (the font size routes through Device by alias).

completeness:
  - node: wrapper (component root, per set) # host: flex row / column
    gap: Label/Gap (right) · Label/GapBottom (bottom)
  - node: inner (logo) # Spinner / SpinnerInverted
    width: Logo/Size/MD | SM
    height: Logo/Size/MD | SM (square — user decision 18.11.2026; live 70.5 / 38.5 is inline-SVG empty space)
    glyph fill: Logo/Color/Primary | Inverted
  - node: inner (circle) # SpinnerCircle / SpinnerCircleInverted
    width / height: Circle/Size/MD | SM
    ring stroke: Circle/<Primary|Inverted>/Background, weight Circle/Thickness/MD | SM
    progress arc stroke: Circle/<Primary|Inverted>/Progress, same weight
  - node: label (text)
    family: Label/Typo/FontFamily (Baloise Create Text)
    size / weight: Label/Typo/FontSize / FontWeight (fontStyle)
    line-height / letter-spacing / decoration: literal from Label/Typo/* (not bindable)
    color: Label/Color/Primary | Inverted
# No gaps.

measurements: # confirmed by the user 18.11.2026, measured on the dev server
  drawnOption: base
  options: [base, sm]
  # behavior: none (spinner)
  rows:
    - property: Logo width
      kind: size
      group: fixed
      show: drawn
      instance: main # logo, show label on, label right
      source: spinner.host.scss:70
      values:
        base: { px: 64, token: 🧩 Component/Spinner/Logo/Size/MD }
        sm: { px: 32, token: 🧩 Component/Spinner/Logo/Size/SM }
    - property: Circle size (w = h)
      kind: size
      group: fixed
      show: drawn
      instance: circle # structural split → extra instance
      source: spinner.host.scss:80
      values:
        base: { px: 24, token: 🧩 Component/Spinner/Circle/Size/MD }
        sm: { px: 16, token: 🧩 Component/Spinner/Circle/Size/SM }
    - property: Gap (label right)
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: spinner.host.scss:114
      values:
        base: { px: 8, token: 🧩 Component/Spinner/Label/Gap }
        sm: { px: 8, token: 🧩 Component/Spinner/Label/Gap }
    - property: Gap (label bottom)
      kind: spacing
      group: inner spacing
      show: drawn
      instance: label-bottom # other layout → extra instance
      source: spinner.host.scss:121
      values:
        base: { px: 4, token: 🧩 Component/Spinner/Label/GapBottom }
        sm: { px: 4, token: 🧩 Component/Spinner/Label/GapBottom }
    - property: Border width (circle)
      kind: shape
      group: fixed
      show: drawn
      instance: circle
      source: spinner.host.scss:77
      values:
        base: { px: 4, token: 🧩 Component/Spinner/Circle/Thickness/MD }
        sm: { px: 2, token: 🧩 Component/Spinner/Circle/Thickness/SM }
    - property: Text (label)
      kind: type
      group: typography
      show: drawn
      instance: main
      source: spinner.host.scss:126
      values:
        base:
          {
            px: 16,
            token: 🧩 Component/Spinner/Label/Typo/FontSize,
            weight: 400,
            lineHeight: 1.5,
            family: BaloiseCreateText,
          }
        sm:
          {
            px: 16,
            token: 🧩 Component/Spinner/Label/Typo/FontSize,
            weight: 400,
            lineHeight: 1.5,
            family: BaloiseCreateText,
          }
    - property: Logo height
      kind: size
      group: derived
      show: skip
      reason: 'inline-SVG empty space (3.25 above and below the square logo) — not a spinner value; Figma logo is square (user decision 18.11.2026)'
      values:
        base: { px: 70.5 }
        sm: { px: 38.5 }
    - property: Radius (circle)
      kind: shape
      group: fixed
      show: skip
      reason: '50% — a circle (no radius on a circle)'
      values:
        base: { px: 12 }
    - property: Width (logo, no label)
      kind: size
      group: derived
      show: skip
      reason: 'host is display:flex and fills its container (881 on the test page) — layout, not a spinner value'
      values:
        base: { px: 881.61 }
```

## Notes

- **Logo height (user decision 18.11.2026):** square, width and height bound to `Logo/Size/MD | SM`.
  Live, the Lottie SVG is an inline element in a 64 × 70.5 / 32 × 38.5 box: the square drawing sits
  centered with 3.25px empty space above and below (the same 6.5px at both sizes — not a
  proportion). Possible code follow-up: `display: block` on the SVG.
- **Logo glyph:** traced from the live Lottie frame that matches the visual test snapshot (9
  rotated squares → one unioned vector `logo`, 88.6% of `inner`, centered).
- **Circle on inverted:** the progress arc uses `Text/Color/Primary` (navy) on the dark background —
  invisible, same as in code.
- **Typography:** the label uses the composite token `🧩 Component/Spinner/Label/Typo`; the token
  sync splits it into seven Foundation variables. Foundation has no text styles.
- **Code drift (follow-up, not fixed here):** `spinner.tsx` `getColor()` hardcodes `#000d6e` /
  `#ffffff` as the SSR fallback.
- **Label default (23.11.2026):** `Label` (the naming rule) on all four sets, was `Loading`. Found
  by `scripts/check-mapping-coverage.mjs`. The label is hidden by default (`show label` off), so no
  variant changed size. Header LAST UPDATED → 23.11.2026.
