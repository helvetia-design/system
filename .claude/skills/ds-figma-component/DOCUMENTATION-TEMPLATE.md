# Phase 3b documentation template — full spec

This is the complete spec for the per-component documentation page built in Phase 3b of
`SKILL.md`. It's a fixed template, not a per-component judgment call — deviating from it is
wrong. Adapt _content_ to the component's own props, never the _structure_.

## Canonical live reference — inspect before you build

**Don't rebuild this structure from the prose below alone.** The `ds-spinner` page in the
component-library file (`figma.config.json`'s `componentLibraryFileKey`) is the canonical,
known-correct implementation of this template as of its last fix — use it as the literal
structural reference, the same way you'd copy a working component instead of re-deriving one
from a spec:

- Light frame: `"Spinner Documentation"`, node `1890:58`
- Dark frame: `"Inverted Spinner Documentation"`, node `1932:11`

Before building a new component's Phase 3b page, run a read-only `get_metadata` (or a `use_figma`
traversal) against these node IDs to see the real current hierarchy, frame names, auto-layout
settings, and alignment properties — then mirror that structure for the new component, rather
than reconstructing positions/alignment from this document's words each time. This document
exists to capture the pitfalls and reasoning that led to the current structure, not to replace
inspecting it directly. If you change the template's structure during a future run (e.g. fixing a
bug the way the cell-label centering fix below was applied), update this reference pointer if the
canonical node IDs change, and consider whether the fix should be back-ported to `ds-icon`/
`ds-badge`'s existing pages too.

**Learned pitfall — cell-label text defaults to top-left in Figma, not centered.** A `TEXT` child
of an auto-layout frame (e.g. a `col-header-base`/`col-header-sm`/`row-label` cell in the "Main
components" table) does **not** center itself just because the cell frame has a fixed width/height
— it inherits `textAlignHorizontal: 'LEFT'` and sits at the frame's top-left unless the frame's
own `primaryAxisAlignItems`/`counterAxisAlignItems` are explicitly set to `'CENTER'` (and,
for multi-line safety, the text node's own `textAlignHorizontal` set to `'CENTER'` too). This
silently shipped off-center ("Base"/"SM"/"Logo"/"Circle" sitting top-left in their cells) on both
`ds-spinner` frames until caught visually. When building any labeled grid cell in this template,
set both the frame's axis-alignment and the text's own alignment explicitly — never rely on the
default. (From: `ds-spinner`'s Main components table, user-reported.)

**`ds-icon` and `ds-badge`'s existing Inverted pages still use the old full-dark-frame theming and
have not been migrated to the minimal theming rule below** (dark frame fill, dark headings/
dividers, dark Variants sidebar). When either is next touched, re-theme its dark frame to match
`ds-spinner`'s current (minimal) treatment rather than treating the old styling as still correct.

---

The raw component set (Phase 3) is not the deliverable on its own — every component also gets a
readable documentation layout on its Figma page, built from instances of the finished component
set. Build this after Phase 3 confirms the variant matrix looks right, before Phase 4's review.

**This is a fixed template, not a per-component judgment call.** As of `ds-badge`, this template
follows the TapTap Design System's Figma community file structure (reference provided by the
user: TapTap Design System, `Button–Primary` page) — this **replaces** the earlier
row/card/column layout used for `ds-spinner`/`ds-icon`'s first pass. Deviating from it is wrong —
adapt _content_ to the component's own props, never the _structure_. `ds-spinner` and `ds-icon`
have both been rebuilt to match (see their `.figma.md` files' "Rebuild — TapTap Design System
layout" sections) — this template now applies to every component on this Figma file.

**An open-ended content-selection prop with many options** (e.g. `ds-icon`'s 79-option `name`)
**is never a crossed variant property at all — split it into N separate top-level components**,
one per option, named `<Component>/<option>` (same Instance Swap pattern as an `inverted` axis —
see the rule above). "Main components" then becomes the exhaustive reference grid of all N real
standalone components, each shown at its own default variant state if it has any (see next
point) — same centering/grid-line technique as a true table, just resolving components by
page-level name lookup instead of `set.children`, since there's no single shared
`COMPONENT_SET` to query across all N.

**Within each of those N top-level entities, any remaining same-layers prop (size/color/etc.)
is still a real crossed variant property — this is a hard rule, not a simplification
opportunity, however large the resulting cross-product gets.** Each `<Component>/<option>`
becomes its own `COMPONENT_SET` (not a plain `COMPONENT`) with every such prop crossed inside
it. For `ds-icon`: `name` → 79 top-level components, and _within_ each one, `size` × `color` →
30 crossed variants (2,370 components total). Do not default to instance-overrides for "size/
color/etc." just because the combined total looks large — ask first if genuinely unsure whether
a prop qualifies, but once it passes the "same layers, different token" test, build the real
variant structure. To build N top-level component sets at this scale: for each entity, clone its
base node once per variant combination (reuse the real original node for exactly one combo, to
avoid orphaning it), resize/recolor/rebind each per its combination, name each
`key1=value1, key2=value2`, then `figma.combineAsVariants()` per entity. **Iteration order
determines the default variant** — `combineAsVariants` has no settable `defaultVariant`
(confirmed read-only); order each axis so the real code default comes first, not alphabetically.
Batch several entities per `use_figma` call (batch size scales with how cheap each variant's
setup is — simple resize/recolor supports larger batches than anything requiring font loads or
nested property wiring).

**"Main components"'s exhaustive reference grid**, for a component that is itself split into N
top-level entities each with internal crossed variants, shows each entity at its **default**
variant combination only — the grid stays about "which content/name," not every size/color
combination (that's what the dedicated "Sizes & Colors"-style section below is for).

**If a component (or each of its N split top-level entities) has multiple same-layers props
that deserve an exhaustive per-option-combination reference beyond the compact "Variants"
sample, add a dedicated section after "Main components"** — don't try to cram a full
cross-product into "Variants" itself, which stays a compact single-axis sample. For `ds-icon`'s
`size` × `color`
(5 × 6 = 30 combinations, across all 79 icons = 869 total swatches), this became a
"📐 Sizes & Colors" table: one row per icon (or per top-level component, if the prop being
exhausted sits above a top-level-component split), one column group per instance-override axis.
Every swatch is an `instance` of that row's real component, never the master — size via
`instance.resize(px, px)`, color via finding the inner fill-bearing node (often a single
`VECTOR` child for a simple icon-like component) and rebinding its fill. For a build this large,
split into batches (e.g. ~10 rows per `use_figma` call) rather than one script, and build the
table chrome (headers, row labels, empty cells) in a separate pass _before_ filling instances —
makes the grid skeleton easy to verify before committing to filling hundreds of cells.

**Page background**: set the Figma page's own `backgrounds` to a literal solid `#e8e8e8`
(`page.backgrounds = [{ type: 'SOLID', color: { r: 232/255, g: 232/255, b: 232/255 } }]`) — not
a design token, no page-background token exists in this system.

**One bordered outer frame**, white fill, **2px** `Alias/Border/Color/GreyLight` stroke, 8px
corner radius, ~40px padding, vertical auto-layout. No label above the frame (an earlier draft
of this template had one; removed on request — don't add it back).

**Every border/divider/grid-line in this template is 2px, always** — not 1px (an earlier draft
used 1px throughout; corrected on request across all three existing pages). This applies to: the
outer frame's own stroke, every divider rule between sections, the Variants panel's border, the
Main components table's border, and every internal grid-line rectangle. When building a divider
or grid line as a rectangle, give it a 2px dimension on its thickness axis
(`resize(width, 2)` for a horizontal divider, `resize(2, height)` for a vertical grid line); when
it's a frame stroke, set `strokeWeight: 2`.

Inside the frame, four sections in order, each separated by a 2px `Alias/Border/Color/GreyLight`
divider rule:

1. **Header**:
   - A top bar: small grey **breadcrumb** kicker (left) reading `⏳ Core / <Category> /
<Component>` (e.g. `⏳ Core / Indicator / Badge`, `⏳ Core / Media / Icon`) — set on **both**
     the Figma page's own name and the in-page `kicker` text node, identically. The `⏳`
     (hourglass) marks the page as AI-generated/changed and pending human review; a human
     manually swaps it to `✅` once reviewed and approved. **This skill must never set it to
     `✅`** — every build or edit this skill makes should (re-)set it to `⏳`, never claim
     approval on a human's behalf.
   - On the right of that same top bar, a
     `wordmark` text node reading `v<core package version> - <DD.MM.YYYY>` (e.g.
     `v0.0.6 - 26.10.2026`) — **not** "Helvetia Design System" text (an earlier draft used that;
     replaced on request). Version from `packages/core/package.json`'s `version` field at build
     time, date from the actual current date — records which core package version the Figma push
     was generated from. `Alias/Text/Size/XS`, `Alias/Text/Color/Grey`, same as the kicker.
   - Title: the component name, bold, `Component/Heading/Level/Display1/FontSize` (48px — not
     `Alias/Text/Size/4XL`/32px, which was a mismatch caught across all three existing pages),
     `Alias/Text/Color/Primary`.
   - Lead paragraph: sourced **verbatim from the component's own JSDoc comment** in its `.tsx`
     file — code is the source of truth for documentation copy, never write new descriptive
     copy. Color `Alias/Text/Color/Primary` (not `Grey` — an earlier draft used Grey, corrected
     on request across all three existing pages).
   - A "View in Storybook ↗" link, `Alias/Text/Size/XS`, literal link-blue
     (`{r: 0, g: 94/255, b: 1}` — no "link color" alias token exists in this system today), with
     a **real Figma hyperlink** via `textNode.setRangeHyperlink(0, length, {type: 'URL', value:
url})`. Find the real Storybook story ID from the component's own
     `apps/storybook/src/components/<category>/<name>/<name>.doc-config.ts` (the `Overview` tab's
     `storyId`) — never guess a path from scratch, and don't rely on an older sibling
     component's URL pattern (confirmed these are NOT derivable by a fixed category/name
     formula — `ds-spinner` and `ds-icon`'s URL shapes differ from each other).
     Each of the three section headings below ("👉 Copy me", "🛠 Variants", "🔒 Main components") is
     bold, `Component/Heading/Level/1/FontSize` (28px — not `Alias/Text/Size/SM`, which was a
     mismatch caught and fixed across `ds-spinner`/`ds-icon`), `Alias/Text/Color/Primary`.

2. **"👉 Copy me"**: one real, representative **instance** (the default/base combination) in a
   centered box with a soft shaded background (`{0.976, 0.976, 0.976}`, no border) — the single
   "drag this into your design" example.
3. **"🛠 Variants"**: a compact, single-axis reference — not a full cross-product. Pick the one
   variant property that most defines the component's _scale/shape_ (e.g. `size`). Left side: a
   shaded sidebar with a bold axis-name label (e.g. "Size") and the option names as stacked
   pill/tag chips. Right side: one representative instance per option, side by side, in a
   bordered white panel.
4. **"🔒 Main components"**: the exhaustive, full cross-product reference — every remaining
   variant property crossed together — as a single dense bordered table (shaded header row for
   one axis' options across the top, shaded header column for the other axis' options down the
   left, one instance per cell). This is the _locked, source-of-truth_ grid — the 🔒 emoji signals
   "generated from the real component, don't edit cells directly." **Every header/row-label cell
   (`col-header-*`, `row-label`) must have both axis-alignment properties set to `'CENTER'` on the
   cell frame and `textAlignHorizontal: 'CENTER'` on its text child** — see the canonical-reference
   pitfall above; this does not happen by default.

**A component with a true `inverted`/dark-context variant property crossed into the Main
components grid gets two entirely separate top-level frames side by side on the page** — one
light-themed ("<Component>"), one fully dark-themed ("Inverted <Component>") — not a single
frame with a two-table split (an earlier draft tried that for `ds-spinner`; replaced on
request). Build the light frame first as the normal template, then `outer.clone()` it as the
base for the dark frame (keeps both structurally identical), remove the non-matching
Normal/Inverted half of the Main components table from each, and re-theme the clone: frame fill
→ `🌐 Global/🌈 Color/Primary/5` (a real token — not `Alias/Text/Color/Primary` reused
presentationally, which an earlier draft used before being corrected on request; also confirm
the exact Global step number with the user rather than guessing — `5` vs `6` is a real
difference and both exist as separate tokens), title/lead/headings/dividers → white,
kicker/wordmark → a dimmer literal light grey (`{0.8, 0.8, 0.85}`), and the "View in Storybook ↗"
link → white with a 2px underline (`setRangeTextDecoration(..., 'UNDERLINE')` +
`setRangeTextDecorationThickness(..., {value: 2, unit: 'PIXELS'})` — the Normal frame's link
stays the default literal link-blue, no underline).

**The "Copy me" box and "Variants" panel inside the dark frame must use real `inverted=true`
instances** (`instance.swapComponent(...)` from the default `inverted=false` variant to the
matching `inverted=true` one — preserves existing overrides like a "Show X" boolean or
placeholder text, no need to reapply them) — an earlier draft left them on the normal variant,
which is wrong: a dark-themed documentation frame exists specifically to demonstrate the
inverted appearance. Once swapped, **the box/panel fill must also go dark**
(`🌐 Global/🌈 Color/Primary/6`, one step darker than the frame's own background for subtle
definition) — leaving them light makes the now-white inverted glyph/text nearly invisible. This
also surfaces a real bug to check for: **does the master component's own `inverted=true`
variant actually have every text element recolored for dark-context contrast?** On `ds-spinner`,
the `Label` text inside every `inverted=true` variant was still the normal navy color — never
fixed at the component level, only ever patched via one-off instance overrides in an earlier,
now-superseded documentation layout, so the real defect went unnoticed until something finally
used the true master variant directly. Fix any such gap **in the master component**, not with
another per-instance override — it must propagate to every real use of that variant, not just
the documentation page.

Position the clone to the right of the original (`x: outer.x + outer.width + 40`). Always
re-run the real master overlay alignment against both tables' new positions afterward —
cloning/restructuring shifts both.

**SUPERSEDED — minimal dark-frame theming (confirmed on `ds-spinner`, applies to every future
component).** Re-theming the _entire_ dark frame (frame fill, headings, dividers, kicker/wordmark,
hyperlink underline, panel/sidebar backgrounds) was wrong — it was over-theming for no benefit and
created a real legibility trap (white icon/text rendering invisible once a whole panel went dark).
**The dark/"Inverted" frame keeps every piece of chrome identical to the light frame**: frame fill
white, title/lead/headings/dividers/kicker/wordmark/link same tokens and colors as the light
frame (no underline, no dimmed grey, no recolor), Variants sidebar + chip backgrounds/text
unchanged, Main components header row/column + corner cell + grid lines unchanged (same light
grey/white/grey-text as the light frame — don't theme them dark, and don't forget they still need
the centering fix from the canonical-reference pitfall above). **The only thing that changes is
giving a dark background to every "preview" surface** — any container whose sole content is a
real component instance, i.e. "the area where we present a component/instance/variant": the
"Copy me" box, each swatch in the Variants panel (`example-right`/`example-bottom`), and each
data cell in the Main components table (`cell-<row>-<col>`, never the header/corner cells). This
is a minimal, surgical change, not a parallel dark theme.

Bind that dark preview fill to the same token used file-wide for this purpose (`🌐 Global/🌈
Color/Primary/5` as of `ds-spinner` — no longer `/6`, since nothing is "one step darker than the
frame bg" anymore; it's one fixed token applied directly regardless of surrounding chrome).
**Known gotcha**: re-deriving the binding per node via `setBoundVariableForPaint` against this
variable rendered solid black instead of navy on some (but not all) nodes in `ds-spinner`'s own
run — cause unconfirmed, possibly a mode-resolution quirk tied to nesting depth. The reliable
fix: build the "Copy me" box's fill first (that one resolved correctly), then **deep-clone its
actual working paint object** (`JSON.parse(JSON.stringify(copyMeBox.fills[0]))` — preserves the
`boundVariables` reference) and assign that literal cloned paint to every other preview surface,
rather than re-deriving the binding independently per node.

The existing rule that the "Copy me" box and Variants panel swatches inside the dark frame must
use real `inverted=true` instances (via `instance.swapComponent(...)`) is unaffected by this
simplification and still applies — only the surrounding theming changed, not which variant is
shown.

**Supersedes the above for the master component's own structure**: `inverted` must **not** be a
Figma variant property on one shared component set at all. Per user direction (referencing the
TapTap Design System's Button, where Primary/Ghost/Link/Outline are separate top-level
components swapped via Figma's native Instance Swap, not one set with a "style" variant), split
any component with a true `inverted`/dark-context axis into **two separate top-level component
sets**. This is the same decision as Phase 2's general variant-vs-instance-swap test applied to a
specific axis — `inverted` changes which layers/structure render (light vs. dark treatment, not
just a token on identical layers), so it gets the top-level split like any other structural axis
(button `color`/`type`, icon `name`), not a crossed variant property. Name the two sets
`<Component>/Primary` and `<Component>/Inverted` (the `/` is Figma's own
convention for grouping entries under one category in the Assets panel and the Instance Swap
picker — confirmed against the TapTap reference). Everything else about the two-frame
documentation layout above still applies (light frame sources from `<Component>/Primary`, dark
frame from `<Component>/Inverted`) — only the underlying master component's property model
changes. To split an existing single set: group its variant children by `inverted` value, strip
`inverted=...` from each child's name, `figma.combineAsVariants()` each group separately, then
**immediately check for the round-trip naming bug** (see CONVENTIONS.md) — rename children back
to `key=value` format if `variantProperties` comes back `null`. Swap every documentation
instance (`instance.swapComponent(...)`) to the correct new set, and realign the Main components
overlay in both frames against their respective new set's children.

**Every cell/example everywhere in this layout is a Figma `INSTANCE`**
(`variant.createInstance()`) of the finished component-set variant — never the variant node
itself. If the component has any boolean "Show X" property (per Phase 2's conditional-render
rule), override it to `true` on documentation instances for readability, while the component
set's own default stays whatever matches code. Fixing the main component later automatically
propagates to every documentation instance; editing documentation instances directly does not.

**The real master component set is never shown as a visible section of the documentation.** It
must still exist (Phase 3's output), fully intact with all variant properties and component
properties, but parked off-canvas (e.g. `y: -3000` on the same page) so it never visually
overlaps or duplicates the documentation layout above. Confirm this explicitly if the first
build accidentally leaves the master set at a colliding position (e.g. `x:0, y:0` overlapping
the header) — checked via a page-level screenshot, not just the header's own node screenshot
(which won't reveal an overlap from a sibling node).

**Lock every real master variant placed in a Main components grid** (`node.locked = true`)
once its overlay alignment is confirmed correct — prevents a human from accidentally dragging
it out of alignment in the Figma UI. Locking doesn't block this skill's own scripted
repositioning, only UI selection/dragging — if a later layout change requires realigning a
locked overlay (per the "shifted table" rule below), unlock, reposition, then re-lock.

**Critical pitfall — never move a variant out of its `COMPONENT_SET`.** A `COMPONENT` that is a
variant can only be a direct child of its own `COMPONENT_SET` — moving it into any other frame
(e.g. trying to place the "real" variant directly into a documentation table cell) silently
dissolves the set once it's emptied (Figma auto-removes an empty `COMPONENT_SET`), stripping the
variant-property grouping from every remaining child. Nothing is actually deleted (existing
instances keep resolving correctly, property definitions survive on each now-standalone
component with new IDs) but the set's `color`/`size`-style variant axes are gone until manually
restored: recombine via `figma.combineAsVariants()`, then **manually rename each child back to
`key=value, key2=value2` format** — the round-trip can leave children as bare `Name/x/y`-style
names with no parsed variant properties, which silently produces empty-string property keys
(`"=default, =base"`) if left as-is. Always use `variant.createInstance()` for placement anywhere
outside the set, never the variant node directly, even when the explicit goal is "show the real
component."

**Known pitfall — `figma.createAutoLayout()` defaults to a solid white fill.** Clear it
explicitly (`fills = []`) on every purely-structural wrapper frame — only intentionally-chromed
frames (e.g. the "Main components" table, the "Copy me" box) should keep a fill. A blanket
fill-clear across a frame's children can also hit sibling **text** layers that need their own
color kept intact (e.g. row/column header labels) — clear wrapper frames specifically, not every
child indiscriminately.

**Known pitfall — awaited promises**: text-fill fixes on instance children (e.g. recoloring a
label) must be `await`ed in a loop, never fire-and-forget (`promise.then(...)` without awaiting
it before the script returns or before `screenshot()` is called) — it may or may not land in
time, non-deterministically. Confirmed by observing this fail silently on one build and succeed
by luck on another with the exact same fire-and-forget pattern.

Iterate on the layout with the user before considering this phase done — the exact structure is
something to confirm visually (screenshot checkpoints), same as the variant matrix itself in
Phase 3.
