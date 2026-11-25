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

test.describe('tile variant — keyboard selection', () => {
  const TILES = `
    <ds-carousel variant="tile" controls="large">
      <ds-carousel-item name="p1">Item 1</ds-carousel-item>
      <ds-carousel-item name="p2">Item 2</ds-carousel-item>
    </ds-carousel>
    <div style="height:3000px"></div>
  `

  for (const key of ['Enter', 'Space']) {
    test(`${key} selects the focused tile`, async ({ page }) => {
      await page.mount(TILES)
      const carousel = new DsCarousel(page.locator('ds-carousel'))
      const changeSpy = await carousel.el.spyOnEvent('dsChange')
      const itemSpy = await page.locator('ds-carousel-item[name="p2"]').spyOnEvent('dsCarouselItemSelect')

      await carousel.item('p2').focus()
      await page.keyboard.press(key)

      expect(changeSpy).toHaveReceivedEventTimes(1)
      expect(changeSpy).toHaveReceivedEventDetail({ value: 'p2' })
      expect(itemSpy).toHaveReceivedEventDetail({ name: 'p2' })
      await carousel.assertItemSelected('p2')
    })
  }

  test('Space does not scroll the page', async ({ page }) => {
    await page.mount(TILES)
    const carousel = new DsCarousel(page.locator('ds-carousel'))

    await carousel.item('p2').focus()
    await page.keyboard.press('Space')

    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('other keys do not select the tile', async ({ page }) => {
    await page.mount(TILES)
    const carousel = new DsCarousel(page.locator('ds-carousel'))
    const changeSpy = await carousel.el.spyOnEvent('dsChange')

    await carousel.item('p2').focus()
    await page.keyboard.press('a')

    expect(changeSpy).toHaveReceivedEventTimes(0)
    await carousel.assertItemNotSelected('p2')
  })

  test('Enter on a slotted button activates the button and selects the tile', async ({ page }) => {
    await page.mount(`
      <ds-carousel variant="tile" controls="large">
        <ds-carousel-item name="p1">Item 1</ds-carousel-item>
        <ds-carousel-item name="p2"><button type="button" onclick="window.innerClicks = (window.innerClicks || 0) + 1">Item 2</button></ds-carousel-item>
      </ds-carousel>
    `)
    const carousel = new DsCarousel(page.locator('ds-carousel'))
    const changeSpy = await carousel.el.spyOnEvent('dsChange')

    await carousel.item('p2').locator('button').focus()
    await page.keyboard.press('Enter')

    expect(await page.evaluate(() => (window as any).innerClicks)).toBe(1)
    expect(changeSpy).toHaveReceivedEventTimes(1)
    await carousel.assertItemSelected('p2')
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
