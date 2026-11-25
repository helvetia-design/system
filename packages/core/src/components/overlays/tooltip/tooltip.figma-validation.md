# tooltip → Figma validation

Run 19.11.2026, read-only, against `NzMFv5HwO14Mmro8bWyvlO` (page `Core / Overlays` `6350:1379`,
frame `Tooltip Documentation` `6350:1383`, component `Tooltip` `6350:2080`).

## 2. Header (`6350:1383` › `Header`)

| Check               | Result | Evidence                                                                                                                      |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `kicker`            | pass   | `Core / Overlays`                                                                                                             |
| `component`         | pass   | `Tooltip`                                                                                                                     |
| `lead` = JSDoc lead | pass   | "Tooltip displays contextual information when users hover over, focus on, or tap a trigger element." — verbatim `tooltip.tsx` |
| `review-status`     | pass   | main component `status=review`                                                                                                |
| `VERSION`           | pass   | `v0.1.0` = `packages/core/package.json`                                                                                       |
| `LAST UPDATED`      | pass   | `19.11.2026` (Phase 3 run)                                                                                                    |
| `link-storybook`    | pass   | `https://helvetia-design.vercel.app/?path=/docs/components-overlays-tooltip-tooltip--tooltip` (doc-config `tabs[0].storyId`)  |
| `link-toky`         | pass   | `https://helvetia-toky.vercel.app?filter=tooltip`                                                                             |
| `link-github`       | pass   | `https://github.com/helvetia-design/system/tree/main/packages/core/src/components/overlays/tooltip`                           |

## 3. Prop / state mapping

| Check                           | Result | Evidence                                                                                                                                                                                    |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a. Props present, nothing extra | pass   | `6350:2080` is a `COMPONENT` (parent `FRAME`, no set) — `componentPropertyDefinitions` = `{ content#6350:0: TEXT, default "Content" }`; mapping: one text prop, 5 excluded props, no states |
| a. Naming                       | pass   | property `content` lowercase; component `Tooltip` PascalCase; sub-label removed (family of one, "None" row)                                                                                 |
| a. Text property bindings       | pass   | `content`: 1 / 1 bound — `text` `6350:2082` `componentPropertyReferences.characters = content#6350:0`                                                                                       |
| b/c. Top-level splits           | pass   | none expected (no rule 1/2/3 axis); 1 component, matches `sets:`                                                                                                                            |

## 4. Token bindings (`remote: true` on every one)

| Node                                                   | Property                                | Result                                                                                           | Evidence                                                                                                                                                     |
| ------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Tooltip` `6350:2080`                                  | fill                                    | pass                                                                                             | `🧩 Component/Tooltip/Color/Background`; stored `[0, .0275, .2235, 1]` = resolved                                                                            |
|                                                        | 4 corner radii                          | pass                                                                                             | `🧩 Component/Tooltip/Radius`                                                                                                                                |
|                                                        | drop shadow                             | pass                                                                                             | color / offsetX / offsetY / blur / spread → `🧩 Component/Tooltip/Shadow/*`; stored (0, 0, 10, 0, rgba(0,7,57,.15)) = resolved; `showShadowBehindNode: true` |
| `content` `6350:2081`                                  | padding L/R                             | pass                                                                                             | `🧩 Component/Tooltip/PaddingX` (12)                                                                                                                         |
|                                                        | padding T/B                             | pass                                                                                             | `🧩 Component/Tooltip/PaddingY` (8)                                                                                                                          |
|                                                        | fill                                    | pass                                                                                             | none (code: transparent)                                                                                                                                     |
| `text` `6350:2082`                                     | fill                                    | pass                                                                                             | `🧩 Component/Tooltip/Color/Text`; stored `[1,1,1,1]` = resolved                                                                                             |
|                                                        | fontSize                                | pass                                                                                             | `🧩 Component/Tooltip/Text/FontSize` (14)                                                                                                                    |
|                                                        | fontStyle                               | pass                                                                                             | `🧩 Component/Tooltip/Text/FontWeight` (Regular)                                                                                                             |
|                                                        | fontFamily                              | pass                                                                                             | `🧩 Component/Tooltip/Text/FontFamily` (Baloise Create Text)                                                                                                 |
|                                                        | lineHeight / letterSpacing / decoration | pass (documented exception)                                                                      | literal 150%, 0%, NONE = resolved Foundation values (STRING variables, not bindable)                                                                         |
| b–e. Nested instances, icon slots, slots, interactions | pass (none expected)                    | no nested DS component, no slot, no `state` axis; layers under `Tooltip`: `content`, `text` only |

## 5. Layout

| Check                      | Result                  | Evidence                                                                                                                                                                                            |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a. Outer stroke + dividers | pass (single component) | no set, so no set stroke and 0 / 0 dividers expected; `Grid` deleted with the template set (approved 19.11.2026). `Column + Box` `6350:1410` holds only `Tooltip`, padding 16 (cell rule), 110 × 69 |
| b. Labels                  | pass (none expected)    | no axis → `Row Labels` / `Column Labels` deleted                                                                                                                                                    |
| c. Ordering                | pass                    | single variant                                                                                                                                                                                      |
| d. Inverted background     | pass (none expected)    | no inverted split; `Inverted` stack deleted                                                                                                                                                         |
| e. Variations              | pass                    | no `show` boolean → placeholder deleted; `Documentation` holds 3 sections (`6350:1387`, `6350:1389`, `6350:1390`)                                                                                   |
| No default layer names     | pass                    | `Tooltip`, `content`, `text`                                                                                                                                                                        |

## 6. Snapshots

| Check                              | Result               | Evidence                                                                                                                                     |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| b. Screenshot of the labeled stack | pass                 | `get_screenshot` `6350:1396`: tooltip with shadow, nothing clipped                                                                           |
| c. `tooltip-basic`                 | pass                 | snapshot: navy rounded box, white 14px text, 12 / 8 padding, soft shadow — Figma variant matches (text differs only by the property default) |
| d. `placement-*`, `content-width`  | skipped              | `placement` and `contentWidth` excluded in the confirmed mapping                                                                             |
| e. Variations                      | pass (none expected) | no variations                                                                                                                                |

## Verdict

**pass** — no failures, no `not verified` checks.
