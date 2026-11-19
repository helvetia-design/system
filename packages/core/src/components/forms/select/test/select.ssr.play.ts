import {
  DsSelect,
  expect,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { HOST_VARIANTS, TAG } from './select.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/forms/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  HOST_VARIANTS.map(({ testId }) => testId).forEach(variant => {
    test(variant, async ({ page }) => {
      const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
      const el = page.getByTestId(variant)

      await expectScreenshot(el, baseline(variant))
      await ssr.hydrate()
      await expectScreenshot(el, baseline(variant))
    })
  })
})

test.describe('ssr declarative options', () => {
  test('renders and hydrates with declarative ds-select-option/ds-select-optgroup markup', async ({
    page,
  }, testInfo) => {
    await mountSsr(
      page,
      `
        <ds-select label="Country">
          <ds-select-option value="ch">Switzerland</ds-select-option>
          <ds-select-optgroup label="Neighbours">
            <ds-select-option value="de">Germany</ds-select-option>
            <ds-select-option value="fr">France</ds-select-option>
          </ds-select-optgroup>
        </ds-select>
      `,
      renderToString,
      testInfo,
    )

    const select = new DsSelect(page.locator('ds-select'))
    await select.assertToBeVisible()
    await expect(page.locator('ds-select-optgroup')).toHaveCount(1)
  })
})
