import { DsContent, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should have a default slot', async ({ page }) => {
    await page.mount(`
      <ds-content>Hello World</ds-content>
    `)

    const dsContent = new DsContent(page.locator('ds-content'))

    await dsContent.assertToBeVisible()
    await dsContent.assertToContainText('Hello World')
  })

  for (const [attribute, flexDirection] of [
    ['direction="row-reverse"', 'row-reverse'],
    ['direction="column-reverse"', 'column-reverse'],
    ['layout="horizontal-reverse"', 'row-reverse'],
    ['layout="vertical-reverse"', 'column-reverse'],
  ]) {
    test(`should render ${attribute} as ${flexDirection}`, async ({ page }) => {
      await page.mount(`
        <ds-content ${attribute}><span>one</span><span>two</span></ds-content>
      `)

      await expect(page.locator('ds-content')).toHaveCSS('flex-direction', flexDirection)
    })
  }
})
