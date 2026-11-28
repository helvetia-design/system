---
name: ds-test-component
description: Review the coverage of a component's TDD tests and generate its visual, SSR and integration tests (not unit, interaction, PO or a11y). Use after a component is implemented or changed.
---

# Test Component

Two jobs, one dispatch: **review the coverage** of the behavior tests the component-engineer
wrote test-first, then **generate the visual and SSR tests** (plus framework integration tests
for a form component). It reads the component-engineer's visual fixture; it never writes one.

## Quick Start

Generate the visual and SSR tests for a component:

```bash
ds-test-component button
```

Process:

1. Parse component props, slots and parts
2. Read the visual fixture's `data-testid` sections
3. Show checklists for visual props and slots
4. Generate the test files (or fewer if not applicable)
5. Report summary with test counts

Output files:

- `button.visual.play.ts` — Playwright visual regression tests
- `button.variants.ts` — `TAG` + `HOST_VARIANTS`, derived from the fixture, shared by the
  visual and SSR tests
- `button.ssr.play.ts` — SSR screenshots before and after hydration (only when the component has a `.host.scss`)

**Not written here:**

| File                                                   | Owner                                         |
| ------------------------------------------------------ | --------------------------------------------- |
| `button.visual.html` / `.style.html`                   | component-engineer (`ds-implement-component`) |
| `button.spec.ts`, `.component.play.ts`, `button.po.ts` | component-engineer — written test-first (TDD) |
| `button.a11y.play.ts`                                  | a11y-expert (`ds-a11y-test`)                  |

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

### 2. SSR Tests

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

## Coverage review

Runs **first**, read-only, over the component-engineer's `.spec.ts`, `.component.play.ts` and
Page Object. Follow the `mattpocock-skills:tdd` skill's definition of a good test. Check:

1. **Every seam** in the plan's `## Test seams` section has a test (bug fix: the seam the engineer
   named in its report).
2. **Every reachable state** — each enum variant, disabled, invalid, loading, empty, each event
   and its "does not fire" case — is covered.
3. **No anti-pattern** from `tdd`: implementation-coupled (asserts internals, breaks on refactor),
   tautological (expected value recomputed the way the code does), horizontal slicing (bulk tests
   asserting shape, not behavior).
4. **Mounts through the Page Object** — no direct DOM queries in core suites.
5. **Touch** — every item in the plan's `## Touch` has a `@touch`-tagged test driven by `tap()`;
   no behavior is reachable by hover only; every gesture has a single-pointer alternative that is
   tested. Layout on phones and tablets (one breakpoint) is the `📱 Mobile Chrome` visual project:
   check `visual.html` has the sections that reflow there. Emulation only — say so.
6. **Stress content** — `visual.html` has a `stress` section (very long unbroken label, long
   wrapping label, one-character label, optional slots empty). Missing is a finding for the
   engineer; it is the only screenshot that catches overflow and empty-state breakage.

No numeric coverage threshold. **Never edit those files** — each gap is a finding in your report
(`file:line`, what is missing, which check), routed by the orchestrator to the component-engineer's
repair round.

## Workflow

### Step 1: Review coverage

See "Coverage review" above. Findings, not fixes.

### Step 2: Generate

```bash
ds-test-component button
```

### Step 3: Confirm visual props and slots

Show the detected props and slots as checklists; the user deselects what to skip.

### Step 4: Report

Coverage findings first, then the files generated with test counts. Prompts, output and a full
Button example: [examples.md](examples.md#workflow-prompts).

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

- ✅ **Reads the fixture** — one screenshot per `data-testid` section
- ✅ **Never skips visual props** that the user confirms — all get sections
- ✅ **Never writes behavior tests** — gaps there are review findings for the component-engineer

## Related

See [REFERENCE.md](REFERENCE.md) for the conventions of each test type — shared with the
component-engineer, who writes the behavior tests from it.
Copy-ready code for each test type and a full Button example: [examples.md](examples.md).
