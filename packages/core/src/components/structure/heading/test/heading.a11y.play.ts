import { test } from '@helvetia-design/playwright'

test('basic', async ({ page, a11y }) => {
  await page.mount(`<ds-heading>Heading</ds-heading>`)
  await a11y('ds-heading')
})

test('inverted', async ({ page, a11y }) => {
  await page.mount(`<div style="background: #333"><ds-heading inverted>Heading</ds-heading></div>`)
  await a11y('ds-heading')
})

test.describe('sizes', () => {
  const SIZES = [
    'display',
    'display-2',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    '5xl',
    '4xl',
    '3xl',
    '2xl',
    'xl',
    'lg',
    'md',
  ] as const
  SIZES.forEach(size => {
    test(size, async ({ page, a11y }) => {
      await page.mount(`<ds-heading level="${size}">Heading</ds-heading>`)
      await a11y(`ds-heading`)
    })
  })
})
