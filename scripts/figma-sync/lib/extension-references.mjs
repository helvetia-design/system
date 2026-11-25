/**
 * Finds extension tokens (helvetia-design/extensions) whose reference target a core PR removes or
 * renames, so the PR can warn before the next extension sync fails on the lost Figma alias.
 * The comment names token paths only: the extension file is private and this repo is public.
 */
import { parseReferencePath, pathKey } from './alias.mjs'

export const EXTENSION_REFERENCE_COMMENT_MARKER = '<!-- figma-sync-extension-reference-check -->'

function collectNestedReferences(value, found) {
  const path = parseReferencePath(value)
  if (path) {
    found.push(path)
  } else if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value)) collectNestedReferences(nested, found)
  }
}

/** @param {import('./tokens.mjs').Token} token */
export function collectReferencePaths(token) {
  const found = []
  if (token.value.kind === 'reference') found.push(token.value.path)
  else collectNestedReferences(token.value.value, found)
  collectNestedReferences(token.responsive, found)

  const unique = new Map(found.map(path => [pathKey(path), path]))
  return [...unique.values()]
}

const compareKeys = (a, b) => pathKey(a).localeCompare(pathKey(b))

/**
 * A reference counts as removed when its target exists on the PR base but not on the PR head.
 * References that are already broken on base, or that point at another extension token, are
 * not this PR's doing.
 *
 * @param {object} params
 * @param {import('./tokens.mjs').Token[]} params.extensionTokens
 * @param {import('./tokens.mjs').Token[]} params.baseTokens core tokens on the PR base
 * @param {import('./tokens.mjs').Token[]} params.headTokens core tokens on the PR head
 * @returns {{ extensionTokenPath: string[], referencePath: string[] }[]}
 */
export function findRemovedExtensionReferences({ extensionTokens, baseTokens, headTokens }) {
  const ownKeys = new Set(extensionTokens.map(token => pathKey(token.path)))
  const baseKeys = new Set(baseTokens.map(token => pathKey(token.path)))
  const headKeys = new Set(headTokens.map(token => pathKey(token.path)))
  const findings = []

  for (const token of extensionTokens) {
    for (const referencePath of collectReferencePaths(token)) {
      const key = pathKey(referencePath)
      if (ownKeys.has(key) || !baseKeys.has(key) || headKeys.has(key)) continue
      findings.push({ extensionTokenPath: token.path, referencePath })
    }
  }

  return findings.sort(
    (a, b) => compareKeys(a.extensionTokenPath, b.extensionTokenPath) || compareKeys(a.referencePath, b.referencePath),
  )
}

const escapeCell = text => text.replaceAll('|', '\\|')

export function buildExtensionReferenceCommentBody(findings) {
  const heading = `${EXTENSION_REFERENCE_COMMENT_MARKER}\n### 🔍 Figma Extension Reference Check\n\n`
  if (findings.length === 0) {
    return `${heading}✅ No extension token references a core token this PR removes or renames.`
  }

  const rows = findings.map(
    ({ extensionTokenPath, referencePath }) =>
      `| \`${escapeCell(pathKey(extensionTokenPath))}\` | \`${escapeCell(pathKey(referencePath))}\` |`,
  )
  return (
    `${heading}${findings.length} extension token(s) in \`helvetia-design/extensions\` reference core tokens this PR removes or renames. ` +
    `The next extension sync fails until extensions is updated. ` +
    `This does not block the merge (see docs/adr/0018-non-blocking-conflict-check.md).\n\n` +
    `| Extension token | Removed core token |\n| --- | --- |\n${rows.join('\n')}`
  )
}
