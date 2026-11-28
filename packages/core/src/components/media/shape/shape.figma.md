# shape → Figma mapping

```yaml
sets: # filled in by ds-figma-component-set
  - name: Shape
    figmaComponentKey: c313e240cce512269d70a78395e0ec82eeedbd22
    figmaMasterNodeId: '7027:1892' # COMPONENT_SET, 96 variants, stack 'Shape' (7025:1704) in Sets; frame approval PENDING
figmaPage: Core / Media
figmaDocFrameNodeId: '7025:1693' # Shape Documentation, Core / Media › Documentation Frames (appended last)
defaultVariant: # built first, awaiting human approval
  nodeId: '7025:2002' # color=purple, variation=1, rotation=0 — first variant of set 7027:1892
  approved: true # human, relayed by orchestrator 28.11.2026

anatomy:
  - letter: A
    part: shape
    description: 'The SVG that draws the active variation, filling the host square. Always present.' # Anatomy legend 7025:1699 (approval pending); @part shape, shape.tsx:18 ↔ part="shape" shape.tsx:69

props:
  - name: color
    type: enum
    options: [green, green-light, red, red-light, purple, purple-light, yellow, yellow-light]
    default: purple
    figmaProperty: color
    figmaPropertyType: variant
    figmaOptions: [purple, purple-light, green, green-light, red, red-light, yellow, yellow-light] # gate-approved
  - name: variation
    type: enum
    options: ['1', '2', '3']
    default: '1'
    figmaProperty: variation
    figmaPropertyType: variant
    figmaOptions: ['1', '2', '3'] # one vector per option, path data shape.data.tsx
  - name: rotation
    type: enum
    options: ['0', '90', '180', '270']
    default: '0'
    figmaProperty: rotation
    figmaPropertyType: variant
    figmaOptions: ['0', '90', '180', '270'] # host transform: rotate() → inner vector rotation (not bindable)
# No string props, no text slot, no generated text. No slots. No nested DS components.

states: {} # none — no :hover/:focus, host aria-hidden (shape.tsx:68)
nested: []

device:
  responsiveBindings:
    - cssVar: --ds-shape-size
      routingVariable: 🧩 Component/Shape/Size/Device # sync-managed (Device-eligible), not hand-built
      figmaVariableId: VariableID:410:999
      libraryKey: e0ac0fee7ccf5dedcfb95e84eab7d9fbfeb8db58
      modes:
        mobile: { variable: 🧩 Component/Shape/Size/Mobile, id: VariableID:410:996, libraryKey: deb23a7cb31647e5264a497e8770246ae099298f, px: 66 }
        tablet: { variable: 🧩 Component/Shape/Size/Tablet, id: VariableID:410:997, libraryKey: 45ef69f0d8b1947eed82055654996b14df8c3f49, px: 120 }
        desktop: { variable: 🧩 Component/Shape/Size/Desktop, id: VariableID:410:998, libraryKey: 9401f1efbc86a3b4fe3f1bdc423587c665a7d3b8, px: 198 }

tokens: # ids from css-token-lookup.mjs (Base.tokens.json); libraryKey from DS - Foundation (published)
  - { cssVar: --ds-shape-color-purple, figmaVariable: 🧩 Component/Shape/Color/Purple, figmaVariableId: 'VariableID:410:1000', libraryKey: 50c1bcdda5ced0ac23392978a1d35fe711649119, resolved: true, use: fill color=purple (default) }
  - { cssVar: --ds-shape-color-purple-light, figmaVariable: 🧩 Component/Shape/Color/PurpleLight, figmaVariableId: 'VariableID:410:1001', libraryKey: 1f85654ac2f58f7d3b84628670a4dc071ba11da0, resolved: true, use: fill color=purple-light }
  - { cssVar: --ds-shape-color-green, figmaVariable: 🧩 Component/Shape/Color/Green, figmaVariableId: 'VariableID:410:1002', libraryKey: 79c1dfd683ce1c3334920f419ee24325568fe4cf, resolved: true, use: fill color=green }
  - { cssVar: --ds-shape-color-green-light, figmaVariable: 🧩 Component/Shape/Color/GreenLight, figmaVariableId: 'VariableID:410:1003', libraryKey: 361741e2f83508c65964422c1432e8830081f400, resolved: true, use: fill color=green-light }
  - { cssVar: --ds-shape-color-red, figmaVariable: 🧩 Component/Shape/Color/Red, figmaVariableId: 'VariableID:410:1004', libraryKey: a1501c8931f22b6c89694a08eecb9f864cfe4c4b, resolved: true, use: fill color=red }
  - { cssVar: --ds-shape-color-red-light, figmaVariable: 🧩 Component/Shape/Color/RedLight, figmaVariableId: 'VariableID:410:1005', libraryKey: 8e157c1fcc63c6151286144c110bb9b40791abcc, resolved: true, use: fill color=red-light }
  - { cssVar: --ds-shape-color-yellow, figmaVariable: 🧩 Component/Shape/Color/Yellow, figmaVariableId: 'VariableID:410:1006', libraryKey: 5270bd765f90bd37c38426872a26cf88d575384e, resolved: true, use: fill color=yellow }
  - { cssVar: --ds-shape-color-yellow-light, figmaVariable: 🧩 Component/Shape/Color/YellowLight, figmaVariableId: 'VariableID:410:1007', libraryKey: 3b67661a3c89e61c2ca2ad15213b4f8c9ba5617b, resolved: true, use: fill color=yellow-light }
  - { cssVar: --ds-shape-size, figmaVariable: 🧩 Component/Shape/Size/Device, figmaVariableId: 'VariableID:410:999', libraryKey: e0ac0fee7ccf5dedcfb95e84eab7d9fbfeb8db58, resolved: true, use: width + height (see device:) }
  # rotation 0/90/180/270deg — geometry, no token; set per variant.

variations: [] # no show <name> booleans — Variations placeholder deleted

sections: # doc frame 7025:1693 › Documentation 7025:1696
  copyMe: { section: '7025:1697', instance: '7029:1672', approved: true } # human 28.11.2026 # default variant, 0 overrides
  anatomy: { section: '7025:1699', approved: true } # human 28.11.2026 # 1 marker (A · shape), 1 legend item
  measurements: { section: '7025:1700', approved: true } # human 28.11.2026 # drawing: Shape @ Desktop mode (198) + Spec/Dimension #1; table row-1 Size/Device M 66 · T 120 · D 198; behavior card deleted
  review: pass # shape.figma-validation.md, 28.11.2026
# Visual-test snapshots (test/shape.visual.html): basic, colors, variation-1, variation-2, variation-3 (all rotations).

measurements: # measured 28.11.2026, dev server, Chromium 375/800/1440 — triage approved by human (one Size row, M/T/D cells, no per-mode cards)
  options: [] # no table axis
  drawnColor: purple
  rows:
    - property: Size (w = h)
      kind: size
      group: context-dependent # fixed size, value per Device mode
      show: drawn
      instance: main
      source: shape.host.scss:39-40 (width/height: var(--_shape-size) ← --ds-shape-size, :20)
      values:
        base: { px: { mobile: 66, tablet: 120, desktop: 198 }, token: 🧩 Component/Shape/Size/Device }
    # Dropped (undeclared/zero): padding, margin, border, radius, gap. No text. No limits.
    # No behavior row: size never changes with content/container. part=shape svg = host box (66/120/198).
    # Fill measured rgb(108,34,115) = #6C2273 = Global Purple/6 ✓ token.
    # Rotation measured matrix() for 90/180/270, bbox unchanged (square).
```

## Notes

- Family of one: `render()` nests no `ds-*`; no sub-components.
- Size is a Device-mode binding, not a variant (gate decision). The sync already manages
  `🧩 Component/Shape/Size/Device` (`variableId.device`), so no hand-built routing variable and no
  stale-alias risk.
- Figma build: component = square frame (clips content, like host `overflow: hidden`), width/height
  bound to Size/Device; child vector `shape` = the variation's path (viewBox 198), constraints SCALE,
  fill bound to the color variable. Rotation rotates the vector inside the fixed frame.
- Measurements: one drawn card (instance pinned to Desktop mode), one Size row with `M / T / D`
  cells (66 / 120 / 198) — human-approved, no per-mode cards.
