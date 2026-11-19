// How long a JWT's cached team-membership result is trusted before the next
// token refresh re-checks it against GitHub, per docs/adr/0004 — bounds how
// long a since-removed team member keeps access without calling GitHub on
// every request.
export const TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS = 60 * 60 * 1000

export function shouldRecheckTeamMembership(lastCheckedAt: number | undefined, now: number = Date.now()): boolean {
  if (lastCheckedAt === undefined) return true
  return now - lastCheckedAt >= TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS
}

/** The team a membership result belongs to, as stored in the JWT: `<org>/<team>`. */
export function teamIdFor(config: { repo: { owner: string }; team: string }): string {
  return `${config.repo.owner}/${config.team}`
}

// A cached result only counts for the team it was checked against — a token issued by another
// instance, or before the config's team changed, is re-checked right away (docs/adr/0005).
export function shouldRecheckTeamMembershipFor(
  checked: { at: number | undefined; teamId: string | undefined },
  currentTeamId: string,
  now: number = Date.now(),
): boolean {
  return checked.teamId !== currentTeamId || shouldRecheckTeamMembership(checked.at, now)
}
