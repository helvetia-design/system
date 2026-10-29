# Mapping conventions — code → Figma

Heuristics the `ds-figma-component` skill uses when proposing a variant grouping in Phase 2.
This file is only ever changed by the skill _proposing_ an addition and the user _approving_ it
— never auto-appended. Each entry should say what the rule is and, briefly, which component run
it came from.

## Baseline rules (seeded, not learned)

- **Free-text props never become Figma variant properties.** A prop like `label` maps to an
  instance text override, not a variant option — the set of possible strings is unbounded.
- **Pseudo-class states and state-ish props collapse into one `state` Figma variant property.**
  `:hover`, `:focus`, `:active` (from SCSS) plus `disabled` / `readonly` / `loading`-style props
  all become options on a single `state` property (`default` / `hover` / `focus` / `active` /
  `disabled` / `readonly` / `loading`, limited to whichever apply) — never separate axes, never
  separate booleans.
- **Enum props (`@OneOf([...])`) map 1:1** to a Figma variant property of the same name with the
  same options — no renaming or collapsing unless a later rule below says otherwise.
- **An enum prop only maps to a variant property when its options share the same layer
  structure — same shape, different token.** If the options instead require different
  layers/structure (e.g. a button `color`/`type` prop where `primary` is a solid fill, `ghost` is
  a transparent fill + border, `link` is text-only with an underline — not just a different fill
  token on the same shape), it is **not** a variant property. Split it into separate top-level
  components instead, swapped via Figma's native Instance Swap — the same treatment already used
  for the `inverted` axis and for open-ended content-selection props like icon `name`. Confirmed
  against the TapTap Design System's own Button, which models `Primary`/`Ghost`/`Link`/`Outline`
  this way, never as a crossed "style" variant. **The test is never the prop's name or whether
  it's an enum — it's: same layers, different token → variant; different layers/structure →
  top-level split via instance swap.** (From: user clarification referencing TapTap's Button,
  generalizing the existing `inverted` rule to cover any structural axis, including `color`.)
  - **SUPERSEDED — see the wrapper + Instance Swap pattern below.** For `ds-icon`, after
    splitting `name` into 79 top-level components, the user initially required `size`/`color` to
    be real crossed variant _properties_ on each of those 79 (2,370 components total). This was
    later reversed: the user flagged the resulting component count as unmanageable and asked for
    the standard real-world Figma icon-library pattern instead (see below). Left here for
    history — the "same layers, different token → variant" test itself is still correct and
    still the right call for a _closed, small_ enum; what changed is the structural answer for
    when that axis is crossed against a _large open-ended_ content-selection prop like icon
    `name`. (From: `ds-icon`'s `size`/`color`, hard rule confirmed then reversed after the
    2,370-component structure became the actual problem reported.)

  - **Current rule — a large open-ended content-selection prop with crossed same-layers
    sub-props gets ONE wrapper `COMPONENT_SET` (crossing only the sub-props) + a lightweight
    Instance Swap library for the content axis, not N top-level sets each repeating the full
    cross-product.** For `ds-icon`: one `"Icon"` wrapper set with `size`×`color` (30 variants,
    defined once), where each variant contains a nested `INSTANCE` of a default glyph bound to
    an `INSTANCE_SWAP` component property (`addComponentProperty('Icon', 'INSTANCE_SWAP',
defaultId)` on the set, `componentPropertyReferences = { mainComponent: propKey }` on each
    variant's nested instance) — plus 79 lightweight single-vector `COMPONENT`s (not sets) as
    the swap library, parked off-canvas. This works because Figma preserves per-instance
    overrides (resize, fill rebinds) across an Instance Swap when the overridden node has a
    name-matching counterpart in the new component — **verify this explicitly by testing an
    actual swap and inspecting the result**, don't just assume it propagates. Reduced `ds-icon`
    from 2,370 components to 109 (30 + 79) with no loss of capability. Apply this pattern by
    default for any future component with this exact shape (open-ended content-selection prop ×
    one or more same-layers sub-props), rather than defaulting to N top-level crossed sets.
    (From: `ds-icon`'s rebuild, user-requested after the component-count problem surfaced.)
    - **A glyph/content library item needs exactly one fill-bearing node, name-matched to the
      wrapper's default's own structure, for color overrides to propagate fully on swap.** An
      icon with more than one top-level `VECTOR` (e.g. a 2-path logo) only gets one of its paths
      recolored on swap (or none, if the vectors sit under different group nesting than the
      default) — Figma's override-preservation matches by node name/path, and a default with one
      `"Vector"` child has nothing to match a second one against. Fix: `figma.flatten()` any
      multi-vector library item into one `VECTOR` before adding it to the library, **then
      immediately reassign `vector.fills = JSON.parse(JSON.stringify(vector.fills))`** — a plain
      value-preserving reassignment, not a real change — since `flatten()` otherwise leaves the
      new vector's fills in a state that reads correctly on the master component itself but
      comes back empty when read through a swapped instance. Confirmed via direct swap-and-
      inspect testing, not assumed. (From: `ds-icon`'s `xing`/`information`, the only 2 of 79
      icons with multi-path source SVGs.)

- **Total variant count is checked against a hard-stop ceiling of 500 before any grouping is
  presented for approval — this skill's own conservative limit, not a number Figma enforces.**
  Figma's own docs only warn qualitatively (performance issues appear with "thousands" of
  variants per set; no fixed number given) and describe a shared ~2GB-per-tab memory budget
  across the _whole_ library file, not per-component — staying well under it leaves headroom for
  every other component sharing that file. Count = sum, across every top-level split, of the
  product of that split's own crossed variant-property option counts (every property from the
  grouping step, including `state`). **Lightweight Instance Swap library members (plain single
  `COMPONENT`s parked as swap targets, not crossed into a set) are excluded from the count** —
  they're structurally trivial and don't carry the same cost as a crossed variant. If the count
  exceeds 500, stop before presenting the grouping; recompute and re-check after every mitigation
  choice, looping until under threshold. (From: user request after noting an 80-icon ×
  size × color example would produce 1,600 variants.)
- **When over threshold, a same-layers "only swaps a bound Variable value" axis (a token-swap
  axis — color is the common case, but this generalizes to border-width, elevation, or any
  variable-bound attribute) can be resolved via per-instance Figma Variable override instead of a
  crossed variant property**, using `setBoundVariableForPaint` (or the matching bound-variable
  setter for non-paint fields) so each instance can locally override the bound value — dropping
  the axis from the cross-product with zero new nodes created. **Reserved for when the threshold
  is actually exceeded, not a universal default** — a small, harmless token-swap axis still gets a
  normal crossed variant dropdown by default, since that's more discoverable for consumers than
  requiring them to know about per-instance variable overrides. **Size axes are never eligible for
  this mitigation** — a size-driven explosion is resolved via a crossed variant (if it fits on its
  own) or a structural wrapper/Instance-Swap split, never a variable swap, since a dimensional
  change doesn't map to the same per-instance-override UX as a token-swap. (From: user request,
  generalized from an initial "colors via variables" framing to any token-swap axis.)
- **An open-ended/structural axis contributing to a threshold breach uses the existing wrapper +
  Instance Swap split pattern** (see the "Current rule" above, originally developed for
  `ds-icon`) rather than a new technique — the mitigation for this axis type was already solved,
  the hard-stop check just surfaces when it's needed sooner than a human would have noticed.

- **No visual attribute is ever assumed — every value on every Figma node needs an explicit,
  resolved design token, even if the component's own SCSS never sets that attribute at all.** A
  CSS-var binding is the common case, not the only case that counts: an attribute a component
  inherits (e.g. `color`/`font-size` on a text part that relies on Shadow DOM inheritance, like
  `ds-spinner`'s label) still needs a token bound to it in Figma — there's no shadow-DOM
  inheritance there to fall back on, only Figma's own stale/leftover default. Treat a missing
  token for _any_ attribute (inherited, hardcoded in `.tsx`, or CSS-var-bound) as the same hard
  stop: ask the user to pick an existing token or explicitly accept a one-off hardcode, never
  silently build with an assumed value. Check this via Phase 1's completeness checklist
  (every node × every attribute it needs) before Phase 2, not discovered piecemeal in Phase 3.

## Learned rules

- **A CSS-animated element's `getBoundingClientRect()` is unreliable mid-animation — a rotated
  square's axis-aligned bounding box is naturally larger than its own side length at any angle
  other than 0/90/180/270°.** Measuring `ds-spinner`'s circle variation this way once showed a
  ~30px width for a token that's actually exactly 24px, purely because the element was
  mid-rotation at the instant of measurement. Prefer reading the literal CSS property value
  (`getComputedStyle(el).width`) over the rendered bounding box for anything with a running CSS
  `animation`, or measure a paused/non-animating instance. (From: `ds-spinner`'s circle Phase 4
  sweep.)
- **When a library recolors nested SVG content dynamically (e.g. `lottie-colorify`), querying
  the first matching `path`/`g` can land on an unstyled wrapper, not the actual colored leaf
  element.** `getComputedStyle(el).fill` on the wrong element reads the SVG spec's initial
  value (`black`) instead of the real applied color. Check the element's `fill` _attribute_
  directly (not just computed style) across all matching descendants, and use the one that
  actually has a non-null `fill` attribute set. (From: `ds-spinner`'s logo mark Phase 4 sweep,
  which also surfaced a real, now-quantified color drift between the live `getColor()` fallback
  hex and the token-bound Figma value — see `spinner.figma.md`.)

- **A prop's JSDoc comment can itself be wrong or incomplete — verify its claimed behavior
  against the real computed/rendered output during Phase 1/4, don't just transcribe it.**
  `ds-icon`'s `turn` prop was documented as "rotated 180deg" but the real CSS
  (`icon.host.scss`) only defines a transform for 3 specific icon names, and one of them
  (`plus`) rotates 225deg, not 180 — confirmed via `getComputedStyle` matrix inspection in a
  live browser, not by re-reading the SCSS harder. A generic-sounding prop description can hide
  per-value or per-name special-casing. When a Phase 4 check reveals the _component's own code
  doc_ was wrong (not just the Figma mapping), fix the code doc too, in the same pass — code is
  supposed to be the source of truth for documentation copy (Phase 3b's lead-paragraph rule),
  so a known-wrong doc comment shouldn't survive a run that just disproved it. (From:
  `ds-icon`'s `turn`.)
- **A tiny/compressed baseline screenshot can be visually misread — confirm a suspected color or
  rendering discrepancy against live `getComputedStyle` before reporting it as a finding.**
  A 79px-tall multi-row baseline PNG made an inverted icon row look like it had color variation
  it didn't actually have (two rows' content visually bled together at that resolution); the
  real computed `--mod-icon-color` was uniform white for all of them, confirming the Figma
  build was already correct. Don't trust a quick visual read of a small/compressed image for a
  color-equality judgment — crop/zoom or measure the DOM directly. (From: `ds-icon`'s
  `inverted` + `color` interaction in Phase 4.)

- **When importing SVG art via `figma.createNodeFromSvg`, always `rescale()` the whole imported
  frame to the target token size — never `resize()` (or bind width/height on) an inner node's
  _tight content bounding box_.** A path's tight bbox rarely equals the SVG's declared canvas
  (`viewBox`), and isn't necessarily centered within it. Resizing the tight bbox instead of the
  canvas distorts aspect ratio (confirmed: ~17% stretch on one icon) and, discovered
  independently, `findOne(n => n.type === 'VECTOR')` only grabs the _first_ vector in a
  multi-path SVG — silently dropping the rest when the original import frame is discarded.
  Correct pattern: `imported.rescale(targetSize / imported.width)`, then move **all**
  `imported.children` (via `findAll`, not `findOne`) into the component, recoloring every one.
  This preserves native relative position/size exactly like a browser's `viewBox` scaling does.
  Applies to any component that imports external vector art (icons, brand assets, nested
  components), not just `ds-icon`. (From: `ds-icon`'s 79-icon rebuild, caught by the user
  spotting inconsistent visual weight across the grid.)

- **SUPERSEDED — An open-ended content-selection prop referencing an external registry (e.g.
  `ds-icon`'s `name`, backed by 79+ SVGs with no closed `@OneOf([...])`) does NOT become a
  crossed Figma variant property at all — it becomes N separate top-level components, one per
  option, named `<Component>/<option>`.** Originally this skill made `name` the sole crossed
  variant property on one shared 79-member set (reasoning preserved below for context). Per user
  direction (same TapTap Instance Swap pattern used for `ds-spinner`'s `inverted` split), this is
  now wrong — every open-ended content-selection prop, however many options it has, gets the
  top-level-component-split treatment, exactly like a true `inverted`/dark-context axis. A
  consumer picks an option via Figma's native Instance Swap, not a variant property dropdown.
  (From: `ds-icon`'s `name`, re-split after `ds-spinner`'s `inverted` established the pattern.)
  - Original reasoning, still correct as the _reason a variant-property cross-product doesn't
    work_ here even though the conclusion changed: Figma variant sets are a true cross-product —
    crossing a large content set against even a few other properties (size × color × state,
    etc.) produces tens of thousands of unbuildable physical components. The fix is no longer
    "one variant property, everything else an instance-override" — it's "N standalone
    components, everything else an instance-override," which sidesteps the cross-product problem
    entirely rather than just minimizing it to one axis.

- **Never assume a size token's value is the visible size of what it's bound to — verify
  against the real rendered output, especially for animated (Lottie/CSS keyframe) or composite
  vector assets.** A size token (e.g. `Logo/Size/MD`) may describe the host container/hitbox,
  not the visible glyph inside it — the actual artwork can have built-in padding the token
  doesn't capture. Static analysis of a Lottie JSON is unreliable for this (a real animation can
  be a many-layer masked/keyframed composition where the final resting shape can't be derived
  without resolving the whole animation timeline). The reliable way: render the real component
  in a browser (start the dev server, Playwright/`browser_evaluate`) and measure
  `getBoundingClientRect()` on the actual visible path/shape elements vs. the host container —
  not the SVG element's own box, which can also be larger than the visible content. Check this
  ratio at two different size variants if the component has them; a consistent ratio across
  sizes (not a fixed pixel padding) confirms it's a proportional artwork-to-container relationship, not noise.
  (From: `ds-spinner`'s `logo` variation — measured 86.3% glyph-to-container at both sizes,
  versus the 100% edge-to-edge that was initially built from the reused Favicon vector.)

- **A boolean prop with no static visual effect is excluded from the Figma mapping entirely.**
  Figma components are inherently static — a prop that only toggles animation playback (e.g.
  `ds-spinner`'s `deactivated`, which just freezes/unfreezes a Lottie animation) has nothing for
  a Figma variant property to represent. (From: `ds-spinner`.)
- **A prop whose visual effect is conditional on another prop still gets its own independent
  variant axis**, rather than being collapsed or special-cased — simplicity over eliminating
  visually-redundant combinations. E.g. `ds-spinner`'s `labelPosition` only has a visible effect
  when `label` is non-empty, but stays its own axis regardless. (From: `ds-spinner`.)
- **A text part with no explicit `color`/`font-size` in the component's own SCSS still needs
  explicit color/size in Figma** — it inherits those from ambient page context in real usage
  (shadow DOM inherits `color`/`font-size`), so leaving the Figma text node unbound just shows
  Figma's own stale/leftover default instead of anything representative. Bind to this system's
  default text treatment (`Alias/Text/Color/Primary`, `Device/Text/Size/Base/Device`) and flag
  it in `<name>.figma.md` as an inherited-context binding, not a literal one. (From:
  `ds-spinner`'s label part.)
- **An `instance-text-override` prop (e.g. `label`) should ship with placeholder text on every
  variant member, not left empty** — standard component-library practice; consumers clear or
  override it. The one exception is when a specific member is meant to demonstrate the true
  code default and that default is an empty string — ask the user which policy applies rather
  than assuming. (From: `ds-spinner`'s `label`/`labelPosition`, confirmed "placeholder
  everywhere".)
- **A free-text prop whose presence is conditionally rendered in code (e.g. `hasValue(label) &&
<span>`) needs a paired boolean "Show X" component property controlling the layer's
  `visible`** via `componentPropertyReferences`, not just relying on empty text. Figma doesn't
  collapse an auto-layout gap/width for an empty-but-present text layer the way code's
  conditional render omits the element entirely — the boolean property is what makes the
  layout actually collapse to match. Default the boolean to match code's real default (here:
  `false`, since `label` defaults to `''`). Check every `instance-text-override` prop for this
  during Phase 1/2, don't wait to discover it after the build. (From: `ds-spinner`'s `label`.)

- **Phase 3b's documentation page structure is a fixed template applied identically to every
  component, never a per-component layout decision.** As of `ds-badge`, this is the TapTap
  Design System-derived layout (bordered outer frame → Header → "Copy me" → "Variants" (compact
  single-axis) → "Main components" (full cross-product table) → "Specs" (annotated measurements
  per Variants-axis option, added on `ds-close`)) — see `PHASE-3B-DOCUMENT.md` for the full
  spec. This entry exists only to flag it here too, since CONVENTIONS.md is the
  file re-read at the start of every run. `ds-spinner`/`ds-icon` still use the superseded
  row/card/column layout from before this change — revisit them to match when next touched, not
  yet done. (Template replaced on `ds-badge`'s request, referencing TapTap Design System's
  Figma community file.)
  - **SUPERSEDED again, 2026-10-29 — full-width blue header over a 2-column body, "Main
    components" dropped to raw table-chrome-free "🔒 Component Set".** Per a user-built
    `ComponentTemplate` reference frame (`⏳ Core / Indicator / Badge` page, node `2160:3652`), the
    single-column stack layout above is replaced with: a full-width header (blue fill bound to
    `🔗 Alias/🎨 Surface/Primary`, title + review-marker kicker + lead on the left, a
    version/last-updated/Storybook-link info block on the right) over a `HORIZONTAL` 2-column body
    — left column stacks Copy me → Anatomy → Specs (moved here from the end of the page) →
    Variants; right column holds one "🔒 Component Set" panel. The old "Main components" table
    chrome (header row, row-label column, grid-line rectangles, `ABSOLUTE`-auto-layout-child
    overlay) is gone entirely — the real master `COMPONENT_SET` is placed as a normal, non-absolute
    auto-layout child, styled directly with a 2px dashed `🌐 Global/🌈 Color/Purple/4` stroke, and
    left to arrange its own variant children via Figma's native `combineAsVariants()` grid, with no
    custom cell-centering math. Per-cell labels are explicit future work, not built yet. Both
    columns get an independent 734px-minimum, content-driven width (not locked to match each
    other) so a large component set can grow the right column (and the whole page) without
    constraining the left column's prose. Inter-section divider lines are dropped in favor of each
    section's own 40px top padding. Full spec in `PHASE-3B-DOCUMENT.md`; canonical reference is
    now `ComponentTemplate` for layout/header/Component Set, `ds-close` still for everything else
    (panel styling, `inverted` split, focus states). `ds-close`/`ds-spinner`/`ds-icon`/`ds-badge`'s
    pre-2026-10-29 pages still use the prior single-column layout — migrate when next touched; this
    run also rebuilds `ds-badge`'s live page to the new structure as part of the same pass. (From:
    user request, referencing a hand-built `ComponentTemplate` mockup frame.)
  - **The header is now a real shared Figma component, not hand-built per page.** A `Header`
    master component lives on the `🧰 Annotations` page (node `2180:17`) — every component page's
    header is an `INSTANCE` of it with its text nodes overridden (component name, kicker
    breadcrumb, lead paragraph, version/date wordmarks, Storybook link + hyperlink), never a
    fresh hand-built frame. `ds-badge`'s header was converted to this instance in the same pass
    that created the master. Edit the master once to change the header's design everywhere; never
    fork a one-off copy for a single component. (From: user request, 2026-10-29.)
  - **The master `COMPONENT_SET` placed in "🔒 Component Set" stays unlocked.** The old template
    locked the set once to stop a human dragging the whole grid out of alignment inside hand-built
    table chrome; that protection doesn't apply anymore since the set is just a normal auto-layout
    child with no table geometry to misalign. Don't set `locked: true` on it. (From: user request,
    2026-10-29.)

- **Never move a `COMPONENT_SET`'s variant child into another frame — always
  `variant.createInstance()` instead, even when the goal is literally "show the real
  component."** A variant can only be a direct child of its own set; moving it out empties (and
  Figma then auto-deletes) the set, stripping `color`/`size`-style variant-property grouping
  from the remaining children. Recoverable (nothing is deleted, instances keep resolving,
  property definitions survive with new IDs) via `figma.combineAsVariants()` plus manually
  renaming each child back to `key=value, key2=value2` format — the round-trip alone leaves
  children unparsed (empty-string property keys). Cheaper to never do this in the first place.
  (From: `ds-badge`'s TapTap-layout rebuild, where "Main components" table cells were first
  built by directly embedding the real variants.)

- **A `COMPONENT_SET`'s variant children cannot be manually positioned via Figma's native `GRID`
  layout mode.** `set.layoutMode = 'GRID'` is accepted, but `gridRowAnchorIndex`/
  `gridColumnAnchorIndex` throw `read-only property on COMPONENT node` when set on a variant
  child, and auto-assignment never populates them either (stays `-1`). For any custom grid
  arrangement of a component set's own variants (e.g. aligning them under an external table's
  headers), use `layoutMode: 'NONE'` with manual `x`/`y` positioning instead — there is no
  working auto-layout path for this via the plugin API today. (From: `ds-badge`'s "Main
  components" centering pass.)
- **Appending a plain overlay node (e.g. a grid-line rectangle) into an auto-layout frame pulls
  it into the layout flow and disrupts the stack, unless `layoutPositioning` is set to
  `'ABSOLUTE'` on it first.** This opts the child out of auto-layout positioning, letting it use
  free `x`/`y` coordinates as a true overlay. Needed any time a decorative/overlay element
  (divider lines, badges, labels) is added as a child of an existing auto-layout frame rather
  than a plain frame. (From: `ds-badge`'s "Main components" grid-line dividers.)
  - **Caveat**: setting `layoutPositioning = 'ABSOLUTE'` can throw `Can only set
layoutPositioning = ABSOLUTE if the parent node has layoutMode !== NONE` even when the
    parent genuinely is an auto-layout frame, if the child was created and appended in the same
    synchronous batch as other structural changes to that parent. Observed for a text node
    appended to a per-cell auto-layout frame that was itself created moments earlier in the same
    script. Worked fine for simpler cases (grid lines appended to an already-fully-built table).
    If it throws, don't fight it — use a normal-flow spacer + stacked sibling instead of
    absolute positioning (see `ds-icon`'s per-cell icon-area spacer + name label). (From:
    `ds-icon`'s 79-icon reference grid rebuild.)

- **A component set's master can end up with `parent: NONE` (orphaned at the page-tree level)
  even though it's a completely healthy, non-removed node with valid content** — happens
  silently, cause unconfirmed (possibly an artifact of how `combineAsVariants` or prior session
  edits left the node). Symptom: `node.parent` is falsy, and the set doesn't appear in
  `page.children`, but `figma.getNodeByIdAsync(id)` still resolves it fine with correct
  children/properties. Fix: `page.appendChild(set)` — makes it a proper page child again, safe,
  non-destructive. Check this explicitly (`set.parent?.type`) before manipulating any
  previously-built master set from an earlier session, not just newly created ones. (From:
  `ds-spinner` and `ds-icon`'s TapTap-layout rebuilds — both master sets had this issue.)

- **A master `COMPONENT_SET` overlaid on top of a documentation frame must be the _last_ child
  of the page, or it renders invisibly behind the frame's opaque fill.** Figma's page-level
  z-order follows child array order; an earlier sibling (even a `COMPONENT_SET` with real,
  correctly-positioned content) renders fully behind a later opaque sibling frame, not just
  "under" at overlapping pixels. After any multi-step build involving a `page.appendChild()`
  call, re-verify `page.children` order explicitly — don't assume the set ended up last just
  because it was the most recent edit. (From: `ds-spinner`'s rebuild, where the set was
  accidentally left first.)

- **A real master variant overlaid on a table/grid is positioned with one-time absolute
  coordinates — it does not move if anything above it in the same auto-layout stack changes
  size.** Editing a heading's font size, the lead paragraph's line count, or anything else that
  changes the height of content above a "Main components" table shifts the table's position but
  leaves the overlay exactly where it was, visibly misaligning it. After any such edit,
  recompute and reapply the overlay's `x`/`y` against the table's _current_
  `absoluteTransform` — don't assume it's still correct just because nothing about the overlay
  itself changed. (From: `ds-spinner`/`ds-icon`, after a heading font-size fix shifted both
  tables.)
  - **Once locked** (per the standing "lock every overlaid grid variant" rule in SKILL.md),
    realignment still works fine via script — `locked` only blocks UI
    selection/dragging, not plugin API property writes. No need to unlock first.
  - **Better fix — make the overlay structurally "sticky" instead of repeatedly recomputing a
    page-absolute position.** `table.appendChild(set)` to reparent the master variant/set
    directly into the table frame itself (as a real child, not a page-level sibling merely
    positioned to look aligned), then `set.layoutPositioning = 'ABSOLUTE'` with `x`/`y` now
    **relative to the table** instead of the page. The set then moves automatically whenever the
    table does, since it's a genuine descendant — no more manual realignment pass needed after
    future layout changes above it. Reparenting the _whole_ set this way is safe and distinct
    from the existing "never move a variant child out of its own set" rule, which is about
    detaching one variant from its set (breaks variant-property grouping), not relocating the
    set as a unit. Z-order requirement becomes scoped to the table (set must be the table's last
    child) instead of the page. **Bonus**: this also resolves the composite-overlay
    `get_screenshot` unreliability below for that specific table, since the content becomes a
    genuine descendant of the screenshotted subtree rather than a cross-branch composite — prefer
    this reparenting approach over a page-level overlay from the start on any future component.
    (From: `ds-icon`'s 79-icon Main components tables, after two rounds of manual realignment
    prompted the user to ask for a structural fix instead.)

- **Park unused/off-grid variants in the _negative_ x/y direction, never positive.** A positive
  offset just extends the page's visible bounding box past the documentation frames, so the
  "parked" content still shows up as loose debris below/beside everything in a page-level
  screenshot — exactly what parking was supposed to avoid. Use a large negative coordinate
  (e.g. `y: -10000`), consistent with how every master component set itself is already parked
  relative to its documentation frame. (From: `ds-spinner`'s unused `labelPosition=bottom`
  variants, first parked at a positive offset that still cluttered the page.)

- **`get_screenshot` targeting a nested frame/table node (not the page itself) unreliably
  composites cross-branch overlapping content — prefer the page's own `nodeId` for any
  multi-subtree overlay checkpoint.** Confirmed by querying the identical node repeatedly and
  getting byte-identical cached output regardless of real changes made in between (ruling out
  genuine re-render), while a page-level screenshot of the exact same visual region correctly
  showed the previously-"missing" content. Even page-level screenshots aren't 100% reliable for
  very complex composites (two cells out of eight intermittently failed to render in one
  `ds-spinner` case despite confirmed-correct position/color/visibility and a clean isolated
  render) — if a screenshot shows unexpectedly missing content after exhaustive position/data
  verification, suspect the tool before assuming a real file defect, but note the caveat in
  `<name>.figma.md` rather than silently trusting either outcome. (From: `ds-spinner`'s rebuild.)

- **When an open-ended content-selection prop (top-level-split into N components, per the rule
  above) also has its own crossed same-layers variant properties (e.g. `size`/`color` on each
  `ds-icon` entity), "Main components" stops being one shared flat reference grid and becomes N
  separate titled sub-sections, one per split entity — entity name as a heading, then that
  entity's own full variant cross-product grid (rows/columns = its variant properties), stacked
  one after another.** The real per-entity `COMPONENT_SET` is anchored directly onto its own grid
  (same "overlay real variants onto table chrome" technique as `ds-badge`/`ds-spinner`'s single
  shared table, just repeated once per entity instead of once per page) rather than parked
  elsewhere. "Variants" stays a compact single-axis sample across a handful of representative
  entities (not all N, not every option) — the exhaustiveness lives entirely in "Main components"
  now. (From: `ds-icon`'s rebuild — initially built as one flat 79-icon default-variant grid, the
  user asked for this per-icon-titled-grid structure instead once `size`/`color` became real
  variants on each of the 79 split entities.)

- **`figma.createAutoLayout()` defaults every new frame to a solid white fill — clear it
  explicitly (`fills = []`) on every purely-structural wrapper frame in the Phase 3b
  documentation layout.** Only the one frame meant to have visible chrome (`Card`) should keep a
  fill; `Header`, `Rows`, row wrappers, `Columns`, and column frames must all be transparent, or
  they render as unintended white boxes over the page's grey canvas instead of showing it
  through. Caught by comparing `ds-badge`'s first documentation build against the already-correct
  `ds-spinner`/`ds-icon` pages — `ds-badge`'s header and row wrappers were opaque white where
  they should have been transparent. Watch for a related mistake while fixing this: a blanket
  fill-clear across a frame's children can also hit sibling **text** layers (e.g. a row's
  `eyebrow` label) that need their own color fill kept intact — clear wrapper frames
  specifically, not every child indiscriminately. (From: `ds-badge`'s Phase 3b.)

- **A `COMPONENT_SET`'s own `width`/`height` does NOT auto-update when its variant children are
  repositioned — unlike an auto-layout frame, it never re-hugs, and a stale cached bounding box
  silently crops it to nothing in a screenshot with zero error.** `combineAsVariants()` gives the
  set whatever bounding box its children's positions implied at that moment; moving children
  afterward (e.g. the "ABSOLUTE auto-layout child overlaid on a Main components table" technique)
  changes where they render but does **not** grow the set's own `width`/`height` to match, because
  `COMPONENT_SET` has `layoutMode: 'NONE'` — it behaves like a plain fixed-size frame, not an
  auto-layout one, for sizing purposes. The screenshot renderer then composites against the
  **stale** bounding box, so children repositioned outside it simply don't appear — no thrown
  error, no warning, every node-level check (`visible`, `opacity`, `fills`, `absoluteTransform`)
  reports completely correct values, because geometrically everything _is_ correct; only the set's
  own `width`/`height` is wrong. Confirmed by direct diagnosis: `set.screenshot({contentsOnly:
true})` showed a blank image matching the set's _stale_ `width`/`height` exactly, while every
  child's `absoluteTransform` matched its intended target cell exactly. **Fix: after repositioning
  a set's children into their final layout, explicitly `set.resize(width, height)` to the real
  bounding box they now occupy** (or generously larger) — don't assume moving children is enough,
  the way it is for an auto-layout frame. This bit `ds-icon`'s single-table case too, in
  retrospect, but didn't surface there because the original pre-reposition packing happened to be
  larger than the final grid; it only became visible on `ds-spinner`, whose two-stacked-titled-
  grids layout repositions children well outside the original single-row packing bounds. Check
  this any time a set is used as an overlaid/ABSOLUTE child and its render turns up unexpectedly
  blank — before suspecting a stale screenshot (the next item below) or a structural bug. (From:
  `ds-spinner`'s Logo/Circle titled-grids Main components build.)

- **`get_screenshot` returning a blank/wrong render is not always the documented
  stale-screenshot-cache pitfall — re-screenshotting isn't a universal fix, and ruling out a real
  cause first saves a debugging loop.** On the same `ds-spinner` build above, re-screenshotting
  (both the same node and a higher page-level node, per the existing stale-cache advice) kept
  returning an identical, genuinely-blank result — because the real cause was the stale
  `COMPONENT_SET` bounding box above, not a transient render cache issue. Before concluding
  "just re-screenshot" or "trust a second render," check whether the byte size of a suspiciously
  identical repeat screenshot is **exactly** the same (strong signal of a real, reproducible state,
  not a flaky one-off) and verify the suspect node's own reported `width`/`height` against where
  its children actually sit. (From: `ds-spinner`'s Main components build.)

- **A master component's child with a hardcoded `visible: false` is not instantiated on fresh
  instances at all — Figma drops it entirely, it does not carry over as a hidden override.**
  Confirmed by direct inspection: a master's `.children` correctly lists the hidden child, but
  `instance.createInstance().children` on a brand-new instance omits it completely (not merely
  `visible: false` — genuinely absent from the array). This breaks the "Show X" pattern any time
  the paired layer's visibility is set via a plain `node.visible = false` instead of a real
  component property: `findOne`/`findAll`/`.children` on the fresh instance can't find a node that
  isn't there, so any later attempt to reveal it (`instance.children.find(...).visible = true`)
  throws on `undefined`. **Fix: the master's layer must stay `visible: true`, with its visibility
  instead driven by a real `BOOLEAN` component property** —
  `set.addComponentProperty('Show <name>', 'BOOLEAN', false)` once on the set, then
  `layer.componentPropertyReferences = { visible: propKey }` on every variant child (keeping
  `layer.visible = true` itself) — a property-driven false still instantiates the node on every
  fresh instance; only a hardcoded false on the master doesn't. Toggle it per-instance via
  `instance.setProperties({ [propKey]: true })`, not by reaching for the child node directly. For a
  layer that must be structurally and unconditionally absent for one variant branch regardless of
  any boolean (e.g. `ds-badge`'s icon at `size=sm`, which code gates with its own separate
  condition) — the hardcoded `visible: false` with no property reference is correct there and the
  node simply won't exist on instances of that branch, which matches the real behavior. (From:
  `ds-badge`'s `Show icon` build — a raw `visible = false` on the icon instance was set during
  Phase 3's fan-out, silently working for the set's own master/children but breaking every
  Phase 3b instance built from it afterward.)

- **Every focus state is built as absolutely positioned ring frames with _outside_ strokes —
  never as `DROP_SHADOW` effects.** Use one ring frame per CSS `box-shadow` spread, stacked in
  the same order, with stroke weights bound to the focus size tokens and stroke colors to the
  focus color tokens. This applies to every component, whatever its background: a Figma drop
  shadow is derived from the layer's own alpha, so on a component with a fully transparent
  background a drop-shadow ring renders as nothing. Opaque components would render one, but a
  single construction keeps focus states consistent across the library. (From: `ds-close`'s
  `focus-shadow` mixin — 2px border color + 5px focus color — first built as two spread drop
  shadows, which left the focus column empty. Checked 2026-10-29: no other pushed component has
  a focus state.)

- **When rebinding a cloned variant's paint to a variable, create the paint with the variable's
  resolved value as its color — never a placeholder.** After `setBoundVariableForPaint`, a master
  can keep rendering the placeholder color even though the binding is correct and instances
  resolve fine. Build the paint from `variable.resolveForConsumer(node).value` before binding.
  Easy to miss: only the masters look wrong, the documentation instances look right. (From:
  `ds-close` — all 30 masters drew a black X instead of navy.)

- **The Copy me / Anatomy / Specs / Variants panels on the Phase 3b documentation page all share
  one chrome now: a real `Preview` master component** on the `🧰 Annotations` page (node `2182:2`)
  — white fill, 2px stroke bound to `🔗 Alias/▭ Border/Color/GreyLight`, all four corner radii
  bound to `🌐 Global/📏 Dimension/Radius/6` (6px — this file has no 8px radius token; 6px was
  already what the Anatomy box used). Instance it rather than hand-building a bordered/rounded box
  per section, same discipline as the `Header` master. This replaced three different ad-hoc
  treatments that had drifted apart (Copy me's borderless 4px-radius box, Anatomy's correct 2px
  border + 6px radius, Variants' 2px border with no radius at all) — see
  `PHASE-3B-DOCUMENT.md`'s "0. Shared `Preview` box component" section for the full
  rationale and usage. (From: user request, 2026-10-29.)
  - **`appendChild` into an `INSTANCE` throws — instances can't accept arbitrary new children, only
    overrides of structure the master already defines.** First build of this pattern tried
    `preview.createInstance()` then `instance.appendChild(contentFrame)`, which fails with
    `"Cannot move node. New parent is an instance or is inside of an instance"` since `Preview`'s
    master has no children to override into. **Detaching the instance to work around this
    (`instance.detachInstance()`) is the wrong fix** — it produces a plain frame baked with the
    right-looking values but severed from the master entirely (invisible as `Preview` in the layers
    panel, confirmed by the user noticing the Badge Documentation page's boxes showed no `Preview`
    instance after a first pass used detach). **Correct pattern: keep the content frame as a normal
    sibling, and layer a real `Preview` instance behind it** — `insertChild(0, instance)` into the
    same parent as the content frame (index 0 renders behind), `instance.layoutPositioning =
'ABSOLUTE'`, `x = 0`, `y = 0`, `instance.resize(contentWidth, contentHeight)` to match the
    content frame's bounds exactly, and clear the content frame's own fill/stroke/radius so the
    instance's chrome shows through. The content frame stays a normal (non-absolute) auto-layout
    child so the parent still hugs/sizes around it; the `Preview` instance just rides along at the
    same bounds without participating in the hug calculation. Confirmed: `resize()` works on the
    instance even though the master's own sizing mode is `HUG`, same as it does on the master itself
    (both have no real children to hug around). (From: Badge Documentation page's Copy me/Anatomy/
    Specs/Variants boxes, 2026-10-29 — first pass used detach, caught and redone same day.)
