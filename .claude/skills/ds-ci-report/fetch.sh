#!/usr/bin/env bash
# Downloads the core `playwright-report` artifact of the current branch's latest Continuous run,
# only when a Playwright job failed. Prints `REPORT_DIR=<path>` on success; otherwise a reason, exit 2.
set -euo pipefail

WORKFLOW="👷 Continuous"
ARTIFACT="playwright-report"
ROOT="$(git rev-parse --show-toplevel)"
BASE="$ROOT/.ci-reports"
BRANCH="$(git branch --show-current)"

run="$(gh run list -w "$WORKFLOW" -b "$BRANCH" -L 1 --json databaseId,status,conclusion,url \
  --jq '.[0] // empty | "\(.databaseId) \(.status) \(.conclusion) \(.url)"')"
[ -z "$run" ] && { echo "No \"$WORKFLOW\" run for branch $BRANCH."; exit 2; }
read -r id status conclusion url <<<"$run"

[ "$status" != "completed" ] && { echo "Latest run still $status: $url"; exit 2; }
[ "$conclusion" = "success" ] && { echo "Latest run is green: $url"; exit 2; }

failed_pw="$(gh run view "$id" --json jobs --jq '[.jobs[] | select(.conclusion=="failure") | .name] | map(select(startswith("🎭 Playwright"))) | join(", ")')"
if [ -z "$failed_pw" ]; then
  failed="$(gh run view "$id" --json jobs --jq '[.jobs[] | select(.conclusion=="failure") | .name] | join(", ")')"
  echo "Run $conclusion, but no Playwright job failed (failed: ${failed:-none}): $url"
  exit 2
fi
echo "Failed: $failed_pw"

dir="$BASE/$id"
if [ ! -f "$dir/index.html" ]; then
  expired="$(gh api "repos/{owner}/{repo}/actions/runs/$id/artifacts" \
    --jq "[.artifacts[] | select(.name==\"$ARTIFACT\")][0] | if . == null then \"missing\" else (.expired | tostring) end")"
  [ "$expired" != "false" ] && { echo "Artifact $ARTIFACT is ${expired/true/expired}: $url"; exit 2; }
  rm -rf "$BASE"  # keep only the latest run
  gh run download "$id" -n "$ARTIFACT" -D "$dir"
fi
echo "REPORT_DIR=$dir"
