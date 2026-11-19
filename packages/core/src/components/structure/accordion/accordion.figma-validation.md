# accordion — Figma validation

Run 2 (after repair 1), 19.11.2026; snapshot check resolved 19.11.2026. File `NzMFv5HwO14Mmro8bWyvlO`, frame `6302:1291`, set `6304:4823`.

## 2. Header

| Check                             | Result | Evidence                                                                                                                                    |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `kicker` = `Core / Structure`     | pass   | `Core / Structure`                                                                                                                          |
| `component` = `Accordion`         | pass   | `Accordion`                                                                                                                                 |
| `lead` = JSDoc lead verbatim      | pass   | "Accordion displays collapsible content sections … expandable groups."                                                                      |
| `review-status` = `status=review` | pass   | main component `status=review`                                                                                                              |
| `VERSION` = `v0.1.0`              | pass   | `VERSION=v0.1.0` (`packages/core/package.json` 0.1.0)                                                                                       |
| `LAST UPDATED` = last write       | pass   | `19.11.2026`                                                                                                                                |
| Links                             | pass   | storybook `…/docs/components-structure-accordion-accordion--accordion`, toky `?filter=accordion`, github `…/components/structure/accordion` |

## 3. Prop / state mapping

| Check                          | Result | Evidence                                                                                                                                                                                                                    |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variant properties and options | pass   | `open` [false, true] · `typography` [base, title, h1, h2, h3, h4, h5] · `marker` [base, plus, plus-minus, none] · `marker position` [right, left] · `state` [default, hover, focus, active] — all lowercase, defaults first |
| No component states            | pass   | none in mapping, none built                                                                                                                                                                                                 |
| Text property `summary`        | pass   | `summary#6304:0`, TEXT, default `Summary`, bound on 392 / 392 `label` nodes                                                                                                                                                 |
| Excluded props absent          | pass   | no `group`, `summary level`, `button*` property                                                                                                                                                                             |
| Set count / names / split      | pass   | one set `Accordion`, no split, 392 variants (≤ 500) = mapping count; no `sub-label` (family of one)                                                                                                                         |

## 4. Bindings

| Check                          | Result | Evidence                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4a Tokens                      | pass   | 5,880 variable bindings + 784 paints over 392 variants: all `remote: true`, all in the `tokens:` list; every paint colour = `resolveForConsumer` value; 0 unbound solid paints                                                                                                                                                               |
| 4a Label typography per option | pass   | fontSize / fontStyle → `Summary/<Typo\|TitleTypo\|Level/N>/FontSize\|FontWeight` on 392 / 392                                                                                                                                                                                                                                                |
| 4a Label colour per state      | pass   | Base (default, focus) · Hover · Active on 392 / 392                                                                                                                                                                                                                                                                                          |
| 4c Fixed icon (marker)         | pass   | glyph per variant: base `IconCaretDown` (open: 180°) · plus `IconPlus` (open: 45°) · plus-minus `IconPlus` / `IconMinus`; local glyph library instances, not exposed, no swap property; vector fill `Icon/Color/Primary` (default, focus), `Accordion/Summary/Color/Hover` / `Active`; `marker=none` hidden; left = first child of `summary` |
| 4b Nested instances            | pass   | only the glyph instances above                                                                                                                                                                                                                                                                                                               |
| 4d Slot `content`              | pass   | `content#6304:393` is a `SLOT` on 392 / 392, second child of the variant (after `header`), visible only on `open=true` (196); default fill = 1 text node "Lorem ipsum …" on 196 / 196                                                                                                                                                        |
| 4e Interactions                | pass   | default: ON_HOVER → hover, ON_PRESS → active (98 / 98); hover: ON_PRESS → active (98 / 98); focus / active: none (196 / 196); all `CHANGE_TO`, instant                                                                                                                                                                                       |
| Focus rings                    | pass   | 2 rings (`focus-ring-outer` Focus/Size/Outer + Color/Base, `focus-ring-inner` Size/Inner + Color/Border, radius Accordion/Radius) on 98 / 98 focus variants, none elsewhere; root and `header` unclipped on 98 / 98                                                                                                                          |

## 5. Layout

| Check                  | Result | Evidence                                                                                                                                                                                                                       |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5a Outer stroke        | pass   | strokes, `dashPattern` [10, 5], weight and fills identical to template set `2766:300`                                                                                                                                          |
| 5a Dividers count      | pass   | `divider-col` 3 / 3, `divider-row` 97 / 97 (Grid `6302:1366`)                                                                                                                                                                  |
| 5a Geometry            | pass   | on cell boundaries (cell 352 × 120), full height / width, ±0                                                                                                                                                                   |
| 5a Layer order         | pass   | `Column Labels`, `Accordion`, `Grid`                                                                                                                                                                                           |
| 5a Renders / styling   | pass   | every `divider-row` has `absoluteRenderBounds`; styling = prototypes `2801:293` / `2781:271` (stroke var `13:7325`, weight 2, dash [10, 5])                                                                                    |
| 5b Labels              | pass   | column values centred on columns, `state` centred on set; 4 lanes (`open` 2 brackets, `marker position` 4, `marker` 14, `typography` 98 values), axis names at y 32.5 = column-value line, values centred on their rows (±1px) |
| 5c Ordering            | pass   | first layer / top-left cell = `open=false, typography=base, marker=base, marker position=right, state=default` at (16, 40)                                                                                                     |
| 5d Inverted background | pass   | no inverted set                                                                                                                                                                                                                |
| 5e Variations          | pass   | no `show` booleans → placeholder deleted (sections: copy-me, anatomy, measurements)                                                                                                                                            |

## 6. Snapshots

Screenshot of `Labeled Set` `6302:1304` (1769 × 11816): all column and row lines visible.

| Case                                     | Result  | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| markers — glyphs, positions, open/closed | pass    | caret-down / caret-up, plus / ×, plus / minus, none: same as Figma `typography=base` rows                                                                                                                                                                                                                                                                                                                                                                                                              |
| left-markers                             | pass    | marker before the label (caret, plus)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| basic (`summary-title`)                  | pass    | bold headline summary, caret right = `typography=title`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| markers / left-markers — summary weight  | pass    | Snapshot (23.09.2026) shows a **bold** summary without `summary-title`; Figma `typography=base` is regular. The snapshot is stale: current code renders 400 (token `Alias/Text/Weight/Regular`; local render of the CI-built `www` via `web-server.js`, `BaloiseCreateText 400 loaded`). `/update-screenshots accordion` (PR #321, run 44488408434) kept it because `maxDiffPixelRatio: 0.1` (`playwright.config.mts:33`) accepts the 0.93 % pixel difference. Figma matches code. Finding in TODO.md. |
| nested, stack-item                       | pass    | open/closed and marker as in Figma; slot content is consumer content                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| button-accordion                         | skipped | button mode excluded (mapping file)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## Verdict

**pass** — every check passed (snapshot weight mismatch traced to a stale snapshot, see 6).

## Repair log

- **Iteration 1** (19.11.2026) — `fail` 6b: focus ring clipped on the `typography=h1` rows (seen on the
  set screenshot: only the corners showed). Cause: the summary (36.4px) leaves < 5px inside the 40px
  `header`, and `header` and the variant clipped their content. Fix: `clipsContent = false` on the
  variant root and `header` of the 98 `state=focus` variants (code: no overflow clipping on
  `#header`). Read back: 0 clipped; screenshot of `h1` focus variants shows the full ring.
- **Found in Phase 8** (19.11.2026, not caught by Phase 4) — `summary` used `primaryAxisAlignItems =
SPACE_BETWEEN`, which makes Figma ignore the bound `itemSpacing` (`Summary/Gap`): the label ran into
  the marker (gap 0, seen on the Measurements drawing). Fix: `primaryAxisAlignItems = 'MIN'` on all 336
  variants (the label is `FILL`, so the look is unchanged; code: `gap` + `flex: 1`). Read back: gap 8
  on the default variant, `itemSpacing` bound on 336 / 336.
