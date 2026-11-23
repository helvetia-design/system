import { DsModal, expect, mountSsr, test } from '@helvetia-design/playwright'
import { renderToString } from '@helvetia-design/core/hydrate'

const MARKUP = `
  <ds-modal id="modal">
    <ds-modal-header>Test Title</ds-modal-header>
    <ds-modal-body><p>Body content</p></ds-modal-body>
  </ds-modal>
`

test.describe('ssr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, MARKUP, renderToString, testInfo)

    const dsModal = new DsModal(page.locator('ds-modal'))
    await dsModal.assertToBeClosed()
  })
})

test.describe('slot attributes', () => {
  test('server markup assigns the header and body slots', async () => {
    const { html } = await renderToString(MARKUP)

    expect(html).toMatch(/<ds-modal-header\b[^>]*\sslot="header"/)
    expect(html).toMatch(/<ds-modal-body\b[^>]*\sslot="body"/)
  })
})
