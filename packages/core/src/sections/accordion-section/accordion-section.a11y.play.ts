import { expect, test } from '@helvetia-design/playwright'
import type { CDPSession, Page } from '@playwright/test'

const URL = '/sections/accordion-section/accordion-section.visual.html'
const IDS = ['default', 'open'] as const
type Id = (typeof IDS)[number]

// The section wrapper inside each data-testid fixture block.
const wrapper = (id: Id) => `[data-testid="${id}"] > section`
const triggers = (page: Page, id: Id) => page.locator(`${wrapper(id)} ds-item [part="summary"]`)

type AXNode = {
  role?: { value: string }
  name?: { value: string }
  ignored: boolean
  properties?: { name: string; value: { value: unknown } }[]
}

// Real Chrome accessibility tree (flattened across shadow roots) below a CSS selector.
async function axQuery(cdp: CDPSession, selector: string, role?: string): Promise<AXNode[]> {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 })
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector })
  const { node } = await cdp.send('DOM.describeNode', { nodeId })
  const { nodes } = await cdp.send('Accessibility.queryAXTree', { backendNodeId: node.backendNodeId, role })
  return nodes as AXNode[]
}

const level = (n: AXNode) => n.properties?.find(p => p.name === 'level')?.value.value

test.beforeEach(async ({ page }) => {
  await page.goto(URL)
  await expect(triggers(page, 'default')).toHaveCount(3)
})

test.describe('axe', () => {
  for (const id of IDS) {
    test(id, async ({ a11y }) => {
      await a11y(wrapper(id))
    })
  }
})

test.describe('semantics', () => {
  for (const id of IDS) {
    test(`${id}: one h2 followed by three h3, no skipped level`, async ({ page }) => {
      const cdp = await page.context().newCDPSession(page)
      const headings = (await axQuery(cdp, wrapper(id), 'heading')).filter(n => !n.ignored)
      expect(headings.map(level)).toEqual([2, 3, 3, 3])
      expect(headings[0].name?.value).toBe('Dangers in everyday life')
      for (const h of headings.slice(1)) expect(h.name?.value).toBe('Lorem ipsum dolor')
    })
  }

  test('section wrapper without accessible name is generic, not a region landmark', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page)
    // queryAXTree includes the start node itself; the only regions below are the accordion panels
    const [self] = await axQuery(cdp, wrapper('default'))
    expect(self.role?.value).toBe('generic')
    expect(self.name?.value ?? '').toBe('')
  })

  test('brand icons are hidden from assistive technology', async ({ page }) => {
    const icons = page.locator(`${wrapper('default')} ds-brand-icon`)
    await expect(icons).toHaveCount(3)
    for (const icon of await icons.all()) await expect(icon).toHaveAttribute('aria-hidden', 'true')

    const cdp = await page.context().newCDPSession(page)
    for (const n of await axQuery(cdp, wrapper('default'), 'image')) expect(n.ignored).toBe(true)
    // trigger names carry only the label, no icon text
    for (const t of await triggers(page, 'default').all()) await expect(t).toHaveAccessibleName('Lorem ipsum dolor')
  })

  test('open item exposes aria-expanded="true" and a labelled content region', async ({ page }) => {
    const t = triggers(page, 'open')
    await expect(t.nth(0)).toHaveAttribute('aria-expanded', 'true')
    await expect(t.nth(1)).toHaveAttribute('aria-expanded', 'false')
    await expect(t.nth(2)).toHaveAttribute('aria-expanded', 'false')
    const content = page
      .locator(`${wrapper('open')} ds-item`)
      .nth(0)
      .locator('[part="content"]')
    await expect(content).toBeVisible()
    await expect(content).toHaveAccessibleName('Lorem ipsum dolor')
  })
})

test.describe('keyboard', () => {
  test('Tab reaches each trigger in DOM order', async ({ page }) => {
    const t = triggers(page, 'default')
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab')
      await expect(t.nth(i)).toBeFocused()
    }
  })

  for (const key of ['Enter', 'Space'] as const) {
    test(`${key} toggles the trigger, keeps focus and updates aria-expanded`, async ({ page }) => {
      const t = triggers(page, 'default').nth(0)
      const content = page
        .locator(`${wrapper('default')} ds-item`)
        .nth(0)
        .locator('[part="content"]')
      await page.keyboard.press('Tab')
      await expect(t).toBeFocused()
      await expect(t).toHaveAttribute('aria-expanded', 'false')
      await expect(content).toBeHidden()

      await page.keyboard.press(key)
      await expect(t).toHaveAttribute('aria-expanded', 'true')
      await expect(content).toBeVisible()
      await expect(t).toBeFocused()

      await page.keyboard.press(key)
      await expect(t).toHaveAttribute('aria-expanded', 'false')
      await expect(content).toBeHidden()
      await expect(t).toBeFocused()
    })
  }

  test('focus indicator is visible on keyboard focus', async ({ page }) => {
    const t = triggers(page, 'default').nth(0)
    await page.keyboard.press('Tab')
    await expect(t).toBeFocused()
    const ring = await t.evaluate(el => {
      const s = getComputedStyle(el, '::before')
      return { outline: `${s.outlineStyle} ${s.outlineWidth}`, boxShadow: s.boxShadow }
    })
    const hasOutline = !ring.outline.startsWith('none') && !ring.outline.endsWith(' 0px')
    expect(hasOutline || ring.boxShadow !== 'none', JSON.stringify(ring)).toBe(true)
  })
})
