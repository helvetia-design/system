---
name: ds-figma-measurements
description: Measure a component on the dev server, triage which values a designer actually needs, and build the 📏 Measurements section of its Figma documentation frame — a drawn spec, a sizes table bound to tokens, and a behavior card for content-driven components.
---

# ds-figma-measurements

Document the sizes a designer must respect when building a screen.

**Mechanics live in
[`PHASE-8-DOCUMENT-MEASUREMENTS.md`](../ds-code-to-figma/PHASE-8-DOCUMENT-MEASUREMENTS.md) and
[`conventions/measurements.md`](../ds-code-to-figma/conventions/measurements.md)** — the groups
table, the visual vocabulary per kind, the section layout, and the behavior probe. Read those;
this skill is the contract.

Load `figma-use` before any `use_figma` call.

## The principle that decides everything

**Document what the code decides, not what the layout produces.** A fixed size, an inner
spacing, a limit or a behavior is worth showing. A value that _falls out_ of other values — a
height that is just padding + line-height — is noise, and it goes stale the moment one input
changes.

Developers already get every exact value from Dev Mode and the tokens. The reader here is a
**designer**, so limits and behavior matter more than exhaustive numbers.

## Phase 1: Measure

**Numbers come from the browser; groups come from the SCSS.**

Run the dev server (`pnpm start`) and measure the rendered component — computed styles and box
model — so derived and inherited values are exact. Read the SCSS only to decide _why_ a value
exists, which is what assigns its group (fixed / inner spacing / limit / behavior / derived).

Never transcribe a number from the SCSS as if it were the rendered value; a token can be
overridden up the cascade and `rem` resolves against the root.

## Phase 2: Triage

Classify every measured value into exactly one group and apply that group's default proposal.
Only the rows the convention marks "ask" go to the human — don't re-litigate the defaults.

Then **stop and get the triage confirmed** before drawing anything. Drawing is the expensive
part; agreeing the list is cheap.

Match every value kept back to the token it came from. A shown value with no token behind it is
a token-engineer handoff.

## Phase 3: Build

`Section` `Flat` with up to three stacked nested `Default` `Preview`s — drawing, sizes table,
behavior. The template placeholder already holds a worked example (`drawn-spec`, `sizes-table`,
`behavior`); **edit it in place** rather than building fresh.

- **Drawing** — a default-variant instance with markers in the kind-specific vocabulary from the
  convention. One marker per shown value.
- **Sizes table** — one row per shown value, each naming its token. The token name is the point:
  it is what a designer binds to, and what survives a value change.
- **Behavior card** — content-driven components only (what happens when content grows, wraps,
  truncates, or hits a limit).

## Phase 4: Confirm

Stop and let the human approve the Measurements section in Figma.

## Deliver

- The built Measurements section, by node name
- The shown-values table: value, group, token, and how it is drawn
- Values measured but **not** shown, with the group that excluded them — so the next run doesn't
  re-litigate the triage
- Handoffs: any shown value with no token behind it

Never commit.
