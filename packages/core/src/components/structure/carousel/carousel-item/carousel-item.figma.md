# carousel-item → Figma mapping

> **Status: draft (19.11.2026)** — Phase 1 done; Phase 2 proposal pending. Sub-component of
> `ds-carousel` (documentation owner, `../carousel/carousel.figma.md`).

```yaml
owner: ../carousel/carousel.figma.md # documentation owner; its frame is this file's figmaDocFrameNodeId
sets: # filled in by Phase 3
  - name: CarouselItem
    figmaComponentKey: null
    figmaMasterNodeId: null
figmaPage: Core / Structure
figmaDocFrameNodeId: null # = the owner's "Carousel Documentation" frame

props:
  - name: carouselVariant
    type: enum
    options: [slide, tile]
    default: slide
    drivenBy: ds-carousel.variant # @internal, "Set by ds-carousel"
    note: 'slide: full-width block, no padding / background, image (src) or slotted content; tile: padded tile with background, slotted label. Different layers → Phase 2 decides split vs. axis.'
  - name: selected
    type: boolean
    default: false
    note: 'public, set by ds-carousel from its value; tile only: background → Item/Selected/Color/Background. No visual effect on slide.'
  - name: color
    type: enum
    options: [purple, green, red, yellow]
    default: '(unset → default)'
    figmaOptions: [default, purple, green, red, yellow]
    note: 'tile only: background Item/<Color>/Color/Background/<Base|Hover|Active>'
  - name: navigation
    type: boolean
    figmaPropertyType: excluded # moves the padding onto the consumer's slotted <a>; same look as a tile
  - name: src
    type: string
    figmaPropertyType: excluded # image URL → slide content; Figma uses the open slot instead (user decision 19.11.2026)
  - name: name
    type: string
    figmaPropertyType: excluded # identifier
  - name: index
    type: number
    figmaPropertyType: excluded # @internal, set by ds-carousel; aria-label only
  - name: label # default slot, text in tile mode (product label)
    type: slot
    figmaPropertyType: text (tile) / open slot (slide) # Phase 2

states: # tile only (carousel-item.host.scss)
  figmaProperty: state
  options: [default, hover, focus, active]
  sources:
    hover: ':hover → Item/<Color>/Color/Background/Hover (carousel-item.host.scss:40)'
    focus: ':focus-visible → focus-shadow (carousel-item.host.scss:51)'
    active: ':active → Item/<Color>/Color/Background/Active (carousel-item.host.scss:46)'

nested:
  - childTag: '(focus ring)'
    figmaComponentKey: 2454d0fabf5c8fcb51b8b44de7a4fec90e9120c8 # Focus ring set, Core / Utilities
    note: 'tile state=focus'

slots:
  - codeSlot: ''
    figmaSlot: content
    part: '(host)'
    position: first
    content: open # slide: image / any content (src → slot, user decision 19.11.2026); tile: label text, or <a> with brand icon in navigation mode
    preferred: []
    defaultFill: empty # slide; "no content" placeholder may follow (user, 19.11.2026)

tokens: # names checked in the Foundation file (19.11.2026)
  - { cssVar: --ds-carousel-item-radius, figmaVariable: 🧩 Component/Carousel/Item/Radius, resolved: true } # 4
  - { cssVar: --ds-carousel-item-gap, figmaVariable: 🧩 Component/Carousel/Item/Gap, resolved: true } # 8
  - { cssVar: --ds-carousel-item-padding, figmaVariable: 🧩 Component/Carousel/Item/Padding, resolved: true } # 16
  - {
      cssVar: --ds-carousel-item-default-color-background-<base|hover|active>,
      figmaVariable: '🧩 Component/Carousel/Item/Default/Color/Background/<Base|Hover|Active>',
      resolved: true,
    }
  - {
      cssVar: --ds-carousel-item-selected-color-background,
      figmaVariable: 🧩 Component/Carousel/Item/Selected/Color/Background,
      resolved: true,
    }
  - {
      cssVar: '--ds-carousel-item-<purple|green|red|yellow>-color-background-<base|hover|active>',
      figmaVariable: '🧩 Component/Carousel/Item/<Color>/Color/Background/<Base|Hover|Active>',
      resolved: true,
    }
  - {
      cssVar: --ds-alias-interaction-focus-color-base,
      figmaVariable: 🔗 Alias/✨ Interaction/Focus/Color/Base,
      resolved: true,
    }
# Tile label (slotted text, no typography in code) — inherited-context bindings: color 🔗 Alias/🔤 Text/Color/Primary,
# size 📱 Device/🔤 Text/Size/Base/Device, weight 🔗 Alias/🔤 Text/Weight/Regular, family literal `Baloise Create Text`,
# line height 150% literal (measured 16 / 400 / 24px).
```

## Notes

- Measurements rows for this set live in the owner's file (`set: CarouselItem`).
