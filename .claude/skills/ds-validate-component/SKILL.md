---
name: ds-validate-component
description: Validate a component against project standards, its spec and acceptance criteria — static checks, build, tests — with per-criterion PASS/FAIL evidence. Use after implementing, modifying or repairing a component.
---

# ds-validate-component

Validate a component against project standards, its specification and its acceptance criteria.

**Never report a check as passing without the command output that proves it.**

## Input

- Component name or changed files
- Requirements and acceptance criteria
- Architecture plan, if available

## Phase 1: Discover

- Inspect the changed files.
- Identify affected components and dependencies — a shared mixin, `Field` wrapper or util
  change reaches every consumer of it.

This repo uses **pnpm workspaces + Turbo** (no Nx). Available checks:

| Check             | Command                                              |
| ----------------- | ---------------------------------------------------- |
| Unit tests        | `pnpm --filter @helvetia-design/core test`           |
| Single unit file  | `pnpm --filter @helvetia-design/core test -- <path>` |
| Lint              | `pnpm --filter @helvetia-design/core lint`           |
| Build (core)      | `pnpm core`                                          |
| Interaction tests | `pnpm play:components`                               |
| Visual tests      | `pnpm play:visual`                                   |
| A11y tests        | `pnpm play:a11y`                                     |
| Single Playwright | `pnpm play:file -- --grep="<test name>"`             |
| Spell check       | `pnpm spell`                                         |
| Format check      | `pnpm format:check`                                  |

Do not invent commands. If a check you want doesn't exist, say so and move on.

## Phase 2: Static validation

Run the mechanical checks through the skills that own them — don't eyeball what a script
already verifies:

```bash
node .claude/skills/ds-lint-component/index.js <component>
```

`ds-lint-component` covers divider comments and their order, JSDoc on every
`@Prop`/`@Event`/`@Method`, documented `@slot`/`@part`, and `@Type`/`@OneOf`/`@Required`
validator coverage with type matching. It takes `--fix` for the auto-correctable subset — if
you use it, re-run `tsc --noEmit`, since fixing a prop's optionality can surface real type
errors (`hasValue()` is not a TS type guard under `strict`).

For design tokens, use the `ds-audit-tokens` skill — it reports findings without editing.
Acting on them is the token-engineer's (`ds-manage-tokens`). Neither skill's rules are
repeated here.

Then check by reading, what no script covers:

- Architecture compliance (`docs/ARCHITECTURE.md`, `packages/core/CONTEXT.md`).
- Public API consistency — `ds-` prefix, `ds<Name>` events, `listenTo*`/`*Changed`/`handle*`
  handler naming, `readonly` on every `@Prop()`.
- `packages/core/src/index.ts` exports a public interface type only when the plan names one; a
  new component needs no entry.
- No new dependencies that weren't approved.
- TypeScript and lint errors.

## Phase 3: Automated validation

Run targeted checks before repository-wide ones — a single test file before the suite, the
core package before `pnpm build`.

Note that Playwright projects are split (`play:components`, `play:visual`, `play:a11y`), so
run only the ones the change can affect.

**Never run `pnpm play:update`.** Re-baselining visual snapshots goes through the
`ds-update-screenshots` skill, which posts a PR comment and is user-invoked only. If visual
tests fail, report the diff — do not accept the new snapshots.

## Phase 4: Requirements validation

Evaluate every acceptance criterion and assign exactly one status:

- `PASS` — verified, with the evidence that proves it
- `FAIL` — verified broken, with the failing output
- `NOT_VERIFIED` — no way to check it here; say why
- `NOT_APPLICABLE` — out of scope for this change; say why

## Phase 5: Report

Return:

- Commands executed, with their outcome
- Validation results per criterion
- Failed checks, with the relevant output
- Checks **not** executed, and why
- Remaining risks

Automated a11y tests (axe) catch a subset of WCAG 2.2 AA. Report what axe verified — never
claim full WCAG compliance on the basis of automated tests alone.
