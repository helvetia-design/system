import type { TokyConfig } from '@helvetia-design/tokens/toky-config'
import { parseTokenDocument } from './flatten'
import { tokenPackageJsonPath } from './github'
import { getFileMeta } from './github-write'
import type { FlatToken } from './types'

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

const treeCache = new Map<string, Promise<FlatToken[]>>()

/** The exact version of `packageName` pinned in a parsed `package.json`. */
export function pinnedVersion(packageJson: unknown, packageName: string): string {
  const manifest = (typeof packageJson === 'object' && packageJson !== null ? packageJson : {}) as {
    dependencies?: Record<string, unknown>
    devDependencies?: Record<string, unknown>
  }
  const spec = manifest.dependencies?.[packageName] ?? manifest.devDependencies?.[packageName]
  if (typeof spec !== 'string') {
    throw new Error(`"${packageName}" is not a dependency or devDependency in the token package's package.json.`)
  }
  if (!EXACT_VERSION.test(spec)) {
    throw new Error(`"${packageName}" must be pinned to an exact version in the token package, found "${spec}".`)
  }
  return spec
}

export function referenceTokensUrl(packageName: string, version: string, file: string): string {
  return `https://cdn.jsdelivr.net/npm/${packageName}@${version}/${file.split('/').map(encodeURIComponent).join('/')}`
}

async function fetchReferenceTree(url: string): Promise<FlatToken[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load reference tokens from ${url}: ${response.status} ${response.statusText}`)
  }
  return parseTokenDocument((await response.json()) as Record<string, unknown>)
}

/**
 * The read-only reference tree (`config.referenceTokens`) in the version the token package pins
 * at `ref`, resolved within itself. Cached per process by package, version, and file.
 */
export async function loadReferenceTokens(config: TokyConfig, ref: string): Promise<FlatToken[]> {
  if (!config.referenceTokens) return []
  const { package: packageName, file } = config.referenceTokens

  const manifest = await getFileMeta(tokenPackageJsonPath(config), ref)
  const version = pinnedVersion(JSON.parse(manifest.content) as unknown, packageName)
  const url = referenceTokensUrl(packageName, version, file)

  const cachedTree = treeCache.get(url)
  if (cachedTree) return cachedTree

  const tree = fetchReferenceTree(url)
  treeCache.set(url, tree)
  tree.catch(() => treeCache.delete(url))
  return tree
}
