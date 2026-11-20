#!/usr/bin/env node
/**
 * Entry point for figma-conflict-check.yml (docs/plans/figma-sync-action-plan.md §4).
 * Runs on the open toky/update-main PR: reads the PR branch's own checked-out
 * token files + local .figma-sync-state.json baseline, cross-checks against
 * live Figma variable values, and posts/updates a single PR comment listing
 * any conflicts. Never fails the check itself
 * (docs/adr/0018-non-blocking-conflict-check.md) — a script error still
 * exits non-zero (that's a real operational problem to surface), but
 * finding conflicts never does.
 *
 * Run with: node scripts/figma-sync/conflict-check.mjs
 *
 * TOKENS_DIR_OVERRIDE (optional, shared with pull.mjs/backfill-commit.mjs):
 * read tokens/baseline from a local scratch directory instead of
 * packages/tokens/tokens.
 *
 * TOKY_CONFIG_PATH/TOKENS_ROOT (optional, shared with pull.mjs): token file, sync state,
 * collection, mode, and reference tokens come from the source's Toky config (lib/config.mjs).
 * REFERENCE_TOKENS_FILE overrides the config's referenceTokens file.
 *
 * PR_NUMBER/GITHUB_TOKEN (optional together): if either is unset, skips
 * GitHub entirely and prints the comment body to stdout instead of
 * posting/updating it — lets you check the conflict-detection + comment
 * formatting with only Figma credentials, no PR or GitHub token needed.
 */
import { loadSyncStateFile } from './lib/baseline.mjs'
import { resolveReferenceTokensFile, resolveSyncInputs } from './lib/config.mjs'
import { buildCommentBody, COMMENT_MARKER, findConflicts } from './lib/conflict.mjs'
import { findCollectionAndModes, getLocalVariables } from './lib/figma.mjs'
import { createIssueComment, findMarkedComment, updateIssueComment } from './lib/github.mjs'
import { flattenTokens, loadTokenFile } from './lib/tokens.mjs'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set.`)
  return value
}

function loadReferenceTokens(inputs) {
  const referenceTokensFile = resolveReferenceTokensFile(inputs)
  return referenceTokensFile ? flattenTokens(loadTokenFile(referenceTokensFile)) : []
}

async function main() {
  const figmaToken = requireEnv('FIGMA_API_TOKEN')
  const figmaFileKey = requireEnv('FIGMA_FILE_KEY')
  const prNumber = process.env.PR_NUMBER
  const githubToken = process.env.GITHUB_TOKEN
  const inputs = resolveSyncInputs()
  const { tokenFilePath, syncStateFile, collectionName, modeNames } = inputs

  const base = loadTokenFile(tokenFilePath)
  const currentBaseTokens = flattenTokens(base)
  const existingState = loadSyncStateFile(syncStateFile)

  let conflicts = []
  if (existingState) {
    const localVariables = await getLocalVariables(figmaFileKey, figmaToken)
    if (Object.values(localVariables.variableCollections).some(c => c.name === collectionName)) {
      const { modeIdByBrand } = findCollectionAndModes(localVariables, [], collectionName, modeNames)
      conflicts = findConflicts({
        existingState,
        currentBaseTokens,
        figmaVariablesById: localVariables.variables,
        modeId: modeIdByBrand[modeNames[0]],
        referenceTokens: loadReferenceTokens(inputs),
      })
    } else {
      console.log(`No Figma collection "${collectionName}" yet (source never synced) — nothing can conflict.`)
    }
  } else {
    console.log('No sync baseline yet (source never synced) — nothing can conflict.')
  }

  console.log(`Found ${conflicts.length} conflict(s).`)
  const body = buildCommentBody(conflicts)

  if (!prNumber || !githubToken) {
    console.log(`\nPR_NUMBER/GITHUB_TOKEN not set — printing comment body instead of posting:\n\n${body}`)
    return
  }

  const existingComment = await findMarkedComment(prNumber, COMMENT_MARKER, githubToken)
  if (existingComment) {
    await updateIssueComment(existingComment.id, body, githubToken)
  } else {
    await createIssueComment(prNumber, body, githubToken)
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
