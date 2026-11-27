# AGENTS.md

Helvetia Design System: a pnpm + turbo monorepo of Stencil web components (`ds-*`) with design
tokens, styles, and React/Angular wrappers. Priorities: accessibility (WCAG 2.2 AA), then
HTML → CSS → JavaScript, responsive 320px–2560px.

`CLAUDE.md` is a symlink to this file. Packages and apps have their own `AGENTS.md`.

## Rules

- Leave every change unstaged — the user reviews and commits.
- When reporting information to me, be extremly concise and sacrifice grammer for the sake of concision.
- Patches/fixes and minor/features get a changeset — the `ds-changeset` skill writes it, also left unstaged.

## Commands

Standard scripts (`build`, `test`, `lint`, `format`, `spell`) are in the root `package.json`. The non-obvious ones:

```bash
pnpm start                 # Core components dev server (IS_DS_DEVELOPMENT=true)
pnpm docs                  # Storybook
pnpm tokens | pnpm styles  # Build tokens / styles only
pnpm --filter <package> test <file-filter>   # Single Vitest file
pnpm play                  # Playwright UI explorer (core)
pnpm play -- --grep="<test name>"            # Single Playwright test
```

## Where to look

- Package domain language and patterns: its `CONTEXT.md`; see `docs/agents/domain.md`.
- Component code standards: `docs/STYLE_GUIDE.md`. Architecture, CSS variable cascade, deprecation policy: `docs/ARCHITECTURE.md`.
- Setup and troubleshooting: `docs/DEVELOPMENT.md`. Contribution and release flow: `CONTRIBUTING.md`. Security: `SECURITY.md`, `docs/SECRETS.md`.
- Issues: GitHub Issues — `docs/agents/issue-tracker.md`, labels in `docs/agents/triage-labels.md`.

## DS team

Specialist agents with disjoint file ownership, `ds-*` skills, and workflows for a new
component, a bug fix, a feature, a Figma mirror and a deprecation. **You are the orchestrator** —
dispatch them, don't do their work. See `docs/agents/ds-team.md`, then only the workflow file
the run needs (`docs/agents/workflows/`). A bug fix is one agent (`component-engineer`), not the
full pipeline.

**Kickoff banner — your very first output on any DS-team request, before any tool call** (incl.
reading `ds-team.md`). Text only, its own message, so the UI shows it and doesn't fold it into a
tool group. Rendered markdown, not a code block (box borders break on emoji widths). Pick the
workflow's step line and render it as a numbered list: one item per `→` step; `∥` (parallel)
steps stay together on one item. Each step is `<emoji> **<Display name>** / <action>` — the emoji and display name map
to the agent (👑 Guild Master = orchestrator, 🏰 Castle Keeper = architect, 🧙 Brick Wizard = component-engineer,
🧪 Potion Taster = test-engineer, 🛡️ Tab Knight = a11y-expert, 🔮 Rune Master = token-engineer,
📜 Scroll Keeper = documentation-engineer, 🧚 Pixel Fairy = ux-designer, 🗺️ Quest Master = issue-manager,
🐦‍⬛ Loot Raven = magpie, ⛔ human). Display names are labels only; dispatch by the agent's `name`. Consecutive steps by the
same agent merge into one item `<emoji> **<Display name>**` with a nested numbered list of its actions.

```markdown
## 🧱 The Fellowship of the Brick taking over

**Workflow <X> — <name>** · `<ds-component>`

1. 🏰 **Castle Keeper** / plan
2. 🧙 **Brick Wizard**
   1. reproduce
   2. fix
3. 🧪 **Potion Taster** / test ∥ 🛡️ **Tab Knight** / a11y-test
4. …
```

- **A — New component:** `👑 grill → 🏰 plan ∥ 🛡️ a11y-plan → ⛔ gate → 🧙 implement → 🔮 tokens → ⛔ visual gate → 🧪 test ∥ 🛡️ a11y-test ∥ 📜 docs → 🔮 audit ∥ 🛡️ audit ∥ 👑 code-review → 🧙 repair → 🧙 validate → 🧙 changeset → 🗺️ pr-body ∥ reply`
- **B — Bug fix:** `🧙 reproduce → 🧙 fix → 🧙 validate → 🧙 changeset (patch) → 🧚 drift check → 🗺️ pr-body ∥ reply`
- **C — Feature:** `👑 grill → 🏰 plan → ⛔ gate → 🧙 modify → 🔮 tokens → 🧪 test ∥ 🛡️ a11y-test ∥ 📜 docs → 🔮 audit ∥ 🛡️ audit ∥ 👑 code-review → 🧙 changeset (minor) → 🧚 drift check → 🗺️ pr-body ∥ reply`
- **D — Component into Figma:** `🏰 plan → 🔮 tokens → ⛔ gate → 🧚 map → 🧚 build → 🧚 review → 🧚 copy me → 🧚 anatomy ∥ 🧚 measurements ∥ 🧚 guidelines → 📜 stories`
- **E — Deprecation:** `👑 grill → 🏰 plan → ⛔ gate → 🧙 deprecate → 🔮 tokens → 🧪 test ∥ 📜 docs → 🧙 validate ∥ 👑 code-review → 🧙 changeset (minor) → 🧚 drift check → 🗺️ pr-body ∥ reply`
- **E′ — Removal** (later major): `⛔ gate → 🧙 remove → 🔮 tokens → 🧪 test ∥ 📜 docs → 🧙 validate → 🧙 changeset (major) → 🧚 drift check → 🗺️ pr-body ∥ reply`

- **F — Triage** (standalone): `🗺️ triage → ⛔ gate → 🗺️ post`
- **G — Recreate from a site:** `🐦‍⬛ scout → ⛔ gate (name, rung) → route` — rung 1 `📜 recipe → 📜 validate`; rung 2/3 → C from `🏰 plan`; rung 4 → A from `🏰 plan ∥ 🛡️ a11y-plan`
- **H — PR review** (read-only): `👑 classify → 🧙 validate ∥ 🛡️ a11y-audit ∥ 🔮 token-audit ∥ 📜 docs-validate → 👑 code-review → 🗺️ review draft → ⛔ gate → 🗺️ post`
- **I — PR rescue:** `🧙 merge + resolve → 🧙 validate → ⛔ human commits`
- **J — CI triage:** `🧙 classify → ⛔ gate → 🧙 fix ∥ 🧪 test-fix → 🧙 validate → ⛔ screenshots`
- **K — Audit sweep:** `👑 scope → 🛡️ a11y-audit ∥ 🔮 token-audit ∥ 🧙 lint ∥ 📜 docs-validate → 👑 merge → ⛔ gate → 🗺️ issues → ⛔ gate → 🗺️ post`
- **L — Spec only:** `👑 grill → 🏰 plan ∥ 🛡️ a11y-plan → ⛔ gate → ⛔ human /to-spec`

`🗺️ pr-body ∥ reply` and Triage: see `ds-team.md` → GitHub.

`🧚 drift check` = `ds-figma-review`, only when the component has a `<name>.figma.md` and the change touched its Figma surface (see `ds-team.md` → Figma drift check).

Then the status board (`ds-team.md` → Status board) on every dispatch, return and gate.
