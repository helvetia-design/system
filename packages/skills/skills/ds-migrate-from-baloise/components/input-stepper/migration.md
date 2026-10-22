# input-stepper

Migrate every `bal-input-stepper` usage to `ds-counter`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no consumer child tags. `bal-input`, `bal-input-group` and `bal-input-slider` are different components and are not part of this migration. The scan does not list them. The surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is not part of it either: leave it untouched.

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

| old (`bal-input-stepper`)                                                                      | new (`ds-counter`)                                         | handling                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `invalid`, `min`, `max`, `debounce`, `disabled`, `readonly`, `value`, `autoInvalidOff` | same                                                       | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged.                                              |
| `steps`                                                                                        | `step`                                                     | Renamed, still a number. HTML `steps="2"` becomes `step="2"`, Angular `[steps]="x"` becomes `[step]="x"`, React `steps={2}` becomes `step={2}`. Keep the value. `ds-counter` needs a positive number and falls back to `1` otherwise. |
| _(none)_                                                                                       | `label`, `description`, `color`, `invalidText`, `required` | New props. Nothing to migrate from. Leave them unset. `required` defaults to `true` but only affects the "optional" suffix of `label`, so it has no visible effect until a `label` is set.                                            |

### Tags and imports

- **HTML**: `<bal-input-stepper>` becomes `<ds-counter>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalInputStepper` from `@baloise/ds-angular`, move only that symbol to `import { DsCounter } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsCounter` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working.
- **React**: `<BalInputStepper>` becomes `<DsCounter>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalInputStepper` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

| old           | new          | handling                                                                                                                                                            |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`   | `dsChange`   | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| `balInput`    | `dsInput`    | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms.                                                                   |
| `balIncrease` | `dsIncrease` | Same shapes.                                                                                                                                                        |
| `balDecrease` | `dsDecrease` | Same shapes.                                                                                                                                                        |
| `balFocus`    | `dsFocus`    | Same shapes.                                                                                                                                                        |
| `balBlur`     | `dsBlur`     | Same shapes.                                                                                                                                                        |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

The detail types `BalEvents.BalInputStepper*Detail` are not rewritten. List each use as "type needs manual rework".

Do not edit handler bodies. Report these detail changes so the consumer can check them:

- `dsFocus` and `dsBlur` carry no detail. `balFocus` and `balBlur` carried a `FocusEvent`. List each handler that reads `ev.detail` as "event detail removed, needs manual rework".
- `dsChange`, `dsInput`, `dsIncrease` and `dsDecrease` always carry a `number`. The legacy detail was `number | undefined`.

### Methods

`getInputElement()` keeps its name, but it now resolves the increase button (the decrease button when increase is disabled) instead of an `HTMLInputElement`. Do not rewrite calls to it. List each call by file and line as "return type changed, check the caller". `setAriaForm()` does not exist on `ds-counter`. Do not remove calls to it and do not invent a replacement. List each call by file and line as "method no longer available, needs manual rework". `ds-counter` adds `setFocus()`. There is nothing to migrate from.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `getInputElement` and `setAriaForm` calls and for `balChange`, `balInput`, `balIncrease`, `balDecrease`, `balFocus`, and `balBlur`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Print a per-file summary of what changed, including every `steps` that was renamed to `step`, every event handler that was renamed, and every `ev.detail` read on `dsFocus` or `dsBlur`, method call, and detail-type use that needs manual rework.

Report these logic changes the scan cannot see, so the consumer can check them:

- **Value range**: every write is resolved onto `[min, max]`, and an empty value (`null`, `undefined`, `NaN`) becomes `min`. That resolution is silent, no `dsChange` fires, so a bound value outside the range stays unchanged on the framework side while the element shows the clamped one. List each static or bound value that can be empty or out of range.
- **Required**: `ds-counter` defaults `required` to `true`. It only shows once a `label` is set. List every file where the surrounding `bal-field` carries a label, because `ds-counter` has its own `label`, `description` and `invalidText` that can replace that wrapper later.
- **Appearance**: `ds-counter` takes a `color` and shows the buttons as ghost buttons. Visual snapshots of the legacy outlined buttons break.

Also list every selector that targeted the legacy element and that the scan cannot see (classes starting with `bal-input-stepper`, `data-testid="bal-input-stepper"`, `bal-input-stepper-decrease`, `bal-input-stepper-increase`, `bal-input-stepper-text`). Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
