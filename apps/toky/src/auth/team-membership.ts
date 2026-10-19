// How long a JWT's cached team-membership result is trusted before the next
// token refresh re-checks it against GitHub, per docs/adr/0004 — bounds how
// long a since-removed team member keeps access without calling GitHub on
// every request.
export const TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS = 60 * 60 * 1000

export function shouldRecheckTeamMembership(lastCheckedAt: number | undefined, now: number = Date.now()): boolean {
  if (lastCheckedAt === undefined) return true
  return now - lastCheckedAt >= TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS
}
