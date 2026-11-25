---
name: ds-audit-tokens
description: Audit a component family's SCSS/TSX for design-token problems — wrong layer, borrowed or missing tokens, hardcoded literals. Writes a findings report; fixes nothing. Use when reviewing a component's tokens or before a Figma sync.
---

# ds-audit-tokens

Find what is wrong with a component family's tokens. Report it. Change nothing.

Fixes belong to `ds-manage-tokens` (token definitions) and the component-engineer (structural
SCSS). This skill never edits `Base.tokens.json` or any component file.

## Prerequisites

`packages/tokens/dist/css/base.tokens.css` must exist and be current — `scan.js` checks token
existence against the compiled CSS, not the JSON source. Run `pnpm tokens` first if
`Base.tokens.json` changed since the last build.

## Phase 1: Scan

```bash
node .claude/skills/ds-audit-tokens/scan.js <family>   # e.g. tabs; a sub-component name resolves up to its family
```

Returns JSON: classified `--ds-*` usages per layer, derived `componentKeys`, `naming`
violations, `propEnums`, the `figmaChecklist` matrix, `hardcodedDeclarations`, and
`sharedOwnerInventory` for families on a shared namespace (e.g. `form`).

The script is mechanical. It answers _which tokens are used and what layer each belongs to_ —
it does not judge whether a token is the right one. That judgment is yours.

## Phase 2: Read the source

The scan cannot see everything. Read the family's `.scss` and `.tsx` yourself to catch:

- Tokens applied through a mixin (`form.mixin.scss`, `input.mixin.scss`) that never appear in
  the family's own files — `referencedInFamilySource: false` does **not** mean unused.
- States living in the value position rather than a selector (the `disabled`/`loading`
  limitation noted in [REFERENCE.md](REFERENCE.md#figma-property-checklist)).
- Visual values with no `var()` at all, which the checklist cannot probe for.

## Suppression marker

A deliberate hardcoded value is marked in source, on or directly above the declaration:

```scss
// ds-token-check: intentional — animation endpoint, not a themeable opacity
```

**Honor it — never re-flag a marked line.** The marker keeps the old skill's name on purpose:
it is spelled this way in live component source (`radio.mixin.scss`,
`datepicker.host.scss`, `segment.mixin.scss`, …) and renaming it would churn component files
for nothing. `scan.js` does not parse it; you do.

## Phase 3: Classify findings

Each finding is one of:

| Kind          | Meaning                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| **GAP**       | A value renders with no Component token behind it, or a referenced token doesn't exist |
| **VIOLATION** | A raw Global / Alias / Device token used where a Component token belongs               |
| **REVIEW**    | Borrows another component's tokens — couples two components that should move apart     |
| **NAMING**    | Breaks the anatomy convention, or a likely typo in a state word                        |

[REFERENCE.md](REFERENCE.md) carries the full rules for each, the Figma Property Checklist,
and a worked example report. Do not restate those rules here.

**Split findings by visual impact — visual (breaking) first, then non-visual.** Whoever fixes
this needs to know what changes rendering before they need to know what's untidy.

## Phase 4: Write the report

Write `<family>.token-check.md` using the structure in
[REFERENCE.md](REFERENCE.md#output). Every finding carries `file:line`, the current value, and
the Component token that should exist in its place — so `ds-manage-tokens` can act on the
report without re-deriving it.

## Done when

The report exists, every finding is backed by a line you read, and a later session could fix
all of it from the report alone without re-running the scan.
