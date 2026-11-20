import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './app-navbar.variants'

const baseline = visualBaseline(TAG)

test.describe('ssr', () => {
  VARIANTS.forEach(({ name, file }) => {
    test(name, async ({ page }) => {
      const ssr = await setupSsrVisualTest(page, `/components/navigation/${TAG}/test/${file}`, renderToString)

      await expectScreenshot(page, baseline(name))
      await ssr.hydrate()
      await expectScreenshot(page, baseline(name))
    })
  })
})
