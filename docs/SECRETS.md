# Secrets

Inventory of GitHub Actions secrets used in `.github/workflows/*.yml` — what each one does and what permissions it needs. There is currently no documented rotation process for any of these; treat that as a known gap.

For `apps/toky`'s own secrets (`TOKY_GITHUB_TOKEN`, `TOKY_GITHUB_ORG_TOKEN`), see [`apps/toky/docs/adr/0003-github-oauth-sign-in-bot-pat-writes.md`](../apps/toky/docs/adr/0003-github-oauth-sign-in-bot-pat-writes.md) — those are separate from the repo-level workflow secrets below.

## Fine-grained PAT setup gotcha: resource owner

Both `DS_BOT_GITHUB_TOKEN` and `DS_BOT_RELEASE_TOKEN` are fine-grained PATs, and when creating or editing one, the **"Resource owner"** selector at the top of the token page must be set to the **`helvetia-design` organization** — not the bot account's own personal account. "Repository access: All repositories" only means _"all repositories you own"_ under whichever resource owner is selected; if the owner is left as the bot's personal account, the token has zero access to `helvetia-design/system` even with correct permissions and even if it's never surfaced as an error on the permissions screen itself. This caused `prepare-release.yml` to fail with `Resource not accessible by personal access token` on the `changesets/action` ref-creation call, despite Contents/Pull-requests permissions being set correctly.

Org-owned fine-grained PATs also typically need approval under `helvetia-design`'s org Settings → Personal access tokens → pending requests before they become active.

## `DS_BOT_GITHUB_TOKEN`

Bot PAT used for day-to-day repo automation.

- **Used in:** `figma-sync.yml`, `prepare-release.yml`, `screenshots.yml`, `create-issue-branch.yml`, `figma-conflict-check.yml`, `dependency-audit.yml`
- **Purpose:** checkout auth, `changesets/action` PR/ref creation, git commits (`EndBug/add-and-commit`), PR comments, issue-branch creation, Figma conflict-check API calls, creating draft Security Advisories from `pnpm audit` findings
- **Required permissions:** fine-grained PAT scoped to `helvetia-design/system` with **Contents: Read and write**, **Pull requests: Read and write**, and **Repository security advisories: Read and write** (the last one is what `scripts/create-audit-advisory.mjs` needs to create/list draft advisories via `dependency-audit.yml`). Contents write is what `changesets/action` needs to create the `changeset-release/main` ref — see the "Resource not accessible by personal access token" failure this doc followed from. Also needs **branch-protection bypass rights on `main`**, per the comment at [`figma-sync.yml:45-47`](../.github/workflows/figma-sync.yml) and [`docs/adr/0017-direct-commit-variableid-backfill.md`](adr/0017-direct-commit-variableid-backfill.md) (the ADR describes the same exception for the `next` branch; the figma-sync workflow applies it to `main`), since most of this repo's automation otherwise requires PRs.

## `DS_BOT_RELEASE_TOKEN`

Separate bot token used only in the release/snapshot flows.

- **Used in:** `release.yml`, `snapshot.yml`
- **Purpose:** release git identity, SBOM dependency-graph submission, release commits, GitHub API curl calls for commit SHA lookups
- **Required permissions:** fine-grained PAT scoped to `helvetia-design/system` with **Contents: Read and write** (pushes the release commit/tag via `EndBug/add-and-commit` at `release.yml:84`, and submits the SBOM to GitHub's Dependency Submission API at `release.yml:127`, which also requires Contents write) and **Pull requests: Read** (`snapshot.yml:52` curls the PR-commits endpoint to resolve the last commit SHA). Unlike `DS_BOT_GITHUB_TOKEN`, this token never opens or comments on PRs, so Pull requests write isn't needed.

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
