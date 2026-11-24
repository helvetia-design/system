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

describe('getFileContent with an explicit repository', () => {
  it('targets the given repository for the contents call', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ sha: 's1', content: Buffer.from('hi').toString('base64') }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { getFileContent } = await import('../lib/github.mjs')
    const file = await getFileContent('a/b.json', 'main', 'test-token', 'other-org/other-repo')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/other-org/other-repo/contents/a/b.json?ref=main',
    )
    expect(file).toEqual({ sha: 's1', content: 'hi' })
  })

  it('targets the given repository for the blob fallback', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ sha: 's1', content: '' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ content: Buffer.from('big').toString('base64') }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { getFileContent } = await import('../lib/github.mjs')
    const file = await getFileContent('a/b.json', 'main', 'test-token', 'other-org/other-repo')

    expect(fetchMock.mock.calls[1][0]).toBe('https://api.github.com/repos/other-org/other-repo/git/blobs/s1')
    expect(file?.content).toBe('big')
  })
})

describe('getFileContent defaults and missing files', () => {
  it('targets GITHUB_REPOSITORY when no repository is given', async () => {
    process.env.GITHUB_REPOSITORY = 'own-org/own-repo'
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ sha: 's1', content: Buffer.from('hi').toString('base64') }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { getFileContent } = await import('../lib/github.mjs')
    await getFileContent('a/b.json', 'main', 'test-token')

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/own-org/own-repo/contents/a/b.json?ref=main')
  })

  it('returns null on 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))

    const { getFileContent } = await import('../lib/github.mjs')
    expect(await getFileContent('a/b.json', 'main', 'test-token', 'other-org/other-repo')).toBeNull()
  })
})

describe('canReadRepository', () => {
  it('is true when the repository answers 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { canReadRepository } = await import('../lib/github.mjs')
    expect(await canReadRepository('other-org/other-repo', 'test-token')).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/other-org/other-repo')
  })

  it('is false when the repository answers 404, as GitHub does for a private repo the token cannot see', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))

    const { canReadRepository } = await import('../lib/github.mjs')
    expect(await canReadRepository('other-org/other-repo', 'test-token')).toBe(false)
  })

  it('throws on any other error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401, statusText: 'Unauthorized' })))

    const { canReadRepository } = await import('../lib/github.mjs')
    await expect(canReadRepository('other-org/other-repo', 'test-token')).rejects.toThrow('401')
  })
})
