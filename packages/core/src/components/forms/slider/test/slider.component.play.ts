import { DsSlider, expect, getFormEntries, test } from '@helvetia-design/playwright'

test.describe('value assigned after load', () => {
  test('should render a value that is assigned after the component has loaded', async ({ page }) => {
    await page.mount(`<ds-slider label="Label" min="0" max="100"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))

    await slider.el.evaluate((el: HTMLDsSliderElement) => {
      el.value = 75
    })
    await page.waitForChanges()

    await slider.assertValue('75')
    await expect(slider.handle).toHaveAttribute('aria-valuenow', '75.0')
  })

  test('should render a value that is re-assigned to the same number after the component has loaded', async ({
    page,
  }) => {
    await page.mount(`<ds-slider label="Label" min="0" max="100"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))

    await slider.el.evaluate((el: HTMLDsSliderElement) => {
      el.value = 75
      el.value = 75
    })
    await page.waitForChanges()

    await slider.assertValue('75')
    await expect(slider.handle).toHaveAttribute('aria-valuenow', '75.0')
  })
})

test.describe('component', () => {
  test('should fire dsInput with numeric value on fill', async ({ page }) => {
    await page.mount(`<ds-slider label="Label"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    const inputSpy = await slider.el.spyOnEvent('dsInput')

    await slider.fill('42')

    expect(inputSpy).toHaveReceivedEventTimes(1)
    expect(inputSpy).toHaveReceivedEventDetail(42)
  })

  test('should not fire dsInput on mount', async ({ page }) => {
    await page.mount(`<div id="host"></div>`)

    await page.evaluate(() => {
      const w = window as unknown as { dsInputCount: number }
      w.dsInputCount = 0
      const el = document.createElement('ds-slider')
      el.setAttribute('label', 'Label')
      el.setAttribute('value', '30')
      el.addEventListener('dsInput', () => w.dsInputCount++)
      document.getElementById('host')?.appendChild(el)
    })
    const slider = new DsSlider(page.locator('ds-slider'))
    await expect(slider.handle).toHaveAttribute('aria-valuenow', '30.0')

    expect(await page.evaluate(() => (window as unknown as { dsInputCount: number }).dsInputCount)).toBe(0)
  })

  test('should not fire dsInput when moved in the DOM', async ({ page }) => {
    await page.mount(`<div id="a"><ds-slider label="Label" value="30"></ds-slider></div><div id="b"></div>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    const inputSpy = await slider.el.spyOnEvent('dsInput')

    await page.evaluate(() => document.getElementById('b')?.appendChild(document.querySelector('ds-slider')!))
    await page.waitForChanges()
    await expect(slider.handle).toHaveAttribute('aria-valuenow', '30.0')
    expect(inputSpy).toHaveReceivedEventTimes(0)

    await slider.fill('42')
    expect(inputSpy).toHaveReceivedEventTimes(1)
  })

  test('should fire dsChange with numeric value on fill', async ({ page }) => {
    await page.mount(`<ds-slider label="Label"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    const changeSpy = await slider.el.spyOnEvent('dsChange')

    await slider.fill('75')

    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(75)
  })

  test('should fire dsFocus on focus and dsBlur on blur', async ({ page }) => {
    await page.mount(`<ds-slider label="Label"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    const focusSpy = await slider.el.spyOnEvent('dsFocus')
    const blurSpy = await slider.el.spyOnEvent('dsBlur')

    await slider.handle.focus()
    expect(focusSpy).toHaveReceivedEventTimes(1)

    await slider.blur()
    expect(blurSpy).toHaveReceivedEventTimes(1)
  })

  test('should fire dsClick on click', async ({ page }) => {
    await page.mount(`<ds-slider label="Label"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    const clickSpy = await slider.el.spyOnEvent('dsClick')

    await slider.handle.click()

    expect(clickSpy).toHaveReceivedEventTimes(1)
  })
})

test.describe('min/max/step', () => {
  test('defaults to min when value is unset', async ({ page }) => {
    await page.mount(`<ds-slider label="Label" min="10" max="50"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))

    await slider.assertValue('10')
  })

  test('clamps an out-of-range value to max', async ({ page }) => {
    await page.mount(`<ds-slider label="Label" min="0" max="10" value="42"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))

    await slider.assertValue('10')
  })
})

test.describe('empty value assigned at runtime', () => {
  // A slider can never be empty (see the `value` prop doc): unlike the unset-at-mount case above, this
  // covers a framework binding writing an empty value onto an already-connected instance — e.g. Angular's
  // `FormControl.reset()`, which calls `writeValue(null)` straight through onto the `value` property.
  for (const emptyValue of ['null', 'undefined', 'NaN']) {
    test(`resolves ${emptyValue} to min`, async ({ page }) => {
      await page.mount(`<ds-slider label="Label" min="10" max="90" value="60"></ds-slider>`)
      const slider = new DsSlider(page.locator('ds-slider'))

      await slider.el.evaluate((el, value) => {
        ;(el as any).value = value === 'null' ? null : value === 'undefined' ? undefined : Number.NaN
      }, emptyValue)
      await page.waitForChanges()

      await slider.assertValue('10')
    })
  }
})

test.describe('disabled', () => {
  test('slider should be disabled', async ({ page }) => {
    await page.mount(`<ds-slider label="Label" value="42" disabled></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    const inputSpy = await slider.el.spyOnEvent('dsInput')

    await slider.assertToBeDisabled()
    expect(inputSpy).toHaveReceivedEventTimes(0)
  })

  test('should not submit its value when disabled is set as property', async ({ page }) => {
    await page.mount(`<form><ds-slider name="volume" label="Volume" value="30"></ds-slider></form>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    expect(await getFormEntries(page)).toContainEqual(['volume', expect.anything()])

    await slider.el.evaluate((el: HTMLDsSliderElement) => (el.disabled = true))
    await page.waitForChanges()

    expect(await getFormEntries(page)).not.toContainEqual(['volume', expect.anything()])
  })

  test('should be disabled and not submit its value inside a disabled fieldset', async ({ page }) => {
    await page.mount(
      `<form><fieldset disabled><ds-slider name="volume" label="Volume" value="30"></ds-slider></fieldset></form>`,
    )
    const slider = new DsSlider(page.locator('ds-slider'))

    await slider.assertToBeDisabled()
    expect(await getFormEntries(page)).not.toContainEqual(['volume', expect.anything()])

    await page.locator('fieldset').evaluate((el: HTMLFieldSetElement) => (el.disabled = false))
    await page.waitForChanges()

    expect(await getFormEntries(page)).toContainEqual(['volume', expect.anything()])
  })
})

test.describe('readonly', () => {
  test('slider should be disabled', async ({ page }) => {
    await page.mount(`<ds-slider label="Label" value="42" readonly></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))
    const inputSpy = await slider.el.spyOnEvent('dsInput')

    await slider.assertToBeDisabled()
    expect(inputSpy).toHaveReceivedEventTimes(0)
  })
})

test.describe('form reset', () => {
  test('should reset to initial value', async ({ page }) => {
    await page.mount(`
      <form>
        <ds-slider name="volume" label="Volume" value="30"></ds-slider>
        <button type="reset" data-testid="reset">Reset</button>
      </form>
    `)
    const slider = new DsSlider(page.locator('ds-slider'))
    const changeSpy = await slider.el.spyOnEvent('dsChange')

    await slider.fill('90')
    expect(changeSpy).toHaveReceivedEventTimes(1)
    expect(changeSpy).toHaveReceivedEventDetail(90)

    await page.getByTestId('reset').click()
    await page.waitForChanges()
    await slider.assertValue('30')
  })
})

test.describe('required attribute', () => {
  test('should treat required="false" as false', async ({ page }) => {
    await page.mount(`<ds-slider label="Label" required="false"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))

    await expect(slider.el).toHaveJSProperty('required', false)
  })
})

test.describe('moved in the DOM', () => {
  test('should still render and change value after being moved', async ({ page }) => {
    await page.mount(`<ds-slider label="Label" min="0" max="100" value="20"></ds-slider>`)
    const slider = new DsSlider(page.locator('ds-slider'))

    await page.evaluate(() => {
      const newParent = document.createElement('div')
      document.body.appendChild(newParent)
      newParent.appendChild(document.querySelector('ds-slider')!)
    })
    await page.waitForChanges()
    await expect(slider.handle).toHaveAttribute('aria-valuenow', '20.0')

    const changeSpy = await slider.el.spyOnEvent('dsChange')
    await slider.handle.focus()
    await page.keyboard.press('ArrowRight')
    // dsChange is emitted on a setTimeout(0) debounce, so wait it out before asserting the spy.
    await page.waitForChanges()

    expect(changeSpy).toHaveReceivedEventTimes(1)
    await expect(slider.handle).not.toHaveAttribute('aria-valuenow', '20.0')
  })
})
