import { expectScreenshot, screenshot, test } from '@helvetia-design/playwright'
import { HOST_VARIANTS, TAG, VARIANTS } from './button.variants'

const image = screenshot(TAG)

test.describe('style', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/actions/${TAG}/test/${TAG}.style.html`)
  })

  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(`style-${variant}`))
    })
  })
})

test.describe('host', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/actions/${TAG}/test/${TAG}.visual.html`)
  })

  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(variant))
    })
  })

  test('tooltip', async ({ page }) => {
    const el = page.getByTestId('tooltip')
    await el.locator('ds-button button').hover()
    await expectScreenshot(el, image('tooltip'))
  })
})
