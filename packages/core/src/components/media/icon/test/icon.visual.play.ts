import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, expectScreenshot, screenshot, test } from '@helvetia-design/playwright'
import { TAG, VARIANTS } from './icon.variants'

const image = screenshot(TAG)

test.beforeEach('Setup', async ({ page }) => {
  await page.setupVisualTest(`/components/media/${TAG}/test/${TAG}.visual.html`)
})

VARIANTS.forEach(variant => {
  test(variant, async ({ page }) => {
    const el = page.getByTestId(variant)
    await expectScreenshot(el, image(variant))
  })
})

// Every UI icon from the generated list (assets build output), so new icons extend the snapshot.
test('all-icons', async ({ page }) => {
  const names: string[] = JSON.parse(
    readFileSync(join(process.cwd(), '..', 'assets', 'src', 'icons', 'svg.json'), 'utf8'),
  ).sort()
  expect(names.length).toBeGreaterThan(0)

  await page.evaluate(names => {
    const grid = document.createElement('div')
    grid.dataset['testid'] = 'all-icons'
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,150px);gap:8px;padding:8px;width:1200px'
    grid.innerHTML = names
      .map(
        n =>
          `<div style="display:flex;align-items:center;gap:8px;font:10px monospace"><ds-icon name="${n}"></ds-icon><ds-icon name="${n}" size="md"></ds-icon><span>${n}</span></div>`,
      )
      .join('')
    document.body.replaceChildren(grid)
  }, names)
  await page.waitForChanges()

  await expectScreenshot(page.getByTestId('all-icons'), image('all-icons'))
})
