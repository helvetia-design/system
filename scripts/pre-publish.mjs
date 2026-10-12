import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'
import { load } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Files to copy from root to each package
const FILES_TO_COPY = ['README.md', 'LICENSE']

// pnpm workspaces are declared in pnpm-workspace.yaml, not package.json "workspaces"
const workspaceYaml = load(fs.readFileSync(path.join(rootDir, 'pnpm-workspace.yaml'), 'utf-8'))
const workspacePatterns = workspaceYaml.packages || []

console.log('🚀 Pre-Publish: Copying root files to publishable packages...\n')

// Expand glob patterns to actual package paths
const publishablePackages = []

const includePatterns = workspacePatterns.filter(p => !p.startsWith('!'))
const excludePatterns = workspacePatterns
  .filter(p => p.startsWith('!'))
  .map(p => path.join(rootDir, p.slice(1), 'package.json'))

for (const pattern of includePatterns) {
  const globPattern = path.join(rootDir, pattern, 'package.json')
  const matches = glob.sync(globPattern, { ignore: ['**/node_modules/**', ...excludePatterns] })

  for (const match of matches) {
    const pkgPath = path.dirname(match)
    const pkgJson = fs.readJsonSync(match)

    // Skip private packages
    if (pkgJson.private === true) {
      console.log(`⏭️  Skipping ${path.relative(rootDir, pkgPath)} (marked as private)`)
      continue
    }

    // Skip packages without a name (not meant to be published)
    if (!pkgJson.name) {
      console.log(`⏭️  Skipping ${path.relative(rootDir, pkgPath)} (no package name)`)
      continue
    }

    publishablePackages.push(pkgPath)
  }
}

// Copy files to each publishable package
for (const pkgPath of publishablePackages) {
  const pkgName = path.relative(rootDir, pkgPath)

  for (const file of FILES_TO_COPY) {
    const srcFile = path.join(rootDir, file)
    const destFile = path.join(pkgPath, file)

    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile)
      console.log(`✅ ${pkgName}/${file}`)
    } else {
      console.log(`⚠️  ${file} not found in root`)
    }
  }
}

// Merge new version entries from packages/core/CHANGELOG.md into root CHANGELOG.md.
// packages/core/CHANGELOG.md keeps bare "## <version>" headings (no date) so that
// changesets/action's exact-match extraction can find the right entry for the Release PR
// body. Here, at publish time, we stamp today's date onto any version not already present
// in root and prepend it — existing (already-dated) entries and any hand-written preamble
// in root CHANGELOG.md are left untouched (non-failing).
try {
  const coreChangelog = path.join(rootDir, 'packages/core/CHANGELOG.md')
  const rootChangelog = path.join(rootDir, 'CHANGELOG.md')

  if (fs.existsSync(coreChangelog)) {
    const coreContent = fs.readFileSync(coreChangelog, 'utf-8')
    const headingRe = /^## (\S+).*$/gm
    const headings = [...coreContent.matchAll(headingRe)]
    const coreBlocks = headings.map((m, i) => ({
      version: m[1],
      block: coreContent.slice(m.index, i + 1 < headings.length ? headings[i + 1].index : coreContent.length).trim(),
    }))

    const defaultPreamble = 'All notable changes to this project will be documented in this file.'
    let preamble = defaultPreamble
    let existingVersions = ''
    if (fs.existsSync(rootChangelog)) {
      const rootContent = fs.readFileSync(rootChangelog, 'utf-8')
      const rootVersionsStart = rootContent.search(/^## /m)
      const existingPreamble = (rootVersionsStart === -1 ? rootContent : rootContent.slice(0, rootVersionsStart))
        .replace(/^# .*$/m, '')
        .trim()
      if (existingPreamble) preamble = existingPreamble
      existingVersions = rootVersionsStart === -1 ? '' : rootContent.slice(rootVersionsStart)
    }

    const today = new Date().toISOString().slice(0, 10)
    const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const newBlocks = coreBlocks
      .filter(({ version }) => !new RegExp(`^## ${escapeRegExp(version)}(\\s|$)`, 'm').test(existingVersions))
      .map(({ version, block }) => block.replace(/^## \S+/, `## ${version} (${today})`))

    if (newBlocks.length > 0) {
      const updated = `# Changelog\n\n${preamble}\n\n${newBlocks.join('\n\n')}\n\n${existingVersions}`.trimEnd() + '\n'
      fs.writeFileSync(rootChangelog, updated)
      console.log(`✅ Added ${newBlocks.length} new version(s) to CHANGELOG.md from packages/core/CHANGELOG.md`)
    } else {
      console.log(`ℹ️  CHANGELOG.md already up to date`)
    }
  }
} catch (error) {
  console.warn(`⚠️  Could not update CHANGELOG.md: ${error.message}`)
}

console.log(`\n✨ Pre-Publish complete! Processed ${publishablePackages.length} packages.`)
