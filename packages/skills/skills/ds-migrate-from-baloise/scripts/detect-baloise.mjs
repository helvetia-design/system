#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { isSkippedDir, maskComments, SOURCE_EXTENSIONS, sourceMode } from './source-scan.mjs'

const LEGACY_SCOPE = '@baloise'
const TARGET_SCOPE = '@helvetia-design'
const STYLES_NAME = 'styles'
const INSTALL_NAMES = ['angular', 'angular-legacy', 'core', 'react', STYLES_NAME]
const ICON_NAMES = ['icons', 'brand-icons']
const FONT_FAVICON_NAMES = ['fonts', 'favicons']
const SHORT_NAMES = [...INSTALL_NAMES, ...ICON_NAMES]
const DEPENDENCY_NAMES = [...SHORT_NAMES, ...FONT_FAVICON_NAMES]
const ASSET_NAMES = [...ICON_NAMES, STYLES_NAME, ...FONT_FAVICON_NAMES]
const ASSET_PACKAGES = new Set(ASSET_NAMES.map(short => `${LEGACY_SCOPE}/ds-${short}`))
const LOCKFILE_MANAGERS = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
]
export const LOCKFILES = new Set(LOCKFILE_MANAGERS.map(([name]) => name))
const SASS_RE = new RegExp(`${LEGACY_SCOPE}/ds-styles/sass/`)
const BARE_STYLES_RE = new RegExp(`"${LEGACY_SCOPE}/ds-styles/`)
const CONFIG_FILES = new Set(['angular.json', 'project.json'])
const PACKAGE_MANAGERS = new Set(['npm', 'pnpm', 'yarn', 'bun'])
const NPM_TIMEOUT_MS = 30_000
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
export const MIN_CORE_VERSION = '0.0.7'
const SASS_NOTE =
  'Baloise Sass entry file. @helvetia-design/styles exports no matching Sass path and its mixins differ, so Init does not duplicate it. Migrate it by hand.'
export const IMPORT_EXTENSIONS = new Set([...SOURCE_EXTENSIONS, '.css', '.scss', '.sass', '.json'])
export const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
const NOTHING = 'no Baloise Design System installation detected, nothing to migrate'

function targetPackageName(short) {
  return `${TARGET_SCOPE}/${short}`
}

const MISSING_LATEST = `npm view ${targetPackageName('core')} dist-tags did not include a latest tag`

const execFileAsync = promisify(execFile)
const PACKAGE_RE = new RegExp(`${LEGACY_SCOPE}/ds-(?:${SHORT_NAMES.join('|')})\\b`)
const INSTALL_RE = new RegExp(`^${LEGACY_SCOPE}/ds-(?:${INSTALL_NAMES.join('|')})$`)
const DEPENDENCY_RE = new RegExp(`${LEGACY_SCOPE}/ds-(?:${DEPENDENCY_NAMES.join('|')})\\b`)

export function npmOptions(platform = process.platform) {
  return { encoding: 'utf8', timeout: NPM_TIMEOUT_MS, shell: platform === 'win32' }
}

export function npmFailureReason(error) {
  if (error?.killed) return `timed out after ${NPM_TIMEOUT_MS / 1000} s`
  const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : ''
  if (stderr) return stderr
  return error instanceof Error ? error.message : String(error)
}

export async function readNpmDistTags(execImpl = execFileAsync, platform = process.platform) {
  const { stdout } = await execImpl(
    'npm',
    ['view', targetPackageName('core'), 'dist-tags', '--json'],
    npmOptions(platform),
  )
  const parsed = JSON.parse(stdout)
  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
}

export async function readNpmAngularPeers(version, execImpl = execFileAsync, platform = process.platform) {
  const { stdout } = await execImpl(
    'npm',
    ['view', `${targetPackageName('angular')}@${version}`, 'peerDependencies', '--json'],
    npmOptions(platform),
  )
  if (!stdout.trim()) return {}
  const parsed = JSON.parse(stdout)
  return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
}

const VERSION_PART = String.raw`v?(\d+)(?:\.(?:\d+|[xX*]))?(?:\.(?:\d+|[xX*]))?(?:[-+][0-9A-Za-z.+-]+)?`
const LOWER_BOUND_RE = new RegExp(`^(?:\\^|~|>=|=)?${VERSION_PART}$`)
const UPPER_BOUND_RE = new RegExp(`^<=?${VERSION_PART}$`)

export function lowestMajor(spec) {
  if (typeof spec !== 'string') return null
  const [lower, ...upper] = spec
    .trim()
    .replace(/(>=|<=|<|=|\^|~)\s+/g, '$1')
    .split(/\s+/)
  const match = LOWER_BOUND_RE.exec(lower)
  if (!match || !upper.every(part => UPPER_BOUND_RE.test(part))) return null
  return Number(match[1])
}

function angularCoreSpec(manifest) {
  for (const field of DEPENDENCY_FIELDS) {
    const spec = manifest?.[field]?.['@angular/core']
    if (typeof spec === 'string') return spec
  }
  return undefined
}

async function checkAngular(manifest, packageJsonPath, version, readAngularPeers) {
  const peerPackage = `${targetPackageName('angular')}@${version}`
  const installed = angularCoreSpec(manifest)
  let required
  try {
    const peers = await readAngularPeers(version)
    required = peers?.['@angular/core']
  } catch (error) {
    return {
      error: `Could not read the peer dependencies of ${peerPackage}: ${npmFailureReason(error)}.`,
    }
  }
  if (typeof required !== 'string') {
    return { error: `${peerPackage} declares no @angular/core peer range, so the Angular version cannot be checked` }
  }
  const installedMajor = lowestMajor(installed)
  if (installedMajor === null) {
    return {
      error: `Cannot read the major of @angular/core "${installed}" in ${packageJsonPath}. Use a plain version such as ^19.2.0 and run the migration again.`,
    }
  }
  const requiredMajor = lowestMajor(required)
  if (requiredMajor === null) {
    return { error: `Cannot read the major of the @angular/core peer range "${required}" of ${peerPackage}` }
  }
  const compatible = installedMajor >= requiredMajor
  const angular = { installed, required, compatible }
  if (compatible) return { angular }
  return {
    angular,
    error: `${packageJsonPath} declares @angular/core ${installed}, but ${peerPackage} requires @angular/core ${required}. Upgrade the app to Angular ${requiredMajor} or later before running the migration; Angular ${installedMajor} is not supported.`,
  }
}

export async function detectBaloise(rootDir, options = {}) {
  if (options.version !== undefined && !VERSION_RE.test(options.version)) {
    return { status: 'error', message: `--version "${options.version}" is not a plain version such as 1.2.3` }
  }
  const found = scan(rootDir)
  if (found?.error) return { status: 'error', message: found.error }
  if (!found) {
    return { status: 'nothing-to-migrate', message: NOTHING }
  }

  let version = options.version ?? ''
  if (!version) {
    let distTags
    try {
      distTags = await (options.readDistTags ?? readNpmDistTags)()
    } catch (error) {
      return {
        status: 'error',
        message: `Could not run npm view ${targetPackageName('core')} dist-tags: ${npmFailureReason(error)}. Rerun with --version <version> to skip the lookup.`,
      }
    }
    version = typeof distTags?.latest === 'string' ? distTags.latest : ''
  }
  if (!version) {
    return { status: 'error', message: MISSING_LATEST }
  }
  if (!VERSION_RE.test(version)) {
    return {
      status: 'error',
      message: `npm view ${targetPackageName('core')} dist-tags returned the latest tag "${version}", which is not a plain version such as 1.2.3`,
    }
  }

  if (isBelowMinimum(version)) {
    const source = options.version === undefined ? `the latest dist-tag of ${targetPackageName('core')}` : '--version'
    return {
      status: 'error',
      message: `This skill needs ${targetPackageName('core')} ${MIN_CORE_VERSION} or later, but ${source} is ${version}. Rerun with --version ${MIN_CORE_VERSION} or a later version once it is published, or update the skill.`,
    }
  }

  const framework = detectFramework(found.manifest)
  let angular
  if (framework === 'angular') {
    const check = await checkAngular(
      found.manifest,
      found.packageJsonPath,
      version,
      options.readAngularPeers ?? readNpmAngularPeers,
    )
    if (check.error) {
      return check.angular
        ? { status: 'error', message: check.error, angular: check.angular }
        : { status: 'error', message: check.error }
    }
    angular = check.angular
  }

  const packageManager = detectPackageManager(rootDir)
  return {
    status: 'ready',
    packageManager,
    installCommand: installCommand(packageManager),
    framework,
    packageJsonPath: found.packageJsonPath,
    dependencies: found.dependencies,
    imports: found.imports,
    version,
    aliases: aliasesFor(framework, version, found.dependencies),
    ...(angular && { angular }),
  }
}

function isBelowMinimum(version) {
  const actual = version.split('-')[0].split('.').map(Number)
  const minimum = MIN_CORE_VERSION.split('.').map(Number)
  const index = actual.findIndex((part, i) => part !== minimum[i])
  return index !== -1 && actual[index] < minimum[index]
}

export async function run(rootDir, stdout, options = {}) {
  const result = await detectBaloise(rootDir, options)
  stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  return result.status === 'error' ? 1 : 0
}

export function installCommand(packageManager) {
  if (packageManager === 'pnpm') return 'pnpm install'
  if (packageManager === 'yarn') return 'yarn install'
  if (packageManager === 'bun') return 'bun install'
  return 'npm install'
}

export function detectPackageManager(rootDir) {
  let dir = resolve(rootDir)
  for (;;) {
    const declared = readJson(join(dir, 'package.json'))?.packageManager
    const name = typeof declared === 'string' ? declared.split('@')[0] : ''
    if (PACKAGE_MANAGERS.has(name)) return name
    const lockfile = LOCKFILE_MANAGERS.find(([file]) => existsSync(join(dir, file)))
    if (lockfile) return lockfile[1]
    const parent = dirname(dir)
    if (parent === dir) return 'npm'
    dir = parent
  }
}

export function detectFramework(manifest) {
  const names = new Set(dependencyNames(manifest))
  if (names.has('@angular/core')) return 'angular'
  if (names.has('react') || names.has('react-dom')) return 'react'
  return 'html'
}

/**
 * Every framework gets `tokens` and `core` on top of its own binding package, because the
 * migration makes the consumer import both directly:
 *
 * - `tokens` — Init writes an `@helvetia-design/tokens/css/base` import into the consumer's own
 *   entry file (the `normalize` and bundled `css/all` rules in SKILL.md).
 * - `core` — the controller and option types live there and are not re-exported by the binding
 *   packages, so `AlertController`, `Alert`, `ModalController` and `ModalOptions` are imported
 *   from `@helvetia-design/core` even in a React or Angular app.
 *
 * Both currently resolve anyway, as transitive dependencies, but only because npm and Yarn
 * flatten `node_modules`. Under pnpm's default layout, where only declared dependencies are
 * linked, those imports fail to resolve. Declaring what the skill tells the consumer to import
 * is the fix.
 *
 * `assets` is added when the app declared `@baloise/ds-icons` or `@baloise/ds-brand-icons`
 * directly, because then it imports icon symbols itself. It is also added for `@baloise/ds-styles`,
 * `@baloise/ds-fonts` and `@baloise/ds-favicons`, because the Assets step copies the self-hosted
 * fonts and favicons from `node_modules/@helvetia-design/assets`, which pnpm only links when the
 * app declares it.
 */
function aliasesFor(framework, version, dependencies) {
  const shared = {
    [targetPackageName('core')]: version,
    [targetPackageName('styles')]: version,
    [targetPackageName('tokens')]: version,
  }
  if (dependencies.some(name => ASSET_PACKAGES.has(name))) shared[targetPackageName('assets')] = version
  if (framework === 'react') return { [targetPackageName('react')]: version, ...shared }
  if (framework === 'angular') return { [targetPackageName('angular')]: version, ...shared }
  return shared
}

export function dependencyNames(manifest) {
  const names = []
  for (const field of DEPENDENCY_FIELDS) {
    const block = manifest?.[field]
    if (block && typeof block === 'object') names.push(...Object.keys(block))
  }
  return names
}

export function baloiseDependencies(manifest) {
  return [...new Set(dependencyNames(manifest).filter(name => DEPENDENCY_RE.test(name)))].sort()
}

function scan(rootDir) {
  const packages = []
  const imports = []
  walk(rootDir, rootDir, packages, imports)
  if (packages.length === 0 || imports.length === 0) return null

  const selected = selectManifest(packages)
  if (selected.error) return { error: selected.error }
  imports.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  return {
    manifest: selected.manifest,
    packageJsonPath: selected.packageJsonPath,
    dependencies: selected.dependencies,
    imports,
  }
}

function selectManifest(packages) {
  const atRoot = packages.find(candidate => candidate.packageJsonPath === 'package.json')
  if (atRoot) return atRoot
  if (packages.length === 1) return packages[0]
  const paths = packages.map(candidate => candidate.packageJsonPath).sort()
  return {
    error: `Found several apps that depend on the Baloise Design System: ${paths.join(', ')}. Run the migration again with the folder of one app as <project-root>.`,
  }
}

export function findBaloiseManifest(rootDir) {
  const packages = []
  walk(rootDir, rootDir, packages, null)
  if (packages.length === 0) return null
  const selected = selectManifest(packages)
  if (selected.error) return { error: selected.error }
  return { manifest: selected.manifest, packageJsonPath: selected.packageJsonPath }
}

function walk(rootDir, dir, packages, imports) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) {
      if (isSkippedDir(entry.name, dir, rootDir)) continue
      walk(rootDir, join(dir, entry.name), packages, imports)
      continue
    }
    if (!entry.isFile()) continue

    const filePath = join(dir, entry.name)
    if (entry.name === 'package.json') {
      const manifest = readJson(filePath)
      const dependencies = manifest ? baloiseDependencies(manifest) : []
      // An icon-only manifest, such as a workspace root, must not win over the app manifest.
      if (dependencies.some(name => INSTALL_RE.test(name))) {
        packages.push({ manifest, packageJsonPath: toPosix(rootDir, filePath), dependencies })
      }
      continue
    }
    if (LOCKFILES.has(entry.name) || !IMPORT_EXTENSIONS.has(extname(entry.name))) continue
    if (imports) collectImports(rootDir, filePath, imports)
  }
}

function collectImports(rootDir, filePath, imports) {
  let text
  try {
    text = readFileSync(filePath, 'utf8')
  } catch {
    return
  }
  if (!PACKAGE_RE.test(text)) return
  const file = toPosix(rootDir, filePath)
  const lines = text.split(/\r?\n/)
  const masked = maskComments(text, sourceMode(extname(filePath))).split(/\r?\n/)
  for (let index = 0; index < lines.length; index++) {
    const code = masked[index] ?? ''
    if (!PACKAGE_RE.test(code)) continue
    const kind = kindOf(code, basename(filePath))
    imports.push({
      file,
      line: index + 1,
      snippet: lines[index].trim().slice(0, 240),
      kind,
      ...(SASS_RE.test(code) && { note: SASS_NOTE }),
    })
  }
}

function kindOf(line, fileName) {
  if (SASS_RE.test(line)) return 'reference'
  if (/<link\b/i.test(line) || /<script\b/i.test(line)) return 'bootstrap'
  if (/@import\b/.test(line) || /@use\b/.test(line)) return 'bootstrap'
  if (new RegExp(`import\\s+['"]${LEGACY_SCOPE}/ds-(?:core|styles)\\b`).test(line)) return 'bootstrap'
  if (new RegExp(`node_modules/${LEGACY_SCOPE}/ds-(?:styles|core)\\b`).test(line)) return 'bootstrap'
  if (CONFIG_FILES.has(fileName) && BARE_STYLES_RE.test(line)) return 'bootstrap'
  return 'reference'
}

export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function toPosix(rootDir, filePath) {
  return relative(rootDir, filePath).split(sep).join('/')
}

function isMainModule() {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(entry))
  } catch {
    return pathToFileURL(resolve(entry)).href === import.meta.url
  }
}

export function parseArgs(argv) {
  let root
  let version
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--version') {
      version = argv[++index]
      if (version === undefined) return { error: '--version needs a value, for example --version 1.2.3' }
    } else if (arg.startsWith('--version=')) {
      version = arg.slice('--version='.length)
    } else if (root === undefined) {
      root = arg
    }
  }
  return { root, version }
}

function fail(message) {
  process.stdout.write(`${JSON.stringify({ status: 'error', message }, null, 2)}\n`)
  process.exit(1)
}

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2))
  if (args.error) fail(args.error)
  const root = args.root ? resolve(args.root) : process.cwd()
  run(root, process.stdout, args.version === undefined ? {} : { version: args.version })
    .then(code => process.exit(code))
    .catch(error => fail(error instanceof Error ? error.message : String(error)))
}
