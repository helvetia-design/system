import {
  DsAccordion,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './accordion.variants'

const baseline = visualBaseline(TAG)
const FIXME = 'SSR: ds-accordion server markup has extra vertical spacing that stays after hydration (#326)'
const PAGE_URL = `/components/structure/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
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
      `
        <ds-accordion>
          <span slot="summary">Title</span>
          <span slot="content">Content</span>
        </ds-accordion>
      `,
      renderToString,
      testInfo,
    )

    const dsAccordion = new DsAccordion(page.locator('ds-accordion'))
    await dsAccordion.assertToBeVisible()
  })
})
