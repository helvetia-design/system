# ds-logo — Figma validation (24.11.2026)

File `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Media`, frame `Logo Documentation` (`6666:1289`).
Sets: `Logo` (`6669:1290`), `LogoInverted` (`6669:1302`). All reads read-only.

## 2. Header

| Check                      | Result | Evidence                                                                                                                        |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| kicker                     | pass   | `Core / Media`                                                                                                                  |
| component                  | pass   | `Logo`                                                                                                                          |
| lead = JSDoc lead verbatim | pass   | matches `logo.tsx` JSDoc first paragraph                                                                                        |
| review-status              | pass   | `status=review`                                                                                                                 |
| VERSION                    | pass   | `v0.1.0` = `packages/core/package.json`                                                                                         |
| LAST UPDATED               | pass   | `24.11.2026`                                                                                                                    |
| links                      | pass   | storybook `…/docs/components-media-logo-logo--logo` (doc-config tabs[0]), toky `?filter=logo`, github `…/components/media/logo` |

## 3. Props / splits

| Check                          | Result | Evidence                                                                                       |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------- |
| Variant axes vs code           | pass   | both sets: `size` VARIANT `[base, sm, lg]`, default `base`; `LOGO_SIZES` = sm, lg + unset base |
| Figma values ⊆ code            | pass   | no extra option, no extra property                                                             |
| Code values ⊆ Figma (in scope) | pass   | `animated`, `brand` excluded per user decisions 1, 4                                           |
| Text properties                | pass   | none expected (no rendered slot), none present                                                 |
| Top-level splits               | pass   | rule 2 only: `Logo` / `LogoInverted`; names PascalCase, sub-labels equal set names             |

## 4. Bindings (6 variants)

| Check                                      | Result | Evidence                                                                                                              |
| ------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Height bound to Device variable            | pass   | `logo.boundVariables.height` → `Logo/Size/{Base,SM,LG}/Device` per `size`                                             |
| Width derived                              | pass   | aspect ratio locked on every `logo`; widths 127.53 / 127.53 / 170.04 (= h × 1084/204)                                 |
| Fill bound, paint = resolved               | pass   | `Logo`: `Logo/Color/Primary`, paint `#000D6E` = resolved; `LogoInverted`: `Logo/Color/Inverted`, `#FFFFFF` = resolved |
| No other styled values                     | pass   | component and `logo` frame fills/strokes 0; path strokes 0                                                            |
| Nested / icon slots / slots / interactions | pass   | none expected, none present                                                                                           |

## 5. Layout

| Check                      | Result | Evidence                                                                                                       |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Outer stroke               | pass   | both sets: stroke `Global/Color/Purple/5`, weight 2, dash `[10,5]`, radius 5 = template                        |
| Dividers count             | pass   | divider-col 2/2, divider-row 0/0 (both sets)                                                                   |
| Divider geometry / styling | pass   | x 203, 406 (cell 203); h 64 = set h; RECTANGLE w 0.01, strokeLeftWeight 2, dash `[10,5]` = template `2801:293` |
| Layer order                | pass   | `Column Labels`, set, `Grid`                                                                                   |
| Labels centred             | pass   | base 101.5, sm 304.5, lg 507.5 = column centres; `size` 304.5 = set centre; no Row Labels (single axis)        |
| Ordering                   | pass   | `size=base` first layer and top-left cell                                                                      |
| Inverted background        | pass   | `LogoInverted` fill `Alias/Surface/Primary` = template inverted set                                            |
| Variations                 | pass   | no show booleans → placeholder removed; Documentation: copy-me, anatomy, measurements                          |

## 6. Visual snapshots

| Check                    | Result  | Evidence                                                                                                                                                    |
| ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grid lines visible       | pass    | screenshot `6666:1299`: both inner verticals visible in both sets                                                                                           |
| logo-sizes               | pass    | snapshot (Desktop) sm 24 · base 32 · lg 48; Figma at Mobile mode 24 · 24 · 32, Desktop mode re-derives (base tested: 170.04 × 32); same Helvetia mark, navy |
| logo-inverted            | pass    | white mark on navy, matches `LogoInverted`                                                                                                                  |
| logo-basic               | pass    | = `Logo size=base`                                                                                                                                          |
| baloise / animated cases | skipped | excluded by mapping                                                                                                                                         |

## Verdict: **pass**
