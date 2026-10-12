import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'
import { load } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const version = process.argv[2]
if (!version) {
  console.error('Usage: node scripts/sync-workspace-versions.mjs <version>')
  process.exit(1)
}

// pnpm workspaces are declared in pnpm-workspace.yaml, not package.json "workspaces"
const workspaceYaml = load(fs.readFileSync(path.join(rootDir, 'pnpm-workspace.yaml'), 'utf-8'))
const workspacePatterns = workspaceYaml.packages || []

const includePatterns = workspacePatterns.filter(p => !p.startsWith('!'))
const excludePatterns = workspacePatterns
  .filter(p => p.startsWith('!'))
  .map(p => path.join(rootDir, p.slice(1), 'package.json'))

const pkgPaths = includePatterns.flatMap(pattern =>
  glob.sync(path.join(rootDir, pattern, 'package.json'), {
    ignore: ['**/node_modules/**', ...excludePatterns],
  }),
)

console.log(`📌 Syncing all workspace packages to ${version}...\n`)

// First pass: every workspace package's own name -> new version
const names = pkgPaths.map(pkgPath => fs.readJsonSync(pkgPath).name)

// Second pass: bump each package's own version and rewrite any dependency
// specifier that points at another workspace package, so internal pins
// (e.g. exact versions, not "workspace:*") never go stale and break the
// pnpm/turbo dependency graph.
for (const pkgPath of pkgPaths) {
  const pkgJson = fs.readJsonSync(pkgPath)
  pkgJson.version = version

  for (const depField of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkgJson[depField]
    if (!deps) continue
    for (const name of names) {
      if (deps[name] && !deps[name].startsWith('workspace:') && !deps[name].startsWith('catalog:')) {
        deps[name] = version
      }
    }
  }

  fs.writeJsonSync(pkgPath, pkgJson, { spaces: 2 })
  console.log(`✔︎ ${path.relative(rootDir, pkgPath)}`)
}
