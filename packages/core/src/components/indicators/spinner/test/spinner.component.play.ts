import { expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
  const LOGO_SIZE_MD = 64
  const LOGO_SIZE_SM = 32

  const RESERVED_SIZE_CASES = [
    { name: 'while the animation is disabled', html: '<ds-spinner></ds-spinner>', animated: false, size: LOGO_SIZE_MD },
    { name: 'when deactivated', html: '<ds-spinner deactivated></ds-spinner>', animated: true, size: LOGO_SIZE_MD },
    { name: 'for size sm', html: '<ds-spinner size="sm"></ds-spinner>', animated: false, size: LOGO_SIZE_SM },
  ]

  RESERVED_SIZE_CASES.forEach(({ name, html, animated, size }) => {
    test(`should reserve the logo size ${name}`, async ({ page }) => {
      await page.mount(`<div id="host"></div>`)
      await page.waitForFunction(() => (window as any).dsAppReady)
      await page.evaluate(
        ({ html, animated }) => {
          ;(window as any).DesignSystem.config.animated = animated
          document.querySelector('#host')!.innerHTML = html
        },
        { html, animated },
      )

      await expect(page.locator('ds-spinner #inner')).toBeAttached()
      await expect(page.locator('ds-spinner #inner svg')).not.toBeAttached()
      const box = await page
        .locator('ds-spinner')
        .evaluate(el => el.shadowRoot!.firstElementChild!.getBoundingClientRect())
      expect(box.width).toBe(size)
      expect(box.height).toBeGreaterThanOrEqual(size)
      expect(box.height).toBeLessThan(size * 2)
    })
  })

  test('should not change its size when the animation svg is attached', async ({ page }) => {
    await page.mount(`<div id="host"></div>`)
    await page.waitForFunction(() => (window as any).dsAppReady)
    await page.evaluate(() => {
      document.querySelector('#host')!.innerHTML = '<ds-spinner></ds-spinner>'
    })
    const spinner = page.locator('ds-spinner')
    await expect(page.locator('ds-spinner #inner')).toBeAttached()
    const before = await spinner.boundingBox()

    await page.evaluate(() => {
      ;(window as any).DesignSystem.config.animated = true
      const el = document.querySelector('ds-spinner')!
      el.deactivated = true
      el.deactivated = false
    })
    await expect(page.locator('ds-spinner #inner svg')).toBeAttached()

    expect(await spinner.boundingBox()).toEqual(before)
  })

  test('should stop the lottie animation loop when removed', async ({ page }) => {
    await page.mount(`<div id="host"></div>`)

    // the test setup disables animations globally
    await page.waitForFunction(() => (window as any).dsAppReady)
    await page.evaluate(() => {
      ;(window as any).DesignSystem.config.animated = true
      document.querySelector('#host')!.innerHTML = '<ds-spinner></ds-spinner>'
    })
    await expect(page.locator('ds-spinner #inner svg')).toBeAttached()

    const rafCallsAfterRemoval = await page.evaluate(async () => {
      document.querySelector('ds-spinner')!.remove()
      // let a frame already queued before removal run out
      await new Promise(resolve => setTimeout(resolve, 100))

      let calls = 0
      const original = window.requestAnimationFrame
      window.requestAnimationFrame = callback => {
        calls++
        return original.call(window, callback)
      }
      await new Promise(resolve => setTimeout(resolve, 300))
      window.requestAnimationFrame = original
      return calls
    })

    expect(rafCallsAfterRemoval).toBe(0)
  })

  const CIRCLE_DURATION_CASES = [
    { reducedMotion: 'no-preference', duration: '1.6s' },
    { reducedMotion: 'reduce', duration: '6.4s' },
  ] as const

  CIRCLE_DURATION_CASES.forEach(({ reducedMotion, duration }) => {
    test(`should use a ${duration} circle animation with reducedMotion ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion })
      await page.mount(`<div id="host"></div>`)
      await page.waitForFunction(() => (window as any).dsAppReady)
      await page.evaluate(() => {
        ;(window as any).DesignSystem.config.animated = true
        document.querySelector('#host')!.innerHTML = '<ds-spinner variation="circle"></ds-spinner>'
      })

      const inner = page.locator('ds-spinner #inner')
      await expect(inner).toBeAttached()
      await expect(inner).toHaveCSS('animation-duration', duration)
    })
  })
})
