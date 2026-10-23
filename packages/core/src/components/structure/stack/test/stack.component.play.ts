import { DsStack, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should have a default slot', async ({ page }) => {
    await page.mount(`
      <ds-stack>Hello World</ds-stack>
    `)

    const dsStack = new DsStack(page.locator('ds-stack'))

    await dsStack.assertToBeVisible()
    await dsStack.assertToContainText('Hello World')
  })

  test('should accept 2xl as space and padding without a validation error', async ({ page }) => {
    const errors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await page.mount(`
      <ds-stack direction="row" space="2xl" p="2xl"><div>A</div><div>B</div></ds-stack>
    `)

    const dsStack = new DsStack(page.locator('ds-stack'))

    await dsStack.assertToBeVisible()
    await expect(dsStack.el).not.toHaveCSS('column-gap', '0px')
    await expect(dsStack.el).not.toHaveCSS('padding-top', '0px')
    expect(errors.filter(error => error.includes('must be one of'))).toEqual([])
  })

  test('should reject xxl as space', async ({ page }) => {
    const errors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await page.mount(`
      <ds-stack direction="row" space="xxl"><div>A</div><div>B</div></ds-stack>
    `)

    await expect.poll(() => errors.some(error => error.includes('must be one of'))).toBe(true)
  })
})
