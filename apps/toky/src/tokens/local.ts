import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CORE_TOKY_CONFIG } from '@helvetia-design/tokens/toky-config'
import type { TokyConfig } from '@helvetia-design/tokens/toky-config'

// Opt-in local-dev escape hatch, gated the same way everywhere it's checked
// (see isAuthDisabledLocally in src/auth/route-access.ts): requires `VERCEL`
// to be unset, so this can never take effect on any real deployment
// (including a preview build run with production env vars), even if
// TOKY_LOCAL_TOKENS is mistakenly set there.
export function isLocalTokensModeEnabled(): boolean {
  return !process.env.VERCEL && process.env.TOKY_LOCAL_TOKENS === 'true'
}

/** Local token mode reads this monorepo's checkout, so it only fits the core token source. */
export function assertLocalTokensModeSupported(config: TokyConfig): void {
  const { repo, tokensDir, tokenFile } = config
  const core = CORE_TOKY_CONFIG
  if (
    repo.owner !== core.repo.owner ||
    repo.name !== core.repo.name ||
    tokensDir !== core.tokensDir ||
    tokenFile !== core.tokenFile
  ) {
    throw new Error(
      `TOKY_LOCAL_TOKENS only works for the core token source (${core.repo.owner}/${core.repo.name}, ${core.tokensDir}/${core.tokenFile}), ` +
        `but this instance is configured for ${repo.owner}/${repo.name}, ${tokensDir}/${tokenFile}. Unset TOKY_LOCAL_TOKENS or TOKY_CONFIG_SOURCE.`,
    )
  }
}

// apps/toky is the Next.js server's cwd — config.tokensDir ('packages/tokens/tokens') is relative
// to the monorepo root, two levels up.
export function localTokensDir(config: TokyConfig): string {
  assertLocalTokensModeSupported(config)
  return path.resolve(process.cwd(), '..', '..', config.tokensDir)
}

export function localBaseTokensPath(config: TokyConfig): string {
  return path.join(localTokensDir(config), config.tokenFile)
}

export async function readLocalBaseTokensDocument(config: TokyConfig): Promise<Record<string, unknown>> {
  const raw = await readFile(localBaseTokensPath(config), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}

export async function writeLocalBaseTokensDocument(config: TokyConfig, doc: Record<string, unknown>): Promise<void> {
  await writeFile(localBaseTokensPath(config), `${JSON.stringify(doc, null, 2)}\n`, 'utf-8')
}

export function localBrandTokensPath(config: TokyConfig, name: string): string {
  return path.join(localTokensDir(config), `${name}.tokens.json`)
}

// Every `*.tokens.json` sibling of `config.tokenFile` is a brand override file.
export async function listLocalTokenBrandFiles(config: TokyConfig): Promise<string[]> {
  if (config.brandsIndexPath === null) return []
  const entries = await readdir(localTokensDir(config))
  return entries
    .filter(name => name.endsWith('.tokens.json') && name !== config.tokenFile)
    .map(name => name.slice(0, -'.tokens.json'.length))
    .sort((a, b) => a.localeCompare(b))
}

export async function readLocalBrandTokensDocument(config: TokyConfig, name: string): Promise<Record<string, unknown>> {
  const raw = await readFile(localBrandTokensPath(config, name), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}

export async function writeLocalBrandTokensDocument(
  config: TokyConfig,
  name: string,
  doc: Record<string, unknown>,
): Promise<void> {
  await writeFile(localBrandTokensPath(config, name), `${JSON.stringify(doc, null, 2)}\n`, 'utf-8')
}
