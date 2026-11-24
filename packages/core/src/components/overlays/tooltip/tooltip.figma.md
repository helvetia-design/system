# tooltip → Figma mapping

```yaml
sets: # built 19.11.2026, approved by the user in Figma
  - name: Tooltip # single COMPONENT (not a set), no variant axis — user decision 19.11.2026
    figmaComponentKey: 153b91930d626839058d24ce00415275c0f74f04
    figmaMasterNodeId: '6350:2080' # in Column + Box (16px cell padding, so the shadow isn't clipped)
figmaPage: Core / Overlays
figmaDocFrameNodeId: '6350:1383'
# variations: none — no show booleans; the Variations placeholder was deleted

anatomy: # final letters, left to right on the Anatomy drawing (Phase 7, 19.11.2026) — same as DOM order
  - letter: A
    part: container
    description: 'The floating tooltip container element.'
  - letter: B
    part: content
    description: 'The inner content wrapper element.'

props:
  - name: content # default slot, text-only → text property named after its @part
    type: string
    figmaProperty: content
    figmaPropertyType: text
    node: text # text layer inside the content frame (the frame is the `content` part)
    default: Content
  - name: placement
    type: enum
    options: [top, right, bottom, left]
    figmaPropertyType: excluded # no arrow — only positions the box and sets the fly-in direction
  - name: reference
    type: string
    figmaPropertyType: excluded # identifier, no visual effect
  - name: offset
    type: number
    figmaPropertyType: excluded # trigger distance — documented as a Measurements table row
  - name: contentWidth
    type: number
    figmaPropertyType: excluded # consumer px max-width, no token — instance override (fixed width + wrapping text); Measurements behavior card
  - name: open
    type: boolean
    figmaPropertyType: excluded # visibility only; Figma always shows the open tooltip

# No interaction states (no :hover/:focus/:active on the tooltip) and no component-state props.
# No nested DS components, no slots taking instances, no show booleans → no variations.

tokens:
  - { cssVar: --ds-tooltip-color-background, figmaVariable: 🧩 Component/Tooltip/Color/Background, resolved: true } # container fill
  - { cssVar: --ds-tooltip-color-text, figmaVariable: 🧩 Component/Tooltip/Color/Text, resolved: true } # content text fill
  - { cssVar: --ds-tooltip-radius, figmaVariable: 🧩 Component/Tooltip/Radius, resolved: true } # container corner radius, 4
  - {
      cssVar: --ds-tooltip-shadow,
      figmaVariable: '🧩 Component/Tooltip/Shadow/{OffsetX,OffsetY,Blur,Spread,Color}',
      resolved: true,
    } # container drop shadow 0 0 10 0
  - { cssVar: --ds-tooltip-padding-x, figmaVariable: 🧩 Component/Tooltip/PaddingX, resolved: true } # content padding left/right, 12
  - { cssVar: --ds-tooltip-padding-y, figmaVariable: 🧩 Component/Tooltip/PaddingY, resolved: true } # content padding top/bottom, 8
  - { cssVar: --ds-tooltip-offset, figmaVariable: 🧩 Component/Tooltip/Offset, resolved: true, bind: false } # trigger distance, 8 — documented only
  - { cssVar: --ds-tooltip-z-index, figmaVariable: 🧩 Component/Tooltip/ZIndex, resolved: true, bind: false } # no Figma equivalent
  - { cssVar: '--ds-tooltip-text-*', figmaVariable: '🧩 Component/Tooltip/Text/*', resolved: true } # → Component/Text/Typo/Small: family Text, size Device/Text/Size/SM (14 desktop), weight Regular, line height 1.5, letter spacing 0, decoration none; family / line height / letter spacing literal (STRING variables, as in Button — TODO.md)

completenessChecklist:
  container: { fill: Tooltip/Color/Background, radius: Tooltip/Radius, shadow: Tooltip/Shadow/*, width: hug }
  content: { paddingX: Tooltip/PaddingX, paddingY: Tooltip/PaddingY }
  text (content):
    {
      family: Tooltip/Text/FontFamily (literal),
      size: Tooltip/Text/FontSize,
      weight: Tooltip/Text/FontWeight,
      lineHeight: Tooltip/Text/LineHeight (literal 150%),
      letterSpacing: Tooltip/Text/LetterSpacing (literal 0),
      decoration: Tooltip/Text/TextDecoration (none),
      color: Tooltip/Color/Text,
    }

measurements: # confirmed by the user 19.11.2026, measured on the dev server at 1024px
  drawnOption: base
  options: []
  behavior:
    width: hug # grows to max-content (787px for long text at 1024px) — no default max width
    overflow: wrap # only when contentWidth is set
    label: 'Hug ↔ (contentWidth: Wraps)'
  rows:
    - {
        property: Padding X,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: main,
        source: tooltip.host.scss:118,
        values: { base: { px: 12, token: 🧩 Component/Tooltip/PaddingX } },
      }
    - {
        property: Padding Y,
        kind: spacing,
        group: inner spacing,
        show: drawn,
        instance: main,
        source: tooltip.host.scss:117,
        values: { base: { px: 8, token: 🧩 Component/Tooltip/PaddingY } },
      }
    - {
        property: Radius,
        kind: shape,
        group: fixed,
        show: drawn,
        instance: main,
        source: tooltip.host.scss:76,
        values: { base: { px: 4, token: 🧩 Component/Tooltip/Radius } },
      }
    - {
        property: Text (content),
        kind: type,
        group: typography,
        show: drawn,
        instance: main,
        source: tooltip.host.scss:123,
        values:
          {
            base: { px: 14, weight: 400, lineHeight: 1.5, family: BaloiseCreateText, token: 🧩 Component/Tooltip/Text },
          },
      }
    - {
        property: Offset,
        kind: spacing,
        group: outer margin,
        show: table,
        source: tooltip.tsx resolveOffset / tooltip.host.scss:38,
        reason: 'distance to the trigger — no trigger inside the component to draw it against (user decision 19.11.2026)',
        values: { base: { px: 8, token: 🧩 Component/Tooltip/Offset } },
      }
    - {
        property: Width,
        kind: size,
        group: derived,
        show: skip,
        reason: 'content + padding',
        values: { base: { px: 123 } },
      }
    - {
        property: Height,
        kind: size,
        group: derived,
        show: skip,
        reason: 'padding + line-height',
        values: { base: { px: 37 } },
      }
    - {
        property: Max height,
        kind: size,
        group: limit,
        show: skip,
        reason: 'calc(100svh - 8rem), no token — never reached by realistic content',
        values: { base: { px: 640 } },
      }
    - {
        property: Shadow,
        kind: shape,
        group: fixed,
        show: skip,
        reason: 'not a measurement kind — Dev Mode shows the bound Tooltip/Shadow/* variables',
        values: { base: { token: 🧩 Component/Tooltip/Shadow } },
      }
```

## Notes

- **Finding (code follow-up):** no default max width — without `contentWidth`, long text keeps
  growing (787px at a 1024px viewport). Only `max-height: calc(100svh - 8rem)` limits the content.
- `contentWidth` is a plain px number with no token, so it's an instance override in Figma (fixed
  width, text `HEIGHT` auto-resize), not a property.
- The container's own `color` / font (16px, primary) is never rendered — the content part sets
  its own typography and color.
- **Single component (user decision 19.11.2026):** no axes, so `Tooltip` is a plain `COMPONENT`,
  not a set. The template's labels, grid and Inverted stack were deleted; `Column + Box` got 16px
  padding (the cell rule) so the parent frames' `clipsContent` doesn't cut off the shadow.
- **Shadow:** `showShadowBehindNode = true` — with it off, the square `content` frame masked the
  shadow outside the rounded corners. Invisible under the opaque fill, like CSS `box-shadow`.
- **Offset is not part of the component** (user decision 19.11.2026): it's applied by
  floating-ui, depends on placement, and lives in the composition. Table-only row ⑤.
- **Nested in Button and Close (19.11.2026)** through the Figma-only `TooltipAnchor` set
  (`🧰 Utilities` → `Helper components` section, key `7acb7dea…`, `placement` bottom · top · right · left, gap bound to
  `Tooltip/Offset`): a `show tooltip` boolean on their hover variants (see
  `button.figma.md` / `close.figma.md` → `nested:`, `build-mechanics.md` → Tooltip anchor).
  **Follow-up:** `ds-hint` also renders `ds-tooltip` but has no Figma build yet.
