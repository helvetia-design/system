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

test.describe('tile variant — itemsPerView string', () => {
  test('sets per-breakpoint item widths and updates on change', async ({ page }) => {
    await page.mount(`
      <ds-carousel variant="tile" items-per-view="1 tablet:2 desktop:3">
        <ds-carousel-item name="p1">Item 1</ds-carousel-item>
        <ds-carousel-item name="p2">Item 2</ds-carousel-item>
      </ds-carousel>
    `)
    const item = page.locator('ds-carousel-item').first()
    const vars = () =>
      item.evaluate(el => ['', '-tablet', '-desktop'].map(s => el.style.getPropertyValue(`--carousel-item-width${s}`)))
    expect(await vars()).toEqual(['calc(100% / 1)', 'calc(100% / 2)', 'calc(100% / 3)'])

    await page.locator('ds-carousel').evaluate((el: HTMLDsCarouselElement) => (el.itemsPerView = 2))
    await page.waitForChanges()
    expect(await vars()).toEqual(['calc(100% / 2)', '', ''])
  })
})

test.describe('image variant — below controls', () => {
  test('prev is disabled at start, next scrolls forward and becomes focusable', async ({ page }) => {
    await page.mount(`<ds-carousel controls="large-below" style="width:300px">${ITEMS}</ds-carousel>`)
    const carousel = new DsCarousel(page.locator('ds-carousel'))

    await expect(carousel.scrollBtnBelow('prev')).toHaveAttribute('aria-disabled', 'true')
    await expect(carousel.scrollBtnBelow('next')).not.toHaveAttribute('aria-disabled', 'true')

    await carousel.scrollBtnBelow('next').focus()
    await expect(carousel.scrollBtnBelow('next')).toBeFocused()
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

const IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

test.describe('image variant — alt text', () => {
  let warnings: string[]

  test.beforeEach(({ page }) => {
    warnings = []
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('[ds-carousel-item]')) warnings.push(msg.text())
    })
  })

  test('renders the alt prop on the image without warning', async ({ page }) => {
    await page.mount(
      `<ds-carousel><ds-carousel-item name="s1" src="${IMAGE}" alt="A logo"></ds-carousel-item></ds-carousel>`,
    )

    await expect(page.locator('ds-carousel-item img')).toHaveAttribute('alt', 'A logo')
    await page.waitForChanges()
    expect(warnings).toHaveLength(0)
  })

  test('does not warn for a decorative image with an empty alt', async ({ page }) => {
    await page.mount(`<ds-carousel><ds-carousel-item name="s1" src="${IMAGE}" alt=""></ds-carousel-item></ds-carousel>`)

    await expect(page.locator('ds-carousel-item img')).toHaveAttribute('alt', '')
    await page.waitForChanges()
    expect(warnings).toHaveLength(0)
  })

  test('renders an empty alt and warns once when alt is not set', async ({ page }) => {
    await page.mount(`<ds-carousel><ds-carousel-item name="s1" src="${IMAGE}"></ds-carousel-item></ds-carousel>`)

    await expect(page.locator('ds-carousel-item img')).toHaveAttribute('alt', '')
    await page.waitForChanges()
    expect(warnings).toHaveLength(1)
  })

  test('does not warn for tile items with src', async ({ page }) => {
    await page.mount(
      `<ds-carousel variant="tile"><ds-carousel-item name="t1" src="${IMAGE}">Tile</ds-carousel-item></ds-carousel>`,
    )

    await expect(page.locator('ds-carousel-item img')).toHaveCount(0)
    await page.waitForChanges()
    expect(warnings).toHaveLength(0)
  })
})
