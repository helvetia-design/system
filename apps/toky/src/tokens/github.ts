import path from 'node:path'
import type { TokyConfig } from '@helvetia-design/tokens/toky-config'
import { getTokyConfig } from './config'

export function tokenFilePath(config: TokyConfig): string {
  return `${config.tokensDir}/${config.tokenFile}`
}

export function brandFilePath(config: TokyConfig, name: string): string {
  return `${config.tokensDir}/${name}.tokens.json`
}

/** The token package's manifest, one level above `tokensDir`, e.g. `packages/tokens/package.json`. */
export function tokenPackageJsonPath(config: TokyConfig): string {
  return path.posix.join(path.posix.dirname(config.tokensDir), 'package.json')
}

export function requireGithubToken(): string {
  const token = process.env.TOKY_GITHUB_TOKEN
  if (!token) {
    throw new Error('TOKY_GITHUB_TOKEN is not set — a GitHub token is required to read tokens from GitHub.')
  }
  return token
}

// Team-membership reads use their own fine-grained PAT (narrower than
// TOKY_GITHUB_TOKEN's repo write access — see docs/adr/0004) when set, and
// fall back to TOKY_GITHUB_TOKEN otherwise so a single-PAT setup still works.
export function requireGithubOrgToken(): string {
  const token = process.env.TOKY_GITHUB_ORG_TOKEN ?? process.env.TOKY_GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'Neither TOKY_GITHUB_ORG_TOKEN nor TOKY_GITHUB_TOKEN is set — a GitHub token is required to check team membership.',
    )
  }
  return token
}

export function githubRefFor(config: TokyConfig): string {
  return process.env.TOKY_GITHUB_REF ?? config.repo.ref
}

export async function getGithubRef(): Promise<string> {
  return githubRefFor(await getTokyConfig())
}

// Percent-encodes a GitHub content path or ref for safe interpolation into
// an API URL, without touching '/' — both legitimately contain slashes
// (nested file paths; branch names like "toky/update-next").
export function encodeGithubUrlSegment(value: string): string {
  return value.split('/').map(encodeURIComponent).join('/')
}

export async function fetchBaseTokensFile(ref?: string): Promise<string> {
  const token = requireGithubToken()
  const config = await getTokyConfig()
  const filePath = tokenFilePath(config)
  const url = `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/contents/${encodeGithubUrlSegment(filePath)}?ref=${encodeGithubUrlSegment(ref ?? githubRefFor(config))}`

  const response = await fetch(url, {
    // Next.js caches server-side fetches by default — this must always hit
    // GitHub fresh, or a just-opened PR's branch content (or the lack of one)
    // can keep showing a stale snapshot from before it existed.
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to fetch ${filePath} from GitHub: ${response.status} ${response.statusText} — ${body}`)
  }

  return response.text()
}
