---
name: ds-visual-review
description: Walk the visual-test failures of the latest failing CI run component by component in the Playwright report — the user approves the new screenshot (baseline updated) or the component gets fixed to match the expected one. Use after ds-ci-report, or when CI visual tests fail on the PR.
---

# ds-visual-review

Review first, act after: collect every decision, then apply them in one batch.

## 1. Report

Latest report lives in `.ci-reports/<runId>/`. Run `bash .claude/skills/ds-ci-report/fetch.sh`; it reuses a
present download and stops (relay its reason, stop too) when there is nothing to review. Ensure the report is
served on `http://127.0.0.1:9324` and open in an Orca tab — steps 2–3 of the `ds-ci-report` skill.

`python3 -I .claude/skills/ds-visual-review/review.py list <REPORT_DIR>` → failing screenshots grouped by
component: `testId`, `test`, `project`, `ratio`, `expected`/`actual`/`diff` PNGs, repo `baseline`, `approvable`,
`resolvedByDesktop`. Show a one-line overview (components, snapshot count).

## 2. Review — one component at a time

- Point the existing tab at it with `orca goto --url '<url>'`: one failure → `http://127.0.0.1:9324/#?testId=<testId>`,
  several → `http://127.0.0.1:9324/#?q=s:failed%20<component>`. The user compares Expected / Actual / Diff /
  Side by side there; never generate images or pages of your own.
- In chat, list the component's snapshots numbered: `<n>. <test> · <project> · ratio <r>`.
- SSR rows (`approvable: false`) — SSR compares against the 💻 Desktop baseline:
  - `resolvedByDesktop: true` → mark "follows desktop #<n>"; it needs no decision of its own.
  - otherwise → only `fix` or `skip` (the client render matches; approving would break the desktop test).
- Ask with the `AskUserQuestion` tool, never as chat text — one question per component, header `<n>/<total>` (e.g. `3/17`),
  question `🖼️ <component> — approve <what changed, one line>?`, options `Approve` (baseline updated), `Fix` (component
  matches expected; say what the fix would be), `Skip`. Splits (`approve 1,3 fix 2`) come through "Other". Record it,
  go to the next component.

## 3. Act — after the last component

Show the decision table and confirm once, then:

- **Approve:** `python3 -I .claude/skills/ds-visual-review/review.py approve <REPORT_DIR> <testId>...` — copies the
  CI `actual` over the baseline. It skips SSR and stale baselines (repo baseline ≠ report's expected); relay skips.
  Pass the IDs as separate args (pipe them one per line into `xargs`; zsh doesn't word-split `$ids`).
- **Fix:** dispatch one `component-engineer` per component, in parallel, with `ds-modify-component`. Brief: the
  snapshots to fix with their `expected`, `actual`, `diff` paths (it reads the PNGs) and test file; goal — render
  matches `expected`; find the regression in the branch diff (`git diff main...`); test-first where a behavior
  test can catch it; verify by eye on the dev server against `expected` (baselines are Linux-only, no local pixel
  check); never touch `*-snapshots/`; no changeset; leave changes unstaged.

## 4. Report

Per component: approved baselines, fixes with root cause, skips. Next CI run proves the fixes — check with `/ci-report` after pushing.
