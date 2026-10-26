---
name: ds-figma-component
description: Push a Helvetia Design System component from code into the Figma component library — resolving props/variants/states to Figma variant properties bound to existing Figma variables (tokens), reusing existing Figma components for nested children. Use when the user wants to create, add, or push a DS component (or a specific component like ds-spinner) into Figma.
---

# ds-figma-component

Creates a Figma component (one dedicated page per component) from an existing Stencil
component's code. Code is always the source of truth — this skill never invents a hardcoded
value, a new design token, or a Figma-side detail that doesn't trace back to the component's
actual props, states, and resolvable design tokens.

**v1 scope — create-only.** This skill pushes a component into Figma for the first time. It does
not update or reconcile an already-pushed component, and it does not generate Code Connect
mappings (use the separate `figma-code-connect` skill for that, using this skill's output as
reference). See [`code-to-figma.md`](../../../code-to-figma.md) at the repo root for the full
background and rationale behind these decisions.

Load `figma-use` alongside this skill before any `use_figma` call (mandatory per that skill's own
rule). Load `figma-generate-library` for its guidance on binding values to Figma variables and
reusing existing components, since the same discipline applies here.

## Prerequisites

- `figma.config.json` at the repo root must have a real `componentLibraryFileKey` (not the
  `REPLACE_WITH_FIGMA_FILE_KEY` placeholder). If it's still the placeholder, stop and ask the
  user for the file key before doing anything else.
- The target component must already exist in code (`packages/core/src/components/<category>/<name>/`).
- If the component nests another DS component (e.g. a button using an icon), the nested
  component's own `<child>.figma.md` must already exist and record a Figma component key. If it
  doesn't, stop and tell the user to run this skill on the child component first — do not
  recreate the child or fall back to a plain shape.

## Workflow

### Phase 1 — Analyze

1. Read `packages/core/src/components/<category>/<name>/<name>.tsx` and extract every **public
   `@Prop()`** — ignore `@Method`, `@Event`, and private `@State`. Note each prop's type
   (`@OneOf([...])` enum, boolean, string, number) and default.
2. Read the component's `<name>.host.scss` and scan for **pseudo-class states** —
   `:hover`, `:focus`, `:active`, `:disabled`, `:read-only`, and any loading-related
   class/attribute selector. These don't show up as props but still need a Figma
   representation (see Phase 2, rule 3).
   - Also scan **every text-bearing part for every attribute a Figma text node needs**: font
     family, font size, font weight, line-height, letter-spacing, color, text-decoration. A
     component's own SCSS commonly sets only some of these explicitly (e.g. a `::part(label)`
     that sets `font-family`/`line-height` but not `color`/`font-size`, as in `ds-spinner`) and
     relies on Shadow DOM inheritance from the light-DOM ancestor for the rest in real usage —
     that's expected, not a gap, in the component's own code. But it means the Figma text node
     has nothing to naturally fall back to, and will otherwise render with Figma's own
     stale/leftover default styling (observed: black, 12px) instead of anything representative.
     **Every one of these attributes still needs an explicit resolved token in `<name>.figma.md`'s
     tokens list — treat a missing one exactly like a missing CSS-var token in step 4, not as an
     exemption.** For attributes inherited from this system's own default text treatment (not set
     by the component's own code), bind to the matching system-default token — e.g.
     `🔗 Alias/🔤 Text/Color/Primary` for color, `📱 Device/🔤 Text/Size/Base/Device` for size (from
     the `Design Responsive Tokens` collection, mode-based) — and flag these as inherited-context
     bindings, not literal bindings to something the component's own code sets. Never leave an
     attribute unbound/assumed because the component's SCSS doesn't mention it.
3. Identify any **nested DS component** usage (e.g. `<ds-icon>` inside `ds-button`'s render). For
   each one, read its `<child>.figma.md` and pull the recorded Figma component key. If missing,
   stop per Prerequisites above.
4. For every value the component's SCSS binds to a CSS custom property (`var(--ds-...)`),
   resolve it to the matching Figma variable.
   - **The real token variables are LOCAL to the component-library file, not a published
     library.** They're pushed directly into the file by the GitHub workflow
     (`scripts/figma-sync`) as two local variable collections: `Design Tokens` (Alias/Component
     layer values, e.g. `🧩 Component/Spinner/Logo/Size/MD`, modes are brand modes — binding is
     brand-agnostic per the project's token architecture, don't reason about which mode) and
     `Design Responsive Tokens` (Device layer, modes `Mobile`/`Tablet`/`Desktop`).
   - `search_design_system` and `get_variable_defs` only search/read **published libraries** —
     they will not find these local collections, and can return misleading look-alike results
     from unrelated org libraries (e.g. old sandbox files that happen to use similar naming).
     **Do not use them for token resolution.** Any library attached to the file via
     `get_libraries` other than the file's own local variables (`Brand Assets`, `🧩 Components`,
     `Grid`, `Spacing`, `🖋 Typography`, `🎨 Colors`, `TokyTest` as of this writing) is legacy —
     ignore it for token resolution.
   - Resolve via `use_figma` (load `figma-use` first) instead:
     ```js
     const collections = await figma.variables.getLocalVariableCollectionsAsync()
     const designTokens = collections.find(c => c.name === 'Design Tokens')
     const names = []
     for (const id of designTokens.variableIds) {
       const v = await figma.variables.getVariableByIdAsync(id)
       if (v) names.push(v.name)
     }
     return names // then match against the component's --ds-* vars
     ```
     Do the same against the `Design Responsive Tokens` collection for any `--ds-device-*` var.
   - Token → Figma variable name follows this repo's `path.join('/')` convention (mirrors
     `scripts/figma-sync/lib/write.mjs`), e.g. `--ds-spinner-circle-primary-background` →
     `🧩 Component/Spinner/Circle/Primary/Background`. Emoji segment prefixes (`🔗`, `🧩`, `📱`,
     `↔️`, `🔤`, `▭`) are part of the real names — match loosely (strip/ignore emoji) rather than
     requiring an exact character match.
   - **Any value with no matching Figma variable is a hard stop.** Report it immediately — do
     not guess, do not push a hardcoded value, do not invent a new token. Ask the user whether
     to use a different existing token or explicitly accept a one-off hardcoded value for this
     specific case. Resolve this now, before Phase 2, not mid-build in Phase 3.
   - A value with no CSS-var binding in the component's own SCSS (e.g. a hardcoded literal in
     the component's `.tsx`, or an attribute the component's code never sets at all and instead
     inherits — see step 2's text-attribute scan) is **not exempt from token resolution — it
     still needs an explicit decision, same hard-stop rule as above.** If a matching Figma
     variable exists anyway (as found for `spinner.tsx`'s `getColor()` fallback, or for an
     inherited text attribute per step 2), bind to it for the Figma visual and note it in
     `<name>.figma.md` (flagging any code-side drift as a separate follow-up, not fixed here). If
     no matching variable exists, treat it exactly like a missing CSS-var token: stop, report it,
     and ask the user to pick an existing token or explicitly accept a one-off hardcoded value —
     never silently build it with an assumed or Figma-default value.
     4b. Before writing the draft file, build an explicit **completeness checklist**: list every node
     the Figma build will need (every text-bearing part, every filled/stroked shape, every spacing
     gap) and, for each one, every visual attribute it needs (text: family, size, weight,
     line-height, letter-spacing, color, decoration; shape: fill, stroke color/width, corner
     radius, dimensions, spacing). Cross-check each attribute against the tokens resolved in steps
     2 and 4 — any attribute with no corresponding entry is a gap, not an assumption to fill in
     during Phase 3. Surface every gap now, as a batch, using the same hard-stop flow as step 4,
     rather than discovering missing tokens one at a time mid-build.
5. Write all of the above into `<name>.figma.md` (create it if it doesn't exist) as a draft, per
   the schema in [Mapping file format](#mapping-file-format) below.

### Phase 2 — Propose variant grouping

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
     outright. See CONVENTIONS.md.
   - **Every pseudo-class state and state-ish prop** (`:hover`, `:focus`, `:active`,
     `disabled`, `readonly`, `loading`) **collapses into one `state` Figma variant property**
     (`default` / `hover` / `focus` / `active` / `disabled` / `readonly` / `loading`, limited to
     whichever of these the component actually has) — never separate axes, never separate
     booleans.
   - Anything ambiguous (doesn't fit the rules above cleanly) is flagged explicitly rather than
     guessed.
3. Write the proposed grouping into `<name>.figma.md` and present it to the user for review.
4. **Stop and wait for the user to confirm or edit** the mapping directly in the file before
   proceeding to Phase 3. Do not proceed on an assumed approval.
5. Once confirmed, propose any new heuristic worth keeping (e.g. a grouping decision that didn't
   fit an existing `CONVENTIONS.md` rule) as an addition to `CONVENTIONS.md`. Show the user the
   exact diff and get approval before writing it — never auto-append.

### Phase 3 — Build incrementally

1. Load `figma-use` (mandatory before any `use_figma` call) and create a session against
   `figma.config.json`'s `componentLibraryFileKey`.
2. Create (or reuse, if already present) a dedicated **Figma page** named after the component.
3. Build **one full variant combination first** — pick the default/base combination (every
   variant property at its default value, state at `default`). Wire up:
   - The component's shape/layout.
   - Every styled value bound to its resolved Figma variable from Phase 1 (never a literal).
   - Every nested component as an **instance of the existing Figma component** resolved in
     Phase 1, step 3 — never redrawn from scratch.
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

### Phase 3b — Documentation presentation (standard, build every time)

The raw component set (Phase 3) is not the deliverable on its own — every component also gets a
readable documentation layout on its Figma page, built from instances of the finished component
set. Build this after Phase 3 confirms the variant matrix looks right, before Phase 4's review.

**This is a fixed template, not a per-component judgment call — full spec in
[`DOCUMENTATION-TEMPLATE.md`](DOCUMENTATION-TEMPLATE.md), read it before starting Phase 3b.**
That file also names the canonical live reference frames (`ds-spinner`'s documentation page) to
inspect via `get_metadata` before building — don't rebuild the structure from prose alone each
time; mirror the real, already-correct nodes. Summary of what it covers: page background, outer
frame chrome, the four-section layout (Header / Copy me / Variants / Main components), the
light+dark two-frame split for an `inverted` axis, instance-vs-master-set rules, and every
known pitfall (fill-clearing, awaited promises, locked-overlay realignment, variant-set
dissolution, cell-label centering).

### Phase 4 — Review against visual regression screenshots

0. **For any animated (Lottie/CSS keyframe) or composite reused-vector mark, verify its real
   on-screen size before trusting the screenshot comparison, not just static analysis.** A size
   token binds the host container, not necessarily the visible artwork inside it — don't assume
   they're the same. If the dev server (`pnpm --filter core start`) is running or can be started,
   use Playwright (`browser_navigate` to the component's `*.visual.html`, `browser_evaluate` with
   `getBoundingClientRect()` on the actual visible path/shape elements, not the SVG element's own
   box) to measure the real glyph-to-container ratio, and compare it against what was built. See
   CONVENTIONS.md for the `ds-spinner` example (measured 86.3%, not the 100% initially assumed).
   Stop the dev server again when done if this skill started it.
1. For each built variant/state, capture a Figma screenshot (`get_screenshot`) and find the
   matching Playwright baseline under
   `packages/core/src/components/<category>/<name>/test/*.visual.play.ts-snapshots/*.png`.
2. Compare the two **visually, as the agent** — do not pixel-diff; Figma and browser rendering
   differ enough (anti-aliasing, font rasterization) to produce constant false mismatches on a
   pixel comparison.
3. Flag anything that looks substantively wrong (wrong color/token bound, missing or wrong
   nested icon, wrong size/spacing, wrong state rendering) as a finding — but this is advisory
   only. Never auto-pass or auto-fail. Report findings and let the user make the final call.
4. **Before reporting a suspected color/rendering mismatch from a screenshot, confirm it against
   live `getComputedStyle` in a browser, not just a visual read of a small/compressed PNG.** A
   79px-tall multi-row baseline image once made an inverted icon row _look_ like it had color
   variation it didn't actually have — two rows' content visually bled together at that
   resolution. Crop/zoom the image or measure the DOM directly before treating a visual
   impression as a finding.
5. **A prop's JSDoc comment can itself be wrong or incomplete — don't just transcribe a claimed
   behavior from Phase 1 into the final record without checking it against the real
   computed/rendered output.** `ds-icon`'s `turn` was documented as "rotated 180deg" but the
   real CSS only rotates 3 specific icon names, one of them by 225deg, not 180 — caught by
   comparing the real `turn` visual-regression baseline, confirmed via `getComputedStyle` matrix
   inspection. When Phase 4 reveals the _component's own code doc_ was wrong (not just the Figma
   mapping or `<name>.figma.md`'s draft notes), fix the code doc too, in the same pass — code is
   the source of truth for documentation copy (Phase 3b's lead-paragraph rule), so a
   known-wrong comment shouldn't survive a run that just disproved it.

## Mapping file format

`<name>.figma.md` lives at `packages/core/src/components/<category>/<name>/<name>.figma.md`,
co-located with the component's other files. It's both the input spec you confirm in Phases 1–2
and the output record Phase 3 writes back into.

```markdown
# <name> → Figma mapping

\`\`\`yaml
figmaComponentKey: null # filled in by Phase 3 on success
figmaPage: <Name>
props:

- name: size
  type: enum
  options: [sm, base]
  figmaProperty: size
  figmaPropertyType: variant
- name: label
  type: string
  figmaProperty: null
  figmaPropertyType: instance-text-override
  states:
  figmaProperty: state
  options: [default, hover, focus, active, disabled]
  sources:
  hover: ":hover (spinner.host.scss)"
  disabled: "disabled prop"
  nested:
- childTag: ds-icon
  childMappingFile: ../icon/icon.figma.md
  figmaComponentKey: <resolved from icon.figma.md>
  tokens:
- cssVar: --ds-alias-background-color-sky
  figmaVariable: Alias/Background Color/Sky
  resolved: true
- cssVar: --ds-spinner-color-one-off
  figmaVariable: null
  resolved: false
  resolution: "<decision made with the user — pick a token or accept hardcoded>"
  \`\`\`

Notes on this mapping, open questions, and rationale for any non-obvious grouping decision go
here as prose, below the YAML block.
```

## Notes

- This skill never commits — leave `<name>.figma.md`, `figma.config.json`, and
  `CONVENTIONS.md` changes unstaged for the user to review, same as every other skill in this
  repo.
- First real run target: `ds-spinner` (`packages/core/src/components/indicators/spinner/`).
- A hard stop (missing token, missing nested child mapping) is not a failure to work around —
  surface it and wait for the user's decision.

## See Also

- [`code-to-figma.md`](../../../code-to-figma.md) — the full plan and the reasoning behind every
  scope decision in this skill.
- [`CONVENTIONS.md`](CONVENTIONS.md) — accumulated mapping heuristics across components.
- [`DOCUMENTATION-TEMPLATE.md`](DOCUMENTATION-TEMPLATE.md) — full Phase 3b documentation-page
  spec, plus the canonical live Figma reference to inspect before building.
- [`packages/tokens/CONTEXT.md`](../../../packages/tokens/CONTEXT.md) — token layers and naming.
- [`packages/core/CONTEXT.md`](../../../packages/core/CONTEXT.md) — component categories and
  structure.
