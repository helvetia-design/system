# Secrets

Inventory of GitHub Actions secrets used in `.github/workflows/*.yml` — what each one does and what permissions it needs. There is currently no documented rotation process for any of these; treat that as a known gap.

For `apps/toky`'s own secrets (`TOKY_GITHUB_TOKEN`, `TOKY_GITHUB_ORG_TOKEN`), see [`apps/toky/docs/adr/0003-github-oauth-sign-in-bot-pat-writes.md`](../apps/toky/docs/adr/0003-github-oauth-sign-in-bot-pat-writes.md) — those are separate from the repo-level workflow secrets below.

## `DS_BOT_GITHUB_TOKEN`

Bot PAT used for day-to-day repo automation.

- **Used in:** `figma-sync.yml`, `prepare-release.yml`, `screenshots.yml`, `create-issue-branch.yml`, `figma-conflict-check.yml`
- **Purpose:** checkout auth, `changesets/action` PR/ref creation, git commits (`EndBug/add-and-commit`), PR comments, issue-branch creation, Figma conflict-check API calls
- **Required permissions:** fine-grained PAT scoped to `helvetia-design/system` with **Contents: Read and write** and **Pull requests: Read and write** (Contents write is what `changesets/action` needs to create the `changeset-release/main` ref — see the "Resource not accessible by personal access token" failure this doc followed from). Also needs **branch-protection bypass rights on `main`**, per the comment at [`figma-sync.yml:45-47`](../.github/workflows/figma-sync.yml) and [`docs/adr/0017-direct-commit-variableid-backfill.md`](adr/0017-direct-commit-variableid-backfill.md) (the ADR describes the same exception for the `next` branch; the figma-sync workflow applies it to `main`), since most of this repo's automation otherwise requires PRs.

## `DS_BOT_RELEASE_TOKEN`

Separate bot token used only in the release/snapshot flows.

- **Used in:** `release.yml`, `snapshot.yml`
- **Purpose:** release git identity, SBOM dependency-graph submission, release commits, GitHub API curl calls for commit SHA lookups
- **Required permissions:** not documented anywhere today — **needs owner confirmation**. Likely needs the same Contents/Pull-requests write access as `DS_BOT_GITHUB_TOKEN` plus whatever scope the dependency-graph submission API requires, but this hasn't been verified against the actual token settings.

## `NPM_PUBLISH_TOKEN`

- **Used in:** `release.yml`, `snapshot.yml`
- **Purpose:** npm publish auth, exported as `NODE_AUTH_TOKEN` for `pnpm -r publish` — shared by both the production release flow and the pre-release snapshot flow.
- **Required permissions:** npm automation token with publish rights on the `@helvetia-design` npm org/scope.

## `GITHUB_TOKEN` (built-in)

- **Used in:** `screenshots.yml`
- **Purpose:** `github-script` calls, PR branch lookup via curl
- **Required permissions:** none to manage — this is GitHub's auto-issued, job-scoped token. Its effective permissions come from the workflow/job's `permissions:` block, not from a stored secret.

## `FIGMA_API_TOKEN` / `FIGMA_FILE_KEY`

- **Used in:** `figma-sync.yml`, `figma-conflict-check.yml`
- **Purpose:** `FIGMA_API_TOKEN` authenticates `scripts/figma-sync/{pull,conflict-check}.mjs` against the Figma REST API; `FIGMA_FILE_KEY` identifies the target Figma file (not a credential, just stored as a secret alongside the token).
- **Required permissions:** a Figma personal access token with read access to the target file.
