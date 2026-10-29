# badge → Figma mapping

```yaml
figmaComponentKey: '2129:84' # Badge COMPONENT_SET (color x size, 18 variants), Badge page
figmaPage: Badge
figmaCollection: Design Tokens

anatomy:
  - letter: A
    part: badge
    description: 'The badge element itself.'
  - letter: B
    part: icon
    description: 'The icon element, if an icon is used.'

props:
  - name: icon
    type: string (open icon registry — same registry as ds-icon's `name`)
    default: ''
    figmaProperty: null
    figmaPropertyType: nested-instance (ds-icon) + instance-text-override pairing
    note: >
      Not a crossed variant property — one nested `ds-icon` INSTANCE (bound to its wrapper
      component, figmaComponentKey "2056:8249" from icon.figma.md) shown on every variant, paired
      with a `Show icon` boolean component property (default `false`, matching code's `icon: string
      = ''` default) bound to the icon instance's `visible` via componentPropertyReferences.
      Consumers change which icon shows via the nested ds-icon instance's own Instance Swap
      property (already built into the icon component) — badge itself never crosses icon `name`
      into its own matrix. Real code visibility is `size !== 'sm' && hasValue(icon)` — the `size
      !== 'sm'` half is handled structurally (see `size` below), not by this boolean.

  - name: size
    type: enum
    options: [sm, lg] # BADGE_SIZES
    default: '(unset — falls back to Base tier tokens, implicit-default pattern, same as
      ds-spinner/ds-icon)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, lg]
    note: >
      Same-layers test: all three options render the same shape (pill container + optional icon +
      optional label), only scaling tokens (radius/height/icon-size/font-size/gap/padding) differ —
      crossed variant property, not a top-level split. `sm` additionally hides all children in code
      (`:host(.is-sm) > * { display: none }`) — represented in Figma as an empty pill for every
      `sm` cell regardless of `Show icon`/slot content, not a different layer structure.

  - name: color
    type: enum
    options: [disabled, info, danger, warning, success] # BADGE_COLORS
    default: '(unset — falls back to Default tier tokens, implicit-default pattern, same as size)'
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [default, disabled, info, danger, warning, success]
    note: 'Same-layers, different-token axis — standard crossed variant, same treatment as size.'

  - name: position
    type: enum
    options: [card, button, tabs] # BADGE_POSITIONS
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: >
      Reflects as a host attribute but has zero visual effect: badge.host.scss never reads it, and
      although card.style.scss/button.style.scss set `--badge-position`/`--badge-top` on any nested
      ds-badge, badge's own code never consumes those variables either. Dead CSS today in both
      badge and its two consumers — flagging as a possible code bug, not fixing it here. Excluded
      from the Figma mapping per user confirmation.

  - name: pulse
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: EXCLUDED (confirmed)
    note: "Only drives a box-shadow keyframe animation (`pulse`) — no static visual effect for a
      Figma swatch to represent. Same treatment as ds-spinner's `deactivated`. Excluded per user
      confirmation."

states: [] # no pseudo-class states — badge is non-interactive, same as spinner/icon
nested:
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: '2056:8249'

tokens:
  - cssVar: --ds-badge-typo-font-family
    figmaVariable: 🧩 Component/Badge/Typo/FontFamily
    resolved: true
  - cssVar: --ds-badge-typo-font-weight
    figmaVariable: 🧩 Component/Badge/Typo/FontWeight
    resolved: true
  - cssVar: --ds-badge-typo-line-height
    figmaVariable: 🧩 Component/Badge/Typo/LineHeight
    resolved: true
    note: >
      Percent-semantic FLOAT, subject to the standing Plugin API limitation (setBoundVariable on
      lineHeight always applies as PIXELS) — resolve the numeric value and apply as a literal
      unbound PERCENT, same documented workaround as every prior component's label text.
  - cssVar: --ds-badge-size-base-font
    figmaVariable: 🧩 Component/Badge/Size/Base/Font
    resolved: true
  - cssVar: --ds-badge-size-sm-font
    figmaVariable: 🧩 Component/Badge/Size/SM/Font
    resolved: true
  - cssVar: --ds-badge-size-lg-font
    figmaVariable: 🧩 Component/Badge/Size/LG/Font
    resolved: true
  - cssVar: --ds-badge-size-base-height (also used as min-width)
    figmaVariable: 🧩 Component/Badge/Size/Base/Height
    resolved: true
  - cssVar: --ds-badge-size-sm-height (also used as min-width and max-width)
    figmaVariable: 🧩 Component/Badge/Size/SM/Height
    resolved: true
  - cssVar: --ds-badge-size-lg-height (also used as min-width)
    figmaVariable: 🧩 Component/Badge/Size/LG/Height
    resolved: true
  - cssVar: --ds-badge-size-base-radius
    figmaVariable: 🧩 Component/Badge/Size/Base/Radius
    resolved: true
  - cssVar: --ds-badge-size-sm-radius
    figmaVariable: 🧩 Component/Badge/Size/SM/Radius
    resolved: true
  - cssVar: --ds-badge-size-lg-radius
    figmaVariable: 🧩 Component/Badge/Size/LG/Radius
    resolved: true
  - cssVar: --ds-badge-size-base-icon
    figmaVariable: 🧩 Component/Badge/Size/Base/Icon
    resolved: true
  - cssVar: --ds-badge-size-sm-icon
    figmaVariable: 🧩 Component/Badge/Size/SM/Icon
    resolved: true
  - cssVar: --ds-badge-size-lg-icon
    figmaVariable: 🧩 Component/Badge/Size/LG/Icon
    resolved: true
  - cssVar: --ds-badge-size-base-gap
    figmaVariable: 🧩 Component/Badge/Size/Base/Gap
    resolved: true
  - cssVar: --ds-badge-size-sm-gap
    figmaVariable: 🧩 Component/Badge/Size/SM/Gap
    resolved: true
  - cssVar: --ds-badge-size-lg-gap
    figmaVariable: 🧩 Component/Badge/Size/LG/Gap
    resolved: true
  - cssVar: --ds-badge-size-base-padding (px and py both)
    figmaVariable: 🧩 Component/Badge/Size/Base/Padding
    resolved: true
  - cssVar: --ds-badge-size-sm-padding (px and py both)
    figmaVariable: 🧩 Component/Badge/Size/SM/Padding
    resolved: true
  - cssVar: --ds-badge-size-lg-padding (px and py both)
    figmaVariable: 🧩 Component/Badge/Size/LG/Padding
    resolved: true
  - cssVar: --ds-badge-default-color-background
    figmaVariable: 🧩 Component/Badge/Default/Color/Background
    resolved: true
  - cssVar: --ds-badge-default-color-text
    figmaVariable: 🧩 Component/Badge/Default/Color/Text
    resolved: true
  - cssVar: --ds-badge-disabled-color-background
    figmaVariable: 🧩 Component/Badge/Disabled/Color/Background
    resolved: true
  - cssVar: --ds-badge-disabled-color-text
    figmaVariable: 🧩 Component/Badge/Disabled/Color/Text
    resolved: true
  - cssVar: --ds-badge-info-color-background
    figmaVariable: 🧩 Component/Badge/Info/Color/Background
    resolved: true
  - cssVar: --ds-badge-info-color-text
    figmaVariable: 🧩 Component/Badge/Info/Color/Text
    resolved: true
  - cssVar: --ds-badge-danger-color-background
    figmaVariable: 🧩 Component/Badge/Danger/Color/Background
    resolved: true
  - cssVar: --ds-badge-danger-color-text
    figmaVariable: 🧩 Component/Badge/Danger/Color/Text
    resolved: true
  - cssVar: --ds-badge-warning-color-background
    figmaVariable: 🧩 Component/Badge/Warning/Color/Background
    resolved: true
  - cssVar: --ds-badge-warning-color-text
    figmaVariable: 🧩 Component/Badge/Warning/Color/Text
    resolved: true
  - cssVar: --ds-badge-success-color-background
    figmaVariable: 🧩 Component/Badge/Success/Color/Background
    resolved: true
  - cssVar: --ds-badge-success-color-text
    figmaVariable: 🧩 Component/Badge/Success/Color/Text
    resolved: true
  - cssVar: "letter-spacing (not set by badge's own code)"
    figmaVariable: null
    resolved: 'n/a — no binding needed'
    note: >
      Unlike ds-spinner's label color/size gap, there is no stale-default mismatch to fix here:
      badge's code never sets letter-spacing, and both the browser's and Figma's own default
      (effectively 0/normal) already match the real rendering. Left unbound deliberately, not an
      oversight.
  - cssVar: "text-decoration (not set by badge's own code)"
    figmaVariable: null
    resolved: 'n/a — no binding needed'
    note: 'Same reasoning as letter-spacing above — both environments already default to none.'
  - cssVar: '--badge-position / --badge-top (set by card.style.scss / button.style.scss, never
      consumed by badge itself)'
    figmaVariable: null
    resolved: EXCLUDED
    resolution: 'Dead CSS tied to the excluded `position` prop — see props list above.'
```

## Anomalies found in Phase 1/3

1. **`Default` color's background token resolves to the exact same RGBA as `Danger`'s**
   (`{r: 1, g: 0.6745, b: 0.6510}`, confirmed via direct value resolution) — and every color's text
   token except `Disabled` resolves to the identical navy. The unset/default badge currently
   renders visually indistinguishable from the danger state. This looks like a real
   token-authoring gap (default never got its own value) rather than an intentional design
   choice, but per user decision this build proceeds faithfully with the real token value — fixing
   it is a token-authoring task outside this skill's scope, not something to silently correct here.

## Phase 4 — review against real rendering

- **`badge-basic`, `badge-sizes`, `badge-icon` baselines all confirm the build**: pink
  default/navy text, pill growing to fit wider content (`"Urgent"`), teal `success` background +
  navy checkmark icon, tiny `sm` dot with no visible content — all match.
- **`badge-colors` baseline is stale, not a real mismatch.** It shows 8 badges labeled
  `R G Y P G S W D`; the current `badge.visual.html` fixture's "colors" section has only 6 badges
  labeled `D G S S W D`. The baseline predates a fixture edit and was never regenerated via
  `pnpm --filter core test -- --update-snapshots` (or equivalent) — flagging as a test-infra gap,
  not something this skill fixes or a real visual regression in the Figma build.
- No real defects found. `ds-badge` is confirmed live in Figma.

## Notes

- `ds-badge` had a live Figma page (`⏳ Core / Indicator / Badge`) earlier in this session, from a
  prior (pre-this-skill) build — that page no longer exists in the file as of this run, and no
  `badge.figma.md` existed on disk either. Treating this as a genuine first create, not a
  reconciliation — consistent with this skill's v1 create-only scope.
- `icon.figma.md`'s nested component key (`2056:8249`, the Icon wrapper `COMPONENT_SET`) is reused
  directly — never redrawn.
