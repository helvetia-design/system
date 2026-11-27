---
name: ds-issue-write
description: Draft a GitHub issue per finding or request — template title, labels, contributor-ready body — then post approved drafts with gh. Use for plan-gate out-of-scope findings or any new issue.
---

# ds-issue-write

One finding, one issue. Draft → human gate → post.

## Draft

1. **Duplicate check** — before writing, search open and closed issues:
   `gh issue list --state all --search "<component> <key words>" --limit 10`.
   A match → don't draft; report `duplicate of #N` (or draft a comment for `ds-issue-reply`).
2. **Pick the template** in `.github/ISSUE_TEMPLATE/` by kind (bug, a11y, feature, breaking,
   refactor, chore …). Its `title:` is the title format, its `labels:` the type label.
   `<component>` is the folder name (`card`, `input-slider`) or package (`tokens`, `angular`).
   The title says the symptom a user sees, not the fix.

3. **Write the body** to `docs/plans/github/issue-<component>-<slug>.md`:

   ```markdown
   <!-- title: :bug: fix(card): clickable card is not reachable by keyboard -->
   <!-- labels: 🐛 bug, 🔍 needs-triage -->

   ## What's wrong

   <The symptom, from the user's side. 2–4 sentences.>

   ## Where it shows up

   - `packages/core/src/components/.../x.tsx:42` — <what this line does wrong>
   - Found while: <task / issue #N / plan>

   ## What it should do

   <Expected behaviour. Name the standard if there is one (APG pattern, WCAG criterion).>

   ## Acceptance criteria

   - [ ] <testable outcome>
   - [ ] <testable outcome>
   ```

   Contributor voice (see the agent's Voice section). Every claim traceable to a file, a test or
   the plan — no guesses. Always add `🔍 needs-triage`; add `🤖 ready-for-agent` only via
   `ds-issue-triage`.

## Post

```bash
gh issue create --title "<title>" --label "<l1>" --label "<l2>" --body-file <draft-without-the-two-comment-lines>
```

Strip the `<!-- title -->` / `<!-- labels -->` lines from the body first. Return each issue URL —
the orchestrator links the numbers in the brief.
