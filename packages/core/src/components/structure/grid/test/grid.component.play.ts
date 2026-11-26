import { expect, test } from '@helvetia-design/playwright'

const padTop = (page: any, sel: string) =>
  page.locator(sel).evaluate((el: Element) => parseFloat(getComputedStyle(el).paddingTop))

test.describe('grid row gap', () => {
  test.use({ viewport: { width: 400, height: 800 } })

  test('should keep the column gap as vertical spacing without row-gap class', async ({ page }) => {
    await page.mount(`<div class="ds-grid"><div class="ds-col" id="c">A</div></div>`)
    await expect(page.locator('#c')).toBeVisible()
    expect(await padTop(page, '#c')).toBe(16)
  })

  test('should change vertical spacing with row-gap class but keep horizontal padding', async ({ page }) => {
    await page.mount(`<div class="ds-grid row-gap-3xl"><div class="ds-col" id="c">A</div></div>`)
    await expect(page.locator('#c')).toBeVisible()
    expect(await padTop(page, '#c')).toBeGreaterThan(16)
    await expect(page.locator('#c')).toHaveCSS('padding-left', '16px')
  })

  test('should reset the row gap in a nested grid', async ({ page }) => {
    await page.mount(`
      <div class="ds-grid row-gap-3xl"><div class="ds-col" id="o">
        <div class="ds-grid"><div class="ds-col" id="n">N</div></div>
      </div></div>`)
    await expect(page.locator('#n')).toBeVisible()
    expect(await padTop(page, '#o')).toBeGreaterThan(16)
    expect(await padTop(page, '#n')).toBe(16)
  })
})
