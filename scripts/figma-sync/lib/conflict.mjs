/**
 * Conflict detection for the open-PR check (docs/plans/figma-sync-action-plan.md §4):
 * a token whose Figma value *and* GitHub value have both diverged from the
 * sync baseline since the last sync (packages/tokens/CONTEXT.md's
 * "Conflict" entry) — as opposed to a one-sided change, which is just what
 * Pull is about to resolve once this PR merges.
 *
 * Compares literal values and alias targets. An alias is compared by the path of its target, so
 * Figma's VARIABLE_ALIAS ids map back to token paths through the own tokens, the reference tokens
 * (core's, for an extension source) and the baseline. Checks the first mode only; brand-mode-aware
 * conflicts need a per-brand pass this check doesn't build yet.
 */
import { pathKey } from './alias.mjs'
import { figmaLiteralValueFor, isFigmaValueEqual } from './figma-value.mjs'

export const COMMENT_MARKER = '<!-- figma-sync-conflict-check -->'

function buildPathByVariableId(existingState, currentBaseTokens, referenceTokens) {
  const pathById = new Map()
  for (const [id, entry] of Object.entries(existingState.entries)) pathById.set(id, pathKey(entry.tokenPath))
  for (const token of [...referenceTokens, ...currentBaseTokens]) {
    if (typeof token.variableId === 'string') pathById.set(token.variableId, pathKey(token.path))
  }
  return pathById
}

/** A token value in a shape both sides share: `{ alias }` holds a target path, `{ literal }` a Figma value. */
function comparableTokenValue(token, value) {
  if (value?.kind === 'reference') return { alias: pathKey(value.path) }
  if (value?.kind === 'literal') return { literal: figmaLiteralValueFor(token, value.value) }
  return null
}

function comparableFigmaValue(raw, pathById) {
  if (raw?.type === 'VARIABLE_ALIAS') return { alias: pathById.get(raw.id) ?? raw.id }
  return { literal: raw }
}

function isSameValue(dtcgType, a, b) {
  if ('alias' in a || 'alias' in b) return a.alias === b.alias
  return isFigmaValueEqual(dtcgType, a.literal, b.literal)
}

const displayValue = value => ('alias' in value ? `{${value.alias}}` : value.literal)

/**
 * @param {object} params
 * @param {import('./baseline.mjs').SyncState | null} params.existingState
 * @param {import('./tokens.mjs').Token[]} params.currentBaseTokens the PR's proposed Base tree
 * @param {Record<string, { valuesByMode: Record<string, unknown> }>} params.figmaVariablesById
 * @param {string} params.modeId Figma's id of the source's first mode
 * @param {import('./tokens.mjs').Token[]} [params.referenceTokens] read-only tokens the source may alias
 */
export function findConflicts({ existingState, currentBaseTokens, figmaVariablesById, modeId, referenceTokens = [] }) {
  if (!existingState) return []

  const pathById = buildPathByVariableId(existingState, currentBaseTokens, referenceTokens)
  const conflicts = []

  for (const token of currentBaseTokens) {
    if (typeof token.variableId !== 'string') continue

    const baseline = existingState.entries[token.variableId]
    const baselineValue = baseline && comparableTokenValue(token, baseline.resolvedValue)
    const githubValue = comparableTokenValue(token, token.value)
    if (!baselineValue || !githubValue) continue

    const figmaLiveValue = figmaVariablesById[token.variableId]?.valuesByMode?.[modeId]
    if (figmaLiveValue === undefined) continue // never synced, or since deleted — not a conflict
    const figmaValue = comparableFigmaValue(figmaLiveValue, pathById)

    const githubChanged = !isSameValue(token.type, githubValue, baselineValue)
    const figmaChanged = !isSameValue(token.type, figmaValue, baselineValue)
    // Both sides moving to the *same* value isn't a conflict — nothing
    // would actually be overwritten by merging.
    const disagree = !isSameValue(token.type, githubValue, figmaValue)

    if (githubChanged && figmaChanged && disagree) {
      conflicts.push({
        variableId: token.variableId,
        tokenPath: token.path,
        baselineValue: displayValue(baselineValue),
        githubValue: displayValue(githubValue),
        figmaValue: displayValue(figmaValue),
      })
    }
  }

  return conflicts
}

export function buildCommentBody(conflicts) {
  if (conflicts.length === 0) {
    return `${COMMENT_MARKER}\n### 🔍 Figma Conflict Check\n\nNo conflicts detected — every touched token's Figma value matches the last sync baseline.`
  }

  const rows = conflicts
    .map(
      c =>
        `| \`${c.tokenPath.join('.')}\` | \`${JSON.stringify(c.baselineValue)}\` | \`${JSON.stringify(c.githubValue)}\` | \`${JSON.stringify(c.figmaValue)}\` |`,
    )
    .join('\n')

  return (
    `${COMMENT_MARKER}\n### 🔍 Figma Conflict Check\n\n` +
    `⚠️ ${conflicts.length} token(s) changed in both this PR and Figma since the last sync. ` +
    `Merging will overwrite the Figma-side change (this check is informational — it does not block merge; see docs/adr/0018-non-blocking-conflict-check.md).\n\n` +
    `| Token | Last synced | This PR | Figma (current) |\n| --- | --- | --- | --- |\n${rows}`
  )
}
