import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './stack.variants'

const baseline = visualBaseline(TAG)
const FIXME: Record<string, string> = {
  'alignment': 'SSR: ds-stack server markup has extra vertical spacing that stays after hydration (#326)',
  'direction': 'SSR: ds-stack server markup has extra vertical spacing that stays after hydration (#326)',
  'spaces': 'SSR: ds-stack server markup has extra vertical spacing that stays after hydration (#326)',
  'margins': 'SSR: ds-stack server markup has extra vertical spacing that stays after hydration (#326)',
  'row-alignment-top':
    'SSR: element is 1px off in height through subpixel rounding, because the ds-stack sections above it are taller (#326)',
  'row-alignment-center':
    'SSR: element is 1px off in height through subpixel rounding, because the ds-stack sections above it are taller (#326)',
  'column-alignment-bottom':
    'SSR: element is 1px off in height through subpixel rounding, because the ds-stack sections above it are taller (#326)',
  'padding':
    'SSR: element is 1px off in height through subpixel rounding, because the ds-stack sections above it are taller (#326)',
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
