import { expect, Locator, Page, test } from '@playwright/test'

const model = (page: Page) =>
  page
    .getByTestId('sf-model')
    .innerText()
    .then(t => JSON.parse(t.replace('Model:', '')))
const modelField = (page: Page, key: string) => expect.poll(async () => (await model(page))[key])

test.describe('signal forms ([formField]) on ds-* wrappers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ds-input: initial value, user input -> model, model -> view', async ({ page }) => {
    const native = page.getByTestId('sf-input').locator('input')
    await expect(native).toHaveValue('Alice')

    await native.fill('Bob')
    await native.blur()
    await modelField(page, 'name').toBe('Bob')
    await expect(page.getByTestId('sf-name-state')).toContainText('touched=true')

    await page.getByTestId('sf-set-name').click()
    await expect(native).toHaveValue('Carol')
  })

  test('ds-input: disabled via schema', async ({ page }) => {
    const native = page.getByTestId('sf-input').locator('input')
    await page.getByTestId('sf-toggle-disabled').click()
    await expect(native).toBeDisabled()
    await page.getByTestId('sf-toggle-disabled').click()
    await expect(native).toBeEnabled()
  })

  // Regression: `[formField]` hands the wrapper an `InteropNgControl` without an `events` stream; `invalid` and
  // `invalidText` must still react to touched/validity changes.
  test('ds-input: touched + invalid shows the error message', async ({ page }) => {
    const host = page.getByTestId('sf-input')
    await host.locator('input').fill('')
    await host.locator('input').blur()
    await expect(host.locator('input')).toHaveAttribute('aria-invalid', 'true')
    await expect(host.locator('[role="alert"]')).toHaveText('Name is required')
  })

  // Regression: a field that is invalid from the start (required select, value null) must show as invalid
  // after markAsTouched().
  test('ds-select: markAsTouched() on the form reveals the error', async ({ page }) => {
    const host = page.getByTestId('sf-select')
    await page.getByTestId('sf-touch-all').click()
    await expect(host.locator('[role="alert"]')).toHaveText('Country is required')
  })

  // Regression: `[formField]` pushes `pattern` (a `RegExp[]`) into ds-input's `pattern: string` prop.
  test('ds-input: no prop type errors are logged', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()))
    await page.goto('/')
    await expect(page.getByTestId('sf-input').locator('input')).toHaveValue('Alice')
    expect(errors).toEqual([])
  })

  test('ds-toggle: checked <-> model', async ({ page }) => {
    await page.getByTestId('sf-toggle').locator('input').click()
    await modelField(page, 'accepted').toBe(true)
  })

  test('ds-select: selection -> model', async ({ page }) => {
    const host = page.getByTestId('sf-select')
    await host.locator('.ss-main').click()
    await host.locator('.ss-option', { hasText: 'Germany' }).click()
    await modelField(page, 'country').toBe('de')
  })

  test('ds-checkbox-group: selection -> model', async ({ page }) => {
    await page.getByTestId('sf-checkbox-group').locator('ds-checkbox[value="banana"] input[type="checkbox"]').click()
    await modelField(page, 'fruits').toEqual(['banana'])
  })

  test('reset() restores value and clears touched', async ({ page }) => {
    const native = page.getByTestId('sf-input').locator('input')
    await native.fill('Zed')
    await native.blur()
    await page.getByTestId('sf-reset').click()
    await expect(native).toHaveValue('Alice')
    await expect(page.getByTestId('sf-name-state')).toContainText('touched=false')
  })

  test('ds-phone-input: initial value, typing, model -> view', async ({ page }) => {
    const phone = page.getByTestId('sf-phone')
    const native = phone.locator('[part="input"]')
    await expect(native).toHaveValue('79 123 45 67')

    await native.fill('791112233')
    await native.blur()
    await modelField(page, 'phone').toBe('+41791112233')

    await page.getByTestId('sf-set-phone').click()
    await expect(native).toHaveValue('79 876 54 32')
  })

  test('ds-phone-input: country change updates the model without blur', async ({ page }) => {
    const phone = page.getByTestId('sf-phone')
    await phone.locator('#country-trigger').click()
    await phone.locator('#country-filter').waitFor({ state: 'visible' })
    await phone.locator('#country-filter').fill('DE')
    await phone.locator('#country-option-DE').click()
    await expect.poll(async () => (await model(page)).phone).toContain('+49')
  })

  test('ds-phone-input: touched + invalid shows the error message', async ({ page }) => {
    const phone = page.getByTestId('sf-phone')
    const native = phone.locator('[part="input"]')
    await native.fill('')
    await native.blur()
    await expect(native).toHaveAttribute('aria-invalid', 'true')
    await expect(phone.locator('[role="alert"]')).toHaveText('Phone is required')
  })

  test('ds-phone-input: reset() restores the value', async ({ page }) => {
    const native = page.getByTestId('sf-phone').locator('[part="input"]')
    await native.fill('791112233')
    await native.blur()
    await page.getByTestId('sf-reset').click()
    await expect(native).toHaveValue('79 123 45 67')
  })

  test('ds-datepicker: initial value, typing -> model, model -> view', async ({ page }) => {
    const native = page.getByTestId('sf-date').locator('[part="input"]')
    await expect(native).toHaveValue('15.01.2024')

    await native.selectText()
    await native.pressSequentially('10.02.2025')
    await native.blur()
    await modelField(page, 'date').toBe('2025-02-10')

    await page.getByTestId('sf-set-date').click()
    await expect(native).toHaveValue('24.12.2025')
  })

  test('ds-datepicker: clearing sets the model to null', async ({ page }) => {
    const native = page.getByTestId('sf-date').locator('[part="input"]')
    await native.click()
    await native.press('End')
    for (let i = 0; i < '15.01.2024'.length; i++) {
      await native.press('Backspace')
    }
    await native.blur()
    await modelField(page, 'date').toBeNull()
  })

  test('ds-datepicker: touched + invalid shows the error message', async ({ page }) => {
    const date = page.getByTestId('sf-date')
    const native = date.locator('[part="input"]')
    await native.click()
    await native.press('End')
    for (let i = 0; i < '15.01.2024'.length; i++) {
      await native.press('Backspace')
    }
    await native.blur()
    await expect(native).toHaveAttribute('aria-invalid', 'true')
    await expect(date.locator('[role="alert"]')).toHaveText('Date is required')
  })

  test('ds-datepicker: reset() restores the value', async ({ page }) => {
    const native = page.getByTestId('sf-date').locator('[part="input"]')
    await native.selectText()
    await native.pressSequentially('10.02.2025')
    await native.blur()
    await page.getByTestId('sf-reset').click()
    await expect(native).toHaveValue('15.01.2024')
  })

  test('ds-number-input: initial value, typing -> model, min/max validator message', async ({ page }) => {
    const number = page.getByTestId('sf-number')
    const native = number.locator('input')
    await expect(native).toHaveValue('5')

    await native.fill('7')
    await native.blur()
    await modelField(page, 'amount').toBe(7)

    await native.fill('11')
    await native.blur()
    await expect(native).toHaveAttribute('aria-invalid', 'true')
    await expect(number.locator('[role="alert"]')).toHaveText('Must be at most 10')
  })

  test('no prop type errors are logged for any bound field', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => msg.type() === 'error' && errors.push(msg.text().slice(0, 160)))
    await page.goto('/')
    await expect(page.getByTestId('sf-number').locator('input')).toHaveValue('5')
    expect(errors).toEqual([])
  })

  test.describe('ds-slider', () => {
    const setSliderValue = (slider: Locator, value: number) =>
      slider.evaluate(
        (el, v) =>
          new Promise<void>(resolve => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(el as any).noUiSlider.set(v)
            setTimeout(resolve, 0)
          }),
        value,
      )

    test('initial value, slider -> model, model -> view', async ({ page }) => {
      const host = page.getByTestId('sf-slider')
      await expect(host).toHaveAttribute('value', '60')
      await setSliderValue(host.locator('[part="slider"]'), 65)
      await modelField(page, 'slider').toBe(65)
      await page.getByTestId('sf-set-slider').click()
      await expect(host).toHaveAttribute('value', '75')
    })

    test('touched + invalid shows the error message', async ({ page }) => {
      const host = page.getByTestId('sf-slider')
      await setSliderValue(host.locator('[part="slider"]'), 10)
      await host.locator('.noUi-handle').focus()
      await host.locator('.noUi-handle').blur()
      await expect(host.locator('[part="inner"][aria-invalid]')).toHaveAttribute('aria-invalid', 'true')
      await expect(host.locator('[part="description"]')).toHaveText('Value must be at least 50')
    })
  })

  test.describe('ds-counter', () => {
    test('initial value, step -> model, model -> view', async ({ page }) => {
      const host = page.getByTestId('sf-counter')
      await expect(host).toHaveAttribute('value', '3')
      await host.locator('[part="increase"]').click()
      await modelField(page, 'counter').toBe(4)
      await page.getByTestId('sf-set-counter').click()
      await expect(host).toHaveAttribute('value', '7')
    })

    test('touched + invalid shows the error message', async ({ page }) => {
      const host = page.getByTestId('sf-counter')
      await host.locator('[part="increase"]').click() // 4 is even -> invalid
      await page.getByTestId('sf-set-counter').focus()
      await expect(host.locator('[part="inner"][aria-invalid]')).toHaveAttribute('aria-invalid', 'true')
      await expect(host.locator('[part="description"]')).toHaveText('Must be odd')
    })
  })

  test.describe('ds-textarea', () => {
    test('initial value, typing -> model, model -> view, touched + invalid message', async ({ page }) => {
      const host = page.getByTestId('sf-textarea')
      const native = host.locator('textarea')
      await expect(native).toHaveValue('Hello')
      await native.fill('Bob')
      await native.blur()
      await modelField(page, 'comment').toBe('Bob')
      await page.getByTestId('sf-set-comment').click()
      await expect(native).toHaveValue('Carol')

      await native.fill('')
      await native.blur()
      await expect(native).toHaveAttribute('aria-invalid', 'true')
      await expect(host.locator('[role="alert"]')).toHaveText('Comment is required')
    })
  })

  test.describe('ds-segment', () => {
    test('initial value, click -> model, model -> view, deselect shows the error message', async ({ page }) => {
      const host = page.getByTestId('sf-segment')
      const basic = host.locator('#group input[value="basic"]')
      const premium = host.locator('#group input[value="premium"]')
      await expect(basic).toBeChecked()
      await premium.click()
      await modelField(page, 'segment').toBe('premium')
      await page.getByTestId('sf-set-segment').click()
      await expect(premium).toBeChecked()

      await premium.click() // deselect (allowEmptySelection)
      await premium.blur()
      await expect(host.locator('fieldset')).toHaveAttribute('aria-invalid', 'true')
      await expect(host.locator('[role="alert"]')).toHaveText('Segment is required')
    })
  })

  test.describe('ds-radio-group', () => {
    test('initial value, click -> model, model -> view, deselect shows the error message', async ({ page }) => {
      const host = page.getByTestId('sf-radio')
      const basic = host.locator('ds-radio[value="basic"] input')
      const premium = host.locator('ds-radio[value="premium"] input')
      await expect(basic).toBeChecked()
      await premium.click()
      await modelField(page, 'radio').toBe('premium')
      await page.getByTestId('sf-set-radio').click()
      await expect(premium).toBeChecked()

      await premium.click() // deselect (allowEmptySelection)
      await premium.blur()
      await expect(host.locator('fieldset')).toHaveAttribute('aria-invalid', 'true')
      await expect(host.locator('[role="alert"]')).toHaveText('Radio is required')
    })
  })

  test.describe('ds-file-upload', () => {
    test('initial value, upload appends -> model, model -> view, clear shows the error message', async ({ page }) => {
      const host = page.getByTestId('sf-files')
      const native = host.locator('[part="input"]')
      await expect(host.locator('.file-name')).toHaveText('a.txt')

      await native.setInputFiles({ name: 'hello.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
      await expect(page.getByTestId('sf-files-names')).toHaveText('Files: a.txt, hello.txt')

      await page.getByTestId('sf-set-files').click()
      await expect(host.locator('.file-name')).toHaveText(['b.txt', 'c.txt'])

      await page.getByTestId('sf-clear-files').click()
      await native.focus()
      await native.blur()
      await expect(native).toHaveAttribute('aria-invalid', 'true')
      await expect(host.locator('[role="alert"]')).toHaveText('Files are required')
    })
  })

  test.describe('min/max/pattern/readonly validators', () => {
    const prop = (host: Locator, key: string) =>
      host.evaluate((el, k) => (el as unknown as Record<string, unknown>)[k], key)

    test('min()/max() also set the range of ds-slider and ds-counter', async ({ page }) => {
      const slider = page.getByTestId('sf-range-slider')
      await expect.poll(() => prop(slider, 'min')).toBe(50)
      await expect.poll(() => prop(slider, 'max')).toBe(80)
      const counter = page.getByTestId('sf-range-counter')
      await expect.poll(() => prop(counter, 'min')).toBe(2)
      await expect.poll(() => prop(counter, 'max')).toBe(5)
      // without validators the components keep their defaults
      await expect.poll(() => prop(page.getByTestId('sf-slider'), 'min')).toBe(0)
      await expect.poll(() => prop(page.getByTestId('sf-slider'), 'max')).toBe(100)
    })

    test('ds-counter stops at the max set by max()', async ({ page }) => {
      const counter = page.getByTestId('sf-range-counter')
      const increase = counter.locator('[part="increase"]')
      await increase.click()
      await increase.click()
      await increase.click()
      await modelField(page, 'rangeCounter').toBe(5)
    })

    test('pattern(): invalid value shows the error message', async ({ page }) => {
      const host = page.getByTestId('sf-code')
      const native = host.locator('input')
      await expect(native).toHaveValue('ABC')
      await native.fill('abc')
      await native.blur()
      await modelField(page, 'code').toBe('abc')
      await expect(native).toHaveAttribute('aria-invalid', 'true')
      await expect(host.locator('[role="alert"]')).toHaveText('Uppercase letters only')
    })

    test('pattern(): the RegExp is not forwarded to the component', async ({ page }) => {
      await expect.poll(() => prop(page.getByTestId('sf-code'), 'pattern')).toBe('')
    })

    test('readonly(): toggling it sets the native readonly state', async ({ page }) => {
      const native = page.getByTestId('sf-textarea').locator('textarea')
      await expect(native).not.toHaveAttribute('readonly', '')
      await page.getByTestId('sf-toggle-readonly').click()
      await expect(native).toHaveAttribute('readonly', '')
      await page.getByTestId('sf-toggle-readonly').click()
      await expect(native).not.toHaveAttribute('readonly', '')
    })
  })

  test.describe('disabled() on every wrapper', () => {
    // How each component exposes its disabled state, mirroring the reactive-forms specs.
    const targets: Record<string, (page: Page) => Locator> = {
      'ds-input': page => page.getByTestId('sf-input').locator('input'),
      'ds-toggle': page => page.getByTestId('sf-toggle').locator('input'),
      'ds-select': page => page.getByTestId('sf-select').locator('.ss-main'),
      'ds-checkbox-group': page => page.getByTestId('sf-checkbox-group').locator('ds-checkbox[value="apple"] input'),
      'ds-phone-input': page => page.getByTestId('sf-phone').locator('[part="input"]'),
      'ds-datepicker': page => page.getByTestId('sf-date').locator('[part="input"]'),
      'ds-number-input': page => page.getByTestId('sf-number').locator('input'),
      'ds-slider': page => page.getByTestId('sf-slider').locator('[part="slider"]'),
      'ds-counter': page => page.getByTestId('sf-counter').locator('[part="inner"][aria-disabled]'),
      'ds-textarea': page => page.getByTestId('sf-textarea').locator('textarea'),
      'ds-segment': page => page.getByTestId('sf-segment').locator('#group input[value="basic"]'),
      'ds-radio-group': page => page.getByTestId('sf-radio').locator('ds-radio[value="basic"] input'),
      'ds-file-upload': page => page.getByTestId('sf-files').locator('[part="input"]'),
    }
    const isDisabled = (name: string, locator: Locator) => {
      switch (name) {
        case 'ds-select':
          return expect(locator).toHaveClass(/ss-disabled/)
        case 'ds-slider':
          return expect(locator).toHaveAttribute('disabled', '')
        case 'ds-counter':
          return expect(locator).toHaveAttribute('aria-disabled', 'true')
        default:
          return expect(locator).toBeDisabled()
      }
    }
    const isEnabled = (name: string, locator: Locator) => {
      switch (name) {
        case 'ds-select':
          return expect(locator).not.toHaveClass(/ss-disabled/)
        case 'ds-slider':
          return expect(locator).not.toHaveAttribute('disabled', '')
        case 'ds-counter':
          return expect(locator).not.toHaveAttribute('aria-disabled', 'true')
        default:
          return expect(locator).toBeEnabled()
      }
    }

    for (const [name, locate] of Object.entries(targets)) {
      test(`${name}: disabled via schema and back`, async ({ page }) => {
        const target = locate(page)
        await isEnabled(name, target)
        await page.getByTestId('sf-toggle-all-disabled').click()
        await isDisabled(name, target)
        await page.getByTestId('sf-toggle-all-disabled').click()
        await isEnabled(name, target)
      })
    }
  })

  test('min()/max() win over an explicit [min]/[max] on the same element', async ({ page }) => {
    const host = page.getByTestId('sf-collision')
    await expect.poll(() => host.evaluate(el => (el as unknown as { min: number }).min)).toBe(50)
    await expect.poll(() => host.evaluate(el => (el as unknown as { max: number }).max)).toBe(80)
  })

  test.describe('values outside the min()/max() range', () => {
    test('model keeps the out-of-range value and reports the error after touch', async ({ page }) => {
      await page.getByTestId('sf-range-slider-out').click()
      await page.getByTestId('sf-range-counter-out').click()
      await modelField(page, 'rangeSlider').toBe(90)
      await modelField(page, 'rangeCounter').toBe(9)

      await page.getByTestId('sf-touch-all').click()
      await expect(page.getByTestId('sf-range-slider').locator('[part="description"]')).toHaveText('Slider max 80')
      await expect(page.getByTestId('sf-range-counter').locator('[part="description"]')).toHaveText('Counter max 5')
    })
  })
})
