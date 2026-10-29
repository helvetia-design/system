# Phase 1 — Analyze

**You are here:** the first phase. Starting fresh from the user naming a component to push into
Figma — nothing in `<name>.figma.md` exists yet (or if it does, treat this as a from-scratch
re-analysis; this skill is create-only, see `SKILL.md`'s v1-scope note). This phase reads the
component's code and produces the draft mapping that Phase 2 proposes a grouping against.

1. Read `packages/core/src/components/<category>/<name>/<name>.tsx` and extract every **public
   `@Prop()`** — ignore `@Method`, `@Event`, and private `@State`. Note each prop's type
   (`@OneOf([...])` enum, boolean, string, number) and default.
2. Extract the component's **anatomy** — its named visual parts — from the class-level `@part`
   JSDoc tags (e.g. `ds-button`: `@part native`, `@part spinner`, `@part icon`, `@part label`,
   `@part icon-right`). Cross-check every `@part` tag against a real `part="..."` attribute in
   `render()`: a tag with no matching attribute, or an attribute with no matching tag, is a **hard
   stop** — same treatment as a missing token (see step 5 below) — report it and ask the user to
   fix the component's code/JSDoc, or explicitly accept the mismatch, before continuing. Assign
   each part a sequential letter (A, B, C, …) in the order its `part="..."` attribute appears in
   `render()`'s JSX (DOM order, not JSDoc comment order). **Print the extracted list in the
   conversation for the user to review before writing anything** — letter, part name, and its
   one-line description taken verbatim from the `@part` JSDoc line. If the component has no
   `@part` tags at all, skip the anatomy section entirely (note why in the draft; this is not a
   gap to flag).
3. Read the component's `<name>.host.scss` and scan for **pseudo-class states** —
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
     tokens list — treat a missing one exactly like a missing CSS-var token in step 5, not as an
     exemption.** For attributes inherited from this system's own default text treatment (not set
     by the component's own code), bind to the matching system-default token — e.g.
     `🔗 Alias/🔤 Text/Color/Primary` for color, `📱 Device/🔤 Text/Size/Base/Device` for size (from
     the `Design Responsive Tokens` collection, mode-based) — and flag these as inherited-context
     bindings, not literal bindings to something the component's own code sets. Never leave an
     attribute unbound/assumed because the component's SCSS doesn't mention it.
4. Identify any **nested DS component** usage (e.g. `<ds-icon>` inside `ds-button`'s render). For
   each one, read its `<child>.figma.md` and pull the recorded Figma component key. If missing,
   stop per `SKILL.md`'s Prerequisites section above.
5. For every value the component's SCSS binds to a CSS custom property (`var(--ds-...)`),
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
     inherits — see step 3's text-attribute scan) is **not exempt from token resolution — it
     still needs an explicit decision, same hard-stop rule as above.** If a matching Figma
     variable exists anyway (as found for `spinner.tsx`'s `getColor()` fallback, or for an
     inherited text attribute per step 3), bind to it for the Figma visual and note it in
     `<name>.figma.md` (flagging any code-side drift as a separate follow-up, not fixed here). If
     no matching variable exists, treat it exactly like a missing CSS-var token: stop, report it,
     and ask the user to pick an existing token or explicitly accept a one-off hardcoded value —
     never silently build it with an assumed or Figma-default value.
   - 5b. Before writing the draft file, build an explicit **completeness checklist**: list every
     node the Figma build will need (every text-bearing part, every filled/stroked shape, every
     spacing gap) and, for each one, every visual attribute it needs (text: family, size, weight,
     line-height, letter-spacing, color, decoration; shape: fill, stroke color/width, corner
     radius, dimensions, spacing). Cross-check each attribute against the tokens resolved in steps
     3 and 5 — any attribute with no corresponding entry is a gap, not an assumption to fill in
     during Phase 3. Surface every gap now, as a batch, using the same hard-stop flow as step 5,
     rather than discovering missing tokens one at a time mid-build.
6. Write all of the above into `<name>.figma.md` (create it if it doesn't exist) as a draft, per
   the schema in `SKILL.md`'s "Mapping file format" section. Include the `specs:` list —
   the values (fixed or min width/height, padding/gaps, fixed sizes of nested elements, radius,
   border width, typography) per option of the Variants axis that Phase 4's "📐 Specs" section
   will show, each pointing at its Figma variable. It's a view onto the completeness checklist
   from step 5b, not new analysis. Leave out calculated inner content sizes and the radius of a
   circle (see `PHASE-4-DOCUMENT.md` → "6. 📐 Specs").

**Next: [`PHASE-2-PROPOSE.md`](PHASE-2-PROPOSE.md)** — once the draft `<name>.figma.md` (props,
anatomy, states, resolved tokens, completeness checklist) exists.
