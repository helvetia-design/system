# carousel-item → Figma mapping

> **Status: not built (23.11.2026)** — sub-component of `ds-carousel` (documentation owner,
> `../carousel/carousel.figma.md`). **No Figma set** (user decision 23.11.2026): the owner's track is one
> basic `items` slot, so item variants don't confuse UX designers. `CarouselItem` (slide) and
> `CarouselItemTile` (40 variants), built on 19.11.2026, were deleted.

```yaml
owner: ../carousel/carousel.figma.md
sets: [] # none — slot content of the owner
figmaPage: Core / Structure
figmaDocFrameNodeId: null # = the owner's "Carousel Documentation" frame

props: # analysed in Phase 1 (19.11.2026), kept for a later decision
  - { name: carouselVariant, type: enum, options: [slide, tile], drivenBy: ds-carousel.variant }
  - { name: selected, type: boolean, note: 'no visual effect since #335' }
  - { name: navigation, type: boolean }
  - { name: src, type: string }
  - { name: name, type: string }
  - { name: index, type: number, note: '@internal' }

# Item color / background tokens (Carousel/Item/<Default|Purple|…>/Color/Background/*, Selected) and the `color` prop
# were removed on main in #335 (merged 23.11.2026). Remaining item tokens: Carousel/Item/{Radius, Gap, Padding}.
```
