import {
  DsRadio,
  expect,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { HOST_VARIANTS, TAG } from './radio.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/forms/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      test.fixme(
        true,
        'SSR: global stylesheet not adopted into the shadow root after hydration, native input keeps its UA margin (#326)',
      )
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
    await mountSsr(page, `<ds-radio value="option-1">Option 1</ds-radio>`, renderToString, testInfo)

    const radio = new DsRadio(page.locator('ds-radio'))
    await radio.assertToBeVisible()
  })

  test('renders ds-radio-group and hydrates', async ({ page }, testInfo) => {
    await mountSsr(
      page,
      `
        <ds-radio-group name="heroes" label="Label">
          <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
          <ds-radio value="tony-stark">Tony Stark</ds-radio>
        </ds-radio-group>
      `,
      renderToString,
      testInfo,
    )

    await expect(page.locator('ds-radio-group')).toBeVisible()
  })
})
