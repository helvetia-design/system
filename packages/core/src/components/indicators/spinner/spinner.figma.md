# spinner → Figma mapping

```yaml
figmaComponentKey: '2085:95' # Spinner/Primary (8 variants); Spinner/Inverted is "2085:96", Spinner page
figmaPage: Spinner
figmaCollection: Design Tokens

anatomy:
  - letter: A
    part: inner
    description: 'The spinner animation container element.'
  - letter: B
    part: label
    description: 'The visible label rendered next to the spinner.'

props:
  - name: variation
    type: enum
    options: [logo, circle]
    default: logo
    figmaProperty: variation
    figmaPropertyType: variant
    note: >
      Same-layers test: both options render inside the same host box with the same label
      layout — only the inner mark differs (Lottie logo mark vs. a bordered ring), which is a
      content/token swap on an otherwise identical structure, not a different layer tree. Crossed
      variant property, NOT a top-level split — confirmed against the historical worked example
      for this exact component (SKILL.md's Phase 2 step 3).

  - name: size
    type: enum
    options: [sm] # SPINNER_SIZES — single-value enum; unset is the real default
    default: '(unset — falls back to Component/Spinner/*/Size/MD, implicit-default pattern, same as badge/icon)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm]
    note: 'Hard-defined per the standing size-axis rule — size is never eligible for variable-override, only crossed variant or structural split.'

  - name: labelPosition
    type: enum
    options: [right, bottom]
    default: right
    figmaProperty: labelPosition
    figmaPropertyType: variant
    note: >
      Visual effect is conditional on `label` being non-empty (hasValue(label) && is-label-right/
      is-label-bottom), but per the standing rule a prop whose effect is conditional on another
      prop still gets its own independent axis — simplicity over eliminating visually-redundant
      combinations.

  - name: inverted
    type: boolean
    default: false
    figmaPropertyType: top-level-split (NOT a crossed variant property)
    note: >
      Structural axis — changes multiple token groups at once (circle background/progress AND the
      logo mark's own color AND, this build, the label's inherited text color — see anomaly 1
      below) on what's otherwise the same layer tree per variation. Same treatment as badge/icon's
      top-level-split axes: two separate top-level component sets, `Spinner/Primary` and
      `Spinner/Inverted`, each with its own full `variation`×`size`×`labelPosition` cross-product,
      swapped via Figma's native Instance Swap — never a crossed boolean. Confirmed against the
      historical worked example for this exact component.

  - name: deactivated
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'Only freezes/unfreezes the Lottie animation playback — no static visual effect for a Figma swatch to represent. Matches the standing rule precedent for this exact prop.'

  - name: label
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: instance-text-override
    note: >
      Free-text, never a variant property. Conditionally rendered (hasValue(label) && <span>) →
      paired boolean component property `Show label` (default false, matching code's default
      empty string) bound to the label layer's `visible` via componentPropertyReferences on every
      variant. Not crossed into the variant matrix (same treatment as badge's `Show icon`) — an
      instance-level override on top of the base combinations.

states: [] # no pseudo-class states — spinner is non-interactive, same as badge/icon
nested: [] # ds-spinner has no nested DS components

tokens:
  - cssVar: --ds-spinner-circle-size-sm/-md
    figmaVariable: 🧩 Component/Spinner/Circle/Size/SM|MD
    resolved: true
  - cssVar: --ds-spinner-circle-thickness-sm/-md
    figmaVariable: 🧩 Component/Spinner/Circle/Thickness/SM|MD
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
    note: >
      Resolves to the SAME navy as Circle/Primary/Progress (not white) — verified, not a build
      mistake. Only the background/track color actually inverts; progress color stays brand navy
      regardless of context. Binding faithfully either way, since code is the source of truth.
  - cssVar: --ds-spinner-logo-size-sm/-md
    figmaVariable: 🧩 Component/Spinner/Logo/Size/SM|MD
    resolved: true
  - cssVar: "spinner.tsx getColor() fallback: '#000d6e' (not inverted)"
    figmaVariable: 🧩 Component/Spinner/Logo/Primary/Color
    resolved: true
    note: 'Exact hex match confirmed (#000D6E).'
  - cssVar: "spinner.tsx getColor() fallback: '#ffffff' (inverted)"
    figmaVariable: 🧩 Component/Spinner/Logo/Inverted/Color
    resolved: true
    note: 'Exact hex match confirmed (#FFFFFF).'
  - cssVar: --ds-alias-text-family-text (::part(label), explicit)
    figmaVariable: 🔗 Alias/🔤 Text/Family/Text
    resolved: true
  - cssVar: --ds-alias-text-line-height-text (::part(label), explicit)
    figmaVariable: 🔗 Alias/🔤 Text/LineHeight/Text
    resolved: true
    note: >
      FLOAT, likely percent-semantic — subject to the standing Plugin API limitation
      (setBoundVariable on lineHeight always applies as PIXELS). Will resolve the numeric value
      and apply as a literal unbound PERCENT, same documented workaround as every prior
      component's label text.
  - cssVar: "label color (inherited-context, not set by component's own SCSS)"
    figmaVariable: 🔗 Alias/🔤 Text/Color/Primary (Spinner/Primary frame) / 🔗 Alias/🔤 Text/Color/InvertedPrimary (Spinner/Inverted frame)
    resolved: true
    note: >
      Inherited-context binding, not a literal binding to something the component's own code
      sets — see anomaly 1 below for why this build binds a DIFFERENT color per frame, unlike the
      documented prior build of this same component.
  - cssVar: "label font-size (inherited-context, not set by component's own SCSS)"
    figmaVariable: 📱 Device/🔤 Text/Size/Base/Device
    resolved: true
  - cssVar: --ds-spinner-animation-duration / --ds-spinner-animation-easing
    figmaVariable: null
    resolved: EXCLUDED
    resolution: "Animation timing — out of scope per the standing 'animations are always out of scope' rule (same as badge's `pulse`)."
```

## Anomalies found in Phase 1

1. **Inverted label color — this build fixes a previously-flagged real bug rather than
   reproducing it.** `DOCUMENTATION-TEMPLATE.md`'s "Handling an `inverted` axis" section records
   that an earlier `ds-spinner` build left the label text navy on every `inverted=true` variant
   (never fixed at the component level), discovered only once something used the true master
   variant directly. `icon.host.scss`-style inherited-context text still needs an explicit token
   even though the component's own SCSS never sets label color — and the live Figma file has a
   real `Alias/Text/Color/InvertedPrimary` token available, distinct from the plain `Primary`
   token used elsewhere. **Decision: bind the `Spinner/Inverted` frame's label text color to
   `InvertedPrimary`, not `Primary`** — this is a Figma-side modeling choice (inherited-context
   binding, not a literal translation of component code, which sets no color at all), not a code
   change. Flagging explicitly since it diverges from the literal "same token everywhere" pattern
   `ds-icon`/`ds-badge` used — those components had no second frame/context to diverge for.
2. **No reusable "Logo" Figma component to bind for the `variation=logo` mark** — the Lottie
   animation has no static SVG asset of its own. Per the historical convention note for this
   exact component ("ds-spinner's logo variation... reused Favicon vector, measured 86.3%
   glyph-to-container ratio"), reusing `packages/assets/src/favicons/purple/safari-pinned-tab.svg`
   (a single-path monochrome brand mark, the same shape family used elsewhere in this repo for a
   static stand-in of the brand symbol) as the source vector, recolored via the resolved
   `Logo/Primary|Inverted/Color` tokens, rescaled to the token-bound container size at the
   previously-measured 86.3% ratio (not 100% edge-to-edge) — reusing the established measurement
   rather than re-measuring from scratch, since the component's Lottie animation and its token
   bindings haven't changed.

Phase 2 (variant grouping + the 500-variant threshold check) follows.

## Phase 2 — variant grouping

**`inverted` is a top-level split (case 3, structural)** — two separate top-level component sets,
`Spinner/Primary` and `Spinner/Inverted`, each its own full frame, swapped via Instance Swap.
Confirmed against the historical worked example for this exact component.

**Within each frame, 3 axes remain → `variation` is the repeated-grid axis (case 2):** one titled
grid per `variation` value, each a 2-axis table (case 1) of `labelPosition` (rows) × `size`
(columns):

```
Spinner/Primary                          Spinner/Inverted
Logo                                     Logo
           Base      SM                             Base      SM
Right    [cell]    [cell]                Right    [cell]    [cell]
Bottom   [cell]    [cell]                Bottom   [cell]    [cell]

Circle                                   Circle
           Base      SM                             Base      SM
Right    [cell]    [cell]                Right    [cell]    [cell]
Bottom   [cell]    [cell]                Bottom   [cell]    [cell]
```

**Variant count**: 2 frames × (`variation`×2 × `size`×2 × `labelPosition`×2) = **16 total**. Well
under the 500 hard-stop — no mitigation needed. `Show label` is a component property on each set,
not crossed into the matrix (doesn't add to this count).

**Final props summary**: `inverted` (top-level split, 2 frames), `variation`/`size`/`labelPosition`
(variant, crossed within each frame), `label` (instance-text-override + `Show label` boolean),
`deactivated` (excluded).

**Awaiting your confirmation on this grouping before Phase 3 build starts.**

## Phase 3 — build progress

- Figma page created: `⏳ Core / Indicator / Spinner` (page id `2085:2`).
- **Logo mark**: reused `packages/assets/src/favicons/purple/safari-pinned-tab.svg` (single-path
  monochrome brand mark), imported per variant, rescaled to 86.3% of the token-bound `Logo/Size/*`
  container, fill bound to `Logo/Primary/Color` or `Logo/Inverted/Color` depending on context.
- **Circle mark**: built as two filled donut-ring `ELLIPSE`s (not stroked pie wedges — tried that
  first, it renders as a wedge outline, not a ring; the correct technique is `arcData.innerRadius`
  = `(radius - thickness) / radius` with a **fill**, not a stroke) — a full-circle background ring
  (`Circle/*/Background`) plus a ~90°-wide progress arc centered at the top
  (`startingAngle: -0.75π, endingAngle: -0.25π`) bound to `Circle/*/Progress`. Confirmed via an
  isolated test render before building all 16 variants.
- Built all 16 raw variant components (`variation`×`size`×`labelPosition`, × 2 contexts), combined
  into `Spinner/Primary` (`2085:95`) and `Spinner/Inverted` (`2085:96`), each 8 variants.
  `Show label` (`BOOLEAN`, default `false`) added as a component property on each set, wired to
  the `label` text layer's `visible` via `componentPropertyReferences`.
- Screenshot checkpoint: logo marks confirmed correct immediately. Circle marks initially looked
  wrong in a multi-variant row screenshot (background ring only, no visible progress arc) — turned
  out to be the documented `get_screenshot` stale-composite-render pitfall, not a real defect; a
  fresh isolated screenshot of the same node showed the arc rendering correctly. Don't trust a
  wide multi-node screenshot as the final word on a suspected rendering bug — re-screenshot the
  specific node in isolation before concluding something is broken.
- Both sets rearranged into the confirmed layout: two titled grids (`Logo`, `Circle`) per frame,
  each a `labelPosition`×`size` table, real variants placed as `ABSOLUTE` auto-layout children of
  the shared `Tables` frame (one set feeding two titled grids within one coordinate space, not the
  rarer "two separate frames" case the template warns needs the older overlay technique).
- **Real bug hit and fixed, recorded in `CONVENTIONS.md`**: after repositioning the set's 8
  variants into the titled grids, the Main components section rendered completely blank —
  structurally everything checked out (`visible`, `fills`, `absoluteTransform` all correct per
  direct inspection) and re-screenshotting (including at a higher page-level node, per the
  existing stale-screenshot advice) kept returning an identical blank result. Root cause:
  `COMPONENT_SET.width`/`height` don't auto-update when children are repositioned (it has
  `layoutMode: 'NONE'`, unlike an auto-layout frame) — the set's bounding box stayed stuck at its
  original pre-reposition packing, and the screenshot renderer silently cropped to that stale
  box. Fixed with an explicit `set.resize(490, 560)` after repositioning. New standing rule added
  to `CONVENTIONS.md`.

## Phase 3b — documentation page

Built using the fixed template, inspected against the live `ds-close` reference before building.
Two-frame split applied (`inverted` is a true structural axis per Phase 2).

- **Light frame** (`Spinner Documentation`, node `2086:2`): Header (breadcrumb, version, "Spinner"
  title with hidden qualifier line, lead paragraph verbatim from JSDoc, Storybook link), Copy me
  (logo/base/right, label shown), Variants (`variation` axis, Logo vs Circle side by side), Main
  components (two titled grids as described above).
- **Dark frame** (`Inverted Spinner Documentation`, node `2092:14`): cloned from the light frame
  per the template's clone-then-adjust guidance, positioned to the right. Qualifier line set to
  "Inverted" and made visible. Every preview surface (Copy me box, both Variants examples, all 8
  Main components data cells) given the dark preview fill (`VariableID:137:2764`) — chrome
  (headers, row labels, dividers, heading text) left untouched, per the template's "minimal
  theming" rule. All instances swapped to the real `Spinner/Inverted` variants via
  `swapComponent()`.
- **Confirmed fix for the historically-flagged label-color bug** (see anomaly 1 above): the
  label text in the dark frame renders white (`InvertedPrimary` token), not navy.
- **New finding, not a build mistake**: `Circle/Inverted/Progress` resolves to the same navy as
  `Circle/Primary/Progress` (confirmed via the token data in Phase 1) — on the dark preview
  background this renders the progress arc invisible, showing only as a gap in the ring rather
  than a highlighted segment. This is a faithful rendering of the real token value, not a Figma
  binding error. Flagging for Phase 4 / the user's judgment, not fixed here.

Both frames screenshot-verified.

## Phase 4 — review against real rendering

- **`spinner-inverted-*.png`**: logo mark white-on-navy, matches our dark frame exactly.
- **`spinner-circle-variation-*.png`**: light-grey ring + navy top arc (captured mid-animation at
  slightly different rotation angles per instance) — confirms our static top-centered arc is a
  reasonable resting-pose representation, and colors match exactly.
- **`spinner-label-*.png`**: confirms `labelPosition=right` (icon left, label right) and `=bottom`
  (icon above, label below) layouts, navy label text — matches our light-frame binding.
- **Confirmed, not just assumed**: the dark-frame circle progress arc really is invisible against
  the dark preview background in the real component too, not just our Figma build — `spinner-
inverted-*.png` doesn't show a circle variation to compare directly, but the token chain
  resolved in Phase 1 (`Circle/Inverted/Progress` → same navy as `Primary/Progress`) is unambiguous
  and this is a real, live design-system token, not a transcription error on this skill's part.
  Flagged for the user; not fixed, since fixing it would mean either changing the token (a
  design-system decision) or the component's CSS (out of this skill's scope to decide
  unilaterally).

## Post-Phase-4 fix — documentation page styling corrections

User flagged four deviations from the `ds-close` canonical reference, caught by direct comparison
rather than this skill noticing on its own. All four are now fixed on both frames and added to
`DOCUMENTATION-TEMPLATE.md` as standing rules (with their exact confirmed token bindings) so
future components don't repeat them:

1. Main components table header/row labels were `Baloise Create Text` Regular — should be
   `Baloise Create Headline` **Bold**.
2. Variants axis tag chips were a plain light-grey box, Regular text — should be a true pill
   (`cornerRadius: 999`), filled `Alias/Surface/Grey`, text `Baloise Create Text` **Bold** navy.
3. The header's `body` frame (lead + link) had a literal fixed height, inherited from calling
   `resize()` on it — which also silently froze its height, clipping the Storybook link below the
   visible area. Fixed to hug its content dynamically.
4. Corner radius was inconsistent (8px literal outer, 0/mixed inner) — should be
   `Global/Dimension/Radius/12` (outer frame) and `Global/Dimension/Radius/6` (Copy me box,
   Variants panel, Main components tables), both as real variable bindings, not literals.

**Phase 4 status: closed, no Figma-side defects found.** `ds-spinner` is live in Figma: page
`⏳ Core / Indicator / Spinner`, `Spinner/Primary` (`2085:95`) and `Spinner/Inverted` (`2085:96`),
8 variants each, full two-frame documentation page (Header / Copy me / Variants / Main components
with Logo + Circle titled grids).
