import { test, expectScreenshot, screenshot } from '@helvetia-design/playwright'
import { TAG, VARIANTS } from './app-navbar.variants'

const image = screenshot(TAG)

VARIANTS.forEach(({ name, file }) => {
  test(name, async ({ page }) => {
    await page.setupVisualTest(`/components/navigation/${TAG}/test/${file}`)
    await expectScreenshot(page, image(name))
  })
})
