import type { Page, Route } from '@playwright/test'
import type { DsPage } from '../../types'
import { assertHydrated, trackConsoleErrors } from './assert-hydrated'
import { heldPages } from './held-pages'
import { waitForChanges } from './wait-for-changes'

export type HoldHydrationOptions = {
  /**
   * URL pattern of the client bundle requests to hold back. Defaults to `**\/build/**`.
   * Match JavaScript only: a held stylesheet or font keeps `waitForServerMarkup()` waiting.
   */
  scripts?: string | RegExp
}

export type HeldHydration = {
  /** Releases the client bundle, waits until the components are ready, and runs `assertHydrated()`. */
  hydrate(): Promise<void>
}

/**
 * Holds back the client bundle of the next navigation, so the page shows the server markup only.
 * Works against any URL and any SSR server. Navigate with `page.mainFrame().goto(url, { waitUntil: 'commit' })`
 * afterwards, because the held bundle blocks `domcontentloaded` and `load`, then call `waitForServerMarkup()`.
 */
export const holdHydration = async (page: Page, options: HoldHydrationOptions = {}): Promise<HeldHydration> => {
  const held: Route[] = []
  let released = false

  trackConsoleErrors(page)
  heldPages.add(page)
  await page.route(options.scripts ?? '**/build/**', async route => {
    if (released) {
      await route.continue()
    } else {
      held.push(route)
    }
  })

  return {
    async hydrate() {
      released = true
      heldPages.delete(page)
      await Promise.all(held.splice(0).map(route => route.continue()))
      await page.waitForLoadState('load')
      await waitForChanges(page as DsPage)
      await assertHydrated(page)
    },
  }
}

/**
 * Waits until the parser, the stylesheets, the images, and the fonts of a page with a held bundle are done.
 */
export const waitForServerMarkup = async (page: Page) => {
  await page.waitForFunction(() => {
    if (document.readyState === 'loading') return false
    const sheets = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    return sheets.every(link => link.sheet) && Array.from(document.images).every(img => img.complete)
  })
  // While the held bundle keeps the document loading, `document.fonts.ready` only settles after a font load.
  // A page whose text starts no font load would hang every screenshot, which waits for `ready`.
  await page.evaluate(async () => {
    const loads: Promise<FontFace>[] = []
    document.fonts.forEach(face => loads.push(face.load()))
    await Promise.all(loads)
    await document.fonts.ready
  })
}
