# CLAUDE.md — AI Assistant Instructions

This file guides AI assistants when working with code in this repository.

## Quick Reference

You are an expert in TypeScript, Stencil, Web Components, design tokens, and scalable multi-framework (React/Angular) component library development.
You write functional, maintainable, performant, and accessible code following TypeScript and Stencil best practices.

### General Rules

- **Never commit changes** — always leave changes unstaged for the user to review and commit themselves.
- **Always generate a changeset for patches/fixes and minor/features** — use the `ds-changeset` skill to create it, and leave it unstaged for the user to review before committing.

### Core Principles

The design system prioritizes:
- **Accessibility** (WCAG 2.2 AA)
- **Simplicity** (HTML → CSS → JavaScript)
- **Responsiveness** (320px–2560px)
- **Standards Compliance** (W3C best practices)
- **Compatibility** (webstatus.dev + caniuse.com)
- **Inclusion** (diverse abilities and technologies)

For comprehensive architecture and design philosophy, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Commands

```bash
# Development
pnpm start                 # Start core components in dev mode (IS_DS_DEVELOPMENT=true)
pnpm docs                  # Start Storybook documentation

# Build
pnpm build                 # Build all packages (respects turbo cache)
pnpm tokens                # Build design tokens only
pnpm styles                # Build styles only

# Testing
pnpm test                  # Run all Vitest unit tests (--watch=false)
pnpm play                  # Open Playwright UI test explorer

# Run single Vitest test
pnpm --filter <project> test -- --testFile=<path>

# Run single Playwright test
pnpm play -- --grep="<test name>"

# Linting & Formatting
pnpm lint                  # Lint all packages
pnpm format                # Auto-format code (enforces LF line endings)
pnpm spell                 # Spell check with cspell

# Version management
pnpm changeset             # Create a changeset entry before publishing
```

## Documentation

For comprehensive technical information, see the dedicated documentation files:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System design, workspace structure, component lifecycle, web components patterns, CSS variables, testing strategy
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** — Local setup, dev servers, building, testing, troubleshooting
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Contribution workflow, PR process, component checklist, accessibility requirements
- **[STYLE_GUIDE.md](docs/STYLE_GUIDE.md)** — Code standards, naming conventions, best practices
- **[SECURITY.md](SECURITY.md)** — Security policy and guidelines
- **[SECRETS.md](docs/SECRETS.md)** — GitHub Actions secrets inventory: purpose and required permissions
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** — Community standards

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context monorepo with separate `CONTEXT.md` for each package. Each package maintains its own context file that documents:
- Package purpose and scope
- Key files and structure
- Domain-specific patterns and conventions
- Package-specific testing requirements
- Dependencies and relationships to other packages

Current packages with CONTEXT.md:
- `packages/core/CONTEXT.md` — Web components implementation
- `packages/styles/CONTEXT.md` — CSS utilities and styling
- `packages/tokens/CONTEXT.md` — Design token definitions
- `packages/playwright/CONTEXT.md` — Playwright test utilities
- `packages/assets/CONTEXT.md` — Asset files and resources
- `packages/skills/CONTEXT.md` — Consumer Claude Code skills installer
- `packages/ag-grid/CONTEXT.md` — Token-bound AG Grid theme
- `apps/storybook/CONTEXT.md` — Storybook documentation app

See `docs/agents/domain.md` for detailed guidance on using domain docs.

## Key Guidelines

See [STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for detailed code standards and best practices.

**Quick Rules:**
- Use `ds-` prefix for all custom elements
- All components must implement `ComponentInterface` and `Loggable`
- Follow naming conventions: `listenTo*`, `*Changed`, `handle*` for event handlers
- Use `readonly` for all immutable `@Prop()` values
- Avoid JavaScript for tasks that HTML/CSS can solve
- Avoid attribute selectors in SCSS; use CSS classes
- Use CSS variable cascade: private (`--_`), public (`--`), modifier (`--mod-`), token (`--ds-`)
- Always avoid security issues; follow best practices for web development

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for comprehensive coverage of:
- Component file structure
- Hybrid component model
- Stencil style guide and patterns
- CSS variable cascade system
- Web components best practices

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- New component checklist
- Testing requirements
- Accessibility standards (WCAG 2.2 AA)
- Release process and changesets

## Behavioral guidelines

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
