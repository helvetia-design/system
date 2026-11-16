# input → Figma mapping

> **Status: All phases complete and confirmed by the user in Figma.** 60-variant `Input` component
> set live on `Core / Forms`, with Copy me, Anatomy and Specs ("Measurements" in this template
> version) all built and approved. `input.figma-validation.md` has the full Phase 4 check log and
> Phase 5 repair.
>
> **11.11.2026 — text properties + Variations, built on Figma branch `TMW8IfOY7LbN3IXvu3cI15` and
> merged into main the same day.** The set now has 120 variants (new
> `filled` axis), text properties `label`, `value`, `placeholder`, `description`, `invalid text`,
> booleans `show label` (true) and `show description` (false), and a Variations section. The
> props below describe that build; `state` still holds `disabled` / `loading` (the
> component-state migration is a separate TODO). The 60-variant build is replaced.

```yaml
sets: # filled in by Phase 3 — one entry per component set (top-level split), default set first.
  - name: Input
    figmaComponentKey: 6b1edcd31f2b6eb92352a7a724e3695ef03b04b6
    figmaMasterNodeId: '4283:405'
figmaPage: Core / Forms
figmaDocFrameNodeId: '4276:53' # "Input Documentation" frame on Core / Forms

anatomy:
  - letter: A
    part: inner
    description: "The field's outer wrapper element."
  - letter: B
    part: label
    description: "The field's label element."
  - letter: C
    part: control
    description: 'The wrapper around the native input and its start/end slots.'
  - letter: D
    part: input
    description: 'The native HTML input element.'
  - letter: E
    part: description
    description: 'The description or invalid-text message element below the control.'
# Note: A/B/C/E come from the shared `Field` helper (field.util.tsx) that ds-input composes into
# its own shadow DOM — real parts of ds-input's rendered tree, not a separate component instance.
# The component's own class JSDoc previously declared orphaned `@part prefix`/`@part suffix` tags
# (no matching part="..." anywhere in the render tree) and omitted inner/label/control/description
# (which do render). Fixed directly in input.tsx's JSDoc as part of this phase (user-approved).
# `<slot name="start">`/`<slot name="end">` in field.util.tsx render real content (see props: suffix
# usage below, and the visual.html "Suffix"/"Slots" sections). Previously flagged as carrying no
# `part="..."` attribute and not declared as `@slot` tags on ds-input — fixed in input.tsx (added
# `@slot start`/`@slot end` and `@part start`/`@part end` JSDoc) and field.util.tsx (added
# `part="start"`/`part="end"` to the slot elements). Not added to the `anatomy:` table above since
# that drives the Figma anatomy diagram, which is out of this fix's scope.

props:
  - name: value
    type: string | null
    default: null
    figmaProperty: value
    figmaPropertyType: text # node `value` in `control`, default `Value`
    shownWhen: filled=true # one part, two props, different token → own node + `filled` axis (see placeholder)
  - name: name
    type: string
    default: '(generated id)'
    figmaProperty: null
    figmaPropertyType: none # non-visual — form submission key only
  - name: label
    type: string
    default: ''
    figmaProperty: 'label (TEXT, default Label) + show label (BOOLEAN, default true)'
    figmaPropertyType: text
    node: text # inside the `label` wrapper frame (part `label`); guarded by `props.label &&` → `show label`
    note: 'show label defaults to true, not the code default (label=""): every real input has a label — confirmed 11.11.2026. The " (optional)" span is generated i18n text: own node `optional` in the same wrapper, no property, only on required=false.'
  - name: description
    type: string
    default: ''
    figmaProperty: 'description (TEXT, default Description) + show description (BOOLEAN, default false)'
    figmaPropertyType: text
    node: description
    shownWhen: color != invalid # color=invalid shows `invalid text` instead, always (no boolean)
  - name: color
    type: enum
    options: [primary, danger, success, warning]
    default: primary
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [primary, danger, success, warning] # `invalid` moved out into its own component state 11.11.2026
  - name: loading
    type: boolean
    default: false
    figmaProperty: loading
    figmaPropertyType: 'variant false/true (component state, interactive — see componentStates)'
    figmaOptions: ['false', 'true']
  - name: invalid
    type: boolean
    default: false
    figmaProperty: invalid
    figmaPropertyType: 'variant false/true (component state, interactive — see componentStates); was the 5th `color` option until 11.11.2026'
  - name: invalidText
    type: string
    default: ''
    figmaProperty: invalid text
    figmaPropertyType: text # node `invalid text` in the `description` frame (with the alert icon), default `Invalid text`
    shownWhen: color=invalid # always visible there: color=invalid stands for invalid + invalidText set (confirmed 11.11.2026)
  - name: type
    type: enum
    options:
      [
        color,
        date,
        datetime-local,
        email,
        file,
        image,
        month,
        number,
        password,
        range,
        search,
        tel,
        text,
        time,
        url,
        week,
      ]
    default: text
    figmaProperty: null
    figmaPropertyType: none # non-visual in Figma — native browser-rendered sub-widgets (date
    # picker, color swatch, range slider, file picker button) that a static design tool can't
    # replicate; always represented as a plain text input
  - name: accept
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: none # non-visual — only relevant to type="file"
  - name: autocapitalize
    type: string
    default: 'off'
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: autocomplete
    type: enum
    options: ['(89 values, see input.interfaces.ts INPUT_AUTOCOMPLETES)']
    default: 'off'
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: autocorrect
    type: enum
    options: [on, off]
    default: 'off'
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: autofocus
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: none # non-visual — page-load browser focus behavior
  - name: debounce
    type: number
    default: 0
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: placeholder
    type: string
    default: ''
    figmaProperty: placeholder
    figmaPropertyType: text # node `placeholder` in `control`, default `Placeholder`, fill
    # Form/Default/Control/Placeholder/Color (137:1513; disabled 137:1605)
    shownWhen: filled=false
  - name: filled # synthetic variant axis for value vs placeholder (text-properties plan, decision 6)
    type: derived (value set)
    default: 'false'
    figmaProperty: filled
    figmaPropertyType: variant
    figmaOptions: ['false', 'true'] # rows, outermost (ties with required on 2 options; value is declared first)
  - name: max
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: maxLength
    type: number
    default: undefined
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: min
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: minLength
    type: number
    default: undefined
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: multiple
    type: boolean
    default: undefined
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: pattern
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: allowedKeyPress
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: required
    type: boolean
    default: true
    figmaProperty: required
    figmaPropertyType: variant # when false, Field appends an "(optional)" i18n string after the label
    figmaOptions: ['true', 'false']
  - name: spellcheck
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: disabled
    type: boolean
    default: false
    figmaProperty: disabled
    figmaPropertyType: 'variant false/true (component state, blocked — see componentStates)'
    figmaOptions: ['false', 'true']
  - name: readonly
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: none # non-visual — no distinct `:host([readonly])` styling in host.scss
  - name: suffix
    type: string
    default: ''
    figmaProperty: null
    figmaPropertyType: none # non-visual as a separate node — appended into the `input` part's own
    # displayed text (`${value} ${suffix}`) after blur, not a separate part (consistent with the
    # @part prefix/suffix tags having no real DOM counterpart, fixed above)
  - name: inputmode
    type: enum
    options: [none, text, tel, url, email, numeric, decimal, search]
    default: undefined
    figmaProperty: null
    figmaPropertyType: none # non-visual
  - name: mask
    type: enum
    options:
      [
        vehicle-registration-number,
        contract-number,
        basic-contract-number,
        claim-number,
        offer-number,
        be-enterprise-number,
        be-iban,
      ]
    default: undefined
    figmaProperty: null
    figmaPropertyType: none # non-visual — input-formatting logic only
  - name: autoInvalidOff
    type: boolean
    default: false
    figmaProperty: null
    figmaPropertyType: none # non-visual — Angular integration behavior only

states:
  figmaProperty: state
  options: [default, hover, focus, active] # interaction states only (migrated 11.11.2026)
  sources:
    hover: ':hover, .is-hovered (form.mixin.scss container())'
    active: ':active, .is-pressed (form.mixin.scss container())'
    focus: ':focus-within, .is-focused (form.mixin.scss container())'
  interactions: 'per row and group (normal, loading=true, invalid=true): default → while hovering → hover; default / hover → while pressing → active; instant. 144 reactions. None on disabled=true.'
componentStates: # 208 variants = 16 rows (filled × required × color) × 13 columns: state 4 · loading 4 · invalid 4 · disabled 1
  loading:
    {
      figmaProperty: loading,
      options: [false, true],
      interactive: true,
      source: 'loading prop only adds the ds-spinner in `control` (field.util.tsx); no hover/focus gating',
    }
  invalid:
    {
      figmaProperty: invalid,
      options: [false, true],
      interactive: true,
      source: 'invalid prop → .is-danger (input.host.scss:76–80): border stays danger on hover/active, hover background still applies (form.mixin.scss:67–75)',
    }
  disabled:
    {
      figmaProperty: disabled,
      options: [false, true],
      interactive: false,
      source: 'disabled prop → :host(.is-disabled) pointer-events: none (input.host.scss:106–111)',
    }
  combinations: none # two component states true at once are not built

variations: # only show booleans that default to false; show label defaults to true → no entry
  figmaSectionNodeId: '6013:685'
  sets:
    - set: Input
      previewNodeId: 'I6013:685;2192:7515;2192:5066;6013:688'
      entries:
        - {
            caption: 'show description',
            props: { show description: true },
            snapshot: input-basic,
            nodeId: 'I6013:685;2192:7515;2192:5066;6013:688;2192:7499;6013:726',
          } # "Label 2" case: placeholder + description
nested:
  - childTag: ds-spinner
    childMappingFile: ../../indicators/spinner/spinner.figma.md
    usage: 'shown in `control` in place of the end slot when loading=true (field.util.tsx)'
    fixedProps: { variation: circle, size: sm, color: 'primary (or inverted when disabled)' }
    figmaComponentKey:
      primary: 934b454440ea10dbf007b22f710e8aac8f0ce0a5 # spinner.figma.md figmaSets.circlePrimary (SpinnerCircle)
      inverted: 21fb19ac67e933b48d9f780f17d0dabcb689d647 # spinner.figma.md figmaSets.circleInverted (SpinnerCircleInverted)
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    usage: 'shown in `description` before the invalid-text message, only when invalid && invalidText (field.util.tsx)'
    fixedProps: { name: alert } # hardcoded in field.util.tsx — a fixed icon (conventions/content-selection-and-mitigations.md → "Fixed icons"), no INSTANCE_SWAP
    fixedIcon: # since 11.11.2026: the `alert` glyph (2053:7) nested directly as `icon`, replacing the Icon wrapper (size=sm)
      glyph: alert
      size: 'base, 16px (measured on the dev server: host 16 × 16, drawn glyph 14 × 14) — width/height bound to 🧩 Component/Icon/Size/Base (137:1457); padding 1px literal, like Button (Icon/Padding/* not in Figma yet)'
      colorSource:
        {
          default: '🧩 Component/Form/Danger/Description/Color (137:1590)',
          disabled: '🧩 Component/Form/Disabled/Description/Color (137:1610)',
        }
      shownWhen: color=invalid # 24 variants

tokens:
  - cssVar: --ds-form-container-radius
    figmaVariable: 🧩 Component/Form/Container/Radius
    figmaVariableId: VariableID:137:1498
    resolved: true
  - cssVar: --ds-form-default-container-border
    figmaVariable: 🧩 Component/Form/Default/Container/Border
    figmaVariableId: { color: VariableID:137:1499, width: VariableID:137:1500, style: VariableID:137:1501 }
    resolved: true
  - cssVar: --ds-form-default-container-background
    figmaVariable: 🧩 Component/Form/Default/Container/Background
    figmaVariableId: VariableID:137:1502
    resolved: true
  - cssVar: --ds-form-hover-container-background
    figmaVariable: 🧩 Component/Form/Hover/Container/Background
    figmaVariableId: VariableID:137:1522
    resolved: true
  - cssVar: --ds-form-active-container-background
    figmaVariable: 🧩 Component/Form/Active/Container/Background
    figmaVariableId: VariableID:137:1526
    resolved: true
  - cssVar: --ds-form-focus-container-background
    figmaVariable: 🧩 Component/Form/Focus/Container/Background
    figmaVariableId: VariableID:137:1530
    resolved: true
  - cssVar: --ds-form-hover-container-border
    figmaVariable: 🧩 Component/Form/Hover/Container/Border
    figmaVariableId: { color: VariableID:137:1519, width: VariableID:137:1520, style: VariableID:137:1521 }
    resolved: true
  - cssVar: --ds-form-active-container-border
    figmaVariable: 🧩 Component/Form/Active/Container/Border
    figmaVariableId: { color: VariableID:137:1523, width: VariableID:137:1524, style: VariableID:137:1525 }
    resolved: true
  - cssVar: --ds-form-focus-container-border
    figmaVariable: 🧩 Component/Form/Focus/Container/Border
    figmaVariableId: { color: VariableID:137:1527, width: VariableID:137:1528, style: VariableID:137:1529 }
    resolved: true
  - cssVar: --ds-form-default-label-color
    figmaVariable: 🧩 Component/Form/Default/Label/Color
    figmaVariableId: VariableID:137:1507
    resolved: true
  - cssVar: --ds-form-default-label-typo
    figmaVariable: 🧩 Component/Form/Default/Label/Typo
    figmaVariableId:
      {
        fontFamily: VariableID:2826:10061,
        fontSize: VariableID:2826:10062,
        fontWeight: VariableID:2826:10063,
        lineHeight: VariableID:2826:10064,
        letterSpacing: VariableID:2826:10065,
        textDecoration: VariableID:2826:10066,
        textTransform: VariableID:2826:10067,
      }
    resolved: true
  - cssVar: --ds-form-default-description-color
    figmaVariable: 🧩 Component/Form/Default/Description/Color
    figmaVariableId: VariableID:137:1518
    resolved: true
  - cssVar: --ds-form-default-description-typo
    figmaVariable: 🧩 Component/Form/Default/Description/Typo
    figmaVariableId:
      {
        fontFamily: VariableID:2826:10075,
        fontSize: VariableID:2826:10076,
        fontWeight: VariableID:2826:10077,
        lineHeight: VariableID:2826:10078,
        letterSpacing: VariableID:2826:10079,
        textDecoration: VariableID:2826:10080,
        textTransform: VariableID:2826:10081,
      }
    resolved: true
  - cssVar: --ds-form-default-control-typo
    figmaVariable: 🧩 Component/Form/Default/Control/Typo
    figmaVariableId:
      {
        fontFamily: VariableID:2826:10068,
        fontSize: VariableID:2826:10069,
        fontWeight: VariableID:2826:10070,
        lineHeight: VariableID:2826:10071,
        letterSpacing: VariableID:2826:10072,
        textDecoration: VariableID:2826:10073,
        textTransform: VariableID:2826:10074,
      }
    resolved: true
  - cssVar: --ds-form-default-control-value-color
    figmaVariable: 🧩 Component/Form/Default/Control/Value/Color
    figmaVariableId: VariableID:137:1512
    resolved: true
  - cssVar: --ds-form-default-control-placeholder-color
    figmaVariable: 🧩 Component/Form/Default/Control/Placeholder/Color
    figmaVariableId: VariableID:137:1513
    resolved: true
  - cssVar: --ds-form-danger-container-border
    figmaVariable: 🧩 Component/Form/Danger/Container/Border
    figmaVariableId: { color: VariableID:137:1571, width: VariableID:137:1572, style: VariableID:137:1573 }
    resolved: true
  - cssVar: --ds-form-danger-description-color
    figmaVariable: 🧩 Component/Form/Danger/Description/Color
    figmaVariableId: VariableID:137:1590
    resolved: true
  - cssVar: --ds-form-success-container-border
    figmaVariable: 🧩 Component/Form/Success/Container/Border
    figmaVariableId: { color: VariableID:137:1531, width: VariableID:137:1532, style: VariableID:137:1533 }
    resolved: true
  - cssVar: --ds-form-success-description-color
    figmaVariable: 🧩 Component/Form/Success/Description/Color
    figmaVariableId: VariableID:137:1550
    resolved: true
  - cssVar: --ds-form-warning-container-border
    figmaVariable: 🧩 Component/Form/Warning/Container/Border
    figmaVariableId: { color: VariableID:137:1551, width: VariableID:137:1552, style: VariableID:137:1553 }
    resolved: true
  - cssVar: --ds-form-warning-description-color
    figmaVariable: 🧩 Component/Form/Warning/Description/Color
    figmaVariableId: VariableID:137:1570
    resolved: true
  - cssVar: --ds-form-disabled-container-background
    figmaVariable: 🧩 Component/Form/Disabled/Container/Background
    figmaVariableId: VariableID:137:1594
    resolved: true
  - cssVar: --ds-form-disabled-container-border
    figmaVariable: 🧩 Component/Form/Disabled/Container/Border
    figmaVariableId: { color: VariableID:137:1591, width: VariableID:137:1592, style: VariableID:137:1593 }
    resolved: true
  - cssVar: --ds-form-disabled-label-color
    figmaVariable: 🧩 Component/Form/Disabled/Label/Color
    figmaVariableId: VariableID:137:1599
    resolved: true
  - cssVar: --ds-form-disabled-description-color
    figmaVariable: 🧩 Component/Form/Disabled/Description/Color
    figmaVariableId: VariableID:137:1610
    resolved: true
  - cssVar: --ds-form-disabled-control-value-color
    figmaVariable: 🧩 Component/Form/Disabled/Control/Value/Color
    figmaVariableId: VariableID:137:1604
    resolved: true
  - cssVar: --ds-form-disabled-control-placeholder-color
    figmaVariable: 🧩 Component/Form/Disabled/Control/Placeholder/Color
    figmaVariableId: VariableID:137:1605
    resolved: true
  # The following three are hardcoded literals in form.mixin.scss with NO --ds-* binding at all —
  # not drift from an existing token, there simply is none. Resolved with the user (see notes below).
  - cssVar: null # form.mixin.scss:61 `min-height: 3rem` (#container)
    figmaVariable: 🧩 Component/Button/Size/Base/MinHeight
    figmaVariableId: VariableID:137:1264
    resolved: true
    resolution: 'Value match only (48px) — user-approved reuse of the Button token; no Form/Control
      MinHeight token exists yet. Flag as a code-side gap (missing dedicated Form token), not fixed here.'
  - cssVar: null # form.mixin.scss:63 `padding-inline: 0.5rem` (#container)
    figmaVariable: 🔗 Alias/↔️ Space/Padding/XS
    figmaVariableId: VariableID:137:269
    resolved: true
    resolution: 'Value match (8px) — bound per PHASE-1-ANALYZE.md step 5 (match found, no need to ask).'
  - cssVar: null # form.mixin.scss:64 `gap: 0.25rem` (#container) and form.mixin.scss:16 `form-field-gap` local var (:host)
    figmaVariable: 🔗 Alias/↔️ Space/Gap/2XS
    figmaVariableId: VariableID:137:261
    resolved: true
    resolution: 'Value match (4px) — bound per PHASE-1-ANALYZE.md step 5 (match found, no need to ask).
      Covers both the control gap and the host field gap, same value, two call sites.'

specs:
  drawnOption: base # no Variants axis — single column, headed "Input"
  options: []
  behavior:
    width: fill # probed: 600px wrapper → 600px measured; #container width:100%, #input flex:1
    overflow: 'label/description: wrap (probed, no truncation styling); input value text: overflows
      via native internal scrolling (no text-overflow/white-space set — standard <input> behavior,
      not a gap)'
  rows:
    - property: Min height
      kind: size
      group: limit
      show: drawn
      instance: main
      source: form.mixin.scss:61
      values:
        base: { px: 48, token: 🧩 Component/Button/Size/Base/MinHeight }
    - property: Padding X
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: form.mixin.scss:63
      values:
        base: { px: 8, token: 🔗 Alias/↔️ Space/Padding/XS }
    - property: Gap (control)
      kind: spacing
      group: inner spacing
      show: table # downgraded from `drawn` during Phase 8 build: the default instance's `control`
      # has only the `input` text as a child (no icon/button slot content rendered), so there's no
      # second element to hatch a visible gap against on this instance. Still numbered and listed
      # in the Sizes table.
      instance: main
      source: form.mixin.scss:64
      values:
        base: { px: 4, token: 🔗 Alias/↔️ Space/Gap/2XS }
    - property: Gap (field)
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: form.mixin.scss:16
      values:
        base: { px: 4, token: 🔗 Alias/↔️ Space/Gap/2XS }
    - property: Border width
      kind: shape
      group: fixed
      show: drawn
      instance: main
      source: form.mixin.scss:59 (via --ds-form-default-container-border)
      values:
        base: { px: 2, token: 🧩 Component/Form/Default/Container/Border (width) }
    - property: Radius
      kind: shape
      group: fixed
      show: drawn
      instance: main
      source: form.mixin.scss:65 (via --ds-form-container-radius)
      values:
        base: { px: 4, token: 🧩 Component/Form/Container/Radius }
    - property: Type (label)
      kind: type
      group: typography
      show: drawn
      instance: main
      source: input.host.scss (form.vars-label())
      values:
        base: { px: 14, token: 🧩 Component/Form/Default/Label/Typo, weight: 700, lineHeight: 21 }
    - property: Type (control)
      kind: type
      group: typography
      show: drawn
      instance: main
      source: input.mixin.scss:27 (input.vars())
      values:
        base: { px: 16, token: 🧩 Component/Form/Default/Control/Typo, weight: 400, lineHeight: 24 }
    - property: Type (description)
      kind: type
      group: typography
      show: drawn
      instance: main
      source: input.host.scss (form.vars-description())
      values:
        base: { px: 12, token: 🧩 Component/Form/Default/Description/Typo, weight: 400, lineHeight: 18 }
    - property: Host min-width
      kind: size
      group: derived
      show: skip
      reason: 'measured 0px — undeclared, no min-width set anywhere'
      values:
        base: { px: 0 }
    - property: Margin
      kind: spacing
      group: outer margin
      show: skip
      reason: 'no margin set on :host or any part — nothing to report'
      values:
        base: { px: 0 }
    - property: Focus ring
      kind: shape
      group: fixed
      show: skip
      reason: 'focus state only changes container background/border color (same width as default);
        no outline/box-shadow geometry is added on focus, so there is nothing distinct to draw'
      values:
        base: { px: null }
```

## Phase 2 — Proposed variant grouping

**No top-level split.** Nothing triggers a split: `color`'s options re-skin the same layers (only
the container-border/description-color tokens change, plus one hardcoded content swap for the
`invalid` member), there's no `inverted` prop, and the variant count (below) is nowhere near 500.

**Revision (user-approved):** `invalid` is collapsed into `color` as a 5th option instead of its
own crossed axis — see "Collapse decision" below.

### Mapping table

| Prop / state                                                                                                                                                                                                                                                    | Mapping                                                                                                                                                       | Why                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color` + `invalid`                                                                                                                                                                                                                                             | One variant property `color`, options `[primary, danger, success, warning, invalid]`                                                                          | Collapsed per user decision — see "Collapse decision" below.                                                                                                                                                |
| `required`                                                                                                                                                                                                                                                      | Variant property `required` (boolean), options `[true, false]` (code default `true`)                                                                          | Static visual effect: hides/shows the fixed "(optional)" label suffix. Not a text override — the suffix content itself isn't user-settable.                                                                 |
| `loading`, `disabled`, `:hover`, `:focus`, `:active`                                                                                                                                                                                                            | Folded into one `state` variant property, options `[default, hover, focus, active, disabled, loading]`                                                        | Table's explicit rule: pseudo-class/state-ish props always collapse into a single `state` axis, never separate booleans.                                                                                    |
| `value`, `placeholder`                                                                                                                                                                                                                                          | Instance text override on the `input` part                                                                                                                    | Free-text, not a variant.                                                                                                                                                                                   |
| `label`                                                                                                                                                                                                                                                         | Instance text override on the `label` part                                                                                                                    | Free-text, guarded by `props.label &&` in `field.util.tsx` — needs a paired `show label` boolean (default `true`, since the visual.html default always sets a label) bound to the `label` part's `visible`. |
| `description`, `invalidText`                                                                                                                                                                                                                                    | Instance text override on the `description` part — `description`'s content on the 4 real-color members, `invalidText`'s content on the `color=invalid` member | Free-text; which string shows now follows directly from which `color` member is selected.                                                                                                                   |
| `type`, `accept`, `autocapitalize`, `autocomplete`, `autocorrect`, `autofocus`, `debounce`, `max`, `maxLength`, `min`, `minLength`, `multiple`, `pattern`, `allowedKeyPress`, `spellcheck`, `readonly`, `suffix`, `inputmode`, `mask`, `autoInvalidOff`, `name` | Excluded from the mapping                                                                                                                                     | No static visual effect in Figma (native browser behavior, non-visual, or folded into the `input` part's own text — see Phase 1 notes).                                                                     |

### Collapse decision

`invalid=true` always forces the danger visual in code regardless of `color`'s value (code's
`is-danger` OR-logic), so crossing them as independent axes produced redundant cells. Per your
decision, `invalid` is folded into `color` as a 5th, synthetic option (`invalid` isn't a real
`INPUT_COLORS` enum member — it's a Figma-only stand-in for "`invalid=true`, whichever `color` was
set underneath"). This deviates from the component's literal prop structure, so it's recorded here
explicitly rather than silently assumed:

- The `color=invalid` member's container border and description color use the same
  `Form/Danger/*` tokens as `color=danger` (identical to code's forced-danger behavior).
- The `color=invalid` member's `description` part shows the alert icon (`ds-icon name="alert"`,
  per Phase 1's `nested:`) and its text content defaults to the `invalidText` placeholder instead
  of `description`'s — this is now simply "what that member looks like," not a separate crossed
  boolean. The icon's visibility is hardcoded per-variant in Phase 3's build (visible only on this
  one `color` member), not a Figma component property.
- `disabled` (inside the `state` axis) still overrides every `color` member identically either
  way — that redundancy is unavoidable (state is a hard-rule column axis) and unaffected by this
  collapse.

### Variant count

Crossed axes: `color` (5, `invalid` collapsed in) × `required` (2) × `state` (6) = **60 ≤ 500** —
no mitigation needed.

### Grid sketch

Column axis is `state` (hard rule). Remaining axes nest on rows, outermost→innermost by ascending
option count: `required` (2) outermost, `color` (5) innermost.

```
                               default  hover   focus   active  disabled  loading
required=true   color=primary  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=danger   [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=success  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=warning  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=invalid  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
required=false   color=primary  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=danger   [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=success  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=warning  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
                 color=invalid  [ ]      [ ]     [ ]     [ ]     [ ]       [ ]
```

Default variant (top-left cell): `required=true, color=primary, state=default`.

## Notes

- **Anatomy fix applied to code**: `ds-input`'s class JSDoc previously declared `@part prefix`/
  `@part suffix` with no matching `part="..."` anywhere in the render tree, while the real parts
  rendered by the shared `Field` helper (`inner`/`label`/`control`/`description`) were undocumented.
  Fixed directly in `input.tsx` (user-approved) — see `anatomy:` above for the corrected letter list.
- **`suffix` prop**: appends into the `input` part's own displayed text after blur
  (`getFormattedValue()`), not a separate part — consistent with the prefix/suffix JSDoc tags
  having no real DOM counterpart.
- **`<slot name="start">`/`<slot name="end">`** in `field.util.tsx` render real content (see the
  "Suffix"/"Slots" sections of `test/input.visual.html`) but have no `part="..."` attribute and
  aren't declared as `@slot` tags on `ds-input` either. Out of this skill's `@part`-only
  cross-check scope — flagged here for awareness, not fixed.
- **`type` prop**: its 16 options mostly switch _native_ browser-rendered sub-widgets (date
  picker, color swatch, range slider, file picker button) that a static Figma component can't
  reproduce. Treated as non-visual; Phase 2 should decide whether any option needs a distinct
  Figma representation (likely none).
- **`color` vs. `invalid`**: `color="danger"` and `invalid=true` both toggle the same `.is-danger`
  CSS class — the two props produce an identical visual. How Phase 2 combines them into Figma
  variant axes (merge vs. keep separate with a documented precedence) is an open decision for that
  phase, not resolved here.
- **Hardcoded literals without token bindings** (`min-height: 3rem`, `padding-inline: 0.5rem`,
  `gap: 0.25rem` ×2) were resolved with the user during this phase — see `tokens:` entries with
  `cssVar: null` above for the decisions and rationale. The missing dedicated Form/Control
  `MinHeight` token is a code-side gap worth a follow-up, not fixed in this pass.
- Nested `ds-spinner` and `ds-icon` usages are both **fixed-value instances** driven by
  `loading`/`invalid` state, not user-configurable instance-swap slots — see `nested:` above.

## Phase 3 — Build notes

- **Default variant** (`color=primary, required=true, state=default`) built first and confirmed by
  the user in Figma before fan-out, per the node link `node-id=4278-167`.
- **Sample content**: `input` part shows the literal text "Text value" (user-approved — a filled
  look is more representative for documentation than placeholder-styled text); `label` shows
  "Label" (+" (optional)" appended in-place for `required=false`, since the code's `<span>` has no
  distinct styling of its own — matches real rendering exactly); `description` shows "This is a
  description text"; the `color=invalid` members show "Validation error message" in place of the
  regular description text (standing in for the `invalidText` prop).
- **Color/state token cascade** — implemented to mirror the real CSS cascade in
  `input.host.scss`/`form.mixin.scss`, not a simple per-axis lookup:
  - `state=disabled` always wins: background, border, label color, description color and value
    color all switch to the `Disabled/*` tokens regardless of `color`'s value.
  - Otherwise, `color !== primary` wins for **border + description color only** (same token
    regardless of `state`, matching `.is-danger`/`.is-success`/`.is-warning` reusing one border
    value across hover/focus/active) — background stays purely `state`-driven (`color` classes
    never touch it in code), and label/value color stay `Default` regardless of `color`.
  - `color=invalid` reuses the exact `danger` tokens, plus the alert icon + `Validation error
message` text.
- **`description` structure differs by member**: the already-approved default (and every
  non-`invalid` member) keeps `description` as a plain text node, matching Phase 1's confirmed
  anatomy. Only the 20 `color=invalid` members rebuild `description` as a small `HORIZONTAL`
  auto-layout frame (`icon` instance + text, `gap` bound to `Alias/Space/Gap/2XS`) so the alert
  icon has somewhere to sit — this matches the real DOM (`<span part="description">{icon}{text}</span>`)
  more closely than the plain-text default does. Flagging the structural inconsistency here rather
  than silently normalizing it, since the user already approved the plain-text default.
- **Nested instances**: `ds-spinner` cloned from the real `circlePrimary` set member (node
  `2869:366`, `labelPosition=right, size=sm`) — spinner is always `color=primary` for loading cells
  since `state=loading` and `state=disabled` are mutually exclusive options of the same axis (code's
  `disabled ? 'inverted' : 'primary'` branch never reaches `inverted` here). `ds-icon` cloned from
  the real `size=sm, color=danger` wrapper variant (node `2056:8249` → child), nested glyph swapped
  to the `alert` library member (node `2053:7`); the icon's vector fill is then **re-bound per cell**
  to that cell's own description-color token (not left at the wrapper's own `color=danger` variant),
  since code's `ds-icon { --icon-color: var(--_form-description-color) }` always follows the
  description text color, including under `state=disabled`.
- **Grid**: 6 `state` columns × 10 (`required`×`color`) rows, fixed cell `352×127` (320×95 content +
  16px padding/side — every variant renders at the identical box size, so no per-cell sizing logic
  was needed). Row labels: `required` (outer, bracketed) → `color` (inner) — ascending option count
  per Phase 2's grid sketch. 9 row dividers + 5 column dividers, cloned from the template prototypes.
- A transient Figma render-cache bug (`absoluteRenderBounds` reporting half the real width right
  after `combineAsVariants()` + `resize()`) was observed and resolved itself after further edits —
  not a structural issue, `width`/`height`/`absoluteBoundingBox` were correct throughout; noted here
  in case it recurs on a future rebuild.
