/**
 * Repo layout lookup, shared across the ds-* component skills.
 *
 * These skills were written against this repository's layout, where there is exactly one
 * component root at packages/core/src/components. A consuming repository — DS Extensions,
 * for instance — has a different shape: three component roots and no token package. Rather
 * than hardcode either layout, each skill asks this module, which reads an optional
 * ds-context.json from the repo root and falls back to this repository's own paths when the
 * file is absent. Behaviour here is therefore unchanged; nothing in this repo ships that file.
 *
 * ds-context.json, all keys optional:
 *
 *   {
 *     "componentRoots": ["packages/app/core/src/components", ...],  // string or array
 *     "playwrightComponents": "packages/app/playwright/src/lib/components",
 *     "coreIndex": "packages/app/core/src/index.ts",
 *     "storybookComponents": "apps/storybook/src/components",
 *     "tokensCss": null,    // null means "this repo has no token package"
 *     "tokensJson": null,
 *     "categorized": false  // components sit directly under the root, not under a category
 *   }
 */

const path = require('path')
const fs = require('fs')

const DEFAULTS = {
  componentRoots: ['packages/core/src/components'],
  playwrightComponents: 'packages/playwright/src/lib/components',
  coreIndex: 'packages/core/src/index.ts',
  storybookComponents: 'apps/storybook/src/components',
  tokensCss: 'packages/tokens/dist/css/base.tokens.css',
  tokensJson: 'packages/tokens/tokens/Base.tokens.json',
  // This repo nests components one level deep, as <root>/<category>/<name>/. A repo that
  // puts them directly at <root>/<name>/ declares "categorized": false.
  categorized: true,
}

const cache = new Map()

/**
 * Read and validate ds-context.json, merged over the defaults above. Cached per repo root,
 * because several skills call this many times in one run.
 */
function loadDsContext(repoRoot) {
  if (cache.has(repoRoot)) return cache.get(repoRoot)

  const file = path.join(repoRoot, 'ds-context.json')
  let declared = {}

  if (fs.existsSync(file)) {
    try {
      declared = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (error) {
      throw new Error(`ds-context.json is not valid JSON: ${error.message}`)
    }
    if (declared === null || typeof declared !== 'object' || Array.isArray(declared)) {
      throw new Error('ds-context.json must contain a JSON object')
    }
  }

  const resolved = { ...DEFAULTS, ...declared }
  resolved.componentRoots = toList(resolved.componentRoots)

  if (resolved.componentRoots.length === 0) {
    throw new Error('ds-context.json declares no componentRoots')
  }

  cache.set(repoRoot, resolved)
  return resolved
}

function toList(value) {
  if (value === null || value === undefined) return []
  return (Array.isArray(value) ? value : [value]).filter(Boolean)
}

/**
 * Absolute paths of every declared component root that exists on disk. A declared root that
 * is missing is skipped rather than fatal — a consuming repo may list a package that hasn't
 * been created yet.
 */
function componentRoots(repoRoot) {
  return loadDsContext(repoRoot)
    .componentRoots.map(relative => path.join(repoRoot, relative))
    .filter(absolute => fs.existsSync(absolute))
}

/**
 * Where a newly created component goes. With several roots declared, the first one wins —
 * callers that can offer the user a choice should do so instead of relying on this.
 */
function primaryComponentRoot(repoRoot) {
  return path.join(repoRoot, loadDsContext(repoRoot).componentRoots[0])
}

/** Absolute path of the entry file a new component registers itself in. */
function coreIndexPath(repoRoot) {
  return path.join(repoRoot, loadDsContext(repoRoot).coreIndex)
}

/**
 * Absolute path of the Playwright page-object directory, or undefined when the repo declares
 * none. Callers skip page-object work rather than failing.
 */
function playwrightComponentsDir(repoRoot) {
  const relative = loadDsContext(repoRoot).playwrightComponents
  return relative ? path.join(repoRoot, relative) : undefined
}

/** Whether components sit under a category folder (<root>/<category>/<name>) or directly at <root>/<name>. */
function isCategorized(repoRoot) {
  return loadDsContext(repoRoot).categorized !== false
}

/**
 * The directories whose children are component families: the category folders when the repo
 * is categorized, the component roots themselves when it is not. Each entry carries the
 * category name, which is null for an uncategorized repo.
 */
function familyParents(repoRoot) {
  const categorized = isCategorized(repoRoot)
  const parents = []
  for (const root of componentRoots(repoRoot)) {
    if (!categorized) {
      parents.push({ dir: root, category: null })
      continue
    }
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (entry.isDirectory()) parents.push({ dir: path.join(root, entry.name), category: entry.name })
    }
  }
  return parents
}

/** Repo-relative path of the Storybook component directory. */
function storybookComponentsDir(repoRoot) {
  return loadDsContext(repoRoot).storybookComponents
}

/**
 * Repo-relative token file paths, or undefined when the repo has no token package. A skill
 * that needs tokens should report that clearly instead of reading a path that isn't there.
 */
function tokenPaths(repoRoot) {
  const { tokensCss, tokensJson } = loadDsContext(repoRoot)
  if (!tokensCss || !tokensJson) return undefined
  return { css: tokensCss, json: tokensJson }
}

module.exports = {
  loadDsContext,
  componentRoots,
  isCategorized,
  familyParents,
  primaryComponentRoot,
  coreIndexPath,
  playwrightComponentsDir,
  storybookComponentsDir,
  tokenPaths,
}
