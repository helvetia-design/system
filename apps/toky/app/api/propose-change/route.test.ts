import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CORE_TOKY_CONFIG, resolveTokyConfig } from '@helvetia-design/tokens/toky-config'
import type { TokenDiffEntry } from '@/src/tokens/edit'

const {
  getBaseTokensFileMeta,
  getBrandTokensFileMeta,
  listTokenBrandFiles,
  resolveReadRef,
  createBranch,
  updateFileOnBranch,
  updateFileAtPath,
  createFileOnBranch,
  createBrandFile,
  addBrandToIndex,
  openPullRequest,
  findOpenPullRequest,
  updatePullRequestBody,
  getTokenPackageName,
  getTokenOwnerLogin,
  getTokyConfig,
  auth,
} = vi.hoisted(() => ({
  getBaseTokensFileMeta: vi.fn(),
  getBrandTokensFileMeta: vi.fn(),
  listTokenBrandFiles: vi.fn(),
  resolveReadRef: vi.fn(),
  createBranch: vi.fn(),
  updateFileOnBranch: vi.fn(),
  updateFileAtPath: vi.fn(),
  createFileOnBranch: vi.fn(),
  createBrandFile: vi.fn(),
  addBrandToIndex: vi.fn(),
  openPullRequest: vi.fn(),
  findOpenPullRequest: vi.fn(),
  updatePullRequestBody: vi.fn(),
  getTokenPackageName: vi.fn(),
  getTokenOwnerLogin: vi.fn(),
  getTokyConfig: vi.fn(),
  auth: vi.fn(),
}))

vi.mock('@/src/tokens/github-write', async importOriginal => {
  const actual = await importOriginal<typeof import('@/src/tokens/github-write')>()
  return {
    ...actual,
    getBaseTokensFileMeta,
    getBrandTokensFileMeta,
    listTokenBrandFiles,
    resolveReadRef,
    createBranch,
    updateFileOnBranch,
    updateFileAtPath,
    createFileOnBranch,
    createBrandFile,
    addBrandToIndex,
    openPullRequest,
    findOpenPullRequest,
    updatePullRequestBody,
    getTokenPackageName,
    getTokenOwnerLogin,
  }
})

vi.mock('@/src/tokens/config', async importOriginal => {
  const actual = await importOriginal<typeof import('@/src/tokens/config')>()
  return { ...actual, getTokyConfig }
})

vi.mock('@/auth', () => ({ auth }))

const { POST } = await import('./route')

const fixtureDoc = {
  '🌐 Global': {
    '🌈 Color': {
      White: { $type: 'color', $value: { hex: '#FFFFFF' } },
    },
  },
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/propose-change', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const cleanDiff: TokenDiffEntry[] = [
  {
    kind: 'update',
    layer: 'Global',
    oldPath: ['🌐 Global', '🌈 Color', 'White'],
    newPath: ['🌐 Global', '🌈 Color', 'White'],
    type: 'color',
    value: { hex: '#EEEEEE' },
    before: { hex: '#FFFFFF' }, // matches fixtureDoc's current value — clean
  },
]

const zurichFixtureDoc = {
  '🌐 Global': {
    '🌈 Color': {
      Black: { $type: 'color', $value: { hex: '#000000' } },
    },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.mockResolvedValue({ user: { login: 'octocat', isTeamMember: true } })
  getBaseTokensFileMeta.mockResolvedValue({ sha: 'file-sha', content: fixtureDoc })
  getBrandTokensFileMeta.mockResolvedValue({ sha: 'zurich-sha', content: zurichFixtureDoc })
  listTokenBrandFiles.mockResolvedValue(['Zurich'])
  resolveReadRef.mockResolvedValue({
    ref: 'main',
    status: { state: 'synced', baseRef: 'main', prUrl: null, prNumber: null },
  })
  createBranch.mockResolvedValue(undefined)
  updateFileOnBranch.mockResolvedValue(undefined)
  updateFileAtPath.mockResolvedValue(undefined)
  createFileOnBranch.mockResolvedValue(undefined)
  createBrandFile.mockResolvedValue(undefined)
  addBrandToIndex.mockResolvedValue(undefined)
  openPullRequest.mockResolvedValue({
    url: 'https://github.com/helvetia-design/system/pull/7',
    number: 7,
    body: 'initial body',
  })
  findOpenPullRequest.mockResolvedValue(null)
  updatePullRequestBody.mockResolvedValue(undefined)
  getTokenPackageName.mockResolvedValue('@helvetia-design/tokens')
  getTokyConfig.mockResolvedValue(CORE_TOKY_CONFIG)
  getTokenOwnerLogin.mockResolvedValue('token-owner')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/propose-change', () => {
  it('rejects an unauthenticated request without touching GitHub', async () => {
    auth.mockResolvedValue(null)

    const response = await POST(makeRequest({ diff: cleanDiff, description: '' }))
    expect(response.status).toBe(401)
    expect(resolveReadRef).not.toHaveBeenCalled()
  })

  it('rejects an empty diff without touching GitHub', async () => {
    const response = await POST(makeRequest({ diff: [], description: '' }))
    expect(response.status).toBe(400)
    expect(resolveReadRef).not.toHaveBeenCalled()
  })

  it('returns a 409 conflict and opens nothing when the current value differs from "before"', async () => {
    const diff: TokenDiffEntry[] = [
      {
        kind: 'update',
        layer: 'Global',
        oldPath: ['🌐 Global', '🌈 Color', 'White'],
        newPath: ['🌐 Global', '🌈 Color', 'White'],
        type: 'color',
        value: { hex: '#EEEEEE' },
        before: { hex: '#000000' }, // stale — doesn't match fixtureDoc's current #FFFFFF
      },
    ]

    const response = await POST(makeRequest({ diff, description: '' }))
    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.conflicts).toEqual([{ path: '🌐 Global.🌈 Color.White', reason: 'changed' }])
    expect(createBranch).not.toHaveBeenCalled()
    expect(updateFileOnBranch).not.toHaveBeenCalled()
    expect(openPullRequest).not.toHaveBeenCalled()
  })

  it('returns a 409 conflict when a create target already exists', async () => {
    const diff: TokenDiffEntry[] = [
      {
        kind: 'create',
        layer: 'Global',
        oldPath: null,
        newPath: ['🌐 Global', '🌈 Color', 'White'],
        type: 'color',
        value: { hex: '#123456' },
        before: undefined,
      },
    ]

    const response = await POST(makeRequest({ diff, description: '' }))
    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.conflicts).toEqual([{ path: '🌐 Global.🌈 Color.White', reason: 'already-exists' }])
  })

  it('creates a branch, updates the file, adds a changeset, and opens a PR the first time', async () => {
    const response = await POST(makeRequest({ diff: cleanDiff, description: 'Lighten white slightly' }))
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual({ url: 'https://github.com/helvetia-design/system/pull/7', number: 7 })

    expect(resolveReadRef).toHaveBeenCalledWith('main')
    expect(createBranch).toHaveBeenCalledTimes(1)
    expect(updateFileOnBranch).toHaveBeenCalledTimes(1)
    expect(createFileOnBranch).toHaveBeenCalledTimes(1)
    expect(openPullRequest).toHaveBeenCalledTimes(1)
    expect(findOpenPullRequest).not.toHaveBeenCalled()
    expect(updatePullRequestBody).not.toHaveBeenCalled()

    const [branch, , sha] = updateFileOnBranch.mock.calls[0]
    expect(branch).toBe('toky/update-main')
    expect(sha).toBe('file-sha') // read from base (synced) — base's sha

    const [changesetBranch, changesetPath, changesetContent] = createFileOnBranch.mock.calls[0]
    expect(changesetBranch).toBe('toky/update-main')
    expect(changesetPath).toMatch(/^\.changeset\/toky-update-main-\d+\.md$/)
    expect(changesetContent).toContain("'@helvetia-design/tokens': patch")
    expect(changesetContent).toContain('**tokens**: Lighten white slightly')

    expect(getBaseTokensFileMeta).toHaveBeenCalledWith('main')
    const [, baseRef] = createBranch.mock.calls[0]
    expect(baseRef).toBe('main')
    const [prBranch, , , base] = openPullRequest.mock.calls[0]
    expect(prBranch).toBe('toky/update-main')
    expect(base).toBe('main')
  })

  it('credits the token owner when auth is disabled locally', async () => {
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TOKY_DISABLE_AUTH', 'true')
    auth.mockResolvedValue(null)

    const response = await POST(makeRequest({ diff: cleanDiff, description: '' }))

    expect(response.status).toBe(200)
    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain('Submitted via the Toky web app by @token-owner.')
  })

  it('ignores TOKY_DISABLE_AUTH on Vercel and still requires a session', async () => {
    vi.stubEnv('VERCEL', '1')
    vi.stubEnv('TOKY_DISABLE_AUTH', 'true')
    auth.mockResolvedValue(null)

    const response = await POST(makeRequest({ diff: cleanDiff, description: '' }))

    expect(response.status).toBe(401)
    expect(getTokenOwnerLogin).not.toHaveBeenCalled()
  })

  it('lists a changed reference as old target → new target in the PR body', async () => {
    getBaseTokensFileMeta.mockResolvedValue({
      sha: 'file-sha',
      content: {
        '🌐 Global': {
          '🌈 Color': {
            Black: { $type: 'color', $value: { hex: '#000000' } },
            Grey: { $type: 'color', $value: { hex: '#888888' } },
            White: { $type: 'color', $value: '{🌐 Global.🌈 Color.Black}' },
          },
        },
      },
    })
    const referenceDiff = [
      { ...cleanDiff[0], before: '{🌐 Global.🌈 Color.Black}', value: '{🌐 Global.🌈 Color.Grey}' },
    ]

    await POST(makeRequest({ diff: referenceDiff, description: '' }))

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain('White: 🌐 Global/🌈 Color/Black → 🌐 Global/🌈 Color/Grey')
  })

  it('credits the signed-in user in the initial PR body, not any client-supplied field', async () => {
    await POST(
      makeRequest({ diff: cleanDiff, description: 'Lighten white slightly', submitter: 'someone-else' } as never),
    )

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain('Submitted via the Toky web app by @octocat.')
    expect(prBody).not.toContain('someone-else')
  })

  it('credits the signed-in user when appending to an already-open PR', async () => {
    resolveReadRef.mockResolvedValue({
      ref: 'toky/update-next',
      status: {
        state: 'pending',
        baseRef: 'main',
        prUrl: 'https://github.com/helvetia-design/system/pull/7',
        prNumber: 7,
      },
    })
    findOpenPullRequest.mockResolvedValue({
      url: 'https://github.com/helvetia-design/system/pull/7',
      number: 7,
      body: 'initial body',
    })

    await POST(makeRequest({ diff: cleanDiff, description: '' }))

    const [, updatedBody] = updatePullRequestBody.mock.calls[0]
    expect(updatedBody).toContain('Additional changes by @octocat —')
  })

  it('labels an entry as "via Figma pull" in the PR body when its path is in pulledPaths', async () => {
    await POST(
      makeRequest({
        diff: cleanDiff,
        description: '',
        pulledPaths: ['🌐 Global.🌈 Color.White'],
      }),
    )

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain('**Updated (via Figma pull):**\n- 🌐 Global.🌈 Color.White: #FFFFFF → #EEEEEE')
    expect(prBody).not.toMatch(/\*\*Updated:\*\*/)
  })

  it('ignores a pulledPaths entry that does not match any diff path', async () => {
    await POST(makeRequest({ diff: cleanDiff, description: '', pulledPaths: ['not.a.real.path'] }))

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain('**Updated:**\n- 🌐 Global.🌈 Color.White: #FFFFFF → #EEEEEE')
    expect(prBody).not.toMatch(/via Figma pull/)
  })

  it('shows the new value for a created token', async () => {
    const createDiff: TokenDiffEntry[] = [
      {
        kind: 'create',
        layer: 'Global',
        oldPath: null,
        newPath: ['🌐 Global', '🌈 Color', 'Brand'],
        type: 'color',
        value: { hex: '#123456' },
        before: undefined,
      },
    ]

    await POST(makeRequest({ diff: createDiff, description: '' }))

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain('**Created:**\n- 🌐 Global.🌈 Color.Brand = #123456')
  })

  it('notes a figmaId-only update (Pull adoption backfill) without a value change', async () => {
    const linkOnlyDiff: TokenDiffEntry[] = [
      {
        kind: 'update',
        layer: 'Global',
        oldPath: ['🌐 Global', '🌈 Color', 'White'],
        newPath: ['🌐 Global', '🌈 Color', 'White'],
        type: 'color',
        value: { hex: '#FFFFFF' },
        before: { hex: '#FFFFFF' }, // unchanged — only the figmaId link is new
        figmaId: 'VariableID:38:2',
      },
    ]

    await POST(makeRequest({ diff: linkOnlyDiff, description: '' }))

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain(
      '**Updated:**\n- 🌐 Global.🌈 Color.White (linked to Figma variable VariableID:38:2, value unchanged)',
    )
  })

  it('shows a rename combined with a value change', async () => {
    const renameAndValueDiff: TokenDiffEntry[] = [
      {
        kind: 'update',
        layer: 'Global',
        oldPath: ['🌐 Global', '🌈 Color', 'White'],
        newPath: ['🌐 Global', '🌈 Color', 'OffWhite'],
        type: 'color',
        value: { hex: '#EEEEEE' },
        before: { hex: '#FFFFFF' },
      },
    ]

    await POST(makeRequest({ diff: renameAndValueDiff, description: '' }))

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain(
      '**Updated:**\n- 🌐 Global.🌈 Color.White → 🌐 Global.🌈 Color.OffWhite: #FFFFFF → #EEEEEE',
    )
  })

  it('shows the removed value for a deleted token', async () => {
    const deleteDiff: TokenDiffEntry[] = [
      {
        kind: 'delete',
        layer: 'Global',
        oldPath: ['🌐 Global', '🌈 Color', 'White'],
        newPath: null,
        type: 'color',
        value: undefined,
        before: fixtureDoc['🌐 Global']['🌈 Color'].White.$value, // matches current value — clean
      },
    ]

    await POST(makeRequest({ diff: deleteDiff, description: '' }))

    const [, , prBody] = openPullRequest.mock.calls[0]
    expect(prBody).toContain('**Deleted:**\n- 🌐 Global.🌈 Color.White (was #FFFFFF)')
  })

  it('reuses the existing branch and appends to the open PR body on a second submit', async () => {
    resolveReadRef.mockResolvedValue({
      ref: 'toky/update-next',
      status: {
        state: 'pending',
        baseRef: 'next',
        prUrl: 'https://github.com/helvetia-design/system/pull/7',
        prNumber: 7,
      },
    })
    getBaseTokensFileMeta.mockResolvedValue({ sha: 'branch-file-sha', content: fixtureDoc })
    findOpenPullRequest.mockResolvedValue({
      url: 'https://github.com/helvetia-design/system/pull/7',
      number: 7,
      body: 'Submitted via the Toky web app.\n\n**Updated:** old.path',
    })

    const response = await POST(makeRequest({ diff: cleanDiff, description: 'Another round of edits' }))
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual({ url: 'https://github.com/helvetia-design/system/pull/7', number: 7 })

    expect(createBranch).not.toHaveBeenCalled()
    expect(openPullRequest).not.toHaveBeenCalled()
    expect(getBaseTokensFileMeta).toHaveBeenCalledWith('toky/update-next')

    // Uses the branch's own current file sha, not base's, since the branch
    // may already carry an earlier unmerged commit.
    const [, , sha] = updateFileOnBranch.mock.calls[0]
    expect(sha).toBe('branch-file-sha')

    // Appends to the existing body — the prior submit's activity log entry
    // must survive, not get overwritten.
    expect(updatePullRequestBody).toHaveBeenCalledTimes(1)
    const [prNumber, newBody] = updatePullRequestBody.mock.calls[0]
    expect(prNumber).toBe(7)
    expect(newBody).toContain('**Updated:** old.path')
    expect(newBody).toContain('Additional changes')
    expect(newBody).toContain('Another round of edits')
  })

  it('falls back to opening a new PR if the branch exists but has no open PR', async () => {
    resolveReadRef.mockResolvedValue({
      ref: 'toky/update-next',
      status: { state: 'pending', baseRef: 'main', prUrl: null, prNumber: null },
    })
    getBaseTokensFileMeta.mockResolvedValue({ sha: 'branch-file-sha', content: fixtureDoc })
    findOpenPullRequest.mockResolvedValue(null)
    openPullRequest.mockResolvedValue({
      url: 'https://github.com/helvetia-design/system/pull/11',
      number: 11,
      body: 'initial body',
    })

    const response = await POST(makeRequest({ diff: cleanDiff, description: '' }))
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual({ url: 'https://github.com/helvetia-design/system/pull/11', number: 11 })

    expect(createBranch).not.toHaveBeenCalled()
    expect(openPullRequest).toHaveBeenCalledTimes(1)
    expect(updatePullRequestBody).not.toHaveBeenCalled()
  })

  it('opens the PR against a caller-supplied target branch', async () => {
    resolveReadRef.mockResolvedValue({
      ref: 'release/2026-08',
      status: { state: 'synced', baseRef: 'main', prUrl: null, prNumber: null },
    })

    const response = await POST(makeRequest({ diff: cleanDiff, description: '', targetBranch: 'release/2026-08' }))
    expect(response.status).toBe(200)

    expect(resolveReadRef).toHaveBeenCalledWith('release/2026-08')
    expect(getBaseTokensFileMeta).toHaveBeenCalledWith('release/2026-08')
    const [, baseRef] = createBranch.mock.calls[0]
    expect(baseRef).toBe('release/2026-08')
    const [, , , base] = openPullRequest.mock.calls[0]
    expect(base).toBe('release/2026-08')
  })

  it('rejects a malformed target branch name without touching GitHub', async () => {
    const response = await POST(makeRequest({ diff: cleanDiff, description: '', targetBranch: 'has a space' }))
    expect(response.status).toBe(400)
    expect(resolveReadRef).not.toHaveBeenCalled()
  })

  it('creates a brand file, wires it into the build, and skips the token-file write when there is no diff', async () => {
    const response = await POST(makeRequest({ diff: [], description: '', newBrands: ['Acme'] }))
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toEqual({ url: 'https://github.com/helvetia-design/system/pull/7', number: 7 })

    expect(updateFileOnBranch).not.toHaveBeenCalled()
    expect(createBrandFile).toHaveBeenCalledWith('toky/update-main', 'Acme')
    expect(addBrandToIndex).toHaveBeenCalledWith('toky/update-main', 'Acme')

    const [, , changesetContent] = createFileOnBranch.mock.calls[0]
    expect(changesetContent).toContain("'@helvetia-design/tokens': minor")
    expect(changesetContent).toContain('**Created brand:** Acme')
  })

  it('submits a brand alongside a token diff in the same PR', async () => {
    const response = await POST(
      makeRequest({ diff: cleanDiff, description: 'Update white, add Acme', newBrands: ['Acme'] }),
    )
    expect(response.status).toBe(200)

    expect(updateFileOnBranch).toHaveBeenCalledTimes(1)
    expect(createBrandFile).toHaveBeenCalledWith('toky/update-main', 'Acme')
    expect(addBrandToIndex).toHaveBeenCalledWith('toky/update-main', 'Acme')
  })

  it('rejects a badly-formatted brand name with a 400 before touching GitHub', async () => {
    const response = await POST(makeRequest({ diff: [], description: '', newBrands: ['acme'] }))
    expect(response.status).toBe(400)
    expect(resolveReadRef).not.toHaveBeenCalled()
  })

  it('rejects "Base" as a reserved brand name', async () => {
    const response = await POST(makeRequest({ diff: [], description: '', newBrands: ['Base'] }))
    expect(response.status).toBe(400)
  })

  it('rejects the same brand name submitted twice in one request', async () => {
    const response = await POST(makeRequest({ diff: [], description: '', newBrands: ['Acme', 'Acme'] }))
    expect(response.status).toBe(400)
  })

  it('409s when the brand name already exists on GitHub, without creating anything', async () => {
    listTokenBrandFiles.mockResolvedValue(['Zurich', 'Acme'])

    const response = await POST(makeRequest({ diff: [], description: '', newBrands: ['Acme'] }))
    expect(response.status).toBe(409)
    const json = await response.json()
    expect(json.conflicts).toEqual([{ path: 'Acme', reason: 'already-exists' }])
    expect(createBrandFile).not.toHaveBeenCalled()
    expect(createBranch).not.toHaveBeenCalled()
  })

  describe('brandDiffs (overriding an existing brand)', () => {
    const zurichCleanDiff: TokenDiffEntry[] = [
      {
        kind: 'update',
        layer: 'Global',
        oldPath: ['🌐 Global', '🌈 Color', 'Black'],
        newPath: ['🌐 Global', '🌈 Color', 'Black'],
        type: 'color',
        value: { hex: '#111111' },
        before: { hex: '#000000' }, // matches zurichFixtureDoc's current value — clean
      },
    ]

    it('writes the brand overrides to its own file using its own sha', async () => {
      const response = await POST(makeRequest({ diff: [], description: '', brandDiffs: { Zurich: zurichCleanDiff } }))
      expect(response.status).toBe(200)

      expect(getBrandTokensFileMeta).toHaveBeenCalledWith('Zurich', 'main')
      expect(updateFileAtPath).toHaveBeenCalledTimes(1)
      const [branch, path, content, sha] = updateFileAtPath.mock.calls[0]
      expect(branch).toBe('toky/update-main')
      expect(path).toBe('packages/tokens/tokens/Zurich.tokens.json')
      expect(sha).toBe('zurich-sha')
      expect(JSON.parse(content)).toEqual({
        '🌐 Global': { '🌈 Color': { Black: { $type: 'color', $value: { hex: '#111111' } } } },
      })
      // A brand-only change isn't a token edit — Base's own file is untouched.
      expect(updateFileOnBranch).not.toHaveBeenCalled()
    })

    it('409s when the brand file changed since the diff was computed', async () => {
      const staleDiff: TokenDiffEntry[] = [
        { ...zurichCleanDiff[0], before: { hex: '#ABCDEF' } }, // stale — doesn't match zurichFixtureDoc's #000000
      ]

      const response = await POST(makeRequest({ diff: [], description: '', brandDiffs: { Zurich: staleDiff } }))
      expect(response.status).toBe(409)
      const json = await response.json()
      expect(json.conflicts).toEqual([{ path: 'Zurich: 🌐 Global.🌈 Color.Black', reason: 'changed' }])
      expect(updateFileAtPath).not.toHaveBeenCalled()
    })

    it('400s when the brand no longer exists and is not being created in the same request', async () => {
      listTokenBrandFiles.mockResolvedValue([]) // Zurich no longer on GitHub

      const response = await POST(makeRequest({ diff: [], description: '', brandDiffs: { Zurich: zurichCleanDiff } }))
      expect(response.status).toBe(400)
      expect(getBrandTokensFileMeta).not.toHaveBeenCalled()
    })

    it('bakes overrides directly into the initial file when creating and overriding the same brand', async () => {
      const acmeDiff: TokenDiffEntry[] = [
        {
          kind: 'create',
          layer: 'Global',
          oldPath: null,
          newPath: ['🌐 Global', '🌈 Color', 'White'],
          type: 'color',
          value: { hex: '#EEEEEE' },
          before: undefined,
        },
      ]

      const response = await POST(
        makeRequest({
          diff: [],
          description: '',
          newBrands: ['Acme'],
          brandDiffs: { Acme: acmeDiff },
        }),
      )
      expect(response.status).toBe(200)

      expect(createBrandFile).not.toHaveBeenCalled()
      expect(getBrandTokensFileMeta).not.toHaveBeenCalledWith('Acme', expect.anything())
      const [branch, path, content] = createFileOnBranch.mock.calls.find(
        call => call[1] === 'packages/tokens/tokens/Acme.tokens.json',
      )!
      expect(branch).toBe('toky/update-main')
      expect(path).toBe('packages/tokens/tokens/Acme.tokens.json')
      expect(JSON.parse(content)).toEqual({
        '🌐 Global': { '🌈 Color': { White: { $type: 'color', $value: { hex: '#EEEEEE' } } } },
      })
      expect(addBrandToIndex).toHaveBeenCalledWith('toky/update-main', 'Acme')
    })

    it('mentions brand overrides in the changeset and PR body', async () => {
      const response = await POST(makeRequest({ diff: [], description: '', brandDiffs: { Zurich: zurichCleanDiff } }))
      expect(response.status).toBe(200)

      const [, , changesetContent] = createFileOnBranch.mock.calls[0]
      expect(changesetContent).toContain('**Zurich — Overridden:** 🌐 Global/🌈 Color/Black')

      const [, , prBody] = openPullRequest.mock.calls[0]
      expect(prBody).toContain('**Zurich — Overridden:**\n- 🌐 Global.🌈 Color.Black: #000000 → #111111')
    })
  })

  describe('instance config', () => {
    const extensionsConfig = resolveTokyConfig({
      repo: { name: 'extensions' },
      tokenFile: 'Extensions.tokens.json',
      brandsIndexPath: null,
      editableLayers: ['🧩 Component'],
    })

    const componentCreate: TokenDiffEntry = {
      kind: 'create',
      layer: 'Component',
      oldPath: null,
      newPath: ['🧩 Component', 'PolicyCard', 'Padding'],
      type: 'dimension',
      value: '{🔗 Alias.↔️ Space.Padding.SM}',
      before: undefined,
    }

    beforeEach(() => {
      getTokyConfig.mockResolvedValue(extensionsConfig)
      getTokenPackageName.mockResolvedValue('ds-ext-tokens')
    })

    it('rejects an edit in a layer outside editableLayers without touching GitHub', async () => {
      const response = await POST(makeRequest({ diff: cleanDiff, description: '' }))
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'The layer "🌐 Global" is read-only in this Toky instance.' })
      expect(resolveReadRef).not.toHaveBeenCalled()
    })

    it('rejects moving a token between an editable and a read-only layer in either direction', async () => {
      const moveOut: TokenDiffEntry = {
        ...componentCreate,
        kind: 'update',
        layer: 'Alias',
        oldPath: ['🧩 Component', 'PolicyCard', 'Padding'],
        newPath: ['🔗 Alias', 'PolicyCard', 'Padding'],
      }
      const moveIn: TokenDiffEntry = {
        ...componentCreate,
        kind: 'update',
        oldPath: ['🔗 Alias', 'PolicyCard', 'Padding'],
        newPath: ['🧩 Component', 'PolicyCard', 'Padding'],
      }
      expect((await POST(makeRequest({ diff: [moveOut], description: '' }))).status).toBe(403)
      expect((await POST(makeRequest({ diff: [moveIn], description: '' }))).status).toBe(403)
      expect(createBranch).not.toHaveBeenCalled()
    })

    it('rejects a path segment that is not a string, even if it would coerce to an editable layer', async () => {
      const smuggled = {
        ...componentCreate,
        newPath: [['🌐 Global'], '🌈 Color', 'Evil'],
      } as unknown as TokenDiffEntry
      const response = await POST(makeRequest({ diff: [smuggled], description: '' }))
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Every token path must be an array of non-empty strings.' })
      expect(resolveReadRef).not.toHaveBeenCalled()
    })

    it('rejects a path that does not belong to the entry layer', async () => {
      const mismatch: TokenDiffEntry = { ...componentCreate, newPath: ['🌐 Global', '🌈 Color', 'Evil'] }
      const response = await POST(makeRequest({ diff: [mismatch], description: '' }))
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: 'The path "🌐 Global.🌈 Color.Evil" is not in the Component layer.',
      })
      expect(createBranch).not.toHaveBeenCalled()
    })

    it('rejects an unknown layer and a change that is not an object', async () => {
      const unknownLayer = { ...componentCreate, layer: 'Secret' } as unknown as TokenDiffEntry
      expect((await POST(makeRequest({ diff: [unknownLayer], description: '' }))).status).toBe(400)
      expect((await POST(makeRequest({ diff: [null], description: '' }))).status).toBe(400)
      expect(resolveReadRef).not.toHaveBeenCalled()
    })

    it('applies editableLayers and the path checks to brand overrides too', async () => {
      getTokyConfig.mockResolvedValue(resolveTokyConfig({ editableLayers: ['🧩 Component'] }))
      const globalOverride: TokenDiffEntry = {
        kind: 'update',
        layer: 'Global',
        oldPath: ['🌐 Global', '🌈 Color', 'Black'],
        newPath: ['🌐 Global', '🌈 Color', 'Black'],
        type: 'color',
        value: { hex: '#111111' },
        before: { hex: '#000000' },
      }
      const smuggled = { ...componentCreate, newPath: ['🧩 Component', 42, 'X'] } as unknown as TokenDiffEntry

      const locked = await POST(makeRequest({ diff: [], description: '', brandDiffs: { Zurich: [globalOverride] } }))
      expect(locked.status).toBe(403)
      expect(await locked.json()).toEqual({ error: 'The layer "🌐 Global" is read-only in this Toky instance.' })

      const malformed = await POST(makeRequest({ diff: [], description: '', brandDiffs: { Zurich: [smuggled] } }))
      expect(malformed.status).toBe(400)
      expect(await malformed.json()).toEqual({ error: 'Every token path must be an array of non-empty strings.' })

      expect(resolveReadRef).not.toHaveBeenCalled()
    })

    it('rejects every edit when editableLayers is empty', async () => {
      getTokyConfig.mockResolvedValue(resolveTokyConfig({ editableLayers: [] }))
      const response = await POST(makeRequest({ diff: [componentCreate], description: '' }))
      expect(response.status).toBe(403)
    })

    it('rejects brand changes for a source without brands', async () => {
      const response = await POST(makeRequest({ diff: [], description: '', newBrands: ['Acme'] }))
      expect(response.status).toBe(400)
      expect(createBrandFile).not.toHaveBeenCalled()
    })

    it('accepts an edit in an editable layer and bumps the token package named in its package.json', async () => {
      const response = await POST(makeRequest({ diff: [componentCreate], description: 'Add padding' }))
      expect(response.status).toBe(200)
      expect(updateFileOnBranch).toHaveBeenCalled()
      const [, , changesetContent] = createFileOnBranch.mock.calls[0]
      expect(changesetContent).toContain("'ds-ext-tokens': minor")
    })
  })
})
