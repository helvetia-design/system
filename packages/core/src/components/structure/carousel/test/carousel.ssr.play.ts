import {
  DsCarousel,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './carousel.variants'

const baseline = visualBaseline(TAG)
const ssrBaseline = visualBaseline(TAG, `${TAG}.ssr.play.ts`)
const PAGE_URL = `/components/structure/${TAG}/test/${TAG}.visual.html`

// The browser measures the overflow to show the controls, so the server markup has none.
const SSR_STATIC: readonly string[] = ['product', 'brand-icons']

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
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

const ITEMS = `
  <ds-carousel-item name="s1"><div style="height:150px">Slide 1</div></ds-carousel-item>
  <ds-carousel-item name="s2"><div style="height:150px">Slide 2</div></ds-carousel-item>
`

test.describe('mountSsr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, `<ds-carousel>${ITEMS}</ds-carousel>`, renderToString, testInfo)

    const carousel = new DsCarousel(page.locator('ds-carousel'))
    await carousel.assertItemSelected('s1')
  })
})
