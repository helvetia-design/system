---
name: ds-manage-tokens
description: Create, modify or deprecate design tokens in Base.tokens.json — choosing the right layer, naming to the anatomy convention, wiring references, and handling the breaking-change path for renames and removals. Use when a component needs a token that doesn't exist, when fixing an audit finding, or when retiring a token.
---

# ds-manage-tokens

Author tokens in `packages/tokens/tokens/Base.tokens.json` — the single source of truth.

**This is the only skill that writes token definitions.** Components reference tokens; they
never create them. `packages/tokens/dist/` is generated — never edit it.

## Input

Either a missing-token request from the component-engineer (unresolved `var(--ds-*)` with its
value and usage), or a `<family>.token-check.md` report from `ds-audit-tokens`.

## Phase 1: Check it doesn't already exist

Before defining anything, search `Base.tokens.json` and the compiled
`dist/css/base.tokens.css` for a token that already covers the need.

A duplicate is as bad as a borrow. If an existing token fits, the fix is to point the
component at it — no new token.

## Phase 2: Choose the layer

`Global → Alias → Device → Component`. Each layer references only layers to its **left**;
never to its right, never backwards (see `packages/tokens/CONTEXT.md`).

| Layer          | Use when                                                       |
| -------------- | -------------------------------------------------------------- |
| `🌐 Global`    | A raw value from Figma. Rarely authored by hand.               |
| `🔗 Alias`     | A meaningful, non-responsive abstraction.                      |
| `📱 Device`    | **Any value that must change by breakpoint.**                  |
| `🧩 Component` | A per-component override — what a component's code references. |

**The Device rule is absolute:** a token carrying
`$extensions.com.helvetia.responsive` belongs in Device, never Alias. The test is the
extension, not the list of what's there today.

A component-facing token goes in Component and resolves to Alias or Device — not to a raw
Global value unless nothing else fits.

## Phase 3: Name it

Canonical anatomy (`packages/tokens/CONTEXT.md` → "Token Naming Anatomy"):

```
component - variant - element - category - property - state
```

- PascalCase segments in JSON; the CSS variable is the kebab-case projection.
- State words come from a closed set: `Base`, `Hover`, `Active`, `Disabled`, `Focus`,
  `Selected`. Anything else in a state group is a typo.
- No abbreviations — `Background`, not `Bg`.
- Typography goes in a composite `Typo` token, not standalone leaves.

`naming-rules.js` in `ds-audit-tokens` enforces exactly these. Run the audit after authoring
rather than checking by eye.

**You own the name.** When the engineer proposed one, correct it to the convention and tell
them what you changed so their SCSS reference can follow.

## Phase 4: Define

Add the token with its `$type` and `$value`. Match the shape of its siblings exactly —
colors carry `colorSpace`/`components`/`alpha`/`hex`, not a bare hex string.

- `$description` is optional, free text, and **shared across brands** — a brand override file
  never sets its own.
- Leave `$extensions.com.figma.variableId` absent on a new token; it is populated by the first
  Figma sync. JSON is the source of truth; Figma is a projection of it.

## Phase 5: Modify or deprecate

**Changing a value** is a visual change. Say so, and run the affected visual suites.

**Renaming or removing a token is a breaking change** for any consumer overriding it — treat
it exactly like a public API change:

1. Add the replacement first.
2. Point every internal reference at it (`grep` the whole repo, including mixins and brand
   files — a brand override keyed to the old name silently stops applying).
3. Mark the old one deprecated in its `$description` and leave it resolving to the new one.
4. Remove it only in a later, explicitly breaking release.

Never delete a token in the same change that introduces its replacement.

## Phase 6: Build and verify

Follow `ds-validate-tokens`. A definition that isn't in the generated CSS doesn't exist yet.

## Deliver

Report tokens added, renamed or deprecated; which are visual changes; any name you corrected
from a request; and the changeset (`ds-changeset`) — patch for a non-visual fix, minor for new
tokens, major for a removal.

Leave every change unstaged.
