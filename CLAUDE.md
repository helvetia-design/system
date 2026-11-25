# CLAUDE.md

Helvetia Design System: a pnpm + turbo monorepo of Stencil web components (`ds-*`) with design
tokens, styles, and React/Angular wrappers. Priorities: accessibility (WCAG 2.2 AA), then
HTML → CSS → JavaScript, responsive 320px–2560px.

## Rules

- **Never commit changes** — always leave changes unstaged for the user to review and commit themselves.
- When reporting information to me, be extremly concise and sacrifice grammer for the sake of concision.
- **Always generate a changeset for patches/fixes and minor/features** — use the `ds-changeset` skill to create it, and leave it unstaged for the user to review before committing.

## Commands

```bash
pnpm start                 # Core components dev server (IS_DS_DEVELOPMENT=true)
pnpm docs                  # Storybook
pnpm build                 # Build all packages (turbo cache)
pnpm tokens | pnpm styles  # Build tokens / styles only
pnpm test                  # All Vitest unit tests
pnpm --filter <package> test <file-filter>   # Single Vitest file
pnpm play                  # Playwright UI explorer (core)
pnpm play -- --grep="<test name>"            # Single Playwright test
pnpm lint | pnpm format | pnpm spell
```

## Where to look

- Before working in a package, read its `CONTEXT.md` (`packages/*/CONTEXT.md`, `apps/storybook/CONTEXT.md`); see `docs/agents/domain.md`.
- Component code standards: `docs/STYLE_GUIDE.md`. Architecture, CSS variable cascade, deprecation policy: `docs/ARCHITECTURE.md`.
- Setup and troubleshooting: `docs/DEVELOPMENT.md`. Contribution and release flow: `CONTRIBUTING.md`. Security: `SECURITY.md`, `docs/SECRETS.md`.
- Issues: GitHub Issues — `docs/agents/issue-tracker.md`, labels in `docs/agents/triage-labels.md`.
- General coding behavior (think first, simplicity, surgical changes): `docs/agents/behavioral-guidelines.md`.

## DS team

Six specialist agents with disjoint file ownership, `ds-*` skills, and workflows for a new
component, a bug fix, a feature, a Figma mirror and a deprecation. **You are the orchestrator** —
dispatch them, don't do their work. See `docs/agents/ds-team.md`, then only the workflow file
the run needs (`docs/agents/workflows/`). A bug fix is one agent (`component-engineer`), not the
full pipeline.

**Kickoff banner — your very first output on any DS-team request, before any tool call** (incl.
reading `ds-team.md`). Text only, its own message, so the UI shows it and doesn't fold it into a
tool group. Rendered markdown, not a code block (box borders break on emoji widths). Pick the
workflow's step line and render it as a numbered list: one item per `→` step; `∥` (parallel)
steps stay together on one item. Each step is `<emoji> **<agent>** / <action>` — the emoji maps
to the agent (🐙 orchestrator, 🏛️ architect, 🧩 component-engineer, 🧪 test-engineer, ♿️ a11y-expert,
🧬 token-engineer, 📖 documentation-engineer, 🎨 ux-designer, ⛔ human). Consecutive steps by the
same agent merge into one item `<emoji> **<agent>**` with a nested numbered list of its actions.

```markdown
## 🐙 DS Team taking over

**Workflow <X> — <name>** · `<ds-component>`

1. 🏛️ **architect** / plan
2. 🧩 **component-engineer**
   1. reproduce
   2. fix
3. 🧪 **test-engineer** / test ∥ ♿️ **a11y-expert** / a11y-test
4. …
```

- **A — New component:** `🐙 grill → 🏛️ plan ∥ ♿️ a11y-plan → ⛔ gate → 🧩 implement → 🧬 tokens → ⛔ visual gate → 🧪 test ∥ ♿️ a11y-test ∥ 📖 docs → 🧬 audit ∥ ♿️ audit → 🧩 repair → 🧩 validate → 🧩 changeset`
- **B — Bug fix:** `🧩 reproduce → 🧩 fix → 🧩 validate → 🧩 changeset (patch) → 🎨 drift check`
- **C — Feature:** `🐙 grill → 🏛️ plan → ⛔ gate → 🧩 modify → 🧬 tokens → 🧪 test ∥ ♿️ a11y-test ∥ 📖 docs → 🧬 audit ∥ ♿️ audit → 🧩 changeset (minor) → 🎨 drift check`
- **D — Component into Figma:** `🏛️ plan → 🧬 tokens → ⛔ gate → 🎨 map → 🎨 build → 🎨 review → 🎨 copy me → 🎨 anatomy ∥ 🎨 measurements ∥ 🎨 guidelines → 📖 stories`
- **E — Deprecation:** `🐙 grill → 🏛️ plan → ⛔ gate → 🧩 deprecate → 🧬 tokens → 🧪 test ∥ 📖 docs → 🧩 validate → 🧩 changeset (minor) → 🎨 drift check`
- **E′ — Removal** (later major): `⛔ gate → 🧩 remove → 🧬 tokens → 🧪 test ∥ 📖 docs → 🧩 validate → 🧩 changeset (major) → 🎨 drift check`

`🎨 drift check` = `ds-figma-review`, only when the component has a `<name>.figma.md` and the change touched its Figma surface (see `ds-team.md` → Figma drift check).

Then the status board (`ds-team.md` → Status board) on every dispatch, return and gate.
