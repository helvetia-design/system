# close → Figma mapping

```yaml
figmaComponentKey: null # split into two top-level sets, see figmaComponentKeys
figmaComponentKeys:
  primary: '1992:47' # Close/Primary component set node id, 15 variants (size x state)
  inverted: '1992:93' # Close/Inverted component set node id, 15 variants, same axes
figmaPage: '⏳ Core / Action / Close' # page node 1991:20
figmaDocumentation:
  light: '1993:2' # "Close Documentation" frame
  dark: '1993:5904' # "Inverted Close Documentation" frame
  specs: '2047:19' # "📐 Specs" section, light frame only
figmaCollection: Design Tokens # modes: Base, Tcs — brand-agnostic binding

props:
  - name: size
    type: enum
    options: [sm, md] # CLOSE_SIZES — code default (unset) = implicit "base"
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, md]

  - name: inverted
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: top-level-component-split
    note: >
      Same pattern as ds-spinner: two separate component sets, `Close/Primary` and
      `Close/Inverted`, swapped via Instance Swap instead of a property toggle. Inverted only
      changes token values (icon color, hover/active backgrounds, focus color), not layers.

  - name: disabled
    type: boolean
    default: false
    figmaProperty: state
    figmaPropertyType: state-option
    note: Folded into the `state` property as the `disabled` option (baseline rule).

  - name: button
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: deferred
    note: >
      DEFERRED — not built in this run, by decision (2026-10-26). `button=true` renders a nested
      `<ds-button>` with a text label instead of the icon button, and ds-button has no Figma
      component yet. May be added later; if so, ds-button must be pushed first.

  - name: buttonColor
    type: enum
    figmaProperty: null
    figmaPropertyType: deferred
    note: Only applies when `button=true` — deferred together with `button`.

  - name: buttonSize
    type: enum
    figmaProperty: null
    figmaPropertyType: deferred
    note: Only applies when `button=true` — deferred together with `button`.

states:
  figmaProperty: state
  options: [default, hover, active, focus, disabled]
  sources:
    hover: ':hover (close.mixin.scss)'
    active: ':active (close.mixin.scss)'
    focus: ':focus-visible / .is-focused (close.mixin.scss, focus-shadow mixin)'
    disabled: 'disabled prop (close.host.scss .is-disabled)'

nested: [] # non-button render has no nested DS component; the X is a CSS mask SVG, not <ds-icon>

tokens:
  # Container (the <button>)
  - cssVar: --ds-close-size-base
    figmaVariable: 🧩 Component/Close/Size/Base # 24
    binds: width + height (size=base)
    resolved: true
  - cssVar: --ds-close-size-sm
    figmaVariable: 🧩 Component/Close/Size/SM # 14
    binds: width + height (size=sm)
    resolved: true
  - cssVar: --ds-close-size-md
    figmaVariable: 🧩 Component/Close/Size/MD # 32
    binds: width + height (size=md)
    resolved: true
  - cssVar: --ds-close-radius
    figmaVariable: 🧩 Component/Close/Radius # 9999
    binds: corner radius
    resolved: true
  - cssVar: --ds-close-primary-color-background-base
    figmaVariable: 🧩 Component/Close/Primary/Color/Background/Base
    resolved: true
  - cssVar: --ds-close-primary-color-background-hover
    figmaVariable: 🧩 Component/Close/Primary/Color/Background/Hover
    resolved: true
  - cssVar: --ds-close-primary-color-background-active
    figmaVariable: 🧩 Component/Close/Primary/Color/Background/Active
    resolved: true
  - cssVar: --ds-close-primary-color-background-disabled
    figmaVariable: 🧩 Component/Close/Primary/Color/Background/Disabled
    resolved: true
  - cssVar: --ds-close-inverted-color-background-hover
    figmaVariable: 🧩 Component/Close/Inverted/Color/Background/Hover
    resolved: true
  - cssVar: --ds-close-inverted-color-background-active
    figmaVariable: 🧩 Component/Close/Inverted/Color/Background/Active
    resolved: true
  - cssVar: --ds-close-inverted-color-background-disabled
    figmaVariable: 🧩 Component/Close/Inverted/Color/Background/Disabled
    resolved: true
  - cssVar: (none — inverted default/focus background)
    figmaVariable: 🧩 Component/Close/Inverted/Color/Background/Base
    resolved: true
    note: >
      Code never sets this — inverted keeps the primary base background (transparent). The
      inverted token exists with the same value, so Close/Inverted binds to it for consistency.

  # Icon (the ::after mask)
  - cssVar: --ds-close-primary-color-icon-base
    figmaVariable: 🧩 Component/Close/Primary/Color/Icon/Base
    resolved: true
  - cssVar: --ds-close-primary-color-icon-disabled
    figmaVariable: 🧩 Component/Close/Primary/Color/Icon/Disabled
    resolved: true
  - cssVar: --ds-close-inverted-color-icon-base
    figmaVariable: 🧩 Component/Close/Inverted/Color/Icon/Base
    resolved: true
  - cssVar: --ds-close-inverted-color-icon-disabled
    figmaVariable: 🧩 Component/Close/Inverted/Color/Icon/Disabled
    resolved: true
  - cssVar: --ds-close-padding-base / -sm / -md
    figmaVariable: 🧩 Component/Close/Padding/Base | SM | MD # 10 | 6 | 14
    resolved: true
    binding: intentionally unbound
    resolution: >
      Option 1 (confirmed 2026-10-26): glyph size is the computed literal calc(size - padding)
      = 14 / 8 / 18, not bound — Figma can't bind a derived value. See "Icon size" below.

  # Focus ring (focus-shadow mixin: border 0 0 0 2px, focus color 0 0 0 5px)
  - cssVar: --ds-alias-interaction-focus-color-border
    figmaVariable: 🔗 Alias/✨ Interaction/Focus/Color/Border
    binds: inner drop shadow color
    resolved: true
  - cssVar: --ds-alias-interaction-focus-color-base
    figmaVariable: 🔗 Alias/✨ Interaction/Focus/Color/Base
    binds: outer drop shadow color (Close/Primary)
    resolved: true
  - cssVar: --ds-alias-interaction-focus-color-inverted
    figmaVariable: 🔗 Alias/✨ Interaction/Focus/Color/Inverted
    binds: outer drop shadow color (Close/Inverted)
    resolved: true
  - cssVar: (literal 2px / 5px spread in focus-shadow mixin)
    figmaVariable: 🔗 Alias/✨ Interaction/Focus/Size/Inner | Outer # 2 | 5
    binds: focus ring stroke weights
    resolved: true
    note: Code hardcodes 2px/5px; matching tokens exist with the same values, so they're bound.

specs: # shown in the "📐 Specs" section, one card per size
  # Glyph (calc(size - padding)) is a calculated content size and the radius makes a circle,
  # so neither is annotated. Padding marker shows the per-side 5/3/7px; the token holds the total.
  base:
    - { kind: size, label: Size, px: 24, token: 🧩 Component/Close/Size/Base } # width = height
    - { kind: spacing, label: Padding, px: 5, token: 🧩 Component/Close/Padding/Base, calc: '(10px) ÷ 2' }
  sm:
    - { kind: size, label: Size, px: 14, token: 🧩 Component/Close/Size/SM } # width = height
    - { kind: spacing, label: Padding, px: 3, token: 🧩 Component/Close/Padding/SM, calc: '(6px) ÷ 2' }
  md:
    - { kind: size, label: Size, px: 32, token: 🧩 Component/Close/Size/MD } # width = height
    - { kind: spacing, label: Padding, px: 7, token: 🧩 Component/Close/Padding/MD, calc: '(14px) ÷ 2' }
```

## Layers

Each variant: a component frame (fixed W/H bound to the size token, radius, background fill)
containing one `Icon` frame with the `X` vector — the 14×14 path from `close.mixin.scss`'s
`--_close-icon` data URI, rescaled to the glyph size, centered, filled with the icon color token.

`state=focus` variants additionally hold two absolutely positioned ring frames behind the icon:
`Focus ring/Outer` (outside stroke, weight `Focus/Size/Outer`, color `Focus/Color/Base` or
`/Inverted`) and `Focus ring/Inner` on top of it (outside stroke, weight `Focus/Size/Inner`,
color `Focus/Color/Border`). This reproduces the two `box-shadow` spreads from the
`focus-shadow` mixin.

## Build notes

- **Focus ring isn't a drop shadow.** First built as two spread `DROP_SHADOW` effects, but
  Figma derives shadows from the layer's own alpha, and the close background token is fully
  transparent, so no shadow rendered at all. Replaced with the outside-stroke rings above.
- **Stale cached paint colors.** Variants cloned from the base and rebound via
  `setBoundVariableForPaint` with a placeholder color kept that placeholder (black) as the
  master's rendered color, although the binding itself was correct (instances resolved fine).
  Fixed by rebinding every bound paint in both sets with `variable.resolveForConsumer(node)` as
  the paint color.
- Documentation frames were cloned from `ds-spinner`'s canonical frames (`1890:58`) and adapted:
  Variants axis = `size` (base/sm/md), Main components = `size` rows × `state` columns, with the
  real master sets overlaid on the table cells and every variant locked.

## Phase 4 review

Compared against `test/close.visual.play.ts-snapshots` (basic, sizes, inverted, desktop):
glyph shape, icon colors and the size ratios (sm < base < md) match. No baseline exists for
hover/active/focus/disabled-only states, or for `inverted` + `disabled` — those are verified
against the SCSS and token values only, not against a rendered screenshot.

## Variant matrix

Two component sets (`Close/Primary`, `Close/Inverted`), each `size` (3) × `state` (5) = 15
variants, 30 total.

## Open question — icon size

Code sizes the X glyph as `calc(size - padding)`, i.e. the padding token is the _total_ space
subtracted, not per-side padding:

| size | container | padding token | glyph |
| ---- | --------- | ------------- | ----- |
| base | 24        | 10            | 14    |
| sm   | 14        | 6             | 8     |
| md   | 32        | 14            | 18    |

Figma can't bind a computed value, and auto-layout padding would need `padding / 2`, which also
has no variable. Options:

1. **(Recommended)** Bind the container to the size token and set the glyph to the computed
   literal (14 / 8 / 18), recorded here as "derived from two tokens, intentionally unbound".
2. Use auto-layout padding bound to the padding token on one side only — wrong geometry, not
   recommended.
3. Add new per-side padding tokens to the token source — out of scope for this skill.

## Follow-up — header rebuilt to match the pattern introduced on `ds-spinner`

Same rebuild as `badge.figma.md`/`icon.figma.md`'s equivalent entries — see those files and
`DOCUMENTATION-TEMPLATE.md` for the full spec. Applied to **both** frames (`Close/Primary`'s
"Close Documentation" and `Close/Inverted`'s "Inverted Close Documentation"), since `ds-close`
has a true `inverted` top-level split like `ds-spinner`.

- Wrapped `top-bar`/`heading`/`body` into one `header` auto-layout frame on both frames.
- Replaced the single `title` text with a two-line `heading`: `"Close"` bold 48px + a
  light-weight qualifier — `"Main"` on the Primary frame, `"Inverted"` on the Inverted frame
  (same convention as `ds-spinner`).
- **Pitfall hit**: the Inverted frame's original `title` text content was literally
  `"Inverted Close"` (not just `"Close"`), so the first automated pass carried that into line 1,
  producing a redundant `"Inverted Close"` / `"Inverted"` heading. Fixed by explicitly setting
  line 1's text to the plain component name (`"Close"`) to match `ds-spinner`'s pattern, where
  line 1 reads identically on both frames and only line 2 differs. Check this on any component
  whose Inverted frame's original title included the word "Inverted" in the component name
  itself, rather than assuming `title.characters` is always the plain component name.
- Restyled the "View in Storybook ↗" link to Bold 16px underlined navy on both frames.
- Bumped `lead` from 14px to 16px on both frames.
- **Realigned the Main components overlay on both frames afterward** — `Close/Primary` and
  `Close/Inverted` are page-level siblings with page-absolute coordinates (not reparented into
  their table frames), so the taller two-line heading shifted both "Tables row" positions.
  Recomputed and reapplied against each table's current `absoluteTransform` (`size` × `state`
  grid: rows `base`/`sm`/`md`, columns `default`/`hover`/`active`/`focus`/`disabled`, 15 cells per
  frame). Verified via position math — 30/30 correct across both frames.

## Follow-up — "📐 Specs" section (pilot)

First component with the new Specs section (see `DOCUMENTATION-TEMPLATE.md` → "5. 📐 Specs").
Added to the light frame only, as section `2047:19`: one card per size (base/sm/md), each with a
1× `size=<option>, state=default` instance annotated with width, height and padding, plus a
legend (swatch | value | label | Figma variable name + calculation). Values were read from the Figma variables at build
time and match the `specs:` list above.

The annotation components were created for this run on a new shared page, `🧰 Annotations`
(`2046:5`): `Spec/Dimension` (`2046:36`), `Spec/Inset` (`2046:37`), `Spec/Outline` (`2046:38`),
`Spec/Radius` (`2046:39`), `Spec/Legend item` (`2046:57`).

- Second pass (review feedback): the glyph size and the radius were removed. The glyph is a
  calculated inner content size, and `9999` makes the close button a circle.
- Width and height are both annotated on the stage because the code fixes them (`width`/`height`
  from the size token). They share the variable and value, so the legend merges them into one
  `Size` row.
- The padding marker and legend value show the per-side value (5/3/7px), but the token is the
  _total_ subtracted from the size (10/6/14, see "Icon size" above). The legend shows the
  calculation after the variable name (`🧩 Component/Close/Padding/Base (10px) ÷ 2`) so the two
  numbers don't look contradictory. Confirmed with the user (2026-10-29): keep it per side.
