import { DsAppNavbar, test } from '@helvetia-design/playwright'
import { expect } from '@playwright/test'

test('should fire dsMenuOpenStart and dsMenuOpenEnd events', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })

  await page.mount(`
      <ds-app-navbar>
        <a href="/" slot="brand">Logo</a>
        <a href="/about" slot="menu-start">About</a>
      </ds-app-navbar>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))
  const openStartSpy = await navbar.el.spyOnEvent('dsMenuOpenStart')
  const openEndSpy = await navbar.el.spyOnEvent('dsMenuOpenEnd')

  await navbar.toggleSidebar()

  expect(openStartSpy).toHaveReceivedEventTimes(1)
  expect(openEndSpy).toHaveReceivedEventTimes(1)
})

test('should fire dsMenuCloseStart and dsMenuCloseEnd events', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })

  await page.mount(`
      <ds-app-navbar open>
        <a href="/" slot="brand">Logo</a>
        <a href="/about" slot="menu-start">About</a>
      </ds-app-navbar>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))
  const closeStartSpy = await navbar.el.spyOnEvent('dsMenuCloseStart')
  const closeEndSpy = await navbar.el.spyOnEvent('dsMenuCloseEnd')

  await navbar.toggleSidebar()
  await page.waitForChanges()

  expect(closeStartSpy).toHaveReceivedEventTimes(1)
  expect(closeEndSpy).toHaveReceivedEventTimes(1)
})

test('toggleSidebar should toggle sidebar state', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })

  await page.mount(`
      <ds-app-navbar>
        <a href="/" slot="brand">Logo</a>
        <a href="/about" slot="menu-start">About</a>
      </ds-app-navbar>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))

  // Toggle to open
  await navbar.toggleSidebar()
  await navbar.assertSidebarIsOpen()

  // Toggle to close
  await navbar.toggleSidebar()
  await navbar.assertSidebarIsClosed()
})

test('should open sidebar when hamburger is clicked', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })

  await page.mount(`
      <ds-app-navbar>
        <a href="/" slot="brand">Logo</a>
        <a href="/about" slot="menu-start">About</a>
      </ds-app-navbar>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))

  await navbar.toggleSidebar()
  await navbar.assertSidebarIsOpen()
})

test('should close sidebar when backdrop is clicked', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })

  await page.mount(`
      <ds-app-navbar open>
        <a href="/" slot="brand">Logo</a>
        <a href="/about" slot="menu-start">About</a>
      </ds-app-navbar>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))

  await page.keyboard.press('Escape')

  await navbar.assertSidebarIsClosed()
})

test('should release scroll lock and focus trap when breakpoint changes to desktop', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })

  await page.mount(`
      <ds-app-navbar>
        <a href="/" slot="brand">Logo</a>
        <a href="/about" slot="menu-start">About</a>
      </ds-app-navbar>
      <button id="outside">Outside</button>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))
  await navbar.toggleSidebar()
  await navbar.assertSidebarIsOpen()
  await expect(page.locator('body')).toHaveClass(/noscroll/)

  await page.setViewportSize({ width: 1440, height: 600 })

  await expect(navbar.el).not.toHaveClass(/is-open/)
  await expect(page.locator('body')).not.toHaveClass(/noscroll/)
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')

  const outside = page.locator('#outside')
  await outside.focus()
  await expect(outside).toBeFocused()
})

test('should remove the Escape keydown listener when breakpoint changes to desktop', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 600 })

  await page.mount(`
      <ds-app-navbar>
        <a href="/" slot="brand">Logo</a>
        <a href="/about" slot="menu-start">About</a>
      </ds-app-navbar>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))
  await navbar.toggleSidebar()
  await navbar.assertSidebarIsOpen()

  await page.evaluate(() => {
    ;(window as any).__removedListenerTypes = []
    const originalRemoveEventListener = document.removeEventListener.bind(document)
    document.removeEventListener = ((type: string, ...rest: unknown[]) => {
      ;(window as any).__removedListenerTypes.push(type)
      return (originalRemoveEventListener as any)(type, ...rest)
    }) as any
  })

  await page.setViewportSize({ width: 1440, height: 600 })
  await expect(navbar.el).not.toHaveClass(/is-open/)

  const removedListenerTypes = await page.evaluate(() => (window as any).__removedListenerTypes)
  expect(removedListenerTypes).toContain('keydown')
})

test('should release scroll lock when overflow ends on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 600 })

  const links = Array.from(
    { length: 12 },
    (_, i) => `<a href="/page-${i}" slot="menu-start">Navigation item ${i}</a>`,
  ).join('')

  await page.mount(`
      <ds-app-navbar>
        <a href="/" slot="brand">Logo</a>
        ${links}
      </ds-app-navbar>
    `)

  const navbar = new DsAppNavbar(page.locator('ds-app-navbar'))
  await expect(navbar.el).toHaveClass(/is-sidebar-mode/)
  await navbar.toggleSidebar()
  await navbar.assertSidebarIsOpen()
  await expect(page.locator('body')).toHaveClass(/noscroll/)

  await page.setViewportSize({ width: 2560, height: 600 })

  await expect(navbar.el).not.toHaveClass(/is-sidebar-mode/)
  await expect(navbar.el).not.toHaveClass(/is-open/)
  await expect(page.locator('body')).not.toHaveClass(/noscroll/)
})
