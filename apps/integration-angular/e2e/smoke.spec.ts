import { expect, test } from '@playwright/test'

test('renders without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'ds-angular smoke test' })).toBeVisible()
  expect(errors).toEqual([])
})

test('logs no NG0912 component ID collision', async ({ page }) => {
  const collisions: string[] = []
  page.on('console', message => {
    if (message.text().includes('NG0912')) {
      collisions.push(message.text())
    }
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'ds-angular smoke test' })).toBeVisible()
  expect(collisions).toEqual([])
})
