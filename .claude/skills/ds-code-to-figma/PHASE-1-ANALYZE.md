# Phase 1 — Analyze

## Objective

Read the code of every family member and produce the draft mapping files that Phase 2 proposes a
grouping against. Steps 1–5 run **per member**; the anatomy review, the token-gap batch (5b) and
the measurements triage (6) are presented **once for the whole family** (`conventions/families.md` §2).

## Inputs

- Component source: `packages/core/src/components/<category>/<name>/<name>.tsx`
- Component styles: `<name>.host.scss`
- Design tokens: `packages/tokens/tokens/Base.tokens.json`
- Figma Variables: `.claude/skills/ds-code-to-figma/references/figma-tokens/Base.tokens.json`
- Any nested DS components' already-written `<child>.figma.md` files
- The component's `*.visual.html` under `test/`, rendered by the dev server (step 6)

## References

- [`examples/mapping-file-format.md`](examples/mapping-file-format.md) — mapping-file schema
- `SKILL.md` — Prerequisites section
- `scripts/figma-sync/lib/css-token-lookup.mjs` — local CSS-var → Figma variable id resolver
- `docs/adr/0017-direct-commit-variableid-backfill.md` — why variable ids already live in
  `Base.tokens.json`
- `packages/styles/src/scss/mixins/breakpoint.mixin.scss` — full breakpoint mixin set, for detecting responsive bindings
- `conventions/measurements.md` — groups and rules for the measurements triage (step 6)
- `conventions/families.md` — family resolution (step 0), merged anatomy, family measurements triage

## Instructions

0. **Resolve the family** per `conventions/families.md` §1: family folder, `@Component` members,
   documentation owner (the member with a `doc-config.ts`), each sub-component's relation
   (`contained` / `wrapping`). 🛑 Hard stop on a member with no owner. If the user named a
   sub-component, redirect to the owner in one line. Print the family before step 2's anatomy
   review. A family of one continues exactly as below.
1. Read `packages/core/src/components/<category>/<name>/<name>.tsx` (for a family: each member's
   `.tsx`) and extract every **public `@Prop()`** — ignore `@Method`, `@Event`, and private `@State`. Note each prop's type
   (`@OneOf([...])` enum, boolean, string, number) and default. Write every enum's
   `figmaOptions:` in canonical order per `conventions/component-set-rendering.md` → "Option and
   axis ordering": code default first (hard rule A), then canonical order (hard rule B) — e.g.
   `base · sm · md · lg`. The implicit unset default is named `base`.
   - **Text:** for every string prop, record whether `render()` shows it as text and in which
     `@part` (`label`, `description`, `placeholder`, `value`, `invalidText`). Also record every
     **text-only slot** (a slot whose content is text, e.g. `ds-button`'s default slot) as a text
     prop named after its `@part` (`label`). Both are consumer-authored text →
     `figmaPropertyType: text`. Text the component generates itself (page numbers, counter digits,
     weekday names) is recorded as `generated — no property`, so the omission is visible.
     Generated text inside a consumer-authored part (`ds-input`'s label appends the i18n
     `" (optional)"` when not required) becomes its own text node with no property, so the text
     property binds to the consumer text alone.
   - **Shared text nodes:** when one part renders two props (`ds-input`'s `input` part shows
     `value`, else `placeholder`; its `description` part shows `invalidText` when invalid), record
     which prop wins under which condition and whether the color token differs
     (`PHASE-2-PROPOSE.md` → mapping table, the two "One node, two props" rows).
   - On a sub-component, also extract every `@internal` prop the owner sets ("Set by ds-…") and
     record it with `drivenBy: <owner tag>.<owner prop>` (`conventions/families.md` §3). Find the
     owner prop by reading where the owner writes it (e.g. `ds-tabs`' `updateChildren()`).
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
   - **Family:** cross-check every member's `@part`s, but present and write **one merged list in
     the owner's mapping file** — owner parts, one entry per contained sub-component, sub-letters
     only for a sub-component with more than one `@part` (`conventions/families.md` §5).
     Sub-component mapping files have no `anatomy:`. The owner's list is skipped only when it has
     no `@part`s and no contained sub-components.
3. Read the component's `<name>.host.scss` and scan for **states** (CSS pseudo-classes and state classes) —
   `:hover`, `:focus`, `:active`, `:disabled`, and any loading- or invalid-related
   class/attribute selector. Interaction states (`:hover`, `:focus`, `:active`) become the `state`
   variant; component-state props (`disabled`, `loading`, `invalid`, …) become their own `false` /
   `true` variants (see `PHASE-2-PROPOSE.md` → mapping table, interaction-state and component-state
   rows).
   - **Per component state, check whether code still lets the user interact** while it's `true`:
     **blocked** when the hover / active / focus styles are gated off (`:not(.is-disabled)`,
     `:not(:disabled)`, `pointer-events: none`) — e.g. `ds-button`'s `disabled` and `loading`;
     **interactive** when they still apply — e.g. `ds-input`'s `invalid` (the hover background
     still changes, the border stays danger) and `loading` (only adds the spinner). Decide from the
     SCSS, never from the prop's name: the same prop can differ between components. Record it as
     `interactive: true | false` per `componentStates:` entry, with the `file:line` that decides it.
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
     the `Design Responsive Tokens` collection, mode-based), `🔗 Alias/🔤 Text/LetterSpacing/Text`
     for letter-spacing, `🔗 Alias/🔤 Text/TextDecoration/None` for decoration (which of these the
     Plugin API can bind: `PHASE-3-BUILD.md` → "Text property bindings") — and flag these as inherited-context
     bindings, not literal bindings to something the component's own code sets. Never leave an
     attribute unbound/assumed because the component's SCSS doesn't mention it.
4. Identify any **nested component** usage (e.g. `<ds-icon>` inside `ds-button`'s render) — an
   independent DS component from another family. For
   each one, read its `<child>.figma.md` and pull the default set's `figmaComponentKey` (first
   entry of `sets:`). If missing,
   stop per `SKILL.md`'s Prerequisites section above. **Sub-components are not nested components
   here:** record them as `nested:` entries with `subComponent: true` and `relation`, key `null`
   until Phase 3 builds them — never a hard stop. Also record each code `@slot` that takes
   sub-component instances under `slots:` (default fill proposed in Phase 2;
   `conventions/families.md` §4), and each **open slot** — a declared `@slot` that takes any
   content and renders inside a part (`ds-input`'s `start` / `end` in `control`): its part, its
   position among the part's children and the content the JSDoc, stories and visual tests put in
   it (icon, tag, button), for the preferred instances. A text-only slot is a text property
   instead (above); `label` / `description` / `invalid-text` slots that only override a text prop
   are covered by that text property. Mark every nested `ds-icon` /
   `ds-brand-icon` as an **icon slot** (see `conventions/content-selection-and-mitigations.md` →
   "Icon slots in a parent component"): record the code prop driving it, its color source per variant and state (as `colorSource`,
   `examples/mapping-file-format.md`), whether `ds-brand-icon`
   can fill the same slot, and how code sets its `size` and color.
   - 4a. **Variations** (`PHASE-3-BUILD.md` → "Variations"). For every render-guarded part
     (`hasValue(x) && …`, a `show*` boolean), record its `show <name>` boolean and its
     **dependent axes**: the axes whose CSS only applies while the part exists (e.g.
     `.label-bottom` selectors → `label position`). Only booleans that default to `false` get
     variations — one that defaults to `true` (`ds-input`'s `show label`) is already on in the
     set. Derive the variation list per set:
     - one entry per option of each dependent axis, with the boolean `true` and every other axis
       at the default variant (no dependent axis → one entry);
     - plus one **"all on"** entry per set (every `show` boolean `true`, default variant
       otherwise), when the set has more than one `show` boolean defaulting to `false`;
     - covered sets: the default set and every rule-1 top-level split (`SpinnerLogo`,
       `SpinnerCircle`), never an `…Inverted` set; in a family, sub-component sets too. A set with
       no `show` boolean defaulting to `false` gets no entry.
     - **Snapshot coverage:** for each variation, find a case in `test/<name>.visual.html` with
       the same props (default state). Record the matching snapshot name, or `missing`.
       Write it to the draft's `variations:` (`examples/mapping-file-format.md`).
5. For every value the component's SCSS binds to a CSS custom property (`var(--ds-...)`),
   resolve it to the matching Figma variable **id** — resolve this entirely locally, no Figma
   call needed for the common case.
   - **Every token this repo has already pushed to Figma carries its real Figma variable id
     right in `packages/tokens/tokens/Base.tokens.json`**, under
     `$extensions["com.figma.variableId"]` — that's what `scripts/figma-sync` writes back after
     a push (`docs/adr/0017-direct-commit-variableid-backfill.md`). There is no need to
     enumerate Figma's `Design Tokens`/`Design Responsive Tokens` collections (1,900+ variables)
     through `use_figma` to answer "does a variable exist for this CSS var" — the answer is
     already sitting in this repo's own JSON, and a live enumeration is slow, burns a large
     amount of context on a big collection, and risks a truncated/partial result on a large read.
   - **Resolve with `scripts/figma-sync/lib/css-token-lookup.mjs`** (pure Node, no Figma call):
     ```bash
     node scripts/figma-sync/lib/css-token-lookup.mjs packages/tokens/tokens/Base.tokens.json \
       --var --ds-spinner-circle-primary-background \
       --var --ds-spinner-logo-size-md
     ```
     Pass every `--ds-*` var found in the component's SCSS as its own `--var`. Each result is
     `null` (no token exists under that name — see the hard-stop rule below) or
     `{ path, cssVar, variableId, figmaScopes, type, description }`, where `variableId` is the
     real `VariableID:...` string to bind against in Phase 3 — write it straight into
     `<name>.figma.md`'s `tokens:` list (see [`examples/mapping-file-format.md`](examples/mapping-file-format.md)), no further lookup
     needed. A breakpoint-suffixed var (`--ds-logo-size-base-mobile`/`-tablet`/`-desktop`)
     resolves to that one breakpoint's own id directly; the bare, un-suffixed var resolves to the
     full `{ mobile, tablet, desktop[, device] }` object — see `PHASE-3-BUILD.md` step 3's
     responsive-binding mechanics for what `device` is and when it's present.
   - **This still requires `search_design_system`/`get_variable_defs`/live enumeration for
     exactly one case: a value with no CSS-var binding at all** (a hardcoded literal in the
     component's `.tsx`, or an inherited attribute the component's own code never sets — see step 3) that you need to find an _existing_ token for by browsing, since there's no `--ds-*` name
     to look up. Even then, remember those two tools only search/read **published libraries** —
     the real token variables are **local** to the component-library file, pushed directly by
     `scripts/figma-sync`, so a live Figma search can return misleading look-alike results from
     an unrelated published library (e.g. old sandbox files with similar naming). Prefer browsing
     `Base.tokens.json` itself (it's just JSON) for a token with the right semantic value before
     reaching for a Figma-side search.
   - **Any CSS var that resolves to `null`** (a real `--ds-*` var in the component's SCSS with no
     matching entry in `Base.tokens.json` at all — a token that was renamed, or never
     synced) **is a hard stop.** Report it immediately — do not guess, do not push a hardcoded
     value, do not invent a new token. Ask the user whether to use a different existing token or
     explicitly accept a one-off hardcoded value for this specific case. Resolve this now, before
     Phase 2, not mid-build in Phase 3.
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
   - 5a. **Detect responsive (device-mode) bindings.** Scan `<name>.host.scss` for breakpoint
     mixins — `@include mobile`, `tablet`, `desktop`, `touch`, `from(...)`, `until(...)`,
     `between(...)`, `desktop-only`, etc. (the full set lives in
     `packages/styles/src/scss/mixins/breakpoint.mixin.scss`). For each one found, check whether it
     reassigns a custom property (`--mod-*`, `--_*`, or a bare `--ds-*`) that is **also set to a
     different `--ds-*` token outside the block** (its unconditional/base value, or another
     breakpoint's value) — e.g. `logo.host.scss`'s `:host { @include vars.local(logo-height,
var(--ds-logo-size-base-mobile)); @include desktop { --mod-logo-height:
var(--ds-logo-size-base-desktop); } }`. **Only flag this when the token genuinely differs
     across the breakpoint** — a breakpoint block that doesn't touch a `--ds-*`-bound value (pure
     layout: grid columns, flex direction, etc.) is not a responsiveness case, skip it. This check
     applies to **any** property kind, not just size — width, height, padding, gap, radius, color,
     whatever the breakpoint actually overrides.
     - **Only `mobile`/`tablet`/`desktop` map onto real Figma modes** — the `Design Responsive
Tokens` collection has exactly those three. Any other mixin (`desktop-lg`, `desktop-xl`,
       `touch`, `from`/`until`/`between` at an arbitrary breakpoint, etc.) is a **hard stop**, same
       as a missing token above: report it and ask the user to collapse it into the nearest of the
       3 modes, accept a static value for that breakpoint, or extend the Figma collection with a
       4th mode — never guess or silently collapse it yourself.
     - If code only overrides one breakpoint (e.g. `logo.host.scss` only has `@include desktop` —
       no `@include tablet`), the token for the mode that was never explicitly overridden falls
       through to the next-lower breakpoint's real value (here, Tablet uses the same token as
       Mobile) — record it as such, matching actual rendered behavior; don't invent a distinct
       Tablet-specific token that doesn't exist in code.
     - Record every responsive binding found in the draft's `device:` section — see
       [`examples/mapping-file-format.md`](examples/mapping-file-format.md). A component with no breakpoint-driven token differences has no
       `device:` section at all, same as `anatomy:`/`states:` being omitted when not applicable.
       Resolve each mode's real variable id by running the breakpoint-suffixed CSS var (e.g.
       `--ds-logo-size-base-mobile`) through `css-token-lookup.mjs` from step 5 above — same one
       call, no separate lookup mechanism for this case.
     - Phase 3 is what actually creates/reuses the Figma routing variable and binds nodes to it —
       this step only needs to identify and record which bindings are responsive and what each
       mode's real token is.
   - 5b. Before writing the draft file, build an explicit **completeness checklist**: list every
     node the Figma build will need (every text-bearing part, every filled/stroked shape, every
     spacing gap) and, for each one, every visual attribute it needs (text: family, size, weight,
     line-height, letter-spacing, color, decoration; shape: fill, stroke color/width, corner
     radius, dimensions, spacing). Cross-check each attribute against the tokens resolved in steps
     3, 5, and 5a — any attribute with no corresponding entry is a gap, not an assumption to fill in
     during Phase 3. For an attribute flagged responsive in step 5a, the checklist entry points at
     its `device:` binding rather than a single static token. Surface every gap now, as a batch,
     using the same hard-stop flow as step 5, rather than discovering missing tokens one at a time
     mid-build.
6. **Measurements triage** — decide which sizes Phase 8's "📏 Measurements" section shows. Rules:
   `conventions/measurements.md`. Numbers come from the browser, groups come from the SCSS.
   - 6a. **Measure.** Start the dev server from the repo root (`pnpm start`) if it isn't
     running, and open the component's `test/*.visual.html`. For every option of the table axis (one element each; default
     values for every other prop), read the host and every `[part]` in its `shadowRoot`:
     ```js
     const px = v => parseFloat(v) || 0
     const measure = el => {
       const cs = getComputedStyle(el),
         r = el.getBoundingClientRect()
       return {
         width: r.width,
         height: r.height,
         minWidth: cs.minWidth,
         minHeight: cs.minHeight,
         maxWidth: cs.maxWidth,
         maxHeight: cs.maxHeight,
         padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px),
         margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(px),
         gap: [cs.rowGap, cs.columnGap].map(px),
         border: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px),
         radius: [
           cs.borderTopLeftRadius,
           cs.borderTopRightRadius,
           cs.borderBottomRightRadius,
           cs.borderBottomLeftRadius,
         ],
         font: { size: cs.fontSize, weight: cs.fontWeight, lineHeight: cs.lineHeight, family: cs.fontFamily },
         colors: { background: cs.backgroundColor, border: cs.borderTopColor },
       }
     }
     const host = document.querySelector('ds-<name>[size="sm"]') // one per option
     const parts = [...host.shadowRoot.querySelectorAll('[part]')]
     ;({ host: measure(host), parts: Object.fromEntries(parts.map(p => [p.getAttribute('part'), measure(p)])) })
     ```
     Then run the behavior probe (`conventions/measurements.md` → "Behavior probe") once, on the
     default option. An option missing from `*.visual.html` is not measured: its values come from
     the tokens resolved in step 5, and the triage marks it `unmeasured`. Stop the dev server when
     done if this step started it.
   - 6b. **Classify.** Put every measured value into one group from `conventions/measurements.md` →
     "Groups", using the SCSS declaration (file:line) that sets it, and match it to its token from
     step 5. Values nobody declares (`0` paddings, `auto` sizes, `normal` gaps) are dropped, not
     listed — except a box size, which becomes `derived`. Then run the two checks from
     `conventions/measurements.md`: **does each limit bind?** (a `min-*`/`max-*` that no realistic
     content reaches → `skip`, reported as a finding) and **border visibility** (measure every
     color option's `background` vs `border` color; the default option stays the
     `drawnColor` unless its border = fill, then the first option where they differ is proposed;
     none → ask), and **shape visibility** (default state with a transparent background and no
     border → propose a `drawnState`, e.g. `hover`).
   - 6c. **🟡 Present the triage** in the conversation as one table, one row per property:

     ```
     # | property | kind | group | base | sm | lg | token | source | proposal | instance | reason
     ```

     `proposal` is `drawn` (marker + table row), `table` (table row only, rare), `behavior` or
     `skip`. `instance` says where a drawn row goes: `main`, or an extra instance (`min-content`,
     `focus`, …) per `conventions/measurements.md` → "Section layout". Option columns follow the
     code default first (`base | sm | lg`). When the proposed `drawnColor` isn't the default
     color option, list it with the rows that need a decision: the default, the proposed option
     and why (e.g. "`primary` draws the border in the fill color, so the 2px border and the
     padding inside it can't be seen — recommend `secondary`"). The user confirms or keeps the
     default.
     **Family:** measure every member (sub-components inside the owner's visual test where
     they're contained), add a `set` column and group the rows by set — still one table, one
     checkpoint. Rows of a wrapping sub-component are `table` only (`conventions/families.md` §6).
     Put rows whose proposal follows directly from the group rules first and collapsed; list the
     rows that need a decision (marked "ask" in the rules, measured ≠ token, `unmeasured`, outer
     margins) separately, each with a one-line recommendation. Wait for the user to confirm or
     change it.
7. Write all of the above into `<name>.figma.md` (create it if it doesn't exist) as a draft, per
   the schema in `examples/mapping-file-format.md`, including the confirmed `measurements:` from step 6.
   One file per family member, next to its `.tsx`. The owner's file holds `anatomy:` and every
   `measurements:` row (each with `set:`); each sub-component's file holds `owner:` and no
   `anatomy:`/`measurements:`.
   Skipped rows stay in `measurements:` with `show: skip` and their reason, so a re-run doesn't ask again.

## Output

A draft mapping file `<name>.figma.md`, written per
[`examples/mapping-file-format.md`](examples/mapping-file-format.md), containing:

- Extracted public props (type, default), with every consumer-authored text (string prop or
  text-only slot) and every generated text marked
- Lettered anatomy (`@part` tags cross-checked against `render()`)
- Interaction and component states from `<name>.host.scss`
- Resolved token/variable id for every CSS-var binding, including responsive `device:` bindings
- Nested DS component references (their Figma component keys)
- The `variations:` list per covered set, with each entry's snapshot case or `missing`
- The completeness checklist
- The confirmed `measurements:` triage (measured values, group, token, proposal per property)

## Completion Criteria

- The family is resolved (owner, sub-components with relation) and every member has a draft
  mapping file.
- Every public prop is extracted and typed; every parent-set prop carries `drivenBy`.
- Every `@part` tag matches a real `part="..."` attribute in `render()` (or the mismatch was
  resolved with the user).
- Every CSS-var token resolves to a real Figma variable id, or was explicitly flagged as a hard
  stop and resolved with the user — none left as a guess or silent default.
- Responsive (device-mode) bindings are identified and recorded under `device:`.
- The completeness checklist has no unresolved gaps.
- Every measured size is in the measurements triage with a group and a proposal, and the user confirmed
  it; every measured ≠ token mismatch was decided with the user.

## Next Phase

Proceed to [`PHASE-2-PROPOSE.md`](PHASE-2-PROPOSE.md) only once the draft `<name>.figma.md`
(props, anatomy, states, resolved tokens, completeness checklist, confirmed measurements triage) exists.
