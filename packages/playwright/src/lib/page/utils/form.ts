import type { Page } from '@playwright/test'

/**
 * Returns the `[name, value]` entries the browser would submit for the matched `<form>`.
 */
export const getFormEntries = (page: Page, selector = 'form') =>
  page.evaluate(sel => {
    const entries: [string, FormDataEntryValue][] = []
    new FormData(document.querySelector(sel) as HTMLFormElement).forEach((value, key) => entries.push([key, value]))
    return entries
  }, selector)

/**
 * Calls the native `reset()` of the matched `<form>`.
 */
export const resetForm = (page: Page, selector = 'form') =>
  page.evaluate(sel => (document.querySelector(sel) as HTMLFormElement).reset(), selector)
