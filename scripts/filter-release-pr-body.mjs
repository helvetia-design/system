/**
 * Filters the Release PR body (written by changesets/action) down to only the
 * @helvetia-design/core section. All @helvetia-design/* packages are versioned together
 * (see .changeset/config.json "fixed"), and core's own CHANGELOG.md already carries the
 * complete, formatted set of changes for the release, so the other packages' "No changes
 * in this release." sections are pure noise. Run right after changesets/action, passing
 * its `pullRequestNumber` output. Requires `gh` with a token that can edit the PR.
 */
import { execSync } from 'node:child_process'

const prNumber = process.argv[2]
if (!prNumber) {
  console.error('Usage: node scripts/filter-release-pr-body.mjs <pr-number>')
  process.exit(1)
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

execSync(`gh pr edit ${prNumber} --body-file -`, { input: filteredBody, encoding: 'utf-8' })
console.log(`✅ Filtered PR #${prNumber} body to only show @helvetia-design/core`)
