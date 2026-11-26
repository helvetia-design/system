import { DsCheckbox, DsPage, expect, getFormEntries, resetForm, test } from '@helvetia-design/playwright'

const GROUP = `
  <ds-checkbox-group control name="heroes" label="Label">
    <ds-checkbox value="steve-rogers">Steve Rogers</ds-checkbox>
    <ds-checkbox value="tony-stark">Tony Stark</ds-checkbox>
    <ds-checkbox value="black-widow">Black Widow</ds-checkbox>
  </ds-checkbox-group>
`

test.describe('dsChange', () => {
  test('should fire dsChange with true when checked', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on">Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const changeSpy = await checkbox.el.spyOnEvent('dsChange')

    await checkbox.check()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(true)
  })

  test('should fire dsChange with false when unchecked', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on" checked>Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const changeSpy = await checkbox.el.spyOnEvent('dsChange')

    await checkbox.uncheck()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(false)
  })
})

test.describe('dsFocus and dsBlur', () => {
  test('should fire dsFocus on focus', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on">Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const focusSpy = await checkbox.el.spyOnEvent('dsFocus')

    await checkbox.nativeInput.focus()

    expect(focusSpy).toHaveReceivedEventTimes(1)
  })

  test('should fire dsBlur on blur', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on">Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const blurSpy = await checkbox.el.spyOnEvent('dsBlur')

    await checkbox.nativeInput.focus()
    await checkbox.nativeInput.blur()

    expect(blurSpy).toHaveReceivedEventTimes(1)
  })
})

test.describe('disabled', () => {
  test('native input should be disabled', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on" disabled>Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const changeSpy = await checkbox.el.spyOnEvent('dsChange')

    await checkbox.assertToBeDisabled()
    expect(changeSpy).toHaveReceivedEventTimes(0)
  })

  test('should not fire dsFocus or dsBlur when disabled', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on" disabled>Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const focusSpy = await checkbox.el.spyOnEvent('dsFocus')
    const blurSpy = await checkbox.el.spyOnEvent('dsBlur')

    expect(focusSpy).toHaveReceivedEventTimes(0)
    expect(blurSpy).toHaveReceivedEventTimes(0)
  })

  test('should not submit its value when disabled is set as property', async ({ page }) => {
    await page.mount(`<form><ds-checkbox name="terms" value="accepted" checked>Accept terms</ds-checkbox></form>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const form = page.locator('form')
    expect(await form.evaluate((el: HTMLFormElement) => new FormData(el).has('terms'))).toBe(true)

    await checkbox.el.evaluate((el: HTMLDsCheckboxElement) => (el.disabled = true))
    await page.waitForChanges()

    expect(await form.evaluate((el: HTMLFormElement) => new FormData(el).has('terms'))).toBe(false)
  })

  test('should be disabled and not submit its value inside a disabled fieldset', async ({ page }) => {
    await page.mount(
      `<form><fieldset disabled><ds-checkbox name="terms" value="accepted" checked>Accept terms</ds-checkbox></fieldset></form>`,
    )
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))
    const form = page.locator('form')

    await checkbox.assertToBeDisabled()
    expect(await form.evaluate((el: HTMLFormElement) => new FormData(el).has('terms'))).toBe(false)

    await page.locator('fieldset').evaluate((el: HTMLFieldSetElement) => (el.disabled = false))
    await page.waitForChanges()

    expect(await form.evaluate((el: HTMLFormElement) => new FormData(el).has('terms'))).toBe(true)
  })
})

test.describe('readonly', () => {
  test('native input should be disabled when readonly', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on" readonly>Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await checkbox.assertToBeDisabled()
  })
})

test.describe('checked', () => {
  test('should reflect checked prop', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on" checked>Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await checkbox.assertToBeChecked()
  })

  test('should be unchecked by default', async ({ page }) => {
    await page.mount(`<ds-checkbox value="on">Checkbox</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await checkbox.assertToBeUnchecked()
  })
})

test.describe('form reset', () => {
  test('should reset to initial unchecked state', async ({ page }) => {
    await page.mount(`
      <form>
        <ds-checkbox name="terms" value="accepted">Accept terms</ds-checkbox>
        <button type="reset" data-testid="reset">Reset</button>
      </form>
    `)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await checkbox.check()
    await checkbox.assertToBeChecked()

    await page.getByTestId('reset').click()
    await checkbox.assertToBeUnchecked()
  })
})

test.describe('checkbox-group', () => {
  test('should fire dsChange with selected values array when a checkbox is checked', async ({ page }) => {
    await page.mount(GROUP)
    const group = page.locator('ds-checkbox-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsCheckbox(page.locator('ds-checkbox[value="steve-rogers"]'))

    await steve.check()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(['steve-rogers'])
  })

  test('should accumulate values when multiple checkboxes are checked', async ({ page }) => {
    await page.mount(GROUP)
    const group = page.locator('ds-checkbox-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsCheckbox(page.locator('ds-checkbox[value="steve-rogers"]'))
    const tony = new DsCheckbox(page.locator('ds-checkbox[value="tony-stark"]'))

    await steve.check()
    await tony.check()

    expect(changeSpy).toHaveReceivedEventTimes(2)
    expect(changeSpy).toHaveReceivedEventDetail(['steve-rogers', 'tony-stark'])
  })

  test('should remove value from array when a checkbox is unchecked', async ({ page }) => {
    await page.mount(`
      <ds-checkbox-group control name="heroes" label="Label" value='steve-rogers,tony-stark'>
        <ds-checkbox value="steve-rogers">Steve Rogers</ds-checkbox>
        <ds-checkbox value="tony-stark">Tony Stark</ds-checkbox>
      </ds-checkbox-group>
    `)
    const group = page.locator('ds-checkbox-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsCheckbox(page.locator('ds-checkbox[value="steve-rogers"]'))

    await steve.uncheck()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(['tony-stark'])
  })

  test('should pass disabled down to child checkboxes', async ({ page }) => {
    await page.mount(`
      <ds-checkbox-group control name="heroes" label="Label" disabled>
        <ds-checkbox value="steve-rogers">Steve Rogers</ds-checkbox>
        <ds-checkbox value="tony-stark">Tony Stark</ds-checkbox>
      </ds-checkbox-group>
    `)
    const steve = new DsCheckbox(page.locator('ds-checkbox[value="steve-rogers"]'))
    const tony = new DsCheckbox(page.locator('ds-checkbox[value="tony-stark"]'))

    await steve.assertToBeDisabled()
    await tony.assertToBeDisabled()
  })

  test('should keep a checkbox disabled that is disabled on its own', async ({ page }) => {
    await page.mount(`
      <ds-checkbox-group control name="heroes" label="Label">
        <ds-checkbox value="steve-rogers">Steve Rogers</ds-checkbox>
        <ds-checkbox value="tony-stark" disabled>Tony Stark</ds-checkbox>
      </ds-checkbox-group>
    `)
    const group = page.locator('ds-checkbox-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsCheckbox(page.locator('ds-checkbox[value="steve-rogers"]'))
    const tony = new DsCheckbox(page.locator('ds-checkbox[value="tony-stark"]'))

    await expect(steve.nativeInput).toBeEnabled()
    await tony.assertToBeDisabled()

    await tony.el.dispatchEvent('click')

    expect(changeSpy).toHaveReceivedEventTimes(0)
    await tony.assertToBeUnchecked()
  })

  test('should restore the own disabled state of each checkbox when the group is enabled again', async ({ page }) => {
    await page.mount(`
      <ds-checkbox-group control name="heroes" label="Label">
        <ds-checkbox value="steve-rogers">Steve Rogers</ds-checkbox>
        <ds-checkbox value="tony-stark" disabled>Tony Stark</ds-checkbox>
      </ds-checkbox-group>
    `)
    const group = page.locator('ds-checkbox-group')
    const steve = new DsCheckbox(page.locator('ds-checkbox[value="steve-rogers"]'))
    const tony = new DsCheckbox(page.locator('ds-checkbox[value="tony-stark"]'))

    await group.evaluate((el: HTMLDsCheckboxGroupElement) => (el.disabled = true))
    await page.waitForChanges()
    await steve.assertToBeDisabled()
    await tony.assertToBeDisabled()

    await group.evaluate((el: HTMLDsCheckboxGroupElement) => (el.disabled = false))
    await page.waitForChanges()
    await expect(steve.nativeInput).toBeEnabled()
    await tony.assertToBeDisabled()
  })

  test('should pre-select checkboxes matching value prop', async ({ page }) => {
    await page.mount(`
      <ds-checkbox-group control name="heroes" label="Label" value="tony-stark">
        <ds-checkbox value="steve-rogers">Steve Rogers</ds-checkbox>
        <ds-checkbox value="tony-stark">Tony Stark</ds-checkbox>
      </ds-checkbox-group>
    `)
    const steve = new DsCheckbox(page.locator('ds-checkbox[value="steve-rogers"]'))
    const tony = new DsCheckbox(page.locator('ds-checkbox[value="tony-stark"]'))

    await steve.assertToBeUnchecked()
    await tony.assertToBeChecked()
  })
})

test.describe('required attribute', () => {
  test('should treat a bare required attribute as true', async ({ page }) => {
    await page.mount(`<ds-checkbox required>Label</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await expect(checkbox.el).toHaveJSProperty('required', true)
    await expect(checkbox.nativeInput).toHaveJSProperty('required', true)
  })

  test('should treat required="false" as false', async ({ page }) => {
    await page.mount(`<ds-checkbox required="false">Label</ds-checkbox>`)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await expect(checkbox.el).toHaveJSProperty('required', false)
    await expect(checkbox.nativeInput).toHaveJSProperty('required', false)
  })

  test('should treat required="false" on the group as false', async ({ page }) => {
    await page.mount(
      `<ds-checkbox-group control name="heroes" label="Label" required="false"><ds-checkbox value="a">A</ds-checkbox></ds-checkbox-group>`,
    )

    await expect(page.locator('ds-checkbox-group')).toHaveJSProperty('required', false)
  })
})

test.describe('native form', () => {
  const mountCheckbox = (page: DsPage) =>
    page.mount(`<form><ds-checkbox name="field" value="yes" checked>Checkbox</ds-checkbox></form>`)

  const mountGroup = (page: DsPage, attributes: string) =>
    page.mount(`
      <form>
        <ds-checkbox-group ${attributes} name="heroes" label="Label">
          <ds-checkbox value="steve-rogers">Steve Rogers</ds-checkbox>
          <ds-checkbox value="tony-stark">Tony Stark</ds-checkbox>
          <ds-checkbox value="black-widow">Black Widow</ds-checkbox>
        </ds-checkbox-group>
      </form>
    `)

  test('checkbox should submit its value only while checked', async ({ page }) => {
    await mountCheckbox(page)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
    await checkbox.uncheck()
    expect(await getFormEntries(page)).toEqual([])
    await checkbox.check()
    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
  })

  test('checkbox should submit after a programmatic checked change', async ({ page }) => {
    await mountCheckbox(page)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await checkbox.el.evaluate((el: HTMLDsCheckboxElement) => {
      el.checked = false
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('checkbox should submit after a programmatic checked = true', async ({ page }) => {
    await page.mount(`<form><ds-checkbox name="field" value="yes">Checkbox</ds-checkbox></form>`)

    expect(await getFormEntries(page)).toEqual([])
    await page.locator('ds-checkbox').evaluate((el: HTMLDsCheckboxElement) => {
      el.checked = true
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
  })

  test('checkbox should submit its initial state after form.reset()', async ({ page }) => {
    await mountCheckbox(page)
    const checkbox = new DsCheckbox(page.locator('ds-checkbox'))

    await checkbox.uncheck()
    await resetForm(page)
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['field', 'yes']])
  })

  test('checkbox-group should submit one entry per checked option with control', async ({ page }) => {
    await mountGroup(page, 'control value="steve-rogers,tony-stark"')

    expect(await getFormEntries(page)).toEqual([
      ['heroes', 'steve-rogers'],
      ['heroes', 'tony-stark'],
    ])
  })

  test('checkbox-group should submit one entry per checked option without control', async ({ page }) => {
    await mountGroup(page, '')
    await page.locator('ds-checkbox >> nth=0').evaluate((el: HTMLDsCheckboxElement) => (el.checked = true))
    await page.locator('ds-checkbox >> nth=1').evaluate((el: HTMLDsCheckboxElement) => (el.checked = true))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([
      ['heroes', 'steve-rogers'],
      ['heroes', 'tony-stark'],
    ])
  })

  test('checkbox-group should submit one entry per checked option after user input without control', async ({
    page,
  }) => {
    await mountGroup(page, '')

    await new DsCheckbox(page.locator('ds-checkbox >> nth=0')).check()
    await new DsCheckbox(page.locator('ds-checkbox >> nth=2')).check()

    expect(await getFormEntries(page)).toEqual([
      ['heroes', 'steve-rogers'],
      ['heroes', 'black-widow'],
    ])
  })

  test('checkbox-group should restore initially checked options after form.reset() without control', async ({
    page,
  }) => {
    await page.mount(`
      <form>
        <ds-checkbox-group name="heroes" label="Label">
          <ds-checkbox value="steve-rogers" checked>Steve Rogers</ds-checkbox>
          <ds-checkbox value="tony-stark">Tony Stark</ds-checkbox>
        </ds-checkbox-group>
      </form>
    `)

    await new DsCheckbox(page.locator('ds-checkbox >> nth=0')).uncheck()
    await new DsCheckbox(page.locator('ds-checkbox >> nth=1')).check()
    await resetForm(page)
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['heroes', 'steve-rogers']])
  })

  test('checkbox-group should submit after user input', async ({ page }) => {
    await mountGroup(page, 'control value="steve-rogers"')

    await new DsCheckbox(page.locator('ds-checkbox >> nth=2')).check()

    expect(await getFormEntries(page)).toEqual([
      ['heroes', 'steve-rogers'],
      ['heroes', 'black-widow'],
    ])
  })

  test('checkbox-group should submit after a programmatic value change', async ({ page }) => {
    await mountGroup(page, 'control value="steve-rogers"')

    await page.locator('ds-checkbox-group').evaluate((el: HTMLDsCheckboxGroupElement) => {
      el.value = ['tony-stark', 'black-widow']
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([
      ['heroes', 'tony-stark'],
      ['heroes', 'black-widow'],
    ])
  })

  test('checkbox-group should submit its initial value after form.reset()', async ({ page }) => {
    await mountGroup(page, 'control value="steve-rogers"')

    await new DsCheckbox(page.locator('ds-checkbox >> nth=2')).check()
    await resetForm(page)
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['heroes', 'steve-rogers']])
  })
})
