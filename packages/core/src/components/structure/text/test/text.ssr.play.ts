import {
  DsText,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './text.variants'

const baseline = visualBaseline(TAG)
const FIXME: Record<string, string> = {
  'basic': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'theme': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'no-wrap': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'colors': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'sizes': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'font-weight': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'heading': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'shadow': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
  'space': 'SSR: ds-text server markup has extra vertical spacing that stays after hydration (#326)',
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

test.describe('mountSsr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, `<ds-text>Hello World</ds-text>`, renderToString, testInfo)

    const dsText = new DsText(page.locator('ds-text'))
    await dsText.assertToBeVisible()
    await dsText.assertToContainText('Hello World')
  })
})
