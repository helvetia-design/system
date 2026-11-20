import { CORE_TOKY_CONFIG, resolveTokyConfig } from '@helvetia-design/tokens/toky-config'
import type { TokyConfig } from '@helvetia-design/tokens/toky-config'
import { LAYER_KEYS } from './flatten'
import type { TokenLayer } from './types'

export interface TokyConfigSource {
  owner: string
  repo: string
  path: string
  ref: string | null
}

const CONFIG_SOURCE_PATTERN = /^([^/\s:@]+)\/([^/\s:@]+):([^@\s]+)(?:@(\S+))?$/

/** Parses `TOKY_CONFIG_SOURCE` (`owner/repo:path[@ref]`). */
export function parseTokyConfigSource(value: string): TokyConfigSource {
  const match = CONFIG_SOURCE_PATTERN.exec(value.trim())
  if (!match) {
    throw new Error(`TOKY_CONFIG_SOURCE must look like "owner/repo:path/to/toky.config.json[@ref]", got "${value}".`)
  }
  const [, owner, repo, path, ref] = match
  return { owner, repo, path, ref: ref ?? null }
}

function encodeSegments(value: string): string {
  return value.split('/').map(encodeURIComponent).join('/')
}

async function fetchConfigOverrides(source: TokyConfigSource): Promise<unknown> {
  const token = process.env.TOKY_GITHUB_TOKEN
  if (!token) throw new Error('TOKY_GITHUB_TOKEN is not set — it is required to load TOKY_CONFIG_SOURCE.')

  const query = source.ref ? `?ref=${encodeSegments(source.ref)}` : ''
  const url = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${encodeSegments(source.path)}${query}`
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json' },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to load the Toky config from ${url}: ${response.status} ${response.statusText} — ${body}`)
  }

  const text = await response.text()
  try {
    return JSON.parse(text) as unknown
  } catch (err) {
    throw new Error(`The Toky config at ${source.owner}/${source.repo}:${source.path} is not valid JSON.`, {
      cause: err,
    })
  }
}

/** Resolves the instance config: core defaults without `TOKY_CONFIG_SOURCE`, else the overrides file it points at. */
export async function loadTokyConfig(source: string | undefined): Promise<TokyConfig> {
  if (!source?.trim()) return resolveTokyConfig({})
  return resolveTokyConfig(await fetchConfigOverrides(parseTokyConfigSource(source)))
}

let cached: { source: string | undefined; config: Promise<TokyConfig> } | null = null

/** Per-process cached `loadTokyConfig(process.env.TOKY_CONFIG_SOURCE)`; a failed load is retried on the next call. */
export function getTokyConfig(): Promise<TokyConfig> {
  const source = process.env.TOKY_CONFIG_SOURCE
  if (cached && cached.source === source) return cached.config

  const config = loadTokyConfig(source)
  cached = { source, config }
  config.catch(() => {
    if (cached?.config === config) cached = null
  })
  return config
}

/** The instance settings the browser needs; never holds a secret or a repo coordinate. */
export interface TokyClientSettings {
  editableLayers: TokenLayer[]
  figmaCollection: string
  figmaModes: string[]
  previewUrl: string
  hasReferenceTokens: boolean
  hasBrands: boolean
}

export function toClientSettings(config: TokyConfig): TokyClientSettings {
  return {
    editableLayers: config.editableLayers.map(key => LAYER_KEYS[key]),
    figmaCollection: config.figmaCollection,
    figmaModes: [...config.figmaModes],
    previewUrl: config.previewUrl,
    hasReferenceTokens: config.referenceTokens !== null,
    hasBrands: config.brandsIndexPath !== null,
  }
}

export const CORE_CLIENT_SETTINGS: TokyClientSettings = toClientSettings(CORE_TOKY_CONFIG)
