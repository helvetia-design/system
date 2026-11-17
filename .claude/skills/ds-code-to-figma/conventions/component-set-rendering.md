# Conventions — Component Set labeling, sizing, and rendering (Phase 3)

Relevant to Phase 3's "Labeled component set" section specifically. See `../CONVENTIONS.md` for the
index.

## Option and axis ordering

Single source of truth — `PHASE-2-PROPOSE.md` (grid sketch), `PHASE-3-BUILD.md` (build) and
`PHASE-4-VALIDATE.md` (check) all follow it. Two **hard rules**, in priority order — rule A wins
when they conflict.

### Hard rule A — the default variant sits in the top-left cell

Figma treats the top-left variant of a set as its default — the one users get when they insert
the component from the library. So on **every axis the code-default option comes first**: leftmost
column, top row, first outer row group. The top-left cell is therefore the default variant, and its
layer is the first variant layer. This applies to every axis — `size` (`base`), `state`
(`default`), booleans (the code default, usually `false`), any other enum — and overrides rule B.

### Hard rule B — every other option follows canonical order

After the code default, the remaining options run **smallest/first at the left (column axes) or
top (row axes), largest/last at the right or bottom**:

1. **T-shirt scale:** `3xs · 2xs · xs · sm · base · md · lg · xl · 2xl · 3xl`. A component uses
   only the subset it has. With `base` as the code default it moves to the front per rule A and
   the rest keep scale order: `base · xs · sm · md · lg`.
2. **`state`:** `default / hover / focus / active` (only those the component has), interaction
   states only. Component-state variants (`disabled`, `loading`, `invalid`, …) follow as extra
   columns (one per blocked state, a group of interaction-state columns per interactive one) in prop declaration order (`../PHASE-2-PROPOSE.md` → "Component-state columns"). `readonly` is out of scope for
   Figma.
3. **Boolean axes:** `false` first, then `true` (unless the code default is `true`).
4. **Any other axis:** source order of the TypeScript union/enum. Never alphabetical.
5. **Mixed axis** (scale members plus other values, e.g. `sm | base | lg | full`): scale members
   first in scale order, then the non-scale values in source order.
6. **Numeric-only axis** (`16 | 24 | 32`, `1`–`6`): ascending. If numerics are mixed with words,
   rule 5 applies, with the numerics treated as non-scale values.
7. **Row-axis nesting:** fewest options outermost; ties broken by prop declaration order,
   first-declared outermost.

## Labeling

- **Every `COMPONENT_SET` display gets row/column labels and dashed internal grid dividers — no
  axis count is ever exempt, not even a single-axis set.** Count the real crossed axes first;
  this is a required check, not an optional judgment call — skipped twice already (`ds-spinner`,
  then `ds-logo`), both caught by the user after shipping unlabeled. The full structure (Row
  Labels, Column Labels, Grid overlay, sizing rules) is specified in
  `PHASE-3-BUILD.md`'s "Labeled component set" section — read it before building this section,
  don't rebuild from memory of a prior run.
- **Build the Grid overlay as plain `x`/`y` children of a `layoutMode: 'NONE'` wrapper frame
  around the `COMPONENT_SET`, not as an `ABSOLUTE`-positioned child of an auto-layout parent.**
  Sidesteps the `ABSOLUTE`-positioning pitfalls below entirely, since a `NONE`-mode frame's
  children don't need `layoutPositioning` set at all. Prefer this for any future Component Set
  grid, labeled or not.

## Sizing and layout mechanics

- **A `COMPONENT_SET`'s own `width`/`height` does NOT auto-update when its variant children are
  repositioned** — unlike an auto-layout frame, it never re-hugs (`layoutMode: 'NONE'`), and a
  stale cached bounding box silently crops it to nothing in a screenshot with zero error. Every
  node-level check (`visible`, `opacity`, `fills`, `absoluteTransform`) can report completely
  correct values while only the set's own `width`/`height` is wrong. **Fix: after repositioning a
  set's children, explicitly `set.resize(width, height)` to the real bounding box they now
  occupy** — don't assume moving children is enough, the way it is for an auto-layout frame.
- **`COMPONENT_SET` variant children cannot be manually positioned via Figma's native `GRID`
  layout mode** — `gridRowAnchorIndex`/`gridColumnAnchorIndex` throw `read-only property on
COMPONENT node` when set on a variant child, and auto-assignment never populates them either.
  For any custom grid arrangement of a set's own variants, use `layoutMode: 'NONE'` with manual
  `x`/`y` positioning — there's no working auto-layout path for this via the plugin API.
- **Figma's native `layoutMode = 'GRID'` "smart conversion"** (auto-arranging an existing
  `NONE`-mode variant set's children into a clean, evenly-spaced grid — uniform padding, uniform
  row/column gap, children repositioned onto uniform anchors) **is real and powerful but
  non-deterministic within a single session — don't depend on it succeeding twice in a row.** It
  worked perfectly once on `ds-spinner`'s `Primary` set, then failed to reflow on the
  structurally-identical `Inverted` set across many retries in the same session (`layoutMode` read
  back as `'GRID'` with no error, but children never moved). **Fallback that always works:**
  manually copy the first, successfully-converted set's real final child `x`/`y` positions onto
  the stuck set's matching-named children (same variant property names → same relative position),
  then set the stuck set's `layoutMode` back to `'NONE'` and `resize()` to match. Treat native
  `GRID` conversion as "try it, don't fight it if it doesn't take."
- **A rotated `LINE` node (`resize()` to its length, then `rotation = ±90`) can silently fail to
  render inside an absolute-positioned overlay frame, even when its `absoluteTransform` is
  independently verified mathematically correct.** Suspected cause: clip-testing or render-bounds
  computation using the node's pre-rotation bounding box, which can sit entirely outside the
  parent's bounds even though the post-rotation geometry is entirely inside them. **Fix: clone the template's
  vertical divider prototype** (a `RECTANGLE`, `fills: []`, 0.01 wide, `strokeLeftWeight` 2,
  dashed) and change only height and position.
- **The `Grid` overlay must come after the component set in its parent** (`Column Labels`, set,
  `Grid`). Below the set it is fully covered by the set's own fill — every divider exists, reports
  a correct `absoluteRenderBounds`, and still doesn't show. (From: `ds-close`, 05.11.2026 — the
  new set was placed after `Grid`.) Horizontal (non-rotated) `LINE` nodes are
  unaffected — this is specific to rotation.
- **Setting `layoutPositioning = 'ABSOLUTE'` in the same script call as a later operation that
  throws rolls back the `ABSOLUTE` write too**, even though it executed and returned successfully
  earlier in that same call. Isolate every `layoutPositioning = 'ABSOLUTE'` write into its own
  call, with nothing else risky alongside it.

## Screenshot reliability for this section

- **`get_screenshot` targeting a nested frame/table node (not the page itself) unreliably
  composites cross-branch overlapping content — prefer the page's own `nodeId` for any
  multi-subtree overlay checkpoint.** Even page-level screenshots aren't 100% reliable for very
  complex composites. If a screenshot shows unexpectedly missing content after exhaustive
  position/data verification, suspect the tool before assuming a real file defect — but note the
  caveat in `<name>.figma.md` rather than silently trusting either outcome.
- **A blank/wrong `get_screenshot` render is not always the stale-screenshot-cache pitfall** —
  re-screenshotting isn't a universal fix. Before concluding "just re-screenshot," check whether a
  suspiciously identical repeat screenshot's byte size is **exactly** the same (a strong signal of
  a real, reproducible state) and verify the suspect node's own reported `width`/`height` against
  where its children actually sit — it may be the stale-bounding-box issue above, not a cache
  issue.
- **Conversely, after a rapid burst of programmatic edits, `get_screenshot` can also come back
  genuinely blank for content that is 100% structurally correct** (right `visible`/`opacity`/
  `fills`, right `absoluteTransform`), with a later re-screenshot of the exact same, untouched node
  rendering it correctly — a real render-pipeline lag, not a structural bug. **Distinguish the two
  cases by what you check, not by assuming either default:** if the suspect node's own
  `width`/`height` or clipping-ancestor bounds don't match where content visually should be, that's
  the structural bug above — fix the geometry. If every property checks out and nothing geometric
  explains the gap, wait a few tool-calls' worth of time (not a `sleep`) and re-screenshot the
  exact same node before changing anything.
