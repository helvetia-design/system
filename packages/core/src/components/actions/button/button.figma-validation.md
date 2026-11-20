# button → Figma validation (Phase 4)

> Run 19.11.2026 against `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Actions` (`6252:2`), doc frame
> `Button Documentation` (`6252:6`), sets `Button` (`6277:1671`) and `ButtonInverted`
> (`6277:1672`). Read-only.

## 2. Header

| Check                     | Result | Evidence                                                                                               |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| kicker / component / lead | pass   | `Core / Actions` / `Button` / JSDoc lead verbatim (button.tsx:36)                                      |
| review-status             | pass   | `status=review`                                                                                        |
| VERSION / LAST UPDATED    | pass   | `v0.1.0` / `18.11.2026`                                                                                |
| links                     | pass   | storybook `components-actions-button-button--button`, toky `?filter=button`, github `…/actions/button` |

## 3. Prop / state mapping

| Check                                  | Result | Evidence                                                                                                                                                                                                                                                                                             |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| properties (both sets, creation order) | pass   | `show icon` BOOLEAN false, `icon` INSTANCE_SWAP IconPlus (79 preferred), `show label` BOOLEAN true, `label` TEXT `Button`, `show icon right` BOOLEAN false, `icon right` INSTANCE_SWAP (79); variants `color`, `size` [base, sm, lg], `state` [default, hover, focus, active], `disabled`, `loading` |
| component states                       | pass   | `disabled=true` / `loading=true` only with `state=default` (both blocked in code)                                                                                                                                                                                                                    |
| splits / counts                        | pass   | rule 2 `inverted` → ButtonInverted (5 colors); 234 + 90 variants (≤ 500)                                                                                                                                                                                                                             |
| text / show bindings                   | pass   | on all 324: `label` → `characters` + `visible`; glyphs → `mainComponent`; icon frames → `visible` except on `loading=true` (icons hidden in code)                                                                                                                                                    |

## 4. Bindings (scripted check over all 324 variants — 0 failures)

| Check                                                                    | Result | Evidence                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| background / border color / border width (4 sides) / label + glyph color | pass   | `Button/Color/<Color>/<Base \| Hover \| Active>/*` per color and state; disabled and loading → `Button/Color/Disabled/Base/*`; ButtonInverted → `Inverted`, `InvertedSecondary`, `InvertedTertiary`, `InvertedGhost`, `InvertedLink` |
| stored paint = resolved value                                            | pass   | fill, stroke and label paints match `resolveForConsumer` (all 324)                                                                                                                                                                   |
| size tokens                                                              | pass   | min height, padding X, gap, radius, label font size → `Button/Size/<Base \| SM \| LG>/*`; icon frames → `Icon/Size/<Base \| SM \| LG>`                                                                                               |
| label                                                                    | pass   | Baloise Create Headline (literal, font-name TODO), weight bound, line height 130% literal; `link` underlined except disabled / loading                                                                                               |
| focus                                                                    | pass   | 54 focus variants carry an absolute, stretched `focus-ring` instance (`Focus ring`, `inverted=false` / `true`), no effects, clipping off                                                                                             |
| spinner                                                                  | pass   | visible only on `loading=true`; 24px (scaled — recorded exception), logo fill `Button/Color/Disabled/Base/Text`                                                                                                                      |

## 5. Layout

| Check        | Result | Evidence                                                                                                                                                                                  |
| ------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| outer stroke | pass   | template set fill / dashed stroke (inverted: dark fill) copied                                                                                                                            |
| dividers     | pass   | Button: `divider-col 5 / 5`, `divider-row 38 / 38`; ButtonInverted: `5 / 5`, `14 / 14`; Grid = set bounds (`0,56,1050,3432` / `0,56,1050,1320`); layer order `Column Labels`, set, `Grid` |
| ordering     | pass   | first layer and top-left cell `color=primary, size=base, state=default, disabled=false, loading=false`                                                                                    |
| labels       | pass   | `state` over the 4 interaction columns, `disabled` / `loading` on the value line; row lanes `size` (3 brackets) + `color`                                                                 |
| Variations   | pass   | section after Copy me; `show icon`, `show icon right`, `all on` (129 / 129 / 153px = live 128 / 128 / 152)                                                                                |

## 6. Visual snapshots

| Check             | Result | Evidence                                                                                                                        |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `button-colors`   | pass   | primary navy fill, secondary outline, tertiary / brand / status pastel fills with navy text — Figma base row matches            |
| `button-sizes`    | pass   | sm 32 / base 48 / lg 56, label 14 / 16 / 18 Bold                                                                                |
| `button-loading`  | pass   | grey disabled fill, spinner + label                                                                                             |
| `button-inverted` | pass   | screenshot `6252:88`: inverted colors on the dark set background, yellow focus ring                                             |
| `button-icon`     | pass   | icon left / right / both at 16px, 8px gap (Variations)                                                                          |
| skipped           | —      | `brand-icons`, `badge`, `tooltip`, `wide`, `long-content`, `group*`, `square`, `flat`, `shadow`: excluded or instance overrides |

## Verdict

**pass**
