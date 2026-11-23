# Decision path — every stop-and-wait point in this skill

A single index of every place this skill must pause for a human decision, across all eight phases.
Check this file when you're unsure whether you're at a checkpoint — it exists so that doesn't
require re-reading full phase prose to confirm.

Two kinds of pause, treated differently:

- 🟡 **Checkpoint** — present something and wait for explicit approval/choice before continuing.
  Never assume approval and keep going.
- 🛑 **Hard stop** — something is missing or ambiguous that this skill must never guess, invent,
  or silently work around. Report it and ask; don't continue until resolved.

## Families

A family (owner + sub-components, `conventions/families.md`) adds **no extra checkpoints**
beyond one first-variant checkpoint per set in Phase 3: anatomy review, measurements triage, token-gap
batch and grouping sign-off happen once for the whole family; Phases 6–8 run for the owner only.

## Phase 1 — Analyze

- 🛑 **Family member without a documentation owner** (step 0): a family folder with no
  `doc-config.ts` owner, or several owners plus a member with none (`alert-container`) — ask which
  owner documents it. Naming a sub-component is **not** a stop: redirect to the owner in one line.
- 🟡 **Anatomy review** (step 2): print the extracted `@part` list (letter, part name,
  description) in the conversation before writing anything to `<name>.figma.md`. For a family:
  print the family first, then one merged list.
- 🛑 **`@part` tag ↔ `part="..."` attribute mismatch** (step 2): a JSDoc tag with no matching
  render attribute, or vice versa — ask the user to fix the component or explicitly accept the
  mismatch.
- 🛑 **Missing nested-component mapping** (step 4): a nested component from another family (e.g.
  `<ds-icon>`) whose own `<child>.figma.md` doesn't exist or has no recorded component key — stop
  per `SKILL.md`'s Prerequisites; don't recreate it or fall back to a plain shape. Never applies to
  a sub-component: this run builds it.
- 🛑 **Unresolvable CSS-var token** (step 5): any value bound to `var(--ds-...)` with no matching
  Figma variable — ask the user to pick an existing token or explicitly accept a one-off
  hardcode. Never guess, never invent a new token.
- 🛑 **Token not in Foundation** (step 5): the repo has the token, but the Foundation library has no
  variable with that name — not synced yet. List the names and ask the user to run the token sync.
- 🛑 **Missing Device routing variable** (step 5a): a responsive binding whose `<path>/Device`
  variable doesn't exist in Foundation's `Design Responsive Tokens` — **stop and list** (name and
  the Mobile / Tablet / Desktop variables it should point to) for the token pipeline. Never
  create it in Foundation or in the component file.
- 🛑 **Unresolvable attribute with no CSS-var binding at all** (step 5): a hardcoded literal or an
  inherited attribute the component's own code never sets — same hard stop as above, no exemption
  for "the code doesn't mention it."
- 🛑 **Non-mobile/tablet/desktop breakpoint mixin** (step 5a): any mixin other than
  `mobile`/`tablet`/`desktop` driving a real token difference — ask the user to collapse it into
  one of the three real Figma modes, accept a static value, or extend the collection; never guess.
- 🛑 **Completeness-checklist gap** (step 5b): any node/attribute combination in the explicit
  completeness checklist with no resolved token — surface every gap as a batch before Phase 2, not
  discovered piecemeal mid-build.
- 🟡 **Measurements triage** (step 6c): present every measured size with its group, token and proposal
  (`drawn` / `table` / `behavior` / `skip`) and wait for confirmation. Rows marked "ask" in
  `conventions/measurements.md`, measured ≠ token mismatches, unmeasured options and outer margins are
  listed separately, each with a recommendation. So is a `drawnColor` other than the default color
  option: say which marker the default would hide and wait for the user to confirm the switch.
  Same for a `drawnState` other than the default state.

## Phase 2 — Propose grouping

- 🛑 **Ambiguous prop-to-variant mapping** (step 1): anything that doesn't cleanly fit the
  enum/boolean/text/state rules — flagged explicitly, never guessed. This includes a text whose
  source is unclear: consumer-authored (text property) or generated (none).
- 🟡 **Variant-grid-layout confirmation** (step 2): state which case applies (2-axis / nested-matrix
  / top-level-split) before asking for approval, so the user confirms an actual layout, not just a
  property list.
- 🛑 **500-variant threshold exceeded** (step 3): stop before presenting the grouping for approval;
  present the count, the dominant-axis breakdown, and the recommended mitigation(s); loop until
  the count is ≤500 after the user picks.
- 🟡 **Grouping sign-off** (step 5): stop and wait for the user to confirm or edit the mapping
  directly in `<name>.figma.md` before Phase 3 starts. Never proceed on assumed approval. For a
  family: one sign-off covering every member, the `drivenBy` props and the slot default fills. It
  also covers the variation list and the cases to add to `test/<name>.visual.html`.
- 🟡 **New Phase 2 heuristic** (step 6): show the user the exact diff and get approval
  before writing it — never auto-append.

## Phase 3 — Build

- 🟡 **Documentation-frame approval** (step 6): give the user a Figma link to the frame (filled
  header and finished labeled set(s)) and wait for approval in Figma before Phase 4; changes loop back to step 5.
- 🛑 **Template page or layer missing**: `🗂️ Template / Category` not found, or a layer in
  `PHASE-3-BUILD.md`'s layer-name contract is missing — stop and report which; never hand-build
  the shell as a fallback.
- 🛑 **Variations placeholder missing**: no `kind=variations` `Section` in the cloned frame — stop
  and report; never build the section chrome.
- 🛑 **Variation snapshots missing** (before Phase 4): a variation's
  `*-Desktop-Chrome-linux.png` doesn't exist yet — name the missing cases and wait until the user
  has run `/update-screenshots`.
- 🛑 **Category copy missing**: category not in `CONVENTIONS.md`'s table — stop and ask for
  title/lead text.
- 🛑 **Storybook story ID unresolvable**: no `doc-config.ts` for the component — stop and ask
  rather than shipping a dead link.
- 🟡 **First-variant checkpoint** (step 4): give the user a Figma link to the `review` frame
  holding only the default variant (template example stacks hidden) and wait for their confirmation in Figma before fanning out the rest of the component set — catches a structural
  mistake once, before it's replicated across every variant. For a family: once per set, in build
  order (contained sub-components → owner → wrapping sub-components).

## Phase 4 — Validate

- 🛑 **`blocked` verdict**: no check failed but at least one is `not verified` — list those checks
  and why, and ask the user how to proceed. Never treat it as `pass`.

## Phase 5 — Repair

- 🛑 **Retry limit reached**: 3 repair iterations, or the same check on the same node fails again —
  stop and report the unresolved failures.
- 🛑 **Fix would change the confirmed mapping file**: a fix requires editing `<name>.figma.md` — stop and
  request approval; never edit the mapping file to make validation pass.

## Phase 6 — Document: Copy me

- 🟡 **Iteration before moving on**: confirm "Copy me" with the user before starting Phase 7.

## Phase 7 — Document: Anatomy

- No checkpoints beyond the standing iteration discipline. **No-parts condition**: the component's
  `<name>.figma.md` has no `anatomy:` list (no `@part` tags) — delete the cloned frame's Anatomy
  `Section` placeholder (no Anatomy frame) and go straight to Phase 8.

## Phase 8 — Document: Measurements

- 🛑 **Annotation component missing** (step 0): a `Spec/*` component or variant from the table in
  `PHASE-8-DOCUMENT-MEASUREMENTS.md` isn't on `🧰 Annotations` — list what's missing and ask the user to
  add it; never draw a one-off marker by hand.
- 🛑 **Template layer missing** (step 1): the `kind=measurements` placeholder or a layer from its
  layer-name table (`drawn-spec`, `sizes-table`, `behavior` and their children) is missing — list
  what's missing and ask the user to fix the template; never build the card.
- 🛑 **Old `measurements:` format**: the mapping file still has the flat per-option list — re-run Phase 1
  step 6 (measurements triage) first.
- 🟡 **Iteration before moving on**: confirm Measurements with the user before finishing the skill.

## Cross-cutting

- 🛑 **Foundation not usable**: the read of the Foundation file fails, or importing a variable by
  key into the component file fails (library not published or not added to the file) — stop and
  ask the user to publish Foundation and add it to the component file. An empty library listing
  from the component file alone is not a stop (known Figma quirk, `conventions/tokens-and-props.md`).

- 🟡 **`figma.config.json` placeholder file key**: if `componentLibraryFileKey` is still
  `REPLACE_WITH_FIGMA_FILE_KEY`, stop before doing anything else and ask for the real key
  (`SKILL.md`'s Prerequisites).
