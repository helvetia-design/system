import {
  DsPagination,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, HOST_VARIANTS } from './pagination.variants'

const baseline = visualBaseline(TAG)
const FIXME = 'SSR: renderToString reports Hydrate Error for the invalid align="bubu" in the basic section (#330)'
const PAGE_URL = `/components/navigation/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      test.fixme(true, FIXME)
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
    await mountSsr(
      page,
      `<ds-pagination page-range="2" total-pages="20" value="10"></ds-pagination>`,
      renderToString,
      testInfo,
    )

    const pagination = new DsPagination(page.locator('ds-pagination'))
    await pagination.assertToBeVisible()
  })
})
