import { expectScreenshot, screenshot, test } from '@helvetia-design/playwright'
import { HOST_VARIANTS, TAG } from './radio.variants'

const STYLE_VARIANTS = [
  'basic',
  'no-label',
  'disabled',
  'invalid',
  'invalid-disabled',
  'field',
  'field-vertical',
  'form',
  'field-disabled',
  'field-invalid',
]

const image = screenshot(TAG)

test.describe('style', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/forms/${TAG}/test/${TAG}.style.html`)
  })

  STYLE_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(`style-${variant}`))
    })
  })
})

test.describe('host', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/forms/${TAG}/test/${TAG}.visual.html`)
  })

  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(variant))
    })
  })
})
