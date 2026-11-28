# ds-test-component Skill

## Overview

The test-engineer's skill. It generates a component's visual, SSR and variant-list files from the
engineer's approved `visual.html`, writes framework integration tests for form components, and
reviews the coverage of the tests the component-engineer wrote test-first.

Behavior tests are **not** generated: `.spec.ts`, `.component.play.ts` and the Page Object are the
component-engineer's, written in TDD cycles before the code exists (`ds-implement-component` /
`ds-modify-component`). Their conventions live in [REFERENCE.md](REFERENCE.md), which both
agents read.

## Files

- **SKILL.md** — the skill: generation, coverage review, integration tests
- **REFERENCE.md** — conventions for every test file type (shared with the component-engineer)
- **examples.md** — copy-ready code per test type
- **implementation.js** — the generator

## Generated Test Files

1. **variants.ts** — `TAG` + `VARIANTS`, read from the fixture's `data-testid` sections
2. **visual.play.ts** — Playwright visual regression tests
3. **ssr.play.ts** — SSR before/after hydration (only with a `.host.scss`)

## References

- [STYLE_GUIDE.md](../../docs/STYLE_GUIDE.md) — Component standards
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — Component patterns
- [packages/playwright/CONTEXT.md](../../packages/playwright/CONTEXT.md) — Testing library details
