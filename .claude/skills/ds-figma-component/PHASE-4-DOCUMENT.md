# Phase 4 — Document (documentation presentation)

**You are here:** assumes [`PHASE-3-BUILD.md`](PHASE-3-BUILD.md) has built and confirmed the full
variant matrix as a real Figma `COMPONENT_SET`, with its key written back to `<name>.figma.md`.
This phase builds the per-component **documentation page** — build it after Phase 3 confirms the
variant matrix looks right, before [`PHASE-5-REVIEW.md`](PHASE-5-REVIEW.md)'s review, so that
review covers the documentation page too, not just the raw component set.

## What this is, and why we have it

The raw component set that Phase 3 produces is not the deliverable on its own. Every component
pushed into Figma also gets a readable **documentation page** — a single Figma frame that shows a
human how to find, copy, and understand every variant of the component, built from real instances
and the real component set, not redrawn approximations.

This document is a **fixed template, not a per-component judgment call** — deviating from its
_structure_ is wrong. Adapt _content_ (which props, which tokens, which axis) to the component at
hand; never improvise a different layout. **As of 2026-10-29 the template is a full-width blue
header over a 2-column body** (left: Copy me / Anatomy / Specs / Variants stacked; right: a single
"🔒 Component Set" panel), replacing the single-column, white-header, 6-section-stack layout used
on this file's first components (`ds-close`, `ds-spinner`, `ds-icon`, and `ds-badge`'s original
build). It now applies to every component built on this Figma file going forward; the prior
single-column pages have not yet been migrated (see `CONVENTIONS.md` for which components still use
the old layout).

## Table of contents

- [Canonical reference — inspect before you build](#canonical-reference--inspect-before-you-build)
- [When to use this](#when-to-use-this)
- [What to do](#what-to-do)
- [Document structure](#document-structure)
  - [Page and outer frame](#page-and-outer-frame)
  - [0. Shared `Preview` box component](#0-shared-preview-box-component)
  - [1. Header](#1-header)
  - [2. Body — 2-column layout and column sizing](#2-body--2-column-layout-and-column-sizing)
  - [3. "👉 Copy me"](#3--copy-me)
  - [4. "🏗️ Anatomy"](#4--anatomy)
  - [5. "📐 Specs"](#5--specs)
  - [6. "🛠 Variants"](#6--variants)
  - [7. "🔒 Component Set"](#7--component-set)
- [Handling an `inverted` axis (two-frame split)](#handling-an-inverted-axis-two-frame-split)
- [Handling an open-ended content-selection prop (wrapper + Instance Swap library)](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library)
- [Cross-cutting build pitfalls](#cross-cutting-build-pitfalls)

## Canonical reference — inspect before you build

**Don't rebuild this structure from the prose below alone.** The `ComponentTemplate` frame on the
`⏳ Core / Indicator / Badge` page (node `2160:3652`) is the **primary** canonical live reference
for the overall page structure — outer frame, header, 2-column body, and the stripped-down
"Component Set" panel — inspect it (`get_metadata` + targeted property reads) before building.
This supersedes `ds-close` as the structural reference as of 2026-10-29.

**`ds-close`'s reference pages (`Close Documentation`, node `1993:2`, and `Inverted Close
Documentation`, node `1993:5904`) are still the canonical reference for everything this template
doesn't change**: the `inverted` two-frame split mechanics, the diagram/table construction inside
each section, focus-state construction, and the overall token-binding discipline. Read both
references together — `ComponentTemplate` for layout/header/Component Set, `ds-close` for
everything else — rather than assuming one alone is complete. **Exception, as of 2026-10-29**:
`ds-close`'s own Copy me box / Anatomy box / Variants row panels predate the shared
[`Preview` component](#0-shared-preview-box-component) and each still use their own (inconsistent)
hand-built chrome — don't copy their individual fills/strokes/radii for the panel wrapper itself;
use a `Preview` instance there instead, per section 0 below.

**`ComponentTemplate` has no "🏗️ Anatomy" or "📐 Specs" section built on it**, and its "🔒
Component Set" panel shows only a `color`×`size` grid with no `state` axis — it's a structural
mockup, not a fully-populated reference. Build Anatomy and Specs from their own specs below (same
content rules as before, just relocated), and don't assume the frame's variant count/axes are
representative of what a real component needs.

**Don't use `ds-badge`, `ds-spinner`, or `ds-icon`'s pre-2026-10-29 live pages as a structural
reference** — they use the superseded single-column white-header layout. `ds-badge`'s page is
being migrated to the new template in the same pass that introduced this document revision; once
migrated, check whether its live page is a better combined reference than `ComponentTemplate` +
`ds-close` and update this pointer.

Before building a new component's Phase 4 page, run a read-only `get_metadata` / targeted
property reads against `ComponentTemplate`'s node IDs above (and `ds-close`'s, for the parts it
still covers) to see the real current hierarchy, fills, fonts, bound variables, and auto-layout
settings — then mirror that structure, rather than reconstructing positions/alignment from this
document's words each time. If you change the template's structure during a future run, update
this reference pointer if the canonical node IDs change.

## When to use this

Build this after Phase 3 confirms the variant matrix looks right — don't start it on an unconfirmed
or partially-built component set. Finish it before Phase 5's visual-regression review, so that
review covers the documentation page too, not just the raw component set.

## What to do

At a high level, in order:

1. Set the Figma page's own background and build the outer bordered frame (see
   [Page and outer frame](#page-and-outer-frame)).
2. Build the [Header](#1-header) — instance the shared `Header` component (`🧰 Annotations` page,
   node `2180:17`) and override its text, don't rebuild it from scratch.
3. Build the [body's 2-column shell](#2-body--2-column-layout-and-column-sizing) — a left
   "documentation" column and a right "component" column, each independently sized.
4. In the left column, in order: build [Copy me](#3--copy-me), build
   [Anatomy](#4--anatomy) (skip entirely if the component's `<name>.figma.md` has no `anatomy:`
   list — no `@part` tags found in Phase 1), build [Specs](#5--specs), build
   [Variants](#6--variants).
5. In the right column, build [🔒 Component Set](#7--component-set).
6. If the component has a true `inverted`/dark-context axis, apply the
   [two-frame split](#handling-an-inverted-axis-two-frame-split) instead of a single frame — each
   frame independently gets the full header + 2-column structure above.
7. If the component has an open-ended content-selection prop (many options, e.g. an icon `name`),
   apply the [wrapper + Instance Swap library handling](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library)
   instead of a single plain component set.
8. Iterate on the layout with the user before considering this phase done — the exact structure is
   something to confirm visually (screenshot checkpoints), same as the variant matrix itself in
   Phase 3.

## Document structure

### Page and outer frame

- **Page background**: set the Figma page's own `backgrounds` to a literal solid `#e8e8e8`
  (`page.backgrounds = [{ type: 'SOLID', color: { r: 232/255, g: 232/255, b: 232/255 } }]`) — not a
  design token, no page-background token exists in this system. Unchanged from before.
- **One bordered outer frame**, white fill, **2px** stroke bound to `🔗 Alias/▭ Border/Color/GreyLight`
  (`VariableID:137:80`), all four corner radii bound to `🌐 Global/📏 Dimension/Radius/12`
  (`VariableID:137:2640`). No label above the frame. Unchanged from before.
- **No vertical auto-layout padding on the outer frame itself** — the header spans edge-to-edge
  (its own 40px padding provides the visual margin), and the body below it also spans edge-to-edge.
  The outer frame is `VERTICAL` auto-layout, `itemSpacing: 0`, `HUG` on both axes, `clipsContent:
true` (so the header's square top corners are clipped to the outer frame's rounded corners).
- **No inter-section divider lines anymore.** The prior template separated every section with a 2px
  `Alias/Border/Color/GreyLight` divider rule; this is dropped. The header's own blue fill is now
  the only hard visual break; every other section-to-section gap in the left column comes from each
  section's own **40px top padding**, not a parent `itemSpacing` or a drawn divider (confirmed live:
  the left `documentation` column itself has `itemSpacing: 0`). Still use 2px for every stroke that
  _does_ exist (outer frame border, panel borders, the Component Set's dashed border, grid-line
  rectangles inside the Anatomy/Specs diagrams) — only the dedicated divider-rectangle convention
  is gone.

### 0. Shared `Preview` box component

**Don't hand-build a bordered/rounded box for Copy me, Anatomy, Specs, or Variants — instance the
shared `Preview` component instead**, same discipline as the `Header` master (see below). It lives
on the `🧰 Annotations` page (node `2182:2`), a real `COMPONENT`: white fill, **2px** stroke bound to
`🔗 Alias/▭ Border/Color/GreyLight` (`VariableID:137:80`), all four corner radii bound to
`🌐 Global/📏 Dimension/Radius/6` (`VariableID:137:2639`, 6px — **this file has no 8px radius token**;
6px is the closest/only sensible choice and is also what the old Anatomy box already used).

**Figma instances cannot accept arbitrary appended children** (`appendChild` into an `INSTANCE`
throws `"Cannot move node. New parent is an instance or is inside of an instance"`) — `Preview`
has no content slot built into its master, so don't try to build the section's real content
_inside_ the instance. Instead, layer it as a background:

1. Build the section's content frame exactly as before (diagram, tag row, instance, etc.), with
   its own fill/stroke/corner-radius cleared to transparent/none — the instance behind it supplies
   all visible chrome now.
2. `preview.createInstance()`, `insertChild(0, instance)` into the same parent as the content frame
   (index 0 so it renders _behind_), set `instance.layoutPositioning = 'ABSOLUTE'`, `x = 0`,
   `y = 0`, and `instance.resize(width, height)` to match the content frame's bounding box exactly.
   `resize()` works here even though the master's own sizing mode is `HUG` — same as the master
   itself, which has no children to hug around either.
3. Leave the content frame as the parent's normal (non-absolute) child so the parent still hugs/
   sizes around it as before; the `Preview` instance just rides along at the same bounds.

This keeps `Preview` a **real, linked instance** — visible in the layers panel as `Preview`,
`mainComponent` pointing at node `2182:2` — rather than a detached one-off copy. **Never
`detachInstance()` this component just to get a mutable frame to append content into** — that
severs the link entirely (confirmed: a detached shell shows up in the layers panel as a plain
frame named after the section, with no trace of `Preview`, and stops picking up master edits).
The absolute-positioned-background approach above is the only one confirmed to both stay linked
and support arbitrary per-section content.

This supersedes the three different box treatments the pre-2026-10-29 template had drifted into —
Copy me's 4px `Alias/Radius/Base` radius with no border, Anatomy's correct 2px border + 6px radius,
and Variants' 2px border with no radius at all (flagged as a likely oversight in earlier revisions
of this document). All four sections now share one chrome. **Never fork a one-off copy of this box
for a single component** — if the chrome itself needs to change, edit the shared `Preview` master
once on the Annotations page and every instance across every component's page picks it up, exactly
like `Header`.

### 1. Header

**Don't build the header from scratch per component — it's a real, reusable Figma component now.**
A shared `Header` master component lives on the `🧰 Annotations` page (node `2180:17`). Create an
`INSTANCE` of it (`headerComponent.createInstance()`), `appendChild` it as the outer frame's first
child, set `layoutSizingHorizontal = 'FILL'`, then override its text nodes directly (same
instance-text-override technique used everywhere else in this template — find each node by name
via `instance.findOne`/`findAll` and set `.characters`, no component properties involved):

- `component` → the component name (e.g. `"Badge"`).
- `kicker` → `"⏳ Core / Category / Component"` (the review-marker breadcrumb — see below).
- `lead` → the component's JSDoc lead paragraph.
- `wordmark` (4 instances: label/value × version/last-updated rows, in that order — index them via
  `findAll`, not by assuming a single node) → `"version"` / `"v<x>"` / `"last updated"` /
  `"<DD.MM.YYYY>"`. The two label wordmarks (`"version"`, `"last updated"`) never change; only the
  two value wordmarks need overriding per build.
- `link` → `"View in Storybook ↗"` text stays as-is; still set the real hyperlink per component via
  `linkText.setRangeHyperlink(0, linkText.characters.length, { type: 'URL', value: <story URL> })`
  — the master has no hyperlink set, since it's component-specific.

**Never edit the master component's own structure/styling per build** — if the header's design
needs to change, edit the shared `Header` master once (on the Annotations page) and every existing
instance across every component's page picks it up automatically; don't fork a one-off copy for a
single component. If you do need to change the master, update this document's description of its
structure below to match, same discipline as every other shared annotation component.

The rest of this section documents the header's internal structure for reference (e.g. when editing
the shared master itself) — confirmed live on the `Header` master component's own node tree:

- **Fill**: bind to `🔗 Alias/🎨 Surface/Primary` (`VariableID:137:2764`) — the same navy token this
  template already uses file-wide as the "dark preview surface" token (see the `inverted`-axis
  section below). The live `ComponentTemplate` frame currently has this as a **literal** navy
  (`{r:0, g:0.051, b:0.431}`, byte-identical to `Alias/Surface/Primary`'s resolved value) — bind to
  the real token when building, don't copy the literal; this is a known gap in the mockup, not the
  intended final state.
- **Layout**: `HORIZONTAL`, padding `40` on all four sides, `itemSpacing: 16`,
  `primaryAxisAlignItems: 'SPACE_BETWEEN'` (pushes the title block left and the info block right),
  `counterAxisAlignItems: 'MIN'` (top-aligned), `primaryAxisSizingMode: 'FIXED'` (spans the full
  outer-frame width), square corners (`cornerRadius: 0` on all four) — the outer frame's own
  rounded corners clip this via `clipsContent`.
- **Left side — `heading` frame** (`VERTICAL`, `itemSpacing: 24`), two children:
  - **Title block** (`VERTICAL`, `itemSpacing: 0`, title and kicker touch with no gap):
    - `component`: the component name, e.g. `"Badge"`. `Baloise Create Headline` **Bold**, 48px,
      fill bound to `🔗 Alias/🔤 Text/Color/White`.
    - `kicker`: the breadcrumb + human-review marker, e.g. `"⏳ Core / Indicator / Badge"`.
      `Baloise Create Headline` **Light**, 18px, fill bound to `🔗 Alias/🔤 Text/Color/White`. **Keep
      the `⏳`/`✅` review-marker mechanism exactly as before** (prefix on both the kicker text and
      the Figma page's own name; this skill must never set it to `✅`, only `⏳`) — only the font
      family/weight/size/color changed to match this new header (was `Alias/Text/Color/Grey` XS on
      a white background; now `Baloise Create Headline` Light 18px white, to read against navy).
      The live `ComponentTemplate` frame's kicker text currently has no `⏳`/`✅` prefix at all —
      that's a gap in the mockup to fix when building, not a template rule to drop.
    - **No second `instance` qualifier line is visible in this header** (unlike the prior
      template's two-line `heading`) — fold the qualifier into the `kicker` line instead when an
      `inverted`/split frame needs to name itself (e.g. append `" · Inverted"` to the kicker text on
      the dark frame), since there's no separate hidden-by-default qualifier node in the new
      `heading` structure. Confirm this against `ds-close`'s own future migration rather than
      guessing further — this is a translation of the old rule, not yet verified live on a split
      component.
  - **`body` frame** (`VERTICAL`): the lead paragraph (`lead`), same hug-height discipline as
    before (never `resize()` the frame directly — see the original gotcha, still applies). Sourced
    verbatim from the component's JSDoc comment, 16px `Baloise Create Text` Regular, fill bound to
    `🔗 Alias/🔤 Text/Color/White`.
- **Right side — `status` frame** (`VERTICAL`, `itemSpacing: 24`, `counterAxisAlignItems: 'MIN'`,
  `layoutSizingVertical: 'HUG'`) — replaces the old single `wordmark` line with a 3-row stack:
  1. **Version row** (`HORIZONTAL`, `itemSpacing: 16`): label `"version"` (`Baloise Create Text`
     Regular 16px white) + value `"v<core package version>"` (`Baloise Create Text` **Bold** 16px
     white, e.g. `"v0.0.6"`, from `packages/core/package.json`'s `version` field at build time).
  2. **Last-updated row** (`HORIZONTAL`, `itemSpacing: 16`): label `"last updated"` (Regular 16px
     white) + value `"<DD.MM.YYYY>"` (Bold 16px white, the actual current date at build/edit time).
  3. **Link**: `"View in Storybook ↗"` — unchanged from before (Bold, 16px `Baloise Create Text`,
     white, `UNDERLINE` decoration, real Figma hyperlink via `setRangeHyperlink`, story ID read from
     the component's own `doc-config.ts`).
- **Section headings below the header** ("🏗️ Anatomy", "👉 Copy me", "📐 Specs", "🛠 Variants",
  "🔒 Component Set") keep their prior style: bold, `Component/Heading/Level/1/FontSize` (28px),
  `Alias/Text/Color/Primary` — confirmed unchanged on `ComponentTemplate`'s
  `main-components-heading` node (now reading `"🔒 Component Set"`).

### 2. Body — 2-column layout and column sizing

A `HORIZONTAL` auto-layout frame (`body`, confirmed `itemSpacing: 0`, no fill, no padding) directly
below the header, full outer-frame width. Two children:

- **Left — `documentation` column**: `VERTICAL` auto-layout, holds Copy me / Anatomy / Specs /
  Variants stacked in that order. `itemSpacing: 0` — vertical separation between sections comes
  from each section's own 40px top padding (see [Page and outer frame](#page-and-outer-frame)
  above), not a column-level gap.
- **Right — `component` column**: `VERTICAL` auto-layout, holds the single "🔒 Component Set"
  section.

**Column sizing: each column gets an independent 734px minimum width, HUG beyond that — the two
columns are not locked to equal widths, and neither is the outer frame.** `ComponentTemplate`'s
live columns are currently built `FIXED` at exactly 734px each (the minimum case, since `ds-badge`'s
component set happens to fit inside 654px of content width); when building, use `HUG` sizing with a
734px floor (e.g. wrap each column's content so it never resizes narrower than 734, but let it grow
wider if a larger component set genuinely needs more room — a big `COMPONENT_SET` in the right
column is the expected reason for this, not the left column's prose). The outer frame and header
both `HUG`/stay `FIXED` to whatever total width the two columns produce, so a wide right column
widens the whole page, including the header band.

### 3. "👉 Copy me"

One real, representative **instance** (the default/base combination) inside an instance of the
shared [`Preview` component](#0-shared-preview-box-component) — the single "drag this into your
design" example. Use a Figma `INSTANCE` (`variant.createInstance()`) of the finished component-set
variant — never the variant node itself. If the component has any boolean "Show X" property (per
Phase 2's conditional-render rule), override it to `true` on this instance for readability, while
the component set's own default stays whatever matches code.

Section padding: `40` left/top (confirmed on `ComponentTemplate`'s `copy-me` section frame),
`itemSpacing: 16` between the section heading and the box. **As of 2026-10-29 this box is a
`Preview` instance** (white fill, 2px `Alias/Border/Color/GreyLight` stroke, 6px
`Global/Radius/6`) — this replaces the prior soft-shaded, borderless, 4px-radius (`Alias/Radius/Base`)
treatment, which was a different token than every other inner panel used. Don't rebuild the old
treatment on a fresh component; always use the shared `Preview` instance here.

### 4. "🏗️ Anatomy"

Unchanged in content/mechanics from the prior template — only its position in the page moved (now
second in the left column, still skipped entirely when the component's `<name>.figma.md` has no
`anatomy:` list). Panel (`Anatomy box`): **as of 2026-10-29 an instance of the shared
[`Preview` component](#0-shared-preview-box-component)** — this box's own chrome (white fill, 2px
`Alias/Border/Color/GreyLight` stroke, 6px `Global/Radius/6`) is exactly what `Preview` already was
built from, so this is a visually-identical swap from a hand-built box to an instance, not a design
change. See the prior revision of this document (or `ds-close`) for the full
diagram/circle/leader-line/legend construction rules — none of that changed, only the section's
position on the page and the box now being a real instance.

### 5. "📐 Specs"

**Moved from its old end-of-page position to directly after Anatomy, before Variants, per explicit
request (2026-10-29).** All content/mechanics are otherwise unchanged from the prior template — the
developer-handoff reference (dimensions, padding/gaps, radius, typography) drawn as annotations on a
real instance, one card per Variants-axis option, using the shared `Spec/*` annotation components on
the `🧰 Annotations` page (node `2046:5`). Each card's own `preview`/`stage` box — the one holding the
annotated instance — is, as of 2026-10-29, an instance of the shared
[`Preview` component](#0-shared-preview-box-component) rather than a hand-built frame, same as
Copy me/Anatomy/Variants. See the prior revision of this document for the full annotation-component
table, marker-order rule, and legend-row rules — none of that changed.

**Still only the light/Primary frame gets a Specs section** on an `inverted`-split component — an
`inverted` split changes colors, not geometry, so the dark frame would repeat identical numbers.

**The "last child of the outer frame" positioning rule from the old spec no longer applies** — since
Specs now sits inside the left `documentation` column as a normal stacked child (same as every other
left-column section), not as the final child of the whole outer frame. Build it the same way as
Copy me/Anatomy/Variants: a `VERTICAL` section frame appended into the `documentation` column, 40px
top padding, no special z-order handling needed.

### 6. "🛠 Variants"

Unchanged in content/mechanics — a compact, single-axis reference (not a full cross-product), left
shaded sidebar with the axis-name label + option chips, right bordered white panel with one
representative instance per option. **As of 2026-10-29 the right panel (`Variants row`) is an
instance of the shared [`Preview` component](#0-shared-preview-box-component)** — white fill, 2px
`Alias/Border/Color/GreyLight` stroke, 6px `Global/Radius/6`. This fixes `ComponentTemplate`'s
`cornerRadius: 0` panel, which earlier revisions of this document flagged as a likely oversight
(inconsistent with the Anatomy box's rounding, with nothing in the restructure's reasoning calling
for Variants specifically to lose it) — don't mirror the unrounded version on new builds. Tag chip
styling (`tag-base`, fully rounded, `Alias/Surface/Grey` fill, `Baloise Create Text` Bold 12px navy
text) is unchanged — see the prior revision for the full rule.

### 7. "🔒 Component Set"

**Replaces "🔒 Main components" — renamed, and radically simplified: no table chrome at all.**
Confirmed live on `ComponentTemplate`'s right column (`component` → `main-component` → `Badge`,
node `2160:4246`):

- **No header row, no row-label column, no grid-line rectangles, no per-cell frames.** The old
  template's `Tables row` / `Normal col` chrome-plus-overlay mechanism is gone entirely. **Labelling
  individual cells is explicit future work, out of scope for this revision** — don't build any
  placeholder chrome for it either.
- **The section wrapper (`main-component`)**: `VERTICAL` auto-layout, padding `40` on all sides,
  `itemSpacing: 16`, `primaryAxisSizingMode: 'AUTO'` (hug height), two children: the section heading
  (`"🔒 Component Set"`, 28px Bold `Baloise Create Headline`, `Alias/Text/Color/Primary` — same
  heading style as every other section) and the real `COMPONENT_SET` directly below it.
- **The real master `COMPONENT_SET` is placed as a normal, non-absolute auto-layout child** —
  confirmed live: `layoutPositioning: 'AUTO'`, `layoutSizingHorizontal: 'FILL'`,
  `layoutSizingVertical: 'FIXED'` (resized to its real content height, `540` on `ds-badge`). This is
  a major simplification over the old template's `ABSOLUTE`-auto-layout-child-overlaid-on-table-
  chrome mechanism (see the old revision / `CONVENTIONS.md`'s learned rules for that history) —
  there is no table to align against anymore, so the set just flows normally as the wrapper's second
  child. `appendChild` the real set into `main-component`, then `set.layoutSizingHorizontal =
'FILL'` and `set.resize(set.width, set.height)` (or a deliberately chosen height) as needed.
- **Visual chrome lives on the set itself, not a separate wrapper box**: fill white, **2px dashed**
  stroke (`dashPattern: [10, 5]`) bound to `🌐 Global/🌈 Color/Purple/4`, `cornerRadius: 5`. Set these
  directly on the `COMPONENT_SET` node — there is no separate dashed-border frame wrapping it.
- **Internal arrangement of the set's variant children is whatever `combineAsVariants()` produced
  natively** (Figma's own default variant grid — one axis stepping across x, the other stepping down
  y, in property-definition order) — don't compute or bake any custom cell-centering math for this
  section anymore, unlike the old template's one-time-baked local positions. If the set's children
  need repositioning for readability, treat it as adjusting the real master set's own layout, not as
  a documentation-page concern.
- **The `COMPONENT_SET` stays unlocked** — this is a change from the old template, which locked
  the set once to stop a human dragging the whole grid out of alignment inside hand-built table
  chrome. That protection no longer applies: there's no table geometry to misalign, the set is
  just a normal auto-layout child of its section wrapper, and leaving it unlocked lets a human
  select, inspect, or rearrange individual variants directly in the Figma UI. Don't set
  `locked: true` on it when building or editing this section.
- **Still apply the standing rules that don't depend on table chrome**: never move a variant out
  of its own set (`figma.combineAsVariants()` + manual `key=value` renaming if a round-trip is
  ever needed), and re-verify the set's own `width`/`height` explicitly after any repositioning of
  its children (a `COMPONENT_SET` never auto-rehugs — see `CONVENTIONS.md`'s learned rule on this).
- **If the component has an open-ended content-selection prop** (see
  [wrapper + Instance Swap library](#handling-an-open-ended-content-selection-prop-wrapper--instance-swap-library)),
  this section shows the real wrapper set's own native arrangement the same way — not N separate
  per-option tables, same as before, just without any table chrome now either.

## Handling an `inverted` axis (two-frame split)

**A component with a true `inverted`/dark-context variant property gets two entirely separate
top-level frames side by side on the page** — one light-themed ("`<Component>`"), one
dark-themed ("`Inverted <Component>`") — not a single frame with a two-table split. **Each frame
independently gets the full header + 2-column body structure above**, same as any single-frame
component; this part of the rule is unchanged by the 2026-10-29 restructure, only the content of
each frame changed. Build the light frame first as the normal template, then `outer.clone()` it as
the base for the dark frame (keeps both structurally identical), remove the non-matching half of
anything that doesn't apply to each frame, and position the clone to the right of the original
(`x: outer.x + outer.width + 40`).

**`inverted` must not be a Figma variant property on one shared component set at all.** Split any
component with a true `inverted`/dark-context axis into **two separate top-level component sets**
(`<Component>/Primary` and `<Component>/Inverted`). The light frame's "🔒 Component Set" section
sources from `<Component>/Primary`, the dark frame's from `<Component>/Inverted`. See the prior
revision of this document (or `ds-close`'s live pages) for the full splitting procedure, the
round-trip naming-bug check, and the minimal-dark-theming rule (frame chrome stays light; only
"preview surfaces" — the Copy me box, each Variants swatch, and now the Component Set panel's own
white fill per cell-less structure above — get the dark `Alias/Surface/Primary`
(`VariableID:137:2764`) background). **Note**: since "🔒 Component Set" no longer has per-cell data
frames, the dark-preview-surface treatment for this section now applies to the whole `COMPONENT_SET`
node's own fill (swap it to the dark token) rather than to individual `cell-<row>-<col>` frames —
this hasn't been exercised live yet under the new template; verify on the first `inverted` component
built this way and update this note once confirmed.

This also surfaces the same real bug worth checking for every time: does the master component's own
`inverted=true` variant actually have every text element recolored for dark-context contrast? Fix
any such gap in the master component, not with a per-instance override.

## Handling an open-ended content-selection prop (wrapper + Instance Swap library)

Unchanged by the 2026-10-29 restructure — see the prior revision of this document (or
`CONVENTIONS.md`'s "Current rule") for the full wrapper-`COMPONENT_SET` + Instance Swap library
pattern, its fallback (N separate top-level sets), and every build pitfall (multi-vector glyph
flattening, `<clipPath>` stripping, per-row dark-preview backgrounds for invisible token-swap
options). The only change under the new template: "🔒 Component Set" (ⁿée "Main components") shows
the real wrapper set's own native arrangement with no table chrome, same as the plain case above —
and the separate "🖼️ \<Plural noun\> names" browsing section for the content axis itself still gets
built, in the right column below "🔒 Component Set", same mechanism as before.

## Cross-cutting build pitfalls

These apply to building any frame/section in this template, not one specific section:

- **`figma.createAutoLayout()` defaults to a solid white fill.** Clear it explicitly (`fills = []`)
  on every purely-structural wrapper frame — only intentionally-chromed frames (e.g. the header, the
  "Copy me" box, the "🔒 Component Set" panel) should keep a fill. A blanket fill-clear across a
  frame's children can also hit sibling **text** layers that need their own color kept intact (e.g.
  row/column header labels) — clear wrapper frames specifically, not every child indiscriminately.
- **Awaited promises**: text-fill fixes on instance children (e.g. recoloring a label) must be
  `await`ed in a loop, never fire-and-forget (`promise.then(...)` without awaiting it before the
  script returns or before `screenshot()` is called) — it may or may not land in time,
  non-deterministically. Confirmed by observing this fail silently on one build and succeed by luck
  on another with the exact same fire-and-forget pattern.

**Next: [`PHASE-5-REVIEW.md`](PHASE-5-REVIEW.md)** — once the documentation page is built and
iterated on with the user (step 8 above).
