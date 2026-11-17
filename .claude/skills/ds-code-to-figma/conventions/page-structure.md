# Conventions — category pages & documentation-frame structure (Phase 3)

Relevant to Phase 3's category-page setup and documentation frame. See
`../CONVENTIONS.md` for the index, cross-phase rules, and the seeded category copy table.

- **Components are grouped onto one shared Figma page per code category, not one page per
  component** — `Core / <Category>`, Title Case, plural, matching the code folder name exactly. See
  `../CONVENTIONS.md`'s cross-phase rules for the full seven-category copy table.
- **Grouping multiple components onto one shared category page is built from nested
  `HORIZONTAL`/`VERTICAL` auto-layout, never manual x/y position math** — "append a new component"
  is then just one `row.appendChild(outerFrame)` call. The row's children are positioned entirely
  by the auto-layout engine. New components always append at the end of the row — never inserted
  alphabetically, never repositioning an existing sibling's frame.
- **A `COMPONENT_SET` can be freely `clone()`d into a different page without disturbing the
  original** — useful any time a master needs to be referenced or displayed from more than one
  page.
- **One documentation frame per documentation owner (Storybook page), never per sub-component.**
  Every sub-component set is an extra stack in the owner's `Component Sets` column, in build order;
  The `Documentation` column has four sections — Copy me, Anatomy, Measurements, Variations. Copy
  me, Anatomy and Measurements are built once, for the owner; Variations covers every set of the
  family (`families.md`,
  [ADR-0036](../../../../docs/adr/0036-figma-doc-unit-follows-storybook-page.md)).
- **One documentation frame per owner, always — a hard invariant, with no exception for an
  inverted axis.** An inverted axis only affects the `Component Sets` column: both the default and the `…Inverted` component sets are shown stacked vertically inside
  the _same_ single frame's `Component Sets` column, each under its own plain text sub-label, with
  only the `inverted` display clone's `fills` swapped to the dark `Alias/Surface/Primary`
  background. Every other section (Copy me, Anatomy, Measurements) is built once, from the default
  set's instances only. See `PHASE-3-BUILD.md`'s "Labeled component set" section for the full
  mechanism.
- **Never lock any Figma node this skill builds** — no component set, no display clone,
  no documentation-frame content, nothing. The current template has no table geometry for a human
  to accidentally misalign, so locking only gets in the way of inspecting/selecting/rearranging
  content directly in the Figma UI.
