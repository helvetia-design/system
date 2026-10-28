# icon → Figma mapping

```yaml
figmaComponentKey: '2056:8249' # Icon wrapper COMPONENT_SET (size x color, 40 variants), Icon page
figmaPage: Icon
figmaCollection: Design Tokens

props:
  - name: name
    type: string (open icon registry — 79 SVGs under packages/assets/src/icons/svg)
    figmaProperty: null
    figmaPropertyType: top-level-split + instance-swap-library
    note: >
      Open-ended content-selection prop, same treatment as the existing CONVENTIONS.md pattern
      for this exact component: one shared wrapper COMPONENT_SET crossing the remaining
      same-layers sub-props (size/color/state/inverted/shadow/turn), plus 79 lightweight
      single-vector COMPONENTs (not sets) as an Instance Swap library, parked off-canvas.

  - name: size
    type: enum
    options: [sm, md, lg, xl] # ICON_SIZES
    default: '(unset — falls back to Component/Icon/Size/Base, same implicit-default pattern as badge/spinner)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, md, lg, xl]
    note: "Hard-defined per user's stated philosophy — size axes are never eligible for the variable-override mitigation, only crossed variant or structural split."

  - name: color
    type: enum
    options: [primary, info, grey, success, danger, warning] # ICON_COLORS (already fixed in code — no duplicate)
    default: "(unset — falls back to Component/Icon/Color/Primary, visually identical to color=primary, so NOT modeled as a separate 'default' option, unlike badge)"
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [primary, info, grey, success, danger, warning, inverted, disabled]
    note: >
      Token-swap axis (same layers, different Icon/Color/* variable). Per user decision, both
      `inverted` and `disabled` are folded in as additional options on this same `color`
      property (NOT separate crossed booleans/state) — each is just another token-swap value
      (Icon/Color/Inverted, Icon/Color/Disabled) on the identical shape, same treatment as any
      other color option, mirroring `ds-badge`'s `disabled`-as-a-color-option precedent. This
      also fully resolves anomaly 2: since both are now mutually-exclusive values of one enum
      rather than independent booleans, there's no `inverted×disabled` cross to misrepresent at
      all — the real code's "disabled always wins" behavior is inherent to them being one
      property, not two. `Icon/Color/InvertedDisabled` remains unused (orphaned token, separate
      follow-up, not fixed here).

  - name: inverted
    type: boolean
    default: false
    figmaPropertyType: 'folded into `color` above as one of its options — not a separate axis'

  - name: shadow
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'User confirmed: ignored for this push, not modeled as a variant.'

  - name: turn
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'User confirmed: ignored for this push, not modeled as a variant.'

  - name: inline
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: "No static visual effect in an isolated swatch — confirmed by user, same rule as spinner's deactivated."

  - name: disabled
    type: boolean
    default: false
    figmaPropertyType: 'folded into `color` above as one of its options — not a separate `state` axis'

  - name: invalid
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: 'Resolves identically to color=danger, no dedicated token — confirmed excluded, not modeled as a separate swatch.'

  - name: svg / src
    type: string (alternate free-form content sources, not the registry `name` path)
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: >
      Open-ended arbitrary content, not enumerable, same treatment as badge's slot/spinner's
      label for "can't be modeled as a variant" — but unlike those, not even modeled as an
      instance-text-override, since this push targets the closed `name` registry only. Noted in
      prose, not mapped.

states: [] # no separate `state` property — disabled folded into `color` per user decision, see above
# No pseudo-class states in icon.host.scss (:hover/:focus/:active) — icon is non-interactive,
# same as spinner/badge. `disabled` is the only pseudo-state-ish prop icon has, and it's modeled
# as a `color` option (not a `state` axis), same pattern as ds-badge's `disabled` color.
# `invalid` confirmed excluded (anomaly 3).

nested: [] # ds-icon has no nested DS components

tokens:
  - cssVar: --ds-icon-size-base/-sm/-md/-lg/-xl
    figmaVariable: 🧩 Component/Icon/Size/Base|SM|MD|LG|XL
    resolved: true
  - cssVar: --ds-icon-color-primary
    figmaVariable: 🧩 Component/Icon/Color/Primary
    resolved: true
  - cssVar: --ds-icon-color-info
    figmaVariable: 🧩 Component/Icon/Color/Info
    resolved: true
  - cssVar: --ds-icon-color-grey
    figmaVariable: 🧩 Component/Icon/Color/Grey
    resolved: true
  - cssVar: --ds-icon-color-success
    figmaVariable: 🧩 Component/Icon/Color/Success
    resolved: true
  - cssVar: --ds-icon-color-danger
    figmaVariable: 🧩 Component/Icon/Color/Danger
    resolved: true
  - cssVar: --ds-icon-color-warning
    figmaVariable: 🧩 Component/Icon/Color/Warning
    resolved: true
  - cssVar: --ds-icon-color-disabled
    figmaVariable: 🧩 Component/Icon/Color/Disabled
    resolved: true
  - cssVar: --ds-icon-color-inverted
    figmaVariable: 🧩 Component/Icon/Color/Inverted
    resolved: true
  - cssVar: --ds-icon-color-primary-light
    figmaVariable: null
    resolved: false
    resolution: 'PENDING — see anomaly 1. No matching Figma variable, and not reachable via any public prop either.'
  - figmaVariableOnly: 🧩 Component/Icon/Color/InvertedDisabled
    cssVar: null
    resolved: false
    resolution: >
      RESOLVED (anomaly 2) — not used in this build. Confirmed: Figma mirrors today's real code
      behavior (disabled always wins over inverted, combination unreachable). Orphaned token,
      flagged as a separate code/design-token follow-up, not fixed here.
```

## Anomalies found in Phase 1 — resolved

1. **`color` enum drift — resolved.** `ICON_COLORS`'s stray duplicate `'info'` is already fixed
   in code (`['primary', 'info', 'grey', 'success', 'danger', 'warning']`, 6 unique options).
   `primary-light` (SCSS-only, no backing token, unreachable via any prop) left as confirmed-dead
   CSS — not modeled in Figma, not touched in code.
2. **`inverted` × `disabled` — resolved.** Figma mirrors today's real code behavior: the
   combination is unreachable (`disabled` always wins over `inverted` via CSS source order).
   Built as a straight 2×2 cross for structural consistency with every other boolean axis in this
   system; the `disabled=true, inverted=true` cell is visually identical to
   `disabled=true, inverted=false` (both resolve to `Icon/Color/Disabled`) — a faithful, if
   redundant, reproduction of real behavior. `Icon/Color/InvertedDisabled` stays unused, flagged
   as an orphaned token for a separate code/design-token follow-up.
3. **`invalid` — resolved.** Excluded entirely. Redundant with `color=danger` (no dedicated
   token), not modeled as its own swatch.
4. **`inline` — resolved.** Excluded entirely. No static visual effect in an isolated swatch.

Phase 2 (variant grouping + the new 500-variant threshold check) starts next.

## Phase 2 — variant grouping (final, after folding `disabled` into `color` too)

**Axes crossed in the one wrapper `COMPONENT_SET`** (`name` stays the existing top-level
content-split + Instance Swap pattern, unaffected by this recalculation):

| Axis    | Options                                                           | Count |
| ------- | ----------------------------------------------------------------- | ----- |
| `size`  | base, sm, md, lg, xl                                              | 5     |
| `color` | primary, info, grey, success, danger, warning, inverted, disabled | 8     |

**Total = 5 × 8 = 40 variants per wrapper set.** Well under the 500 hard-stop — no mitigation
needed. No separate `state` axis at all now (folded into `color`); `shadow`/`turn`/`invalid`/
`inline` all excluded entirely (confirmed).

**Grid sketch — 2 axes, the normal case**: `color` (rows) × `size` (columns):

```
            Base   SM    MD    LG    XL
Primary   [cell] [cell] [cell] [cell] [cell]
Info      [cell] [cell] [cell] [cell] [cell]
Grey      [cell] [cell] [cell] [cell] [cell]
Success   [cell] [cell] [cell] [cell] [cell]
Danger    [cell] [cell] [cell] [cell] [cell]
Warning   [cell] [cell] [cell] [cell] [cell]
Inverted  [cell] [cell] [cell] [cell] [cell]
Disabled  [cell] [cell] [cell] [cell] [cell]
```

One flat 8×5 table, 40 cells, matching the variant count exactly — the simplest possible
documentation layout, no repeated/nested grids needed.

Plus the separate Instance Swap library: 79 single-vector `COMPONENT`s (one per icon name),
parked off-canvas, excluded from the 500-count per the standing rule.

**Final props summary**: `name` (top-level split + swap), `size` (variant, 5 opts), `color`
(variant, 8 opts incl. `inverted`/`disabled`). Everything else (`shadow`, `turn`, `invalid`,
`inline`, `svg`, `src`) excluded.

**Awaiting your confirmation on this grouping before Phase 3 build starts.**

## Phase 3 — build progress

- Figma page created: `⏳ Core / Media / Icon` (page id `2052:2`).
- **Instance Swap library**: all 79 icon SVGs imported via `figma.createNodeFromSvg`, rescaled to
  a 100px canonical master size, flattened to a single fill-bearing `VECTOR` per the standing
  CONVENTIONS rule, converted to `COMPONENT`s, parked off-canvas. Verified: 79/79 built, names
  match the registry exactly (no missing/duplicate/unexpected). Two icons needed the
  clip-path-artifact fix (a `<clipPath>` imports as a visible sibling `GROUP`, not a real clip
  mask — removed before flatten): `information` and `triangle`. `xing`'s 2 top-level `<path>`s
  flattened cleanly (multi-vector case, matches the historical `xing`/`information` precedent in
  CONVENTIONS.md).
- **Wrapper `COMPONENT_SET`** (`Icon`, node id `2056:8249`): 40 variants (`size` × `color`), each
  a frame sized to the resolved `Component/Icon/Size/*` value (SM 14 / Base 16 / MD 24 / LG 32 /
  XL 40), containing a nested `INSTANCE` of the default glyph (`check`) with its vector fill
  bound via `setBoundVariableForPaint` to the matching `Component/Icon/Color/*` variable. An
  `Icon` `INSTANCE_SWAP` component property (key `Icon#2056:0`, default `check`) is wired via
  `componentPropertyReferences` on every variant's nested instance.
- Screenshot checkpoint confirmed correct: sizes scale correctly across all 5 options, all 8
  colors resolve distinctly and correctly (including `inverted` rendering pale/near-white and
  `disabled` rendering dark grey, as expected from their tokens).
- Master set rearranged into the confirmed 8×5 grid (`color` rows × `size` columns) as a genuine
  `ABSOLUTE` auto-layout child of the Main components table's `Tables row`, per
  `DOCUMENTATION-TEMPLATE.md`'s confirmed `ds-close` mechanism — not a page-level overlay. Locked
  once (`set.locked = true`), no per-child locking.

## Phase 3b — documentation page

Built using the fixed template (`DOCUMENTATION-TEMPLATE.md`), inspected against the live
`ds-close` reference (`1993:2`) before building. One deviation from the template's prose, agreed
with the user: `DOCUMENTATION-TEMPLATE.md`'s "N-split components" section still describes the
pre-wrapper architecture (79 separate crossed sets) and is stale for this component — adapted
"Main components" to our actual wrapper structure instead.

- **Header**: breadcrumb kicker `⏳ Core / Media / Icon` (also set as the page name), wordmark
  `v0.0.6 - 27.10.2026`, two-line heading (`"Icon"` bold, qualifier line hidden — no `inverted`
  top-level split for this component, since `inverted` is a `color` option, not a structural
  axis), lead paragraph verbatim from `icon.tsx`'s JSDoc, "View in Storybook ↗" link to
  `components-media-icon-icon--icon`.
- **Copy me**: one instance of `size=base, color=primary` (default `check` glyph) in the shaded
  box.
- **Variants**: `size` axis (the scale-defining property, same role as every other component),
  sidebar tags Base/SM/MD/LG/XL, 5 representative instances at `color=primary`.
- **Main components**: the real 40-variant wrapper set as an 8×5 table (`color` rows ×
  `size` columns) — not 79 separate tables. Fixed a legibility issue during the build: the
  `Inverted` row's checkmarks were invisible (pale color on a white cell) until its 5 data cells
  were given the dark preview fill (`VariableID:137:2764`), same reasoning as the template's
  inverted-frame dark-preview rule, applied per-row here instead of per-frame since `inverted`
  isn't a separate frame in this architecture.
- **🖼️ Icon names** (extra section, confirmed with user): a 9×9 grid of all 79 icons at
  `size=md, color=primary`, each an instance of the wrapper's default variant with its `Icon`
  Instance Swap property (`Icon#2056:0`) overridden per cell (`instance.setProperties({...})`) to
  the matching swap-library component, with a name label underneath. Verified all 79 render
  correctly, including both clip-path-fixed icons (`information`, `triangle`) and the two-path
  `xing` logo.

All sections screenshot-verified.

## Phase 4 — review against real rendering

- **Sizes**: compared the Figma "Variants" row against `test/icon.visual.play.ts-snapshots/icon-sizes-*.png` — identical 5-step size progression, confirms the `Component/Icon/Size/*` bindings (14/16/24/32/40) match reality.
- **Colors**: cross-checked each bound Figma variable against the generated token CSS
  (`packages/tokens/dist/css/base.tokens.css`) instead of a pixel comparison, since the same
  token pipeline backs both: `primary→Primary-5`, `success→Success-5`, `warning→Warning-6-B`,
  `grey→Grey-5`, `danger→Danger-5`, `info→Alias.Text.Color.Hint (Primary-3, a muted navy)`,
  `inverted→Alias.Text.Color.White`, `disabled→Grey-6`. All match what the Figma build shows
  (`info` reading as a muted indigo, not a distinct "info blue" — confirmed intentional, not a
  binding mistake). Also matches `icon-colors-*.png`'s structure: 6 colors on a light background,
  the same 6 colors again on a dark background all rendering pale/white (confirms `inverted`
  overriding every `color` value, same as our `color=inverted` modeling).
- **Icon artwork**: all 79 icon-name swatches visually match their real SVG source shapes
  (spot-checked the two clip-path-fixed icons and the two-path `xing` logo specifically, since
  those needed a non-default import fix).
- **Non-blocking anomaly found, not fixed (out of this build's scope since `invalid` is already
  excluded from the Figma model per the earlier decision)**: `test/icon.visual.play.ts-snapshots/icon-states-*.png`
  visually suggests the real `invalid` prop might render identically to the unset default, not
  `color-danger` as `icon.host.scss`'s `:host(.is-invalid)` rule implies — only a quick visual
  read of a small baseline image, **not confirmed via `getComputedStyle`** (no PNG-pixel tooling
  available in this environment to verify further; flagged per the "don't trust a small image"
  rule rather than either asserted as fact or silently ignored). Doesn't affect this push since
  `invalid` isn't modeled in Figma at all — worth a separate look if the user wants `invalid`
  ever added back.

**Phase 4 status: closed, no Figma-side defects found.** `ds-icon` is live in Figma: page
`⏳ Core / Media / Icon`, wrapper set `2056:8249` (40 variants), 79-member Instance Swap library,
full documentation page (Header / Copy me / Variants / Main components / Icon names).
