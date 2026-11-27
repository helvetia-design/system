import { DsPage, DsToggle, expect, getFormEntries, resetForm, test } from '@helvetia-design/playwright'

test.describe('dsChange', () => {
  test('should fire dsChange with true when checked', async ({ page }) => {
    await page.mount(`<ds-toggle value="on">Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))
    const changeSpy = await toggle.el.spyOnEvent('dsChange')

    await toggle.check()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(true)
  })

  test('should fire dsChange with false when unchecked', async ({ page }) => {
    await page.mount(`<ds-toggle value="on" checked>Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))
    const changeSpy = await toggle.el.spyOnEvent('dsChange')

    await toggle.uncheck()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(false)
  })
})

test.describe('dsFocus and dsBlur', () => {
  test('should fire dsFocus on focus', async ({ page }) => {
    await page.mount(`<ds-toggle value="on">Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))
    const focusSpy = await toggle.el.spyOnEvent('dsFocus')

    await toggle.nativeInput.focus()

    expect(focusSpy).toHaveReceivedEventTimes(1)
  })

  test('should fire dsBlur on blur', async ({ page }) => {
    await page.mount(`<ds-toggle value="on">Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))
    const blurSpy = await toggle.el.spyOnEvent('dsBlur')

    await toggle.nativeInput.focus()
    await toggle.nativeInput.blur()

    expect(blurSpy).toHaveReceivedEventTimes(1)
  })
})

test.describe('disabled', () => {
  test('native input should be disabled', async ({ page }) => {
    await page.mount(`<ds-toggle value="on" disabled>Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))
    const changeSpy = await toggle.el.spyOnEvent('dsChange')

    await toggle.assertToBeDisabled()
    expect(changeSpy).toHaveReceivedEventTimes(0)
  })

  test('should not fire dsFocus or dsBlur when disabled', async ({ page }) => {
    await page.mount(`<ds-toggle value="on" disabled>Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))
    const focusSpy = await toggle.el.spyOnEvent('dsFocus')
    const blurSpy = await toggle.el.spyOnEvent('dsBlur')

    expect(focusSpy).toHaveReceivedEventTimes(0)
    expect(blurSpy).toHaveReceivedEventTimes(0)
  })

  test('should not submit its value when disabled is set as property', async ({ page }) => {
    await page.mount(`<form><ds-toggle name="field" value="yes" checked>Toggle</ds-toggle></form>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))
    expect(await getFormEntries(page)).toEqual([['field', 'yes']])

    await toggle.el.evaluate((el: HTMLDsToggleElement) => (el.disabled = true))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('should be disabled and not submit its value inside a disabled fieldset', async ({ page }) => {
    await page.mount(
      `<form><fieldset disabled><ds-toggle name="field" value="yes" checked>Toggle</ds-toggle></fieldset></form>`,
    )
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await toggle.assertToBeDisabled()
    expect(await getFormEntries(page)).toEqual([])

    await page.locator('fieldset').evaluate((el: HTMLFieldSetElement) => (el.disabled = false))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
  })
})

test.describe('readonly', () => {
  test('native input should be disabled when readonly', async ({ page }) => {
    await page.mount(`<ds-toggle value="on" readonly>Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await toggle.assertToBeDisabled()
  })
})

test.describe('checked', () => {
  test('should reflect checked prop', async ({ page }) => {
    await page.mount(`<ds-toggle value="on" checked>Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await toggle.assertToBeChecked()
  })

  test('should be unchecked by default', async ({ page }) => {
    await page.mount(`<ds-toggle value="on">Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await toggle.assertToBeUnchecked()
  })
})

test.describe('form reset', () => {
  test('should reset to initial checked state', async ({ page }) => {
    await page.mount(`
      <form>
        <ds-toggle name="terms" value="accepted">Accept terms</ds-toggle>
        <button type="reset" data-testid="reset">Reset</button>
      </form>
    `)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await toggle.check()
    await toggle.assertToBeChecked()

    await page.getByTestId('reset').click()
    await toggle.assertToBeUnchecked()
  })
})

test.describe('required attribute', () => {
  test('should treat a bare required attribute as true', async ({ page }) => {
    await page.mount(`<ds-toggle required>Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await expect(toggle.el).toHaveJSProperty('required', true)
    await expect(toggle.nativeInput).toHaveJSProperty('required', true)
  })

  test('should treat required="false" as false', async ({ page }) => {
    await page.mount(`<ds-toggle required="false">Toggle</ds-toggle>`)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await expect(toggle.el).toHaveJSProperty('required', false)
    await expect(toggle.nativeInput).toHaveJSProperty('required', false)
  })
})

test.describe('native form', () => {
  const mount = (page: DsPage) =>
    page.mount(`<form><ds-toggle name="field" value="yes" checked>Toggle</ds-toggle></form>`)

  test('should submit its value only while checked', async ({ page }) => {
    await mount(page)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
    await toggle.uncheck()
    expect(await getFormEntries(page)).toEqual([])
    await toggle.check()
    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
  })

  test('should submit after a programmatic checked change', async ({ page }) => {
    await mount(page)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await toggle.el.evaluate((el: HTMLDsToggleElement) => {
      el.checked = false
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('should submit its initial state after form.reset()', async ({ page }) => {
    await mount(page)
    const toggle = new DsToggle(page.locator('ds-toggle'))

    await toggle.uncheck()
    await resetForm(page)
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
  })
})
