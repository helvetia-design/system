# Plan: replace the Streamline icons with our own

Owner: ✏️ icon-manager. Workflow: `docs/agents/workflows/h-new-icon.md`. Decisions:
`docs/plans/components/icon-manager-brief.md` → `## Gate decisions` (the brief is gitignored;
this plan is the tracked record).

## Context

`packages/assets/src/icons/svg/*.svg` holds 79 icons. 69 are Streamline Core Solid Pro (credited
in `apps/storybook/src/foundation/Iconography.mdx`), 10 are social logos. We replace the
Streamline icons with icons drawn by `ds-draw-icons` for license ownership and because
Streamline lacks icons we need. Every icon stays a single fill-only `<path>` in a 16 viewBox, so
`scripts/build-svg.mjs` and `ds-icon` do not change.

## Phases

- [ ] **0 · Bootstrap** — Core Solid measured from renders, 2–3 candidate DNAs, six calibration
      icons drawn in each, ⛔ DNA gate, `packages/assets/icons.yaml` written.
- [ ] **1 · Missing icons** — Workflow H, ≤ 6 icons per run, from `icon` issues.
- [ ] **2 · Redraw** — one family below per PR, strict 1:1 names, minor changeset each.
- [ ] **Last PR** — Streamline credit removed from `Iconography.mdx`.

## Social logos — sourced, not drawn

`facebook`, `github`, `instagram`, `linkedin`, `pinterest`, `tiktok`, `whats-app`, `x`, `xing`,
`youtube`.

- [ ] Replaced from Simple Icons (CC0) or the official brand kit, normalized to the same
      16-viewBox fill-only single path, source and license recorded per logo.

No drawing, no overlap check — a logo must match its brand, not our DNA. Can ship in any phase-2
PR or its own.

## Redraw families

Each family is one PR (~6–12 icons). The calibration family ships first, from the phase 0 picks.

- [ ] **Calibration** (6) — `home`, `search`, `settings`, `user`, `document`, `bell`
- [ ] **Navigation** (10) — `caret-up`, `caret-right`, `caret-down`, `caret-left`, `back`,
      `arrow-right-circle`, `arrows-round-left`, `refresh`, `menu-bars`, `menu-dots`
- [ ] **Marks** (8) — `plus`, `minus`, `close`, `close-circle`, `check`, `check-circle`,
      `circle`, `triangle`
- [ ] **Actions** (12) — `edit`, `trash`, `copy`, `filter`, `upload`, `download`, `print`,
      `send`, `share`, `share-link`, `link`, `web`
- [ ] **Status** (8) — `alert`, `alert-triangle`, `information`, `info-circle`, `star-full`,
      `star-half`, `eye`, `eye-closed`
- [ ] **People and contact** (9) — `user-check`, `user-add`, `consultant`,
      `help-customer-support`, `call`, `message`, `answer`, `mobile`, `logout`
- [ ] **Files and media** (9) — `file`, `pdf`, `picture`, `video`, `audio`, `design`, `code`,
      `table-cell-merge`, `tag`
- [ ] **Places and time** (7) — `map`, `location`, `location-target`, `locate`, `date`,
      `clock`, `dashboard`

69 Streamline icons in 8 families, plus the 10 logos = 79.

## Duplicates — Workflow E issues, not redraw work

Each pair is redrawn 1:1 in its family; deprecating one name is a separate Workflow E issue
filed by 📣 issue-manager.

- [ ] `information` / `info-circle`
- [ ] `alert` / `alert-triangle`
- [ ] `locate` / `location-target` — candidate, confirm from the renders before filing
