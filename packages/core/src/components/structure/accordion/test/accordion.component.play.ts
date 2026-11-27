import { DsAccordion, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should render ds-accordion', async ({ page }) => {
    await page.mount(`
      <ds-accordion>
        <span slot="summary">Title</span>
        <span slot="content">Content</span>
      </ds-accordion>
    `)

    const dsAccordion = new DsAccordion(page.locator('ds-accordion'))

    await dsAccordion.assertToBeVisible()
  })

  test('should fire dsToggle event', async ({ page }) => {
    await page.mount(`
      <ds-accordion>
        <span slot="summary">Title</span>
        <span slot="content">Content</span>
      </ds-accordion>
    `)

    const dsAccordion = new DsAccordion(page.locator('ds-accordion'))
    const spy = await dsAccordion.el.spyOnEvent('dsToggle')

    await dsAccordion.clickSummary()

    expect(spy).toHaveReceivedEventTimes(1)
  })

  test('should emit dsToggle and dsClosed when closed by another accordion in the group', async ({ page }) => {
    await page.mount(`
      <ds-accordion id="a" group="g" open>
        <span slot="summary">A</span>
        <span slot="content">Content A</span>
      </ds-accordion>
      <ds-accordion id="b" group="g">
        <span slot="summary">B</span>
        <span slot="content">Content B</span>
      </ds-accordion>
    `)

    const a = new DsAccordion(page.locator('ds-accordion#a'))
    const b = new DsAccordion(page.locator('ds-accordion#b'))
    const toggleSpy = await a.el.spyOnEvent('dsToggle')
    const closedSpy = await a.el.spyOnEvent('dsClosed')

    await b.clickSummary()

    expect(toggleSpy).toHaveReceivedEventTimes(1)
    expect(closedSpy).toHaveReceivedEventTimes(1)
    await expect(a.el).not.toHaveAttribute('open', '')
  })

  test('should fire dsOpened event', async ({ page }) => {
    await page.mount(`
      <ds-accordion>
        <span slot="summary">Title</span>
        <span slot="content">Content</span>
      </ds-accordion>
    `)

    const dsAccordion = new DsAccordion(page.locator('ds-accordion'))
    const spy = await dsAccordion.el.spyOnEvent('dsOpened')

    await dsAccordion.clickSummary()

    expect(spy).toHaveReceivedEventTimes(1)
  })

  test('should assert open and closed state', async ({ page }) => {
    await page.mount(`
      <ds-accordion>
        <span slot="summary">Title</span>
        <span slot="content">Content</span>
      </ds-accordion>
    `)

    const dsAccordion = new DsAccordion(page.locator('ds-accordion'))

    await dsAccordion.assertToBeClosed()

    await dsAccordion.clickSummary()

    await dsAccordion.assertToBeOpen()
  })

  test('should fire dsClosed event', async ({ page }) => {
    await page.mount(`
      <ds-accordion>
        <span slot="summary">Title</span>
        <span slot="content">Content</span>
      </ds-accordion>
    `)

    const dsAccordion = new DsAccordion(page.locator('ds-accordion'))
    const spy = await dsAccordion.el.spyOnEvent('dsClosed')

    await dsAccordion.clickSummary() // open
    await dsAccordion.clickSummary() // close

    expect(spy).toHaveReceivedEventTimes(1)
  })

  test('should not close on click once disabled', async ({ page }) => {
    await page.mount(`
      <ds-accordion open>
        <span slot="summary">Title</span>
        <span slot="content">Content</span>
      </ds-accordion>
    `)

    const dsAccordion = new DsAccordion(page.locator('ds-accordion'))
    const spy = await dsAccordion.el.spyOnEvent('dsToggle')
    await dsAccordion.assertToBeOpen()

    await dsAccordion.el.evaluate((el: HTMLDsAccordionElement) => (el.disabled = true))
    await page.waitForChanges()

    await expect(dsAccordion.summary).toBeDisabled()
    await dsAccordion.summary.dispatchEvent('click')

    await dsAccordion.assertToBeOpen()
    expect(spy).toHaveReceivedEventTimes(0)
  })
})
