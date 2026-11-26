# description list → Figma mapping

> **Status: All phases built and confirmed (26.11.2026). Phase 4 `pass` — see `description-list.figma-validation.md`.** CSS-only family: `dl.description-list` with `dt` (term) and `dd` (detail), from `description-list-native.styles.scss`. Mapping model local to the three native-list files (user decision 24.11.2026).
> Visual case: `test/list-native.visual.html` (`description-list`).

```yaml
family: description-list
source: description-list-native.styles.scss
element: 'dl.description-list > dt, dd'
figmaPage: Core / Structure # own doc frame (user decision 25.11.2026)

sets: # built in Phase 3
  - {
      name: DescriptionList,
      figmaComponentKey: 7da0ff842b8019aba773590cfcdd617690643ec5,
      figmaMasterNodeId: '6974:6600',
    } # no inverted style in code → no ...Inverted set
  - {
      name: DescriptionListRow,
      figmaComponentKey: 834aa68cb73eb3c3dfe48ed20ba03df950ec26f7,
      figmaMasterNodeId: '6974:6562',
    } # Figma-only helper (one dt + one dd), no counterpart in code
figmaDocFrameNodeId: '6961:6145'
variations: [] # no `show` boolean; template placeholder removed

props: # no class modifiers in code; the only variation is the breakpoint
  - {
      set: [DescriptionList, DescriptionListRow],
      figmaProperty: layout,
      figmaPropertyType: variant,
      figmaOptions: [columns, stacked],
      default: columns,
      note: 'user decisions 25.11.2026 (variant; exception to the skill rule against a device variant) and 26.11.2026 (default columns, although the code is mobile-first stacked)',
    }
  - {
      set: DescriptionListRow,
      figmaProperty: last,
      figmaPropertyType: variant,
      figmaOptions: ['false', 'true'],
      default: 'false',
      note: 'stacked only; drops the bottom padding of the final row',
    }
variantCount: { DescriptionList: 2, DescriptionListRow: 3 }
slots:
  - {
      set: DescriptionList,
      figmaSlot: rows,
      preferred: [DescriptionListRow],
      defaultFill: '3 × DescriptionListRow, layout matching the parent variant, third last=true',
    } # user decision 25.11.2026
layout:
  mobile: 'one column, dt and dd stacked, row-gap; dd:not(:last-child) margin-bottom Detail/MarginBottom'
  tablet+: 'two columns (1fr 1fr = term | detail), row-gap + column-gap'

text:
  - { set: DescriptionListRow, part: dt, figmaProperty: term }
  - { set: DescriptionListRow, part: dd, figmaProperty: detail }

tokens:
  - { figmaVariable: '🧩 Component/DescriptionList/RowGap' }
  - { figmaVariable: '🧩 Component/DescriptionList/ColumnGap', use: tablet+ }
  - { figmaVariable: '🧩 Component/DescriptionList/Term/Color' }
  - { figmaVariable: '🧩 Component/DescriptionList/Term/Typo', use: composite typography token }
  - { figmaVariable: '🧩 Component/DescriptionList/Detail/Color' }
  - { figmaVariable: '🧩 Component/DescriptionList/Detail/Typo', use: composite typography token }
  - { figmaVariable: '🧩 Component/DescriptionList/Detail/MarginBottom', use: mobile only }
  - {
      literal: 'dd indent 40px (paddingLeft of the `dd` wrapper)',
      bind: false,
      note: 'browser default margin-inline-start, user decision 26.11.2026',
    }
  - { literal: 'variant root width 480', bind: false, note: 'rows fill their container in code' }
  - { figmaVariable: '🔗 Alias/🔤 Text/LetterSpacing/Text', use: 'letterSpacing of term and detail, bound' }
  - {
      figmaVariable: '🧩 Component/DescriptionList/Term/Typo/LineHeight',
      literal: '150%',
      bind: false,
      note: 'STRING variable, not bindable',
    }
  - {
      figmaVariable: '🧩 Component/DescriptionList/Term/Typo/TextTransform',
      literal: 'ORIGINAL',
      bind: false,
      note: 'textCase is not a bindable text field',
    }
  - {
      figmaVariable: '🧩 Component/DescriptionList/Term/Typo/TextDecoration',
      literal: 'NONE',
      bind: false,
      note: 'textDecoration is not a bindable text field',
    }
  - {
      figmaVariable: '🧩 Component/DescriptionList/Detail/Typo/LineHeight',
      literal: '150%',
      bind: false,
      note: 'STRING variable, not bindable',
    }
  - {
      figmaVariable: '🧩 Component/DescriptionList/Detail/Typo/TextTransform',
      literal: 'ORIGINAL',
      bind: false,
      note: 'textCase is not a bindable text field',
    }
  - {
      figmaVariable: '🧩 Component/DescriptionList/Detail/Typo/TextDecoration',
      literal: 'NONE',
      bind: false,
      note: 'textDecoration is not a bindable text field',
    }
# Foundation: all present (checked 26.11.2026); `Typo` is split into FontFamily / FontSize / FontWeight (bound) and the string variables above; `LetterSpacing` strings are not used.

anatomy: # parts and descriptions approved by user 26.11.2026
  - { letter: A, part: term, description: 'The name being described (dt).' }
  - { letter: B, part: detail, description: 'The description of the term (dd).' }
  - { letter: C, part: list, description: 'The description list container (dl.description-list).' }
anatomySectionNodeId: '6961:6151'
measurementsSectionNodeId: '6961:6152'

measurements: # triage approved by user 26.11.2026
  drawnOption: columns # layout
  options: [columns, stacked]
  behavior: { width: fill, overflow: wrap } # checked in the dev render at 320px
  rows:
    - {
        property: Row gap,
        set: DescriptionList,
        kind: spacing,
        show: drawn,
        values:
          {
            columns: { px: 4, token: '🧩 Component/DescriptionList/RowGap' },
            stacked: { px: 4, token: '🧩 Component/DescriptionList/RowGap' },
          },
      }
    - {
        property: Column gap,
        set: DescriptionListRow,
        kind: spacing,
        show: drawn,
        values: { columns: { px: 16, token: '🧩 Component/DescriptionList/ColumnGap' }, stacked: null },
      }
    - {
        property: Detail spacing,
        set: DescriptionListRow,
        kind: spacing,
        show: drawn,
        instance: stacked,
        values: { columns: null, stacked: { px: 16, token: '🧩 Component/DescriptionList/Detail/MarginBottom' } },
      }
    - {
        property: Text (term),
        set: DescriptionListRow,
        kind: type,
        show: drawn,
        value: '16 / 400 / 1.5',
        token: '🧩 Component/DescriptionList/Term/Typo',
      }
    - {
        property: Text (detail),
        set: DescriptionListRow,
        kind: type,
        show: drawn,
        value: '16 / 400 / 1.5',
        token: '🧩 Component/DescriptionList/Detail/Typo',
      }
    - {
        property: Detail indent,
        kind: spacing,
        show: skip,
        reason: 'browser default (40px), not set by the design system',
      }
    - { property: List margins, kind: spacing, show: skip, reason: 'outer margin (16px top and bottom)' }
    - { property: Row height, kind: size, show: skip, reason: 'derived from line height' }

states: none
device: 'breakpoint mixins: tablet() (two-column) and mobile() (detail margin) → Phase 1 step 5a'
```

## Decisions (user, 25.11.2026)

1. Breakpoint → `layout` variant `stacked | columns` (not Mobile/Desktop variable modes).
2. Rows → SLOT holding `DescriptionListRow` instances. A `dt` with several `dd` stays out: one row = one pair.
3. (26.11.2026) `columns` is the default `layout` on both sets.

## To check in Phase 3

- ~~Parent `layout` switch on slot content~~ → checked 26.11.2026: on an untouched instance all rows follow. Once a row's text is edited or a row is added, switching the list `layout` leaves every row unchanged; rows must be switched by hand.
- Stacked: `Detail/MarginBottom` applies to every `dd` except the last one; the last row must not get extra spacing.

## Phase 2 proposal (approved 25.11.2026)

Since 26.11.2026 the default is `columns` (decision 3); the table shows the original proposal.

| Set                  | Variant axes (default first)                                   | Count | Text properties                      |
| -------------------- | -------------------------------------------------------------- | ----- | ------------------------------------ |
| `DescriptionList`    | `layout` stacked · columns                                     | 2     | none (slot `rows`)                   |
| `DescriptionListRow` | `layout` stacked · columns; `last` false · true (stacked only) | 3     | `term` (`Term`), `detail` (`Detail`) |

Grid: `DescriptionList` one axis; row set sparse (no `columns` + `last=true`). No inverted sets.

- `rows` slot gap: `RowGap` (4px).
- Stacked row: term → detail gap `RowGap`; bottom padding `Detail/MarginBottom` (16px) when `last=false`. Rendered distance detail → next term: 20px.
- Columns row: two equal FILL children, gap `ColumnGap` (16px).
- Default fill: 3 rows matching the list `layout`, the third `last=true`. Designers set `last` by hand.
- Outer margin (16px 0 in the render) not drawn.

## Foundation check (25.11.2026)

Read-only listing of the Foundation file: the `List/Marker/*`, `List/Native/*` and `DescriptionList/*` variables named in this family exist (typography as split `Typo/*` variables), as does `Alias/Text/Color/Primary`.

## Findings (code)

1. The browser's default `dd` indent is not reset: every `dd` keeps `margin-inline-start: 40px` (dev render, 26.11.2026). Stacked: detail text starts 40px right of the term. Columns: detail starts 40px into its column (term column 433px, detail 393px at a 882px list). The Phase 2 proposal missed this. Figma draws it (user decision 26.11.2026); code unchanged.

2. A long unbroken word (for example a URL) widens its column: `1fr` keeps the word's minimum width, so the columns stop being equal and the list overflows (320px list: columns 47 / 393, scroll width 456). Normal text wraps in two equal columns. Not drawn in Figma; code unchanged.

## Phase 3 build

- Doc frame `DescriptionList Documentation` `6961:6145`, `Sets` `6961:6155`; template stacks hidden. Header filled (26.11.2026).
- First variant `6962:6530` (`layout=stacked, last=false`) in temporary `review` `6962:6529`: gap `RowGap`, bottom padding `Detail/MarginBottom`, `term` and `detail` (in `dd` wrapper, padding left 40). Text layers cloned from `UnorderedListItem`, `TNUM` / `LNUM` carried over.
- First row variant confirmed by user (26.11.2026).
- Set `DescriptionListRow` `6963:6609`, key `7ded240077856820d0684c38c37f35af6f676fcd`, stack `6963:6538`, text properties `term#6963:0`, `detail#6963:4`; variants stacked/false `6962:6530`, stacked/true `6963:6530`, columns `6963:6534`. Grid: rows `layout` → `last`, no column axis, no empty cells. `review` frame removed.
- `columns` uses Figma grid auto layout (2 equal flex columns, column gap `ColumnGap`): plain auto layout split the row 212 / 252 because of the `dd` padding. Checked at 480 and 800 wide (232 / 232, 392 / 392).
- First `DescriptionList` variant `6963:6618` (`layout=stacked`) in temporary `review` `6963:6617`: slot `rows#6963:8`, gap `RowGap`, preferred `DescriptionListRow`, 3 rows (`Term 1`–`3` / `Detail 1`–`3`, third `last=true`).
- First list variant confirmed by user (26.11.2026). Set `DescriptionList` `6964:6632`, stack `6964:6561`, slot `rows#6964:0`; variants stacked `6963:6618`, columns `6964:6538`. Grid: one `layout` lane, cells 512 × 228.
- Unused template stacks, `review` frames and the Variations section removed.
- `letterSpacing` bound to the Alias FLOAT on all 6 row text layers (skill rule committed 26.11.2026); list instances inherit it.
- Frame approved by user (26.11.2026).
- Copy me: section `6961:6149`, one default instance `6968:6528` (`layout=stacked`, fill width; `measurements:` not triaged yet), template placeholder removed. Confirmed by user (26.11.2026).
- Default changed to `columns` (user, 26.11.2026): both sets recreated, because Figma fixes option order at combine time; old sets removed after checking that nothing on a page used them (unpublished).
  - `DescriptionListRow` `6974:6562`, text properties `term#6974:0`, `detail#6974:4`; variants columns `6974:6550`, stacked/false `6974:6554`, stacked/true `6974:6558`.
  - `DescriptionList` `6974:6600`, slot `rows#6974:9`; variants columns `6974:6563`, stacked `6974:6577`. Node ids and keys above this entry are historical.
- Copy me now holds the `columns` instance `6974:6601`.
- Anatomy redrawn (26.11.2026): instance `6974:6616` (`layout=columns`), width 240. `A` centred on the first term, `B` on the first detail, `C` on the list's top right corner; leaders end 4px above the text. Confirmed by user (26.11.2026).
- Measurements (26.11.2026): drawing (`columns` 400 wide with row and column gap hatches and text boxes; second `stacked` instance with detail-spacing tints), sizes table (`columns` / `stacked`), behavior card (320 wide). Confirmed by user (26.11.2026).
