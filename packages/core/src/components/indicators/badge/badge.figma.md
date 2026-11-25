# badge → Figma mapping

> **Status: done (24.11.2026)** — Phases 1–8 built and confirmed by the user. Phase 4 `pass`; 6c / 6e checked on the live
> render — re-check once `/update-screenshots` has run. Tokens from the DS Foundation library.

```yaml
sets: # filled in by Phase 3
  - name: Badge
    figmaComponentKey: fdab22a1d944c6429591191619c053852606789c
    figmaMasterNodeId: '6722:964'
figmaPage: Core / Indicators
figmaDocFrameNodeId: '6718:940'

anatomy: # letters follow the drawing left → right (Phase 7); both @part tags match a part="…" attribute (badge.tsx:91-92)
  - letter: A
    part: icon
    description: 'The icon element, if an icon is used.'
  - letter: B
    part: badge
    description: 'The badge element itself.'

props:
  - name: size
    type: enum
    options: [sm, lg]
    default: '(unset → Badge/Size/Base)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, lg] # implicit default named `base`, then smallest → largest
    note: 'sm is a 12px dot: font-size 0rem and `> * { display: none }` (badge.host.scss:139-148), icon never rendered (badge.tsx:92). sm variants contain no label / icon layer.'
  - name: color
    type: enum
    options: [disabled, info, danger, warning, success]
    default: '(unset → Badge/Default tokens, same look as danger)'
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [base, info, success, warning, danger, disabled] # user-confirmed order (Phase 1, 24.11.2026)
  - name: '(default slot)'
    type: text-only slot
    figmaProperty: label
    figmaPropertyType: text
    node: label
    default: Label # property name in sentence case (PHASE-2-PROPOSE.md → Naming)
    showBoolean: show label # default true — see Notes "show label"
  - name: icon
    type: string
    figmaProperty: icon
    figmaPropertyType: instance swap
    showBoolean: show icon # hasValue(this.icon) && size !== 'sm' && <ds-icon part="icon"> → default false
  - name: position
    type: enum
    options: [card, button, tabs]
    figmaPropertyType: excluded
    note: 'No styles in badge.host.scss — placement is done by the card / button / tabs host; no visual in isolation (user decision 24.11.2026).'
  - name: pulse
    type: boolean
    figmaPropertyType: excluded
    note: 'Animated box-shadow only — no static visual effect (user decision 24.11.2026).'

figmaCheck:
  conditionalLayers: # sm is a dot: no icon / label layer (badge.host.scss:139-148, badge.tsx:92)
    - name: icon
      when: { size: [base, lg] }
    - name: label
      when: { size: [base, lg] }

states: [] # no pseudo-classes in badge.host.scss
componentStates: {}

nested:
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    iconSlot:
      codeProp: icon # → INSTANCE_SWAP `icon`, glyph nested directly
      acceptsBrandIcon: false
      size: follows badge size — base 14 (Badge/Size/Base/Icon), lg 18 (Badge/Size/LG/Icon); none on sm
      colorSource:
        default: 'Badge/<color>/Color/Text (--icon-color, badge.host.scss:115)'

variations:
  figmaSectionNodeId: '6718:945'
  sets:
    - set: Badge
      previewNodeId: 'I6718:945;2192:7515;2192:5066;6718:1098'
      entries:
        - caption: 'show icon · base'
          props: { show icon: true, size: base }
          snapshot: badge-colors # <ds-badge icon="check"> (badge.visual.html:36)
          nodeId: 'I6718:945;2192:7515;2192:5066;6718:1098;2192:7499;6722:1190'
        - caption: 'show icon · lg'
          props: { show icon: true, size: lg }
          snapshot: badge-icon # <ds-badge icon="check" size="lg"> added 24.11.2026 — verified on the live render; Linux snapshot pending /update-screenshots
          nodeId: 'I6718:945;2192:7515;2192:5066;6718:1098;2192:7499;6722:1198'
  # sm: no entry — the icon never renders at sm

tokens: # all checked in the Foundation file (24.11.2026); 41 Badge variables
  - {
      figmaVariable: '🧩 Component/Badge/<Default|Info|Success|Warning|Danger|Disabled>/Color/Background',
      resolved: true,
    } # base = Default (= Surface/Red, same as Danger)
  - { figmaVariable: '🧩 Component/Badge/<Default|Info|Success|Warning|Danger|Disabled>/Color/Text', resolved: true } # label fill + icon glyph fill
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|SM|LG>/Height', resolved: true } # 24 / 12 / 32 — height and min width
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|SM|LG>/Padding', resolved: true } # 4
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|SM|LG>/Gap', resolved: true } # 4 / 0 / 4
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|SM|LG>/Icon', resolved: true } # 14 / 0 / 18
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|SM|LG>/Radius', resolved: true } # Radius/Rounded (9999)
  - { figmaVariable: '🧩 Component/Badge/Size/SM/Height', resolved: true, note: 'sm max width (badge.host.scss:145)' }
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|LG>/Label/Typo/FontSize', resolved: true } # → 📱 Device/🔤 Text/Size/SM|LG/Device (14 / 18)
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|LG>/Label/Typo/FontWeight', resolved: true } # Bold 700
  - { figmaVariable: '🧩 Component/Badge/Size/<Base|LG>/Label/Typo/FontFamily', resolved: true } # bound (Baloise Create Headline)
  - {
      figmaVariable: '🧩 Component/Badge/Size/<Base|LG>/Label/Typo/<LineHeight|LetterSpacing|TextDecoration|TextTransform>',
      resolved: true,
      bind: false,
    } # literal: line height 100%, letter spacing heading, none, none
  - {
      cssVar: '--mod-badge-font-size: 0rem (sm)',
      figmaVariable: null,
      resolved: true,
      resolution: 'intentional literal (dot) — sm has no label layer in Figma',
    }
# No breakpoint mixins in badge.host.scss → no device: section (font size routes through Device by alias).

completeness:
  - node: badge (component root, auto-layout row, hug width, fixed height)
    fill: Badge/<color>/Color/Background
    height / min width: Badge/Size/<size>/Height
    max width: Badge/Size/SM/Height (sm only)
    padding (all sides): Badge/Size/<size>/Padding
    gap: Badge/Size/<size>/Gap
    radius: Badge/Size/<size>/Radius
  - node: icon (Icon instance, base / lg only)
    size: Badge/Size/<size>/Icon
    glyph fill: Badge/<color>/Color/Text
  - node: label (text, base / lg only)
    family: Badge/Size/<size>/Label/Typo/FontFamily (Baloise Create Headline)
    size / weight: Badge/Size/<size>/Label/Typo/FontSize / FontWeight
    line-height / letter-spacing / decoration / transform: literal from Label/Typo/*
    color: Badge/<color>/Color/Text
# No gaps.

measurements: # confirmed by the user 24.11.2026 (triage + drawn section), measured on the dev server
  drawnOption: base
  options: [base, sm, lg]
  behavior:
    width: hug
    overflow: overflow # white-space: nowrap, no max width on base / lg — grows with the text (`Urgent` = 53px)
  rows:
    - property: Height
      kind: size
      group: fixed
      show: drawn
      instance: main
      source: badge.host.scss:65
      values:
        base: { px: 24, token: 🧩 Component/Badge/Size/Base/Height }
        sm: { px: 12, token: 🧩 Component/Badge/Size/SM/Height }
        lg: { px: 32, token: 🧩 Component/Badge/Size/LG/Height }
    - property: Min width
      kind: size
      group: limit
      show: drawn
      instance: min-content # label `1`, no icon — the only content the limit binds on
      source: badge.host.scss:64
      reason: 'binds for a single digit: 12 + 2 × 4 = 20 < 24'
      values:
        base: { px: 24, token: 🧩 Component/Badge/Size/Base/Height }
        sm: { px: 12, token: 🧩 Component/Badge/Size/SM/Height }
        lg: { px: 32, token: 🧩 Component/Badge/Size/LG/Height }
    - property: Icon size
      kind: size
      group: fixed
      show: drawn
      instance: main # main instance has every optional part on (icon + label)
      source: badge.host.scss:73
      values:
        base: { px: 14, token: 🧩 Component/Badge/Size/Base/Icon }
        sm: { px: 0, token: 🧩 Component/Badge/Size/SM/Icon }
        lg: { px: 18, token: 🧩 Component/Badge/Size/LG/Icon }
    - property: Padding X
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: badge.host.scss:69
      values:
        base: { px: 4, token: 🧩 Component/Badge/Size/Base/Padding }
        sm: { px: 4, token: 🧩 Component/Badge/Size/SM/Padding }
        lg: { px: 4, token: 🧩 Component/Badge/Size/LG/Padding }
    - property: Gap
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main # icon + label
      source: badge.host.scss:68
      values:
        base: { px: 4, token: 🧩 Component/Badge/Size/Base/Gap }
        sm: { px: 0, token: 🧩 Component/Badge/Size/SM/Gap }
        lg: { px: 4, token: 🧩 Component/Badge/Size/LG/Gap }
    - property: Text (label)
      kind: type
      group: typography
      show: drawn
      instance: main
      source: badge.host.scss:57
      values:
        base:
          {
            px: 14,
            token: 🧩 Component/Badge/Size/Base/Label/Typo/FontSize,
            weight: 700,
            lineHeight: 1,
            family: BaloiseCreateHeadline,
          }
        lg:
          {
            px: 18,
            token: 🧩 Component/Badge/Size/LG/Label/Typo/FontSize,
            weight: 700,
            lineHeight: 1,
            family: BaloiseCreateHeadline,
          }
    - property: Padding Y
      kind: spacing
      group: inner spacing
      show: skip
      reason: 'fixed height decides the box (14 + 2 × 4 = 22 < 24)'
      values:
        base: { px: 4, token: 🧩 Component/Badge/Size/Base/Padding }
    - property: Max width
      kind: size
      group: limit
      show: skip
      reason: 'sm only: min = max = height (12) — the Height row covers it'
      values:
        sm: { px: 12, token: 🧩 Component/Badge/Size/SM/Height }
    - property: Radius
      kind: shape
      group: fixed
      show: skip
      reason: '9999 — a pill (no radius on a pill)'
      values:
        base: { px: 9999, token: 🧩 Component/Badge/Size/Base/Radius }
```

## Phase 2 — proposed grouping

One set `Badge`, no top-level split (no `inverted`, every option re-skins the same pill). 2 variant
axes, no `state` → `size` on the columns, `color` on the rows:

```
            base     sm      lg
base       [cell]  [cell]  [cell]
info       [cell]  [cell]  [cell]
success    [cell]  [cell]  [cell]
warning    [cell]  [cell]  [cell]
danger     [cell]  [cell]  [cell]
disabled   [cell]  [cell]  [cell]
```

**Variant count:** 3 × 6 = **18** (≤ 500).

Component properties (render order): `icon` (instance swap, default `check`) + `show icon`
(boolean, default `false`), `label` (text, default `Label`) + `show label` (boolean, default `true`).
`sm` variants hold neither layer, so the four properties have no effect on them — same as code.

## Notes

- **show label:** the default slot is not guarded in `render()`, but an empty slot takes no space,
  while an empty Figma text node still takes width and gap. The icon-only badge is the main icon
  use (`badge.visual.html` colors / icon / list), so `show label` (default `true`) lets designers
  get it. Default `true` → no variation entry.
- **Default = danger look:** `Badge/Default/Color/*` and `Badge/Danger/Color/*` resolve to the same
  Alias values today; both stay options because the tokens are separate.
- **Generated text:** none.
