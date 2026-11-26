import { expect, test } from '@helvetia-design/playwright'
import type { CDPSession } from '@playwright/test'

const URL = '/sections/summary-section/summary-section.visual.html'
const IDS = ['default', 'green', 'red', 'yellow'] as const
type Id = (typeof IDS)[number]

// The section wrapper inside each data-testid fixture block.
const wrapper = (id: Id) => `[data-testid="${id}"] > section`

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
  await expect(page.locator(`${wrapper('default')} li`)).toHaveCount(4)
})

// Includes color-contrast for each card color (purple default, green, red, yellow).
test.describe('axe', () => {
  for (const id of IDS) {
    test(id, async ({ a11y }) => {
      await a11y(wrapper(id))
    })
  }
})

test.describe('semantics', () => {
  for (const id of IDS) {
    test(`${id}: region labelled by its own h2`, async ({ page }) => {
      const section = page.locator(wrapper(id))
      const h2 = section.locator('h2')
      await expect(h2).toHaveCount(1)
      const labelledby = await section.getAttribute('aria-labelledby')
      expect(labelledby).toBeTruthy()
      // the referenced id resolves to the h2 inside this same section, unique in the document
      await expect(page.locator(`[id="${labelledby}"]`)).toHaveCount(1)
      await expect(h2).toHaveAttribute('id', labelledby!)
      await expect(section).toHaveRole('region')
      await expect(section).toHaveAccessibleName('Summary')

      const cdp = await page.context().newCDPSession(page)
      const headings = (await axQuery(cdp, wrapper(id), 'heading')).filter(n => !n.ignored)
      expect(headings.map(level)).toEqual([2])
      expect(headings[0].name?.value).toBe('Summary')
    })

    test(`${id}: real list of 4 items, each with a strong lead-in`, async ({ page }) => {
      const list = page.locator(`${wrapper(id)} ul`)
      await expect(list).toHaveCount(1)
      await expect(list).toHaveRole('list')
      const items = list.locator(':scope > li')
      await expect(items).toHaveCount(4)
      for (const li of await items.all()) {
        await expect(li).toHaveRole('listitem')
        const lead = li.locator(':scope > strong:first-child')
        await expect(lead).toHaveCount(1)
        await expect(lead).toHaveText(/:$/)
      }

      // list semantics survive the CSS marker styling (no list-style: none role stripping)
      const cdp = await page.context().newCDPSession(page)
      const lists = (await axQuery(cdp, wrapper(id), 'list')).filter(n => !n.ignored)
      expect(lists).toHaveLength(1)
      const listitems = (await axQuery(cdp, wrapper(id), 'listitem')).filter(n => !n.ignored)
      expect(listitems).toHaveLength(4)
    })
  }
})

test.describe('keyboard', () => {
  test('nothing inside any section is focusable (no tab stops)', async ({ page }) => {
    for (const id of IDS) {
      const focusables = page.locator(
        `${wrapper(id)} :is(a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]:not([contenteditable="false"]))`,
      )
      await expect(focusables).toHaveCount(0)
    }
    // Tab from the top of the page never lands inside the fixture
    await page.keyboard.press('Tab')
    const inside = await page.evaluate(() => !!document.activeElement?.closest('main'))
    expect(inside).toBe(false)
  })
})
