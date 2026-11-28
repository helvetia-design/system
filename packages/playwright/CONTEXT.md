# CONTEXT — packages/playwright (E2E Testing Library)

This document captures domain language, architectural patterns, and key concepts specific to the Playwright testing package.

## Overview

**packages/playwright** is a custom testing library built on **Playwright** that provides:

- **Page Objects (POs)** — Typed locators and helper methods for component interaction
- **Custom matchers** — Extended assertions for design system components
- **Test utilities** — Mounting helpers, wait conditions, accessibility testing
- **Snapshot storage** — Visual regression snapshot management

All component tests in the design system use this library for consistent, maintainable E2E testing.

## Core Concepts

### Page Object Pattern

A **Page Object** is a class that encapsulates the interaction logic for a component. Instead of tests directly querying the DOM, they call PO methods:

```typescript
// Page Object (does the heavy lifting)
export class DsButton extends PageObject {
  async click() {
    await this.el.click()
  }
}

// Test (calls the PO method)
test('button fires dsChange event', async ({ page, mount }) => {
  const button = await mount(DsButton, {/*props*/})
  await button.click()
  // assert event was fired
})
```

Benefits:

- **Maintainability** — If component structure changes, only the PO needs updating
- **Readability** — Tests read like plain English
- **Reusability** — All tests for a component use the same PO

### Test Types

| Test Type       | File Pattern         | Purpose                      | Assertions                             |
| --------------- | -------------------- | ---------------------------- | -------------------------------------- |
| **Unit**        | `.spec.ts`           | Logic, utilities, edge cases | Vitest assertions                      |
| **Interaction** | `.component.play.ts` | User interactions, events    | Custom matchers for events             |
| **Visual**      | `.visual.play.ts`    | Visual regression            | Screenshot comparisons                 |
| **A11y**        | `.a11y.play.ts`      | Accessibility compliance     | axe-core checks + manual assertions    |
| **SSR**         | `.ssr.play.ts`       | Server markup and hydration  | Screenshots before and after hydration |

**Touch.** A `.component.play.ts` test tagged `@touch` (`test('…', { tag: '@touch' }, …)`) runs
only in the `⚙️ Component / 👆 Touch` project (Pixel 5, `hasTouch`) and is excluded from
`⚙️ Component` (desktop has no touchscreen, so `tap()` would throw). Drive it with the base
`PageObject.tap()`. Target size (WCAG 2.5.8) is asserted with `expectMinTargetSize(locator, 24)`
in `.a11y.play.ts`; phone + tablet layout is the `📱 Mobile Chrome` visual project (they share one
breakpoint). All emulation — no real-device run.

### Test Mounting

Components are mounted in each test using the `mount` fixture:

```typescript
test('button renders correctly', async ({ page, mount }) => {
  const button = await mount(DsButton, {
    label: 'Click me',
    type: 'primary',
  })

  await expect(button.el).toBeVisible()
  await button.click()
})
```

**Key rule:** Mount in the test body, never in `beforeEach`. This ensures test isolation and clear test intent.

### Custom Matchers

The library provides domain-specific matchers:

```typescript
// Event firing assertions
await expect(button).toHaveEmitted('dsChange')
await expect(button).toHaveEmittedWith('dsChange', { value: true })

// Accessibility checks
await expect(button).toBeAccessible()

// Component state assertions
await expect(button).toBeDisabled()
await expect(button).toHaveFocus()
```

### Accessibility Testing

A11y tests verify WCAG 2.2 AA compliance:

- **Automated checks** via axe-core within Playwright
- **Keyboard navigation** — Tab, Enter, Space, Arrow keys
- **Focus management** — Visible focus indicators, logical tab order
- **Screen reader support** — Proper ARIA labels, roles, live regions
- **Color contrast** — 4.5:1 for text, 3:1 for UI components

**The axe fixture does not cover WCAG 2.2.** `a11y()` (`src/lib/functions/a11y.ts`) runs
`AxeBuilder` tagged `wcag2a, wcag2aa, wcag21a, wcag21aa` — no `wcag22aa`, even though the
installed `@axe-core/playwright` 4.14 ships those rules (including `target-size`). So **2.4.11
Focus Not Obscured**, **2.5.7 Dragging Movements** and **2.5.8 Target Size** are never
automatically checked here, and a green a11y suite is not WCAG 2.2 AA evidence by itself — those
three need a manual pass (see `ds-a11y-verify`). This is the one place that explains why; other
docs should link here rather than re-deriving it.

## Notable Patterns

### PO Organization

Each component has a PO in `packages/playwright/src/lib/components/<component>.po.ts`:

```typescript
import { PageObject, E2ELocator } from '@helvetia-design/playwright'

export class DsTag extends PageObject {
  private readonly closeButton: Locator
  private readonly icon: Locator

  constructor(el: E2ELocator) {
    super(el)
    this.closeButton = el.locator('ds-close')
    this.icon = el.locator('[role="img"]')
  }

  async clickClose() {
    await this.closeButton.click()
  }

  async getIcon() {
    return await this.icon.getAttribute('aria-label')
  }
}
```

### Visual Regression Snapshots

Snapshots are stored in `e2e/snapshots/` and tracked in git:

- **Baseline** — The approved visual state
- **Compare** — New screenshots are compared to baseline
- **Update** — Run `/update-screenshots` bot command to re-baseline after intentional changes

**A new component has no baseline, and that is not a failure to investigate.** Its first visual
run reports `snapshot doesn't exist` for every variant and writes the PNGs to disk. That is
expected — do not re-run the suite hoping for green, and **do not let those auto-written PNGs
become the baseline**: delete them and leave baselining to the human via `/update-screenshots`.
A baseline captured from an unreviewed component bakes the bug in, and every later run then
defends it.

### SSR Screenshot Tests

An SSR test renders the page of the visual test with `renderToString`, serves it, and holds back the client bundle. It takes one screenshot of the server markup and one after hydration. Both compare against the desktop baseline of the visual test. Desktop only.

```typescript
import { renderToString } from '@helvetia-design/core/hydrate'
import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { TAG, VARIANTS } from './tag.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/indicators/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
      const el = page.getByTestId(variant)

      await expectScreenshot(el, baseline(variant))
      await ssr.hydrate()
      await expectScreenshot(el, baseline(variant))
    })
  })
})
```

Helpers:

- `setupSsrVisualTest(page, url, renderToString, options?)` fetches `url`, renders it, serves the result at the same URL, holds the bundle, and navigates. It returns `{ hydrate() }`.
- `holdHydration(page, { scripts? })` holds back the client bundle requests. `scripts` defaults to `**/build/**`. It works against any server and returns `{ hydrate() }`.
- `hydrate()` releases the bundle, waits for the components, and runs `assertHydrated()`.
- `assertHydrated(page)` fails on console errors since `trackConsoleErrors(page)` and on leftover `c-id` attributes. `mountSsr()` uses it too.
- `visualBaseline(tag, visualTestFile?)(name)` names the baseline of `screenshot(tag)(name)` in `<tag>.visual.play.ts`. The `🧬 SSR` project resolves it through its `snapshotPathTemplate`, so no baseline is renamed.

**Known environment failure — do not re-prove it.** The `🧬 SSR` project currently fails on every
variant of every component with `assertHydrated: N leftover c-id attribute(s)`. This reproduces
identically on long-shipped components (`ds-phone-input` among them), so it is a tooling/environment
problem, not a defect in whichever component you are working on. Write the `.ssr.play.ts` file to
the pattern above, report the suite as blocked by this known issue, and move on — running it a
second time against another component to confirm is a full Playwright run that tells you nothing
new.

The `variants.ts` file exists because Playwright does not allow a test file to import another test file.

#### Foreign SSR server

`holdHydration()` needs no `renderToString`. Pass the bundle pattern of the server, navigate with `waitUntil: 'commit'`, take the screenshot, then hydrate:

```typescript
// Match JavaScript only. Next.js also serves CSS and fonts under /_next/static/, and a held stylesheet never loads.
const ssr = await holdHydration(page, { scripts: /\/_next\/static\/.+\.js(\?|$)/ })
await page.mainFrame().goto(url, { waitUntil: 'commit' })
await waitForServerMarkup(page)
await expectScreenshot(el, 'server')
await ssr.hydrate()
```

The held bundle blocks `domcontentloaded` and `load`. Use `page.mainFrame().goto()`, because the fixture's `page.goto()` waits for `document.fonts.ready`, which can stay pending while the bundle is held. `waitForServerMarkup()` waits for the parser, stylesheets, images, and fonts. `waitForChanges()` returns early while the bundle is held.

#### Components that finish rendering in the browser

If the server markup differs on purpose from the baseline, the first screenshot gets its own baseline with the suffix `-ssr-static`:

```typescript
const staticImage = visualBaseline(TAG, `${TAG}.ssr.play.ts`)
await expectScreenshot(el, staticImage(`${variant}-ssr-static`))
```

The `/update-screenshots` bot (`.github/workflows/screenshots.yml`) only runs the visual projects. It never writes SSR baselines. Update `-ssr-static` baselines locally in the Playwright Linux image on amd64 (`docker run --platform linux/amd64 mcr.microsoft.com/playwright:v1.59.1-noble`). The arm64 build of the image renders differently than CI. Never run `--update-snapshots` with the `🧬 SSR` project and without a filter: its template points at the visual baselines, so it would overwrite them with the server render. Limit it to the `-ssr-static` tests with `-g`.

Client-only components (`ds-modal`, `ds-toast`, `ds-snackbar`, see ADR 0031) keep `mountSsr()` with an inline snippet.

### Test File Organization

Each component needs test files in `packages/core/src/components/<category>/<component>/test/`
(see `packages/core/CONTEXT.md` for the category taxonomy):

- `<component>.spec.ts` — Unit tests (Vitest)
- `<component>.component.play.ts` — Interaction tests (Playwright)
- `<component>.visual.play.ts` — Visual regression (Playwright)
- `<component>.a11y.play.ts` — Accessibility (Playwright + axe)
- `<component>.variants.ts` — Variant list shared by the visual and SSR tests
- `<component>.ssr.play.ts` — SSR screenshots (not for client-only components)

## Key Constraints

- **Page Objects required** — All tests must use POs; no direct DOM queries in tests
- **Test isolation** — Mount in test body, not beforeEach
- **Accessibility mandatory** — Components with no a11y tests cannot merge
- **Visual snapshots tracked** — All visual tests must have approved snapshots
- **No console errors** — Tests fail if components emit console errors or warnings

## Related Contexts

See [CONTEXT-MAP.md](../../CONTEXT-MAP.md) for:

- [[packages/core|packages/core/CONTEXT.md]] — Components being tested
- [[root|CONTEXT.md]] — Repository-level concepts
