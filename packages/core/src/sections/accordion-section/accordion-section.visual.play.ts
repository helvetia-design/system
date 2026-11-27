import { expectScreenshot, screenshot, test } from '@helvetia-design/playwright'

const TAG = 'accordion-section'
const VARIANTS = ['default', 'open', 'mobile'] as const

const image = screenshot(TAG)

test.beforeEach('Setup', async ({ page }) => {
  await page.setupVisualTest(`/sections/${TAG}/${TAG}.visual.html`)
})

VARIANTS.forEach(variant => {
  test(variant, async ({ page }) => {
    const el = page.getByTestId(variant)
    await expectScreenshot(el, image(variant))
  })
})
