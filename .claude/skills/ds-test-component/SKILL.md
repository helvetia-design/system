---
name: ds-test-component
description: Auto-generate a DS component's unit, interaction and visual test files plus its Playwright Page Object. Use when creating new components or setting up test coverage. Accessibility tests (.a11y.play.ts) are the a11y-expert's — this skill does not write them.
---

# Test Component

Auto-generates a component's unit, interaction and visual test files plus its Playwright Page
Object. It reads the component-engineer's visual fixture; it never writes one.

## Quick Start

Generate tests for a component:

```bash
ds-test-component button
```

Process:

1. Parse component props, events, slots, parts, states
2. Read the visual fixture's `data-testid` sections
3. Show checklists for visual props and slots
4. Generate the test files (or fewer if not applicable)
5. Report summary with test counts

Output files:

- `button.visual.play.ts` — Playwright visual regression tests
- `button.component.play.ts` — Event and behavior tests
- `button.po.ts` — Page object in `packages/playwright/src/lib/components/`
- `button.util.spec.ts` — Unit tests (if `.util.ts` exists)

**Not written here:**

| File                                 | Owner                                         |
| ------------------------------------ | --------------------------------------------- |
| `button.visual.html` / `.style.html` | component-engineer (`ds-implement-component`) |
| `button.a11y.play.ts`                | a11y-expert (`ds-a11y-test`)                  |

The **visual fixture is an input, not an output.** The component-engineer builds it so a human
can review the component before any test exists; this skill reads its
`<section data-testid="…">` values to decide what to screenshot. If the fixture is missing the
skill stops with an error — ask for it rather than authoring one, or the screenshot baseline
gets taken over a component nobody has looked at.

A variant with no section gets no screenshot, so an incomplete fixture silently means
incomplete visual coverage. Report the sections you found.

## What Gets Generated

### 1. Visual Tests

**visual.play.ts** — Playwright tests, with `VARIANTS` read from the engineer's fixture:

- "style" suite: screenshots from `button.style.html`
- "host" suite: screenshots from `button.visual.html`
- One test per variant

#### Data-Driven Test Pattern (VARIANTS constant)

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

### 2. Component Tests

**component.play.ts** — Behavior tests:

- **Event tests** — Auto-discovered from `@Event()` decorators
  - Verify each event fires
  - Verify event doesn't fire when expected (e.g., disabled)
- **State tests** — Auto-discovered from boolean props
  - Assertions for each state (disabled, loading, invalid, etc.)
- **Slot tests** — Verify each slot renders correctly
- **Value tests** — If component has `value` prop, test `hasValue()` assertion

### 3. Page Object

**button.po.ts** — Page object for testing:

- **Part locators** — `readonly` property for each `@part` JSDoc tag
  - Pattern: `native = this.el.locator('[part="native"]')`
- **Action methods** — `click()`, `focus()`, etc.
- **Assertion methods** — `assertToBeDisabled()`, `assertToBeLoading()`, etc.
  - One method per boolean state prop
  - Plus `hasValue()` if component has `value` prop`

Located in: `packages/playwright/src/lib/components/button.po.ts`

### 4. Unit Tests (if applicable)

**button.util.spec.ts** — Tests for utility functions:

- Auto-detects `button.util.ts` if it exists
- Generates comprehensive test cases per function
  - Happy paths (valid inputs → expected outputs)
  - Edge cases (undefined, null, empty string, invalid values)
  - Type variations (if function accepts multiple types)
- Ready to run with `pnpm test`

## Workflow

### Step 1: Invoke

```bash
ds-test-component button
```

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

## Key Behaviors

- ✅ **Auto-discovers events** from `@Event()` decorators
- ✅ **Auto-discovers states** from boolean props (disabled, loading, invalid, checked, etc.)
- ✅ **Auto-discovers slots** from `render()` JSX, auto-generates demo content
- ✅ **Auto-discovers parts** from `@part` JSDoc tags
- ✅ **Auto-discovers utils** — generates comprehensive tests if `.util.ts` exists
- ✅ **Never skips visual props** that user confirms — all get sections
- ✅ **Never skips events or states** — all get test coverage
- ✅ **Comprehensive unit tests** — not stubs; edge cases included

## Related

See [REFERENCE.md](REFERENCE.md) for detailed generation rules for each test type.
