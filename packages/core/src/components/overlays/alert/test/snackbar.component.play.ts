import { DsSnackbar, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.mount(`
      <ds-snackbar heading="My Snackbar" action="Action" closable>This is a Snackbar content!</ds-tag>
    `)
  })

  test('Should have content', async ({ page }) => {
    const component = new DsSnackbar(page.locator('ds-snackbar'))

    await component.assertToBeVisible()
    await component.assertToHaveHeading('My Snackbar')
    await component.assertToContainText('This is a Snackbar')
  })

  test('Should fire dsCloseClick event', async ({ page }) => {
    const component = new DsSnackbar(page.locator('ds-snackbar'))
    const spy = await component.el.spyOnEvent('dsCloseClick')

    await component.clickClose()

    expect(spy).toHaveReceivedEventTimes(1)
  })

  test('Should fire dsActionClick event', async ({ page }) => {
    const component = new DsSnackbar(page.locator('ds-snackbar'))
    const spy = await component.el.spyOnEvent('dsActionClick')

    await component.clickAction('Action')

    expect(spy).toHaveReceivedEventTimes(1)
  })
})

test.describe('component with actionHref', () => {
  test('Should navigate when clicking the action', async ({ page }) => {
    await page.mount(
      `<ds-snackbar heading="My Snackbar" action="Open" action-href="#details">This is a Snackbar content!</ds-snackbar>`,
    )
    const component = new DsSnackbar(page.locator('ds-snackbar'))

    const popupPromise = page.waitForEvent('popup')

    await component.clickAction('Open')

    const popup = await popupPromise
    await expect(popup).toHaveURL(/#details$/)
  })
})
