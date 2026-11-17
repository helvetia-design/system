import { DsClose, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should be visible', async ({ page }) => {
    await page.mount(`
      <ds-close></ds-close>
    `)

    const dsClose = new DsClose(page.locator('ds-close'))

    await dsClose.assertToBeVisible()
  })

  test('should click', async ({ page }) => {
    await page.mount(`
      <ds-close></ds-close>
    `)

    const dsClose = new DsClose(page.locator('ds-close'))

    await dsClose.click()
  })

  test('should show its label as tooltip instead of native title', async ({ page }) => {
    await page.mount(`
      <ds-close></ds-close>
    `)

    const nativeButton = page.locator('ds-close button')
    const tooltip = page.locator('ds-close ds-tooltip')

    await expect(nativeButton).not.toHaveAttribute('title')
    await expect(tooltip).toHaveText('Schliessen')

    await nativeButton.hover()
    await expect(tooltip).toHaveAttribute('aria-hidden', 'false')
  })
})
