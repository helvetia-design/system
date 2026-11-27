import { DsTooltip, test, expect } from '@helvetia-design/playwright'

test.describe('component', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.mount(`
      <button id="my-trigger">Hover over me</button>
      <ds-tooltip reference="my-trigger">Tooltip content</ds-tooltip>
    `)
  })

  test('should have a default slot', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))

    await dsTooltip.assertToContainText('Tooltip content')
  })

  test('should be hidden by default', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))

    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'true')
  })

  test('should set aria-describedby on trigger after load', async ({ page }) => {
    const trigger = page.locator('#my-trigger')

    await expect(trigger).toHaveAttribute('aria-describedby')
  })

  test('should present and emit dsWillAnimate / dsDidAnimate', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))
    const willSpy = await dsTooltip.el.spyOnEvent('dsWillAnimate')
    const didSpy = await dsTooltip.el.spyOnEvent('dsDidAnimate')

    await dsTooltip.el.evaluate((el: any) => el.present())

    expect(willSpy).toHaveReceivedEventTimes(1)
    expect(didSpy).toHaveReceivedEventTimes(1)
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')
  })

  test('should dismiss and emit dsWillAnimate / dsDidAnimate', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))
    await dsTooltip.el.evaluate((el: any) => el.present())

    const willSpy = await dsTooltip.el.spyOnEvent('dsWillAnimate')
    const didSpy = await dsTooltip.el.spyOnEvent('dsDidAnimate')

    await dsTooltip.el.evaluate((el: any) => el.dismiss())

    expect(willSpy).toHaveReceivedEventTimes(1)
    expect(didSpy).toHaveReceivedEventTimes(1)
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'true')
  })

  test('should show on trigger mouseenter and hide on mouseleave', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))
    const trigger = page.locator('#my-trigger')

    await trigger.hover()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')

    await page.mouse.move(128, 128)
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'true')
  })

  test('should hide on Escape while presented by hover', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))

    await page.locator('#my-trigger').hover()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')

    await page.keyboard.press('Escape')
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'true')
  })

  test('should hide on Escape while presented by focus and keep focus on the trigger', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))
    const trigger = page.locator('#my-trigger')

    await trigger.focus()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')

    await page.keyboard.press('Escape')
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'true')
    await expect(trigger).toBeFocused()
  })

  test('should stay visible while the pointer moves from the trigger onto the tooltip', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))

    await page.locator('#my-trigger').hover()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')

    const box = (await dsTooltip.el.locator('[part="container"]').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    // eslint-disable-next-line playwright/no-wait-for-timeout -- proving a delayed dismiss does not fire needs elapsed time
    await page.waitForTimeout(300)
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')

    await page.mouse.move(box.x + box.width + 200, box.y + box.height + 200)
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'true')
  })

  test('should stay visible while the trigger has focus and the pointer passes over the tooltip', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))
    const trigger = page.locator('#my-trigger')

    await trigger.focus()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')

    const box = (await dsTooltip.el.locator('[part="container"]').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.move(box.x + box.width + 200, box.y + box.height + 200)
    // eslint-disable-next-line playwright/no-wait-for-timeout -- proving a delayed dismiss does not fire needs elapsed time
    await page.waitForTimeout(300)
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')
    await expect(trigger).toBeFocused()
  })

  test('should not emit a second dismiss when the pointer leaves after Escape', async ({ page }) => {
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))

    await page.locator('#my-trigger').hover()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')
    const box = (await dsTooltip.el.locator('[part="container"]').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

    const willSpy = await dsTooltip.el.spyOnEvent('dsWillAnimate')
    await page.keyboard.press('Escape')
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'true')
    await page.mouse.move(box.x + box.width + 200, box.y + box.height + 200)
    // eslint-disable-next-line playwright/no-wait-for-timeout -- proving a delayed dismiss does not fire needs elapsed time
    await page.waitForTimeout(300)

    expect(willSpy).toHaveReceivedEventTimes(1)
  })

  test('should wrap long content and stay within a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))
    await dsTooltip.el.evaluate(el => {
      el.textContent = 'Long tooltip content that must wrap '.repeat(12) + 'a'.repeat(80)
    })
    await page.locator('#my-trigger').hover()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')

    const container = dsTooltip.el.locator('[part="container"]')
    await expect(async () => {
      const box = (await container.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(320)
      expect(box.height).toBeGreaterThan(60)
    }).toPass()
  })

  test('should stop the previous position tracker before starting a new one on hover then focus', async ({ page }) => {
    const trigger = page.locator('#my-trigger')

    await page.evaluate(() => {
      ;(window as any).__listenerDelta = 0
      const originalAdd = window.addEventListener.bind(window)
      const originalRemove = window.removeEventListener.bind(window)
      window.addEventListener = ((...args: any[]) => {
        ;(window as any).__listenerDelta++
        return (originalAdd as any)(...args)
      }) as any
      window.removeEventListener = ((...args: any[]) => {
        ;(window as any).__listenerDelta--
        return (originalRemove as any)(...args)
      }) as any
    })

    // Simulates hovering the trigger, which starts a position tracker.
    await trigger.hover()
    const deltaAfterHover = await page.evaluate(() => (window as any).__listenerDelta)
    expect(deltaAfterHover).toBeGreaterThan(0)

    // Simulates focusing the still-hovered trigger, which starts a second tracker.
    await trigger.focus()
    const deltaAfterFocus = await page.evaluate(() => (window as any).__listenerDelta)

    // The tracker started on hover must be stopped before the one from focus starts,
    // so the net number of listeners left on window stays the same.
    expect(deltaAfterFocus).toBe(deltaAfterHover)
  })

  test('should remove its trigger listeners on disconnect', async ({ page }) => {
    const removedListenerTypes = await page.evaluate(() => {
      const trigger = document.querySelector('#my-trigger') as HTMLElement
      const calls: string[] = []
      const originalRemoveEventListener = trigger.removeEventListener.bind(trigger)
      trigger.removeEventListener = (type: string, ...rest: any[]) => {
        calls.push(type)
        return (originalRemoveEventListener as any)(type, ...rest)
      }

      document.querySelector('ds-tooltip')?.remove()

      return calls
    })

    expect(removedListenerTypes.sort()).toEqual(['blur', 'focus', 'mouseenter', 'mouseleave'])
  })
})

test.describe('aria-describedby', () => {
  test('should append its id to an existing aria-describedby and restore it on disconnect', async ({ page }) => {
    await page.mount(`
      <button id="my-trigger" aria-describedby="hint-1">Hover over me</button>
      <span id="hint-1">Hint</span>
      <ds-tooltip reference="my-trigger">Tooltip content</ds-tooltip>
    `)
    const trigger = page.locator('#my-trigger')
    const tooltipId = await page.locator('ds-tooltip').getAttribute('id')

    await expect(trigger).toHaveAttribute('aria-describedby', `hint-1 ${tooltipId}`)

    await page.evaluate(() => document.querySelector('ds-tooltip')?.remove())
    await expect(trigger).toHaveAttribute('aria-describedby', 'hint-1')
  })

  test('should remove aria-describedby on disconnect when it set the only token', async ({ page }) => {
    await page.mount(`
      <button id="my-trigger">Hover over me</button>
      <ds-tooltip reference="my-trigger">Tooltip content</ds-tooltip>
    `)
    const trigger = page.locator('#my-trigger')
    await expect(trigger).toHaveAttribute('aria-describedby')

    await page.evaluate(() => document.querySelector('ds-tooltip')?.remove())
    await expect(trigger).not.toHaveAttribute('aria-describedby')
  })
})

test.describe('moved in the DOM', () => {
  test('should still show on trigger hover after being moved', async ({ page }) => {
    await page.mount(`
      <button id="my-trigger">Hover over me</button>
      <ds-tooltip reference="my-trigger">Tooltip content</ds-tooltip>
    `)
    const dsTooltip = new DsTooltip(page.locator('ds-tooltip'))

    await page.evaluate(() => {
      const newParent = document.createElement('div')
      document.body.appendChild(newParent)
      newParent.appendChild(document.querySelector('ds-tooltip')!)
    })
    await page.waitForChanges()
    await expect(page.locator('#my-trigger')).toHaveAttribute('aria-describedby')
    await page.locator('#my-trigger').hover()
    await expect(dsTooltip.el).toHaveAttribute('aria-hidden', 'false')
  })
})
