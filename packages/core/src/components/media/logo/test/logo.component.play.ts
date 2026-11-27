import { DsLogo, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should be visible', async ({ page }) => {
    await page.mount(`
      <ds-logo></ds-logo>
    `)

    const dsLogo = new DsLogo(page.locator('ds-logo'))

    await dsLogo.assertToBeVisible()
  })
})

test.describe('accessible name', () => {
  test('should name the logo after the brand', async ({ page }) => {
    await page.mount(`<ds-logo brand="baloise"></ds-logo><ds-logo id="h" brand="helvetia"></ds-logo>`)

    await expect(page.locator('ds-logo').first()).toHaveRole('img')
    await expect(page.locator('ds-logo').first()).toHaveAccessibleName('Baloise')
    await expect(page.locator('#h')).toHaveAccessibleName('Helvetia')
  })

  test('should prefer a11yLabel', async ({ page }) => {
    await page.mount(`<ds-logo a-1-1y-label="Company logo"></ds-logo>`)

    await expect(page.locator('ds-logo')).toHaveAccessibleName('Company logo')
  })

  test('should keep an aria-label set on the host', async ({ page }) => {
    await page.mount(`<ds-logo brand="baloise" aria-label="Back to home"></ds-logo>`)
    await page.locator('ds-logo').evaluate((el: HTMLDsLogoElement) => (el.brand = 'helvetia'))

    await expect(page.locator('ds-logo')).toHaveAccessibleName('Back to home')
  })

  test('should prefer a11yLabel over the host aria-label', async ({ page }) => {
    await page.mount(`<ds-logo aria-label="Back to home" a-1-1y-label="Company logo"></ds-logo>`)

    await expect(page.locator('ds-logo')).toHaveAccessibleName('Company logo')
  })
})
