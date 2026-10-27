# icon → Figma mapping

```yaml
figmaComponentKey:
  '2029:8391' # SUPERSEDED AGAIN — single "Icon" wrapper COMPONENT_SET (size x
  # color, 30 variants), each variant containing a nested instance bound to an INSTANCE_SWAP
  # component property "Icon#2029:0" for picking which of the 79 glyphs to show. See the
  # "Major rebuild — single wrapper + Instance Swap glyph library" section below. This replaces
  # BOTH earlier structures (the original single 79-variant set, AND the 79-top-level-sets-of-30
  # hard-rule structure) — third and current architecture for this component.
figmaGlyphLibrary:
  Icon/<name> # 79 standalone, single-vector COMPONENTs (not sets), parked
  # off-canvas, used only as Instance Swap targets for the wrapper's "Icon" property — see below.
figmaPage: Icon
figmaCollection: Design Tokens

props:
  - name: name
    type: string (open icon registry, not a closed enum in code)
    figmaProperty: 'Icon#2029:0'
    figmaPropertyType: instance-swap-property
    figmaOptions: [all 79 icons in packages/assets/src/icons/svg, see list below]
    note: >
      SUPERSEDED TWICE. (1) Originally the sole crossed Figma variant property on one shared
      79-member component set. (2) Per user request (TapTap Instance Swap pattern), split into
      79 separate top-level components, each itself a 30-variant COMPONENT_SET (size x color) —
      2,370 components total, unmaintainable. (3) CURRENT: collapsed back to a single wrapper
      COMPONENT_SET (`figmaComponentKey` above) with `name` now an `INSTANCE_SWAP` component
      property on that one set, pointing at a lightweight library of 79 single-vector
      `Icon/<name>` components (not sets). The wrapper's `size`/`color` variants control a
      nested instance of the chosen glyph; swapping the glyph preserves the wrapper's
      resize/recolor overrides (Figma's standard override-preservation-on-swap behavior,
      confirmed working via direct testing). See the "Major rebuild" section below for the full
      rationale, implementation, and a real edge-case bug found and fixed along the way.

  - name: svg
    type: string
    figmaProperty: null
    figmaPropertyType: excluded
    note: 'Raw SVG passthrough — same content concept as `name`, not separately mapped.'

  - name: src
    type: string
    figmaProperty: null
    figmaPropertyType: excluded
    note: 'Fetched SVG passthrough — same content concept as `name`, not separately mapped.'

  - name: size
    type: enum
    options: [sm, base, md, lg, xl] # code default (unset) = implicit "base", same pattern as spinner
    figmaProperty: size
    figmaPropertyType: variant
    note: >
      Still a real crossed variant property — unaffected in kind by the wrapper rebuild, just
      relocated from 79 duplicated copies (one per icon's own set) down to a single shared
      definition on the one "Icon" wrapper set.

  - name: color
    type: enum
    options:
      [primary, info, grey, success, danger, warning] # 'info' appears twice in code's
      # ICON_COLORS array (icon.interfaces.ts:1) — code bug, deduped here, not fixed in code.
    figmaProperty: color
    figmaPropertyType: variant
    note: >
      Still a real crossed variant property — same note as `size` above, now a single shared
      definition instead of 79 duplicates.

  - name: inline
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: instance-override
    note: 'Display-mode flag, not a visual difference worth a Figma variant for 79x icons.'

  - name: inverted
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: instance-override
    note: "Same treatment as ds-spinner's inverted — a usage context, not crossed per-icon."

  - name: turn
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: instance-override
    note: >
      CORRECTED in Phase 4 — this is NOT a uniform 180deg rotation. icon.host.scss only defines
      a transform for 3 specific icon names: `.turn-plus { rotate(225deg) }` (turns a "+" into
      an "×", confirmed via computed style: matrix matches rotate(225deg) exactly, not 180) and
      `.turn-caret-down`/`.turn-caret-up { rotate(180deg) }`. For every other icon name, `turn`
      has NO visual effect at all — no CSS rule targets it. Originally documented (Phase 1) as a
      generic 180deg rotation, which was wrong; caught by comparing the real
      icon-turn visual-regression baseline, where `plus` + `turn` renders as an "×" rather than
      a rotated "+". Not represented in the Figma documentation layout either way (doesn't fit
      the row/card/column template), but the analysis note itself needed fixing for accuracy.

  - name: shadow
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: instance-override

states:
  figmaProperty: null
  options: [default, disabled, invalid]
  sources:
    disabled: 'disabled prop -> --ds-icon-color-disabled'
    invalid: 'invalid prop -> --ds-icon-color-danger (reuses the danger color, no separate
      invalid token in code)'
  figmaPropertyType: instance-override
  note: 'Same reasoning as size/color — not crossed against all 79 icons as a Figma variant.'

nested: []

anomaly:
  - the `.is-tile` block in icon.host.scss (tile background, radius, responsive size via
    --icon-tile-* custom properties) has NO corresponding prop in icon.tsx's render() class
    object — currently unreachable through any public API. Not mapped; flagged as dead/orphaned
    CSS for a separate code cleanup, not something this skill builds a path to.

tokens:
  - cssVar: --ds-icon-size-base (implicit default)
    figmaVariable: 🧩 Component/Icon/Size/Base
    resolved: true
  - cssVar: --ds-icon-color-primary (implicit default)
    figmaVariable: 🧩 Component/Icon/Color/Primary
    resolved: true
  - cssVar: --ds-icon-size-sm/md/lg/xl
    figmaVariable: 🧩 Component/Icon/Size/SM|MD|LG|XL
    resolved: true
  - cssVar: --ds-icon-color-info/grey/success/danger/warning
    figmaVariable: 🧩 Component/Icon/Color/Info|Grey|Success|Danger|Warning
    resolved: true
  - cssVar: --ds-icon-color-disabled
    figmaVariable: 🧩 Component/Icon/Color/Disabled
    resolved: true
  - cssVar: --ds-icon-color-inverted
    figmaVariable: 🧩 Component/Icon/Color/Inverted
    resolved: true
  - cssVar: --icon-tile-* (tile block)
    figmaVariable: n/a
    resolved: n/a
    resolution: 'Not mapped — see anomaly above, no reachable prop drives this CSS.'
```

## Icon inventory (79, from packages/assets/src/icons/svg/)

alert-triangle, alert, answer, arrow-right-circle, arrows-round-left, audio, back, bell, call,
caret-down, caret-left, caret-right, caret-up, check-circle, check, circle, clock, close-circle,
close, code, consultant, copy, dashboard, date, design, document, download, edit, eye-closed,
eye, facebook, file, filter, github, help-customer-support, home, info-circle, information,
instagram, link, linkedin, locate, location-target, location, logout, map, menu-bars,
menu-dots, message, minus, mobile, pdf, picture, pinterest, plus, print, refresh, search, send,
settings, share-link, share, star-full, star-half, table-cell-merge, tag, tiktok, trash,
triangle, upload, user-add, user-check, user, video, web, whats-app, x, xing, youtube

## Why size/color/state/inverted/turn aren't crossed into the variant matrix

Figma component-set variants are a true cross-product — every combination of variant properties
is a separate physical component. Crossing 79 icon names against `size`(5) × `color`(6) ×
`state`(3) × `inverted`(2) × `turn`(2) would be tens of thousands of physical components,
unbuildable and unmaintainable. Real-world large Figma icon libraries (e.g. Material Symbols)
use exactly the structure proposed here: **one variant property for which icon**, with
recolor/resize/rotate left as **instance-level overrides** a consumer applies when placing an
icon instance — still bound to real Figma variables (never hardcoded), just not pre-baked as
separate variant members. This is per explicit user direction for this component.

Each of the 79 variants is built with its vector fill bound to `Component/Icon/Color/Primary`
and sized via `Component/Icon/Size/Base` (the default/implicit state) — a consumer overrides
those bindings per-instance for a different color/size, same mechanism as any bound property.

## Documentation layout (Phase 3b)

Given the structure above, the row/card grouping differs from spinner:

- **Icon grid**: all 79 icons laid out in a grid (not per-variant-axis rows), each cell an
  instance at default size/color — this is the primary "here's every icon" reference.
- **A small set of instance-override examples** (reusing one or two representative icons, not
  all 79) demonstrating `size`, `color`, `state` (disabled/invalid), `inverted`, and `turn` —
  mirrors spinner's card pattern, but scoped to a couple of icons rather than the full set.

## Phase 3 progress — complete

- Component set `1832:7997` ("Icon"), 79 variants, one `icon=<name>` component per SVG in
  `packages/assets/src/icons/svg/`, on the `Icon` page in file `NzMFv5HwO14Mmro8bWyvlO`.
- `svg`/`src` props excluded from the mapping per the confirmed plan — no Figma representation
  needed beyond what `name`'s 79 variant options already cover.
- `size`/`color`/`state`/`inverted`/`turn`/`inline`/`shadow` intentionally left as
  instance-level overrides, not crossed into the variant matrix (see rationale above) — Phase
  3b's documentation layout will demonstrate these on a small representative subset, not all 79.

### Correction: uniform-canvas scaling, not tight-bbox resize

**First build attempt was wrong** — importing each SVG (`figma.createNodeFromSvg`) and resizing
only the inner `VECTOR` node's _tight path bounding box_ to the token size (`Component/Icon/Size/Base`,
16px) caused two bugs, confirmed by direct measurement before fixing:

1. **Aspect-ratio distortion.** A tight path bbox rarely equals the SVG's declared canvas — e.g.
   `check.svg`'s path measured 16×13.66 within its 16×16 viewBox (not centered: ~1.27px top
   offset). Resizing that tight bbox to 16×16 stretched it ~17% taller than designed, and this
   was NOT isolated to a couple of odd icons — all 79 were visibly inconsistent in weight once
   compared side by side (confirmed by the user from a built screenshot).
2. **Lost content on multi-path icons.** `imported.findOne(n => n.type === 'VECTOR')` only grabs
   the _first_ vector; `information.svg` and `xing.svg` (the only 2 of 79 with >1 `<path>`)
   silently lost a path when the rest of the imported frame was discarded.

**Fix, applied to all 79 (full rebuild, old set `1825:7997` deleted):**

```js
const imported = figma.createNodeFromSvg(svg)
const scale = targetSize / imported.width // uniform scale of the whole canvas
imported.rescale(scale) // preserves every child's relative position/size
const vectors = imported.findAll(n => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION')
for (const v of vectors) v.fills = [/* bound to Component/Icon/Color/Primary */]
// move ALL imported.children (not just one) into the component, bind width/height to the token
```

`rescale()` on the whole frame (not `resize()` on one inner vector) is what preserves native
proportions — same as how a `<svg>` element's `viewBox` scaling works in the browser. Verified:
both `icon=xing` (2 children post-fix) and `icon=information` render completely and correctly,
and the full 79-icon grid reads as visually consistent on a side-by-side screenshot.

**Learning this generalizes beyond icon**: for any future component that imports external
vector art via `createNodeFromSvg` (nested components, brand assets, etc.), always `rescale()`
the whole imported frame to the target token size — never resize an inner node's tight content
bbox. Captured in `CONVENTIONS.md`.

## Phase 3b — Documentation layout (complete, revised to the fixed template)

**Revision note**: the first pass (ad-hoc Size/Color/State/Inverted/Turn cards) was replaced —
the row/card/column structure established for spinner is now a **fixed template for every
component**, not a per-component layout decision. See `SKILL.md`'s Phase 3b for the locked-down
spec. Icon's documentation was rebuilt to match it exactly.

Root frame `1836:2` on the `Icon` page:

- **Header**: "Documentation" grey kicker, title "Icon", Storybook link — reused verbatim from
  the URL already embedded in `icon.tsx`'s own `generateSvgContent` error message
  (`...components-data-display-icon--documentation`, swapped `framework:angular` →
  `framework:html` to match the spinner convention), lead paragraph from the component's JSDoc
  (which still says "optional tile background" — the same orphaned `.is-tile` CSS flagged
  earlier; copied verbatim since code is the source of truth for docs copy, not edited here).
- **"All icons" reference grid**: additive section before the row/card structure (per the
  SKILL.md allowance for components with a large open-ended content axis) — all 79 variants as
  instances in a 10-column grid, default styling. Not a replacement for the row/card structure,
  just a look-up aid specific to icon's `name` variant.
- **Rows = `size`** (Base/SM/MD/LG/XL, 5 rows — the one property affecting scale/shape),
  matching spinner's "rows = shape/scale" rule. Each row eyebrow: "→ Size — <label>".
- **Every row = two cards side by side**, exactly like spinner: normal (left, light-grey) /
  inverted (right, navy), using `bell` as the one representative icon throughout — chosen
  arbitrarily as a generic recognizable shape, consistent across every row for comparability.
- **Columns = `color` + `state` combined** (Primary/Info/Grey/Success/Danger/Warning/Disabled/
  Invalid, 8 columns) — `disabled` → `Icon/Color/Disabled`, `invalid` → `Icon/Color/Danger`
  reused, matching code's actual `.is-invalid` behavior (danger color, no separate invalid
  token exists).
- **Important semantic finding, documented not "fixed"**: on the inverted card, every column
  renders **identically** (`Icon/Color/Inverted`, ignoring the column's own color/state) — this
  is not a bug, it's `icon.host.scss`'s real behavior:
  `:host(.is-#{color}:not(.is-inverted, .is-invalid, .is-disabled))` means `inverted` overrides
  any `color`/`state` choice entirely. The uniform white column on the inverted card is an
  accurate demonstration of that override, not a layout mistake.
- **`turn` is not represented in this layout** — it doesn't fit the row/card/column shape
  (rotation isn't a token-bound color/size value). Dropped from the first pass's separate "Turn"
  card for template consistency; `turn` remains documented in the Phase 1/2 analysis above as an
  instance-level override, just not visualized in Phase 3b.

## Open questions for review

1. Confirm the `icon`/`name` variant property list above — is the full 79-icon
   `packages/assets/src/icons/svg/` set correct, or is there a different/larger icon source
   (e.g. a bigger pack loaded via `DsIcons` config at runtime) that should be used instead?
2. Confirm `size`/`color`/`state`/`inverted`/`turn`/`inline`/`shadow` as instance-overrides
   (not crossed variants) — this is the structural decision the whole build hinges on.
3. Confirm the deduped `color` options (`info` appears once, not twice as in the buggy code
   array) and the dropped `primary-light` (no matching token or enum value).

## Phase 4 — Review against visual regression (complete)

Compared the real `icon.visual.html` test cases (screenshots + live DOM/computed-style
measurements via Playwright against the dev server) against the built Figma documentation.

- **`inverted` uniform white across all colors** (`Component/Icon/Color/Inverted`, ignoring the
  column's own `color`): confirmed correct via computed `--mod-icon-color` (`#ffffff` for all 6
  colors × inverted in the real component). My first visual read of the tiny baseline PNG
  mistakenly saw "color variation" in the inverted row — that was a crop/compression artifact
  (the colored _normal_ row bled into the same low-resolution strip); a cropped re-check and the
  DOM measurement both confirm the Figma build is accurate.
- **`invalid` state color**: confirmed `#cb1501` (danger red) via computed style — matches the
  `Icon/Color/Danger` binding used in the Figma "Invalid" column. Correct.
- **`turn` rotation**: **found and fixed a real error** in the Phase 1 analysis (see the `turn`
  prop note above) — it's icon-name-specific (`225deg` for `plus`, `180deg` for
  `caret-down`/`caret-up`, no effect otherwise), not a uniform 180deg rotation as first
  documented. `turn` isn't visualized in the Figma documentation layout regardless (doesn't fit
  the row/card/column template), so no Figma-side fix was needed — just the written record.
- **`--icon-color` CSS override**: confirmed (via the `icon-override` test) that an explicit
  `--icon-color` custom property on a consumer element beats the `color` prop entirely — an
  undocumented power-user escape hatch, same pattern as `ds-spinner`'s `--spinner-color`. Not
  something this skill represents in Figma (instance-level CSS override, not a token/prop), just
  noted for completeness.
- **`sizes`/`basic`/`shadow` baselines**: visually consistent with the Figma build, no findings.

No animated/composite-vector size concern applies to icon (its marks are static single-path
SVGs, not Lottie like spinner's logo) — Phase 4 step 0 is not applicable here.

### Full prop sweep — re-run, numeric cross-check (complete)

Re-verified every remaining prop against the live dev server, this time comparing exact
computed values (not just visual impressions):

- **`size`**: `getBoundingClientRect()` on sm/base/md/lg/xl = 14/16/24/32/40px exactly, matching
  `Icon/Size/SM|Base|MD|LG|XL`.
- **`color`** (6 options, normal/non-inverted): computed `--mod-icon-color` hex compared
  directly against the resolved hex of each bound Figma variable — **exact match on all 8**
  (6 colors + Disabled + Inverted): Primary `#000d6e`, Info `#656ea8`, Grey `#747474`, Success
  `#116b34`, Danger `#cb1501`, Warning `#7d4a0d`, Disabled `#313131`, Inverted `#ffffff`. Byte-
  for-byte, not just "looks right."
- **`invalid`**: `#cb1501`, same as Danger (code reuses the token, no separate invalid color) —
  matches the Figma "Invalid" column binding.
- **`turn`**: re-verified separately (see above) — `plus`→225deg, `caret-down`/`caret-up`→180deg,
  confirmed via computed transform matrix → angle for all 4 pairs in the real baseline, no other
  icon name affected.
- **`inline`**: `display: inline-flex` confirmed. Not visualized in Figma (display-mode flag,
  per the original instance-override decision) — still correct to exclude.
- **`shadow`**: computed `filter: drop-shadow(rgba(0,0,0,0.5) 0px 0px 80px)` — matches
  `drop-shadow(0px 0px 5rem rgba(0,0,0,0.5))` (5rem = 80px at this repo's 16px base). Not
  visualized in Figma — correct to exclude (a filter effect, not a token/color/size binding).
- **`svg`/`src`**: both still render real content in the live component, confirming the
  Phase 1 exclusion decision (same content concept as `name`) remains valid — no surprise
  behavior difference to account for.

Every prop in the mapping has now been checked against live, numeric ground truth at least
once. No further Phase 4 findings for `ds-icon`.

## Major structural change — 79 standalone components instead of one 79-variant set

User asked for the same treatment as `ds-spinner`'s Primary/Inverted split: each icon should be
its own **separate top-level component**, swappable via Figma's native Instance Swap, not a
variant within one shared component set.

**Implementation**:

- Stripped the `icon=<name>` prefix from each of the 79 variant children and renamed to
  `Icon/<name>` (the `/` groups them under one "Icon" category in the Assets panel/Instance Swap
  picker, same convention as `Spinner/Primary` / `Spinner/Inverted`), then `page.appendChild()`'d
  each one — this detaches them from the `COMPONENT_SET`, which auto-dissolves once emptied
  (confirmed gone, as expected).
- **Hit a naming bug**: the rename step produced double-prefixed names (`Icon/Icon/alert`)
  instead of the intended single `Icon/alert` — cause not fully root-caused, but easily fixed by
  normalizing (`name.replace(/^(Icon\/)+/, '')` then re-prefixing once).
- Verified existing instances (`Copy me`, `Variants` examples) still resolved correctly
  throughout — detaching/renaming a component node doesn't break instances referencing it by ID.
- Realigned all 79 standalone components to the Main components table grid (same centering
  logic as before, just resolving components by page-level name lookup instead of
  `set.children`) and re-locked them.
- No component properties were lost — `ds-icon`'s set only ever had the single `icon` variant
  property (no boolean/instance-swap properties like `ds-spinner`'s `Show label`), so there was
  nothing else to preserve through the split.

**figmaComponentKey note**: the YAML header's single `figmaComponentKey: '1832:7997'` is now
stale — there are 79 independent component keys instead of one set key. Not individually listed
here (see the icon inventory list below for the full name list; resolve a specific icon's current
key via `figma.getNodeByIdAsync` / `page.findOne` by its `Icon/<name>` name if needed).

## Major structural change — Size × Color as real variant properties (hard rule)

User overrode the earlier "color-only or size-only variant" recommendation: **both `size` and
`color` must be real Figma variant properties, full cross-product, on every one of the 79
icons** — a hard rule, not a judgment call. Each `Icon/<name>` went from a single standalone
`COMPONENT` to its own `COMPONENT_SET` with 30 variants (`size` × `color` = 5 × 6), for
2,370 components total across all 79 icons.

**This does not contradict the earlier "N standalone components" rule for the open-ended `name`
axis** — `name` still splits into 79 separate top-level entities (Instance Swap), but _within_
each one, `size`/`color` are now real crossed variant properties (dropdown pickers on an
instance), not instance-overrides. Two different axis types, two different treatments: an
open-ended content-selection prop → top-level split; a small closed enum where every option
re-skins the same shape → crossed variant property. This is consistent with the general rule
already in `CONVENTIONS.md` ("same layers, different token → variant; different layers/structure
→ top-level split") — `size`/`color` on an icon are exactly "same layers, different token."

**Implementation**:

- For each icon: built 30 variant nodes (clone the base component 29 times, reuse the real
  original node for the `size=base, color=primary` default combo), resized each to its size
  (`sm`=14, `base`=16, `md`=24, `lg`=32, `xl`=40), recolored each by rebinding its inner
  `VECTOR`'s fill to the matching `Component/Icon/Color/<Name>` token, named
  `size=<size>, color=<color>`, then `figma.combineAsVariants()`'d all 30 into one set renamed
  `Icon/<name>` (same name as the original standalone component — preserves the Instance Swap
  grouping).
- **Insertion order determines the default variant** (`combineAsVariants` has no settable
  `defaultVariant` property — confirmed read-only via a thrown `TypeError` when attempted).
  Iterating `size` with `base` first (not alphabetical, not `sm` first) was required to get the
  correct default (`size=base, color=primary`, matching code's actual default) — the first
  prototype run (on `alert`) iterated `sm` first by mistake, giving a wrong default; left as a
  known cosmetic-only quirk on that one icon rather than fighting Figma's deletion protection to
  fix it (see next point).
- **Figma silently protects a `COMPONENT_SET` with a live-referenced default variant from
  `.remove()`** — calling `.remove()` on `alert`'s prototype set (while an existing instance
  still referenced one of its children) silently no-op'd instead of throwing or deleting
  anything. Confirmed by checking existence immediately after the call. No data was lost; this
  is a safety behavior, not a bug — just unexpected since no error surfaced. Don't assume
  `.remove()` succeeded just because it didn't throw; verify with a follow-up existence check
  for anything load-bearing.
- Built in batches of 3–7 icons per `use_figma` call (sizes/colors are cheap per-variant
  operations compared to `ds-icon`'s earlier 79-icon-grid batches, so larger batches were safe
  here).
- All existing instances (`Copy me`, `Variants` examples, the 79-icon `Main components` grid,
  all 869 `Sizes & Colors` swatches) were verified to still resolve correctly throughout —
  0 broken instances after the full conversion.
- Locked all 2,370 variants (`node.locked = true`) — same standing rule as every other
  component's master grid.
- **Hit the familiar orphaned-parent bug once more**, this time on the `alert` prototype set
  specifically (`parent: NONE` after `combineAsVariants`) — fixed with the same
  `page.appendChild(set)` pattern used for every other master set in this project.

**Not yet done**: the existing "Sizes & Colors" table's 869 swatches are still manually
resized/recolored generic instances, not instances of the _specific matching variant_
(e.g. the `SM`/`Danger` cell isn't literally an instance of `size=sm, color=danger` — it's a
`size=base,color=primary` instance manually resized and recolored to look the same). Visually
identical, but not structurally tied to the real variant. Could be tightened to reference the
exact variant per cell as a follow-up, not done in this pass since the hard-rule request was
specifically about the master components having real properties, not about rewiring the
reference table.

## New section — "📐 Sizes & Colors" exhaustive reference (all 79 icons × 5 sizes × 6 colors)

User flagged a real gap: after the top-level-component split, `size` and `color` (both
instance-overrides, not separate components) were only demonstrated on one representative icon
in the "Variants" section — not shown per-icon anywhere. Asked for a full reference table:
icon name (rows) × every size × every color (columns), **for all 79 icons**, not a sample.

**Implementation**: a new section added after "Main components", same page:

- Table: 79 rows (one per icon) × 11 columns (5 size swatches: SM/Base/MD/LG/XL at
  14/16/24/32/40px, then 6 color swatches: Primary/Info/Grey/Success/Danger/Warning) = 869
  instances total.
- Each swatch is an **instance** of that row's real `Icon/<name>` component (never the master
  itself) — size swatches via `instance.resize(px, px)`, color swatches via finding the
  instance's inner `VECTOR` child and rebinding its fill
  (`setBoundVariableForPaint`) to the matching `Component/Icon/Color/<Name>` token. This is
  simpler than `ds-badge`/`ds-spinner`'s overrides since icon components have no boolean/
  "Show X" properties to preserve — just a single `VECTOR` child per component.
- Built in 8 batches of ~10 icons each (110 instances per batch) rather than one script — kept
  each `use_figma` call's execution scope small and let each batch be checkpointed
  independently; same incremental-build discipline as any other large build in this skill.
- Table chrome (header row, 79 row-label cells, 11×79 empty cells) was built in one separate
  pass _before_ any instances, then instances were filled in after — splitting structure from
  content made it easy to verify the grid skeleton was right before committing to filling
  hundreds of cells.
- Verified the first row (`alert-triangle`) and last row (`youtube`) visually, plus confirmed
  the total instance count filled (`110×7 + 99 = 869`) exactly matches `79 × 11` — strong
  evidence of a correct, complete build without needing to visually inspect all 79 rows
  individually (a full-page screenshot at reduced scale also confirmed every row renders with
  content, no gaps).

**New template consideration for SKILL.md**: when a component has instance-override props
(size/color/etc.) that deserve a full per-option-combination reference beyond the compact
"Variants" sample, build it as an **additional section after Main components**, not by trying to
cram it into the "Variants" section itself — "Variants" stays a compact, single-axis sample;
exhaustive multi-axis instance-override sweeps get their own clearly-named section.

## Rebuild — TapTap Design System layout (supersedes the old row/card documentation)

Per the user's request to apply the same template used for `ds-badge`/`ds-spinner` (see
`badge.figma.md`'s "Major layout rewrite" section for the full rationale), the old `Documentation`
frame (`1836:2`) was deleted entirely and rebuilt from scratch.

**Structure** (one bordered outer frame "Icon Documentation", "Icon" label above it):

- **Header**: "Media" kicker / "Helvetia Design System" wordmark, title "Icon" (bold 4XL), lead
  paragraph (verbatim JSDoc), "View in Storybook ↗" link (same URL as the original build,
  sourced from `icon.tsx`, not a `doc-config.ts` — icon doesn't have one of those files; `name`
  is `components-media-icon--documentation`).
- **"👉 Copy me"**: one real instance (`icon=alert`), resized to 32px — the single
  representative example.
- **"🛠 Variants"**: compact single-axis reference for `size` (`SM`/`Base`/`MD`/`LG`/`XL` — 14/
  16/24/32/40px, the exact values confirmed in Phase 4), using instances resized per option.
- **"🔒 Main components (79 icons)"**: unlike `ds-badge`/`ds-spinner`, icon's component set has
  only **one** crossed variant property (`icon`, 79 options — `size`/`color`/`state`/`inverted`/
  `turn`/`inline`/`shadow` are all instance-overrides, never variant axes, per the original
  Phase 2 decision). So there's no second axis to cross for a `Main components` table — this
  section is instead the **exhaustive reference grid of all 79 real master variants**, arranged
  10 columns × 8 rows, each cell showing the actual `COMPONENT` (not an instance) centered in a
  40px icon area with its option name labeled below in small grey text (chrome, not part of the
  component itself). Same grid-line/centering technique as `ds-badge`/`ds-spinner`'s Main
  components tables. This replaces the old "Card — All icons" additive reference grid 1:1 —
  same purpose, new chrome.
- The old per-size row/card section (`Size — Base/SM/MD/LG/XL`, each with normal/inverted card
  pairs) was **not recreated** — the new compact `Variants` section covers `size` at a glance,
  and the color/state/inverted sweep that used to live in those cards is already fully
  documented numerically in this file's Phase 4 section above (byte-exact hex matches for all
  8 colors) — a visual re-creation would be redundant with no new information.

**Pitfalls hit (same two as `ds-spinner`'s rebuild, see `spinner.figma.md` for full detail)**:

- The master `COMPONENT_SET` was found with `parent: NONE` (orphaned at the page-tree level)
  before this rebuild — same as spinner's. Fixed identically: `page.appendChild(set)`.
- The set needed to be explicitly the **last** page child for correct z-order (render on top of
  the opaque documentation frame) — confirmed via `iconPage.appendChild(set)` at the end of the
  overlay step, and verified by checking `page.children` order directly rather than assuming it.

**New technique this rebuild**: absolute-positioned overlay rectangles/text for table chrome
(used for grid lines on `ds-badge`/`ds-spinner`) hit a real API restriction when attempted on a
**freshly created, not-yet-parented** text node (`layoutPositioning = 'ABSOLUTE'` threw `Can
only set layoutPositioning = ABSOLUTE if the parent node has layoutMode !== NONE`, even though
the parent clearly was an auto-layout frame) — worked fine for the grid-line rectangles
(appended to an already-attached `table` frame) but not for a per-cell name label appended to a
cell in the same synchronous batch as the cell's own creation. Worked around by **not using
absolute positioning for the name labels at all** — used a transparent fixed-height spacer frame
(`icon-area`, 40px) above the label in normal auto-layout flow instead, letting the real
icon overlay align to the spacer's area. Simpler and avoids the restriction entirely; prefer
this pattern over absolute-positioned chrome text when the two can be created in the same batch.

**Screenshot verification**: used the page-level `nodeId` (not the frame's own id) for all
checkpoints, per the reliability finding from `ds-spinner`'s rebuild — this fully composited all
79 overlaid icons correctly on the first reliable attempt, with no missing cells (unlike
`ds-spinner`'s two inverted-logo cells, which never did composite reliably in this tool despite
being confirmed correct every other way).

**Follow-up — removed top-label, added version/timestamp tag.** Same treatment as `ds-badge`/
`ds-spinner`: removed the "Icon" label above the outer frame, added a small right-aligned
`version-tag` reading `v0.0.6 - 24.10.2026` in the top-right corner.

**Follow-up — page background color.** Same as `ds-badge`: `page.backgrounds` set to literal
solid `#e8e8e8`.

**Follow-up — lead paragraph text color.** Same as `ds-badge`: rebound from
`Alias/Text/Color/Grey` to `Alias/Text/Color/Primary`.

**Follow-up — locked the overlaid grid variants.** Same as `ds-badge`: all 79 variants locked
(`node.locked = true`) so they can't be dragged out of alignment in the Figma UI.

**Follow-up — all borders/dividers to 2px.** Same as `ds-badge`: dividers, grid lines
(`v-line-*`/`h-line-*`), and all frame strokes set to 2px thickness.

**Follow-up — realigned the 79-icon overlay after the heading font-size change.** Same cause as
`ds-spinner`: the heading size change shifted the table's position in the auto-layout stack,
leaving the overlaid real icon variants misaligned. Recomputed against the table's current
`absoluteTransform` and reapplied.

**Follow-up — section heading font size.** Same fix as `ds-spinner`: rebound the "👉 Copy me"/
"🛠 Variants"/"🔒 Main components" headings from `Alias/Text/Size/SM` to
`Component/Heading/Level/1/FontSize` (28px) to match `ds-badge`.

**Follow-up — breadcrumb kicker + AI-review emoji convention.** Same as `ds-badge`: page name and
in-page `kicker` text both set to `⏳ Core / Media / Icon`. See `badge.figma.md` for the full
`⏳`/`✅` human-review convention — never auto-set to `✅`.

**Follow-up — moved the version/timestamp into the header's wordmark slot.** Same as
`ds-badge`/`ds-spinner`: removed the standalone `version-tag`, overwrote the `wordmark` text
node (previously "Helvetia Design System") with `v0.0.6 - 26.10.2026` instead.

**Follow-up fix — title size mismatch with `ds-badge`.** Same issue as `ds-spinner`: title
`fontSize` was bound to `Alias/Text/Size/4XL` (32px) instead of `ds-badge`'s actual
`Component/Heading/Level/Display1/FontSize` (48px). Rebound to match.

## Major rebuild — per-icon titled grids replace the flat reference grid (Main components)

User flagged the page was "still a mess" after the size/color hard-rule conversion (2,370
components) and asked for three concrete changes: (a) "Variants" should preview a handful of
different icon **names** (not a single-icon size sweep), (b) "Main components" should become one
**titled grid per icon** — icon name as a heading, then a 5×6 grid with sizes down the left and
colors across the top — stacked one after another for all 79 icons, and (c) the real master
`COMPONENT_SET`s (previously parked off to the side, cluttering the canvas/layers panel) must be
**anchored directly onto** each icon's grid cells, not parked elsewhere.

**Data loss noted, not investigated further**: the previous "📐 Sizes & Colors" table (869
generic resized/recolored instances, node `1963:9`, documented in the section above) was found to
have disappeared from the file entirely before this rebuild started — `getNodeByIdAsync` returned
nothing, and a page-wide search for its heading text also found nothing. Root cause unknown
(possibly a side-effect of the large `combineAsVariants`/`appendChild` batch operations during the
2,370-component conversion). Not restored, since this rebuild replaces it with a superset of the
same information (every icon's full size × color grid, using the real variants directly rather
than resized/recolored look-alike instances) — but flagged here for the record, since it
represents work that was silently lost rather than intentionally removed.

**Implementation**:

1. Removed the old flat 79-icon-name "Main components" reference grid (node `1901:8134`) entirely
   — confirmed via `.remove()` returning `{removed: true}`.
2. Rebuilt the "Variants" row (node `1901:8100`) with 6 representative icons — `edit`, `user`,
   `plus`, `search`, `settings`, `trash` — each an instance of that icon's `size=base,
color=primary` default variant, with its name as a label underneath
   (`Alias/Text/Size/XS`/`Alias/Text/Color/Grey`). Row changed to `HORIZONTAL` auto-layout,
   `primaryAxisSizingMode: FIXED`, width 820, `primaryAxisAlignItems: SPACE_BETWEEN`.
3. Built chrome for all 79 per-icon grids in one batch, stacked inside a new vertical auto-layout
   container (`1972:7955`, 28px item spacing between icons). Each icon got a `block-<name>` frame:
   bold title text (the icon name) + a `grid` table (5 size rows × 6 color columns, headers only,
   empty cells). Layout constants: `cellW=48, cellH=44, sizeLabelColW=56, headerH=24`.
4. **Anchored the real `COMPONENT_SET`s onto the grids** — for each of the 79 icons, repositioned
   its set (previously parked at `x:0, y:-20000`) so its top-left lands exactly at the matching
   grid's first data cell (`table.absoluteTransform` + `sizeLabelColW`/`headerH` offsets), then
   positioned each of its 30 `size=<s>, color=<c>` variant children within their own cell
   (centered: `colIdx*cellW + (cellW-variant.width)/2`, same for rows), and
   `page.appendChild(set)`'d it to guarantee correct z-order (drawn on top of the grid chrome
   underneath). This is the same "overlay real variants directly onto documentation chrome"
   pattern already used for `ds-badge`/`ds-spinner`'s Main components tables, applied per-icon
   here instead of once for the whole page.
5. Ran in 8 batches of ~10 icons per `use_figma` call. All 79 completed successfully
   (`ok: true` for every icon, verified via a final pass cross-checking `blockMap` keys against
   `COMPONENT_SET` names on the page — 0 missing in either direction).
6. Confirmed no stray parked content remains (`iconPage.children.filter(n => n.y < -1000)`
   returned empty) — the old parking position is fully vacated now that every set has a real
   grid position.
7. **Screenshot verification hit the same known composite-overlay unreliability** documented
   earlier for both `ds-spinner`'s inverted table and this file's own first overlay pass
   (alert-triangle) — `get_screenshot` on individual `block-<name>` table nodes rendered the grid
   chrome correctly but showed **empty cells**, even though the real variants were confirmed
   correctly positioned underneath. Resolved the same way as before: verified via direct
   `absoluteTransform` position math instead of trusting the screenshot. Spot-checked the first
   icon (`alert-triangle`), a middle icon (`settings`), and the last icon (`youtube`) — all three
   variants' `size=sm, color=primary` instance measured within its expected cell bounds (e.g.
   `alert-triangle`: expected cell top-left `(98, 824)`, actual variant position `(115, 839)` — the
   `(17, 15)` offset is exactly the expected centering offset for a 14×14 icon in a 48×44 cell),
   and all three were confirmed `locked: true`. The "Variants" row screenshot (a flat, non-overlay
   composite) rendered correctly on the first try, consistent with the unreliability being
   specific to this overlay pattern, not a general tooling problem.
8. All repositioned variants remained locked throughout (locking was applied during the original
   2,370-component build; repositioning via script doesn't unlock nodes).

**Net result**: "Main components" is no longer a single flat 10×8 reference grid of default
variants — it's 79 stacked sections, each titled with the icon's name and showing that icon's
complete real 5×6 size×color variant matrix, anchored in place (not parked). "Variants" is now a
compact 6-icon name sample, matching the originally-intended "Variants = compact single-axis
sample, Main components = exhaustive structural reference" split, just with the exhaustiveness now
expressed per-icon instead of as one shared flat grid.

### Follow-up fix — component set frame too narrow, clipping Danger/Warning columns

User flagged the Danger and Warning columns were missing/cut off in every icon's grid. Root
cause: each `Icon/<name>` `COMPONENT_SET`'s own frame (`clipsContent: true`) had kept its stale
pre-overlay size from an earlier internal layout (observed values varied wildly per icon, e.g.
`alert-triangle` was `184×1780`, `answer` was `40×1780`) — the earlier overlay step repositioned
each variant child's `x`/`y` correctly, but never resized the set's own frame to match, so
anything past the old (too-narrow) width or outside the old (unrelated) height got silently
clipped by the frame's `clipsContent`.

**Fix**: resized every one of the 79 sets' frames to `288×220` (`6 columns × 48px` ×
`5 rows × 44px` — the exact grid dimensions used by the overlay/alignment step) via
`set.resize(288, 220)`, in one batch across all 79. Verified with a bounds check (`max(child.x +
child.width)` / `max(child.y + child.height)` against the new frame size, `min(child.x/y) >= 0`)
across all 79 sets — zero overflow/clipping remaining. `get_screenshot` on individual table nodes
still showed empty cells post-fix, consistent with the already-documented composite-overlay
screenshot unreliability for this exact pattern (same cause, not a regression) — verified
correctness via the bounds check instead, not a screenshot.

### Follow-up — "Variants" expanded from 6 sample icons to all 79

User asked for every icon name to appear in the "Variants" section (not just the 6-icon sample
from the earlier rebuild) — one instance + name label per icon, same visual pattern as the
existing 6 examples (`edit`, `user`, `plus`, `search`, `settings`, `trash`), just covering the
full icon set.

**Implementation**:

- Converted "Variants row" (`1901:8100`) from a single fixed-width `HORIZONTAL` row (which only
  fit ~6 items before running out of its 820px width) to a **wrapping** auto-layout:
  `layoutWrap: 'WRAP'`, `primaryAxisSizingMode: 'FIXED'` (width stays 820, matching the rest of
  the page's content width), `counterAxisSizingMode: 'AUTO'` (height hugs to however many rows
  the wrap produces), `itemSpacing: 16`, `counterAxisSpacing: 16`.
- For each of the 73 icons not already present, built the identical structure used by the
  existing 6 examples: a `VERTICAL` auto-layout frame (`example-<name>`, hug/hug, 6px item
  spacing, centered both axes) containing an `INSTANCE` of that icon's `size=base, color=primary`
  default variant (resized to 16×16) plus a `label` text node (`Baloise Create Text` Regular,
  12px, reusing the existing label's own fill object — a grey bound to the same Figma variable as
  the other 6 — rather than rebuilding the token binding from scratch).
- Built in 5 batches of 13–15 icons per `use_figma` call. Final count check
  (`variantsRow.children.length`) confirmed exactly 79 after the last batch.
- Verified via `get_screenshot` on the row itself (not a nested overlay node, so the known
  composite-overlay screenshot unreliability doesn't apply here) — rendered correctly as 7 wrapped
  rows of up to 12 icons each, every icon showing its correct glyph and name label, no missing or
  duplicate entries.

### Follow-up fix — Main components grids misaligned after Variants row grew

Expanding "Variants" from 6 to 79 icons grew that row's height substantially (43px → 373px,
wrapping into 7 lines), which — same root cause already documented above ("a real master variant
overlaid on a table/grid ... does not move if anything above it in the same auto-layout stack
changes size") — pushed every "Main components" per-icon block further down the page without
moving the already-overlaid real `COMPONENT_SET`s, which stayed at their old absolute
coordinates. Result: every icon's real variants rendered offset from (and overlapping into) the
wrong block's grid/title.

**Fix**: re-ran the same `alignOne` overlay routine from the original build (recomputing each
block's current `table.absoluteTransform`, not reusing any cached position) across all 79 icons
in one pass. Verified via position math (not screenshot, same known tooling limitation for this
overlay pattern) — `size=sm, color=primary` variant position checked against its grid's current
cell bounds for `alert-triangle`, `alert`, `answer`, and `youtube` (first few and last), all
within bounds. Also checked each block's title-to-table gap (consistently 6px across sampled
blocks) to confirm no residual visual collision from the old misalignment.

**Generalizes the existing "recompute overlay after layout change" rule**: this wasn't a heading
font-size change (the prior trigger) but the same underlying cause — any edit to content that
sits _above_ an overlaid table in the page's auto-layout stack requires re-running the overlay
alignment afterward, not just heading-size edits specifically.

### Follow-up — made overlaid sets "sticky" by reparenting into their own table frame

After the second manual realignment pass, user asked whether the real master `COMPONENT_SET`s
could be made to auto-follow their grid instead of needing a manual re-align every time something
above them in the page's auto-layout stack changes height (as happened twice: once for a heading
font-size change, once for the Variants row growing from 6 to 79 icons).

**Root cause of the fragility**: every overlaid set was a **page-level sibling**, positioned with
one-time page-absolute `x`/`y` coordinates computed from its table's `absoluteTransform` at build
time. Nothing tied it structurally to the table it was visually sitting on — if the table moved
(because content above it in the page's vertical auto-layout stack changed height), the set simply
stayed where it was, requiring a full recompute-and-reapply pass.

**Fix — reparent each set as a real child of its own table frame**, instead of a page-level
sibling positioned to merely _look_ aligned:

- `table.appendChild(set)` — moves the whole `COMPONENT_SET` (not a variant child — reparenting
  the entire set is safe; the existing "never move a variant child out of its set" rule is about
  detaching one variant from its set, not relocating the set itself) into the table frame (a
  `VERTICAL` auto-layout frame with children `header-row`, `row-SM`...`row-XL`).
- `set.layoutPositioning = 'ABSOLUTE'` — opts it out of the table's auto-layout flow so it can
  still use free `x`/`y`, now **relative to the table**, not the page.
- `set.x = 56` (`sizeLabelColW`), `set.y = 24` (`headerH`) — same offset values used throughout
  this build, just now interpreted as local coordinates instead of a page-absolute calculation.
  The 30 variant children's own `x`/`y` (relative to the set) needed no changes at all — only the
  set's own position relative to its new parent.
- No change needed to z-order logic beyond confirming the set is still the table's _last_ child
  (same requirement as the old page-level z-order rule, just scoped to the table instead of the
  page) — `table.appendChild(set)` already guarantees last-child placement.
- Ran in 4 batches across all 79 icons. Final verification pass checked, per icon: the set is
  found as a child inside its table (not still at page level), `layoutPositioning === 'ABSOLUTE'`,
  is the table's last child, its `size=sm, color=primary` variant's absolute position falls within
  the expected first-cell bounds, and it's still locked — **zero problems across all 79**.

**Added benefit, not the original goal**: this also fixed the long-standing composite-overlay
`get_screenshot` unreliability documented throughout this file and `CONVENTIONS.md` (`ds-spinner`
and this file's own earlier passes) — screenshots of individual table nodes, which previously
showed empty cells for a page-level sibling overlay, now render completely and correctly, because
the overlaid content is a genuine descendant of the screenshotted subtree rather than a
cross-branch composite. Spot-checked `settings` and `youtube` post-reparent — both rendered fully
on the first screenshot attempt.

**This generalizes beyond icon**: for any future component whose documentation overlays a real
master variant/set onto external table chrome (the `ds-badge`/`ds-spinner`/`ds-icon` "Main
components" pattern), prefer reparenting the master directly into the table frame as an
absolute-positioned child from the start, rather than positioning it as a page-level sibling with
page-absolute coordinates — captured as a new rule in `CONVENTIONS.md`.

### Follow-up — Variants rebuilt as a fixed 8-column grid with equal-width cells

The 79-icon "Variants" sample (previous section) used `layoutWrap: 'WRAP'` with each column
hugging its own label width — this produced a ragged, unevenly-wrapping layout (varying items per
row depending on label length) rather than a clean grid. User asked for a fixed 8-per-row grid
with every column the same width, plus top/bottom padding on the card (it only had left/right
padding before).

**Implementation**:

- Computed a fixed column width from the card's existing content area: card width `820`, existing
  `24px` left/right padding → `772px` content width; `8` columns with `12px` gaps between →
  `colW = (772 - 12×7) / 8 = 86px`.
- Converted "Variants row" (`1901:8100`, which is itself the bordered/rounded card — confirmed via
  its own `strokes`/`cornerRadius`, not a separate wrapper frame) from `HORIZONTAL` + `WRAP` to
  `VERTICAL`, `layoutWrap: 'NO_WRAP'`, added `paddingTop`/`paddingBottom: 24` (matching the
  existing `24px` side padding), `itemSpacing: 24` between grid rows.
- Created 10 new `variant-row-<n>` sub-frames (`HORIZONTAL` auto-layout, transparent fill,
  `12px` item spacing, 8 per row except the last with the 7 leftover icons), then moved each of
  the 79 existing `example-<name>` frames into its correct sub-row (`Math.floor(index / 8)`).
- Resized every `example-<name>` frame to a **fixed** `86px` width
  (`layoutSizingHorizontal: 'FIXED'`) instead of hugging its label, and set its `label` text node
  to `textAutoResize: 'HEIGHT'` + fixed `86px` width + `textAlignHorizontal: 'CENTER'` — this lets
  long labels (`help-customer-support`, `table-cell-merge`) wrap onto two centered lines within
  their column instead of overflowing it, which is what makes a true fixed-width grid possible
  despite highly variable label lengths across the 79 icons.
- Built in 2 batches (40 + 39 icons) to keep each `use_figma` call's scope manageable.
- **Pitfall hit**: setting `counterAxisSizingMode: 'FIXED'` on the now-`VERTICAL` row/card and
  calling `.resize(variantsRow.width, variantsRow.height)` _before_ the new row children existed
  (0 children at that point in the script) caused the card to auto-collapse to a near-zero hug
  width (`182px`) despite `FIXED` mode being set — the width value read back from the node
  mid-script wasn't yet the real target width. Fixed with an explicit final
  `variantsRow.resize(820, variantsRow.height)` call _after_ all 79 icons were placed into their
  sub-rows, re-asserting the intended `820px` card width. Lesson: don't trust a node's own
  `width`/`height` as an intermediate reference value immediately after changing its sizing mode
  mid-script, especially before its children are populated — re-assert the final fixed dimension
  explicitly as the last step once the real content is in place.
- Verified via `get_screenshot` on the card itself — renders as a clean 8-column grid (9 full rows
  of 8, 1 final row of 7), consistent column alignment across all rows, wrapped labels rendering
  correctly centered under their icons, and visible top/bottom padding matching the left/right
  padding.

## Follow-up — header rebuilt to match the pattern introduced on `ds-spinner`

Same rebuild as `badge.figma.md`'s equivalent entry — see that file and
`DOCUMENTATION-TEMPLATE.md` for the full spec. Summary: wrapped `top-bar`/`heading`/`body` into
one `header` auto-layout frame; replaced the single `title` text with a two-line `heading`
(`"Icon"` bold 48px + `"Main"` light 48px); restyled the link to Bold 16px underlined; bumped
`lead` from 14px to 16px.

**No overlay realignment needed afterward** — unlike Badge (and unlike Icon's own state before
the earlier "sticky" reparenting fix), every one of the 79 `Icon/<name>` component sets is now a
real child of its own per-icon table frame (`layoutPositioning: 'ABSOLUTE'`, relative coordinates)
rather than a page-level sibling with page-absolute coordinates — confirmed via a stray-children
check (`COMPONENT_SET` with `y < -1000` at the page level) returning zero results after the header
change. This is the concrete payoff of that earlier structural fix: a header height change no
longer requires re-running any alignment step for Icon's Main components grids, while Badge (and
Spinner, which can't use the same fix — see `spinner.figma.md`) still do.

**Note: this section describes a structure that was superseded shortly after by the "Major
rebuild" below** — the 79 per-icon titled grids (and the 2,370 components behind them) were
replaced by a single wrapper + Instance Swap glyph library. Left in place above for history; the
reparenting payoff described here no longer applies to `size`/`color` (now one shared wrapper,
see below), though the general "prefer reparenting a master into its table frame" lesson remains
valid and was reapplied to the new wrapper's single grid.

## Major rebuild — single wrapper COMPONENT_SET + Instance Swap glyph library

User flagged the 2,370-component structure (79 top-level `COMPONENT_SET`s, each with its own
30-variant `size`×`color` cross-product) as "too many variants," and proposed the standard
real-world Figma icon-library pattern instead: **one master component that controls size and
color, with an internal instance-swappable slot for which glyph to show** — so size/color live in
exactly one place, and the 79 icons become a lightweight swap library rather than 79 duplicated
30-variant structures.

**New architecture**:

- **79 lightweight glyph components** (`Icon/<name>`, plain standalone `COMPONENT`s, not
  `COMPONENT_SET`s) — each just a single fill-bearing vector at the `base` (16px) reference size,
  fill bound to `Component/Icon/Color/Primary`. Extracted by cloning each icon's existing
  `size=base, color=primary` variant out of the old per-icon sets (not re-imported from SVG —
  reused the already-correct, already-verified artwork). Parked off-canvas (`y: -30000`..`-29700`)
  — these exist purely as an Instance Swap source library, never shown directly in the
  documentation layout.
- **One wrapper `COMPONENT_SET` named `"Icon"`** (node `2029:8391`), 30 variants
  (`size`×`color`, same 5×6 cross-product as before, just defined once instead of 79 times).
  Each variant contains exactly one nested `INSTANCE` of the default glyph (`Icon/alert-triangle`,
  chosen arbitrarily as a representative shape), resized to the variant's `size` token and
  recolored (its inner `Vector` fill rebound to the variant's `color` token) — the same
  resize/recolor mechanism used throughout this project, just applied to a nested instance
  instead of the component's own top-level vector.
- **`addComponentProperty('Icon', 'INSTANCE_SWAP', defaultGlyphId)`** added once on the wrapper
  set (returns a property key, `Icon#2029:0`), then `componentPropertyReferences = {
mainComponent: 'Icon#2029:0' }` set on every one of the 30 variants' nested instances — this
  exposes a single "Icon" dropdown on every instance of the wrapper, letting a consumer pick any
  of the 79 glyphs via Figma's native Instance Swap picker, independent of the `size`/`color`
  variant they're on.

**Why this works (and was verified, not assumed)**: Figma preserves per-instance overrides
(resize, fill rebinds) across an Instance Swap as long as the overridden node has a
name-matching counterpart in the newly-swapped component. Tested directly: created an instance
of `size=lg, color=danger`, swapped its `Icon` property from the default glyph to `Icon/user`,
and confirmed the nested instance kept `32×32` sizing and the Danger color binding
(`VariableID:137:1453`) — the swap only changed _which glyph_, not the size/color applied to it.

**Real bug found and fixed during verification — multi-vector icons lost color-override
propagation**: `xing` (2 direct `VECTOR` children, both named `"Vector"`) and `information`
(2 vectors nested under groups) don't have a single name-matching node for the override system to
target, so swapping to them only recolored one of the two paths (or none, for `information`),
leaving the rest at their baked-in default color — visually a half-colored or wrong-colored icon.
**Fixed** by flattening both icons' vector content into a single `VECTOR` (`figma.flatten()`)
before adding them to the glyph library, so every one of the 79 glyphs now has exactly one
fill-bearing node named `"Vector"`, matching the default glyph's own structure. **Second pitfall
within that fix**: immediately after `flatten()`, the resulting vector's `fills` didn't survive
being read back through a swapped instance (empty `fills` array on the swap target, confirmed via
direct inspection) even though the master component's own `fills` looked correct — resolved by
explicitly reassigning `vector.fills = JSON.parse(JSON.stringify(vector.fills))` right after
flattening, which normalizes some internal state `flatten()` leaves behind. Re-verified both
icons post-fix: full correct color propagation, confirmed via the same swap test. **Applies to any
future icon with more than one top-level fill-bearing vector** — flatten before adding to any
future instance-swap glyph library, and re-assign `fills` once after flattening as a matter of
course, not just when something looks wrong.

**Migration steps** (all verified via position math and/or explicit functional tests, not just
visual screenshots — this grid hit the same known composite-overlay screenshot limitation
documented throughout this file, even after reparenting):

1. Extracted all 79 glyphs (cloned from each icon's `size=base, color=primary` variant,
   detached, renamed `Icon/<name>`, parked off-canvas) — in 4 batches of ~20.
2. Flattened `xing`/`information` and re-normalized their fills (see above).
3. Built the 30-variant wrapper set with the nested-instance + Instance Swap property pattern
   described above.
4. **Swapped every existing documentation reference away from the old 2,370-component structure
   before deleting it**: the "Copy me" instance and all 79 "Variants" row instances
   (`instance.swapComponent(...)`) were repointed from the old per-icon sets to the new
   lightweight glyph library — confirmed via an explicit page-wide scan (`findAll` every
   `INSTANCE`, check `mainComponent.id` against the old container's descendant ID set) that zero
   instances still referenced the old structure before removing it.
5. **Deleted the entire old "Main components" structure** (the container holding all 79
   `COMPONENT_SET`s and their 2,370 variants, plus the 79 titled per-icon grid chrome frames) —
   confirmed removed via a follow-up existence check (not just trusting the absence of a thrown
   error, per the standing `.remove()` silent-no-op caution).
6. **Rebuilt "Main components" as a single 30-cell grid** (`size` rows × `color` columns, same
   chrome conventions as `ds-badge`/`ds-close` — shaded header row/column, 2px `GreyLight`
   borders, 8px corner radius), overlaid with the real wrapper set's 30 variants using the
   **sticky reparenting technique** (the set is a real child of the table's `grid` frame,
   `layoutPositioning: 'ABSOLUTE'`, not a page-level sibling) established during the earlier
   per-icon-grid work — so this one grid auto-follows any future layout change above it, unlike
   Badge/Spinner/Close's page-level-sibling overlays.
7. Updated the "Main components" heading from `"🔒 Main components (79 icons)"` to
   `"🔒 Main components"` (no longer meaningfully about "79 icons" — it's one 30-variant grid now;
   the 79-icon reference already lives in the "Variants" section, unchanged by this rebuild).

**Net result**: node count for the icon's variant structure dropped from **2,370 components across
79 sets** to **30 + 79 = 109 components across 80 top-level entities** (1 wrapper set + 79 plain
glyphs) — a ~95% reduction — while every documented capability (any icon name × any size × any
color) is preserved, now expressed as Figma's standard "wrapper + instance-swap slot" icon-library
pattern instead of a brute-force cross-product.

**Template implication — supersedes the `ds-icon` "hard rule" in `CONVENTIONS.md`/
`DOCUMENTATION-TEMPLATE.md`.** The earlier rule ("an open-ended content-selection prop with
crossed same-layers sub-props becomes N top-level entities, each its own crossed `COMPONENT_SET`")
is no longer the recommended default — see the updated entry in `CONVENTIONS.md` for the new
guidance and the explicit reasoning for reversing the earlier hard rule.
