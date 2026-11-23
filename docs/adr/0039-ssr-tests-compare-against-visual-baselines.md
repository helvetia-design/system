# 39. SSR tests compare against the visual baselines

Package: `packages/core`, `packages/playwright`

Date: 2026-11-19

## Status

Accepted

## Context

`packages/core` has `*.visual.play.ts` and `*.ssr.play.ts` files. A visual test loads `*.visual.html`, lets the client render it, and takes one screenshot per `data-testid` section. An SSR test rendered a short inline snippet with `mountSsr()` and checked the hydration. No test looked at the server markup, and no test detected a layout shift between first paint and the hydrated state.

## Decision

- Visual tests and SSR tests stay separate files.
- An SSR test loads the same `*.visual.html` as the visual test, renders it with `renderToString`, and uses the variant list from `<name>.variants.ts`. Playwright does not allow one test file to import another, so both tests import that file.
- Each variant gets two screenshots: one of the server markup while the client bundle is held back, one after hydration. Both compare against the existing desktop baseline of the visual test.
- Desktop only. The server markup does not depend on the viewport, and the visual tests cover the responsive styles.
- The helpers (`setupSsrVisualTest`, `holdHydration`, `assertHydrated`, `visualBaseline`) are public API of `@helvetia-design/playwright`.
- Client-only components (modal, toast, snackbar, see ADR 0031) keep `mountSsr()`.

## Spike results

- **Snapshot path.** Playwright does not sanitize array names, but it rejects `..` with "The outputPath is not allowed outside of the parent directory". The `🧬 SSR` project sets `snapshotPathTemplate` to `{testDir}/{testFileDir}/{arg}-🖼️-Visual-💻-Desktop-Chrome{-snapshotSuffix}{ext}`, and `visualBaseline()` returns the folder and file name. No baseline is renamed.
- **Inline scripts.** `renderToString` passes inline scripts through unchanged and does not run them. The browser runs them at parse time, before the held bundle.
- **Navigation.** The held bundle request blocks `domcontentloaded` and `load` and keeps `networkidle` from settling. `waitForChanges()`, which `expectScreenshot()` calls, hung until the test timeout. `waitForChanges()` now returns early while the bundle is held. Navigation uses `page.mainFrame().goto()` with `waitUntil: 'commit'`, because the fixture's `page.goto()` override waits for `document.fonts.ready`. It then waits for the parser, stylesheets, and images. `tag` was green 5 of 5 runs, and the first screenshot happens about 100 ms after setup.
- **Fonts.** While the held bundle keeps the document loading, `document.fonts.ready` only settles after a font load. On a page whose text starts no font load (`divider.visual.html`), it never settles, and `toHaveScreenshot()` waits for it until the timeout. The helper calls `load()` on every `FontFace` before it awaits `ready`.
- **Threshold.** With `maxDiffPixelRatio: 0`, the client-only render differs by up to 0.08 for stale slider baselines. A real slider hydration bug (duplicated thumb and track) showed 0.03 to 0.06 and was invisible at the visual tolerance of 0.1. The SSR project uses 0.02.
- **Run time.** One SSR screenshot test takes about 1.6 to 2 s in the Linux container.
- **Architecture.** CI runs `mcr.microsoft.com/playwright:v1.59.1-noble` on amd64. The same image on arm64 (Apple Silicon) renders differently, for example without `hyphens: auto`. Baselines, including `-ssr-static`, must come from the amd64 image (`docker run --platform linux/amd64`).

## Considered options

- **Extend the visual tests with an SSR mode.** One file per component, but a visual run would double and the client-only render path would lose its own reference. Rejected.
- **Separate SSR baselines.** No coupling to the visual tests, but about 140 new images and a second source of truth. Rejected.

## Consequences

- A change to a visual baseline also affects the SSR test. A visual update can turn an SSR test red.
- The `/update-screenshots` bot runs only the visual projects, so it never writes SSR baselines. Components that finish rendering in the browser get `-ssr-static` baselines, which are updated locally in the Playwright Linux image on amd64.
- Playwright has no per-project `updateSnapshots`. A run with `--update-snapshots` that includes the `🧬 SSR` project can overwrite visual baselines with the server render, so it must be filtered to the `-ssr-static` tests.
- A component that shifts on hydration fails its test. The fix goes into the component, or the test is marked `test.fixme` with an issue number.
