# badge → Figma mapping

```yaml
figmaComponentKey: "1855:8192" # Badge component set, 18 variants (color x size), Badge page
figmaPage: Badge
figmaCollection: Design Tokens

props:
  - name: color
    type: enum
    options: [disabled, info, success, warning, danger] # BADGE_COLORS — 'info' added, see anomaly below (FIXED)
    default: "(unset — falls back to Component.Badge.Default.* tokens)"
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [default, disabled, info, success, warning, danger]
    note: >
      "default" (no color prop set) is included as its own option since it has its own token
      group (Component.Badge.Default.*) distinct from the others, same pattern as
      spinner/icon's implicit-default-plus-explicit-options convention.

  - name: size
    type: enum
    options: [sm, lg] # code default (unset) = implicit "base"
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, lg]

  - name: icon
    type: string (open icon registry — same category as ds-icon's own `name` prop)
    figmaProperty: "Icon" (INSTANCE_SWAP) + "Show icon" (BOOLEAN)
    figmaPropertyType: nested-instance-swap + conditional-visibility
    note: >
      Renders a nested <ds-icon> ONLY when size !== 'sm' AND hasValue(icon) — a compound
      condition, not a simple hasValue guard like spinner's label. Proposed: an INSTANCE_SWAP
      component property (preferredValues pointing at the ds-icon component set, see nested
      below) paired with a boolean "Show icon" (default false, matching code's default empty
      icon prop) bound to the icon instance's visibility — same mechanism as the "Show X"
      pattern, but swapping WHICH icon via INSTANCE_SWAP instead of just toggling boolean
      presence. On sm size, ALL children are hidden regardless (`:host(.is-sm) > * { display:
      none }`), so "Show icon" has no visible effect there — documented, not specially modeled
      (matches real behavior: toggling it doesn't matter, same as code).

  - name: position
    type: enum
    options: [card, button, tabs]
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: >
      Reflects to the host attribute (`@Prop({reflect:true})`) but badge.host.scss has ZERO
      selectors targeting `[position=...]` or any `.is-${position}` class — render() doesn't
      even add a position-derived class. No Component.Badge.Position.* token group exists
      either. This prop has NO self-contained visual effect within badge's own code — it exists
      purely for a PARENT component (card/button/tabs) to read via attribute selector and
      position badge within itself. Out of scope for this skill (badge built in isolation, no
      access to consumer components) — excluded from the Figma mapping entirely, not just left
      as an instance-override. Confirmed excluded.

  - name: pulse
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed) — animation (CSS @keyframes), out of scope per
      code-to-figma.md's "animations are always out of scope" rule.

  - name: slotted content
    type: slot (not a @Prop — arbitrary light-DOM children, typically a short text/counter)
    figmaProperty: null
    figmaPropertyType: instance-text-override
    note: >
      Not a typed prop at all — <slot></slot> accepts arbitrary content. Treated the same way
      as spinner's free-text `label`: a text layer with placeholder content (proposing "9+",
      a realistic counter example) that a consumer overrides per-instance. Hidden at sm size
      along with everything else (`:host(.is-sm) > * { display: none }`).

states: []
# No pseudo-class states in badge.host.scss (:hover/:focus/:active/:disabled selectors) — badge
# is a non-interactive indicator, same as spinner. "disabled" here is a COLOR option
# (Component.Badge.Disabled.*), not an interaction state — already covered under `color` above,
# not double-counted as a `state` axis.

nested:
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: "1832:7997" # confirmed recorded, 79 variants

anomaly:
  - "`color` enum drift, same pattern as ds-icon — FIXED": badge.host.scss's `$colors` SCSS map
    included `'info'` (backed by a real token group, `Component.Badge.Info.*`) but
    `BADGE_COLORS` in badge.interfaces.ts omitted it. Per user confirmation, fixed in code:
    `badge.interfaces.ts` now includes `'info'` in `BADGE_COLORS`. Added to the Figma `color`
    variant as a 6th option.
  - "Stale SCSS comment": badge.host.scss has a comment "`grey` variant has no dedicated token
    group; it maps to `disabled`" but no `'grey'` key exists in `$colors` or `BADGE_COLORS` at
    all currently — likely left over from an earlier refactor. Not acted on, just noted.
  - "`Default` color resolves to the SAME background as `Danger`": `Component.Badge.Default.Color.Background`
    and `Component.Badge.Danger.Color.Background` both resolve to `Alias.Surface.Red` — meaning
    a badge with NO `color` prop set renders with a **red** background, identical to
    `color="danger"`. This looks surprising (a neutral default usually isn't the same as an
    alarm color) but tokens are the source of truth — flagging for Phase 4 live confirmation
    rather than assuming it's wrong. If genuinely unintended, that's a design-token fix, not
    something this skill changes.

tokens:
  - cssVar: --ds-badge-default-color-background / -text
    figmaVariable: 🧩 Component/Badge/Default/Color/Background|Text
    resolved: true
  - cssVar: --ds-badge-disabled-color-background / -text
    figmaVariable: 🧩 Component/Badge/Disabled/Color/Background|Text
    resolved: true
  - cssVar: --ds-badge-success-color-background / -text
    figmaVariable: 🧩 Component/Badge/Success/Color/Background|Text
    resolved: true
  - cssVar: --ds-badge-warning-color-background / -text
    figmaVariable: 🧩 Component/Badge/Warning/Color/Background|Text
    resolved: true
  - cssVar: --ds-badge-danger-color-background / -text
    figmaVariable: 🧩 Component/Badge/Danger/Color/Background|Text
    resolved: true
  - cssVar: --ds-badge-size-base-height/-radius/-font/-icon/-gap/-padding
    figmaVariable: 🧩 Component/Badge/Size/Base/Height|Radius|Font|Icon|Gap|Padding
    resolved: true
  - cssVar: --ds-badge-size-sm-* (same set)
    figmaVariable: 🧩 Component/Badge/Size/SM/*
    resolved: true
    note: "Font resolves to a literal 0rem, Icon to Size.0 — consistent with sm hiding all content."
  - cssVar: --ds-badge-size-lg-* (same set)
    figmaVariable: 🧩 Component/Badge/Size/LG/*
    resolved: true
  - cssVar: --ds-badge-typo-font-family
    figmaVariable: 🧩 Component/Badge/Typo/FontFamily
    resolved: true
    note: "Resolves to Alias.Text.Family.HEADING, not the Family.Text used by spinner/icon's inherited-context text — badge uses the heading font."
  - cssVar: --ds-badge-typo-font-weight
    figmaVariable: 🧩 Component/Badge/Typo/FontWeight
    resolved: true
    note: "Bold."
  - cssVar: --ds-badge-typo-line-height
    figmaVariable: 🧩 Component/Badge/Typo/LineHeight
    resolved: true
    note: >
      Resolves to Alias.Text.LineHeight.Single — a DIFFERENT line-height group than spinner's
      "Text" line-height (150%). Subject to the same Plugin API binding limitation documented in
      SKILL.md (FLOAT variable bound to lineHeight always applies as PIXELS) — will resolve and
      apply as a literal PERCENT value, not a live binding, same workaround as spinner's label.
  - cssVar: --ds-badge-icon-size / --ds-badge-icon-color
    figmaVariable: (derived — same as Size.*.Icon and the active color group's .Text)
    resolved: true
    note: "Icon inside badge is sized/colored via the same size/color token groups above, not separate tokens."
```

## Phase 2 — confirmed variant grouping

- `color`: variant property, options `default / disabled / info / success / warning / danger`
  (6 options; `info` added to `BADGE_COLORS` in code per user confirmation).
- `size`: variant property, options `base / sm / lg` (3 options).
- `icon`: INSTANCE_SWAP component property (swaps in any instance of the existing synced
  `ds-icon` component, key `1832:7997`) + paired `Show icon` boolean (default `false`,
  matching code's default empty `icon` prop) — not crossed into the variant set, applied as an
  instance-level override on top of the 18 (6×3) base combinations.
- Slot content: instance-text-override, placeholder `"9+"` on every member.
- `position`, `pulse`: excluded entirely (confirmed).
- `default` color will be built literally matching `danger`'s token value, as-is — confirmed,
  no extra sanity check requested.

All confirmed. Proceeding to Phase 3 (build).

## Phase 3 — build notes

- Built 18 variant combinations (`color` × `size`) as a single Figma component set (key
  `1855:8192`) on the new `Badge` page. All shape/color/spacing values bound to the resolved
  `Component/Badge/*` Figma variables (auto-layout `itemSpacing`/`paddingLeft`/`paddingRight`
  bound to Gap/Padding, `height` and all four corner radii bound, fills bound via
  `setBoundVariableForPaint`). No literals used for anything token-backed.
- `Typo/LineHeight` resolves to a percent-semantic FLOAT (100, i.e. Alias.Text.LineHeight.Single)
  — applied as a literal unbound `{unit: 'PERCENT', value: 100}` per the documented Plugin API
  limitation (binding would silently apply as pixels), same workaround as spinner's label.
- **`size=sm` built decision (not directly specified by code, flagging it):** since all children
  are hidden at `sm` in the real component (`:host(.is-sm) > * { display: none }`), the text and
  icon layers are set `visible: false` and the frame is forced to a fixed square
  (`width = height`, both bound to `Size/SM/Height`) rather than left to hug empty content
  (which would otherwise collapse to just the horizontal padding, reading as a thin sliver, not
  a dot). This reproduces the real visual effect (a small rounded color indicator) but is a
  judgment call about presentation, not a literal token/prop mapping — flagging for Phase 4
  confirmation against the real screenshot baseline.
- `Icon` INSTANCE_SWAP default points at the icon set's own default variant (`icon=alert`) —
  arbitrary placeholder choice (not from badge's own code, which has no icon default), picked
  because "alert" reads sensibly as a generic badge icon. `Show icon` boolean defaults to
  `false`, matching code's default empty `icon` prop. Both verified working via a temporary test
  instance (removed after confirming), toggling `Show icon` → true correctly swapped in and
  revealed the icon alongside the slot text.
- Nested icon reused as an **instance** of the existing synced `ds-icon` component set (key
  `1832:7997`) — no icon artwork redrawn, consistent with the nested-component reuse rule.

## Phase 3b — documentation page

Built using the fixed template, same structure as spinner/icon.

- **Header**: "Documentation" kicker, title "Badge" (bold, 4XL), "View in Storybook ↗" hyperlink
  (`https://helvetia-design.vercel.app/?path=/docs/components-indicators-badge-badge--badge&globals=framework:html`,
  pulled from `apps/storybook/src/components/indicators/badge/badge.doc-config.ts`'s Overview
  tab `storyId`, not guessed), lead paragraph verbatim from `badge.tsx`'s JSDoc: "Badge displays
  a small indicator or counter on a child component to highlight notifications, counts, or
  status information."
- **Rows** = `size` (Base / SM / LG) — badge's shape/scale axis, same role as spinner/icon's
  size rows.
- **No inverted pairing**: badge has no `inverted`/dark-context prop, so each row is a single
  card (per the template's explicit fallback for components without one), not a side-by-side
  pair.
- **Columns within each card** = `color` (Default / Disabled / Info / Success / Warning /
  Danger), each instance built with `Show icon` overridden to `true` for documentation
  readability (main component set itself still defaults to `false`, matching code).
- Card chrome: corner radius 12, 2px `Alias/Border/Color/GreyLight` stroke, light grey fill
  `{0.953, 0.953, 0.953}` — all literal/presentational per the template (no generic "card
  surface" token exists).
- Confirmed visually: `default` color renders identically red to `danger` across all three
  rows, consistent with the Phase 2 decision to build it as-is from the tokens.
- `size=sm` row's card shows six small colored dots with no visible "9+"/icon content, matching
  the Phase 3 `collapsedContent` build decision.

**Fix applied after user comparison with Spinner/Icon pages:** the first build left visible
white rectangles behind the header text and wrapping each row's grey card — `figma.createAutoLayout()`
defaults new frames to a solid white fill, and this wasn't explicitly cleared on the structural
wrapper frames (`Header`, `Rows`, each `Row - <size>`, `Columns`, each `Column - <color>`).
Spinner/Icon only apply a background fill to the actual `Card` frame; every other structural
frame is transparent, letting the page's grey canvas show through. Fixed by setting `fills = []`
on all wrapper frames, keeping the fill only on `Card`. (One follow-on bug caught and fixed in
the same pass: the blanket fill-clear briefly hit the `eyebrow` text layers too, which would
have made their grey label text invisible — restored their `Alias/Text/Color/Grey` binding
immediately after.) Re-screenshotted and confirmed matching structure.

**Noting for CONVENTIONS.md**: `figma.createAutoLayout()`'s default white fill is a recurring
trap for purely-structural wrapper frames (anything that isn't the one intentionally-chromed
`Card`) — worth adding as a learned rule so future components don't repeat this.
→ Added to CONVENTIONS.md, confirmed by user.

## Phase 4 — review against real rendering

Baseline PNGs under `test/badge.visual.play.ts-snapshots/` turned out to be **stale** — e.g. the
`colors` snapshot shows content matching the unused `attention` section (R/G/Y/P/G circles with
checkmarks) rather than the current `colors` section's actual markup. Rather than compare
against outdated images, started the dev server (`pnpm --filter core start`) and measured the
live-rendered `badge.visual.html` directly via Playwright (`getComputedStyle`,
`getBoundingClientRect`), per the established ground-truth methodology.

**Confirmed exact matches** (Figma build vs. live computed values):

- All 6 color backgrounds match byte-for-byte: default/danger `rgb(255,172,166)`, disabled
  `rgb(232,232,232)`, info `rgb(229,231,240)`, success `rgb(148,227,212)`, warning
  `rgb(255,236,188)` — confirms the `default == danger` anomaly is real, not a build mistake.
- Heights match exactly: `sm` 12px, `base`/`md` 24px, `lg` 32px.
- Icon sizes match exactly: 14px at base, 18px at lg.
- `size="sm"` real behavior confirmed: host becomes `max-width: <height>; overflow: hidden`
  with all children `display: none` — matches our collapsed-dot build decision exactly.
- `size="md"` (used in `badge.stories.ts`, missing from `BADGE_SIZES`) is **not actually invalid**:
  it's not covered by `normalizeDeprecatedTShirtSize` either, but since no `.is-md` SCSS rule
  exists, it simply falls through to unstyled/default (`base`) sizing — confirmed via
  `className: "is-md"` + computed height 24px, identical to base. Resolves the earlier anomaly:
  not a bug, just an accepted-but-undocumented pass-through value. The `color="grey"` story
  value is different — there's no equivalent fallback path (`$colors` map has no `grey` key and
  neither does `BADGE_COLORS`), so `color="grey"` likely renders completely unstyled (no color
  class matches). Not independently re-verified live; flagged as a real story/API drift, left
  for the user to decide whether to fix the story or add a `grey` alias.
- Horizontal padding matches (4px via `Size/Base/Padding`), and although the real CSS applies
  that same padding value on **all four sides** (`padding-inline`/`padding-block` both set to
  the same token) while our Figma build only binds it horizontally (vertical padding literal
  `0`), the visual result is identical since height is fixed either way — content centers the
  same regardless. Noted as a built simplification, not a defect.

**Real bug found — `gap` token is visually inert in the actual component:**
`badge.host.scss` sets `gap: var(--_badge-gap)` on `:host`, and `:host`'s flex layout _does_
apply — but `:host`'s shadow-tree children are a single wrapper (`<span id="badge">`), not the
slot content and icon directly (render(): `<span id="badge"><slot></slot>{icon}</span>`). A
flex `gap` with only one flex item has no visual effect. Verified live by injecting a temporary
`<ds-badge color="success" icon="check">9+</ds-badge>` instance and measuring the slot text's
`Range.getBoundingClientRect()` against the icon's `getBoundingClientRect()`: **0px gap** between
them — the "9+" text and the check icon sit flush against each other, not spaced apart by the
`Size/*/Gap` token (4px at base/lg, 0 at sm) as the token's own name/JSDoc
(`@prop --badge-gap: Gap between icon and text in the badge.`) implies.

Our Figma build currently shows a 4px gap between slot and icon (bound to the Gap token, same
pattern as every other bound value) — this **doesn't match the real rendered component**, which
has no visible gap at all in this scenario.

This needs a decision before I touch anything further:

1. **Fix the Figma build to match reality** (set icon spacing to literal `0`, not bound to the
   Gap token) — keeps Figma accurate to what ships today, but then the `Gap` token becomes
   effectively undocumented/unrepresented anywhere in Figma.
2. **Fix the code** so the gap actually renders (e.g. making `#badge` itself the flex container
   instead of `:host`, or moving the gap rule) — matches the token's evident intent, but is a
   structural render change, bigger than a one-line value fix like spinner's logo color.

**Resolved — fixed in code, per user decision.** Added a new `#badge { display: inline-flex;
align-items: center; gap: var(--_badge-gap); }` rule in `badge.host.scss`, making the inner
wrapper span (not just `:host`) the actual flex container for the slotted content and icon.
`:host`'s own `display: inline-flex` / `gap` were left as-is (still correct for centering the
single span child and sizing the pill). Verified live after rebuilding the dev server: the same
temporary `<ds-badge color="success" icon="check">9+</ds-badge>` probe now measures a **4px**
gap between the text and icon (was 0px before), matching the `Size/*/Gap` token exactly. Checked
the full `badge.visual.html` fixture by screenshot afterward — no regressions in any other
section (basic, colors, sizes, icon, list all unchanged).

No Figma changes needed — the component set already had the gap bound to the token from Phase 3,
so Figma was already showing the now-correct intended behavior; code has caught up to it.

**Phase 4 status: closed.** Outstanding non-blocking items (not part of this fix): the stale
Playwright baseline PNGs under `test/badge.visual.play.ts-snapshots/` should be regenerated
separately (unrelated to this skill), and `badge.stories.ts`'s `color="grey"` has no supporting
token/SCSS/enum entry — left for the user to decide whether to fix the story or add a real
`grey` alias.

## Post-Phase-4 fix — `min-width` matching height

User asked to confirm/fix that the badge stays circular (never narrower than tall) in both code
and Figma.

- **Code was already correct**: `badge.host.scss`'s `:host` sets
  `min-width: var(--_badge-min-width)` bound to each size's own height token
  (`--ds-badge-size-{base,sm,lg}-height`), so this was never a code bug.
- **Figma was missing it**: the `base`/`lg` variants used pure HUG width sizing with no lower
  bound, so a single-character instance (e.g. `"1"`) could render narrower than tall, breaking
  the circular shape. Fixed by binding `minWidth` on all 12 `base`/`lg` variants (6 colors × 2
  sizes) to their respective `Size/Base/Height` / `Size/LG/Height` variable via
  `node.setBoundVariable('minWidth', heightVar)`. `size=sm` variants were already unaffected —
  they use a fully fixed `width = height` square, not HUG.
- Verified: a test instance with `"1"` as content now measures exactly `24×24` (`width === height
=== minWidth`), instead of shrinking to fit the single character. Removed the test instance
  after confirming.

## Phase 4 (re-run) — min-width and icon/text order

Re-verified both fixes against the real live component (dev server + Playwright), not just the
Figma-side test instance:

- **min-width**: injected `<ds-badge color="success">1</ds-badge>` — measures exactly `24×24`,
  confirming the real component also stays circular for single-character content (code already
  had this right; this just confirms the Figma fix now matches).
- **icon/text order**: injected `<ds-badge color="success" icon="check">1</ds-badge>` — text
  renders at `left: 28, right: 36.4`, icon at `left: 40.4` (text strictly before icon,
  `textBeforeIcon: true`), with a `4px` gap between them. Matches Figma's child order
  (`slot` before `icon` in the layer stack) and the earlier gap fix exactly.
- `Show icon` default confirmed `false` on the component set itself (not just overridden to
  `true` on the documentation-page instances, which was already correct from Phase 3).
- No regressions found elsewhere in `badge.visual.html` on re-screenshot.

Both fixes confirmed correct in Figma and matching real component behavior exactly. No further
action needed.

## Post-Phase-4 fix — documentation instances showed icon by default

User flagged (with screenshot) that the documentation page still showed every badge with its
icon visible ("9+ !"), looking like `Show icon` defaults to `true`. Clarified: the component
set's own default was already `false` (confirmed earlier) — the documentation-page _instances_
were the ones overridden to `true`, per Phase 3b's "override Show X to true on documentation
instances for readability" rule. That rule doesn't fit badge: icon and slot text are not
normally shown together in real usage (one or the other), so forcing both on by default across
every documentation swatch was misleading, not representative.

**Fixed**: reset `Show icon` to `false` on all 18 documentation instances (6 colors × 3 sizes).
Documentation now shows plain text badges ("9+") by default, matching the component's actual
default and typical real-world usage. Screenshot confirmed. If a dedicated "with icon" example
is wanted later, it should be a separate instance/column, not the default state of every swatch.

## Post-Phase-4 fix — icon/text order flipped (icon first, text second)

User asked for icon to render first (left), text/slot second (right) — the opposite of what
Phase 4 had confirmed as the _existing_ code behavior (`<slot></slot>{icon}`). Since this
changes real rendering for every consumer of `ds-badge` using both `icon` and slot content
together, fixed it in code, not just Figma:

- `badge.tsx` render(): swapped to `{icon}<slot></slot>` (icon rendered first).
- Verified live (dev server + Playwright): injected
  `<ds-badge color="success" icon="check">9+</ds-badge>` — icon now at `left: 4–18`, text at
  `left: 22–37.3`, `iconBeforeText: true`, gap still exactly `4px` (unaffected by the reorder).
- **Figma**: reordered all 18 variants in the component set so the `icon` instance comes before
  the `slot` text layer (`variant.insertChild(0, icon)`). Verified with a temporary test
  instance (`Show icon = true`) — icon renders left, "9+" renders right, confirmed via
  screenshot, then removed the test instance.

Both code and Figma now agree: icon first, text second.

## Post-Phase-4 fix — master component set overlapped the documentation header

User flagged (with screenshot) that the real master `Badge` component set — the actual 18
variants, not the documentation instances — was positioned at `x:0, y:0` on the page, directly
underneath the `Header` frame (also `x:0, y:0`), garbling the title/link/lead text. The
variants themselves were also left in whatever ad-hoc single-row position Phase 3's incremental
build loop happened to place them at (`x` stepping by 100px per variant regardless of
color/size), not a clean grid. This is a general issue, not badge-specific — the same applies to
`ds-spinner`/`ds-icon`'s master sets and should be revisited there too.

**Fixed for badge**:

- Rearranged all 18 variants into a proper grid inside the component set: rows by `size`
  (`base`/`sm`/`lg`, 60px steps) × columns by `color` (`default`/`disabled`/`info`/`success`/
  `warning`/`danger`, 60px steps) — same row/column order as the documentation section, for
  visual consistency.
- Moved the whole component set to sit below the `Rows` documentation frame
  (`y = rows.y + rows.height + 80`), clear of any overlap.
- Added a small grey "Component (master variants)" label above the grid so it reads as
  distinct from the documentation showcase, not part of it.
- Confirmed via screenshot: header text is now fully readable, and the master grid renders
  cleanly below the documentation rows.

**Not yet done**: applying the same positioning fix to `ds-spinner` and `ds-icon`'s master sets,
per the user's "the others are wrong too" — flagged, not actioned in this session.

**Correction — user rejected the separate visible "master variants" grid.** The grid + label
added above (as a second visible section below the documentation rows) was not what was wanted.
Clarified: the instance↔variant linkage in the documentation cards was already correct (every
documentation instance properly references its matching variant in the component set) — what
was wrong was _displaying a second, redundant raw-grid block_ on the page at all. The
documentation section (`Header` + `Rows`) should be the only thing visible; the master
component set should sit out of view, same as how `ds-spinner`/`ds-icon`'s master sets already
work (confirmed their master sets exist but are positioned away from the visible documentation
area, not shown as a separate section).

**Fixed (step 1)**: removed the "Component (master variants)" label and grid framing, and moved
the master `Badge` component set far off-canvas (`y: -3000`). Confirmed via screenshot: the
documentation area (`Header` + `Rows`) now renders with no trace of the master set.

**Follow-up — user asked to display the master set styled like the documentation instead of
hiding it.** Brought the master set back, positioned directly below `Rows` (`y: rows.y +
rows.height + 80`), and gave it the same visual treatment as the documentation cards:

- A card background (`Alias/Border/Color/GreyLight` stroke, 12px radius, light grey fill —
  same literal chrome as every documentation `Card`).
- A "→ Component" eyebrow + "Badge — master variants" heading (bold, `Alias/Text/Size/LG`),
  clearly labeling this as the real component, not another documentation showcase.
- Column headers (`Default`/`Disabled`/`Info`/`Success`/`Warning`/`Danger`) above the grid and
  row headers (`Base`/`SM`/`LG`) to its left — same label styling (`Alias/Text/Size/XS`,
  `Alias/Text/Color/Grey`) as the documentation's column/row labels.
- The actual variant grid (real `COMPONENT` children of the set, not instances) sits inside
  this card, aligned under the column headers / beside the row headers.

Result: one coherent page — documentation rows on top, the labeled real master variant grid
right below, both using the same visual language, no redundant/overlapping sections.

## Major layout rewrite — adopted the TapTap Design System template

User provided a reference (TapTap Design System's Figma community file, `Button–Primary` page)
and asked to match its structure. This **replaces** the previous row/card/column Phase 3b
template with a new fixed structure — see the SKILL.md update below. For badge specifically:

**New structure, one bordered outer frame** (`Badge Documentation`, white fill, 1px
`Alias/Border/Color/GreyLight` stroke, 8px radius, 40px padding, small "Badge" label sitting
just above the frame — not inside it, matching TapTap's component-name label above its frame):

1. **Header**: `General` kicker (left) / `Helvetia Design System` wordmark (right) on one row,
   then title ("Badge", bold 4XL), lead paragraph (verbatim from JSDoc, now in
   `Alias/Text/Color/Grey` not Primary — matches TapTap's softer description treatment), then
   the "View in Storybook ↗" link. Divider rule below.
2. **"👉 Copy me"**: one real, representative instance (`color=default, size=base`, "9+") in a
   centered, softly-shaded box (`{0.976,0.976,0.976}` fill, no border) — the single
   drag-into-your-design example. Divider rule below.
3. **"🛠 Variants"**: a compact single-axis reference, not a full cross-product. Left column:
   bold "Size" axis label + stacked pill tags (`Base`/`SM`/`LG`) in a shaded sidebar. Right:
   one representative instance per size, side by side. Divider rule below.
4. **"🔒 Main components"**: the full cross-product grid — rows = `size`, columns = `color` — in
   a bordered table with shaded header row/column. This is the comprehensive, exhaustive
   reference (equivalent to the old Phase 3b row/card structure), now presented as a single
   dense table instead of stacked row/cards.

**Structural pitfall hit and fixed**: initially tried to move the real variant `COMPONENT`
children directly into the "Main components" table cells (thinking this satisfied "the master
should be the documentation"). This is invalid in Figma — a variant can only be a direct child
of its own `COMPONENT_SET`; moving them out silently dissolved the set (Figma auto-removes an
empty `COMPONENT_SET`), stripping the `color`/`size` variant-property grouping (though the
individual components and all existing instances kept working — nothing was actually deleted).
**Fixed**: recombined all 18 components back into a set via `figma.combineAsVariants()`, then
had to manually rename each child back to `color=X, size=Y` format (the round-trip left them as
bare `Badge/x/y`-style names with no parsed variant properties) to restore the `color`/`size`
variant axes and reconfirm `Show icon`/`Icon` property definitions survived (they did, just
with new property IDs). Filled the table cells with **instances** of each variant instead —
visually identical, structurally valid. The master set stays parked off-canvas (`y: -3000`), not
visibly duplicated, exactly as established for the earlier correction.

**Learned rule for CONVENTIONS.md**: never move a `COMPONENT_SET`'s variant children into another
frame directly — always build a new `INSTANCE` via `variant.createInstance()` for placement
anywhere outside the set itself, even when the explicit goal is "show the real variant."
Figma's object model does not allow a variant to exist in two places, and moving it out breaks
the set.

## Final correction — "Main components" overlays the real master set, not instances

User clarified further: the "Main components" table should provide the structural chrome only
(header row/column, borders, shading) — the actual cells should be the **real master
`COMPONENT_SET`**, positioned to sit exactly on top of the table grid, not instances pulled from
it.

**Implementation**: removed the 18 instances from the table cells (kept all chrome/labels), then
repositioned the real component set's own children to align precisely with each table cell —
same `color`/`size` grid, but now with exact pixel alignment computed from the table's own
`absoluteTransform` (column step 112px, row step 72px, each variant centered in its cell). The
whole set itself is positioned (`set.x`/`set.y`) so its first variant's absolute position matches
the table's first cell exactly. This keeps the set structurally valid (variants never left their
`COMPONENT_SET`) while making it visually read as "the real component sitting inside the table."

**Debugging note — a stale/partial screenshot during this process was a red herring, not a real
bug.** After repositioning, one `get_screenshot` call showed only the `Default` column
rendering, with all other columns blank, even though every child's `visible`/`opacity`/position
was individually confirmed correct via direct inspection, and a screenshot of the set in
isolation (`contentsOnly: true`) showed all 18 rendering perfectly. A second, fresh
`get_screenshot` call of the same node immediately after showed the correct, fully-rendered
result. Don't chase a rendering discrepancy as a positioning/data bug before confirming it with a
second screenshot — Figma's render/export pipeline can return a stale frame on the first request
after a batch of changes.

One leftover from this process: the "Badge" top-label (sibling text above the outer frame) was
accidentally dropped at some point during the cell-clearing edits — restored immediately after
noticing.

## Follow-up — removed top-label, added version/timestamp tag

User asked to drop the small component-name label above the outer frame and instead add a
small top-right tag showing the generating package version and a timestamp (format `v0.0.1 -
02.09.2026`). Added `version-tag` text (`Alias/Text/Size/XS`, `Alias/Text/Color/Grey`,
right-aligned) in the top-right corner, reading `v0.0.6 - 24.10.2026` — version from
`packages/core/package.json`'s `version` field at build time, date in `DD.MM.YYYY`. Badge never
actually had a top-label to begin with (checked — only `title` existed), so this was a no-op
removal here; `ds-spinner`/`ds-icon` did have one and had theirs removed.

## Follow-up — locked the overlaid grid variants

User asked for the real master variants overlaid on the Main components grid to be locked
(`node.locked = true`) so they can't be accidentally dragged out of alignment in the Figma UI.
Applied to all 18 variants in the component set. Locking only prevents UI selection/dragging —
this skill's own scripts can still reposition them programmatically (e.g. after a layout change
elsewhere shifts the table, per the realignment rule in `CONVENTIONS.md`); don't forget to
leave them locked again after any such realignment.

## Follow-up — all borders/dividers to 2px

User asked for a consistent 2px thickness everywhere: divider rules, table grid lines, and all
frame strokes (outer frame, Variants panel, Main components table). Updated: divider rectangles
resized to `height: 2`, grid-line rectangles (`v-grid-line-*`/`h-grid-line-*` — Badge's original
naming, inconsistent with `ds-spinner`/`ds-icon`'s later `v-line-*`/`h-line-*`, worth unifying
naming in a future pass) resized to 2px thickness, and every frame with `strokeWeight`/`strokes`
set to `strokeWeight: 2`.

## Follow-up — lead paragraph text color

Rebound the lead paragraph's fill from `Alias/Text/Color/Grey` to `Alias/Text/Color/Primary` on
request.

## Follow-up — page background color

Set the Figma page's own `backgrounds` to a literal solid `#e8e8e8` (`{r: 232/255, g: 232/255,
b: 232/255}`) on request — a fixed literal, not a design token (no page-background token exists
in this system). Applied via `page.backgrounds = [{ type: 'SOLID', color }]`. Confirmed via
read-back of the set value; the shade is subtle against Figma's own default canvas grey, so this
should also be spot-checked visually in the actual Figma app, not just trusted from a
screenshot.

## Follow-up — breadcrumb kicker + AI-review emoji convention

User asked for each page's title/kicker to follow a breadcrumb format: `⏳ Core / <Category> /
<Component>` — for Badge, `⏳ Core / Indicator / Badge`. The `⏳` (hourglass) signals the page was
generated/changed by AI and needs human review; once reviewed and approved, a human manually
swaps it to `✅`. Applied to **both** the actual Figma page name (was "Badge", now
`⏳ Core / Indicator / Badge`) and the in-page `kicker` text node (top-left corner, was
"Indicator").

**This emoji must never be set to `✅` by the skill itself** — it's a human-only sign-off marker.
Every fresh build or edit by this skill should (re-)set it to `⏳`, never `✅`.

## Follow-up — moved the version/timestamp into the header's wordmark slot

User clarified the version/timestamp should replace the "Helvetia Design System" wordmark text
in the header's top bar (right side, next to the "Indicator" kicker), not be a separate floating
tag above the frame. Removed the standalone `version-tag` node; the `wordmark` text node's
content is now the version/timestamp string itself (`v0.0.6 - 26.10.2026`), same styling as
before (`Alias/Text/Size/XS`, `Alias/Text/Color/Grey`). **Found along the way**: Badge's
`wordmark` node had gone missing entirely at some point during earlier header rebuilds (same
"silently dropped node" pattern as the top-label incident) — re-created it directly inside the
`top-bar` row rather than assuming it still existed.

## Follow-up — centered alignment and visible grid lines on Main components

User asked for the master-set overlay to be center-aligned and for visible grid lines, and asked
whether the component set itself could use Figma's native auto-layout.

- **Tried native `GRID` layoutMode on the `COMPONENT_SET` first** (`set.layoutMode = 'GRID'`) —
  it IS accepted by the Plugin API, but `gridRowAnchorIndex`/`gridColumnAnchorIndex` on each
  variant child throws `read-only property on COMPONENT node`. Figma does not allow the plugin
  API to manually place a component set's variants within a grid layout — their position is
  presumably meant to be driven implicitly by variant property order, not explicitly settable,
  and auto-assignment never kicked in (anchors stayed `-1`). **Reverted to `layoutMode: 'NONE'`**
  with precise manual positioning instead — not true auto-layout, but the only controllable path
  given this API constraint. Flagging for `CONVENTIONS.md`.
- **Centering fixed**: every variant is positioned at
  `colIdx * colStep + (colStep - variant.width) / 2` (and the row equivalent), guaranteeing
  visual centering regardless of each size's differing badge width (12px dot vs 24–42px "9+"
  pill). Column/row header text was also switched from left-padded to `primaryAxisAlignItems:
'CENTER'`, so headers and badges now share the same visual center per column/row (previously
  headers were left-aligned while badges were centered, causing a visible offset).
- **Grid lines added**: thin 1px `Alias/Border/Color/GreyLight` rectangles between every column
  and every row, appended to the table frame. **Pitfall hit**: the table is an auto-layout
  frame, so appending plain rectangles made them participate in the auto-layout stack (pushing
  content down) instead of overlaying — fixed by setting `layoutPositioning: 'ABSOLUTE'` on each
  line immediately after appending, which opts a child out of the auto-layout flow for free
  x/y placement.

**Learned rule for CONVENTIONS.md**: a `COMPONENT_SET`'s variant children cannot be manually
positioned via Figma's native `GRID` layout mode — `gridRowAnchorIndex`/`gridColumnAnchorIndex`
are read-only on `COMPONENT` variants. For any custom grid arrangement of a component set's
variants, use `layoutMode: 'NONE'` with manual `x`/`y` positioning, not the grid layout API.
