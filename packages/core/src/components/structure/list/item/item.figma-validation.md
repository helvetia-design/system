# item → Figma validation (Phase 4)

> Run: 23.11.2026. File `NzMFv5HwO14Mmro8bWyvlO`, page `Core / Structure`, doc frame `6548:2182` (family doc frame, owner `ds-list`).
> Read-only; temporary instances for 4c: created 432, removed 432 (off the sets, same script).
> Sets: Item `6551:3200`, ItemInverted `6555:2540`, ItemAccordion `6558:3886`, ItemAccordionInverted `6560:2893`.

**Verdict: `blocked`** (family verdict: see `list.figma-validation.md`) — no failing check; 1 check `not verified` (6e: 13 of 20 variations have no baselined snapshot).

> History: run 1 (23.11.2026, morning) was `fail`: 4a (token list incomplete) and step 0 axis / combination rows (script limit with split sets). Both fixed (mapping file, script `axes:` / `figmaCheck.stateless`); this is re-run 2, full step 0 on the updated script. See "Repair log".

## Step 0 — check scripts (rows copied unchanged)

### `check-mapping-coverage.mjs list`

All `ds-item` rows `pass` (members, mapping file, YAML, props 17 / 17, parts 6 / 6, no focus, text defaults `Label` / `Description`).

### `figma-check-set.mjs list` → `use_figma` (full script, re-run 2, session `bf9fbb77-24c8-44f6-8a48-0e55c6150297`)

Rows per set (every row `pass` unless marked):

| set                   | variant axes                                      | options (variant · size · label size · open · state) | combinations | text props / defaults / bindings                        | reactions | paint bindings     | numeric bindings                                                              |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------- | --------- | ------------------ | ----------------------------------------------------------------------------- |
| Item                  | size, variant, label size, state, disabled — pass | pass (full)                                          | 120 / 120    | label, description · `Label`, `Description` · 120 / 120 | 72 / 72   | 0 unbound, 0 local | **review**: (variant root).width=480 (×120)                                   |
| ItemInverted          | same — pass                                       | pass (subsets)                                       | 120 / 120    | same · 120 / 120                                        | 72 / 72   | 0 unbound, 0 local | **review**: (variant root).width=480 (×120)                                   |
| ItemAccordion         | open, size, label size, state, disabled — pass    | pass (`open` false · true; others subsets)           | 96 / 96      | same · 96 / 96                                          | 72 / 72   | 0 unbound, 0 local | **review**: (variant root).width=480 (×96); accordion-content.width=480 (×48) |
| ItemAccordionInverted | same — pass                                       | pass (subsets)                                       | 96 / 96      | same · 96 / 96                                          | 72 / 72   | 0 unbound, 0 local | **review**: same as ItemAccordion                                             |

`review` rows: every one is a documented literal — `item.figma.md` → `tokens:` lists `variant root width 480` and `accordion-content width 480` as `bind: false` (code: the item fills its list; Figma sets show it at a fixed 480). Accepted per the rule.

Run 1 differences (kept for the record): axes row `fail` ("missing: open" on `Item*`, "missing: variant" on `ItemAccordion*`) and combinations `fail` (expected 0 / 144) — caused by the script, not by the sets. Hand check, same result as run 2:

- `Item` / `ItemInverted`: 3 `variant` × 2 `size` × 6 `label size`; `variant=default` has `state=default` only; `link` / `button` have default, hover, active; each plus `disabled=true` on `state=default` → 12 × (1 + 1) + 12 × (3 + 1) × 2 = **120**.
- `ItemAccordion` / `ItemAccordionInverted`: 2 `open` × 2 `size` × 6 `label size` × (3 states + disabled) = **96**.

## 1. Locate nodes — pass

All four set ids resolve to `COMPONENT_SET` (`6551:3200`, `6555:2540`, `6558:3886`, `6560:2893`); doc frame `6548:2182` and the four stacks `6553:2456`, `6555:2471`, `6559:2840`, `6560:2840` found. `variations.figmaSectionNodeId` `6548:2187` found (owner file).

## 2. Documentation frame header — pass (owner frame, see `list.figma-validation.md` §2)

## 3. Prop / state mapping

### 3a — pass

- Props: `variant` (default · link · button), `size` (base · lg), `label size` (base · h1…h5), `open` (accordion sets), `disabled` (blocked: `true` only on `state=default`, verified in the 120 / 96 counts), `state` (default · hover · active, no `focus`). Dropped by the signed-off Phase 2 proposal: `labelLevel`, `accordionGroup`, `download`, `href`, `rel`, `target`, `accordionMarker`, `accordionMarkerPosition` (excluded list) — nothing else missing, nothing extra.
- Names: every property and option lowercase with spaces; set names flat PascalCase, `Item` bare default; text defaults `Label` / `Description` (sentence case of the property name), each bound on all 120 / 96 variants (script rows).
- Component properties found on every Item set: `show icon` (BOOLEAN), `icon` (SLOT), `show label`, `label` (TEXT), `show description`, `description` (TEXT), `show content`, `content` (SLOT); `Item*` + `action icon` (INSTANCE_SWAP, default `6162:259`); `ItemAccordion*` + `accordion content` (SLOT).

### 3b — pass

Top-level splits: rule 1 `ItemAccordion` (different layers), rule 2 `…Inverted` for both. No set above 500 variants (120 max).

### 3c — pass

4 sets = the 4 in the signed-off proposal; no extra / merged / skipped set.

## 4. Bindings

### 4a — pass (run 1: fail, mapping repaired; see Repair log)

- Every fill / stroke / spacing / size / text binding is a Foundation library variable (script: 0 unbound, 0 local, all four sets). Stored colour equals the variable's resolved value on every bound paint (`resolveForConsumer`, alpha included): **0 mismatches** over 1008 / 1008 / 1344 / 1344 nodes.
- **Run 1 finding (repaired):** `ItemAccordion*` bind variables that were not in the Phase 1 `tokens:` list: `Component/Accordion/Marker/Width`, `Marker/Size`, `Accordion/Summary/Color/Active`, `Component/Icon/Padding/Base`, `Component/Icon/Color/Primary`, `Component/Text/Typo/Paragraph/FontSize`, `…/FontWeight`, `Alias/Text/Color/Primary` (Inverted: `Alias/Text/Color/InvertedPrimary`). All belong to the nested ds-accordion marker and the accordion-content paragraph default; the build is right, the list was incomplete.
- `Item*` use `Component/Heading/Level/1…5/FontSize` for `label size h1…h5` (in the list, "intentional reuse"), `List/Item/Background/Base` on ItemInverted (no inverted token exists in code — also in the list).

### 4b — pass

Nested instances: `Item` / `ItemInverted` `action-icon` → `IconCaretRight` (glyph key `9306abda…`, `isExposedInstance=false` ×96 each); `ItemAccordion*` `icon` (marker) → `IconCaretDown` (`c7c7b419…`, ×96 each); `List` → `Item` set key `153da16d…` (×6), `ListInverted` → `ItemInverted` key `e099546d…` (×6), none detached, none exposed.

### 4c — pass (glyph colours, temporary instances 432 created / 432 removed)

| set                            | state                               | action-icon / marker fill (bound variable)                                                                                          |
| ------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Item `link` / `button`         | default · hover · active · disabled | `List/Item/Color/Text/Base` · `…/Hover` · `…/Active` · `…/Disabled` (×12 each per variant)                                          |
| ItemInverted `link` / `button` | same                                | `List/Item/Inverted/Color/Text/Base` · `…/Hover` · `…/Active` · `…/Disabled`                                                        |
| ItemAccordion                  | default · hover · active · disabled | `Icon/Color/Primary` · `List/Item/Color/Text/Hover` · `Accordion/Summary/Color/Active` · `Icon/Color/Primary` (open=false and true) |
| ItemAccordionInverted          | same                                | `Icon/Color/Primary` · `List/Item/Inverted/Color/Text/Hover` · `Accordion/Summary/Color/Active` · `Icon/Color/Primary`              |

`Item*` `variant=default` has no action icon (correct). The marker colours **follow the code** (the accordion marker keeps its own colors; code drift recorded in `item.figma.md` Notes). Visible effect: dark caret on dark in `ItemAccordionInverted` (default / active / disabled) — see 6c.

### 4d — pass

Native `SLOT`s on every variant at the recorded part: `icon` (120 / 120 / 96 / 96, parent = item row), `content` (parent `text-group`, all variants), `accordion content` (96 / 96, parent `accordion-content`). Preferred: `icon` → Icon wrapper set `d04070c1…` only (Badge missing in Figma — `item.figma.md`); `accordion content` → `List` (`3e4525…`) in ItemAccordion, `ListInverted` (`39f37d…`) in ItemAccordionInverted; `action icon` → 79 glyphs. Defaults: `icon` / `content` empty (hidden by `show` booleans, 0 children ×all), `accordion content` 0 children on `open=false` ×48, one `paragraph` frame on `open=true` ×48 (both accordion sets). `drivenBy`: the `List` / `ListInverted` slots hold `Item` / `ItemInverted` instances with `size` matching their variant (names read `size=base` / `size=lg`).

### 4e — pass

Reactions: Item 72 / 72, ItemInverted 72 / 72, ItemAccordion 72 / 72, ItemAccordionInverted 72 / 72 (script rows; `variant=default` has none).

## 5. Layout

### 5a — pass (all four stacks)

| stack                             | `divider-col` | `divider-row` | geometry                                                          | order                          | renders                                              |
| --------------------------------- | ------------- | ------------- | ----------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------- |
| Item `6553:2456`                  | 3 / 3         | 35 / 35       | every divider on a cell boundary (±1px), full grid width / height | Column Labels 0, set 1, Grid 2 | all visible, opacity > 0, `LINE`s have render bounds |
| ItemInverted `6555:2471`          | 3 / 3         | 35 / 35       | same                                                              | same                           | same                                                 |
| ItemAccordion `6559:2840`         | 3 / 3         | 23 / 23       | same                                                              | same                           | same                                                 |
| ItemAccordionInverted `6560:2840` | 3 / 3         | 23 / 23       | same                                                              | same                           | same                                                 |

Styling vs template prototypes `2781:271` (row) and `2801:293` (col): stroke `Global/Color/Purple/5`, `dashPattern [10,5]`, weight 2 (col: `strokeLeftWeight` 2, width 0.01) — identical on every stack. Outer stroke: Purple/5, 2, `[10,5]` on all four sets. No hidden node in any stack outside the component set.

### 5b — pass

Column labels centred on their columns (default 256 · hover 768 · active 1280 · disabled 1792); `state` axis name centred on the three state columns (768). Row labels (Item): `label size` rows 52, 156, 260 … = row centres; `variant` lane 312 / 936 / 1560, `size` lane 936 / 2808 = lane centres. ItemAccordion: `label size` 81, 243, 405 …; `size` 486 / 1458 / 2430 / …; `open` 972 / 2916 = lane centres.

### 5c — pass

Top-left / first variant is the code default (`size=base, variant=default, label size=base, state=default, disabled=false`; accordion: `open=false, size=base, label size=base`); `state` is the column axis; options follow canonical order (`base`, `h1…h5`; `false`, `true`).

### 5d — pass

`ItemInverted` / `ItemAccordionInverted` sets are filled with `Alias/Surface/Primary` (dark), the light sets with `Alias/Surface/White` (variable-bound). Screenshots `6555:2471`, `6560:2840` show the dark surface.

### 5e — pass (with a note, owner file)

`kind=variations` `Section` `6548:2187` is the second child of `Documentation` (after the `copy-me` placeholder `6548:2186`); one `Preview` per covered set (Item, ItemAccordion; none for the Inverted sets); 10 + 10 instances, captions equal the changed properties (checked: `show label`, `show label · label size h1…h5`, `show description`, `show icon`, `show content`, `all on`). Everything else at the default variant (non-default variant props = `label size` only). **Note:** the `ItemAccordion` entries run h4, h1, h2, h3, h5 (the `h4` case reuses the existing `nested-accordion` snapshot), while `Item` runs h1…h5. Cosmetic.

## 6. Visual

### 6a — pass

Snapshots read (Desktop): `list-basic`, `list-linked`, `list-download`, `list-accordion`, `list-nested-accordion`. `list-ordered` is not read (`ordered` is excluded from the Figma set). `list.visual.html` has extra cases that aren't baselined yet (see 6e).

### 6b — pass

Screenshots (every vertical / horizontal grid line visible): Item `6553:2456`, ItemInverted `6555:2471`, ItemAccordion `6559:2840`, ItemAccordionInverted `6560:2840`.

### 6c — pass with differences noted

- `list-basic` Item 1 / 2 (label, label + description): Figma `show label`, `show label · show description` match (navy bold label, regular description, grey bottom border).
- `list-linked` / `list-download`: Figma `variant=link` / `button` rows show the right-aligned glyph in navy, disabled grey; the snapshot's external / download glyphs are `action icon` swaps (79 preferred glyphs), default `IconCaretRight`.
- `list-accordion` item 1: Figma `ItemAccordion` shows label left, caret-down right, grey bottom border ✓. Item 2 uses `marker="plus"` — excluded in the signed-off proposal, skipped.
- **Default `Item` rows are empty** (all `show` booleans default to `false`): the 24 `variant=default` rows of the `Item` grid look blank. Signed-off decision; the List slot default fill turns them on.
- `ItemAccordionInverted`: caret dark on dark by default / active / disabled — same as code (drift recorded), not a set bug.

### 6d — pass

Hover / active / disabled and `inverted` are not in the snapshots (no `inverted` case in `list.visual.play.ts` `VARIANTS_HOST`) — skipped.

### 6e — not verified

Variations whose test case is in `list.visual.html` but not in the baselined snapshots: `show label · label size h1…h5`, `show description`, `show icon`, `show content`, `all on` (`list-basic`, 6 of 10 are new), `list-accordion` equivalents (7 of 10). `show label` (both previews) compare with the existing snapshot ✓ (label left, border; accordion caret). Needs `/update-screenshots` on the PR, then re-run.

### 6f — pass

See `list.figma-validation.md` 6f (owner frame): Anatomy and Measurements drawings exist and fit their instances.

## Repair log

- 23.11.2026: mapping-only — `item.figma.md` `tokens:` now lists the nested ds-accordion marker tokens, the accordion-content paragraph tokens, and notes the documented width literal (480). `bind: false` entries for the 480 widths and the `InvertedPrimary` slot-default variable added. Figma untouched. Re-run 2: every bound variable name from the 4a audit (36 distinct on `Item*`, incl. the accordion marker / icon / paragraph ones) is now in `tokens:` → 4a `pass`; the script, the 4a audit and all other checks were not changed by it. Script fixed 23.11.2026 (`axes:` per set, `figmaCheck.stateless`), step 0 re-run in full: all `pass` / accepted `review`.
- 23.11.2026 (6f, run 3): Figma-only repair in the owner's Anatomy drawing — instance `List (link item)` description lengthened to "Description of the item"; markers `B1` (x 18.5), `B2` (70.5), `A` (200), `B6` (490) moved so their dots centre on the part glyphs (±1px). Re-checked by screenshot. No mapping change.
