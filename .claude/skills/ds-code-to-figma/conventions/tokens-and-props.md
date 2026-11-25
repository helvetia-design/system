# Conventions — token resolution & prop analysis (Phase 1)

Relevant to Phase 1's analysis.

## Resolving tokens

- **Resolve a CSS var to its token name locally, from `Base.tokens.json`.**
  `scripts/figma-sync/lib/css-token-lookup.mjs` turns a `--ds-*` var into the token `path`; the
  path joined with `/` is the Figma variable name in Foundation (`PHASE-1-ANALYZE.md` step 5).
  The `com.figma.variableId` values in `Base.tokens.json` belong to the component file's old
  local token copy — don't bind by them.

## Binding Foundation variables

Tokens live in the **Foundation** library (`figma.config.json` → `foundationLibraryFileKey`,
collections in `foundationVariableCollections`); components bind to them, never to a local
variable collection of the component file. Checked 17.11.2026:

- **From the component file, Foundation variables can't be listed or searched** —
  `teamLibrary.getVariablesInLibraryCollectionAsync` returns 0 and `search_design_system` finds
  none, although the variables are published and designers see them in the picker. **Importing
  by key works:** `figma.variables.importVariableByKeyAsync(key)` returns the library variable
  (`remote: true`, id `VariableID:<key>/<id>`), which binds like any variable.
- **So read the name → key map from the Foundation file itself**, once per run, in a read-only
  `use_figma` call on `foundationLibraryFileKey`:
  `(await figma.variables.getLocalVariablesAsync()).map(v => [v.name, v.key])`. Keep only the
  names the component needs. Phase 1 uses the same read to check every name exists; Phase 3
  imports each by key and binds it.
- Names follow the token path: `🔗 Alias/🔤 Text/Color/Primary`; a responsive token has one
  variable per breakpoint (`<path>/Mobile`, `/Tablet`, `/Desktop`) and, when the token sync
  created one, a routing variable `<path>/Device` in `Design Responsive Tokens`.
- **Never create a variable** in Foundation or in the component file. A missing token or routing
  variable is a hard stop: list it and ask the user to add it through the repo and the token
  sync (stop and list, user decision 17.11.2026).
- A remote alias resolves with `variable.resolveForConsumer(node)`; use it to read a value
  (text `lineHeight` / `textDecoration`, paint colors).
- **No visual attribute is ever assumed — every value on every Figma node needs an explicit,
  resolved design token, even if the component's own SCSS never sets that attribute at all.** An
  inherited attribute (e.g. `color`/`font-size` on a text part that relies on Shadow DOM
  inheritance, like `ds-spinner`'s label) still needs a token bound to it in Figma — there's no
  shadow-DOM inheritance to fall back on there, only Figma's own stale default. Treat a missing
  token for _any_ attribute (inherited, hardcoded in `.tsx`, or CSS-var-bound) as the same hard
  stop: ask the user to pick an existing token or explicitly accept a one-off hardcode.
- **A text part with no explicit `color`/`font-size` in the component's own SCSS still needs
  explicit color/size bound in Figma.** Bind to this system's default text treatment
  (`Alias/Text/Color/Primary`, `Device/Text/Size/Base/Device`) and flag it in `<name>.figma.md` as
  an inherited-context binding, not a literal one. (From: `ds-spinner`'s label part.)
- **Responsive (device-mode) token bindings are a formal part of this skill** — detection lives in
  `PHASE-1-ANALYZE.md` step 5a, the `device:` field in `../examples/mapping-file-format.md`, and the
  routing-variable create-or-reuse mechanism in `PHASE-3-BUILD.md` step 3. Known standing risk:
  the routing variables this mechanism creates are hand-built, not emitted by `scripts/figma-sync`
  — if the underlying per-breakpoint variables are ever renamed/removed, the alias targets go
  stale with no automatic fix. `ds-icon` is a known, not-yet-fixed gap (a real `@include tablet`
  override predates this formalization) — revisit in a dedicated run, not opportunistically.

## Verifying a claimed value or behavior before trusting it

- **A prop's JSDoc comment can itself be wrong or incomplete** — verify its claimed behavior
  against the real computed/rendered output during Phase 1, don't just transcribe it.
  `ds-icon`'s `turn` was documented as "rotated 180deg" but the real CSS only rotates 3 specific
  icon names, one by 225deg — confirmed via `getComputedStyle` matrix inspection, not by re-reading
  the SCSS harder. When a check reveals the _component's own code doc_ was wrong (not just the
  Figma mapping), fix the code doc too, in the same pass.
- **Never assume a size token's value is the visible size of what it's bound to** — verify against
  the real rendered output, especially for animated (Lottie/CSS keyframe) or composite vector
  assets. A size token may describe the host container/hitbox, not the visible glyph inside it.
  Render the real component in a browser and measure `getBoundingClientRect()` on the actual
  visible path/shape elements vs. the host container — not the SVG element's own box. Check the
  ratio at two different size variants; a consistent ratio (not a fixed pixel padding) confirms a
  proportional relationship. (From: `ds-spinner`'s `logo` variation — measured 86.3%
  glyph-to-container, not the 100% initially assumed.)
- **A CSS-animated element's `getBoundingClientRect()` is unreliable mid-animation** — a rotated
  square's axis-aligned bounding box is naturally larger than its own side length at any angle
  other than 0/90/180/270°. Prefer `getComputedStyle(el).width` over the rendered bounding box for
  anything with a running CSS `animation`, or measure a paused instance. (From: `ds-spinner`'s
  circle review sweep, which read ~30px for a token that's actually exactly 24px.)
- **When a library recolors nested SVG content dynamically (e.g. `lottie-colorify`), querying the
  first matching `path`/`g` can land on an unstyled wrapper, not the actual colored leaf
  element** — its computed `fill` then reads the SVG spec's initial value (`black`), not the real
  applied color. Check the `fill` _attribute_ directly across all matching descendants and use the
  one that actually has a non-null value set.
- **A tiny/compressed baseline screenshot can be visually misread** — confirm a suspected color or
  rendering discrepancy against live `getComputedStyle` before reporting it as a finding. A
  79px-tall multi-row baseline PNG made an inverted icon row look like it had color variation it
  didn't actually have; the real computed value was uniform. Don't trust a quick visual read of a
  small/compressed image for a color-equality judgment.
