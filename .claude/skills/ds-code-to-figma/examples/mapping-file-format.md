# Mapping file format

`<name>.figma.md` lives at `packages/core/src/components/<category>/<name>/<name>.figma.md`,
co-located with the component's other files. It's both the input spec you confirm in Phases 1–2
and the output record Phase 3 writes back into. A family has one file per member, next to each
member's `.tsx` — see [Family fields](#family-fields) below.

```markdown
# <name> → Figma mapping

\`\`\`yaml
sets: # filled in by Phase 3 — one entry per component set (top-level split), default set first.

# A parent component nesting this one uses the first entry's figmaComponentKey.

- name: Close # default set — bare name; also its stack's sub-label
  figmaComponentKey: null
  figmaMasterNodeId: null # component set node id, inside the documentation frame's `Component Sets` column
- name: CloseInverted # only when a top-level split exists
  figmaComponentKey: null
  figmaMasterNodeId: null
  figmaPage: Core / <Category> # the shared category page, e.g. "Core / Indicators" — NOT this

# component's own name; multiple components share one page (see PHASE-3-BUILD.md → "Category pages")

figmaDocFrameNodeId: null # this component's "<Component> Documentation" frame id within the

# documentation-frames row — filled in by Phase 3, since the page itself

# no longer uniquely identifies a single component's content

anatomy:

- letter: A
  part: label
  description: "The text label wrapper (<span>)."
- letter: B
  part: icon
  description: "The leading icon wrapper (or the brand icon wrapper when brandIcon is set)."

# Omit this whole `anatomy:` key if the component has no @part tags at all.

props:

- name: size
  type: enum
  options: [sm, base]
  figmaProperty: size
  figmaPropertyType: variant
  figmaOptions: [base, sm] # code default first (top-left = default variant), then canonical order
- name: label # consumer-authored text: a string prop rendered as text, or a text-only slot (named after its @part)
  type: string
  figmaProperty: label
  figmaPropertyType: text # TEXT component property bound to the node's characters on every variant
  node: label # text layer name
  default: Label # property name in sentence case
- name: placeholder # one part rendering two props → two nodes, each with its own text property
  type: string
  figmaProperty: placeholder
  figmaPropertyType: text
  node: placeholder
  default: Placeholder
  shownWhen: filled=false # the variant(s) where this node is visible (e.g. color=invalid)
- name: pageNumber
  figmaPropertyType: excluded # generated — no property
- name: '[excluded]' # several excluded props in one entry
  figmaPropertyType: excluded
  props: [href, target, rel] # every code prop name, as a list — names only in `note` don't count (scripts/check-mapping-coverage.mjs)
  note: 'link attributes, no visual effect'
  states:
  figmaProperty: state
  options: [default, hover, active] # interaction states only; focus is ignored
  sources:
  hover: ":hover (spinner.host.scss)"
  componentStates: # component-state props → own false/true variants (PHASE-2-PROPOSE.md); interactive (Phase 1 step 3) decides the columns
  disabled: { figmaProperty: disabled, options: [false, true], interactive: false, source: "disabled prop; hover gated by :not(.is-disabled) (button.style.scss:284)" } # true only with state=default
  invalid: { figmaProperty: invalid, options: [false, true], interactive: true, source: "invalid prop; hover still applies (form.mixin.scss:67)" } # true crossed with every interaction state
  nested:
- childTag: ds-icon
  childMappingFile: ../icon/icon.figma.md
  figmaComponentKey: <icon.figma.md → sets[0].figmaComponentKey>
  iconSlot: # only for nested ds-icon / ds-brand-icon — always instance swap
  codeProp: icon # → INSTANCE_SWAP property `icon`
  acceptsBrandIcon: true # brandIcon replaces icon in part="icon" → brand-icon library in preferredValues
  size: follows parent size # icon right: fixed sm
  colorSource: # Phase 1 fills it, Phase 3 binds from it, Phase 4 checks against it.
  # Key = state, or a component state for its `true` variant (`disabled`, `loading`); `default` covers every
  # state not listed. Value = the variable the vector fill
  # binds to, and where code takes it from. Use `<color>` for a per-variant token.
  default: "Button/Color/<color>/Base/Text (--icon-color)"
  hover: "Button/Color/<color>/Hover/Text (--icon-color)"
  active: "Button/Color/<color>/Active/Text (--icon-color)"
  disabled: "Button/Color/Disabled/Base/Text (--icon-color)"
  device: # omit entirely if Phase 1 step 5a found no breakpoint-driven token differences.
  # One entry per responsive binding — the single place that owns the mechanism detail (which
  # routing variable, its per-mode aliases, why this component needed it). tokens:/measurements: entries
  # for the same binding just reference the routing variable by name, no restating the breakdown.
  responsiveBindings:
  - cssVar: [--ds-logo-size-base-mobile, --ds-logo-size-base-desktop] # every real --ds-* token
    # involved across the component's breakpoints, in mobile→desktop order
    routingVariable: 🧩 Component/Logo/Size/Base/Device # in Foundation's `Design Responsive
    # Tokens`, created by the token sync — never by this skill; missing = stop and list (Phase 1 step 5a)
    modes:
    mobile: 🧩 Component/Logo/Size/Base/Mobile # real scripts/figma-sync-managed variable this
    # mode's alias points at
    tablet: 🧩 Component/Logo/Size/Base/Mobile # falls through to Mobile's token — code has no
    # @include tablet override for this property, so Tablet renders the same as Mobile
    desktop: 🧩 Component/Logo/Size/Base/Desktop
    exists: true # false → listed for the token pipeline, the component waits
    tokens:
- cssVar: --ds-alias-surface-sky
  figmaVariable: 🔗 Alias/🎨 Surface/Sky # token path joined with / — the Foundation variable name
  # (PHASE-1-ANALYZE.md step 5). Phase 3 imports it from Foundation by key and binds it.
  variableId: "VariableID:<id>" # Base.tokens.json → com.figma.variableId (css-token-lookup.mjs)
  libraryKey: "<key>" # search_design_system hit whose variableSetKey is in foundationVariableCollections
  resolved: true
- cssVar: --ds-spinner-color-one-off
  figmaVariable: null
  variableId: null
  libraryKey: null
  resolved: false
  resolution: "<decision made with the user — pick a token or accept hardcoded>"
- cssVar: [--ds-logo-size-base-mobile, --ds-logo-size-base-desktop]
  figmaVariable: 🧩 Component/Logo/Size/Base/Device # see device: above — responsive, not a
  # single static token
  variableId: "VariableID:<id>" # the Device routing variable's: com.figma.variableId → device
  libraryKey: "<key>" # the Device routing variable's
  resolved: true
  measurements: # confirmed measurements triage (PHASE-1-ANALYZE.md step 6), rendered by Phase 8. Rules:
  # conventions/measurements.md
  drawnOption: base # the table-axis option shown on the drawn card
  drawnColor: secondary # the color option every drawn instance uses — the default, unless its
  # border = fill (conventions/measurements.md → "Border visibility"); omit when there is no color axis
  drawnColorReason: "primary draws the border in the fill color — confirmed by the user" # required
  # when drawnColor isn't the default color option
  drawnState: hover # optional: the state the main instance is drawn in when the default state
  # can't show the shape (transparent background, no border — conventions/measurements.md →
  # "Shape visibility"); omit for default. Needs drawnStateReason, like drawnColor
  options: [base, sm, lg] # table columns, code default first (like the component set); [] when there is no table axis
  behavior: # triage rows proposed as `behavior` land here, not in rows:. Omit when the size
  # never changes with content/container (icon, spinner)
  width: hug # hug | fill — from the behavior probe
  overflow: truncate # truncate | wrap | overflow (flag overflow in the triage)
  rows: # numbered in this order on the drawn card and in the table: size → spacing → shape → type
  - property: Min height # Width | Height | Size (w = h) | Min/Max width/height | Padding X/Y/L/R | Gap | Radius | Border width | Text (<part>)
    kind: size # size | spacing | shape | type
    group: limit # fixed | inner spacing | limit | behavior | derived | outer margin | hit area | context-dependent | typography
    show: drawn # drawn (marker + table row) | table (table row only, rare) | skip
    instance: main # drawn rows only: main | min-content | … — see conventions/measurements.md → "Section layout"
    source: button.host.scss:42 # the SCSS declaration that sets it
    values: # one per option; measured px + its token (exact Figma variable name)
    base: { px: 48, token: 🧩 Component/Button/Size/Base/MinHeight }
    sm: { px: 32, token: 🧩 Component/Button/Size/SM/MinHeight }
    lg: { px: 56, token: 🧩 Component/Button/Size/LG/MinHeight }
  - property: Padding X
    kind: spacing
    group: context-dependent
    show: drawn
    source: logo.host.scss:12
    values:
    base: { px: { mobile: 16, tablet: 16, desktop: 24 }, token: 🧩 Component/Logo/Padding/Device } # routing variable — see device: above
  - property: Text (label)
    kind: type
    group: typography
    show: drawn
    source: button.host.scss:60
    values:
    base: { px: 16, token: 🔤 Text/Size/Base, weight: 700, lineHeight: 1.3, family: BaloiseCreateHeadline }
  - property: Height
    kind: size
    group: derived
    show: skip
    reason: "padding + line-height; min height already covers it" # required when show is skip, or when the user changed the default proposal
    values:
    base: { px: 48 }
  - property: Min width
    kind: size
    group: limit
    show: skip
    reason: "never binds — border + padding alone are 52px > 48px" # a limit no content reaches
    values:
    base: { px: 48, token: 🧩 Component/Button/Size/Base/MinWidth }
  - property: Margin
    kind: spacing
    group: outer margin
    show: skip
    reason: "margin-block on :host — layout's job; reported as a code smell"
    values:
    base: { px: 8 }
  # A measured ≠ token mismatch the user resolved keeps both: { px: 15, token: …, tokenPx: 16, note: "…" }
  \`\`\`

Notes on this mapping, open questions, and rationale for any non-obvious grouping decision go
here as prose, below the YAML block.
```

## Variations field

Drafted in Phase 1 (step 4a), confirmed in Phase 2, node ids written back by Phase 3. In the
owner's file for a family (it covers sub-component sets too). Omit it when no set has a
`show <name>` boolean.

```yaml
variations:
  figmaSectionNodeId: null # the kind=variations Section in the Documentation column
  sets: # default set and rule-1 splits, never …Inverted; build order in a family
    - set: SpinnerLogo
      previewNodeId: null
      entries:
        - caption: 'show label · right' # one per option of each dependent axis
          props: { show label: true, label position: right }
          snapshot: spinner-label-right # visual test case, or missing (Phase 2 adds it)
          nodeId: null
        - caption: 'all on' # every show boolean true, default variant otherwise
          props: { show label: true }
          snapshot: missing
          nodeId: null
```

## Slots field

Drafted in Phase 1 (step 4), confirmed in Phase 2. One entry per open slot — a declared `@slot`
that takes any content inside a part (`PHASE-3-BUILD.md` → "Slots"). Family slots that take
sub-component instances use the same key, see "Family fields".

```yaml
slots:
  - codeSlot: start
    figmaSlot: start # lowercase
    part: control # the frame it sits in
    position: first # first | after <layer> | last — its place among the part's children
    content: open # any content; icons are the main use
    preferred: [Icon, Button] # DS sets the docs / tests put there, main use first
    defaultFill: empty
    figmaPropertyKey: null # filled in by Phase 3 (start#123:4)
    showPropertyKey: null # the `show start` boolean, filled in by Phase 3
```

## `axes` on a set entry

Optional, in `sets:`. Only when the sets of one mapping file have different variant props (a rule 1
split, e.g. `Item` has `variant`, `ItemAccordion` has `open`). Lists the `figmaProperty` names of the
variant props this set has; `scripts/figma-check-set.mjs` then checks axes, options and combinations
against that list instead of all variant props. Omitted → every variant prop (the usual case, an
`…Inverted` mirror needs nothing). A name that isn't a variant prop stops the script.

```yaml
sets:
  - name: Item
    axes: [variant, size, label size]
  - name: ItemAccordion
    axes: [open, size, label size]
```

## figmaCheck field

Optional input for `scripts/figma-check-set.mjs` (Phase 4, step 0): layers that exist only in some
variants, and variant combinations the user approved beyond the default rules.

```yaml
figmaCheck:
  conditionalLayers:
    - name: tooltip-anchor # layer name inside the variant
      when: { state: [hover], disabled: ['false'], loading: ['false'] } # present exactly here, absent elsewhere
  allowedCombos: [] # e.g. 'disabled=true, invalid=true, size=base, state=default' (approved in Phase 2)
  stateless: { variant: [default] } # options with no hover / active: only `state=default` is expected for them
```

## Family fields

Only for a family with sub-components (`../conventions/families.md`). A family of one has none of
these.

**Owner** (`tabs/tabs/tabs.figma.md`) — adds to the schema above:

```yaml
nested:
  - childTag: ds-tab
    childMappingFile: ../tab/tab.figma.md
    subComponent: true # built in this run — never a missing-mapping hard stop
    relation: contained # contained (renders inside the owner) | wrapping (renders the owner inside itself)
    figmaComponentKey: null # filled by Phase 3 from tab.figma.md → sets[0]
  - childTag: ds-tab-panel
    childMappingFile: ../tab-panel/tab-panel.figma.md
    subComponent: true
    relation: contained
    figmaComponentKey: null
slots: # family slots: one per code @slot that takes sub-component instances — in the file of the component that declares the @slot (open slots: see "Slots field")
  - codeSlot: tab # '' for the default slot
    figmaSlot: tabs # lowercase
    preferred: [Tab] # TabsInverted's slot prefers TabInverted
    defaultFill: '3 × Tab — first selected=true; labels "Tab 1", "Tab 2", "Tab 3"' # confirmed in Phase 2
  - codeSlot: ''
    figmaSlot: tab panels
    preferred: [TabPanel]
    defaultFill: '1 × TabPanel (the selected one)'
anatomy: # merged list for the whole family
  - letter: A
    part: tablist
    description: 'The tablist container.'
  - letter: B
    subComponent: ds-tab # one entry per contained sub-component
    part: Tab (ds-tab)
    description: 'Tab renders a single tab button inside a ds-tabs group.'
  # a sub-component with more than one @part adds B1, B2, … ; a single @part collapses into its entry
measurements:
  rows:
    - property: Padding X
      set: Tab # every row names its set; sub-component rows live here, not in their own file
      # …rest as in the schema above
```

**Sub-component** (`tabs/tab/tab.figma.md`) — the schema above, plus `owner:`, minus `anatomy:` and
`measurements:`:

```yaml
owner: ../tabs/tabs.figma.md # documentation owner; its frame is this file's figmaDocFrameNodeId
sets:
  - name: Tab
    figmaComponentKey: null
    figmaMasterNodeId: null
  - name: TabInverted # inverted mirror of the owner's split
    figmaComponentKey: null
    figmaMasterNodeId: null
figmaPage: Core / Navigation
figmaDocFrameNodeId: null # = the owner's "Tabs Documentation" frame
props:
  - name: inverted
    type: boolean
    drivenBy: ds-tabs.inverted # parent-set prop (@internal, "Set by ds-tabs")
    figmaPropertyType: top-level-split (rule 2, mirrors owner)
  - name: vertical
    type: boolean
    drivenBy: ds-tabs.vertical
    figmaProperty: vertical
    figmaPropertyType: variant
  - name: selected
    type: boolean # public, set per instance by the designer — no drivenBy
    figmaProperty: selected
    figmaPropertyType: variant
  - name: name
    type: string
    figmaPropertyType: excluded # identifier, no visual effect
```
