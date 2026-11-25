import { DsInput, DsRadio, expect, test } from '@helvetia-design/playwright'

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

  test('should fire dsFocus once when focus enters the group', async ({ page }) => {
    await page.mount(`<button data-testid="before">Before</button>${GROUP}<button data-testid="after">After</button>`)
    const group = page.locator('ds-radio-group')
    const focusSpy = await group.spyOnEvent('dsFocus')

    await page.getByTestId('before').focus()
    await page.keyboard.press('Tab')
    expect(focusSpy).toHaveReceivedEventTimes(1)

    await page.keyboard.press('ArrowDown')
    await expect(new DsRadio(page.locator('ds-radio[value="tony-stark"]')).nativeInput).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(new DsRadio(page.locator('ds-radio[value="black-widow"]')).nativeInput).toBeFocused()
    expect(focusSpy).toHaveReceivedEventTimes(1)

    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    expect(focusSpy).toHaveReceivedEventTimes(2)
  })

  test('should not swallow dsChange of a nested non-radio control', async ({ page }) => {
    await page.mount(`
      <ds-radio-group name="heroes" label="Label">
        <ds-radio value="steve-rogers">Steve Rogers</ds-radio>
        <ds-input label="Other"></ds-input>
      </ds-radio-group>
    `)
    const changeSpy = await page.spyOnEvent('dsChange')
    const input = new DsInput(page.locator('ds-input'))
    const steve = new DsRadio(page.locator('ds-radio[value="steve-rogers"]'))

    await input.fill('Peter')
    await input.blur()
    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail('Peter')

    await steve.select()
    expect(changeSpy).toHaveReceivedEventTimes(2)
    expect(changeSpy).toHaveReceivedEventDetail('steve-rogers')
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
