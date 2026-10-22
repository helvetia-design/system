# input-slider

Migrate every `bal-input-slider` usage to `ds-slider`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no consumer child tags. `bal-input`, `bal-input-group` and `bal-input-stepper` are different components and are not part of this migration. The scan does not list them. The surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is not part of it either: leave it untouched.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-input-slider.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-input-slider` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-input-slider`)                                                                       | new (`ds-slider`)                                            | handling                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `invalid`, `min`, `max`, `debounce`, `disabled`, `readonly`, `value`, `autoInvalidOff` | same                                                         | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged.                                                                  |
| `required` set                                                                                 | `required`                                                   | Copy as-is.                                                                                                                                                                                                                                               |
| `required` omitted                                                                             | `required` set to false                                      | The default flipped. `bal-input-slider` was optional, `ds-slider` is required. Add `required="false"` (HTML), `[required]="false"` (Angular), or `required={false}` (React). Report each file where this was added.                                       |
| `step` omitted or `0`                                                                          | `step="any"`                                                 | The meaning of `0` was "no steps", which is continuous. `ds-slider` defaults to `'1'`, so an omitted `step` would silently snap to whole numbers. Replace `0` with `any`, or add `step="any"` when it was omitted. Report each file where this was added. |
| `step` with a numeric literal                                                                  | `step` as a string                                           | `step` is a string on `ds-slider`. `step="5"` stays. Angular `[step]="5"` becomes `step="5"`, React `step={5}` becomes `step="5"`, otherwise strictly typed templates no longer compile.                                                                  |
| `step` bound to an expression                                                                  | `step`                                                       | Leave the binding and flag it for manual review: the value must now be a string, or `"any"`.                                                                                                                                                              |
| `balTabindex`                                                                                  | `tabindex`                                                   | `ds-slider` takes a native `tabindex` from the host. HTML `balTabindex="1"` becomes `tabindex="1"`, Angular `[balTabindex]="x"` becomes `[attr.tabindex]="x"`, React `balTabindex={1}` becomes `tabIndex={1}`.                                            |
| `hasTicks`                                                                                     | _(no equivalent prop)_                                       | Leave the attribute in place, do not drop it. It has no effect after the migration, and in strictly typed React or Angular templates it may not compile. Flag every occurrence for manual review.                                                         |
| _(none)_                                                                                       | `label`, `description`, `color`, `brandColor`, `invalidText` | New props. Nothing to migrate from. Leave them unset.                                                                                                                                                                                                     |

### Tags and imports

- **HTML**: `<bal-input-slider>` becomes `<ds-slider>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalInputSlider` from `@baloise/ds-angular`, move only that symbol to `import { DsSlider } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsSlider` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working.
- **React**: `<BalInputSlider>` becomes `<DsSlider>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalInputSlider` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

| old           | new        | handling                                                                                                                                                            |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`   | `dsChange` | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| `balInput`    | `dsInput`  | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms.                                                                   |
| `balBlur`     | `dsBlur`   | Same shapes.                                                                                                                                                        |
| `balFocus`    | `dsFocus`  | Same shapes.                                                                                                                                                        |
| `balKeyPress` | _(none)_   | No equivalent. Leave the handler in place and report it as "event no longer fires, needs manual rework".                                                            |

`ds-slider` adds `dsClick`. There is nothing to migrate from.

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

The detail types `BalEvents.BalInputSlider*Detail` are not rewritten. List each use as "type needs manual rework".

When the value in `balChange` or `balInput` is read, note that it was `string | number | null` in legacy and is always a `number` in `ds-slider`. Do not edit the handler, report it.

### Methods

`setFocus()` keeps its name. `getInputElement()` keeps its name too, but it now resolves the noUiSlider handle (`HTMLElement`) instead of an `HTMLInputElement`. Do not rewrite calls to it. List each call by file and line as "return type changed, check the caller". `setAriaForm()` does not exist on `ds-slider`. Do not remove calls to it and do not invent a replacement. List each call by file and line as "method no longer available, needs manual rework".

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `getInputElement` and `setAriaForm` calls and for `balChange`, `balInput`, and `balKeyPress`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Print a per-file summary of what changed, including every `required` that was set to false, every `step="any"` that was added or substituted, every `step` literal turned into a string, every `balTabindex` that was renamed, every event handler that was renamed, and every unsupported prop (`hasTicks`), `balKeyPress` handler, dynamic `step` binding, method call, and detail-type use that needs manual rework.

Report these logic changes the scan cannot see, so the consumer can check them:

- **Empty value**: a slider can never be empty. A legacy `value=""`, `null` or `undefined` now resolves to `min`. List each static or bound value that can be empty.
- **Value type**: handlers and form controls now receive a `number`, never a string or `null`.

Also list every selector that targeted the legacy element and that the scan cannot see (classes starting with `bal-input-slider`, `data-testid="bal-input-slider"`). Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
