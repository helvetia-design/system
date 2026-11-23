# close → Figma mapping

> **Status: done (19.11.2026)** — Phases 1–8 built and confirmed by the user — rebuild of the Close component in the DS Core Components
> file, tokens from the DS Foundation library. Decisions from earlier runs:
> `.claude/skills/ds-code-to-figma/rebuild-decisions.md` → "Close". Only the native `<button>` path
> is modeled. The tooltip was added 19.11.2026 (`show tooltip`, see Notes).

```yaml
sets: # default set first
  - name: Close
    figmaComponentKey: 3a6f692ed8c74f3916fda1b6fa72d2c357b274db
    figmaMasterNodeId: '6387:1415'
  - name: CloseInverted
    figmaComponentKey: 19a7c416a58c91aa890a49d1727a57f655e42b58
    figmaMasterNodeId: '6387:1478'
figmaPage: Core / Actions
figmaDocFrameNodeId: '6385:986'

anatomy: # the only @part; matches part="button" in both render() branches (close.tsx:116, :138)
  - letter: A
    part: button
    description: 'The close button element.'
# The X is a CSS mask on `::after` (close.mixin.scss:65), not a part.

props:
  - name: size
    type: enum
    options: [md]
    default: '(unset → Close/Size/Base)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, md]
  - name: inverted
    type: boolean
    default: false
    figmaPropertyType: top-level-split (rule 2) # → CloseInverted
  - name: disabled
    figmaPropertyType: component state (blocked)
  - name: '(ds-tooltip)' # always rendered by the native path (close.tsx:144), shown on hover / focus; built on hover only (focus is ignored)
    figmaProperty: show tooltip
    figmaPropertyType: boolean # default false
    shownWhen: 'state=hover, disabled=false'
  - name: '[excluded]'
    figmaPropertyType: excluded
    props: [button, buttonColor, buttonSize]
    note: 'button, buttonColor, buttonSize — only the native <button> path is modeled (rebuild-decisions.md).'
  # Generated: the i18n label ("Close") is aria-label + tooltip text — fixed `Close` override on the Tooltip, no property.

states:
  figmaProperty: state
  options: [default, hover, active] # focus ignored (user decision 19.11.2026)
  sources:
    hover: ':hover (close.mixin.scss:89)'
    active: ':active (close.mixin.scss:93)'
componentStates:
  disabled:
    {
      figmaProperty: disabled,
      options: [false, true],
      interactive: false,
      source: 'every pseudo state is inside &:not(:disabled) (close.mixin.scss:85)',
    }

figmaCheck: # scripts/figma-check-set.mjs (Phase 4 step 0)
  conditionalLayers:
    - name: tooltip-anchor # build-mechanics.md → Tooltip anchor
      when: { state: [hover], disabled: ['false'] }
  allowedCombos: []

nested:
  - childTag: '(tooltip anchor)' # Figma-only helper, Core / Utilities (build-mechanics.md → Tooltip anchor); added 19.11.2026
    figmaComponentKey: 7acb7deab1ff4f7c89bc15ce980c38a098f2eae1 # TooltipAnchor set
    exposed: false # placement fixed at bottom — ds-close has no placement prop
    note: 'In every state=hover variant with disabled=false (2 + 2): `tooltip-anchor` instance, absolute, x/y 0, sized to the variant, constraints STRETCH both, placement=bottom. Visibility bound to `show tooltip`.'
  - childTag: ds-tooltip # inside the anchor
    childMappingFile: ../../overlays/tooltip/tooltip.figma.md
    figmaComponentKey: 153b91930d626839058d24ce00415275c0f74f04
    exposed: false # not reachable from Close (anchor not exposed); generated text, fixed `content` = Close
  # ds-button (button path) excluded — see props.

variations: # section re-added 19.11.2026 for show tooltip (cloned from Button's, same template Section)
  figmaSectionNodeId: '6408:1888'
  sets:
    - set: Close
      previewNodeId: null
      entries:
        - {
            caption: 'show tooltip · hover',
            props: { show tooltip: true, state: hover },
            snapshot: close-tooltip,
            nodeId: 'I6408:1888;2192:7515;2192:5066;6408:1891;2192:7499;6408:1967',
          } # entry centered so the card doesn't clip the tooltip

tokens: # all checked in the Foundation file (19.11.2026)
  - { cssVar: --ds-close-size-base, figmaVariable: 🧩 Component/Close/Size/Base, resolved: true } # 24
  - { cssVar: --ds-close-size-md, figmaVariable: 🧩 Component/Close/Size/MD, resolved: true } # 32
  - { cssVar: --ds-close-padding-base, figmaVariable: 🧩 Component/Close/Padding/Base, resolved: true, bind: false } # 10 — X = size − padding (14), not bindable
  - { cssVar: --ds-close-padding-md, figmaVariable: 🧩 Component/Close/Padding/MD, resolved: true, bind: false } # 14 — X = 18
  - { cssVar: --ds-close-radius, figmaVariable: 🧩 Component/Close/Radius, resolved: true } # 9999
  - {
      cssVar: --ds-close-primary-color-background-base,
      figmaVariable: 🧩 Component/Close/Primary/Color/Background/Base,
      resolved: true,
    } # transparent (also the inverted default)
  - {
      cssVar: --ds-close-primary-color-background-hover,
      figmaVariable: 🧩 Component/Close/Primary/Color/Background/Hover,
      resolved: true,
    } # navy 10%
  - {
      cssVar: --ds-close-primary-color-background-active,
      figmaVariable: 🧩 Component/Close/Primary/Color/Background/Active,
      resolved: true,
    } # navy 20%
  - {
      cssVar: --ds-close-primary-color-background-disabled,
      figmaVariable: 🧩 Component/Close/Primary/Color/Background/Disabled,
      resolved: true,
    } # grey
  - {
      cssVar: --ds-close-primary-color-icon-base,
      figmaVariable: 🧩 Component/Close/Primary/Color/Icon/Base,
      resolved: true,
    } # navy
  - {
      cssVar: --ds-close-primary-color-icon-disabled,
      figmaVariable: 🧩 Component/Close/Primary/Color/Icon/Disabled,
      resolved: true,
    }
  - {
      cssVar: --ds-close-inverted-color-background-hover,
      figmaVariable: 🧩 Component/Close/Inverted/Color/Background/Hover,
      resolved: true,
    } # white 30%
  - {
      cssVar: --ds-close-inverted-color-background-active,
      figmaVariable: 🧩 Component/Close/Inverted/Color/Background/Active,
      resolved: true,
    } # white 50%
  - {
      cssVar: --ds-close-inverted-color-background-disabled,
      figmaVariable: 🧩 Component/Close/Inverted/Color/Background/Disabled,
      resolved: true,
    }
  - {
      cssVar: --ds-close-inverted-color-icon-base,
      figmaVariable: 🧩 Component/Close/Inverted/Color/Icon/Base,
      resolved: true,
    } # white
  - {
      cssVar: --ds-close-inverted-color-icon-disabled,
      figmaVariable: 🧩 Component/Close/Inverted/Color/Icon/Disabled,
      resolved: true,
    }
  - { cssVar: --ds-tooltip-offset, figmaVariable: 🧩 Component/Tooltip/Offset, resolved: true } # 8 — bound inside TooltipAnchor
# No breakpoint mixins → no device: section.

completeness:
  - node: button (component root)
    width / height: Close/Size/Base | MD
    radius: Close/Radius
    fill: Close/<Primary|Inverted>/Color/Background/<Base|Hover|Active|Disabled> (inverted default = Primary/Background/Base)
  - node: x (vector, centered)
    width / height: literal 14 | 18 (= size − Close/Padding/*; user decision 19.11.2026)
    fill: Close/<Primary|Inverted>/Color/Icon/<Base|Disabled>
# No other gaps.

measurements: # confirmed by the user 19.11.2026, measured on the dev server
  drawnOption: base
  drawnState: hover # default background is transparent (rebuild-decisions.md)
  options: [base, md]
  # behavior: none (fixed size, no content)
  rows:
    - {
        property: Size,
        kind: size,
        group: fixed,
        show: drawn,
        instance: main,
        source: close.mixin.scss:49,
        values:
          { base: { px: 24, token: 🧩 Component/Close/Size/Base }, md: { px: 32, token: 🧩 Component/Close/Size/MD } },
      }
    - {
        property: X size,
        kind: size,
        group: fixed,
        show: drawn,
        instance: main,
        source: close.mixin.scss:68,
        values:
          {
            base: { px: 14, token: 'no token (Size/Base − Padding/Base)' },
            md: { px: 18, token: 'no token (Size/MD − Padding/MD)' },
          },
      }
    - {
        property: Radius,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: main,
        source: close.mixin.scss:47,
        values: { base: { px: full, token: 🧩 Component/Close/Radius } },
      }
    - {
        property: Browser padding,
        kind: spacing,
        group: derived,
        show: skip,
        reason: 'user-agent button padding (1 / 6) — no effect, the box size is fixed',
        values: { base: { px: '1 / 6' } },
      }
```

## Notes

- **X size (user decision 19.11.2026):** code draws the X at `size − padding` (14 / 18). Figma
  can't calculate that, and the per-side padding (5 / 7) isn't a token either, so the X frame is a
  literal 14 / 18. Code follow-up: a `Close/Icon/Size` token.
- **Tooltip (user decision 19.11.2026):** `show tooltip` (default off) shows the nested `Tooltip`
  ("Close") below the button, centered, 8px away, through a `TooltipAnchor` instance fixed at
  `placement=bottom` and not exposed — `ds-close` has no placement prop. The
  `close-tooltip` snapshot shows it shifted left: floating-ui's `shift` against the viewport
  edge, not a different placement.
- **Focus (user decision 19.11.2026):** ignored — no `focus` variant, no focus ring, no focus
  measurement. The 4 focus variants, their column and the measurements' focus instance were
  removed from Figma on 19.11.2026.
- **Button dependency:** none — the `button` path (a `ds-button`) is excluded, so `TODO.md`'s
  "Close → Button" dependency doesn't apply to this build.

## Proposed grouping (Phase 2)

| Code                 | Figma                                                  | Type                      |
| -------------------- | ------------------------------------------------------ | ------------------------- |
| `size`               | `size` · `base · md`                                   | variant (rows)            |
| `:hover` / `:active` | `state` · `default · hover · active`                   | variant (columns)         |
| `disabled`           | `disabled` · `false · true`, only with `state=default` | component state (blocked) |
| `inverted`           | `CloseInverted`                                        | top-level split (rule 2)  |

Case: **top-level split**, a 2-axis grid per set. No text properties (the i18n "Close" is
generated, `aria-label` + tooltip only). No variations (no `show` booleans).

```
Close                                 state          disabled
                default   hover    active    true
size   base     [cell]    [cell]   [cell]    [cell]
       md       [cell]    [cell]   [cell]    [cell]

CloseInverted   (same grid)
```

Count: (4 states + 1 disabled) × 2 sizes = 10 per set, **20** in total (≤ 500).
