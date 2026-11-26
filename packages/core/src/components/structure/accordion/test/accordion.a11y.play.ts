import { DsAccordion, expect, test, type DsPage } from '@helvetia-design/playwright'
import type { Locator, Page } from '@playwright/test'

test('basic', async ({ page, a11y }) => {
  await page.mount(`
    <ds-accordion summary-title>
    <div slot="summary">Details</div>
    <div slot="content" class="s-bg-1 s-height-4rem"></div>
  </ds-accordion>`)
  await a11y('ds-accordion')
})

test('open', async ({ page, a11y }) => {
  await page.mount(`
    <ds-accordion summary-title open>
    <div slot="summary">Details</div>
    <div slot="content" class="s-bg-1 s-height-4rem"></div>
  </ds-accordion>`)
  await a11y('ds-accordion')
})

/**
 * HELPERS
 * ─────────────────────────────────────────────────────
 */

const row = (summary: string, attrs = '', content = `<p slot="content">Answer to ${summary}.</p>`) => `
  <li>
    <ds-accordion list ${attrs}>
      <span slot="summary">${summary}</span>
      ${content}
    </ds-accordion>
  </li>`

/**
 * Nested rows go in a `section` slot wrapper (ADR 0040): `section` is a "special" element for the HTML
 * parser's li start-tag rule, so the inner `<li>` doesn't close the outer one. A bare
 * `<ds-list slot="content">` would be torn apart by the parser (custom elements are transparent to it).
 */
const nested = (rows: string) => `<section slot="content"><ds-list>${rows}</ds-list></section>`

/** Summary button of the accordion whose summary slot holds `name` (native `button` in the shadow root). */
const summaryButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

/** WCAG relative-luminance contrast ratio of a text/UI color against the flattened backdrop behind `el`. */
const contrast = async (locator: Locator, kind: 'text' | 'fill' | 'border' | 'focus') => {
  const result = await measureContrast(locator, kind)
  test.info().annotations.push({ type: `contrast:${kind}`, description: JSON.stringify(result) })
  return result
}

const measureContrast = async (locator: Locator, kind: 'text' | 'fill' | 'border' | 'focus') =>
  locator.evaluate((el: Element, kind: string) => {
    const parse = (value: string): [number, number, number, number] => {
      const m = value.match(/rgba?\(([^)]+)\)/)
      if (!m) throw new Error(`Unparseable color: ${value}`)
      const p = m[1]
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number)
      return [p[0], p[1], p[2], p[3] ?? 1]
    }
    const lum = ([r, g, b]: number[]) => {
      const c = [r, g, b].map(v => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    }
    const parentOf = (node: Element): Element | null =>
      (node.assignedSlot as Element | null) ??
      node.parentElement ??
      ((node.getRootNode() as ShadowRoot).host as Element | undefined) ??
      null

    // Flatten backgrounds along the composed tree, nearest layer on top, white canvas below.
    const layers: number[][] = []
    for (let n: Element | null = el; n; n = parentOf(n)) {
      const bg = parse(getComputedStyle(n).backgroundColor)
      if (bg[3] > 0) layers.push(bg)
      if (bg[3] === 1) break
    }
    let backdrop = [255, 255, 255]
    for (const [r, g, b, a] of layers.reverse()) {
      backdrop = [r * a + backdrop[0] * (1 - a), g * a + backdrop[1] * (1 - a), b * a + backdrop[2] * (1 - a)]
    }

    let fg: string
    if (kind === 'text') fg = getComputedStyle(el).color
    else if (kind === 'fill') fg = getComputedStyle(el).fill
    else if (kind === 'border') fg = getComputedStyle(el, '::after').backgroundColor
    else {
      // Focus ring = outermost box-shadow layer on ::before (`vars.focus-styles`).
      const shadow = getComputedStyle(el, '::before').boxShadow
      const colors = shadow.match(/rgba?\([^)]+\)/g) ?? []
      if (colors.length === 0) throw new Error(`No focus ring: ${shadow}`)
      fg = colors[colors.length - 1]
    }
    const [r, g, b, a] = parse(fg)
    const flat = [r * a + backdrop[0] * (1 - a), g * a + backdrop[1] * (1 - a), b * a + backdrop[2] * (1 - a)]
    const [l1, l2] = [lum(flat), lum(backdrop)].sort((x, y) => y - x)
    return { ratio: Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100, fg, backdrop: `rgb(${backdrop.join(',')})` }
  }, kind)

/** Inner `#summary` button of a ds-accordion host (shadow root), for computed-style reads. */
const shadowSummary = (accordion: Locator) => accordion.locator('#summary')

/**
 * AXE — LIST ROWS (`ds-list > li > ds-accordion[list]`)
 * ─────────────────────────────────────────────────────
 */

test.describe('list', () => {
  test('list closed', async ({ page, a11y }) => {
    await page.mount(`<ds-list>${row('Question one', 'group="faq"')}${row('Question two', 'group="faq"')}</ds-list>`)
    await a11y('ds-list')
  })

  test('list open with markers', async ({ page, a11y }) => {
    await page.mount(`
      <ds-list>
        ${row('Caret open', 'group="faq" open')}
        ${row('Plus minus', 'group="faq" marker="plus-minus"')}
        ${row('Marker left', 'group="faq" marker-position="left"')}
        ${row('No marker', 'group="faq" marker="none"')}
      </ds-list>`)
    await a11y('ds-list')
  })

  test('list-nested', async ({ page, a11y }) => {
    await page.mount(`
      <ds-list>
        ${row('Switzerland', 'open', nested(`${row('Bern', 'open')}${row('Zurich')}`))}
        ${row('Belgium', 'open', nested(`${row('Brussels')}${row('Antwerp', 'open')}`))}
      </ds-list>`)
    // Both parents open, so every nested row is rendered (axe skips hidden content) and really sits in
    // its parent's region, not hoisted into the outer list by the HTML parser.
    // (Locator chaining doesn't follow slots, so walk the light DOM; the a11y tree is asserted in `semantics`.)
    const outerRows = page.locator('ds-list').first().locator(':scope > li')
    await expect(outerRows).toHaveCount(2)
    for (const [index, children] of [
      [0, ['Bern', 'Zurich']],
      [1, ['Brussels', 'Antwerp']],
    ] as const) {
      const innerRows = outerRows.nth(index).locator(':scope > ds-accordion > section[slot="content"] > ds-list > li')
      await expect(innerRows).toHaveCount(2)
      for (const child of children) {
        await expect(innerRows.getByRole('button', { name: child, exact: true })).toBeVisible()
      }
    }
    await a11y('ds-list')
  })

  test('list-lg', async ({ page, a11y }) => {
    await page.mount(`<ds-list size="lg">${row('Large closed')}${row('Large open', 'open')}</ds-list>`)
    await a11y('ds-list')
  })

  test('list-inverted', async ({ page, a11y }) => {
    await page.mount(`
      <div class="bg-primary p-base" data-testid="surface">
        <ds-list inverted>${row('Inverted closed')}${row('Inverted open', 'open')}</ds-list>
        <ds-accordion inverted>
          <span slot="summary">Standalone inverted</span>
          <p slot="content">Content.</p>
        </ds-accordion>
        <ds-accordion inverted button button-label-open="Close" button-label-close="Open">
          <p slot="content">Content.</p>
        </ds-accordion>
      </div>`)
    await a11y('[data-testid="surface"]')
  })

  test('list-precedence', async ({ page, a11y }) => {
    await page.mount(`
      <ds-list>
        ${row('Plain list row', 'button button-color="danger" summary-title summary-visual-level="h1"')}
      </ds-list>`)
    await a11y('ds-list')
    // `list` wins: still a native button inside the heading, not a ds-button.
    const button = summaryButton(page, 'Plain list row')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('heading', { level: 3, name: 'Plain list row' })).toBeVisible()
  })
})

/**
 * SEMANTICS — grouping patterns (ds-accordion-brief.md, "Accessibility contract")
 * ─────────────────────────────────────────────────────
 */

test.describe('semantics', () => {
  test('ds-list exposes a list with N items, one row each', async ({ page }) => {
    await page.mount(`
      <ds-list>${row('Question one', 'group="faq"')}${row('Question two', 'group="faq"')}${row('Question three', 'group="faq"')}</ds-list>`)

    await expect(page.locator('ds-list')).toMatchAriaSnapshot(`
      - list:
        - listitem:
          - heading "Question one" [level=3]:
            - button "Question one" [expanded=false]
        - listitem:
          - heading "Question two" [level=3]:
            - button "Question two" [expanded=false]
        - listitem:
          - heading "Question three" [level=3]:
            - button "Question three" [expanded=false]
    `)
  })

  test('nested ds-list is its own list inside the parent region', async ({ page }) => {
    await page.mount(`
      <ds-list>
        ${row('Switzerland', 'open', nested(`${row('Bern')}${row('Zurich')}`))}
        ${row('Belgium')}
      </ds-list>`)

    // Parser guard: authored as an HTML string, the inner rows must stay inside the inner ds-list.
    await expect(page.locator('ds-list').first().locator(':scope > li')).toHaveCount(2)
    await expect(page.locator('section[slot="content"] > ds-list > li')).toHaveCount(2)
    await expect(page.locator('ds-list').first()).toMatchAriaSnapshot(`
      - list:
        - listitem:
          - heading "Switzerland" [level=3]:
            - button "Switzerland" [expanded=true]
          - region "Switzerland":
            - list:
              - listitem:
                - heading "Bern" [level=3]:
                  - button "Bern" [expanded=false]
              - listitem:
                - heading "Zurich" [level=3]:
                  - button "Zurich" [expanded=false]
        - listitem:
          - heading "Belgium" [level=3]:
            - button "Belgium" [expanded=false]
    `)
  })

  test('heading above: summary-level nests under the section heading', async ({ page, a11y }) => {
    await page.mount(`
      <section data-testid="faq">
        <h2>Frequently asked questions</h2>
        <ds-list>${row('Question one', 'summary-level="h3"')}${row('Question two', 'summary-level="h3"')}</ds-list>
      </section>`)

    await a11y('[data-testid="faq"]')
    await expect(page.getByRole('heading', { level: 2, name: 'Frequently asked questions' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(2)
    await expect(
      page.getByRole('heading', { level: 3, name: 'Question one' }).getByRole('button'),
    ).toHaveAccessibleName('Question one')
  })

  test('summary-level is configurable', async ({ page }) => {
    await page.mount(`<ds-list>${row('Level four', 'summary-level="h4"')}</ds-list>`)
    await expect(page.getByRole('heading', { level: 4, name: 'Level four' })).toBeVisible()
  })

  test('role="group" with aria-labelledby when there is no visible heading', async ({ page, a11y }) => {
    await page.mount(`
      <div role="group" aria-labelledby="faq-label" data-testid="group">
        <span id="faq-label" hidden>Frequently asked questions</span>
        <ds-accordion group="faq"><span slot="summary">Question one</span><p slot="content">One.</p></ds-accordion>
        <ds-accordion group="faq"><span slot="summary">Question two</span><p slot="content">Two.</p></ds-accordion>
      </div>`)

    await a11y('[data-testid="group"]')
    const group = page.getByRole('group', { name: 'Frequently asked questions' })
    await expect(group).toBeVisible()
    await expect(group.getByRole('button')).toHaveCount(2)
    // The group must never be a landmark region.
    await expect(page.getByRole('region', { name: 'Frequently asked questions' })).toHaveCount(0)
    await expect(page.locator('[data-testid="group"]')).not.toHaveAttribute('role', 'region')
  })

  test('list adds no role to the accordion host', async ({ page }) => {
    await page.mount(`<ds-list>${row('Question one')}</ds-list>`)
    await expect(page.locator('ds-accordion')).not.toHaveAttribute('role')
    await expect(page.locator('ds-list li')).toHaveCount(1)
  })
})

/**
 * ARIA STATE
 * ─────────────────────────────────────────────────────
 */

test.describe('aria', () => {
  test('summary is a native button with aria-expanded and aria-controls the labelled region', async ({ page }) => {
    await page.mount(`<ds-list>${row('Question one')}</ds-list>`)
    const accordion = new DsAccordion(page.locator('ds-accordion'))

    await expect(accordion.summary).toHaveJSProperty('tagName', 'BUTTON')
    await expect(accordion.summary).toHaveAttribute('type', 'button')
    await expect(accordion.summary).toHaveAttribute('aria-expanded', 'false')
    await expect(accordion.summary).toHaveAttribute('aria-controls', 'content')
    await expect(accordion.content).toHaveAttribute('id', 'content')
    await expect(accordion.content).toBeHidden()
    await expect(page.getByRole('region', { name: 'Question one' })).toHaveCount(0)

    await accordion.clickSummary()

    await expect(accordion.summary).toHaveAttribute('aria-expanded', 'true')
    await expect(accordion.content).toBeVisible()
    await expect(page.getByRole('region', { name: 'Question one' })).toBeVisible()
  })

  test('group: opening a row sets aria-expanded=false on the other row', async ({ page }) => {
    await page.mount(
      `<ds-list>${row('Question one', 'group="faq" open')}${row('Question two', 'group="faq"')}</ds-list>`,
    )

    await expect(summaryButton(page, 'Question one')).toHaveAttribute('aria-expanded', 'true')
    await summaryButton(page, 'Question two').focus()
    await page.keyboard.press('Enter')
    await expect(summaryButton(page, 'Question two')).toHaveAttribute('aria-expanded', 'true')
    await expect(summaryButton(page, 'Question one')).toHaveAttribute('aria-expanded', 'false')
  })
})

/**
 * KEYBOARD
 * ─────────────────────────────────────────────────────
 */

test.describe('keyboard', () => {
  test('Enter toggles a list row and keeps focus on the summary', async ({ page }) => {
    await page.mount(`<ds-list>${row('Question one')}</ds-list>`)
    const button = summaryButton(page, 'Question one')

    await button.focus()
    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(button).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).toBeFocused()
  })

  test('Space toggles a list row and keeps focus on the summary', async ({ page }) => {
    await page.mount(`<ds-list>${row('Question one')}</ds-list>`)
    const button = summaryButton(page, 'Question one')

    await button.focus()
    await page.keyboard.press('Space')
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(button).toBeFocused()
    await page.keyboard.press('Space')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).toBeFocused()
  })

  test('Tab skips closed content and enters open content in DOM order', async ({ page }) => {
    await page.mount(`
      <button data-testid="before">Before</button>
      <ds-list>
        ${row('Question one', '', `<p slot="content"><a href="#one">Link one</a></p>`)}
        ${row('Question two')}
      </ds-list>`)

    await page.getByTestId('before').focus()
    await page.keyboard.press('Tab')
    await expect(summaryButton(page, 'Question one')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(summaryButton(page, 'Question two')).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(summaryButton(page, 'Question one')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(summaryButton(page, 'Question one')).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Link one' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(summaryButton(page, 'Question two')).toBeFocused()
  })

  test('nested: Enter on an inner row leaves the parent open', async ({ page }) => {
    await page.mount(`
      <ds-list>
        ${row('Switzerland', 'open', nested(`${row('Bern')}${row('Zurich')}`))}
      </ds-list>`)

    const parentContent = page.locator('ds-list > li > ds-accordion > section[slot="content"]')
    await expect(parentContent.getByRole('button', { name: 'Bern', exact: true })).toBeVisible()
    await summaryButton(page, 'Bern').focus()
    await page.keyboard.press('Enter')
    await expect(summaryButton(page, 'Bern')).toHaveAttribute('aria-expanded', 'true')
    await expect(summaryButton(page, 'Switzerland')).toHaveAttribute('aria-expanded', 'true')
  })
})

/**
 * CONTRAST — inverted rows on bg-primary (1.4.3 text, 1.4.11 border + focus ring)
 * axe's color-contrast rule cannot see text over pseudo-element / transparent shadow
 * backgrounds reliably, so ratios are computed from the rendered styles.
 * ─────────────────────────────────────────────────────
 */

test.describe('contrast inverted', () => {
  const mountInverted = async (page: DsPage, mode: 'list' | 'standalone') => {
    await page.mount(
      mode === 'list'
        ? `<div class="bg-primary p-base"><ds-list inverted>${row('Inverted row')}${row('Second row')}</ds-list></div>`
        : `<div class="bg-primary p-base"><ds-accordion inverted list><span slot="summary">Inverted row</span><p slot="content">Content.</p></ds-accordion></div>`,
    )
    // Selector-level nth keeps the E2ELocator type that DsAccordion needs (`.first()` returns a plain Locator).
    return page.locator('ds-accordion >> nth=0')
  }

  for (const mode of ['list', 'standalone'] as const) {
    test(`${mode}: summary text base >= 4.5:1`, async ({ page }) => {
      const accordion = await mountInverted(page, mode)
      const result = await contrast(shadowSummary(accordion), 'text')
      expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(4.5)
    })

    test(`${mode}: summary text hover >= 4.5:1`, async ({ page }) => {
      const accordion = await mountInverted(page, mode)
      await shadowSummary(accordion).hover()
      const result = await contrast(shadowSummary(accordion), 'text')
      expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(4.5)
    })

    test(`${mode}: summary text active >= 4.5:1`, async ({ page }) => {
      const accordion = await mountInverted(page, mode)
      await shadowSummary(accordion).hover()
      await page.mouse.down()
      const result = await contrast(shadowSummary(accordion), 'text')
      await page.mouse.up()
      expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(4.5)
    })

    test(`${mode}: focus ring >= 3:1`, async ({ page }) => {
      const accordion = await mountInverted(page, mode)
      await page.keyboard.press('Tab')
      await expect(shadowSummary(accordion)).toBeFocused()
      const result = await contrast(shadowSummary(accordion), 'focus')
      expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(3)
    })
  }

  test('list: row bottom border ratio is reported (1.4.11 does not require it)', async ({ page }) => {
    const accordion = await mountInverted(page, 'list')
    const result = await contrast(shadowSummary(accordion), 'border')
    // Row separators are decorative; the button's state is conveyed by text + marker, so no 3:1 floor applies.
    expect(result.ratio).toBeGreaterThan(1)
  })

  test('list: marker icon >= 3:1', async ({ page }) => {
    const accordion = await mountInverted(page, 'list')
    // ds-icon paints its svg with `fill`; measure the painted path, not the host `color`.
    const path = new DsAccordion(accordion).marker.locator('svg path').first()
    const result = await contrast(path, 'fill')
    expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(3)
  })

  // Unstyled slotted content must inherit a readable color from the inverted host (1.4.3).
  const openContent = {
    'ds-list inverted row': `<ds-list inverted>${row('Inverted open', 'open', '<p slot="content">Content text.</p>')}</ds-list>`,
    'standalone ds-accordion inverted': `<ds-accordion inverted open><span slot="summary">Standalone</span><p slot="content">Content text.</p></ds-accordion>`,
    'standalone ds-accordion inverted list': `<ds-accordion inverted list open><span slot="summary">Standalone list</span><p slot="content">Content text.</p></ds-accordion>`,
  }

  for (const [name, markup] of Object.entries(openContent)) {
    test(`${name}: open content text >= 4.5:1`, async ({ page }) => {
      await page.mount(`<div class="bg-primary p-base">${markup}</div>`)
      const content = page.locator('p[slot="content"]')
      await expect(content).toBeVisible()
      const result = await contrast(content, 'text')
      expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(4.5)
    })
  }
})
