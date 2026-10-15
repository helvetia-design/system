# input

Migrate every `bal-input` usage to `ds-input`, and every `bal-input-date` usage to `ds-datepicker`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one consumer child tag, `bal-input-date`. It is a text field with a date mask and no calendar. The closest new component is `ds-datepicker`, so the two tags map to different components. `ds-input` has no date mask and `type="date"` renders the native browser widget, so do not map `bal-input-date` to `ds-input`.

Other legacy tags that start with `bal-input` are different components and are not part of this migration: `bal-input-group`, `bal-input-slider` (see `components/input-slider/migration.md`), `bal-input-stepper`. `bal-number-input` is a separate component too. The scan does not list them.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-input.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-input` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props of `bal-input` → `ds-input`

| old (`bal-input`)                                                                                                                                                                                                                                                                                              | new (`ds-input`)                                          | handling                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `invalid`, `type`, `accept`, `autocapitalize`, `autocomplete`, `autocorrect`, `autofocus`, `debounce`, `placeholder`, `max`, `maxLength`, `min`, `minLength`, `multiple`, `pattern`, `allowedKeyPress`, `spellcheck`, `disabled`, `readonly`, `suffix`, `inputmode`, `mask`, `value`, `autoInvalidOff` | same                                                      | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. The `mask` values are the same seven names.    |
| `required` set                                                                                                                                                                                                                                                                                                 | `required`                                                | Copy as-is.                                                                                                                                                                                                                             |
| `required` omitted                                                                                                                                                                                                                                                                                             | `required` set to false                                   | The default flipped. `bal-input` was optional, `ds-input` is required. Add `required="false"` (HTML), `[required]="false"` (Angular), or `required={false}` (React) so the field stays optional. Report each file where this was added. |
| `textAlign`, `hasIconRight`                                                                                                                                                                                                                                                                                    | _(no equivalent prop)_                                    | Leave the attribute in place, do not drop it. It has no effect after the migration, and in strictly typed React or Angular templates it may not compile. Flag every occurrence for manual review.                                       |
| `clickable`                                                                                                                                                                                                                                                                                                    | _(no equivalent prop)_                                    | Same: leave it and flag it. The click is now reported by the new `dsClick` event, so the consumer can replace the pattern, but do not do it yourself.                                                                                   |
| _(none)_                                                                                                                                                                                                                                                                                                       | `label`, `description`, `color`, `loading`, `invalidText` | New props. Nothing to migrate from. Leave them unset.                                                                                                                                                                                   |

### Props of `bal-input-date` → `ds-datepicker`

Same rules as `components/date/migration.md`, which documents `ds-datepicker` in full.

| old (`bal-input-date`)                                                                                            | new (`ds-datepicker`)                | handling                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `invalid`, `disabled`, `readonly`, `placeholder`, `autocomplete`, `min`, `max`, `value`, `autoInvalidOff` | same                                 | Copy as-is. Keep form bindings unchanged.                                                                                                      |
| `required` set / omitted                                                                                          | `required` / `required` set to false | Same default flip as for `ds-input`. Add an explicit false when it was omitted and report the file.                                            |
| `clickable`, `hasIconRight`                                                                                       | _(no equivalent prop)_               | Leave in place and flag for manual review.                                                                                                     |
| `allowInvalidValue`                                                                                               | _(no equivalent)_                    | Drop it in every form and report it as a logic change: legacy emitted the string `INVALID_VALUE` from `balChange`, `ds-datepicker` never does. |

### Tags and imports

- **HTML**: `<bal-input>` becomes `<ds-input>` and `<bal-input-date>` becomes `<ds-datepicker>`, including the closing tags.
- **Angular**: the same tag renames in `.html` templates and in inline `template:` strings, including the closing tags. When a file imports `BalInput` or `BalInputDate` from `@baloise/ds-angular`, move only those symbols to `import { DsInput, DsDatepicker } from '@helvetia-design/angular'` (only the ones the file used) and leave the other symbols on the `@baloise` import. Rename them in `imports: [...]` as well. `DsInput` and `DsDatepicker` bring their own `ControlValueAccessor`, so `ngModel` and reactive forms keep working.
- **React**: `<BalInput>` becomes `<DsInput>` and `<BalInputDate>` becomes `<DsDatepicker>`, including the closing tags. Import them from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalInput` and `BalInputDate` and leave the others on the `@baloise` import. If the file already imports `DsDatepicker` from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

Both tags emit the same five events, and both new components add `dsClick`.

| old           | new          | handling                                                                                                                                                            |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`   | `dsChange`   | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| `balInput`    | `dsInput`    | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms.                                                                   |
| `balBlur`     | `dsBlur`     | Same shapes.                                                                                                                                                        |
| `balFocus`    | `dsFocus`    | Same shapes.                                                                                                                                                        |
| `balKeyPress` | `dsKeyPress` | Same shapes.                                                                                                                                                        |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

The detail types `BalEvents.BalInput*Detail` and `BalEvents.BalInputDate*Detail` are not rewritten. List each use as "type needs manual rework".

When the value in `balChange` or `balInput` is read, note that it is `string | undefined` in legacy and `string | null` in the new components. A cleared field now yields `null`. Do not edit the handler, report it.

### Methods

`setFocus()` and `getInputElement()` keep their names, and so does `setBlur()` (it was `@internal` in legacy). `setAriaForm()` does not exist on the new components. Do not rewrite or remove calls to it and do not invent a replacement. List each call by file and line as "method no longer available, needs manual rework".

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `setAriaForm` calls and for `balChange`, `balInput`, and `INVALID_VALUE`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Print a per-file summary of what changed, including every `required` that was set to false, every dropped `allowInvalidValue`, every event handler that was renamed, and every handler, method call, and unsupported prop (`textAlign`, `clickable`, `hasIconRight`) that needs manual rework.

Report these logic changes the scan cannot see, so the consumer can check them:

- **Empty value**: a cleared field now yields `null` where legacy yielded `undefined`. Code that checks `=== undefined` needs review. List each handler or form binding that reads the value.
- **`INVALID_VALUE`**: search the consumer code for the string. Every place that compares against it, and every file where `allowInvalidValue` was dropped, needs manual review.

Also report the rendering differences, so the consumer can check them. Do not add attributes to compensate:

- `bal-input-date` was a plain text field with a date mask. `ds-datepicker` adds a calendar popup opened from a button.
- `ds-input` and `ds-datepicker` have `label`, `description`, and `color`. Fields may need a `label` now. Do not add one yourself.

Also list every selector that targeted the legacy elements and that the scan cannot see (classes starting with `bal-input` and the `bal-input-date` internals). Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
