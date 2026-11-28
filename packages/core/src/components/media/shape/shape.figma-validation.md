# shape — Figma validation

Run 28.11.2026, file `NzMFv5HwO14Mmro8bWyvlO`, set `Shape` 7027:1892, doc frame 7025:1693. Read-only.
Code read: `shape.tsx`, `shape.interfaces.ts`, `shape.host.scss`, `test/shape.visual.html`.

## 2. Header (7025:1693 › Header)

| Check             | Result | Evidence                                                                 |
| ----------------- | ------ | ------------------------------------------------------------------------ |
| kicker            | pass   | `Core / Media`                                                           |
| component         | pass   | `Shape`                                                                  |
| lead = JSDoc lead | pass   | verbatim shape.tsx:16                                                    |
| review-status     | pass   | instance `status=review`                                                 |
| VERSION           | pass   | `v0.1.0` = packages/core/package.json                                    |
| LAST UPDATED      | pass   | `28.11.2026`                                                             |
| link-storybook    | pass   | `…/?path=/docs/components-media-shape-shape--shape` = doc-config tabs[0] |
| link-toky         | pass   | `…?filter=shape`                                                         |
| link-github       | pass   | `…/tree/main/packages/core/src/components/media/shape`                   |

## 3. Props / sets

| Check                     | Result | Evidence                                                                                                                 |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| code → Figma: `color`     | pass   | SHAPE_COLORS 8/8 in variantOptions                                                                                       |
| Figma → code: `color`     | pass   | 8 options, all in SHAPE_COLORS, none `@deprecated`                                                                       |
| code → Figma: `variation` | pass   | `1,2,3`                                                                                                                  |
| Figma → code: `variation` | pass   | `1,2,3`                                                                                                                  |
| code → Figma: `rotation`  | pass   | `0,90,180,270`                                                                                                           |
| Figma → code: `rotation`  | pass   | `0,90,180,270`                                                                                                           |
| No extra properties       | pass   | defs = color, variation, rotation (VARIANT); no text/bool/swap — mapping has none                                        |
| Naming                    | pass   | lowercase props/options, set `Shape` PascalCase, family of one → no sub-label (stack 7025:1704 children `[Labeled Set]`) |
| Splits                    | pass   | one set, 96 children ≤ 500, matches mapping                                                                              |

## 4. Bindings (all 96 variants)

| Check                                           | Result     | Evidence                                                                                                |
| ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| width/height → `🧩 Component/Shape/Size/Device` | pass       | 96/96 bound, lib key e0ac0fee…                                                                          |
| fill → color variable per `color`               | pass       | 96/96, lib key matches mapping per option, 0 mismatches                                                 |
| stored paint = resolved value                   | pass       | 8/8 colors equal (e.g. purple 0.424,0.133,0.451,1)                                                      |
| no hardcodes                                    | pass       | 0 frame fills, 0 strokes, clipsContent true on 96/96                                                    |
| rotation per variant                            | pass       | vector rotation 0/-90/-180/90 for 0/90/180/270 (CW), 96/96                                              |
| Device modes                                    | pass       | temp instances (created 12, removed 12): Mobile 66, Tablet 120, Desktop 198; child vector scales to box |
| nested / icon slots / slots / interactions      | pass (n/a) | mapping `nested: []`, no slots, no states                                                               |

## 5. Layout

| Check             | Result     | Evidence                                                                                                                                     |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Outer stroke      | pass       | dashed [10,5], weight 2, color bound VariableID:ac2878…/13:7325 (cloned from template set)                                                   |
| divider-row count | pass       | 23 / 23, y = n×98, w 392, `absoluteRenderBounds` non-empty                                                                                   |
| divider-col count | pass       | 3 / 3, x = 98/196/294, h 2352, 0.01 wide, strokeLeftWeight 2, dash [10,5]                                                                    |
| Layer order       | pass       | Column Labels(0), Shape(1), Grid(2)                                                                                                          |
| Cell grid         | pass       | cell 98×98 (66+2×16), 0/96 off-centre                                                                                                        |
| Column labels     | pass       | `rotation` cx 196 = W/2; values cx 49/147/245/343                                                                                            |
| Row labels        | pass       | `variation` lane x 0, groups cy 448/1232/2016 (8 rows each); `color` lane x 82, 24 labels cy = 56+r×98+49; axis names y 32.5 = column values |
| Brackets          | pass       | 3, y 64/848/1632, h 768 (group − 8 each end)                                                                                                 |
| Ordering          | pass       | first layer + top-left = `color=purple, variation=1, rotation=0`; rows variation(3) outer, color(8) inner; columns rotation                  |
| Inverted          | pass (n/a) | no inverted axis                                                                                                                             |
| Variations        | pass       | `variations: []` → placeholder deleted (was 7025:1698)                                                                                       |

## 6. Visual snapshots (Desktop-Chrome-linux)

Figma screenshot: stack 7025:1704 — every row and column divider visible.

| Case                       | Result | Evidence                                           |
| -------------------------- | ------ | -------------------------------------------------- |
| basic                      | pass   | purple, variation 1, rotation 0 silhouette matches |
| colors                     | pass   | 8 hues match paint values, same silhouette         |
| variation-1 (0/180/270/90) | pass   | cell patterns match per rotation (CW)              |
| variation-2                | pass   | cell patterns match                                |
| variation-3                | pass   | cell patterns match                                |

## Verdict: **pass**

No code-side findings.
