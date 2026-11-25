# carousel → Figma validation

Run 23.11.2026 (re-run after repair iteration 1) against file `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Structure` (`6231:423`), frame
`Carousel Documentation` (`6388:1203`). Read-only. Family: `ds-carousel` (owner) + `ds-carousel-item`
(no Figma set — slot content, user decision 23.11.2026; `carousel-item.figma.md` has `sets: []`).

## 2. Header (`6388:1204`)

| Check                  | Result | Evidence                                                                                                                               |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| kicker / component     | pass   | `Core / Structure` / `Carousel`                                                                                                        |
| lead                   | pass   | equals the JSDoc lead of `carousel.tsx`                                                                                                |
| review-status          | pass   | main component `status=review`                                                                                                         |
| VERSION / LAST UPDATED | pass   | `v0.1.0` = `packages/core/package.json`; `23.11.2026`                                                                                  |
| links                  | pass   | storybook `…/docs/components-structure-carousel-carousel--carousel`, toky `?filter=carousel`, github `…/components/structure/carousel` |

## 3. Prop / state mapping

| Check                            | Result | Evidence                                                                                                                                         |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CarouselArrow` (`6395:1718`)    | pass   | `position` side·below, `direction` prev·next, `state` default·hover·active, `disabled` false·true — 16 variants, first = side/prev/default/false |
| `Carousel` (`6568:3341`)         | pass   | `controls` dots·dots counter·large·large-below·none, 5 variants, one `items` SLOT property                                                       |
| `CarouselTile` (`6568:3381`)     | pass   | same axes, 5 variants, one `items` SLOT property                                                                                                 |
| Naming                           | pass   | lowercase props and options; flat PascalCase sets; sub-labels equal set names                                                                    |
| No focus / `state` on owner sets | pass   | removed by user decision 23.11.2026; `state` only holds interaction states on `CarouselArrow`                                                    |
| Top-level split rule 1           | pass   | `Carousel` / `CarouselTile` = `variant`; 16 + 5 + 5 = 26 variants (≤ 500)                                                                        |
| Text properties                  | pass   | none expected, none present; placeholder hint and counter text are generated                                                                     |

## 4. Token and nested-component bindings

| Check                                      | Result | Evidence                                                                                                                                                                                                     |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Every bound variable is remote Foundation  | pass   | 0 local; ScrollBtn/{Size, Radius, Inset, Gap, Background/_, Color/_}, ScrollBtnBelow/{Gap, ButtonGap}, Pagination/Gap, Gap, Radius, ScrollFade/Width, Icon/{Size, Padding}/SM, Space/0, Surface/Grey, Text/* |
| Bound paint values = resolved values       | pass   | 0 mismatches; `fade-end` gradient stop 0 bound `ScrollFade/Background`, stop 1 `transparent` literal (documented exception)                                                                                  |
| Tile `track` spacing bound                 | pass   | `CarouselTile` tracks bound `Global/Dimension/Space/0`; re-run over all 26 variants: 0 issues, 302 bindings all remote, 34 paints = resolved values                                                          |
| Nested keys                                | pass   | `PaginationDotsRow` `dbb5018a` ×2, `PaginationDots` `c1845878` ×2, `CarouselArrow` `bb92ae32` ×7 (large 1+2, tile large 2, large-below 2), none exposed                                                      |
| Glyphs nested directly, fill = colorSource | pass   | 16 × `IconCaretLeft` / `IconCaretRight` in `CarouselArrow`; active `ScrollBtn/Color/Active`; side disabled `Control/Color` at 40 % (literal opacity, `TODO.md`); below disabled `ScrollBtn/Color/Disabled`   |
| Slots                                      | pass   | every variant of `Carousel` / `CarouselTile` holds an `items` SLOT bound to the set's property (640 × 360 / 600 × 56 / 512 × 56), grey placeholder inside; no preferred instances                            |
| Interactions                               | pass   | `CarouselArrow` default → hover (ON_HOVER) / active (ON_PRESS) and hover → active, per position × direction; none elsewhere                                                                                  |

## 5. Layout

| Check                      | Result       | Evidence                                                                                                                                         |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Outer stroke               | pass         | all sets: weight 2, dash [10,5], radius 5, stroke var = template                                                                                 |
| Dividers count             | pass         | `CarouselArrow` col 3/3 row 3/3; `Carousel`, `CarouselTile` row 4/4, col 0/0                                                                     |
| Geometry / order / renders | pass         | on cell boundaries (e.g. `Carousel` rows y 448 … 1792); `Column Labels`, set, `Grid`; rows `absoluteRenderBounds` set, cols render on screenshot |
| Divider styling            | pass         | col RECTANGLE strokeLeft 2, row LINE stroke 2, dash [10,5], bound — = template                                                                   |
| Labels centred             | pass         | `CarouselArrow` columns 37/109/181/253 vs 36/108/180/252, lanes ±1; `Carousel` / `CarouselTile` row labels ±1                                    |
| Ordering                   | pass         | default variant first and top-left; `controls` options in code order with `dots counter` after `dots`                                            |
| Column Labels strip        | pass (noted) | empty on `Carousel` / `CarouselTile` (no column axis); `controls` lane carries the labels                                                        |
| Component Sets column      | pass         | 3771 = Documentation column 3771 (`FILL`), sets 3628 — nothing clipped                                                                           |
| Variations                 | pass         | placeholder deleted (no `show` boolean); sections copy-me, anatomy, measurements                                                                 |

## 6. Snapshots

| Check                          | Result                | Evidence                                                                                                                     |
| ------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Grid lines on screenshot       | pass                  | screenshot of `6388:1213`                                                                                                    |
| slides (dots / none)           | pass                  | grey slot placeholder instead of the image (user decision); track radius, 16px to pagination, `‹` disabled, first dot active |
| slides-with-large-controls     | pass                  | `›` round navy, inset 16, `‹` absent on the first slide                                                                      |
| slides-with-below-controls     | pass                  | arrows centered below, prev grey disabled, 56px between, 16px below the track                                                |
| product                        | pass                  | disabled `‹` + 4px + track + 4px + `›`, right edge fade                                                                      |
| product-with-dots              | pass (stale snapshot) | counter `1 / 6`; Figma 16px between track and pagination, snapshot 0px (pre-fix, `/update-screenshots`)                      |
| item backgrounds / brand-icons | skipped               | items are slot content (no set), #335 removed item colors                                                                    |

## Verdict

**pass** — tile `track` spacing fixed in repair iteration 1.

## Repair log

### Iteration 1 (23.11.2026)

- **Tile `track` spacing unbound** — `6568:3381` variants (5): `itemSpacing` bound to `🌐 Global/📏 Dimension/Space/0`.
  Read back: bound, variant sizes unchanged (600 × 104 / 104 / 56 / 112 / 56). Fixed.
