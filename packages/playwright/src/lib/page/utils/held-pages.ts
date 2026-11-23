import type { Page } from '@playwright/test'

/** Pages whose client bundle `holdHydration()` currently holds back. */
export const heldPages = new WeakSet<Page>()
