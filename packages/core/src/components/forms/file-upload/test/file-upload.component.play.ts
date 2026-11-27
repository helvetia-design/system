import { DsFileUpload, test } from '@helvetia-design/playwright'
import { expect, type Page } from '@playwright/test'

test.describe('value assigned after load', () => {
  test('should render a value that is assigned after the component has loaded', async ({ page }) => {
    await page.mount(`<ds-file-upload label="Upload"></ds-file-upload>`)
    const component = new DsFileUpload(page.locator('ds-file-upload'))

    await component.assertHasNoFileList()

    await component.el.evaluate((el: HTMLDsFileUploadElement) => {
      el.value = [new File(['content'], 'file1.txt', { type: 'text/plain' })]
    })
    await page.waitForChanges()

    await component.assertHasFileList()
    await expect(component.fileList).toContainText('file1.txt')
  })

  test('should render a value that is re-assigned to the same files after the component has loaded', async ({
    page,
  }) => {
    await page.mount(`<ds-file-upload label="Upload"></ds-file-upload>`)
    const component = new DsFileUpload(page.locator('ds-file-upload'))

    await component.el.evaluate((el: HTMLDsFileUploadElement) => {
      const files = [new File(['content'], 'file1.txt', { type: 'text/plain' })]
      el.value = files
      el.value = files
    })
    await page.waitForChanges()

    await component.assertHasFileList()
    await expect(component.fileList).toContainText('file1.txt')
  })
})

test.describe('component', () => {
  test.describe('events', () => {
    test('should emit dsFocus on input focus', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))
      const spy = await component.el.spyOnEvent('dsFocus')

      await component.input.focus()
      expect(spy).toHaveReceivedEventTimes(1)
    })

    test('should emit dsBlur on input blur', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))
      const spy = await component.el.spyOnEvent('dsBlur')

      await component.input.focus()
      await component.input.blur()
      expect(spy).toHaveReceivedEventTimes(1)
    })

    test('should emit dsInputClick on input click', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))
      const spy = await component.el.spyOnEvent('dsInputClick')

      await component.click()
      await page.waitForChanges()
      expect(spy).toHaveReceivedEventTimes(1)
    })

    test('should not emit dsInputClick when disabled', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" disabled></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))
      const spy = await component.el.spyOnEvent('dsInputClick')

      // Disabled fields set pointer-events: none on the host (form.style.scss `.ds-field.is-disabled`),
      // so a real click can never land on the drop-zone — force it through to assert the event still
      // doesn't fire, same pattern as the disabled date-cell click test.
      // eslint-disable-next-line playwright/no-force-option
      await component.click({ force: true })
      await page.waitForChanges()

      await component.assertToBeDisabled()
      expect(spy).toHaveReceivedEventTimes(0)
    })
  })

  test.describe('state', () => {
    test('should render disabled state', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" disabled></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await component.assertToBeDisabled()
    })

    test('should render invalid state', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" invalid></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await component.assertToBeInvalid()
    })

    test('should render loading state', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" loading></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await component.assertToBeLoading()
    })

    test('should render readonly state', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" readonly></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await component.assertToBeReadonly()
    })

    test('should render required state', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" required></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await component.assertToBeRequired()
    })
  })

  test.describe('methods', () => {
    test('should clear files with clear() method', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" has-file-list="false"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await component.clear()

      const input = component.input
      expect(input).toBeDefined()
    })

    test('should set focus with setFocus() method', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await component.setFocus()

      await expect(component.input).toBeFocused()
    })
  })

  test.describe('drop-zone', () => {
    test('should have accessible drop-zone part', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await expect(component.dropZone).toBeVisible()
    })

    test('should hide file-list when has-file-list is false', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" has-file-list="false"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await expect(component.fileList).toBeHidden()
    })
  })

  test.describe('multiple prop', () => {
    test('should allow multiple files when multiple is true', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" multiple></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await expect(component.input).toHaveAttribute('multiple', '')
    })

    test('should allow single file when multiple is false', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" multiple="false"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await expect(component.input).not.toHaveAttribute('multiple')
    })

    test('should keep only one file of a multi-file drop when multiple is false', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" multiple="false"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      const dataTransfer = await page.evaluateHandle(() => {
        const dt = new DataTransfer()
        dt.items.add(new File(['a'], 'file1.txt', { type: 'text/plain' }))
        dt.items.add(new File(['b'], 'file2.txt', { type: 'text/plain' }))
        return dt
      })
      await component.dropZone.dispatchEvent('drop', { dataTransfer })
      await page.waitForChanges()

      await expect(component.fileList).toContainText('file1.txt')
      await expect(component.fileList).not.toContainText('file2.txt')
    })
  })

  test.describe('color variant', () => {
    test('should render with primary color', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" color="primary"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await expect(component.el).toHaveAttribute('color', 'primary')
    })

    test('should render with success color', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" color="success"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await expect(component.el).toHaveAttribute('color', 'success')
    })

    test('should render with warning color', async ({ page }) => {
      await page.mount(`<ds-file-upload label="Upload" color="warning"></ds-file-upload>`)
      const component = new DsFileUpload(page.locator('ds-file-upload'))

      await expect(component.el).toHaveAttribute('color', 'warning')
    })
  })
})

test.describe('required attribute', () => {
  test('should treat required="false" as false', async ({ page }) => {
    await page.mount(`<ds-file-upload label="Label" required="false"></ds-file-upload>`)
    const fileUpload = new DsFileUpload(page.locator('ds-file-upload'))

    await expect(fileUpload.el).toHaveJSProperty('required', false)
  })
})

test.describe('form association', () => {
  const files = [
    { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') },
    { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('b') },
  ]
  const formMarkup = `<form id="f" target="sink"><ds-file-upload name="docs" label="Upload"></ds-file-upload></form><iframe name="sink"></iframe>`
  const readFileNames = (page: Page) =>
    page
      .locator('#f')
      .evaluate((form: HTMLFormElement) => new FormData(form).getAll('docs').map(entry => (entry as File).name))

  test('should add the selected files to the FormData', async ({ page }) => {
    await page.mount(formMarkup)
    const component = new DsFileUpload(page.locator('ds-file-upload'))

    await component.input.setInputFiles(files)
    await page.waitForChanges()

    expect(await readFileNames(page)).toEqual(['a.txt', 'b.txt'])
  })

  test('should pass the selected files to the formdata event of a native submit', async ({ page }) => {
    await page.mount(formMarkup)
    const component = new DsFileUpload(page.locator('ds-file-upload'))

    await component.input.setInputFiles(files)
    await page.waitForChanges()

    const submitted = await page.locator('#f').evaluate(
      (form: HTMLFormElement) =>
        new Promise<string[]>(resolve => {
          form.addEventListener('formdata', ev => {
            resolve(ev.formData.getAll('docs').map(entry => (entry as File).name))
          })
          form.requestSubmit()
        }),
    )

    expect(submitted).toEqual(['a.txt', 'b.txt'])
  })

  test('should update the FormData when a file is removed or cleared', async ({ page }) => {
    await page.mount(formMarkup)
    const component = new DsFileUpload(page.locator('ds-file-upload'))

    await component.input.setInputFiles(files)
    await page.waitForChanges()

    await component.fileList.locator('li').first().locator('ds-button').click()
    await page.waitForChanges()
    expect(await readFileNames(page)).toEqual(['b.txt'])

    await component.clear()
    await page.waitForChanges()
    expect(await readFileNames(page)).toEqual([])
    await expect(component.input).toHaveJSProperty('files.length', 0)
  })

  test('should clear the FormData and the file list on form reset', async ({ page }) => {
    await page.mount(formMarkup)
    const component = new DsFileUpload(page.locator('ds-file-upload'))

    await component.input.setInputFiles(files)
    await page.waitForChanges()

    await page.locator('#f').evaluate((form: HTMLFormElement) => form.reset())
    await page.waitForChanges()

    expect(await readFileNames(page)).toEqual([])
    await component.assertHasNoFileList()
    await expect(component.input).toHaveJSProperty('files.length', 0)
  })

  test('should restore the assigned value on form reset', async ({ page }) => {
    await page.mount(formMarkup)
    const component = new DsFileUpload(page.locator('ds-file-upload'))

    await component.el.evaluate((el: HTMLDsFileUploadElement) => {
      el.value = [new File(['init'], 'init.txt', { type: 'text/plain' })]
    })
    await component.input.setInputFiles(files)
    await page.waitForChanges()
    expect(await readFileNames(page)).toEqual(['init.txt', 'a.txt', 'b.txt'])

    await page.locator('#f').evaluate((form: HTMLFormElement) => form.reset())
    await page.waitForChanges()

    expect(await readFileNames(page)).toEqual(['init.txt'])
    await expect(component.fileList).toContainText('init.txt')
    await expect(component.fileList).not.toContainText('a.txt')
  })
})
