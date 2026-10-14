/**
 * Filters the Release PR body (written by changesets/action) down to only the
 * @helvetia-design/core section. All @helvetia-design/* packages are versioned together
 * (see .changeset/config.json "fixed"), and core's own CHANGELOG.md already carries the
 * complete, formatted set of changes for the release, so the other packages' "No changes
 * in this release." sections are pure noise. Run right after changesets/action. Accepts an
 * optional PR number argument for manual use; otherwise looks up the open
 * `changeset-release/main` PR itself, since changesets/action's own `pullRequestNumber`/
 * `hasChangesets` outputs come back empty in this workflow (observed on every run,
 * unrelated to this script). Requires `gh` with a token that can edit the PR.
 */
import { execSync } from 'node:child_process'

let prNumber = process.argv[2]
if (!prNumber) {
  prNumber = execSync(`gh pr list --head changeset-release/main --state open --json number -q '.[0].number'`, {
    encoding: 'utf-8',
  }).trim()
}

if (!prNumber) {
  console.log('ℹ️  No open Release PR found, nothing to filter')
  process.exit(0)
}

const body = execSync(`gh pr view ${prNumber} --json body -q .body`, { encoding: 'utf-8' })

const releasesHeadingIndex = body.indexOf('# Releases')
const intro = (releasesHeadingIndex === -1 ? body : body.slice(0, releasesHeadingIndex)).trim()

const coreHeadingRe = /^## @helvetia-design\/core@\S+.*$/m
const coreMatch = coreHeadingRe.exec(body)

if (!coreMatch) {
  console.log('ℹ️  No @helvetia-design/core section found in PR body, leaving it as-is')
  process.exit(0)
}

const sectionStart = coreMatch.index
const rest = body.slice(sectionStart + coreMatch[0].length)
const nextHeadingMatch = rest.match(/^## /m)
const sectionEnd = nextHeadingMatch ? sectionStart + coreMatch[0].length + nextHeadingMatch.index : body.length
const coreSection = body.slice(sectionStart, sectionEnd).trim()

const filteredBody = `${intro}\n\n# Releases\n\n${coreSection}\n`

// `gh pr edit` also fetches the full PR object (incl. review requests) via GraphQL to print
// a confirmation, which 403s when the token can't see a requested reviewer (e.g. a team) —
// even though the edit itself would succeed. Use a plain REST PATCH instead to avoid that.
const repo = execSync(`gh repo view --json nameWithOwner -q .nameWithOwner`, { encoding: 'utf-8' }).trim()
execSync(`gh api repos/${repo}/pulls/${prNumber} --method PATCH --field body=@-`, {
  input: filteredBody,
  encoding: 'utf-8',
})
console.log(`✅ Filtered PR #${prNumber} body to only show @helvetia-design/core`)
