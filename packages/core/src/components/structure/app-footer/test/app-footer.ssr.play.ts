import {
  DsAppFooter,
  expect,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './app-footer.variants'

const baseline = visualBaseline(TAG)
const FIXME = 'SSR: ds-app-footer server markup is 22px taller and stays taller after hydration (#326)'
const PAGE_URL = `/components/structure/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      test.fixme(true, FIXME)
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
    await mountSsr(
      page,
      `
        <ds-app-footer legal-text="Test Legal Text">
          <p>Footer Content</p>
        </ds-app-footer>
      `,
      renderToString,
      testInfo,
    )

    const footer = new DsAppFooter(page.locator('ds-app-footer'))
    await expect(footer.el).toContainText('Footer Content')
  })
})
