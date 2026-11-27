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

describe('listIssueComments pagination', () => {
  it('follows the Link header past the first page and finds a marked comment on page 2', async () => {
    const page1 = Array.from({ length: 100 }, (_, index) => ({ id: index, body: `comment ${index}` }))
    const page2 = [
      ...Array.from({ length: 4 }, (_, index) => ({ id: 100 + index, body: 'other' })),
      { id: 104, body: '<!-- marker -->' },
    ]
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/issues/7/comments?per_page=100')) {
        return new Response(JSON.stringify(page1), {
          status: 200,
          headers: {
            Link: '<https://api.github.com/repositories/1/issues/7/comments?per_page=100&page=2>; rel="next", <https://api.github.com/repositories/1/issues/7/comments?per_page=100&page=2>; rel="last"',
          },
        })
      }
      if (url === 'https://api.github.com/repositories/1/issues/7/comments?per_page=100&page=2') {
        return new Response(JSON.stringify(page2), { status: 200 })
      }
      throw new Error(`Unexpected fetch call: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { findMarkedComment, listIssueComments } = await import('../lib/github.mjs')

    expect(await listIssueComments(7, 'test-token')).toHaveLength(105)
    expect(await findMarkedComment(7, '<!-- marker -->', 'test-token')).toEqual({ id: 104, body: '<!-- marker -->' })
  })
})

describe('commitFiles', () => {
  function pinnedFetchMock(refPatchStatus = 200) {
    return vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET' && url.endsWith('/git/commits/pinned-sha'))
        return new Response(JSON.stringify({ tree: { sha: 'pinned-tree' } }), { status: 200 })
      if (method === 'POST' && url.endsWith('/git/blobs'))
        return new Response(JSON.stringify({ sha: 'blob-sha' }), { status: 200 })
      if (method === 'POST' && url.endsWith('/git/trees'))
        return new Response(JSON.stringify({ sha: 'new-tree' }), { status: 200 })
      if (method === 'POST' && url.endsWith('/git/commits'))
        return new Response(JSON.stringify({ sha: 'new-commit' }), { status: 200 })
      if (method === 'PATCH' && url.endsWith('/git/refs/heads/main')) {
        return new Response(JSON.stringify({}), {
          status: refPatchStatus,
          statusText: refPatchStatus === 200 ? 'OK' : 'Unprocessable Entity',
        })
      }
      throw new Error(`Unexpected fetch call: ${method} ${url}`)
    })
  }

  it('builds the commit on the given base sha without reading the ref, and updates the ref without force', async () => {
    const fetchMock = pinnedFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    const { commitFiles } = await import('../lib/github.mjs')

    await commitFiles({
      branch: 'main',
      baseSha: 'pinned-sha',
      files: [{ path: 'a.json', content: '{}' }],
      message: 'msg',
      token: 'test-token',
    })

    const calls = fetchMock.mock.calls
    expect(calls.some(([url]) => (url as string).includes('/git/ref/heads/'))).toBe(false)
    const treeCall = calls.find(([url, init]) => init?.method === 'POST' && (url as string).endsWith('/git/trees'))
    expect(JSON.parse(treeCall?.[1]?.body as string).base_tree).toBe('pinned-tree')
    const commitCall = calls.find(([url, init]) => init?.method === 'POST' && (url as string).endsWith('/git/commits'))
    expect(JSON.parse(commitCall?.[1]?.body as string).parents).toEqual(['pinned-sha'])
    const refCall = calls.find(([, init]) => init?.method === 'PATCH')
    expect(JSON.parse(refCall?.[1]?.body as string)).toEqual({ sha: 'new-commit' })
  })

  it('throws when the ref update is rejected because the branch moved', async () => {
    vi.stubGlobal('fetch', pinnedFetchMock(422))
    const { commitFiles } = await import('../lib/github.mjs')

    await expect(
      commitFiles({ branch: 'main', baseSha: 'pinned-sha', files: [], message: 'msg', token: 'test-token' }),
    ).rejects.toThrow(/fast-forward heads\/main: 422/)
  })
})
