import { describe, expect, it } from 'vitest'
import { TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS, shouldRecheckTeamMembership } from './team-membership'

describe('shouldRecheckTeamMembership', () => {
  it('recheck when there is no prior check timestamp', () => {
    expect(shouldRecheckTeamMembership(undefined)).toBe(true)
  })

  it('does not recheck when the interval has not elapsed', () => {
    const now = 1_000_000
    expect(shouldRecheckTeamMembership(now - TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS / 2, now)).toBe(false)
  })

  it('rechecks once the interval has elapsed', () => {
    const now = 1_000_000
    expect(shouldRecheckTeamMembership(now - TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS, now)).toBe(true)
  })

  it('rechecks once the interval has been exceeded', () => {
    const now = 1_000_000
    expect(shouldRecheckTeamMembership(now - TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS - 1, now)).toBe(true)
  })
})
