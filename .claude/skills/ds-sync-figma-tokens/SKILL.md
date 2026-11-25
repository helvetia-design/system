---
name: ds-sync-figma-tokens
description: Push Base.tokens.json into Figma variables and write the new variableIds back into the repo. Use when a Figma build is blocked because a token has no Figma variable, or new tokens must reach Figma before the CI sync runs.
---

# ds-sync-figma-tokens

CI (`.github/workflows/figma-sync.yml`) runs this after a merge to `main`. This skill runs it
locally so a Figma build need not wait. Do not read the script source — the commands and the
dry-run output below are all you need.

- **`pull.mjs`** writes tokens → Figma variables (the name is from Figma's side). With
  `DRY_RUN=false` it **writes to the real Figma file**.
- **`backfill-commit.mjs`** writes the new ids back into `Base.tokens.json` and
  `packages/tokens/.figma-sync-state.json`.

## 0 · Preconditions

- Tokens already changed (`ds-manage-tokens`) and validated (`ds-validate-tokens`).
- `.env` with `FIGMA_API_TOKEN` + `FIGMA_FILE_KEY` at the repo root. In a worktree it may only
  exist in the main checkout: use `node --env-file=<that>/.env …` instead of the `pnpm` scripts
  below. Never print the values.
- `pnpm --filter @helvetia-design/tokens build` has run (the scripts import its `dist`).

## 1 · Device eligibility (responsive tokens only)

A `com.helvetia.responsive` token always gets Mobile/Tablet/Desktop variables. It gets the
**Device** variable — the one Figma components bind to — only if its path matches
`DEVICE_ELIGIBLE_PATH_PREFIXES` in `scripts/figma-sync/lib/figma-value.mjs`. If it needs one and
isn't listed, add the narrowest prefix (e.g. `['🧩 Component', 'Logo', 'Size']`) and run
`pnpm test:figma-sync`. That list is the only sync code you may touch; any other script defect
is a finding to report.

## 2 · Dry run

```bash
pnpm figma-sync:dry-run
```

The last block, **Planned writes**, is exactly what the real run would do. Go on only if:

- `create` lists exactly the variables you expect (Device ones end in `/Device`)
- `delete`, `rename` and `recreate` are 0 — anything else, stop and report the list
- no `token variableId(s) not found in Figma` line — that means the wrong `FIGMA_FILE_KEY`; stop

`description update` > 0 is fine; list them in the report.

## 3 · Real run

Only with explicit approval for this run (a dispatch saying "run the real pull" counts).

```bash
pnpm figma-sync:pull
```

It prints `Pass 1/2/3` lines, `Done — N token(s) got a new variableId`, and the id file paths. If
it throws midway, dry-run again before anything else — name matching links already-created
variables, so a rerun does not duplicate them.

## 4 · Backfill locally

```bash
NEW_IDS_FILE=<printed path> REMOVED_IDS_FILE=<printed path or empty> pnpm figma-sync:backfill:local
```

The script presets `TOKENS_DIR_OVERRIDE`, which keeps it local. **Never run
`backfill-commit.mjs` without it** — that path commits straight to `main` on GitHub. Never set
`LOCAL_GIT_COMMIT=true`. The state-file diff is noisy (every entry gets a new timestamp); say so,
so the human can keep only the added entries.

## 5 · Verify

- `git diff packages/tokens/tokens/Base.tokens.json`: only the expected ids added (a Device one
  as a `device` key)
- Dry run again: every planned-write count 0
- `pnpm tokens` builds; ids are metadata, CSS must not change

## Report

- Planned writes, real-run pass lines, new ids
- Files changed (unstaged); `pnpm test:figma-sync` result if the eligibility list changed
- **Open human step: publish DS - Foundation in Figma** (main menu → Libraries → Publish). The API
  cannot publish, and no other file sees the new variables until it is done.
