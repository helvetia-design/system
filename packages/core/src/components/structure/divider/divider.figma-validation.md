# divider — Figma validation

Run 4 (`space` restored, user decision 23.11.2026), 23.11.2026. File `NzMFv5HwO14Mmro8bWyvlO`, frame `6231:427`, sets `6602:413` (`Divider`), `6602:775` (`DividerInverted`).

## 0. Check scripts

`check-mapping-coverage.mjs divider` (run 2):

| check                        | verdict | found              | expected           |
| ---------------------------- | ------- | ------------------ | ------------------ |
| family members               | pass    | 1 owner, 0 sub     | 1 owner            |
| ds-divider: mapping file     | pass    | exists             | divider.figma.md   |
| ds-divider: valid YAML       | pass    | all sections parse | all sections parse |
| ds-divider: props            | pass    | 5 / 5              | 5 / 5              |
| ds-divider: parts in anatomy | pass    | 1 / 1              | 1 / 1              |
| ds-divider: no focus state   | pass    | no state axis      | no `focus`         |

`figma-check-set.mjs divider` (same rows for `Divider` and `DividerInverted`):

| check                | verdict | found                                                  | expected           | details                                                                                            |
| -------------------- | ------- | ------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------- |
| variant axes         | pass    | layout, space, color, dashed                           | same               |                                                                                                    |
| options `layout`     | pass    | horizontal · vertical                                  | same               |                                                                                                    |
| options `space`      | pass    | none · 2xs · xs · sm · base · md · lg · xl · 2xl · 3xl | same               |                                                                                                    |
| options `color`      | pass    | default · primary · secondary                          | same               |                                                                                                    |
| options `dashed`     | pass    | false · true                                           | same               |                                                                                                    |
| variant combinations | pass    | 120                                                    | 120                |                                                                                                    |
| text properties      | pass    | none                                                   | none               |                                                                                                    |
| paint bindings       | pass    | 0 unbound, 0 local                                     | 0 unbound, 0 local |                                                                                                    |
| numeric bindings     | review  | 6                                                      | 0                  | root width 320 (×60), root height 64 (×60); hidden `line` / `dash` width 320, height 64 (×30 each) |

Numeric `review` resolved against `tokens:` → `bind: false` entry (placeholder length, user decision 18.11.2026): every listed value is the placeholder length or a hidden layer at that length. Visible layers: 0 unbound fixed sizes (`line` / `dash` thickness bound to `Divider/Size`, length `FILL`). → **pass**

## 2. Header

| Check                             | Result | Evidence                                                                                                                                           |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kicker` = `Core / Structure`     | pass   | `Core / Structure`                                                                                                                                 |
| `component` = `Divider`           | pass   | `Divider`                                                                                                                                          |
| `lead` = JSDoc lead verbatim      | pass   | "Divider renders a visual separator line for grouping or distinguishing content sections."                                                         |
| `review-status` = `status=review` | pass   | main component `status=review`                                                                                                                     |
| `VERSION` = `v0.1.0`              | pass   | `v0.1.0` (`packages/core/package.json` 0.1.0)                                                                                                      |
| `LAST UPDATED` = last write       | pass   | `23.11.2026`                                                                                                                                       |
| Links                             | pass   | storybook `…/docs/components-structure-divider-divider--divider`, toky `?filter=divider`, github `…/components/structure/divider` (set 23.11.2026) |

## 3. Prop / state mapping

| Check                 | Result | Evidence                                                                                                |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| 3a Props and options  | pass   | script rows; all names lowercase; no state axis, no component states                                    |
| 3b Top-level split    | pass   | rule 2: `Divider` / `DividerInverted` for the `inverted` boolean; same layers, only color tokens differ |
| 3c Sets match mapping | pass   | 2 sets, names = `sets:`; 120 + 120 = 240 ≤ 500; `sub-label` `Divider` / `DividerInverted` = set names   |

## 4. Bindings

| Check           | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4a Tokens       | pass   | script: 0 unbound / 0 local paints; `line` fill / `dash` stroke → `Divider/Color/<Color>` (`Divider`), `Divider/Color/Inverted<Color>` (`DividerInverted`); thickness `Divider/Size` (height horizontal, width vertical; `dash` stroke top / left weight); radius `Divider/Radius`; padding top/bottom (horizontal) or left/right (vertical) `Divider/Space/<X>`; paints built from `resolveForConsumer` |
| 4b Nested       | pass   | none (no `<ds-*>` children)                                                                                                                                                                                                                                                                                                                                                                              |
| 4c Icons        | pass   | none                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4d Slots        | pass   | none                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4e Interactions | pass   | no `state` axis → no reactions expected; script ran no reaction row                                                                                                                                                                                                                                                                                                                                      |

## 5. Layout

| Check                  | Result | Evidence                                                                                                                     |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 5a Outer stroke        | pass   | fills, strokes, weight, dash and radius copied from the template sets `Component` / `ComponentInverted` of the cloned stacks |
| 5a Dividers count      | pass   | per set: `divider-col` 9 / 9, `divider-row` 11 / 11 (Grid children 20)                                                       |
| 5a Geometry            | pass   | cell 352 × 146; cols at x = n × 352, rows at y = n × 146; full height 1752 / width 3520                                      |
| 5a Layer order         | pass   | `Column Labels`, set, `Grid` in both stacks                                                                                  |
| 5a Renders             | pass   | every `divider-row` has `absoluteRenderBounds` (0 missing per set)                                                           |
| 5b Labels              | pass   | `space` centred, 10 values centred on columns; lanes `layout` (2, 2 brackets), `dashed` (4, 4 brackets), `color` (12)        |
| 5c Ordering            | pass   | first layer / top-left = `layout=horizontal, space=none, color=default, dashed=false`                                        |
| 5d Inverted background | pass   | `DividerInverted` on the dark template fill (screenshot `6231:437`)                                                          |
| 5e Variations          | pass   | no `show` booleans → placeholder deleted (sections: copy-me, anatomy, measurements)                                          |

## 6. Snapshots

Screenshot of `Sets` `6231:437` (run 4): all column and row lines visible in both sets.

| Case            | Result | Evidence                                                                                                                                                                                                                                                                                |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| basic           | pass   | one light grey solid line = `horizontal / none / default / false`                                                                                                                                                                                                                       |
| colors          | pass   | navy · lavender · light grey; inverted white invisible on white = `Divider` color rows and `DividerInverted` default                                                                                                                                                                    |
| dashed          | pass   | dashed navy · lavender · light grey = `dashed=true` rows                                                                                                                                                                                                                                |
| horizontal      | pass   | gap between lines grows with `space` = padding per option (mobile mode: heights 2 → 114 px)                                                                                                                                                                                             |
| vertical        | pass   | gap between lines grows with `space`, same as the `layout=vertical` rows (widths 2 → 114 px)                                                                                                                                                                                            |
| dashed-vertical | stale  | snapshot shows 11 dashed lines incl. yellow / green / red: colors no longer in code (`DIVIDER_COLORS` = primary, secondary, default) nor in `divider.visual.html` (4 dividers). The first three match Figma. Snapshot is stale (CI tolerance, see TODO.md "Visual tests too tolerant"). |

## Verdict

**pass** — every check passed; `dashed-vertical` snapshot is stale (not a Figma difference), logged in TODO.md.

## Repair log

- **Iteration 1** (23.11.2026) — `review` → `fail` numeric bindings: hidden `line` / `dash` layers kept their old fixed size (vertical `dash` 2 px high). Fix: show, set the length axis to `FILL`, hide again on 240 hidden layers; placeholder length documented in `tokens:` as `bind: false`. Read back: hidden layers at 320 / 64 (Figma reports hidden auto-layout children as FIXED), visible layers 0 unbound fixed sizes.
