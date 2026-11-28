import { DsProgressBar, expect, test } from '@helvetia-design/playwright'
import { PROGRESS_BAR_BACKGROUNDS, PROGRESS_BAR_COLORS } from '../progress-bar.interfaces'

test.describe('component', () => {
  const WIDTH_CASES = [0, 50, 100]
  WIDTH_CASES.forEach(value => {
    test(`should set line width to ${value}%`, async ({ page }) => {
      await page.mount(`<ds-progress-bar value="${value}"></ds-progress-bar>`)
      const bar = new DsProgressBar(page.locator('ds-progress-bar'))

      await bar.assertLineWidth(value)
      await bar.assertValueNow(value)
    })
  })

  test('should render the line at half of the track at 50', async ({ page }) => {
    await page.mount(`<div style="width: 200px"><ds-progress-bar value="50"></ds-progress-bar></div>`)
    const bar = new DsProgressBar(page.locator('ds-progress-bar'))

    await bar.assertLineWidth(50)
    const { line, track } = await bar.getWidths()
    expect(line).toBeCloseTo(track / 2, 1)
  })

  const CLAMP_CASES = [
    { name: '150 to 100', value: 150, expected: 100 },
    { name: '-5 to 0', value: -5, expected: 0 },
    { name: 'NaN to 0', value: NaN, expected: 0 },
  ]
  CLAMP_CASES.forEach(({ name, value, expected }) => {
    test(`should clamp ${name}`, async ({ page }) => {
      await page.mount(`<ds-progress-bar></ds-progress-bar>`)
      const bar = new DsProgressBar(page.locator('ds-progress-bar'))
      await bar.setValue(value)

      await bar.assertLineWidth(expected)
      await bar.assertValueNow(expected)
    })
  })

  test('should fill the track exactly at value 100 with an odd container width', async ({ page }) => {
    await page.mount(`<div style="width: 321.6px"><ds-progress-bar value="100"></ds-progress-bar></div>`)
    const bar = new DsProgressBar(page.locator('ds-progress-bar'))

    await bar.assertLineWidth(100)
    const { line, track } = await bar.getWidths()
    expect(track).toBeCloseTo(321.6, 1)
    expect(line).toBeCloseTo(track, 2)
    expect(line).toBeLessThanOrEqual(track)
  })

  PROGRESS_BAR_COLORS.forEach(color => {
    test(`should render color ${color}`, async ({ page }) => {
      await page.mount(`<ds-progress-bar value="50" color="${color}"></ds-progress-bar>`)
      const bar = new DsProgressBar(page.locator('ds-progress-bar'))

      await expect(bar.el).toHaveClass(new RegExp(`\\bis-${color}\\b`))
    })
  })

  PROGRESS_BAR_BACKGROUNDS.forEach(background => {
    test(`should render background ${background}`, async ({ page }) => {
      await page.mount(`<ds-progress-bar value="50" background="${background}"></ds-progress-bar>`)
      const bar = new DsProgressBar(page.locator('ds-progress-bar'))

      await expect(bar.el).toHaveClass(new RegExp(`\\bis-${background}\\b`))
    })
  })
})
