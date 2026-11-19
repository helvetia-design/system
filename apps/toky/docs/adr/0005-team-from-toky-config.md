# 5. The gating team and every repo coordinate come from the Toky config

## Status

Accepted. Supersedes the part of [ADR-0004](0004-team-scoped-access.md) that made the team slug
a hardcoded constant (`TEAM_SLUG` in `github.ts`). The team-membership check itself, the
`active`/`pending` handling, and `TOKY_GITHUB_ORG_TOKEN` stand as decided there.

## Context

Toky now runs as two instances from one codebase: Core (tokens in `helvetia-design/system`) and
Extensions (tokens in `helvetia-design/extensions`). See section 4.4 of the extension tokens plan
and helvetia-design/extensions#8. The instance-specific values (`REPO_OWNER`, `REPO_NAME`,
`TEAM_SLUG`, `TOKENS_DIR`, `TOKEN_FILE_PATH`, `BRANDS_INDEX_PATH`, the Live Preview URL) were
constants in code. A second instance needs other values without forking the code or branching on
an instance name.

`@helvetia-design/tokens/toky-config` exports one `TokyConfig` type, its JSON schema, the core
defaults (`CORE_TOKY_CONFIG`), and `resolveTokyConfig(overrides)`.

## Decision

- Toky reads every instance-specific value from the resolved `TokyConfig`. This includes `team`
  and `repo.owner`, which the sign-in check uses as `GET /orgs/{repo.owner}/teams/{team}/memberships/{username}`.
- Without `TOKY_CONFIG_SOURCE`, the config is `CORE_TOKY_CONFIG`. The core instance therefore
  keeps `helvetia-design/toky` as its team.
- With `TOKY_CONFIG_SOURCE=owner/repo:path[@ref]`, the server reads that JSON file through the
  GitHub API with `TOKY_GITHUB_TOKEN`, passes it through `resolveTokyConfig`, and caches the result
  per process. A failed load is not cached.
- ADR-0004's reason for a constant was that an unset or mistyped env var could silently widen
  access. That risk does not return. The team comes from a reviewed file in a repo, not from free
  text in env. An unreadable or invalid config fails sign-in instead of falling back to another
  team, because `isTeamMember` throws.
- The JWT stores the team it was checked against (`teamCheckedFor`, `<repo.owner>/<team>`). A
  token checked against another team is re-checked on its next use, regardless of the recheck
  interval from ADR-0003.
- Secrets stay env per instance and are never part of the config file. This includes
  `AUTH_SECRET`: each instance needs its own, or a session cookie of one instance decrypts in the
  other.
- `TOKY_GITHUB_REF` still overrides `repo.ref`. `NEXT_PUBLIC_DS_PREVIEW_URL` still overrides
  `previewUrl`.

## Consequences

- An instance can gate on a different team (for example an extension team) by setting `team` in
  its `toky.config.json`. Changing the team is a reviewed change in the config repo.
- Whoever can merge into the config repo controls who can sign in to that instance. For the
  Extensions instance that is the `helvetia-design/extensions` maintainers.
- Every sign-in check and every page load first needs the config. For an instance with
  `TOKY_CONFIG_SOURCE` that is one GitHub read per server process.
- Because of that per-process cache, a change to the config file (team, `editableLayers`, repo)
  takes effect after a redeploy or a cold start, not on merge.
- `TOKY_LOCAL_TOKENS` reads this monorepo's checkout and only works for the core token source. With
  another source it fails with an error instead of reading a missing file.
