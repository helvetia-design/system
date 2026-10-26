---
name: ds-figma-component
description: Push a Helvetia Design System component from code into the Figma component library — resolving props/variants/states to Figma variant properties bound to existing Figma variables (tokens), reusing existing Figma components for nested children. Use when the user wants to create, add, or push a DS component (or a specific component like ds-spinner) into Figma.
---

# ds-figma-component

Creates a Figma component (one dedicated page per component) from an existing Stencil
component's code. Code is always the source of truth — this skill never invents a hardcoded
value, a new design token, or a Figma-side detail that doesn't trace back to the component's
actual props, states, and resolvable design tokens.

**v1 scope — create-only.** This skill pushes a component into Figma for the first time. It does
not update or reconcile an already-pushed component, and it does not generate Code Connect
mappings (use the separate `figma-code-connect` skill for that, using this skill's output as
reference). See [`code-to-figma.md`](../../../code-to-figma.md) at the repo root for the full
background and rationale behind these decisions.

Load `figma-use` alongside this skill before any `use_figma` call (mandatory per that skill's own
rule). Load `figma-generate-library` for its guidance on binding values to Figma variables and
reusing existing components, since the same discipline applies here.

## Prerequisites

- `figma.config.json` at the repo root must have a real `componentLibraryFileKey` (not the
  `REPLACE_WITH_FIGMA_FILE_KEY` placeholder). If it's still the placeholder, stop and ask the
  user for the file key before doing anything else.
- The target component must already exist in code (`packages/core/src/components/<category>/<name>/`).
- If the component nests another DS component (e.g. a button using an icon), the nested
  component's own `<child>.figma.md` must already exist and record a Figma component key. If it
  doesn't, stop and tell the user to run this skill on the child component first — do not
  recreate the child or fall back to a plain shape.

## Workflow

### Phase 1 — Analyze

1. Read `packages/core/src/components/<category>/<name>/<name>.tsx` and extract every **public
   `@Prop()`** — ignore `@Method`, `@Event`, and private `@State`. Note each prop's type
   (`@OneOf([...])` enum, boolean, string, number) and default.
2. Read the component's `<name>.host.scss` and scan for **pseudo-class states** —
   `:hover`, `:focus`, `:active`, `:disabled`, `:read-only`, and any loading-related
   class/attribute selector. These don't show up as props but still need a Figma
   representation (see Phase 2, rule 3).
   - Also scan for **text-bearing parts with no explicit `color`/`font-size`** (e.g. a
     `::part(label)` that only sets `font-family`/`line-height`, as in `ds-spinner`). Shadow DOM
     inherits `color`/`font-size` from the light-DOM ancestor in real usage, so a component's own
     SCSS not setting them is expected, not a gap — but it means the Figma text node has nothing
     to naturally fall back to either, and will otherwise render with Figma's own stale/leftover
     default styling (observed: black, 12px) instead of anything representative. Note every such
     part in `<name>.figma.md`'s tokens list as bound to this system's default text treatment —
     `🔗 Alias/🔤 Text/Color/Primary` for color, `📱 Device/🔤 Text/Size/Base/Device` for size
     (from the `Design Responsive Tokens` collection, mode-based) — flagged as inherited-context
     bindings, not literal bindings to something the component's own code sets.
3. Identify any **nested DS component** usage (e.g. `<ds-icon>` inside `ds-button`'s render). For
   each one, read its `<child>.figma.md` and pull the recorded Figma component key. If missing,
   stop per Prerequisites above.
4. For every value the component's SCSS binds to a CSS custom property (`var(--ds-...)`),
   resolve it to the matching Figma variable.
   - **The real token variables are LOCAL to the component-library file, not a published
     library.** They're pushed directly into the file by the GitHub workflow
     (`scripts/figma-sync`) as two local variable collections: `Design Tokens` (Alias/Component
     layer values, e.g. `🧩 Component/Spinner/Logo/Size/MD`, modes are brand modes — binding is
     brand-agnostic per the project's token architecture, don't reason about which mode) and
     `Design Responsive Tokens` (Device layer, modes `Mobile`/`Tablet`/`Desktop`).
   - `search_design_system` and `get_variable_defs` only search/read **published libraries** —
     they will not find these local collections, and can return misleading look-alike results
     from unrelated org libraries (e.g. old sandbox files that happen to use similar naming).
     **Do not use them for token resolution.** Any library attached to the file via
     `get_libraries` other than the file's own local variables (`Brand Assets`, `🧩 Components`,
     `Grid`, `Spacing`, `🖋 Typography`, `🎨 Colors`, `TokyTest` as of this writing) is legacy —
     ignore it for token resolution.
   - Resolve via `use_figma` (load `figma-use` first) instead:
     ```js
     const collections = await figma.variables.getLocalVariableCollectionsAsync()
     const designTokens = collections.find(c => c.name === 'Design Tokens')
     const names = []
     for (const id of designTokens.variableIds) {
       const v = await figma.variables.getVariableByIdAsync(id)
       if (v) names.push(v.name)
     }
     return names // then match against the component's --ds-* vars
     ```
     Do the same against the `Design Responsive Tokens` collection for any `--ds-device-*` var.
   - Token → Figma variable name follows this repo's `path.join('/')` convention (mirrors
     `scripts/figma-sync/lib/write.mjs`), e.g. `--ds-spinner-circle-primary-background` →
     `🧩 Component/Spinner/Circle/Primary/Background`. Emoji segment prefixes (`🔗`, `🧩`, `📱`,
     `↔️`, `🔤`, `▭`) are part of the real names — match loosely (strip/ignore emoji) rather than
     requiring an exact character match.
   - **Any value with no matching Figma variable is a hard stop.** Report it immediately — do
     not guess, do not push a hardcoded value, do not invent a new token. Ask the user whether
     to use a different existing token or explicitly accept a one-off hardcoded value for this
     specific case. Resolve this now, before Phase 2, not mid-build in Phase 3.
   - A value with no CSS-var binding at all (e.g. a hardcoded literal in the component's `.tsx`,
     not its SCSS) is outside this step's scan, but if a matching Figma variable happens to
     exist anyway (as found for `spinner.tsx`'s `getColor()` fallback), note it in
     `<name>.figma.md` as informational — bind to it for the Figma visual, and flag the
     code-side drift as a separate follow-up rather than fixing it here.
5. Write all of the above into `<name>.figma.md` (create it if it doesn't exist) as a draft, per
   the schema in [Mapping file format](#mapping-file-format) below.

### Phase 2 — Propose variant grouping

1. Read `CONVENTIONS.md` in this skill's folder for heuristics learned from prior components.
2. Draft how the analyzed props/states collapse into Figma variant properties:
   - An enum prop (`@OneOf([...])`) → one Figma variant property, same name, same options.
   - A plain boolean prop with no state/interaction meaning → one boolean Figma property.
   - A free-text prop (e.g. `label`) → never a variant property; it maps to an instance text
     override. **Check the component's `render()` for a conditional guard around it** (e.g.
     `hasValue(label) && <span>...`) — if the element only renders when the prop is non-empty,
     add a paired boolean component property (`addComponentProperty('Show <name>', 'BOOLEAN',
<code's real default>)`) bound to that layer's `visible` via `componentPropertyReferences`
     on every variant. Don't rely on empty text alone — Figma won't collapse the auto-layout
     gap/width for a present-but-empty text layer the way code's conditional omits the element
     outright. See CONVENTIONS.md.
   - **Every pseudo-class state and state-ish prop** (`:hover`, `:focus`, `:active`,
     `disabled`, `readonly`, `loading`) **collapses into one `state` Figma variant property**
     (`default` / `hover` / `focus` / `active` / `disabled` / `readonly` / `loading`, limited to
     whichever of these the component actually has) — never separate axes, never separate
     booleans.
   - Anything ambiguous (doesn't fit the rules above cleanly) is flagged explicitly rather than
     guessed.
3. Write the proposed grouping into `<name>.figma.md` and present it to the user for review.
4. **Stop and wait for the user to confirm or edit** the mapping directly in the file before
   proceeding to Phase 3. Do not proceed on an assumed approval.
5. Once confirmed, propose any new heuristic worth keeping (e.g. a grouping decision that didn't
   fit an existing `CONVENTIONS.md` rule) as an addition to `CONVENTIONS.md`. Show the user the
   exact diff and get approval before writing it — never auto-append.

### Phase 3 — Build incrementally

1. Load `figma-use` (mandatory before any `use_figma` call) and create a session against
   `figma.config.json`'s `componentLibraryFileKey`.
2. Create (or reuse, if already present) a dedicated **Figma page** named after the component.
3. Build **one full variant combination first** — pick the default/base combination (every
   variant property at its default value, state at `default`). Wire up:
   - The component's shape/layout.
   - Every styled value bound to its resolved Figma variable from Phase 1 (never a literal).
   - Every nested component as an **instance of the existing Figma component** resolved in
     Phase 1, step 3 — never redrawn from scratch.
4. Take a screenshot of this first combination (`get_screenshot`) and show it to the user as a
   checkpoint before continuing. This catches a structural mistake (wrong variable bound, wrong
   nested instance) once, before it's replicated across the full variant matrix.
   - **Line-height variables cannot be true-bound — API limitation, not a missing token.** This
     repo's line-height tokens are percent-semantic FLOAT values (e.g. `150` meaning 150%, per
     `LINE_HEIGHT_PERCENT_MULTIPLIER` in `apps/toky/src/tokens/figma-map.ts`). Confirmed by
     testing: binding a FLOAT variable to a text node's `lineHeight` via `setBoundVariable` /
     `setRangeBoundVariable` **always** applies it as `PIXELS`, regardless of what unit was set
     on the node immediately before the bind call — there is no way to bind a percent-semantic
     FLOAT token to `lineHeight` through the Plugin API. Workaround: resolve the variable's
     numeric value yourself (walk its `VARIABLE_ALIAS` chain via `getVariableByIdAsync` until you
     hit a literal number), then set `node.lineHeight = { unit: 'PERCENT', value: resolvedValue }`
     as a **literal, unbound** value — do not call `setBoundVariable`/`setRangeBoundVariable` for
     `lineHeight` on a percent-semantic token. Record this in `<name>.figma.md`'s tokens list as
     an exception (resolved but intentionally unbound, with the reason), not as a hard stop —
     the token exists and its correct value is applied, it's just not a live binding.
   - **Binding `fontFamily`/`lineHeight` on an empty text node doesn't survive setting
     `characters` afterward** — text styling is per character-range, so writing new characters
     resets any binding applied while the node was empty. Set `characters` (and load whatever
     font that content needs) **before** calling `setRangeBoundVariable` for text properties, not
     after.
   - **Font-loading gotcha:** binding `fontFamily` to an Alias text-family variable (e.g.
     resolving to `Baloise Create Text`) changes the node's effective font. Any further text
     property write on that node then requires that exact font to be loaded first
     (`figma.loadFontAsync`), even if a different font (e.g. Inter) was loaded earlier in the
     same script — load the _resolved_ font family, not just a default.
5. On confirmation, fan out: build the remaining variant/state combinations as a Figma component
   set, reusing the same bindings and nested instances.
6. Write the resulting Figma component key/node-id back into `<name>.figma.md`.

### Phase 3b — Documentation presentation (standard, build every time)

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

**A component with only one crossed variant property** (e.g. `ds-icon`'s 79-option `name`, with
every other prop an instance-override) **has no second axis for a "Main components" table.** In
that case, "Main components" becomes the exhaustive reference grid of all real master variants
(same centering/grid-line technique, just one axis instead of two) instead of a true table. Pick
whichever remaining prop best fits the compact "Variants" section (for `ds-icon`, `size`).

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
   "generated from the real component, don't edit cells directly."

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

### Phase 4 — Review against visual regression screenshots

0. **For any animated (Lottie/CSS keyframe) or composite reused-vector mark, verify its real
   on-screen size before trusting the screenshot comparison, not just static analysis.** A size
   token binds the host container, not necessarily the visible artwork inside it — don't assume
   they're the same. If the dev server (`pnpm --filter core start`) is running or can be started,
   use Playwright (`browser_navigate` to the component's `*.visual.html`, `browser_evaluate` with
   `getBoundingClientRect()` on the actual visible path/shape elements, not the SVG element's own
   box) to measure the real glyph-to-container ratio, and compare it against what was built. See
   CONVENTIONS.md for the `ds-spinner` example (measured 86.3%, not the 100% initially assumed).
   Stop the dev server again when done if this skill started it.
1. For each built variant/state, capture a Figma screenshot (`get_screenshot`) and find the
   matching Playwright baseline under
   `packages/core/src/components/<category>/<name>/test/*.visual.play.ts-snapshots/*.png`.
2. Compare the two **visually, as the agent** — do not pixel-diff; Figma and browser rendering
   differ enough (anti-aliasing, font rasterization) to produce constant false mismatches on a
   pixel comparison.
3. Flag anything that looks substantively wrong (wrong color/token bound, missing or wrong
   nested icon, wrong size/spacing, wrong state rendering) as a finding — but this is advisory
   only. Never auto-pass or auto-fail. Report findings and let the user make the final call.
4. **Before reporting a suspected color/rendering mismatch from a screenshot, confirm it against
   live `getComputedStyle` in a browser, not just a visual read of a small/compressed PNG.** A
   79px-tall multi-row baseline image once made an inverted icon row _look_ like it had color
   variation it didn't actually have — two rows' content visually bled together at that
   resolution. Crop/zoom the image or measure the DOM directly before treating a visual
   impression as a finding.
5. **A prop's JSDoc comment can itself be wrong or incomplete — don't just transcribe a claimed
   behavior from Phase 1 into the final record without checking it against the real
   computed/rendered output.** `ds-icon`'s `turn` was documented as "rotated 180deg" but the
   real CSS only rotates 3 specific icon names, one of them by 225deg, not 180 — caught by
   comparing the real `turn` visual-regression baseline, confirmed via `getComputedStyle` matrix
   inspection. When Phase 4 reveals the _component's own code doc_ was wrong (not just the Figma
   mapping or `<name>.figma.md`'s draft notes), fix the code doc too, in the same pass — code is
   the source of truth for documentation copy (Phase 3b's lead-paragraph rule), so a
   known-wrong comment shouldn't survive a run that just disproved it.

## Mapping file format

`<name>.figma.md` lives at `packages/core/src/components/<category>/<name>/<name>.figma.md`,
co-located with the component's other files. It's both the input spec you confirm in Phases 1–2
and the output record Phase 3 writes back into.

```markdown
# <name> → Figma mapping

\`\`\`yaml
figmaComponentKey: null # filled in by Phase 3 on success
figmaPage: <Name>
props:

- name: size
  type: enum
  options: [sm, base]
  figmaProperty: size
  figmaPropertyType: variant
- name: label
  type: string
  figmaProperty: null
  figmaPropertyType: instance-text-override
  states:
  figmaProperty: state
  options: [default, hover, focus, active, disabled]
  sources:
  hover: ":hover (spinner.host.scss)"
  disabled: "disabled prop"
  nested:
- childTag: ds-icon
  childMappingFile: ../icon/icon.figma.md
  figmaComponentKey: <resolved from icon.figma.md>
  tokens:
- cssVar: --ds-alias-background-color-sky
  figmaVariable: Alias/Background Color/Sky
  resolved: true
- cssVar: --ds-spinner-color-one-off
  figmaVariable: null
  resolved: false
  resolution: "<decision made with the user — pick a token or accept hardcoded>"
  \`\`\`

Notes on this mapping, open questions, and rationale for any non-obvious grouping decision go
here as prose, below the YAML block.
```

## Notes

- This skill never commits — leave `<name>.figma.md`, `figma.config.json`, and
  `CONVENTIONS.md` changes unstaged for the user to review, same as every other skill in this
  repo.
- First real run target: `ds-spinner` (`packages/core/src/components/indicators/spinner/`).
- A hard stop (missing token, missing nested child mapping) is not a failure to work around —
  surface it and wait for the user's decision.

## See Also

- [`code-to-figma.md`](../../../code-to-figma.md) — the full plan and the reasoning behind every
  scope decision in this skill.
- [`CONVENTIONS.md`](CONVENTIONS.md) — accumulated mapping heuristics across components.
- [`packages/tokens/CONTEXT.md`](../../../packages/tokens/CONTEXT.md) — token layers and naming.
- [`packages/core/CONTEXT.md`](../../../packages/core/CONTEXT.md) — component categories and
  structure.
