# Phase 3 — Build incrementally

**You are here:** assumes [`PHASE-2-PROPOSE.md`](PHASE-2-PROPOSE.md) got an explicit user
confirmation on the variant grouping and grid sketch in `<name>.figma.md`. This phase builds the
real Figma component set from that confirmed mapping.

1. Load `figma-use` (mandatory before any `use_figma` call) and create a session against
   `figma.config.json`'s `componentLibraryFileKey`.
2. Create (or reuse, if already present) a dedicated **Figma page** named after the component.
3. Build **one full variant combination first** — pick the default/base combination (every
   variant property at its default value, state at `default`). Wire up:
   - The component's shape/layout.
   - Every styled value bound to its resolved Figma variable from Phase 1 (never a literal).
   - Every nested component as an **instance of the existing Figma component** resolved in
     Phase 1, step 4 — never redrawn from scratch.
4. Take a screenshot of this first combination (`get_screenshot`) and show it to the user as a
   checkpoint before continuing. This catches a structural mistake (wrong variable bound, wrong
   nested instance) once, before it's replicated across the full variant matrix.
   - **Line-height variables cannot be true-bound — API limitation, not a missing token.** This
     repo's line-height tokens are percent-semantic FLOAT values (e.g. `150` meaning 150%, per
     `LINE_HEIGHT_PERCENT_MULTIPLIER` in `apps/toky/src/tokens/figma-map.ts`). Confirmed by
     testing: binding a FLOAT variable to a text node's `lineHeight` via `setBoundVariable` /
     `setRangeBoundVariable` **always** applies it as `PIXELS`, regardless of what unit was set
     on the node immediately before the bind call — there is no way to bind a percent-semantic
     FLOAT token to `lineHeight` through the Plugin API. Workaround: resolve the variable's
     numeric value yourself (walk its `VARIABLE_ALIAS` chain via `getVariableByIdAsync` until you
     hit a literal number), then set `node.lineHeight = { unit: 'PERCENT', value: resolvedValue }`
     as a **literal, unbound** value — do not call `setBoundVariable`/`setRangeBoundVariable` for
     `lineHeight` on a percent-semantic token. Record this in `<name>.figma.md`'s tokens list as
     an exception (resolved but intentionally unbound, with the reason), not as a hard stop —
     the token exists and its correct value is applied, it's just not a live binding.
   - **Binding `fontFamily`/`lineHeight` on an empty text node doesn't survive setting
     `characters` afterward** — text styling is per character-range, so writing new characters
     resets any binding applied while the node was empty. Set `characters` (and load whatever
     font that content needs) **before** calling `setRangeBoundVariable` for text properties, not
     after.
   - **Font-loading gotcha:** binding `fontFamily` to an Alias text-family variable (e.g.
     resolving to `Baloise Create Text`) changes the node's effective font. Any further text
     property write on that node then requires that exact font to be loaded first
     (`figma.loadFontAsync`), even if a different font (e.g. Inter) was loaded earlier in the
     same script — load the _resolved_ font family, not just a default.
5. On confirmation, fan out: build the remaining variant/state combinations as a Figma component
   set, reusing the same bindings and nested instances.
6. Write the resulting Figma component key/node-id back into `<name>.figma.md`.

**Next: [`PHASE-3B-DOCUMENT.md`](PHASE-3B-DOCUMENT.md)** — once the full variant matrix is built
and the component key is written back. Build the documentation page before Phase 4's review, so
that review covers the documentation page too, not just the raw component set.
