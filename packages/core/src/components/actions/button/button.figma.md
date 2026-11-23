# button → Figma mapping

> **Status: done (19.11.2026)** — Phases 1–8 built and confirmed by the user — rebuild of the Button component in the DS Core
> Components file, tokens from the DS Foundation library. Decisions from earlier runs:
> `.claude/skills/ds-code-to-figma/rebuild-decisions.md` → "Button". Brand icons left out (no
> Helvetia brand-icon assets; `ds-brand-icon` takes raw SVG / URL only).

```yaml
sets: # default set first
  - name: Button
    figmaComponentKey: f728631ba607a4e4d0519f950152963a105f2f98
    figmaMasterNodeId: '6277:1671'
  - name: ButtonInverted # only the 5 colors whose inverted tokens differ
    figmaComponentKey: 2bcb3a4a546b3ba7cfe8a346a2c6c781491d9694
    figmaMasterNodeId: '6277:1672'
figmaPage: Core / Actions
figmaDocFrameNodeId: '6252:6'

anatomy: # letters follow the drawing, left to right (user decision 19.11.2026); every @part matches a part="…" attribute
  - letter: A
    part: spinner
    description: 'The loading spinner shown when `loading` is true.'
  - letter: B
    part: native
    description: 'The native `<button>` or `<a>` element.'
  - letter: C
    part: icon
    description: 'The leading icon wrapper (or the brand icon wrapper when `brandIcon` is set).'
  - letter: D
    part: label
    description: 'The text label wrapper (`<span>`).'
  - letter: E
    part: icon-right
    description: 'The trailing icon wrapper.'
# Two Anatomy instances (rebuild-decisions.md): `loading` (A spinner, B native) and default with both icons on (C, D, E).

props:
  - name: color
    type: enum
    options:
      [
        primary,
        secondary,
        tertiary,
        ghost,
        brand-purple,
        brand-red,
        brand-yellow,
        brand-green,
        info,
        success,
        warning,
        danger,
        link,
      ]
    default: primary
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions:
      [
        primary,
        secondary,
        tertiary,
        ghost,
        brand-purple,
        brand-red,
        brand-yellow,
        brand-green,
        info,
        success,
        warning,
        danger,
        link,
      ]
  - name: size
    type: enum
    options: [sm, lg]
    default: '(unset → Size/Base)'
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, lg]
  - name: inverted
    type: boolean
    figmaPropertyType: top-level-split (rule 2)
    note: 'ButtonInverted holds primary · secondary · tertiary · ghost · link; primary, brand and status colors share the Inverted tokens in code.'
  - name: label # default slot, text only → text property
    type: slot
    figmaProperty: label
    figmaPropertyType: text
    node: label
    default: Label # property name in sentence case (PHASE-2-PROPOSE.md → Naming); was `Button` until 20.11.2026
    showBoolean: show label # default true; off for square (instance override)
  - name: icon
    type: string
    figmaProperty: icon
    figmaPropertyType: instance swap # glyph library, default IconPlus; preferred = 79 glyphs
    showBoolean: show icon # default false
  - name: iconRight
    type: string
    figmaProperty: icon right
    figmaPropertyType: instance swap
    showBoolean: show icon right # default false
  - name: a11yTitle # rendered by the nested ds-tooltip on hover / focus (button.tsx:532); built on hover only (focus is ignored)
    type: string
    figmaProperty: show tooltip
    figmaPropertyType: boolean # default false; the text is the nested Tooltip's `content`, exposed through the anchor
    shownWhen: 'state=hover, disabled=false, loading=false' # the tooltip-anchor layer exists only there
  - name: tooltipPlacement
    type: enum
    options: [top, right, bottom, left]
    figmaProperty: placement # on the exposed TooltipAnchor instance, not a Button variant axis (an axis would push Button to 936 variants)
    figmaPropertyType: nested variant (exposed TooltipAnchor) # user decision 19.11.2026
    figmaOptions: [bottom, top, right, left] # code default first
  - name: disabled
    figmaPropertyType: component state (blocked) # disabled=true only with state=default
  - name: loading
    figmaPropertyType: component state (blocked) # loading=true only with state=default; label stays visible
  # Instance overrides, not variants (rebuild-decisions.md, approved 04.11.2026):
  - {
      name: square,
      figmaPropertyType: instance override,
      note: 'show label off, show icon on; padding-x and gap 0; min width / height = Size/*/MinHeight; icon size md (sm: sm)',
    }
  - {
      name: flat,
      figmaPropertyType: instance override,
      note: 'padding-x 0; min height → Button/Flat/MinHeight (28, token since 18.11.2026)',
    }
  - {
      name: shadow,
      figmaPropertyType: instance override,
      note: 'Alias/Shadow/Box/Base (ghost, link: Alias/Shadow/Text) — the Foundation shadow variables exist; not built into the sets',
    }
  - {
      name: iconTurn,
      figmaPropertyType: excluded,
      source: 'button.tsx:192 → ds-icon turn (button.tsx:509, :525)',
      note: "Rotates only plus (225°) and caret-up / caret-down (180°) (icon.host.scss:90). Figma refuses to rotate a glyph nested in an instance (relative-transform can't be overridden, tested 20.11.2026), so no instance override either (user decision 20.11.2026).",
    }
  - {
      name: wide,
      figmaPropertyType: excluded,
      source: button.tsx:152,
      note: 'width only — measurements.behavior width: fill (resize the instance)',
    }
  - name: '[excluded]'
    figmaPropertyType: excluded
    props:
      [
        brandIcon,
        brandSize,
        elementType,
        href,
        target,
        rel,
        download,
        name,
        value,
        noWrap,
        a11yControls,
        a11yCurrent,
        a11yLabel,
        a11yHaspopup,
      ]
    note: 'brandIcon, brandSize (no brand-icon build), elementType, href, target, rel, download, name, value, noWrap, a11yControls, a11yCurrent, a11yLabel, a11yHaspopup; @attachment ds-badge (attachments plan).'

states:
  figmaProperty: state
  options: [default, hover, active] # focus ignored (user decision 19.11.2026)
  sources:
    hover: ':hover / .is-hovered (button.style.scss:120)'
    active: ':active / .is-pressed (button.style.scss:129)'
  reactions: # PHASE-3-BUILD.md → Interactions; per row with disabled=false, loading=false (Button 39 rows, ButtonInverted 15)
    - { from: default, trigger: ON_HOVER, to: hover }
    - { from: default, trigger: ON_PRESS, to: active }
    - { from: hover, trigger: ON_PRESS, to: active }
  # CSS transition 0.2s (button.style.scss:80) not copied into Figma
componentStates:
  disabled:
    {
      figmaProperty: disabled,
      options: [false, true],
      interactive: false,
      source: 'button-disabled(): pointer-events none on every state (button.style.scss:541)',
    }
  loading:
    {
      figmaProperty: loading,
      options: [false, true],
      interactive: false,
      source: ':host(.is-loading) #button → button-disabled() (button.style.scss:580)',
    }

figmaCheck: # scripts/figma-check-set.mjs (Phase 4 step 0)
  conditionalLayers:
    - name: tooltip-anchor # build-mechanics.md → Tooltip anchor
      when: { state: [hover], disabled: ['false'], loading: ['false'] }
  allowedCombos: []

nested:
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    iconSlot:
      codeProp: icon / iconRight # → INSTANCE_SWAP `icon`, `icon right`; glyphs nested directly
      acceptsBrandIcon: true # brandIcon fills part="icon" in code (button.tsx:494); left out until the Brand Icon run (user decision 20.11.2026)
      size: follows button size — base 16 (Icon/Size/Base), sm 14 (Icon/Size/SM), lg 32 (Icon/Size/LG); padding per Icon/Padding/*
      colorSource:
        default: 'Button/Color/<color>/Base/Text (--icon-color)'
        hover: 'Button/Color/<color>/Hover/Text'
        active: 'Button/Color/<color>/Active/Text'
        disabled: 'Button/Color/Disabled/Base/Text'
  - childTag: ds-spinner
    childMappingFile: ../../indicators/spinner/spinner.figma.md
    figmaComponentKey: 8c6b86b1d794f09808f16b3759bf486e6a1b83b8
    note: 'Instance of Spinner (logo); inner width / height overridden to Button/Spinner/Size (24); logo fill → Button/Color/Disabled/Base/Text (loading uses the disabled colors). Shown only on loading=true.'
  - childTag: '(tooltip anchor)' # Figma-only helper, Core / Utilities (build-mechanics.md → Tooltip anchor); added 19.11.2026
    figmaComponentKey: 7acb7deab1ff4f7c89bc15ce980c38a098f2eae1 # TooltipAnchor set, `placement` bottom · top · right · left
    exposed: true # `placement` (= tooltipPlacement) shows on the Button instance
    note: 'In every state=hover variant with disabled=false, loading=false (39 + 15): `tooltip-anchor` instance, absolute, x/y 0, sized to the variant, constraints STRETCH both, placement=bottom. Visibility bound to `show tooltip`.'
  - childTag: ds-tooltip # inside the anchor
    childMappingFile: ../../overlays/tooltip/tooltip.figma.md
    figmaComponentKey: 153b91930d626839058d24ce00415275c0f74f04
    exposed: true # exposed in TooltipAnchor — its `content` (= a11yTitle) shows on the Button instance

variations: # filled in by Phase 3
  figmaSectionNodeId: '6252:11'
  sets:
    - set: Button
      previewNodeId: null
      entries:
        - { caption: 'show icon', props: { show icon: true }, snapshot: button-icon, nodeId: null }
        - { caption: 'show icon right', props: { show icon right: true }, snapshot: button-icon, nodeId: null }
        - { caption: 'all on', props: { show icon: true, show icon right: true }, snapshot: button-icon, nodeId: null }
        - {
            caption: 'show tooltip · hover',
            props: { show tooltip: true, state: hover },
            snapshot: button-tooltip,
            nodeId: 'I6252:11;2192:7515;2192:5066;6252:164;2192:7499;6408:1876',
          } # state is the dependent axis: the tooltip exists on hover only

tokens: # names checked in the Foundation file (18.11.2026); 320 Button variables
  # per color × state: 🧩 Component/Button/Color/<Color>/<Base|Hover|Active>/{Text, Background, Border/BorderColor, Border/BorderWidth, Border/BorderStyle}
  # colors: Primary, Secondary, Tertiary, Ghost, BrandPurple, BrandRed, BrandYellow, BrandGreen, Info, Success, Warning, Danger, Link,
  #         Disabled (Base only, + SpinnerBackground), Inverted, InvertedSecondary, InvertedTertiary, InvertedGhost, InvertedLink
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/MinHeight', resolved: true } # 48 / 32 / 56
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/MinWidth', resolved: true } # 48 / 32 / 56 (square)
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/PaddingX', resolved: true } # 24 / 12 / 24
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/Gap', resolved: true } # 8
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/Radius', resolved: true } # 4
  - { figmaVariable: '🧩 Component/Button/Size/<Base|SM|LG>/Label/Typo/*', resolved: true } # Headline, 16 / 14 / 18 (→ Device/Text/Size/*/Device), Bold, 130%; family literal `Baloise Create Headline` (TODO.md), line height / letter spacing / decoration literal
  - { figmaVariable: '🧩 Component/Button/Spinner/Size', resolved: true } # 24
  - { figmaVariable: '🧩 Component/Button/Flat/MinHeight', resolved: true } # 28
  - { cssVar: --ds-tooltip-offset, figmaVariable: '🧩 Component/Tooltip/Offset', resolved: true } # 8 — bound inside TooltipAnchor (wrapper padding toward the trigger)
  - { figmaVariable: '🧩 Component/Button/Link/Label/TextDecoration', resolved: true, bind: false } # underline, literal
  - { figmaVariable: '🧩 Component/Button/Link/UnderlineOffset', resolved: true, bind: false } # Figma has no bindable underline offset (setBoundVariable → "Unknown field", tested 20.11.2026) — literal textDecorationOffset on every color=link label; was AUTO (missing) until 20.11.2026
  - { figmaVariable: '🧩 Component/Button/Disabled/Label/TextDecoration', resolved: true, bind: false }
# No breakpoint mixins in button.style.scss → no device: section (brand-icon padding left out).

measurements: # confirmed by the user 18.11.2026, measured on the dev server (fresh build)
  drawnOption: base
  drawnColor: secondary
  drawnColorReason: "primary and the status colors draw the border in the fill color — the border and the padding inside it can't be seen (rebuild-decisions.md)"
  options: [base, sm, lg]
  behavior:
    width: hug # wide: fill
    overflow: wrap # no-wrap: truncate
  rows:
    - {
        property: Min height,
        kind: size,
        group: limit,
        show: drawn,
        instance: main,
        source: button.style.scss:90,
        values:
          {
            base: { px: 48, token: 🧩 Component/Button/Size/Base/MinHeight },
            sm: { px: 32, token: 🧩 Component/Button/Size/SM/MinHeight },
            lg: { px: 56, token: 🧩 Component/Button/Size/LG/MinHeight },
          },
      }
    - {
        property: Icon size,
        kind: size,
        group: fixed,
        show: drawn,
        instance: main,
        source: 'button.tsx:503 (size={size})',
        values:
          {
            base: { px: 16, token: 🧩 Component/Icon/Size/Base },
            sm: { px: 14, token: 🧩 Component/Icon/Size/SM },
            lg: { px: 32, token: 🧩 Component/Icon/Size/LG },
          },
      }
    - {
        property: Spinner size,
        kind: size,
        group: fixed,
        show: drawn,
        instance: loading,
        source: button.style.scss:103,
        values: { base: { px: 24, token: 🧩 Component/Button/Spinner/Size } },
      }
    - {
        property: Padding X,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: main,
        source: button.style.scss:92,
        values:
          {
            base: { px: 24, token: 🧩 Component/Button/Size/Base/PaddingX },
            sm: { px: 12, token: 🧩 Component/Button/Size/SM/PaddingX },
            lg: { px: 24, token: 🧩 Component/Button/Size/LG/PaddingX },
          },
      }
    - {
        property: Gap,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: main,
        source: button.style.scss:91,
        values: { base: { px: 8, token: 🧩 Component/Button/Size/Base/Gap } },
      }
    - {
        property: Border width,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: main,
        source: button.style.scss:96,
        values: { base: { px: 2, token: 🧩 Component/Button/Color/Secondary/Base/Border/BorderWidth } },
      }
    - {
        property: Radius,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: main,
        source: button.style.scss:86,
        values: { base: { px: 4, token: 🧩 Component/Button/Size/Base/Radius } },
      }
    - {
        property: Text (label),
        kind: type,
        group: typography,
        show: drawn,
        instance: main,
        source: button.style.scss:84,
        values:
          {
            base:
              {
                px: 16,
                weight: 700,
                lineHeight: 1.3,
                family: BaloiseCreateHeadline,
                token: 🧩 Component/Button/Size/Base/Label/Typo,
              },
            sm: { px: 14, token: 🧩 Component/Button/Size/SM/Label/Typo },
            lg: { px: 18, token: 🧩 Component/Button/Size/LG/Label/Typo },
          },
      }
    - {
        property: Min width,
        kind: size,
        group: limit,
        show: skip,
        reason: 'never binds — an empty base button is already 104px wide (border + padding 52 > 48)',
        values: { base: { px: 48 } },
      }
    - {
        property: Height,
        kind: size,
        group: derived,
        show: skip,
        reason: 'min height covers it',
        values: { base: { px: 48 } },
      }
    - {
        property: Flat min height,
        kind: size,
        group: limit,
        show: skip,
        reason: 'flat is an instance override, not a variant (user decision 18.11.2026)',
        values: { base: { px: 28, token: 🧩 Component/Button/Flat/MinHeight } },
      }
```

## Notes

- **Code follow-up (user decision 18.11.2026):** every `<button>` gets 1px `padding-block` from the
  browser default (only `padding-inline` is set; `<a>` gets 0). Not built in Figma; the 48px
  height comes from min height either way.
- **Spinner size (user decision 18.11.2026):** the nested Spinner instance is scaled to 24px
  (`rescale`) — Figma ignored both a `Button/Spinner/Size` binding and a resize on the instance's
  `inner` layer. Matches the token value, not linked to it.
- **Focus (user decision 19.11.2026):** ignored — no `focus` variant, no focus ring, no focus
  measurement. The 54 focus variants, their column and the measurements' focus instance were
  removed from Figma on 19.11.2026.
- **Loading:** the label stays visible next to the spinner; colors are the disabled ones.
- **Dev build fix (18.11.2026):** the merge of `main` on 17.11.2026 duplicated
  `Tooltip.resolveOffset()`, so the dev server served a stale build; removed — `tooltip.tsx` matches
  `main` again.
- **Tooltip (user decision 19.11.2026):** `show tooltip` (default off, so the set grid stays
  clean) shows a `TooltipAnchor` instance over the button; its exposed `placement` puts the
  `Tooltip` on any side, centered, 8px away (`Tooltip/Offset` on the anchor's wrapper padding —
  Figma can't bind an absolute child's x / y). The anchor is absolute, so the button's size and
  layout never change; the tooltip overflows the button's bounds (a clipping parent cuts it off).
  Floating-ui's `flip` / `shift` near the viewport edge isn't modeled. "all on" leaves it out (tooltip only on
  hover).
  The Variations entries row wraps (`layoutWrap`, `FILL`), and the tooltip entry's gap is 53px so
  the caption sits below the tooltip.
- **Review 20.11.2026** (blind rebuild of this mapping, diffed against it): label default `Label`,
  hover / press reactions, link underline offset, `wide`, `iconTurn` and `acceptsBrandIcon`
  corrected above.
- **Follow-up — ButtonGroup:** `ds-button-group` (`button-group/button-group.tsx`) is a wrapping
  sub-component of this family (`conventions/families.md` §1) and has no Figma set yet. Build it
  as its own `ButtonGroup` set (native slot of Button instances) in a separate run.
- **Code follow-up — link underline:** code renders the link label without underline: the
  `--mod-` value is set on `#button`, but the `--_` variable is resolved on `:host`. Figma keeps
  the underline (the token's intent).
- **Code follow-ups (review 20.11.2026):** the `loading` JSDoc says the label hides, but it stays;
  `inverted` on the nested icon has no effect; dead `is-circle` spinner overrides; padding / gap
  `0` are literals, not tokens.
