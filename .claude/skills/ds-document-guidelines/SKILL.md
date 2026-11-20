---
name: ds-document-guidelines
description: Write the non-component Storybook documentation — foundations, design guidelines, developer guides, migrations, CSS utility pages and token pages. Use for anything under apps/storybook/src outside a component folder, such as onboarding, integration guides, or explaining a system-wide concept.
---

# ds-document-guidelines

Write the pages that explain the system itself, rather than one component.

Per-component documentation is `ds-document-component`. This skill owns everything else under
`apps/storybook/src/`:

| Area                         | Contains                                                                |
| ---------------------------- | ----------------------------------------------------------------------- |
| `foundation/`                | Color, typography, spacing, elevation — the design basis                |
| `development/00-guides/`     | Setup, framework integration, developer guides                          |
| `development/01-migrations/` | Version migration guides                                                |
| `css-utilities/`             | Utility class reference pages                                           |
| `tokens/`                    | Consumer-facing token guidance                                          |
| `templates/`                 | Composed page/layout examples                                           |
| root `*.mdx`                 | `welcome`, `design`, `contributing`, `support`, `versions`, `whats-new` |

## Audience

Write for someone deciding **which** component to use and **whether** the system supports
their case — not for someone who already knows and wants the prop table. That reader is
served by the component pages.

A guideline page answers one of:

- What is this concept, and why does the system work this way?
- Which option do I pick for my situation?
- How do I get this working in my app?

If a page answers none of those, it's a component page in the wrong folder.

## Phase 1: Find the precedent

Read two or three existing pages in the same area before writing. These pages share voice,
heading depth and block usage, and an inconsistent one is obvious to a reader moving between
them.

Reuse the existing Storybook blocks rather than hand-rolling markup — `CssUtilitiesTable`,
`CssPropertyTable`, `ColorCard`, `PackageTable`, `Code`, `Banner`, `Lead`, `Tabs`. The block
index lives in `apps/storybook/.storybook/blocks/`.

## Phase 2: Write

- **Show the real thing.** Every example must be copy-pasteable and actually work against the
  current packages. A snippet referencing a prop that no longer exists is worse than no
  snippet.
- **Bind generated data, don't retype it.** Token tables, utility class lists and package
  versions come from blocks reading generated data. A hand-written list goes stale silently.
- **Link, don't restate.** Point at the component page rather than re-documenting its API —
  there is exactly one place a prop is described.
- Respect the repo's ubiquitous language (`packages/tokens/CONTEXT.md`): **brand mode**, not
  theme or variant; component variants are a separate concept.
- Decisions have a home in `docs/adr/`. A guideline page may summarize and link an ADR; it
  does not replace or contradict one.

## Phase 3: Token and architecture pages

These have owners elsewhere, and you are writing the **consumer-facing** version:

- The token _architecture_ (four layers, naming anatomy, brand modes) belongs to the
  token-engineer in `packages/tokens/CONTEXT.md`. Your page explains to a consumer which
  tokens to use and how to override them — link the source, don't fork it.
- Architecture decisions belong to the architect in `docs/adr/`. Same rule.

Where a source document and your page disagree, the source wins and your page gets fixed.

## Phase 4: Validate

Follow `ds-validate-documentation`. Every code example must be verified against the current
API, not assumed.

## Report

Pages created or changed; which area; examples verified and how; stale content found; and
anything that belongs to another owner (a token or ADR correction) raised as a finding rather
than fixed here.
