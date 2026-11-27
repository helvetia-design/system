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

test.describe('mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('should name the collapsed button after the heading', async ({ page }) => {
    await page.mount(`<ds-snackbar heading="My Snackbar">Content</ds-snackbar>`)

    await expect(page.getByRole('button', { name: 'My Snackbar' })).toBeVisible()
  })

  test('should fall back to the localised text without heading', async ({ page }) => {
    await page.mount(`<ds-snackbar>Content</ds-snackbar>`)

    await expect(page.getByRole('button', { name: 'Benachrichtigung anzeigen' })).toBeVisible()
  })

  test('should use the configured language for the fallback text', async ({ page }) => {
    await page.mount(`<ds-root language="en"><ds-snackbar>Content</ds-snackbar></ds-root>`)

    await expect(page.getByRole('button', { name: 'Show notification' })).toBeVisible()
  })

  test('should expose the message to assistive technology while collapsed', async ({ page }) => {
    await page.mount(`<ds-snackbar heading="My Snackbar">Collapsed message</ds-snackbar>`)

    await expect(page.getByRole('button', { name: 'My Snackbar' })).toBeVisible()
    await expect(page.locator('ds-snackbar')).toMatchAriaSnapshot(`
      - button "My Snackbar"
      - text: Collapsed message
    `)
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
