import type { TestInfo } from '@playwright/test'
import type { Readable } from 'node:stream'
import type { DsPage } from '../../types'
import { assertHydrated, trackConsoleErrors } from './assert-hydrated'
import { template } from './mount'
import { renderSsr } from './render-ssr'
import { waitForChanges } from './wait-for-changes'

/**
 * Matches `renderToString`'s overloaded signature from `@helvetia-design/core/hydrate` (not imported
 * directly here — see the package doc comment on why) closely enough for TS to accept the real
 * function as an argument. `mountSsr` only ever calls it with the 2-arg, non-streaming overload.
 */
export type RenderToString = (
  html: string,
  options?: Record<string, unknown>,
  asStream?: boolean,
) =>
  | Promise<{
      html: string | null
      hydratedCount: number
      diagnostics: { level: string; messageText: string }[]
    }>
  | Readable

/**
 * SSR twin of `mount()`. Renders `content` server-side via the injected `renderToString`
 * (from `@helvetia-design/core/hydrate`), serves the resulting markup to a real page using the same
 * route-interception trick as `mount()`, then lets the client-side bundle hydrate it — so tests can
 * use the same page-object infrastructure as `.component.play.ts` post-hydration.
 */
export const mountSsr = async (page: DsPage, content: string, renderToString: RenderToString, testInfo: TestInfo) => {
  if (page.isClosed()) {
    throw new Error('mountSsr unavailable: page is already closed')
  }

  const baseUrl = testInfo.project.use.baseURL
  if (!baseUrl) {
    throw new Error('mountSsr unavailable: no dev server base URL provided')
  }

  const html = await renderSsr(renderToString, template(content), `${baseUrl}/`, 'mountSsr')

  trackConsoleErrors(page)

  await page.route(baseUrl + '**', route => {
    const url = route.request().url()
    if (url === `${baseUrl}/` || url === `${baseUrl}/#` || url === `${baseUrl}#` || url === baseUrl) {
      route.fulfill({ status: 200, contentType: 'text/html', body: html })
    } else {
      route.continue()
    }
  })

  await page.goto(`${baseUrl}#`, { waitUntil: 'domcontentloaded' })
  await waitForChanges(page)
  await assertHydrated(page)
}
