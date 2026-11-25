#!/usr/bin/env node
/**
 * Entry point for the extension-references job in figma-conflict-check.yml. Runs on every PR that
 * touches token files: loads Extensions.tokens.json from helvetia-design/extensions and comments on
 * the PR when it removes or renames a core token that an extension token references. The comment
 * names token paths only, because the extension file is private and this repo is public. Never
 * fails the check itself (docs/adr/0018-non-blocking-conflict-check.md); a script error still exits
 * non-zero, finding a removed reference never does.
 *
 * Run with: node scripts/figma-sync/extension-reference-check.mjs
 *
 * EXTENSIONS_READ_TOKEN: read-only token for the extensions repo. If unset (fork PRs, secret not
 * configured yet), the script warns and exits 0.
 * EXTENSIONS_REPOSITORY, EXTENSIONS_REF, EXTENSIONS_TOKEN_FILE (optional): default to
 * helvetia-design/extensions, main, packages/tokens/tokens/Extensions.tokens.json. If the file does
 * not exist there yet, the script exits 0. If the token cannot see the repository, it fails.
 * EXTENSIONS_TOKEN_FILE_LOCAL (optional): read the extension file from disk instead of the API.
 *
 * TOKENS_DIR_OVERRIDE (optional, shared with the other scripts): read the PR head's
 * Base.tokens.json from a local directory instead of packages/tokens/tokens.
 * BASE_REF: git ref of the PR base, read with `git show` from the local checkout. The workflow
 * passes HEAD^1, the base parent of the PR merge commit. Locally, e.g. origin/main.
 * BASE_TOKENS_FILE (optional) reads the base file from disk instead.
 *
 * PR_NUMBER/GITHUB_TOKEN (optional together): if either is unset, skips posting and prints the
 * comment body to stdout instead.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildExtensionReferenceCommentBody,
  EXTENSION_REFERENCE_COMMENT_MARKER,
  findRemovedExtensionReferences,
} from './lib/extension-references.mjs'
import {
  canReadRepository,
  createIssueComment,
  findMarkedComment,
  getFileContent,
  updateIssueComment,
} from './lib/github.mjs'
import { readFileAtRef } from './lib/local-git.mjs'
import { flattenTokens, loadTokenFile } from './lib/tokens.mjs'

const CORE_TOKEN_FILE = 'packages/tokens/tokens/Base.tokens.json'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set.`)
  return value
}

function parseExtensionTokenFile(content) {
  try {
    return JSON.parse(content)
  } catch {
    throw new Error('Extensions token file is not valid JSON. Its content is not logged because the file is private.')
  }
}

async function loadExtensionTokenFile() {
  const localPath = process.env.EXTENSIONS_TOKEN_FILE_LOCAL
  if (localPath) return parseExtensionTokenFile(readFileSync(localPath, 'utf-8'))

  const token = process.env.EXTENSIONS_READ_TOKEN
  if (!token) {
    console.log('::warning::EXTENSIONS_READ_TOKEN is not set, skipping the extension reference check.')
    return null
  }

  const repository = process.env.EXTENSIONS_REPOSITORY ?? 'helvetia-design/extensions'
  const ref = process.env.EXTENSIONS_REF ?? 'main'
  const path = process.env.EXTENSIONS_TOKEN_FILE ?? 'packages/tokens/tokens/Extensions.tokens.json'
  const file = await getFileContent(path, ref, token, repository)
  if (!file) {
    if (!(await canReadRepository(repository, token))) {
      throw new Error(`EXTENSIONS_READ_TOKEN cannot read ${repository}. Check the token's repository access.`)
    }
    console.log(`No ${path} on ${repository}@${ref} yet, nothing can reference core tokens.`)
    return null
  }
  return parseExtensionTokenFile(file.content)
}

function loadBaseTokenFile() {
  const localPath = process.env.BASE_TOKENS_FILE
  if (localPath) return loadTokenFile(localPath)

  return JSON.parse(readFileAtRef(requireEnv('BASE_REF'), CORE_TOKEN_FILE))
}

async function main() {
  const prNumber = process.env.PR_NUMBER
  const githubToken = process.env.GITHUB_TOKEN

  const extensionTree = await loadExtensionTokenFile()
  if (!extensionTree) return

  const tokensDir = process.env.TOKENS_DIR_OVERRIDE ?? 'packages/tokens/tokens'
  const findings = findRemovedExtensionReferences({
    extensionTokens: flattenTokens(extensionTree),
    baseTokens: flattenTokens(loadBaseTokenFile()),
    headTokens: flattenTokens(loadTokenFile(join(tokensDir, 'Base.tokens.json'))),
  })

  console.log(`Found ${findings.length} removed extension reference(s).`)
  const body = buildExtensionReferenceCommentBody(findings)

  if (!prNumber || !githubToken) {
    console.log(`\nPR_NUMBER/GITHUB_TOKEN not set — printing comment body instead of posting:\n\n${body}`)
    return
  }

  const existingComment = await findMarkedComment(prNumber, EXTENSION_REFERENCE_COMMENT_MARKER, githubToken)
  if (existingComment) {
    await updateIssueComment(existingComment.id, body, githubToken)
  } else if (findings.length > 0) {
    await createIssueComment(prNumber, body, githubToken)
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
