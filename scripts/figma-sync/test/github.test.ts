import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.resetModules()
  delete process.env.GITHUB_REPOSITORY
  delete process.env.GITHUB_REPO_OWNER_OVERRIDE
  delete process.env.GITHUB_REPO_NAME_OVERRIDE
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.unstubAllGlobals()
})

async function apiRootUsedFor() {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ object: { sha: 'abc' } }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)

  const { getRefSha } = await import('../lib/github.mjs')
  await getRefSha('main', 'test-token')

  const [url] = fetchMock.mock.calls[0] as [string]
  return url
}

describe('github.mjs repo owner/name defaults', () => {
  it('falls back to helvetia-design/system when GITHUB_REPOSITORY is unset', async () => {
    const url = await apiRootUsedFor()
    expect(url).toBe('https://api.github.com/repos/helvetia-design/system/git/ref/heads/main')
  })

  it('defaults to the repo the workflow runs in, via GITHUB_REPOSITORY', async () => {
    process.env.GITHUB_REPOSITORY = 'some-org/some-repo'
    const url = await apiRootUsedFor()
    expect(url).toBe('https://api.github.com/repos/some-org/some-repo/git/ref/heads/main')
  })

  it('still honors the local-sandbox override env vars over GITHUB_REPOSITORY', async () => {
    process.env.GITHUB_REPOSITORY = 'some-org/some-repo'
    process.env.GITHUB_REPO_OWNER_OVERRIDE = 'scratch-owner'
    process.env.GITHUB_REPO_NAME_OVERRIDE = 'scratch-repo'
    const url = await apiRootUsedFor()
    expect(url).toBe('https://api.github.com/repos/scratch-owner/scratch-repo/git/ref/heads/main')
  })
})
