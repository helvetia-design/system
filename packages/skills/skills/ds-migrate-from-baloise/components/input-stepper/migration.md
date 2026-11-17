# input-stepper

Migrate every `bal-input-stepper` usage to `ds-counter`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no consumer child tags. `bal-input` and `bal-input-slider` are different components and are not part of this migration. The scan does not list them. The surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is handled by `shared/field.md` in the Rewrite step, in the same pass.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-input-stepper.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-input-stepper` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-input-stepper`) | new (`ds-counter`) | handling |
| --- | --- | --- |
| `name`, `invalid`, `min`, `max`, `debounce`, `disabled`, `readonly`, `value`, `autoInvalidOff` | same | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. |
| `steps` | `step` | Renamed, still a number. HTML `steps="2"` becomes `step="2"`, Angular `[steps]="x"` becomes `[step]="x"`, React `steps={2}` becomes `step={2}`. Keep the value. `ds-counter` needs a positive number and falls back to `1` otherwise. |
| _(none)_ | `label`, `description`, `color`, `invalidText`, `required` | New props. Nothing to migrate from. Outside a `bal-field`, leave them unset. `required` defaults to `true` but only affects the "optional" suffix of `label`, so it has no visible effect until a `label` is set. Inside a `bal-field` with a label, `shared/field.md` sets `label` and decides `required`, including an explicit `required="false"`. `ds-counter` is excluded from the required default rule in `SKILL.md`. |

### Tags and imports

- **HTML**: `<bal-input-stepper>` becomes `<ds-counter>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalInputStepper` from `@baloise/ds-angular`, move only that symbol to `import { DsCounter } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsCounter` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working. `bal-input-stepper` has no own bundle. Only multi-family bundles such as `BalFormBundle` or `BalComponentBundle` hold it. They stay, and `DsCounter` is added next to them, as `SKILL.md` "Legacy types and bundles" describes.
- **React**: `<BalInputStepper>` becomes `<DsCounter>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalInputStepper` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Detail: `number`, legacy `number \| undefined`. |
| `balInput` | `dsInput` | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms. Detail: `number`. |
| `balIncrease` | `dsIncrease` | Same shapes. |
| `balDecrease` | `dsDecrease` | Same shapes. |
| `balFocus` | `dsFocus` | Same shapes. |
| `balBlur` | `dsBlur` | Same shapes. |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalInputStepper*` and `BalInputStepperCustomEvent` become `DsCounterCustomEvent`, because the type follows the new tag `ds-counter`. Write a detail alias such as `BalEvents.BalInputStepperChangeDetail` out as the new detail type, `number` for `dsChange`, `dsInput`, `dsIncrease` and `dsDecrease`. `HTMLBalInputStepperElement` becomes `HTMLDsCounterElement`. The scan lists the `BalEvents.*` and `Bal*CustomEvent` types. It lists the `HTMLBal*Element` types too. It does not list `BalProps.*`, so search for them yourself in each file with a finding.

Do not edit handler bodies. Report these detail changes so the consumer can check them:

- `dsFocus` and `dsBlur` carry no detail. `balFocus` and `balBlur` carried a `FocusEvent`. List each handler that reads `ev.detail` as "event detail removed, needs manual rework".
- `dsChange`, `dsInput`, `dsIncrease` and `dsDecrease` always carry a `number`. The legacy detail was `number | undefined`.

### Methods

`getInputElement()` keeps its name, but it now resolves the increase button (the decrease button when increase is disabled) instead of an `HTMLInputElement`. Do not rewrite calls to it. List each call by file and line as "return type changed, check the caller". `setAriaForm()` does not exist on `ds-counter`. Apply Unmapped props and handlers (`SKILL.md`). `ds-counter` adds `setFocus()`. There is nothing to migrate from.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `getInputElement` and `setAriaForm` calls and for `balChange`, `balInput`, `balIncrease`, `balDecrease`, `balFocus`, and `balBlur`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `ev.detail` read on `dsFocus` or `dsBlur`, listed as "event detail removed, needs manual rework".
2. Every `getInputElement()` call, listed as "return type changed, check the caller".
3. Every `setAriaForm()` call, with its Unmapped props and handlers outcome.
4. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalInputStepper*` type left in place, each detail alias such as `BalEvents.BalInputStepperChangeDetail` written out, and each multi-family bundle such as `BalFormBundle` or `BalComponentBundle` kept with `DsCounter` added next to it.
5. Every static or bound value that can be empty or out of range. Every write is resolved onto `[min, max]`, and an empty value (`null`, `undefined`, `NaN`) becomes `min`. No `dsChange` fires for that, so a bound value outside the range stays unchanged on the framework side while the element shows the clamped one.
6. Every file where the rendered label changed. `shared/field.md` moves the label of a surrounding `bal-field` onto `ds-counter` and decides `required` from the wrapper. `ds-counter` defaults `required` to `true`, which only shows once a `label` is set. A counter without any `required` on the wrapper gets `required="false"` and now shows the "(optional)" suffix, which the legacy label did not.
7. One-time note: `ds-counter` takes a `color` and shows the buttons as ghost buttons. Visual snapshots of the legacy outlined buttons break.
8. Every selector that targets the legacy element and that the scan cannot see, such as classes starting with `bal-input-stepper`, `data-testid="bal-input-stepper"`, `bal-input-stepper-decrease`, `bal-input-stepper-increase`, and `bal-input-stepper-text`. Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Coverage only, written to the file:

9. Every `steps` that was renamed to `step`.
10. Every event handler that was renamed.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
