# button → Figma mapping

> **Status: done (19.11.2026)** — Phases 1–8 built and confirmed by the user — rebuild of the Button component in the DS Core
> Components file, tokens from the DS Foundation library. Decisions from earlier runs:
> `.claude/skills/ds-code-to-figma/rebuild-decisions.md` → "Button". Brand icons left out (no
> Helvetia brand-icon assets; `ds-brand-icon` takes raw SVG / URL only).

```yaml
sets: # default set first
  - name: Button
    figmaComponentKey: f728631ba607a4e4d0519f950152963a105f2f98
    figmaMasterNodeId: '6277:1671'
  - name: ButtonInverted # only the 5 colors whose inverted tokens differ
    figmaComponentKey: 2bcb3a4a546b3ba7cfe8a346a2c6c781491d9694
    figmaMasterNodeId: '6277:1672'
figmaPage: Core / Actions
figmaDocFrameNodeId: '6252:6'

anatomy: # letters follow the drawing, left to right (user decision 19.11.2026); every @part matches a part="…" attribute
  - letter: A
    part: spinner
    description: 'The loading spinner shown when `loading` is true.'
  - letter: B
    part: native
    description: 'The native `<button>` or `<a>` element.'
  - letter: C
    part: icon
    description: 'The leading icon wrapper (or the brand icon wrapper when `brandIcon` is set).'
  - letter: D
    part: label
    description: 'The text label wrapper (`<span>`).'
  - letter: E
    part: icon-right
    description: 'The trailing icon wrapper.'
# Two Anatomy instances (rebuild-decisions.md): `loading` (A spinner, B native) and default with both icons on (C, D, E).

props:
  - name: color
    type: enum
    options: [primary, secondary, tertiary, ghost, brand-purple, brand-red, brand-yellow, brand-green, info, success, warning, danger, link]
    default: primary
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [primary, secondary, tertiary, ghost, brand-purple, brand-red, brand-yellow, brand-green, info, success, warning, danger, link]
  - name: size
    type: enum
    options: [sm, lg]
    default: '(unset → Size/Base)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, lg]
  - name: inverted
    type: boolean
    figmaPropertyType: top-level-split (rule 2)
    note: 'ButtonInverted holds primary · secondary · tertiary · ghost · link; primary, brand and status colors share the Inverted tokens in code.'
  - name: label # default slot, text only → text property
    type: slot
    figmaProperty: label
    figmaPropertyType: text
    node: label
    default: Button
    showBoolean: show label # default true; off for square (instance override)
  - name: icon
    type: string
    figmaProperty: icon
    figmaPropertyType: instance swap # glyph library, default IconPlus; preferred = 79 glyphs
    showBoolean: show icon # default false
  - name: iconRight
    type: string
    figmaProperty: icon right
    figmaPropertyType: instance swap
    showBoolean: show icon right # default false
  - name: disabled
    figmaPropertyType: component state (blocked) # disabled=true only with state=default
  - name: loading
    figmaPropertyType: component state (blocked) # loading=true only with state=default; label stays visible
  # Instance overrides, not variants (rebuild-decisions.md, approved 04.11.2026):
  - { name: square, figmaPropertyType: instance override, note: 'show label off, show icon on; padding-x and gap 0; min width / height = Size/*/MinHeight; icon size md (sm: sm)' }
  - { name: flat, figmaPropertyType: instance override, note: 'padding-x 0; min height → Button/Flat/MinHeight (28, token since 18.11.2026)' }
  - { name: shadow, figmaPropertyType: instance override, note: 'Alias/Shadow/Box/Base (ghost, link: Alias/Shadow/Text) — once the Foundation shadow styles exist' }
  - { name: iconTurn, figmaPropertyType: instance override, note: 'rotate the icon instance 180°' }
  - name: '[excluded]'
    figmaPropertyType: excluded
    note: 'brandIcon, brandSize (no brand-icon build), a11yTitle + tooltipPlacement (tooltip only on hover), elementType, href, target, rel, download, name, value, noWrap, a11yControls, a11yCurrent, a11yLabel, a11yHaspopup; @attachment ds-badge (attachments plan).'

states:
  figmaProperty: state
  options: [default, hover, focus, active]
  sources:
    hover: ':hover / .is-hovered (button.style.scss:120)'
    focus: ':focus-visible / .is-focused → focus-shadow (button.style.scss:112)'
    active: ':active / .is-pressed (button.style.scss:129)'
componentStates:
  disabled: { figmaProperty: disabled, options: [false, true], interactive: false, source: 'button-disabled(): pointer-events none on every state (button.style.scss:541)' }
  loading: { figmaProperty: loading, options: [false, true], interactive: false, source: ':host(.is-loading) #button → button-disabled() (button.style.scss:580)' }

nested:
  - childTag: '(focus ring)'
    figmaComponentKey: 2454d0fabf5c8fcb51b8b44de7a4fec90e9120c8 # Focus ring set, Core / Utilities
    note: 'focus-shadow mixin → focus-ring instance on every state=focus variant (build-mechanics.md → Focus states)'
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    iconSlot:
      codeProp: icon / iconRight # → INSTANCE_SWAP `icon`, `icon right`; glyphs nested directly
      acceptsBrandIcon: false # brand icons left out (see header)
      size: follows button size — base 16 (Icon/Size/Base), sm 14 (Icon/Size/SM), lg 32 (Icon/Size/LG); padding per Icon/Padding/*
      colorSource:
        default: 'Button/Color/<color>/Base/Text (--icon-color)'
        hover: 'Button/Color/<color>/Hover/Text'
        focus: 'Button/Color/<color>/Base/Text'
        active: 'Button/Color/<color>/Active/Text'
        disabled: 'Button/Color/Disabled/Base/Text'
  - childTag: ds-spinner
    childMappingFile: ../../indicators/spinner/spinner.figma.md
    figmaComponentKey: 8c6b86b1d794f09808f16b3759bf486e6a1b83b8
    note: 'Instance of Spinner (logo); inner width / height overridden to Button/Spinner/Size (24); logo fill → Button/Color/Disabled/Base/Text (loading uses the disabled colors). Shown only on loading=true.'

variations: # filled in by Phase 3
  figmaSectionNodeId: '6252:11'
  sets:
    - set: Button
      previewNodeId: null
      entries:
        - { caption: 'show icon', props: { show icon: true }, snapshot: button-icon, nodeId: null }
        - { caption: 'show icon right', props: { show icon right: true }, snapshot: button-icon, nodeId: null }
        - { caption: 'all on', props: { show icon: true, show icon right: true }, snapshot: button-icon, nodeId: null }

tokens: # names checked in the Foundation file (18.11.2026); 320 Button variables
  # per color × state: 🧩 Component/Button/Color/<Color>/<Base|Hover|Active>/{Text, Background, Border/BorderColor, Border/BorderWidth, Border/BorderStyle}
  # colors: Primary, Secondary, Tertiary, Ghost, BrandPurple, BrandRed, BrandYellow, BrandGreen, Info, Success, Warning, Danger, Link,
  #         Disabled (Base only, + SpinnerBackground), Inverted, InvertedSecondary, InvertedTertiary, InvertedGhost, InvertedLink
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/MinHeight', resolved: true } # 48 / 32 / 56
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/MinWidth', resolved: true } # 48 / 32 / 56 (square)
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/PaddingX', resolved: true } # 24 / 12 / 24
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/Gap', resolved: true } # 8
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/Radius', resolved: true } # 4
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/Label/Typo/*', resolved: true } # Headline, 16 / 14 / 18 (→ Device/Text/Size/*/Device), Bold, 130%; family literal `Baloise Create Headline` (TODO.md), line height / letter spacing / decoration literal
  - { figmaVariable: '🧩 Component/Button/Spinner/Size', resolved: true } # 24
  - { figmaVariable: '🧩 Component/Button/Flat/MinHeight', resolved: true } # 28
  - { figmaVariable: '🧩 Component/Button/Link/Label/TextDecoration', resolved: true, bind: false } # underline, literal
  - { figmaVariable: '🧩 Component/Button/Link/UnderlineOffset', resolved: true, bind: false } # Figma has no bindable underline offset — literal
  - { figmaVariable: '🧩 Component/Button/Disabled/Label/TextDecoration', resolved: true, bind: false }
  - { figmaVariable: '🔗 Alias/✨ Interaction/Focus/Color/Base | Inverted | Border', resolved: true } # focus ring colors
  - { figmaVariable: '🔗 Alias/✨ Interaction/Focus/Size/Inner | Outer', resolved: true } # 2 / 5 — ring stroke weights in the shared Focus ring component
# No breakpoint mixins in button.style.scss → no device: section (brand-icon padding left out).

measurements: # confirmed by the user 18.11.2026, measured on the dev server (fresh build)
  drawnOption: base
  drawnColor: secondary
  drawnColorReason: 'primary and the status colors draw the border in the fill color — the border and the padding inside it can''t be seen (rebuild-decisions.md)'
  options: [base, sm, lg]
  behavior:
    width: hug # wide: fill
    overflow: wrap # no-wrap: truncate
  rows:
    - { property: Min height, kind: size, group: limit, show: drawn, instance: main, source: button.style.scss:90, values: { base: { px: 48, token: 🧩 Component/Button/Size/Base/MinHeight }, sm: { px: 32, token: 🧩 Component/Button/Size/SM/MinHeight }, lg: { px: 56, token: 🧩 Component/Button/Size/LG/MinHeight } } }
    - { property: Icon size, kind: size, group: fixed, show: drawn, instance: main, source: button.tsx:503 (size={size}), values: { base: { px: 16, token: 🧩 Component/Icon/Size/Base }, sm: { px: 14, token: 🧩 Component/Icon/Size/SM }, lg: { px: 32, token: 🧩 Component/Icon/Size/LG } } }
    - { property: Spinner size, kind: size, group: fixed, show: drawn, instance: loading, source: button.style.scss:103, values: { base: { px: 24, token: 🧩 Component/Button/Spinner/Size } } }
    - { property: Padding X, kind: spacing, group: inner spacing, show: drawn, instance: main, source: button.style.scss:92, values: { base: { px: 24, token: 🧩 Component/Button/Size/Base/PaddingX }, sm: { px: 12, token: 🧩 Component/Button/Size/SM/PaddingX }, lg: { px: 24, token: 🧩 Component/Button/Size/LG/PaddingX } } }
    - { property: Gap, kind: spacing, group: inner spacing, show: drawn, instance: main, source: button.style.scss:91, values: { base: { px: 8, token: 🧩 Component/Button/Size/Base/Gap } } }
    - { property: Border width, kind: shape, group: fixed, show: drawn, instance: main, source: button.style.scss:96, values: { base: { px: 2, token: 🧩 Component/Button/Color/Secondary/Base/Border/BorderWidth } } }
    - { property: Radius, kind: shape, group: fixed, show: drawn, instance: main, source: button.style.scss:86, values: { base: { px: 4, token: 🧩 Component/Button/Size/Base/Radius } } }
    - { property: Focus ring, kind: shape, group: fixed, show: drawn, instance: focus, source: general.mixin.scss:37, values: { base: { px: '2 + 5', token: 🔗 Alias/✨ Interaction/Focus/Size/Inner + Outer } } }
    - { property: Text (label), kind: type, group: typography, show: drawn, instance: main, source: button.style.scss:84, values: { base: { px: 16, weight: 700, lineHeight: 1.3, family: BaloiseCreateHeadline, token: 🧩 Component/Button/Size/Base/Label/Typo }, sm: { px: 14, token: 🧩 Component/Button/Size/SM/Label/Typo }, lg: { px: 18, token: 🧩 Component/Button/Size/LG/Label/Typo } } }
    - { property: Min width, kind: size, group: limit, show: skip, reason: 'never binds — an empty base button is already 104px wide (border + padding 52 > 48)', values: { base: { px: 48 } } }
    - { property: Height, kind: size, group: derived, show: skip, reason: 'min height covers it', values: { base: { px: 48 } } }
    - { property: Flat min height, kind: size, group: limit, show: skip, reason: 'flat is an instance override, not a variant (user decision 18.11.2026)', values: { base: { px: 28, token: 🧩 Component/Button/Flat/MinHeight } } }
```

## Notes

- **Code follow-up (user decision 18.11.2026):** every `<button>` gets 1px `padding-block` from the
  browser default (only `padding-inline` is set; `<a>` gets 0). Not built in Figma; the 48px
  height comes from min height either way.
- **Spinner size (user decision 18.11.2026):** the nested Spinner instance is scaled to 24px
  (`rescale`) — Figma ignored both a `Button/Spinner/Size` binding and a resize on the instance's
  `inner` layer. Matches the token value, not linked to it.
- **Focus ring (user decision 19.11.2026):** every focus variant holds a `focus-ring` instance of the
  shared `Focus ring` set (`Core / Utilities`, `inverted=false` in Button, `inverted=true` in
  ButtonInverted), absolute and stretched — the Figma stand-in for the code's `box-shadow`. Drop
  shadows didn't render on the transparent `secondary` / `ghost` / `link` backgrounds.
- **Loading:** the label stays visible next to the spinner; colors are the disabled ones.
- **Dev build fix (18.11.2026):** the merge of `main` on 17.11.2026 duplicated
  `Tooltip.resolveOffset()`, so the dev server served a stale build; removed — `tooltip.tsx` matches
  `main` again.
