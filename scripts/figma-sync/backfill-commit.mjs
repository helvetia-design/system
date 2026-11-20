#!/usr/bin/env node
/**
 * Entry point for figma-sync.yml's write-back step
 * (docs/adr/0017-direct-commit-variableid-backfill.md): patches new
 * variableIds into Base.tokens.json, drops deleted tokens'
 * (docs/adr/0019-pull-auto-deletes-figma-variables.md) entries from
 * packages/tokens/.figma-sync-state.json, and — on every run, including one
 * with no new/removed ids — rebuilds the baseline's resolvedValue for every
 * token from the current tree, so a value-only change still refreshes its
 * entry (otherwise the next PR touching that token sees a stale baseline
 * and gets flagged as a false conflict). All as one atomic direct commit to
 * `main` (docs/adr/0014-git-data-api-atomic-commits.md) — no PR. Only
 * Base.tokens.json itself is conditionally written: a run with no new ids
 * never touches it, since there's nothing to patch.
 *
 * Reads NEW_IDS_FILE / REMOVED_IDS_FILE (paths to JSON files pull.mjs wrote, from its outputs) —
 * or, for small local test payloads only, the inline-JSON NEW_IDS / REMOVED_IDS env vars.
 * Run with: node scripts/figma-sync/backfill-commit.mjs
 *
 * TOKENS_DIR_OVERRIDE (optional, shared with pull.mjs/conflict-check.mjs):
 * switches out of the real GitHub API entirely — no GITHUB_TOKEN needed.
 * Reads/writes the patched files directly at this path (can point at the
 * real packages/tokens/tokens, or a scratch copy). Two local sub-modes:
 *   - default: just writes the files to disk, no commit — same as every
 *     other change in this repo, left unstaged for you to review and
 *     commit yourself.
 *   - LOCAL_GIT_COMMIT=true: also runs a real `git commit` via the CLI
 *     (TOKENS_DIR_OVERRIDE must point inside a git working tree).
 * Never set either in figma-sync.yml.
 *
 * TOKY_CONFIG_PATH/TOKENS_ROOT (optional, shared with pull.mjs): the token file and sync-state
 * paths come from the source's Toky config (lib/config.mjs). The target repo is always
 * GITHUB_REPOSITORY (lib/github.mjs).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { applyVariableIdPatch, buildSyncState, loadSyncStateFile } from './lib/baseline.mjs'
import { resolveSyncInputs } from './lib/config.mjs'
import { commitFiles, getFileContent } from './lib/github.mjs'
import { commitFilesLocally } from './lib/local-git.mjs'
import { flattenTokens, loadTokenFile } from './lib/tokens.mjs'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set.`)
  return value
}

async function runRemote({ newIds, removedIds, syncedAt, inputs }) {
  const TOKEN_FILE_PATH = inputs.repoTokenFilePath
  const SYNC_STATE_PATH = inputs.repoSyncStatePath

  const token = requireEnv('GITHUB_TOKEN')
  const mergeCommitSha = requireEnv('MERGE_COMMIT_SHA')
  const branch = process.env.TARGET_BRANCH ?? inputs.config.repo.ref

  const files = []

  // Always read the current tree — the baseline must be rebuilt from every token's live resolved
  // value on every successful sync (not just a run that added/removed variableIds), so a
  // value-only change that merged without touching ids still refreshes its stale baseline entry.
  const baseFile = await getFileContent(TOKEN_FILE_PATH, branch, token)
  if (!baseFile) throw new Error(`${TOKEN_FILE_PATH} not found on ${branch}.`)
  const currentTree = JSON.parse(baseFile.content)
  const patchedTree = newIds.length > 0 ? applyVariableIdPatch(currentTree, newIds) : currentTree
  const patchedTokens = flattenTokens(patchedTree)
  if (newIds.length > 0) {
    files.push({ path: TOKEN_FILE_PATH, content: JSON.stringify(patchedTree, null, 2) + '\n' })
  }

  const stateFile = await getFileContent(SYNC_STATE_PATH, branch, token)
  const existingState = stateFile ? JSON.parse(stateFile.content) : null
  const syncState = buildSyncState({
    existingState,
    baseTokens: patchedTokens,
    mergeCommitSha,
    syncedAt,
    removedVariableIds: removedIds,
  })
  files.push({ path: SYNC_STATE_PATH, content: JSON.stringify(syncState, null, 2) + '\n' })

  const message = buildCommitMessage(newIds, removedIds)
  const result = await commitFiles({ branch, files, message, token })
  console.log(`Committed to ${branch}: ${result.sha} (${message.split('\n')[0]})`)
}

function patchLocalFiles({ newIds, removedIds, syncedAt, inputs }) {
  const { tokensDir, tokenFilePath } = inputs
  const repoRoot = resolve(tokensDir, '..')
  const mergeCommitSha = process.env.MERGE_COMMIT_SHA ?? 'local-test'

  const files = []

  const currentTree = loadTokenFile(tokenFilePath)
  const patchedTree = newIds.length > 0 ? applyVariableIdPatch(currentTree, newIds) : currentTree
  const patchedTokens = flattenTokens(patchedTree)
  if (newIds.length > 0) {
    files.push({ path: relative(repoRoot, tokenFilePath), content: JSON.stringify(patchedTree, null, 2) + '\n' })
  }

  const existingState = loadSyncStateFile(inputs.syncStateFile)
  const syncState = buildSyncState({
    existingState,
    baseTokens: patchedTokens,
    mergeCommitSha,
    syncedAt,
    removedVariableIds: removedIds,
  })
  files.push({ path: relative(repoRoot, inputs.syncStateFile), content: JSON.stringify(syncState, null, 2) + '\n' })

  return { tokensDir, files, message: buildCommitMessage(newIds, removedIds) }
}

function runLocalWriteOnly(input) {
  const { tokensDir, files } = patchLocalFiles(input)
  const repoRoot = resolve(tokensDir, '..')

  for (const file of files) {
    writeFileSync(resolve(repoRoot, file.path), file.content)
  }

  console.log(
    `Wrote ${files.map(f => f.path).join(', ')} at ${repoRoot} — not committed, review with \`git diff\` and commit yourself.`,
  )
}

function runLocalGitCommit(input) {
  const { tokensDir, files, message } = patchLocalFiles(input)
  const repoRoot = resolve(tokensDir, '..')
  const result = commitFilesLocally({ repoRoot, files, message })
  console.log(`Committed locally at ${repoRoot}: ${result.sha} (${message.split('\n')[0]})`)
}

function buildCommitMessage(newIds, removedIds) {
  const parts = []
  if (newIds.length > 0) parts.push(`back-fill ${newIds.length} Figma variableId(s)`)
  if (removedIds.length > 0) parts.push(`drop ${removedIds.length} deleted Figma variable(s) from the baseline`)
  if (parts.length === 0) parts.push('refresh sync baseline')
  return `chore(tokens): ${parts.join(', ')}\n\nAutomated — see docs/adr/0017-direct-commit-variableid-backfill.md.`
}

// A full-tree first sync can produce thousands of entries — too much JSON to pass safely through
// an env var (see pull.mjs's matching comment on why it writes a file instead of a raw output).
// NEW_IDS/REMOVED_IDS (inline JSON) remain supported for small local test payloads.
function readIdsInput(fileEnvVar, inlineEnvVar) {
  const filePath = process.env[fileEnvVar]
  if (filePath) return JSON.parse(readFileSync(filePath, 'utf-8'))
  return process.env[inlineEnvVar] ? JSON.parse(process.env[inlineEnvVar]) : []
}

async function main() {
  const newIds = readIdsInput('NEW_IDS_FILE', 'NEW_IDS')
  const removedIds = readIdsInput('REMOVED_IDS_FILE', 'REMOVED_IDS')

  // Always runs through to a baseline rebuild, even with no new/removed ids — a value-only sync
  // (e.g. a color edit to an already-synced token) still needs its baseline entry's resolvedValue
  // refreshed, or the next PR touching that token gets a false conflict against the stale value.
  const syncedAt = new Date().toISOString()
  const inputs = resolveSyncInputs()

  if (!process.env.TOKENS_DIR_OVERRIDE) {
    await runRemote({ newIds, removedIds, syncedAt, inputs })
  } else if (process.env.LOCAL_GIT_COMMIT === 'true') {
    runLocalGitCommit({ newIds, removedIds, syncedAt, inputs })
  } else {
    runLocalWriteOnly({ newIds, removedIds, syncedAt, inputs })
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
