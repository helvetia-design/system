# ds-progress-bar — Figma validation (27.11.2026)

File `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Indicators`, frame `Progress Bar Documentation` (`7009:1337`).
Set: `ProgressBar` (`7009:1991`, key `b546424fa74a44fc64050eedcc66c3b2552c0cac`). Data read in one
read-only `use_figma` call; one set screenshot (`7009:1348`).

## 2. Header

| Check                      | Result | Evidence                                                                                                                                                                                                       |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kicker                     | pass   | `Core / Indicators`                                                                                                                                                                                            |
| component                  | pass   | `Progress Bar`                                                                                                                                                                                                 |
| lead = JSDoc lead verbatim | pass   | matches `progress-bar.tsx` JSDoc: "Progress bar displays a track with a filled line … as a percentage value."                                                                                                  |
| review-status              | pass   | `status=review`                                                                                                                                                                                                |
| VERSION                    | pass   | `v0.1.0` = `packages/core/package.json`                                                                                                                                                                        |
| LAST UPDATED               | pass   | `27.11.2026`                                                                                                                                                                                                   |
| links                      | pass   | storybook `…/docs/components-indicators-progress-bar-progress-bar--progress-bar` (doc-config tabs[0]), toky `?filter=progressbar` (token segment `ProgressBar`), github `…/components/indicators/progress-bar` |

## 3. Props / splits

| Check               | Result | Evidence                                                                                                                                            |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code values ⊆ Figma | pass   | `PROGRESS_BAR_BACKGROUNDS` [light, dark] ⊆ `background` [dark, light]; `PROGRESS_BAR_COLORS` [primary, purple, yellow, red, green] ⊆ `color` [same] |
| Figma values ⊆ code | pass   | no extra option; properties = {background, color} only (`value` excluded per gate)                                                                  |
| Defaults            | pass   | `background` default `dark`, `color` default `primary` = `progress-bar.tsx` defaults                                                                |
| Naming              | pass   | lowercase props/values, set `ProgressBar` PascalCase, no `sub-label` (family of one, no split)                                                      |
| Text properties     | pass   | none expected (no consumer text), none present                                                                                                      |
| Top-level splits    | pass   | none expected, one set; 10 variants (≤ 500)                                                                                                         |

## 4. Bindings (10 variants)

| Check                                      | Result | Evidence                                                                                                                                                                   |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Track fill                                 | pass   | each variant fill → `ProgressBar/<Color>/<Background>/Color/Background` matching its `background`×`color` (SCSS `:host(.is-<color>.is-<background>)`); keys = mapping file |
| Line fill                                  | pass   | `line` fill → `ProgressBar/<Color>/Line/Color/Background` per `color`; keys = mapping file                                                                                 |
| Paint = resolved value                     | pass   | stored rgb/alpha = `resolveForConsumer` for all 20 paints (e.g. dark/primary track 246,246,246/1, line 0,13,110/1; light/* track 255,255,255/1)                            |
| Heights                                    | pass   | variant + `line` `height` → `ProgressBar/Height` (4)                                                                                                                       |
| Radius                                     | pass   | `line` topRight/bottomRight → `ProgressBar/Radius`; topLeft/bottomLeft 0; track radius 0 (SCSS sets none)                                                                  |
| No other styled values                     | pass   | strokes 0 on track and line                                                                                                                                                |
| Nested / icon slots / slots / interactions | pass   | none expected, none present                                                                                                                                                |
| `line` resizable                           | pass   | `RECTANGLE` 160×4, constraints horizontal SCALE / vertical STRETCH, no auto-layout parent — width overridable per instance                                                 |

## 5. Layout

| Check                | Result | Evidence                                                                                                                                                                       |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Outer stroke         | pass   | set stroke 159,82,204 bound `🌐 Global/🌈 Color/Purple/5`, dash [10,5], weight 2 — copied from template set                                                                    |
| Divider count        | pass   | `divider-col`: 1 / 1, `divider-row`: 4 / 4 (Grid children only)                                                                                                                |
| Divider geometry     | pass   | col x=352 h=180; rows y=36,72,108,144 w=704 (cells 352×36)                                                                                                                     |
| Divider styling      | pass   | cloned from prototypes: col RECTANGLE w 0.01, strokeLeftWeight 2, dash [10,5]; row LINE weight 2, dash [10,5]; strokes 159,82,204                                              |
| Layer order          | pass   | `Column + Box`: Column Labels, ProgressBar, Grid                                                                                                                               |
| Renders              | pass   | rows `absoluteRenderBounds` non-empty; col visible on screenshot `7009:1348`                                                                                                   |
| Cell grid            | pass   | variants 320×4 at x 16/368, y 16+36·r — centred in 352×36 cells (largest variant + 16)                                                                                         |
| Labels               | pass   | `background` centre 352 = set centre; `dark` 176, `light` 528 = column centres; `color` x 0 y 32.5 = column-value line; row values centred 74,110,146,182,218 = 56 + 18 + 36·r |
| Ordering             | pass   | first layer + top-left = `background=dark, color=primary`; colors in declaration order                                                                                         |
| Inverted background  | pass   | no inverted stack expected; template `Inverted` stack removed                                                                                                                  |
| Variations structure | pass   | no `show` boolean → placeholder removed (repair 1); sections: copy-me, anatomy, measurements                                                                                   |

## 6. Visual snapshots

| Check              | Result | Evidence                                                                                                                      |
| ------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| dark-variants      | pass   | snapshot: five 4px bars, line at 50%, tinted tracks (grey, lilac, cream, pink, mint) = `background=dark` column               |
| light-variants     | pass   | snapshot: same lines on white tracks = `background=light` column (white tracks invisible on the white set fill; matches code) |
| basic / value      | pass   | value-only cases (0/50/99/100) — `value` excluded per gate; 50% shape matches                                                 |
| Grid lines visible | pass   | screenshot `7009:1348`: 1 vertical, 4 horizontal dashed lines                                                                 |

## Verdict: **pass**

## Repair log

1. 27.11.2026 — `Variations structure` failed: `kind=variations` placeholder `Section` (`7009:1342`) left
   from the template though the component has no `show` boolean. Removed. Re-check: pass.
