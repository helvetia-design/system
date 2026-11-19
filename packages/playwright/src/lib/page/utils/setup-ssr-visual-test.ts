import type { Page } from '@playwright/test'
import { holdHydration, type HeldHydration, type HoldHydrationOptions, waitForServerMarkup } from './hold-hydration'
import type { RenderToString } from './mount-ssr'
import { renderSsr } from './render-ssr'

/**
 * Renders the page at `url` with `renderToString`, serves the result at the same URL, and holds the
 * hydration. The page shows the server markup until `hydrate()` runs.
 */
export const setupSsrVisualTest = async (
  page: Page,
  url: string,
  renderToString: RenderToString,
  options: HoldHydrationOptions = {},
): Promise<HeldHydration> => {
  if (page.isClosed()) {
    throw new Error('setupSsrVisualTest unavailable: page is already closed')
  }

  // page.request resolves a relative `url` against the effective baseURL, including test.use() overrides.
  const source = await page.request.get(url)
  const absoluteUrl = source.url()
  if (!source.ok()) {
    throw new Error(`setupSsrVisualTest: GET ${absoluteUrl} returned ${source.status()}`)
  }

  const html = await renderSsr(renderToString, await source.text(), absoluteUrl, 'setupSsrVisualTest')

  await page.route(absoluteUrl, route => route.fulfill({ status: 200, contentType: 'text/html', body: html }))
  const held = await holdHydration(page, options)

  // Not page.goto(): the fixture's override waits for document.fonts.ready right after commit, which can hang.
  await page.mainFrame().goto(absoluteUrl, { waitUntil: 'commit' })
  await waitForServerMarkup(page)

  return held
}
