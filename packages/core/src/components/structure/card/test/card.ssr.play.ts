import {
  DsCard,
  DsCardActions,
  DsCardContent,
  DsCardHeader,
  DsCardSubtitle,
  DsCardTitle,
  expectScreenshot,
  mountSsr,
  setupSsrVisualTest,
  test,
  visualBaseline,
} from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'
import { TAG, VARIANTS } from './card.variants'

const baseline = visualBaseline(TAG)
const FIXME = 'SSR: ds-card server markup has extra vertical spacing from ds-heading (#326)'
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
        <ds-card>
          <ds-card-header>
            <ds-card-title>My Title</ds-card-title>
            <ds-card-subtitle>My Subtitle</ds-card-subtitle>
          </ds-card-header>
          <ds-card-content>My Content</ds-card-content>
          <ds-card-actions>
            <ds-button>Action</ds-button>
          </ds-card-actions>
        </ds-card>
      `,
      renderToString,
      testInfo,
    )

    const dsCard = new DsCard(page.locator('ds-card'))
    await dsCard.assertToBeVisible()

    const dsCardHeader = new DsCardHeader(page.locator('ds-card-header'))
    await dsCardHeader.assertToBeVisible()

    const dsCardTitle = new DsCardTitle(page.locator('ds-card-title'))
    await dsCardTitle.assertToContainText('My Title')

    const dsCardSubtitle = new DsCardSubtitle(page.locator('ds-card-subtitle'))
    await dsCardSubtitle.assertToContainText('My Subtitle')

    const dsCardContent = new DsCardContent(page.locator('ds-card-content'))
    await dsCardContent.assertToContainText('My Content')

    const dsCardActions = new DsCardActions(page.locator('ds-card-actions'))
    await dsCardActions.assertToBeVisible()
  })
})
