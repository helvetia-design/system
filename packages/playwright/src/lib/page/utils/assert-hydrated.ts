import type { Page } from '@playwright/test'

const consoleErrors = new WeakMap<Page, string[]>()

/**
 * Starts collecting console and page errors for `assertHydrated()`. Call before the navigation.
 */
export const trackConsoleErrors = (page: Page) => {
  if (consoleErrors.has(page)) return
  const errors: string[] = []
  consoleErrors.set(page, errors)
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', e => errors.push(e.message))
}

/**
 * Checks a hydrated SSR page: no console errors since `trackConsoleErrors()`, no leftover `c-id`.
 */
export const assertHydrated = async (page: Page) => {
  const errors = consoleErrors.get(page)
  if (!errors) {
    throw new Error('assertHydrated: call trackConsoleErrors(page) before the navigation')
  }
  if (errors.length) {
    throw new Error(`assertHydrated: console errors during hydration:\n${errors.join('\n')}`)
  }

  // `c-id` is Stencil's SSR-only serialization marker: present on every server-rendered node,
  // stripped once the client successfully adopts that node during hydration. A leftover `c-id`
  // after hydration means the client re-rendered fresh content instead of adopting the
  // server-rendered markup — the "duplicate shadow content" class of hydration-mismatch bug,
  // which throws no error and is otherwise invisible to the checks above.
  const leftoverCIds = await page.evaluate(() => {
    const countIn = (root: Document | ShadowRoot): number => {
      let count = root.querySelectorAll('[c-id]').length
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) count += countIn(el.shadowRoot)
      }
      return count
    }
    return countIn(document)
  })
  if (leftoverCIds > 0) {
    throw new Error(
      `assertHydrated: ${leftoverCIds} leftover c-id attribute(s) after hydration — the client re-rendered ` +
        'instead of adopting the server-rendered markup, duplicating content',
    )
  }
}
