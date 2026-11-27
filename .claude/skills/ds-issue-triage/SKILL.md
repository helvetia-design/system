---
name: ds-issue-triage
description: Triage issues labelled needs-triage against the Definition of Ready — decide the next label, draft the reply, apply on approval. Use when asked to triage the backlog or a specific issue.
---

# ds-issue-triage

Label vocabulary and states: `docs/agents/triage-labels.md`. Readiness bar:
`docs/agents/definition-of-ready.md`. Read both first.

## Draft

1. **List:** `gh issue list --label "🔍 needs-triage" --json number,title,author,labels` (or the
   numbers the dispatch names).
2. **Per issue**, read it (`gh issue view <N> --comments`) and verify against the source — a
   reported defect is checked with `Grep` in the component, not taken on trust. Then decide:

   | Decision             | State (`triage-labels.md`)            | Reply (`ds-issue-reply`) |
   | -------------------- | ------------------------------------- | ------------------------ |
   | Duplicate            | duplicate label — the human closes it | `duplicate`              |
   | Missing info         | `needs-info`                          | `needs-info`             |
   | Ready, AFK-able      | `ready-for-agent` + type + priority   | `triaged`                |
   | Ready, needs a human | `ready-for-human` + type + priority   | `triaged`                |
   | Won't do             | `wontfix` — a maintainer's decision   | `wontfix`                |

   Label names are the mapped ones in `triage-labels.md`; type and priority labels come from
   `gh label list`. `needs-triage` comes off in every case except a first `needs-info` round.
   Ready means every applicable Definition of Ready box is checked — post that checklist with
   the `triaged` reply. Critical priority = prod blocked, no workaround.

3. **Write one plan** `docs/plans/github/triage-<date>.md` — one row per issue: number, title,
   decision, label diff (`+🤖 ready-for-agent −🔍 needs-triage`), reply draft path, one-line reason.
   Write the reply drafts with `ds-issue-reply` (call the `Skill` tool).

## Post

```bash
gh issue edit <N> --add-label "<l>" --remove-label "🔍 needs-triage"
gh issue comment <N> --body-file docs/plans/github/reply-<N>-<type>.md
```

Report which issues the human should close.
