# Code → Figma Component Skill — Plan

## Scope (v1)

- **Create-only.** First-time push of one component from code into the existing Figma component
  library. No update/reconciliation of an already-pushed component, and no Code Connect
  generation — both are explicitly deferred to a later iteration.
- First real test subject: **`ds-spinner`**.
- Code is the single source of truth. Figma is never treated as authoritative, and the skill
  never invents a hardcoded value or a new design token on the design side.

## Skill location

`.claude/skills/ds-figma-component` — a project skill (like `ds-create-component`,
`ds-lint-component`, etc.), **not** shipped via `packages/skills`. This skill depends on the
Figma MCP, this monorepo's component source, the token architecture, and the Playwright visual
screenshots — none of which exist in a consumer repo, so it can't be a `packages/skills` payload.

## New repo-root file: `figma.config.json`

Holds the component-library Figma file key, checked into git (not a secret — just an
identifier). Distinct from `apps/toky`'s `FIGMA_FILE_KEY` env var, which points at a different
file used for token sync, not the component library.

## Per-component artifact: `<name>.figma.md`

Co-located with every other per-component file:

```
packages/core/src/components/<category>/<name>/<name>.figma.md
```

(e.g. `packages/core/src/components/indicators/spinner/spinner.figma.md`)

- Format: Markdown with a **fenced YAML block** holding the structured mapping, plus prose
  around it for human rationale/notes. YAML (not JSON) because this file is meant to be
  hand-edited during review.
- Contains:
  - Prop → Figma property mapping (including variant grouping decisions)
  - Token → Figma variable resolution per styled value
  - Nested-component references (which child Figma component gets reused, and why)
  - Once created: the resulting Figma component key/node-id, written back by the skill
- **Doubles as input spec and output record.** A later component (e.g. `button.figma.md`)
  resolves a nested child (e.g. "icon") by reading `icon.figma.md` and pulling the Figma
  component key recorded there — no separate registry, no name-based search in Figma at
  generation time.
  - If the child has no `.figma.md` yet (never pushed to Figma): **hard stop** — tells you to
    run the skill on the child first.

## Shared knowledge base: `CONVENTIONS.md`

`.claude/skills/ds-figma-component/CONVENTIONS.md` — accumulates mapping heuristics across
components over time, e.g.:

- Free-text props (like `label`) never become Figma variant properties — they map to instance
  text overrides.
- Boolean state-like props (like `disabled`) fold into the nearest existing variant axis rather
  than becoming their own boolean property.
- Pseudo-states and state-ish props — `:hover`, `:focus`, `:active` (pulled from the component's
  SCSS, not from `@Prop()`s, since they're CSS pseudo-classes, not props) plus any `disabled` /
  `readonly` / `loading`-style props — all collapse into one Figma `state` variant property
  (`default` / `hover` / `focus` / `active` / `disabled` / `readonly` / `loading`), rather than
  each becoming its own variant axis or boolean property.

The skill **proposes** additions to this file after each confirmed component mapping; a human
approves before they land. Never auto-appends. Every run after the first reads this file to
inform its own proposals.

## Phases

### 1. Analyze

- Read the component's **public `@Prop()`s only** — not `@Method`, `@Event`, or private state.
- Extract types and variant candidates (e.g. `@OneOf([...])` enums, booleans).
- Also scan the component's `.host.scss` for **pseudo-class states** (`:hover`, `:focus`,
  `:active`, `:disabled`, `:read-only`, and any loading-related class/attribute selector) —
  these don't show up as `@Prop()`s but still need a Figma representation.
- Resolve every styling value (colors, spacing, radius, typography, etc.) to its existing Figma
  variable. Binding is **brand-agnostic** — bind once to the variable; Figma's own mode
  switching handles brand variation, the same way this repo's CSS custom properties already do.
- **Any value with no matching Figma variable → hard stop.** Surfaced here, during analysis,
  not mid-build in phase 3. You decide how to proceed (pick an existing nearby token, or
  explicitly accept a one-off hardcoded value) before moving on.
- Draft findings get written into `<name>.figma.md`.

### 2. Propose variant grouping

- Using heuristics (enum prop → one Figma variant property; boolean prop → boolean Figma
  property; state-like props flagged as fold-in candidates) informed by `CONVENTIONS.md`, the
  skill drafts how code props collapse into Figma variant properties.
- Example: a button's color props + a `disabled` prop collapse into one `variant` Figma
  property rather than staying as separate boolean/enum props.
- **Pseudo-states and state-ish props always collapse into one `state` Figma variant property**
  (`default` / `hover` / `focus` / `active` / `disabled` / `readonly` / `loading`, as applicable
  to the component) rather than becoming separate axes or booleans — see `CONVENTIONS.md`.
- You review and adjust the draft directly in `<name>.figma.md`.
- After confirmation, the skill proposes any new heuristics learned this run as additions to
  `CONVENTIONS.md`; you approve before they're written.

### 3. Confirm → build incrementally

- Once you confirm the mapping in `<name>.figma.md`, the skill creates/updates the component's
  dedicated Figma **page** (one page per component) and builds the component there.
- **Incremental with a checkpoint**: build one full variant combination first — structure, token
  bindings, nested component instances (reusing existing Figma components, never redrawing
  them) — and get a quick screenshot checkpoint before fanning out to the rest of the variant
  matrix. This catches a structural mistake once instead of N times across every combination.
- Never writes a hardcoded value or invents a token; every bound value traces back to a Figma
  variable resolved (and confirmed) in phase 1.
- Writes the resulting Figma component key/node-id back into `<name>.figma.md` on success.

### 4. Review against visual regression screenshots

- Captures a screenshot of each built variant/state from Figma and places it alongside the
  matching Playwright visual-regression PNG
  (`*.visual.play.ts-snapshots/*.png`).
- **Agent-judged, not pixel-diffed** — Figma and browser rendering differ enough (anti-aliasing,
  font rasterization) that pixel diffing would produce constant false mismatches. The agent
  gives its own visual read and flags obvious problems (wrong token/color, missing nested icon,
  wrong size/spacing).
- Advisory only — never auto-passes or auto-fails. Final match/mismatch call is yours.

## Animations are always out of scope

Figma components are static. This skill only ever builds the resting/static visual
representation of a component — it never attempts to reproduce CSS keyframe animation or
Lottie/JS-driven animation behavior in Figma. For a component with an animated variant (e.g.
`ds-spinner`'s `logo` variation, an animated Lottie mark), the Figma build uses the component's
static brand asset/mark instead of reconstructing the animation frame-by-frame. This applies to
every component this skill touches, not just spinner.

## Explicitly out of scope for v1

- Updating/reconciling an already-pushed Figma component after code changes.
- Generating the Code Connect mapping (`.figma.ts`) — use the existing `figma-code-connect`
  skill as a manual follow-up, using `<name>.figma.md` as reference.
- Building a component library from scratch — assumes the target Figma file and its token
  variables already exist (via Toky's sync).
