# Phase 6 — Document: Copy me

## Objective

Fill in the first section of the `Documentation` column: "👉 Copy me". "Copy me" is always
the first child of the `Documentation` column, never skipped (unlike Anatomy, which is
conditional on the component having `@part` tags).

Build this right after [`PHASE-4-VALIDATE.md`](PHASE-4-VALIDATE.md) returns `pass`, before
[`PHASE-7-DOCUMENT-ANATOMY.md`](PHASE-7-DOCUMENT-ANATOMY.md).

## Inputs

- The category page, documentation frame, filled header and 2-column body skeleton cloned from the
  template in [`PHASE-3-BUILD.md`](PHASE-3-BUILD.md).
- The default variant of the finished component set (Phase 3).

## References

- `conventions/document-sections.md` — read
  this first if you haven't built against it yet this run.
- `PHASE-3-BUILD.md`'s cloned frame (`body` › `Documentation` / `Component Sets` columns).
- `conventions/build-mechanics.md` — build gotchas that apply
  here too (fill-clearing on structural wrapper frames, awaited promises on instance text
  overrides).

## Instructions

**Fill the `Section` placeholder whose `Title` is `kind=copy-me` (`Default` variant) in the cloned frame's `body` ›
`Documentation` column** — don't create a new `Section`. It is the first one in the column; hard stop if no `kind=copy-me` placeholder exists
(see `conventions/document-sections.md`). The Variations section right below it is already filled
(Phase 3): don't move it. Insert one **instance** of the default variant **directly into the `Preview`'s slot** — no further nesting — the single
"drag this into your design" example. Use a Figma `INSTANCE` (`variant.createInstance()`) of the
finished component-set variant — never the variant node itself. Override nothing: every property,
`show <name>` booleans and text properties included (they show their sentence-case defaults), keeps the set's default, so Copy me shows exactly what the
component renders with no props set — the same variant as the set's top-left cell.
**Exception — width:** when the mapping file's `measurements.behavior.width` is `fill`, set the
instance's `layoutSizingHorizontal = 'FILL'` so it spans the `Preview` like in code (user decision
19.11.2026, `ds-accordion`). This is a layout setting, not a property override.

Then delete the template's example instance (`Component`) from the slot, so the new instance is
its only visible content.

For a family, this is the **owner's** default variant only (its slots keep their default fill);
sub-components get no Copy me (`conventions/families.md` §2).

Iterate on it with the user in Figma before moving on, same discipline as every other section.

## Output

- The cloned frame's first `Section` placeholder in the `Documentation` column, filled as
  "👉 Copy me" with one instance of the default variant.

## Completion Criteria

- The filled `Section` uses `kind=copy-me` and `Default` variant, with the default-variant
  instance inserted directly into the `Preview`'s slot, with no property overridden.
- The section has been iterated on and confirmed with the user in Figma.

## Next Phase

Proceed to [`PHASE-7-DOCUMENT-ANATOMY.md`](PHASE-7-DOCUMENT-ANATOMY.md) once "Copy me" is built
and confirmed.
