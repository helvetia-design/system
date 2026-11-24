# ds-logo → Figma mapping

> **Status (24.11.2026):** sets built, review pass (`logo.figma-validation.md`), Copy me and
> Measurements filled; Anatomy and Variations placeholders deleted. Documentation frame awaits user
> approval in Figma. Plan: `docs/plans/components/logo-figma-plan.md` (user decisions
> 23.11.2026 override its earlier sections).

```yaml
sets:
  - name: Logo
    figmaComponentKey: 0bc4598ea5a19140045482163be6e42d1b6bb4ec
    figmaMasterNodeId: '6669:1290'
  - name: LogoInverted
    figmaComponentKey: 4d71c67a8c0965710366e65652560f6568c954a6
    figmaMasterNodeId: '6669:1302'
figmaPage: Core / Media
figmaDocFrameNodeId: '6666:1289' # Logo Documentation
copyMeSectionNodeId: '6666:1293' # instance 6670:1253 of Logo size=base, no overrides
measurementsSectionNodeId: '6666:1296' # drawn instance in explicit Desktop mode (32px)

# anatomy: omitted on purpose — the only @part (`animated`, logo.tsx:36 ↔ part="animated" logo.tsx:236)
# never renders in any Figma variant because `animated` is excluded (user decision 2, 23.11.2026).
# Storybook ComponentParts still lists it. Figma 📐 Anatomy section: skipped.

props:
  - name: size
    type: enum
    options: [sm, lg] # unset = base
    figmaProperty: size
    figmaPropertyType: variant
    figmaOptions: [base, sm, lg] # code default first
  - name: inverted
    type: boolean
    default: false
    figmaPropertyType: top-level-split (rule 2) # Logo / LogoInverted
  - name: brand
    type: enum
    options: [helvetia, baloise]
    default: helvetia # config brand fallback
    figmaPropertyType: excluded
    note: 'Helvetia only (user decision 4, 23.11.2026). No Baloise sets.'
  - name: animated
    type: boolean
    default: false
    figmaPropertyType: excluded
    note: 'Lottie runtime effect, gated by global config (user decision 1, 23.11.2026).'

states: none # no :hover/:focus/:active in logo.host.scss
componentStates: {}
nested: []
slots: [] # JSDoc `@slot -` is not rendered (no <slot> in render()) — no text property
variations: [] # no show booleans — placeholder section deleted

device:
  responsiveBindings:
    - cssVar: [--ds-logo-size-base-mobile, --ds-logo-size-base-desktop]
      routingVariable: 🧩 Component/Logo/Size/Base/Device # sync-managed (DS - Foundation › Design Responsive Tokens), key 53459788b7594d6b705fdd6cb0f49f89e1210bad
      modes:
        mobile: 🧩 Component/Logo/Size/Base/Mobile # 24
        tablet: 🧩 Component/Logo/Size/Base/Tablet # synced alias; same value as Mobile (code has no @include tablet) # no @include tablet → falls through to mobile
        desktop: 🧩 Component/Logo/Size/Base/Desktop # 32
    - cssVar: [--ds-logo-size-sm-mobile, --ds-logo-size-sm-desktop]
      routingVariable: 🧩 Component/Logo/Size/SM/Device # sync-managed (DS - Foundation › Design Responsive Tokens), key bf3f1260dd7d4a98adde1a4e7734be2b1a35dbfc
      modes:
        mobile: 🧩 Component/Logo/Size/SM/Mobile # 24
        tablet: 🧩 Component/Logo/Size/SM/Tablet # synced alias; same value as Mobile (code has no @include tablet)
        desktop: 🧩 Component/Logo/Size/SM/Desktop # 24
    - cssVar: [--ds-logo-size-lg-mobile, --ds-logo-size-lg-desktop]
      routingVariable: 🧩 Component/Logo/Size/LG/Device # sync-managed (DS - Foundation › Design Responsive Tokens), key 1956abd58bddf8e0bc4b73db0e544745da935463
      modes:
        mobile: 🧩 Component/Logo/Size/LG/Mobile # 32
        tablet: 🧩 Component/Logo/Size/LG/Tablet # synced alias; same value as Mobile (code has no @include tablet)
        desktop: 🧩 Component/Logo/Size/LG/Desktop # 48
  risk: none — emitted by scripts/figma-sync (Device-eligible path), not hand-created

# figmaVariableId = id from css-token-lookup.mjs (Base.tokens.json). figmaVariableKey = the
# "DS - Foundation" library variable this file actually binds (importVariableByKeyAsync).
# The Base.tokens.json ids (13:xxxx) do NOT match the Foundation library's ids (20:xxxx) — see Notes.
tokens:
  - {
      cssVar: --ds-logo-color-primary,
      figmaVariable: 🧩 Component/Logo/Color/Primary,
      figmaVariableId: 'VariableID:13:3443',
      figmaVariableKey: 0f667c26a67fe01d8f3b49a4cd4fbfb174fbdfbc,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-color-inverted,
      figmaVariable: 🧩 Component/Logo/Color/Inverted,
      figmaVariableId: 'VariableID:13:3444',
      figmaVariableKey: 3996cf850ff029022f0275ac1b17f7f9a9bdd2bc,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-base-mobile,
      figmaVariable: 🧩 Component/Logo/Size/Base/Mobile,
      figmaVariableId: 'VariableID:13:3445',
      figmaVariableKey: f3dca744c9feca7158d797f65be4048268676c27,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-base-tablet,
      figmaVariable: 🧩 Component/Logo/Size/Base/Tablet,
      figmaVariableId: 'VariableID:13:3446',
      figmaVariableKey: 2e62915343f28658fd546b754a11588c014e3fdf,
      resolved: true,
      note: unused — tablet falls through to mobile,
    }
  - {
      cssVar: --ds-logo-size-base-desktop,
      figmaVariable: 🧩 Component/Logo/Size/Base/Desktop,
      figmaVariableId: 'VariableID:13:3447',
      figmaVariableKey: 7060dc3471f43b115162b82e6c1663f792bf2cea,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-sm-mobile,
      figmaVariable: 🧩 Component/Logo/Size/SM/Mobile,
      figmaVariableId: 'VariableID:13:3448',
      figmaVariableKey: 04156108b535188b7f963db7a46c1d8b293e8292,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-sm-desktop,
      figmaVariable: 🧩 Component/Logo/Size/SM/Desktop,
      figmaVariableId: 'VariableID:13:3450',
      figmaVariableKey: 99d69947ab03837ce80cf56bdcdf22cc54733a5e,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-lg-mobile,
      figmaVariable: 🧩 Component/Logo/Size/LG/Mobile,
      figmaVariableId: 'VariableID:13:3451',
      figmaVariableKey: b162541c2f7fb9d3009cf347fddbdabc11459544,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-lg-desktop,
      figmaVariable: 🧩 Component/Logo/Size/LG/Desktop,
      figmaVariableId: 'VariableID:13:3453',
      figmaVariableKey: 0e1df769da575857ff44a4719bd59ba7382f712d,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-base,
      figmaVariable: 🧩 Component/Logo/Size/Base/Device,
      figmaVariableId: 'VariableID:287:996',
      figmaVariableKey: 53459788b7594d6b705fdd6cb0f49f89e1210bad,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-sm,
      figmaVariable: 🧩 Component/Logo/Size/SM/Device,
      figmaVariableId: 'VariableID:287:997',
      figmaVariableKey: bf3f1260dd7d4a98adde1a4e7734be2b1a35dbfc,
      resolved: true,
    }
  - {
      cssVar: --ds-logo-size-lg,
      figmaVariable: 🧩 Component/Logo/Size/LG/Device,
      figmaVariableId: 'VariableID:287:998',
      figmaVariableKey: 1956abd58bddf8e0bc4b73db0e544745da935463,
      resolved: true,
    }

completeness:
  - node: component root # auto-layout, hugs `logo`, no fill
  - node: logo (frame 1084:204, aspect ratio locked) › path (vector, constraints SCALE) # Helvetia path from logo.icons.tsx
    fill: Component/Logo/Color/Primary (Logo) · Component/Logo/Color/Inverted (LogoInverted)
    height: Component/Logo/Size/<size>/Device (bound on `logo`)
    width: derived — aspect ratio locked at 1084:204 (no token, plan Q4 / user decision 3)

measurements: # confirmed (relayed by coordinator, 24.11.2026)
  drawnOption: base
  options: [base, sm, lg]
  # behavior: omitted — host fills its container but the logo itself is intrinsic; the Figma component
  # hugs the logo. No behavior card (confirmed 24.11.2026).
  rows:
    - property: Height
      kind: size
      group: context-dependent
      show: drawn
      instance: main
      source: logo.host.scss:20,43-50,79-93
      values:
        base: { px: { mobile: 24, tablet: 24, desktop: 32 }, token: 🧩 Component/Logo/Size/Base/Device }
        sm: { px: { mobile: 24, tablet: 24, desktop: 24 }, token: 🧩 Component/Logo/Size/SM/Device }
        lg: { px: { mobile: 32, tablet: 32, desktop: 48 }, token: 🧩 Component/Logo/Size/LG/Device }
    - property: Width
      kind: size
      group: derived
      show: skip
      reason: 'height × 1084/204 (logo.icons.tsx:13); no token — state the ratio in a note instead'
      values:
        base: { px: { mobile: 127.5, tablet: 127.5, desktop: 170 } }
        sm: { px: { mobile: 127.5, tablet: 127.5, desktop: 127.5 } }
        lg: { px: { mobile: 170, tablet: 170, desktop: 255 } }
    - property: Gap
      kind: spacing
      group: inner spacing
      show: skip
      reason: 'gap: 4px literal (logo.host.scss:36) only renders with `animated`, which is excluded'
      values:
        base: { px: 4 }
```

## Notes

### Responsive height — resolved (24.11.2026)

The three `Device` variables were synced by the token-engineer and published in DS - Foundation.
Imported here by key (ids in this consuming file differ from the source ids above — match by name,
import by key). Their Tablet mode aliases the `/Tablet` token (equal to Mobile in value).

Verified on an instance of the default variant (temporary wrapper, deleted), explicit mode per
Device mode: Mobile 127.53 × 24 · Tablet 127.53 × 24 · Desktop 170.04 × 32. Width follows height
(1084:204) — user decision 3 holds. Measured in the browser: 127.52 × 24 / 170.03 × 32.

### Variable ids

`figmaVariableId` values are the **source** file's ids (`Base.tokens.json`); a consuming file sees
different ids for library variables. Bind via `importVariableByKeyAsync(figmaVariableKey)`.

### Measurements (measured on the dev server, 375 / 800 / 1280 px)

Measured heights equal the tokens at every breakpoint; fill `#000D6E` (primary) / `#FFFFFF`
(inverted). Rows needing a decision:

- Height (context-dependent): extra drawn card per mode? Recommend **no** — one drawn card at
  `base`, `M / T / D` cells in the table.
- Width (derived): recommend **skip**, note the 1084:204 ratio on the card.
- Host width is `fill` (block-level grid) while the logo itself is intrinsic. Recommend a
  behavior note rather than a demo: the Figma component hugs the logo.
