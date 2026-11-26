# description list → Figma mapping

> **Status: Phase 3 started (26.11.2026): doc frame created, first `DescriptionListRow` variant awaiting confirmation.** CSS-only family: `dl.description-list` with `dt` (term) and `dd` (detail), from `description-list-native.styles.scss`. Mapping model local to the three native-list files (user decision 24.11.2026).
> Visual case: `test/list-native.visual.html` (`description-list`).

```yaml
family: description-list
source: description-list-native.styles.scss
element: 'dl.description-list > dt, dd'
figmaPage: Core / Structure # own doc frame (user decision 25.11.2026)

sets:
  - name: DescriptionList # no inverted style in code → no ...Inverted set
  - name: DescriptionListRow # Figma-only helper (one dt + one dd), no counterpart in code

props: # no class modifiers in code; the only variation is the breakpoint
  - {
      set: [DescriptionList, DescriptionListRow],
      figmaProperty: layout,
      figmaPropertyType: variant,
      figmaOptions: [stacked, columns],
      default: stacked,
      note: 'user decision 25.11.2026; exception to the skill rule against a device variant',
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
  - {
      figmaVariable: '🧩 Component/DescriptionList/Term/Typo/LineHeight',
      literal: '150%',
      bind: false,
      note: 'STRING variable, not bindable',
    }
  - {
      figmaVariable: '🧩 Component/DescriptionList/Term/Typo/LetterSpacing',
      literal: '0%',
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
      figmaVariable: '🧩 Component/DescriptionList/Detail/Typo/LetterSpacing',
      literal: '0%',
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
# Foundation: all present (checked 26.11.2026); `Typo` is split into FontFamily / FontSize / FontWeight (bound) and the string variables above.

states: none
device: 'breakpoint mixins: tablet() (two-column) and mobile() (detail margin) → Phase 1 step 5a'
```

## Decisions (user, 25.11.2026)

1. Breakpoint → `layout` variant `stacked | columns` (not Mobile/Desktop variable modes).
2. Rows → SLOT holding `DescriptionListRow` instances. A `dt` with several `dd` stays out: one row = one pair.

## To check in Phase 3

- Rows added or edited by a designer may keep their own `layout`; verify what a parent `layout` switch does to slot content.
- Stacked: `Detail/MarginBottom` applies to every `dd` except the last one; the last row must not get extra spacing.

## Phase 2 proposal (approved 25.11.2026)

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

## Phase 3 build

- Doc frame `DescriptionList Documentation` `6961:6145`, `Sets` `6961:6155`; template stacks hidden. Header filled (26.11.2026).
- First variant `6962:6530` (`layout=stacked, last=false`) in temporary `review` `6962:6529`: gap `RowGap`, bottom padding `Detail/MarginBottom`, `term` and `detail` (in `dd` wrapper, padding left 40). Text layers cloned from `UnorderedListItem`, `TNUM` / `LNUM` carried over.
