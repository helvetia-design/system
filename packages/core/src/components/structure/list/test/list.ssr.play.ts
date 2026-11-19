import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS_HOST } from './list.variants'

const baseline = visualBaseline(TAG)
const FIXME: Record<string, string> = {
  'basic': 'SSR: ds-list server markup has extra vertical spacing that stays after hydration (#326)',
  'ordered': 'SSR: ds-list server markup has extra vertical spacing that stays after hydration (#326)',
  'linked': 'SSR: ds-list server markup has extra vertical spacing that stays after hydration (#326)',
  'accordion': 'SSR: ds-list server markup has extra vertical spacing that stays after hydration (#326)',
  'nested-accordion': 'SSR: ds-list server markup has extra vertical spacing that stays after hydration (#326)',
}

const PAGE_URL = `/components/structure/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  VARIANTS_HOST.forEach(variant => {
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
