import {
  DsTabs,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './tabs.variants'

const PANELS = `
  <ds-tab name="a">Tab A</ds-tab>
  <ds-tab name="b">Tab B</ds-tab>
  <ds-tab-panel for="a">Content A</ds-tab-panel>
  <ds-tab-panel for="b">Content B</ds-tab-panel>
`

const baseline = visualBaseline(TAG)
const SHIFT = 'SSR: tab list renders stacked before hydration, box height changes (#327)'
const SHIFT_AND_POST = 'SSR: tab list stacked before hydration and taller than client render after hydration (#327)'

const FIXME: Record<string, string> = {
  'basic': SHIFT_AND_POST,
  'inverted': SHIFT_AND_POST,
  'colors': SHIFT_AND_POST,
  'no-border': SHIFT_AND_POST,
  'fullwidth-icons': SHIFT_AND_POST,
  'badge': SHIFT_AND_POST,
  'brand-icons': SHIFT,
  'vertical': SHIFT_AND_POST,
  'vertical-cols': SHIFT_AND_POST,
  'navigation': SHIFT,
  'navigation-vertical': SHIFT,
  'carousel': SHIFT_AND_POST,
}
const PAGE_URL = `/components/navigation/${TAG}/test/${TAG}.visual.html`

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
    await mountSsr(page, `<ds-tabs>${PANELS}</ds-tabs>`, renderToString, testInfo)

    const tabs = new DsTabs(page.locator('ds-tabs'))
    await tabs.assertTabSelected('a')
    await tabs.assertPanelVisible('a')
  })
})
