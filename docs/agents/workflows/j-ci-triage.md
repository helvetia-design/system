<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow J — CI failure triage

**Fix only what the branch broke.** Everything else is reported, and uncertain cases go to the
human before any edit.

```text
PR / run URL
  →  component-engineer · classify   (gh run view --log-failed; compare with base)
       known-broken env?  → packages/playwright/CONTEXT.md, packages/core/CONTEXT.md
       each failure → branch-caused | pre-existing / unrelated | uncertain
  →  ⛔ GATE  (the classification table; only if any uncertain or unrelated)
  →  component-engineer fixes branch-caused  ∥  test-engineer for test-only breakage
  →  ds-validate-component   (the failing suites, narrowly)
  →  visual diffs?  → ⛔ human approves → ds-update-screenshots (user-invoked)
```

**Classification evidence** — a failure is branch-caused only if it passes on the base commit or
the diff plainly explains it. Record that evidence per row:

| Failure | Class | Evidence | Action |
| ------- | ----- | -------- | ------ |

**Check the environment before the code:**

- Stale server on port 4000 (Playwright `reuseExistingServer`, possibly another worktree's build)
  → kill it and rerun before concluding anything.
- Stale `packages/core/www` or `packages/styles` build → `pnpm styles` / core build first.
- Core config is `playwright.config.mts`; run from the package, not the root.
- SSR hydration failures and missing baselines for a new component are documented — don't re-prove.

**Rules**

- Never weaken, skip or delete a test to go green. Never `pnpm play:update`.
- Visual diffs are reported, not fixed locally (no local visual suites). New or changed baselines
  come from the human via `ds-update-screenshots`.
- An unrelated failure is filed via 🗺️ `ds-issue-write` draft (gate) — not fixed in this PR.
- Report: table above, what was fixed, suite output tail, what was not run and why.

**Retro** — these runs usually expose environment friction (stale servers, conflicts, flaky checks). The orchestrator ends with "Type `/retro` — it finds navigation and check gaps." User-invoked only.
