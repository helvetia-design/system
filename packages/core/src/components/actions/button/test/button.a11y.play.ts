import { DsButton, expect, test } from '@helvetia-design/playwright'

test('basic', async ({ page, a11y }) => {
  await page.mount(`<ds-button>Button</ds-button>`)
  await a11y('ds-button')
})

test('icon only with a11yTitle', async ({ page, a11y }) => {
  await page.mount(`<ds-button icon="edit" square a-1-1y-title="Edit"></ds-button>`)
  await a11y('ds-button')
})

test.describe('colors', () => {
  const COLORS = [
    'primary',
    'secondary',
    'tertiary',
    'ghost',
    'brand-purple',
    'brand-red',
    'brand-yellow',
    'brand-green',
    'link',
    'light',
    'info',
    'success',
    'warning',
    'danger',
  ] as const
  COLORS.forEach(color => {
    test(color, async ({ page, a11y }) => {
      await page.mount(`<ds-button color="${color}">Button</ds-button>`)
      await a11y(`ds-button`)
    })
  })
})

test.describe('brand icon states', () => {
  // inline SVG: a `src` fetch blocks ds-button hydration and times out under parallel workers
  const BRAND_ICON = "<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='10'/></svg>"
  const SIZES = ['', 'lg'] as const

  SIZES.forEach(size => {
    const sizeAttr = size ? ` brand-size="${size}"` : ''

    test(`disabled ${size || 'base'}`, async ({ page, a11y }) => {
      await page.mount(`<ds-button brand-icon="${BRAND_ICON}"${sizeAttr} disabled>Label</ds-button>`)
      const button = page.getByRole('button', { name: 'Label' })

      await expect(button).toHaveAttribute('disabled')
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(button).toHaveAttribute('aria-busy', 'false')
      await expect(page.locator('ds-button ds-brand-icon')).toHaveAttribute('aria-hidden', 'true')
      await a11y('ds-button')
    })

    test(`loading ${size || 'base'}`, async ({ page, a11y }) => {
      await page.mount(`<ds-button brand-icon="${BRAND_ICON}"${sizeAttr} loading>Label</ds-button>`)
      const button = page.getByRole('button')

      // exact name proves the spinner's "Loading" label no longer leaks into it
      await expect(button).toHaveAccessibleName('Label')
      // toBeDisabled() also passes on aria-disabled, so assert the native attribute directly
      await expect(button).not.toHaveAttribute('disabled')
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await expect(button).toHaveAttribute('aria-busy', 'true')
      await expect(page.locator('ds-button ds-brand-icon')).toBeHidden()
      await expect(page.locator('ds-button ds-brand-icon')).toHaveAttribute('aria-hidden', 'true')
      await a11y('ds-button')
    })
  })
})

test.describe('loading', () => {
  test('text button', async ({ page, a11y }) => {
    await page.mount(`<ds-button loading>Save</ds-button>`)

    await expect(page.getByRole('button')).toHaveAccessibleName('Save')
    await expect(page.locator('ds-button ds-spinner')).toHaveAttribute('aria-hidden', 'true')
    await a11y('ds-button')
  })

  test('icon only with a11yTitle', async ({ page, a11y }) => {
    await page.mount(`<ds-button icon="edit" square a-1-1y-title="Edit" loading></ds-button>`)

    await expect(page.getByRole('button')).toHaveAccessibleName('Edit')
    await a11y('ds-button')
  })
})

test.describe('live region', () => {
  test('exists and is empty while idle', async ({ page }) => {
    await page.mount(`<ds-button>Save</ds-button>`)
    const status = page.locator('ds-button').getByRole('status')

    await expect(status).toHaveCount(1)
    await expect(status).toHaveText('')
  })

  test('gets the loading text when loading starts on a focused button, cleared when it ends', async ({ page }) => {
    await page.mount(`<ds-button>Save</ds-button>`)
    const host = page.locator('ds-button')
    const status = host.getByRole('status')

    await page.keyboard.press('Tab')
    await expect(page.getByRole('button')).toBeFocused()

    await host.evaluate((el: HTMLDsButtonElement) => (el.loading = true))
    // "<name>, <loading text>"; default config language is de
    await expect(status).toHaveText('Save, Laden')
    await expect(page.getByRole('button')).toBeFocused()

    await host.evaluate((el: HTMLDsButtonElement) => (el.loading = false))
    await expect(status).toHaveText('')
  })

  test('icon only with a11yTitle prefixes the title', async ({ page }) => {
    await page.mount(`<ds-button icon="edit" square a-1-1y-title="Edit"></ds-button>`)
    const host = page.locator('ds-button')

    await host.evaluate((el: HTMLDsButtonElement) => (el.loading = true))
    await expect(host.getByRole('status')).toHaveText('Edit, Laden')
  })
})

test.describe('keyboard', () => {
  test('focus stays on the button when loading starts', async ({ page }) => {
    await page.mount(`<ds-button>Save</ds-button>`)
    const button = page.getByRole('button', { name: 'Save' })

    await page.keyboard.press('Tab')
    await expect(button).toBeFocused()
    await page.locator('ds-button').evaluate((el: HTMLDsButtonElement) => (el.loading = true))

    await expect(button).toHaveAttribute('aria-busy', 'true')
    await expect(button).toBeFocused()
  })

  test('loading button is reachable with Tab', async ({ page }) => {
    await page.mount(`<ds-button loading>Save</ds-button>`)

    await page.keyboard.press('Tab')
    await expect(page.getByRole('button')).toBeFocused()
  })

  ;['Enter', 'Space'].forEach(key => {
    test(`${key} on a loading submit button activates nothing`, async ({ page }) => {
      await page.mount(`<form><ds-button type="submit" loading>Save</ds-button></form>`)
      const clickSpy = await new DsButton(page.locator('ds-button')).el.spyOnEvent('dsClick')
      const submitSpy = await page.locator('form').spyOnEvent('submit')

      await page.keyboard.press('Tab')
      await expect(page.getByRole('button')).toBeFocused()
      await page.keyboard.press(key)

      expect(clickSpy).toHaveReceivedEventTimes(0)
      expect(submitSpy).toHaveReceivedEventTimes(0)
    })
  })
})
