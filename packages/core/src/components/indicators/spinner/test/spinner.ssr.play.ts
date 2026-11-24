import {
  DsSpinner,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './spinner.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/indicators/${TAG}/test/${TAG}.visual.html`

const FIXME: Record<string, string> = {
  'circle-variation':
    'SSR: circle spinner renders larger than the client-only render, because the global stylesheet with box-sizing is missing in SSR shadow roots (#326)',
}

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      test.fixme(variant in FIXME, FIXME[variant])
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
    await mountSsr(page, `<ds-spinner label="Loading..."></ds-spinner>`, renderToString, testInfo)

    const spinner = new DsSpinner(page.locator('ds-spinner'))
    await spinner.assertToBeVisible()
  })
})
