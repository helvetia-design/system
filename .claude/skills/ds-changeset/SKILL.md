---
name: ds-changeset
description: Create a changeset entry for pending changes using the repo's create-changeset.mjs CLI. Use when the user asks to add/create a changeset, or wants their current changes recorded for the changelog.
---

# ds-changeset

Creates a changeset file (`.changeset/*.md`) for the current changes by driving the repo's existing CLI, `scripts/create-changeset.mjs`, non-interactively — no reimplementation of that logic here. The entry is read by consumers in a release changelog, not by other engineers in this repo — write for that audience.

## Workflow

### Step 1: Understand the change

Look at the changes to be recorded (uncommitted diff by default, or the diff/commits the user points to):

```bash
git status --short
git diff
git diff --staged
```

For each distinct component or area touched, work out:

- **Bump level** — `patch` (bug fixes, dependency bumps, internal tooling), `minor` (new features, non-breaking additions), or `major` (breaking changes). Ask the user if it's ambiguous. One PR normally gets one bump level, the highest among its changes.
- **Scope** — the component or area touched, e.g. `carousel`, `angular`, `skills`, `tokens`. Derive components from the changed file paths under `packages/core/src/components/<name>/`. Scope is purely the bold label on the changelog line — it never changes which package gets bumped (see below).
- **Summary** — one plain-language sentence a consumer with no knowledge of this codebase can act on. See "Writing the summary" below.

**One changeset file per PR.** If the PR touches several components, that's several `**component**: sentence` lines in the _same_ file, not several files — see Step 2.

### Writing the summary

- Plain language only. Say what changed and, if relevant, why it matters to someone using the component — not how it was implemented.
- Drop internal detail: CSS variable names, token names, exact before/after values, file paths, implementation mechanics. A consumer doesn't act on "`--ds-modal-margin` now resolves through the Alias layer"; they act on "the modal is now styled through its own design tokens."
- **Exception — renames and removals the consumer must act on.** A renamed prop, CSS custom property, or token, or anything removed, needs the old → new names so a consumer can grep their codebase and fix it. Keep that detail even though it's an identifier, e.g. "`role` prop is renamed to `panelRole`".
- Don't prefix these with "Breaking:" unless the bump is actually `major`. A renamed prop in a `minor` release still needs the old→new names, described plainly — the label should match the bump, not overstate it.
- No trailing period is not a hard rule here (unlike single-line imperative summaries) — a plain-language sentence reads better with one.

### Step 2: Run the CLI, then add further lines if needed

```bash
node scripts/create-changeset.mjs --bump=<patch|minor|major> --scope=<scope> --summary="<summary>"
```

Example:

```bash
node scripts/create-changeset.mjs --bump=minor --scope=carousel --summary="Accepts a per-breakpoint itemsPerView string, e.g. \"1 tablet:2 desktop:3\""
```

This reuses the exact same `writeChangeset()` logic as the interactive `pnpm changeset` flow (same file format, same `pnpm exec changeset add --empty` filename generation) — only the input source differs. It writes one `**scope**: summary` line.

If the PR touched more than one component, **don't re-run the CLI** for the rest — that creates separate files. Instead, edit the file the CLI just created and append one `**component**: sentence` line per additional component touched. Re-run the CLI only for a genuinely separate PR/change, never to add a second line to the same one.

If the bump levels differ across the components in the PR, use the highest one in the frontmatter — a single file has one bump level for the whole PR.

### Step 3: Confirm

Report the created file path and print its contents so the user can review it before committing:

```bash
cat .changeset/<generated-name>.md
```

Do not stage or commit the file — leave it for the user to review.

## Notes

- All `@helvetia-design/*` packages are a fixed version group that releases together under one version. The CLI always writes `'@helvetia-design/core'` in the frontmatter regardless of scope, including for changes that physically live in `packages/angular`, `packages/skills`, `packages/playwright`, etc. — scope is the label, not the package. Don't hand-edit the frontmatter to point at another package.
- If unsure which components were touched, list the directories under `packages/core/src/components/` referenced in the diff rather than guessing.
- For non-code changes affecting the whole system (e.g. dependency bumps across the workspace), `deps` is an acceptable standalone scope.
