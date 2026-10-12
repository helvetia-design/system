import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Files to copy from root to each package
const FILES_TO_COPY = ['README.md', 'LICENSE']

// Read root package.json to get workspaces
const rootPkgJson = fs.readJsonSync(path.join(rootDir, 'package.json'))
const workspacePatterns = rootPkgJson.workspaces || []

console.log('🚀 Pre-Publish: Copying root files to publishable packages...\n')

// Expand glob patterns to actual package paths
const publishablePackages = []

for (const pattern of workspacePatterns) {
  const globPattern = path.join(rootDir, pattern, 'package.json')
  const matches = glob.sync(globPattern, { ignore: '**/node_modules/**' })

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

// Update root CHANGELOG.md from core package, preserving any hand-written preamble
// (text between the "# Changelog" title and the first "## " version heading) so manual
// notes in root CHANGELOG.md survive repeated publishes (non-failing)
try {
  const coreChangelog = path.join(rootDir, 'packages/core/CHANGELOG.md')
  const rootChangelog = path.join(rootDir, 'CHANGELOG.md')

  if (fs.existsSync(coreChangelog)) {
    const coreContent = fs.readFileSync(coreChangelog, 'utf-8')
    const coreVersionsStart = coreContent.search(/^## /m)
    const coreVersions = coreVersionsStart === -1 ? '' : coreContent.slice(coreVersionsStart)

    let preamble = 'All notable changes to this project will be documented in this file.'
    if (fs.existsSync(rootChangelog)) {
      const rootContent = fs.readFileSync(rootChangelog, 'utf-8')
      const rootVersionsStart = rootContent.search(/^## /m)
      const existingPreamble = (rootVersionsStart === -1 ? rootContent : rootContent.slice(0, rootVersionsStart))
        .replace(/^# .*$/m, '')
        .trim()
      if (existingPreamble) preamble = existingPreamble
    }

    const updated = `# Changelog\n\n${preamble}\n\n${coreVersions}`
    fs.writeFileSync(rootChangelog, updated)
    console.log(`✅ Updated CHANGELOG.md from packages/core/CHANGELOG.md`)
  }
} catch (error) {
  console.warn(`⚠️  Could not update CHANGELOG.md: ${error.message}`)
}

console.log(`\n✨ Pre-Publish complete! Processed ${publishablePackages.length} packages.`)
