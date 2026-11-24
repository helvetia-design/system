# Phase 7 — Document: Anatomy

## Objective

Fill in the Anatomy section of the `Documentation` column, after Variations: "📐 Anatomy". When the
component's `<name>.figma.md` has no `anatomy:` list (no `@part` tags found in Phase 1), **delete
the cloned frame's Anatomy `Section` placeholder** (the one with `Title` `kind=anatomy` in
`body` › `Documentation`) so no empty Anatomy frame is left behind, then go straight to
[`PHASE-8-DOCUMENT-MEASUREMENTS.md`](PHASE-8-DOCUMENT-MEASUREMENTS.md).

For a family, Anatomy is built once, on the owner, from the owner's merged `anatomy:` list (owner
`@part`s + one entry per contained sub-component + sub-letters, `conventions/families.md` §5). A
sub-component entry's marker points at the first sub-component instance in the diagram; a
sub-letter (`B1`) points at that part inside the same instance. The owner's list is absent only
when it has no `@part`s and no contained sub-components.

Build this right after "Copy me" is confirmed, before
[`PHASE-8-DOCUMENT-MEASUREMENTS.md`](PHASE-8-DOCUMENT-MEASUREMENTS.md) — unless there are no parts, in which case this phase only deletes the placeholder.

## Inputs

- "👉 Copy me", built and confirmed as the first child of the `Documentation` column in
  [`PHASE-6-DOCUMENT-COPY-ME.md`](PHASE-6-DOCUMENT-COPY-ME.md).
- `<name>.figma.md`'s `anatomy:` list (letter, part name, description) from Phase 1 — absence of
  this list is the no-parts condition above.
- The default variant of the finished component set (Phase 3).

## References

- `conventions/document-sections.md` — especially "Sizing".
- `PHASE-3-BUILD.md`'s cloned frame (`body` › `Documentation` / `Component Sets` columns).
- `conventions/build-mechanics.md`.

## Instructions

**Edit the template's worked example in place — clone, never build.** The cloned frame's
`Section` whose `Title` is `kind=anatomy` already holds it: `Section` (`Flat`) › one nested
`Preview` (`Default`) › slot › `diagram-area` (component instance + one `marker-<letter>`
`Anatomy/Marker` instance per part) and `legend` (one `Anatomy/Legend item` instance per part). Sizing, layer
names, fonts and colors come from that clone; this skill writes no fill, stroke, font or spacing
value here. **Hard stop** if the `kind=anatomy` placeholder, `diagram-area`, `marker-A`, `legend`,
or the `Anatomy/Marker` or `Anatomy/Legend item` component is missing.

1. **Component — whatever shows the parts best.** Every part in `anatomy:` must be visible on an
   instance. Start from the default variant (`swapComponent` on the template instance); turn on
   `show <name>` booleans, pick another variant or state, or set props as needed so the parts show.
   When no single instance can show every part (mutually exclusive parts, e.g. `ds-button`'s
   `loading` spinner hides both icons), use more than one instance — as few as possible, side by
   side with 48px between them, together centred horizontally in `diagram-area`, all on the
   cloned `y`. Name each instance after what it shows (`Button`, `Button (loading)`) and say which
   instance carries which markers when you ask for confirmation.
2. **Markers — one `Anatomy/Marker` instance per `anatomy:` entry.** The component lives on
   `🧰 Utilities` (find it by name; `6299:425` is a hint only): a dot with the letter and a
   leader that stretches with the instance height. Clone `marker-A` for each part and delete the
   unused ones. Never detach or restyle an instance, and never draw a marker by hand. **Letters follow the drawing, not the code** (user decision 19.11.2026): once every dot
   is placed, letter the markers A, B, C, … from left to right by dot position, so the diagram
   reads in alphabetical order. Rename each instance `marker-<letter>`, keep them in letter
   order, set each `Letter` text property with `setProperties` (look the key up by prefix), and write the final letters back to `<name>.figma.md`'s
   `anatomy:` (in letter order). A sub-letter (`B1`) keeps its parent's letter.
   - Dots at `y = 16`; the component keeps its cloned `y`.
   - Each dot is centred horizontally on the part it labels (instance `x` = part centre − 12). A part that encloses others (e.g. the container) gets its
     marker on the straight part of its top edge (between the corner radii), as far from the other
     markers as possible.
   - Each leader runs from the bottom of its dot to **4px above the part's visible top**: set the
     instance height (`resize(24, h)`) so its bottom lands there
     (`absoluteRenderBounds` — for text that's the glyphs, not the text box). Same 4px for every
     part. A part with no fill or stroke of its own (e.g. a bare wrapper frame) has no visible
     edge — its `absoluteRenderBounds` is just the frame box. Measure the topmost visible
     descendant instead (e.g. the glyph vector inside the wrapper). A part built as two text
     nodes (`PHASE-3-BUILD.md` → "Text properties") is marked on the node visible in the shown
     instance.
   - `diagram-area` height = component bottom, nothing added (see "Sizing" — its width stays
     `FILL`). The slot's own gap separates it from the legend, and the template's `legend` frame
     carries the bottom padding, so the section reads about 30 / 24 / 30 (top / gap / bottom).
3. **Legend — one `Anatomy/Legend item` instance per part.** The component lives on
   `🧰 Utilities` (find it by name; `3008:1677` is a hint only) and renders
   `"<letter> · <part> — <description>"`, letter and part Bold, the rest Regular. For a
   sub-component entry, `Part` is its set name and tag (`Tab (ds-tab)`). Clone the first instance in `legend` for each part and
   delete the unused ones. Set only its three text properties with `setProperties` — `Letter`,
   `Part`, `Description` (look the keys up by prefix; they carry a `#<id>` suffix). Never detach
   or restyle an instance. Name each instance `<letter> · <part>`.

The `kind=anatomy` placeholder already sits between Variations (filled in Phase 3; Copy me when
Phase 3 deleted it) and Measurements in the cloned frame, so nothing is appended or moved. Iterate on it with the user in Figma before moving on.

## Output

- The cloned frame's `kind=anatomy` `Section` placeholder filled as "📐 Anatomy" — or, when the component
  has no `anatomy:` list, that placeholder deleted (no Anatomy frame at all).

## Completion Criteria

- `diagram-area` holds the fewest instances of the real component that show every part, and exactly one `marker-<letter>` `Anatomy/Marker` instance per
  `anatomy:` entry, in letter order, positioned per the rules above.
- Letters run A, B, C, … from left to right by dot position, and `anatomy:` in `<name>.figma.md`
  uses the same letters.
- `legend` holds exactly one `Anatomy/Legend item` instance per part, in letter order, with only
  its text properties set.
- The section has been iterated on and confirmed with the user in Figma (unless the placeholder was deleted).

## Next Phase

Proceed to [`PHASE-8-DOCUMENT-MEASUREMENTS.md`](PHASE-8-DOCUMENT-MEASUREMENTS.md) once Anatomy is built and
confirmed (or immediately, once the placeholder is deleted).
