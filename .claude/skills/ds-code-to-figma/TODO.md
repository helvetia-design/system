# Todos

## Anatomy & Measurement

- [x] Anatomy with mutually exclusive parts (rule 10.11.2026, Phase 7 step 1): use whatever shows the parts best — booleans on, another variant/state, or several instances (as few as possible, 48px apart) when parts exclude each other.
- [x] fix anatomy markers and legends
- [x] Measurements rework (04.11.2026): Phase 1 step 6 measures sizes on the dev server and triages them (`conventions/measurements.md`); Phase 6 renders a drawn spec, a sizes table and a behavior card. The `ds-tag`/`ds-spinner` review rules (no radius on pills, padding both sides, one color per kind, cards hug, long token names) are folded in. Typography uses a numbered marker + table row instead of the `Spec/Callout` geometry; `icon` merged into `size`, `radius` renamed `shape`.
- [x] Annotation library for the new Measurements (04.11.2026): `Spec/Dimension` got `style=solid|dashed` and `kind=shape` (32 variants); new `Spec/Gap` (hatched) and `Spec/Marker` (numbered, per kind). `Spec/Radius` (blue) and `Spec/Outline` (dashed) already fit. Legacy, kept for existing frames: `Spec/Dimension` `kind=icon`, `Spec/Legend item`, `Spec/Callout` — delete once no documentation frame uses them.
- [x] Re-triage `button.figma.md` measurements (05.11.2026): first full run of the new Measurements flow; findings folded into Phase 6 (numbering, border offset, type marker position, wrap demo, table footnote).
- [x] Measurements markers v2 (05.11.2026, from the `ds-button` review against TapTap): radius circle sized to the radius in the corner (`Spec/Corner radius`), labels = value + number bubble, leaders point away from the center, padding/gap get dimension lines, every table row is drawn (extra `min-content` / `focus` instances), type/border/focus use `Spec/Leader`, icons get `Spec/Icon size` overlays. Legacy now also: `Spec/Radius`.
- [x] Measurements markers v3 (05.11.2026, second `ds-button` review): "Specs" renamed to "Measurements" (Figma `Title` `kind=measurements`, `measurements:` key, `conventions/measurements.md`, Phase 8 file); one pill label style for every marker; dashed `Spec/Dimension` lines rebuilt as 1px one-side-dashed rectangles (were off-center between the ticks); `drawnColor` (first color option whose border ≠ fill — `secondary` for the button); padding tints inset by the border with `radius − border` corners; limits only shown when they bind (button min width skipped); option columns code default first. `Spec/*` component names kept.
- [x] Measurements markers v4 (05.11.2026): soft pills (tint + outline, dark value text for AA — kind color table in `conventions/measurements.md`); gaps measured from the tick ends; `Spec/Dimension` `label` variants (`center`/`start`/`end`/`callout`/`callout-start`/`callout-end`, 92 variants) and the pill-placement order; button padding pills shifted outward, gap pills on callouts.
- [x] Measurements v5 (05.11.2026): card renamed "Drawing"; type row named `Text (<part>)`; new `Spec/Text box` (dashed outline on the text's line box, type leader starts on it); leader dots 3px without outline, centered on their edge; callout leaders exactly centered; table columns sized from content (no wrapping).
- [x] Measurements v6 (05.11.2026): bubble numbers centered (fixed circle, cap-height trim); `Spec/Icon size` text-free (25% fill + outline); focus ring pill `2 + 3px ring`; rules for callouts-as-exception, units (pills yes, table no), and no fill on shape markers.
- [x] Measurements v7 (06.11.2026): template Measurements placeholder rebuilt with the new layout (both copies); general "Overlaps" rule with a fallback order; "Placement" table covers vertical padding and column gaps (`side=right`), radius on a free corner, leaders on any side with space (right preferred).
- [x] `Spec/Leader` `side=top` / `bottom` (06.11.2026): 8 vertical variants (line + pill beyond the end, height = length). The template's type marker now goes below the component, so nothing crosses the pill-shaped radius ring.
- [x] `ds-close` documentation (06.11.2026): Copy me, Anatomy and Measurements built; new `drawnState` field ("Shape visibility": transparent default → drawn in `hover`).
- [x] Re-triage `spinner.figma.md` measurements (still the old flat per-option list) on its next run.
- [x] Build vs. clone review (do together with the Measurements rework). Go through all phases and `conventions/*` and list every spot where the skill builds something from scratch that already exists in the template or on `🧰 Annotations` (e.g. Measurements cards, `Spec/*` annotations, Copy me content, the "🖼️ names" section for asset components). For each: would cloning a prototype and changing only text and positions be simpler and keep the look in one place? Keep in the skill only what can't be cloned (calculated positions and sizes, per-component counts, text formatting that resets on text change).

## Rest

- [x] Letter-spacing: now a token — `Alias.Text.LetterSpacing.{Text,Heading}` (0rem), and a `letterSpacing` field on every typography token. Bind the Figma `LetterSpacing` variable instead of using the default.
- [x] Text-decoration: now a token — `Alias.Text.TextDecoration.None`, and a `textDecoration` field on every typography token (Figma variable holds `"NONE"`). Text-transform follows the same pattern (`Alias.Text.TextTransform.None`).
- [x] Bind all seven typography variables per text node (ADR-0037, `docs/plans/typography-text-parts-plan.md` decision 8): fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textDecoration, textTransform — not just the 4 wired today. Inline text parts (a link in running text) bind only weight, letterSpacing, textDecoration, textTransform — family/size/lineHeight stay inherited from the surrounding text, don't bind them.
- [x] Top-level split onyl when working with inverted. We need to ask the A-Team
- [x] Phase 2 table conflict (fixed 10.11.2026): the "different layers/structure" row's example is now `ds-pagination` `variant` (`Pagination` / `PaginationDots`), with `ds-button` `color` named as the counter-example (same layers, tokens only → variant).
- [x] Copy me content (05.11.2026): Phase 6 now places the plain default variant with no overrides (no more "✓ Button ✓"). The button's Copy me in Figma still has both icons on until its next run.
- [x] Recreate or improvet the review process (when too many, inverted, strukturell stark verändert)
- [x] Hover / active interactions (rule 10.11.2026, `PHASE-3-BUILD.md` → "Interactions", Phase 4 step 4e): `default` → while hovering → `hover`, `default` / `hover` → while pressing → `active`, instant; none on `focus`, `active` or component-state `true` variants. Built on Button first, Close and Input 11.11.2026; Pagination has no interaction states of its own (its Buttons react).
- [x] Component-state variants (rule added 10.11.2026, `PHASE-2-PROPOSE.md` mapping table + "Component-state columns"): `state` holds interaction states only (`default` / `hover` / `focus` / `active`); `disabled`, `loading`, `invalid` are own `false` / `true` variants, `true` only with `state=default`. Built sets still on the old combined `state` axis — migrate on their next run: ~~Button~~ (done 10.11.2026, in place, with interactions), ~~Close~~ (done 11.11.2026, in place, with interactions), ~~Input~~ (done 11.11.2026: refined rule — `loading` and `invalid` stay interactive in code so they cross with the interaction states; 208 variants, 144 reactions), ~~Pagination~~ (done 11.11.2026: no interaction states of its own, so no `state` axis; `disabled` blocked; sets renamed to flat names). Component-property overrides of instances in other components (e.g. Pagination's Buttons) must be re-set after the migration.
- [x] `ds-close` focus variants (06.11.2026): rebuilt like `ds-button` — own size, 2px `Focus/Color/Border` + 3px focus color outside. Phase 4 missed it (snapshots don't show focus); consider a Phase 4 check comparing the focus ring with the `focus-shadow` mixin.
- [x] Template `Component Sets` column height (11.11.2026): tried `HUG` on the template — the column's grey panel then stops short of the body whenever `Documentation` is taller, so reverted to `FILL`. The per-frame rule in `PHASE-3-BUILD.md` (switch to `HUG` only when the sets are taller) is the fix; no template change.
- [x] Verify runs (11.11.2026, Figma branch `TMW8IfOY7LbN3IXvu3cI15`): `ds-button` (blocked on `/update-screenshots` for `button-icon`) and `ds-input` (pass) and `ds-spinner` (fail, below) done. Findings folded into the skill. Branch merged into main 11.11.2026 (node ids unchanged; Spinner set keys changed — mapping files updated).
- [x] `ds-spinner` fixes (11.11.2026, found by its Variations check): ~~(a) default variant `size=sm`~~ fixed on the branch 11.11.2026 (sets recreated with `base` first, 360 instances re-pointed); (b) label color: bind to `--ds-spinner-label-color-primary` / `-inverted` once the token sync creates them (now `PENDING-FIGMA-SYNC`). `spinner-circle-variation` needs `/update-screenshots` for the two added label cases. Copy me reset to the plain default (it had `show label` on) 11.11.2026.
- [x] Families (09.11.2026, `conventions/families.md`, ADR-0036): first run on `ds-tabs` to prove the flow (native `SLOT` + preferred instances, `drivenBy` pre-set, inverted mirror). Then regenerate `card` (sub-components missing) and `button` (`ButtonGroup` missing) — no migration.
- [x] `ds-badge` (09.11.2026): full run. Lessons: a parent swap can't reach a glyph inside the Icon wrapper (nest the glyph directly); padding tints on a pill are clipped to its shape.
- [x] Phase 4 divider render check (10.11.2026): `divider-row` keeps the non-empty `absoluteRenderBounds` check; `divider-col` (0.01-wide rectangle, `null` even in the template) is checked on the step 6b screenshot. Hidden icon layers are read on temporary instances (step 4c).
- [x] Icon glyph library (10.11.2026): all 79 glyphs follow `ds-icon`'s `--icon-padding` (commit `6ad7d87d8`): component (auto-layout, padding) › `box` › `Vector`, fixed 1px padding; Icon wrapper overrides it per size (0.875 / 1 / 1.5 / 2 / 2.5). `information`, `triangle`, `whats-app` flattened to one `Vector`. Open: after the token sync, bind the paddings to `Icon/Padding/*` (not in Figma yet).
- [x] Icon color per parent: bind the vector fill to the parent's color source on every variant and state. Badge and Button (both sets, every state, 10.11.2026) checked. Input checked 10.11.2026 (read-only): the `alert` icon's vector fill = the description color on all 12 `color=invalid` variants (Danger, Disabled when disabled) ✓; Pagination's carets sit in `Button` instances ✓. The other 13 code parents of `ds-icon` (Toast, App Footer, Tabs, Accordion, …) have no Figma mapping yet — they get the rule on their first run. Input done 11.11.2026: ~~(a) the `alert` icon is still an Icon wrapper instance (`size=sm, color=danger`); the "Fixed icons" rule (10.11.2026, `conventions/content-selection-and-mitigations.md`) says nest the glyph directly, no swap property — fix on Input's next run; (b) size: Figma uses `sm` (14px), code renders `<ds-icon name="alert">` with no size and `form.mixin.scss` sets only `--icon-color`, so `ds-icon`'s default `base` (16px) — unverified on the dev server~~. Now the glyph nested directly at `base` (16px, measured on the dev server), fills unchanged.
- [x] Icon color checks (10.11.2026): new `colorSource` field per icon slot (keyed by state); Phase 3 binds from it; Phase 4 checks every variant and state by variable id (unbound = fail) and reads hidden icons on temporary instances (created and removed in the same script, the only write in Phase 4). Fixes the "hidden icon layers" half of the Phase 4 item above.
- [x] Gery - Parents that set `--icon-size` without `--icon-inner-size` (Button `square`, Toast, App Footer): the glyph stays at the 16px inner box in code. Decide whether that's a code bug.
- [x] `ds-button` re-run (10.11.2026): done without attachments (user's call). New frame `4590:981`, sets `Button` `4594:1327` / `ButtonInverted` `4600:2108`. Open from it: `ds-badge` attachment (`docs/plans/figma-attachments-plan.md`, steps 3–5), ButtonGroup (families flow), left vs. right icon size question for code (button.figma.md → Notes).
- [x] Move Pagination to the new `Button` set (10.11.2026): all 52 instances swapped, carets via `icon` swap, `pagination.figma.md` + validation (4b/4c/6) updated, `3048:2541` deleted (user OK). `3532:1427` already gone. Found: swapping a glyph via `icon` drops the vector fill binding (it sat on the default `check` glyph's vector), so it had to be re-bound on 4 base-tier carets. Any swap in the `Button` set has the same issue.
- [x] Pagination doc frame (seen 10.11.2026): `Bubu` (`4563:6887`) — a copy of the old `Pagination/Default` set (old `state` model, published, 0 instances) — sits in the `Pagination` stack's `Column + Box` under the real set. Deleted 11.11.2026 (user's call; 0 instances). ~~`Sets` clips `PaginationDotsRow`~~ fixed 11.11.2026: `Component Sets` was fixed at 850px; set to `FILL` (the `Documentation` column is taller).
- [x] Variations before Anatomy (16.11.2026): template frames reordered to Copy me → Variations → Anatomy → Measurements (Names, asset components only, last); phase docs, SKILL.md and `conventions/document-sections.md` updated. Built frames reordered too (Button, Input, Spinner; Close, Badge, Pagination have no Variations section).
- [ ] Logo: Figma defaults to helvetia, while code defaults to baloise. Animation (Lottie) is out of scope.

# Components to test

| Status | Component                        | Category   | Nested                                | Gap | Figma |
| ------ | -------------------------------- | ---------- | ------------------------------------- | --- | ----- |
| ⬜     | Icon<br>Set color with variables | Media      | -                                     | ✅  | ⬜    |
| ⬜     | Brand Icon                       | Media      | -                                     | ✅  | ⬜    |
| ⬜     | Logo                             | Media      | -                                     | ✅  | ⬜    |
| ⛔     | Shape                            | Media      | -                                     | ⛔  | ⛔    |
| ⬜     | Spinner                          | Indicators | -                                     | ✅  | ⬜    |
| ⬜     | Progress Bar                     | Indicators | -                                     | ✅  | ⬜    |
| ⬜     | Label                            | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Input                            | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Textarea                         | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Toggle                           | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Radio                            | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Checkbox                         | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Slider                           | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Select                           | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Number Input                     | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Phone Input                      | Forms      | -                                     | ✅  | ⬜    |
| ⬜     | Steps                            | Navigation | -                                     | ✅  | ⬜    |
| ⬜     | Tooltip                          | Overlays   | -                                     | ✅  | ⬜    |
| ⬜     | Sheet                            | Overlays   | -                                     | ✅  | ⬜    |
| ⬜     | Divider                          | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Text                             | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Heading                          | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Stack                            | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Content                          | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Data                             | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | List                             | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Root                             | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Card                             | Structure  | -                                     | ✅  | ⬜    |
| ⬜     | Button                           | Actions    | Brand Icon, Icon, Spinner             | ✅  | ⬜    |
| ⬜     | Badge                            | Indicators | Icon                                  | ✅  | ⬜    |
| ⬜     | Segment                          | Forms      | Icon                                  | ✅  | ⬜    |
| ⬜     | Datepicker                       | Forms      | Icon                                  | ✅  | ⬜    |
| ⬜     | App Navbar                       | Navigation | Icon                                  | ✅  | ⬜    |
| ⬜     | Tabs                             | Navigation | Icon                                  | ✅  | ⬜    |
| ⬜     | Accordion                        | Structure  | Icon                                  | ✅  | ⬜    |
| ⬜     | App Footer                       | Structure  | Divider, Icon, Logo                   | ✅  | ⬜    |
| ⬜     | Close                            | Actions    | Button                                | ✅  | ⬜    |
| ⬜     | Counter                          | Forms      | Button                                | ✅  | ⬜    |
| ⬜     | File Upload                      | Forms      | Button, Content, Icon, Spinner, Stack | ✅  | ⬜    |
| ⬜     | Pagination                       | Navigation | Icon, Button                          | ✅  | ⬜    |
| ⬜     | Modal                            | Overlays   | Close                                 | ✅  | ⬜    |
| ⬜     | Drawer                           | Overlays   | Close                                 | ✅  | ⬜    |
| ⬜     | Popup                            | Overlays   | Close                                 | ✅  | ⬜    |
| ⬜     | Notification                     | Overlays   | Close                                 | ✅  | ⬜    |
| ⬜     | Tag                              | Indicators | Close                                 | ✅  | ⬜    |
| ⬜     | Toast                            | Overlays   | Button, Close, Icon                   | ✅  | ⬜    |
| ⬜     | Snackbar                         | Overlays   | Brand Icon, Button, Close, Icon       | ✅  | ⬜    |
| ⬜     | Carousel                         | Structure  | Icon, Pagination                      | ✅  | ⬜    |
| ⬜     | Hint                             | Indicators | Icon, Button, Close, Drawer, Popup    | ✅  | ⬜    |
| ⬜     | Alert                            | Overlays   | Snackbar, Toast                       | ✅  | ⬜    |
