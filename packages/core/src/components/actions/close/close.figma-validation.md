# close → Figma validation (Phase 4)

> Run 19.11.2026 against `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Actions` (`6252:2`), doc frame
> `Close Documentation` (`6385:986`), sets `Close` (`6387:1415`) and `CloseInverted`
> (`6387:1478`). Read-only.
> Re-run 19.11.2026 for the nested Tooltip (`show tooltip`, via `TooltipAnchor`); the other checks are unchanged since
> the first run (no other node changed).

## 2. Header

| Check                     | Result | Evidence                                                                                          |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| kicker / component / lead | pass   | `Core / Actions` / `Close` / JSDoc lead verbatim (close.tsx:17)                                   |
| review-status             | pass   | `status=review`                                                                                   |
| VERSION / LAST UPDATED    | pass   | `v0.1.0` / `19.11.2026`                                                                           |
| links                     | pass   | storybook `components-actions-close-close--close`, toky `?filter=close`, github `…/actions/close` |

## 3. Prop / state mapping

| Check                  | Result | Evidence                                                                                                                                                                               |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| properties (both sets) | pass   | variants `size` [base, md], `state` [default, hover, focus, active], `disabled` [false, true]; BOOLEAN `show tooltip` default false (`#6406:0` / `#6408:0`); no text / swap properties |
| component states       | pass   | `disabled=true` only with `state=default` (blocked in code)                                                                                                                            |
| splits / counts        | pass   | rule 2 `inverted` → CloseInverted; 10 + 10 variants (≤ 500)                                                                                                                            |
| excluded               | pass   | `button`, `buttonColor`, `buttonSize` — not built                                                                                                                                      |

## 4. Bindings (scripted check over all 20 variants — 0 failures)

| Check                   | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| size                    | pass   | width + height → `Close/Size/Base` / `Size/MD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| radius                  | pass   | 4 corners → `Close/Radius`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| background              | pass   | default + focus → `Primary/Color/Background/Base` (both sets); hover / active → `<Primary \| Inverted>/Color/Background/Hover \| Active`; disabled → `…/Background/Disabled`                                                                                                                                                                                                                                                                                                                                         |
| X color                 | pass   | `glyph` → `<Primary \| Inverted>/Color/Icon/Base`, disabled `…/Icon/Disabled`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| stored paint = resolved | pass   | every fill matches `resolveForConsumer`, alpha included                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| X size                  | pass   | 14 / 18, centred — literal (user decision, mapping notes)                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| focus                   | pass   | 4 focus variants carry an absolute, stretched `focus-ring` (`inverted=false` / `true`), ring radii full, no effects, clipping off                                                                                                                                                                                                                                                                                                                                                                                    |
| tooltip anchor set      | pass   | `TooltipAnchor` `6411:7` (key `7acb7dea…`), `placement` VARIANT default `bottom`, order bottom · top · right · left; each variant 48 × 48, no fill, no clip, one `wrapper` (fixed size: bottom `0,48,48,200`, top `0,-200,48,200`, right `48,0,400,48`, left `-400,0,400,48`), aligned toward the trigger, centered on the cross axis, padding toward the trigger → `🧩 Component/Tooltip/Offset` (remote), no other padding; exposed Tooltip, key `153b9193…`. Long-text test: gap 8, centered offset 0 on all four |
| tooltip                 | pass   | `tooltip-anchor` = TooltipAnchor `placement=bottom` instance on 4 / 4 expected variants per set (hover + focus, disabled=false), 0 elsewhere: absolute, x/y 0, size = variant, constraints STRETCH both, visible → `show tooltip`, not exposed (0 exposed instances on a Close instance); content `Close` (temp instance: created 1, removed 1)                                                                                                                                                                      |
| reactions               | pass   | default → hover (hover), default / hover → active (press), per size, both sets                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## 5. Layout

| Check        | Result | Evidence                                                                                                                                                                       |
| ------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| outer stroke | pass   | template set fill / dashed stroke copied (inverted: dark fill)                                                                                                                 |
| dividers     | pass   | per set `divider-col 4`, `divider-row 1`; Grid = set bounds (`0,56,320,128`); layer order `Column Labels`, set, `Grid`                                                         |
| ordering     | pass   | first layer and top-left cell `size=base, state=default, disabled=false`                                                                                                       |
| labels       | pass   | `state` over the 4 interaction columns, `disabled` on the value line; one row lane `size`                                                                                      |
| Variations   | pass   | `kind=variations` section `6408:1888` right after Copy me; one `Close` card, 1 / 1 entry `show tooltip · hover`: `size=base, state=hover, disabled=false`, `show tooltip=true` |

## 6. Visual snapshots

| Check                       | Result | Evidence                                                                                                                                                                                                              |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `close-sizes`               | pass   | navy X at 24 / 32 matches base / md. The snapshot still shows a third, smaller X: the removed `sm` size (16.11.2026) — stale snapshot, re-baseline with `/update-screenshots`                                         |
| `close-inverted`            | pass   | white X on the dark background matches CloseInverted default (base, md)                                                                                                                                               |
| `close-basic`               | pass   | navy X, no background                                                                                                                                                                                                 |
| `close-tooltip` (variation) | pass   | screenshot of `6408:1888`: dark tooltip with white text below the X, 8px gap. The snapshot's tooltip is shifted left by floating-ui `shift` at the viewport edge and reads `Schliessen` (de) — not a Figma difference |
| skipped                     | —      | `button`, `themeing`: excluded or instance overrides                                                                                                                                                                  |

## Verdict

**pass**
