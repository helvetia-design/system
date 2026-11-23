import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './sheet.variants'

const baseline = visualBaseline(TAG)
const FIXME: Record<string, string> = {
  basic: 'SSR: ds-heading in ds-sheet gets extra vertical spacing, also after hydration (#326)',
  container: 'SSR: ds-heading in ds-sheet gets extra vertical spacing, also after hydration (#326)',
}
const PAGE_URL = `/components/overlays/${TAG}/test/${TAG}.visual.html`

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
