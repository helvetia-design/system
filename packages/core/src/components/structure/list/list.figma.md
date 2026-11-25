# list → Figma mapping

> **Status: Phase 8 built, awaiting Measurements confirmation (23.11.2026)** — Anatomy and Copy me confirmed by user. Measurements: main instance `List` (320 wide, link Item with label + description) + extra instance `List (label only)` for Min height; Sizes table 10 rows (base · lg); Behavior card `Fill ↔ · Wraps`. Phase 4 verdict `blocked` (only 6e `not verified`: 13 of 20 variations have no baseline); user chose to continue without `/update-screenshots` (23.11.2026), re-run 6e after the baselines exist. Earlier: Phase 3 built — all six sets, the Variations section and the node ids below are in Figma. Earlier: Phase 2 signed off (23.11.2026) — grouping in `item/item.figma.md` → "Phase 2 proposal"; ItemAccordion built from own layers (not a nested Accordion instance), `accordionMarker` / `accordionMarkerPosition` excluded, `link` and `button` kept as separate options. Snapshot cases added to `test/list.visual.html` (blocks `basic`, `accordion`); baselines need `/update-screenshots`. Earlier: draft Phase 1, 23.11.2026 — family `ds-list` (owner) + `ds-item` (contained sub-component).
> Item props, tokens, states and slots live in `item/item.figma.md`; this file holds the owner's props,
> the merged anatomy, the family measurements and the variations.

```yaml
sets: # filled in by Phase 3 — default set first
  - name: List
    figmaComponentKey: 3e45253bb04f1397d7a40724ebb3ebc02e6faa8a
    figmaMasterNodeId: '6562:3252'
  - name: ListInverted
    figmaComponentKey: 39f37de430385843a58b9294e30f9521581494d8
    figmaMasterNodeId: '6562:3387'
figmaPage: Core / Structure
figmaDocFrameNodeId: '6548:2182'

anatomy: # merged list for the family; DOM order of render(). All 7 @part tags match a part="…" in render().
  - letter: A
    part: list
    description: 'The native HTML list element (ol or ul).'
  - letter: B # sub-component entry; B1…B6 = its @parts, numbered left to right in the Phase 7 drawing. Two instances in the diagram: "List (link item)" carries A, B, B1–B3; "List (accordion item)" carries B4–B6. Legend shows shortened descriptions (no "only applicable if…" clauses) to fit 656px.
    subComponent: ds-item
    part: Item (ds-item)
    description: 'Item displays a list entry that supports plain content, accordion, link, and button variants.'
  - {
      letter: B1,
      subComponent: ds-item,
      part: label,
      description: 'The label element, only applicable if the `label` prop is set.',
    }
  - {
      letter: B2,
      subComponent: ds-item,
      part: description,
      description: 'The description element, only applicable if the `description` prop is set.',
    }
  - {
      letter: B3,
      subComponent: ds-item,
      part: action-icon,
      description: 'The action icon, only applicable if `variant` is set to `link` or `button`.',
    }
  - {
      letter: B4,
      subComponent: ds-item,
      part: accordion,
      description: 'The accordion element, only applicable if `variant` is set to `accordion`.',
    }
  - { letter: B5, subComponent: ds-item, part: item, description: 'The main container of the item.' }
  - {
      letter: B6,
      subComponent: ds-item,
      part: accordion-content,
      description: 'The container of the accordion content, only applicable if `variant` is set to `accordion`.',
    }
anatomySectionNodeId: '6548:2188'

props:
  - name: inverted
    type: boolean
    default: false
    figmaPropertyType: top-level-split (rule 2) # → ListInverted; cascades to every ds-item (mirrors ItemInverted)
  - name: size
    type: enum
    options: [lg]
    default: '(unset → base)'
    figmaProperty: size
    figmaPropertyType: variant # cascades to descendant ds-item
    figmaOptions: [base, lg] # implicit default named `base`
  - name: ordered
    figmaPropertyType: excluded
    note: 'Renders <ol> instead of <ul>; list-style is none in both → no visual effect.'

states: # none — the list itself has no interaction states (items do, see item.figma.md)
componentStates: {}

nested:
  - childTag: ds-item
    childMappingFile: ./item/item.figma.md
    subComponent: true
    relation: contained
    figmaComponentKey: 153da16d8a1626963119019a39a496adc1568281 # item.figma.md → sets[0] (Item)

slots:
  - codeSlot: '' # default slot: li-like items
    figmaSlot: items # lowercase
    preferred: [Item, ItemAccordion] # ListInverted's slot prefers ItemInverted, ItemAccordionInverted
    figmaPropertyKey: 'items#6562:0'
    defaultFill: "3 × Item (variant=default, size matches the List) — show label and show description on; labels Item 1, Item 2, Item 3, set through each instance's text properties (built 23.11.2026; ListInverted uses ItemInverted)"

device: none # no breakpoint mixins in list.host.scss or item.host.scss

tokens: # the list itself binds no tokens; its host cascades --mod-list-item-* only (see item.figma.md)
  - { cssVar: null, figmaVariable: null, literal: 'variant root width 480 (List, ListInverted)', bind: false } # list fills its container in code (width: fill)

measurements:
  drawnOption: base
  options: [base, lg]
  behavior:
    width: fill # items stretch to the list; list fills its container
    overflow: wrap # overflow-wrap: break-word + hyphens: auto, no ellipsis
    finding: 'A long unbreakable word keeps the item as wide as the word (min-content), overflowing a narrower container — break-word does not lower min-content.'
  rows:
    - property: Min height
      set: Item
      kind: size
      group: limit
      show: drawn
      instance: label-only # extra instance (link Item, label only): with a description the row is 61px, so the 56px minimum only shows without it (built Phase 8)
      source: item.host.scss:73 # min-height: var(--_list-item-min-height); lg: :host(.is-lg)
      values:
        base: { px: 56, token: 🧩 Component/List/Item/Size/Base/MinHeight }
        lg: { px: 72, token: 🧩 Component/List/Item/Size/LG/MinHeight }
      note: 'Binds: label-only row needs 38.8px (8 + 20.8 + 10).'
    - property: Action icon size
      set: Item
      kind: size
      group: fixed
      show: drawn
      instance: main # link / button variant
      source: item.host.scss:160
      values:
        base: { px: 14, token: 🧩 Component/List/Item/Action/IconSize }
        lg: { px: 14, token: 🧩 Component/List/Item/Action/IconSize }
    - property: Padding Y
      set: Item
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: item.host.scss:150
      values:
        base: { px: 8, token: 🧩 Component/List/Item/Size/Base/PaddingY }
        lg: { px: 8, token: 🧩 Component/List/Item/Size/LG/PaddingY }
      note: 'Measured bottom padding is 10 = PaddingY + 2px border (padding-bottom: calc(py + border-width)) — matches tokens, border is its own row.'
    - property: Padding X
      set: Item
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main
      source: item.host.scss:150
      values:
        base: { px: 4, token: 🧩 Component/List/Item/PaddingX }
        lg: { px: 4, token: 🧩 Component/List/Item/PaddingX }
    - property: Gap
      set: Item
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main # needs an icon / action icon in the drawn instance (link variant)
      source: item.host.scss:147
      values:
        base: { px: 16, token: 🧩 Component/List/Item/Gap }
        lg: { px: 16, token: 🧩 Component/List/Item/Gap }
    - property: Content gap
      set: Item
      kind: spacing
      group: inner spacing
      show: drawn
      instance: main # needs label + description
      source: item.host.scss:171
      values:
        base: { px: 1, token: 🧩 Component/List/Item/ContentGap }
        lg: { px: 1, token: 🧩 Component/List/Item/ContentGap }
    - property: Accordion padding Y
      set: Item
      kind: spacing
      group: inner spacing
      show: table
      reason: 'Only visible on slotted <p> inside accordion content (an accordion instance); user confirmed table-only to avoid an extra drawn card (23.11.2026).'
      source: item.host.scss:263
      values:
        base: { px: 16, token: 🧩 Component/List/Item/Accordion/PaddingY } # px read from the built paragraph frame (Space/Padding/Base)
    - property: Border width
      set: Item
      kind: shape
      group: fixed
      show: drawn
      instance: main
      source: item.host.scss:55 # #item::after height
      values:
        base: { px: 2, token: 🧩 Component/List/Item/Border/Width }
        lg: { px: 2, token: 🧩 Component/List/Item/Border/Width }
    - property: Text (label)
      set: Item
      kind: type
      group: typography
      show: drawn
      instance: main
      source: item.host.scss:176
      values:
        base: { px: 16, token: 🧩 Component/List/Item/Title/Typo/FontSize, weight: 700, lineHeight: 20.8 }
        lg: { px: 16, token: 🧩 Component/List/Item/Title/Typo/FontSize, weight: 700, lineHeight: 20.8 }
    - property: Text (description)
      set: Item
      kind: type
      group: typography
      show: drawn
      instance: main
      source: item.host.scss:181
      values:
        base: { px: 14, token: 🧩 Component/List/Item/Text/Typo/FontSize, weight: 400, lineHeight: 21 }
        lg: { px: 14, token: 🧩 Component/List/Item/Text/Typo/FontSize, weight: 400, lineHeight: 21 }
    - property: Height
      set: Item
      kind: size
      group: derived
      show: skip
      reason: 'padding + content + border; min height already covers it'
      values:
        base: { px: 56 }
    - property: Radius
      set: Item
      kind: shape
      group: fixed
      show: skip
      reason: 'Radius/LG (12px) is applied to the 2px border line — radius ≥ half its height, pill rule'
      values:
        base: { px: 12, token: 🧩 Component/List/Item/Radius }
    - property: Margin
      set: Item
      kind: spacing
      group: outer margin
      show: skip
      reason: 'none declared (0)'
      values:
        base: { px: 0 }

variations: # covered sets: Item and ItemAccordion (rule-1 splits), never …Inverted
  figmaSectionNodeId: '6548:2187'
  sets:
    - set: Item
      previewNodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340'
      entries:
        - {
            caption: 'show label',
            props: { show label: true },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6548:2346',
          } # test case 'Item 1'
        - {
            caption: 'show label · label size h1',
            props: { show label: true, label size: h1 },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6548:2349',
          }
        - {
            caption: 'show label · label size h2',
            props: { show label: true, label size: h2 },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9156',
          }
        - {
            caption: 'show label · label size h3',
            props: { show label: true, label size: h3 },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9164',
          }
        - {
            caption: 'show label · label size h4',
            props: { show label: true, label size: h4 },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9172',
          }
        - {
            caption: 'show label · label size h5',
            props: { show label: true, label size: h5 },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9180',
          }
        - {
            caption: 'show description',
            props: { show description: true },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9188',
          }
        - {
            caption: 'show icon',
            props: { show icon: true },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9196',
          }
        - {
            caption: 'show content',
            props: { show content: true },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9204',
          } # test case 'Item 3' (content slot)
        - {
            caption: 'all on',
            props: { show label: true, show description: true, show icon: true, show content: true },
            snapshot: list-basic,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6548:2340;2192:7499;6560:9212',
          }
    - set: ItemAccordion
      previewNodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148'
      entries:
        - {
            caption: 'show label',
            props: { show label: true },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9127',
          }
        - {
            caption: 'show label · label size h4',
            props: { show label: true, label size: h4 },
            snapshot: list-nested-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9130',
          } # label-level h4
        - {
            caption: 'show label · label size h1',
            props: { show label: true, label size: h1 },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9315',
          }
        - {
            caption: 'show label · label size h2',
            props: { show label: true, label size: h2 },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9323',
          }
        - {
            caption: 'show label · label size h3',
            props: { show label: true, label size: h3 },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9331',
          }
        - {
            caption: 'show label · label size h5',
            props: { show label: true, label size: h5 },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9339',
          }
        - {
            caption: 'show description',
            props: { show description: true },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9347',
          }
        - {
            caption: 'show icon',
            props: { show icon: true },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9355',
          }
        - {
            caption: 'show content',
            props: { show content: true },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9363',
          }
        - {
            caption: 'all on',
            props: { show label: true, show description: true, show icon: true, show content: true },
            snapshot: list-accordion,
            nodeId: 'I6548:2187;2192:7515;2192:5066;6560:9148;2192:7499;6560:9371',
          }
```

Notes:

- **Family:** `ds-list` owns the Storybook page; `ds-item` has only `item.stories.ts` and no `doc-config.ts`, so it is a contained sub-component.
- **Nested:** `ds-accordion` (`../accordion/accordion.figma.md`, set key `d13c3342…`) and `ds-icon` (`../../media/icon/icon.figma.md`) are other families and exist; `ds-badge` is only slotted by consumers.
- **Unresolved for Phase 2:** the `show label` / `show description` defaults, whether `variant=accordion` becomes a variant value or a top-level split (it nests `ds-accordion` instead of the `#item` layers), and whether label-size aliases (`3xl`…`base`) collapse to `h1`…`h5`.
- **Code drift to report, not fix:** label sizes borrow `--ds-heading-level-N-*` tokens (marked "intentional reuse" in `item.host.scss`).
