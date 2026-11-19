import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CORE_TOKY_CONFIG, resolveTokyConfig, TokyConfigError } from '@helvetia-design/tokens/toky-config'
import { CORE_CLIENT_SETTINGS, getTokyConfig, loadTokyConfig, parseTokyConfigSource, toClientSettings } from './config'

const originalEnv = { ...process.env }

const extensionsOverrides = {
  repo: { name: 'extensions' },
  tokenFile: 'Extensions.tokens.json',
  brandsIndexPath: null,
  figmaCollection: 'Extension Tokens',
  figmaModes: ['Default'],
  editableLayers: ['🧩 Component'],
  referenceTokens: { package: '@helvetia-design/tokens', file: 'tokens/Base.tokens.json' },
  previewUrl: 'http://localhost:4040/playground.html',
}

function rawResponse(body: string, status = 200): Response {
  return new Response(body, { status })
}

beforeEach(() => {
  process.env.TOKY_GITHUB_TOKEN = 'test-token'
  delete process.env.TOKY_CONFIG_SOURCE
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.unstubAllGlobals()
})

describe('parseTokyConfigSource', () => {
  it('parses owner, repo, and path', () => {
    expect(parseTokyConfigSource('helvetia-design/extensions:packages/tokens/toky.config.json')).toEqual({
      owner: 'helvetia-design',
      repo: 'extensions',
      path: 'packages/tokens/toky.config.json',
      ref: null,
    })
  })

  it('parses an optional ref', () => {
    expect(parseTokyConfigSource('helvetia-design/extensions:packages/tokens/toky.config.json@release/1.0')).toEqual({
      owner: 'helvetia-design',
      repo: 'extensions',
      path: 'packages/tokens/toky.config.json',
      ref: 'release/1.0',
    })
  })

  it.each(['', 'extensions:toky.config.json', 'helvetia-design/extensions', 'a/b/c:toky.config.json', 'a/b:'])(
    'rejects %j',
    value => {
      expect(() => parseTokyConfigSource(value)).toThrow(/TOKY_CONFIG_SOURCE must look like/)
    },
  )
})

describe('resolveTokyConfig', () => {
  it.each([
    [{ editableLayers: ['Component'] }, /editableLayers\[0\]: expected one of/],
    [{ editableLayers: ['🧩 Component', '🧩 Component'] }, /editableLayers: contains duplicates/],
    [{ tokenFile: '../Base.tokens.json' }, /tokenFile: expected a file name/],
    [{ tokenFile: 'tokens/Base.tokens.json' }, /tokenFile: expected a file name/],
    [{ tokenFile: 'Base.json' }, /tokenFile: expected a file name/],
    [{ previewUrl: 'playground.html' }, /previewUrl: expected an absolute URL/],
    [{ figmaModes: [] }, /figmaModes: expected at least one mode/],
    [{ figmaModes: ['Default', 'Default'] }, /figmaModes: contains duplicates/],
    [{ referenceTokens: { package: '@helvetia-design/tokens' } }, /referenceTokens\.file: expected a non-empty string/],
    [{ referenceTokens: 'Base.tokens.json' }, /referenceTokens: expected an object or null/],
    [{ repo: 'extensions' }, /repo: expected an object/],
    [{ repo: { owner: '' } }, /repo\.owner: expected a non-empty string/],
    [{ brandsIndexPath: '' }, /brandsIndexPath: expected a non-empty string or null/],
    [[], /expected an object/],
  ])('rejects %j', (overrides, issue) => {
    expect(() => resolveTokyConfig(overrides)).toThrow(issue)
  })

  it('accepts null for the nullable fields', () => {
    expect(
      resolveTokyConfig({ brandsIndexPath: null, figmaResponsiveCollection: null, referenceTokens: null }),
    ).toMatchObject({ brandsIndexPath: null, figmaResponsiveCollection: null, referenceTokens: null })
  })

  it('drops $schema and never shares arrays with the core defaults', () => {
    const config = resolveTokyConfig({ $schema: './toky.config.schema.json' })

    expect(config).not.toHaveProperty('$schema')
    expect(config.figmaModes).not.toBe(CORE_TOKY_CONFIG.figmaModes)
    expect(config.editableLayers).not.toBe(CORE_TOKY_CONFIG.editableLayers)
  })
})

describe('loadTokyConfig', () => {
  it('returns the core defaults without a source and without touching the network', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadTokyConfig(undefined)).resolves.toEqual(CORE_TOKY_CONFIG)
    await expect(loadTokyConfig('  ')).resolves.toEqual(CORE_TOKY_CONFIG)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches the overrides file with the instance token and merges it onto the core defaults', async () => {
    const fetchMock = vi.fn().mockResolvedValue(rawResponse(JSON.stringify(extensionsOverrides)))
    vi.stubGlobal('fetch', fetchMock)

    const config = await loadTokyConfig('helvetia-design/extensions:packages/tokens/toky.config.json@main')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/helvetia-design/extensions/contents/packages/tokens/toky.config.json?ref=main',
      {
        cache: 'no-store',
        headers: { Authorization: 'Bearer test-token', Accept: 'application/vnd.github.raw+json' },
      },
    )
    expect(config).toEqual({
      ...CORE_TOKY_CONFIG,
      ...extensionsOverrides,
      repo: { owner: 'helvetia-design', name: 'extensions', ref: 'main' },
    })
  })

  it('omits the ref query when the source has none', async () => {
    const fetchMock = vi.fn().mockResolvedValue(rawResponse('{}'))
    vi.stubGlobal('fetch', fetchMock)

    await loadTokyConfig('helvetia-design/extensions:toky.config.json')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/helvetia-design/extensions/contents/toky.config.json',
    )
  })

  it('rejects a config that resolveTokyConfig rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(rawResponse('{"teem":"x"}')))

    const result = loadTokyConfig('helvetia-design/extensions:toky.config.json')
    await expect(result).rejects.toBeInstanceOf(TokyConfigError)
    await expect(result).rejects.toThrow(/teem: unknown property/)
  })

  it('rejects a file that is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(rawResponse('{ nope')))
    await expect(loadTokyConfig('helvetia-design/extensions:toky.config.json')).rejects.toThrow(/is not valid JSON/)
  })

  it('reports a failed GitHub read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(rawResponse('missing', 404)))
    await expect(loadTokyConfig('helvetia-design/extensions:toky.config.json')).rejects.toThrow(/404/)
  })

  it('needs TOKY_GITHUB_TOKEN to read a source', async () => {
    delete process.env.TOKY_GITHUB_TOKEN
    await expect(loadTokyConfig('helvetia-design/extensions:toky.config.json')).rejects.toThrow(
      /TOKY_GITHUB_TOKEN is not set/,
    )
  })
})

describe('getTokyConfig', () => {
  it('loads TOKY_CONFIG_SOURCE once per process', async () => {
    process.env.TOKY_CONFIG_SOURCE = 'helvetia-design/extensions:packages/tokens/toky.config.json@cache-test'
    const fetchMock = vi.fn().mockResolvedValue(rawResponse(JSON.stringify(extensionsOverrides)))
    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([getTokyConfig(), getTokyConfig()])
    const third = await getTokyConfig()

    expect(first.repo.name).toBe('extensions')
    expect(second).toBe(first)
    expect(third).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed load', async () => {
    process.env.TOKY_CONFIG_SOURCE = 'helvetia-design/extensions:packages/tokens/toky.config.json@retry-test'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rawResponse('boom', 500))
      .mockResolvedValueOnce(rawResponse(JSON.stringify(extensionsOverrides)))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getTokyConfig()).rejects.toThrow(/500/)
    await expect(getTokyConfig()).resolves.toMatchObject({ tokenFile: 'Extensions.tokens.json' })
  })

  it('returns the core defaults when TOKY_CONFIG_SOURCE is unset', async () => {
    await expect(getTokyConfig()).resolves.toEqual(CORE_TOKY_CONFIG)
  })
})

describe('toClientSettings', () => {
  it('maps the core defaults', () => {
    expect(CORE_CLIENT_SETTINGS).toEqual({
      editableLayers: ['Global', 'Alias', 'Device', 'Component'],
      figmaCollection: 'Design Tokens',
      figmaModes: ['Base'],
      previewUrl: 'http://localhost:4000/playground.html',
      hasReferenceTokens: false,
      hasBrands: true,
    })
  })

  it('maps an Extensions config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(rawResponse(JSON.stringify(extensionsOverrides))))
    const config = await loadTokyConfig('helvetia-design/extensions:toky.config.json')

    expect(toClientSettings(config)).toEqual({
      editableLayers: ['Component'],
      figmaCollection: 'Extension Tokens',
      figmaModes: ['Default'],
      previewUrl: 'http://localhost:4040/playground.html',
      hasReferenceTokens: true,
      hasBrands: false,
    })
  })
})
