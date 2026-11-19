import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveTokyConfig } from '@helvetia-design/tokens/toky-config'

const { getTokyConfig } = vi.hoisted(() => ({ getTokyConfig: vi.fn() }))

vi.mock('./config', async importOriginal => {
  const actual = await importOriginal<typeof import('./config')>()
  return { ...actual, getTokyConfig }
})

const { fetchBaseTokensFile, getGithubRef } = await import('./github')
const { findOpenPullRequest, getBaseTokensFileMeta, getTokenPackageName, listTokenBrandFiles, addBrandToIndex } =
  await import('./github-write')
const { isTeamMember } = await import('./github-team')

const extensionsConfig = resolveTokyConfig({
  repo: { owner: 'acme', name: 'extensions', ref: 'develop' },
  tokensDir: 'packages/ext-tokens/tokens',
  tokenFile: 'Extensions.tokens.json',
  brandsIndexPath: null,
  team: 'conversational',
})

const originalEnv = { ...process.env }

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  process.env.TOKY_GITHUB_TOKEN = 'test-token'
  delete process.env.TOKY_GITHUB_REF
  getTokyConfig.mockResolvedValue(extensionsConfig)
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.unstubAllGlobals()
})

describe('GitHub access driven by the Toky config', () => {
  it('reads the configured token file from the configured repo and ref', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)

    await fetchBaseTokensFile()

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/acme/extensions/contents/packages/ext-tokens/tokens/Extensions.tokens.json?ref=develop',
    )
  })

  it('lets TOKY_GITHUB_REF override the configured ref', async () => {
    process.env.TOKY_GITHUB_REF = 'feature'
    await expect(getGithubRef()).resolves.toBe('feature')
  })

  it('reads token file metadata from the configured repo', async () => {
    const content = Buffer.from('{}', 'utf-8').toString('base64')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ sha: 'sha', content }))
    vi.stubGlobal('fetch', fetchMock)

    await getBaseTokensFileMeta()

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/acme/extensions/contents/packages/ext-tokens/tokens/Extensions.tokens.json?ref=develop',
    )
  })

  it('lists no brands and makes no request for a source without brands', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(listTokenBrandFiles()).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses to add a brand to a source without brands', async () => {
    vi.stubGlobal('fetch', vi.fn())
    await expect(addBrandToIndex('toky/update-develop', 'Acme')).rejects.toThrow(/no brands/)
  })

  it('looks up open pull requests under the configured owner', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await findOpenPullRequest('toky/update-develop')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/acme/extensions/pulls?head=acme:toky/update-develop&state=open',
    )
  })

  it('reads the token package name next to the token directory', async () => {
    const content = Buffer.from('{"name":"ds-ext-tokens"}', 'utf-8').toString('base64')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ sha: 'sha', content }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getTokenPackageName('main')).resolves.toBe('ds-ext-tokens')
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/acme/extensions/contents/packages/ext-tokens/package.json?ref=main',
    )
  })

  it('checks membership of the configured team in the configured org', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ state: 'active' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(isTeamMember('octocat')).resolves.toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/orgs/acme/teams/conversational/memberships/octocat')
  })
})
