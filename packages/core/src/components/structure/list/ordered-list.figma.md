# ordered list → Figma mapping

> **Status: all phases built; Anatomy and Measurements confirmed (25.11.2026). Phase 4 `blocked` — see `ordered-list.figma-validation.md`** CSS-only family (no `ds-*` tag, no `@Prop()`s, no `@part`s): the "props" are class modifiers on `ol.ordered-list`, read from `list-native.styles.scss`. Mapping model is local to the three native-list files (user decision 24.11.2026) — not a skill convention.
> Documented in Storybook under List → Variants (HTML & CSS). Visual cases: `test/list-native.visual.html` (`ordered-list`, `inside-list`, `compact-list`).

```yaml
family: ordered-list # css-only, owner of its own doc frame; no sub-components
source: list-native.styles.scss
element: 'ol.ordered-list > li'
figmaPage: Core / Structure # own doc frame (user decision 25.11.2026)

sets: # built in Phase 3, frame approved 25.11.2026
  - { name: OrderedList, figmaComponentKey: 6bac7a104f473386fe1a62dc8ff63eee4b2c359b, figmaMasterNodeId: '6851:5044' }
  - {
      name: OrderedListInverted,
      figmaComponentKey: ce87c54bb717265523e12e0de03986a4172504c3,
      figmaMasterNodeId: '6852:5059',
    }
  - {
      name: OrderedListItem,
      figmaComponentKey: 0c0929555d443e0167ab53a4ce80bc360c2258d2,
      figmaMasterNodeId: '6849:5010',
    } # Figma-only helper (one li)
  - {
      name: OrderedListItemInverted,
      figmaComponentKey: f8093df9c4268b794c16a56cd1e2dd5a0c10e74d,
      figmaMasterNodeId: '6850:5010',
    }
figmaDocFrameNodeId: '6848:4936'
variations:
  - { set: OrderedList, caption: is-alpha, nodeId: '6855:5020', snapshot: ordered-list }

slots:
  - {
      set: [OrderedList, OrderedListInverted],
      figmaSlot: items,
      preferred: 'item set matching the inverted split',
      defaultFill: '4 × item, numbers 1.–4.',
    }

anatomy: # no @part in code; parts and descriptions authored, approved by user 25.11.2026
  - { letter: A, part: marker, description: 'The number or letter before each item.' }
  - { letter: B, part: item, description: 'One list entry (li).' }
  - { letter: C, part: list, description: 'The ordered list container (ol.ordered-list).' }
anatomySectionNodeId: '6848:4942'

measurements: # triage confirmed by user 25.11.2026
  drawnOption: 'false' # compact
  options: ['false', 'true']
  behavior: { width: fill, overflow: wrap }
  rows:
    - {
        property: Gap,
        set: OrderedList,
        kind: spacing,
        show: drawn,
        values:
          {
            'false': { px: 16, token: '🧩 Component/List/Native/Item/Gap' },
            'true': { px: 4, token: '🧩 Component/List/Native/Compact/Item/Gap' },
          },
      }
    - {
        property: Indent,
        set: OrderedListItem,
        kind: spacing,
        show: drawn,
        values:
          {
            'false': { px: 32, token: '🧩 Component/List/Native/Indent' },
            'true': { px: 32, token: '🧩 Component/List/Native/Indent' },
          },
        note: 'margin-left in code; shown because it is the Figma marker column width',
      }
    - {
        property: Text (number),
        set: OrderedListItem,
        kind: type,
        show: drawn,
        value: '16 / 700 / 1.5',
        token: '🧩 Component/List/Marker/Typo',
      }
    - {
        property: Text (item),
        set: OrderedListItem,
        kind: type,
        show: drawn,
        value: '16 / 400 / 1.5',
        token: '🧩 Component/Text/Typo/Paragraph',
      }
    - {
        property: List margins,
        kind: spacing,
        show: skip,
        reason: 'outer margin (16 top; 24 mobile / 32 desktop bottom)',
      }
    - { property: Item height, kind: size, show: skip, reason: 'derived from line height' }
measurementsSectionNodeId: '6848:4943'

props: # class modifiers
  - {
      class: is-compact,
      set: [OrderedList, OrderedListInverted],
      figmaProperty: compact,
      figmaPropertyType: variant,
      figmaOptions: ['false', 'true'],
      default: 'false',
    }
  - {
      class: is-inside,
      set: [OrderedListItem, OrderedListItemInverted],
      figmaProperty: position,
      figmaPropertyType: variant,
      figmaOptions: [outside, inside],
      default: outside,
    }
  - { class: is-alpha, figmaPropertyType: excluded, note: 'number is typed (A.); shown in Variations' }
  - { class: is-inverted, figmaPropertyType: top-level-split (rule 2) }
variantCount: { OrderedList: 2, OrderedListInverted: 2, OrderedListItem: 2, OrderedListItemInverted: 2 }

text: # consumer-authored
  - { set: OrderedListItem, part: marker, figmaProperty: number, note: 'typed by hand; renumber after reordering' }
  - { set: OrderedListItem, part: li, figmaProperty: label }

tokens:
  - { cssVar: --ds-list-native-indent, figmaVariable: '🧩 Component/List/Native/Indent', use: 'margin-left (outside)' }
  - {
      cssVar: --ds-list-native-margin-bottom,
      figmaVariable: '🧩 Component/List/Native/MarginBottom',
      use: 'list margin-bottom unless last child',
    }
  - { cssVar: --ds-list-native-item-gap, figmaVariable: '🧩 Component/List/Native/Item/Gap', use: 'gap between items' }
  - {
      cssVar: --ds-list-native-compact-margin-y,
      figmaVariable: '🧩 Component/List/Native/Compact/MarginY',
      use: compact,
    }
  - {
      cssVar: --ds-list-native-compact-item-gap,
      figmaVariable: '🧩 Component/List/Native/Compact/Item/Gap',
      use: compact,
    }
  - {
      cssVar: --ds-list-marker-typo-*,
      figmaVariable: '🧩 Component/List/Marker/Typo',
      use: 'marker typography (Heading family, bold, Text.Size.Base)',
    } # composite typography token, checked in Base.tokens.json
  - {
      cssVar: --ds-list-marker-color-primary,
      figmaVariable: '🧩 Component/List/Marker/Color/Primary',
      use: 'see finding 1',
    }
  - {
      cssVar: --ds-list-marker-color-inverted,
      figmaVariable: '🧩 Component/List/Marker/Color/Inverted',
      use: inverted marker,
    }
  - {
      cssVar: --ds-list-native-inverted-color-text,
      figmaVariable: '🧩 Component/List/Native/Inverted/Color/Text',
      use: inverted text,
    }
  - {
      figmaVariable: null,
      literal: 'item text color / typography',
      note: 'inherited from the page (not set by the list): bind Alias/Text/Color/Primary + Device Text/Size/Base per Phase 1 step 3',
    }
  - {
      figmaVariable: '🧩 Component/Text/Typo/Paragraph/{FontFamily,FontSize,FontWeight}',
      use: 'item label (user decision 25.11.2026)',
    }
  - { figmaVariable: null, literal: 'variant root width 480', bind: false } # list and items fill their container in code
  - {
      figmaVariable: '🧩 Component/List/Marker/Typo/LineHeight',
      literal: '150%',
      bind: false,
      note: 'STRING variable, not bindable',
    }
  - {
      figmaVariable: '🧩 Component/List/Marker/Typo/LetterSpacing',
      literal: '0%',
      bind: false,
      note: 'STRING variable, not bindable',
    }
  - {
      figmaVariable: '🧩 Component/List/Marker/Typo/TextDecoration',
      literal: 'NONE',
      bind: false,
      note: 'not a bindable text field',
    }
  - {
      figmaVariable: '🧩 Component/List/Marker/Typo/TextTransform',
      literal: 'ORIGINAL',
      bind: false,
      note: 'textCase is not a bindable text field',
    }
  - {
      figmaVariable: '🧩 Component/Text/Typo/Paragraph/LineHeight',
      literal: '150%',
      bind: false,
      note: 'STRING variable, not bindable',
    }
  - {
      figmaVariable: '🧩 Component/Text/Typo/Paragraph/LetterSpacing',
      literal: '0%',
      bind: false,
      note: 'STRING variable, not bindable',
    }
  - {
      figmaVariable: '🧩 Component/Text/Typo/Paragraph/TextDecoration',
      literal: 'NONE',
      bind: false,
      note: 'not a bindable text field',
    }
  - {
      figmaVariable: '🧩 Component/Text/Typo/Paragraph/TextTransform',
      literal: 'ORIGINAL',
      bind: false,
      note: 'textCase is not a bindable text field',
    }
# All 11 --ds-* vars resolve in Base.tokens.json; Foundation presence checked 25.11.2026.

states: none # list has no interaction states
device: none # no breakpoint mixins
```

## Findings (code)

1. **Marker color is never applied to ordered lists.** The shared rule `ol/ul > li::marker { color: var(--_unordered-list-marker-color) }` reads a variable that only `ul` defines, so the `ol` marker falls back to the text color. `--ordered-list-marker-color` (→ `Marker/Color/Primary`) is declared but unused. Needs a visual check; Figma should show what renders.
2. `--ordered-list-style-type` / `style-position` are `inherit`; `is-alpha` is `upper-alpha` (A, B, C), not lower.
3. The browser's list padding is not reset: `padding-left: 40px` adds to `margin-left: 32px`, so outside text renders 72px from the container (measured 25.11.2026). The Figma list puts it at 32px. Left out of Figma as outer offset (user decision 26.11.2026), see `unordered-list.figma.md` finding 6.

## Open questions

1. ~~Page / doc frame~~ → decided (user, 25.11.2026): page `Core / Structure`, own doc frame per list.
2. ~~Items~~ → decided (user, 25.11.2026): SLOT of `OrderedListItem` instances. Phase 2: which of `style` / `position` / `compact` the item set needs, since a parent variant does not drive slot content.
3. ~~`compact`~~ → decided (user, 25.11.2026): variant on the list set (it changes the items slot gap and the list margin).

## Phase 2 proposal (approved 25.11.2026)

Approved by the user 25.11.2026; the YAML above matches it.

| Set                                           | Variant axes (default first) | Count  | Text properties                        |
| --------------------------------------------- | ---------------------------- | ------ | -------------------------------------- |
| `OrderedList` / `OrderedListInverted`         | `compact` false · true       | 2 each | none (slot `items`)                    |
| `OrderedListItem` / `OrderedListItemInverted` | `position` outside · inside  | 2 each | `number` (`Number`), `label` (`Label`) |

Grid: one axis per set, one column.

- `compact`: `items` slot gap `Native/Item/Gap` (16px) → `Native/Compact/Item/Gap` (4px). List outer margins are not drawn (Measurements only).
- `position` lives on the item only, so list and items cannot disagree. Outside: marker column `Native/Indent` (32px) wide, text starts at 32px. Inside: marker hugs, text follows it.
- `is-alpha`: no property; the number is typed (`A.`). Shown in Variations.
- Default fill: 4 × item of the matching inverted set, numbers `1.`–`4.`.
- Colors: marker `Marker/Color/Primary` / `Inverted`; text `Alias/Text/Color/Primary` / `Native/Inverted/Color/Text`. Marker type `Marker/Typo`.

Deviation: inside, code wraps the second line under the marker; the Figma item wraps beside it.

Render check (dev server, 25.11.2026): the marker takes the text color (finding 1 confirmed: default text and `Marker/Color/Primary` look the same). List margins 16px top; bottom 24px mobile / 32px desktop when a sibling follows.

## Foundation check (25.11.2026)

Read-only listing of the Foundation file: the `List/Marker/*`, `List/Native/*` and `DescriptionList/*` variables named in this family exist (typography as split `Typo/*` variables), as does `Alias/Text/Color/Primary`.

Open before Phase 3: typography variables for the `li` label (inherited from the page, not set by the list).

## Phase 3 build (25.11.2026)

- Doc frame `OrderedList Documentation` `6848:4936`, `Sets` `6848:4946`, temporary `review` `6848:5575`; template stacks hidden.
- `OrderedListItem` default variant confirmed by user (25.11.2026). Set `6849:5010`, key `0c0929555d443e0167ab53a4ce80bc360c2258d2`, stack `6849:4934`; variants outside `6848:5586`, inside `6849:5005`. Grid: 1 column, row axis `position`, no column labels.
- `OrderedListItemInverted` default variant confirmed by user (25.11.2026). Set `6850:5010`, key `f8093df9c4268b794c16a56cd1e2dd5a0c10e74d`, stack `6850:4934`; variants outside `6849:5021`, inside `6850:5005`.
- `OrderedList` default variant confirmed by user (25.11.2026). Set `6851:5044`, key `6bac7a104f473386fe1a62dc8ff63eee4b2c359b`, stack `6851:4973`; variants compact=false `6850:5022`, compact=true `6851:4951`; slot property `items#6851:0`.
- `OrderedListInverted` default variant confirmed by user (25.11.2026). Set `6852:5059`, stack `6852:4988`; variants compact=false `6851:5089`, compact=true `6852:4982`; slot property `items#6852:0`.
- `review` frame and unused hidden template stacks removed. Stack order: OrderedList, OrderedListInverted, OrderedListItem, OrderedListItemInverted.
- Variations (user decision 25.11.2026, exception: no `show` boolean): section `6848:4941`, one `OrderedList` instance `6855:5020`, caption `is-alpha`, numbers `A`–`D`. No matching visual test case yet (`ordered-list` has an `is-alpha` list to compare against).
- Item text: `Component/Text/Typo/Paragraph/*` (user decision 25.11.2026, discussion todo in `docs/CODE_TO_FIGMA_TODOS.md`).
- `marker` frame: width bound to `Native/Indent`, right-aligned; `number` text property + generated `suffix` node (`.` + non-breaking space, as the browser renders it).
- `number` default is `1`, not `Number` (breaks the sentence-case default rule; `Number` overflows the 32px marker) — to confirm.
- Literals: variant root width 480; `lineHeight` 150% (resolved, string variable not bindable); letter spacing 0, decoration none, case original set unbound (string variables).
- Header links use the List family: Storybook `components-structure-list-list--list`, Toky `filter=list`, GitHub `structure/list`.
- Accepted exception (user, 25.11.2026): `number` text default `1`. The unbound text values (line height, letter spacing, text decoration, text case) are allowed by the skill since 26.11.2026.
- Copy me: section `6848:4940`, one default instance (fill width), template placeholder removed.
- Visual cases `is-compact` and `is-inside` added to `test/list-native.visual.html`; baselines need `/update-screenshots`.
- Anatomy diagram (25.11.2026): instance labels `List item 1`–`4`, width narrowed to 113 and centred. Marker placement (user decision): `A` on the marker, `B` centred on the item label, `C` on the list's top right corner.
- Measurements: drawing (320 wide, markers once per text part, not per item), sizes table, behavior card (220 wide). Behavior from the dev render (wrapping); the 0px / long-word probe was not run.
- Measurements confirmed by user (25.11.2026). Sizes table: px value only in each option cell (shared values repeated), full token name in the cell's layer name.
