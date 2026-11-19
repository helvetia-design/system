import { expect, test } from '@helvetia-design/playwright'

test.describe('component', () => {
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
})
