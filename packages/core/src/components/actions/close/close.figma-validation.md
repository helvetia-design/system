# close → Figma validation (Phase 4)

> Run 19.11.2026 against `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Actions` (`6252:2`), doc frame
> `Close Documentation` (`6385:986`), sets `Close` (`6387:1415`) and `CloseInverted`
> (`6387:1478`). Read-only.

## 2. Header

| Check                     | Result | Evidence                                                                                          |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| kicker / component / lead | pass   | `Core / Actions` / `Close` / JSDoc lead verbatim (close.tsx:17)                                   |
| review-status             | pass   | `status=review`                                                                                   |
| VERSION / LAST UPDATED    | pass   | `v0.1.0` / `19.11.2026`                                                                           |
| links                     | pass   | storybook `components-actions-close-close--close`, toky `?filter=close`, github `…/actions/close` |

## 3. Prop / state mapping

| Check                  | Result | Evidence                                                                                                                                          |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| properties (both sets) | pass   | variants `size` [base, md], `state` [default, hover, focus, active], `disabled` [false, true]; no text / boolean / swap properties (none in code) |
| component states       | pass   | `disabled=true` only with `state=default` (blocked in code)                                                                                       |
| splits / counts        | pass   | rule 2 `inverted` → CloseInverted; 10 + 10 variants (≤ 500)                                                                                       |
| excluded               | pass   | `button`, `buttonColor`, `buttonSize`, tooltip — not built (rebuild-decisions.md)                                                                 |

## 4. Bindings (scripted check over all 20 variants — 0 failures)

| Check                   | Result | Evidence                                                                                                                                                                     |
| ----------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| size                    | pass   | width + height → `Close/Size/Base` / `Size/MD`                                                                                                                               |
| radius                  | pass   | 4 corners → `Close/Radius`                                                                                                                                                   |
| background              | pass   | default + focus → `Primary/Color/Background/Base` (both sets); hover / active → `<Primary \| Inverted>/Color/Background/Hover \| Active`; disabled → `…/Background/Disabled` |
| X color                 | pass   | `glyph` → `<Primary \| Inverted>/Color/Icon/Base`, disabled `…/Icon/Disabled`                                                                                                |
| stored paint = resolved | pass   | every fill matches `resolveForConsumer`, alpha included                                                                                                                      |
| X size                  | pass   | 14 / 18, centred — literal (user decision, mapping notes)                                                                                                                    |
| focus                   | pass   | 4 focus variants carry an absolute, stretched `focus-ring` (`inverted=false` / `true`), ring radii full, no effects, clipping off                                            |
| reactions               | pass   | default → hover (hover), default / hover → active (press), per size, both sets                                                                                               |

## 5. Layout

| Check        | Result | Evidence                                                                                                               |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| outer stroke | pass   | template set fill / dashed stroke copied (inverted: dark fill)                                                         |
| dividers     | pass   | per set `divider-col 4`, `divider-row 1`; Grid = set bounds (`0,56,320,128`); layer order `Column Labels`, set, `Grid` |
| ordering     | pass   | first layer and top-left cell `size=base, state=default, disabled=false`                                               |
| labels       | pass   | `state` over the 4 interaction columns, `disabled` on the value line; one row lane `size`                              |
| Variations   | pass   | placeholder deleted (no `show` booleans)                                                                               |

## 6. Visual snapshots

| Check            | Result | Evidence                                                                                                                                                                      |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `close-sizes`    | pass   | navy X at 24 / 32 matches base / md. The snapshot still shows a third, smaller X: the removed `sm` size (16.11.2026) — stale snapshot, re-baseline with `/update-screenshots` |
| `close-inverted` | pass   | white X on the dark background matches CloseInverted default (base, md)                                                                                                       |
| `close-basic`    | pass   | navy X, no background                                                                                                                                                         |
| skipped          | —      | `button`, `themeing`, `tooltip`: excluded or instance overrides                                                                                                               |

## Verdict

**pass**
