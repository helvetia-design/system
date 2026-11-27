import { DsToast, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.mount(`
      <ds-toast heading="My Toast" action="Action" closable>This is a Toast content!</ds-toast>
      <button id="outside">Outside</button>
    `)
  })

  test('Should pause on focus and resume when focus leaves', async ({ page }) => {
    const component = new DsToast(page.locator('ds-toast'))
    const pauseSpy = await component.el.spyOnEvent('dsDidPause')
    const resumeSpy = await component.el.spyOnEvent('dsDidResume')

    await component.action.locator('button').focus()
    await expect(component.el).toHaveClass(/is-paused/)
    expect(pauseSpy).toHaveReceivedEventTimes(1)

    await page.locator('#outside').focus()
    await expect(component.el).not.toHaveClass(/is-paused/)
    expect(resumeSpy).toHaveReceivedEventTimes(1)
  })
})

test.describe('component with actionHref', () => {
  test('Should navigate when clicking the action', async ({ page }) => {
    await page.mount(
      `<ds-toast heading="My Toast" action="Open" action-href="#details">This is a Toast content!</ds-toast>`,
    )
    const component = new DsToast(page.locator('ds-toast'))

    const popupPromise = page.waitForEvent('popup')

    await component.clickAction()

    const popup = await popupPromise
    await expect(popup).toHaveURL(/#details$/)
  })
})
