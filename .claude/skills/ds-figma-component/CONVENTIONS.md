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
  single-axis) → "Main components" (full cross-product table)) — see SKILL.md's Phase 3b section
  for the full spec. This entry exists only to flag it here too, since CONVENTIONS.md is the
  file re-read at the start of every run. `ds-spinner`/`ds-icon` still use the superseded
  row/card/column layout from before this change — revisit them to match when next touched, not
  yet done. (Template replaced on `ds-badge`'s request, referencing TapTap Design System's
  Figma community file.)

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
