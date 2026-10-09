# Repo Move: `next` → helvetia-design/design-system

## Context

Today everything lives in `baloise/design-system` (public, active):
- `main` — the historical/production branch, currently without live CI.
- `next` — the active development branch, full history, extensive `.github/workflows/`.
- ~130 other branches (feature/dependabot/release branches), tags `v10`–`v18`, a `production` branch.
- 39 open issues, 7 open milestones, 30 labels.
- Packages published as `@baloise/ds-*` to npm; `homepage`/security-advisory links point at `baloise.dev`.

The `helvetia-design` GitHub org exists (created 2026-09-21) and is currently empty. The acting user (`hirsch88`) has admin rights on both `baloise/design-system` and the `helvetia-design` org.

## Goal — end state

Two permanently separate repos:
- **`baloise/design-system`** — keeps `main` as its own independent repo/history. Untouched in phase 1; in phase 2 (separate, later effort) `main`'s CI is restored so it's canonical again within this repo. No rename of the branch itself — "main becomes the master" is a role change, not a `git branch -m`.
- **`helvetia-design/design-system`** — new public repo, becomes home for `next` (pushed in as `main`) and all future active development.

No merge/consolidation of the two repos is planned. No npm scope or branding change is part of this move — `@baloise/ds-*` package names and `baloise.dev` links stay as-is.

## Phase 1 — move `next` ✅ complete (2026-10-09)

### Scope decisions
- **What moves:** only `next`'s history, pushed into the new repo as `main` — clean slate, no git tags come along. The ~130 other stale/feature/dependabot branches, the `production` branch, and `v10`–`v18` tags are *not* mirrored — abandoned in place.
- **Mechanism:** push-mirror, not a GitHub repo transfer. A brand-new empty repo is created at `helvetia-design/design-system`; `next`'s full history is pushed into it as `main`, which becomes the default branch. `baloise/design-system` (and its own `main`) is never touched by a transfer operation.
- **CI:** `.github/workflows/*` files travel with the code (they're part of `next`'s history) but stay dormant in phase 1 — no secrets/environments/branch protection configured for them yet, so nothing runs. Wiring them up is phase 2+ work.
- **Access:** only the acting user gets write access to the new repo initially; team/org access is added after the migration is validated.

### Steps
1. ✅ **Freeze `next` in the old repo** — lock the branch read-only via `lock_branch=true` branch protection on `baloise/design-system:next`, so the snapshot we mirror is final.
   ```
   gh api -X PUT repos/baloise/design-system/branches/next/protection \
     -F lock_branch=true \
     -F required_status_checks='null' \
     -F enforce_admins='null' \
     -F required_pull_request_reviews='null' \
     -F restrictions='null'
   ```
   Done — `lock_branch.enabled` confirmed `true`.
2. ✅ **Create the new repo** — `gh repo create helvetia-design/design-system --public` (empty, no auto-init). Done — https://github.com/helvetia-design/design-system
3. ✅ **Push-mirror** — push `next`'s full history into the new repo as `main`; no tags came along (clean slate). Set `main` as its default branch.
   ```
   git remote add helvetia-design git@github.com:helvetia-design/design-system.git
   git push helvetia-design next:main
   gh repo edit helvetia-design/design-system --default-branch main
   ```
   Done.
4. ✅ **Replicate labels** — copied all 30 labels (name/color/description) from `baloise/design-system` into the new repo via `gh label create --force`. Done — new repo has the 30 replicated plus 10 GitHub default labels (left as-is, not in scope to remove).
5. ✅ **Replicate open milestones** — recreated the 7 open milestones (title/description/due date) in the new repo via the API. Done — titles match exactly; one due date shifted by a day (timezone conversion on create), cosmetic only.
6. ✅ **Migrate open issues** — **plan deviation:** `gh issue transfer` does not support cross-organization transfers (`baloise` → `helvetia-design`); every attempt failed with *"New repository must have the same owner as the current repository."* Also, the actual open-issue count at execution time was **53**, not the 39 assumed when the plan was written. Resolved by recreating each issue via the API instead of a true transfer: new issue in `helvetia-design/design-system` with title/body/labels/milestone preserved and a header noting the original author/date, all comments copied in with `**@author** commented on <date> (migrated from baloise/design-system#N)` attribution, then the original closed (`state_reason: not_planned`) with a comment linking to its new location. Trade-off: no automatic GitHub URL redirect (true transfer would have given one) — only the closing comment links old → new. Done — 53/53 migrated; source repo now shows 0 open issues, new repo shows 53.
7. ✅ **Close open PRs targeting `next`** in the old repo. Done manually by the user — #2395 (dependabot bump) merged, #2317 (changeset-release) closed.
8. ✅ **Leave `next` frozen** in the old repo (branch protection stays in place) as a read-only historical pointer — not deleted. Confirmed still locked.

### Explicitly out of scope for phase 1
- Renaming/rebranding npm packages or domain references.
- Wiring up CI secrets/environments in the new repo.
- Replicating stale branches, dependabot branches, or any version tags (`v10`–`v18`) — none are mirrored.
- Any change to `baloise/design-system:main`.
- Adding team/org-wide collaborators to the new repo.

## Phase 2 — restore `main` as canonical (separate, later effort)

Scope not yet detailed. Known constraints going in:
- `main` stays in `baloise/design-system`; no rename to a literal `master` branch.
- Goal is to reinstate `main`'s CI/tooling so it's the canonical/production branch again within its existing repo — not a merge with `helvetia-design/design-system`.
