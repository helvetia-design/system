import { expectScreenshot, screenshot, test } from '@helvetia-design/playwright'
import { TAG, VARIANTS } from './tag.variants'

const image = screenshot(TAG)

test.describe('style', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/indicators/${TAG}/test/${TAG}.style.html`)
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
    await page.setupVisualTest(`/components/indicators/${TAG}/test/${TAG}.visual.html`)
  })

  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(variant))
    })
  })

  test('card-position', async ({ page }) => {
    const el = page.getByTestId('card-position')
    await expectScreenshot(el, image('card-position'))
  })
})
