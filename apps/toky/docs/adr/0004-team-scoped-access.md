# 4. Narrow authorization from org membership to `toky` team membership

## Status

Accepted. Supersedes the authorization decision in
[ADR-0003](0003-github-oauth-sign-in-bot-pat-writes.md) — sign-in mechanism, session
strategy, preview-deployment blocking, and denied-UX all stand as decided there; only
_who counts as authorized_ changes.

## Context

ADR-0003 gated access on membership in the `helvetia-design` GitHub org
(`GET /orgs/{org}/members/{username}`). That was broader than needed: not every org
member should be able to open PRs against `packages/tokens` through Toky, only the
people on the `helvetia-design/toky` team
(https://github.com/orgs/helvetia-design/teams/toky).

## Decision

- The org-membership check is **replaced**, not supplemented, by a team-membership
  check — GitHub team membership already implies org membership, so a single
  team check is a strict narrowing with no need to also check the org.
- The team slug (`toky`) is a **hardcoded constant** (`TEAM_SLUG` in `github.ts`,
  alongside `REPO_OWNER`/`REPO_NAME`), not an env var — consistent with how this file
  already treats "which GitHub resource are we pointed at" as code, and it avoids a
  misconfiguration risk where an unset/mistyped env var would silently widen access.
- The check calls `GET /orgs/{org}/teams/{team_slug}/memberships/{username}`
  (`isTeamMember`, replacing `isOrgMember`). A 200 response includes a `state` field
  (`"active"` or `"pending"`); only `"active"` counts as a member — `"pending"` means
  an invite hasn't been accepted yet, which shouldn't grant access. A 404 means not a
  team member; any other status is treated as unexpected and throws.
- `TOKY_GITHUB_ORG_TOKEN` **keeps its existing name** even though the check it backs
  is now team-scoped — renaming it would force a coordinated production env var
  change for no functional benefit, since the token's GitHub permission scope (not
  its env var name) is what actually governs access. Its `.env.example` comment is
  reworded to describe the team check.
- The JWT field and session field rename from `isOrgMember` to `isTeamMember`
  (`auth.ts`), and the recheck-interval helper from `shouldRecheckOrgMembership` to
  `shouldRecheckTeamMembership` (`src/auth/team-membership.ts`), to keep naming
  truthful to what's actually being checked. Same recheck cadence and JWT-based
  staleness bound as ADR-0003 — unchanged.
- The `/denied` page is reworded to name the `toky` team specifically and links to
  https://github.com/orgs/helvetia-design/teams/toky as where to ask to be added,
  replacing the generic "ask an org owner" copy (which also had a stale reference to
  the org's old name, `baloise`).

## Open question

Whether the existing fine-grained PAT's "Organization permissions → Members
(read-only)" scope is sufficient for the teams-membership endpoint specifically, or
whether it needs a different/broader permission, isn't confirmed from GitHub's docs.
This should be verified against a real token before relying on this in production —
if insufficient, the fix is adjusting the PAT's permissions in GitHub's settings, not
a code change.

## Consequences

- Access is now strictly narrower: only `helvetia-design/toky` team members (not all
  `helvetia-design` org members) can use Toky.
- Someone added to the org but not the team gets the same "access denied" UX as
  before, now pointing at the team instead of the org.
- No change to session strategy, preview-deployment blocking, or the bot-PAT write
  model — those remain exactly as ADR-0003 decided.
