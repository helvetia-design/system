# pagination → Figma mapping

```yaml
sets: # filled in by Phase 3 — one entry per component set (top-level split), default set first.
  - name: Pagination # default set — numbered pages + ellipsis; axes: size(2) x disabled(2) = 4 variants (renamed from Pagination/Default 11.11.2026)
    figmaComponentKey: 'c799bf8d0a3f4d922d5cce3af824119689f6c079'
    figmaMasterNodeId: '4407:292'
  - name: PaginationDots # dots variant — counter badge ("value / totalPages"); axis: disabled(2) = 2 variants (renamed from Pagination/Dots)
    figmaComponentKey: '0d72810c3321cf62bedc8193ed4a00011c6e8d80'
    figmaMasterNodeId: '4407:293'
  - name: PaginationDotsRow # dots variant — ≤5-page circular dot markers; axis: disabled(2) = 2 variants (renamed from Pagination/DotsRow)
    figmaComponentKey: '87210f2e1237e766bde4c5024ce9c88321046962'
    figmaMasterNodeId: '4430:1316'
figmaPage: Core / Navigation # page id 4401:2
figmaDocFrameNodeId: '4401:6' # "Pagination Documentation" frame

anatomy:
  # @part JSDoc was stale (declared `pagination`/`item`, matching nothing in render()) — fixed in
  # pagination.tsx to the 6 real part attributes below, confirmed with the user before continuing.
  - letter: A
    part: navigation
    description: 'The nav landmark wrapping all pagination controls.'
  - letter: B
    part: previous
    description: 'The button that navigates to the previous page.'
  - letter: C
    part: next
    description: 'The button that navigates to the next page.'
  - letter: D
    part: list
    description: 'The list containing the page and ellipsis items.'
  - letter: E
    part: page
    description: 'Each page number button.'
  - letter: F
    part: ellipsis
    description: 'The ellipsis item shown when pages are collapsed.'

props:
  - name: align
    type: enum
    options: [start, end] # PAGINATION_ALIGNMENTS — implicit unset default is center
    default: '(unset — center)'
    figmaProperty: align
    figmaPropertyType: variant
    figmaOptions: [center, start, end]
    note: 'Layout-only — justify-content on #nav. No geometry change, just position within the host.'
  - name: disabled
    type: boolean
    default: false
    figmaProperty: disabled
    figmaPropertyType: 'variant false/true (component state, blocked — :host(.is-disabled) pointer-events: none, pagination.host.scss:89); migrated 11.11.2026, was an option of `state`'
    note: 'Removes previous/next buttons entirely (not just disables them) and routes :host(.is-disabled) color to the ellipsis. See anatomy note on structural removal in Phase 2.'
  - name: label
    type: string
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'aria-label only on the nav landmark — no visual effect, not modeled.'
  - name: pageRange
    type: number
    default: 2
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'Controls how many page buttons generatePaginationControl() emits — content-selection, not a visual property. The default/5-total-pages case is what Figma shows (see Phase 2).'
  - name: size
    type: enum
    options: [sm] # PAGINATION_SIZES
    default: '(unset — base)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm]
  - name: sticky
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'No visual.html test case (unmeasured) and no static visual effect in an isolated swatch — position: sticky only matters in a scrolling page context.'
  - name: textNext
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: instance-text-override (aria-label/title only — no visible text node)
  - name: textPrevious
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: instance-text-override (aria-label/title only — no visible text node)
  - name: top
    type: number
    default: 0
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'Raw consumer px passed straight to el.style.top when sticky — a runtime position override, not a design token. Never modeled.'
  - name: totalPages
    type: number
    default: 1
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'Drives generatePaginationControl() content, not geometry — content-selection, see Phase 2.'
  - name: value
    type: number
    default: 1
    figmaProperty: null
    figmaPropertyType: 'drives which page button is `is-active` — modeled via state, not its own axis'
  - name: variant
    type: enum
    options: [dots] # PAGINATION_VARIANTS
    default: '(unset — numbered pages)'
    figmaProperty: variant
    figmaPropertyType: top-level-split (structural — different child shapes, not just token swaps)
    figmaOptions: [base, dots]

states: none # the pagination has no interaction states of its own — hover / active live on its nested Button instances, which carry their own reactions. No `state` axis since 11.11.2026; no reactions on Pagination.
componentStates:
  disabled: { figmaProperty: disabled, options: [false, true], interactive: false, source: 'disabled prop — removes previous/next buttons; :host(.is-disabled) pointer-events: none, ellipsis recolored (pagination.host.scss:89–94)' }
# The current page (value === pageNumber) is shown by the nested Button's color (primary vs ghost), not a Pagination state.

nested:
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: '2056:8249'
    # 10.11.2026: no Icon wrapper instance any more — the caret glyph sits directly in the new
    # `Button` set's icon slot, set via its `icon` INSTANCE_SWAP property (caret-left 2053:34 /
    # caret-right 2053:37); glyph fill bound to the button's label text color variable.
    iconSlot:
      codeProp: '(fixed — not a public prop; hardcoded name="caret-left"/"caret-right" per button)'
      acceptsBrandIcon: false
      size: 'fixed sm'
      color: 'unset → default primary'
      state: 'disabled follows the parent button disabled condition (value < 2 / value === totalPages)'
    usedFor: [previous, next]
  - childTag: '(style-forward reuse, not a literal <ds-button> instance)'
    childMappingFile: ../../actions/button/button.figma.md
    figmaComponentKey: '8956ebb803a4c6fe3749f84119915335d0d43ade (Button set, nodeId 4594:1327)'
    # 10.11.2026: moved from the deprecated `_Button/Primary` set (3048:2541, key
    # c2100dbfe5316a49d985bb57ff23d93595bbc1b3) to the new `Button` set. Variant order is now
    # `size, color, state`; props `label` / `show icon` / `show icon right` / `icon` / `icon right`.
    usedFor: [previous, next, page]
    note: >
      pagination.host.scss does `@forward '../../actions/button/button.style.scss'` and the
      previous/next/page <button>s apply `.ds-button.is-square` classes directly — no <ds-button>
      custom element is ever instantiated. For the Figma build this should still be realized as
      INSTANCEs of the existing Button set (size=base|sm, color=ghost|primary,
      state=default|disabled, square via padding-x/gap → 0) rather than redrawn from scratch, per the "reuse existing resources"
      rule. color=ghost for inactive pages and previous/next; color=primary for the active page.

tokens:
  - cssVar: --ds-pagination-size-base-gap
    figmaVariable: 🧩 Component/Pagination/Size/Base/Gap
    figmaVariableId: VariableID:137:2324
    resolved: true
  - cssVar: --ds-pagination-size-sm-gap
    figmaVariable: 🧩 Component/Pagination/Size/SM/Gap
    figmaVariableId: VariableID:137:2323
    resolved: true
  - cssVar: --ds-pagination-disabled-color
    figmaVariable: 🧩 Component/Pagination/Disabled/Color
    figmaVariableId: VariableID:137:2325
    resolved: true
  - cssVar: --ds-pagination-elevation-sticky
    figmaVariable: 🧩 Component/Pagination/Elevation/Sticky
    figmaVariableId: VariableID:137:2322
    resolved: true
    note: 'No visual.html test case for sticky — token resolved but unmeasured; excluded from specs (behavior/positioning, not geometry).'
  - cssVar: --ds-pagination-dots-radius
    figmaVariable: 🧩 Component/Pagination/Dots/Radius
    figmaVariableId: VariableID:137:2317
    resolved: true
  - cssVar: --ds-pagination-dots-color-background
    figmaVariable: 🧩 Component/Pagination/Dots/Color/Background
    figmaVariableId: VariableID:137:2320
    resolved: true
  - cssVar: --ds-pagination-dots-color-inactive
    figmaVariable: 🧩 Component/Pagination/Dots/Color/Inactive
    figmaVariableId: VariableID:137:2321
    resolved: true
  - cssVar: --ds-pagination-dots-color-active
    figmaVariable: 🧩 Component/Pagination/Dots/Color/Active
    figmaVariableId: VariableID:137:2319
    resolved: true
  - cssVar: --ds-pagination-dots-gap
    figmaVariable: 🧩 Component/Pagination/Dots/Gap
    figmaVariableId: VariableID:137:2318
    resolved: true
    note: >
      Resolves to Alias/Space/Gap/3XS = 2px. CODE FINDING (not fixed here): on the ≤5-page dot row
      (<ul part="list" class="dots">), the base `#nav ul { gap: var(--_pagination-gap); }` rule (ID
      selector) out-specifies `.dots { gap: var(--_pagination-dots-gap); }` (class selector), so
      the dot row actually renders at the 8px base/sm gap, never this token's 2px. Only the
      many-page counter (<span class="dots">, not a `ul`) is outside the `#nav ul` selector and
      renders the real 2px. Figma models the real rendered output for both (8px dot row / 2px
      counter), per user decision — flagged as a separate CSS-specificity bug to fix in code.
  - cssVar: --ds-alias-text-weight-bold
    figmaVariable: 🔗 Alias/🔤 Text/Weight/Bold
    figmaVariableId: VariableID:137:286
    resolved: true
    note: 'Correctly used by `.dots strong` (the counter numerator). NOT used by #ellipsis, which hardcodes font-weight:700 instead — see the literal entry below for that drift.'
  - cssVar: '(literal 700, #ellipsis font-weight)'
    figmaVariable: 🔗 Alias/🔤 Text/Weight/Bold
    figmaVariableId: VariableID:137:286
    resolved: true
    note: 'Per user decision: bind the Figma visual to the matching Bold token (same value); flag the code drift (should use var(--ds-alias-text-weight-bold) like `.dots strong` does) as a separate follow-up, not fixed here.'
  - cssVar: '(literal 2rem/3rem, #ellipsis width — base + @include tablet + is-size-sm override)'
    figmaVariable: [🌐 Global/📏 Dimension/Space/32, 🌐 Global/📏 Dimension/Space/48]
    figmaVariableId: [VariableID:137:2663, VariableID:137:2665]
    resolved: true
    note: >
      No --ds-* var exists at all — raw rem literals. Per user decision, bind to the Global Space
      scale values that exactly match the literal math (2rem=32px, 3rem=48px) rather than invent a
      new token now; flagged as a missing-dedicated-token follow-up. See device: below.
  - cssVar: '(literal 0.625rem/10px, dot marker width/height — dots variant)'
    figmaVariable: null
    figmaVariableId: null
    resolved: false
    resolution: >
      HARD STOP resolved with user: no --ds-* var, and no Figma variable matches 10px (Global Space
      scale jumps 8→12). Accepted as a one-off hardcoded 10px in the Figma build; flagged as a
      token-scale gap for a separate follow-up.
  - cssVar: '--ds-pagination-dots-min-width / --ds-pagination-dots-max-width (dots badge min-width/max-width — dots variant, >5 total pages)'
    figmaVariable: null
    figmaVariableId: null
    resolved: false
    resolution: >
      16.11.2026: promoted from raw literals to real tokens (🔗 Alias/📏 Size/Counter/MinWidth
      and /MaxWidth, backed by new 🌐 Global/📏 Dimension/Size/63 and /88 scale steps — neither
      value is grid-aligned, so no existing scale step fit). No Figma variable exists yet for
      the new scale steps or the Alias/Component tokens (PENDING-FIGMA-SYNC); bind on next sync.
  - cssVar: '(literal 2rem, dots badge min-height — dots variant)'
    figmaVariable: 🌐 Global/📏 Dimension/Space/32
    figmaVariableId: VariableID:137:2663
    resolved: true
  # Inherited-context text-attribute bindings (step 3) — not set by pagination's own code,
  # shared by #ellipsis and the .dots counter's non-bold spans:
  - cssVar: '(inherited font-family — #ellipsis, .dots counter)'
    figmaVariable: 🔗 Alias/🔤 Text/Family/Text
    figmaVariableId: VariableID:137:279
    resolved: true
    note: 'Inherited-context binding.'
  - cssVar: '(inherited font-size — #ellipsis, .dots counter)'
    figmaVariable: 📱 Device/🔤 Text/Size/Base/Device
    figmaVariableId: VariableID:137:805
    resolved: true
    note: 'Inherited-context binding; mode-based (Design Responsive Tokens collection).'
  - cssVar: '(inherited line-height — #ellipsis, .dots counter)'
    figmaVariable: 🔗 Alias/🔤 Text/LineHeight/Text
    figmaVariableId: VariableID:2826:9940
    resolved: true
    note: 'Inherited-context binding.'
  - cssVar: '(inherited letter-spacing — #ellipsis, .dots counter)'
    figmaVariable: 🔗 Alias/🔤 Text/LetterSpacing/Text
    figmaVariableId: VariableID:2826:9941
    resolved: true
    note: 'Inherited-context binding.'
  - cssVar: '(inherited text-decoration — #ellipsis, .dots counter)'
    figmaVariable: 🔗 Alias/🔤 Text/TextDecoration/None
    figmaVariableId: VariableID:2826:9943
    resolved: true
    note: 'Inherited-context binding.'
  - cssVar: '(inherited color, non-disabled — #ellipsis, .dots counter)'
    figmaVariable: 🔗 Alias/🔤 Text/Color/Primary
    figmaVariableId: VariableID:137:288
    resolved: true
    note: 'Inherited-context binding. Confirmed via browser measurement: rgb(0,13,110), matching this token.'

device: # responsive binding — #ellipsis width only
  - responsiveBindings:
      cssVar: '(literal, no --ds-* name — see tokens: entry above)'
      routingVariable: 🧩 Component/Pagination/Ellipsis/Width/Device # VariableID:4405:2 — created in Phase 3 (Design Responsive Tokens collection), hand-made (no --ds-* source to sync from)
      modes:
        mobile: 🌐 Global/📏 Dimension/Space/32 # #ellipsis base rule, no mobile override in code
        tablet: 🌐 Global/📏 Dimension/Space/48 # @include tablet { width: 3rem }
        desktop: 🌐 Global/📏 Dimension/Space/48 # falls through to tablet's value — no @include desktop override
      sizeSmOverride: 🌐 Global/📏 Dimension/Space/32 # :host(.is-size-sm) #ellipsis — flat 32px at every breakpoint, overrides the device routing variable entirely when size=sm
      risk: 'Hand-created, not emitted by scripts/figma-sync — see examples/mapping-file-format.md risk note for the same caveat on logo-style routing variables.'

completenessChecklist:
  navigation (frame):
    layout: flex row, centered, gap → device: n/a, Pagination/Size/<tier>/Gap (items: inner spacing row)
  previous / next / page (ds-button instances):
    all geometry/color owned by ds-button's own Button set — see nested: above
  list (frame):
    gap: Pagination/Size/<tier>/Gap
  ellipsis (text):
    width: device: binding above
    height: derived from line-height (24px) — not a separate token
    fontWeight: literal 700 → Alias/Text/Weight/Bold (drift flagged)
    family / size / lineHeight / letterSpacing / decoration: inherited-context bindings above
    color: Alias/Text/Color/Primary; disabled → Pagination/Disabled/Color
  dots badge (frame, dots variant):
    fill: Pagination/Dots/Color/Background
    radius: Pagination/Dots/Radius
    minWidth / maxWidth: Pagination/Dots/MinWidth / MaxWidth (PENDING-FIGMA-SYNC)
    minHeight: Global/Space/32
    gap: Pagination/Dots/Gap (2px) for both the counter and the dot row (specificity bug fixed 16.11.2026) — see tokens: note
    margin: literal `0 20px 0 !important` — outer margin, skipped per specs rule, flagged as a code smell (odd 3-value shorthand)
  dot marker (shape, dots variant, ≤5 total pages):
    size: hardcoded 10px (accepted, no token)
    radius: 50% — skipped per "no radius on a circle" rule
    fill: Pagination/Dots/Color/Inactive; active → Pagination/Dots/Color/Active
  counter (text, dots variant, >5 total pages):
    strong (value): bold via --ds-alias-text-weight-bold (correctly tokenized, no drift)
    slash + totalPages spans: inherited-context text defaults above

specs:
  drawnOption: base
  options: [base, sm] # canonical order; no `lg` — PAGINATION_SIZES only defines `sm`
  rows:
    - property: Gap
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: pagination.host.scss:20,101
      values:
        base: { px: 8, token: 🧩 Component/Pagination/Size/Base/Gap }
        sm: { px: 4, token: 🧩 Component/Pagination/Size/SM/Gap }
    - property: Height
      kind: size
      group: derived
      show: drawn
      instance: main
      source: '(derived from reused ds-button square size)'
      reason: 'Exception to the default derived→skip rule: this is the control''s own visible footprint, the number a designer laying out a page looks for.'
      values:
        base: { px: 48 }
        sm: { px: 32 }
    - property: Button radius
      kind: shape
      group: fixed
      show: skip
      reason: 'Owned and already documented by ds-button''s own Specs page — redundant to redraw here.'
      source: button.host.scss (see button.figma.md)
      values:
        base: { px: 4, token: 🧩 Component/Button/Size/Base/Radius }
        sm: { px: 4, token: 🧩 Component/Button/Size/SM/Radius }
    - property: Dot size
      kind: size
      group: fixed
      show: skip
      reason: 'Belongs to PaginationDots, a separate top-level split COMPONENT_SET — Specs documents the default Pagination set only (PHASE-8 rule, same treatment as an excluded Inverted split). Confirmed with user 05.11.2026.'
      instance: dots
      source: pagination.host.scss:154-155
      values:
        base: { px: 10, token: null, note: 'hardcoded — no matching token, accepted per user decision' }
    - property: Min/Max width (dots badge)
      kind: size
      group: limit
      show: skip
      reason: 'PaginationDots set — excluded from Specs, see Dot size row above.'
      instance: dots-badge
      source: pagination.host.scss:130-131
      values:
        base: { px: { min: 63, max: 88 }, token: null, note: 'hardcoded — no matching token, accepted per user decision' }
    - property: Min height (dots badge)
      kind: size
      group: limit
      show: skip
      reason: 'PaginationDots set — excluded from Specs, see Dot size row above.'
      instance: dots-badge
      source: pagination.host.scss:132
      values:
        base: { px: 32, token: 🌐 Global/📏 Dimension/Space/32 }
    - property: Gap (dots row, ≤5 pages)
      kind: spacing
      group: inner spacing
      show: skip
      reason: 'PaginationDots set — excluded from Specs, see Dot size row above.'
      instance: dots-badge
      source: pagination.host.scss:140 (bug: overridden by #nav ul, see tokens: note)
      values:
        base: { px: 8, token: 🧩 Component/Pagination/Size/Base/Gap, note: 'measured≠intended-token finding — see tokens: note' }
    - property: Gap (counter, >5 pages)
      kind: spacing
      group: inner spacing
      show: skip
      reason: 'PaginationDots set — excluded from Specs, see Dot size row above.'
      instance: counter
      source: pagination.host.scss:140
      values:
        base: { px: 2, token: 🧩 Component/Pagination/Dots/Gap }
    - property: Dots badge radius
      kind: shape
      group: fixed
      show: skip
      reason: 'PaginationDots set — excluded from Specs, see Dot size row above.'
      instance: dots-badge
      source: pagination.host.scss:135
      values:
        base: { px: 4, token: 🧩 Component/Pagination/Dots/Radius }
    - property: Dot radius
      kind: shape
      group: fixed
      show: skip
      reason: 'Radius ≥ half the shape''s own size (50% circle) — skipped per "no radius on a circle or pill" rule.'
      values:
        base: { px: 5 }
    - property: Ellipsis width
      kind: size
      group: context-dependent
      show: drawn
      instance: main
      source: pagination.host.scss:69-76,103-106
      values:
        base: { px: { mobile: 32, tablet: 48, desktop: 48 }, token: 🧩 Component/Pagination/Ellipsis/Width/Device }
        sm: { px: 32, token: 🌐 Global/📏 Dimension/Space/32, note: 'size=sm overrides the device binding flat at every breakpoint' }
    - property: Type (ellipsis)
      kind: type
      group: typography
      show: drawn
      instance: main
      source: pagination.host.scss:71 (weight literal) + inherited defaults
      values:
        base: { px: 16, token: 📱 Device/🔤 Text/Size/Base/Device, weight: 700 (→ Alias/Text/Weight/Bold, drift flagged), lineHeight: 24, family: BaloiseCreateText }
    - property: Type (counter)
      kind: type
      group: typography
      show: skip
      reason: 'PaginationDots set — excluded from Specs, see Dot size row above.'
      instance: counter
      source: 'inherited defaults + --ds-alias-text-weight-bold (strong only, correctly tokenized)'
      values:
        base: { px: 16, token: 📱 Device/🔤 Text/Size/Base/Device, weight: '400 (slash/total) · 700 via Alias/Text/Weight/Bold (value)', lineHeight: 24, family: BaloiseCreateText }
    - property: Dots badge margin
      kind: spacing
      group: outer margin
      show: skip
      reason: 'margin on the dots badge — layout''s job, reported as a code smell (`0 20px 0 !important`, odd 3-value shorthand).'
      values:
        base: { px: 20 }
    - property: Sticky elevation
      kind: size
      group: behavior
      show: skip
      reason: 'Positioning behavior (z-index when sticky), not a static geometry value; no visual.html test case either (unmeasured).'
      values:
        base: { token: 🧩 Component/Pagination/Elevation/Sticky }
```

## Notes

- **Anatomy JSDoc hard stop — resolved.** The class-level `@part` tags (`pagination`, `item`)
  matched zero real `part="..."` attributes in `render()`. Fixed in `pagination.tsx` to the 6 real
  parts (`navigation`, `previous`, `next`, `list`, `page`, `ellipsis`), confirmed with the user.
- **Two genuine token hard stops.** The dot marker's 10px diameter is still accepted as a one-off
  hardcoded value (no scale step fits). The dots badge's 63px/88px min/max-width was promoted
  16.11.2026 to real tokens (new Global scale steps 63/88 → Alias `Size/Counter/MinWidth`/
  `MaxWidth` → Component `Pagination/Dots/MinWidth`/`MaxWidth`); no Figma variable exists for them
  yet (PENDING-FIGMA-SYNC) — bind on the component's next Figma run.
- **CSS specificity bug — fixed 16.11.2026.** `--ds-pagination-dots-gap` (2px) was dead on the
  ≤5-page dot row because `#nav ul`'s ID-selector gap rule out-specified the class-selector
  `.dots` rule. Fixed by adding `!important` to the `.dots` gap declaration in
  `pagination.host.scss` (consistent with the other `!important` overrides already on that same
  rule). The dot row now renders the intended 2px gap instead of the inherited 8px — Figma
  previously modeled the wrong (8px) rendered gap for this case and needs re-measuring/re-binding
  on the component's next Figma run. Visual snapshots for the dot-row test cases need
  `/update-screenshots`.
- **Ellipsis font-weight and width are hardcoded literals with no `--ds-*` var at all.** Both have a
  matching Figma variable anyway (`Alias/Text/Weight/Bold`; `Global/Space/32`+`/48`), so per Phase 1
  step 5 these are bound for the Figma visual with the code-side drift flagged as separate
  follow-ups, not fixed here.
- **`previous`/`next`/`page` buttons are not nested `<ds-button>` instances in code** — they're
  plain `<button>`s styled via `@forward`-ed `button.style.scss` classes. Recorded under `nested:`
  anyway (as a "style-forward reuse", not a literal child tag) so Phase 3 reuses the existing
  `Button/Primary` component set (`c2100dbfe5316a49d985bb57ff23d93595bbc1b3`) instead of redrawing
  the button geometry from scratch — consistent with the "reuse existing resources" rule.
- **`variant="dots"` is modeled as a top-level structural split**, not a crossed variant property —
  it changes which child shapes exist (circular dot markers or a counter, instead of numbered
  square buttons + ellipsis), not just token values. Phase 2 decides the final set structure.
- Dev server started solely for Phase 1 measurement and stopped afterward.

## Phase 3 — build (complete 05.11.2026)

- **Page**: `Core / Navigation` (`4401:2`) created by cloning `🗂️ Template / Category` — didn't
  exist before this build. `Pagination Documentation` frame cloned from the template's
  `Component A Documentation`; `Component B Documentation` deleted (no inverted axis).
- **Header filled**: kicker `Core / Navigation`, component `Pagination`, lead from the JSDoc,
  version `v0.0.6`, last updated `05.11.2026`, all three links hyperlinked (Storybook storyId
  `components-navigation-pagination-pagination--pagination`), `review-status` at `status=review`.
- **`align` dropped as a crossed variant axis** during the build (see the revised Phase 2 section
  above) — no visible effect in an isolated swatch. Final: `Pagination` = `size`×`state` = 4
  variants (`4407:292`, key `c799bf8d0a3f4d922d5cce3af824119689f6c079`); `PaginationDots` =
  `state` only = 2 variants (`4407:293`, key `0d72810c3321cf62bedc8193ed4a00011c6e8d80`).
- **Reused instances, not redrawn**: every previous/next/page control is a real `INSTANCE` of the
  existing `Button/Primary` set (`color=ghost|primary, size=base|sm, state=default|disabled`),
  with the "square" treatment applied per `button.figma.md`'s own `howTo` (padding-x/gap → 0, label
  hidden for previous/next, icon shown at `size=md` (base) / `size=sm` (sm tier), swapped to the
  existing `caret-left` (`2053:34`) / `caret-right` (`2053:37`) swap-library members). Min
  width/height (48 base / 32 sm) came for free from the Button component's own square-size
  defaults — no override needed.
- **10.11.2026 — moved to the new `Button` set** (`4594:1327`): all 52 button instances in
  `Pagination/Default`, `Pagination/Dots`, `Pagination/DotsRow` and `Bubu` swapped in place
  (`swapComponent`), with label text, name, padding-x/gap 0 and sizing re-applied. Carets are now
  glyphs set via the `icon` swap property (no Icon wrapper); their fill was re-bound to the
  label's text color variable after the swap. The base-tier caret is now 16px (the Button set's
  base icon size) instead of the old `size=md` wrapper; code uses `size="sm"` in both tiers.
- **Representative content**: `Pagination` = `value=5, totalPages=10, pageRange=1` (previous · 1 ·
  … · 4 · 5(active) · 6 · … · 10 · next). `PaginationDots` = `value=10, totalPages=20` (forces the
  counter-badge sub-case per the Phase 2 recommendation; the ≤5-page dot-row sub-case stays
  prose-only, not built).
- **`disabled` state**: built as a genuinely separate variant member (not a visibility toggle)
  with previous/next simply absent and the page buttons sourced from the Button set's own
  `state=disabled` color variants — matches real DOM output exactly (previous/next are removed
  from the tree, not just hidden, when `pagination.disabled` is true).
- **Responsive routing variable created**: `🧩 Component/Pagination/Ellipsis/Width/Device`
  (`VariableID:4405:2`) in `Design Responsive Tokens` — Mobile/Tablet/Desktop modes alias to
  `Global/Space/32`/`48`/`48` respectively, per the `device:` entry above. The `size=sm` ellipsis
  binds flat to `Global/Space/32` instead (overrides the device binding at every breakpoint, same
  as real code).
- **Grid/labels**: cloned from the template's `Primary` stack prototypes (fill/stroke/dash/corner
  radius never hand-authored). `Pagination` stack: 2×2 grid, `size` rows (no brackets needed — no
  nested matrix, just two row labels), `state` columns. `PaginationDots` stack: `Row Labels` deleted
  entirely (no row axis, per the "every set is labeled, but a set with no row axis has only Column
  Labels" rule) — single-row 1×2 grid, `state` columns only. One build-mechanics fix applied: the
  `Grid` divider frame had to be reordered to come _after_ the component set in `Column + Box`
  (`Column Labels`, set, `Grid`) — appending the set after cloning left `Grid` underneath it,
  hiding every dashed divider, exactly the documented pitfall in
  `conventions/component-set-rendering.md`.
- User approved the default variant in Figma, then the full documentation frame (header + both
  sets), before this write-back — both per the required Phase 3 stop-and-wait checkpoints.

Doc frame: https://www.figma.com/design/NzMFv5HwO14Mmro8bWyvlO?node-id=4401:6

## Phases 6–8 — Documentation (complete 05.11.2026)

- **Phase 6 — Copy me**: one instance of `size=base, state=default` (the set's top-left/default
  cell) inserted into the section's `Preview` slot, no overrides. Confirmed.
- **Phase 7 — Anatomy**: `diagram-area`'s template instance swapped to the real default variant;
  6 markers (A–F, cloned from the template's `marker-A` prototype) built and positioned from
  measured `absoluteRenderBounds`, not guessed — dots at `y=16` per the fixed rule, each leader
  ending 4px above its part's visible top (74px for `ellipsis`, 62px for every other part, which
  all share the same render-top). `A` (navigation, a container role) placed at the largest open gap
  between the other markers (`x=436`, between `list`'s marker and `next`'s), since it and `list`
  share the same horizontal center and can't both sit there. Legend rebuilt with the real 6 parts
  and descriptions, replacing the template's 3 generic placeholder items. Confirmed.
- **Phase 8 — Specs**: resolved a real structural question first — `specs.rows` mixed geometry
  from both `Pagination` and `PaginationDots` (two separate top-level-split sets), but Specs is one
  section per component and documents the default set only. **User decided**: draw/table the
  `Pagination` set's own geometry only (gap, height, ellipsis width, ellipsis type — 4 rows);
  every `PaginationDots`-specific row (dot size, badge limits/radius/gap, counter type — 7 rows)
  flipped to `show: skip` above, same treatment as an excluded Inverted split.
  - **Drawn spec — base**: one instance (same content as Copy me) with 4 markers: `Spec/Dimension`
    side=left for Height (`1`, 48px), side=top for the first ellipsis's width (`2`, 48px),
    `Spec/Gap` hatches on all 6 list gaps plus one `Spec/Dimension` side=bottom label on the first
    (`3`, 8px), and `Spec/Leader` kind=type for the ellipsis's type (`4`, `16 / 700 / 1.5`).
  - **Build-mechanics findings** (not in the skill docs yet, worth carrying forward): (1) writing
    into a `Preview`'s nested `Slot` — several `INSTANCE` layers deep inside the cloned `Section`
    instance — causes every node id _inside that instance subtree_ to regenerate on the next
    `use_figma` call (the same "instance override" id-shift gotcha already documented for
    `detachInstance()`); re-locate by name traversal from the stable `Section` instance each call,
    never trust a cached id across calls once you've written inside a nested instance's slot.
    (2) `ellipsis`'s `x` is relative to its immediate parent (`list`), not the top-level component
    instance — missing the `list.x` offset silently shifted two markers by exactly 48px; re-derived
    all positions from `absoluteRenderBounds` (same reliable method as Phase 7) instead of manually
    summing local offsets. (3) `Spec/Leader`'s `Dot` sits at the _far edge_ of its own bounding box
    opposite its `side` (right edge for `side=left`, left edge for `side=right`) — position the
    instance by that dot's local center, not the instance's own x/y. (4) the first ellipsis sat too
    close to the component's left edge for a ~140px `side=left` leader pill to fit without covering
    the `previous` button and the Height marker — switched to the _second_ ellipsis with
    `side=right`, which had open stage space past `next` to extend into.
  - **Sizes table**: header + 4 numbered rows (Height, Ellipsis width, Gap, Type), matching the
    drawn spec's numbering; Type's value is identical for `base`/`sm` so it spans both option
    columns per the "same value for every option" rule. No Behavior card — `specs.behavior` is not
    set for this component.
  - Confirmed.

**Component complete.** `ds-pagination` is live in Figma: page `Core / Navigation`, sets
`Pagination` (4 variants) and `PaginationDots` (2 variants), full documentation (Header / Copy me /
Anatomy / Specs). `align` and the dots ≤5-page dot-row sub-case are documented in prose only, not
built, per the decisions recorded above.

## Post-ship addition — `PaginationDotsRow` (user request, 05.11.2026)

User asked to build the ≤5-page circular-dot-marker sub-case after all, reversing the earlier
Phase 2 "prose-only" decision. Added as a **third top-level set**, `PaginationDotsRow`
(`4430:1316`, key `87210f2e1237e766bde4c5024ce9c88321046962`), crossed with `state` only
(2 variants, same shape as `PaginationDots`) — same rule-1 justification (different
layers/structure: a row of circular dot `ELLIPSE`s vs. the counter's text badge).

- **Representative content**: `value=2, totalPages=3` — 3 dot markers, the middle one active
  (navy fill, `Pagination/Dots/Color/Active`), the other two inactive (white fill,
  `Pagination/Dots/Color/Inactive`). Matches the real `≤5-page` branch
  (`hasBasicNavigationButtons` true).
- **Reused instances**: `previous`/`next` are the same `Button/Primary` `color=ghost, size=sm`
  instances (always sm in dots mode, per the existing finding), present for `state=default` and
  absent for `state=disabled` — identical pattern to the other two sets.
- **Dot markers**: plain `ELLIPSE` nodes (10px, hardcoded per the Phase 1 hard-stop decision — no
  matching token), fill bound to the Active/Inactive color tokens. Container (`dot-row`) reuses the
  same `Pagination/Dots/Color/Background`, `Radius` bindings as the counter badge, `itemSpacing`
  bound to `Pagination/Size/Base/Gap` (`VariableID:137:2324`) — the _real_ rendered gap per the
  already-documented CSS-specificity bug (not the intended `Pagination/Dots/Gap`, which only
  applies to the counter case).
- **Build fix found mid-task**: the `Sets` frame (holding all three stacks) is a `VERTICAL`
  auto-layout frame cloned from the template. An earlier `.resize()` call on it (Phase 3) silently
  flipped it from auto-hug to a fixed height — a stale fixed height then clipped the bottom of
  `PaginationDots` once its auto-positioned location shifted. Fixed by restoring
  `primaryAxisSizingMode = 'AUTO'`; `PaginationDotsRow` was then appended and auto-positioned
  correctly with no manual height tracking needed. Logged in `pagination.figma-validation.md`.
- Screenshot-verified: all three sets (`Pagination`, `PaginationDots`, `PaginationDotsRow`) render
  completely, no clipping. User-confirmed in Figma.

## Phase 2 — variant grouping (confirmed 05.11.2026, revised during Phase 3 build)

**Revision:** `align` was dropped as a crossed variant axis after Phase 3 build review — it only
has a visible effect when the host is stretched wider than its content by the _consumer's_ layout
(`justify-content` on `#nav`); an isolated Figma swatch at natural hug width renders all three
options (`center`/`end`/`start`) pixel-identical. Same treatment as `ds-icon`'s already-excluded
`inline` prop ("no static visual effect in an isolated swatch"). Documented in prose only below,
not built. **Final counts: `Pagination` = `size`(2) × `state`(2) = 4 variants; `PaginationDots` =
`state`(2) only = 2 variants. Total = 6**, down from the originally-proposed 18.

`align`: host-level layout prop (`justify-content: center|flex-start|flex-end` on `#nav`), not
modeled as a Figma variant property — same category as `ds-icon`'s `inline`.

### Original Phase 2 proposal (superseded by the revision above, kept for history)

### Mapping table result

| Prop/state                                                                      | Figma mapping            | figmaOptions (ordered)                    | Reasoning                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `align`                                                                         | variant property `align` | `[center, end, start]`                    | Same layers (justify-content only) → variant. Default `center` (unset) first per rule A; remaining two follow `PAGINATION_ALIGNMENTS`'s own source order (`['end', 'start']`) per rule B.4 — never alphabetical.                                                                                                                                |
| `size`                                                                          | variant property `size`  | `[base, sm]`                              | Same layers, token swap (gap + reused Button size) → variant.                                                                                                                                                                                                                                                                                   |
| `variant`                                                                       | **top-level split**      | `Pagination` (default) / `PaginationDots` | Rule 1 — genuinely different child shapes (numbered buttons + ellipsis vs. dot markers/counter), not a token swap.                                                                                                                                                                                                                              |
| `disabled`                                                                      | folded into `state`      | `[default, disabled]`                     | Pseudo-class/state-ish rule. Previous/next removal is modeled as a `visible=false` override on those two layers for `state=disabled` (via `componentPropertyReferences`), **not** a top-level split — same mechanism as a boolean `show <name>` toggle, so it stays inside one variant set.                                                     |
| `value` (active page)                                                           | **not an axis**          | —                                         | Which page is active is content-selection (depends on the fixed representative `value`/`totalPages` chosen for the drawn example), realized by picking `color=primary` vs. `color=ghost` on the matching reused-`ds-button` instance — not a pagination-level property. Same treatment as `pageRange`/`totalPages` (already excluded, Phase 1). |
| `pageRange`, `totalPages`, `label`, `textPrevious`, `textNext`, `top`, `sticky` | excluded                 | —                                         | Confirmed in Phase 1 — content-selection or non-visual.                                                                                                                                                                                                                                                                                         |

**Open question — flagging per the table's "ambiguous" row, not guessing:** within `variant=dots`
itself, `render()` forks on `totalPages` into two _structurally different_ children —
`hasBasicNavigationButtons` true (≤5 total pages, excl. `pageRange`) renders literal circular dot
`<button>`s in a `<ul>`; false (>5 pages) renders the `<span class="dots">` counter
(`DotsWithText`). That's the same "different layers" test rule 1 uses for top-level splits — but
treating it as one risks under-documenting a real structural fork, while splitting it adds a third
set for what is arguably just another content-selection choice (how many total pages), same as
`totalPages` itself already being excluded. **Recommendation: treat it as fixed representative
content, not a Figma axis** — `PaginationDots`'s drawn/default example fixes `totalPages > 5` (the
counter card, more informative), and the ≤5-page dot-row form is noted in prose only (not built),
consistent with `totalPages` already being excluded everywhere else. Flagging for your explicit
sign-off since it technically could be read as rule 1.

### Grid sketch

**`Pagination`** (3 axes → nested-matrix case; column axis `state` per the hard rule; `size`
(2 options) outermost, `align` (3 options) inside, by ascending option count):

```
                    default    disabled
base    center     [cell]     [cell]
        end        [cell]     [cell]
        start      [cell]     [cell]
sm      center     [cell]     [cell]
        end        [cell]     [cell]
        start      [cell]     [cell]
```

**`PaginationDots`** (2 axes → normal case; column `state`, row `align`; no `size` axis — `is-size-sm`
has zero visual effect in dots mode, confirmed in Phase 1):

```
         default   disabled
center   [cell]    [cell]
end      [cell]    [cell]
start    [cell]    [cell]
```

### Variant count (500 hard stop)

- `Pagination`: `size`(2) × `align`(3) × `state`(2) = **12**
- `PaginationDots`: `align`(3) × `state`(2) = **6**
- **Total = 18** — well under 500. No mitigation needed.

### Representative content (drawn default)

- `Pagination` default variant: `value=5, totalPages=10, pageRange=1` — renders
  `previous · 1 · … · 4 · 5(active) · 6 · … · 10 · next` (7 page/ellipsis items), showing previous,
  next, page buttons (active + inactive), **and** the ellipsis on both sides, so every anatomy
  letter (A–F) is visible on one instance, while keeping the drawn cell compact. (Revised
  04.11.2026 from the original wider `value=10, totalPages=20, pageRange=2` draft, which produces
  9 page/ellipsis items — same anatomy coverage, just wider.)
- `PaginationDots` default variant: `value=10, totalPages=20` (>5 pages, forces the counter card
  per the recommendation above) — shows previous, next, and the counter badge.

**Awaiting your confirmation on this grouping (including the dots sub-case treatment) before Phase
3 build starts.**
