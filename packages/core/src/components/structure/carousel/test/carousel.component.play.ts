import { DsCarousel, expect, test } from '@helvetia-design/playwright'

const ITEMS = `
  <ds-carousel-item name="s1"><div style="height:150px">Slide 1</div></ds-carousel-item>
  <ds-carousel-item name="s2"><div style="height:150px">Slide 2</div></ds-carousel-item>
  <ds-carousel-item name="s3"><div style="height:150px">Slide 3</div></ds-carousel-item>
`

test.describe('image variant — initial state', () => {
  test('selects the first item by default', async ({ page }) => {
    await page.mount(`<ds-carousel>${ITEMS}</ds-carousel>`)
    const carousel = new DsCarousel(page.locator('ds-carousel'))

    await carousel.assertItemSelected('s1')
    await carousel.assertItemNotSelected('s2')
  })

  test('respects a preset value prop', async ({ page }) => {
    await page.mount(`<ds-carousel value="s2">${ITEMS}</ds-carousel>`)
    const carousel = new DsCarousel(page.locator('ds-carousel'))

    await carousel.assertItemSelected('s2')
    await carousel.assertItemNotSelected('s1')
  })
})

test.describe('image variant — dsChange event', () => {
  test('emits dsChange when dot is clicked', async ({ page }) => {
    await page.mount(`<ds-carousel style="width:300px">${ITEMS}</ds-carousel>`)
    const carousel = new DsCarousel(page.locator('ds-carousel'))
    const spy = await carousel.el.spyOnEvent('dsChange')

    await carousel.clickDot(1)

    expect(spy).toHaveReceivedEventTimes(1)
  })
})

test.describe('tile variant — initial state', () => {
  test('selects the first item by default', async ({ page }) => {
    await page.mount(`
      <ds-carousel variant="tile" controls="large">
        <ds-carousel-item name="p1">Item 1</ds-carousel-item>
        <ds-carousel-item name="p2">Item 2</ds-carousel-item>
      </ds-carousel>
    `)
    const carousel = new DsCarousel(page.locator('ds-carousel'))
    await carousel.assertItemSelected('p1')
  })

  test('emits dsChange on item click', async ({ page }) => {
    await page.mount(`
      <ds-carousel variant="tile" controls="large">
        <ds-carousel-item name="p1">Item 1</ds-carousel-item>
        <ds-carousel-item name="p2">Item 2</ds-carousel-item>
      </ds-carousel>
    `)
    const carousel = new DsCarousel(page.locator('ds-carousel'))
    const spy = await carousel.el.spyOnEvent('dsChange')

    await carousel.item('p2').click()

    expect(spy).toHaveReceivedEventTimes(1)
    expect(spy).toHaveReceivedEventDetail({ value: 'p2' })
  })
})

test.describe('without ResizeObserver and IntersectionObserver', () => {
  for (const variant of ['tile', 'slide']) {
    test(`renders the ${variant} variant without throwing`, async ({ page }) => {
      await page.addInitScript(() => {
        delete (window as any).ResizeObserver
        delete (window as any).IntersectionObserver
      })
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text())
      })

      await page.mount(`<ds-carousel variant="${variant}">${ITEMS}</ds-carousel>`)
      const carousel = new DsCarousel(page.locator('ds-carousel'))

      await carousel.assertItemSelected('s1')
      expect(errors).toEqual([])
    })
  }
})

test.describe('moved in the DOM', () => {
  test('should still track the active slide on scroll after being moved', async ({ page }) => {
    await page.mount(`<ds-carousel style="width:300px">${ITEMS}</ds-carousel>`)
    const carousel = new DsCarousel(page.locator('ds-carousel'))

    await page.evaluate(() => {
      const newParent = document.createElement('div')
      document.body.appendChild(newParent)
      newParent.appendChild(document.querySelector('ds-carousel')!)
    })
    await page.waitForChanges()
    await carousel.el.locator('[part="track"]').evaluate(el => el.scrollTo({ left: el.clientWidth }))

    await carousel.assertItemSelected('s2')
  })
})
