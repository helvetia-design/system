# spinner → Figma validation (Phase 4)

> Run 18.11.2026 against `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Indicators` (`6193:544`), doc frame
> `Spinner Documentation` (`6193:548`). Read-only.

## 2. Header

| Check                      | Result | Evidence                                                                                                                                                           |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `kicker`                   | pass   | `Core / Indicators`                                                                                                                                                |
| `component`                | pass   | `Spinner`                                                                                                                                                          |
| `lead` = JSDoc lead        | pass   | `Spinner displays an animated loading indicator with customizable color, size, and variation.` (spinner.tsx)                                                       |
| `review-status`            | pass   | `status=review`                                                                                                                                                    |
| `VERSION` / `LAST UPDATED` | pass   | `v0.1.0` (packages/core 0.1.0) / `18.11.2026`                                                                                                                      |
| links                      | pass   | storybook `…/docs/components-indicators-spinner-spinner--spinner` (`SPINNER_DOC_CONFIG.tabs[0]`), toky `?filter=spinner`, github `…/components/indicators/spinner` |

## 3. Prop / state mapping

| Check                    | Result | Evidence                                                                                                                                                            |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3a properties, every set | pass   | `show label` BOOLEAN false, `label` TEXT `Loading`, `size` [base, sm] default base, `label position` [right, bottom] default right; `deactivated` excluded          |
| 3a naming                | pass   | lowercase properties / options; sets `Spinner`, `SpinnerInverted`, `SpinnerCircle`, `SpinnerCircleInverted`; each `sub-label` = set name                            |
| 3a text property binding | pass   | `label` node: `componentPropertyReferences = { characters: label#6198:5, visible: show label#6198:0 }` on all 16 variants; created `show label` first, then `label` |
| 3b splits                | pass   | rule 1 `variation` → Spinner / SpinnerCircle (different layers: `logo` vs `ring` + `progress`); rule 2 `inverted` → …Inverted                                       |
| 3c set count             | pass   | 4 sets = `sets:`; 4 variants each                                                                                                                                   |

## 4. Bindings (all 16 variants)

| Check                   | Result                    | Evidence                                                                                                                                                                                                                         |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gap                     | pass                      | right: `Spinner/Label/Gap` 8, HORIZONTAL; bottom: `Spinner/Label/GapBottom` 4, VERTICAL                                                                                                                                          |
| logo `inner` size       | pass                      | `Logo/Size/MD` 64 × 64 (base), `Logo/Size/SM` 32 × 32 (sm), width and height                                                                                                                                                     |
| logo fill               | pass                      | `Logo/Color/Primary` (Spinner), `Logo/Color/Inverted` (SpinnerInverted); remote, stored color = resolved                                                                                                                         |
| circle `inner` size     | pass                      | `Circle/Size/MD` 24, `Circle/Size/SM` 16                                                                                                                                                                                         |
| ring / progress strokes | pass                      | ring `Circle/Primary/Background`, progress `Circle/Primary/Progress` (Inverted: `Circle/Inverted/*`); weight `Circle/Thickness/MD` 4 / `SM` 2; remote, stored = resolved                                                         |
| label                   | pass                      | fill `Label/Color/Primary` / `Inverted`; size `Label/Typo/FontSize` 16; style `Label/Typo/FontWeight` (Regular); line height 150%, letter spacing 0%, decoration NONE as literals (STRING variables, PHASE-3-BUILD.md exception) |
| label font family       | pass (recorded exception) | literal `Baloise Create Text` — the variable holds `BaloiseCreateText`, not a Figma font (user decision 18.11.2026, TODO.md)                                                                                                     |
| no other paints         | pass                      | 0 fills / strokes on every variant root                                                                                                                                                                                          |
| 4b / 4c / 4d / 4e       | pass                      | no nested DS instances, icon slots, slots or state axis                                                                                                                                                                          |

## 5. Layout (per set: Spinner / SpinnerInverted cell 96, SpinnerCircle / SpinnerCircleInverted cell 56)

| Check                  | Result | Evidence                                                                                                                                                                                                                         |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5a outer stroke        | pass   | fills, strokes, weight 2, dash `[10,5]`, radius identical to template set `2766:300` (primary) / `ComponentInverted` (inverted)                                                                                                  |
| 5a divider count       | pass   | each set: `divider-col 1 / 1`, `divider-row 1 / 1`                                                                                                                                                                               |
| 5a geometry            | pass   | col at x = cell (96 / 56), full height; row at y = cell, full width; Grid = set bounds (`0,56,192,192` / `0,56,112,112`)                                                                                                         |
| 5a layer order         | pass   | `Column Labels`, set, `Grid` in every `Column + Box`                                                                                                                                                                             |
| 5a renders / styling   | pass   | visible, opacity 1; `divider-row` has render bounds; styling identical to the template prototypes; lines visible on screenshot `6193:548`                                                                                        |
| 5b labels              | pass   | columns: base / sm centred on 48 / 144 (logo) and 28 / 84 (circle), `size` on set centre; rows: right / bottom centred on 104 / 200 and 84 / 140 (= 56 + row centre); `label position` at the lane's left edge on the value line |
| 5c ordering            | pass   | top-left and first layer `size=base, label position=right` (code defaults)                                                                                                                                                       |
| 5d inverted background | pass   | SpinnerInverted / SpinnerCircleInverted use the template `ComponentInverted` fill (dark)                                                                                                                                         |
| 5e Variations          | pass   | section second after Copy me; Spinner and SpinnerCircle previews, 2 instances each (`show label` true, `label position` right / bottom, default otherwise; only width/height overrides)                                          |

## 6. Visual snapshots

| Check                         | Result | Evidence                                                                                                                                                                                      |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6c `spinner-basic`            | pass   | navy Helvetia mark, 64px; Figma `Spinner` base. The snapshots catch the animation at different frames (basic, label and inverted each show a different pose), so the pose is compared loosely |
| 6c `spinner-sizes`            | pass   | sm mark 32px; Figma sm 32                                                                                                                                                                     |
| 6c `spinner-inverted`         | pass   | white mark on navy; Figma SpinnerInverted                                                                                                                                                     |
| 6c `spinner-circle-variation` | pass   | grey ring + navy top arc 24 / 16; inverted: white ring, arc not visible (same in Figma)                                                                                                       |
| 6e variations                 | pass   | `spinner-label`: mark + "Loading..." right (gap 8) and below (gap 4); circle label right / bottom — matches the 4 Variations instances                                                        |

## Verdict

**pass**
