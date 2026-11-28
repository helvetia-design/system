import { Locator, expect } from '@playwright/test'

/**
 * WCAG 2.2 SC 2.5.8 Target Size (Minimum, AA): a pointer target is at least 24×24 CSS px.
 * shortcut: checks the rendered box only, not the SC's spacing exception — assert spacing by hand
 * when a smaller target is deliberately allowed.
 */
export async function expectMinTargetSize(target: Locator, min = 24) {
  const box = await target.boundingBox()
  expect(box, 'target is not rendered').not.toBeNull()
  expect(box!.width, `target width ≥ ${min}px`).toBeGreaterThanOrEqual(min)
  expect(box!.height, `target height ≥ ${min}px`).toBeGreaterThanOrEqual(min)
}
