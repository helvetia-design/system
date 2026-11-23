import { describe, expect, it } from 'vitest'
import {
  TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS,
  shouldRecheckTeamMembership,
  shouldRecheckTeamMembershipFor,
  teamIdFor,
} from './team-membership'

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

describe('shouldRecheckTeamMembershipFor', () => {
  const now = 1_000_000
  const fresh = now - TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS / 2

  it('builds the team id from the config owner and team', () => {
    expect(teamIdFor({ repo: { owner: 'helvetia-design' }, team: 'toky' })).toBe('helvetia-design/toky')
  })

  it('trusts a fresh result for the same team', () => {
    expect(
      shouldRecheckTeamMembershipFor({ at: fresh, teamId: 'helvetia-design/toky' }, 'helvetia-design/toky', now),
    ).toBe(false)
  })

  it('rechecks a fresh result that was checked against another team', () => {
    expect(
      shouldRecheckTeamMembershipFor(
        { at: fresh, teamId: 'helvetia-design/toky' },
        'helvetia-design/conversational',
        now,
      ),
    ).toBe(true)
  })

  it('rechecks a token without a recorded team', () => {
    expect(shouldRecheckTeamMembershipFor({ at: fresh, teamId: undefined }, 'helvetia-design/toky', now)).toBe(true)
  })

  it('rechecks a stale result for the same team', () => {
    const stale = now - TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS
    expect(
      shouldRecheckTeamMembershipFor({ at: stale, teamId: 'helvetia-design/toky' }, 'helvetia-design/toky', now),
    ).toBe(true)
  })
})
