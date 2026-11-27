import { DsModal, DsPopup, expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  test('should render ds-popup closed by default', async ({ page }) => {
    await page.mount(`
      <ds-button id="trigger">Open</ds-button>
      <ds-popup id="popup" label="Popup">
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await dsPopup.assertToBeClosed()
  })

  test('should open popup on present()', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await dsPopup.assertToBeClosed()

    await page.evaluate(() => (document.getElementById('popup') as any).present())

    await dsPopup.assertToBeOpen()
  })

  test('should close popup on dismiss()', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup') as any).present())
    await dsPopup.assertToBeOpen()

    await page.evaluate(() => (document.getElementById('popup') as any).dismiss())

    await dsPopup.assertToBeClosed()
  })

  test('should toggle popup on toggle()', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))

    await page.evaluate(() => (document.getElementById('popup') as any).toggle())
    await dsPopup.assertToBeOpen()

    await page.evaluate(() => (document.getElementById('popup') as any).toggle())
    await dsPopup.assertToBeClosed()
  })

  test('should emit dsWillPresent and dsDidPresent on open', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    const willPresent = await dsPopup.el.spyOnEvent('dsWillPresent')
    const didPresent = await dsPopup.el.spyOnEvent('dsDidPresent')

    await page.evaluate(() => (document.getElementById('popup') as any).present())

    expect(willPresent).toHaveReceivedEventTimes(1)
    await expect.poll(() => didPresent.length).toBe(1)
  })

  test('should emit dsWillDismiss and dsDidDismiss on close', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup') as any).present())

    const willDismiss = await dsPopup.el.spyOnEvent('dsWillDismiss')
    const didDismiss = await dsPopup.el.spyOnEvent('dsDidDismiss')

    await page.evaluate(() => (document.getElementById('popup') as any).dismiss())

    expect(willDismiss).toHaveReceivedEventTimes(1)
    expect(didDismiss).toHaveReceivedEventTimes(1)
  })

  test('should render close button when closable=true', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup" closable>
        <p>Content</p>
      </ds-popup>
    `)
    await page.evaluate(() => (document.getElementById('popup') as any).present())
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await expect(dsPopup.close.el).toBeAttached()
  })

  test('should not render close button when closable=false', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Content</p>
      </ds-popup>
    `)
    await page.evaluate(() => (document.getElementById('popup') as any).present())
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await expect(dsPopup.close.el).not.toBeAttached()
  })

  test('should close on close button click when closable=true', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup" closable>
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup') as any).present())
    await dsPopup.assertToBeOpen()

    await dsPopup.close.click()

    await dsPopup.assertToBeClosed()
  })

  test('should close on Escape key when closable=true', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup" closable>
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup') as any).present())
    await dsPopup.assertToBeOpen()

    await page.keyboard.press('Escape')

    await dsPopup.assertToBeClosed()
  })

  test('should open via declarative data-popup trigger', async ({ page }) => {
    await page.mount(`
      <ds-button data-popup="popup-declarative">Open</ds-button>
      <ds-popup id="popup-declarative" label="Declarative Popup">
        <p>Content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.getByRole('button', { name: 'Open' }).click()
    await dsPopup.assertToBeOpen()
  })

  test('should set trigger via programmatic API', async ({ page }) => {
    await page.mount(`
      <ds-button id="prog-trigger">Open</ds-button>
      <ds-popup id="popup-prog" label="Programmatic Popup" backdrop-dismiss>
        <p>Content</p>
      </ds-popup>
    `)
    await page.evaluate(() => {
      const popup = document.getElementById('popup-prog') as any
      popup.trigger = document.getElementById('prog-trigger')
    })
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup-prog') as any).present())
    await dsPopup.assertToBeOpen()

    // Click outside should dismiss
    await page.mouse.click(128, 128)
    await dsPopup.assertToBeClosed()
  })

  test('should not close on trigger click when backdrop-dismiss and trigger set', async ({ page }) => {
    await page.mount(`
      <ds-button id="trigger-bd">Open</ds-button>
      <ds-popup id="popup-bd" label="Popup" backdrop-dismiss>
        <p>Content</p>
      </ds-popup>
    `)
    await page.evaluate(() => {
      const popup = document.getElementById('popup-bd') as any
      popup.trigger = document.getElementById('trigger-bd')
    })
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup-bd') as any).present())
    await dsPopup.assertToBeOpen()

    await page.getByRole('button', { name: 'Open' }).click()

    await dsPopup.assertToBeOpen()
  })

  test('should close on backdrop click when focus is trapped', async ({ page }) => {
    await page.mount(`
      <ds-button data-popup="popup-trap">Open</ds-button>
      <ds-popup id="popup-trap" label="Popup" backdrop backdrop-dismiss>
        <button>Inside</button>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.getByRole('button', { name: 'Open' }).click()
    await dsPopup.assertToBeOpen()

    await page.mouse.click(5, 5)

    await dsPopup.assertToBeClosed()
  })

  test('should close on declarative trigger click when focus is trapped', async ({ page }) => {
    await page.mount(`
      <ds-button data-popup="popup-trap">Open</ds-button>
      <ds-popup id="popup-trap" label="Popup" trap-focus>
        <button>Inside</button>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.getByRole('button', { name: 'Open' }).click()
    await dsPopup.assertToBeOpen()

    await page.getByRole('button', { name: 'Open' }).click()

    await dsPopup.assertToBeClosed()
  })

  test('should move focus into a trapped popup on open', async ({ page }) => {
    await page.mount(`
      <ds-button data-popup="popup-trap">Open</ds-button>
      <ds-popup id="popup-trap" label="Popup" backdrop>
        <p>No focusable content</p>
      </ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.getByRole('button', { name: 'Open' }).click()

    await expect(dsPopup.panel).toBeFocused()
  })

  test('should focus the first slotted focusable element on open', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Text</p>
        <div><button id="first">First</button></div>
        <button>Second</button>
      </ds-popup>
    `)
    await page.evaluate(() => (document.getElementById('popup') as HTMLDsPopupElement).present())

    await expect(page.locator('#first')).toBeFocused()
  })

  test('should close only the topmost popup on Escape', async ({ page }) => {
    await page.mount(`
      <ds-popup id="first" label="First" closable><p>First</p></ds-popup>
      <ds-popup id="second" label="Second" closable><p>Second</p></ds-popup>
    `)
    const first = new DsPopup(page.locator('#first'))
    const second = new DsPopup(page.locator('#second'))
    await page.evaluate(() => (document.getElementById('first') as HTMLDsPopupElement).present())
    await first.assertToBeOpen()
    await page.evaluate(() => (document.getElementById('second') as HTMLDsPopupElement).present())
    await second.assertToBeOpen()

    await page.keyboard.press('Escape')

    await second.assertToBeClosed()
    await first.assertToBeOpen()
  })

  test('should close a popup inside a modal on Escape without closing the modal', async ({ page }) => {
    await page.mount(`
      <ds-modal id="modal" open>
        <ds-modal-header>Title</ds-modal-header>
        <ds-modal-body>
          <ds-popup id="popup" label="Popup" closable><button>Inside</button></ds-popup>
        </ds-modal-body>
      </ds-modal>
    `)
    const dsModal = new DsModal(page.locator('ds-modal'))
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await dsModal.assertToBeOpen()
    await page.evaluate(() => (document.getElementById('popup') as HTMLDsPopupElement).present())
    await dsPopup.assertToBeOpen()

    await page.keyboard.press('Escape')

    await dsPopup.assertToBeClosed()
    await dsModal.assertToBeOpen()

    await page.keyboard.press('Escape')

    await dsModal.assertToBeClosed()
  })

  test('should set aria-modal only when focus is trapped', async ({ page }) => {
    await page.mount(`
      <ds-popup id="plain" label="Plain"><p>Plain</p></ds-popup>
      <ds-popup id="modal-like" label="Backdrop" backdrop><p>Backdrop</p></ds-popup>
      <ds-popup id="untrapped-backdrop" label="Untrapped" backdrop trap-focus="false"><p>Untrapped</p></ds-popup>
      <ds-popup id="trapped-menu" label="Menu" panel-role="menu" trap-focus><p>Menu</p></ds-popup>
    `)

    await expect(new DsPopup(page.locator('#plain')).panel).not.toHaveAttribute('aria-modal')
    await expect(new DsPopup(page.locator('#modal-like')).panel).toHaveAttribute('aria-modal', 'true')
    await expect(new DsPopup(page.locator('#untrapped-backdrop')).panel).not.toHaveAttribute('aria-modal')
    await expect(new DsPopup(page.locator('#trapped-menu')).panel).not.toHaveAttribute('aria-modal')
  })

  test('should apply panel-role to the panel and not to the host', async ({ page }) => {
    await page.mount(`
      <button id="trigger">Open</button>
      <ds-popup id="popup" label="Menu" panel-role="menu"><p>Menu</p></ds-popup>
    `)
    await page.evaluate(() => {
      const popup = document.getElementById('popup') as HTMLDsPopupElement
      popup.trigger = document.getElementById('trigger') ?? undefined
    })
    const dsPopup = new DsPopup(page.locator('ds-popup'))

    await expect(dsPopup.el).not.toHaveAttribute('role')
    await expect(dsPopup.panel).toHaveAttribute('role', 'menu')
    await expect(page.locator('#trigger')).toHaveAttribute('aria-haspopup', 'menu')
  })

  test('should keep focus on an outside element after click-outside dismiss', async ({ page }) => {
    await page.mount(`
      <button data-popup="popup">Open</button>
      <input id="outside" aria-label="Outside" />
      <ds-popup id="popup" label="Popup" backdrop-dismiss><button>Inside</button></ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    const didDismiss = await dsPopup.el.spyOnEvent('dsDidDismiss')
    await page.getByRole('button', { name: 'Open' }).click()
    await dsPopup.assertToBeOpen()

    await page.locator('#outside').click()

    await dsPopup.assertToBeClosed()
    await expect.poll(() => didDismiss.length).toBe(1)
    await expect(page.locator('#outside')).toBeFocused()
  })

  test('should keep trigger ARIA after the popup is moved in the DOM', async ({ page }) => {
    await page.mount(`
      <button id="trigger">Open</button>
      <div id="target"></div>
      <ds-popup id="popup" label="Popup"><p>Content</p></ds-popup>
    `)
    await page.evaluate(() => {
      const popup = document.getElementById('popup') as HTMLDsPopupElement
      popup.trigger = document.getElementById('trigger') ?? undefined
      return popup.present()
    })
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await dsPopup.assertToBeOpen()

    await page.evaluate(() =>
      document.getElementById('target')?.append(document.getElementById('popup') as HTMLElement),
    )

    const trigger = page.locator('#trigger')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  test('should set aria-haspopup on declarative triggers before opening', async ({ page }) => {
    await page.mount(`
      <button data-popup="popup-declarative">Open</button>
      <ds-popup id="popup-declarative" label="Declarative Popup"><p>Content</p></ds-popup>
    `)
    const trigger = page.locator('[data-popup="popup-declarative"]')

    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).not.toHaveAttribute('aria-controls')
  })

  test('should close the topmost closable popup on Escape when a non-closable popup is on top', async ({ page }) => {
    await page.mount(`
      <ds-popup id="closable" label="Closable" closable><p>Closable</p></ds-popup>
      <ds-popup id="not-closable" label="Not closable"><p>Not closable</p></ds-popup>
    `)
    const closable = new DsPopup(page.locator('#closable'))
    const notClosable = new DsPopup(page.locator('#not-closable'))
    await page.evaluate(() => (document.getElementById('closable') as HTMLDsPopupElement).present())
    await closable.assertToBeOpen()
    await page.evaluate(() => (document.getElementById('not-closable') as HTMLDsPopupElement).present())
    await notClosable.assertToBeOpen()

    await page.keyboard.press('Escape')

    await closable.assertToBeClosed()
    await notClosable.assertToBeOpen()
  })

  test('should focus the inner control of a slotted ds-button on open', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup">
        <p>Text</p>
        <ds-button id="first">First</ds-button>
        <button>Second</button>
      </ds-popup>
    `)
    await page.evaluate(() => (document.getElementById('popup') as HTMLDsPopupElement).present())

    await expect(page.locator('#first button')).toBeFocused()
  })

  test('should block outside clicks while trapped without backdrop-dismiss', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Popup" trap-focus><button>Inside</button></ds-popup>
      <button id="outside" style="margin-top: 20rem" onclick="window.outsideClicks = (window.outsideClicks ?? 0) + 1">
        Outside
      </button>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup') as HTMLDsPopupElement).present())
    await dsPopup.assertToBeOpen()
    await expect(page.getByRole('button', { name: 'Inside' })).toBeFocused()

    await page.locator('#outside').click()

    expect(await page.evaluate(() => (window as Window & { outsideClicks?: number }).outsideClicks ?? 0)).toBe(0)
    await dsPopup.assertToBeOpen()
  })

  test('should remove ARIA from the declarative trigger when the popup is removed', async ({ page }) => {
    await page.mount(`
      <button data-popup="popup">Open</button>
      <ds-popup id="popup" label="Popup"><p>Content</p></ds-popup>
    `)
    const trigger = page.locator('[data-popup="popup"]')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')

    await page.evaluate(() => document.getElementById('popup')?.remove())

    await expect(trigger).not.toHaveAttribute('aria-haspopup')
    await expect(trigger).not.toHaveAttribute('aria-expanded')
  })

  test('should keep the focus trap after an open popup is moved in the DOM', async ({ page }) => {
    await page.mount(`
      <div id="target"></div>
      <ds-popup id="popup" label="Popup" trap-focus>
        <button id="a">A</button>
        <button id="b">B</button>
      </ds-popup>
      <button id="outside">Outside</button>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.evaluate(() => (document.getElementById('popup') as HTMLDsPopupElement).present())
    await expect(page.locator('#a')).toBeFocused()

    await page.evaluate(() =>
      document.getElementById('target')?.append(document.getElementById('popup') as HTMLElement),
    )
    await dsPopup.assertToBeOpen()
    await page.locator('#b').focus()
    await page.keyboard.press('Tab')

    await expect(page.locator('#a')).toBeFocused()
  })

  test('should return focus to the trigger when a trapped popup closes on Escape', async ({ page }) => {
    await page.mount(`
      <button data-popup="popup">Open</button>
      <ds-popup id="popup" label="Popup" trap-focus closable><button>Inside</button></ds-popup>
    `)
    const dsPopup = new DsPopup(page.locator('ds-popup'))
    await page.getByRole('button', { name: 'Open' }).click()
    await expect(page.getByRole('button', { name: 'Inside' })).toBeFocused()

    await page.keyboard.press('Escape')

    await dsPopup.assertToBeClosed()
    await expect(page.getByRole('button', { name: 'Open' })).toBeFocused()
  })
})

test.describe('accessible name', () => {
  let warnings: string[]

  test.beforeEach(({ page }) => {
    warnings = []
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('[ds-popup]')) warnings.push(msg.text())
    })
  })

  test('should use the slotted heading when label is empty', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup">
        <h2>Popup heading</h2>
        <p>Content</p>
      </ds-popup>
    `)
    await page.evaluate(() => (document.getElementById('popup') as any).present())

    await expect(page.getByRole('dialog', { name: 'Popup heading' })).toBeVisible()
    await page.waitForChanges()
    expect(warnings).toHaveLength(0)
  })

  test('should prefer label over the slotted heading', async ({ page }) => {
    await page.mount(`
      <ds-popup id="popup" label="Explicit label">
        <h2>Popup heading</h2>
      </ds-popup>
    `)
    await page.evaluate(() => (document.getElementById('popup') as any).present())

    await expect(page.getByRole('dialog', { name: 'Explicit label' })).toBeVisible()
    await page.waitForChanges()
    expect(warnings).toHaveLength(0)
  })

  test('should warn once when there is neither label nor heading', async ({ page }) => {
    await page.mount(`<ds-popup id="popup"><p>Content</p></ds-popup>`)

    await page.evaluate(() => (document.getElementById('popup') as any).present())
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.waitForChanges()
    expect(warnings).toHaveLength(1)
  })

  test('should not warn for a non-dialog role', async ({ page }) => {
    await page.mount(`<ds-popup id="popup" panel-role="menu"><p>Content</p></ds-popup>`)

    await page.evaluate(() => (document.getElementById('popup') as any).present())
    await expect(page.getByTestId('ds-popup-panel')).toBeVisible()
    await page.waitForChanges()
    expect(warnings).toHaveLength(0)
  })
})
