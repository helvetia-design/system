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

  test('should indent a native list by the indent token only', async ({ page }) => {
    await page.mount(`
      <ul class="unordered-list"><li>Item 1</li></ul>
      <ol class="ordered-list"><li>Item 1</li></ol>
    `)

    for (const selector of ['ul.unordered-list', 'ol.ordered-list']) {
      const list = page.locator(selector)
      const indent = await page.evaluate(() => {
        const probe = document.createElement('div')
        probe.style.marginLeft = 'var(--ds-list-native-indent)'
        document.body.append(probe)
        const value = getComputedStyle(probe).marginLeft
        probe.remove()
        return value
      })

      await expect(list).toHaveCSS('padding-inline-start', '0px')
      await expect(list).toHaveCSS('margin-top', '0px')
      await expect(list).toHaveCSS('margin-left', indent)
    }
  })
})
