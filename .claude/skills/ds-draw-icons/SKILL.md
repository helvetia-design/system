---
name: ds-draw-icons
description: Draw, change or redraw DS UI icons with the vendored draw-icons CLI, then flatten them into the one-path 16px SVGs `ds-icon` ships and run the no-tracing overlap check. Use for any new or redrawn icon in packages/assets; not for brand icons.
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
  x, xing, youtube). Take the Simple Icons (CC0) or official brand-kit SVG, save it as `<name>.svg`
  outside the repo, and normalize it:
  `node ../../.claude/skills/ds-draw-icons/scripts/flatten.mjs --social /path/to/<name>.svg`.
- **Brand icons** (`src/brand-icons/**`, `ds-brand-icon`) are out of scope.

## After `build`: flatten, then overlap check — always both

```bash
node ../../.claude/skills/ds-draw-icons/scripts/flatten.mjs [names…]   # draw/*.svg → src/icons/svg/<name>.svg
node ../../.claude/skills/ds-draw-icons/scripts/overlap-check.mjs     # exit 1 = traced, redraw
```

- `flatten` expands strokes (DNA width, caps, joins), cuts out the mask details and unions everything
  into one fill-only `<path fill-rule="evenodd">` on `viewBox="0 0 16 16"`, root `fill="#000D6E"` —
  the same shape as the existing files. A warning means ink leaves the 16 box: fix the source.
- `overlap-check` compares every `draw/source/*.svg` and its flattened output against every
  Streamline file (any `svg/*.svg` whose name isn't in `draw/source/`). It fails at ≥ 6 shared
  coordinate pairs; the reason for 6 is in the script header. A failure is never waived: redraw.
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
