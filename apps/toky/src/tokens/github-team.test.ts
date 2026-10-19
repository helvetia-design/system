import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isTeamMember } from './github-team'

const originalEnv = { ...process.env }

beforeEach(() => {
  process.env.TOKY_GITHUB_TOKEN = 'test-token'
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.unstubAllGlobals()
})

function membershipResponse(state: 'active' | 'pending') {
  return new Response(JSON.stringify({ state }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('isTeamMember', () => {
  it('requests the expected URL and headers, using TOKY_GITHUB_TOKEN when TOKY_GITHUB_ORG_TOKEN is unset', async () => {
    const fetchMock = vi.fn().mockResolvedValue(membershipResponse('active'))
    vi.stubGlobal('fetch', fetchMock)

    await isTeamMember('octocat')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/orgs/helvetia-design/teams/toky/memberships/octocat',
      {
        cache: 'no-store',
        headers: {
          Authorization: 'Bearer test-token',
          Accept: 'application/vnd.github+json',
        },
      },
    )
  })

  it('prefers TOKY_GITHUB_ORG_TOKEN over TOKY_GITHUB_TOKEN when both are set', async () => {
    process.env.TOKY_GITHUB_ORG_TOKEN = 'org-token'
    const fetchMock = vi.fn().mockResolvedValue(membershipResponse('active'))
    vi.stubGlobal('fetch', fetchMock)

    await isTeamMember('octocat')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer org-token')
  })

  it('returns true when membership state is active', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(membershipResponse('active')))
    await expect(isTeamMember('octocat')).resolves.toBe(true)
  })

  it('returns false when membership state is pending', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(membershipResponse('pending')))
    await expect(isTeamMember('octocat')).resolves.toBe(false)
  })

  it('returns false on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })))
    await expect(isTeamMember('octocat')).resolves.toBe(false)
  })

  it('throws on an unexpected status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 403, statusText: 'Forbidden' })))
    await expect(isTeamMember('octocat')).rejects.toThrow(/403/)
  })

  it('percent-encodes the username', async () => {
    const fetchMock = vi.fn().mockResolvedValue(membershipResponse('active'))
    vi.stubGlobal('fetch', fetchMock)

    await isTeamMember('a b')

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe('https://api.github.com/orgs/helvetia-design/teams/toky/memberships/a%20b')
  })
})
