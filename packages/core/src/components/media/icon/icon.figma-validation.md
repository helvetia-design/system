# icon → Figma validation (Phase 4)

> Run 17.11.2026 against `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Media` (`6160:421`), doc frame
> `Icon Documentation` (`6160:425`), set `Icon` (`6185:252`). Read-only.

## 2. Header (`6160:425` › `Header`)

| Check               | Result | Evidence                                                                                                              |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `kicker`            | pass   | `Core / Media`                                                                                                        |
| `component`         | pass   | `Icon`                                                                                                                |
| `lead` = JSDoc lead | pass   | `Icon displays SVG icons with customizable color, size, rotation, and optional tile background.` (icon.tsx:20)        |
| `review-status`     | pass   | main component `status=review`                                                                                        |
| `VERSION`           | pass   | `v0.1.0` = packages/core/package.json `0.1.0`                                                                         |
| `LAST UPDATED`      | pass   | `17.11.2026` (Phase 3 run)                                                                                            |
| `link-storybook`    | pass   | `https://helvetia-design.vercel.app/?path=/docs/components-media-icon-icon--icon` (`ICON_DOC_CONFIG.tabs[0].storyId`) |
| `link-toky`         | pass   | `https://helvetia-toky.vercel.app?filter=icon`                                                                        |
| `link-github`       | pass   | `https://github.com/helvetia-design/system/tree/main/packages/core/src/components/media/icon`                         |

## 3. Prop / state mapping

| Check                           | Result | Evidence                                                                                                                                                                                            |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3a props present, nothing extra | pass   | `componentPropertyDefinitions`: `size` VARIANT `[base, sm, md, lg, xl]` default `base`; `icon#6185:0` INSTANCE_SWAP default `6162:268` (`IconCheck`). Every other prop `excluded` in icon.figma.md. |
| 3a naming                       | pass   | lowercase property names and options; set `Icon` (PascalCase, bare); no `sub-label` (single set)                                                                                                    |
| 3a text properties              | pass   | none expected (`figmaPropertyType: text` — none), none found                                                                                                                                        |
| 3b top-level splits             | pass   | none expected; 1 `COMPONENT_SET` in `Sets`                                                                                                                                                          |
| 3c set count / names            | pass   | 1 set `Icon` = `sets:` in icon.figma.md                                                                                                                                                             |

## 4. Token and nested bindings

| Variant                      | Result | Evidence (variable name · remote · resolved · node value)                                                                                                                                                                                  |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `size=base` `6163:309`       | pass   | width/height `🧩 Component/Icon/Size/Base` · true · 16 · 16; padding ×4 `🧩 Component/Icon/Padding/Base` · true · 1 · 1                                                                                                                    |
| `size=sm` `6185:232`         | pass   | `Size/SM` 14 · 14; `Padding/SM` 0.875 · 0.875                                                                                                                                                                                              |
| `size=md` `6185:238`         | pass   | `Size/MD` 24 · 24; `Padding/MD` 1.5 · 1.5                                                                                                                                                                                                  |
| `size=lg` `6185:244`         | pass   | `Size/LG` 32 · 32; `Padding/LG` 2 · 2                                                                                                                                                                                                      |
| `size=xl` `6185:250`         | pass   | `Size/XL` 40 · 40; `Padding/XL` 2.5 · 2.5                                                                                                                                                                                                  |
| 4a glyph fill, every variant | pass   | `🧩 Component/Icon/Color/Primary` · remote true · stored `{0, 0.051, 0.4314}` opacity 1 = resolved `{0, 0.051, 0.4314}` a 1                                                                                                                |
| 4a no other paints           | pass   | 0 fills / strokes on every variant                                                                                                                                                                                                         |
| 4c glyph nesting / swap      | pass   | `inner` = instance of `IconCheck` (parent `Icon glyphs`), `componentPropertyReferences.mainComponent = icon#6185:0` on all 5, `isExposedInstance = false`, `preferredValues` 79; glyph size 14 / 12.25 / 21 / 28 / 35 = size − 2 × padding |
| 4c swap keeps color          | pass   | temp instance (Phase 3) swapped to `IconHome`: fill still bound; removed                                                                                                                                                                   |
| 4b nested DS instances       | pass   | none expected                                                                                                                                                                                                                              |
| 4d slots                     | pass   | none expected                                                                                                                                                                                                                              |
| 4e interactions              | pass   | no `state` axis → 0 expected, 0 set                                                                                                                                                                                                        |

## 5. Layout

| Check                  | Result | Evidence                                                                                                                                                            |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5a outer stroke        | pass   | set fills / strokes identical to template set `2766:300`; strokeWeight 2 / 2; dash `[10,5]` / `[10,5]`; radius 5 / 5                                                |
| 5a divider count       | pass   | `divider-col: 4 / 4`, `divider-row: 0 / 0` (Grid children only)                                                                                                     |
| 5a divider geometry    | pass   | x 72 / 144 / 216 / 288 (cell 72), y 0, h 72 = set height; Grid `0,56,360,72` = set `0,56,360,72`                                                                    |
| 5a layer order         | pass   | `Column + Box` index: set 1, Grid 2                                                                                                                                 |
| 5a renders             | pass   | all visible, opacity 1 (render checked on screenshot `6160:433`)                                                                                                    |
| 5a divider styling     | pass   | RECTANGLE, w 0.01, strokeLeftWeight 2, dash `[10,5]`, strokes and fills identical to template prototype (`2774:269` › Grid)                                         |
| 5b column labels       | pass   | `Column Labels` width 360 = set; centres: base 36, sm 108, md 180, lg 252, xl 324 (= column centres); `size` centre 180 = set centre; no row axis → no `Row Labels` |
| 5c ordering            | pass   | top-left cell and first layer `size=base` (code default); order base, sm, md, lg, xl                                                                                |
| 5d inverted background | pass   | no inverted set                                                                                                                                                     |
| 5e Variations          | pass   | no `show` boolean → placeholder deleted (`6160:430`); sections now copy-me, anatomy, measurements                                                                   |

## 6. Visual snapshots

| Check                       | Result | Evidence                                                                                                   |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| 6b grid lines on screenshot | pass   | `get_screenshot` `6160:433`: outer dashed frame and 4 dashed column lines visible                          |
| 6c `icon-sizes`             | pass   | snapshot: navy check, sm < base < md < lg < xl; Figma `6185:252`: navy `IconCheck`, 14 < 16 < 24 < 32 < 40 |
| 6c `icon-basic`             | pass   | snapshot: one navy check at default size; Figma `size=base` navy `IconCheck` 16                            |
| 6d skipped                  | —      | `colors`, `override`, `inline`, `shadow`, `turn`, `states`, `svg-content`: props excluded in icon.figma.md |
| 6e variations               | pass   | none                                                                                                       |

## Verdict

**pass**
