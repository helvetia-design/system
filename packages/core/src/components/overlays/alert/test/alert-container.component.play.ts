import { expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.mount(`<ds-alert-container type="toast"></ds-alert-container>`)
  })

  test('Should keep alerts added while removeAll is waiting', async ({ page }) => {
    const container = page.locator('ds-alert-container')

    const newId = await container.evaluate(async (el: HTMLDsAlertContainerElement) => {
      await el.addAlert({ heading: 'Old', message: 'old', duration: 'infinite' } as any)
      const removing = el.removeAll()
      const id = await el.addAlert({ heading: 'New', message: 'new', duration: 'infinite' } as any)
      await removing
      return id
    })

    expect(newId).not.toBe('')
    await expect(container.locator(`#${newId}`)).toHaveCount(1)
    await expect(container.locator('ds-toast')).toHaveCount(1)
  })
})
