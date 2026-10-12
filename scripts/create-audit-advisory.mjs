import fs from 'node:fs'

// Parses `pnpm audit --audit-level high --json` output (written to
// audit-result.json by the calling workflow) and opens a draft GitHub
// Security Advisory for any findings pnpm hasn't already filtered out via
// pnpm-workspace.yaml's auditConfig.ignoreGhsas. Draft advisories stay
// private to repo maintainers regardless of the repo's own visibility,
// which is why this uses the Security Advisories API instead of opening a
// plain issue.

const REPO_OWNER = 'helvetia-design'
const REPO_NAME = 'system'

const token = process.env.GITHUB_TOKEN
if (!token) {
  throw new Error('GITHUB_TOKEN is not set — a token with Repository security advisories: write is required.')
}

const audit = JSON.parse(fs.readFileSync('audit-result.json', 'utf8'))
const advisories = Object.values(audit.advisories ?? {})

if (advisories.length === 0) {
  console.log(
    'No actionable advisories (any flagged findings are already in pnpm-workspace.yaml ignoreGhsas) — nothing to do.',
  )
  process.exit(0)
}

const severityRank = { critical: 4, high: 3, moderate: 2, low: 1, info: 0 }
const severityMap = { critical: 'critical', high: 'high', moderate: 'medium', low: 'low', info: 'low' }

const highest = advisories.reduce(
  (max, advisory) => (severityRank[advisory.severity] > severityRank[max] ? advisory.severity : max),
  'info',
)

async function githubFetch(path, init) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `GitHub API ${init?.method ?? 'GET'} ${path} failed: ${response.status} ${response.statusText} — ${body}`,
    )
  }
  return response.json()
}

// Avoid opening a new draft advisory every morning for the same
// still-unresolved finding — if one from a previous run is still open
// (state triage or draft), just log and stop.
const existing = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/security-advisories?per_page=100`)
const openExisting = existing.find(
  advisory => advisory.summary?.startsWith('pnpm audit:') && ['triage', 'draft'].includes(advisory.state),
)
if (openExisting) {
  console.log(
    `An open pnpm-audit advisory already exists (${openExisting.html_url}) — skipping, not creating a duplicate.`,
  )
  process.exit(0)
}

const summary =
  `pnpm audit: ${advisories.length} vulnerabilit${advisories.length === 1 ? 'y' : 'ies'} found (highest: ${highest})`.slice(
    0,
    1024,
  )

const rows = advisories
  .map(advisory => {
    const name = advisory.module_name ?? advisory.name ?? 'unknown package'
    const severity = advisory.severity ?? 'unknown'
    const title = advisory.title ?? 'Untitled advisory'
    const range = advisory.vulnerable_versions ?? advisory.range ?? 'unknown'
    const url = advisory.url ?? (advisory.references ? advisory.references.split('\n')[0] : '')
    return `| ${name} | ${severity} | ${title} | ${range} | ${url} |`
  })
  .join('\n')

const description = [
  'Found by the scheduled `pnpm audit --audit-level high` workflow run.',
  "Anything already listed in `pnpm-workspace.yaml`'s `auditConfig.ignoreGhsas` is excluded from this report.",
  '',
  '| Package | Severity | Title | Vulnerable range | Reference |',
  '| --- | --- | --- | --- | --- |',
  rows,
  '',
  '<details><summary>Raw pnpm audit output</summary>',
  '',
  '```json',
  JSON.stringify(audit, null, 2).slice(0, 60000),
  '```',
  '',
  '</details>',
].join('\n')

const created = await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/security-advisories`, {
  method: 'POST',
  body: JSON.stringify({
    summary,
    description,
    severity: severityMap[highest] ?? 'medium',
  }),
})

console.log(`Created draft security advisory: ${created.html_url}`)
