<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow K — Audit sweep

**Find, don't fix.** Audits a component family (or all) across a11y, tokens, lint and docs and
turns the findings into issues. Fixes then run as Workflow B per issue.

```text
scope (components or "all")  →  orchestrator: list components, batch by family
  →  per batch, parallel and read-only:
       a11y-expert        · ds-a11y-audit
       token-engineer     · ds-audit-tokens
       component-engineer · ds-lint-component        (report only — never --fix)
       documentation-engineer · ds-validate-documentation
  →  orchestrator: merge into docs/plans/components/audit-<scope>.md
  →  ⛔ GATE  (human picks which findings become issues, merges duplicates)
  →  issue-manager · ds-issue-write  (one issue per finding or per component)  →  ⛔ GATE  →  post
```

**Rules**

- **Batch by family** (e.g. button, button-group; form controls) to bound context; one agent
  per audit type per batch, never per component.
- **Interactive components only** get the a11y audit; layout-only components skip it. No
  `<name>.figma.md` skips any Figma check. Name skips on the board.
- **Findings are files:** each agent writes `docs/plans/components/audit-<scope>-<type>.md`
  (`file:line`, criterion or rule, severity). The orchestrator merges, never re-investigates.
- **Dedupe against open issues** (`gh issue list`) before drafting — don't file twice.
- **Human-only checks** from `../component-audit.md` (visual pass, monkey testing, LTS
  parity) are not done here; for a single component use that file's issue template instead.
- No code, test or doc is edited in this workflow. A finding that is trivially fixable is still
  an issue.
- Report: counts per type and severity, issues drafted, components skipped and why.
