import { DsHint, expect, mountSsr, test } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'

const MARKUP = `
  <ds-hint>
    <ds-hint-title>Title</ds-hint-title>
    <ds-hint-text>Body content.</ds-hint-text>
  </ds-hint>
`

test.describe('ssr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, MARKUP, renderToString, testInfo)

    const dsHint = new DsHint(page.locator('ds-hint'))
    await dsHint.assertToBeClosed()
  })
})

test.describe('slot attributes', () => {
  test('server markup assigns the title slot', async () => {
    const { html } = await renderToString(MARKUP)

    expect(html).toMatch(/<ds-hint-title\b[^>]*\sslot="title"/)
  })
})
