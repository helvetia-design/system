# pagination → Figma mapping

> **Status: done (19.11.2026)** — Phases 1–8 built and confirmed by the user; validation pass (one accepted deviation: base caret 16px). Decisions from earlier
> runs: `.claude/skills/ds-code-to-figma/rebuild-decisions.md` → "Pagination".

```yaml
sets: # default set first
  - name: Pagination # variant unset: numbered Buttons + ellipsis
    figmaComponentKey: 9c6fa47a0d853f76be1688caa717f346fe3c355e
    figmaMasterNodeId: '6356:955'
  - name: PaginationDots # variant=dots, totalPages > 5: counter badge "x / y"
    figmaComponentKey: c184587805d3330c418dea09e7e0152d081a8a87
    figmaMasterNodeId: '6356:1030'
  - name: PaginationDotsRow # variant=dots, totalPages <= 5: row of dot markers
    figmaComponentKey: dbb5018a7b309e69f5f6a9945ab39d0a3f3c14dc
    figmaMasterNodeId: '6356:1104'
figmaPage: Core / Navigation
figmaDocFrameNodeId: '6354:1383'

anatomy: # visible parts lettered by the drawing, left to right; wrappers legend-only (user decision 19.11.2026)
  - letter: A
    part: previous
    description: 'The button that navigates to the previous page.'
  - letter: B
    part: ellipsis
    description: 'The ellipsis item shown when pages are collapsed.'
  - letter: C
    part: page
    description: 'Each page number button.'
  - letter: D
    part: next
    description: 'The button that navigates to the next page.'
  - letter: E
    part: navigation
    description: 'The nav landmark wrapping all pagination controls (no visual box).'
    marker: false # no fill / border — legend only
  - letter: F
    part: list
    description: 'The list containing the page and ellipsis items (no visual box).'
    marker: false
# One instance (default variant, natural width). C sits on the active page 5 (the only visible button box).
# Every @part matches a part="…" in render(). The dots counter (.is-counter) has no @part.

props:
  - name: variant
    type: enum
    options: [dots]
    default: '(unset → numbered buttons)'
    figmaPropertyType: top-level-split (rule 1) # different layers: Pagination / PaginationDots / PaginationDotsRow
    note: 'dots: totalPages <= 5 → dot row (ul.dots + prev/next), > 5 → counter "value / totalPages" (pagination.tsx hasBasicNavigationButtons)'
  - name: size
    type: enum
    options: [sm]
    default: '(unset → base)'
    figmaProperty: size
    figmaPropertyType: variant # Pagination set only; dots sets always render prev/next at sm
    figmaOptions: [base, sm]
  - name: disabled
    type: boolean
    default: false
    figmaPropertyType: component state (blocked) # see componentStates
  - name: align
    type: enum
    options: [end, start]
    figmaPropertyType: excluded # only visible when the consumer stretches the host (rebuild-decisions.md)
  - name: value
    type: number
    figmaPropertyType: excluded # content — representative content per set (rebuild-decisions.md)
  - name: totalPages
    type: number
    figmaPropertyType: excluded # content; picks dot row vs. counter → set split
  - name: pageRange
    type: number
    figmaPropertyType: excluded # content
  - name: label
    type: string
    figmaPropertyType: excluded # aria-label of the nav only, not rendered as text
  - name: textPrevious
    type: string
    figmaPropertyType: excluded # aria-label / title of the previous button only
  - name: textNext
    type: string
    figmaPropertyType: excluded # aria-label / title of the next button only
  - name: sticky
    type: boolean
    figmaPropertyType: excluded # position: sticky — layout, no static visual
  - name: top
    type: number
    figmaPropertyType: excluded # sticky offset
  - name: pageNumber
    figmaPropertyType: excluded # generated — no property (Button label text per page)
  - name: ellipsisText
    figmaPropertyType: excluded # generated — no property ("…")
  - name: counterText
    figmaPropertyType: excluded # generated — no property ("<value>" bold, "/", "<totalPages>")

states: null # pagination.host.scss has no :hover / :focus / :active; Buttons carry their own state per instance
componentStates:
  disabled: { figmaProperty: disabled, options: [false, true], interactive: false, source: ':host(.is-disabled) { pointer-events: none } (pagination.host.scss:126); previous / next not rendered (pagination.tsx !this.disabled); page Buttons is-disabled; ellipsis → Ellipsis/Color/Text/Disabled' }

nested:
  - childTag: ds-button # forwarded button.style.scss on native <button>s, not a <ds-button> element
    childMappingFile: ../../actions/button/button.figma.md
    figmaComponentKey: f728631ba607a4e4d0519f950152963a105f2f98
    note: 'square instance override (show label off for previous / next; page keeps label = page number). page: active → color=primary, else ghost; disabled → disabled=true. previous / next: ghost, disabled=true at first / last page. size: Pagination size; dots sets always sm.'
  - childTag: ds-icon
    childMappingFile: ../../media/icon/icon.figma.md
    figmaComponentKey: d04070c1ade27f4f45c16b6f93329ab3325eb206
    iconSlot:
      codeProp: '(fixed) caret-left / caret-right' # inside the Button instance's `icon` swap — not a pagination property
      acceptsBrandIcon: false
      size: 'follows Button square size — base 24 (Icon/Size/MD), sm 14 (Icon/Size/SM); measured'
      colorSource:
        default: 'Button/Color/Ghost/Base/Text (--icon-color)'
        disabled: 'Button/Color/Disabled/Base/Text (first / last page)'

variations: [] # no show boolean — placeholder deleted (Phase 3, 19.11.2026)

tokens: # names checked in the Foundation file (19.11.2026)
  - { cssVar: --ds-pagination-size-base-gap, figmaVariable: 🧩 Component/Pagination/Size/Base/Gap, resolved: true } # 8
  - { cssVar: --ds-pagination-size-sm-gap, figmaVariable: 🧩 Component/Pagination/Size/SM/Gap, resolved: true } # 4
  - { cssVar: --ds-pagination-size-base-ellipsis-width, figmaVariable: 🧩 Component/Pagination/Size/Base/Ellipsis/Width, resolved: true } # 48 — static, see Notes
  - { cssVar: --ds-pagination-size-sm-ellipsis-width, figmaVariable: 🧩 Component/Pagination/Size/SM/Ellipsis/Width, resolved: true } # 32
  - { cssVar: --ds-pagination-ellipsis-color-text-base, figmaVariable: 🧩 Component/Pagination/Ellipsis/Color/Text/Base, resolved: true }
  - { cssVar: --ds-pagination-ellipsis-color-text-disabled, figmaVariable: 🧩 Component/Pagination/Ellipsis/Color/Text/Disabled, resolved: true }
  - { cssVar: --ds-pagination-ellipsis-typo-*, figmaVariable: 🧩 Component/Pagination/Ellipsis/Typo/*, resolved: true } # 16 (→ Device/Text/Size/Base/Device) / Bold / 150%
  - { cssVar: --ds-pagination-elevation-sticky, figmaVariable: 🧩 Component/Pagination/Elevation/Sticky, resolved: true, bind: false } # z-index, no Figma property
  - { cssVar: --ds-pagination-dots-radius, figmaVariable: 🧩 Component/Pagination/Dots/Radius, resolved: true } # 4
  - { cssVar: --ds-pagination-dots-color-background, figmaVariable: 🧩 Component/Pagination/Dots/Color/Background, resolved: true }
  - { cssVar: --ds-pagination-dots-color-text, figmaVariable: 🧩 Component/Pagination/Dots/Color/Text, resolved: true }
  - { cssVar: --ds-pagination-dots-gap, figmaVariable: 🧩 Component/Pagination/Dots/Gap, resolved: true } # 2
  - { cssVar: --ds-pagination-dots-min-height, figmaVariable: 🧩 Component/Pagination/Dots/MinHeight, resolved: true } # 32
  - { cssVar: --ds-pagination-dots-min-width, figmaVariable: 🧩 Component/Pagination/Dots/MinWidth, resolved: true } # 63
  - { cssVar: --ds-pagination-dots-max-width, figmaVariable: 🧩 Component/Pagination/Dots/MaxWidth, resolved: true } # 88
  - { cssVar: --ds-pagination-dots-margin-inline, figmaVariable: 🧩 Component/Pagination/Dots/MarginInline, resolved: true } # 20 → nav item spacing in the dots sets
  - { cssVar: --ds-pagination-dots-counter-typo-*, figmaVariable: 🧩 Component/Pagination/Dots/Counter/Typo/*, resolved: true } # 16 / Regular / 150%
  - { cssVar: --ds-pagination-dots-counter-value-typo-*, figmaVariable: 🧩 Component/Pagination/Dots/CounterValue/Typo/*, resolved: true } # 16 / Bold / 150%
  - { cssVar: --ds-pagination-dots-marker-size, figmaVariable: 🧩 Component/Pagination/Dots/Marker/Size, resolved: true } # 10
  - { cssVar: --ds-pagination-dots-marker-radius, figmaVariable: 🧩 Component/Pagination/Dots/Marker/Radius, resolved: true } # 9999
  - { cssVar: --ds-pagination-dots-marker-color-background-base, figmaVariable: 🧩 Component/Pagination/Dots/Marker/Color/Background/Base, resolved: true }
  - { cssVar: --ds-pagination-dots-marker-color-background-selected, figmaVariable: 🧩 Component/Pagination/Dots/Marker/Color/Background/Selected, resolved: true }
# Text attributes per text node (ellipsis, counter value, counter rest), Spinner / Button precedent:
#   family literal `Baloise Create Text` (variable holds the CSS name — TODO.md); size …/Typo/FontSize;
#   weight …/Typo/FontWeight (fontStyle); line height 150%, letter spacing 0, decoration none, transform none: literals (STRING variables).

completeness: # every node × attribute → token
  ellipsis text: { family: literal, size: Ellipsis/Typo/FontSize, weight: Ellipsis/Typo/FontWeight, lineHeight: literal 150%, letterSpacing: literal 0, decoration: literal none, color: Ellipsis/Color/Text/Base | Disabled }
  ellipsis frame: { width: Size/<Base|SM>/Ellipsis/Width, height: hug (line height 24) }
  list: { gap: Size/<Base|SM>/Gap }
  nav: { gap: 0 (none declared) — dots sets: Dots/MarginInline }
  counter badge: { fill: Dots/Color/Background, radius: Dots/Radius, minWidth: Dots/MinWidth, maxWidth: Dots/MaxWidth, minHeight: Dots/MinHeight, gap: Dots/Gap }
  counter value text: { family: literal, size/weight: Dots/CounterValue/Typo/*, color: Dots/Color/Text, rest: literals }
  counter "/" + total text: { family: literal, size/weight: Dots/Counter/Typo/*, color: Dots/Color/Text, rest: literals }
  dot row pill: { same as counter badge }
  dot marker: { size: Dots/Marker/Size, radius: Dots/Marker/Radius, fill: Dots/Marker/Color/Background/Base | Selected }
  buttons: Button instances (own tokens)
# No gaps.

measurements: # confirmed by the user 19.11.2026 (dots sets added on user request)
  drawnOption: base
  options: [base, sm]
  behavior:
    width: fill # 600px wrapper → 600; content centered (#nav justify-content: center)
    overflow: overflow # no wrap / truncate; 0px wrapper → 240px content on desktop (finding)
  rows:
    - { set: Pagination, property: Button size, kind: size, group: fixed, show: drawn, instance: main, source: 'Button square (button.style.scss)', note: 'marker on the active (primary) page — ghost buttons are invisible', values: { base: { px: 48, token: 🧩 Component/Button/Size/Base/MinHeight }, sm: { px: 32, token: 🧩 Component/Button/Size/SM/MinHeight } } }
    - { set: Pagination, property: Ellipsis width, kind: size, group: context-dependent, show: drawn, instance: main, source: 'pagination.host.scss:110 (+ @include tablet :114)', values: { base: { px: { mobile: 32, tablet: 48, desktop: 48 }, token: 🧩 Component/Pagination/Size/Base/Ellipsis/Width }, sm: { px: 32, token: 🧩 Component/Pagination/Size/SM/Ellipsis/Width } } }
    - { set: Pagination, property: Gap, kind: spacing, group: inner spacing, show: drawn, instance: main, source: 'pagination.host.scss:93', values: { base: { px: 8, token: 🧩 Component/Pagination/Size/Base/Gap }, sm: { px: 4, token: 🧩 Component/Pagination/Size/SM/Gap } } }
    - { set: Pagination, property: Text (ellipsis), kind: type, group: typography, show: drawn, instance: main, source: 'pagination.host.scss:112', values: { base: { px: 16, weight: 700, lineHeight: 1.5, family: BaloiseCreateText, token: 🧩 Component/Pagination/Ellipsis/Typo } } }
    - { set: PaginationDotsRow, property: Marker size, kind: size, group: fixed, show: drawn, instance: dot-row, source: 'pagination.host.scss:192', values: { base: { px: 10, token: 🧩 Component/Pagination/Dots/Marker/Size } } }
    - { set: PaginationDotsRow, property: Min width, kind: size, group: limit, show: drawn, instance: dot-row, source: 'pagination.host.scss:164', note: 'binds — 3 dots + 2 gaps = 34 < 63', values: { base: { px: 63, token: 🧩 Component/Pagination/Dots/MinWidth } } }
    - { set: PaginationDotsRow, property: Min height, kind: size, group: limit, show: drawn, instance: dot-row, source: 'pagination.host.scss:165', values: { base: { px: 32, token: 🧩 Component/Pagination/Dots/MinHeight } } }
    - { set: PaginationDotsRow, property: Gap, kind: spacing, group: inner spacing, show: drawn, instance: dot-row, source: 'pagination.host.scss:178', values: { base: { px: 2, token: 🧩 Component/Pagination/Dots/Gap } } }
    - { set: PaginationDotsRow, property: Margin X, kind: spacing, group: inner spacing, show: drawn, instance: dot-row, source: 'pagination.host.scss:167', note: 'margin-inline on the pill — spacing to previous / next inside the component, not an outer margin', values: { base: { px: 20, token: 🧩 Component/Pagination/Dots/MarginInline } } }
    - { set: PaginationDotsRow, property: Radius, kind: shape, group: fixed, show: drawn, instance: dot-row, source: 'pagination.host.scss:169', values: { base: { px: 4, token: 🧩 Component/Pagination/Dots/Radius } } }
    - { set: PaginationDotsRow, property: Hit area (marker), kind: size, group: hit area, show: drawn, instance: hit-area, source: 'pagination.host.scss:192', note: '10 × 10 < 24 × 24 (WCAG 2.5.8) — finding. Own extra instance "Hit area" (the dot row'''s bottom is full of the 8 / 9 callouts): Spec/Outline on the middle dot (label hidden) + Spec/Leader kind=size with the number (user decision 19.11.2026)', values: { base: { px: 10 } } }
    - { set: PaginationDots, property: Min width, kind: size, group: limit, show: drawn, instance: counter, source: 'pagination.host.scss:164', note: 'binds — "10 / 20" content is ~45px', values: { base: { px: 63, token: 🧩 Component/Pagination/Dots/MinWidth } } }
    - { set: PaginationDots, property: Text (counter value), kind: type, group: typography, show: drawn, instance: counter, source: 'pagination.host.scss:187', values: { base: { px: 16, weight: 700, lineHeight: 1.5, family: BaloiseCreateText, token: 🧩 Component/Pagination/Dots/CounterValue/Typo } } }
    - { set: PaginationDots, property: Text (counter), kind: type, group: typography, show: drawn, instance: counter, source: 'pagination.host.scss:171', values: { base: { px: 16, weight: 400, lineHeight: 1.5, family: BaloiseCreateText, token: 🧩 Component/Pagination/Dots/Counter/Typo } } }
    - { set: PaginationDots, property: Max width, kind: size, group: limit, show: skip, reason: 'never binds with realistic page counts — "999 / 999" stays below 88px; finding', values: { base: { px: 88, token: 🧩 Component/Pagination/Dots/MaxWidth } } }
    - { set: PaginationDots, property: 'Min height, gap, margin X, radius', kind: size, group: fixed, show: skip, reason: 'same tokens and values as the dot row — shown once there', values: { base: { px: '32 / 2 / 20 / 4' } } }
    - { set: PaginationDotsRow, property: Max width, kind: size, group: limit, show: skip, reason: 'never binds — 5 dots + 4 gaps = 58 < 88', values: { base: { px: 88, token: 🧩 Component/Pagination/Dots/MaxWidth } } }
    - { set: PaginationDotsRow, property: Marker radius, kind: shape, group: fixed, show: skip, reason: 'circle (9999)', values: { base: { px: 9999, token: 🧩 Component/Pagination/Dots/Marker/Radius } } }
    - { set: Pagination, property: Height, kind: size, group: derived, show: skip, reason: 'Button size covers it', values: { base: { px: 48 }, sm: { px: 32 } } }
    - { set: Pagination, property: 'Icon size, Button radius / border / label typo', kind: size, group: fixed, show: skip, reason: 'nested Button — documented in the Button Measurements', values: { base: { px: '24 / 4 / 2 / 16' }, sm: { px: '14 / 4 / 2 / 14' } } }
    - { set: Pagination, property: 'Ellipsis height, previous / next ↔ list gap', kind: size, group: derived, show: skip, reason: 'line height 24 / nothing declared (0)', values: { base: { px: '24 / 0' } } }
```

## Phase 2 — grouping (approved by the user 19.11.2026)

Case: **top-level split** (rule 1, `variant` + `totalPages` change the layers) → 3 sets, each a
2-axis grid. No `state` axis (no interaction styles in `pagination.host.scss`; Buttons keep their
own `state` per instance), so `disabled` (blocked component state) is the column axis.
`rebuild-decisions.md` recorded `state = default · disabled`; the current mapping table puts
component states in their own `disabled: false / true` axis instead.

```
Pagination            disabled=false     disabled=true
  size=base           ‹ 1 … 4 5 6 … 10 ›   1 … 4 5 6 … 10
  size=sm             ‹ 1 … 4 5 6 … 10 ›   1 … 4 5 6 … 10

PaginationDots        disabled=false     disabled=true
                      ‹ 10 / 20 ›          10 / 20

PaginationDotsRow     disabled=false     disabled=true
                      ‹ ○ ● ○ ›            ○ ● ○
```

Count: 2 × 2 + 2 + 2 = **8** (≤ 500).

- **Properties:** `size` (`base · sm`, Pagination only), `disabled` (`false · true`, all sets).
  No text, boolean, swap or slot properties.
- **Generated text, no property:** page numbers (Button label per instance), "…", counter
  `10` / `/` / `20`.
- **Content:** Pagination `value=5, totalPages=10, pageRange=1`; PaginationDots `value=10,
totalPages=20`; PaginationDotsRow `value=2, totalPages=3` (`rebuild-decisions.md`).
- **Buttons:** Button instances, `square` instance override. previous / next: `color=ghost`,
  `show label` off, `show icon` on, `icon` = `IconCaretLeft` / `IconCaretRight`. page: label = page
  number, active page `color=primary`, others `ghost`. `size` = Pagination size; dots sets `sm`.
  `disabled=true` variants: previous / next hidden, every page Button `disabled=true`, ellipsis →
  `Ellipsis/Color/Text/Disabled`; dots sets only hide previous / next (code has no other change).
- **Dot markers / counter / ellipsis:** plain frames and text bound to the Pagination tokens above.
- **Variations:** none (no `show` boolean) — placeholder deleted; no snapshot cases to add.

## Notes

- **Base caret icon 16 instead of 24 (user decision 19.11.2026):** square Buttons render the icon
  at `Icon/Size/MD` (24) in code; the Button instance's nested `icon` frame size can't be overridden
  through the Plugin API, so `Pagination size=base` previous / next keep `Icon/Size/Base` (16) with
  `Icon/Padding/MD`. Known deviation, follow-up in `TODO.md` (Button run).
- **Dot gap (user decision 19.11.2026):** 2px (`Dots/Gap`) as in code; the committed dot-row snapshot
  still shows the old ~8px gap and needs `/update-screenshots`.

- **Ellipsis width (user decision 19.11.2026):** static per size — `base` → `Size/Base/Ellipsis/Width`
  (48), `sm` → `Size/SM/Ellipsis/Width` (32). Code switches to the SM token on mobile
  (`@include tablet` only), and on mobile JS (`isMobile`) also renders every Button `sm` with
  `pageRange=1`, so Figma `base` = tablet / desktop and mobile looks like `sm` (except the 8px gap).
  No `…/Ellipsis/Width/Device` routing variable exists in Foundation; no `device:` section.
- **Measured** on the dev server (:4011), 1280px and 375px viewports; every measured value matches its token.
- **Findings (not fixed):** JSDoc declares `@slot -` but `render()` has no `<slot>`; dot markers are
  10 × 10 (below WCAG 2.5.8 24 × 24) with no hover / focus style; the counter max width (88) never
  binds; the pagination overflows its container below ~240px (no wrap). Built against the
  pre-#313 `pagination.tsx`; `main` (merged 19.11.2026) adds the disabled guard and DOM order — no visual difference.
