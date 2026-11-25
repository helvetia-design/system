# ds-test-component — examples

Referenced from [SKILL.md](SKILL.md). Patterns to copy, not rules.

## Data-driven visual tests

Use a simple string array `VARIANTS` constant to avoid repetitive test code:

**Define VARIANTS with testid strings:**

```ts
const TAG = 'data'

const VARIANTS = ['basic', 'border', 'horizontal', 'multiline', 'required', 'disabled', 'custom-form'] as const

const image = screenshot(TAG)
```

**Loop through variants in forEach:**

```ts
test.describe('host', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/${CATEGORY}/${TAG}/test/${TAG}.visual.html`)
  })

  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(variant))
    })
  })
})
```

**If component has both style.html and visual.html:**

```ts
test.describe('style', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/${CATEGORY}/${TAG}/test/${TAG}.style.html`)
  })

  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(`style-${variant}`))
    })
  })
})

test.describe('host', () => {
  test.beforeEach('Setup', async ({ page }) => {
    await page.setupVisualTest(`/components/${CATEGORY}/${TAG}/test/${TAG}.visual.html`)
  })

  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const el = page.getByTestId(variant)
      await expectScreenshot(el, image(variant))
    })
  })
})
```

**Benefits:**

- **Simple** — just a string array, no complex objects
- **DRY** — one forEach covers all variants
- **Maintainable** — testid is both the test name and selector
- **Scalable** — works for any number of variants
- **Consistent** — matches the tag component pattern

## SSR test

**ssr.play.ts** — Renders `visual.html` with `renderToString`, takes one screenshot before and one after hydration, and compares both against the desktop baseline of the visual test:

```ts
import { renderToString } from '@helvetia-design/core/hydrate'
import { expectScreenshot, setupSsrVisualTest, test, visualBaseline } from '@helvetia-design/playwright'
import { TAG, VARIANTS } from './button.variants'

const baseline = visualBaseline(TAG)
const PAGE_URL = `/components/actions/${TAG}/test/${TAG}.visual.html`

test.describe('ssr', () => {
  VARIANTS.forEach(variant => {
    test(variant, async ({ page }) => {
      const ssr = await setupSsrVisualTest(page, PAGE_URL, renderToString)
      const el = page.getByTestId(variant)

      await expectScreenshot(el, baseline(variant))
      await ssr.hydrate()
      await expectScreenshot(el, baseline(variant))
    })
  })
})
```

## Client-only SSR test

```ts
import { renderToString } from '@helvetia-design/core/hydrate'
import { DsModal, mountSsr, test } from '@helvetia-design/playwright'

test.describe('ssr', () => {
  test('renders and hydrates', async ({ page }, testInfo) => {
    await mountSsr(page, '<ds-modal id="modal"></ds-modal>', renderToString, testInfo)
    await new DsModal(page.locator('ds-modal')).assertToBeClosed()
  })
})
```

## Workflow prompts

### Step 2: Confirm Visual Props

```
Detected props: color, size, disabled, loading, icon, label

Which are visual props? (deselect unwanted)
  ✓ color (enum)
  ✓ size (enum)
  ✓ disabled (state)
  ✓ loading (state)
  ✓ icon (prop)
  ✗ label (skip)
```

### Step 3: Confirm Slots

```
Detected slots: icon, label, badge

Which to demo? (deselect unwanted)
  ✓ icon
  ✓ label
  ✓ badge
```

### Step 4: Files Generated

```
✓ button.visual.play.ts (16 visual tests, from 8 fixture sections)
✓ button.component.play.ts (8 event + 4 state tests)
✓ button.po.ts (5 parts + 4 assertions)
✓ button.util.spec.ts (4 utils, 18 test cases)

Next: Review files, run tests: pnpm play, pnpm test
```

## Example: Button Component

### Fixture sections it reads (authored by the component-engineer):

```html
<!-- Basic -->
<section data-testid="basic">
  <span>Basic</span>
  <ds-button icon="plus">Button</ds-button>
</section>

<!-- Colors (enum) -->
<section data-testid="colors">
  <span>Colors</span>
  <ds-button color="primary">Primary</ds-button>
  <ds-button color="secondary">Secondary</ds-button>
  ...
</section>

<!-- Disabled (state) -->
<section data-testid="disabled">
  <span>Disabled</span>
  <ds-button disabled>Disabled</ds-button>
</section>

<!-- Icon slot demo -->
<section data-testid="slot-icon">
  <span>Slot: Icon</span>
  <ds-button><ds-icon name="plus"></ds-icon>Button</ds-button>
</section>
```

### Generated component test:

```ts
test('should fire dsClick event', async ({ page }) => {
  await page.mount(`<ds-button>Click me</ds-button>`)
  const dsButton = new DsButton(page.locator('ds-button'))
  const spy = await dsButton.el.spyOnEvent('dsClick')

  await dsButton.click()
  expect(spy).toHaveReceivedEventTimes(1)
})

test('should not fire dsClick when disabled', async ({ page }) => {
  await page.mount(`<ds-button disabled>Disabled</ds-button>`)
  const dsButton = new DsButton(page.locator('ds-button'))
  const spy = await dsButton.el.spyOnEvent('dsClick')

  await dsButton.assertToBeDisabled()
  expect(spy).toHaveReceivedEventTimes(0)
})
```

### Generated page object:

```ts
export class DsButton extends PageObject {
  readonly native = this.el.locator('[part="native"]')
  readonly spinner = this.el.locator('[part="spinner"]')
  readonly icon = this.el.locator('[part="icon"]')

  async click() {
    await this.native.click()
  }

  async assertToBeDisabled() {
    await expect(this.el).toHaveAttribute('disabled')
  }

  async assertToBeLoading() {
    await expect(this.el).toHaveAttribute('loading')
  }

  async hasValue(value: string) {
    await expect(this.el).toHaveValue(value)
  }
}
```
