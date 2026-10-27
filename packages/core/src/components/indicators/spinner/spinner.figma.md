# spinner → Figma mapping

```yaml
figmaComponentKey: null # superseded — see figmaComponentKeys below (split into two top-level sets)
figmaComponentKeys:
  primary: '1951:20' # Spinner/Primary component set node id, 8 variants (variation x size x labelPosition)
  inverted: '1951:21' # Spinner/Inverted component set node id, 8 variants, same axes
figmaPage: Spinner
figmaCollection: Design Tokens # VariableCollectionId:135:77, modes: Base, Tcs — brand-agnostic binding (Q13)

props:
  - name: size
    type: enum
    options: [sm] # code default is unset/undefined, i.e. the "base" size
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm]

  - name: labelPosition
    type: enum
    options: [right, bottom]
    default: right
    figmaProperty: labelPosition
    figmaPropertyType: variant
    figmaOptions: [right, bottom]
    note: >
      Only has a visible effect when label is non-empty. Open question below on whether this
      should be its own variant axis or folded under a "has label" consideration.

  - name: variation
    type: enum
    options: [logo, circle]
    default: logo
    figmaProperty: variation
    figmaPropertyType: variant
    figmaOptions: [logo, circle]

  - name: label
    type: string
    default: ''
    figmaProperty: 'Show label#1809:0'
    figmaPropertyType: instance-text-override + boolean visibility property
    note: >
      Free text content — never a variant property, per CONVENTIONS.md baseline rule (native
      Figma per-instance text editing, no explicit TEXT component property needed for that
      part). BUT code only renders the label at all when hasValue(label) is true
      (spinner.tsx render()) — initially missed this and built all 16 variants with the label
      always visible. Fixed by adding a boolean "Show label" component property (default
      false, matching code's real default) bound to the label layer's `visible` via
      componentPropertyReferences on every variant. Auto-layout correctly collapses the
      gap/width when hidden, matching the conditional-render behavior.

  - name: inverted
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: top-level-component-split
    note: >
      SUPERSEDED — originally a boolean variant property on one shared component set. Per user
      request (TapTap Button Instance Swap pattern), removed as a variant axis entirely and
      replaced by two separate top-level component sets, `Spinner/Primary` and
      `Spinner/Inverted` — a consumer picks between them via Figma's native Instance Swap, not
      a property toggle. See the "Major structural change" section below for the full rationale
      and migration.

  - name: deactivated
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: excluded
    note: >
      Only stops the Lottie animation from playing; Figma components are static already, so this
      has no distinct visual to represent. Excluded from the Figma mapping — confirmed.

states:
  figmaProperty: null
  options: []
  sources: {}
  note: >
    No pseudo-class states found in spinner.host.scss (:hover/:focus/:active/:disabled/etc.) —
    spinner is non-interactive (role="progressbar"). The "state" collapsing rule in
    CONVENTIONS.md does not apply to this component.

nested: []
# Not a DS component nest (no ds-icon/etc. usage), but the "logo" variation's mark was NOT
# drawn from scratch — it reuses the vector from the existing "Favicon" component set
# (Brand Assets library, componentSetKey 154e52efc75744d5da506ea5d3b4ac86a3f72f75,
# variant "Color=blue - default" / "Color=white - negative"), since that's the same chevron
# glyph as the spinner's animated Lottie mark, matching animation-out-of-scope guidance
# (code-to-figma.md): represent the static brand asset, not the animation.
brandAssetReuse:
  - source: Favicon (Brand Assets library)
    variant: Color=blue - default / Color=white - negative
    note: >
      Only the inner Vector mark was extracted (cloned, detached from the instance) — the
      favicon's own filled background square was discarded. Recolored via setBoundVariable to
      Component/Spinner/Logo/Primary/Color (inverted=false) and Logo/Inverted/Color
      (inverted=true). Sized via setBoundVariable('width'/'height', Logo/Size/MD), which forces
      the mark to a perfect square (~1.007:1 source aspect → 1:1), a negligible difference.
      CORRECTED after initial build: the mark was first sized to literally fill the full
      Logo/Size/MD|SM token (64px/32px edge-to-edge) — wrong. The real Lottie-rendered glyph
      does NOT fill its host div; measured live via Playwright
      (`getBoundingClientRect()` on the rendered SVG `<path>` elements, not static analysis of
      the Lottie JSON, which is a 17-layer masked/keyframed composition too complex to resolve
      analytically) the visible glyph is consistently **86.3%** of the host container at every
      size (55.25/64 = 27.625/32 = 0.863 — a clean proportional ratio, not a fixed pixel
      padding). Fixed structure: the token (`Logo/Size/MD`/`SM`) now binds an invisible "Logo
      Bounds" frame that reserves the real layout footprint (matching how the host div still
      occupies the full token width even though the glyph inside it is visually smaller); the
      mark itself is resized to `resolvedSize * 0.863` and centered (absolute-positioned)
      inside that frame.

tokens:
  - cssVar: --ds-spinner-logo-size-md
    figmaVariable: 🧩 Component/Spinner/Logo/Size/MD
    resolved: true
  - cssVar: --ds-spinner-logo-size-sm
    figmaVariable: 🧩 Component/Spinner/Logo/Size/SM
    resolved: true
  - cssVar: --ds-spinner-circle-size-md
    figmaVariable: 🧩 Component/Spinner/Circle/Size/MD
    resolved: true
  - cssVar: --ds-spinner-circle-size-sm
    figmaVariable: 🧩 Component/Spinner/Circle/Size/SM
    resolved: true
  - cssVar: --ds-spinner-circle-thickness-md
    figmaVariable: 🧩 Component/Spinner/Circle/Thickness/MD
    resolved: true
  - cssVar: --ds-spinner-circle-thickness-sm
    figmaVariable: 🧩 Component/Spinner/Circle/Thickness/SM
    resolved: true
  - cssVar: --ds-spinner-circle-primary-background
    figmaVariable: 🧩 Component/Spinner/Circle/Primary/Background
    resolved: true
  - cssVar: --ds-spinner-circle-primary-progress
    figmaVariable: 🧩 Component/Spinner/Circle/Primary/Progress
    resolved: true
  - cssVar: --ds-spinner-circle-inverted-background
    figmaVariable: 🧩 Component/Spinner/Circle/Inverted/Background
    resolved: true
  - cssVar: --ds-spinner-circle-inverted-progress
    figmaVariable: 🧩 Component/Spinner/Circle/Inverted/Progress
    resolved: true
  - cssVar: --ds-alias-text-family-text
    figmaVariable: 🔗 Alias/🔤 Text/Family/Text
    resolved: true
  - cssVar: --ds-alias-text-line-height-text
    figmaVariable: 🔗 Alias/🔤 Text/LineHeight/Text
    resolved: true
    note: >
      Resolved (150, i.e. 150%) but applied as a LITERAL unbound value, not a live Figma
      variable binding — confirmed via testing that binding a FLOAT variable to lineHeight
      always applies it as PIXELS via the Plugin API, with no way to bind percent semantics.
      See SKILL.md's Phase 3 gotchas.
  - cssVar: null (not read via CSS var — hardcoded in spinner.tsx's getColor() fallback)
    figmaVariable: 🧩 Component/Spinner/Logo/Primary/Color
    resolved: true
    note: >
      Backs the "logo" variation's animation color when inverted=false. FIXED after Phase 4
      quantified the drift: spinner.tsx's getColor() fallback and spinner.data.ts's
      SpinnerAnimationData default parameter both hardcoded #151f6d, which measured as a real
      (if small) visible mismatch against this token's actual value (#000d6e) — not just a
      type-level inconsistency. Both literals corrected to #000d6e. Still a hardcoded hex, not a
      live CSS var read (that would be a larger refactor, out of scope here) — but now at least
      correct and consistent with the token it's meant to represent.
  - cssVar: null (not read via CSS var — hardcoded in spinner.tsx's getColor() fallback)
    figmaVariable: 🧩 Component/Spinner/Logo/Inverted/Color
    resolved: true
    note: 'Same mechanism as above, for inverted=true — was already correct (#ffffff), no fix needed.'
  - cssVar: null (not set anywhere in spinner.host.scss — inherited from ambient page context)
    figmaVariable: 🔗 Alias/🔤 Text/Color/Primary
    resolved: true
    note: >
      Label text color. spinner.host.scss's ::part(label) only sets font-family/line-height,
      never color — shadow DOM inherits color from the light-DOM ancestor in real usage. Bound
      to this system's default text color so the Figma component reflects realistic usage
      rather than Figma's own stale node default (was rendering black).
  - cssVar: null (not set anywhere in spinner.host.scss — inherited from ambient page context)
    figmaVariable: 📱 Device/🔤 Text/Size/Base/Device
    resolved: true
    note: >
      Label font size, same reasoning as text color above — inherited in real usage, not set by
      spinner's own SCSS. Bound to the Device-responsive base text size (mode-based, brand- and
      breakpoint-agnostic per Q13's binding policy).
```

## Resolved decisions

1. **`deactivated` prop** — excluded entirely from the Figma mapping. Confirmed.
2. **`labelPosition` ↔ `label` interaction** — kept as its own variant axis regardless of
   `label` being empty. Confirmed.
3. **`spinner.tsx`'s hardcoded logo color** — flagged during the build as informational
   (`getColor()`'s fallback bypasses the token layer even though matching Figma variables
   exist), then **fixed after Phase 4** quantified it as a real visible mismatch, not just a
   type-level one: `#151f6d` → `#000d6e` in both `spinner.tsx`'s `getColor()` and
   `spinner.data.ts`'s `SpinnerAnimationData` default parameter, matching `Logo/Primary/Color`
   exactly. Still a hardcoded hex, not a live CSS var read — that's a separate, larger refactor
   not attempted here.

Mapping confirmed. Ready for Phase 3.

## Phase 3 progress — complete

- Component set node `1808:77` ("Spinner"), 16 variants, on the `Spinner` page (`1800:5692`) in
  file `NzMFv5HwO14Mmro8bWyvlO`. All 4 variant properties × 2 options each
  (`variation`, `size`, `labelPosition`, `inverted`) = 16 members, every one token-bound per the
  mapping above, label text set to the "Loading..." placeholder on every member (confirmed
  policy: placeholder everywhere, no empty-label member).
- `logo` variation's mark reuses the `Favicon` brand-asset vector (see `brandAssetReuse` above),
  recolored/resized per variant via bound variables.
- `circle` variation's mark is an ellipse ring (stroke bound to `Circle/.../Background`) plus a
  quarter-arc overlay (fill bound to `Circle/.../Progress`, `arcData` computed from the
  resolved size/thickness token values — Figma has no direct "border-top-color" equivalent, so
  this is the closest static approximation of the CSS technique).
- Flagging: `spinner.host.scss`'s label gap (`0.5rem` right / `0.25rem` bottom) is a raw literal
  in code, not bound to any `var(--ds-...)`. No token exists to bind to, so the Figma build
  mirrors it as a hardcoded `8px`/`4px` value rather than inventing a token binding — same "code
  is the source of truth" reasoning as the logo-color fallback noted above. Both are candidates
  for a future code cleanup (introduce real spacing tokens), not something this skill fixes.
- Spot-checked close-ups (bottom-label spacing, `sm` size, `circle` base) all matched
  expectations.

## Phase 4 — Review against visual regression (complete)

- **Step 0 (animated/composite mark size)**: this is what caught the logo-glyph sizing bug
  documented above under "Favisco reuse" — measured the real rendered glyph via Playwright
  against `spinner.visual.html` (`getBoundingClientRect()` on the actual SVG `<path>`s, not the
  static Lottie composition), found 86.3% of the host container rather than the 100%
  edge-to-edge initially built, and fixed all 8 `logo` variants accordingly. This step is why
  Phase 4 step 0 exists in `SKILL.md` at all.
- **Gap spacing** (`0.5rem` right / `0.25rem` bottom): verified live against computed
  `itemSpacing` — 8px/4px, matches code exactly (see note above).
- **`circle` variation, `labelPosition`, `size` scaling**: spot-checked against the
  `spinner-circle-variation`/`spinner-label`/`spinner-sizes` baselines — arc position, label
  placement, and proportional size scaling all consistent with the real component. No further
  findings.

### Full prop sweep — numeric cross-check (complete)

Re-verified every remaining binding against the live dev server with exact values, not visual
impressions:

| Property                  | Live browser                                                                                                                                                                                                            | Figma (resolved)                      | Match                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| Circle track, normal      | `#e8e8e8`                                                                                                                                                                                                               | `#e8e8e8`                             | ✓                                           |
| Circle progress, normal   | `#000d6e`                                                                                                                                                                                                               | `#000d6e`                             | ✓                                           |
| Circle track, inverted    | `#ffffff`                                                                                                                                                                                                               | `#ffffff`                             | ✓                                           |
| Circle progress, inverted | `#000d6e` (same as normal — confirmed intentional: `Circle.Inverted.Progress` and `Circle.Primary.Progress` both resolve to the same `Alias.Text.Color.Primary` alias in `Base.tokens.json`, only `Background` differs) | `#000d6e`                             | ✓                                           |
| Circle size MD / SM       | `24px` / `16px` (CSS `width` property, confirmed `border-box`)                                                                                                                                                          | `24` / `16`                           | ✓                                           |
| Circle thickness MD / SM  | `4px` / `2px` (`border-top-width`)                                                                                                                                                                                      | `4` / `2`                             | ✓                                           |
| Label text color          | `#000d6e`                                                                                                                                                                                                               | `#000d6e`                             | ✓                                           |
| Label font size           | `16px`                                                                                                                                                                                                                  | `16` (`Device/Text/Size/Base/Mobile`) | ✓                                           |
| Label line-height         | `24px` computed (16 × 1.5)                                                                                                                                                                                              | `150%` literal                        | ✓                                           |
| **Logo mark color**       | **`rgb(20,31,108)` ≈ `#141f6c`** (pre-fix)                                                                                                                                                                              | `#000d6e` (`Logo/Primary/Color`)      | **✗ measured mismatch — now fixed in code** |

**Finding, quantified and fixed**: the logo mark's live rendered color (`~#141f6c`, from
`getColor()`'s hardcoded `#151f6d` fallback) didn't exactly match `Logo/Primary/Color`
(`#000d6e`) — a known _type-level_ drift (code bypasses the token layer) that Phase 4 confirmed
was also a small but real _visible_ mismatch, not just a code-cleanliness concern. On request,
fixed directly: `spinner.tsx`'s `getColor()` and `spinner.data.ts`'s `SpinnerAnimationData`
default parameter both corrected from `#151f6d` to `#000d6e`. Still a hardcoded hex rather than
a live CSS var read (a larger refactor, not attempted) — but now numerically correct.

**Methodology note**: initial measurement attempts hit two false leads, both resolved before
trusting the result — (1) circle size appeared inflated (~30px instead of 24px) because the
element was mid-animation-rotation when measured (`getBoundingClientRect()` on a rotated square
returns an expanded axis-aligned bounding box); the actual CSS `width` property confirmed exact.
(2) logo fill initially read as plain black because the query matched an unstyled wrapper
`<path>`/`<g>`, not the colored leaf path with the actual `fill` attribute set by
`lottie-colorify`. Both are recorded in `CONVENTIONS.md` as general measurement pitfalls.

## Documentation presentation (added after initial build, on request)

Beyond the raw 16-member component set, the `Spinner` page has a readable documentation layout,
restyled to match an existing internal reference (card-per-group, not one mega-table). Root
frame `1811:50`:

- **Header**: title "Spinner" (bold, `Alias/Text/Size/4XL`), a "View in Storybook ↗" hyperlink
  (real Figma hyperlink via `setRangeHyperlink`, pointing at
  `https://helvetia-design.vercel.app/?path=/docs/components-indicators-spinner-spinner--spinner&globals=framework:html`),
  and a lead paragraph sourced verbatim from `spinner.tsx`'s own JSDoc comment (code is the
  source of truth for documentation copy too, not just styling).
- **4 rows, one per `variation` × `size` group** (`Logo — sm`, `Logo — base`,
  `Circle — base`, `Circle — sm`), each row holding **2 cards side by side**: normal (left,
  light-grey) and inverted (right, navy background — the card's own background flips rather
  than a backdrop rectangle behind individual cells, a cleaner representation of "inverted" as
  a usage context). Each card has a small grey "→ <label>" eyebrow above it, a bold heading,
  two grey column headers (`Right` / `Bottom` — `labelPosition`; `inverted` is which card
  you're looking at, not a column), and a row of **instances** of the matching component-set
  variant with `Show label` overridden to `true` for readability (the component set's own
  defaults stay `false`, matching code). Card chrome (fill/border, 2px stroke) is literal —
  presentational page chrome, not a component/design token, since no generic "card surface"
  token exists in this system today.
  - **Revision history**: interleaved columns within one card per group → inverted columns
    grouped on the right within one card (divider) → fully separate cards per `inverted` value,
    stacked vertically → final: separate cards, laid out 2-up side by side per group (requested
    layout).
- Inverted cells get a dark backdrop rectangle (bound to `Alias/Text/Color/Primary`, reused
  presentationally — not a real "dark background" token) so the white/inverted mark is visible,
  and their label text is overridden to `Alias/Text/Color/White` instead of the default navy,
  which would otherwise be invisible on the navy backdrop. Both are presentation-only overrides
  on the documentation instances, not changes to the component set itself.

No pseudo-states and no nested components for this component — nothing to resolve there.

## Rebuild — TapTap Design System layout (supersedes the section above)

Per the user's request to apply the same template used for `ds-badge` (see
`badge.figma.md`'s "Major layout rewrite" section for the full rationale), the old
row/card-per-group layout above was replaced. The old `Documentation` frame (`1811:50`) was
deleted entirely and rebuilt from scratch.

**Structure** (one bordered outer frame `1890:58` "Spinner Documentation", "Spinner" label
above it):

- **Header**: "Indicator" kicker / "Helvetia Design System" wordmark, title "Spinner" (bold
  4XL), lead paragraph (verbatim JSDoc, `Alias/Text/Color/Grey`), "View in Storybook ↗" link
  (same URL as before).
- **"👉 Copy me"**: one real instance (`variation=logo, size=base, labelPosition=right,
inverted=false`), `Show label` overridden `true`, text set to "Loading..." — the single
  representative example.
- **"🛠 Variants"**: compact single-axis reference for `labelPosition` (`Right`/`Bottom`),
  chosen because `variation`/`size` are fully covered by the Main components grid below and
  `inverted` gets its own paired tables — `labelPosition` was the one axis left without any
  dedicated representation otherwise.
- **"🔒 Main components"**: **two tables side by side** — "Normal" and "Inverted" — each a
  `variation` (rows: Logo/Circle) × `size` (columns: Base/SM) grid, at `labelPosition=right`.
  This revives the old template's normal/inverted pairing concept, but rebuilt with the new
  TapTap chrome (bordered table, shaded header row/column, visible 1px grid lines, centered
  cells) instead of separate cards. The "Inverted" table's header cells and background use a
  literal dark navy fill (same presentational pattern as before — no generic dark-surface token
  exists). **Every cell is the real master variant** (`COMPONENT_SET` child), not an instance —
  centered precisely via manual `x`/`y` positioning (see `ds-badge`'s equivalent section for why
  Figma's native `GRID` layout mode couldn't be used: `gridRowAnchorIndex`/
  `gridColumnAnchorIndex` are read-only on variant children).
- The 8 `labelPosition=bottom` variants (not shown in any grid) were repositioned to sit below
  the visible grid area (not deleted, not hidden) so the component set's own bounding box stays
  reasonable.

**Z-order pitfall hit (new, not seen on `ds-badge`)**: the real master `COMPONENT_SET` must be
the **last** child of the page for it to render on top of the documentation frame. On this
rebuild it was accidentally left as the **first** page child (a leftover from an earlier
`appendChild` call), which put it fully _behind_ the opaque white/navy documentation frame —
invisible, not just z-fighting. Fixed with `page.appendChild(set)` (moves a child to the end).
Confirm page child order explicitly after any `COMPONENT_SET` manipulation, don't assume append
order from earlier in a multi-step build.

**Known tooling limitation — not a file defect**: `get_screenshot` targeting a nested frame
node (rather than the page itself) unreliably composites cross-branch overlapping content —
confirmed by querying the exact same node immediately afterward and getting byte-identical
cached output across several attempts regardless of real changes made in between.
Page-level screenshots (`nodeId` = the page's own id) proved more reliable, but even then two
of the eight overlaid "Main components" cells (`variation=logo, ..., inverted=true`, both
sizes) intermittently failed to composite in this particular screenshot, despite: position
verified exactly correct via `absoluteTransform` math, fill color confirmed correct (white, as
intended for the inverted mark), `visible: true`/`opacity: 1` confirmed, and the same node
rendering perfectly when screenshotted completely in isolation. Concluded this is a renderer/
compositing-pipeline limitation specific to this tool's thumbnail generation for complex
multi-layer overlapping exports, not a real problem with the Figma file — the file should be
spot-checked visually in the actual Figma app to confirm, since this tool could not fully verify
every cell with certainty.

**Follow-up — removed top-label, added version/timestamp tag.** Removed the "Spinner" label that
sat above the outer frame; replaced with a small right-aligned `version-tag` text in the
top-right corner reading `v0.0.6 - 24.10.2026` (package version from
`packages/core/package.json`, date `DD.MM.YYYY`) — same treatment applied to `ds-badge`/
`ds-icon`.

**Follow-up — page background color.** Same as `ds-badge`: `page.backgrounds` set to literal
solid `#e8e8e8`.

**Follow-up — lead paragraph text color.** Same as `ds-badge`: rebound from
`Alias/Text/Color/Grey` to `Alias/Text/Color/Primary`.

## Follow-up — Inverted frame background token + link styling

User asked for the Inverted frame's background to use a real token instead of the literal/Alias
reuse it had — specifically "blue-6" from the Globals. This system has no color scale literally
named "Blue"; the closest candidates were `Global/Color/Primary/6` (brand navy scale) and
`Global/Color/Sky/6` (a separate lighter blue scale) — asked the user to disambiguate, confirmed
`Primary/6`. Rebound the Inverted frame's fill to `🌐 Global/🌈 Color/Primary/6`.

Also: the "View in Storybook ↗" link inside the Inverted frame (previously still literal link-blue,
low contrast on navy) is now `Alias/Text/Color/White` with a 2px underline
(`setRangeTextDecoration(... , 'UNDERLINE')` + `setRangeTextDecorationThickness(..., {value: 2,
unit: 'PIXELS'})`). The Normal frame's link is unchanged (still literal link-blue, no underline
— good contrast on white).

## Major structural change — split into two top-level components (TapTap Instance Swap pattern)

User referenced the TapTap Design System's Button component (Primary/Ghost/Link/Outline are
**separate top-level components**, swapped via Figma's native "Swap instance" picker, not one
component set with a "style" variant property) and asked for the same structure: `inverted`
removed as a variant property entirely, replaced by **two separate top-level component sets** —
"Spinner/Primary" and "Spinner/Inverted" — each still varying by `variation`/`size`/
`labelPosition` internally. Confirmed via explicit question before proceeding, since this
changes the real master component's structure, not just documentation (`figmaComponentKey` in
this file's YAML is now stale — see below).

**Implementation**:

- Split the original 16-variant set's children into two groups of 8 by their `inverted` value,
  renamed each child to drop `inverted=...` from its name (leaving just `variation=X, size=Y,
labelPosition=Z`), then recombined each group via `figma.combineAsVariants()` into its own set.
- **Hit the same known round-trip naming bug again** (see `CONVENTIONS.md`): recombining left
  children as unparsed `=logo, =base, =right`-style names with no real variant properties
  (`variantProperties: null`). Fixed by renaming each child back to proper `key=value` format —
  this restored `variation`/`size`/`labelPosition` as real variant axes and confirmed `Show
label` survived (new property ID, same behavior).
- Named the two sets **`Spinner/Primary`** and **`Spinner/Inverted`** — the `/` is Figma's own
  naming convention for grouping in the Assets panel and the instance-swap picker (confirmed
  against the TapTap reference, where `Button/Primary`, `Button/Ghost`, etc. group under one
  "Button" category).
- Swapped every instance across both documentation frames (`Copy me`, both `Variants` examples)
  to reference the correct new set via `instance.swapComponent(...)` — Normal frame →
  `Spinner/Primary`'s children, Inverted frame → `Spinner/Inverted`'s children.
- Realigned the Main components overlay in both frames against the correct new set's children
  (each table now shows a `variation` × `size` grid sourced from its own dedicated component
  set, at `labelPosition=right`; the `labelPosition=bottom` variants are parked off-grid in each
  set, same as before).
- Re-locked the 8 `labelPosition=right` overlay variants across both sets (4 each).
- The **old shared 16-variant set (`1808:77`) no longer exists** — confirmed removed, as
  expected, once all its children were reassigned to the two new sets.

**New template rule (added to SKILL.md)**: this supersedes the "two frames sharing one
component set, filtered by `inverted`" approach from the previous follow-up — any component with
a true `inverted`/dark-context axis should have `inverted` **removed as a variant property** and
split into two separate top-level components instead, named `<Component>/Primary` and
`<Component>/Inverted`, to support Figma's native Instance Swap workflow the way TapTap's Button
does.

`figmaComponentKey` note: the YAML header above still lists the old single key — this file needs
a follow-up pass to record both new keys (`1951:20` for Primary, `1951:21` for Inverted) instead
of one.

## Follow-up — Inverted table's data cells were white, not dark

User flagged the "Main components" grid in the Inverted frame as still having white data-cell
backgrounds, clashing with the dark theme. Root cause: the table's own frame fill _was_ already
correctly dark (`🌐 Global/🌈 Color/Primary/6`), but the two row wrapper frames
(`row-logo`/`row-circle`) inside it still had Figma's default white fill — the classic
`createAutoLayout()` white-fill gotcha (see CONVENTIONS.md), missed on this specific table during
the original build since the header row's cells all had explicit dark fills covering it, and the
data cells' own transparency let the row's white show through underneath. Fixed: cleared
`fills = []` on both row frames. Table background is now uniformly dark, matching the rest of
the frame, with the white overlay glyphs clearly visible throughout.

## Follow-up — unused variants cluttering the page below the frames

User flagged that the unused `labelPosition=bottom` variants (parked below the visible frames
after the component split) were still visible as loose debris in the page viewport, inflating
the page's bounding box southward. **Fixed**: moved them to a large _negative_ `y` (`-10000`,
with a 2000px `x` offset between the two sets so they don't overlap each other) — consistent
with the established convention of parking unused/off-grid elements in the negative direction,
same as every other component's off-canvas master-set parking, rather than positive `y` which
just extends the page's visible bounding box downward. Confirmed via a fresh page-level
screenshot: `original_height` dropped back to match just the two frames, no stray content.

## Follow-up — Inverted frame didn't actually show inverted examples (real bug)

User flagged that the Inverted frame's "Copy me" and "Variants" examples were still showing the
**normal** (non-inverted) spinner instance, not an inverted one — and asked the background to be
`Global/Color/Primary/5` instead of `6`.

**Fixed**:

- Rebound the Inverted frame's background to `🌐 Global/🌈 Color/Primary/5`.
- Swapped the "Copy me" instance and both "Variants" example instances
  (`instance.swapComponent(...)`) from the `inverted=false` variant to the matching
  `inverted=true` variant (same `variation`/`size`/`labelPosition`, just the `inverted` axis
  flipped). `swapComponent` preserves existing instance-level overrides (`Show label`, the
  "Loading..." text) — no need to re-apply them.
- **This immediately surfaced a real contrast problem**: with the actual inverted (white) logo
  mark now showing, the surrounding "Copy me" box and "Variants" panel — still light/white from
  the original design — made the white glyph nearly invisible. Re-themed both to a dark fill
  (`🌐 Global/🌈 Color/Primary/6`, one step darker than the frame's own `Primary/5` for subtle
  definition) so the inverted content is actually visible, and recolored the Variants sidebar
  text (axis label, size tags) to white/light-grey.
- **Found and fixed a second, more significant real bug while verifying**: even after swapping
  to the correct `inverted=true` variant and giving it a dark background, the "Loading..."
  **label text itself was still navy/`Primary`-colored**, nearly invisible against the dark box.
  Traced this to the **master component set**: no `inverted=true` variant had ever had its
  `Label` text fill actually set to white — the old (superseded) row/card template only
  corrected this via a one-off instance-level override that doesn't exist anymore, so the real
  defect was silently masked for as long as nothing used the true master `inverted=true`
  variants directly. **Fixed at the source**: recolored the `Label` text to
  `Alias/Text/Color/White` inside all 8 real `inverted=true` master variants — this propagates
  to every instance of them, not just the ones touched here.

This is the same category of finding as earlier Phase 4 work (e.g. the logo hex-color drift) —
a real defect in the master component that documentation-only workarounds had been quietly
hiding. Worth double-checking: **any Figma component with a true `inverted` property should have
its own dark-context styling baked into the master, not patched onto individual instances** —
this `spinner` bug is exactly what happens when it isn't.

## Follow-up — locked the overlaid grid variants

Same as `ds-badge`: locked the 8 `labelPosition=right` variants used across both Main
components grids (`node.locked = true`) so they can't be dragged out of alignment in the Figma
UI. The 8 `labelPosition=bottom` variants (parked, not shown in any grid) were left unlocked.

## Follow-up — split into two separate frames (Normal + Inverted)

User asked to split the single frame's paired Normal/Inverted "Main components" tables into
**two completely separate top-level frames** on the same page, side by side — one "Spinner"
(light theme, Normal table only) and one "Inverted Spinner" (full dark theme, Inverted table
only), each with its own complete Header/Copy me/Variants/Main components structure, not just a
two-table split within one frame.

**Implementation**:

- Cloned the full original outer frame (`outer.clone()`) before splitting either, to get a
  structurally-identical base for both.
- **Original** (`1890:58`): removed the `Inverted col` from `Tables row`, keeping only the
  Normal table. Now effectively a single-table frame.
- **Clone** (`1932:11`, renamed "Inverted Spinner Documentation"): removed the `Normal col`,
  keeping only the Inverted table. Re-themed to dark:
  - Frame fill → `Alias/Text/Color/Primary` (reused presentationally as the dark background,
    same pattern as the inverted table cells already used).
  - Title text → "Inverted Spinner", color → `Alias/Text/Color/White`.
  - Lead paragraph, all three section headings, and divider rules → white.
  - Kicker and wordmark → a dimmer literal light grey (`{0.8, 0.8, 0.85}`) for readability
    against navy, consistent with the existing "column header on dark background" convention.
  - **Not inverted**: the "Copy me" box and "Variants" panel keep their original light/white
    fills and **normal** (non-inverted) spinner instances — only the surrounding frame and
    section chrome went dark, not every example inside it. This matches the user's reference
    mockup, where the light boxes read clearly against the dark frame.
- Positioned the clone to the right of the original (`x: outer.x + outer.width + 40`).
- **Re-ran the real master overlay alignment** against both tables' new `absoluteTransform`
  positions (both shifted — the original's Normal table reflowed after its sibling was removed,
  and the Inverted table moved into an entirely new frame) — same procedure as every prior
  heading/layout-change realignment, confirming the general rule in `CONVENTIONS.md` holds for
  structural changes too, not just font-size changes.

**New template rule (added to SKILL.md)**: any component with a true `inverted`/dark-context
variant property crossed into the Main components grid gets **two separate top-level frames**
side by side, not a single frame with a two-table split — this supersedes the "two tables in one
frame" approach originally used for this same rebuild (see the "Rebuild — TapTap Design System
layout" section above, now partially superseded by this split).

**Follow-up — all borders/dividers to 2px.** Same as `ds-badge`: dividers, grid lines
(`v-line-*`/`h-line-*`), and all frame strokes set to 2px thickness.

**Follow-up — realigned the Main components overlay after the heading font-size change.** Since
the headings live in the same vertical auto-layout stack as the tables below them, changing
their font size changed their height, which shifted the tables' absolute position — but the
overlaid real master variants had their `x`/`y` computed from the _old_ table position, so they
drifted out of alignment. Recomputed and reapplied the same centering logic against the tables'
current `absoluteTransform`. **General lesson**: any layout change above a table/grid in the
same auto-layout stack (heading size, lead paragraph line count, etc.) requires re-running the
overlay alignment step — it is not self-correcting.

**Follow-up — section heading font size.** The "👉 Copy me"/"🛠 Variants"/"🔒 Main components"
headings were bound to `Alias/Text/Size/SM`; rebound to `Component/Heading/Level/1/FontSize`
(28px) to match `ds-badge`, which already used the correct token.

**Follow-up — breadcrumb kicker + AI-review emoji convention.** Same as `ds-badge`: page name and
in-page `kicker` text both set to `⏳ Core / Indicator / Spinner`. See `badge.figma.md` for the
full `⏳`/`✅` human-review convention — never auto-set to `✅`.

**Follow-up — moved the version/timestamp into the header's wordmark slot.** Per user
clarification, removed the standalone floating `version-tag` and instead overwrote the
`wordmark` text node's content (previously "Helvetia Design System") with the version/timestamp
string (`v0.0.6 - 26.10.2026`), same position in the header top bar, same styling.

**Follow-up fix — title size mismatch with `ds-badge`.** The title text's `fontSize` was bound
to `Alias/Text/Size/4XL` (32px) while `ds-badge`'s title was actually bound to a different
token, `Component/Heading/Level/Display1/FontSize` (48px) — a leftover from badge's original
(pre-TapTap) header build. Rebound Spinner's title to the same `Display1` variable so all three
component pages are visually and structurally consistent.

## Major rebuild — Main components split into two titled grids (Logo / Circle)

User asked for the single `variation`(rows: Logo/Circle) × `size`(columns: Base/SM) table to be
replaced with **two separate titled grids**, one per variation — mirroring the per-entity titled
grid pattern just established for `ds-icon`: `variation` name as a heading, then a grid with
`labelPosition` (Bottom/Right) down the rows and `size` (Base/SM) across the columns. Confirmed
this applies to **both** the Normal and Inverted frames before starting.

**Implementation** (applied identically to both frames, against their own component set —
`Spinner/Primary` for the Normal frame, `Spinner/Inverted` for the Inverted frame):

- Cloned the existing, already-proven table chrome (`.clone()` on the single `variation`×`size`
  table — header row, 2×2 cell grid, grid lines, borders) **twice**, once per variation, rather
  than building new chrome from scratch.
- Relabeled each clone's two rows from `Logo`/`Circle` (their old meaning, `variation`) to
  `Bottom`/`Right` (their new meaning, `labelPosition`) — column headers (`Base`/`SM`) stayed
  unchanged, since `size` is still the column axis.
- Added a title text above each cloned table (`Baloise Create Headline` Bold 14px, same navy
  token `VariableID:137:288` already used by the row/column labels) reading `Logo` or `Circle`.
- Replaced "Tables row"'s old single-column content with the two new titled blocks, stacked
  vertically (`VERTICAL` auto-layout, 24px item spacing between blocks).
- Overlaid the **real master variants** into the new grid cells, computed the same way as every
  other overlay in this file (`cell.absoluteTransform` → centered target position → converted to
  set-relative local `x`/`y` since the set itself stays a page-level sibling, not reparented —
  see note below on why the icon-style "sticky reparent" fix doesn't apply here), then locked
  each one.
- **All 8 variants per set are now in active use** — previously only the 4
  `labelPosition=right` variants were shown (the 4 `labelPosition=bottom` variants sat parked at
  `y: -10000`/`-9900`). This rebuild uses every one of the 8, so there's nothing left to park;
  confirmed via a stray-children check (`y < -1000` or `x > 1000`) on both sets — zero remaining.
- Verified via direct position math (`cell.absoluteTransform` vs `variant.absoluteTransform`,
  same technique as every other overlay check in this project) for all 8 cells × 2 frames = 16
  checks — zero problems. `get_screenshot` on the new blocks showed the same known empty-cell
  composite-overlay limitation documented throughout this file and `CONVENTIONS.md` — not a real
  defect, confirmed via the position check instead.

**Why this didn't use the icon-style "sticky" reparent fix**: `ds-icon`'s equivalent fix
(reparenting an entire master set into the one table frame it feeds) works because each icon's
set feeds exactly one grid. Here, a single component set's 8 variants feed **two different**
titled grids within the same frame (4 variants into the Logo table, 4 into the Circle table) — a
set can only be reparented as a whole, so it can't live inside two different table frames at
once. Kept the original page-level-sibling + absolute-coordinate overlay approach instead; this
means a future layout change above these tables will again require re-running the alignment step
(per the existing "recompute overlay after layout change" rule), same as before this rebuild.

### Follow-up fix — component set frame too large, extending past the visible grids

Same root cause as `ds-icon`'s earlier clipping fix, just the opposite symptom: after splitting
into two titled grids spread vertically (Logo table, then Circle table well below it), both
`Spinner/Primary` and `Spinner/Inverted`'s own frames had kept their old bounding box from before
the relayout (`519×533` and `300×200`) — stale and no longer matching the real content spread,
making the purple selection outline balloon out far past the actual grids when selected in
Figma's layers panel.

**Fix**: computed each set's true content bounding box from its own children
(`min(child.x/y)` / `max(child.x + child.width, child.y + child.height)`), shifted all children
so the bounding box starts at `(0,0)` (compensating by shifting the set's own `x`/`y` by the same
amount, so every variant's absolute page position is unchanged), then `set.resize()`'d to the
exact content size. Both sets ended up `178×439`. Verified via the same position-math check used
throughout this rebuild (variant position vs. its grid cell bounds) — zero problems across both
sets — plus a bounds/overflow check confirming the new frame exactly contains its content with no
clipping (`minX/minY: 0`, `maxX/maxY` matching the new frame size exactly).

**Unrelated observation, not acted on**: while rebuilding the Inverted frame's tables, noticed
the frame's own background/text styling currently reads as plain white/navy (matching the Normal
frame), not the dark navy theme described earlier in this file's "Inverted frame background
token" and "Inverted frame didn't actually show inverted examples" follow-ups. Whether this is a
regression from a later edit or an intentional reversion wasn't investigated — out of scope for
this rebuild, which only touched the Main components table structure, not frame-level theming.
Flagging here in case the user wants the dark theme restored or confirmed as intentionally
dropped.

## Follow-up — verified the real Figma file against this record, fixed a drifted overlay, found a new Circle content bug

Prompted by the new Phase 2 "variant grid sketch" guidance added to `SKILL.md` (2 axes → one
grid; 3 axes → repeated titled grids; 4+/structural axes → top-level split), re-verified the live
`⏳ Core / Indicator / Spinner` page against this file's "Major rebuild — two titled grids"
section rather than assuming they still matched.

**Found and fixed**: the "Main components" overlay (real master variants positioned as page-level
siblings over the empty grid cells, per the established non-reparenting approach) had drifted out
of alignment since the last recorded realignment — confirmed by a page screenshot showing the
Logo grid's `Right` row empty on both frames, the `Circle` grid empty on both frames entirely, and
a stray mark bleeding into the `Base` column header. Recomputed each of the 16 variants'
(4 variants × `Spinner/Primary`, `Spinner/Inverted`, `Spinner/Circle`, `Spinner/Circle Inverted`)
target position by centering it in its matching `labelPosition` × `size` cell's
`absoluteTransform`.

**Self-correction worth recording**: the first attempt assigned the computed absolute target
directly to `variant.x`/`variant.y` — wrong, since a `COMPONENT_SET` child's `x`/`y` is local to
its parent set, not page-absolute (unlike the component sets themselves, which _are_ page-level
siblings). This silently moved every variant further off-canvas (e.g. one landed at absolute
`x:2168, y:2184`, nowhere near its frame). A follow-up screenshot appeared to show the Inverted
side rendering correctly regardless — a red herring caused by this file's own previously-documented
`get_screenshot` caching/compositing limitation (same symptom: byte-identical output across a real
change). Trusted the position math (`absoluteTransform` recheck) over the screenshot, caught the
local-vs-absolute bug, redid it by subtracting each parent set's own absolute origin before
assigning, and only then re-screenshotted to confirm. **Lesson for next time**: for a child of a
`COMPONENT_SET` kept as a page-level overlay target, always convert an absolute target position to
set-local coordinates before assignment — don't assume `node.x = absoluteValue` the way it works
for true page-level siblings.

Verified the fix two ways: (1) recomputed `absoluteTransform` on all 16 variants post-move, exact
match to each cell's centered target; (2) a fresh screenshot showing the `Logo` grid fully
populated and correctly cropped on both the `Main`/light and `Inverted`/dark frames. Re-locked all
16 variants once confirmed.

**New, separate, pre-existing bug found (not fixed)**: the `Circle` grid stayed visually empty on
both frames even after the realignment was confirmed correct by position math. Isolated by
screenshotting the `Spinner/Circle` master set directly — it renders as a blank 150×124 PNG.
`get_metadata` on individual variants (e.g. `1808:51`, `1808:46`) shows the `Spinner Circle Mark`
frame inside every `Spinner/Circle` and `Spinner/Circle Inverted` variant is completely empty — no
ellipse-ring or quarter-arc children at all, despite this file's own "Phase 3 progress" section
above describing the circle mark as "an ellipse ring (stroke bound to
`Circle/.../Background`) plus a quarter-arc overlay (fill bound to `Circle/.../Progress`...)".
That geometry does not exist in the file today, in any of the 8 Circle variants (4 normal + 4
inverted). This is unrelated to the overlay/alignment fix above and out of scope for it — flagging
for the user to confirm whether to rebuild the Circle mark's ellipse+arc geometry (would need the
same token resolution discipline as the original Phase 1/3 build, not a quick patch) or whether
something else removed it intentionally.

## Follow-up — rebuilt the Circle mark geometry (ring + quarter-arc), fully token-bound

Rebuilt the empty `Spinner Circle Mark` frame found above, in all 8 `Spinner/Circle` +
`Spinner/Circle Inverted` variants, from the token values already recorded in this file's `tokens`
list — no new tokens invented:

- **`Circle Track`** (background ring): a stroke-only `ELLIPSE`, `strokeAlign: 'INSIDE'`,
  `width`/`height` bound to `Circle/Size/MD` (24) or `/SM` (16) depending on the variant's `size`,
  `strokeWeight` bound to `Circle/Thickness/MD` (4) or `/SM` (2), stroke color bound to
  `Circle/Primary/Background` (normal set) or `Circle/Inverted/Background` (inverted set) via
  `setBoundVariableForPaint`. No fill.
- **`Circle Progress`** (quarter-arc): a fill-only `ELLIPSE` with `arcData = {startingAngle:
-π/2, endingAngle: 0, innerRadius}`, `innerRadius` computed as `1 - 2×thickness/size` (0.667 for
  MD, 0.75 for SM) so the filled donut-segment band matches the ring's stroke width exactly — the
  same "closest static approximation of `border-top-color`" approach this file already documented,
  now actually implemented. Same size binding as the ring; fill color bound to
  `Circle/Primary/Progress` or `Circle/Inverted/Progress`. No stroke.
- Confirmed **`strokeWeight` _can_ bind to a FLOAT variable** via `setBoundVariable('strokeWeight',
...)` — succeeded on all 8 rings, no exception needed (unlike the `lineHeight` percent-semantic
  case elsewhere in this file, which genuinely can't bind).
- Verified every one of the 16 created ellipses' bound-variable IDs, resolved colors, and
  `arcData` directly via `use_figma` reads (not a screenshot) — all correct.

**Tooling gotcha hit twice in this same session, worth a standing warning**: a `use_figma` call
building all 8 variants' geometry reported a hard error (`appendChild: node ... does not exist`),
which per this skill's own rule should mean **no changes were made** — but a follow-up read showed
all 16 ellipses had in fact been created correctly. Separately, a `get_screenshot` taken right
after looked like a severe regression (Primary frame's Logo grid empty, marks floating outside the
table) — but a position-math check showed only a small, real 29px X drift on 4 of the 16
overlay variants (`Spinner/Primary`'s logo variants only; the other 12 were already pixel-exact).
**Net lesson for this file and any future rebuild here: `use_figma`'s reported error/success status
and `get_screenshot`'s visual output are both unreliable signals on this file — always re-verify
real node state (`getNodeByIdAsync` + `absoluteTransform`/`boundVariables`) before trusting either
one**, success or failure. Fixed the 29px drift by reading each variant's actual
`absoluteTransform`, computing the exact delta against its target cell, and nudging only the X
coordinate — re-locked afterward.

Final state, confirmed by position math across all 16 Main-components overlay variants (8 Logo + 8
Circle, across both the `Spinner`/light and `Inverted Spinner`/dark frames): every variant's
`absoluteTransform` matches its target cell's centered position exactly, and the Circle mark now
renders real token-bound geometry instead of an empty frame.

## Follow-up — real data loss from a `use_figma` call, full "Tables row" rebuild, and get_screenshot now considered unreliable for this file

**What happened**: a later `use_figma` call on this same file — intended as a routine re-verification, not a structural edit — left both documentation frames' entire `Tables row` child (the whole Logo/Circle titled-grid structure: headers, cells, dividers, grid lines) deleted, and all 4 `Spinner/*` component sets detached from the page (`parent: null`, still resolvable by ID but orphaned). This is the same atomicity-violation class of bug noted above (`use_figma`'s reported success/failure doesn't reliably reflect what actually happened to the document), now confirmed to cause real structural data loss, not just a cosmetic drift. Caught immediately because the user checked the actual Figma desktop app and saw the grids genuinely missing — screenshots and API reads alone had not surfaced it yet at that point.

**Recovery, with explicit user sign-off on the approach (API reattach + rebuild, not manual undo)**:

1. Re-appended all 4 detached component sets back to the page (`page.appendChild(set)`) — their internal content (variants, the rebuilt Circle mark geometry) was untouched by the detach, only their parenting.
2. Rebuilt `Tables row` from scratch for both frames, reconstructing the exact structure captured earlier in this same file's edit history (header-row/corner/col-header cells, row-bottom/row-right with row-label + data cells, 2px v-line/h-line grid lines) — but instead of guessing colors/fonts, pulled the **real bound variables from surviving sibling nodes already in the file** (divider → `VariableID:137:80`, header/row-label shading → `VariableID:137:409`, navy text → `VariableID:137:288`, Inverted-frame dark preview fill → `VariableID:137:2764`, fonts `Baloise Create Text Bold 12px` for cell labels / `Baloise Create Headline Bold 14px` for block titles), so the rebuild stays visually and structurally consistent with the rest of the page rather than inventing a parallel style.
3. Recomputed and reapplied all 16 overlay positions against the **new** cells' `absoluteTransform` (old cached cell coordinates were invalid once the grid was rebuilt from scratch with new node IDs) and re-locked once verified.

**`get_screenshot` is no longer trustworthy for this file — stop relying on it.** Across this session alone, three separate `get_screenshot` calls against the same, verified-correct document state returned three different, differently-wrong renders (fully populated; completely empty; partially empty in yet another pattern). Meanwhile every direct state check (`getNodeByIdAsync` + `absoluteTransform`, `boundVariables`, `visible`/`opacity`, page z-order) consistently confirmed the document was correct. This is a step beyond the previously-documented "single node screenshot caching" issue — treat **any** `get_screenshot` result on this file as a hint at best, never as confirmation, and verify structural/visual correctness via direct node reads (position math, bound-variable checks, z-order) instead. If a true visual check is ever required, it needs to come from the user opening the file in the actual Figma app, not this tool's render.
