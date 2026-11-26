import { expect, test } from '@helvetia-design/playwright'

const URL = '/sections/summary-section/summary-section.visual.html'

const SECTIONS = [
  { id: 'default', color: 'is-purple', title: 'summary-title' },
  { id: 'green', color: 'is-green', title: 'summary-title-green' },
  { id: 'red', color: 'is-red', title: 'summary-title-red' },
  { id: 'yellow', color: 'is-yellow', title: 'summary-title-yellow' },
] as const

const section = (page: any, id: string) => page.getByTestId(id)

const boxOf = (loc: any) => loc.evaluate((el: Element) => el.getBoundingClientRect().toJSON())

test.describe('structure', () => {
  for (const { id, color, title } of SECTIONS) {
    test.describe(id, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto(URL)
      })

      test('should render an h2 title, a card and a 4-item list', async ({ page }) => {
        const s = section(page, id)
        await expect(s.getByRole('heading', { level: 2 })).toHaveText('Summary')
        await expect(s.locator('.ds-card')).toBeVisible()
        await expect(s.locator('.ds-card ul > li')).toHaveCount(4)
      })

      test('should bold each item lead-in', async ({ page }) => {
        const items = section(page, id).locator('.ds-card ul > li')
        for (let i = 0; i < 4; i++) {
          const strong = items.nth(i).locator('> strong')
          await expect(strong).toHaveCount(1)
          await expect(strong).toHaveText(/:$/)
          await expect(strong).toHaveCSS('font-weight', /^(600|700|800|900)$/)
        }
      })

      test(`should color the card ${color}`, async ({ page }) => {
        const card = section(page, id).locator('.ds-card')
        await expect(card).toHaveClass(new RegExp(`\\b${color}\\b`))
        for (const other of SECTIONS.filter(o => o.color !== color)) {
          await expect(card).not.toHaveClass(new RegExp(`\\b${other.color}\\b`))
        }
      })

      test('should label the section by its h2', async ({ page }) => {
        const region = section(page, id).locator('section[aria-labelledby]')
        await expect(region).toHaveAttribute('aria-labelledby', title)
        await expect(region.getByRole('heading', { level: 2 })).toHaveAttribute('id', title)
        await expect(
          page.getByRole('region', { name: 'Summary' }).nth(SECTIONS.findIndex(s => s.id === id)),
        ).toBeVisible()
      })
    })
  }
})

test.describe('layout', () => {
  test('should stack the title above the box below 1024px', async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 900 })
    await page.goto(URL)
    const cols = section(page, 'default').locator('.ds-col')
    await expect(cols.nth(1)).toBeVisible()
    const [a, b] = [await boxOf(cols.nth(0)), await boxOf(cols.nth(1))]
    expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1)
    expect(Math.abs(b.left - a.left)).toBeLessThanOrEqual(1)
  })

  test('should place the title left of the box from 1024px at 1/3 and 1/2', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto(URL)
    const cols = section(page, 'default').locator('.ds-col')
    await expect(cols.nth(1)).toBeVisible()
    const [a, b] = [await boxOf(cols.nth(0)), await boxOf(cols.nth(1))]
    expect(Math.abs(b.top - a.top)).toBeLessThanOrEqual(1)
    expect(b.left).toBeGreaterThanOrEqual(a.right - 1)
    const row = await boxOf(section(page, 'default').locator('.ds-grid'))
    expect(Math.abs(a.width / row.width - 1 / 3)).toBeLessThan(0.01)
    expect(Math.abs(b.width / row.width - 1 / 2)).toBeLessThan(0.01)
  })
})

test.describe('list indent', () => {
  for (const width of [1440, 400]) {
    test(`should equal --ds-list-native-indent @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(URL)
      const ul = section(page, 'default').locator('.ds-card ul')
      await expect(ul).toBeVisible()
      const { indent, expected } = await ul.evaluate((el: HTMLElement) => {
        // resolve the custom property to px through a probe's computed width
        const probe = document.createElement('div')
        probe.style.width = 'var(--ds-list-native-indent)'
        el.parentElement!.appendChild(probe)
        const expected = parseFloat(getComputedStyle(probe).width)
        probe.remove()
        const s = getComputedStyle(el)
        return {
          indent: parseFloat(s.marginLeft) + parseFloat(s.paddingInlineStart),
          expected,
        }
      })
      expect(expected).toBeGreaterThan(0)
      expect(indent).toBe(expected)
    })
  }
})
