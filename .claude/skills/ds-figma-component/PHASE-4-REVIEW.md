# Phase 4 — Review against visual regression screenshots

**You are here:** assumes [`PHASE-3B-DOCUMENT.md`](PHASE-3B-DOCUMENT.md) has built the component
set and its documentation page, both iterated on and confirmed visually with the user. This is
the last phase in this skill's v1 (create-only) scope — there is no update/reconcile phase after
this; findings surfaced here go back to the user as a report, not an auto-fix loop.

0. **For any animated (Lottie/CSS keyframe) or composite reused-vector mark, verify its real
   on-screen size before trusting the screenshot comparison, not just static analysis.** A size
   token binds the host container, not necessarily the visible artwork inside it — don't assume
   they're the same. If the dev server (`pnpm --filter core start`) is running or can be started,
   use Playwright (`browser_navigate` to the component's `*.visual.html`, `browser_evaluate` with
   `getBoundingClientRect()` on the actual visible path/shape elements, not the SVG element's own
   box) to measure the real glyph-to-container ratio, and compare it against what was built. See
   `CONVENTIONS.md` for the `ds-spinner` example (measured 86.3%, not the 100% initially assumed).
   Stop the dev server again when done if this skill started it.
1. For each built variant/state, capture a Figma screenshot (`get_screenshot`) and find the
   matching Playwright baseline under
   `packages/core/src/components/<category>/<name>/test/*.visual.play.ts-snapshots/*.png`.
2. Compare the two **visually, as the agent** — do not pixel-diff; Figma and browser rendering
   differ enough (anti-aliasing, font rasterization) to produce constant false mismatches on a
   pixel comparison.
3. Flag anything that looks substantively wrong (wrong color/token bound, missing or wrong
   nested icon, wrong size/spacing, wrong state rendering) as a finding — but this is advisory
   only. Never auto-pass or auto-fail. Report findings and let the user make the final call.
4. **Before reporting a suspected color/rendering mismatch from a screenshot, confirm it against
   live `getComputedStyle` in a browser, not just a visual read of a small/compressed PNG.** A
   79px-tall multi-row baseline image once made an inverted icon row _look_ like it had color
   variation it didn't actually have — two rows' content visually bled together at that
   resolution. Crop/zoom the image or measure the DOM directly before treating a visual
   impression as a finding.
5. **A prop's JSDoc comment can itself be wrong or incomplete — don't just transcribe a claimed
   behavior from Phase 1 into the final record without checking it against the real
   computed/rendered output.** `ds-icon`'s `turn` was documented as "rotated 180deg" but the
   real CSS only rotates 3 specific icon names, one of them by 225deg, not 180 — caught by
   comparing the real `turn` visual-regression baseline, confirmed via `getComputedStyle` matrix
   inspection. When Phase 4 reveals the _component's own code doc_ was wrong (not just the Figma
   mapping or `<name>.figma.md`'s draft notes), fix the code doc too, in the same pass — code is
   the source of truth for documentation copy (`PHASE-3B-DOCUMENT.md`'s header lead-paragraph
   rule), so a known-wrong comment shouldn't survive a run that just disproved it.

**Done.** No further phase — this skill's v1 scope ends here (no update/reconcile phase for an
already-pushed component). Report findings to the user and let them decide what, if anything,
gets fixed.
