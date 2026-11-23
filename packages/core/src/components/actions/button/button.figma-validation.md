# button → Figma validation (Phase 4)

> Run 4 — 23.11.2026, after Repair iteration 3: step 0 scripts re-run (rows unchanged), header (2),
> doc-column order / leftovers (5d, 5e) and frame screenshot `6252:6` re-read; checks with no
> frame write since run 3 carried over. Snapshots unchanged since 17.11.2026 → 6c unchanged.
>
> Run 3 — 23.11.2026, full re-run against the current `PHASE-4-VALIDATE.md` (step 0 scripts, new
> 6f), after Repair iteration 2. Live file `NzMFv5HwO14Mmro8bWyvlO` (page `Core / Actions`, doc
> frame `6252:6`), mapping `button.figma.md`. Read-only except step 4c's temporary instances
> (270 created, 270 removed, same scripts).

## Verdict: `fail`

| #   | Check                                  | Result                                                                          |
| --- | -------------------------------------- | ------------------------------------------------------------------------------- |
| 0   | Script `check-mapping-coverage.mjs`    | **fail** — 1 row (`ds-button-group: mapping file` missing)                      |
| 0   | Script `figma-check-set.mjs`           | **fail** — 1 row (`ds-button-group` mapping file missing); all 24 set rows pass |
| 1   | Nodes located                          | pass                                                                            |
| 2   | Header                                 | pass                                                                            |
| 3a  | Props, naming, states, text properties | pass                                                                            |
| 3b  | Top-level splits                       | pass                                                                            |
| 3c  | Set count / names                      | pass                                                                            |
| 4a  | Token bindings + resolved paint values | pass                                                                            |
| 4b  | Nested instances                       | pass                                                                            |
| 4c  | Icon slots                             | pass                                                                            |
| 4d  | Slots                                  | pass (none expected)                                                            |
| 4e  | Interactions                           | pass (script row `reactions`)                                                   |
| 5a  | Outer stroke + grid dividers           | pass                                                                            |
| 5b  | Labels                                 | pass                                                                            |
| 5b′ | Variant centring (Phase 3 hard rule)   | pass                                                                            |
| 5c  | Ordering                               | pass                                                                            |
| 5d  | Inverted background + leftovers        | pass                                                                            |
| 5e  | Variations structure                   | pass                                                                            |
| 6a  | Snapshot source                        | pass                                                                            |
| 6b  | Set screenshots / grid lines           | pass                                                                            |
| 6c  | Snapshot comparison                    | **fail** (known: stale `button-colors`, `button-loading`)                       |
| 6d  | Skips                                  | pass                                                                            |
| 6e  | Variations vs snapshots                | pass                                                                            |
| 6f  | Anatomy drawing fits                   | pass                                                                            |
| 6f  | Measurements drawing fits              | pass                                                                            |

## 0. Check scripts

### `node .claude/skills/ds-code-to-figma/scripts/check-mapping-coverage.mjs button` (exit 1)

| check                           | verdict | found                    | expected                                                                       | details                                           |
| ------------------------------- | ------- | ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| family members                  | pass    | 1 owner, 1 sub           | 1 owner                                                                        | owner: ds-button; sub-components: ds-button-group |
| ds-button-group: mapping file   | fail    | missing                  | packages/core/src/components/actions/button/button-group/button-group.figma.md |                                                   |
| ds-button: mapping file         | pass    | exists                   | packages/core/src/components/actions/button/button.figma.md                    |                                                   |
| ds-button: valid YAML           | pass    | all sections parse       | all sections parse                                                             |                                                   |
| ds-button: props                | pass    | 28 / 28                  | 28 / 28                                                                        |                                                   |
| ds-button: parts in anatomy     | pass    | 5 / 5                    | 5 / 5                                                                          |                                                   |
| ds-button: no focus state       | pass    | default · hover · active | no `focus`                                                                     |                                                   |
| ds-button: text default `label` | pass    | Label                    | Label                                                                          |                                                   |

### `node .claude/skills/ds-code-to-figma/scripts/figma-check-set.mjs button` → `use_figma` (code as generated)

| set             | check                  | verdict | found                                                                                                                                     | expected                                                                                                                                            | details |
| --------------- | ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| ds-button-group | mapping file           | fail    | missing                                                                                                                                   | packages/core/src/components/actions/button/button-group/button-group.figma.md                                                                      |         |
| Button          | variant axes           | pass    | color, size, state, disabled, loading                                                                                                     | color, size, state, disabled, loading                                                                                                               |         |
| Button          | options `color`        | pass    | primary · secondary · tertiary · ghost · brand-purple · brand-red · brand-yellow · brand-green · info · success · warning · danger · link | primary · secondary · tertiary · ghost · brand-purple · brand-red · brand-yellow · brand-green · info · success · warning · danger · link           |         |
| Button          | options `size`         | pass    | base · sm · lg                                                                                                                            | base · sm · lg                                                                                                                                      |         |
| Button          | options `state`        | pass    | default · hover · active                                                                                                                  | default · hover · active                                                                                                                            |         |
| Button          | variant combinations   | pass    | 195                                                                                                                                       | 195                                                                                                                                                 |         |
| Button          | text properties        | pass    | label                                                                                                                                     | label                                                                                                                                               |         |
| Button          | text default `label`   | pass    | Label                                                                                                                                     | Label                                                                                                                                               |         |
| Button          | text binding `label`   | pass    | 195                                                                                                                                       | 195                                                                                                                                                 |         |
| Button          | reactions              | pass    | 117                                                                                                                                       | 117                                                                                                                                                 |         |
| Button          | paint bindings         | pass    | 0 unbound, 0 local                                                                                                                        | 0 unbound, 0 local                                                                                                                                  |         |
| Button          | numeric bindings       | pass    | 0                                                                                                                                         | 0                                                                                                                                                   |         |
| Button          | layer `tooltip-anchor` | pass    | 39                                                                                                                                        | 39                                                                                                                                                  |         |
| ButtonInverted  | variant axes           | pass    | color, size, state, disabled, loading                                                                                                     | color, size, state, disabled, loading                                                                                                               |         |
| ButtonInverted  | options `color`        | pass    | primary · secondary · tertiary · ghost · link                                                                                             | subset of primary · secondary · tertiary · ghost · brand-purple · brand-red · brand-yellow · brand-green · info · success · warning · danger · link |         |
| ButtonInverted  | options `size`         | pass    | base · sm · lg                                                                                                                            | subset of base · sm · lg                                                                                                                            |         |
| ButtonInverted  | options `state`        | pass    | default · hover · active                                                                                                                  | default · hover · active                                                                                                                            |         |
| ButtonInverted  | variant combinations   | pass    | 75                                                                                                                                        | 75                                                                                                                                                  |         |
| ButtonInverted  | text properties        | pass    | label                                                                                                                                     | label                                                                                                                                               |         |
| ButtonInverted  | text default `label`   | pass    | Label                                                                                                                                     | Label                                                                                                                                               |         |
| ButtonInverted  | text binding `label`   | pass    | 75                                                                                                                                        | 75                                                                                                                                                  |         |
| ButtonInverted  | reactions              | pass    | 45                                                                                                                                        | 45                                                                                                                                                  |         |
| ButtonInverted  | paint bindings         | pass    | 0 unbound, 0 local                                                                                                                        | 0 unbound, 0 local                                                                                                                                  |         |
| ButtonInverted  | numeric bindings       | pass    | 0                                                                                                                                         | 0                                                                                                                                                   |         |
| ButtonInverted  | layer `tooltip-anchor` | pass    | 15                                                                                                                                        | 15                                                                                                                                                  |         |

`ds-button-group` fail: the family's sub-component has no mapping file / Figma set yet (open
follow-up in `button.figma.md` → Notes, "Follow-up — ButtonGroup").

## 1. Locate nodes — pass

`6252:6` Button Documentation (FRAME) · `6277:1671` Button · `6277:1672` ButtonInverted
(COMPONENT_SET) · `6252:11` variations, `6252:12` anatomy, `6252:13` measurements (Section
instances). All found.

## 2. Documentation frame header — pass

Header `6252:7`.

| Field          | Found                                                                    | Expected                                                           | Result |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------ |
| kicker         | `Core / Actions`                                                         | same                                                               | pass   |
| component      | `Button`                                                                 | same                                                               | pass   |
| lead           | `Button provides a clickable element … supporting text, icons, or both.` | JSDoc lead `button.tsx:36`                                         | pass   |
| review-status  | `status=review`                                                          | same                                                               | pass   |
| VERSION        | `v0.1.0`                                                                 | `packages/core/package.json` 0.1.0                                 | pass   |
| LAST UPDATED   | `23.11.2026` (`I6252:7;2389:15024`)                                      | `23.11.2026` — last frame write: Repair iterations 2–3, 23.11.2026 | pass   |
| link-storybook | `…/?path=/docs/components-actions-button-button--button`                 | `tabs[0].storyId` (`button.doc-config.ts:10`)                      | pass   |
| link-toky      | `https://helvetia-toky.vercel.app?filter=button`                         | same                                                               | pass   |
| link-github    | `…/tree/main/packages/core/src/components/actions/button`                | same                                                               | pass   |

## 3. Prop / state mapping

### 3a — pass

Script rows: `variant axes`, `options color/size/state`, `variant combinations` (195 / 195,
75 / 75: blocked `disabled` / `loading` only with `state=default`), `text properties`,
`text default label` (`Label` = sentence case of `label`), `text binding label` (195 / 195,
75 / 75). By hand: component properties on both sets — `show icon` (false), `icon`
(INSTANCE_SWAP, `6163:238`, 79 preferred), `show label` (true), `label` (TEXT), `show icon right`
(false), `icon right` (INSTANCE_SWAP, 79), `show tooltip` (false); all names lowercase, sets
PascalCase with default bare, `sub-label` = set name; no `focus`, `iconTurn`, `wide`. Only
non-`label` text: exposed Tooltip `content` inside `tooltip-anchor`.

### 3b — pass

Rule 1: none (same layers, `tooltip-anchor` conditional per script row). Rule 2: `Button` /
`ButtonInverted`. Rule 3: not needed (195 / 75).

### 3c — pass

2 sets, names = mapping `sets:`.

## 4. Bindings

### 4a — pass

Script rows `paint bindings` (0 unbound, 0 local) and `numeric bindings` (0) on both sets. By
hand — stored colour/opacity vs `resolveForConsumer`: 585 / 585 (Button), 225 / 225
(ButtonInverted), 0 mismatches; variable groups `🧩 Component/Button`, `🧩 Component/Icon`.
`label`: `fills`, `fontSize`, `fontStyle` bound (195 / 75); family / line height / letter spacing
literal per mapping (TODO.md). Link underline: enabled `color=link` → `UNDERLINE`, offset 4 px
on 9 / 9 + 9 / 9; disabled / loading link `NONE`.

### 4b — pass

| Instance         | Main (key)                     | Button / Inverted                          | `isExposedInstance` |
| ---------------- | ------------------------------ | ------------------------------------------ | ------------------- |
| `spinner`        | Spinner `8c6b86b1…`            | 195 / 75                                   | false               |
| `tooltip-anchor` | TooltipAnchor `7acb7dea…`      | 39 / 15, `visible` → `show tooltip`        | true                |
| `glyph`          | IconPlus glyph set `1e43dd97…` | 390 / 150, `mainComponent` → swap property | false               |

### 4c — pass

`icon` / `icon-right` `visible` bound to `show icon` / `show icon right` on 195 + 195 and
75 + 75 frames (loading included). Temporary instances with both booleans on — glyph fill bound,
name = `colorSource` for the state, wrapper width `Icon/Size/<size>`:

| Group                                | Button    | ButtonInverted |
| ------------------------------------ | --------- | -------------- |
| default + hover (enabled)            | 156 / 156 | 60 / 60        |
| active                               | 78 / 78   | 30 / 30        |
| disabled=true (`Disabled/Base/Text`) | 78 / 78   | 30 / 30        |
| loading=true (`Disabled/Base/Text`)  | 78 / 78   | 30 / 30        |
| Created / removed                    | 195 / 195 | 75 / 75        |

### 4d — pass

No `slots:` in the mapping; no `SLOT` property.

### 4e — pass

Script row `reactions`: Button 117 / 117, ButtonInverted 45 / 45 (3 per enabled row: default
hover + press, hover press), no extras.

## 5. Layout

### 5a — pass

|                                                    | Button (`Grid` `6252:81`)                                                                 | ButtonInverted (`Grid` `6252:152`)    | Template        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- | --------------- |
| Set stroke                                         | `…952c/13:7325`, weight 2, dash [10, 5]                                                   | same                                  | `2766:300` same |
| Grid vs set                                        | x/y 0, 875 × 3432                                                                         | x/y 0, 875 × 1320                     | —               |
| `divider-col`                                      | 4 / 4                                                                                     | 4 / 4                                 | —               |
| `divider-row`                                      | 38 / 38                                                                                   | 14 / 14                               | —               |
| Geometry misses (±1 px, every boundary, full span) | 0                                                                                         | 0                                     | —               |
| Layer order                                        | Column Labels > Button > Grid                                                             | Column Labels > ButtonInverted > Grid | —               |
| `divider-col`                                      | RECTANGLE 0.01, `strokeLeftWeight` 2, dash [10, 5], same var, no fill, visible, opacity 1 | same                                  | `2801:293` same |
| `divider-row`                                      | LINE rot 0, weight 2, dash [10, 5], same var, non-empty `absoluteRenderBounds` on all     | same                                  | `2781:271` same |

### 5b — pass

Both sets: `state` at x 262.5 (centre of interaction columns), values at 87.5 / 262.5 / 437.5 /
612.5 / 787.5, cy −16; 39 / 15 color labels on 44 + 88 n (0 misses); size labels on 572 / 1716 /
2860 and 220 / 660 / 1100, lane left edge −150 / −135; brackets 8 + 1128 … / 8 + 424 …; axis
names cy −16. All visible.

### 5b′ — pass

Max offset 0.5 px (`6274:508`, `6277:621`); 0 / 195, 0 / 75 over ±1 px.

### 5c — pass

First layer / top-left: `color=primary, size=base, state=default, disabled=false, loading=false`
(`6253:501`, `6277:535`); `state` columns then `disabled`, `loading`; size base → sm → lg; layers
in reading order.

### 5d — pass

ButtonInverted fill `…4ad56/20:255` (`🔗 Alias/🎨 Surface/Primary`) = template `2766:320`.
`Sets` `6252:16`: `Primary` (`6252:17`, `Button`), `Inverted` (`6252:88`, `ButtonInverted`),
visible; 0 `review`; 0 hidden nodes. `Component Sets` FILL 5127, bottom 6004 ≥ 5964.

### 5e — pass

Order: copy-me `6252:10` → variations `6252:11` → anatomy → measurements. One `Preview`
(`I6252:11;2192:7515`, `Button`), none for ButtonInverted; 4 / 4 entries:
`show icon` (show icon), `show icon right` (show icon right), `all on` (both), `show tooltip ·
hover` (show tooltip, state hover). Overrides: self width/height only; tooltip entry also a
`name` record on `tooltip-anchor` (`…;6411:1273`) with the master's value (`tooltip-anchor`,
ABSOLUTE, 95 × 48) — no change.

## 6. Visual

### 6a — pass

`test/button.visual.html` + Desktop snapshots (unchanged since run 1).

### 6b — pass

`get_screenshot` `6252:19` (1025 × 3488) and `6252:90` (1010 × 1376): outer stroke, 4 vertical,
38 / 14 horizontal lines visible.

### 6c — fail (known)

| Case                                                                             | Result                                                                                  |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `button-basic`, `-sizes`, `-disabled`, `-link`, `-inverted`, `-icon`, `-tooltip` | pass                                                                                    |
| `button-colors`                                                                  | **fail** — tertiary: snapshot no background, Figma `#F6F6F6` (`6274:899`)               |
| `button-loading`                                                                 | **fail** — snapshot spinner / label `#727272` / `#747474`, Figma `#313131` (`6274:497`) |

Known: Figma = current tokens (`grey-1`, `grey-6`); the snapshots predate them. Stays `fail`
until the user re-baselines; no Figma change.

### 6d — pass

Skipped: states beyond the snapshots; badge, brand icons, wide, long-content / no-wrap
(excluded); square / flat / shadow (instance overrides); `button-group*` (not built);
`button-style-*`.

### 6e — pass

Preview screenshot `6252:11`: icon entries match `button-icon`; tooltip entry matches
`button-tooltip`.

### 6f — Anatomy — pass

`diagram-area` `I6252:12;…;6252:181` (656 × 114 = component bottom). Instances `Button (loading)`
(x 169–296) and `Button` (x 344–487), 48 px apart, group centre offset 0.

| Marker | Part (instance)                                              | Part centre − 12 | Marker x | Visible top − 4   | Leader end    |
| ------ | ------------------------------------------------------------ | ---------------- | -------- | ----------------- | ------------- |
| A      | spinner (loading)                                            | 195              | 195      | 79.37 − 4 = 75.37 | 75.37         |
| B      | native (loading), container: straight top 173–292, dot ≤ 268 | —                | 260      | 66 − 4 = 62       | 62            |
| C      | icon glyph (default)                                         | 366              | 366      | 83.5 − 4 = 79.5   | 79.5          |
| D      | label glyphs (default)                                       | 403.32           | 403.3    | 83.8 − 4 = 79.8   | 80.38 (+0.58) |
| E      | icon-right glyph (default)                                   | 441              | 441      | 79.5              | 79.5          |

Dots at y 16; legend A–E in order. Screenshot `6252:12`: no overlapping markers.

### 6f — Measurements — pass

`stage` `I6252:13;…;6252:208` (656 × 363). `Button` (secondary, x 257–400, centre 328.5) and
`Button (loading)` (x 265–392, centre 328.5): centred (±0.5).

| Marker                                    | Measures          | Edges (from layers)                   | Marker                                |
| ----------------------------------------- | ----------------- | ------------------------------------- | ------------------------------------- |
| Text box                                  | label             | 307, 74.5, 43 × 21                    | 307, 74.5, 43 × 21                    |
| Icon size ×2                              | icon / icon-right | 283 / 358, 77, 16 × 16                | same                                  |
| ① min 48px (left, dashed)                 | height            | y 61–109, left 257                    | y 61, h 48, right 253 (= 257 − 4)     |
| ② 16px ×2 (top)                           | icon widths       | 283–299, 358–374                      | 283 / 358, w 16, y 40 (= 61 − 4 − 17) |
| ③ 24px (top)                              | spinner           | 291–315, top 258                      | 291, w 24, y 237                      |
| ④ 24px ×2 (bottom)                        | padding X         | 259–283, 374–398 (inside 2 px border) | same, y 113 (= 109 + 4)               |
| Inset ×2 (`padding-clip`, radius 2, clip) | padding           | 259–283, 374–398, y 63, h 44          | same                                  |
| ⑤ 8px ×2 (bottom, callout-end / -start)   | gaps              | 299–307, 350–358                      | 299 / 350, w 8, y 113                 |
| Gap hatch ×2                              | gaps              | same, y 63, h 44                      | same                                  |

Corner radius ⑦ at top-right (392–400, 61–69); leaders ⑥ border, ⑧ type. Screenshot
`6252:13`: no overlapping markers or pills.

## Failures

1. **0 / both scripts** — `ds-button-group` has no mapping file (family sub-component not built;
   known follow-up).
2. **6c** — known stale snapshots; user re-baselines, no Figma change.

## Not verified

None.

## Repair log

### Iteration 1 — 20.11.2026

| Fail             | Node                                                                                          | Change                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2 header         | `I6252:7;2389:15024` (LAST UPDATED)                                                           | `18.11.2026` → `20.11.2026`                                                                                                                                                              |
| 4c loading icons | `icon` / `icon-right` frames in 39 + 15 `loading=true` variants (e.g. `6274:499`, `6274:502`) | `visible` bound to `show icon` / `show icon right` (78 + 30 frames). Glyph fills already `Button/Color/Disabled/Base/Text` on all 108 (read through 54 temporary instances, all removed) |
| 5b′ centring     | all 195 + 75 variants (`6277:1671`, `6277:1672`)                                              | re-centred in their 175 × 88 cells; worst offset now 0.5 px                                                                                                                              |
| 6c snapshots     | —                                                                                             | not repaired: Figma matches current tokens; snapshots (23.09.2026) look stale → re-baseline (user-triggered)                                                                             |

### Iteration 2 — 23.11.2026 (found by the user, not by Phase 4)

| Issue                                                                                         | Node                                 | Change                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anatomy markers off their parts after the `Label` default (20.11.2026) narrowed the instances | `diagram-area` `I6252:12;…;6252:181` | instances re-centred (loading x 159 → 169); markers A 185 → 195, D 408.2 → 403.3, E 451 → 441; B, C unchanged                                                                        |
| Measurements markers off the 10px narrower button                                             | `stage` `I6252:13;…;6252:208`        | main group +5 (left markers +5, right markers −5), `padding-clip` and text box −10 wide, right inset re-pinned; gap pills set to `callout-end` / `callout-start` so they don't touch |

### Iteration 3 — 23.11.2026

| Fail                                   | Node                                | Change                                                                                       |
| -------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| 2 header                               | `I6252:7;2389:15024` (LAST UPDATED) | `20.11.2026` → `23.11.2026` (the frame was written on 23.11 by iteration 2)                  |
| ButtonGroup mapping file, 6c snapshots | —                                   | not repaired: ButtonGroup is a recorded follow-up; snapshots wait for the user's re-baseline |
