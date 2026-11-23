---
'@helvetia-design/context': minor
---

Add `@helvetia-design/context`, which packages this repository's agent-facing material —
`CONTEXT.md`, `CONTEXT-MAP.md`, `docs/ARCHITECTURE.md`, `docs/STYLE_GUIDE.md`, `docs/adr`,
`docs/agents`, every workspace `CONTEXT.md`, and all `.claude/skills` — so that a consuming
repository reads them instead of copying them.

The `ds-*` skill scripts no longer hardcode this repository's layout. They resolve component
roots, the Playwright page-object directory, the entry file and the token files through
`.claude/skills/_shared/ds-context.js`, which reads an optional `ds-context.json` from the
consuming repo root and falls back to this repository's current paths when the file is absent.
This repo ships no such file, so its behaviour is unchanged.
