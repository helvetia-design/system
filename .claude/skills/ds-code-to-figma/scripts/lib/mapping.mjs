// Shared helpers for the ds-code-to-figma check scripts: find a component's files and read the
// YAML block of its `<name>.figma.md` mapping file.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { load as loadYaml } from 'js-yaml'

const require = createRequire(import.meta.url)
const { resolveComponentPath } = require('../../../_shared/component-categories.js')

// fileURLToPath, not URL.pathname: pathname keeps `%20` for spaces in the folder path.
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..')

/** `button` → its folder; also accepts a path to the folder or to the mapping file. */
export function resolveComponentDir(arg) {
  const asPath = path.resolve(REPO_ROOT, arg)
  if (fs.existsSync(asPath)) return fs.statSync(asPath).isDirectory() ? asPath : path.dirname(asPath)
  const dir = resolveComponentPath(REPO_ROOT, arg)
  if (!dir) throw new Error(`No component folder found for "${arg}"`)
  return dir
}

/**
 * The first ```yaml block of a mapping file, parsed one top-level key at a time, so one broken
 * section (e.g. an unquoted `{size}` inside a flow map) doesn't hide the rest. Sections that
 * don't parse are listed in `__errors` as { key, message }.
 */
export function readMapping(file) {
  const text = fs.readFileSync(file, 'utf8')
  const match = text.match(/```yaml\n([\s\S]*?)\n```/)
  if (!match) throw new Error(`No yaml block in ${path.relative(REPO_ROOT, file)}`)
  const out = { __errors: [] }
  const sections = match[1].split(/\n(?=[A-Za-z_][\w-]*:)/)
  for (const section of sections) {
    const key = section.match(/^([A-Za-z_][\w-]*):/)?.[1]
    if (!key) continue
    try {
      Object.assign(out, loadYaml(section))
    } catch (e) {
      out.__errors.push({ key, message: e.reason || e.message, line: e.mark?.line })
    }
  }
  return out
}

/** Every `.tsx` with an `@Component({ tag })` under a folder (excluding `test/`). */
export function findMembers(folder) {
  const out = []
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'test' && entry.name !== 'node_modules') walk(full)
      } else if (entry.name.endsWith('.tsx') && !/\.(util|icons|data|interfaces)\.tsx$/.test(entry.name)) {
        const tag = fs.readFileSync(full, 'utf8').match(/@Component\(\{[\s\S]*?tag:\s*'([^']+)'/)
        if (tag) out.push({ tag: tag[1], file: full, name: path.basename(full, '.tsx') })
      }
    }
  }
  walk(folder)
  return out
}
