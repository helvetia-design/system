---
description: Bug fix (Workflow B)
argument-hint: <issue #, findings file, or description>
---

Start DS team Workflow B (bug fix) for: $ARGUMENTS. Follow the root AGENTS.md: kickoff banner first, then in the same turn (don't stop after the banner) run `node scripts/fellowship-board/board.mjs start B ds-<name>`, then the workflow B file. One agent (component-engineer), not the full pipeline. A findings file (`docs/plans/components/<name>-findings.md`) is one batch: fix every finding in it in one component-engineer pass, then mark each resolved in that file.
