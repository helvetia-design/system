#!/usr/bin/env node
import { existsSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { scanSourceFiles } from './source-scan.mjs'

const USAGE_RE = new RegExp(
  [
    String.raw`<\/(?:bal-[a-z]|Bal[A-Z])`,
    String.raw`<bal-(?<tag>[a-z][a-z0-9]*(?:-[a-z0-9]+)*)\b`,
    String.raw`(?<=<[A-Za-z][^<>]*(?:[\s\[]|\[attr\.))(?<popup>bal-popup)(?![\w-])`,
    String.raw`\bbal(?<controller>[A-Z][A-Za-z0-9]*?)Controller\b`,
    String.raw`\bBal(?<namespace>Props|Events)\s*\.\s*Bal(?<member>[A-Z][A-Za-z0-9]*)\b`,
    String.raw`\b(?:HTML)?Bal(?<symbol>[A-Z][A-Za-z0-9]*)\b`,
  ].join('|'),
  'g',
)
const SUFFIX_RE = /(?<=.)(?:Service|Controller|Module|CustomEvent|Options|Props|Events|Detail|Element)$/
const TYPE_NAMESPACE_RE = /^(?:(Events|Props|Region)$|(Config|Breakpoint|Platform)(?=[A-Z]|s|$))|(Language)$/
const COMPONENTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../components')

// Legacy child tags that one parent migration covers. Listed explicitly rather than
// folded by prefix, because a shared prefix does not imply a shared migration:
// `bal-input-slider` becomes `ds-slider`, not part of the input migration.
const CHILD_SLUGS = new Map([
  ['accordion-summary', 'accordion'],
  ['accordion-trigger', 'accordion'],
  ['accordion-details', 'accordion'],
  ['card-actions', 'card'],
  ['card-button', 'card'],
  ['card-content', 'card'],
  ['card-subtitle', 'card'],
  ['card-title', 'card'],
  ['button-group', 'button'],
  ['carousel-item', 'carousel'],
  ['check', 'checkbox'],
  ['checkbox-group', 'checkbox'],
  ['data-item', 'data'],
  ['data-label', 'data'],
  ['data-value', 'data'],
  ['date-calendar', 'date'],
  ['date-calendar-cell', 'date'],
  ['field-label', 'field'],
  ['field-control', 'field'],
  ['field-message', 'field'],
  ['field-hint', 'field'],
  ['form-grid', 'field'],
  ['form-col', 'field'],
  ['hint-title', 'hint'],
  ['hint-text', 'hint'],
  ['input-date', 'input'],
  ['input-group', 'input'],
  ['list-item', 'list'],
  ['list-item-title', 'list'],
  ['list-item-subtitle', 'list'],
  ['list-item-icon', 'list'],
  ['list-item-content', 'list'],
  ['list-item-accordion-head', 'list'],
  ['list-item-accordion-body', 'list'],
  ['modal-header', 'modal'],
  ['modal-body', 'modal'],
  ['nav-link', 'nav'],
  ['nav-link-grid', 'nav'],
  ['nav-link-grid-col', 'nav'],
  ['nav-link-group', 'nav'],
  ['nav-menu-bar', 'nav'],
  ['nav-menu-flyout', 'nav'],
  ['nav-meta-bar', 'nav'],
  ['navbar-brand', 'navbar'],
  ['navbar-menu', 'navbar'],
  ['navbar-menu-start', 'navbar'],
  ['navbar-menu-end', 'navbar'],
  ['ng-error', 'field'],
  ['ng-error-component', 'field'],
  ['notices', 'toast'],
  ['option', 'dropdown'],
  ['option-list', 'dropdown'],
  ['popover-content', 'popover'],
  ['radio-group', 'radio'],
  ['radio-icon', 'radio'],
  ['segment-item', 'segment'],
  ['select-option', 'select'],
  ['stage-back-link', 'stage'],
  ['stage-body', 'stage'],
  ['stage-foot', 'stage'],
  ['stage-head', 'stage'],
  ['stage-image', 'stage'],
  ['step-item', 'steps'],
  ['step-option', 'steps'],
  ['switch', 'checkbox'],
  ['tag-group', 'tag'],
  ['tab-item', 'tabs'],
  ['tab-option', 'tabs'],
])

export function componentNameToSlug(name) {
  return name
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

// Legacy Angular shipped 24 `Bal*Bundle` arrays (BalLayoutBundle, BalTypographyBundle,
// ...). They are groups of components, not components, so they have no migration and
// listing them as `notYet` is noise in every app that imports a bundle.
function isBundle(slug) {
  return slug.endsWith('-bundle')
}

function stripSuffixes(name) {
  let base = name
  while (SUFFIX_RE.test(base)) base = base.replace(SUFFIX_RE, '')
  return base
}

function symbolToSlug(name) {
  const slug = componentNameToSlug(stripSuffixes(name))
  return CHILD_SLUGS.get(slug) ?? slug
}

function typeNamespace(name) {
  const match = TYPE_NAMESPACE_RE.exec(name) ?? TYPE_NAMESPACE_RE.exec(stripSuffixes(name))
  if (!match) return null
  const namespace = match[1] ?? match[2] ?? match[3]
  return namespace === 'Breakpoint' ? 'breakpoints' : componentNameToSlug(namespace)
}

function classify(groups, available) {
  if (groups.tag) return { component: CHILD_SLUGS.get(groups.tag) ?? groups.tag }
  if (groups.popup) return { component: 'popup' }
  if (groups.controller) return { component: symbolToSlug(groups.controller) }
  if (groups.namespace) {
    const member = symbolToSlug(groups.member)
    return { type: componentNameToSlug(groups.namespace), component: available.has(member) ? member : null }
  }
  if (groups.symbol) {
    if (isBundle(componentNameToSlug(groups.symbol))) return {}
    const type = typeNamespace(groups.symbol)
    return type ? { type } : { component: symbolToSlug(groups.symbol) }
  }
  return {}
}

function increment(totals, name) {
  totals.set(name, (totals.get(name) ?? 0) + 1)
}

export function scanMigratable(rootDir, paths = [], { extensions } = {}) {
  const available = availableMigrations()
  const totals = new Map()
  const typeTotals = new Map()
  const perFile = new Map()

  const unmatched = scanSourceFiles(
    rootDir,
    ({ file, masked }) => {
      const fileTotals = new Map()
      for (const match of masked.matchAll(USAGE_RE)) {
        const { component, type } = classify(match.groups, available)
        if (type) increment(typeTotals, type)
        if (component) {
          increment(totals, component)
          increment(fileTotals, component)
        }
      }
      if (fileTotals.size > 0) perFile.set(file, fileTotals)
    },
    extensions ? { paths, extensions } : { paths },
  )

  const used = toComponents(totals)
  const result = {
    suggested: used.filter(component => available.has(component.name)),
    notYet: used.filter(component => !available.has(component.name)),
    types: toComponents(typeTotals),
  }
  if (paths.length === 0) return result

  const files = [...perFile.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([file, fileTotals]) => ({ file, components: toComponents(fileTotals) }))
  return unmatched.length > 0 ? { ...result, files, unmatched } : { ...result, files }
}

function toComponents(totals) {
  return [...totals.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => a.name.localeCompare(b.name))
}

export function run(rootDir, stdout, paths = []) {
  stdout.write(`${JSON.stringify(scanMigratable(rootDir, paths), null, 2)}\n`)
  return 0
}

function availableMigrations() {
  const migrations = new Set()
  let entries
  try {
    entries = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
  } catch {
    return migrations
  }

  for (const entry of entries) {
    if (entry.isDirectory() && existsSync(join(COMPONENTS_DIR, entry.name, 'migration.md'))) {
      migrations.add(entry.name)
    }
  }
  return migrations
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

if (isMainModule()) {
  const root = process.argv[2] ? resolve(process.argv[2]) : process.cwd()
  try {
    process.exit(run(root, process.stdout, process.argv.slice(3)))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  }
}
