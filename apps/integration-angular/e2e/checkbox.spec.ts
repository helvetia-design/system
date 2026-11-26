import { expect, test } from '@playwright/test'

test('ds-checkbox fires dsChange and updates Angular state', async ({ page }) => {
  await page.goto('/')

  const checked = page.getByTestId('checked')
  await expect(checked).toHaveText('Checked: false')

  await page.getByTestId('checkbox').locator('input[type="checkbox"]').click()

  await expect(checked).toHaveText('Checked: true')
})

test('ds-checkbox reactive form: initial value, updates, disabled, and touched+invalid', async ({ page }) => {
  await page.goto('/')

  const reactiveCheckbox = page.getByTestId('reactive-checkbox')
  const reactiveCheckboxInput = reactiveCheckbox.locator('input[type="checkbox"]')

  await expect(reactiveCheckboxInput).toBeChecked()
  await expect(page.getByTestId('reactive-checkbox-value')).toHaveText('Reactive value: true')
  await expect(page.getByTestId('reactive-checkbox-is-boolean')).toHaveText('Is boolean: true')

  await reactiveCheckboxInput.click()
  await expect(page.getByTestId('reactive-checkbox-value')).toHaveText('Reactive value: false')
  await expect(page.getByTestId('reactive-checkbox-is-boolean')).toHaveText('Is boolean: true')

  await page.getByTestId('set-reactive-checkbox-value').click()
  await expect(reactiveCheckboxInput).toBeChecked()
  await expect(page.getByTestId('reactive-checkbox-value')).toHaveText('Reactive value: true')

  await page.getByTestId('toggle-reactive-checkbox-disabled').click()
  await expect(reactiveCheckboxInput).toBeDisabled()

  await page.getByTestId('toggle-reactive-checkbox-disabled').click()
  await expect(reactiveCheckboxInput).toBeEnabled()

  await reactiveCheckboxInput.click()
  await expect(reactiveCheckboxInput).not.toBeChecked()
  await reactiveCheckboxInput.focus()
  await reactiveCheckboxInput.blur()
  await expect(reactiveCheckboxInput).toHaveAttribute('aria-invalid', 'true')
})

test('ds-checkbox reactive form: autoInvalidOff suppresses automatic invalid state', async ({ page }) => {
  await page.goto('/')

  const autoInvalidOffCheckboxInput = page.getByTestId('auto-invalid-off-checkbox').locator('input[type="checkbox"]')

  await autoInvalidOffCheckboxInput.click()
  await autoInvalidOffCheckboxInput.blur()

  await expect(autoInvalidOffCheckboxInput).not.toHaveAttribute('aria-invalid', 'true')
})
