# pagination → Figma validation

Run 19.11.2026 (re-run after repair iteration 1) against file `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Navigation` (`6354:1379`), frame
`Pagination Documentation` (`6354:1383`). Read-only.

## 2. Header (`6354:1384`)

| Check         | Result | Evidence                                                                                                                                           |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| kicker        | pass   | `Core / Navigation`                                                                                                                                |
| component     | pass   | `Pagination`                                                                                                                                       |
| lead          | pass   | equals JSDoc lead verbatim                                                                                                                         |
| review-status | pass   | main component `status=review` (`2191:97`)                                                                                                         |
| VERSION       | pass   | `v0.1.0` = `packages/core/package.json`                                                                                                            |
| LAST UPDATED  | pass   | `19.11.2026` (Phase 3 run)                                                                                                                         |
| links         | pass   | storybook `…/docs/components-navigation-pagination-pagination--pagination`, toky `?filter=pagination`, github `…/components/navigation/pagination` |

## 3. Prop / state mapping

| Check                               | Result | Evidence                                                                                                      |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Pagination props                    | pass   | `6356:955`: `size` VARIANT `base\|sm` def base, `disabled` VARIANT `false\|true` def false — nothing else     |
| PaginationDots / DotsRow props      | pass   | `6356:1030`, `6356:1104`: `disabled` `false\|true` only                                                       |
| Naming                              | pass   | lowercase props/options; sets `Pagination`, `PaginationDots`, `PaginationDotsRow`; sub-labels equal set names |
| No `state` axis, `disabled` blocked | pass   | no interaction states in code; `disabled=true` 1 column per set                                               |
| Text properties                     | pass   | none expected, none present; generated text (page numbers, "…", counter) unbound                              |
| Top-level split rule 1              | pass   | 3 sets, matching `sets:`; 4 + 2 + 2 variants (≤ 500)                                                          |

## 4. Token and nested-component bindings

| Check                                                   | Result                    | Evidence                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every bound variable is remote Foundation, in `tokens:` | pass                      | 0 local; names: Pagination/Size/_/Gap, */Ellipsis/Width, Ellipsis/Typo/FontSize·FontWeight, Ellipsis/Color/Text/Base·Disabled, Dots/* (MarginInline, Gap, Radius, Min/MaxWidth, MinHeight, Color/Background·Text, Counter·CounterValue/Typo, Marker/Size·Radius·Color/_), Space/0, Button/Size/*/MinWidth |
| Bound paint values = resolved values                    | pass                      | 0 mismatches across all fills                                                                                                                                                                                                                                                                             |
| Nav item spacing bound                                  | pass                      | `6355:422`, `6356:482`, `6356:588`, `6356:694`: `itemSpacing` 0 bound `🌐 Global/📏 Dimension/Space/0`; re-run walk of all 8 variants: 0 unbound spacing, 660 bindings all remote, 24 paints = resolved values                                                                                            |
| Nested Button key                                       | pass                      | 36 instances, all `Button` `f728631ba607a4e4d0519f950152963a105f2f98`, none exposed                                                                                                                                                                                                                       |
| Glyphs nested directly, caret swap                      | pass                      | `IconCaretLeft` / `IconCaretRight` in every visible previous / next                                                                                                                                                                                                                                       |
| Glyph fill = colorSource                                | pass                      | every visible glyph `Button/Color/Ghost/Base/Text` (default); disabled variants hide previous / next                                                                                                                                                                                                      |
| Icon size `size=base`                                   | pass (accepted deviation) | `6355:422` previous / next `icon` 16 × 16 `Icon/Size/Base` vs. 24 `Icon/Size/MD` in code — not overridable on a Button instance; accepted by the user 19.11.2026 (`pagination.figma.md` Notes, `TODO.md`). sm / dots: 14 × 14 `Icon/Size/SM`                                                              |
| Slots / drivenBy / interactions                         | pass                      | none in the mapping; no reactions on any variant                                                                                                                                                                                                                                                          |

## 5. Layout

| Check                | Result | Evidence                                                                                                                                   |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Outer stroke         | pass   | all 3 sets: weight 2, dash [10,5], radius 5, stroke var `…/13:7325` = template                                                             |
| Dividers count       | pass   | Pagination col 1/1, row 1/1; Dots col 1/1, row 0/0; DotsRow col 1/1, row 0/0                                                               |
| Divider geometry     | pass   | Pagination col x 512 h 160, row y 80 w 1024; dots col x 199 h 64                                                                           |
| Layer order          | pass   | `Column Labels`, set, `Grid` in each `Column + Box`                                                                                        |
| Renders              | pass   | rows `absoluteRenderBounds` non-empty; cols visible on screenshot `6354:1393`                                                              |
| Divider styling      | pass   | col RECTANGLE 0.01 wide, strokeLeft 2, dash [10,5], bound; row LINE stroke 2, dash [10,5], bound — = template                              |
| Labels centred       | pass   | Pagination: `disabled` 513 vs 512, `false` 256, `true` 768; rows `base` 96.5 vs 96, `sm` 176.5 vs 176; dots: 200/100/299 vs 199/99.5/298.5 |
| Ordering             | pass   | top-left / first layer = `size=base, disabled=false`; `disabled=false` first                                                               |
| Variations structure | pass   | placeholder deleted; sections `copy-me`, `anatomy`, `measurements`                                                                         |

## 6. Snapshots

| Check                    | Result  | Evidence                                                                                                                                                                                         |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Grid lines on screenshot | pass    | `get_screenshot 6354:1393` — every line visible                                                                                                                                                  |
| basic / sizes            | pass    | silhouette, colors, active primary page, ghost pages, ellipsis match; base caret 16 vs. 24 = accepted deviation (see 4)                                                                          |
| dots                     | pass    | grey pill, white / navy dots, bold value + regular "/ total", ghost sm prev / next; snapshot's ~8px dot gap is stale (pre-fix) — code and Figma 2px, user confirmed; needs `/update-screenshots` |
| disabled                 | skipped | disabled state (6d)                                                                                                                                                                              |

## Verdict

**pass** — nav spacing fixed in repair iteration 1; base caret icon size is an accepted deviation (user decision 19.11.2026).

## Repair log

### Iteration 1 (19.11.2026)

- **Nav item spacing unbound** — `6355:422`, `6356:482`, `6356:588`, `6356:694`: `itemSpacing` bound
  to `🌐 Global/📏 Dimension/Space/0`. Read back: bound, widths unchanged (480 / 384 / 312 / 248). Fixed.
- **Icon size `size=base`** — `6355:422` › `previous` / `next` › `icon`: `setBoundVariable('width' |
'height', Icon/Size/MD)` is silently ignored on this nested frame (padding overrides on the same
  node apply). Unbind + `resize(24, 24)` + rebind: unbind applies, resize and rebind are ignored —
  even rebinding the master's own `Icon/Size/Base`. Restored with `resetOverrides()` on both
  instances and re-applied every original override (label off, icon on, caret swap, padding / gap
  `Space/0`, min width `Button/Size/Base/MinWidth`, icon padding `Icon/Padding/MD`); read back
  identical to the pre-repair state. **Unresolved — hard stop** (same error twice): the Button
  master's `icon` frame size can't be overridden on an instance via the Plugin API.
