# list → Figma validation (Phase 4)

> Run: 23.11.2026. File `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Structure`, doc frame `6548:2182`. Read-only; no temporary instances on the `List` sets (4c: 0 icon slots).
> Sets: List `6562:3252`, ListInverted `6562:3387`. Sub-component report: `item/item.figma-validation.md`.

**Verdict: `blocked`** (family verdict = worst of both reports; `ds-item` is `blocked` too) — no failing check; 6e `not verified` (13 of 20 variations have no baselined snapshot until `/update-screenshots` runs). Re-run 2 (23.11.2026) after the `ds-item` repairs; step 0 re-run in full on the updated script (all `ds-list` rows unchanged: `pass`, numeric `review` = documented width 480 literal, now a `bind: false` entry in `tokens:`).

## Step 0 — check scripts (rows copied unchanged)

`check-mapping-coverage.mjs list`: all `ds-list` rows `pass` (props 3 / 3, parts 1 / 1, no focus, YAML valid).

`figma-check-set.mjs list` rows for `ds-list`:

| set          | check                | verdict       | found              | expected           | details                             |
| ------------ | -------------------- | ------------- | ------------------ | ------------------ | ----------------------------------- |
| List         | variant axes         | pass          | size               | size               |                                     |
| List         | options `size`       | pass          | base · lg          | base · lg          |                                     |
| List         | variant combinations | pass          | 2                  | 2                  |                                     |
| List         | text properties      | pass          | none               | none               |                                     |
| List         | paint bindings       | pass          | 0 unbound, 0 local | 0 unbound, 0 local |                                     |
| List         | numeric bindings     | review        | 1                  | 0                  | (variant root).width=480 (×2)       |
| ListInverted | same rows            | pass / review | identical          |                    | options `size`: subset of base · lg |

`review` = documented literal (list fills its container in code), now noted in `list.figma.md` → `tokens:`.

## 1. Locate nodes — pass

`6562:3252`, `6562:3387` (`COMPONENT_SET`); stacks `6562:3304`, `6562:3379`; doc frame `6548:2182`; sections `6548:2186` … `6548:2189`.

## 2. Documentation frame header — pass

Header `6548:2183` (`Variant=Purple`).

| Field          | Found                                                                                             | Expected                                    | Result |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------ |
| kicker         | `Core / Structure`                                                                                | same                                        | pass   |
| component      | `List`                                                                                            | same                                        | pass   |
| lead           | `List renders semantic HTML list elements (ordered or unordered) for grouping related items.`     | JSDoc lead `list.tsx:9`                     | pass   |
| review-status  | `status=review`                                                                                   | same                                        | pass   |
| VERSION        | `v0.1.0`                                                                                          | `packages/core/package.json` 0.1.0          | pass   |
| LAST UPDATED   | `23.11.2026`                                                                                      | `23.11.2026` — Phase 3 run                  | pass   |
| link-storybook | `https://helvetia-design.vercel.app/?path=/docs/components-structure-list-list--list`             | `tabs[0].storyId` (`list.doc-config.ts:10`) | pass   |
| link-toky      | `https://helvetia-toky.vercel.app?filter=list`                                                    | same                                        | pass   |
| link-github    | `https://github.com/helvetia-design/system/tree/main/packages/core/src/components/structure/list` | same                                        | pass   |

## 3. Prop / state mapping

### 3a — pass

`size` (base · lg) as the only variant; `ordered` excluded (signed off); `inverted` → top-level split. Names lowercase; `ListInverted` flat PascalCase. No text props (none expected).

### 3b — pass · 3c — pass

Rule 2 only (`ListInverted`); 2 sets, 2 variants each.

## 4. Bindings

### 4a — pass

Bound variables on `List` (28 nodes): `Component/List/Item/*` (Gap, PaddingX, Size/Base|LG/PaddingY, MinHeight, Border/Width, Color/Border/Base, ContentGap, Title/Text typo, Color/Text/Base) — the nested `Item` instances' own bindings, no local variable, stored colours equal resolved values (0 mismatches). `ListInverted`: same with `Inverted/Color/Border/Base` and `Inverted/Color/Text/Base`. `ds-list` itself binds nothing (`tokens: []`).

### 4b — pass

`List` → `Item` (set key `153da16d…`) ×6, `ListInverted` → `ItemInverted` (`e099546d…`) ×6; `isExposedInstance=false`, no detached instance.

### 4c — pass (no icon slots on `List`)

### 4d — pass

`items#6562:0` is a native `SLOT` on both variants of both sets (parent = the variant root); preferred `Item` + `ItemAccordion` (List), `ItemInverted` + `ItemAccordionInverted` (ListInverted); default fill: 3 × `Item` / `ItemInverted` (`Item|Item|Item`) on `size=base` and `size=lg`, each at its matching `size`.

### 4e — pass (no reactions expected on `List`)

## 5. Layout

### 5a — pass

| stack                    | `divider-col` | `divider-row` | notes                                                                                       |
| ------------------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------- |
| List `6562:3304`         | 1 / 1         | 0 / 0         | one row (base and lg vertically centred in the 248px row: y 33 / 16 with heights 183 / 216) |
| ListInverted `6562:3379` | 1 / 1         | 0 / 0         | same                                                                                        |

Stroke / dash / weight identical to the template prototypes (Purple/5, `[10,5]`, 2). Grid above the set in z-order (indexes: Column Labels 0, set 1, Grid 2). No hidden nodes in either stack.

### 5b — pass

Column values `base` (256) and `lg` (768) centred on their columns; `size` axis name centred (512). No row labels (single row).

### 5c — pass · 5d — pass

Default variant top-left (`size=base`). `ListInverted` set fill = `Alias/Surface/Primary` (dark); `List` = `Alias/Surface/White`.

### 5e — pass

Section `6548:2187` follows the `copy-me` placeholder; one `Preview` per covered set — owner file's variations are `Item` and `ItemAccordion` (sub-component sets, 10 each; detail in `item.figma-validation.md` 5e). Four variation entries on the owner's `List` itself: none expected.

## 6. Visual

### 6a — pass · 6b — pass

Screenshots: List `6562:3304`, ListInverted `6562:3379` (dashed grid, centre divider visible).

### 6c — pass

Snapshots `list-basic` (3–4 rows, border between items, no hover) vs Figma `List` `size=base`: stacked rows with a grey bottom border ✓. `lg` rows taller (72 vs 56 min) ✓. `ListInverted` renders white text on dark with a lighter divider ✓ (no snapshot — `inverted` case isn't in `VARIANTS_HOST`, skipped).

### 6d — pass

### 6e — not verified

User decision 23.11.2026: continue to Phase 6 without `/update-screenshots`; re-run 6e once the baselines exist. See `item/item.figma-validation.md` 6e: 13 of 20 variations have no baselined snapshot until `/update-screenshots` runs.

### 6f — pass

Run 3 (23.11.2026, read-only + one repair). Anatomy: marker dots vs. glyph centres of the labelled parts (±1px rule): `B1` label, `B2` description, `B3` action-icon, `B6` accordion-content centred after repair (see Repair log); `A`, `B`, `B4`, `B5` mark container parts (leader lands inside the part). Legend matches the `anatomy:` list (A, B, B1–B6). Measurements: drawing, sizes table (10 rows) and behavior card inspected on screenshot; no clipping, rows match `list.figma.md`. User confirmed Anatomy and Measurements 23.11.2026 (after a 4px gap between callouts 9 and 10).
