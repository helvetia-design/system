import { DsLabel, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should have a default slot', async ({ page }) => {
    await page.mount(`
      <ds-label>My Label</ds-label>
    `)

    const dsLabel = new DsLabel(page.locator('ds-label'))

    await dsLabel.assertToBeVisible()
    await dsLabel.assertToContainText('My Label')
  })
})

test.describe('required attribute', () => {
  test('should treat required="false" as false', async ({ page }) => {
    await page.mount(`<ds-label required="false">Label</ds-label>`)
    const label = new DsLabel(page.locator('ds-label'))

    await expect(label.el).toHaveJSProperty('required', false)
  })
})
