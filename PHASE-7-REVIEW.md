# Phase 7 — Review against the live dev server

## Objective

Review the finished component against the live dev server. This is the last phase in this skill's
v1 (create-only) scope — there is no update/reconcile phase after this; findings surfaced here go
back to the user as a report, not an auto-fix loop.

This phase does **not** compare screenshots. Figma and browser rendering differ enough
(anti-aliasing, font rasterization, PNG compression) to produce constant false mismatches on a
pixel/visual comparison — and a small/compressed baseline image can make real content look like it
has variation it doesn't actually have, or hide variation it does have. Instead, Phase 7 compares
**resolved values**: the Figma variable each property is bound to, against the live component's
computed CSS value for that same token, read directly from the running dev server.

## Inputs

- The documentation frame (header, Copy me, Anatomy, Specs, Component Set), built across
  [`PHASE-3-BUILD.md`](PHASE-3-BUILD.md) and Phases 4–6 and confirmed with the user.
- The component's `*.visual.html` under
  `packages/core/src/components/<category>/<name>/test/*.visual.html`.

## References

- `conventions/tokens-and-props.md` — the `ds-spinner` glyph-sizing example.
- `PHASE-2-PROPOSE.md` — step 1 table: mapping rules between component props and Figma variant properties.

## Instructions

### 0. Start the dev server

Start it from repo root if it isn't already running:

```bash
pnpm start
```

Wait for it to be ready, then use Playwright (`browser_navigate`, `browser_evaluate`) against the
component's `*.visual.html` under
`packages/core/src/components/<category>/<name>/test/*.visual.html`. Stop the dev server again
when the phase finishes, if this phase started it.

### 1. For each built variant/state, diff token values

For every Figma variant/state combination built in Phase 3:

1. Call `get_variable_defs` on the Figma node for that combination to get its bound
   variables — the properties Figma actually binds (size, spacing, font, color, whatever
   applies). Don't invent an expected value for a property Figma left unbound.
2. Find the matching element in `*.visual.html` using the component's props (they map 1:1 to the
   Figma variant properties per `PHASE-2-PROPOSE.md`'s mapping table), e.g.
   `ds-badge[color="danger"][size="lg"]`.
   - **If no matching element exists in `*.visual.html`** (the static markup doesn't render every
     combination — e.g. `badge.visual.html`'s "Sizes" section only shows 3 sizes at default
     color), skip that combination and list it as an uncovered gap in the report. Do not add
     markup to `*.visual.html` to force coverage — that file belongs to Phase 3/test authoring,
     not this review step.
   - **Pseudo-states reached only through interaction** (hover/focus/pressed, triggered in the
     component's `*.visual.play.ts` rather than present in static markup) are out of scope for
     this phase. Only check what's statically rendered in `*.visual.html`.
3. For each bound property, read the live value with `browser_evaluate`
   (`getComputedStyle(el)` for size/space/font/color properties) and compare it to the resolved
   value `get_variable_defs` returned for the same token. Check both:
   - **the same token is bound** on both sides (a wrong-binding bug), and
   - **the token's resolved value matches** on both sides (Figma/code token drift — the token
     definition itself has gone out of sync between Figma variables and `Base.tokens.json`, even
     though the binding is correct).
   - Exact match — no tolerance. A mismatch of any size is a finding.

### 2. Verify animated/composite glyph sizing separately

**For any animated (Lottie/CSS keyframe) or composite reused-vector mark, verify its real
on-screen size — this is not a token comparison and step 1 won't catch it.** A size token binds
the host container, not necessarily the visible artwork inside it — don't assume they're the
same. With the dev server already up, use Playwright (`browser_navigate` to the component's
`*.visual.html`, `browser_evaluate` with `getBoundingClientRect()` on the actual visible
path/shape elements, not the SVG element's own box) to measure the real glyph-to-container ratio,
and compare it against what was built. See `conventions/tokens-and-props.md` for the
`ds-spinner` example (measured 86.3%, not the 100% initially assumed).

### 3. A prop's JSDoc comment can itself be wrong

**Don't just transcribe a claimed behavior from Phase 1 into the final record without checking it
against the real computed/rendered output.** `ds-icon`'s `turn` was documented as "rotated 180deg"
but the real CSS only rotates 3 specific icon names, one of them by 225deg, not 180 — caught by
comparing the real `turn` visual-regression baseline, confirmed via `getComputedStyle` matrix
inspection. When Phase 7 reveals the _component's own code doc_ was wrong (not just the Figma
mapping or `<name>.figma.md`'s draft notes), fix the code doc too, in the same pass — code is the
source of truth for documentation copy (`PHASE-3-BUILD.md`'s header lead-paragraph
rule), so a known-wrong comment shouldn't survive a run that just disproved it.

## Output

A structured diff table per component, **mismatches only** (don't list passing checks):

| Property         | Variant / state  | Figma (expected)               | Live (actual)            | Issue                                                                                        |
| ---------------- | ---------------- | ------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| `padding-inline` | `size="lg"`      | `8px` (`space/200`)            | `6px` (`--ds-space-150`) | wrong token bound                                                                            |
| `color`          | `color="danger"` | `#D32F2F` (`color/danger/500`) | `#C62828`                | same token (`color/danger/500`) resolves differently in Figma vs. `Base.tokens.json` — drift |

List uncovered gaps (missing variant combinations, skipped pseudo-states) separately from
mismatches.

## Completion Criteria

- Every Figma variant/state combination built in Phase 3 has been checked against a matching
  element in `*.visual.html`, or explicitly listed as an uncovered gap.
- Every mismatch found is reported with the exact property, variant/state, expected vs. actual
  value, and the specific issue (wrong binding vs. token drift) — never auto-fixed.
- Any component-code JSDoc comment disproven during this review was corrected in the same pass.
- Findings are advisory only — never auto-pass or auto-fail. Let the user decide what, if
  anything, gets fixed.

## Next Phase

**Done.** No further phase — this skill's v1 scope ends here (no update/reconcile phase for an
already-pushed component).
