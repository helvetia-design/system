# spinner → Figma mapping

```yaml
figmaComponentKey: '1808:77' # Spinner component set node id, 16 variants, file NzMFv5HwO14Mmro8bWyvlO
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
    figmaProperty: inverted
    figmaPropertyType: boolean

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
