import { DsItem, DsList, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should not render a download attribute on a link item without download', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item variant="link" label="Open" href="/target"></ds-item>
      </ds-list>
    `)

    await expect(page.locator('ds-item a')).not.toHaveAttribute('download')
  })

  test('should render the download attribute on a link item with download', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item variant="link" label="Download" href="/file.pdf" download="file.pdf"></ds-item>
      </ds-list>
    `)

    await expect(page.locator('ds-item a')).toHaveAttribute('download', 'file.pdf')
  })

  test('should render an empty download attribute on a link item with a bare download', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item variant="link" label="Download" href="/file.pdf" download></ds-item>
      </ds-list>
    `)

    await expect(page.locator('ds-item a')).toHaveAttribute('download', '')
  })

  test('should render ds-list', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item label="Item 1"></ds-item>
      </ds-list>
    `)

    const dsList = new DsList(page.locator('ds-list'))

    await dsList.assertToBeVisible()
  })

  test('should render ds-item', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item label="Item 1"></ds-item>
      </ds-list>
    `)

    const dsItem = new DsItem(page.locator('ds-item'))

    await dsItem.assertToBeVisible()
  })

  test('should fire dsClick event on button variant', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item variant="button" label="Item 1"></ds-item>
      </ds-list>
    `)

    const dsItem = new DsItem(page.locator('ds-item'))
    const spy = await dsItem.el.spyOnEvent('dsClick')

    await dsItem.clickItem()

    expect(spy).toHaveReceivedEventTimes(1)
  })

  test('should fire dsAccordionToggle event on accordion variant', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item variant="accordion" label="Item 1">
          <span slot="accordion-content">Content</span>
        </ds-item>
      </ds-list>
    `)

    const dsItem = new DsItem(page.locator('ds-item'))
    const spy = await dsItem.el.spyOnEvent('dsAccordionToggle')

    await dsItem.clickItem()

    expect(spy).toHaveReceivedEventTimes(1)
  })

  test('should assert open and closed state on accordion variant', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item variant="accordion" label="Item 1">
          <span slot="accordion-content">Content</span>
        </ds-item>
      </ds-list>
    `)

    const dsItem = new DsItem(page.locator('ds-item'))

    await dsItem.accordion.assertToBeClosed()

    await dsItem.clickItem()

    await dsItem.accordion.assertToBeOpen()
  })

  test('should not render a focusable link on a disabled link item', async ({ page }) => {
    await page.mount(`
      <button id="before">Before</button>
      <ds-list>
        <ds-item variant="link" label="Open" href="/target" target="_blank" disabled></ds-item>
      </ds-list>
      <button id="after">After</button>
    `)

    const anchor = page.locator('ds-item a')

    await expect(anchor).not.toHaveAttribute('href')
    await expect(anchor).not.toHaveAttribute('target')
    await expect(anchor).toHaveAttribute('aria-disabled', 'true')

    await page.locator('#before').focus()
    await page.keyboard.press('Tab')

    await expect(page.locator('#after')).toBeFocused()
  })

  test('should not open a disabled accordion item', async ({ page }) => {
    await page.mount(`
      <ds-list>
        <ds-item variant="accordion" label="Item 1" disabled>
          <span slot="accordion-content">Content</span>
        </ds-item>
      </ds-list>
    `)

    const dsItem = new DsItem(page.locator('ds-item'))
    const spy = await dsItem.el.spyOnEvent('dsAccordionToggle')

    await expect(dsItem.accordion.summary).toBeDisabled()

    await dsItem.accordion.summary.dispatchEvent('click')

    await dsItem.accordion.assertToBeClosed()
    expect(spy).toHaveReceivedEventTimes(0)
  })
})
