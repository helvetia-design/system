import {
  DsToggle,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { HOST_VARIANTS, TAG } from './toggle.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/forms/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
      const el = page.getByTestId(variant)

      await expectScreenshot(el, baseline(variant))
      await ssr.hydrate()
      await expectScreenshot(el, baseline(variant))
    })
  })
})

test.describe('mountSsr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, `<ds-toggle value="on">Toggle</ds-toggle>`, renderToString, testInfo)

    const toggle = new DsToggle(page.locator('ds-toggle'))
    await toggle.assertToBeVisible()
  })
})
