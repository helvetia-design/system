---
name: ds-draw-icons
description: Draw or change new DS UI icons (concepts Streamline lacks) with the vendored draw-icons CLI in the DS DNA, then flatten them into the one-path 14-grid SVGs `ds-icon` ships and run the no-tracing overlap check. Use for any new icon in packages/assets; never to redraw a Streamline icon, never for brand icons.
---

# ds-draw-icons

A thin DS wrapper around the vendored [draw-icons](upstream/SKILL.md) skill. **Follow
`upstream/SKILL.md` and its `references/`** for everything about drawing (setup, craft, source
format, lint, render, sheet, preview). This file only lists where the DS differs; where the two
disagree, this file wins. The rules behind it are the gate decisions in
`docs/plans/components/icon-manager-brief.md`.

Paths below: `<skill>` = `.claude/skills/ds-draw-icons`, run from `packages/assets`, so
`<skill>` is `../../.claude/skills/ds-draw-icons`.

## Setup (once per machine)

```bash
npm install --prefix ../../.claude/skills/ds-draw-icons/upstream/scripts
npm install --prefix ../../.claude/skills/ds-draw-icons/scripts
```

Both are outside the pnpm workspace on purpose; never add their deps to a workspace `package.json`.

## DS DNA (Helvetia Core Solid v1)

Load `icons.yaml` and this section before drawing any icon. Numbers and their estimate status:
[brief → DNA v1](../../../docs/plans/components/icon-manager-brief.md#dna-v1--helvetia-core-solid-human-2026-11-27);
the phase-0 starting candidate is [`assets/core-solid-v1.yaml`](assets/core-solid-v1.yaml), and
`scripts/measure.mjs` prints the Streamline metrics phase 0 uses to replace the estimates.

- **Personality:** neutral, rational, professional, timeless, functional, minimal.
- **Appearance:** solid silhouettes, no stroke, monochrome, opacity 1. The silhouette must read
  on its own; low complexity; inner detail only as generous transparent cut-outs. 14 grid, 0.5
  step, angles 0/45/90/135, optical centring and overshoot allowed.
- **Forbidden:** gradients, shadows, textures, decorative outlines, multiple colours,
  non-essential detail, exaggerated rounding.
- **Review:** render at 14/16/24/32 on light and dark; check viewBox, monochrome, no clipping,
  min gap, min thickness, duplicate concept; compare optical balance, silhouette and weight
  side by side with Core Solid renders; designer approval.
- **Generation:** reuse an existing icon first; else 3 original variants per new concept →
  ⛔ approval → publish only the approved one. Never change the DNA to make one icon pass.
- **Scope:** only concepts Streamline lacks. Existing Streamline icons are never redrawn,
  renamed or removed.

## DS overrides

- **Config:** `packages/assets/icons.yaml`. Run every upstream command from `packages/assets` and
  always pass it: `node ../../.claude/skills/ds-draw-icons/upstream/scripts/icons.js <cmd> --config icons.yaml`.
  It is written only at the phase-0 DNA gate; until it exists, don't draw real icons.
- **`dir: src/icons/draw`.** Sources in `src/icons/draw/source/` (+ `parts/`) are committed; the
  top-level `draw/*.svg` that `build` writes are gitignored intermediates.
- **`dir` is never `src/icons/svg`.** `build` deletes every top-level SVG in `dir` — that would wipe
  the shipped icon set.
- **No tracing.** Streamline icons in `src/icons/svg/` are a style reference only: look at them as
  rendered PNGs (`render`/`sheet`/`preview`), never read their files as text or copy their path data
  for geometry. Build geometry with `shape` and `source/parts/`. The overlap check enforces this.
- **Style:** `filled` DNA tuned to sit next to Streamline Core Solid. `@16` small variants are allowed
  (`<name>@16.svg`, see upstream source format); they flatten to `src/icons/svg/<name>@16.svg`.
- **Batch size:** at most 6 icons per run.
- **Social logos are not drawn** (facebook, github, instagram, linkedin, pinterest, tiktok, whats-app,
  x, xing, youtube): they stay as shipped.
- **Brand icons** (`src/brand-icons/**`, `ds-brand-icon`) are out of scope.

## After `build`: flatten, then overlap check — always both

```bash
node ../../.claude/skills/ds-draw-icons/scripts/flatten.mjs [names…]   # draw/*.svg → src/icons/svg/<name>.svg
node ../../.claude/skills/ds-draw-icons/scripts/overlap-check.mjs     # exit 1 = traced, redraw
```

- `flatten` expands strokes (DNA width, caps, joins), cuts out the mask details and unions everything
  into one fill-only `<path fill-rule="evenodd">` on `viewBox="0 0 14 14"` (the grid, no rescale;
  `alert.svg` already ships on 14), root `fill="#000D6E"` (not `currentColor`) — the same shape as
  the existing files. A warning means ink leaves the 14 box: fix the source.
- `overlap-check` compares every `draw/source/*.svg` and its flattened output against every
  Streamline file (any `svg/*.svg` whose name isn't in `draw/source/`), each mapped from its own
  viewBox. It fails when ≥ 75 % of one Streamline subpath's points are in ours; why coverage and
  not a point count is in the script header. A failure is never waived: redraw.
  `--self-test` proves the check still catches a copy.
- Render the flattened file and look at it before reporting.

## Replaces upstream "Step 3 — Put them to use"

Don't import SVGs into components. The flattened file in `src/icons/svg/<name>.svg` is the
deliverable; regenerate the generated exports with:

```bash
pnpm --filter @helvetia-design/assets optimize   # scripts/build-svg.mjs → svg.ts / svg.json
```

`svg.ts`, `svg.json` and `icons.json` are generated — never edit them. Consumers use the icon by
name through `ds-icon`; sizes come from `ds-icon`, not CSS overrides. Upstream "Step 4 — Report"
still applies, minus the import example.

## Upstream

Pinned version, licence and how to update: [UPSTREAM.md](UPSTREAM.md). Never edit `upstream/`; put
DS rules here instead.
