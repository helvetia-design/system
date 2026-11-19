# Conventions — general Figma Plugin API mechanics (any phase)

Gotchas and techniques that apply to building any frame/section in this skill, not one specific
phase or section. See `../CONVENTIONS.md` for the index.

## Platform limits

- **Slots** (checked 16.11.2026 on a scratch set). In a component set, add the property once on
  the set — `set.addComponentProperty('<name>', 'SLOT', '')` — and bind a frame in each variant
  with `frame.componentPropertyReferences = { slotContentId: key }`; the frame becomes a `SLOT`
  node, also when nested inside another frame (`control`). On a single component,
  `component.createSlot()` does both; the slot can then be moved into a nested frame. Preferred
  instances: `set.editComponentProperty(key, { preferredValues: [{ type: 'COMPONENT_SET', key }] })`.
  `setProperties` can't set a slot: fill it in an instance with `appendChild`. Component
  properties are listed in creation order and can't be reordered through the API — create each
  `show` boolean right before the property it shows. `slot.clone()`
  returns a plain frame. Not allowed: `GRID` layout on a slot, a slot nested inside another slot.
  An empty slot keeps a size (100 × 100 by default) and takes the parent's gap; a hidden slot
  can't be found in an instance — bind a boolean to its `visible` and turn it on first.
  Cloning a slot off an existing slotted component (e.g. `Preview`) loses slot settings like
  `layoutMode` — don't build slots that way.
- **A node added to slot content and then hidden is deleted** (seen 18.11.2026 on the template's
  `stage`): `visible = false` on a node appended into a slot's content (also deeper, e.g.
  `drawn-spec` › `stage`) removes it — `getNodeByIdAsync` returns `null` and it's gone from the
  parent. Never keep a hidden prototype inside slot content; keep it visible and delete it when
  unused (the Measurements `caption` prototype works this way).
- **Inserting into slot content invalidates node handles you already hold** (19.11.2026,
  migrating the Anatomy markers): after `insertChild` into a slot's content, earlier handles to
  its siblings' descendants throw "node does not exist". Read everything first, then mutate, and
  re-fetch the parent by id (`getNodeByIdAsync`) after each insert. Find a child's index by `id`
  (`children.findIndex(c => c.id === n.id)`) — `indexOf` returns `-1` there.
- **Transparency goes on the layer, never on a variable-bound paint** (18.11.2026): an instance
  resets a bound paint's opacity to 100%, so a master with a 12% bound fill shows solid in every
  copy. Put the color at 100% on a child layer and set that layer's `opacity` instead — the
  `Spec/Gap` (`tint` 12%, `Hatch` 60%), `Spec/Inset` (`tint` 35%) and `Spec/Icon size` (`tint`
  25%) masters work this way. `get_screenshot` can lag behind such a change: check the render in
  Figma, not only on the screenshot.
- **Figma hard-rejects moving a subtree that itself contains `SLOT` instances into _another_
  slot's contents** — `Cannot move node. Node is not allowed SLOT node`. A documentation frame is
  already 2 slot-levels deep internally (Anatomy/Measurements each nest a `Preview` inside a `Preview`)
  before it ever reaches a category-level slot. This rules out wrapping a whole page (or even a
  row of documentation frames) in one more slotted master — only shallow content (plain
  shapes/text, or at most one level of nested `Preview`) can go into a slot.
- **Mutating structure and reparenting in the same synchronous batch can throw on the first
  attempt and succeed immediately after splitting it into its own isolated call** — confirmed for
  both `slot.appendChild(newlyCreatedFrame)` and `layoutPositioning = 'ABSOLUTE'` writes (see
  below). If an append/reparent throws right after a structural change to the same parent, retry
  it in its own call with nothing else alongside it before assuming a real bug.

## Variant sets and instances

- **Never move a `COMPONENT_SET`'s variant child into another frame — always
  `variant.createInstance()` instead**, even when the goal is "show the real component." A
  variant can only be a direct child of its own set; moving it out empties (and Figma then
  auto-deletes) the set, stripping variant-property grouping from the remaining children.
  Recoverable via `figma.combineAsVariants()` plus manually renaming each child back to
  `key=value` format, but cheaper to never do this in the first place.
- **A component set's master can end up with `parent: NONE` (orphaned at the page-tree level)
  even though it's a completely healthy node with valid content** — symptom: `node.parent` is
  falsy and the set doesn't appear in `page.children`, but `figma.getNodeByIdAsync(id)` still
  resolves it fine. Fix: `page.appendChild(set)` — safe, non-destructive. Check this explicitly
  (`set.parent?.type`) before manipulating any previously-built master set from an earlier
  session.
- **A master component's child with a hardcoded `visible: false` is not instantiated on fresh
  instances at all** — Figma drops it entirely; it does not carry over as a hidden override.
  `findOne`/`findAll`/`.children` on a fresh instance can't find a node that isn't there. This
  breaks the `show <name>` pattern whenever a layer's visibility is set via plain `node.visible =
false` instead of a real component property. **Fix: the master's layer must stay `visible:
true`, with visibility driven by a real `BOOLEAN` component property** —
  `set.addComponentProperty('show <name>', 'BOOLEAN', false)` on the set, then
  `layer.componentPropertyReferences = { visible: propKey }` on every variant child (keeping
  `layer.visible = true`). A layer that must be structurally and unconditionally absent for one
  variant branch regardless of any boolean (e.g. a code-gated icon) is the one case where a
  hardcoded `visible: false` with no property reference is correct.
- **A `Section`/`Preview` instance nested inside another `Preview`'s slot does not auto-resize to
  fit content appended into its own slot** — it stays at the master's small default size until
  explicitly `resize()`d. Same root cause class as the stale-bounding-box issue (an instance
  doesn't auto-hug around manually-appended slot content).
  - **`resize()` alone leaves the node `layoutSizingVertical: 'FIXED'`** — a baked-in pixel height
    that silently clips or under-fills if the slot's content ever changes. **Correct sequence:**
    `resize(w, h)` first (to escape the master's wrong default height), then immediately
    `node.primaryAxisSizingMode = 'AUTO'; node.layoutSizingVertical = 'HUG'` — the resize value
    becomes the honest initial size, but the node goes back to genuinely hugging real content.
    Verify `layoutSizingVertical` reads back `'HUG'` before moving on; don't rely on a later
    sibling-append accidentally re-triggering the hug.
- **A hand-built sidebar/row frame inside a filled slot needs its height sized for its full
  content, including the last item's own height** — an off-by-one-item-height mismatch silently
  clips the last 1-2 children via the frame's default `clipsContent: true`, with no error. Compute
  the real required height (sum of every child's height + every gap + top/bottom padding) before
  setting a fixed height on a `clipsContent: true` frame holding manually-positioned children.

- **Recreating a set to fix option order keeps its instances** (`ds-spinner`, 11.11.2026: `size`
  `sm, base` → `base, sm`, 360 instances): before deleting, record each instance's variant name and
  component-property values; clone the variants in reading order into a temporary frame,
  `combineAsVariants`, copy the old set's fills, stroke, dash and radius, re-add and re-bind the
  properties (clones lose `componentPropertyReferences`), then per instance
  `swapComponent(<same-named new variant>)` — overrides such as fills survive — and `setProperties`
  with the new keys. Delete the old set only when it has 0 instances. Re-check doc instances that
  must show the default variant (Copy me, Variations).
- **`swapComponent` keeps overrides on layers with the same name** (seen 19.11.2026, `ds-accordion`
  Behavior card): the template's placeholder `Component` has a `label` with centered, wrapping
  text and padding overrides; swapped to Accordion, whose text layer is also `label`, the
  instance kept them (centered summary, extra padding). Replace a template placeholder with a
  fresh `variant.createInstance()` at the same index (then remove the placeholder) instead of
  swapping, and check `instance.overrides` afterwards — only `width` / `height` may remain.

## Auto-layout and positioning

- **`figma.createAutoLayout()` defaults every new frame to a solid white fill** — clear it
  explicitly (`fills = []`) on every purely-structural wrapper frame; only intentionally-chromed
  frames (header, `Component Sets` column, etc.) should keep a fill. A blanket fill-clear across a
  frame's children can also hit sibling **text** layers that need their own color kept intact —
  clear wrapper frames specifically, not every child indiscriminately.
- **Appending a plain overlay node (e.g. a grid-line rectangle) into an auto-layout frame pulls it
  into the layout flow and disrupts the stack, unless `layoutPositioning` is set to `'ABSOLUTE'`
  on it first** — this opts the child out of auto-layout positioning, letting it use free `x`/`y`
  coordinates as a true overlay. See the "Platform limits" note above for the same-batch-throw
  caveat on this call.
- **An auto-layout frame's "minimum width, grow if content needs more" behavior needs no manual
  spacer-node workaround** — the Plugin API supports `minWidth`/`maxWidth`/`minHeight`/`maxHeight`
  natively on any auto-layout frame. Set `layoutSizingHorizontal = 'HUG'` plus `minWidth = <px>`
  directly on the frame; it hugs its real content but never shrinks below the minimum, and grows
  past it automatically if a `FILL`-sized child needs more room.
- **Park unused/off-grid variants in the _negative_ x/y direction, never positive.** A positive
  offset just extends the page's visible bounding box past the documentation frames, so "parked"
  content still shows up as loose debris in a page-level screenshot. Use a large negative
  coordinate (e.g. `y: -10000`).
- **`SPACE_BETWEEN` ignores a bound `itemSpacing`** (seen 19.11.2026, `ds-accordion`): with
  `primaryAxisAlignItems = 'SPACE_BETWEEN'` the gap is "auto", so a `FILL` child runs into its
  neighbour (gap 0) although `itemSpacing` stays bound. For CSS `justify-content: space-between`
  - `gap` + a `flex: 1` child, use `primaryAxisAlignItems = 'MIN'` with the child `FILL`.

## Vector/SVG import

- **When importing SVG art via `figma.createNodeFromSvg`, always `rescale()` the whole imported
  frame to the target token size — never `resize()` (or bind width/height on) an inner node's
  tight content bounding box.** A path's tight bbox rarely equals the SVG's declared canvas
  (`viewBox`) and isn't necessarily centered within it; resizing the tight bbox distorts aspect
  ratio. Also, `findOne(n => n.type === 'VECTOR')` only grabs the _first_ vector in a multi-path
  SVG, silently dropping the rest. Correct pattern: `imported.rescale(targetSize /
imported.width)`, then move **all** `imported.children` (via `findAll`, not `findOne`) into the
  component, recoloring every one.

## Color and paint

- **Changing a main component's paints doesn't always reach its instances inside slots**
  (17.11.2026, binding the `Spec/*` marker colors): the placed `Spec/Inset` / `Spec/Gap` /
  `Spec/Icon size` instances in the Measurements slots kept 100% opacity after the mains were bound
  and their opacity restored, with no override listed. Re-check placed instances after editing a
  main and set the paint on them too (same variable, same opacity). Binding with
  `setBoundVariableForPaint` in a bulk loop also reset paint opacity to 100% — read the opacity
  back and restore it.
- **When rebinding a cloned variant's paint to a variable, create the paint with the variable's
  resolved value as its color — never a placeholder.** After `setBoundVariableForPaint`, a master
  can keep rendering the placeholder color even though the binding is correct and instances
  resolve fine. Build the paint from `variable.resolveForConsumer(node).value` before binding.
  Easy to miss: only the masters look wrong, the documentation instances look right. Include the
  alpha: a transparent token on an opaque placeholder renders as a solid shape. (From: `ds-close`,
  05.11.2026 — transparent `base` background rendered as a black circle, navy icon as black.)
- **Every skill-authored label/annotation text on the documentation page — never the component's
  own content — binds its fill to the Foundation variable `🔗 Alias/🔤 Text/Color/Primary`, never a
  hardcoded literal color**, even when the literal happens to match the token's resolved value
  exactly. Covers things this skill builds as chrome around the real component (Measurements card titles, Component Set sub-labels). Does not cover text that's part of the real
  component/master being documented. When in doubt which color a piece of skill-authored text
  should use, default to `Alias/Text/Color/Primary` rather than guessing a hex value.

## Text properties

How to bind a `TEXT` component property (`../PHASE-3-BUILD.md` → "Text properties"). Not yet
proven on a real run: confirm each point on the first build and update this section.

- **The key comes back suffixed** — `addComponentProperty('label', 'TEXT', 'Label')` returns
  `label#123:4`. Store it; `componentPropertyReferences` and `setProperties` need the full key.
- **Load the node's fonts before binding** (`getStyledTextSegments(['fontName'])`): binding writes
  `characters`, and writing `characters` resets per-range styling. Re-check afterwards that the
  token bindings (`fontFamily`, `fontSize`, `fills`, `letterSpacing`) survived. If they didn't,
  bind the text property **before** the token bindings.
- **Renaming a property in place:** `set.editComponentProperty(key, { name })` renames boolean,
  text **and variant** properties (`labelPosition` → `label position` on `ds-spinner`, 11.11.2026).
  Node ids, keys and every instance's values are kept; axis label texts on the canvas are not
  renamed with it.
- **A node can carry both references** — `{ characters: textKey, visible: showKey }` for a text
  property guarded by a `show <name>` boolean.

## Focus states

- **Every focus state uses the shared `Focus ring` component — never `DROP_SHADOW` effects.**
  The set lives on the `Core / Utilities` page (`6284:21`, key
  `2454d0fabf5c8fcb51b8b44de7a4fec90e9120c8`): `inverted` (`Focus/Color/Base` or `Inverted`) ×
  `inset` (`focus-shadow` → outer 5 + white 2 outside the host; `focus-inset-shadow` → start 5 +
  end 3 inside it), every stroke weight and color bound to the `🔗 Alias/✨ Interaction/Focus/*`
  variables. Per focus variant: append an instance named `focus-ring` as the **last** child,
  `layoutPositioning = 'ABSOLUTE'`, `x = y = 0`, resized to the variant, constraints `STRETCH`;
  keep `clipsContent = false` on the variant, or the outer rings are cut off. Set the ring frames'
  corner radii to the host radius + offset (outer +5, inner +2; inset = host radius; round hosts:
  full) on **every** instance — the master is neutral (48 × 48, host radius 0, since 19.11.2026),
  and a radius equal to the master's value is inherited, not kept as an override, so a later
  master change would move it. Why: a Figma drop shadow is drawn from the layer's own fill, so on a transparent
  background (`secondary`, `ghost`, `link`) a shadow ring renders as nothing, and its spread only
  renders with clipping on (seen on `ds-button`, 19.11.2026).
