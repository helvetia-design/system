/**
 * Shared across the ds-* component skills. The seven usage-category folders components are
 * organized under — see packages/core/CONTEXT.md and apps/storybook/CONTEXT.md for the full
 * taxonomy, mapping, and alphabetical-ordering rule.
 */

const path = require('path')
const fs = require('fs')
const { familyParents } = require('./ds-context')

const CATEGORIES = ['actions', 'forms', 'indicators', 'media', 'navigation', 'overlays', 'structure']

/**
 * Resolve a component's directory. Components live at <component root>/<category>/<name>/
 * here, and the category isn't known up front; a repo that declares "categorized": false puts
 * them at <component root>/<name>/ instead. Both shapes, and any number of component roots,
 * come from ds-context.js. Returns the absolute path, or undefined if no component with that
 * name exists.
 */
function resolveComponentPath(repoRoot, componentName) {
  for (const parent of familyParents(repoRoot)) {
    const candidate = path.join(parent.dir, componentName)
    if (fs.existsSync(candidate)) return candidate
  }
  return undefined
}

module.exports = { CATEGORIES, resolveComponentPath }
