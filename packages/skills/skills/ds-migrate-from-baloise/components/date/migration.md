# date

Migrate every `bal-date` usage to `ds-datepicker`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder holds `bal-date-calendar` and `bal-date-calendar-cell`. Both are internal parts of `bal-date`, rendered inside its shadow tree. They are not consumer tags, and `ds-datepicker` has no equivalent. The scan does not list them. Rewrite `bal-date` only.

The component is renamed. The old tag is `bal-date`, the new tag is `ds-datepicker`.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-date.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-date` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-date`)                                                                                                                                                                                 | new (`ds-datepicker`)                                | handling                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `invalid`, `disabled`, `readonly`, `freeSolo`, `placeholder`, `autocomplete`, `value`, `min`, `max`, `min-year`, `max-year`, `defaultDate`, `allowedDates`, `debounce`, `autoInvalidOff` | same                                                 | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged.                                                                                                                                                |
| `required` set                                                                                                                                                                                   | `required`                                           | Copy as-is.                                                                                                                                                                                                                                                                                                                             |
| `required` omitted                                                                                                                                                                               | `required` set to false                              | The default flipped. `bal-date` was optional, `ds-datepicker` is required. Add `required="false"` (HTML), `[required]="false"` (Angular), or `required={false}` (React) so the field stays optional. Report each file where this was added.                                                                                             |
| `triggerIcon`, `closeOnSelect`                                                                                                                                                                   | _(no equivalent)_                                    | Drop it in every form (bare, `="true"`, `="false"`, `{true}`, `[closeOnSelect]="x"`). Report each dropped prop as a behaviour difference. `ds-datepicker` opens the popup only from the calendar button, which is what `triggerIcon` did, and always closes it after a selection, so only `closeOnSelect` set to false loses behaviour. |
| `allowInvalidValue`                                                                                                                                                                              | _(no equivalent)_                                    | Drop it in every form. Report each one as a logic change, see Report. Legacy emitted the string `INVALID_VALUE` from `balChange` for invalid input. `ds-datepicker` never does.                                                                                                                                                         |
| _(none)_                                                                                                                                                                                         | `label`, `description`, `color`, `loading`, `inline` | New props. Nothing to migrate from. Leave them unset.                                                                                                                                                                                                                                                                                   |

### Tags and imports

- **HTML**: `<bal-date>` becomes `<ds-datepicker>`, including the closing tag.
- **Angular**: `<bal-date>` becomes `<ds-datepicker>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalDate` from `@baloise/ds-angular`, move only `BalDate` to `import { DsDatepicker } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalDate` with `DsDatepicker` in `imports:` lists too. `DsDatepicker` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working.
- **React**: `<BalDate>` becomes `<DsDatepicker>` and `</BalDate>` becomes `</DsDatepicker>`. Import `DsDatepicker` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalDate` and leave the others on the `@baloise` import.

### Events

| old (`bal-date`)                  | new (`ds-datepicker`) | handling                                                                                                                                                            |
| --------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`                       | `dsChange`            | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| `balInput`                        | `dsInput`             | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms.                                                                   |
| `balBlur`                         | `dsBlur`              | Same shapes.                                                                                                                                                        |
| `balFocus`                        | `dsFocus`             | Same shapes.                                                                                                                                                        |
| `balInputClick`                   | `dsClick`             | Same shapes: `(balInputClick)` becomes `(dsClick)` and `onBalInputClick` becomes `onDsClick`.                                                                       |
| `balIconClick`                    | _(no equivalent)_     | Do not rewrite or remove the handler. List each one by file and line as "event no longer emitted, needs manual rework".                                             |
| `balWillAnimate`, `balDidAnimate` | _(no equivalent)_     | Same: leave the handler and list it.                                                                                                                                |

Rewrite only handlers that are attached to the `bal-date` element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

When the value in `balChange` or `balInput` is read, note that it is `string | undefined` in legacy and `string | null` in `ds-datepicker`. A cleared field now yields `null`. Do not edit the handler, report it.

### Methods

`setFocus()`, `setBlur()`, and `getInputElement()` keep their names. `open()`, `close()`, `toggle()`, `select()`, and `setAriaForm()` do not exist on `ds-datepicker`. Do not rewrite or remove calls to them and do not invent a replacement. List each call by file and line as "method no longer available, needs manual rework". `select(date)` can often be replaced by setting `value`, say so in the summary, but do not change the code.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for those calls and for `balChange`, `balInput`, `balIconClick`, and `INVALID_VALUE`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Print a per-file summary of what changed, including every `required` that was set to false, every dropped `triggerIcon`, `closeOnSelect`, and `allowInvalidValue`, every event handler that was renamed, and every handler and method call that needs manual rework.

Report these logic changes the scan cannot see, so the consumer can check them:

- **`INVALID_VALUE`**: `ds-datepicker` never emits it. Search the consumer code for the string `INVALID_VALUE`. Every place that compares against it, and every file where `allowInvalidValue` was dropped, needs manual review.
- **Empty value**: a cleared field now yields `null` where `bal-date` yielded `undefined`. Code that checks `=== undefined` needs review. List each handler or form binding that reads the value.

Also report the rendering differences, so the consumer can check them. Do not add attributes to compensate:

- `bal-date` opened the popup on a click into the input unless `triggerIcon` was set. `ds-datepicker` opens it only from the calendar button, so every field without `triggerIcon` now behaves differently. `ds-datepicker` also closes the popup after every selection, so a dropped `closeOnSelect` set to false is a lost behaviour.
- `ds-datepicker` has `label`, `description`, and `color`. Fields may need a `label` now. Do not add one yourself.

Also list every selector that targeted the legacy elements and that the scan cannot see. The legacy component set the classes `bal-date`, `bal-date__icon`, `bal-date__icon--is-clickable`, `bal-date__popup`, and `bal-date__popup--is-visible` on its host and its parts, and rendered `bal-input-date`, `bal-input-group`, and `bal-date-calendar` inside. Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
