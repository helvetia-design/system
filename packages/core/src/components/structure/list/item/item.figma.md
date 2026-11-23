# item → Figma mapping

> **Status: Phase 3 built, awaiting documentation-frame approval (23.11.2026)** — contained sub-component of `ds-list`. Anatomy, measurements and
> variations live in `../list.figma.md`.

```yaml
owner: ../list.figma.md
sets: # filled in by Phase 3 — default set first
  - name: Item
    figmaComponentKey: 153da16d8a1626963119019a39a496adc1568281
    figmaMasterNodeId: '6551:3200'
    axes: [variant, size, label size] # variant props this set has (figma-check-set.mjs); no `open`
  - name: ItemInverted # inverted mirror of the owner's split
    figmaComponentKey: e099546db5eca5d3f3cc8670925639559e08d2b7
    figmaMasterNodeId: '6555:2540'
    axes: [variant, size, label size]
  - name: ItemAccordion # rule 1: own layers (item row, marker, accordion-content), not a nested Accordion instance
    figmaComponentKey: c1265a34b0ab56e72e54e246cb861605b1026939
    figmaMasterNodeId: '6558:3886'
    axes: [open, size, label size] # no `variant`
  - name: ItemAccordionInverted
    figmaComponentKey: bb5f21143d814a2211e36f2652602ed1e9838fb6
    figmaMasterNodeId: '6560:2893'
    axes: [open, size, label size]
figmaPage: Core / Structure
figmaDocFrameNodeId: '6548:2182' # = the owner's "List Documentation" frame

props:
  - name: variant
    type: enum
    options: [default, link, button, accordion]
    default: default
    figmaProperty: variant
    figmaPropertyType: variant # default · link · button re-skin the same layers (PROPOSED, Phase 2)
    figmaOptions: [default, link, button] # `accordion` → top-level split ItemAccordion (rule 1), see Phase 2 proposal
  - name: size
    type: enum
    options: [lg]
    default: '(unset → base)'
    drivenBy: ds-list.size # public too, cascades from ds-list
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, lg]
  - name: inverted
    type: boolean
    default: false
    drivenBy: ds-list.inverted
    figmaPropertyType: top-level-split (rule 2) # → ItemInverted
  - name: disabled
    type: boolean
    default: false
    figmaProperty: disabled
    figmaPropertyType: component state (blocked) # disabled=true only with state=default; see componentStates
  - name: label
    type: string
    figmaProperty: label
    figmaPropertyType: text
    node: label
    default: Label # code default ''
    shownWhen: show label=true # render-guarded (this.label && …) → `show label` boolean
  - name: description
    type: string
    figmaProperty: description
    figmaPropertyType: text
    node: description
    default: Description # code default ''
    shownWhen: show description=true # render-guarded → `show description` boolean
  - name: labelSize
    type: enum
    options: [h1, h2, h3, h4, h5, 3xl, 2xl, xl, lg, base]
    default: '(unset → labelLevel → none → Title/Typo)'
    figmaProperty: label size
    figmaPropertyType: variant
    figmaOptions: [base, h1, h2, h3, h4, h5] # aliases 3xl…base duplicate h1…h5 (item.host.scss size-aliases); Phase 2 to confirm collapse
    dependsOn: show label
  - name: labelLevel
    figmaPropertyType: excluded
    note: 'Semantic heading tag; also the fallback for labelSize in code (labelSize ?? labelLevel). Same look as the matching labelSize → one axis (label size) covers it.'
  - name: actionIcon
    type: enum
    options: [default, link, link-external, download]
    default: '(unset → caret-right)'
    figmaProperty: action icon
    figmaPropertyType: instance-swap # nested ds-icon, only for variant=link|button; see nested.iconSlot
  - name: accordionOpen
    type: boolean
    default: false
    figmaProperty: open
    figmaPropertyType: variant # only variant=accordion; mirrors ds-accordion `open` — Phase 2 to confirm
    figmaOptions: [false, true]
  - name: accordionMarker
    type: enum
    options: ['', plus, plus-minus]
    default: '(unset → caret-down)'
    figmaPropertyType: nested-instance-prop # forwarded to the nested ds-accordion `marker` — Phase 2 decides whether to expose it
  - name: accordionMarkerPosition
    type: enum
    options: [left, right]
    default: '(unset → right)'
    figmaPropertyType: nested-instance-prop # forwarded to ds-accordion `marker position`
  - name: '[excluded]'
    figmaPropertyType: excluded
    props: [accordionGroup, download, href, rel, target]
    note: 'behavior / link attributes, no visual effect'

states:
  figmaProperty: state
  options: [default, hover, active] # focus ignored
  sources:
    hover: ':hover / .is-hovered on #item (item.host.scss:206) — background, text, border and icon color; link, button and accordion only'
    active: ':active / .is-pressed on #item (item.host.scss:226) — same properties; link, button and accordion only'
componentStates:
  disabled:
    figmaProperty: disabled
    options: [false, true]
    interactive: false
    source: 'item.host.scss:318 — :host(.is-disabled) #item { pointer-events: none }, hover/active gated by :not(.is-disabled) (item.host.scss:192, :256)' # true only with state=default

nested:
  - childTag: ds-icon
    childMappingFile: ../../../media/icon/icon.figma.md
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    iconSlot:
      codeProp: actionIcon # → INSTANCE_SWAP `action icon` (caret-right default, link, download)
      acceptsBrandIcon: false
      size: 14 # 🧩 Component/List/Item/Action/IconSize (Icon/Size/SM), set via --icon-size / --icon-inner-size
      colorSource:
        default: 'List/Item/Color/Text/Base (--icon-color = --_list-item-color)'
        hover: 'List/Item/Color/Text/Hover'
        active: 'List/Item/Color/Text/Active'
        disabled: 'List/Item/Color/Text/Disabled'
  - childTag: ds-accordion
    childMappingFile: ../../accordion/accordion.figma.md
    figmaComponentKey: d13c3342aa7aa7f21d6d6f94b317d22abe5c020e # accordion.figma.md → sets[0]
    note: 'Only variant=accordion. #item is slotted into the accordion summary; the item overrides header/summary background and summary padding-right.'

slots:
  - codeSlot: icon
    figmaSlot: icon
    part: item
    position: first
    content: open # ds-icon, ds-badge (docs, tests)
    preferred: [Icon, Badge]
    defaultFill: empty
    figmaPropertyKey: 'icon#6551:121' # ItemAccordion: icon#6558:97
    showPropertyKey: 'show icon#6551:0' # ItemAccordion: show icon#6558:0
    preferredNote: 'Icon wrapper set only. Badge is not in Figma yet, add it to the preferred instances once it is built (all four Item sets).'
  - codeSlot: content # plus the default slot — same #content
    figmaSlot: content
    part: content # #content wrapper (no @part); label and description sit before it
    position: after description
    content: open # overrides/extends label + description (h5 + span in tests)
    preferred: []
    defaultFill: empty
    figmaPropertyKey: 'content#6551:847' # ItemAccordion: content#6558:679
    showPropertyKey: 'show content#6551:726' # ItemAccordion: show content#6558:582
  - codeSlot: accordion-content
    figmaSlot: accordion content
    part: accordion-content
    position: only child
    content: open # slotted <p> or a nested ds-list (nested-accordion test)
    preferred: [List] # ItemAccordionInverted: ListInverted
    defaultFill: 'paragraph frame (padding Y = List/Item/Accordion/PaddingY) with one text node "Lorem ipsum dolor sit amet, consectetur adipisicing elit." — Text/Typo/Paragraph, Alias/Text/Color/Primary (InvertedPrimary in ItemAccordionInverted); same as the Accordion precedent, built on every open=true variant'
    figmaPropertyKey: 'accordion content#6558:776' # ItemAccordion and ItemAccordionInverted only; shown by the open axis, no show boolean (hardcoded hidden on open=false)

device: none # no breakpoint mixins

figmaCheck:
  stateless: { variant: [default] } # variant=default has no hover / active (not interactive), state=default only

tokens: # all names checked in Foundation 23.11.2026
  # sizes / spacing
  - {
      cssVar: --ds-list-item-size-base-min-height,
      figmaVariable: 🧩 Component/List/Item/Size/Base/MinHeight,
      resolved: true,
    } # 56
  - {
      cssVar: --ds-list-item-size-base-padding-y,
      figmaVariable: 🧩 Component/List/Item/Size/Base/PaddingY,
      resolved: true,
    } # 8
  - {
      cssVar: --ds-list-item-size-lg-min-height,
      figmaVariable: 🧩 Component/List/Item/Size/LG/MinHeight,
      resolved: true,
    } # 72
  - { cssVar: --ds-list-item-size-lg-padding-y, figmaVariable: 🧩 Component/List/Item/Size/LG/PaddingY, resolved: true } # 8
  - { cssVar: --ds-list-item-padding-x, figmaVariable: 🧩 Component/List/Item/PaddingX, resolved: true } # 4
  - { cssVar: --ds-list-item-gap, figmaVariable: 🧩 Component/List/Item/Gap, resolved: true } # 16
  - { cssVar: --ds-list-item-content-gap, figmaVariable: 🧩 Component/List/Item/ContentGap, resolved: true } # 1
  - { cssVar: --ds-list-item-border-width, figmaVariable: 🧩 Component/List/Item/Border/Width, resolved: true } # 2
  - { cssVar: --ds-list-item-radius, figmaVariable: 🧩 Component/List/Item/Radius, resolved: true } # 12, on the border line → no visible radius
  - {
      cssVar: --ds-list-item-accordion-padding-y,
      figmaVariable: 🧩 Component/List/Item/Accordion/PaddingY,
      resolved: true,
    }
  - { cssVar: --ds-list-item-action-icon-size, figmaVariable: 🧩 Component/List/Item/Action/IconSize, resolved: true } # 14
  # colors (base)
  - { cssVar: --ds-list-item-color-text-base, figmaVariable: 🧩 Component/List/Item/Color/Text/Base, resolved: true }
  - { cssVar: --ds-list-item-color-text-hover, figmaVariable: 🧩 Component/List/Item/Color/Text/Hover, resolved: true }
  - {
      cssVar: --ds-list-item-color-text-active,
      figmaVariable: 🧩 Component/List/Item/Color/Text/Active,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-color-text-disabled,
      figmaVariable: 🧩 Component/List/Item/Color/Text/Disabled,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-color-border-base,
      figmaVariable: 🧩 Component/List/Item/Color/Border/Base,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-color-border-hover,
      figmaVariable: 🧩 Component/List/Item/Color/Border/Hover,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-color-border-active,
      figmaVariable: 🧩 Component/List/Item/Color/Border/Active,
      resolved: true,
    }
  - { cssVar: --ds-list-item-background-base, figmaVariable: 🧩 Component/List/Item/Background/Base, resolved: true } # link / button / accordion header only
  - { cssVar: --ds-list-item-background-hover, figmaVariable: 🧩 Component/List/Item/Background/Hover, resolved: true }
  - {
      cssVar: --ds-list-item-background-active,
      figmaVariable: 🧩 Component/List/Item/Background/Active,
      resolved: true,
    }
  # colors (inverted → ItemInverted)
  - {
      cssVar: --ds-list-item-inverted-color-text-base,
      figmaVariable: 🧩 Component/List/Item/Inverted/Color/Text/Base,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-color-text-hover,
      figmaVariable: 🧩 Component/List/Item/Inverted/Color/Text/Hover,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-color-text-active,
      figmaVariable: 🧩 Component/List/Item/Inverted/Color/Text/Active,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-color-text-disabled,
      figmaVariable: 🧩 Component/List/Item/Inverted/Color/Text/Disabled,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-color-border-base,
      figmaVariable: 🧩 Component/List/Item/Inverted/Color/Border/Base,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-color-border-hover,
      figmaVariable: 🧩 Component/List/Item/Inverted/Color/Border/Hover,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-color-border-active,
      figmaVariable: 🧩 Component/List/Item/Inverted/Color/Border/Active,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-background-hover,
      figmaVariable: 🧩 Component/List/Item/Inverted/Background/Hover,
      resolved: true,
    }
  - {
      cssVar: --ds-list-item-inverted-background-active,
      figmaVariable: 🧩 Component/List/Item/Inverted/Background/Active,
      resolved: true,
    }
  # disabled badge (slotted ds-badge forced into its own disabled look)
  - {
      cssVar: --ds-badge-disabled-color-background,
      figmaVariable: 🧩 Component/Badge/Disabled/Color/Background,
      resolved: true,
    } # intentional reuse, applies to slotted badges only
  - { cssVar: --ds-badge-disabled-color-text, figmaVariable: 🧩 Component/Badge/Disabled/Color/Text, resolved: true }
  # nested ds-accordion marker (ItemAccordion, ItemAccordionInverted) — the marker keeps the accordion's own tokens (see code drift in Notes)
  - { cssVar: --ds-accordion-marker-width, figmaVariable: 🧩 Component/Accordion/Marker/Width, resolved: true }
  - { cssVar: --ds-accordion-marker-size, figmaVariable: 🧩 Component/Accordion/Marker/Size, resolved: true }
  - {
      cssVar: --ds-accordion-summary-color-active,
      figmaVariable: 🧩 Component/Accordion/Summary/Color/Active,
      resolved: true,
    }
  - { cssVar: --ds-icon-padding-base, figmaVariable: 🧩 Component/Icon/Padding/Base, resolved: true } # marker padding
  - { cssVar: --ds-icon-color-primary, figmaVariable: 🧩 Component/Icon/Color/Primary, resolved: true } # marker glyph default / disabled
  # accordion-content default fill (paragraph text, Accordion precedent) — not component code, slot default only
  - {
      cssVar: --ds-text-typo-paragraph-font-size,
      figmaVariable: 🧩 Component/Text/Typo/Paragraph/FontSize,
      resolved: true,
    }
  - {
      cssVar: --ds-text-typo-paragraph-font-weight,
      figmaVariable: 🧩 Component/Text/Typo/Paragraph/FontWeight,
      resolved: true,
    }
  - { cssVar: null, figmaVariable: 🔗 Alias/🔤 Text/Color/Primary, resolved: true } # slot default, ItemAccordion
  - { cssVar: null, figmaVariable: 🔗 Alias/🔤 Text/Color/InvertedPrimary, resolved: true } # slot default, ItemAccordionInverted
  # literal, not bound: no variable exists; the item fills its list in code (width: fill), Figma sets show it at a fixed 480
  - { cssVar: null, figmaVariable: null, literal: 'variant root width 480 (all four sets)', bind: false }
  - {
      cssVar: null,
      figmaVariable: null,
      literal: 'accordion-content width 480 (ItemAccordion, ItemAccordionInverted)',
      bind: false,
    }
  # focus — ignored as a state; focus tokens not bound
  # typography (composite tokens: FontFamily / FontSize / FontWeight / LineHeight / LetterSpacing / TextDecoration / TextTransform)
  - { cssVar: --ds-list-item-title-typo, figmaVariable: 🧩 Component/List/Item/Title/Typo/*, resolved: true } # label, label size=base
  - { cssVar: --ds-list-item-text-typo, figmaVariable: 🧩 Component/List/Item/Text/Typo/*, resolved: true } # description
  - { cssVar: --ds-heading-level-N-font-size, figmaVariable: 🧩 Component/Heading/Level/<N>/FontSize, resolved: true } # label size h1…h5 (N = 1…5); "intentional reuse" of ds-heading's scale; only font-size is overridden, other Title/Typo attributes stay

completeness: # every node × every attribute has a token above; no gaps
  - node: root (host) # horizontal-feeling grid, 1 column; width fills the list
    attributes: 'min height ✔ (size) · fill (variant link/button/accordion) ✔ Background/Base'
  - node: item (#item) # auto-layout row, align center
    attributes: 'padding X/Y ✔ · gap ✔ · border bottom 2px ✔ (width + color per state) · text color ✔ per state'
  - node: label
    attributes: 'family/size/weight/line-height/letter-spacing/decoration/transform ✔ Title/Typo/* (size per label size: Heading/Level/N/FontSize) · color ✔ inherits item text color per state'
  - node: description
    attributes: 'family/size/weight/line-height/letter-spacing/decoration/transform ✔ Text/Typo/* · color ✔ inherits item text color (inherited-context binding: code sets no color on the part)'
  - node: action-icon
    attributes: 'size ✔ Action/IconSize · color ✔ per state (--icon-color)'
  - node: accordion-content
    attributes: 'border bottom 2px ✔ Border/Width + Color/Border/Base (:after)'
```

Notes:

- **Disabled** also recolors slotted `ds-icon` / `ds-badge` (item.host.scss:319-335), not only the item's own parts.
- **Code drift to report, not fix:** (1) `--ds-heading-level-N-font-size` reused for label sizes; (2) description has no explicit color — it inherits the item color; (3) `--list-item-content-min-height` is computed from base tokens (not the lg ones) — verify in Phase 4 that lg `content` min height does not matter visually.
- **Phase 3 build notes (23.11.2026):**
  - Reactions (hover → hover, press → active) are set on all four Item sets, `variant=default` has none (no hover/active).
  - **Code drift to report, not fix:** the `ds-accordion` marker keeps its own colors. In `ItemAccordionInverted` the caret stays `Icon/Color/Primary` (default, active, disabled) and `Accordion/Summary/Color/Active`, only hover follows `List/Item/Inverted/Color/Text/Hover` (`--accordion-summary-color-hover`). On the dark surface that caret is dark on dark. The disabled item doesn't recolor the marker either.
  - `action-icon` is only on `variant=link|button`; `ItemAccordion` has a `marker` frame with a 14px `IconCaretDown` (rotated 180° when `open=true`) instead.
- **Open for Phase 2 (resolved, kept for the record):** variant vs top-level split for `accordion`; whether `accordion open` / `marker` / `marker position` are exposed on Item; the `show label` / `show description` defaults.

## Phase 2 proposal (23.11.2026) — signed off by the user (23.11.2026)

```yaml
proposal:
  sets: # top-level splits
    - { name: Item, axes: 'variant · size · label size · state · disabled', variants: 120 }
    - { name: ItemInverted, axes: same as Item, variants: 120 } # rule 2, instantiated by ListInverted
    - { name: ItemAccordion, axes: 'size · label size · open · state · disabled', variants: 96 } # rule 1: nests the accordion layers
    - { name: ItemAccordionInverted, axes: same as ItemAccordion, variants: 96 } # rule 2
  componentProperties:
    text: [label (node label, "Label"), description (node description, "Description")]
    boolean: # all default to the code default (false); the List slot default fill turns them on
      - { name: show label, bindsTo: label layer visible }
      - { name: show description, bindsTo: description layer visible }
      - { name: show icon, bindsTo: icon slot visible }
      - { name: show content, bindsTo: content slot visible }
    instanceSwap: [{ name: action icon, slotOf: ds-icon, sets: [Item, ItemInverted], onlyFor: 'variant=link|button' }]
    slot: [icon, content, accordion content (ItemAccordion only)]
  excluded: [labelLevel, accordionGroup, download, href, rel, target, accordionMarker, accordionMarkerPosition]
  # accordionMarker / accordionMarkerPosition excluded: crossing them (4 × 2) would give 768 variants on ItemAccordion
```

Grid sketch — `Item` (columns = `state` then `disabled`; `default` variant has no hover/active, so its rows are sparse; code default first = top-left):

```
                                 default  hover  active  disabled
variant=default  size=base  label size=base   [x]      –      –       [x]
                                 h1…h5 rows follow, same pattern
                 size=lg    label size=base…  [x]      –      –       [x]
variant=link     size=base  label size=base   [x]     [x]    [x]      [x]
                 …          h1…h5
                 size=lg    …
variant=button   (same as link)
```

`ItemAccordion`: rows `open` (false, true) → `size` (base, lg) → `label size`, columns `default · hover · active · disabled` (24 rows × 4 = 96).
