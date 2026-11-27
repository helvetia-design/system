import { DsHint, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should render ds-hint closed by default', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>Title</ds-hint-title>
        <ds-hint-text>Body content.</ds-hint-text>
      </ds-hint>
    `)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.assertToBeClosed()
  })

  test('should have aria-haspopup="dialog" on trigger', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>Title</ds-hint-title>
        <ds-hint-text>Body.</ds-hint-text>
      </ds-hint>
    `)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await expect(dsHint.trigger).toHaveAttribute('aria-haspopup', 'dialog')
  })

  test('should use triggerLabel as aria-label on trigger', async ({ page }) => {
    await page.mount(`
      <ds-hint trigger-label="Learn more">
        <ds-hint-title>Title</ds-hint-title>
        <ds-hint-text>Body.</ds-hint-text>
      </ds-hint>
    `)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await expect(dsHint.trigger).toHaveAttribute('aria-label', 'Learn more')
  })

  test('should open on present()', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>Title</ds-hint-title>
        <ds-hint-text>Body.</ds-hint-text>
      </ds-hint>
    `)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.assertToBeClosed()

    await page.evaluate(() => (document.querySelector('ds-hint') as any).present())

    await dsHint.assertToBeOpen()
  })

  test('should close on dismiss()', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>Title</ds-hint-title>
        <ds-hint-text>Body.</ds-hint-text>
      </ds-hint>
    `)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await page.evaluate(() => (document.querySelector('ds-hint') as any).present())
    await dsHint.assertToBeOpen()

    await page.evaluate(() => (document.querySelector('ds-hint') as any).dismiss())

    await dsHint.assertToBeClosed()
  })

  test('should toggle on trigger click', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>Title</ds-hint-title>
        <ds-hint-text>Body.</ds-hint-text>
      </ds-hint>
    `)
    const dsHint = new DsHint(page.locator('ds-hint'))

    await dsHint.clickTrigger()
    await dsHint.assertToBeOpen()

    await dsHint.clickTrigger()
    await dsHint.assertToBeClosed()
  })

  test('should set aria-expanded to true when open', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>Title</ds-hint-title>
        <ds-hint-text>Body.</ds-hint-text>
      </ds-hint>
    `)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await page.evaluate(() => (document.querySelector('ds-hint') as any).present())

    await expect(dsHint.trigger).toHaveAttribute('aria-expanded', 'true')
  })

  test('should assign ds-hint-title to title slot', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>My Hint Title</ds-hint-title>
        <ds-hint-text>Body.</ds-hint-text>
      </ds-hint>
    `)
    const slotValue = await page.evaluate(() => {
      return document.querySelector('ds-hint-title')?.slot
    })
    expect(slotValue).toBe('title')
  })

  test('should render title and body content in panel', async ({ page }) => {
    await page.mount(`
      <ds-hint>
        <ds-hint-title>My Title</ds-hint-title>
        <ds-hint-text>My body text.</ds-hint-text>
      </ds-hint>
    `)
    await page.evaluate(() => (document.querySelector('ds-hint') as any).present())

    const hint = page.locator('ds-hint')
    await expect(hint.locator('ds-hint-title')).toContainText('My Title')
    await expect(hint.locator('ds-hint-text')).toContainText('My body text.')
  })

  test('should show the trigger label as tooltip on hover', async ({ page }) => {
    await page.mount(`
      <ds-hint trigger-label="More info">
        <ds-hint-text>Body</ds-hint-text>
      </ds-hint>
    `)

    const tooltip = page.locator('ds-hint ds-tooltip')
    await expect(tooltip).toHaveText('More info')

    await page.locator('ds-hint [part="trigger"]').hover()
    await expect(tooltip).toHaveAttribute('aria-hidden', 'false')
  })
})

test.describe('dialog accessible name', () => {
  test('should use label as dialog name', async ({ page }) => {
    await page.mount(`<ds-hint label="Label text">Body.</ds-hint>`)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.clickTrigger()

    await expect(page.getByRole('dialog', { name: 'Label text' })).toBeVisible()
  })

  test('should use slotted title text as dialog name', async ({ page }) => {
    await page.mount(`<ds-hint><span slot="title">Slotted title</span>Body.</ds-hint>`)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.clickTrigger()

    await expect(page.getByRole('dialog', { name: 'Slotted title' })).toBeVisible()
  })

  test('should fall back to the trigger label as dialog name', async ({ page }) => {
    await page.mount(`<ds-hint trigger-label="Learn more">Body.</ds-hint>`)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.clickTrigger()

    await expect(page.getByRole('dialog', { name: 'Learn more' })).toBeVisible()
  })

  test('should fall back to the localised trigger label as dialog name', async ({ page }) => {
    await page.mount(`<ds-hint>Body.</ds-hint>`)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.clickTrigger()

    await expect(page.getByRole('dialog', { name: 'Weitere Informationen' })).toBeVisible()
  })

  test('should name the drawer dialog on touch devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.mount(`<ds-hint label="Label text">Body.</ds-hint>`)
    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.clickTrigger()

    await expect(page.locator('ds-hint ds-drawer')).toBeAttached()
    await expect(page.getByRole('dialog', { name: 'Label text' })).toBeVisible()
  })
})
