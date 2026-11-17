# Phase 5 — Repair

## Objective

Fix every check marked `fail` in `<name>.figma-validation.md` directly in Figma, then re-validate.

## Inputs

- All [Phase 4 inputs](PHASE-4-VALIDATE.md#inputs), plus `<name>.figma-validation.md`.

## References

- The Figma page **`🗂️ Template / Category`** in the library file — the only source of page and
  documentation-frame styling (see [Category pages](PHASE-3-BUILD.md#category-pages)). This skill
  holds no layout, spacing, colour or font values for it.

## Instructions

**Family:** repair every member whose `<name>.figma-validation.md` has a `fail`, then re-run Phase 4
for the whole family. The retry limit counts family iterations.

1. Load `figma-use` (mandatory before any `use_figma` call) and create a session against
   `figma.config.json`'s `componentLibraryFileKey`.
2. **Read the reported issues** from `<name>.figma-validation.md`: collect every check marked
   `fail` (with its node name/id and expected vs. found). Note any `not verified` checks so they
   are re-checked in the next validation run.
3. **Plan the smallest fix per node** — group the `fail` entries by node so multiple failures on
   one node are fixed in a single pass — taking the correct value from the Phase 3 source of truth:
   `PHASE-3-BUILD.md` → "Documentation frame header" for the header, the template for
   layout/dividers/labels, `<name>.figma.md` for props/variants, the visual test snapshot for a snapshot mismatch
   (Phase 4 step 6), and the Phase 1 variable ids and
   component keys for tokens and nested components.
4. **Apply each fix with `use_figma`** as an in-place edit of the existing node, except to clone
   missing template parts (e.g. dividers) from `🗂️ Template / Category`. Read the node back after
   each fix to confirm it applied.
5. **Re-run [`PHASE-4-VALIDATE.md`](PHASE-4-VALIDATE.md)** in full (all checks, not only the fixed
   ones).

## Rules

- MUST fix only checks marked `fail`; leave nodes that passed untouched.
- MUST reuse existing components and variables.
- MUST NOT delete and rebuild nodes or regenerate the component.
- A failed variation is usually a bug in the component set (gap, alignment, a missing token on the
  hidden layer): fix it on the **master variant**, never on the Variations instance, and never
  override an instance property to make the check pass.
- MUST NOT modify the confirmed mapping file `<name>.figma.md` to make validation pass — if a fix requires it,
  stop and request approval.

## Output

- The repaired nodes in the Figma library file.
- A `## Repair log` section appended to `<name>.figma-validation.md`, with one entry per
  iteration: the `fail` entries addressed, the node name/id, and the change made. Phase 4
  re-runs overwrite the check results but keep this log.
- On hard stop: the unresolved failures and why they could not be fixed.

## Retry Policy

- Maximum 3 repair iterations; then hard stop and report the unresolved failures.
- If the same error persists, stop and report it.

## Next Phase

→ [`PHASE-4-VALIDATE.md`](PHASE-4-VALIDATE.md)
