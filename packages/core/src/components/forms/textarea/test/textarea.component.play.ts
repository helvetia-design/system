import { DsTextarea, DsPage, expect, getFormEntries, resetForm, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should fire dsInput on fill', async ({ page }) => {
    await page.mount(`<ds-textarea label="Label"></ds-textarea>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    const inputSpy = await textarea.el.spyOnEvent('dsInput')

    await textarea.fill('hello')

    expect(inputSpy).toHaveReceivedEventTimes(1)
    expect(inputSpy).toHaveReceivedEventDetail('hello')
  })

  test('should fire dsChange with value on blur', async ({ page }) => {
    await page.mount(`<ds-textarea label="Label"></ds-textarea>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    const changeSpy = await textarea.el.spyOnEvent('dsChange')

    await textarea.fill('hello')
    await textarea.blur()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail('hello')
  })

  test('should not fire dsChange when value is unchanged on blur', async ({ page }) => {
    await page.mount(`<ds-textarea label="Label" value="hello"></ds-textarea>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    const changeSpy = await textarea.el.spyOnEvent('dsChange')

    await textarea.nativeTextarea.focus()
    await textarea.blur()

    expect(changeSpy).toHaveReceivedEventTimes(0)
  })

  test('should keep a value the app set while focused and emit it on blur', async ({ page }) => {
    await page.mount(`<ds-textarea label="Label" value="initial"></ds-textarea>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    const changeSpy = await textarea.el.spyOnEvent('dsChange')

    await textarea.nativeTextarea.focus()
    await textarea.el.evaluate((el: HTMLDsTextareaElement) => {
      el.value = 'app-set'
    })
    await page.waitForChanges()
    await textarea.blur()

    await textarea.assertValue('app-set')
    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail('app-set')
  })

  test('should not fire dsChange on blur when value was set while unfocused', async ({ page }) => {
    await page.mount(`<ds-textarea label="Label" value="initial"></ds-textarea>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    const changeSpy = await textarea.el.spyOnEvent('dsChange')

    await textarea.el.evaluate((el: HTMLDsTextareaElement) => {
      el.value = 'app-set'
    })
    await page.waitForChanges()
    await textarea.nativeTextarea.focus()
    await textarea.blur()

    expect(changeSpy).toHaveReceivedEventTimes(0)
  })
})

test.describe('disabled', () => {
  test('native textarea should be disabled', async ({ page }) => {
    await page.mount(`<ds-textarea label="Label" value="Fixed" disabled></ds-textarea>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    const inputSpy = await textarea.el.spyOnEvent('dsInput')

    await textarea.assertToBeDisabled()
    expect(inputSpy).toHaveReceivedEventTimes(0)
  })

  test('should not submit its value when disabled is set as property', async ({ page }) => {
    await page.mount(`<form><ds-textarea name="field" label="Label" value="initial"></ds-textarea></form>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    expect(await getFormEntries(page)).toEqual([['field', 'initial']])

    await textarea.el.evaluate((el: HTMLDsTextareaElement) => (el.disabled = true))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('should be disabled and not submit its value inside a disabled fieldset', async ({ page }) => {
    await page.mount(
      `<form><fieldset disabled><ds-textarea name="field" label="Label" value="initial"></ds-textarea></fieldset></form>`,
    )
    const textarea = new DsTextarea(page.locator('ds-textarea'))

    await textarea.assertToBeDisabled()
    expect(await getFormEntries(page)).toEqual([])

    await page.locator('fieldset').evaluate((el: HTMLFieldSetElement) => (el.disabled = false))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['field', 'initial']])
  })
})

test.describe('form reset', () => {
  test('should reset to initial value', async ({ page }) => {
    await page.mount(`
      <form>
        <ds-textarea name="notes" label="Notes" value="Initial value"></ds-textarea>
        <button type="reset" data-testid="reset">Reset</button>
      </form>
    `)
    const textarea = new DsTextarea(page.locator('ds-textarea'))
    const changeSpy = await textarea.el.spyOnEvent('dsChange')

    await textarea.fill('Changed value')
    await textarea.blur()
    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail('Changed value')

    await page.getByTestId('reset').click()
    await textarea.assertValue('Initial value')
  })
})

test.describe('required attribute', () => {
  test('should treat required="false" as false', async ({ page }) => {
    await page.mount(`<ds-textarea label="Label" required="false"></ds-textarea>`)
    const textarea = new DsTextarea(page.locator('ds-textarea'))

    await expect(textarea.el).toHaveJSProperty('required', false)
    await expect(textarea.nativeTextarea).toHaveJSProperty('required', false)
  })
})

test.describe('native form', () => {
  const mount = (page: DsPage) =>
    page.mount(`<form><ds-textarea name="field" label="Label" value="initial"></ds-textarea></form>`)

  test('should submit the typed value', async ({ page }) => {
    await mount(page)
    const control = new DsTextarea(page.locator('ds-textarea'))

    await control.fill('typed')
    await control.blur()

    expect(await getFormEntries(page)).toEqual([['field', 'typed']])
  })

  test('should submit a programmatic value', async ({ page }) => {
    await mount(page)
    const control = new DsTextarea(page.locator('ds-textarea'))

    await control.el.evaluate((el: HTMLElement & { value: string }) => {
      el.value = 'programmatic'
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['field', 'programmatic']])
  })

  test('should submit the initial value after form.reset()', async ({ page }) => {
    await mount(page)
    const control = new DsTextarea(page.locator('ds-textarea'))

    await control.fill('typed')
    await control.blur()
    await resetForm(page)
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['field', 'initial']])
  })
})
