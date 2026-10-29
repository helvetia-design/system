# tag → Figma mapping

> **Status: mapping confirmed (Phase 2).** Decisions: Q1 trim right padding by 4px when
> closable; Q2/Q3 `disabled` and `invalid` excluded. **Phase 3 done** — 152 variants built;
> `closable` became a variant axis (a boolean toggle can't change padding), approved by the user.

```yaml
figmaComponentKey: '5518c31141a638838239fe2f4de0ab5b2ae100f6' # Tag component set, node 2153:540, 152 variants
figmaPage: '⏳ Core / Indicator / Tag' # page node 2152:2
figmaDocumentation:
  light: '2154:236' # "Tag Documentation" frame (no inverted axis → single frame)
  specs: '2154:375'
figmaCollection: Design Tokens # brand-agnostic binding

props:
  - name: color
    type: enum
    options: [
        primary,
        disabled,
        success,
        info,
        warning,
        danger,
        purple,
        red,
        yellow,
        green,
        purple-dark,
        red-dark,
        yellow-dark,
        green-dark,
        purple-light,
        red-light,
        yellow-light,
        green-light,
      ] # TAG_COLORS — code default (unset) = implicit "default"
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [
        default,
        primary,
        disabled,
        success,
        info,
        warning,
        danger,
        purple,
        red,
        yellow,
        green,
        purple-dark,
        red-dark,
        yellow-dark,
        green-dark,
        purple-light,
        red-light,
        yellow-light,
        green-light,
      ] # 19 — same layers, only bg/text tokens swap
  - name: size
    type: enum
    options: [sm, md, lg] # TAG_SIZES — code default (unset) = implicit "base"
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, md, lg]
  - name: closable
    type: boolean
    default: false
    figmaProperty: closable
    figmaPropertyType: variant # not a boolean toggle: closable=true also trims right padding by 4px
  - name: (default slot)
    type: string
    figmaProperty: Label
    figmaPropertyType: instance-text-override # placeholder "Tag" on every variant
  - name: disabled
    type: boolean
    figmaProperty: null
    figmaPropertyType: excluded # sets class is-disabled = same look as color=disabled (verified live)
  - name: invalid
    type: boolean
    figmaProperty: null
    figmaPropertyType: excluded # sets .is-invalid, but no SCSS rule styles it
  - name: position
    type: enum
    figmaProperty: null
    figmaPropertyType: excluded # only affects alignment inside ds-card, not the tag itself

states: null # no :hover/:focus/:active on the tag host; close's own states live in Close

nested:
  - childTag: ds-close
    childMappingFile: ../../actions/close/close.figma.md
    figmaComponentKeys:
      primary: '1992:47' # Close/Primary — used for light-background colors
      inverted: '1992:93' # Close/Inverted — primary, disabled, *-dark (per $close-inverted)
    sizeMapping: { base: base, md: base, lg: base, sm: sm } # sizeSmall() sets close sm tokens

tokens:
  - { cssVar: --ds-tag-radius, figmaVariable: 🧩 Component/Tag/Radius, resolved: true }
  - { cssVar: --ds-tag-font-family, figmaVariable: 🧩 Component/Tag/FontFamily, resolved: true }
  - cssVar: --ds-tag-line-height
    figmaVariable: 🧩 Component/Tag/LineHeight
    resolved: true
    bound: false # percent-semantic FLOAT — applied as literal PERCENT (API limitation)
  - {
      cssVar: '--ds-tag-size-{base,sm,md,lg}-gap',
      figmaVariable: '🧩 Component/Tag/Size/{Base,SM,MD,LG}/Gap',
      resolved: true,
    }
  - { cssVar: '--ds-tag-size-{…}-padding-x', figmaVariable: '🧩 Component/Tag/Size/{…}/Padding/X', resolved: true }
  - { cssVar: '--ds-tag-size-{…}-padding-y', figmaVariable: '🧩 Component/Tag/Size/{…}/Padding/Y', resolved: true }
  - { cssVar: '--ds-tag-size-{…}-font-size', figmaVariable: '🧩 Component/Tag/Size/{…}/FontSize', resolved: true }
  - { cssVar: '--ds-tag-size-{…}-font-weight', figmaVariable: '🧩 Component/Tag/Size/{…}/FontWeight', resolved: true }
  - {
      cssVar: '--ds-tag-<color>-color-background',
      figmaVariable: '🧩 Component/Tag/<Color>/Color/Background',
      resolved: true,
      note: 19/19 incl. Default,
    }
  - {
      cssVar: '--ds-tag-<color>-color-text',
      figmaVariable: '🧩 Component/Tag/<Color>/Color/Text',
      resolved: true,
      note: 19/19; also drives the Close icon color,
    }
  - cssVar: --tag-close-mr (calc(0.25rem * -1))
    figmaVariable: null
    resolved: false
    resolution: 'Confirmed: when closable=true, trim right padding by 4px (literal, unbound)'
  - attribute: letter-spacing / text-decoration
    figmaVariable: null
    resolved: n/a # not set and not inherited meaningfully — Figma defaults (0 / none) match browser defaults

specs: # built on closable=true instances; radius omitted (pill, see DOCUMENTATION-TEMPLATE.md)
  base:
    - { kind: spacing, label: Padding L, px: 12, token: 🧩 Component/Tag/Size/Base/Padding/X }
    - {
        kind: spacing,
        label: Padding R,
        px: 8,
        token: 🧩 Component/Tag/Size/Base/Padding/X,
        calc: '(12px) − 4 · closable only',
      }
    - { kind: spacing, label: Padding Y, px: 4, token: 🧩 Component/Tag/Size/Base/Padding/Y }
    - { kind: spacing, label: Gap, px: 4, token: 🧩 Component/Tag/Size/Base/Gap }
    - { kind: type, label: Type, px: 16, token: 🧩 Component/Tag/Size/Base/FontSize, callout: 16px Bold }
  sm: same shape, Size/SM/* tokens (12 / 8 / 0 / 4, type 14px Regular)
  md: same shape, Size/MD/* tokens (16 / 12 / 8 / 4, type 16px Bold)
  lg: same shape, Size/LG/* tokens (24 / 20 / 12 / 4, type 16px Bold)
```

## Proposed variant grid — 2-axis case

`color` and `size` both re-skin the same layers (pill frame + label text + optional Close
instance), so both are variant properties → **one component set `Tag`**. Built: 19 colors × 4 sizes × closable false/true = 152 variants;
grid rows = color, columns = size × closable.

```
Tag
                base    sm      md      lg
default        [cell]  [cell]  [cell]  [cell]
primary        [cell]  [cell]  [cell]  [cell]
disabled       [cell]  [cell]  [cell]  [cell]
success        …
info           …
warning        …
danger         …
purple / red / yellow / green
purple-dark / red-dark / yellow-dark / green-dark
purple-light / red-light / yellow-light / green-light
```

Only `closable=true` variants contain a nested Close instance. For the 6 colors in `$close-inverted` it's an instance of `Close/Inverted`, otherwise
`Close/Primary`; size `sm` uses Close `size=sm`, everything else Close `size=base`. Close icon
fill overridden to the variant's `Tag/<Color>/Color/Text` (code sets `--close-color-icon`).

## Open questions (need your decision before Phase 3)

1. **Close negative margin** — code pulls the close button in by `calc(0.25rem * -1)` (−4px), a
   hardcoded literal with no token. Figma auto-layout can't do negative margin on one child.
   Options: (a) reduce the tag's right padding by 4px when closable (literal, unbound), (b)
   ignore it (close sits 4px further out than in code), (c) add a token first.
2. **`disabled`** — has no styling of its own (`.is-disabled` is unstyled); its only effect is
   hiding the close button. The grey look comes from `color="disabled"`. Proposal: exclude it
   (designers use `color=disabled` + `closable=false`). Alternative: a `state` axis with
   `default/disabled` that just forces the close off — doubles the set to 152 variants for no
   visual difference.
3. **`invalid`** — sets a class but nothing styles it. Proposal: exclude, and flag as a possible
   code gap separately.

## Phase 3b — documentation page

Cloned from `ds-close`'s canonical frame (`1993:2`), then adapted. The cloned `Close/Primary` set
was removed straight away so no Close components were duplicated.

- Outer frame widened from 900 to 1300px so the 8-column Main components table fits.
- Copy me shows `color=default, size=base, closable=false`, the code default.
- Variants uses the `size` axis: base / sm / md / lg.
- Main components: rows are the 19 colors; columns are size × closable (`Base`, `Base + close`, …).
  The real `Tag` set is an `ABSOLUTE` child of `Tables row` and is locked.
- Specs has one card per size, each using a `closable=true` instance so the gap and the trimmed
  right padding are visible. Revised after review against TapTap's Tag specs: Padding Y is
  highlighted top and bottom, the side rows read `Padding L` / `Padding R`, there's no radius (pill
  rule), and the label carries a purple `Spec/Callout` (`16px Bold` etc.). Gap marker sits below so
  the callout has room above.
- **New shared annotation:** `Spec/Callout` (🧰 Annotations page, node `2157:2`).
- **Shared annotation change:** added a `kind=type` variant to `Spec/Legend item` (🧰 Annotations
  page, node `2154:776`, literal purple swatch), as the template asks the first text component to
  do. The cloned variant had lost its Value/Label/Token property references, so they were rewired.

## Phase 4 — review against visual baselines (advisory)

Compared by eye with `tag-sizes`, `tag-colors` and `tag-closeable` (Desktop Chrome):

- **Matches:** size proportions, the weights per size (sm Regular, others Bold), all 18 color
  pairs, white text on primary and the `-dark` colors, the Close icon following the text color,
  and the pill radius (`--ds-alias-radius-rounded` → 9999).
- **`disabled` prop — checked live with `getComputedStyle` (dev server, `tag.visual.html`):**
  `<ds-tag disabled closable>` gets class `is-disabled`, which is the **same class
  `color="disabled"` produces**. So it picks up the `$colors` rule `.is-disabled` (background
  `rgb(116,116,116)`, text `rgb(255,255,255)`), and the close button isn't rendered. Phase 1's
  claim that `.is-disabled` is unstyled was wrong: the prop's look comes from this class
  collision. Figma's `color=disabled, closable=false` already matches it exactly, so excluding the
  prop (Q2) loses nothing visually.
- **The `tag-colors` baseline PNG is out of date:** it shows the disabled tag light grey with grey
  text, but the live page renders it dark grey with white text. Re-baselining it is a separate,
  user-triggered step (`/update-screenshots`).
- **Not covered:** icon-in-tag content (the baselines put a `ds-icon` in the slot). The Figma
  label is text-only.
