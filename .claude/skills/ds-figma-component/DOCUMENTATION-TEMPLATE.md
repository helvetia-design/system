# Phase 3b Documentation Template

## What this is, and why we have it

The raw component set that Phase 3 produces is not the deliverable on its own. Every component
pushed into Figma also gets a readable **documentation page** — a single Figma frame that shows a
human how to find, copy, and understand every variant of the component, built from real instances
and the real component set, not redrawn approximations.

This document is a **fixed template, not a per-component judgment call** — deviating from its
_structure_ is wrong. Adapt _content_ (which props, which tokens, which axis) to the component at
hand; never improvise a different layout. The template follows the TapTap Design System's Figma
community file structure (`Button–Primary` page), replacing an earlier row/card/column layout used
on this file's first components. It now applies to every component built on this Figma file.

## Table of contents

- [Canonical reference — inspect before you build](#canonical-reference--inspect-before-you-build)
- [When to use this](#when-to-use-this)
- [What to do](#what-to-do)
- [Document structure](#document-structure)
  - [Page and outer frame](#page-and-outer-frame)
  - [1. Header](#1-header)
  - [2. "👉 Copy me"](#2--copy-me)
  - [3. "🛠 Variants"](#3--variants)
  - [4. "🔒 Main components"](#4--main-components)
- [Handling an `inverted` axis (two-frame split)](#handling-an-inverted-axis-two-frame-split)
- [Handling an open-ended content-selection prop (N-split components)](#handling-an-open-ended-content-selection-prop-n-split-components)
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

**Don't use `ds-badge` or `ds-spinner`'s live pages as a structural reference — inspect `ds-close`
only.** `ds-badge` has no `inverted` axis (single frame), so it can't demonstrate the full
template, and its "Main components" set/chrome split is a less clear version of the same mechanism
`ds-close` shows more explicitly. `ds-spinner` is actively unreliable right now: a
`ds-figma-component` session on it (see `spinner.figma.md`'s final follow-up sections) hit a
`use_figma` atomicity-violation bug that silently detached its master component sets and deleted
its entire "Main components" grid structure, and separately found `get_screenshot` returning three
different, differently-wrong renders of the same verified-correct document state — both were
recovered, but its page still uses the older page-level-sibling overlay technique (a fallback-only
pattern, see [Main components](#4--main-components) below) rather than the `ABSOLUTE`-auto-layout
mechanism, so copying its structure would teach the wrong default anyway. `ds-icon`'s existing
Inverted page (if still present) may also still use an old full-dark-frame theming rather than the
minimal theming rule below — don't inspect it as a template either; if it needs the fix, re-theme
it to match `ds-close`'s confirmed minimal treatment instead.

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
4. Build [Variants](#3--variants).
5. Build [Main components](#4--main-components).
6. If the component has a true `inverted`/dark-context axis, apply the
   [two-frame split](#handling-an-inverted-axis-two-frame-split) instead of a single frame.
7. If the component has an open-ended content-selection prop (many options, e.g. an icon `name`),
   apply the [N-split-components handling](#handling-an-open-ended-content-selection-prop-n-split-components)
   instead of a single component set.
8. Iterate on the layout with the user before considering this phase done — the exact structure is
   something to confirm visually (screenshot checkpoints), same as the variant matrix itself in
   Phase 3.

## Document structure

### Page and outer frame

- **Page background**: set the Figma page's own `backgrounds` to a literal solid `#e8e8e8`
  (`page.backgrounds = [{ type: 'SOLID', color: { r: 232/255, g: 232/255, b: 232/255 } }]`) — not a
  design token, no page-background token exists in this system.
- **One bordered outer frame**, white fill, **2px** `Alias/Border/Color/GreyLight` stroke, 8px
  corner radius, ~40px padding, vertical auto-layout. No label above the frame (an earlier draft of
  this template had one; removed on request — don't add it back).
- **Every border/divider/grid-line in this template is 2px, always** — not 1px. This applies to:
  the outer frame's own stroke, every divider rule between sections, the Variants panel's border,
  the Main components table's border, and every internal grid-line rectangle. When building a
  divider or grid line as a rectangle, give it a 2px dimension on its thickness axis
  (`resize(width, 2)` for a horizontal divider, `resize(2, height)` for a vertical grid line); when
  it's a frame stroke, set `strokeWeight: 2`.
- Inside the frame, the four sections below, in order, each separated by a 2px
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
- Each of the three section headings below ("👉 Copy me", "🛠 Variants", "🔒 Main components") is
  bold, `Component/Heading/Level/1/FontSize` (28px), `Alias/Text/Color/Primary`.

### 2. "👉 Copy me"

One real, representative **instance** (the default/base combination) in a centered box with a soft
shaded background (`{0.976, 0.976, 0.976}`, no border) — the single "drag this into your design"
example. Use a Figma `INSTANCE` (`variant.createInstance()`) of the finished component-set variant
— never the variant node itself. If the component has any boolean "Show X" property (per Phase 2's
conditional-render rule), override it to `true` on this instance for readability, while the
component set's own default stays whatever matches code. Fixing the main component later
automatically propagates to this instance; editing it directly does not.

### 3. "🛠 Variants"

A compact, single-axis reference — not a full cross-product. Pick the one variant property that
most defines the component's _scale/shape_ (e.g. `size`). Left side: a shaded sidebar with a bold
axis-name label (e.g. "Size") and the option names as stacked pill/tag chips. Right side: one
representative instance per option, side by side, in a bordered white panel. Same `INSTANCE` rule
as "Copy me" above — never the variant node itself.

### 4. "🔒 Main components"

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

**Within each of those N top-level entities** (if the component is itself split, see
[N-split components](#handling-an-open-ended-content-selection-prop-n-split-components)) **, any
remaining same-layers prop (size/color/etc.) is still a real crossed variant property** — see that
section for the full rule. For a plain (non-split) component, "Main components" shows the full
cross-product as described above.

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
[Main components](#4--main-components) section above). **The only thing that changes is giving a
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

## Handling an open-ended content-selection prop (N-split components)

**An open-ended content-selection prop with many options** (e.g. `ds-icon`'s 79-option `name`) **is
never a crossed variant property at all — split it into N separate top-level components**, one per
option, named `<Component>/<option>` (same Instance Swap pattern as the `inverted` axis above).
"Main components" then becomes the exhaustive reference grid of all N real standalone components,
each shown at its own **default** variant combination only (not every size/color combination — the
grid stays about "which content/name," see the "Sizes & Colors" pattern below for the
cross-product) — same centering/grid-line technique as a true table, just resolving components by
page-level name lookup instead of `set.children`, since there's no single shared `COMPONENT_SET` to
query across all N.

**Within each of those N top-level entities, any remaining same-layers prop (size/color/etc.) is
still a real crossed variant property — this is a hard rule, not a simplification opportunity,
however large the resulting cross-product gets.** Each `<Component>/<option>` becomes its own
`COMPONENT_SET` (not a plain `COMPONENT`) with every such prop crossed inside it. For `ds-icon`:
`name` → 79 top-level components, and _within_ each one, `size` × `color` → 30 crossed variants
(2,370 components total). Do not default to instance-overrides for "size/color/etc." just because
the combined total looks large — ask first if genuinely unsure whether a prop qualifies, but once
it passes the "same layers, different token" test, build the real variant structure. To build N
top-level component sets at this scale: for each entity, clone its base node once per variant
combination (reuse the real original node for exactly one combo, to avoid orphaning it),
resize/recolor/rebind each per its combination, name each `key1=value1, key2=value2`, then
`figma.combineAsVariants()` per entity. **Iteration order determines the default variant** —
`combineAsVariants` has no settable `defaultVariant` (confirmed read-only); order each axis so the
real code default comes first, not alphabetically. Batch several entities per `use_figma` call
(batch size scales with how cheap each variant's setup is — simple resize/recolor supports larger
batches than anything requiring font loads or nested property wiring).

**If a component (or each of its N split top-level entities) has multiple same-layers props that
deserve an exhaustive per-option-combination reference beyond the compact "Variants" sample, add a
dedicated section after "Main components"** — don't try to cram a full cross-product into
"Variants" itself, which stays a compact single-axis sample. For `ds-icon`'s `size` × `color` (5 ×
6 = 30 combinations, across all 79 icons = 869 total swatches), this became a "📐 Sizes & Colors"
table: one row per icon (or per top-level component, if the prop being exhausted sits above a
top-level-component split), one column group per instance-override axis. Every swatch is an
`instance` of that row's real component, never the master — size via `instance.resize(px, px)`,
color via finding the inner fill-bearing node (often a single `VECTOR` child for a simple
icon-like component) and rebinding its fill. For a build this large, split into batches (e.g. ~10
rows per `use_figma` call) rather than one script, and build the table chrome (headers, row
labels, empty cells) in a separate pass _before_ filling instances — makes the grid skeleton easy
to verify before committing to filling hundreds of cells.

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
