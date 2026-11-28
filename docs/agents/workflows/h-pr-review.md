<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow H — PR review

**Read-only.** Reviews an incoming PR (contributor or teammate) against the team's standards and
drafts the review. Nothing is fixed; the author does that.

```text
PR number
  →  orchestrator: gh pr view/diff → classify what the PR touched   (no component file reads)
  →  review fan-out, only the rows that apply (disjoint, read-only)
       component-engineer · ds-validate-component   (build, lint, tests, spec)
       component-engineer · ds-ui-polish-audit      (report only)
       a11y-expert        · ds-a11y-audit
       token-engineer     · ds-audit-tokens
       documentation-engineer · ds-validate-documentation
  →  orchestrator: code-review skill (Standards ∥ Spec) → one findings file
  →  issue-manager · ds-issue-reply  (review comment draft)  →  ⛔ GATE  →  post
```

**Classify first** — decides the fan-out:

| PR touches                                        | Run                                      |
| ------------------------------------------------- | ---------------------------------------- |
| `packages/core/src/components/**` (logic, markup) | ds-validate-component                    |
| interaction, semantics, ARIA, focus, color        | ds-a11y-audit (layout-only CSS skips it) |
| SCSS, `var(--ds-*)`, `packages/tokens/**`         | ds-audit-tokens                          |
| component SCSS or markup, default strings         | ds-ui-polish-audit                       |
| `apps/storybook/**`, a prop/event/slot changed    | ds-validate-documentation                |
| docs, CI, tooling only                            | none — orchestrator reviews by hand      |

**Always checked by the orchestrator** (cheap, from `gh`): changeset present and severity
matches the change (removed or renamed prop/token is **not** minor); `Closes #N` in the body;
linked issue meets `definition-of-ready.md`; no unrelated changes; framework wrappers touched
when a form API changed.

**Output:** `docs/plans/components/pr-<N>-review.md` — findings as `file:line`, severity
(blocking / should / nit), the check that found it. Fixes are never applied. Evidence rule holds:
a check that did not run is named with the reason.

**Gate:** the human edits the comment draft in `docs/plans/github/`; 🗺️ posts it on approval
(`gh pr review` comment — never approve or merge on the human's behalf).
