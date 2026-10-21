import { REPO_OWNER, TEAM_SLUG, encodeGithubUrlSegment, requireGithubOrgToken } from './github'

// GET /orgs/{org}/teams/{team_slug}/memberships/{username} — 200 with
// state: "active" means the user is a confirmed team member; state:
// "pending" means they've been invited but haven't accepted yet, which does
// not grant access. 404 means they aren't on the team (or the team/org
// doesn't exist). Any other status is unexpected. See docs/adr/0004.
export async function isTeamMember(username: string): Promise<boolean> {
  const url = `https://api.github.com/orgs/${REPO_OWNER}/teams/${TEAM_SLUG}/memberships/${encodeGithubUrlSegment(username)}`

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${requireGithubOrgToken()}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (response.status === 404) return false

  if (response.status === 200) {
    const body = (await response.json()) as { state: 'active' | 'pending' }
    return body.state === 'active'
  }

  const body = await response.text()
  throw new Error(
    `Failed to check ${TEAM_SLUG} team membership for ${username}: ${response.status} ${response.statusText} — ${body}`,
  )
}
