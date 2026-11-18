import { DsDivider, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should be visible', async ({ page }) => {
    await page.mount(`
      <ds-divider></ds-divider>
    `)

    const dsDivider = new DsDivider(page.locator('ds-divider'))

    await dsDivider.assertToBeVisible()
  })

  for (const color of ['primary', 'secondary', 'default']) {
    test(`inverted ${color} uses its inverted token`, async ({ page }) => {
      await page.mount(`<ds-divider color="${color}" inverted></ds-divider>`)

      await expect(page.locator('ds-divider')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    })
  }
})
