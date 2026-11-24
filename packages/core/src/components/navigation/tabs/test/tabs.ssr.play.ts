import {
  DsTabs,
  expect,
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
const TALLER = 'SSR: tab list is taller than the client render before and after hydration (#326)'

const FIXME: Record<string, string> = {
  'basic': TALLER,
  'inverted': TALLER,
  'colors': TALLER,
  'no-border': TALLER,
  'fullwidth-icons': TALLER,
  'badge': TALLER,
  'vertical': TALLER,
  'vertical-cols': TALLER,
  'carousel': TALLER,
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

test.describe('slot attributes', () => {
  test('server markup assigns the tab slot', async () => {
    const { html } = await renderToString(`<ds-tabs>${PANELS}</ds-tabs>`)

    expect(html).toMatch(/<ds-tab\b[^>]*\sslot="tab"/)
  })
})
