---
name: ds-pr-body
description: Draft the PR description for the current changes, linked to its issue with Closes #N so merging closes it. Use at the end of a workflow run or when asked for a PR description.
---

# ds-pr-body

The human opens the PR; this skill writes its body.

## Draft

1. **Find the issue.** In order: the dispatch, the brief (`docs/plans/components/<c>-brief.md`),
   the branch name (`issue-branch.yml` names branches `<number>-<slug>`), then
   `gh issue list --search "<component>"`. Not found → `<!-- TODO: issue number -->`, never guess.
2. **Read the change:** `git diff main...HEAD --stat`, `git status --short`, the new
   `.changeset/*.md`, and the plan if there is one.
3. **Write** `docs/plans/github/pr-<branch>.md`:

   ```markdown
   Closes #<N>

   ## Problem

   <What was wrong or missing, as the issue reader understands it. 1–3 sentences, no internals.>

   ## Solution

   <One sentence for the outcome.>

   - <Change grouped by area — API, CSS/tokens, JS, docs. Name new props/tokens/events in backticks.>
   - Changeset: <bump> (`<scope>`)

   ## Breaking changes

   <Only if any — what breaks and the migration snippet. Otherwise drop this section.>

   ## Testing

   - <Test added/updated, file name, what it proves>
   - <Command run and result — only results you have evidence for>
   ```

   - `Closes #N` is the **first line** and one keyword per issue (`Closes #12`, `Closes #14`).
     A PR that only touches an issue without finishing it says `Refs #N` instead.
   - GitHub closes the issue only when the PR merges into the **default branch** — check with
     `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`. If the PR targets
     another branch, say so in the report: the issue will need closing by hand.
   - Problem/Solution in consumer voice, the bullets in contributor voice.
   - A check that didn't run is listed as `not run — <why>`, never left out.

## Post

```bash
gh pr edit <pr-number> --body-file docs/plans/github/pr-<branch>.md
```

No PR yet → don't create one. Report the command for the human:
`gh pr create --body-file docs/plans/github/pr-<branch>.md`.
