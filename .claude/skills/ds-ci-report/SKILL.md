---
name: ds-ci-report
description: Download the core Playwright HTML report of the current branch's latest failing CI run and open it in the Orca browser. Use when a PR's Playwright jobs failed and the user wants to see the report.
---

# ds-ci-report

1. Run `bash .claude/skills/ds-ci-report/fetch.sh`.
   - Exit 2: relay its one-line reason (green, still running, no Playwright failure, artifact expired) and stop.
   - Success: it prints the failed Playwright jobs and `REPORT_DIR=<path>` (`.ci-reports/<runId>/`, gitignored; reused if already downloaded).
2. Serve it — traces don't load over `file://`. Run in the background:
   `npx playwright show-report <REPORT_DIR> --port 9324 --host 127.0.0.1`
   (from `packages/core`, so its Playwright version is used) with the max background timeout (7200000 ms).
   Skip if port 9324 already answers.
3. `orca tab create --url http://127.0.0.1:9324 --split right --focus`.
4. Report: run URL, failed jobs, report URL.
