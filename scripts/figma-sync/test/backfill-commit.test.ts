import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
    if (url.includes('/contents/packages/tokens/tokens/Extensions.tokens.json')) {
      return jsonResponse({
        sha: 'ext-file-sha',
        content: Buffer.from(
          JSON.stringify({ '🧩 Component': { Card: { Gap: { $type: 'dimension', $value: '{🔗 Alias.Gap}' } } } }),
        ).toString('base64'),
      })
    }
    if (url.includes('/contents/packages/tokens/tokens/Base.tokens.json')) {
      return jsonResponse({ sha: 'base-file-sha', content: Buffer.from('{}').toString('base64') })
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
  delete process.env.TOKY_CONFIG_PATH
  delete process.env.TOKENS_ROOT
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

describe('backfill-commit.mjs value-only sync (no new/removed ids)', () => {
  it('still refreshes the baseline entry for a token whose value changed without touching its variableId', async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'figma-sync-baseline-'))
    const tokensDir = join(repoRoot, 'tokens')
    mkdirSync(tokensDir)

    writeFileSync(
      join(tokensDir, 'Base.tokens.json'),
      JSON.stringify({
        '🌐 Global': {
          '🌈 Color': {
            Brand: {
              $type: 'color',
              $value: { colorSpace: 'srgb', components: [0.6, 0, 0], alpha: 1, hex: '#990000' },
              $extensions: { 'com.figma.variableId': 'VariableID:1:1', 'com.figma.scopes': ['ALL_SCOPES'] },
            },
          },
        },
      }),
    )
    writeFileSync(
      join(repoRoot, '.figma-sync-state.json'),
      JSON.stringify({
        lastSyncedCommit: 'old-sha',
        lastSyncedAt: '2026-01-01T00:00:00Z',
        entries: {
          'VariableID:1:1': {
            tokenPath: ['🌐 Global', '🌈 Color', 'Brand'],
            resolvedValue: {
              kind: 'literal',
              value: { colorSpace: 'srgb', components: [0.5, 0, 0], alpha: 1, hex: '#800000' },
            },
            lastModifiedSource: 'code',
            lastModifiedAt: '2026-01-01T00:00:00Z',
          },
        },
      }),
    )

    delete process.env.REMOVED_IDS
    delete process.env.NEW_IDS
    delete process.env.NEW_IDS_FILE
    delete process.env.REMOVED_IDS_FILE
    delete process.env.GITHUB_TOKEN
    process.env.TOKENS_DIR_OVERRIDE = tokensDir
    process.env.MERGE_COMMIT_SHA = 'merge-sha-2'

    await import('../backfill-commit.mjs')
    await new Promise(resolve => setTimeout(resolve, 0))

    const refreshed = JSON.parse(readFileSync(join(repoRoot, '.figma-sync-state.json'), 'utf-8'))
    expect(refreshed.lastSyncedCommit).toBe('merge-sha-2')
    expect(refreshed.entries['VariableID:1:1'].resolvedValue.value.components).toEqual([0.6, 0, 0])
  })
})

describe('backfill-commit.mjs extension source', () => {
  it('reads and writes the token file and sync state named by the Toky config', async () => {
    const root = mkdtempSync(join(tmpdir(), 'figma-sync-ext-backfill-'))
    const configPath = join(root, 'toky.config.json')
    writeFileSync(configPath, JSON.stringify({ tokenFile: 'Extensions.tokens.json', brandsIndexPath: null }))
    process.env.TOKY_CONFIG_PATH = configPath
    process.env.TOKENS_ROOT = root
    delete process.env.REMOVED_IDS
    process.env.NEW_IDS = JSON.stringify([{ path: ['🧩 Component', 'Card', 'Gap'], variableId: 'VariableID:ext:1' }])
    const fetchMock = routingFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    await import('../backfill-commit.mjs')
    await new Promise(resolve => setTimeout(resolve, 0))

    const urls = fetchMock.mock.calls.map(([url]) => url as string)
    expect(urls.some(url => url.includes('/contents/packages/tokens/tokens/Base.tokens.json'))).toBe(false)
    expect(urls.some(url => url.includes('/contents/packages/tokens/tokens/Extensions.tokens.json'))).toBe(true)

    const treeCall = fetchMock.mock.calls.find(([url, init]) => init?.method === 'POST' && url.endsWith('/git/trees'))
    const treePaths = JSON.parse(treeCall?.[1]?.body as string).tree.map((entry: { path: string }) => entry.path)
    expect(treePaths).toEqual([
      'packages/tokens/tokens/Extensions.tokens.json',
      'packages/tokens/.figma-sync-state.json',
    ])
  })
})
