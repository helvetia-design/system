# Phase 8 — Document: Measurements

## Objective

Fill in the last section of the `Documentation` column: "📏 Measurements", after Anatomy (only an
asset component's Names section, inserted in Phase 3, follows it). It renders the measurements
triage confirmed in Phase 1 step 6 — no new analysis happens here.

Build this right after Anatomy (or right after Copy me, if the Anatomy placeholder was deleted). This
is the last phase of the skill.

## Inputs

- "📐 Anatomy" (or "👉 Copy me", if the Anatomy placeholder was deleted), built and confirmed in
  [`PHASE-7-DOCUMENT-ANATOMY.md`](PHASE-7-DOCUMENT-ANATOMY.md).
- `<name>.figma.md`'s `measurements:` (`drawnOption`, `options`, `behavior`, `rows`) — the confirmed
  triage from Phase 1 step 6. **If `measurements:` still uses the old flat per-option list** (`base:` /
  `sm:` lists of `{ kind, label, px, token }`), re-run Phase 1 step 6 for this component first.

## References

- `conventions/measurements.md` — kinds, colors, line styles, placement, section layout. The source of
  truth for how every row looks.
- `conventions/document-sections.md` — `Section` / `Preview` mechanics and "Sizing".
- `PHASE-3-BUILD.md`'s cloned frame — its `kind=measurements` placeholder holds the worked
  example this phase edits (`drawn-spec`, `sizes-table`, `behavior`).
- `conventions/build-mechanics.md` — especially "Color and paint".
- `🧰 Annotations` page, node `2046:5` — the `Spec/*` annotation components.

## Instructions

### 0. Check the annotation components

Find these on the `🧰 Annotations` page by name (node ids are hints only). **Any one missing is a
🛑 hard stop**: list what's missing and ask the user to add it to the page — never draw a one-off
marker by hand instead.

| Component            | Needs                                                                                                                                                                                                                                                             | Used for                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `Spec/Dimension`     | (`2046:36`) `side` (`top`/`bottom`/`left`/`right`) × `kind` (`size`/`spacing`/`shape`) × `style` (`solid`/`dashed`) × `label` (`center`/`start`/`end`/`callout`/`callout-start`/`callout-end`; only `center` on `left`/`right`), `Value`, `Number`, `Show number` | widths, heights, padding, gap, limits |
| `Spec/Inset`         | (`2046:37`) `spacing` tint, stretches in both axes                                                                                                                                                                                                                | padding tint                          |
| `Spec/Gap`           | (`3064:1397`) hatched `spacing` fill, stretches in both axes                                                                                                                                                                                                      | gap hatch                             |
| `Spec/Icon size`     | (`3282:1362`) overlay box: 25% `size` fill + 1px outline, no text                                                                                                                                                                                                 | icon / glyph size                     |
| `Spec/Corner radius` | (`3282:1361`) `corner` (`top-right`/`top-left`/`bottom-right`/`bottom-left`), resize = circle size, `Value`, `Number`, `Show number`                                                                                                                              | radius                                |
| `Spec/Leader`        | (`3282:1424`) `kind` × `side` (`right`/`left`/`top`/`bottom`), `Value`, `Number`, `Show number`; `top`/`bottom` are vertical (the instance's height sets the length)                                                                                              | type, border width, focus ring        |
| `Spec/Text box`      | (`4243:1353`) dashed `type` outline, resize = text box                                                                                                                                                                                                            | text part's line box                  |
| `Spec/Outline`       | (`2046:38`) dashed orange outline, stretches in both axes                                                                                                                                                                                                         | hit area                              |
| `Spec/Marker`        | (`3064:1541`) `kind` (`size`/`spacing`/`shape`/`type`), `Number`                                                                                                                                                                                                  | table row numbers                     |

`Value` is the value only (`48px`, `min 48px`, `4px`); the row number goes into `Number` with
`Show number` on (the default). Every label is the same soft pill (tint fill, kind-colored
outline, solid number bubble first, value text in the kind color — colors in `conventions/measurements.md` →
"Labels"), and `Spec/Dimension` puts it on the outer side of its line, 4px from the tick ends
(above a `top` line, left of a `left` line, …), so it never covers the ticks. Dashed and solid lines are the same
1px rectangle (dashed = one-side dashed stroke), so both sit centered between the end ticks. The old
`Spec/Dimension` `kind=icon`, `Spec/Radius`, `Spec/Legend item` and `Spec/Callout` were deleted
from the Annotations page (18.11.2026, unused).

After changing an annotation component, instances already placed can keep a stale layout or
even a stale render (seen on `ds-button`: the radius pill showed a leftover rectangle of its old
label, although the node tree was clean). Replace each affected instance with a fresh one from
its main component — same component properties, size, position and layer index — rather than
patching it; never edit the layers inside an instance.

Verify on a screenshot of the real section node. A copy re-renders cleanly and hides such
glitches, so never verify on a clone; anything odd on the real screenshot is real until the node
tree explains it.

### 1. Structure

**Edit the template's worked example in place — clone, never build.** Fill the `Section`
placeholder whose `Title` is `kind=measurements` (`Flat`) — don't create a new one, and never move
it. Its slot already holds the three
cards as nested `Default` `Preview`s, in the order from `conventions/measurements.md` → "Section
layout":

| Card        | Content frame | Layer names touched                                                                                                                        |
| ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Drawing     | `drawn-spec`  | `title`, `stage` (`Component`, `caption` prototype + example `Spec/*` markers, `padding-clip`)                                             |
| Sizes table | `sizes-table` | `title`, `table` › `header` (`number`, `Property`, one cell per option), `row-<n>` (`number` › `Spec/Marker`, property, cells), `footnote` |
| Behavior    | `behavior`    | `title`, `columns` › `stretched` (`Component`, `label`)                                                                                    |

🛑 **Hard stop** if the placeholder or any layer in this table is missing — list what's missing and
ask the user to fix the template; never fall back to building the card. Sizing, fonts, colors
(text fills bound to `🔗 Alias/🔤 Text/Color/Primary`), gaps and paddings all come from the clone;
this skill writes no fill, font or spacing value here. Change only text, component swaps and
properties, counts (clone a prototype, delete the unused ones) and the drawing's calculated
positions and `stage` height. Delete the Behavior card's `Preview` when `measurements.behavior`
doesn't exist.

Use the default set's instances only, never an `…Inverted` set — an inverted split changes
colors, not geometry, so its numbers would only repeat.

**Family** (`conventions/families.md` §6): Measurements is built once, on the owner, from the owner's
`measurements:` — which holds every member's rows, each with `set:`. The drawing uses the owner's
default instance; contained sub-component rows are drawn on the sub-component instances inside it.
Rows with `show: table` from a wrapping sub-component appear only in the Sizes table. In the
table, prefix each sub-component row's property with its set name (`Tab · Padding X`).

### 2. Drawing

1. **Clear the example.** Delete every `Spec/*` marker and the `padding-clip` frame (the example's
   padding tints) in `stage`; keep `Component` (the template's
   example instance), the `caption` prototype (the `<caption>` text under the example) and `stage` itself (no auto-layout, so
   markers sit at calculated positions; `FILL` wide, fixed height).
2. **Main instance.** `swapComponent` the cloned `Component` to the default set's `drawnOption`
   variant in the `drawnColor` option (see `conventions/measurements.md` → "Border visibility"),
   in the `drawnState` if set (else default state; see "Shape visibility"), with the same content
   as Copy me, centered; rename it after the set. Set the card `title` to the option and color
   (`Drawing — base · secondary`).
3. **Extra instances.** One per distinct `instance` value in `measurements.rows` (`focus`: the
   `focus` state; `min-content`: shortest realistic label, e.g. `OK`): clone the main instance and
   swap or set it, same `drawnColor`, side by side with 120px between them, centered under the
   main instance. Each gets a caption under it (`Focus`, `Min content`): clone the
   `caption` prototype, set its text and name it `caption-<instance>`. The prototype is visible on
   purpose: Figma deletes a node that is added to slot content and then hidden (seen 18.11.2026 —
   the earlier hidden prototype vanished this way), so never hide it.
   Delete the prototype afterwards — also when there are no extra instances.
4. **`stage` height.** Leave enough room around each instance for its markers and resize the
   stage's height to fit everything (only the height — its width stays `FILL`), so nothing is
   clipped.
5. Number every shown row in `measurements.rows` order (`size → spacing → shape → type`): the Sizes table
   reads 1, 2, 3, … top to bottom, and every number appears on the drawing. A part the instance
   repeats (left and right padding, every gap, an icon on each side) gets the same marker and
   number on every occurrence, so no copy looks unmeasured.
6. Place each row's marker on its `instance`, per `conventions/measurements.md` → "Kinds and visual
   vocabulary": an instance of the `Spec/*` main component from step 0 (`createInstance()`, then
   the variant via `setProperties`) — never a drawn shape, never a detached instance. Every marker
   gets `Value` = the value and `Number` = the row number:
   - **width / height** → `Spec/Dimension` outside the instance (`side=top` for widths,
     `side=left` for heights), its ticks 4px from the instance (`side=top`: instance
     `y = top − 4 − 17`; `side=left`: `x = left − 4 − 24`), `style=dashed` and `Value`
     `min 48px` for `Min`/`Max` rows.
   - **padding** → `Spec/Inset` on every side the token applies to, plus a `Spec/Dimension`
     (`kind=spacing`) per tinted side: left/right padding gets `side=bottom` under it, its ticks
     4px under the instance (`y = bottom + 4`); top/bottom padding gets `side=right` beside it,
     its ticks 4px right of the instance (`x = right + 4`). The padding starts inside the border
     (CSS `border-box`), so inset the tint by the border width on every side it touches
     (`ds-button`: 2px border → `x = 2`, `y = 2`, `height − 4`), and round its outer corners to
     `radius − border` (`4 − 2 = 2`) so it follows the component's inner edge without gaps. When
     the radius is wider than the tint (a pill), rounding can't follow the edge: put the tints in a
     frame the size of the instance, `clipsContent` on, radius bound to the component's radius.
   - **gap** → `Spec/Gap` over each gap the token applies to, plus a `Spec/Dimension`
     (`kind=spacing`) per gap, on the same row as the padding lines of that side: a row gap gets
     `side=bottom` under it, a column gap (vertical layout) `side=right` beside it. Inset
     the hatch vertically by the border like the padding tint. Gap pills usually collide with the
     padding pills: use `label=callout` and resize the instance's height so its pill sits one pill
     row below the padding pills (4px between the rows) — see step 8.
   - **icon / glyph size** → `Spec/Icon size` resized to the nested part's absolute bounds and
     placed exactly on it — it carries no text, so the icon stays visible through it — plus a
     `Spec/Dimension` (`side=top`, `kind=size`) above the instance with the part's width and the
     number.
   - **radius** → `Spec/Corner radius` on a free corner, `corner=top-right` preferred. The
     instance _is_ the circle: resize it to `2r × 2r` and place it with its corner on the
     component's matching corner (top-right: `x = right − 2r`, `y = top`). The leader starts on the arc, ends on the near end of the pill (vertically centered), and the label follows by
     constraints. Figma ignores moving or resizing a layer inside an instance, so never try to
     adjust the `Circle` itself.
   - **border width / focus ring** → `Spec/Leader` (`kind=shape`) with the `Dot` on the border
     (or on the ring, for the focus instance; a two-color ring reads `2 + 3px ring`) — its center exactly on the middle of the border
     or ring, so the 3px dot never covers the edge it measures — and the pill outside the
     instance. The radius marker is never shrunk like the dots: its circle always has the radius
     it marks (`2r × 2r`). On the main
     instance it shares the right side with the type leader: put the border dot low on the right
     border and the type dot above the label's center, so the two pills stack with 4px between.
   - **type** → `Spec/Text box` resized to the text node's absolute bounds (its line box: width ×
     font-size × line-height) and placed exactly on it, plus `Spec/Leader` (`kind=type`,
     `side=right` preferred) with the `Dot` on the box's edge on that side, the pill clear of the
     instance's edge by 24px. `side=bottom`: center the leader on the box (`x = box center −
width / 2`), `y = box bottom − 3.5` (2px padding + half the dot), height up to 24px below the
     instance plus the pill (`side=top` mirrored). `Value` is
     `<size> / <weight> / <line-height>` (`16 / 700 / 1.3`).
   - **hit area** → `Spec/Outline` around the hit area.
   - **context-dependent** rows draw the `drawnOption`'s Desktop value; the table carries all modes.
7. Layer order on the stage: the instances, then every padding tint and gap hatch, then all
   other markers — a tint drawn later covers bubbles and labels.
8. Leaders point away from the center; markers should not overlap each other or another
   instance — resolve overlaps per `conventions/measurements.md` → "Overlaps". Sides follow
   the "Placement" table there: widths on top, heights on the left, horizontal padding and row
   gaps below, vertical padding and column gaps on the right, radius on a free corner (top-right
   preferred), leaders on the right when it has space, otherwise any side that has — outside
   that side's dimension lines. When pills collide, walk `conventions/measurements.md` → "Dimension pill placement"
   (`center` → `start`/`end` outward → `callout` → `callout-start`/`callout-end`) — move the
   pill, never the line. A callout's leader sits exactly on the middle of its line (`x = width / 2 − 0.5`
   for a 1px leader, also on even widths) (`ds-button`: padding `end` / `start`, gaps `callout-end` /
   `callout-start`). Swapping the `label` variant resets the instance's `Value` and `Number`:
   set them again right after.

### 3. Sizes table

Edit the cloned `table` in place; the `title` (`Sizes`) and `footnote` stay where they are. Load
each text node's current fonts before setting `characters`.

- **Header row** (`header`): keep `number` (empty) and `Property`. Clone the first option cell
  once per entry in `measurements.options`, in that order — the code default first, like the
  component set (`base · sm · lg`) — delete the unused ones, and set each cell's text and layer
  name to the option. When `options` is empty, keep one cell with the component name.
- **One row per `rows` entry with `show` `drawn` or `table`**, in `rows` order: clone `row-1` for
  every row and delete the template's other rows, then rename them `row-1`, `row-2`, … Per row:
  set `Spec/Marker`'s `kind` and `Number` (the number from Drawing step 5), the property text (and its
  layer name), and one cell per option with the token's last two path segments, `=` and the px
  (`Size/Base = 48` — not `·`, which reads as "times"). Clone or delete option cells so every row has as many as the header. The
  full token name goes into the cell's layer name, so it's visible on selection without widening
  the table.
- **One token for every option** (`Button/Spinner/Size`, a color-only border width, an Alias focus
  size) → delete every option cell but the first; it is `FILL` and spans the option columns (the
  template's `row-3`). **A token per option with the same px** (`Size/Base/Gap`, `Size/SM/Gap`, …)
  keeps one cell per option (`Base/Gap = 8`, `SM/Gap = 8`, …) — no `*` shorthand, so a spanning
  cell always means a single token.
- **A row with no token** shows `no token` in place of the token (`no token = 2 + 3`).
- `footnote`: line 1 is the unit and the spanning rule — `Values in px. A value spanning
all columns applies to every size.` (drop the second sentence when
  no row spans); line 2 is what the type cells abbreviate — `Text: <font family>, size / weight /
line height.`
- **Context-dependent** cells list each mode: `M 16 · T 16 · D 24`.
- **Type** rows show size, then weight and line-height: `Size/Base = 16 / 700 / 1.3`.
- Column widths come from the content: the number column is fixed (20), the property column is
  as wide as its longest entry + 12, and the option columns share the rest equally (`FILL`). Equal
  option columns keep the values comparable; a cell only wraps when even that isn't enough —
  then widen only the column that wraps.

### 4. Behavior

Only when `measurements.behavior` exists; otherwise delete this card's `Preview`.
Edit the cloned `stretched` in `columns`: one **stretched** instance of the `drawnOption` variant
with a label text under it (the min-content case lives in the drawing):

- `swapComponent` the cloned `Component` to the `drawnOption` variant, 2–3× the default text. For
  `width: fill`, set the instance to `FILL` inside a frame that is wider than its hug width. For
  `overflow: wrap`, set the instance's label text node to `textAutoResize = 'HEIGHT'` and
  `layoutSizingHorizontal = 'FILL'`, then resize the instance to a fixed width below its content
  width (`220`) and set its height back to `HUG` — without the label changes the text is clipped
  instead of wrapped. For `overflow: truncate`, give it a fixed width below its content width so
  the ellipsis shows (only when the Figma component's text node supports truncation; otherwise
  show `wrap` content and note it in the label).
- `label`: `Hug ↔` / `Fill ↔` and `Truncates` / `Wraps`, from `measurements.behavior`. When a prop
  switches the behavior, add it in brackets: `Hug ↔ (wide: Fill)`, `Wraps (no-wrap: Truncates)`.

### 5. Confirm

Iterate on the section with the user in Figma before moving on. Changes to _what_ is shown go back
into `<name>.figma.md`'s `measurements:` (`show`, `reason`), so a re-run produces the same section.

## Output

- The cloned frame's `kind=measurements` `Section` placeholder filled as "📏 Measurements": a drawing card, a
  sizes table and, when the component has behavior rows, a behavior card.

## Completion Criteria

- Every `rows` entry with `show: drawn` has its number on exactly one instance of the drawn card
  (a repeated part — padding on both sides, every gap, an icon on each side — repeats the same number) and one numbered table row;
  nothing with `show: skip` appears.
- Every marker label is number bubble + value; every leader points away from the component center.
- Marker colors and line styles follow `conventions/measurements.md`; no marker overlaps another or the
  instance's content (padding tint, gap hatch and icon overlay excepted). An overlap left after
  every step of "Overlaps" is a line crossing a line only — never covering a pill or its number —
  and was mentioned to the user.
- Every nested `Preview` is `FILL` wide and `HUG` high; nothing is clipped.
- Every card comes from the cloned template placeholder; none of the template's example content
  is left (example markers, rows, option cells, the `Component` placeholder instance, the hidden
  `caption` prototype — `<caption>`).
- Measurements shows the default set's instances only, never an `…Inverted` set.
- The section has been iterated on and confirmed with the user in Figma.

## Next Phase

None — this is the last phase. Once Measurements is built and confirmed, the documentation frame is
complete and the component is done.
