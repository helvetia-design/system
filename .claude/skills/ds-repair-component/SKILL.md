---
name: ds-repair-component
description: Verify and fix component findings from a code, architecture, a11y, testing or token review, with per-finding status. Use when working through review feedback.
---

# ds-repair-component

Work through review findings on a component.

## Input

- Review findings — a review report, PR comments, an a11y audit's findings, or a
  `<family>.token-check.md` report
- Original requirements
- Approved architecture plan

## Phase 1: Analyze findings

For each finding:

- Understand what it claims.
- **Verify it against the current implementation** — read the file and line it refers to.
- Identify the root cause, not just the symptom.
- Decide whether it is actually valid.

**Do not blindly apply reviewer suggestions.** A reviewer asked to find problems will always
find something; some findings are wrong, already fixed, or would add abstraction for a case
that cannot happen. Say so and justify it.

## Phase 2: Prioritize

Classify each verified finding:

- **Critical** — broken behavior, accessibility failure, data loss, security
- **Major** — wrong public API, token-layer violation, missing test coverage for real logic
- **Minor** — naming, comment formatting, style guide details

Escalate findings that require an architecture change — those need `ds-plan-component`, not a
patch here.

## Phase 3: Repair

- Fix verified findings, most severe first.
- Preserve the approved architecture.
- Keep each fix focused on its finding; don't bundle in unrelated cleanups.
- Add regression coverage where the finding was a real defect.

## Phase 4: Validate

Follow the `ds-validate-component` skill. Confirm the repairs introduced no regressions.

## Phase 5: Report

For every finding, return:

- Finding reference
- Resolution status — `RESOLVED` / `INVALID` / `BLOCKED` / `REQUIRES_APPROVAL`
- Changed files
- Validation evidence

For `INVALID`, give the reason it doesn't hold. For `BLOCKED` or `REQUIRES_APPROVAL`, state
what is needed to unblock it.
