import { DsAccordion, DsList, E2ELocator, expect, test } from '@helvetia-design/playwright'

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

  test.describe('list', () => {
    const row = (group = '', open = false) => `
      <li>
        <ds-accordion list ${group ? `group="${group}"` : ''} ${open ? 'open' : ''}>
          <span slot="summary">Row</span>
          <span slot="content">Content</span>
        </ds-accordion>
      </li>`

    test('should render rows inside ds-list', async ({ page }) => {
      await page.mount(`<ds-list>${row()}${row()}</ds-list>`)

      await new DsList(page.locator('ds-list')).assertToBeVisible()
      await expect(page.locator('ds-list > li > ds-accordion[list]')).toHaveCount(2)
    })

    test('should start closed and open on summary click', async ({ page }) => {
      await page.mount(`<ds-list>${row()}</ds-list>`)
      const dsAccordion = new DsAccordion(page.locator('ds-accordion'))

      await dsAccordion.assertToBeClosed()
      await dsAccordion.clickSummary()
      await dsAccordion.assertToBeOpen()
      await dsAccordion.clickSummary()
      await dsAccordion.assertToBeClosed()
    })

    test('should fire dsToggle once per click', async ({ page }) => {
      await page.mount(`<ds-list>${row()}</ds-list>`)
      const dsAccordion = new DsAccordion(page.locator('ds-accordion'))
      const spy = await dsAccordion.el.spyOnEvent('dsToggle')

      await dsAccordion.clickSummary()

      expect(spy).toHaveReceivedEventTimes(1)
    })

    test('should fire dsOpened on open and dsClosed on close', async ({ page }) => {
      await page.mount(`<ds-list>${row()}</ds-list>`)
      const dsAccordion = new DsAccordion(page.locator('ds-accordion'))
      const opened = await dsAccordion.el.spyOnEvent('dsOpened')
      const closed = await dsAccordion.el.spyOnEvent('dsClosed')

      await dsAccordion.clickSummary()
      expect(opened).toHaveReceivedEventTimes(1)
      expect(closed).toHaveReceivedEventTimes(0)

      await dsAccordion.clickSummary()
      expect(opened).toHaveReceivedEventTimes(1)
      expect(closed).toHaveReceivedEventTimes(1)
    })

    test('should honour the open attribute', async ({ page }) => {
      await page.mount(`<ds-list>${row('', true)}</ds-list>`)

      await new DsAccordion(page.locator('ds-accordion')).assertToBeOpen()
    })

    test('should close the other row of the same group when one opens', async ({ page }) => {
      await page.mount(`<ds-list>${row('faq')}${row('faq')}</ds-list>`)
      const first = new DsAccordion(page.locator('ds-accordion').nth(0) as E2ELocator)
      const second = new DsAccordion(page.locator('ds-accordion').nth(1) as E2ELocator)

      await first.clickSummary()
      await first.assertToBeOpen()

      await second.clickSummary()
      await second.assertToBeOpen()
      await first.assertToBeClosed()
    })

    test('should keep rows of different groups open together', async ({ page }) => {
      await page.mount(`<ds-list>${row('a')}${row('b')}</ds-list>`)
      const first = new DsAccordion(page.locator('ds-accordion').nth(0) as E2ELocator)
      const second = new DsAccordion(page.locator('ds-accordion').nth(1) as E2ELocator)

      await first.clickSummary()
      await second.clickSummary()

      await first.assertToBeOpen()
      await second.assertToBeOpen()
    })

    const nested = `
      <ds-list>
        <li>
          <ds-accordion list>
            <span slot="summary">Parent</span>
            <section slot="content">
              <ds-list>
                <li>
                  <ds-accordion list>
                    <span slot="summary">Child</span>
                    <span slot="content">Child content</span>
                  </ds-accordion>
                </li>
              </ds-list>
            </section>
          </ds-accordion>
        </li>
      </ds-list>`

    test('should open a nested row without closing its parent', async ({ page }) => {
      await page.mount(nested)
      const parent = new DsAccordion(page.locator('ds-accordion').nth(0) as E2ELocator)
      const child = new DsAccordion(page.locator('ds-accordion').nth(1) as E2ELocator)

      await parent.clickSummary()
      await parent.assertToBeOpen()

      // the child row lives inside the parent's content slot, not beside it
      await expect(page.locator('ds-list')).toHaveCount(2)
      await expect(page.locator('ds-accordion > section[slot="content"] ds-accordion')).toHaveCount(1)
      await expect(page.locator('ds-list > li > ds-accordion > section ds-list > li')).toHaveCount(1)
      await expect(page.locator('ds-list > li')).toHaveCount(2) // outer row + nested row, none are siblings of the outer row
      await expect(page.locator('ds-list').first().locator(':scope > li')).toHaveCount(1)

      await child.clickSummary()
      await child.assertToBeOpen()
      await parent.assertToBeOpen()
    })

    test('should keep the nested row state when the parent closes and reopens', async ({ page }) => {
      await page.mount(nested)
      const parent = new DsAccordion(page.locator('ds-accordion').nth(0) as E2ELocator)
      const child = new DsAccordion(page.locator('ds-accordion').nth(1) as E2ELocator)

      await parent.clickSummary()
      await child.clickSummary()
      await parent.clickSummary()
      await parent.assertToBeClosed()
      await parent.clickSummary()

      await child.assertToBeOpen()
    })

    test('should expose list semantics with one listitem per row', async ({ page }) => {
      await page.mount(`<ds-list>${row()}${row()}${row()}</ds-list>`)

      await expect(page.getByRole('list')).toHaveCount(1)
      await expect(page.getByRole('listitem')).toHaveCount(3)
    })
  })
})
