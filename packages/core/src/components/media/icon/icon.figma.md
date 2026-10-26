# icon → Figma mapping

```yaml
figmaComponentKey: null # superseded — 79 standalone components (Icon/<name>), not one set; see below
figmaPage: Icon
figmaCollection: Design Tokens

props:
  - name: name
    type: string (open icon registry, not a closed enum in code)
    figmaProperty: null
    figmaPropertyType: top-level-component-split
    figmaOptions: [all 79 icons in packages/assets/src/icons/svg, see list below]
    note: >
      SUPERSEDED — originally the sole crossed Figma variant property on one shared 79-member
      component set. Per user request (same TapTap Instance Swap pattern applied to
      `ds-spinner`'s `inverted`), split into 79 separate top-level components, each named
      `Icon/<name>` (Figma's own grouping convention for the Assets panel/Instance Swap
      picker) — a consumer picks an icon via Instance Swap, not a variant property dropdown.
      See the "Major structural change" section below. svg/src props are still excluded from
      the mapping entirely — they're alternate delivery mechanisms for the same SVG content
      that `name` already represents via the icon registry; nothing to map separately.

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
      SUPERSEDED — was an instance-override (no crossed variant) before the hard-rule change
      below. Now a real crossed variant property on each of the 79 per-icon component sets.

  - name: color
    type: enum
    options:
      [primary, info, grey, success, danger, warning] # 'info' appears twice in code's
      # ICON_COLORS array (icon.interfaces.ts:1) — code bug, deduped here, not fixed in code.
    figmaProperty: color
    figmaPropertyType: variant
    note: >
      SUPERSEDED — was an instance-override (no crossed variant) before the hard-rule change
      below. Now a real crossed variant property on each of the 79 per-icon component sets.

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
