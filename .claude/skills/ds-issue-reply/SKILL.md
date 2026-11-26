---
name: ds-issue-reply
description: Draft a comment on a GitHub issue for its reporter — triage result, question, fix status or release — in consumer or contributor voice. Use when the team needs to answer or update an issue.
---

# ds-issue-reply

## Draft

1. **Read the thread:** `gh issue view <N> --comments`. Don't repeat what is already said.
2. **Pick the audience** from the reporter's relation to the repo:

   ```bash
   gh api repos/{owner}/{repo}/issues/<N> --jq .author_association
   ```

   `OWNER` / `MEMBER` / `COLLABORATOR` → **contributor**. Anything else → **consumer**.
   Mixed thread → write for the reporter.

3. **Pick the reply type** and write `docs/plans/github/reply-<N>-<type>.md`:

   | Type          | When                    | Must contain                                                       |
   | ------------- | ----------------------- | ------------------------------------------------------------------ |
   | `needs-info`  | can't reproduce / scope | the exact questions, numbered; what a good answer looks like       |
   | `triaged`     | after `ds-issue-triage` | confirmed or not, what happens next, workaround if any             |
   | `in-progress` | a fix PR exists         | `Fixed in #<PR>` (GitHub cross-links it), workaround until release |
   | `released`    | the fix shipped         | version, upgrade line, migration snippet if the API changed        |
   | `wontfix`     | won't be actioned       | why, in one or two sentences; the alternative                      |
   | `duplicate`   | already tracked         | `Duplicate of #N` — GitHub links it, the reporter can follow       |

   **Consumer** example:

   ````markdown
   Thanks for the report — confirmed. A clickable `ds-card` can't be reached with the keyboard today.

   **Until it's fixed:** put a link inside the card:

   ```html
   <ds-card><a href="/details">…</a></ds-card>
   ```

   **Fix:** in progress in #401. We'll comment here when it's released.
   ````

   **Contributor** example (paths and numbers are illustrative):

   ```markdown
   Root cause: `<file>.tsx:<line>` always renders `<article>`; `clickable` only sets a class.
   Fix in #401 — renders `<a>` when `href` is set. Regression test in `card.a11y.play.ts`.
   ```

   Version numbers only from `.changeset/` or a published release (`gh release list`) — never guessed.

## Post

```bash
gh issue comment <N> --body-file docs/plans/github/reply-<N>-<type>.md
```

Label changes that go with the reply (`needs-info`, `wontfix`) are `ds-issue-triage`'s.
