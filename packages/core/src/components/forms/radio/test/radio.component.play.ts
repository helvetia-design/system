import { DsPage, DsRadio, expect, getFormEntries, resetForm, test } from '@helvetia-design/playwright'

const GROUP = `
  <ds-radio-group name="heroes" label="Label">
    <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
    <ds-radio value="tony-stark">Tony Stark</ds-radio>
    <ds-radio value="black-widow">Black Widow</ds-radio>
  </ds-radio-group>
`

test.describe('dsChange', () => {
  test('should fire dsChange with true when selected', async ({ page }) => {
    await page.mount(`<ds-radio value="option-1">Option 1</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))
    const changeSpy = await radio.el.spyOnEvent('dsChange')

    await radio.select()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(true)
  })
})

test.describe('dsFocus and dsBlur', () => {
  test('should fire dsFocus on focus', async ({ page }) => {
    await page.mount(`<ds-radio value="option-1">Option 1</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))
    const focusSpy = await radio.el.spyOnEvent('dsFocus')

    await radio.nativeInput.focus()

    expect(focusSpy).toHaveReceivedEventTimes(1)
  })

  test('should fire dsBlur on blur', async ({ page }) => {
    await page.mount(`<ds-radio value="option-1">Option 1</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))
    const blurSpy = await radio.el.spyOnEvent('dsBlur')

    await radio.nativeInput.focus()
    await radio.nativeInput.blur()

    expect(blurSpy).toHaveReceivedEventTimes(1)
  })
})

test.describe('disabled', () => {
  test('native input should be disabled', async ({ page }) => {
    await page.mount(`<ds-radio value="option-1" disabled>Option 1</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))
    const changeSpy = await radio.el.spyOnEvent('dsChange')

    await radio.assertToBeDisabled()
    expect(changeSpy).toHaveReceivedEventTimes(0)
  })
})

test.describe('readonly', () => {
  test('native input should be disabled when readonly', async ({ page }) => {
    await page.mount(`<ds-radio value="option-1" readonly>Option 1</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await radio.assertToBeDisabled()
  })
})

test.describe('checked', () => {
  test('should reflect checked prop', async ({ page }) => {
    await page.mount(`<ds-radio value="option-1" checked>Option 1</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await radio.assertToBeChecked()
  })

  test('should be unchecked by default', async ({ page }) => {
    await page.mount(`<ds-radio value="option-1">Option 1</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await radio.assertToBeUnchecked()
  })
})

test.describe('radio-group', () => {
  test('should fire dsChange with selected value when a radio is clicked', async ({ page }) => {
    await page.mount(GROUP)
    const group = page.locator('ds-radio-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await steve.select()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail('steve-rogers')
  })

  test('should update selected value when a different radio is clicked', async ({ page }) => {
    await page.mount(GROUP)
    const group = page.locator('ds-radio-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await steve.select()
    await tony.select()

    expect(changeSpy).toHaveReceivedEventTimes(2)
    expect(changeSpy).toHaveReceivedEventDetail('tony-stark')
  })

  test('should pre-select radio matching value prop', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label" value="tony-stark">
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark">Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await steve.assertToBeUnchecked()
    await tony.assertToBeChecked()
  })

  test('should pass disabled down to child radios', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label" disabled>
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark">Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await steve.assertToBeDisabled()
    await tony.assertToBeDisabled()
  })

  test('should keep a radio disabled that is disabled on its own', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label">
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark" disabled>Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const group = page.locator('ds-radio-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await expect(steve.nativeInput).toBeEnabled()
    await tony.assertToBeDisabled()

    await tony.el.dispatchEvent('click')

    expect(changeSpy).toHaveReceivedEventTimes(0)
    await tony.assertToBeUnchecked()
  })

  test('should restore the own disabled state of each radio when the group is enabled again', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label">
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark" disabled>Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const group = page.locator('ds-radio-group')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await group.evaluate((el: HTMLDsRadioGroupElement) => (el.disabled = true))
    await page.waitForChanges()
    await steve.assertToBeDisabled()
    await tony.assertToBeDisabled()

    await group.evaluate((el: HTMLDsRadioGroupElement) => (el.disabled = false))
    await page.waitForChanges()
    await expect(steve.nativeInput).toBeEnabled()
    await tony.assertToBeDisabled()
  })

  test('should navigate with arrow keys', async ({ page }) => {
    await page.mount(GROUP)
    const group = page.locator('ds-radio-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await steve.nativeInput.focus()
    await page.keyboard.press('ArrowDown')

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail('tony-stark')
  })

  test('should skip a readonly radio on arrow key navigation', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label">
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark" readonly>Tony Stark</ds-radio>
        <ds-radio value="black-widow">Black Widow</ds-radio>
      </ds-radio-group>
    `)
    const group = page.locator('ds-radio-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await steve.nativeInput.focus()
    await page.keyboard.press('ArrowDown')

    await tony.assertToBeUnchecked()
    expect(changeSpy).toHaveReceivedEventDetail('black-widow')
  })

  test('should keep a radio readonly that is readonly on its own', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label">
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark" readonly>Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const group = page.locator('ds-radio-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await expect(steve.nativeInput).toBeEnabled()
    await tony.assertToBeDisabled()

    await tony.el.dispatchEvent('click')

    expect(changeSpy).toHaveReceivedEventTimes(0)
    await tony.assertToBeUnchecked()
  })

  test('should restore the own readonly state of each radio when the group is editable again', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label" readonly>
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark" readonly>Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const group = page.locator('ds-radio-group')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))

    await steve.assertToBeDisabled()
    await tony.assertToBeDisabled()

    await group.evaluate((el: HTMLDsRadioGroupElement) => (el.readonly = false))
    await page.waitForChanges()
    await expect(steve.nativeInput).toBeEnabled()
    await tony.assertToBeDisabled()
  })

  test('should prevent page scrolling on arrow keys', async ({ page }) => {
    await page.mount(GROUP)
    const steve = page.locator('ds-radio[value="steve-rogers"]')

    const defaultPrevented = await steve.evaluate(el => {
      const ev = new KeyboardEvent('keydown', { code: 'ArrowDown', bubbles: true, cancelable: true })
      el.dispatchEvent(ev)
      return ev.defaultPrevented
    })

    expect(defaultPrevented).toBe(true)
  })

  test('should not change the value via keyboard when readonly', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label" value="steve-rogers" readonly>
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark">Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const group = page.locator('ds-radio-group')
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = page.locator('ds-radio[value="steve-rogers"]')
    const tony = page.locator('ds-radio[value="tony-stark"]')

    await steve.dispatchEvent('keydown', { code: 'ArrowDown', bubbles: true })
    await tony.dispatchEvent('keydown', { code: 'Space', bubbles: true })

    expect(changeSpy).toHaveReceivedEventTimes(0)
    await expect(group).toHaveJSProperty('value', 'steve-rogers')
  })

  test('should select the focused radio on space when allowEmptySelection and value is null', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label" allow-empty-selection>
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-radio value="tony-stark">Tony Stark</ds-radio>
      </ds-radio-group>
    `)
    const group = page.locator('ds-radio-group')
    await group.evaluate((el: HTMLDsRadioGroupElement) => (el.value = null))
    const changeSpy = await group.spyOnEvent('dsChange')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await steve.nativeInput.focus()
    await page.keyboard.press('Space')

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail('steve-rogers')

    await page.keyboard.press('Space')

    expect(changeSpy).toHaveReceivedEventTimes(2)
    await expect(group).toHaveJSProperty('value', undefined)
  })

  test('should fire dsBlur once focus leaves the group entirely', async ({ page }) => {
    await page.mount(`${GROUP}<button data-testid="outside">Outside</button>`)
    const group = page.locator('ds-radio-group')
    const blurSpy = await group.spyOnEvent('dsBlur')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await steve.nativeInput.focus()
    await page.getByTestId('outside').focus()

    expect(blurSpy).toHaveReceivedEventTimes(1)
  })

  test('should not fire dsBlur when focus moves between sibling radios', async ({ page }) => {
    await page.mount(GROUP)
    const group = page.locator('ds-radio-group')
    const blurSpy = await group.spyOnEvent('dsBlur')
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await steve.nativeInput.focus()
    await page.keyboard.press('ArrowDown')

    expect(blurSpy).toHaveReceivedEventTimes(0)
  })

  test('should reset to initial value on form reset', async ({ page }) => {
    await page.mount(`
      <form>
        <ds-radio-group name="heroes" label="Label" value="steve-rogers">
          <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
          <ds-radio value="tony-stark">Tony Stark</ds-radio>
        </ds-radio-group>
        <button type="reset" data-testid="reset">Reset</button>
      </form>
    `)
    const tony = new DsRadio(page.locator('ds-radio[value="tony-stark"]'))
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await tony.select()
    await tony.assertToBeChecked()

    await page.getByTestId('reset').click()
    await steve.assertToBeChecked()
    await tony.assertToBeUnchecked()
  })
})

test.describe('required attribute', () => {
  test('should treat a bare required attribute as true', async ({ page }) => {
    await page.mount(`<ds-radio required value="a">Label</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await expect(radio.el).toHaveJSProperty('required', true)
    await expect(radio.nativeInput).toHaveJSProperty('required', true)
  })

  test('should treat required="false" as false', async ({ page }) => {
    await page.mount(`<ds-radio required="false" value="a">Label</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await expect(radio.el).toHaveJSProperty('required', false)
    await expect(radio.nativeInput).toHaveJSProperty('required', false)
  })

  test('should treat required="false" on the group as false', async ({ page }) => {
    await page.mount(
      `<ds-radio-group name="heroes" label="Label" required="false"><ds-radio value="a">A</ds-radio></ds-radio-group>`,
    )

    await expect(page.locator('ds-radio-group')).toHaveJSProperty('required', false)
  })
})

test.describe('native form', () => {
  const mount = (page: DsPage, attributes = '') =>
    page.mount(`
      <form>
        <ds-radio-group ${attributes} name="heroes" label="Label" value="steve-rogers">
          <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
          <ds-radio value="tony-stark">Tony Stark</ds-radio>
          <ds-radio value="black-widow">Black Widow</ds-radio>
        </ds-radio-group>
      </form>
    `)

  test('should submit exactly one entry under the group name', async ({ page }) => {
    await mount(page)

    expect(await getFormEntries(page)).toEqual([['heroes', 'steve-rogers']])
  })

  test('should submit the selected radio after user input', async ({ page }) => {
    await mount(page)

    await new DsRadio(page.locator('ds-radio >> nth=1')).select()

    expect(await getFormEntries(page)).toEqual([['heroes', 'tony-stark']])
  })

  test('should submit after a programmatic value change', async ({ page }) => {
    await mount(page)

    await page.locator('ds-radio-group').evaluate((el: HTMLDsRadioGroupElement) => {
      el.value = 'black-widow'
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['heroes', 'black-widow']])
  })

  test('should submit no entry after deselecting with allowEmptySelection', async ({ page }) => {
    await mount(page, 'allow-empty-selection')

    await new DsRadio(page.locator('ds-radio >> nth=0')).select()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('should submit no entry after a programmatic value = undefined', async ({ page }) => {
    await mount(page)

    await page.locator('ds-radio-group').evaluate((el: HTMLDsRadioGroupElement) => {
      el.value = undefined
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('should not submit its value when the group is disabled as property', async ({ page }) => {
    await page.mount(`
      <form>
        <ds-radio-group name="heroes" label="Label" value="tony-stark">
          <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
          <ds-radio value="tony-stark">Tony Stark</ds-radio>
        </ds-radio-group>
      </form>
    `)
    const group = page.locator('ds-radio-group')
    expect(await getFormEntries(page)).toEqual([['heroes', 'tony-stark']])

    await group.evaluate((el: HTMLDsRadioGroupElement) => (el.disabled = true))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('should be disabled and not submit its value inside a disabled fieldset', async ({ page }) => {
    await page.mount(`
      <form>
        <fieldset disabled>
          <ds-radio-group name="heroes" label="Label" value="tony-stark">
            <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
            <ds-radio value="tony-stark">Tony Stark</ds-radio>
          </ds-radio-group>
        </fieldset>
      </form>
    `)
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await steve.assertToBeDisabled()
    expect(await getFormEntries(page)).toEqual([])

    await page.locator('form > fieldset').evaluate((el: HTMLFieldSetElement) => (el.disabled = false))
    await page.waitForChanges()

    await expect(steve.nativeInput).toBeEnabled()
    expect(await getFormEntries(page)).toEqual([['heroes', 'tony-stark']])
  })

  test('standalone radio should not submit its value when disabled is set as property', async ({ page }) => {
    await page.mount(`<form><ds-radio name="hero" value="steve-rogers" checked>Steve Rogers</ds-radio></form>`)
    const radio = new DsRadio(page.locator('ds-radio'))
    expect(await getFormEntries(page)).toEqual([['hero', 'steve-rogers']])

    await radio.el.evaluate((el: HTMLDsRadioElement) => (el.disabled = true))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('standalone radio should be disabled and not submit its value inside a disabled fieldset', async ({ page }) => {
    await page.mount(
      `<form><fieldset disabled><ds-radio name="hero" value="steve-rogers" checked>Steve Rogers</ds-radio></fieldset></form>`,
    )
    const radio = new DsRadio(page.locator('ds-radio'))

    await radio.assertToBeDisabled()
    expect(await getFormEntries(page)).toEqual([])

    await page.locator('form > fieldset').evaluate((el: HTMLFieldSetElement) => (el.disabled = false))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['hero', 'steve-rogers']])
  })

  test('standalone radio should submit its value only while checked', async ({ page }) => {
    await page.mount(`<form><ds-radio name="hero" value="steve-rogers">Steve Rogers</ds-radio></form>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    expect(await getFormEntries(page)).toEqual([])
    await radio.select()
    expect(await getFormEntries(page)).toEqual([['hero', 'steve-rogers']])
  })

  test('standalone radio should submit no entry after a programmatic checked = false', async ({ page }) => {
    await page.mount(`<form><ds-radio name="hero" value="steve-rogers" checked>Steve Rogers</ds-radio></form>`)

    expect(await getFormEntries(page)).toEqual([['hero', 'steve-rogers']])
    await page.locator('ds-radio').evaluate((el: HTMLDsRadioElement) => {
      el.checked = false
    })
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([])
  })

  test('should submit the initial value after form.reset()', async ({ page }) => {
    await mount(page)

    await new DsRadio(page.locator('ds-radio >> nth=1')).select()
    await resetForm(page)
    await page.waitForChanges()

    expect(await getFormEntries(page)).toEqual([['heroes', 'steve-rogers']])
  })
})

test.describe('label prop', () => {
  test('should render the label prop as accessible name', async ({ page }) => {
    await page.mount(`<ds-radio value="a" label="Option A"></ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await expect(radio.nativeInput).toHaveAccessibleName('Option A')
  })

  test('should render the label prop when the host only contains whitespace', async ({ page }) => {
    await page.mount(`<ds-radio value="a" label="Option A">
    </ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await expect(radio.nativeInput).toHaveAccessibleName('Option A')
  })

  test('should prefer slotted content over the label prop', async ({ page }) => {
    await page.mount(`<ds-radio value="a" label="Option A">Slotted</ds-radio>`)
    const radio = new DsRadio(page.locator('ds-radio'))

    await expect(radio.nativeInput).toHaveAccessibleName('Slotted')
  })
})
