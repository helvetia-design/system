# CONTEXT — packages/context (`@helvetia-design/context`)

This package ships the agent-facing context of this repository so that another repository can
**read** it instead of copying it.

It exists because DS Extensions (`helvetia-design/extensions`) is governed by the same design
rules, style guide, component patterns and ADRs as this repo, but is a separate, private
repository. Duplicating those files there guarantees drift. One repository would be the simpler
answer, but Core is public and Extensions is private, so that option is closed.

## What it ships

Everything agent-facing in this repo, **verbatim and uncurated**:

| Source                                                            | Lands at (under `dist/`)     |
| ----------------------------------------------------------------- | ---------------------------- |
| `CONTEXT.md`, `CONTEXT-MAP.md`                                    | `dist/`                      |
| `docs/ARCHITECTURE.md`, `docs/STYLE_GUIDE.md`                     | `dist/docs/`                 |
| `docs/adr/**`, `docs/agents/**`                                   | `dist/docs/`                 |
| `packages/*/CONTEXT.md`, `apps/*/CONTEXT.md`, `libs/*/CONTEXT.md` | `dist/` + same relative path |
| `.claude/skills/**`                                               | `dist/skills/`               |

**This repo makes no judgement about what a consumer needs.** There is deliberately no manifest
of "shared" versus "internal" material — curating would mean guessing, and it would put the
maintenance burden for a downstream consumer on this repo. A consumer takes everything and routes
it on its own side. If that proves wrong in practice, curate then, with evidence.

Nothing Helvetia-internal travels the other way. This package is a one-way channel, public → private.

## How it is assembled

`scripts/collect.mjs` copies the payload into this directory, because npm only packs files that
sit inside the package. Everything it writes is generated and gitignored; `dist/MANIFEST.json` lists
what arrived. It runs on `pnpm build` and again on `prepack`, so a publish can never ship a stale
payload.

Adding agent-facing material to this repo means adding it to the `COPY` list in that script.
Nothing is picked up implicitly except workspace `CONTEXT.md` files.

## The skills it ships, and `ds-context.json`

The `ds-*` skills were written against this repository's layout — one component root at
`packages/core/src/components`. A consumer has a different shape. Rather than hardcode either,
the skills ask `skills/_shared/ds-context.js`, which reads an optional `ds-context.json` from the
**consuming** repo root and falls back to this repository's paths when the file is absent.

This repo ships no `ds-context.json`, so its own behaviour is unchanged.

```json
{
  "componentRoots": ["packages/app/core/src/components"],
  "playwrightComponents": "packages/app/playwright/src/lib/components",
  "coreIndex": "packages/app/core/src/index.ts",
  "storybookComponents": "apps/storybook/src/components",
  "tokensCss": null,
  "tokensJson": null
}
```

A skill that needs something the consumer does not have — `ds-token-check` in a repo with no token
package — fails with a plain message saying so, rather than reading a path that isn't there.

## Consuming it

The consumer installs the package, pins it in its lockfile, and copies the skills into its own
`.claude/skills/`, **skipping any skill it already has locally**. That skip is what makes "the
local repo's rules win" mechanical rather than a convention someone has to remember.

Upstream docs are then read in place, at `node_modules/@helvetia-design/context/dist/…`.
