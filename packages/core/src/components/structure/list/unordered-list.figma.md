# unordered list → Figma mapping

> **Status: all phases built and confirmed (26.11.2026). Phase 4 `blocked` — see `unordered-list.figma-validation.md`.** CSS-only family, class modifiers on `ul.unordered-list` (`list-native.styles.scss`). Mapping model local to the three native-list files (user decision 24.11.2026).
> Visual cases: `test/list-native.visual.html` (`unordered-list`, `inside-list`, `compact-list`).

```yaml
family: unordered-list
source: list-native.styles.scss
element: 'ul.unordered-list > li'
figmaPage: Core / Structure # own doc frame (user decision 25.11.2026)

sets: # built in Phase 3
  - { name: UnorderedList, figmaComponentKey: 0d6847401a503eaec7083d442c8a9b8dd5343413, figmaMasterNodeId: '6928:5836' }
  - {
      name: UnorderedListInverted,
      figmaComponentKey: 9983bf3b1e37195619cfe7a4a545561d628f4ce1,
      figmaMasterNodeId: '6929:5860',
    } # top-level split (rule 2)
  - {
      name: UnorderedListItem,
      figmaComponentKey: 0d28a7c4cac605d5c62dbaf72b4a81445edd8ec8,
      figmaMasterNodeId: '6917:6058',
    } # Figma-only helper (one li)
  - {
      name: UnorderedListItemInverted,
      figmaComponentKey: 65c096f3d97f4d4251ea46b7c3af0cdc35dd8417,
      figmaMasterNodeId: '6926:5990',
    }
figmaDocFrameNodeId: '6915:5749'
variations:
  - { set: UnorderedList, caption: has-icons, nodeId: '6929:5892', snapshot: unordered-list }

slots:
  - {
      set: [UnorderedList, UnorderedListInverted],
      figmaSlot: items,
      preferred: 'item set matching the inverted split',
      defaultFill: '4 × item, default variant',
    }

props:
  - {
      class: is-compact,
      set: [UnorderedList, UnorderedListInverted],
      figmaProperty: compact,
      figmaPropertyType: variant,
      figmaOptions: ['false', 'true'],
      default: 'false',
    }
  - {
      class: 'has-bullet-circle | has-icon-check | has-icon-close | (none)',
      set: 'item sets',
      figmaProperty: marker,
      figmaPropertyType: variant,
      figmaOptions: [disc, circle, check, close],
      default: disc,
    }
  - {
      class: 'has-bullet-<color> / is-<color>',
      set: 'item sets',
      figmaProperty: color,
      figmaPropertyType: variant,
      figmaOptions: [default, purple, red, yellow, green, success, warning, danger],
      default: default,
    }
  - {
      class: is-inside,
      set: 'item sets',
      figmaProperty: position,
      figmaPropertyType: variant,
      figmaOptions: [outside, inside],
      default: outside,
      note: 'inside exists for marker=disc only (finding 5)',
    }
  - { class: is-inverted, figmaPropertyType: top-level-split (rule 2) }
  - {
      class: has-icons + per-li classes,
      figmaPropertyType: excluded,
      note: 'mixed markers per item = composition of item variants, shown in Variations',
    }
variantCount: { UnorderedList: 2, UnorderedListInverted: 2, UnorderedListItem: 40, UnorderedListItemInverted: 40 }

icons: # masks, not ds-icon instances
  check: 'inline SVG mask (14px, 0.875rem), tinted by marker color'
  close: 'inline SVG mask (14px), tinted by marker color'
  circle: '12px (0.75rem) circle, radius Marker/Radius, default color green'

text:
  - { set: UnorderedListItem, part: li, figmaProperty: label }

tokens: # list-native-* shared with ordered-list; extra:
  - { figmaVariable: '🧩 Component/List/Marker/Radius', use: circle }
  - {
      figmaVariable: '🧩 Component/List/Marker/Color/{Primary,Green,Purple,Red,Yellow,Success,Warning,Danger,Inverted}',
      use: marker color per option,
    }
  - {
      literal: 'circle 12px / icon 14px / marker offset -20px / top 5px',
      bind: false,
      note: 'marked "ds-token-check: intentional" in SCSS: optical alignment',
    }
  # shared with ordered-list, listed by name for Phase 4:
  - { figmaVariable: '🧩 Component/List/Native/Indent', use: 'marker column width (outside)' }
  - { figmaVariable: '🧩 Component/List/Native/Item/Gap', use: 'gap between items' }
  - { figmaVariable: '🧩 Component/List/Native/Compact/Item/Gap', use: 'compact gap' }
  - { figmaVariable: '🔗 Alias/🔤 Text/Color/Primary', use: 'item text' }
  - { figmaVariable: '🧩 Component/List/Native/Inverted/Color/Text', use: 'inverted item text' }
  - { figmaVariable: '🧩 Component/Text/Typo/Paragraph/{FontFamily,FontSize,FontWeight,LineHeight}', use: 'item label' }
  - {
      literal: 'outside disc 6px, x 14, y 9',
      bind: false,
      note: 'browser-drawn bullet, matches the Linux visual baseline (user decision 26.11.2026)',
    }
  - { literal: 'inside disc 5.5px, x 0, y 9.25', bind: false, note: 'browser-drawn bullet, measured on macOS' }
  - { literal: 'inside disc: marker column 22px', bind: false, note: 'browser-drawn, measured on macOS' }
  - { literal: 'variant root width 480', bind: false, note: 'list and items fill their container in code' }
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
      figmaVariable: '🧩 Component/Text/Typo/Paragraph/TextTransform',
      literal: 'ORIGINAL',
      bind: false,
      note: 'textCase is not a bindable text field',
    }
  - {
      figmaVariable: '🧩 Component/Text/Typo/Paragraph/TextDecoration',
      literal: 'NONE',
      bind: false,
      note: 'textDecoration is not a bindable text field',
    }
anatomy: # parts and descriptions approved by user 26.11.2026
  - { letter: A, part: marker, description: 'The bullet or icon before each item.' }
  - { letter: B, part: item, description: 'One list entry (li).' }
  - { letter: C, part: list, description: 'The unordered list container (ul.unordered-list).' }
anatomySectionNodeId: '6915:5755'

measurements: # triage approved by user 26.11.2026
  drawnOption: 'false' # compact
  options: ['false', 'true']
  behavior: { width: fill, overflow: wrap } # carried over from ordered-list, not probed separately
  rows:
    - {
        property: Circle size,
        set: UnorderedListItem,
        kind: size,
        show: drawn,
        instance: circle,
        value: '12',
        token: null,
      }
    - {
        property: Icon size,
        set: UnorderedListItem,
        kind: size,
        show: drawn,
        instance: check,
        value: '14',
        token: null,
      }
    - {
        property: Gap,
        set: UnorderedList,
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
        set: UnorderedListItem,
        kind: spacing,
        show: drawn,
        values:
          {
            'false': { px: 32, token: '🧩 Component/List/Native/Indent' },
            'true': { px: 32, token: '🧩 Component/List/Native/Indent' },
          },
      }
    - {
        property: Text (item),
        set: UnorderedListItem,
        kind: type,
        show: drawn,
        value: '16 / 400 / 1.5',
        token: '🧩 Component/Text/Typo/Paragraph',
      }
    - { property: Disc size, kind: size, show: skip, reason: 'drawn by the browser, not set by the design system' }
    - {
        property: Marker offset,
        kind: spacing,
        show: skip,
        reason: 'only positions the bullet inside the indent (20px)',
      }
    - { property: List margins and browser padding, kind: spacing, show: skip, reason: 'outer spacing' }
    - { property: Item height, kind: size, show: skip, reason: 'derived from line height' }
measurementsSectionNodeId: '6915:5756'

states: none
device: none
```

## Findings (code)

1. **Fixed (25.11.2026):** `is-inside` set `--mod-_unordered-list-style-position` (stray underscore), so only `margin-left: 0` applied. Corrected in `list-native.styles.scss`; verified in the dev server (disc list: `list-style-position: inside`). Circle / check / close draw their marker with `::before` at -1.25rem, so `inside` does not move it against the text (see finding 5).
2. `is-inverted` sets `--mod-unordered-list-marker-color` on the `ul`, but `li.is-<color>` / `has-bullet-circle` set it on the `li` and win; so inverted + colored markers should keep their color (from reading the SCSS; not yet checked in a render. The visual case has a yellow circle inside an inverted list).
3. `disc` marker color: `::marker` takes `--_unordered-list-marker-color` (Primary).
4. Default circle color is green, not `Primary`, and the `default` color option means "Primary" for disc/check/close but "Green" for circle.

5. The design system does not reset the browser's list padding (`normalize.scss` resets it only inside `nav`), so a native list keeps `padding-left: 40px` on top of `margin-left: 32px`: outside text renders 72px from the container (40px with `is-inside`). Figma puts it at 32px. Left out of Figma as outer offset (user decision 26.11.2026); code unchanged.
6. Inverted: `success`, `warning` and `danger` markers keep their colour and are hard to see on the dark background (seen in the Figma render, 26.11.2026; contrast not measured).

## Open questions

1. ~~Page / doc frame~~ → decided (user, 25.11.2026): page `Core / Structure`, own doc frame per list.
2. ~~Colors~~ → decided (user, 25.11.2026): keep all 8 colors on every marker (4 × 8 = 32 item variants, 1:1 with code; circle `default` = circle `green`).
3. ~~Items~~ → decided (user, 25.11.2026): SLOT of `UnorderedListItem` instances; allows mixed markers per item.
4. ~~Fix finding 1 first?~~ → decided (user, 25.11.2026): fixed.
5. ~~Browser list padding (finding 6)~~ → decided (user, 26.11.2026): left out of Figma, like the outer margins.

## Phase 2 proposal (approved 25.11.2026)

Approved by the user 25.11.2026; the YAML above matches it.

| Set                                               | Variant axes (default first)                                                                                                                                  | Count                           | Text properties     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------- |
| `UnorderedList` / `UnorderedListInverted`         | `compact` false · true                                                                                                                                        | 2 each                          | none (slot `items`) |
| `UnorderedListItem` / `UnorderedListItemInverted` | `marker` disc · circle · check · close; `color` default · purple · red · yellow · green · success · warning · danger; `position` outside · inside (disc only) | 40 each (32 outside + 8 inside) | `label` (`Label`)   |

Grid per item set (changed 26.11.2026): rows `color`, columns `position` → `marker`; no inside column for circle / check / close.

- `compact` and `position` as in `ordered-list.figma.md`. Default fill: 4 × item of the matching inverted set.
- Item geometry, relative to a text start of 32px (marker column width): circle 12px and check / close 14px start at 12px, top 5px. Offset of the whole list in the browser: see finding 6.
- Inverted set: `color=default` is white (`Marker/Color/Inverted`) for disc / check / close, green for circle; named colors keep their color (finding 2 confirmed in the render).
- Disc dot is browser-drawn: literal 5.5px, left edge 14.5px before the text, vertically centred (measured in the dev render at 10× scale, 25.11.2026). Outside disc changed 26.11.2026 to 6px, 18px before the text, to match the Linux visual baseline.

Finding 5 (corrected 25.11.2026): `is-inside` with circle / check / close only moves the whole list 32px left (list margin 0); the `::before` marker stays 20px before the text, 20px **inside** the list's container. The earlier "outside the left edge" reading was wrong (it ignored finding 6). At item level it looks identical to outside, so those combinations stay out of Figma.

Deviation: inside disc, code wraps the second line under the marker; the Figma item wraps beside it.

## Foundation check (25.11.2026)

Read-only listing of the Foundation file: the `List/Marker/*`, `List/Native/*` and `DescriptionList/*` variables named in this family exist (typography as split `Typo/*` variables), as does `Alias/Text/Color/Primary`.

Open before Phase 3: typography variables for the `li` label (inherited from the page, not set by the list).

## Phase 3 build

- Doc frame `UnorderedList Documentation` `6915:5749`, `Sets` `6915:5759`, temporary `review` `6915:6396`; template stacks hidden. Header filled (25.11.2026).
- First variant `6915:6397` (`marker=disc, color=default, position=outside`), cloned from `OrderedListItem` outside: label bindings and `TNUM` / `LNUM` carried over.
- First variant confirmed by user (25.11.2026).
- Set `UnorderedListItem` `6917:6058`, key `0d28a7c4cac605d5c62dbaf72b4a81445edd8ec8`, stack `6917:5987`, text property `label#6917:0`, 40 variants. `TNUM` / `LNUM` on every label. `review` frame removed.
- Bullets: `circle` is a 12px rectangle with radius bound to `Marker/Radius`; `check` / `close` are a 14px `bullet` frame with the code's SVG path (`glyph`). Inside disc: marker column 22px (unbound), disc at x 0 (measured in the dev render).
- Grid (user decision 26.11.2026, replaces the approved position → colour columns): rows `color`, columns `position` → `marker`; 8 × 5 cells of 512 × 56, no empty cells. `position` grouping uses the template row bracket rotated -90° in `Column Labels` (strip 127 high).
- First `UnorderedListItemInverted` variant `6924:5764` in temporary `review` `6924:5763` (dark template backdrop). Header date set to 26.11.2026.
- First inverted variant confirmed by user (26.11.2026). Set `UnorderedListItemInverted` `6926:5990`, key `65c096f3d97f4d4251ea46b7c3af0cdc35dd8417`, stack `6926:5919`, text property `label#6926:0`, 40 variants, same grid. All labels bound to `Native/Inverted/Color/Text` with `TNUM` / `LNUM`. `review` frame removed.
- First `UnorderedList` variant `6927:5748` (`compact=false`) in temporary `review` `6927:5747`: slot `items#6927:0` with 4 × default item (`Item 1`–`4`), gap `Native/Item/Gap`, preferred `UnorderedListItem`. Confirmed by user (26.11.2026).
- Set `UnorderedList` `6928:5836`, key `0d6847401a503eaec7083d442c8a9b8dd5343413`, stack `6928:5765`, slot `items#6928:0`; variants compact=false `6927:5748`, compact=true `6928:5759`. Grid as `OrderedList`: one `compact` lane, cells 512 × 176.
- First `UnorderedListInverted` variant `6928:5851` in temporary `review` `6928:5850` (dark template backdrop). Confirmed by user (26.11.2026).
- Set `UnorderedListInverted` `6929:5860`, stack `6929:5789`, slot `items#6929:0`; variants compact=false `6928:5851`, compact=true `6929:5783`.
- Unused template stacks and `review` frames removed. Stack order: UnorderedList, UnorderedListInverted, UnorderedListItem, UnorderedListItemInverted.
- Variations: section `6915:5754`, one `UnorderedList` instance `6929:5892`, caption `has-icons` (instance id read back in Phase 4: `…;6929:5892`; items and labels as the `has-icons` list in the visual test; its `opacity-half` utility is not modelled).
- Copy me: section `6915:5753`, one default instance `6954:5809` (fill width, as `ordered-list`; `measurements:` not triaged yet), template placeholder removed. Confirmed by user (26.11.2026).
- Anatomy (26.11.2026): instance `6955:5870`, width 113, labels `List item 1`–`4`. `A` on the bullet, `B` centred on the item label, `C` on the list's top right corner; leaders end 4px above each part's visible top (`A` 3px lower than `B` / `C`). Confirmed by user (26.11.2026).
- Measurements (26.11.2026): drawing (320-wide list, 3 gap hatches, indent, item text box; extra one-item lists `circle` and `check` with icon-size overlays), sizes table (full token name in each cell's layer name), behavior card (220 wide). Confirmed by user (26.11.2026).
