# brand-icon → Figma validation (Phase 4)

> Run 23.11.2026 against `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Media` (`6160:421`), doc frame
> `BrandIcon Documentation` (`6627:1126`), set `BrandIcon` (`6628:1214`). Read-only.

## 0. Check scripts (rows copied unchanged)

`check-mapping-coverage.mjs brand-icon`: family members pass · mapping file pass · valid YAML pass · props 7 / 7 pass · parts in anatomy 1 / 1 pass · no focus state pass.

`figma-check-set.mjs brand-icon` (set `6628:1214`):

| check                    | verdict  | found                          | expected                                                                              |
| ------------------------ | -------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| variant axes             | pass     | size, color, disabled, invalid | size, color, disabled, invalid, disabled, invalid                                     |
| options `size`           | pass     | base · sm · lg                 | base · sm · lg                                                                        |
| options `color`          | pass     | purple · red · green · yellow  | purple · red · green · yellow                                                         |
| options `disabled`       | pass     | false · true                   | false · true                                                                          |
| options `invalid`        | pass     | false · true                   | false · true                                                                          |
| **variant combinations** | **fail** | 18                             | 36 (missing: `color=red/green/yellow` × `disabled=true` or `invalid=true`, 18 combos) |
| text properties          | pass     | none                           | none                                                                                  |
| paint bindings           | pass     | 0 unbound, 0 local             | 0 unbound, 0 local                                                                    |
| numeric bindings         | pass     | 0                              | 0                                                                                     |

**Why the combinations fail:** the checker crosses a component state (`disabled`, `invalid`) with every
other axis. The approved Phase 2 grouping is sparse on purpose — `true` exists only with `color=purple`
(both override every color token, so `disabled` red = `disabled` purple). `allowedCombos` only allows
extras, it can't waive missing ones. Needs a decision (see Verdict).

## 2. Header (`6627:1126` › `Header`)

| Check               | Result | Evidence                                                                                                                                      |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `kicker`            | pass   | `Core / Media`                                                                                                                                |
| `component`         | pass   | `BrandIcon`                                                                                                                                   |
| `lead` = JSDoc lead | pass   | `Icon displays SVG icons with customizable color, size, rotation, and optional tile background.` (brand-icon.tsx:9) — note: JSDoc says "Icon" |
| `review-status`     | pass   | main component `status=review`                                                                                                                |
| `VERSION`           | pass   | `v0.1.0` = packages/core/package.json `0.1.0`                                                                                                 |
| `LAST UPDATED`      | pass   | `23.11.2026` (Phase 3 run)                                                                                                                    |
| `link-storybook`    | pass   | `…/?path=/docs/components-media-brandicon-brandicon--brandicon` (`BRAND_ICON_DOC_CONFIG.tabs[0].storyId`)                                     |
| `link-toky`         | pass   | `https://helvetia-toky.vercel.app?filter=brand-icon`                                                                                          |
| `link-github`       | pass   | `…/tree/main/packages/core/src/components/media/brand-icon`                                                                                   |

## 3. Prop / state mapping

| Check                           | Result | Evidence                                                                                                                                                                                                               |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3a props present, nothing extra | pass   | defs: `icon#6628:0` INSTANCE_SWAP default `6627:694` (`BrandIconCar`); `size` `[base, sm, lg]`; `color` `[purple, red, green, yellow]`; `disabled` / `invalid` `[false, true]`. `tile` deferred (excluded in mapping). |
| 3a naming                       | pass   | lowercase property names and options; set `BrandIcon` PascalCase, bare; no `sub-label` (single set)                                                                                                                    |
| 3a component states             | pass   | `disabled` / `invalid` own variants, `true` only with `color=purple` (blocked, no `state` axis); both `true` together: none (not approved)                                                                             |
| 3a text properties              | pass   | none expected, none found                                                                                                                                                                                              |
| 3b top-level splits             | pass   | none expected; 1 `COMPONENT_SET` in `Sets`                                                                                                                                                                             |
| 3c set count / names            | pass   | 1 set `BrandIcon` = `sets:` in brand-icon.figma.md                                                                                                                                                                     |

## 4. Token and nested bindings

| Variant (all 18, ids `6627:1794`, `6628:1112` … `6628:1208`) | Result           | Evidence                                                                                                                                                                                |
| ------------------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| width / height                                               | pass             | `🧩 Component/BrandIcon/Size/Base · SM · LG` on every variant · remote true · 80 / 40 / 176 = node values                                                                               |
| 4a glyph fills, `color=purple/red/green/yellow`              | pass             | `level 1/2/3` bound to `Color/<Color>/Level1–3` · remote true · stored color and opacity = resolved value (3 × 12 checked)                                                              |
| 4a `disabled=true`                                           | pass             | `Color/Disabled/Level1–3` · remote · stored = resolved (3 variants)                                                                                                                     |
| 4a `invalid=true`                                            | pass             | `Color/Invalid/Level1–3` · remote · stored = resolved (3 variants)                                                                                                                      |
| 4a no variable outside the list                              | pass             | every bound name is in the `tokens:` list (Size/*, Color/{Purple,Red,Green,Yellow,Disabled,Invalid}/Level1–3)                                                                           |
| 4b nested DS instances                                       | pass             | none expected                                                                                                                                                                           |
| 4c glyph nesting / swap                                      | pass             | `inner` = instance of `BrandIconCar` (parent `BrandIcon glyphs`) on all 18, `componentPropertyReferences.mainComponent = icon#6628:0`, `isExposedInstance = false`, `preferredValues` 4 |
| 4c swap keeps color                                          | **not verified** | no temporary swapped instance created (read-only run): whether overrides carry to `BrandIconRocket` / `Garage` / `LightBulb` through the name-matched `level 1/2/3` is untested         |
| 4d slots                                                     | pass             | none expected                                                                                                                                                                           |
| 4e interactions                                              | pass             | no `state` axis → 0 expected, 0 set                                                                                                                                                     |

## 5. Layout

| Check                  | Result | Evidence                                                                                                                                                                                   |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5a outer stroke        | pass   | set fills / strokes identical to template set; strokeWeight 2 / 2; dash `[10,5]` / `[10,5]`; radius 5 / 5                                                                                  |
| 5a divider count       | pass   | `divider-col: 2 / 2`, `divider-row: 5 / 5` (Grid `children` only)                                                                                                                          |
| 5a divider geometry    | pass   | cols x 208 / 416, h 1248 = set height; rows y 208 / 416 / 624 / 832 / 1040, w 624 = set width; Grid `0,56,624,1248` = set `0,56,624,1248`                                                  |
| 5a layer order         | pass   | `Column + Box` index: set 1, Grid 2                                                                                                                                                        |
| 5a renders             | pass   | all visible, opacity 1; rows `absoluteRenderBounds` 624 × 2; cols checked on screenshot `6627:1139`                                                                                        |
| 5a divider styling     | pass   | type, strokes (bound var), `strokeLeftWeight` / `strokeWeight` 2, dash `[10,5]` identical to template prototypes                                                                           |
| 5b column labels       | pass   | `Column Labels` width 624 = set; centres base 104, sm 312, lg 520 (= column centres 104 / 312 / 520); `size` 312 = set centre                                                              |
| 5b row labels          | pass   | `lane-color` x 0; values centred on rows: purple 160, red 368, green 576, yellow 784, disabled 992, invalid 1200 (= 56 + 208·i + 104); axis name `color` on the column-value line (top 33) |
| 5c ordering            | pass   | top-left cell / first layer `size=base, color=purple, disabled=false, invalid=false`; `size` base · sm · lg; rows purple, red, green, yellow, disabled, invalid; layers in reading order   |
| 5d inverted background | pass   | no inverted set                                                                                                                                                                            |
| Checkpoint leftovers   | pass   | no `review` frame; `Sets` holds only `Primary` (visible), no hidden node                                                                                                                   |
| 5e Variations          | pass   | no `show` boolean → placeholder deleted (`6627:1131`); sections now copy-me, anatomy, measurements                                                                                         |

## 6. Visual snapshots

Screenshot of the labeled set: node `6627:1139` (`Labeled Set`).

| Check                                              | Result       | Evidence                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6b grid lines on screenshot                        | pass         | outer dashed frame, 2 vertical and 5 horizontal dashed lines visible                                                                                                                                                                                                                                                                                                                            |
| 6c `brand-icon-sizes`                              | pass         | snapshot: purple car, sm < base < lg; Figma `size` row `color=purple`: 40 < 80 < 176                                                                                                                                                                                                                                                                                                            |
| 6c `brand-icon-states` (colors)                    | pass         | snapshot green / invalid red / disabled grey (all levels grey); Figma green, `invalid=true` red, `disabled=true` grey rows match in color                                                                                                                                                                                                                                                       |
| 6c `brand-icon-basic`, `-sizes`, `-states` (shape) | **fail**     | Snapshots show the car **without** the two small side mirrors (`rect x=6/31 y=14`, L2); Figma `BrandIconCar` shows them (they are in `car-*.svg`). Cause in code: `sanitizeSvg` strips `width` / `height` from `<rect>`, so the live component renders both mirrors at 0 × 0 (measured on the dev server, `rect` boxes 0 × 0). The Figma glyph follows the source asset, not the broken render. |
| 6d skipped                                         | —            | `tile` (deferred), `svg-content` (alternative content source)                                                                                                                                                                                                                                                                                                                                   |
| 6e variations                                      | pass         | none                                                                                                                                                                                                                                                                                                                                                                                            |
| 6f drawings                                        | not verified | Anatomy and Measurements are still template placeholders (Phases 7–8, which check their own drawings)                                                                                                                                                                                                                                                                                           |

## Verdict

**fail** — 2 failures: `variant combinations` (checker can't express the approved sparse `disabled` / `invalid`) and `6c` car mirrors (code bug vs. Figma). `4c swap keeps color` and `6f` are `not verified`; they don't change the verdict while failures exist.

## Accepted deviations (user decision, 23.11.2026)

- **Variant combinations 18 vs 36:** accepted. `disabled` / `invalid` stay sparse (`true` only with `color=purple`); the checker has no way to waive missing combos.
- **Car mirrors (6c):** accepted. Figma follows the source SVG; the browser render is wrong because `sanitizeSvg` strips `width` / `height` from `<rect>`. Code follow-up, not fixed here.

Effective verdict after acceptance: **pass** (with 2 accepted deviations; `4c swap keeps color` and `6f` not verified).

## Repair log
