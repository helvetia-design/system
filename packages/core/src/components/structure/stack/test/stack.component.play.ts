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

  test('should stretch children to the stack width with align="stretch" in a column', async ({ page }) => {
    await page.mount(`
      <ds-stack direction="column" align="stretch" style="width: 400px">
        <div id="a">A</div><div id="b">B</div>
      </ds-stack>
    `)

    const dsStack = new DsStack(page.locator('ds-stack'))
    await dsStack.assertToBeVisible()
    const stackWidth = (await page.locator('ds-stack').boundingBox())!.width
    for (const id of ['#a', '#b']) {
      expect((await page.locator(id).boundingBox())!.width).toBeCloseTo(stackWidth, 0)
    }
  })

  test('should not stretch children without align="stretch"', async ({ page }) => {
    await page.mount(`
      <ds-stack direction="column" style="width: 400px"><div id="a">A</div></ds-stack>
    `)

    await new DsStack(page.locator('ds-stack')).assertToBeVisible()
    expect((await page.locator('#a').boundingBox())!.width).toBeLessThan(200)
  })

  test('should give children equal height with align="stretch" in a row', async ({ page }) => {
    await page.mount(`
      <ds-stack direction="row" align="stretch">
        <div id="a">A<br />two lines<br />three</div><div id="b">B</div>
      </ds-stack>
    `)

    await new DsStack(page.locator('ds-stack')).assertToBeVisible()
    const a = (await page.locator('#a').boundingBox())!.height
    const b = (await page.locator('#b').boundingBox())!.height
    expect(b).toBeCloseTo(a, 0)
    expect(a).toBeGreaterThan(40)
  })

  test('should accept stretch as align without a validation error', async ({ page }) => {
    const errors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await page.mount(`<ds-stack align="stretch"><div>A</div></ds-stack>`)

    await new DsStack(page.locator('ds-stack')).assertToBeVisible()
    expect(errors.filter(error => error.includes('must be one of'))).toEqual([])
  })
})
