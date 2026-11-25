#!/usr/bin/env node

/**
 * Assembles the payload of @helvetia-design/context.
 *
 * The package ships this repository's agent-facing material verbatim — no curation, no
 * judgement about what a consumer might find relevant. npm only packs files inside the
 * package directory, so everything is copied in here first, into the same shape a consumer
 * will read it as:
 *
 *   node_modules/@helvetia-design/context/dist/docs/STYLE_GUIDE.md
 *   node_modules/@helvetia-design/context/dist/docs/adr/0021-….md
 *   node_modules/@helvetia-design/context/dist/skills/ds-lint-component/SKILL.md
 *
 * Everything written here is generated and gitignored. Run `pnpm build` in this package,
 * or let `prepack` do it at publish time.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(packageRoot, '../..')
// Everything is assembled under dist/, like every other package in this repo.
const outRoot = path.join(packageRoot, 'dist')

// Source → destination, both relative to the repo root and the package root respectively.
// Add to this list when the repo grows agent-facing material; nothing here is filtered.
// The build inputs in ../turbo.json mirror COPY and CONTEXT_GLOB_DIRS; change both together.
const COPY = [
  ['CONTEXT.md', 'CONTEXT.md'],
  ['CONTEXT-MAP.md', 'CONTEXT-MAP.md'],
  ['docs/ARCHITECTURE.md', 'docs/ARCHITECTURE.md'],
  ['docs/STYLE_GUIDE.md', 'docs/STYLE_GUIDE.md'],
  ['docs/adr', 'docs/adr'],
  ['docs/agents', 'docs/agents'],
  ['.claude/skills', 'skills'],
]

// Every workspace CONTEXT.md, copied under its own path so the links between them still
// resolve the way CONTEXT-MAP.md describes.
const CONTEXT_GLOB_DIRS = ['packages', 'apps', 'libs']

function clean() {
  fs.rmSync(outRoot, { recursive: true, force: true })
}

function copy(from, to) {
  const source = path.join(repoRoot, from)
  if (!fs.existsSync(source)) {
    console.warn(`  skipped (missing): ${from}`)
    return []
  }
  const destination = path.join(outRoot, to)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
  return listFiles(destination).map(file => path.relative(outRoot, file))
}

function listFiles(target) {
  const stat = fs.statSync(target)
  if (!stat.isDirectory()) return [target]
  return fs.readdirSync(target, { withFileTypes: true }).flatMap(entry => listFiles(path.join(target, entry.name)))
}

function collectWorkspaceContexts() {
  const copied = []
  for (const dir of CONTEXT_GLOB_DIRS) {
    const base = path.join(repoRoot, dir)
    if (!fs.existsSync(base)) continue
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const relative = path.join(dir, entry.name, 'CONTEXT.md')
      const source = path.join(repoRoot, relative)
      // Never pick up what this script has already written into its own package directory.
      if (source.startsWith(`${packageRoot}${path.sep}`)) continue
      if (fs.existsSync(source)) copied.push(...copy(relative, relative))
    }
  }
  return copied
}

clean()

const files = []
for (const [from, to] of COPY) files.push(...copy(from, to))
files.push(...collectWorkspaceContexts())

// A manifest so a consumer — or an agent — can see what arrived without walking the tree.
const manifest = {
  package: '@helvetia-design/context',
  source: 'https://github.com/helvetia-design/system',
  generated: 'by packages/context/scripts/collect.mjs',
  files: files.sort(),
}
fs.writeFileSync(path.join(outRoot, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`@helvetia-design/context: collected ${files.length} files`)
