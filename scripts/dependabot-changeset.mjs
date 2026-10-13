/**
 * Dependabot changeset sync — keeps a single accumulated changeset entry for
 * production (non-dev) dependency bumps proposed by Dependabot.
 *
 * Only `dependencies` (never `devDependencies`) of packages/*\/package.json are
 * considered, since those are the only ones that affect consumers. Internal
 * `@helvetia-design/*` cross-references are skipped — their versions are kept
 * in sync by the changesets release process itself.
 *
 * All dependency bumps are recorded under a single, fixed changeset file
 * (.changeset/dependabot-updates.md) targeting `@helvetia-design/core` with
 * the `deps` scope, matching the convention used by `create-changeset.mjs`
 * (any scope not in SCOPE_PACKAGE_MAP — including `deps` — falls back to
 * core, and all packages are version-locked together via the "fixed" group
 * in .changeset/config.json). This way a run of weekly Dependabot PRs
 * produces at most one changeset per release instead of one per PR.
 *
 * Usage: node scripts/dependabot-changeset.mjs
 * Exits with no file changes (and no output) if nothing needs updating.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(__dirname, '..')
const CHANGESET_PATH = join(workspaceRoot, '.changeset', 'dependabot-updates.md')
const BASE_REF = 'origin/main'
const BULLET_PATTERN = /^- (.+): (.+) → (.+)$/

/**
 * Read and parse a package.json's "dependencies" block at a given git ref.
 * Returns {} if the file doesn't exist at that ref (e.g. a brand new package).
 */
function readDependenciesAtRef(ref, relativePath) {
  try {
    const raw = execFileSync('git', ['show', `${ref}:${relativePath}`], { cwd: workspaceRoot, encoding: 'utf-8' })
    return JSON.parse(raw).dependencies ?? {}
  } catch {
    return {}
  }
}

function readDependenciesOnDisk(absolutePath) {
  try {
    const raw = readFileSync(absolutePath, 'utf-8')
    return JSON.parse(raw).dependencies ?? {}
  } catch {
    return {}
  }
}

/**
 * Diff one package's dependencies between the base ref and the working tree,
 * returning only version changes to non-internal packages.
 */
function diffPackageDependencies(relativePath) {
  const before = readDependenciesAtRef(BASE_REF, relativePath)
  const after = readDependenciesOnDisk(join(workspaceRoot, relativePath))

  const changes = []
  for (const [name, newVersion] of Object.entries(after)) {
    if (name.startsWith('@helvetia-design/')) continue
    const oldVersion = before[name]
    if (oldVersion && oldVersion !== newVersion) {
      changes.push({ name, oldVersion, newVersion })
    }
  }
  return changes
}

/**
 * Parse the existing accumulated changeset's bullet list into a Map keyed by
 * dependency name, so a re-bump of the same dependency replaces its line
 * in-place instead of duplicating it.
 */
function parseExistingBullets() {
  const bullets = new Map()
  if (!existsSync(CHANGESET_PATH)) return bullets

  const content = readFileSync(CHANGESET_PATH, 'utf-8')
  for (const line of content.split('\n')) {
    const match = line.match(BULLET_PATTERN)
    if (match) {
      const [, name, oldVersion, newVersion] = match
      bullets.set(name, { name, oldVersion, newVersion })
    }
  }
  return bullets
}

function renderChangeset(bullets) {
  const sorted = [...bullets.values()].sort((a, b) => a.name.localeCompare(b.name))
  const lines = sorted.map(({ name, oldVersion, newVersion }) => `- ${name}: ${oldVersion} → ${newVersion}`)

  return `---
'@helvetia-design/core': patch
---

**deps**: dependency updates
${lines.join('\n')}
`
}

function main() {
  const packageJsonPaths = globSync('packages/*/package.json', { cwd: workspaceRoot })

  const newChanges = packageJsonPaths.flatMap(diffPackageDependencies)
  if (newChanges.length === 0) {
    console.log('No production dependency changes detected — nothing to do.')
    return
  }

  const bullets = parseExistingBullets()
  for (const change of newChanges) {
    bullets.set(change.name, change)
  }

  writeFileSync(CHANGESET_PATH, renderChangeset(bullets), 'utf-8')
  console.log(`✔ Updated ${CHANGESET_PATH} with ${newChanges.length} dependency change(s):`)
  for (const { name, oldVersion, newVersion } of newChanges) {
    console.log(`  - ${name}: ${oldVersion} → ${newVersion}`)
  }
}

main()
