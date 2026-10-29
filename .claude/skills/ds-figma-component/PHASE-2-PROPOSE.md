# Phase 2 — Propose variant grouping

**You are here:** assumes [`PHASE-1-ANALYZE.md`](PHASE-1-ANALYZE.md) has produced a draft
`<name>.figma.md` — props, anatomy, states, and resolved tokens are all written down. This phase
turns that draft into a concrete Figma variant-grouping proposal and gets explicit user sign-off
before anything is built.

1. Read `CONVENTIONS.md` in this skill's folder for heuristics learned from prior components.
2. Draft how the analyzed props/states collapse into Figma variant properties:
   - An enum prop (`@OneOf([...])`) → one Figma variant property, same name, same options — but
     only when every option re-skins the **same layers** (a different token value on an
     otherwise identical shape, e.g. `size: sm/base` scaling the same shape, or a badge `color`
     swapping a fill token on the same pill). If the options instead require **different
     layers/structure** — e.g. a button `color`/`type` prop where `primary` is a solid fill,
     `ghost` is a transparent fill + border, `link` is text-only with an underline — don't force
     it into one variant set. Split it into separate top-level components instead, swapped via
     Figma's native Instance Swap, same treatment as the `inverted` axis (Phase 3b) and an
     open-ended content-selection prop like icon `name`. Confirmed against the TapTap Design
     System's own Button, which models exactly this (`Button/Primary`, `Button/Ghost`,
     `Button/Link`, `Button/Outline` as separate top-level components, never a shared "style"
     variant). **The test is never the prop's name or whether it's an enum — it's: same layers,
     different token → variant; different layers/structure → top-level split via instance swap.**
   - A plain boolean prop with no state/interaction meaning → one boolean Figma property.
   - A free-text prop (e.g. `label`) → never a variant property; it maps to an instance text
     override. **Check the component's `render()` for a conditional guard around it** (e.g.
     `hasValue(label) && <span>...`) — if the element only renders when the prop is non-empty,
     add a paired boolean component property (`addComponentProperty('Show <name>', 'BOOLEAN',
<code's real default>)`) bound to that layer's `visible` via `componentPropertyReferences`
     on every variant. Don't rely on empty text alone — Figma won't collapse the auto-layout
     gap/width for a present-but-empty text layer the way code's conditional omits the element
     outright. See `CONVENTIONS.md`.
   - **Every pseudo-class state and state-ish prop** (`:hover`, `:focus`, `:active`,
     `disabled`, `readonly`, `loading`) **collapses into one `state` Figma variant property**
     (`default` / `hover` / `focus` / `active` / `disabled` / `readonly` / `loading`, limited to
     whichever of these the component actually has) — never separate axes, never separate
     booleans.
   - Anything ambiguous (doesn't fit the rules above cleanly) is flagged explicitly rather than
     guessed.
3. **Sketch the resulting variant grid itself, not just the property list** — how many axes
   there are determines Figma's own native variant-grid arrangement, and the user should be able
   to picture it before Phase 3 builds anything. **This ASCII sketch is a planning/counting aid for
   the variant matrix, not a literal rendering of Phase 3b's "🔒 Component Set" section** — that
   section no longer draws table chrome (headers/gridlines/cells); it just places the real
   `COMPONENT_SET` and lets Figma's own `combineAsVariants()` arrange its children natively. Include
   this sketch (plain ASCII, in the same draft) alongside the proposed grouping:
   - **2 axes (the normal case)**: one simple grid — one axis across the header row, the other
     down the header column, e.g. `state` (rows: default/hover/active/disabled/...) × a
     same-layers prop like `size` (columns: sm/base). One cell per combination, same shape as the
     variant matrix Phase 3b's "🔒 Component Set" section will show:
     ```
                sm        base
     default  [cell]    [cell]
     hover    [cell]    [cell]
     active   [cell]    [cell]
     ```
   - **3 axes**: don't try to flatten three axes into one table. Pick the two axes with the most
     "shape" similarity (state × size is the common pair) as the one grid's rows/columns, and let
     the third same-layers axis (e.g. `color`) repeat the whole grid once per option — one 2-axis
     grid per color, each stacked on the same frame under its own title label naming that option:
     ```
     Primary
                sm        base
     default  [cell]    [cell]
     hover    [cell]    [cell]

     Secondary
                sm        base
     default  [cell]    [cell]
     hover    [cell]    [cell]
     ```
   - **4+ axes, or any axis that is structural rather than same-layer** (different layers/shape
     per option, not just a different token on an identical shape — same test as the enum-prop
     rule above, and the same treatment `inverted` already gets in Phase 3b): stop stacking grids.
     That axis is a top-level split signal, not another grid dimension — split it into separate
     top-level components (Instance Swap), and sketch each split component's own grid separately,
     each with its own frame/title, same as `inverted`'s light/dark two-frame layout.
   - State which case applies to this component (2-axis / repeated-grid / top-level-split) before
     moving to step 4's approval ask, so the user is confirming an actual layout, not just a
     property list.
   - **Worked example — `ds-spinner`'s real, confirmed layout** (see `spinner.figma.md`'s "Major
     rebuild — Main components split into two titled grids" section): it has 4 axes —
     `variation` (logo/circle), `size` (sm/base), `labelPosition` (right/bottom), `inverted`
     (false/true). `inverted` is structural (case 3) → split into two top-level component sets,
     `Spinner/Primary` and `Spinner/Inverted`, each on its own full frame. Within each frame, 3
     axes remain → `variation` is the repeated-grid axis (case 2): one titled grid per
     `variation` value, each grid being a 2-axis table (case 1) of `labelPosition` (rows:
     Bottom/Right) × `size` (columns: Base/SM):
     ```
     Spinner/Primary                        Spinner/Inverted
     Logo                                   Logo
                Base      SM                           Base      SM
     Bottom   [cell]    [cell]              Bottom   [cell]    [cell]
     Right    [cell]    [cell]              Right    [cell]    [cell]

     Circle                                 Circle
                Base      SM                           Base      SM
     Bottom   [cell]    [cell]              Bottom   [cell]    [cell]
     Right    [cell]    [cell]              Right    [cell]    [cell]
     ```
     This is the end state after several rebuild iterations on the real component — sketching it
     this way up front in Phase 2 is what lets the user catch "2 titled grids, not 1 table" before
     Phase 3 builds anything, rather than discovering it only after a build-review-rebuild cycle.
4. **Compute the total variant count and check it against the 500-variant hard-stop threshold**
   before presenting anything for approval. This is this skill's own conservative ceiling, not a
   number Figma enforces — Figma's own docs only warn qualitatively (performance issues appear
   with "thousands" of variants per set, no fixed number given) and describe a shared ~2GB-per-tab
   memory budget across the _whole_ library file, not per-component. Staying well under it leaves
   headroom for every other component sharing that file.
   - **Count** = sum, across every top-level split (e.g. each separately-split icon name from the
     content-selection-prop rule), of the product of that split's own crossed variant-property
     option counts from step 2 above (every variant property, including `state`).
   - **Exclude lightweight Instance Swap library members** (plain single `COMPONENT`s parked as
     swap targets, not crossed into a `COMPONENT_SET`) from the count — they're structurally
     trivial (one vector, no bound state/size variants) and don't carry the same performance cost
     as a crossed variant.
   - **If the count is ≤500**, continue to step 5.
   - **If the count exceeds 500**, stop here — do not present the grouping for approval yet.
     Identify which axis/axes are driving the count up and classify each by the same test used in
     step 2, then recommend a mitigation:
     - A **token-swap axis** — same layers, only a different Figma-Variable-bound value (color is
       the common case, but this generalizes to any variable-bound attribute, e.g. border-width or
       elevation) — is eligible for the **variable-override mitigation**: bind that attribute to a
       Figma Variable once and let consumers override it per-instance (`setBoundVariableForPaint`
       for paint fields, or the matching bound-variable setter for other field types) instead of
       crossing it into a variant property. This drops the axis from the cross-product entirely
       with zero new nodes created, at the cost of a less discoverable per-instance override
       instead of a variant dropdown — offer this specifically because the threshold was exceeded,
       never as a universal default (see `CONVENTIONS.md`).
     - A **structural or open-ended content-selection axis** (different layers/shape per option,
       or an unbounded set like icon `name`) is eligible for the existing **wrapper + Instance
       Swap split** pattern (see `CONVENTIONS.md`'s current rule, originally developed for
       `ds-icon`): one shared wrapper `COMPONENT_SET` crossing only the remaining same-layers
       sub-props, plus a lightweight Instance Swap library for the content axis.
     - **A size axis is never offered the variable-override mitigation** — resolve a
       size-driven explosion via a crossed variant (if it fits the budget on its own) or a
       structural split, never a variable swap.
       Present the count, the dominant-axis breakdown, and the recommended mitigation(s) to the user
       and ask them to choose (or combine both). Once they pick, recompute the total against the new
       structure and **repeat this check** — loop until the count is ≤500, the same way step 6 below
       loops on edits before approval.
5. Write the proposed grouping (and grid sketch) into `<name>.figma.md` and present it to the
   user for review.
6. **Stop and wait for the user to confirm or edit** the mapping directly in the file before
   proceeding to Phase 3. Do not proceed on an assumed approval.
7. Once confirmed, propose any new heuristic worth keeping (e.g. a grouping decision that didn't
   fit an existing `CONVENTIONS.md` rule) as an addition to `CONVENTIONS.md`. Show the user the
   exact diff and get approval before writing it — never auto-append.

**Next: [`PHASE-3-BUILD.md`](PHASE-3-BUILD.md)** — once step 6's user confirmation is received.
