import { DsButton, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should have a default slot', async ({ page }) => {
    await page.mount(`
      <ds-button>Click me</ds-button>
    `)

    const dsButton = new DsButton(page.locator('ds-button'))

    await dsButton.assertToBeVisible()
    await dsButton.assertToContainText('Click me')
  })

  test('should fire dsClick event', async ({ page }) => {
    await page.mount(`
      <ds-button>Click me</ds-button>
    `)

    const dsButton = new DsButton(page.locator('ds-button'))
    const spy = await dsButton.el.spyOnEvent('dsClick')

    await dsButton.click()

    expect(spy).toHaveReceivedEventTimes(1)
  })

  test('should not fire dsClick when disabled', async ({ page }) => {
    await page.mount(`
      <ds-button disabled>Disabled</ds-button>
    `)
    const dsButton = new DsButton(page.locator('ds-button'))
    const spy = await dsButton.el.spyOnEvent('dsClick')

    await dsButton.assertToBeDisabled()

    expect(spy).toHaveReceivedEventTimes(0)
  })

  test('should forward a11yCurrent as aria-current to the native button', async ({ page }) => {
    await page.mount(`
      <ds-button a-1-1y-current="page">Home</ds-button>
    `)

    await expect(page.locator('ds-button button')).toHaveAttribute('aria-current', 'page')
  })

  test('should update aria-current when a11yCurrent changes', async ({ page }) => {
    await page.mount(`
      <ds-button a-1-1y-current="page">Home</ds-button>
    `)

    const dsButton = page.locator('ds-button')
    const nativeButton = page.locator('ds-button button')

    await dsButton.evaluate((el: HTMLDsButtonElement) => {
      el.a11yCurrent = ''
    })
    await page.waitForChanges()

    await expect(nativeButton).not.toHaveAttribute('aria-current')

    await dsButton.evaluate((el: HTMLDsButtonElement) => {
      el.a11yCurrent = 'page'
    })
    await page.waitForChanges()

    await expect(nativeButton).toHaveAttribute('aria-current', 'page')
  })

  test('should inherit aria-current from the host', async ({ page }) => {
    await page.mount(`
      <ds-button aria-current="page">Home</ds-button>
    `)

    await expect(page.locator('ds-button button')).toHaveAttribute('aria-current', 'page')
  })

  test('should let a11yCurrent override an inherited aria-current', async ({ page }) => {
    await page.mount(`
      <ds-button aria-current="page">Home</ds-button>
    `)

    const dsButton = page.locator('ds-button')
    const nativeButton = page.locator('ds-button button')

    await expect(dsButton).not.toHaveAttribute('aria-current')

    await dsButton.evaluate((el: HTMLDsButtonElement) => {
      el.a11yCurrent = ''
    })
    await page.waitForChanges()

    await expect(nativeButton).not.toHaveAttribute('aria-current')

    await dsButton.evaluate((el: HTMLDsButtonElement) => {
      el.a11yCurrent = 'step'
    })
    await page.waitForChanges()

    await expect(nativeButton).toHaveAttribute('aria-current', 'step')
  })

  test('should forward a11yCurrent to the native link', async ({ page }) => {
    await page.mount(`
      <ds-button href="/home" a-1-1y-current="page">Home</ds-button>
    `)

    await expect(page.locator('ds-button a')).toHaveAttribute('aria-current', 'page')
  })

  test('should show a11yTitle as tooltip instead of native title', async ({ page }) => {
    await page.mount(`
      <ds-button icon="edit" square a-1-1y-title="Edit"></ds-button>
    `)

    const nativeButton = page.locator('ds-button button')
    const tooltip = page.locator('ds-button ds-tooltip')

    await expect(nativeButton).not.toHaveAttribute('title')
    await expect(nativeButton).toHaveAttribute('aria-label', 'Edit')
    await expect(tooltip).toHaveText('Edit')
    await expect(tooltip).toHaveAttribute('aria-hidden', 'true')

    await nativeButton.hover()
    await expect(tooltip).toHaveAttribute('aria-hidden', 'false')
  })

  test('should forward tooltipPlacement to the tooltip', async ({ page }) => {
    await page.mount(`
      <ds-button icon="edit" square a-1-1y-title="Edit" tooltip-placement="top"></ds-button>
    `)

    await expect(page.locator('ds-button ds-tooltip')).toHaveJSProperty('placement', 'top')
  })

  test('should not render a tooltip without a11yTitle', async ({ page }) => {
    await page.mount(`
      <ds-button>Click me</ds-button>
    `)

    await expect(page.locator('ds-button ds-tooltip')).toHaveCount(0)
  })
})
