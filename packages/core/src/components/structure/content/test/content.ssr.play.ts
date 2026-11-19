import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './content.variants'

const baseline = visualBaseline(TAG)
const FIXME: Record<string, string> = {
  basic: 'SSR: ds-content server markup has extra vertical spacing that stays after hydration (#326)',
  alignment: 'SSR: ds-content server markup has extra vertical spacing that stays after hydration (#326)',
  space: 'SSR: ds-content server markup has extra vertical spacing that stays after hydration (#326)',
}

const PAGE_URL = `/components/structure/${TAG}/test/${TAG}.visual.html`

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
