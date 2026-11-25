---
name: ds-framework-wrappers
description: Keep the Angular and React packages in step with a component's public API — the React wrapper re-export lists (client + server), the Angular value-accessor wrapper for a form component, the barrel exports, and the deprecation JSDoc on both. Use when adding a component, adding or deprecating a form component's value/event, or when a framework package's export test fails.
---

# ds-framework-wrappers

Both framework packages are **generated wrappers plus a thin hand-authored layer**. The generated
part (`packages/angular/src/generated/**`, `packages/react/src/generated/**`) rebuilds from the
core build and is never edited. This skill covers the hand-authored layer only.

Background, read only the section you need:

- `packages/angular/CONTEXT.md` → "Reactive-forms integration" (value types, `extractValue`, why a mixin)
- `packages/react/CONTEXT.md` → "Generated vs. authored code"

## Step 1 — What does the change need?

| Change                                             | Angular                         | React                           |
| -------------------------------------------------- | ------------------------------- | ------------------------------- |
| New component (any)                                | nothing — proxy is generated    | Step 3                          |
| New **form** component                             | Step 2                          | Step 3                          |
| Form component: value prop, change or blur event   | Step 2 — re-check the config    | nothing                         |
| Component, prop or event deprecated (Workflow E)   | Step 4                          | Step 4                          |
| Component removed (Workflow E′)                    | delete its `src/forms/` file    | Step 3 — remove from both lists |
| New prop / event / method on an existing component | nothing — `meta.ts` regenerates | nothing                         |

Anything else — a new Angular service, a new React hook or controlled component (ADR-0028
overlay idioms) — is **not** this skill. It needs an architect plan first.

Build core first so the generated files exist: `pnpm --filter @helvetia-design/core build`
(pipe to a file, read the tail).

## Step 2 — Angular form wrapper

A form component without one silently ignores `formControlName` and `ngModel`.

1. Copy the closest existing wrapper in `packages/angular/src/forms/`:
   `ds-input.ts` (string value) · `ds-select.ts` (union/array value) · `ds-toggle.ts`
   (`valueProp: 'checked'`) · `ds-phone-input.ts` (`detail` is not the bare value →
   `extractValue`).
2. Keep all of these, unchanged in shape:
   - `selector: 'ds-<name>'`, `template: '<ng-content></ng-content>'`, `OnPush`
   - `host: { 'data-ds-form-control': '' }` — without it Angular logs NG0912
   - `inputs: Ds<Name>Inputs`, `outputs: Ds<Name>Outputs` from `../generated/meta` — never a
     hand-typed list
   - the `NG_VALUE_ACCESSOR` provider with `forwardRef(() => Ds<Name>)`
   - `extends withValueAccessor<HTMLDs<Name>Element, '<valueProp>'>({ changeEvent, blurEvent, valueProp })(Ds<Name>Element)`
3. Set `changeEvent`/`blurEvent`/`valueProp` from the component's real events and value prop —
   read them from `components.d.ts`, don't assume `dsChange`/`dsBlur`/`value`.
4. Export it by name from `packages/angular/src/index.ts`, in the form-wrapper block **after**
   `export * from './generated/proxies'`. The named export shadows the generated one.
5. Doc comment on the class: value type, change event, and only what differs from `ds-input`.

## Step 3 — React re-export lists

`packages/react/src/wrappers.ts` and `wrappers.server.ts` are the **same list**, one importing
from `./generated/components`, the other from `./generated/components.server`. Every
generated `Ds*` export must appear in both.

Add every new `Ds*` export from `generated/components.ts` — sub-components too — to the main
`export { … }` block of **both** files, alphabetically. `index.test.ts` fails if one is
missing from `wrappers.ts`, or if the two files differ in anything but the import path.

## Step 4 — Deprecation

The JSDoc on the Stencil member flows into the generated wrappers by itself. The hand-authored
layer needs it explicitly:

- **Deprecated component, React** — move its name out of the main block into its own
  `export { DsX } from …` with a `/** @deprecated Use … instead. */` above it, in **both**
  wrapper files (same pattern as `DsModal`), and add it to `DEPRECATED_WRAPPERS` in
  `index.test.ts`.
- **Deprecated form component, Angular** — `@deprecated` JSDoc on the `src/forms/` class.
- **Deprecated value prop or change event** — if the Angular wrapper's config names it, switch
  the config to the replacement; the old one keeps working in core.

## Step 5 — Verify

```bash
pnpm --filter @helvetia-design/angular build && pnpm --filter @helvetia-design/angular test
pnpm --filter @helvetia-design/react build && pnpm --filter @helvetia-design/react test
```

Only the package(s) you touched. Integration tests (`apps/integration-angular`,
`apps/integration-react`) are the test-engineer's; name them in your report as the next step
for a form component — don't write or run them here.

## Report

Files changed per package, the Angular config chosen (`changeEvent`/`blurEvent`/`valueProp`,
`extractValue` if any) and why, and the build/test output tail. Never commit.
