import {
  DsDatepicker,
  expect,
  expectScreenshot,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './datepicker.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/forms/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
      const el = page.getByTestId(variant)

      await expectScreenshot(el, baseline(variant))
      await ssr.hydrate()
      await expectScreenshot(el, baseline(variant))
    })
  })
})

test.describe('ssr hydration', () => {
  // Bug: https://github.com/helvetia-design/system/issues/328
  test('inline renders exactly one calendar after hydration', async ({ page }) => {
    const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
    await ssr.hydrate()

    const [inline, disabledInline] = [0, 1].map(i => page.getByTestId('inline').locator('ds-datepicker').nth(i))
    await expect(inline.locator('#inline > .air-datepicker')).toHaveCount(1)
    await expect(disabledInline.locator('#popup > .air-datepicker')).toHaveCount(1)
  })

  // Bug: https://github.com/helvetia-design/system/issues/328
  test('popup renders exactly one calendar after hydration and opening', async ({ page }) => {
    const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
    await ssr.hydrate()

    const datepicker = new DsDatepicker(page.locator('[data-testid="basic"] ds-datepicker'))
    await datepicker.triggerButton.click()
    await expect(datepicker.triggerButton).toHaveAttribute('aria-expanded', 'true')
    await expect(datepicker.el.locator('#popup > .air-datepicker')).toHaveCount(1)
  })
})
