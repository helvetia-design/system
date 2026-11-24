import { getTokyConfig } from './config'
import {
  brandFilePath,
  encodeGithubUrlSegment,
  getGithubRef,
  githubRefFor,
  requireGithubToken,
  tokenFilePath,
  tokenPackageJsonPath,
} from './github'

async function apiRoot(): Promise<string> {
  const { repo } = await getTokyConfig()
  return `https://api.github.com/repos/${repo.owner}/${repo.name}`
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${requireGithubToken()}`,
    Accept: 'application/vnd.github+json',
    ...extra,
  }
}

// Next.js caches server-side fetches by default — every call here must hit
// GitHub fresh, or branch/PR existence checks (and the file content itself)
// can keep returning a stale snapshot from before a submit created them.
function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, cache: 'no-store' })
}

async function assertOk(response: Response, action: string): Promise<void> {
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to ${action}: ${response.status} ${response.statusText} — ${body}`)
  }
}

// One standing branch per target base, e.g. "toky/update-next" — a second
// submit against the same base reuses it (and its still-open PR) instead of
// spawning a new branch/PR every time. Slashes in the base (e.g.
// "release/2026-08") are flattened so the branch stays a single path segment
// under toky/update-*, avoiding any git ref-namespace collisions.
export function workingBranchFor(base: string): string {
  return `toky/update-${base.replace(/\//g, '-')}`
}

export interface FileMeta {
  sha: string
  content: string
}

// Generic file read, decoded to raw text — for JSON token files, parse the
// result yourself (see getBaseTokensFileMeta); for source files like
// the brands index, use the text directly.
export async function getFileMeta(path: string, ref?: string): Promise<FileMeta> {
  const url = `${await apiRoot()}/contents/${encodeGithubUrlSegment(path)}?ref=${encodeGithubUrlSegment(ref ?? (await getGithubRef()))}`

  const response = await apiFetch(url, { headers: authHeaders() })
  await assertOk(response, `fetch ${path} metadata`)

  const json = (await response.json()) as { sha: string; content: string }
  return { sha: json.sha, content: Buffer.from(json.content, 'base64').toString('utf-8') }
}

/** The npm name of the token package, which every Toky changeset bumps. */
export async function getTokenPackageName(ref?: string): Promise<string> {
  const manifestPath = tokenPackageJsonPath(await getTokyConfig())
  const { name } = JSON.parse((await getFileMeta(manifestPath, ref)).content) as { name?: unknown }
  if (typeof name !== 'string' || name === '') throw new Error(`${manifestPath} has no package name.`)
  return name
}

export interface BaseTokensFileMeta {
  sha: string
  content: Record<string, unknown>
}

export async function getBaseTokensFileMeta(ref?: string): Promise<BaseTokensFileMeta> {
  const meta = await getFileMeta(tokenFilePath(await getTokyConfig()), ref)
  return { sha: meta.sha, content: JSON.parse(meta.content) as Record<string, unknown> }
}

// Same shape as getBaseTokensFileMeta, for a brand's own sparse override file.
export async function getBrandTokensFileMeta(name: string, ref?: string): Promise<BaseTokensFileMeta> {
  const meta = await getFileMeta(brandFilePath(await getTokyConfig(), name), ref)
  return { sha: meta.sha, content: JSON.parse(meta.content) as Record<string, unknown> }
}

// Powers the Brands sidebar and brand-name collision checks — every
// `*.tokens.json` sibling of Base.tokens.json is a brand override file (see
// packages/tokens/docs/adr/0002-brand-modes-not-collections.md).
export async function listTokenBrandFiles(ref?: string): Promise<string[]> {
  const config = await getTokyConfig()
  if (config.brandsIndexPath === null) return []
  const url = `${await apiRoot()}/contents/${encodeGithubUrlSegment(config.tokensDir)}?ref=${encodeGithubUrlSegment(ref ?? githubRefFor(config))}`

  const response = await apiFetch(url, { headers: authHeaders() })
  await assertOk(response, `list ${config.tokensDir}`)

  const json = (await response.json()) as { name: string; type: string }[]
  return json
    .filter(entry => entry.type === 'file' && entry.name.endsWith('.tokens.json') && entry.name !== config.tokenFile)
    .map(entry => entry.name.slice(0, -'.tokens.json'.length))
    .sort((a, b) => a.localeCompare(b))
}

// Powers the target-branch picker in the submit form — a real list of what
// exists on GitHub, so the user can only ever pick a branch that's actually
// there instead of free-typing something that might not exist.
// Branches nobody submits tokens against — release snapshots and automated
// dependency-bump branches would just be noise in the target-branch picker.
const HIDDEN_BRANCH_PATTERNS = [/^production$/, /^v\d+/, /^dependabot\//]

function isHiddenBranch(name: string): boolean {
  return HIDDEN_BRANCH_PATTERNS.some(pattern => pattern.test(name))
}

export async function listBranches(): Promise<string[]> {
  const branches: string[] = []
  let page = 1

  while (true) {
    const url = `${await apiRoot()}/branches?per_page=100&page=${page}`
    const response = await apiFetch(url, { headers: authHeaders() })
    await assertOk(response, 'list branches')

    const json = (await response.json()) as { name: string }[]
    branches.push(...json.map(b => b.name))
    if (json.length < 100) break
    page += 1
  }

  return branches.filter(name => !isHiddenBranch(name)).sort((a, b) => a.localeCompare(b))
}

async function getRefSha(ref: string): Promise<string> {
  const url = `${await apiRoot()}/git/ref/heads/${encodeGithubUrlSegment(ref)}`
  const response = await apiFetch(url, { headers: authHeaders() })
  await assertOk(response, `read ref heads/${ref}`)

  const json = (await response.json()) as { object: { sha: string } }
  return json.object.sha
}

export async function branchExists(branch: string): Promise<boolean> {
  const url = `${await apiRoot()}/git/ref/heads/${encodeGithubUrlSegment(branch)}`
  const response = await apiFetch(url, { headers: authHeaders() })
  if (response.status === 404) return false
  await assertOk(response, `check whether branch ${branch} exists`)
  return true
}

export async function createBranch(branchName: string, baseRef?: string): Promise<void> {
  const baseSha = await getRefSha(baseRef ?? (await getGithubRef()))
  const url = `${await apiRoot()}/git/refs`

  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
  })
  await assertOk(response, `create branch ${branchName}`)
}

// Generic "replace an existing file's content" — for the token file
// specifically, see updateFileOnBranch; for anything else (e.g.
// the brands index), call this directly.
export async function updateFileAtPath(
  branch: string,
  path: string,
  newContent: string,
  sha: string,
  message: string,
): Promise<void> {
  const url = `${await apiRoot()}/contents/${encodeGithubUrlSegment(path)}`

  const response = await apiFetch(url, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      message,
      content: Buffer.from(newContent, 'utf-8').toString('base64'),
      sha,
      branch,
    }),
  })
  await assertOk(response, `update ${path} on branch ${branch}`)
}

export async function updateFileOnBranch(
  branch: string,
  newContent: string,
  sha: string,
  message: string,
): Promise<void> {
  return updateFileAtPath(branch, tokenFilePath(await getTokyConfig()), newContent, sha, message)
}

// For any new file (no existing sha) at an arbitrary path — used for the
// changeset entry that rides along with a token update.
export async function createFileOnBranch(
  branch: string,
  path: string,
  content: string,
  message: string,
): Promise<void> {
  const url = `${await apiRoot()}/contents/${encodeGithubUrlSegment(path)}`

  const response = await apiFetch(url, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch,
    }),
  })
  await assertOk(response, `create ${path} on branch ${branch}`)
}

// A brand starts as an empty sparse override file — it resolves identically
// to Base for every token purely because nothing's in it yet (see
// packages/tokens/tokens/OrangeVacations.tokens.json for what a real one
// looks like once it has overrides).
export async function createBrandFile(branch: string, name: string): Promise<void> {
  return createFileOnBranch(
    branch,
    brandFilePath(await getTokyConfig(), name),
    '{}\n',
    `chore(tokens): add ${name} brand`,
  )
}

const BRANDS_ARRAY_PATTERN = /const brands = \[([^\]]*)\]/

// Pure string transform, kept separate from the I/O so it's directly
// testable — see ADR-0001 (apps/toky/docs/adr) for why this exists and why
// it's designed to fail loudly (return null) rather than guess.
export function insertBrandIntoIndexSource(source: string, brandName: string): string | null {
  const match = BRANDS_ARRAY_PATTERN.exec(source)
  if (!match) return null

  const existing = match[1].trim()
  const newBody = existing ? `${existing.replace(/,\s*$/, '')}, '${brandName}'` : `'${brandName}'`

  return source.slice(0, match.index) + `const brands = [${newBody}]` + source.slice(match.index + match[0].length)
}

// Wires a newly-created brand into the CSS build (packages/tokens/src/index.ts's
// `brands` array) in the same PR as the brand file itself, so creating a brand
// is a single, complete action rather than needing a manual follow-up.
export async function addBrandToIndex(branch: string, brandName: string): Promise<void> {
  const { brandsIndexPath } = await getTokyConfig()
  if (brandsIndexPath === null) throw new Error(`This token source has no brands — cannot add '${brandName}'.`)
  const meta = await getFileMeta(brandsIndexPath, branch)
  const nextContent = insertBrandIntoIndexSource(meta.content, brandName)
  if (nextContent === null) {
    throw new Error(
      `Could not find "const brands = [...]" in ${brandsIndexPath} to add '${brandName}' — nothing was submitted.`,
    )
  }
  await updateFileAtPath(branch, brandsIndexPath, nextContent, meta.sha, `chore: add ${brandName} to brand builds`)
}

export interface OpenedPullRequest {
  url: string
  number: number
  body: string
}

export async function openPullRequest(
  branch: string,
  title: string,
  body: string,
  base?: string,
): Promise<OpenedPullRequest> {
  const url = `${await apiRoot()}/pulls`

  const response = await apiFetch(url, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, head: branch, base: base ?? (await getGithubRef()), body }),
  })
  await assertOk(response, `open pull request from ${branch}`)

  const json = (await response.json()) as { html_url: string; number: number; body: string | null }
  return { url: json.html_url, number: json.number, body: json.body ?? '' }
}

// Looks up the (at most one, since Toky only ever pushes to its own
// deterministic per-base branch) already-open PR from a previous submit that
// hasn't been merged/closed yet, so a second submit can reuse it instead of
// opening a duplicate.
export async function findOpenPullRequest(branch: string): Promise<OpenedPullRequest | null> {
  const { repo } = await getTokyConfig()
  const url = `${await apiRoot()}/pulls?head=${repo.owner}:${encodeGithubUrlSegment(branch)}&state=open`
  const response = await apiFetch(url, { headers: authHeaders() })
  await assertOk(response, `look up open pull requests for ${branch}`)

  const json = (await response.json()) as { html_url: string; number: number; body: string | null }[]
  const [pr] = json
  return pr ? { url: pr.html_url, number: pr.number, body: pr.body ?? '' } : null
}

// Rewrites the description of an already-open PR — used to append this
// submit's changes to the running activity log instead of leaving the PR
// body frozen at whatever it said when first opened.
export async function updatePullRequestBody(prNumber: number, body: string): Promise<void> {
  const url = `${await apiRoot()}/pulls/${prNumber}`

  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ body }),
  })
  await assertOk(response, `update pull request #${prNumber}`)
}

export interface SyncStatus {
  state: 'synced' | 'pending'
  baseRef: string
  prUrl: string | null
  prNumber: number | null
}

export function syncedStatus(baseRef: string): SyncStatus {
  return { state: 'synced', baseRef, prUrl: null, prNumber: null }
}

// Where the editor should actually read from: if a Toky-authored branch for
// this base already exists (an earlier submit not yet merged), read from
// there instead of `base` so the editor always reflects the latest proposed
// state, not a stale pre-PR snapshot — and report that as 'pending' so the
// UI can flag it.
export async function resolveReadRef(base: string): Promise<{ ref: string; status: SyncStatus }> {
  const branch = workingBranchFor(base)
  const exists = await branchExists(branch)
  if (!exists) {
    return { ref: base, status: syncedStatus(base) }
  }

  const pr = await findOpenPullRequest(branch)
  return {
    ref: branch,
    status: { state: 'pending', baseRef: base, prUrl: pr?.url ?? null, prNumber: pr?.number ?? null },
  }
}
