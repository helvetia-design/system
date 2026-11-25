---
name: ds-manage-brand
description: Maintain brand token files (OrangeVacations and future brands) — brand overrides of Base, Base/brand sync, new brands. Use when brand values change or a new Base token needs a brand value.
---

# ds-manage-brand

Maintain the brand override files in `packages/tokens/tokens/` — today `Base.tokens.json` and
`OrangeVacations.tokens.json`.

**Terminology:** this repo calls these **brand modes**, not themes or variants — "variant"
means a component variant here, which is a different concept (`packages/tokens/CONTEXT.md`).
"Theme file" refers only to the compiled `<brand>.tokens.css` artifact.

## How brands work here

A brand file contains **only the tokens it overrides** — `OrangeVacations.tokens.json` is ~259
lines against Base's ~30k. Everything it does not state, it inherits.

A brand override is **a different mode-value on the same variable**, not a separate variable
(ADR-0012). A brand must therefore never introduce a token that Base does not define.

Each brand compiles to two **fully self-sufficient** CSS files carrying the identical complete
token set, never a diff (ADR-0030):

- `<brand>.tokens.css` — scoped `:host, :root`, for an app committed to one brand
- `<brand>.override.css` — scoped `[data-theme="<brand>"]`, for scoping a brand to a subtree
  (Storybook's per-story switcher wraps stories in `<div data-theme="orange-vacations">`)

## Changing a brand's values

1. Confirm the token exists in Base. **If it doesn't, it belongs in Base first** — via
   `ds-manage-tokens`. A brand-only token is a structural error, not a shortcut.
2. Override it in the brand file, matching Base's value shape exactly (colors need
   `colorSpace`/`components`/`alpha`/`hex`).
3. Do **not** set `$description` in a brand file — descriptions are shared across brands and
   live in Base only.
4. Override at the layer Base defines it at. A brand usually overrides Global color scales and
   lets everything downstream re-resolve — overriding a Component token directly is a smell
   worth questioning, because it means the Alias chain isn't carrying the brand.

## Keeping brands in sync with Base

Every new Base token is inherited by every brand automatically — that is the intent, and
usually correct. Check explicitly when the new token is a **brand-sensitive value**: a color,
a logo, a typeface. Inheriting Helvetia's blue into another brand silently is the failure mode
here.

When a Base token is **renamed or removed**, every brand file keyed to the old name must be
updated in the same change. An orphaned override does not error — it silently stops applying,
which is the worst kind of token bug.

## Adding a new brand

1. Create `<BrandName>.tokens.json` with only its overrides.
2. Register it in the build (`src/config.brand.ts`).
3. Add its four export paths to `packages/tokens/package.json` `exports`
   (`./css/<brand>`, `./css/<brand>-override`).
4. Add the brand mode on the Figma side — brands are modes on existing variables, not new
   collections.
5. Build and confirm all four CSS outputs exist and carry the full token set.

## Validate

Follow `ds-validate-tokens` — specifically its Phase 3 check that brand outputs carry the
identical full token set to Base. A brand file that fails to merge still leaves a
valid-looking Base build, so this is the step that catches it.

Check the brand visually through Storybook's theme switcher, not only in the CSS.

## Report

- Brand files changed, and which tokens
- Any Base token added as a prerequisite
- Orphaned overrides found and fixed
- Build output, and confirmation all four CSS files carry the token set
- Visual impact per brand, with the Storybook evidence

Brand value changes are visual: a standalone change gets a changeset (`ds-changeset`). Inside a
workflow run write none; the run's ship step covers it.
