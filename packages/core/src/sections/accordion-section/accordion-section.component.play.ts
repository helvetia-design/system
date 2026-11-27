import { DsAccordion, expect, test } from '@helvetia-design/playwright'

const URL = '/sections/accordion-section/accordion-section.visual.html'

const section = (page: any, id: 'default' | 'open') => page.getByTestId(id)

// Width of the column content box (column width minus horizontal padding).
const columnContentWidth = (page: any, id: 'default' | 'open') =>
  section(page, id)
    .locator('.ds-col')
    .nth(1)
    .evaluate((el: Element) => {
      const s = getComputedStyle(el)
      return el.getBoundingClientRect().width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
    })

const boxOf = (loc: any) => loc.evaluate((el: Element) => el.getBoundingClientRect().toJSON())

for (const width of [1440, 400]) {
  test.describe(`list width @ ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('should fill its grid column', async ({ page }) => {
      await page.goto(URL)
      const list = section(page, 'default').locator('ds-list')
      await expect(list).toBeVisible()
      const content = await columnContentWidth(page, 'default')
      const { width: listWidth } = await boxOf(list)
      expect(Math.abs(listWidth - content)).toBeLessThanOrEqual(1)
    })
  })
}

test.describe('grid breakpoint', () => {
  test('should stack the columns below 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 900 })
    await page.goto(URL)
    const cols = section(page, 'default').locator('.ds-col')
    await expect(cols.nth(1)).toBeVisible()
    const [a, b] = [await boxOf(cols.nth(0)), await boxOf(cols.nth(1))]
    expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1)
    expect(Math.abs(b.left - a.left)).toBeLessThanOrEqual(1)
  })

  test('should place the columns side by side from 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto(URL)
    const cols = section(page, 'default').locator('.ds-col')
    await expect(cols.nth(1)).toBeVisible()
    const [a, b] = [await boxOf(cols.nth(0)), await boxOf(cols.nth(1))]
    expect(Math.abs(b.top - a.top)).toBeLessThanOrEqual(1)
    expect(b.left).toBeGreaterThanOrEqual(a.right - 1)
    // one-third / half of the grid row
    const row = await boxOf(section(page, 'default').locator('.ds-grid'))
    expect(Math.abs(a.width / row.width - 1 / 3)).toBeLessThan(0.01)
    expect(Math.abs(b.width / row.width - 1 / 2)).toBeLessThan(0.01)
  })
})

test.describe('accordion items', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(URL)
  })

  test('should render closed rows 72px tall', async ({ page }) => {
    const items = section(page, 'default').locator('ds-item')
    await expect(items).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      await expect(items.nth(i).locator('[part="summary"]')).toBeVisible()
      expect((await boxOf(items.nth(i).locator('[part="summary"]'))).height).toBe(72)
    }
  })

  test('should pad the open body 16px above and below', async ({ page }) => {
    const body = section(page, 'open').locator('ds-item').first().locator('.ds-stack-content')
    await expect(body).toBeVisible()
    await expect(body).toHaveCSS('padding-top', '16px')
    await expect(body).toHaveCSS('padding-bottom', '16px')
  })

  test('should keep other items closed in the open section', async ({ page }) => {
    const items = section(page, 'open').locator('ds-item')
    await new DsAccordion(items.nth(0).locator('ds-accordion')).assertToBeOpen()
    await new DsAccordion(items.nth(1).locator('ds-accordion')).assertToBeClosed()
  })

  test('should open a closed item on trigger click', async ({ page }) => {
    const accordion = new DsAccordion(section(page, 'default').locator('ds-item').nth(1).locator('ds-accordion'))
    await accordion.assertToBeClosed()
    await accordion.clickSummary()
    await accordion.assertToBeOpen()
  })
})
