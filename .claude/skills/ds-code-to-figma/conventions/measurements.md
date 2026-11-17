# Conventions — Measurements: what to show and how (Phases 1 and 8)

Which sizes go into the "📏 Measurements" section, and how each one is drawn. Phase 1 step 6 uses the
first half (measure, classify, triage) to write `<name>.figma.md`'s `measurements:`; Phase 8 uses the
second half (visual vocabulary, layout) to render it. See `../CONVENTIONS.md` for the index.

## Principle

**Measurements document what the code decides, not what the layout produces.** A value is worth showing
when a designer has to respect it while building a screen: a fixed size, an inner spacing, a limit,
a behavior. A value that falls out of other values (a height that is just padding + line-height)
is noise, and goes stale the moment one of its inputs changes.

Code and Figma variables already give developers every exact value in Dev Mode. The main reader of
Measurements is a designer, so behavior and limits matter more than exhaustive numbers.

**Numbers come from the browser, groups come from the SCSS.** Phase 1 measures every value on the
rendered component (computed styles and box model), so derived and inherited values are exact. It
reads the SCSS only to decide _why_ a value exists — which group it belongs to. Every measured
value is then matched back to its token from Phase 1 step 5.

## 1. Groups

Every measured value falls into exactly one group. The group decides the default proposal; the
user only decides the rows marked "ask".

| Group                 | How to recognize it                                                                                                                          | Examples                                             | Default proposal                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **fixed**             | SCSS sets `width`/`height`/`block-size`/`inline-size`/`border-width`/`border-radius` (or a part's size) to a token                           | icon size, spinner circle size, border width, radius | **show** — drawn marker + table row                                                                               |
| **inner spacing**     | SCSS sets `padding*` or `gap` on the component or one of its parts                                                                           | padding, gap between icon and label                  | **show** — drawn marker + table row                                                                               |
| **limit**             | SCSS sets `min-*`/`max-*`                                                                                                                    | min-height, min-width, max-width                     | **show** — dashed marker + table row, label starts with `Min` / `Max`                                             |
| **behavior**          | Width/height not set by SCSS, measured by stretching (see "Behavior probe")                                                                  | hug vs. fill, truncation, wrapping                   | **show** — behavior demo, never as a number                                                                       |
| **derived**           | Measured, but no SCSS declaration sets it (the box size comes from content + padding)                                                        | button height without min-height, tag width          | **skip** — ask only if it's the one number people would look for (e.g. the real height of a fixed-height control) |
| **outer margin**      | SCSS sets `margin*` on the host or the outermost part                                                                                        | spacing around the component                         | **skip** — report it as a code smell in the triage; margins belong to the layout                                  |
| **hit area**          | The interactive area is bigger than the visible box (pseudo-element, padding on a transparent wrapper) — or is below 24 × 24 px (WCAG 2.5.8) | icon button with a 24px hit area around a 16px glyph | **show** only when it differs from the visible box — dashed outline; **ask** when it is below 24 × 24 px          |
| **context-dependent** | Token differs per `device:` mode (Phase 1 step 5a) or per theme                                                                              | responsive padding, logo height                      | **show** — one table cell per mode (`M / T / D`); **ask** whether an extra drawn card is worth it                 |
| **typography**        | Every text part                                                                                                                              | label font size, weight, line-height                 | **show** — table row; a numbered marker on the drawn card                                                         |

Rules that apply on top of the groups:

- **No radius on a circle or pill.** Skip the radius row when the radius is at least half of the
  component's height (and width, if smaller), e.g. `9999` or `50%`. The shape says it all.
- **States don't get measurements.** Hover/active/disabled change color, not geometry. The one exception
  is the focus ring: show its width once, on an extra `focus` instance, as a `shape` row.
- **Every shown row is drawn.** `show: table` is only for a value that has no place on any instance
  (rare — say why in `reason`). A table row without a marker confuses more than it helps.
- **Only the default set.** An `inverted` split changes colors, never geometry.
- **A limit is shown only when it binds.** Before proposing a `min-*`/`max-*` row as `drawn`,
  check that some realistic content hits it: compare the limit with what the box needs anyway
  (border + padding + the smallest realistic content; the behavior probe's `0px` width). A limit
  that never binds is **skip** with the arithmetic as `reason` (`ds-button` min width: border +
  padding are 52px > 48px) and is reported as a finding — it can't be drawn honestly, because no
  instance shows it.
- **Border visibility.** A border drawn in the same color as the fill is invisible, but still
  takes up space. The `drawnColor` is the default color option, unless its border = fill: then
  propose the first color option (component set order) whose border ≠ fill (`ds-button`:
  `secondary`; `primary` and the status colors have border = fill). **A `drawnColor` other than
  the default is always a 🟡 ask**: name the default, the proposed option and the reason (which
  marker the default would hide), and wait for the user to confirm — never switch silently. When
  no option shows the border, flag the border row as "invisible, reserves N px" and ask the user
  (🟡) whether to draw it, fold it into the padding note, or skip it.
- **Shape visibility.** The same applies to the default _state_: when its background is
  transparent and no border draws the shape (`ds-close`), the box a size line measures can't be
  seen. Propose a `drawnState` whose background shows the shape (`hover`) — always a 🟡 ask
  with the reason, like `drawnColor`. The focus instance stays `state=focus`.
- **Symmetric padding is one row.** `Padding X` when left = right; `Padding L` / `Padding R` as two
  rows when they differ. Never mix an axis label with a side label on one component.
- **Measured ≠ token is a finding, not a value.** When the measured px doesn't match the resolved
  token's px, flag the row in the triage (code drift or wrong token) — never silently pick one.

## 2. Kinds and visual vocabulary

Two independent channels: **color says what kind of value it is, line style says what type of
value it is.** Never encode meaning in color alone — every marker also has a number and a label.

**Kind → color** (DS palette, bound to the `🌐 Global/🌈 Color/*` variables on every `Spec/*` component; one color per
kind, even when a card has several rows of it):

| Kind      | Covers                                        | Color            |
| --------- | --------------------------------------------- | ---------------- |
| `size`    | width, height, icon/glyph size (incl. limits) | green (success)  |
| `spacing` | padding, gap                                  | red (danger)     |
| `shape`   | radius, border width, focus ring              | blue (info)      |
| `type`    | font size/weight/line-height                  | purple           |
| hit area  | not a kind: the hit-area outline              | orange (warning) |

**What → marker** (component names in `../PHASE-8-DOCUMENT-MEASUREMENTS.md` step 0):

| What                     | Marker                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| width / height           | dimension line with end ticks, outside the component — solid for a fixed value, dashed for `Min` / `Max` |
| padding                  | 20% tint on every side the token applies to **plus** a `spacing` dimension line below each tinted side   |
| gap                      | hatched overlay between the two children **plus** a `spacing` dimension line below each gap              |
| icon / glyph size        | text-free overlay (25% fill + 1px outline) on the nested part, plus a width line above the component     |
| radius                   | circle with the radius's own size, sitting in the corner; leader diagonally outward                      |
| border width, focus ring | leader: 3px dot (no outline) centered on the edge or ring, line outward, pill with the value             |
| typography               | dashed outline on the text's line box, leader from its edge, pill with size / weight / line-height       |
| hit area                 | dashed orange outline around the hit area (warning color, not a kind)                                    |
| behavior                 | no line — text label (`Hug ↔`, `Fill ↔`, `Truncates`, `Wraps`)                                           |

**Labels**: every marker label is the same soft **pill** — a fill in the kind's `-1` tint, a 1px
outline in the kind color, a solid number bubble first (white number; it matches the Sizes table,
where every row starts with its bubble), then the **value** in the same kind color (`48px`,
`min 48px`, `4px`). One color per kind for lines, outline, bubble and value text (17.11.2026, from
the mockup on `🧰 Annotations`, `4582:4163`). The bubble's number is the row's number in the Sizes
table — never put the number into the value text. Leader and corner-radius pills stay attached to
the end of their line — there the line is the connection.

| Kind      | Color (lines, outline, bubble, value text) | Fill (pill)         | Value text on fill |
| --------- | ------------------------------------------ | ------------------- | ------------------ |
| `size`    | success-5 `#116B34`                        | success-1 `#E8F3EC` | 5.8:1              |
| `spacing` | danger-5 `#CB1501`                         | danger-1 `#FCE8E6`  | 4.9:1              |
| `shape`   | info-5 `#155BA3`                           | info-1 `#E8F1FB`    | 6.0:1              |
| `type`    | purple-6 `#6C2273`                         | purple-1 `#F9F3FF`  | 9.1:1              |
| hit area  | warning-6 `#C97612`                        | warning-1 `#FFF9E8` | 3.3:1 (see below)  |

Warning-6 stays below AA (4.5:1) on purpose (user decision, 17.11.2026): the hit-area outline has
no value text today, only the legacy `Spec/Dimension` `kind=icon` uses it with text. Spacing
overlays keep their opacity on the bound paint (padding tint 35%, gap hatch 60% / 12%), the icon
overlay its 25%. Variable names are the palette names in the table (`Success/5`, `Success/1`, …,
`Warning/6`, `Warning/1`); both Design Tokens modes (Base, OrangeVacations) have the same values.

**Gaps are measured from the tick ends**, not from the line: the end ticks stick out 3px on both
sides of a dimension line, so a gap measured from the line disappears. 4px between the ticks and
the component, 4px between the ticks and the pill.

**Dimension pill placement**, tried in this order until the pill touches nothing:

1. **Centered** under (or above, beside) its own line — `label=center`.
2. **Shifted outward**, away from the component's center, until its inner edge lines up with
   the inner end of its line — `label=end` on the left half, `label=start` on the right half
   (`ds-button` padding).
3. **Straight callout** one pill row further out: the line stays next to the component and a
   vertical leader carries the pill out — `label=callout`, shifted outward as in 2 with
   `callout-end` / `callout-start` when centered still collides (`ds-button` gaps). Resize the
   instance's height to set the leader length.
4. **Angled leader** — only as a last resort; diagonals pull the pill away from what it measures.

Callouts stay the exception, never the default: a callout adds a line that measures nothing, so
it should also signal "this dimension is too small for its own pill".

**Units**: drawing pills carry the unit (`24px`) — a pill is read on its own. Table cells don't
(`Base/PaddingX · 24`); the footnote says `Values in px.` once.

**Fills**: only spacing gets a fill (padding tint, gap hatch) and an icon overlay its light box.
Shape markers stay outlines — the radius circle gets no fill, because half of it lies outside the
component and a fill would blur the edge it shows.

**Min / max** keep their kind color: the dashed line and the `min` / `max` prefix mark them. Never
give them a color of their own — color says the kind, and a limit is still a `size`.

**Leaders point away from the center.** A marker starts at the measured spot and its line runs
outward, away from the component's center: corner markers diagonally out of their corner, leaders
straight out to their side. A leader never crosses the component towards its center.

**Placement**: dimension lines sit **outside** the component, as close as the tick-end gap
allows, all lines of one side on one row:

| Marker                                    | Side                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| width                                     | top                                                                       |
| height                                    | left                                                                      |
| horizontal padding (left/right), row gap  | bottom                                                                    |
| vertical padding (top/bottom), column gap | right (`side=right`)                                                      |
| radius                                    | a free corner — top-right preferred                                       |
| leaders (type, border, focus ring, …)     | right preferred; any side with space, outside that side's dimension lines |

Never draw on top of content except the padding tint, the gap hatch and the icon overlay.
When pills collide, follow "Dimension pill placement" above — move the pill, never the line.

**Overlaps**: markers should not overlap each other — pills, lines, ticks, dots and rings all
count, not just pills. To resolve an overlap, try in order:

1. Shift the pill ("Dimension pill placement" above).
2. Move the marker to another side or corner (a pill-shaped radius ring covers a whole end, so
   put it on the end no leader leaves from).
3. Lengthen the leader or make the stage taller (its width is `FILL`).

If an overlap remains, keep it minimal: a line may cross another line, but nothing may cover a
pill or its number. Mention the remaining overlap to the user when confirming the section.

## 3. Section layout

The Measurements `Section` (`Flat`) holds up to three nested `Default` `Preview`s, in this order:

1. **Drawing** — **every numbered table row is drawn here exactly once.** One **main** instance
   of the default table-axis option (`base`, or the implicit default), default state, every
   optional part on, in the `drawnColor` (see "Border visibility"). Add an **extra** instance only
   for a row that can't be drawn on the main one — a value that only exists in a state (the focus
   ring on `focus`), or a limit that only binds with other content (a `min width` that a short
   label actually hits). Extra instances sit in a row below the main one, each with a one-word
   caption (`Focus`, `Min content`) and only its own markers. Never one instance per table-axis option —
   the table compares options; the only exception is an option that changes the structure (other
   parts or layout), not just values. A part built as two text nodes
   (`../PHASE-3-BUILD.md` → "Text properties") is measured and marked on the node visible in
   the main instance.
2. **Sizes table** — rows = properties, columns = the table-axis options with the code default
   first, like the component set (`base · sm · md · lg`). Each cell shows the token's short name and px (`Gap/XS · 8`). A row whose
   value is the same for every option shows it once, spanning the columns. Rows are grouped by kind
   in the order `size → spacing → shape → type`, each row starting with its number bubble. Numbers
   run 1, 2, 3, … top to bottom. Context-dependent cells list one value per mode
   (`M 16 · T 16 · D 24`).
3. **Behavior** — only when the component has a `behavior` row: one **stretched** instance (long
   content, fixed width below its content width) labelled with its behavior (`Hug ↔` / `Fill ↔`,
   `Wraps` / `Truncates`; a prop that switches it goes in brackets: `Hug ↔ (wide: Fill)`). The
   min-content case lives in the drawing. Skip this card for components whose size never changes
   with content or container (icon, spinner, close).

A component with no table axis has one column in the table, headed with its name.

## 4. Behavior probe (Phase 1)

Run on a clone of the default instance in a test wrapper, so the page under test isn't changed:

1. Wrapper `600px` wide → measured width `≈ 600` means **fill**, smaller means **hug**.
2. Wrapper `0px` wide → the measured width is the effective **min width** (compare against the
   `min-width` token; a mismatch is a finding).
3. Long content (2–3× the default text, via the prop or slot that carries text) in a `160px`
   wrapper → `scrollWidth > clientWidth` on the text part with `text-overflow: ellipsis` means
   **truncates**; a taller box means **wraps**; neither means it **overflows** (flag it).

Only the outcome goes into `measurements:` (`width: hug`, `overflow: truncate`); the probe's raw numbers
don't.
