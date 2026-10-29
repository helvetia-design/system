# Phase 3b Documentation Template

## What this is, and why we have it

The raw component set that Phase 3 produces is not the deliverable on its own. Every component
pushed into Figma also gets a readable **documentation page** — a single Figma frame that shows a
human how to find, copy, and understand every variant of the component, built from real instances
and the real component set, not redrawn approximations.

This document is a **fixed template, not a per-component judgment call** — deviating from its
_structure_ is wrong. Adapt _content_ (which props, which tokens, which axis) to the component at
hand; never improvise a different layout. The template follows the TapTap Design System's Figma
community file structure (`Button–Primary` page, plus the "Space" section of its `Select` pages), replacing an earlier row/card/column layout used
on this file's first components. It now applies to every component built on this Figma file.

## Table of contents

- [Canonical reference — inspect before you build](#canonical-reference--inspect-before-you-build)
- [When to use this](#when-to-use-this)
- [What to do](#what-to-do)
- [Document structure](#document-structure)
  - [Page and outer frame](#page-and-outer-frame)
  - [1. Header](#1-header)
  - [2. "👉 Copy me"](#2--copy-me)
  - [3. "🏗️ Anatomy"](#3--anatomy)
  - [4. "🛠 Variants"](#4--variants)
  - [5. "🔒 Main components"](#5--main-components)
  - [6. "📐 Specs"](#6--specs)
- [Handling an `inverted` axis (two-frame split)](#handling-an-inverted-axis-two-frame-split)
- [Handling an open-ended content-selection prop (wrapper + Instance Swap library)](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library)
- [Cross-cutting build pitfalls](#cross-cutting-build-pitfalls)

## Canonical reference — inspect before you build

**Don't rebuild this structure from the prose below alone.** The `ds-close` pages in the
component-library file (`figma.config.json`'s `componentLibraryFileKey`) are the **only** canonical
live reference to inspect before building — the known-correct implementation of this template, the
same way you'd copy a working component instead of re-deriving one from a spec. It's the one
component on this file with a clean, fully-correct **two-frame `inverted` split**, so it
demonstrates the complete template — header qualifier line, both frames' theming, and the "Main
components" `ABSOLUTE`-auto-layout-child mechanism — in one place:

- Light frame: `"Close Documentation"`, node `1993:2`.
- Dark frame: `"Inverted Close Documentation"`, node `1993:5904`.

Both were verified directly (not assumed) to follow every rule in this document: outer frame fill
stays white/light on both frames (`VariableID:137:344`, not a dark theme); only true preview
surfaces (`Copy me box`, each `Variants` example, and every "Main components" data cell) use the
dark token `VariableID:137:2764`; the header's two-line `heading` shows a bare `"Close"` on the
light frame (qualifier hidden) and `"Close" / "Inverted"` on the dark frame (qualifier visible);
and both frames' `Tables row` places the real `Close/Primary` / `Close/Inverted` component set as
an `ABSOLUTE`-positioned, singly-locked auto-layout child next to the table chrome (`Normal col`).
The light frame also carries the reference "📐 Specs" section (`specs`, node `2047:19`) — the
dark frame has none, per [5. "📐 Specs"](#6--specs).

**`ds-close`'s reference pages predate the "🏗️ Anatomy" section — they don't have one.** Inspect
them for every other section's structure as described below, but build Anatomy from this document's
own spec (see [3. "🏗️ Anatomy"](#3--anatomy)) until a canonical reference page adopts it; update
this pointer once one does.

**Don't use `ds-badge` or `ds-spinner`'s live pages as a structural reference — inspect `ds-close`
only.** `ds-badge` has no `inverted` axis (single frame), so it can't demonstrate the full
template, and its "Main components" set/chrome split is a less clear version of the same mechanism
`ds-close` shows more explicitly. `ds-spinner` is actively unreliable right now: a
`ds-figma-component` session on it (see `spinner.figma.md`'s final follow-up sections) hit a
`use_figma` atomicity-violation bug that silently detached its master component sets and deleted
its entire "Main components" grid structure, and separately found `get_screenshot` returning three
different, differently-wrong renders of the same verified-correct document state — both were
recovered, but its page still uses the older page-level-sibling overlay technique (a fallback-only
pattern, see [Main components](#5--main-components) below) rather than the `ABSOLUTE`-auto-layout
mechanism, so copying its structure would teach the wrong default anyway. **Don't inspect `ds-icon`
as a template either** — as of its wrapper-pattern rebuild (see
[the wrapper + Instance Swap library section](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library)),
it has no separate `Inverted` page at all (`inverted` is folded into `color` as a token-swap option,
not a structural split), which is correct for `ds-icon` specifically but is a component-level
modeling decision, not a template rule to copy blindly onto a future component that _does_ have a
true structural `inverted` axis.

Before building a new component's Phase 3b page, run a read-only `get_metadata` (or a `use_figma`
traversal) against `ds-close`'s node IDs above to see the real current hierarchy, frame names,
auto-layout settings, and alignment properties — then mirror that structure for the new component,
rather than reconstructing positions/alignment from this document's words each time. This document
exists to capture the pitfalls and reasoning that led to the current structure, not to replace
inspecting it directly. If you change the template's structure during a future run, update this
reference pointer if the canonical node IDs change, and consider whether the fix should be
back-ported to `ds-icon`/`ds-badge`/`ds-spinner`'s existing pages too.

## When to use this

Build this after Phase 3 confirms the variant matrix looks right — don't start it on an unconfirmed
or partially-built component set. Finish it before Phase 4's visual-regression review, so that
review covers the documentation page too, not just the raw component set.

## What to do

At a high level, in order:

1. Set the Figma page's own background and build the outer bordered frame (see
   [Page and outer frame](#page-and-outer-frame)).
2. Build the [Header](#1-header).
3. Build [Copy me](#2--copy-me).
4. Build [Anatomy](#3--anatomy) — skip this section entirely if the component's `<name>.figma.md`
   has no `anatomy:` list (no `@part` tags found in Phase 1).
5. Build [Variants](#4--variants).
6. Build [Main components](#5--main-components).
7. Build [Specs](#6--specs).
8. If the component has a true `inverted`/dark-context axis, apply the
   [two-frame split](#handling-an-inverted-axis-two-frame-split) instead of a single frame.
9. If the component has an open-ended content-selection prop (many options, e.g. an icon `name`),
   apply the [wrapper + Instance Swap library handling](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library)
   instead of a single plain component set.
10. Iterate on the layout with the user before considering this phase done — the exact structure is
    something to confirm visually (screenshot checkpoints), same as the variant matrix itself in
    Phase 3.

## Document structure

### Page and outer frame

- **Page background**: set the Figma page's own `backgrounds` to a literal solid `#e8e8e8`
  (`page.backgrounds = [{ type: 'SOLID', color: { r: 232/255, g: 232/255, b: 232/255 } }]`) — not a
  design token, no page-background token exists in this system.
- **One bordered outer frame**, white fill, **2px** `Alias/Border/Color/GreyLight` stroke, ~40px
  padding, vertical auto-layout. No label above the frame (an earlier draft of this template had
  one; removed on request — don't add it back).
- **Corner radius is bound to two different tokens depending on what's being rounded — never a
  literal number, and never the same value everywhere.** Confirmed via `boundVariables` on the live
  `ds-close` reference, not guessed:
  - **Outer frame**: `🌐 Global/📏 Dimension/Radius/12` (12px) — bind all four corner radii
    (`topLeftRadius`/`topRightRadius`/`bottomLeftRadius`/`bottomRightRadius`) to this variable, not
    the plain `cornerRadius` setter with a literal.
  - **Every section's inner card/grid frame** — the "Copy me" box, the "Variants" panel (`Variants
row`), and the "Main components" table (`Normal table`) — uses `🌐 Global/📏 Dimension/Radius/6`
    (6px) instead, bound the same way. A first build of `ds-spinner`'s documentation page missed
    this distinction (used 8px literal outer / inconsistent or 0 inner), caught by a direct
    side-by-side comparison against `ds-close`. (From: `ds-spinner`'s Phase 3b, user-flagged.)
- **Every border/divider/grid-line in this template is 2px, always** — not 1px. This applies to:
  the outer frame's own stroke, every divider rule between sections, the Variants panel's border,
  the Main components table's border, and every internal grid-line rectangle. When building a
  divider or grid line as a rectangle, give it a 2px dimension on its thickness axis
  (`resize(width, 2)` for a horizontal divider, `resize(2, height)` for a vertical grid line); when
  it's a frame stroke, set `strokeWeight: 2`.
- Inside the frame, the sections below, in order (six when the component has an anatomy list, five
  when it doesn't — see [3. "🏗️ Anatomy"](#3--anatomy)), each separated by a 2px
  `Alias/Border/Color/GreyLight` divider rule.

### 1. Header

- A top bar: small grey **breadcrumb** kicker (left) reading `⏳ Core / <Category> / <Component>`
  (e.g. `⏳ Core / Indicator / Badge`, `⏳ Core / Media / Icon`) — set on **both** the Figma page's
  own name and the in-page `kicker` text node, identically. The `⏳` (hourglass) marks the page as
  AI-generated/changed and pending human review; a human manually swaps it to `✅` once reviewed and
  approved. **This skill must never set it to `✅`** — every build or edit this skill makes should
  (re-)set it to `⏳`, never claim approval on a human's behalf.
- On the right of that same top bar, a `wordmark` text node reading `v<core package version> -
<DD.MM.YYYY>` (e.g. `v0.0.6 - 26.10.2026`) — version from `packages/core/package.json`'s
  `version` field at build time, date from the actual current date — records which core package
  version the Figma push was generated from. `Alias/Text/Size/XS`, `Alias/Text/Color/Grey`, same as
  the kicker.
- **Title: a two-line stacked `heading` frame, not a single text node — and the second line only
  renders when it says something.** A frame named `heading` containing two stacked `TEXT`
  children, same font family (`Baloise Create Headline`) and size
  (`Component/Heading/Level/Display1/FontSize`, 48px) and color (`Alias/Text/Color/Primary`) for
  both lines, differing only in weight, content, and visibility:
  - `component` (top line, **Bold**): the component name, e.g. `"Close"`.
  - `instance` (bottom line, **Light**): a qualifier naming which top-level entity this specific
    frame documents — `"Inverted"` on the dark frame, or any other real distinguishing name for a
    split entity. **Set `visible: false` on this node whenever the qualifier would be `"Main"` or
    empty — don't render a `"Main"` subtitle at all.** Confirmed as the real rule on `ds-close`'s
    own live light-frame node (`2020:38`, `hidden: true`, `characters: "Main"`) — the light frame
    shows a bare `"Close"` title with no visible second line, not `"Close" / "Main"`, while the
    paired dark frame's equivalent node (`2020:43`) is visible and reads `"Inverted"`. The text
    content can stay set to `"Main"` under the hood on a non-split frame — it's the node's
    `visible` property that must be `false`, not the text necessarily deleted.
- **The `body` frame wrapping the lead paragraph + link must hug its content height — never a fixed
  height, and never `resize()`d directly.** Confirmed live on `ds-close`: `body`'s
  `primaryAxisSizingMode`/`counterAxisSizingMode` are both `'AUTO'` (hug/hug). A first build of
  `ds-spinner`'s documentation page called `body.resize(600, 50)` to fix the width — but
  **`resize()` resets sizing modes to `FIXED` on _both_ axes at once** (the general gotcha from
  `figma-use`'s Rule 12c, not unique to this template), which silently froze the frame's height at
  the literal `50` regardless of actual content height, clipping the "View in Storybook" link out
  of view below it. Fix: `appendChild` the frame, set only `layoutSizingHorizontal = 'FIXED'`, then
  call `resize(600, body.height)` using the frame's **own current (already-hugged) height**, not a
  guessed literal — and if `resize()` resets `layoutSizingVertical` away from `'HUG'` afterward,
  re-set it back to `'HUG'` explicitly as the very next statement. (From: `ds-spinner`'s Phase 3b,
  user-flagged.)
- Lead paragraph: sourced **verbatim from the component's own JSDoc comment** in its `.tsx` file —
  code is the source of truth for documentation copy, never write new descriptive copy. `16px`,
  color `Alias/Text/Color/Primary`.
- A "View in Storybook ↗" link — styled identically to the lead paragraph: **Bold**, `16px`
  (`Baloise Create Text` Bold), `Alias/Text/Color/Primary`, with an `UNDERLINE` text decoration
  (`setRangeTextDecoration(0, length, 'UNDERLINE')`). Also carries a **real Figma hyperlink** via
  `textNode.setRangeHyperlink(0, length, {type: 'URL', value: url})`. Find the real Storybook story
  ID from the component's own
  `apps/storybook/src/components/<category>/<name>/<name>.doc-config.ts` (the `Overview` tab's
  `storyId`) — never guess a path from scratch, and don't rely on an older sibling component's URL
  pattern (confirmed these are NOT derivable by a fixed category/name formula — `ds-spinner` and
  `ds-icon`'s URL shapes differ from each other).
- Each of the section headings below ("🏗️ Anatomy", "👉 Copy me", "🛠 Variants", "🔒 Main
  components", "📐 Specs") is bold, `Component/Heading/Level/1/FontSize` (28px), `Alias/Text/Color/Primary`.

### 2. "👉 Copy me"

One real, representative **instance** (the default/base combination) in a centered box with a soft
shaded background (`{0.976, 0.976, 0.976}`, no border) — the single "drag this into your design"
example. Use a Figma `INSTANCE` (`variant.createInstance()`) of the finished component-set variant
— never the variant node itself. If the component has any boolean "Show X" property (per Phase 2's
conditional-render rule), override it to `true` on this instance for readability, while the
component set's own default stays whatever matches code. Fixing the main component later
automatically propagates to this instance; editing it directly does not.

### 3. "🏗️ Anatomy"

**Only build this section if the component's `<name>.figma.md` has a non-empty `anatomy:` list**
(written in Phase 1, step 2 of `SKILL.md`, from the component's `@part` JSDoc tags). If the list is
missing or empty, skip this section entirely — no heading, no placeholder — and the page goes
straight from "👉 Copy me" to "🛠 Variants", same as a component with no `inverted` axis skips the
two-frame split.

Confirmed live on `ds-spinner`'s build (node `2105:43`, the first component this section was built
for) — every value below is read off that real node tree, not guessed:

**Section frame (`anatomy`)**: `VERTICAL` auto-layout, `itemSpacing: 16`, no fill, two children —
the section heading text (see [1. Header](#1-header)'s heading-style rule — same 28px Bold
`Baloise Create Headline`, `Alias/Text/Color/Primary`) and the panel below it (`Anatomy box`).
`layoutSizingHorizontal: 'FILL'` against the outer documentation frame, same as every other section
(`copy-me`, `variants`, `main-component`).

**Panel (`Anatomy box`)**: `VERTICAL` auto-layout, `itemSpacing: 16`, `counterAxisAlignItems:
'CENTER'`, padding `24` on all four sides, white fill, **2px** stroke bound to
`Alias/Border/Color/GreyLight` (`VariableID:137:80`), all four corner radii bound to
`🌐 Global/📏 Dimension/Radius/6` (`VariableID:137:2639` — the same inner-card radius every other
section's panel uses). **`layoutSizingHorizontal: 'FILL'` against the `anatomy` section** — this is
the piece easy to skip: a panel left on its default HUG sizing shrink-wraps to its widest child
(observed: the legend's text, not the diagram), silently capping everything inside it at that
narrower width instead of the real container width (816px on `ds-spinner`, confirmed). Set this
`FILL` _before_ the diagram area inside it is set to `FILL` — verify by reading `diagramArea.width`
afterward, not by assuming the first `FILL` was enough. (From: `ds-spinner`'s Anatomy build,
user-flagged.) Two children, in order:

1. **Diagram area** (`diagram-area`): a plain `FRAME` (`layoutMode: 'NONE'`, manual child
   positioning — not auto-layout, since the circles/lines need freeform placement), no fill, fixed
   160px height, **`layoutSizingHorizontal: 'FILL'`** against the panel (764px content width on
   `ds-spinner`'s 816px-wide panel after its 24px×2 padding — confirmed live, this is the "full
   width of the container" the diagram must span). Contains, as flat siblings (no further nesting):
   - One real Figma `INSTANCE` of the default/base variant combination, same rule as "👉 Copy me"
     above (`variant.createInstance()`, never the variant node itself) — centered horizontally and
     vertically inside the diagram area (`instance.x = (diagramArea.width - instance.width) / 2`,
     same for `y` against the 160px height). Recompute this centering, and every circle/line
     position below, against `diagramArea.width` **after** it resolves to its real `FILL` value —
     never against a placeholder fixed width from an earlier draft.
   - One lettered circle + one leader line **per entry in the `anatomy:` list** (see next two
     bullets), positioned relative to the real on-canvas location of that part inside the instance.
     Find that location by locating the matching layer inside the instance —
     `instance.query('[name=<part>]')`, since this skill's own builds commonly name a node after
     the part it represents (e.g. `label`, `icon` on `ds-spinner`'s `mark-container`/`label`
     layers) — and use that layer's bounding-box center as the line's target point. If no
     name-matched layer exists, fall back to a visual read via `get_screenshot`/`get_metadata`
     rather than guessing a coordinate.
   - **Circle**: an `ELLIPSE`, 24px×24px (not `cornerRadius` — an ellipse is round by
     construction), fill bound to `🔗 Alias/🎨 Surface/Purple` (`VariableID:137:437`). The letter
     is a separate `TEXT` node of the same 24px×24px size, stacked exactly on top of the circle
     (same `x`/`y`), `textAutoResize: 'NONE'` (required — the default auto-resize mode fights a
     manual `resize()` to a fixed box), `textAlignHorizontal`/`textAlignVertical: 'CENTER'`,
     `Baloise Create Text` **Bold**, 12px, fill bound to `🔗 Alias/🔤 Text/Color/Primary`
     (`VariableID:137:288` — the same navy token already used elsewhere on this page for the
     Variants tag chips' text and the Main components header labels) — a navy letter on a
     light-purple circle, not white-on-navy. Confirmed against the user's own reference mockup.
     (From: `ds-spinner`'s Anatomy build, user-flagged.)
   - **Leader line**: a `VECTOR` with a single straight `M x1 y1 L x2 y2` path (not a `LINE` node —
     built via `figma.createVector()`, resized to the path's own bounding box, positioned at the
     path's own min `x`/`y` so the path coordinates are relative to the vector's local origin), no
     fill, **2px** stroke weight, stroke bound to `🌐 Global/🌈 Color/Purple/3`
     (`VariableID:137:2756` — resolves to the exact same RGB as `🔗 Alias/🎨 Surface/Purple`,
     confirmed by comparing resolved values; bind to the Global primitive here rather than the
     Alias/Surface token, since a line isn't a surface). Runs from the circle's edge (12px out from
     its center, i.e. the circle's radius) to the target part's bounding-box center.
   - Arrange circles around the instance (above, below, left, right as needed) so lines don't cross
     and circles don't overlap each other — an eyeballed layout judgment confirmed against a
     screenshot checkpoint, same as every other layout call in this template, not a fixed formula.
     On `ds-spinner` (2 parts), circle A sits 50px directly above its part's center, circle B sits
     50px directly below its part's center — a reasonable default spacing for two parts that don't
     collide; more parts will need case-by-case placement, same as any other layout call here.
2. **Legend** (`legend`): a `VERTICAL` auto-layout frame, **`itemSpacing: 8`** (not the panel's own
   16px gap — tighter, since these are closely related lines of a single list), no fill,
   `layoutSizingHorizontal: 'FILL'` against the panel. **One single-column stacked list, one text
   node per `anatomy:` entry, in letter order — not a grid, not multiple columns.** (An earlier
   draft of this section tried a 2-column grid; reverted on request — don't reintroduce it.) Each
   entry is one `TEXT` node, 14px `Baloise Create Text`, fill bound to
   `🔗 Alias/🔤 Text/Color/Primary`, reading `"<letter> · <part> — <description>"` (e.g.
   `"A · inner — The spinner animation container element."`) — the same three `anatomy:` fields in
   one line. The `"<letter> · <part>"` prefix is **Bold**, the rest (the em-dash and description)
   is **Regular** — apply via `setRangeFontName(0, prefixLength, { family: 'Baloise Create Text',
style: 'Bold' })` on just that leading span, after the full string's base font/characters are
   already set per the canonical text-edit recipe. This lets the diagram read on its own without
   the viewer needing to cross-reference `<name>.figma.md`.

### 4. "🛠 Variants"

A compact, single-axis reference — not a full cross-product. Pick the one variant property that
most defines the component's _scale/shape_ (e.g. `size`). Left side: a shaded sidebar with a bold
axis-name label (e.g. "Size") and the option names as stacked pill/tag chips. Right side: one
representative instance per option, side by side, in a bordered white panel. Same `INSTANCE` rule
as "Copy me" above — never the variant node itself.

**The tag chips' exact styling, confirmed live on `ds-close`'s `tag-base` (`1993:18`) — not a
rough "pill" approximation:**

- Shape: fully rounded (`cornerRadius: 999`, i.e. a true pill regardless of text length), `AUTO`/
  `AUTO` sizing (hugs its text + padding).
- Fill: `Alias/Surface/Grey` (confirmed exact token name/binding — not a literal grey, and not the
  same token as any other grey used elsewhere in the template).
- Text: `Baloise Create Text` **Bold**, 12px, color `Alias/Text/Color/Primary` (navy, not grey — the
  text reads as a bold blue label against the pale grey pill, not muted body copy). A first build
  of `ds-spinner`'s documentation page used Regular weight and a plain white/light-grey literal
  fill — caught by direct comparison against `ds-close`. (From: `ds-spinner`'s Phase 3b,
  user-flagged.)

### 5. "🔒 Main components"

The exhaustive, full cross-product reference — every remaining variant property crossed together —
as a single dense bordered table (shaded header row for one axis' options across the top, shaded
header column for the other axis' options down the left). This is the _locked, source-of-truth_
grid — the 🔒 emoji signals "generated from the real component, don't edit cells directly."

**This section works differently from "Copy me"/"Variants" above: each grid cell is the real
master variant itself (a `COMPONENT_SET` child), not an instance of it, and the whole set is a
genuine auto-layout child of the table — not a manually-repositioned overlay.** Confirmed by
inspecting the live `ds-close` reference directly (`⏳ Core / Action / Close` page,
`Close Documentation` frame `1993:2` → `main-component` `2034:5157` → `Tables row` `1993:28`):

- `Tables row` is itself a `HORIZONTAL` auto-layout frame (`itemSpacing: 24`,
  `primaryAxisSizingMode`/`counterAxisSizingMode: 'AUTO'`) with exactly two children, in this
  order: `Normal col` (the table **chrome only** — header row, row-label column, grid lines, and
  _empty_ data-cell frames with no content) and `Close/Primary` (the real, locked `COMPONENT_SET`).
- `Normal col` has `layoutPositioning: 'AUTO'` — it flows normally as the auto-layout's one real
  flex item, which is what gives `Tables row` its size.
- `Close/Primary` has **`layoutPositioning: 'ABSOLUTE'`** — set this explicitly
  (`node.layoutPositioning = 'ABSOLUTE'`) after `appendChild`ing it into `Tables row`. This is the
  mechanism that makes everything work: an `ABSOLUTE` auto-layout child keeps an explicit `x`/`y`
  (here `x: 83, y: 44`, overlapping `Normal col`'s data-cell region) and does **not** participate in
  `Tables row`'s flex spacing/sizing math, but it **does** still move whenever `Tables row` itself
  moves — which happens automatically through the normal auto-layout chain above it
  (`main-component` is itself `VERTICAL` auto-layout) whenever something earlier in the page grows
  or shrinks. This is what gives the "locked to the grid, moves with it" behavior: no scripted
  realignment step is needed when content above changes height, because the set was never
  positioned by absolute page coordinates in the first place — only by one `x`/`y` pair relative to
  its own auto-layout parent, which Figma itself keeps correctly offset.
- The set's own children (variants) are positioned once, at build time, with `x`/`y` **relative to
  the set** chosen so each one centers in its real target cell — e.g. `Close/Primary`'s `size=sm,
state=default` child sits at local `(59, 113)` because `Tables row`'s `sm` row and `default`
  column cell, combined with the set's own `(83, 44)` offset, centers a 14×14 mark there. Compute
  this the same way as any cell-centering math (cell `x`/`y`/`width`/`height` minus the set's own
  origin, centered for the child's size) — the difference from the old technique is that this
  computation is a **one-time bake into each child's local position**, done once during the initial
  build, not a page-level `absoluteTransform` overlay recomputed and re-verified on every future
  session.
- This supersedes the earlier page-level-sibling overlay technique used for `ds-spinner` (see its
  `.figma.md` rebuild history) for the common case of one set feeding exactly one grid — use that
  older technique (and its manual realignment/re-lock dance) only for the rarer case where a single
  component set must feed **two different** titled grids at once (one set can only be an
  `ABSOLUTE` auto-layout child of one parent at a time, so it can't do this trick twice). That
  rarer case also has no separate "parked off-canvas" copy of the set, since the common case's set
  _is_ the live grid rather than a thing being overlaid onto one — only park a set off-canvas (e.g.
  `y: -3000` on the same page) for that rarer case.

**Lock the `COMPONENT_SET` itself, once — never lock each variant child individually.** Confirmed
on the live `Close/Primary` node (`locked: true` on the set, no per-child lock on any of its
`size=md, state=disabled` / etc. children). Locking the set is enough to stop a human from dragging
the whole grid (or any one variant within it) out of alignment in the Figma UI, and doesn't block
this skill's own scripted edits. Because of the `ABSOLUTE`-auto-layout-child mechanism above, there
should be no need to ever unlock/reposition/re-lock it again after a layout change above the table
— if that ever does appear necessary, something is wrong with the `layoutPositioning` setup, not a
normal maintenance step.

**Every header/row-label cell (`col-header-*`, `row-label`) must have both
`primaryAxisAlignItems`/`counterAxisAlignItems` set to `'CENTER'` on the cell frame, and
`textAlignHorizontal: 'CENTER'` on its text child — set both explicitly, this is not the default.**
A `TEXT` child of an auto-layout frame does **not** inherit centering just because its parent frame
has a fixed width/height — giving the frame a fixed size only constrains the frame's own box, it
says nothing about how the frame aligns its children. The text still defaults to
`textAlignHorizontal: 'LEFT'` sitting at the frame's top-left unless the frame's own alignment
properties say otherwise. This silently shipped off-center cell labels on a real build before being
caught visually — a mistake worth expecting again on any new component's grid cells, not something
`ds-close`'s already-correct live state alone will protect against (you'd only notice by rendering,
not by reading the spec).

**Every header/row-label text (`col-header-*`'s `label`, `row-label`'s `label`) is Bold, not
Regular — and uses the `Baloise Create Headline` family, not `Baloise Create Text`.** Confirmed
live on `ds-close`'s `col-header-default`/`row-base` label nodes: `Baloise Create Headline` Bold,
12px, `Alias/Text/Color/Primary`. Easy to miss since every other 12px label in this template (the
Variants tags, the axis-name label itself is the exception at Bold too — see "🛠 Variants" above)
uses `Baloise Create Text`; the Main components table headers specifically switch family **and**
weight. A first build of `ds-spinner`'s documentation page used `Baloise Create Text` Regular for
these — caught by direct comparison against `ds-close`. (From: `ds-spinner`'s Phase 3b,
user-flagged.)

**Never move a variant out of its `COMPONENT_SET`.** A `COMPONENT` that is a variant can only be a
direct child of its own `COMPONENT_SET` — moving it into any other frame (e.g. trying to place the
"real" variant directly into a documentation table cell structure it doesn't belong to) silently
dissolves the set once it's emptied (Figma auto-removes an empty `COMPONENT_SET`), stripping the
variant-property grouping from every remaining child. Nothing is actually deleted (existing
instances keep resolving correctly, property definitions survive on each now-standalone component
with new IDs) but the set's `color`/`size`-style variant axes are gone until manually restored:
recombine via `figma.combineAsVariants()`, then **manually rename each child back to `key=value,
key2=value2` format** — the round-trip can leave children as bare `Name/x/y`-style names with no
parsed variant properties, which silently produces empty-string property keys
(`"=default, =base"`) if left as-is.

**If the component has an open-ended content-selection prop** (see
[wrapper + Instance Swap library](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library)),
"Main components" shows the real wrapper set's own cross-product (the remaining same-layers props,
not the content axis) as a single table, same mechanism as described above — see that section for
the full rule, including the fallback case where N genuinely separate top-level sets are still
warranted. For a plain (non-split) component, "Main components" shows the full cross-product as
described above.

### 6. "📐 Specs"

The developer-handoff reference: the component's own measured values (dimensions, padding and
gaps, fixed sizes of nested elements, corner radius, border width, typography), drawn as
annotations on a real instance, each listed with the Figma variable it comes from. Modelled on the
"Space" section of the TapTap Design System's component pages, adapted to this template's light
chrome (no black band) and to this system's token-first rule (every value names its variable).

**The data comes from Phase 1, never from measuring the canvas.** Phase 1's completeness checklist
already resolves every spacing gap, size, radius and text attribute to a token; Phase 1 also
records the subset shown here as the `specs:` list in `<name>.figma.md` (see SKILL.md's mapping
file format). At build time, read each value from its Figma variable (walk the `VARIABLE_ALIAS`
chain to the literal) instead of typing it from memory, and stop if it disagrees with `specs:`.

What to annotate, and what not to:

- **Width/height only when the code fixes them** (a size token on `width`/`height`). If the code
  only sets `min-width`/`min-height`, annotate that instead, labelled `Min width`/`Min height`
  with a `min 40px` value. If the size just hugs its content, don't annotate it: the padding and
  gap annotations already explain it.
- **Never annotate a calculated inner content size.** A value the code derives from other tokens
  (e.g. `ds-close`'s glyph, `calc(size - padding)`) is a consequence, not a spec. Annotate the
  tokens it's derived from.
- **No radius on a circle or pill.** Skip the radius annotation — marker _and_ legend row — when
  the radius is at least half of the component's height (and width, if smaller), e.g.
  `ds-close`'s and `ds-tag`'s `9999`. The fully rounded shape already says it all; on a pill the
  `Spec/Radius` dot would also float off the curved edge. Same as TapTap's Tag specs, which show
  no radius on their pill tags.
- **Padding on both sides gets a highlight on both sides.** A symmetric padding token (e.g.
  `Padding/Y`) gets a `Spec/Inset` on top **and** bottom (or left **and** right); one
  `Spec/Dimension` marker is enough. When the two sides differ (e.g. `ds-tag`'s closable right
  padding, `Padding/X − 4`), give each side its own marker and its own legend row, labelled by
  side (`Padding L` / `Padding R`), never an axis label next to a side label.

Structure (mirror `ds-close`'s live `specs` node `2047:19`):

- A 2px divider, then a `specs` `VERTICAL` auto-layout frame (`itemSpacing: 16`, no fill, `FILL`
  width), last child of the outer frame.
- `specs-heading`: clone the `variants-heading` text node and set it to `"📐 Specs"` — cloning
  keeps its font/size/color bindings.
- Optional `rule-note` (💡 + one or two sentences), only for a sizing rule the component's code
  actually enforces (TapTap's example: "minimum width is 2× the field height"). Never write a rule
  that isn't traceable to code.
- `Specs grid`: `VERTICAL` auto-layout (`itemSpacing: 16`, `FILL` width) with **one card per option
  of the Variants section's axis**, same order (usually `size`). Each card, `spec-<option>`:
  - `HORIZONTAL` auto-layout, padding 20, `itemSpacing: 32`, corner radius 8, `FILL` width,
    `counterAxisAlignItems: 'CENTER'`, literal fill `{0.976, 0.976, 0.976}` (same as "Copy me").
  - `preview` (`VERTICAL`, `itemSpacing: 12`): the option name (clone the Variants `axis-label`
    text) above a `stage`.
  - `stage`: a plain frame (**no** auto-layout — this is an intentional absolute composition),
    240×100, no fill, `clipsContent: false`. It holds one `INSTANCE` of the option's default
    variant (`state=default`, Primary set) at **1×** — never rescaled, the spec shows the real
    size — centered, plus the annotation instances positioned around it.
  - `legend` (`VERTICAL`, `itemSpacing: 8`): one `Spec/Legend item` instance per annotated value.

**Annotation components live on the shared `🧰 Annotations` page (node `2046:5`)**. Always
instance them, never draw loose lines/labels (TapTap's hand-drawn markers are what this avoids):

| Component                          | Use                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Spec/Dimension` (`side` × `kind`) | A measured distance. `side` (`top`/`bottom`/`left`/`right`) is the side of the component it sits on. Resize the instance to the length (constraints keep ticks/label in place). `Value` has units: `24px`, `min 40px`.                                                                                                                                                                                                       |
| `Spec/Inset`                       | Translucent highlight over a padding/gap area, resized to that area.                                                                                                                                                                                                                                                                                                                                                         |
| `Spec/Outline`                     | Dashed box around a nested element that has its own fixed size (e.g. a nested icon instance with a size token). Not for calculated content sizes.                                                                                                                                                                                                                                                                            |
| `Spec/Radius`                      | Dot + leader line + `Value` label. Place it so the dot centers on the corner: instance `x = cornerX − 3`, `y = cornerY − 17`.                                                                                                                                                                                                                                                                                                |
| `Spec/Callout`                     | A text part's typography, TapTap-style: purple pill label (`Value`: `16px Bold`) + vertical leader + dot. Put the dot on the text (`x = textCenterX − width/2`) and the pill fully **above** the component, 8px clear of its top edge, so it never overlaps the component or its padding highlights; shift the stage content down if the pill would leave the stage. Keep spacing markers below so the label has room above. |
| `Spec/Legend item` (`kind`)        | Four aligned columns: swatch, `Value` (fixed 52px column, the actual value: `5px`), `Label` (fixed 72px column: `Size`, `Width`, `Height`, `Min width`, `Padding`, `Gap`, `Radius`, …), `Token` (variable name + calculation).                                                                                                                                                                                               |

**Marker order, from the center out: component → measure line → label.** That's what `side`
encodes: `top` has its label above the line, `bottom` below, `left` to the left, `right` to the
right. So a width marker above the component uses `side=top`, a padding marker below it uses
`side=bottom`.

`kind` colors are fixed: `size` green, `icon` orange, `spacing` magenta, `radius` blue, `type`
purple — literal documentation colors, not design tokens (same reasoning as the literal page
background). One color per kind, even when a card has several rows of the same kind (TapTap uses
one magenta for all spacing too). **Every text part gets a `Spec/Callout`** on the stage and a
`kind=type` legend row (`Value` = font size, `Label` = `Type`, `Token` = the font-size token plus
weight/family/line-height, abbreviated with `…/` so the row fits). Both were added for `ds-tag`,
the first component with a text part.

Legend `Value` is the **actual value used**, the same number as the marker (`5px`), not
necessarily the variable's own value.

Legend `Token`: the **exact Figma variable name**, emoji segment prefixes included
(`🧩 Component/Close/Size/Base`), so it can be searched for in Figma's variable picker as-is.
**When the actual value is calculated from the variable, add the variable's own value and the
calculation**, so the row explains why `Value` differs from the variable:
`🧩 Component/Close/Padding/Base (10px) ÷ 2`. The calculation must match the one in the
component's code and the `specs:` entry in `<name>.figma.md`.

One row per annotated value, with one exception: **when width and height use the same variable
and end up with the same value, merge them into a single `Size` row** (`ds-close`:
`24px · Size · 🧩 Component/Close/Size/Base`). Keep separate `Width`/`Height` rows when they use
different variables, when one is a minimum (`Min width`) and the other fixed, or when the values
differ. The stage still draws both the width and the height marker either way.

Layout tips for the stage (from `ds-close`, whose smallest variant is 14px):

- Width goes above the instance (`side=top`) and height to its left (`side=left`); spacing
  markers go below (`side=bottom`) or to the right (`side=right`), so labels don't collide on
  small variants.
- Marker labels carry the value only; the legend repeats it next to the label + variable. That's
  what keeps a 14px component readable at 1×.

**Only the light/Primary frame gets a Specs section.** An `inverted` split changes colors, not
geometry, so the dark frame would repeat identical numbers. For an
[content-selection component](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library), build the
cards from one representative entity — the values are shared by every entity.

**The Specs section is a static snapshot.** Legend and marker labels are plain text overrides, not
live bindings, and annotation instances are sized to literal px, so a token value change needs the
section rebuilt. Like the rest of this v1 skill, keeping it in sync with later token changes is out
of scope.

## Handling an `inverted` axis (two-frame split)

**A component with a true `inverted`/dark-context variant property gets two entirely separate
top-level frames side by side on the page** — one light-themed ("`<Component>`"), one
dark-themed ("`Inverted <Component>`") — not a single frame with a two-table split. Build the light
frame first as the normal template, then `outer.clone()` it as the base for the dark frame (keeps
both structurally identical), remove the non-matching half of anything that doesn't apply to each
frame, and position the clone to the right of the original (`x: outer.x + outer.width + 40`).

**`inverted` must not be a Figma variant property on one shared component set at all.** Per the
TapTap Design System's Button (where Primary/Ghost/Link/Outline are separate top-level components
swapped via Figma's native Instance Swap, not one set with a "style" variant), split any component
with a true `inverted`/dark-context axis into **two separate top-level component sets**. This is
the same decision as Phase 2's general variant-vs-instance-swap test applied to a specific axis —
`inverted` changes which layers/structure render (light vs. dark treatment, not just a token on
identical layers), so it gets the top-level split like any other structural axis (button
`color`/`type`, icon `name`), not a crossed variant property. Name the two sets
`<Component>/Primary` and `<Component>/Inverted` (the `/` is Figma's own convention for grouping
entries under one category in the Assets panel and the Instance Swap picker — confirmed against the
TapTap reference). The light frame sources from `<Component>/Primary`, the dark frame from
`<Component>/Inverted`. To split an existing single set: group its variant children by `inverted`
value, strip `inverted=...` from each child's name, `figma.combineAsVariants()` each group
separately, then **immediately check for the round-trip naming bug** (see CONVENTIONS.md) — rename
children back to `key=value` format if `variantProperties` comes back `null`. Swap every
documentation instance (`instance.swapComponent(...)`) to the correct new set, and realign the Main
components placement in both frames against their respective new set's children.

**Minimal dark-frame theming — the dark/"Inverted" frame keeps every piece of chrome identical to
the light frame.** An earlier draft re-themed the _entire_ dark frame (frame fill, headings,
dividers, kicker/wordmark, hyperlink underline, panel/sidebar backgrounds); that was wrong — it was
over-theming for no benefit and created a real legibility trap (white icon/text rendering invisible
once a whole panel went dark). The correct, confirmed approach: frame fill white, title/lead/
headings/dividers/kicker/wordmark/link same tokens and colors as the light frame (no underline, no
dimmed grey, no recolor), Variants sidebar + chip backgrounds/text unchanged, Main components
header row/column + corner cell + grid lines unchanged (same light grey/white/grey-text as the
light frame — don't theme them dark, and don't forget they still need the centering fix from the
[Main components](#5--main-components) section above). **The only thing that changes is giving a
dark background to every "preview" surface** — any container whose sole content is a real component
instance, i.e. "the area where we present a component/instance/variant": the "Copy me" box, each
swatch in the Variants panel (`example-right`/`example-bottom`), and each data cell in the Main
components table (`cell-<row>-<col>`, never the header/corner cells). This is a minimal, surgical
change, not a parallel dark theme.

Bind that dark preview fill to the same token used file-wide for this purpose
(`VariableID:137:2764`, confirmed live on `ds-close`'s `Copy me box`/`Variants` examples/Main
components data cells). **Known gotcha**: re-deriving the binding per node via
`setBoundVariableForPaint` against this variable has rendered solid black instead of navy on some
(but not all) nodes in a past run — cause unconfirmed, possibly a mode-resolution quirk tied to
nesting depth. The reliable fix: build the "Copy me" box's fill first (that one tends to resolve
correctly), then **deep-clone its actual working paint object**
(`JSON.parse(JSON.stringify(copyMeBox.fills[0]))` — preserves the `boundVariables` reference) and
assign that literal cloned paint to every other preview surface, rather than re-deriving the
binding independently per node.

**The "Copy me" box and "Variants" panel inside the dark frame must use real `inverted=true`
instances** (`instance.swapComponent(...)` from the default `inverted=false` variant to the
matching `inverted=true` one — preserves existing overrides like a "Show X" boolean or placeholder
text, no need to reapply them) — using the normal variant there is wrong: a dark-themed
documentation frame exists specifically to demonstrate the inverted appearance. Once swapped, the
box/panel fill uses the dark preview token above — leaving them light makes the now-white inverted
glyph/text nearly invisible.

**This also surfaces a real bug worth checking for every time: does the master component's own
`inverted=true` variant actually have every text element recolored for dark-context contrast?** On
`ds-spinner`, the `Label` text inside every `inverted=true` variant was still the normal navy color
— never fixed at the component level, only ever patched via one-off instance overrides in an
earlier, now-superseded documentation layout, so the real defect went unnoticed until something
finally used the true master variant directly. Fix any such gap **in the master component**, not
with another per-instance override — it must propagate to every real use of that variant, not just
the documentation page.

## Handling an open-ended content-selection prop (wrapper + Instance Swap library)

**SUPERSEDED default — see CONVENTIONS.md's "Current rule" for the full history.** An earlier
version of this section said an open-ended content-selection prop (e.g. `ds-icon`'s 79-option
`name`) with its own crossed same-layers sub-props always becomes **N separate top-level
`COMPONENT_SET`s**, each crossing those sub-props independently (`ds-icon`: 79 sets × `size`×`color`
= 2,370 components). That was reversed once the resulting component count became the actual
problem reported by the user — it's kept below as a **fallback for the rare case** this pattern
doesn't fit (see the end of this section), not the default.

**Current default: ONE shared wrapper `COMPONENT_SET` crossing only the remaining same-layers
sub-props, plus a lightweight Instance Swap library for the content axis.** For `ds-icon`: one
`"Icon"` wrapper set with `size`×`color` (confirmed real build: 5×8 = 40 variants, after `inverted`
and `disabled` were also folded into `color` as additional token-swap options rather than separate
axes — see SKILL.md's variant-count hard-stop step for when/why that folding happens), where each
variant contains a nested `INSTANCE` of a default glyph bound to an `INSTANCE_SWAP` component
property (`addComponentProperty('Icon', 'INSTANCE_SWAP', defaultId)` on the set,
`componentPropertyReferences = { mainComponent: propKey }` on each variant's nested instance) — plus
N lightweight single-vector `COMPONENT`s (not sets, one per content option) as the swap library,
parked off-canvas. This works because Figma preserves per-instance overrides (resize, fill rebinds)
across an Instance Swap when the overridden node has a name-matching counterpart in the new
component — confirmed working, not just assumed. Reduced `ds-icon` from a theoretical 2,370 down to
119 (40 + 79).

**"Main components" for this pattern is the real wrapper set's own cross-product as a single table**
(e.g. `ds-icon`: `color` rows × `size` columns, 40 cells) — same `ABSOLUTE`-auto-layout-child
mechanism as the plain (non-split) case in [Main components](#5--main-components) above, just
applied to the wrapper set instead of a plain component set. It is **not** N separate per-option
tables; the content axis isn't part of this table at all.

**Add a separate "🖼️ \<Plural noun\> names" (or equivalent) section after "Main components" so the
content axis itself is still browsable.** Since "Main components" no longer shows the N options,
consumers need another way to see what's available. Build a grid: one cell per option, each an
`instance` of the wrapper's default variant (e.g. `size=md, color=primary`) with its `Icon`
Instance Swap property overridden per cell (`instance.setProperties({ [swapPropertyKey]:
optionComponentId })` — read the exact key, e.g. `"Icon#<nodeId>"`, off a real instance's
`componentProperties`, don't assume the bare property name works) to that option's swap-library
component, plus a small name label underneath. Build the grid on a **plain `figma.createFrame()`
(`layoutMode: 'NONE'`), not an auto-layout frame** — cells are manually positioned (`cell.x`/`cell.y`
in a row/column grid), and `layoutPositioning = 'ABSOLUTE'` only applies to (and is only needed on)
an auto-layout parent; setting it on a plain frame's child throws. For `ds-icon`'s 79 icons this was
a 9-column grid, built in one `use_figma` call (cheap per-cell setup: one instance + one swap-property
override + one text label supports a much larger single-call batch than the SVG-import work needed
to build the library itself).

**A glyph/content library item needs exactly one fill-bearing node, name-matched to the wrapper's
default's own structure, for color overrides to propagate fully on swap.** An icon with more than
one top-level `VECTOR` (e.g. a 2-path logo) only gets one of its paths recolored on swap (or none,
if the vectors sit under different group nesting than the default) — Figma's override-preservation
matches by node name/path, and a default with one `"Vector"` child has nothing to match a second one
against. Fix: `figma.flatten()` any multi-vector library item into one `VECTOR` before adding it to
the library, **then immediately reassign `vector.fills = JSON.parse(JSON.stringify(vector.fills))`**
— a plain value-preserving reassignment, not a real change — since `flatten()` otherwise leaves the
new vector's fills in a state that reads correctly on the master component itself but comes back
empty when read through a swapped instance. Confirmed via direct swap-and-inspect testing, not
assumed. (From `ds-icon`'s `xing`/`information`, the only 2 of 79 icons with multi-path source
SVGs.)

**A `<clipPath>` in the source SVG can import as a visible sibling `GROUP`, not a real clip mask —
strip it before flattening, don't just flatten everything blindly.** `figma.createNodeFromSvg`
sometimes imports a `<clipPath>` as a plain `GROUP` named after its SVG `id` (e.g. a `<clipPath
id="a">` becomes a sibling group literally named `"a"`), sitting alongside the real content group
rather than being applied as an actual clip. Flattening it in with the real content either throws
(`vector.fills` ends up `undefined` on a `GROUP`-typed result) or visually corrupts the icon.
Detect via a regex on the raw SVG source (`/clip-path="url\(#([^)]+)\)"/`), find and `.remove()` the
matching-named node from the imported frame, **then** flatten whatever vectors remain. (From
`ds-icon`'s `information` and `triangle`.)

**If a given content option's token-swap sub-prop renders invisibly when swapped into a specific
context, the visibility fix belongs on the "Main components" table's data cells, not the master
variant.** E.g. a `color` option resolving to a near-white/pale token (`inverted`, folded in as a
color per the rule above) is invisible against a plain white table cell — give just that option's
row/column of data cells (not the whole table, not the master component) a dark preview background,
same reasoning as [the dark-preview-surface rule](#handling-an-inverted-axis-two-frame-split) for a
true `inverted` frame split, just scoped to one row/column of cells instead of a whole frame since
this pattern has no second frame to split into. (From `ds-icon`'s `color=inverted` row.)

### Fallback — N separate top-level sets, each independently crossing its own sub-props

Use this **only** when the wrapper pattern above genuinely doesn't fit — e.g. the content options
don't share enough layer structure for one swap library to represent them all, or a sub-prop's
effect isn't a pure token-swap for every option. **Within each of the N top-level entities, any
remaining same-layers prop (size/color/etc.) is still a real crossed variant property** — this was
the hard rule in the old default too. Each `<Component>/<option>` becomes its own `COMPONENT_SET`
(not a plain `COMPONENT`) with every such prop crossed inside it. To build N top-level component
sets at this scale: for each entity, clone its base node once per variant combination (reuse the
real original node for exactly one combo, to avoid orphaning it), resize/recolor/rebind each per its
combination, name each `key1=value1, key2=value2`, then `figma.combineAsVariants()` per entity.
**Iteration order determines the default variant** — `combineAsVariants` has no settable
`defaultVariant` (confirmed read-only); order each axis so the real code default comes first, not
alphabetically. Batch several entities per `use_figma` call (batch size scales with how cheap each
variant's setup is — simple resize/recolor supports larger batches than anything requiring font
loads or nested property wiring). "Main components" then becomes the exhaustive reference grid of
all N real standalone components, each shown at its own **default** variant combination only (not
every size/color combination) — same centering/grid-line technique as a true table, just resolving
components by page-level name lookup instead of `set.children`, since there's no single shared
`COMPONENT_SET` to query across all N. If a full per-option-combination reference is still needed
beyond that default-only grid, add a dedicated section after "Main components" (don't cram a full
cross-product into "Variants," which stays a compact single-axis sample) — one row per entity, one
column group per instance-override axis, every swatch an `instance` of that row's real component,
built in batches with the table chrome built first in a separate pass.

## Cross-cutting build pitfalls

These apply to building any frame/section in this template, not one specific section:

- **`figma.createAutoLayout()` defaults to a solid white fill.** Clear it explicitly (`fills = []`)
  on every purely-structural wrapper frame — only intentionally-chromed frames (e.g. the "Main
  components" table, the "Copy me" box) should keep a fill. A blanket fill-clear across a frame's
  children can also hit sibling **text** layers that need their own color kept intact (e.g.
  row/column header labels) — clear wrapper frames specifically, not every child indiscriminately.
- **Awaited promises**: text-fill fixes on instance children (e.g. recoloring a label) must be
  `await`ed in a loop, never fire-and-forget (`promise.then(...)` without awaiting it before the
  script returns or before `screenshot()` is called) — it may or may not land in time,
  non-deterministically. Confirmed by observing this fail silently on one build and succeed by luck
  on another with the exact same fire-and-forget pattern.
