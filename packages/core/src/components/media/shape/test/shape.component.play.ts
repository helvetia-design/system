import { DsShape, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should be visible', async ({ page }) => {
    await page.mount(`
      <ds-shape></ds-shape>
    `)

    const dsShape = new DsShape(page.locator('ds-shape'))

    await dsShape.assertToBeVisible()
  })

  test('should expose the svg as part="shape"', async ({ page }) => {
    await page.mount(`
      <ds-shape></ds-shape>
    `)

    await expect(page.locator('ds-shape svg[part="shape"]')).toHaveCount(1)
  })
})
