import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CORE_TOKY_CONFIG, resolveTokyConfig } from '@helvetia-design/tokens/toky-config'

const { getFileMeta } = vi.hoisted(() => ({ getFileMeta: vi.fn() }))

vi.mock('./github-write', () => ({ getFileMeta }))

const { loadReferenceTokens, pinnedVersion, referenceTokensUrl } = await import('./reference')

const config = resolveTokyConfig({
  repo: { name: 'extensions' },
  referenceTokens: { package: '@helvetia-design/tokens', file: 'tokens/Base.tokens.json' },
})

const coreDoc = {
  '🌐 Global': { '🌈 Color': { White: { $type: 'color', $value: { hex: '#FFFFFF' } } } },
  '🔗 Alias': { Background: { $type: 'color', $value: '{🌐 Global.🌈 Color.White}' } },
}

function manifest(version: string) {
  return {
    sha: 'sha',
    content: JSON.stringify({ name: 'ds-ext-tokens', devDependencies: { '@helvetia-design/tokens': version } }),
  }
}

beforeEach(() => {
  getFileMeta.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pinnedVersion', () => {
  it('reads an exact version from dependencies or devDependencies', () => {
    expect(pinnedVersion({ dependencies: { pkg: '1.2.3' } }, 'pkg')).toBe('1.2.3')
    expect(pinnedVersion({ devDependencies: { pkg: '2.0.0-next.4' } }, 'pkg')).toBe('2.0.0-next.4')
  })

  it.each(['^1.2.3', '~1.2.3', 'workspace:*', 'catalog:', 'latest'])('rejects the range %j', spec => {
    expect(() => pinnedVersion({ dependencies: { pkg: spec } }, 'pkg')).toThrow(/exact version/)
  })

  it('rejects a missing dependency', () => {
    expect(() => pinnedVersion({}, 'pkg')).toThrow(/not a dependency/)
  })
})

describe('referenceTokensUrl', () => {
  it('points at the exact version on jsDelivr', () => {
    expect(referenceTokensUrl('@helvetia-design/tokens', '0.4.0', 'tokens/Base.tokens.json')).toBe(
      'https://cdn.jsdelivr.net/npm/@helvetia-design/tokens@0.4.0/tokens/Base.tokens.json',
    )
  })
})

describe('loadReferenceTokens', () => {
  it('returns nothing and reads nothing without referenceTokens', async () => {
    await expect(loadReferenceTokens(CORE_TOKY_CONFIG, 'main')).resolves.toEqual([])
    expect(getFileMeta).not.toHaveBeenCalled()
  })

  it('loads the pinned version from the token package manifest and resolves it', async () => {
    getFileMeta.mockResolvedValue(manifest('0.4.0'))
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(coreDoc)))
    vi.stubGlobal('fetch', fetchMock)

    const tokens = await loadReferenceTokens(config, 'toky/update-main')

    expect(getFileMeta).toHaveBeenCalledWith('packages/tokens/package.json', 'toky/update-main')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cdn.jsdelivr.net/npm/@helvetia-design/tokens@0.4.0/tokens/Base.tokens.json',
    )
    expect(tokens.map(t => t.path.join('.'))).toEqual(['🌐 Global.🌈 Color.White', '🔗 Alias.Background'])
    expect(tokens[1].resolvedValue).toEqual({ hex: '#FFFFFF' })
  })

  it('fetches each version once per process', async () => {
    getFileMeta.mockResolvedValue(manifest('0.5.0'))
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(coreDoc)))
    vi.stubGlobal('fetch', fetchMock)

    await loadReferenceTokens(config, 'main')
    await loadReferenceTokens(config, 'main')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failed download', async () => {
    getFileMeta.mockResolvedValue(manifest('0.6.0'))
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('nope', { status: 404, statusText: 'Not Found' }))
      .mockResolvedValueOnce(new Response(JSON.stringify(coreDoc)))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadReferenceTokens(config, 'main')).rejects.toThrow(/404/)
    await expect(loadReferenceTokens(config, 'main')).resolves.toHaveLength(2)
  })
})
