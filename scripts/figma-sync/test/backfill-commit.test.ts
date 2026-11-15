import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function routingFetchMock() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'

    if (url.includes('/contents/packages/tokens/.figma-sync-state.json')) {
      return new Response('not found', { status: 404 })
    }
    if (url.includes('/git/ref/heads/')) {
      return jsonResponse({ object: { sha: 'base-sha' } })
    }
    if (url.includes('/git/commits/base-sha')) {
      return jsonResponse({ tree: { sha: 'tree-sha' } })
    }
    if (method === 'POST' && url.endsWith('/git/blobs')) {
      return jsonResponse({ sha: 'blob-sha' })
    }
    if (method === 'POST' && url.endsWith('/git/trees')) {
      return jsonResponse({ sha: 'new-tree-sha' })
    }
    if (method === 'POST' && url.endsWith('/git/commits')) {
      return jsonResponse({ sha: 'new-commit-sha' })
    }
    if (method === 'PATCH' && url.includes('/git/refs/heads/')) {
      return jsonResponse({})
    }
    throw new Error(`Unexpected fetch call: ${method} ${url}`)
  })
}

beforeEach(() => {
  vi.resetModules()
  process.env.GITHUB_TOKEN = 'test-token'
  process.env.MERGE_COMMIT_SHA = 'merge-sha'
  process.env.REMOVED_IDS = JSON.stringify(['VariableID:1:1'])
  delete process.env.NEW_IDS
  delete process.env.NEW_IDS_FILE
  delete process.env.REMOVED_IDS_FILE
  delete process.env.TARGET_BRANCH
  delete process.env.TOKENS_DIR_OVERRIDE
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.unstubAllGlobals()
})

describe('backfill-commit.mjs TARGET_BRANCH default', () => {
  it('commits to "main" when TARGET_BRANCH is unset', async () => {
    const fetchMock = routingFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    await import('../backfill-commit.mjs')
    await new Promise(resolve => setTimeout(resolve, 0))

    const refHeadsCalls = fetchMock.mock.calls
      .map(([url]) => url as string)
      .filter(url => url.includes('/git/ref/heads/') || url.includes('/git/refs/heads/'))
    expect(refHeadsCalls.length).toBeGreaterThan(0)
    expect(refHeadsCalls.every(url => url.endsWith('/heads/main'))).toBe(true)
  })

  it('respects TARGET_BRANCH when set', async () => {
    process.env.TARGET_BRANCH = 'some-other-branch'
    const fetchMock = routingFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    await import('../backfill-commit.mjs')
    await new Promise(resolve => setTimeout(resolve, 0))

    const refHeadsCalls = fetchMock.mock.calls
      .map(([url]) => url as string)
      .filter(url => url.includes('/git/ref/heads/') || url.includes('/git/refs/heads/'))
    expect(refHeadsCalls.length).toBeGreaterThan(0)
    expect(refHeadsCalls.every(url => url.endsWith('/heads/some-other-branch'))).toBe(true)
  })
})
