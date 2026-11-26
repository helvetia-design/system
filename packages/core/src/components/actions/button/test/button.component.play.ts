import { DsButton, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should not render a download attribute on a link without download', async ({ page }) => {
    await page.mount(`
      <ds-button href="/target">Open</ds-button>
    `)

    await expect(page.locator('ds-button a')).not.toHaveAttribute('download')
  })

  test('should render the download attribute on a link with download', async ({ page }) => {
    await page.mount(`
      <ds-button href="/file.pdf" download="file.pdf">Download</ds-button>
    `)

    await expect(page.locator('ds-button a')).toHaveAttribute('download', 'file.pdf')
  })

  test('should render an empty download attribute on a link with a bare download', async ({ page }) => {
    await page.mount(`
      <ds-button href="/file.pdf" download>Download</ds-button>
    `)

    await expect(page.locator('ds-button a')).toHaveAttribute('download', '')
  })

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

  test('should disable the nested brand icon when disabled', async ({ page }) => {
    await page.mount(`
      <ds-button brand-icon="/assets/images/brand-icons/car-tangerine.svg" disabled>Label</ds-button>
    `)

    await expect(page.locator('ds-button ds-brand-icon')).toHaveClass(/is-disabled/)
  })

  test('should not disable the nested brand icon when enabled', async ({ page }) => {
    await page.mount(`
      <ds-button brand-icon="/assets/images/brand-icons/car-tangerine.svg">Label</ds-button>
    `)

    await expect(page.locator('ds-button ds-brand-icon')).not.toHaveClass(/is-disabled/)
  })

  test('should show spinner instead of the brand icon when loading', async ({ page }) => {
    await page.mount(`
      <ds-button brand-icon="/assets/images/brand-icons/car-tangerine.svg" loading>Label</ds-button>
    `)

    await expect(page.locator('ds-button ds-spinner')).toBeVisible()
    await expect(page.locator('ds-button ds-brand-icon')).toBeHidden()
    await expect(page.locator('ds-button')).toContainText('Label')
    await expect(page.locator('ds-button button')).not.toHaveAttribute('disabled')
    await expect(page.locator('ds-button button')).toHaveAttribute('aria-disabled', 'true')
  })

  test('should keep focus when loading starts', async ({ page }) => {
    await page.mount(`<ds-button>Label</ds-button>`)
    const button = page.locator('ds-button button')
    await button.focus()
    await page.locator('ds-button').evaluate((el: HTMLDsButtonElement) => (el.loading = true))

    await expect(button).toBeFocused()
  })

  test('should announce loading in a live region outside the native button', async ({ page }) => {
    await page.mount(`<ds-button>Label</ds-button>`)
    const region = page.locator('ds-button [role="status"]')
    await expect(region).toBeEmpty()

    await page.locator('ds-button').evaluate((el: HTMLDsButtonElement) => (el.loading = true))

    await expect(region).toHaveText(/^Label, \S+$/)
    await expect(page.locator('ds-button button [role="status"]')).toHaveCount(0)
  })

  test('should skip aria-hidden text and collapse whitespace in the loading announcement', async ({ page }) => {
    await page.mount(`<ds-button loading>Save <span aria-hidden="true">★</span>\n  now</ds-button>`)

    await expect(page.locator('ds-button [role="status"]')).toHaveText(/^Save now, \S+$/)
  })

  test('should not emit dsClick or submit the form when loading', async ({ page }) => {
    await page.mount(`<form><ds-button type="submit" loading>Save</ds-button></form>`)
    const dsButton = new DsButton(page.locator('ds-button'))
    const clickSpy = await dsButton.el.spyOnEvent('dsClick')
    const submitSpy = await page.locator('form').spyOnEvent('submit')

    await page.locator('ds-button button').click({ force: true })

    expect(clickSpy).toHaveReceivedEventTimes(0)
    expect(submitSpy).toHaveReceivedEventTimes(0)
  })

  test('should not navigate or emit dsNavigate when loading with an href', async ({ page }) => {
    await page.mount(`<ds-button href="#target" loading>Open</ds-button>`)
    const dsButton = new DsButton(page.locator('ds-button'))
    const navigateSpy = await dsButton.el.spyOnEvent('dsNavigate')

    await page.locator('ds-button a').click({ force: true })

    expect(navigateSpy).toHaveReceivedEventTimes(0)
    expect(new URL(page.url()).hash).toBe('')
  })
})
