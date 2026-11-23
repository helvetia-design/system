import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { HOST_VARIANTS, TAG } from './segment.variants'

const baseline = visualBaseline(TAG)
const ssrBaseline = visualBaseline(TAG, `${TAG}.ssr.play.ts`)
// The selected item's indicator background is drawn in the browser.
const SSR_STATIC: readonly string[] = ['invalid', 'invalid-slot']
const FIXME: Record<string, string> = {
  'long-content': 'SSR: overflowing items switch to vertical layout only after hydration, box grows 57px (#327)',
}
const PAGE_URL = `/components/forms/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  HOST_VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      test.fixme(variant in FIXME, FIXME[variant])
      const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
      const el = page.getByTestId(variant)

      await expectScreenshot(
        el,
        SSR_STATIC.includes(variant) ? ssrBaseline(`${variant}-ssr-static`) : baseline(variant),
      )
      await ssr.hydrate()
      await expectScreenshot(el, baseline(variant))
    })
  })
})
