# carousel → Figma mapping

> **Status: draft (23.11.2026)** — Phase 3 build in progress. Family: `ds-carousel` (owner) +
> `ds-carousel-item` (contained) — **no item sets in Figma** (user decision 23.11.2026): the track is one
> basic `items` slot, so UX designers aren't confused by item variants. `large-below` (#310) included (23.11.2026).

```yaml
sets: # default set first
  - name: Carousel
    figmaComponentKey: a341bcc71f5c305758a779036926c7d44b5f3d72
    figmaMasterNodeId: '6568:3341'
  - name: CarouselTile
    figmaComponentKey: b6abcf6527f238c68cd7b8833dd3cc5c17802539
    figmaMasterNodeId: '6568:3381'
  - name: CarouselArrow # Figma-only helper (user decision 19.11.2026)
    figmaComponentKey: bb92ae32362766b2f0f47559c994fdda9b07c809
    figmaMasterNodeId: '6395:1718'
figmaPage: Core / Structure
figmaDocFrameNodeId: '6388:1203'

anatomy: # letters follow the drawing (Phase 7, user decision 23.11.2026: two instances, arrows + pagination are marked)
  - letter: A
    part: track
    description: 'The scrollable area. The items go into its single items slot.'
  - letter: B
    part: scroll button
    description: 'Previous / next arrow, shown on the track (large) or below it (large-below).'
    marker: 'CarouselArrow on Carousel (large)' # no @part in code
  - letter: C
    part: pagination
    description: 'Dots (up to 5 items) or a counter (more than 5) between the previous / next buttons.'
    marker: 'pagination on Carousel (dots)' # no @part in code
# Only `track` is a @part in render(); B and C are marked at the user's request. ds-carousel-item has no @part and no Figma set (slot content).

props:
  - name: variant
    type: enum
    options: [slide, tile]
    default: slide
    note: 'slide: full-width slides, scroll-snap, arrows overlay the image; tile: padded tiles with gap, arrows beside the track, edge fade. Different layers → Phase 2.'
  - name: controls
    type: enum
    options: [dots, large, large-below, none]
    default: dots
    figmaOptions: [dots, dots counter, large, large-below, none] # `dots counter` is Figma-only (user decision 23.11.2026): code shows the counter instead of the dot row once there are more than 5 items
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
    figmaPropertyType: excluded # picks the selected item — items are slot content, not built

states: null # track :focus-visible is not shown in Figma (user decision 23.11.2026); scroll-button hover / active live on CarouselArrow
componentStates: {} # no disabled / loading prop

nested:
  - childTag: ds-carousel-item
    childMappingFile: ../carousel-item/carousel-item.figma.md
    subComponent: true
    relation: contained
    figmaComponentKey: null # no Figma set (user decision 23.11.2026) — slot content
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

slots:
  - codeSlot: ''
    figmaSlot: items
    preferred: []
    defaultFill: 'placeholder — frame filling the slot, Alias/Surface/Grey, centered hint "Slot: items" (Alias/Text tokens); designers replace it' # user decision 23.11.2026; sample size slide 640 × 360 / tile 600 × 56

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
  - {
      cssVar: --ds-carousel-scroll-btn-background-disabled,
      figmaVariable: 🧩 Component/Carousel/ScrollBtn/Background/Disabled,
      resolved: true,
    } # grey 232, large-below disabled (#310)
  - {
      cssVar: --ds-carousel-scroll-btn-color-disabled,
      figmaVariable: 🧩 Component/Carousel/ScrollBtn/Color/Disabled,
      resolved: true,
    } # grey 49, large-below disabled
  - {
      cssVar: --ds-carousel-scroll-btn-below-gap,
      figmaVariable: 🧩 Component/Carousel/ScrollBtnBelow/Gap,
      resolved: true,
    } # 16
  - {
      cssVar: --ds-carousel-scroll-btn-below-button-gap,
      figmaVariable: 🧩 Component/Carousel/ScrollBtnBelow/ButtonGap,
      resolved: true,
    } # 56
# No breakpoint mixins → no device: section.

measurements: # confirmed by the user 19.11.2026; measured on the dev server (1280px)
  drawnOption: dots # drawing: Carousel (dots, large, large-below) + CarouselTile (large), 224px wide; numbering 1–9 follows size → spacing → shape (Phase 8, 23.11.2026)
  options: []
  behavior:
    width: fill # carousel; tile items hug (itemsPerView → equal share)
    overflow: scroll # items beyond the track scroll horizontally (card shows CarouselTile, Fill ↔ · Scrolls)
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
        property: Below gap,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: large-below,
        source: carousel.host.scss (scroll-btn-below-group margin-top),
        values: { base: { px: 16, token: 🧩 Component/Carousel/ScrollBtnBelow/Gap } },
      }
    - {
        set: Carousel,
        property: Below arrow gap,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: large-below,
        source: carousel.host.scss (scroll-btn-below-group gap),
        values: { base: { px: 56, token: 🧩 Component/Carousel/ScrollBtnBelow/ButtonGap } },
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
        set: Carousel,
        property: Radius,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: main,
        source: carousel.host.scss:49,
        values: { base: { px: 4, token: 🧩 Component/Carousel/Radius } },
      }
    - {
        set: CarouselTile,
        property: Gap,
        kind: spacing,
        group: inner spacing,
        show: skip,
        reason: 'gap between items — the items are one slot, not representable in Figma',
        source: carousel.host.scss:154,
        values: { base: { px: 16, token: 🧩 Component/Carousel/Gap } },
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

## Phase 2 — grouping (approved 19.11.2026, revised 23.11.2026)

Case: **top-level split** (rule 1) on the owner's `variant`. Items are **not** built: the track is one
basic `items` slot (user decision 23.11.2026 — `CarouselItem` / `CarouselItemTile` deleted).
Build order: `CarouselArrow` → `Carousel`, `CarouselTile`.

| Set             | Source                                                                                     | Axes (code default first)                                                                                                                                                                                       | Variants |
| --------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `CarouselArrow` | owner's `.scroll-btn` / `.scroll-btn-below` — Figma-only helper (user decision 19.11.2026) | `position` (side · below) × `direction` (prev · next) × `state` (default · hover · active) + `disabled=true` (blocked; side: 40 % opacity, below: `ScrollBtn/Background/Disabled` + `ScrollBtn/Color/Disabled`) | 16       |
| `Carousel`      | owner, `variant=slide`                                                                     | `controls` (dots · dots counter · large · large-below · none)                                                                                                                                                   | 5        |
| `CarouselTile`  | owner, `variant=tile`                                                                      | `controls`                                                                                                                                                                                                      | 5        |

Count: **26** (≤ 500); the `state=focus` variants were removed (user decision 23.11.2026). `large-below` (#310) included (user decision 23.11.2026): arrows centered below the
track, `ScrollBtnBelow/Gap` 16 above, `ScrollBtnBelow/ButtonGap` 56 between.

- **controls = variant axis** (user decision 19.11.2026): the track stays; controls only add the
  Pagination instance or the `CarouselArrow` instances.
- **Slot:** owner `items` — one basic slot, no preferred instances, default content = the grey "Slot: items" placeholder. Sample size slide 640 × 360
  (user decision 19.11.2026), tile 600 × 56 (code's product case) — no token exists.
- **Representative state:** first item selected → slide hides `‹` (Pagination `‹` disabled, first dot
  active); tile shows `‹` disabled, `›` active, right edge fade (`ScrollFade/Background` → transparent, 48).
- **Nested:** `PaginationDotsRow` (slide), `PaginationDots` (tile, counter `1 / 6`); caret glyphs in
  `CarouselArrow`; focus ring on `state=focus`.
- **Not represented:** `itemsPerView`, item `color` / `selected` / `navigation` / `src` (slot content).
- **Variations:** none (no `show` boolean).

## Notes

- **Focus removed (user decision 23.11.2026):** no `state` axis and no focus ring on `Carousel` / `CarouselTile`
  (the code's track `:focus-visible` ring is not drawn). Sets recombined with `controls` as the only axis,
  shown as rows; their Column Labels strip is empty.
- **Tile spacing fixed in code (23.11.2026):** `margin-top: var(--_carousel-pagination-gap)` now also applies
  to `.is-tile .pagination` (changeset `flat-mails-help`); `CarouselTile` `dots` / `dots counter` bind their
  `itemSpacing` to `Carousel/Pagination/Gap` (16). The `pagination-dots` tile snapshots need `/update-screenshots`.

- **#335 (main, merged 23.11.2026):** `ds-carousel-item` lost its `color` prop and every item background /
  selected token (items are plain slot content now — consistent with the slot-only decision). The tile
  focus now drops the edge fade (`.carousel-outer:has(:focus-visible)`) → `CarouselTile` `state=focus`
  variants hide `fade-end` (structurally absent, no boolean). The fade now follows the track's clip edge
  (7px past the layout box for the focus ring); Figma keeps it at the track edge (clipped) — minor.

- **Dots variants (user decision 23.11.2026):** `dots` = `PaginationDotsRow` (≤ 5 items, first dot active),
  `dots counter` = `PaginationDots` `1 / 6` (> 5 items); both sets recombined so the option order is
  dots · dots counter · large · large-below · none.
- **Findings (23.11.2026):** (a) `CarouselTile` had 0px between track
  and pagination (code) — fixed, see above; (b) in tile `large` the 4px arrow gap is smaller
  than the 5px focus ring (code); not shown in Figma since focus was removed.

- **Edge fade gradient (23.11.2026):** `CarouselTile` `fade-end` binds the solid stop to `ScrollFade/Background`;
  the second stop is `transparent` (code: CSS keyword), a literal — a variable-bound stop can't carry alpha 0
  (probe: bound stop reads alpha 1).
- **Counts:** `CarouselArrow` 16, `Carousel` 5, `CarouselTile` 5 variants; items slot is one `SLOT` property
  (`items`) shared by every variant of a set.

- **Arrow disabled opacity (19.11.2026):** `ScrollBtn/Opacity/Disabled` (0.4) can't be bound — Figma reads a
  bound layer opacity as 0–100 %, so it rendered 0.4 %. Applied as the resolved literal `0.4`, unbound
  (same exception class as STRING line heights; `TODO.md`).
- **State option `active`** (not `pressed` as in the Phase 2 sketch): convention `default · hover · focus · active`
  (CSS `:active`); token `ScrollBtn/Background/ActivePressed`.

- **Slide content (user decision 19.11.2026):** slides are a native open `SLOT` (empty by default;
  maybe "no content" later) — `src` images can't be placed through the Plugin API
  (`createImageAsync` unsupported) and there's no imagery token.
- **Findings (code, not fixed):**
  1. ~~`variant=tile` + `controls=dots`: 0px between track and pagination~~ — fixed in code (23.11.2026).
  2. ~~Colored tiles: `selected` has no visible effect~~ — obsolete, #335 removed item colors.
  3. `carousel.host.scss:183–188`: literal `calc(2.5rem + 0.25rem)` for the fade offset — duplicates
     `ScrollBtn/Size + ScrollBtn/Gap`.
  4. Track `aria-label` falls back to `i18n.scrollLeft` instead of a region label.
  5. Slide arrows hide at the ends; tile arrows show a disabled state — inconsistent.
