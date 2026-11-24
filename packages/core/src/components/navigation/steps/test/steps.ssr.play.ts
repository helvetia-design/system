import {
  DsSteps,
  expect,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './steps.variants'

const PANELS = `
  <ds-step name="a" label="Cart"></ds-step>
  <ds-step name="b" label="Shipping"></ds-step>
  <ds-step-panel for="a">Content A</ds-step-panel>
  <ds-step-panel for="b">Content B</ds-step-panel>
`

const baseline = visualBaseline(TAG)
const ssrBaseline = visualBaseline(TAG, `${TAG}.ssr.play.ts`)
const OFFSET = 'SSR: step list gets extra top/left offset before and after hydration (#326)'

const FIXME: Record<string, string> = {
  'navigation': OFFSET,
  'navigation-vertical': OFFSET,
  'colors': OFFSET,
}
// The connector lines are drawn in the browser.
const SSR_STATIC: readonly string[] = ['vertical']
const PAGE_URL = `/components/navigation/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
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

test.describe('mountSsr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, `<ds-steps>${PANELS}</ds-steps>`, renderToString, testInfo)

    const steps = new DsSteps(page.locator('ds-steps'))
    await steps.assertStepSelected('a')
    await steps.assertPanelVisible('a')
  })
})

test.describe('slot attributes', () => {
  test('server markup assigns the step slot', async () => {
    const { html } = await renderToString(`<ds-steps>${PANELS}</ds-steps>`)

    expect(html).toMatch(/<ds-step\b[^>]*\sslot="step"/)
  })
})
