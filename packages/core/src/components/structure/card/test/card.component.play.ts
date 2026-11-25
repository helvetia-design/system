import {
  DsCard,
  DsCardActions,
  DsCardContent,
  DsCardHeader,
  DsCardSubtitle,
  DsCardTitle,
  expect,
  test,
} from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should render ds-card with default slot', async ({ page }) => {
    await page.mount(`
      <ds-card>Card content</ds-card>
    `)

    const dsCard = new DsCard(page.locator('ds-card'))

    await dsCard.assertToBeVisible()
    await dsCard.assertToContainText('Card content')
  })

  test('should render ds-card-title', async ({ page }) => {
    await page.mount(`
      <ds-card>
        <ds-card-title>My Title</ds-card-title>
      </ds-card>
    `)

    const dsCardTitle = new DsCardTitle(page.locator('ds-card-title'))

    await dsCardTitle.assertToBeVisible()
    await dsCardTitle.assertToContainText('My Title')
  })

  test('should render ds-card-subtitle', async ({ page }) => {
    await page.mount(`
      <ds-card>
        <ds-card-subtitle>My Subtitle</ds-card-subtitle>
      </ds-card>
    `)

    const dsCardSubtitle = new DsCardSubtitle(page.locator('ds-card-subtitle'))

    await dsCardSubtitle.assertToBeVisible()
    await dsCardSubtitle.assertToContainText('My Subtitle')
  })

  test('should render ds-card-content', async ({ page }) => {
    await page.mount(`
      <ds-card>
        <ds-card-content>My Content</ds-card-content>
      </ds-card>
    `)

    const dsCardContent = new DsCardContent(page.locator('ds-card-content'))

    await dsCardContent.assertToBeVisible()
    await dsCardContent.assertToContainText('My Content')
  })

  test('should render ds-card-actions', async ({ page }) => {
    await page.mount(`
      <ds-card>
        <ds-card-actions>
          <ds-button>OK</ds-button>
        </ds-card-actions>
      </ds-card>
    `)

    const dsCardActions = new DsCardActions(page.locator('ds-card-actions'))

    await dsCardActions.assertToBeVisible()
  })

  test('should render ds-card-header', async ({ page }) => {
    await page.mount(`
      <ds-card>
        <ds-card-header>My Header</ds-card-header>
      </ds-card>
    `)

    const dsCardHeader = new DsCardHeader(page.locator('ds-card-header'))

    await dsCardHeader.assertToBeVisible()
    await dsCardHeader.assertToContainText('My Header')
  })

  test('should apply the wide teaser class for image-teaser wide-left', async ({ page }) => {
    await page.mount(`<ds-card image-teaser="wide-left">Card content</ds-card>`)

    await expect(page.locator('ds-card')).toHaveClass(/is-image-teaser-wide-left/)
  })

  test('should apply the color class for a valid color', async ({ page }) => {
    await page.mount(`<ds-card color="yellow">Card content</ds-card>`)

    await expect(page.locator('ds-card')).toHaveClass(/(^|\s)is-yellow(\s|$)/)
  })

  test('should apply the primary class when inverted', async ({ page }) => {
    await page.mount(`<ds-card color="yellow" inverted>Card content</ds-card>`)

    await expect(page.locator('ds-card')).toHaveClass(/(^|\s)is-primary(\s|$)/)
  })

  test('should not map legacy colors', async ({ page }) => {
    await page.mount(`<ds-card color="purple-3">Card content</ds-card>`)

    await expect(page.locator('ds-card')).not.toHaveClass(/(^|\s)is-purple(\s|$)/)
  })

  test.describe('link', () => {
    test('should not render a link without href', async ({ page }) => {
      await page.mount(`<ds-card clickable>Card content</ds-card>`)

      await expect(page.locator('ds-card #link')).toHaveCount(0)
    })

    test('should render a link named after the card title', async ({ page }) => {
      await page.mount(`
        <ds-card href="/target" target="_blank" rel="noopener">
          <ds-card-header>
            <ds-card-title>My Title</ds-card-title>
          </ds-card-header>
        </ds-card>
      `)

      const link = page.getByRole('link', { name: 'My Title' })
      await expect(link).toHaveAttribute('href', '/target')
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener')
      await expect(page.locator('ds-card')).toHaveClass(/is-clickable/)
    })

    test('should prefer a11yLabel over the card title', async ({ page }) => {
      await page.mount(`
        <ds-card href="/target" a-1-1y-label="Open offer">
          <ds-card-title>My Title</ds-card-title>
        </ds-card>
      `)

      await expect(page.getByRole('link', { name: 'Open offer' })).toBeVisible()
    })

    test('should be reachable with the Tab key', async ({ page }) => {
      await page.mount(`
        <ds-card href="/target">
          <ds-card-title>My Title</ds-card-title>
        </ds-card>
      `)

      await page.keyboard.press('Tab')

      await expect(page.getByRole('link', { name: 'My Title' })).toBeFocused()
    })

    test('should keep action and header controls above the link', async ({ page }) => {
      await page.mount(`
        <ds-card href="/target">
          <ds-card-header>
            <ds-card-title>My Title</ds-card-title>
            <ds-close></ds-close>
          </ds-card-header>
          <ds-card-actions>
            <ds-button>OK</ds-button>
          </ds-card-actions>
        </ds-card>
      `)

      for (const selector of ['ds-button', 'ds-close']) {
        const box = await page.locator(selector).boundingBox()
        const hit = await page.evaluate(
          ([x, y]) => document.elementFromPoint(x, y)?.closest('ds-button, ds-close')?.tagName ?? null,
          [box!.x + box!.width / 2, box!.y + box!.height / 2],
        )
        expect(hit).toBe(selector.toUpperCase())
      }
    })
  })
})
