---
name: ds-scout-component
description: Analyze a component marked on another website (URL + CSS selector) and write a recreation brief — name, ladder rung, bal-* mapping, anatomy, token-snapped measurements, responsive switch points, brand-color variants. Use when recreating a foreign or legacy Baloise UI element in the DS.
---

# ds-scout-component

Turn one marked element of a foreign page into a brief the DS team can build from. You analyze;
you write no production code. Everything you write goes to `docs/plans/magpie/<name>/` and
`docs/plans/components/<name>-brief.md` (both gitignored).

The script does the measuring and the math. You do the judgment: mapping, rung, name, parts.

## Inputs

- `<url>` and `<selector>`. The selector comes from an Orca annotation
  (`bal-card.bam-quick-link-nav__card`) or DevTools → Copy selector. If it carries a utility
  class only (`.m-none`, `.hydrated`), drop it.
- Optional: a screenshot from the human, for context only. Measurements come from the script.

## 1. Scout

```bash
pnpm tokens   # only if packages/tokens/dist is missing — the script stops and says so
node .claude/skills/ds-scout-component/scripts/scout.mjs <url> "<selector>" --name <kebab-slug> [--remove "<css>"]...
```

`<kebab-slug>` is a working name; the final name is decided at the gate. The script prints a
summary and writes `docs/plans/magpie/<slug>/scout.json` plus one `<width>.png` per width
(320 + our breakpoints 769/1024/1440) and `state-<id>-<hover|focus>.png`.

- Known consent-tool overlays are hidden by default
  (`DEFAULT_REMOVE` in `scout.mjs`). Don't open Playwright MCP to find one.
- A `states[].error` saying another element "intercepts pointer events" is an unknown banner or
  sticky header. Rerun with `--remove "<its selector>"` (it is hidden with CSS, never clicked),
  and add the selector to `DEFAULT_REMOVE` if it's a consent tool.
- The script never clicks. When the element only exists after interaction (open accordion,
  login, popover) or the selector never becomes visible, use the Playwright MCP or the Orca
  browser to reach the state, and record what you did in the brief's Source section.

Read the printed summary and `scout.json.summary` first, then only the slices you need with
`jq` or `node -e` (one node, one width, one prop). The file runs to hundreds of KB: never `Read`
or `cat` it whole.

| Field                        | Meaning                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `nodes[]`                    | subtree in DOM order; `id` is stable across runs of the same page             |
| `perWidth[w][id].snap[prop]` | `token` (exact) · `drift` (±2px / ΔE ≤ 10) · `no-token`; `nearest` always set |
| `summary.globalLayerHits`    | matched only a Global token — needs an Alias/Device token or a decision       |
| `summary.ambiguous`          | two same-layer tokens equally close — pick by meaning                         |
| `switchPoints[]`             | layout/token changes between widths, already snapped to `ourBreakpoint`       |
| `states[]`                   | hover/focus computed-style diff per distinct interactive element              |
| `contrast[]`, `brandAxis[]`  | WCAG ratios; contrast of each text on all 4 brand surfaces                    |

## 2. Map Baloise first

For every `bal-*` tag in `summary.balTags`, read
`packages/skills/skills/ds-migrate-from-baloise/components/<name>/migration.md` (`bal-` dropped)
and take its `ds-*` target and prop mapping. Read-only — never run that skill.

**Semantic color beats hex.** A color that comes from a `bal-*` prop or class
(`bal-card--is-green`, `color="green"`) or a utility class in
`ds-migrate-from-baloise/shared/css-utils-map.json` maps by meaning, even when the ΔE snap
picked something else. Note every override.

**The delta** is what has no mapping: custom classes (`summary.customClasses`, e.g. `bam-*`),
unmapped props, inline styles, the layout glue between mapped parts. Only the delta goes through
the ladder below. On a non-Baloise page the whole subtree is delta.

**Layout glue maps to layout components, never to utility classes.** Source utility classes
(`m-none`, `p-*`, `bg-*`, `flex`, `is-flex`…) are evidence of intent only; the recipe never
emits a utility class.

**CSS version before web component.** Where a layout block has a CSS-class version (its 🌍
HTML story shows it, e.g. `<section class="ds-stack has-space-lg as-row">`), the recipe uses
the class on the semantic element (`section`, `div`, `ul`) instead of `<ds-stack>`. Use the
web component only when no class version exists or behaviour needs it. `ds-grid` is CSS-only
anyway.

| Source layout                                                            | DS building block                                                                                                                                                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| columns (`grid`/`col is-one-quarter`, CSS grid, flex row of equal parts) | `ds-grid` + `ds-col` with grid modifiers: `is-one-quarter`, `tablet:is-half`, `desktop:is-one-third`, `gap-md`, `is-multiline` (`packages/core/src/components/structure/grid/grid.style.scss`) |
| a stack of blocks with even spacing, row or column                       | `ds-stack` — `direction`, `space`, `space-row`/`space-column`, `align`, `use-wrap`, `p`/`px`/`py`                                                                                              |
| text-ish content grouped with small spacing (heading + text + link)      | `ds-content` — `direction`, `space`, `align`, `text-align`                                                                                                                                     |
| outer spacing between siblings (margins)                                 | the parent's `space` on `ds-stack`/`ds-content`, not a margin on the child                                                                                                                     |

Snap each measured gap/padding to the matching `space` / `gap-*` value of that block (use the
token from `snap`, then pick the prop value that resolves to it). If no prop value fits, it is a
rung-2 gap on that layout component or a NO-TOKEN, never a utility class. Responsive column
changes from `switchPoints` become breakpoint-prefixed `ds-col` modifiers.

## 3. Classify — the ladder

Stop at the first rung that fits the delta:

1. **Composition** — existing `ds-*` components already cover it. Output: a recipe (markup:
   `ds-*` components + `ds-grid`/`ds-stack`/`ds-content`, zero utility classes).
2. **Variant** — a prop/value on an existing `ds-*` component closes the gap.
3. **HTML+CSS pattern** — no behavior, no state, no JS-dependent a11y; class-based in
   `packages/styles`.
4. **New web component** — behavior, state, a11y wiring or an API that needs encapsulation.

Check the candidate's real API before claiming a rung (`grep -n "@Prop" packages/core/src/components/<category>/<name>/<name>.tsx`).
A composite is normal: rung 1 plus one rung-2 delta. Name the rejected rungs and why.

## 4. Anatomy

Pick the parts (5–8, the ones a designer names) by `id` and rerun with the overlay:

```bash
node .claude/skills/ds-scout-component/scripts/scout.mjs <url> "<selector>" --name <slug> [--remove …] --anatomy "0:Card,4:Heading,8:Link row,13:Chevron"
```

That writes `anatomy.png` (numbered callouts) and `scout.json.anatomy[]`. Part names are the
future `@part`/slot names for rung 4 and the anatomy legend for `ds-figma-anatomy` and
Storybook's `ComponentParts`.

## 5. Name

2–3 proposals, `ds-` prefixed for rung 2–4 (kebab-case, a noun for what it _is_, not where it
sits: `ds-link-list`, not `ds-homepage-links`). Check none exists:
`ls packages/core/src/components/*/`. For rung 2 the "name" is the variant value
(`ds-list variant="link"`).

## 6. Render the recipe

Before writing the brief, render the recipe on the core dev server (`pnpm start`,
`localhost:4000/playground.html`; run `pnpm styles` first if `packages/core/www/assets/css` is
stale). Use Playwright, with a script in the scratchpad or the MCP, at the same 4 widths. Compare
against the source screenshots and measure with `getBoundingClientRect` and computed styles:

- Parts that should fill their column but don't (e.g. `align-items: flex-start` shrinking a list)
- Row heights, heading sizes and gaps against the source's numbers
- Breakpoints where the layout switches, against `switchPoints`

A measured question is answered in the brief, not asked at the gate. A real gap (wrong width,
missing prop) becomes a rung-2 delta with the exact fix named: the file, the enum or class, and
the value. Kill the dev server afterwards. Never run visual snapshot suites or Docker: baselines
belong to CI.

The recipe becomes a Storybook page later (📜, rung 1). Keep it simple: the brief holds the
decisions, the page does not repeat them.

## 7. Write the brief

`docs/plans/components/<name>-brief.md` — the path every DS agent reads first, so Workflow A/C
pick it up with no copy step. Exactly these sections:

1. **Source** — URL, selector, date, `--remove` used, any MCP steps; screenshot paths
2. **Name** — proposals with one-line reasoning; your pick first
3. **Classification** — rung, evidence (which `ds-*` covers what), rejected rungs
4. **Mapping** — table `bal-*` → `ds-*` (+ props); then the delta as a list; then the
   **recipe**: full markup of the recreation (`ds-*` + `ds-grid`/`ds-stack`/`ds-content`, no utility
   classes), with `<!-- TODO rung N -->` where a variant or new component is still missing
5. **Anatomy** — `![anatomy](../magpie/<slug>/anatomy.png)` + table `# · part · element · description`
6. **Measurements** — table `part · property · <breakpoint>… → token`; mark `drift (Δ)`,
   `NO-TOKEN (nearest)`, `GLOBAL`; group identical rows
7. **Responsive** — one line per switch point: what changes, at which of our breakpoints
8. **Variants** — brand-color axis (all 4 with contrast) when `brandAxis` is set; hover/focus
   from `states[]`; any other axis you saw (size, inverted)
9. **A11y observations** — semantics seen in the source (heading level, link vs button, list
   markup, focus indicator), and what the source gets wrong; a11y-expert decides, you observe
10. **Render check** — what step 6 measured, recipe against source, with numbers per width
11. **Open questions**, in two lists:
    - **Decide**: API, naming and taste calls only the human can make, each with your
      recommendation. NO-TOKEN rows the recipe actually needs go here, so the gate routes them
      to 🧝 before any build. A component that can't size or style the value (e.g. an `img`
      in an icon slot) counts too.
    - **Defaulted**: everything you settled yourself, one line each with the default taken. The
      gate can override, but doesn't have to walk them.

Drift is a note, not a decision. NO-TOKEN is a token-engineer item, never a hardcoded value.
Anything measurable is measured, never asked.

## Completion

Return: brief path, proposed name, rung (+ composite parts, each rung-2 delta with its exact
fix), counts of NO-TOKEN / drift / GLOBAL / contrast fails, brand axis yes/no, the **Decide**
questions (the Defaulted list stays in the brief). Nothing else — the brief holds the rest.
