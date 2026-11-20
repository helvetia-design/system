import {
  expect,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './tag.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/indicators/${TAG}/test/${TAG}.visual.html`

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

test.describe('mountSsr', () => {
  test('renders ds-tag-group and hydrates', async ({ page }, testInfo) => {
    await mountSsr(
      page,
      `
        <ds-tag-group>
          <ds-tag>A</ds-tag>
          <ds-tag>B</ds-tag>
        </ds-tag-group>
      `,
      renderToString,
      testInfo,
    )

    await expect(page.locator('ds-tag-group')).toBeVisible()
  })
})
