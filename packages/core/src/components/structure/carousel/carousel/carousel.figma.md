# carousel → Figma mapping

> **Status: draft (19.11.2026)** — Phases 1–2 confirmed; Phase 3 build in progress. Family:
> `ds-carousel` (owner) + `ds-carousel-item` (contained, `../carousel-item/carousel-item.figma.md`).

```yaml
sets: # filled in by Phase 3 — default set first
  - name: Carousel
    figmaComponentKey: null
    figmaMasterNodeId: null
figmaPage: Core / Structure
figmaDocFrameNodeId: null

anatomy: # merged family list, confirmed by the user 19.11.2026; letters follow the drawing in Phase 7
  - letter: A
    part: track
    description: 'The scrollable item track.'
  - letter: B
    subComponent: ds-carousel-item
    part: Carousel item (ds-carousel-item)
    description: 'Carousel Item is a single slide or product tile inside a ds-carousel.'
# @part track matches part="track" in render(). ds-carousel-item has no @part → one entry, no sub-letters.

props:
  - name: variant
    type: enum
    options: [slide, tile]
    default: slide
    note: 'slide: full-width slides, scroll-snap, arrows overlay the image; tile: padded tiles with gap, arrows beside the track, edge fade. Different layers → Phase 2.'
  - name: controls
    type: enum
    options: [dots, large, none]
    default: dots
    figmaOptions: [dots, large, none]
    note: 'dots → nested ds-pagination variant=dots (≤ 5 items PaginationDotsRow, > 5 PaginationDots); large → prev / next scroll buttons; none → neither. Adds / removes layers → Phase 2.'
  - name: itemsPerView
    type: "number | 'auto'"
    figmaPropertyType: excluded # item width = content (auto) or container / n — layout, shown as behavior
  - name: label
    type: string
    figmaPropertyType: excluded # aria-label of the track only
  - name: steps
    type: number
    figmaPropertyType: excluded # scroll behavior
  - name: value
    type: string
    figmaPropertyType: excluded # picks the selected item → set per CarouselItem instance (selected)

states:
  figmaProperty: state
  options: [default, focus] # track :focus-visible (carousel.host.scss:56); scroll-button hover / active live on the buttons
  sources:
    focus: ':focus-visible:not(:active) → focus-shadow (carousel.host.scss:56)'
componentStates: {} # no disabled / loading prop

nested:
  - childTag: ds-carousel-item
    childMappingFile: ../carousel-item/carousel-item.figma.md
    subComponent: true
    relation: contained
    figmaComponentKey: null # filled by Phase 3
  - childTag: ds-pagination
    childMappingFile: ../../navigation/pagination/pagination.figma.md
    figmaComponentKey: dbb5018a7b309e69f5f6a9945ab39d0a3f3c14dc # PaginationDotsRow (≤ 5 items); PaginationDots c184587805d3330c418dea09e7e0152d081a8a87 for > 5
    note: 'controls=dots only; slide: centered below the track, gap Carousel/Pagination/Gap; tile: directly below (0 gap, finding 1)'
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    fixedIcon: 'caret-left / caret-right, size sm → glyph IconCaretLeft / IconCaretRight nested directly, 14 × 14 (Icon/Size/SM)'
    colorSource:
      default: 'Carousel/ScrollBtn/Color/Active (active button, white)'
      disabled: 'Carousel/Control/Color (tile, disabled button, navy at 40 % opacity)'
  - childTag: '(focus ring)'
    figmaComponentKey: 2454d0fabf5c8fcb51b8b44de7a4fec90e9120c8
    note: 'track state=focus'

slots:
  - codeSlot: ''
    figmaSlot: items
    preferred: [CarouselItem]
    defaultFill: '3 × CarouselItem (slide) — first selected=true' # confirmed in Phase 2

variations: [] # no show boolean — Phase 2 confirms

tokens: # names checked in the Foundation file (19.11.2026); 34 Carousel variables
  - { cssVar: --ds-carousel-gap, figmaVariable: 🧩 Component/Carousel/Gap, resolved: true } # 16, tile track gap
  - { cssVar: --ds-carousel-radius, figmaVariable: 🧩 Component/Carousel/Radius, resolved: true } # 4, track
  - { cssVar: --ds-carousel-pagination-gap, figmaVariable: 🧩 Component/Carousel/Pagination/Gap, resolved: true } # 16, slide only
  - { cssVar: --ds-carousel-control-color, figmaVariable: 🧩 Component/Carousel/Control/Color, resolved: true } # navy, tile disabled button
  - {
      cssVar: --ds-carousel-scroll-fade-background,
      figmaVariable: 🧩 Component/Carousel/ScrollFade/Background,
      resolved: true,
    } # white → transparent gradient
  - { cssVar: --ds-carousel-scroll-fade-width, figmaVariable: 🧩 Component/Carousel/ScrollFade/Width, resolved: true } # 48
  - { cssVar: --ds-carousel-scroll-btn-size, figmaVariable: 🧩 Component/Carousel/ScrollBtn/Size, resolved: true } # 40
  - { cssVar: --ds-carousel-scroll-btn-radius, figmaVariable: 🧩 Component/Carousel/ScrollBtn/Radius, resolved: true } # 9999
  - { cssVar: --ds-carousel-scroll-btn-inset, figmaVariable: 🧩 Component/Carousel/ScrollBtn/Inset, resolved: true } # 16, slide
  - { cssVar: --ds-carousel-scroll-btn-gap, figmaVariable: 🧩 Component/Carousel/ScrollBtn/Gap, resolved: true } # 4, tile
  - {
      cssVar: --ds-carousel-scroll-btn-opacity-disabled,
      figmaVariable: 🧩 Component/Carousel/ScrollBtn/Opacity/Disabled,
      resolved: true,
    } # 0.4
  - {
      cssVar: '--ds-carousel-scroll-btn-background-active(-hover|-pressed)',
      figmaVariable: '🧩 Component/Carousel/ScrollBtn/Background/Active | ActiveHover | ActivePressed',
      resolved: true,
    }
  - {
      cssVar: --ds-carousel-scroll-btn-color-active,
      figmaVariable: 🧩 Component/Carousel/ScrollBtn/Color/Active,
      resolved: true,
    } # white
  - {
      cssVar: --ds-alias-interaction-focus-color-base,
      figmaVariable: 🔗 Alias/✨ Interaction/Focus/Color/Base,
      resolved: true,
    }
# No breakpoint mixins → no device: section.

measurements: # confirmed by the user 19.11.2026; measured on the dev server (1280px)
  drawnOption: slide
  options: []
  behavior:
    width: fill # carousel; tile items hug (itemsPerView → equal share)
    overflow: scroll # items beyond the track scroll horizontally
  rows:
    - {
        set: Carousel,
        property: Arrow size,
        kind: size,
        group: fixed,
        show: drawn,
        instance: large,
        source: carousel.host.scss:107,
        values: { base: { px: 40, token: 🧩 Component/Carousel/ScrollBtn/Size } },
      }
    - {
        set: Carousel,
        property: Icon size,
        kind: size,
        group: fixed,
        show: drawn,
        instance: large,
        source: 'carousel.tsx:499 (size="sm")',
        values: { base: { px: 14, token: 🧩 Component/Icon/Size/SM } },
      }
    - {
        set: Carousel,
        property: Arrow inset,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: large,
        source: carousel.host.scss:134,
        values: { base: { px: 16, token: 🧩 Component/Carousel/ScrollBtn/Inset } },
      }
    - {
        set: Carousel,
        property: Pagination gap,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: main,
        source: carousel.host.scss:77,
        values: { base: { px: 16, token: 🧩 Component/Carousel/Pagination/Gap } },
      }
    - {
        set: Carousel,
        property: Radius,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: main,
        source: 'carousel.host.scss:49, carousel-item.host.scss:11',
        values: { base: { px: 4, token: 🧩 Component/Carousel/Radius } },
      }
    - {
        set: Carousel,
        property: Focus ring,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: focus,
        source: carousel.host.scss:56,
        values: { base: { px: '2 + 5', token: 🔗 Alias/✨ Interaction/Focus/Size/Inner + Outer } },
      }
    - {
        set: CarouselTile,
        property: Gap,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: tile,
        source: carousel.host.scss:154,
        values: { base: { px: 16, token: 🧩 Component/Carousel/Gap } },
      }
    - {
        set: CarouselTile,
        property: Arrow gap,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: tile,
        source: carousel.host.scss:241,
        values: { base: { px: 4, token: 🧩 Component/Carousel/ScrollBtn/Gap } },
      }
    - {
        set: CarouselTile,
        property: Fade width,
        kind: size,
        group: fixed,
        show: drawn,
        instance: tile,
        source: carousel.host.scss:165,
        values: { base: { px: 48, token: 🧩 Component/Carousel/ScrollFade/Width } },
      }
    - {
        set: CarouselItem,
        property: Padding,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: tile,
        source: carousel-item.host.scss:31,
        values: { base: { px: 16, token: 🧩 Component/Carousel/Item/Padding } },
      }
    - {
        set: CarouselItem,
        property: Radius,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: tile,
        source: carousel-item.host.scss:32,
        values: { base: { px: 4, token: 🧩 Component/Carousel/Item/Radius } },
      }
    - {
        set: CarouselItem,
        property: Text (label),
        kind: type,
        group: typography,
        show: drawn,
        instance: tile,
        source: '(inherited)',
        values:
          {
            base:
              {
                px: 16,
                weight: 400,
                lineHeight: 1.5,
                family: BaloiseCreateText,
                token: '🔗 Alias/🔤 Text (inherited context)',
              },
          },
      }
    - {
        set: Carousel,
        property: Arrow radius,
        kind: shape,
        group: fixed,
        show: skip,
        reason: 'circle (9999)',
        values: { base: { px: 9999, token: 🧩 Component/Carousel/ScrollBtn/Radius } },
      }
    - {
        set: CarouselItem,
        property: Gap,
        kind: spacing,
        group: inner spacing,
        show: skip,
        reason: 'only between ≥ 2 slotted children (navigation mode); a text tile has one',
        values: { base: { px: 8, token: 🧩 Component/Carousel/Item/Gap } },
      }
    - {
        set: Carousel,
        property: Slide height,
        kind: size,
        group: derived,
        show: skip,
        reason: 'set by the slide content (image)',
        values: { base: { px: 640 } },
      }
    - {
        set: CarouselTile,
        property: Disabled arrow opacity,
        kind: shape,
        group: fixed,
        show: skip,
        reason: 'color, not geometry',
        values: { base: { px: 0.4, token: 🧩 Component/Carousel/ScrollBtn/Opacity/Disabled } },
      }
```

## Phase 2 — grouping (approved by the user 19.11.2026)

Case: **top-level splits** (rule 1) — owner `variant` and the item's `carouselVariant` (`drivenBy`)
change the layers; each set is a 2-axis grid or a single component. Build order: `CarouselArrow`,
`CarouselItem`, `CarouselItemTile` → `Carousel`, `CarouselTile`.

| Set                | Source                                                               | Axes (code default first)                                                                                                  | Variants |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| `CarouselArrow`    | owner's `.scroll-btn` — Figma-only helper (user decision 19.11.2026) | `direction` (prev · next) × `state` (default · hover · pressed) + `disabled=true` (blocked)                                | 8        |
| `CarouselItem`     | item, `carouselVariant=slide`                                        | — (open `content` SLOT, empty; `selected` has no visual)                                                                   | 1        |
| `CarouselItemTile` | item, `carouselVariant=tile`                                         | `color` (default · purple · green · red · yellow) × `state` (default · hover · focus · active) + `selected=true` per state | 40       |
| `Carousel`         | owner, `variant=slide`                                               | `controls` (dots · large · none) × `state` (default · focus)                                                               | 6        |
| `CarouselTile`     | owner, `variant=tile`                                                | `controls` × `state`                                                                                                       | 6        |

Count: **61** (≤ 500).

```
CarouselArrow        default  hover  pressed │ disabled
  direction=prev     (‹)      (‹)    (‹)     │ ‹ 40 %
  direction=next     (›)      (›)    (›)     │ › 40 %
CarouselItemTile     default hover focus active │ selected: default hover focus active
  color=default … yellow (5 rows)
Carousel             default                     focus
  controls=dots      [slide slide slide] ○●○     + ring
  controls=large     [slide  (›)]                + ring
  controls=none      [slide]                     + ring
CarouselTile         default                     focus
  controls=dots      [▣ ▢ ▢ ▢ ▢ fade] 1 / 6      + ring
  controls=large     ‹ [▣ ▢ ▢ ▢ fade] (›)        + ring
  controls=none      [▣ ▢ ▢ ▢ ▢ fade]            + ring
```

- **controls = variant axis** (user decision 19.11.2026): track and items stay; controls only add
  the Pagination instance or the `CarouselArrow` instances.
- **Slots:** owner `items` (preferred `CarouselItem` / `CarouselItemTile`): `Carousel` 3 × `CarouselItem`,
  `CarouselTile` 5 × `CarouselItemTile` "Item 1…5", first `selected=true`. Each `CarouselItem` has an
  empty open `content` slot.
- **Slide sample size 640 × 360** (user decision 19.11.2026): sample content size of the empty slot,
  like sample text — no token exists; designers resize or fill it.
- **Text property:** `label` on `CarouselItemTile` (default `Label`). Generated text: Pagination counter
  (instance override `1 / 6`).
- **Representative state:** first item selected → slide hides `‹`; tile shows `‹` disabled, `›` active,
  right edge fade (`ScrollFade/Background` → transparent, 48).
- **Nested:** `PaginationDotsRow` (slide, 3 items), `PaginationDots` (tile, 6 items); caret glyphs in
  `CarouselArrow`; focus ring on `state=focus`.
- **Not represented:** `itemsPerView` (layout), `navigation` (same look), `src` (→ slot).
- **Variations:** none (no `show` boolean).

## Notes

- **Arrow disabled opacity (19.11.2026):** `ScrollBtn/Opacity/Disabled` (0.4) can't be bound — Figma reads a
  bound layer opacity as 0–100 %, so it rendered 0.4 %. Applied as the resolved literal `0.4`, unbound
  (same exception class as STRING line heights; `TODO.md`).
- **State option `active`** (not `pressed` as in the Phase 2 sketch): convention `default · hover · focus · active`
  (CSS `:active`); token `ScrollBtn/Background/ActivePressed`.

- **Slide content (user decision 19.11.2026):** slides are a native open `SLOT` (empty by default;
  maybe "no content" later) — `src` images can't be placed through the Plugin API
  (`createImageAsync` unsupported) and there's no imagery token.
- **Set names** (`Carousel`, `CarouselTile`, `CarouselItem`) are working names until Phase 2.
- **Findings (code, not fixed):**
  1. `variant=tile` + `controls=dots`: 0px between track and pagination — `--carousel-pagination-gap`
     only applies to `.is-slide` (host 88 = 56 + 32).
  2. Colored tiles: `:host(.is-tile.is-<color>)` comes after `.is-selected` with equal specificity →
     `selected` has no visible effect on colored tiles (selected green tile measured green base).
  3. `carousel.host.scss:183–188`: literal `calc(2.5rem + 0.25rem)` for the fade offset — duplicates
     `ScrollBtn/Size + ScrollBtn/Gap`.
  4. Track `aria-label` falls back to `i18n.scrollLeft` instead of a region label.
  5. Slide arrows hide at the ends; tile arrows show a disabled state — inconsistent.
