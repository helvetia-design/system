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
- `button.variants.ts` — `TAG` + `HOST_VARIANTS`, derived from the fixture, shared by the
  visual and SSR tests
- `button.ssr.play.ts` — SSR screenshots before and after hydration (only when the component has a `.host.scss`)
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

The chain:

```
test/<name>.visual.html        ← component-engineer, human-approved
  └─ test/<name>.variants.ts   → TAG + HOST_VARIANTS
       ├─ .visual.play.ts      (host suite)
       └─ .ssr.play.ts         (same variants, same baselines)
```

`.ssr.play.ts` uses `visualBaseline(TAG)`, so it reuses the **visual test's** snapshots rather
than keeping its own. Both suites must therefore iterate the same `HOST_VARIANTS` — which is
why the list lives in one file. Adding a variant to one suite only yields a missing-baseline
error, not a diff.

**SSR is skipped for CSS-only components.** No `.host.scss` means no shadow root to hydrate,
so there is nothing to assert — `form`, `link`, `table`, `grid`, `picture` and `time-input`
have no SSR test for this reason.

## What Gets Generated

### 1. Visual Tests

**visual.play.ts** — Playwright tests, with `VARIANTS` read from the engineer's fixture:

- "style" suite: screenshots from `button.style.html`
- "host" suite: screenshots from `button.visual.html`
- One test per variant

Loop a `VARIANTS` string array (each value is both test name and `data-testid`) — see [examples.md](examples.md#data-driven-visual-tests).

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

### 5. SSR Tests

**variants.ts** — Holds the variant list. Playwright does not allow a test file to import another test file, so the visual and SSR tests both import this file:

```ts
export const TAG = 'button'

export const VARIANTS = ['basic', 'variants', 'disabled'] as const
```

The visual test imports `TAG` and `VARIANTS` from it instead of declaring them.

**ssr.play.ts** — Renders `visual.html` with `renderToString`, takes one screenshot before and one after hydration, and compares both against the desktop baseline of the visual test (code: [examples.md](examples.md#ssr-test)).

Rules:

- Desktop only. No new baseline files unless the component renders in the browser only (below).
- Components that finish rendering in the browser need their own first screenshot: `visualBaseline(TAG, `${TAG}.ssr.play.ts`)(`${variant}-ssr-static`)`. Update these baselines locally in the Playwright Linux image on amd64, filtered with `-g` to these tests. The `/update-screenshots` bot does not run the SSR project.
- A component that shifts on hydration is a bug. Fix it or mark the test with `test.fixme` and the issue number.
- Client-only components (`ds-modal`, `ds-toast`, `ds-snackbar`, see ADR 0031) keep the `mountSsr()` form with an inline snippet — see [examples.md](examples.md#client-only-ssr-test).

## Framework integration tests (form components)

**Every form component** — and any component whose events or framework wrapper change — also
gets a test in the Angular and React integration apps. Core suites can't prove a wrapper works;
these run the real `@helvetia-design/angular` / `@helvetia-design/react` package in a real app.
Skip a framework only if the component has no wrapper there, and say so in the report.

**Angular** — `apps/integration-angular`, modelled on `select-demo/` + `e2e/select.spec.ts`:

- `src/app/<name>-demo/<name>-demo.ts` + `.html`: one `[(ngModel)]` instance and one reactive
  `FormControl` instance, each with a `data-testid` value readout, plus buttons to `setValue`
  and toggle disabled.
- Register the demo in `src/app/app.ts` (import) and `src/app/app.html` (`<app-<name>-demo />`).
- `e2e/<name>.spec.ts` asserts: initial value shown, a user change updates the model, `setValue`
  updates the component, disabled toggles both ways, and touched + invalid after blur on a
  required control.

**React** — `apps/integration-react`, modelled on the `ds-phone-input` test:

- Add the component to `src/Root.tsx` with a `data-testid` and a state readout.
- Add tests to `e2e/app.spec.ts`: it renders (the existing no-console-errors test then covers
  it), and its change event updates React state.

**Run** — build core + the framework package first (the build half of `pnpm app:angular` /
`pnpm app:react`), then only your tests:

```bash
pnpm --filter integration-angular play:run e2e/<name>.spec.ts
pnpm --filter integration-react build && pnpm --filter integration-react play:run -g "<name>"
```

The wrapper itself (`packages/angular/src/forms/ds-<name>.ts`) is the component-engineer's. If
`ngModel` or `formControlName` does nothing, the wrapper or its value accessor is missing:
report it, don't add it.

## Workflow

### Step 1: Invoke

```bash
ds-test-component button
```

### Step 2: Confirm visual props and slots

Show the detected props and slots as checklists; the user deselects what to skip.

### Step 3: Report

List the files generated with test counts. Prompts, output and a full Button example: [examples.md](examples.md#workflow-prompts).

## Assertions come from the plan, not the implementation

When a plan exists (`docs/plans/components/<name>-plan.md`,
`docs/plans/components/<name>-a11y-plan.md`), **structural
assertions — roles, ARIA wiring, live regions, focus targets, announced text — are read from the
plan.** Read the implementation to find _selectors_, never to decide what is _correct_.

A test written by reading the implementation can only ever confirm the implementation.

> Real case: the a11y plan required the no-results message to live in a `role="status"` region and
> explicitly forbade a bare `div` inside the listbox. The component shipped the forbidden version,
> this skill asserted `listbox .no-results` was visible, and the test then **defended** a WCAG
> 1.3.1 violation (`aria-required-children`) until axe caught it — costing a repair dispatch and a
> test rewrite on top of the original fix.

**If the implementation disagrees with the plan, that is a finding, not a test target.** Report it
with `file:line` and assert the plan's behaviour.

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
Copy-ready code for each test type and a full Button example: [examples.md](examples.md).
