# 36. Figma documentation unit follows the Storybook page

Package: `.claude/skills/ds-code-to-figma`, `packages/core`

Date: 2026-11-09

## Status

Accepted

## Context

Several component folders hold more than one `@Component` (`ds-tabs` + `ds-tab` + `ds-tab-panel`,
`ds-card` + five `ds-card-*`, `ds-button` + `ds-button-group`, …). The `ds-code-to-figma` skill
built only the named component, so the `ds-card` run shipped a Card with no title, header, content
or actions components — incomplete for designers.

The skill needed a mechanical rule for which components belong together. Folder location alone
fails: `ds-button` and `ds-button-group` share a folder, yet `ds-button` is used standalone, and
`overlays/alert/` holds `snackbar` and `toast` with no single parent. Containment ("the child sits
inside the parent") fails too: `ds-button-group` wraps `ds-button`, not the other way round.

## Decision

The documentation unit is the Storybook page. A family member with its own `doc-config.ts` is a
**documentation owner**; a family member without one is a **sub-component** of the owner in the
same folder, whichever way containment goes (see `packages/core/CONTEXT.md` → "Component
Relationships — Language").

In Figma this means:

- One documentation frame per owner — never per sub-component. Each sub-component gets its own
  published component set, stacked in the owner's frame before the owner's set; Copy me, Anatomy
  and Specs are built once, for the owner.
- The skill always runs on the owner and builds the whole family in one run; naming a
  sub-component redirects to its owner.
- A family with an orphan member and zero or several owners (`alert-container`) is a hard stop.

## Considered options

- **Folder = family, containing component = parent.** Rejected: misclassifies `ds-button` as part
  of `ds-button-group`, and has no answer for `alert`.
- **One documentation frame per sub-component.** Rejected: triples the Copy me / Anatomy / Specs
  work and offers "Copy me" for parts designers never place on their own; Storybook doesn't
  document them separately either.

## Consequences

- `ButtonGroup` is documented in the `Button` frame — surprising at first sight, but it matches
  Storybook.
- Adding or removing a `doc-config.ts` changes how the Figma library is structured; doing that means
  re-running the skill on the affected family.
- Existing outputs (`card`, `button`) are regenerated, not migrated (the skill is still a POC).
