<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow H — New icon

Draw up to six UI icons we do not have yet, from an `icon` issue or a team request. Never a
brand icon. Decisions: `docs/plans/components/icon-manager-brief.md` → `## Gate decisions`.
Existing Streamline icons are never redrawn, renamed or removed — only missing concepts.

```text
icon request (≤ 6 icons)
  →  packages/assets/icons.yaml exists?   no  →  phase 0 first (below)
  →  icon-manager · ds-draw-icons      draw: lint → render → sheet, ≤ 3 rounds
  →  ⛔ VISUAL GATE: preview in DS components, metaphor options  →  human picks
  →  icon-manager · ds-draw-icons      build → flatten → overlap check
  →  ux-designer                       add Icon<Name> to Figma, verify INSTANCE_SWAP
  →  component-engineer · ds-changeset (minor)
  →  issue-manager · ds-pr-body ∥ ds-issue-reply  →  ⛔ GATE  →  post   (see ../ds-team.md → GitHub)
  →  human reviews and commits
```

**1 · Draw** — from the shape CLI and `source/parts/` only. Streamline is looked at as rendered
PNGs, never read as path data. Each round lints, renders and puts the icons on a contact sheet
next to their neighbors; three rounds without a clean sheet is a stop, reported with the sheet.

> **Gate.** The human sees each icon at 16 and 24 px inside real DS components (button, input,
> list), with a metaphor option or two where the concept is ambiguous. Nothing is built before
> the pick.

**2 · Build** — draw-icons `build` into `src/icons/draw`, then flatten into one fill-only
`<path>` (`viewBox="0 0 14 14"`, the DNA v1 grid) at `packages/assets/src/icons/svg/<name>.svg`. The overlap check
against every Streamline file must pass; a failure means redraw, never a looser threshold.

**3 · Figma** — 🎨 adds a single-vector `Icon<Name>` to the Instance Swap library and tests a
real swap on the `ds-icon` wrapper set — convention:
`.claude/skills/ds-code-to-figma/conventions/content-selection-and-mitigations.md` → "Open-ended
content-selection props". Figma MCP not authorized → the final report names it as open.

**4 · Changeset** — minor, naming the new icons.

**No 🧪 step.** The all-icons visual snapshot reads the generated icon list, so a new icon is
included automatically. Its new baseline comes from `/update-screenshots`, run by the human.

## Phase 0 — bootstrap (once, before the first H run)

✏️ icon-manager only, no PR until the gate:

1. Start from DNA v1: `.claude/skills/ds-draw-icons/assets/core-solid-v1.yaml` plus the
   aggregate metrics of `scripts/measure.mjs` (thickness, gaps, radii, fill, padding) — they
   replace the brief's estimates.
2. Write 2–3 candidate DNAs (`style: filled`, `grid: 14`, `sizes: [14, 16, 24, 32, 40]`).
3. Draw six calibration concepts Streamline lacks in each DNA (proposal: lock, shield, heart,
   car, banknote, calendar-check).
4. Preview them side by side with existing Core Solid neighbours in real DS components.
5. ⛔ **DNA gate** — the human picks one; ✏️ writes `packages/assets/icons.yaml`.
