import { expect, test } from '@helvetia-design/playwright'

test.describe('content links', () => {
  test('should receive the link variables like a ds-link', async ({ page }) => {
    await page.mount(`
      <div class="ds-content"><a id="content" href="#target">Content link</a></div>
      <a id="plain" class="ds-link" href="#target">Plain link</a>
    `)

    const plainColor = await page.locator('#plain').evaluate(el => getComputedStyle(el).color)

    await expect(page.locator('#content')).toHaveCSS('color', plainColor)
    await expect(page.locator('#content')).toHaveCSS('outline-style', 'none')
  })
})

test.describe('content links focus', () => {
  test('should show the same focus ring as a ds-link on keyboard focus', async ({ page }) => {
    await page.mount(`
      <a id="plain" class="ds-link" href="#target">Plain link</a>
      <div class="ds-content"><a id="content" href="#target">Content link</a></div>
    `)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })

    await page.keyboard.press('Tab')
    await expect(page.locator('#plain')).toBeFocused()
    const plainRing = await page.locator('#plain').evaluate(el => getComputedStyle(el).boxShadow)
    expect(plainRing).not.toBe('none')

    await page.keyboard.press('Tab')
    await expect(page.locator('#content')).toBeFocused()
    await expect(page.locator('#content')).toHaveCSS('box-shadow', plainRing)
  })
})
