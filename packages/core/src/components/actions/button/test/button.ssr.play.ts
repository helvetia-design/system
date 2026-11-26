import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { HOST_VARIANTS, TAG } from './button.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/actions/${TAG}/test/${TAG}.visual.html`

const FIXME: Record<string, string> = {
  'brand-icons-states':
    'SSR: the logo spinner is drawn by Lottie on the client only, and the client sanitizeSvg strips <rect> width/height that the server markup keeps',
}

test.describe('ssr', () => {
  HOST_VARIANTS.forEach(variant => {
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
