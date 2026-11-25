import { expect, expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './data.variants'

const baseline = visualBaseline(TAG)

const PAGE_URL = `/components/structure/${TAG}/test/${TAG}.visual.html`

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

test.describe('slot attributes', () => {
  test('server markup assigns the label and value slots', async () => {
    const { html } = await renderToString(
      '<ds-data><ds-data-item><ds-data-label>Name</ds-data-label><ds-data-value>Value</ds-data-value></ds-data-item></ds-data>',
    )

    expect(html).toMatch(/<ds-data-label\b[^>]*\sslot="label"/)
    expect(html).toMatch(/<ds-data-value\b[^>]*\sslot(="")?[\s>]/)
  })
})
