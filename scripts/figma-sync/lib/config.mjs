/**
 * Resolves the inputs of the sync scripts for one token source from its Toky config
 * (`@helvetia-design/tokens/toky-config`). Without TOKY_CONFIG_PATH the source is core, with
 * the core defaults. Imported from the built package in this checkout, so
 * `pnpm --filter @helvetia-design/tokens build` must have run first.
 */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveTokyConfig } from '../../../packages/tokens/dist/out-tsc/toky-config.js'

const systemRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveSyncInputs(env = process.env) {
  const config = resolveTokyConfig(
    env.TOKY_CONFIG_PATH ? JSON.parse(readFileSync(resolve(env.TOKY_CONFIG_PATH), 'utf-8')) : {},
  )
  const tokensRoot = resolve(env.TOKENS_ROOT || systemRoot)
  const tokensDirOverride = env.TOKENS_DIR_OVERRIDE ? resolve(env.TOKENS_DIR_OVERRIDE) : undefined
  const tokensDir = tokensDirOverride ?? resolve(tokensRoot, config.tokensDir)

  return {
    config,
    tokensRoot,
    tokensDir,
    tokenFile: config.tokenFile,
    tokenFilePath: resolve(tokensDir, config.tokenFile),
    // A scratch tokens directory carries its baseline next to it.
    syncStateFile: tokensDirOverride
      ? resolve(tokensDir, '..', '.figma-sync-state.json')
      : resolve(tokensRoot, config.syncStatePath),
    repoTokenFilePath: posix.join(config.tokensDir, config.tokenFile),
    repoSyncStatePath: config.syncStatePath,
    tokensPackageDir: posix.dirname(config.tokensDir),
    hasBrands: config.brandsIndexPath !== null,
    collectionName: env.FIGMA_COLLECTION_NAME ?? config.figmaCollection,
    responsiveCollectionName:
      config.figmaResponsiveCollection === null
        ? null
        : (env.FIGMA_RESPONSIVE_COLLECTION_NAME ?? config.figmaResponsiveCollection),
    modeNames: config.figmaModes,
  }
}

/**
 * Path of the reference token file (tokens that may be aliased but are never written), or null if
 * the source has none. REFERENCE_TOKENS_FILE wins; otherwise `referenceTokens.package` is looked up
 * from the token package's own node_modules, bypassing the package's `exports` map.
 *
 * @param {ReturnType<typeof resolveSyncInputs>} inputs
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string | null}
 */
export function resolveReferenceTokensFile({ config, tokensRoot, tokensPackageDir }, env = process.env) {
  if (env.REFERENCE_TOKENS_FILE) return resolve(env.REFERENCE_TOKENS_FILE)
  if (!config.referenceTokens) return null

  const { package: packageName, file } = config.referenceTokens
  const packageJsonPath = resolve(tokensRoot, tokensPackageDir, 'package.json')
  const searchPaths = createRequire(packageJsonPath).resolve.paths(packageName) ?? []
  const packageDir = searchPaths
    .map(nodeModules => join(nodeModules, packageName))
    .find(candidate => existsSync(join(candidate, 'package.json')))
  if (!packageDir) {
    throw new Error(
      `Reference token package ${packageName} is not installed for ${packageJsonPath} — run pnpm install in ${tokensRoot}, or set REFERENCE_TOKENS_FILE.`,
    )
  }

  const filePath = join(packageDir, file)
  if (!existsSync(filePath)) {
    throw new Error(`Reference token file ${file} does not exist in ${packageDir}.`)
  }
  return filePath
}
