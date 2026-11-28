# progress-bar → Figma mapping

Plan: `docs/plans/components/ds-progress-bar-figma-plan.md`. Gate (human approved): 10 variants,
`value` not a variant, line fixed at 50%, no `full` variant, track fills its container, default
dark/primary.

```yaml
sets:
  - name: ProgressBar
    figmaComponentKey: b546424fa74a44fc64050eedcc66c3b2552c0cac
    figmaMasterNodeId: '7009:1991' # 10 variants, default 7009:1989
figmaPage: Core / Indicators
figmaDocFrameNodeId: '7009:1337' # "Progress Bar Documentation"
header:
  lead: 'Progress bar displays a track with a filled line that shows the completion of a task as a percentage value.' # JSDoc lead, progress-bar.tsx
  links:
    storybook: https://helvetia-design.vercel.app/?path=/docs/components-indicators-progress-bar-progress-bar--progress-bar
    toky: https://helvetia-toky.vercel.app?filter=progressbar # Toky matches ?filter= as a substring of the normalized token name (apps/toky/src/tokens/filter.ts); tokens are 🧩 Component/ProgressBar/* → "progressbar", not "progress-bar"
    github: https://github.com/helvetia-design/system/tree/main/packages/core/src/components/indicators/progress-bar
checkpoints:
  defaultVariant: approved # node 7009:1989 (background=dark, color=primary), approved 27.11.2026
  fullSet: pending # 10 variants built; review verdict pass (progress-bar.figma-validation.md)
  copyMe: pending # Section 7009:1341, instance 7016:1316 — awaiting human review
  anatomy: approved # Section 7009:1343 — diagram (default variant, marker-A on line, unlettered marker-track "–" on empty track) + legend (A · line, – · track); approved 27.11.2026
  measurements: approved # Section 7009:1344 — drawing (1 height, 2 radius), sizes table (2 rows), behavior card (value 50 instance · value 100 illustration frame 7020:1096 · stretched instance); approved 27.11.2026
  # line resize verified manually in the Figma UI (API cannot override it) — hence the value-100 bar is a token-bound frame, not an instance
copyMe:
  sectionNodeId: '7009:1341'
  instanceNodeId: '7016:1316' # default variant, no property overrides; layoutSizingHorizontal FILL (track = 100% of container)

anatomy:
  - letter: A
    part: line
    description: 'The filled progress indicator element.'
  # host track is not a @part; anatomy shows it as an unlettered "track" callout (plan §8 Q3)

props:
  - name: background
    type: enum
    options: [light, dark]
    default: dark
    figmaProperty: background
    figmaPropertyType: variant
    figmaOptions: [dark, light]
  - name: color
    type: enum
    options: [primary, purple, yellow, red, green]
    default: primary
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [primary, purple, yellow, red, green]
  - name: value
    type: number # 0–100, clamped, default 0
    figmaPropertyType: excluded # continuous; line layer fixed at 50% of track, designers resize `line` per instance
  # internal: .is-full (value 100) squares the line's right corners — not a variant; note in 📏 behavior card
  # internal: .is-animated — transition only, excluded
  # no consumer-authored text (aria-label generated); no slots; no interaction states

nested: [] # none
slots: [] # none

figmaStructure: # default variant as built
  component: 'track = the COMPONENT itself, 320 × 4, no auto-layout, clipsContent'
  line: 'RECTANGLE `line`, 160 wide (50%), constraints horizontal SCALE / vertical STRETCH; width overridable per instance'

tokens: # libraryKey = DS - Foundation published copy; bind via importVariableByKeyAsync
  - {
      cssVar: --ds-progress-bar-height,
      figmaVariable: 🧩 Component/ProgressBar/Height,
      figmaVariableId: 'VariableID:13:2886',
      libraryKey: acf2980a5414ded1d286b4f92c1e8f1d12586193,
      binds: [track.height, line.height],
      px: 4,
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-radius,
      figmaVariable: 🧩 Component/ProgressBar/Radius,
      figmaVariableId: 'VariableID:13:2885',
      libraryKey: 6f2f63169d0b25fca843245da37681df21f83361,
      binds: [line.topRightRadius, line.bottomRightRadius],
      px: 9999,
      resolved: true,
    }
  # track fill — per background × color (code: progress-bar.host.scss :host(.is-<color>.is-<background>))
  - {
      cssVar: --ds-progress-bar-primary-dark-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Primary/Dark/Color/Background,
      figmaVariableId: 'VariableID:13:2888',
      libraryKey: 86a6b00b7f2f7c7a45a02c7df3c97677b043b131,
      binds: [track.fill @ dark/primary],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-primary-light-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Primary/Light/Color/Background,
      figmaVariableId: 'VariableID:13:2887',
      libraryKey: 270379f95ac502108f64e2a017535af583a98ad2,
      binds: [track.fill @ light/primary],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-purple-dark-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Purple/Dark/Color/Background,
      figmaVariableId: 'VariableID:13:2894',
      libraryKey: 17b4ed7695a4e119034604022f12bb6c72af5f28,
      binds: [track.fill @ dark/purple],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-purple-light-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Purple/Light/Color/Background,
      figmaVariableId: 'VariableID:13:2893',
      libraryKey: 382abe04d76007ffcc9f71c9be52b933cb7e8959,
      binds: [track.fill @ light/purple],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-yellow-dark-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Yellow/Dark/Color/Background,
      figmaVariableId: 'VariableID:13:2891',
      libraryKey: b5d5e7474749d9793467bf3737aac17253740a64,
      binds: [track.fill @ dark/yellow],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-yellow-light-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Yellow/Light/Color/Background,
      figmaVariableId: 'VariableID:13:2890',
      libraryKey: d435f987d79b396bc7df42fce54114b124fbc9b7,
      binds: [track.fill @ light/yellow],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-red-dark-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Red/Dark/Color/Background,
      figmaVariableId: 'VariableID:13:2897',
      libraryKey: 1804853dea6e3c2685d132dfc8278d331e1cd202,
      binds: [track.fill @ dark/red],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-red-light-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Red/Light/Color/Background,
      figmaVariableId: 'VariableID:13:2896',
      libraryKey: cd16fed234712547c3bef5b38adacf19eb3a8202,
      binds: [track.fill @ light/red],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-green-dark-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Green/Dark/Color/Background,
      figmaVariableId: 'VariableID:13:2900',
      libraryKey: 7be8c03fe3646085be0070ed2d1a866c4c84995d,
      binds: [track.fill @ dark/green],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-green-light-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Green/Light/Color/Background,
      figmaVariableId: 'VariableID:13:2899',
      libraryKey: b0a8145f6614d595bc0506ba75fc7b378e543c18,
      binds: [track.fill @ light/green],
      resolved: true,
    }
  # line fill — per color, independent of background
  - {
      cssVar: --ds-progress-bar-primary-line-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Primary/Line/Color/Background,
      figmaVariableId: 'VariableID:13:2889',
      libraryKey: 09f3b57012abc4332c549652599f554a0447a8a3,
      binds: [line.fill @ primary],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-purple-line-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Purple/Line/Color/Background,
      figmaVariableId: 'VariableID:13:2895',
      libraryKey: 73a93a821d6d7059022a2c32c7b5f929597d91de,
      binds: [line.fill @ purple],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-yellow-line-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Yellow/Line/Color/Background,
      figmaVariableId: 'VariableID:13:2892',
      libraryKey: fd152fba3c44ae29f81f5e3c92832a7b9746a67d,
      binds: [line.fill @ yellow],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-red-line-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Red/Line/Color/Background,
      figmaVariableId: 'VariableID:13:2898',
      libraryKey: ce15343159107662fdbef2c5684fd0f315745247,
      binds: [line.fill @ red],
      resolved: true,
    }
  - {
      cssVar: --ds-progress-bar-green-line-color-background,
      figmaVariable: 🧩 Component/ProgressBar/Green/Line/Color/Background,
      figmaVariableId: 'VariableID:13:2901',
      libraryKey: 9f11e288535e2c8ae568935b457a2d4e989e8725,
      binds: [line.fill @ green],
      resolved: true,
    }

measurements: # measured on dev server 27.11.2026 (localhost:4000, progress-bar.visual.html, all 10 variants + value 0/99/100); matches tokens — triage confirmed by human 27.11.2026
  status: built # Section 7009:1344
  sectionNodeId: '7009:1344'
  options: [] # no size axis
  behavior:
    width: fill # host width: 100% (1137.6px in a 1280 viewport, 321.6px at 400)
    overflow: none
    line: 'width = value% of track in px, recomputed on resize (569/1137.6 at 50; 161/321.6 after resize); value 100 squares right corners (radius 0)'
  rows:
    - {
        property: Height,
        kind: size,
        group: fixed,
        show: drawn,
        instance: main,
        source: progress-bar.host.scss:34,
        values: { default: { px: 4, token: 🧩 Component/ProgressBar/Height } },
      } # track 4, line 4 — all variants
    - {
        property: Radius (line,
        right corners),
        kind: shape,
        group: fixed,
        show: drawn,
        instance: main,
        source: progress-bar.host.scss:45-46,
        values: { default: { px: 9999, token: 🧩 Component/ProgressBar/Radius } },
      } # computed 0 9999 9999 0
    - {
        property: Width (line),
        kind: size,
        group: behavior,
        show: skip,
        reason: 'value-driven (value % of track), not a token; behavior card',
        values: { default: { px: '50%' } },
      }
    - {
        property: Radius (track),
        kind: shape,
        group: fixed,
        show: skip,
        reason: 'computed 0, no token — nothing to draw',
        values: { default: { px: 0 } },
      }
    - {
        property: Margin / Padding,
        kind: spacing,
        group: outer margin,
        show: skip,
        reason: 'computed 0',
        values: { default: { px: 0 } },
      }
  measuredColors: # computed rgb, matches Figma's resolved library values for the default variant
    track:
      {
        dark/primary: '246,246,246',
        dark/purple: '225,217,255',
        dark/yellow: '255,236,188',
        dark/red: '255,215,215',
        dark/green: '203,242,236',
        light/*: '255,255,255',
      }
    line: { primary: '0,13,110', purple: '108,34,115', yellow: '178,74,0', red: '153,23,45', green: '27,89,81' }
```

## Notes

- Light-background track colors are per color (code changed after the plan: `:host(.is-<color>.is-light)`),
  so the plan's "light = primary-light for every color" (§6) is superseded; all five light ids above.
- Labeled set: columns `background` (dark, light), rows `color`; cells 352×36; 1 col + 4 row dividers.
  No `show` booleans → no `variations:`; the template's Variations placeholder was removed.
- Light-background tracks resolve to white (code too) — invisible against the white set fill; the code's
  visual test shows them on a tinted background.
- 100% (`is-full`) squares the line's right corners — goes in the 📏 behavior card, not a variant.
