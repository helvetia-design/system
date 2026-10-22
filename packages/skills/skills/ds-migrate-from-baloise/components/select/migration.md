# select

Migrate every `bal-select` usage to `ds-select`, and every `bal-select-option` usage to `ds-select-option`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. A legacy `bal-select` reads its options from its `bal-select-option` children, and `ds-select` reads its slotted `ds-select-option` children the same way, so a select and its options are always rewritten in the same pass.

`bal-field`, `bal-field-label`, `bal-field-control`, and `bal-field-message` — the wrapper a legacy select is often shown inside — are out of scope. They have no `ds-*` tag replacement and no migration for them exists yet. Leave every `bal-field*` tag exactly as it is: not scanned, not rewritten, not flagged.

The scan does not match the ambient `HTMLBalSelectElement`, `HTMLBalSelectOptionElement`, `BalProps.BalSelect*` or `BalEvents.BalSelect*` types. Those are Report items, not rewrites. Search for them yourself in each file with a finding.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-select.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-select` or `bal-select-option` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-select` including its options before rewriting it. This step is finished when every finding matches the mapping.

### Props: `bal-select` → `ds-select`

| old                                                                                                                      | new (`ds-select`)                                                                      | handling                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `invalid`, `multiple`, `disabled`, `readonly`, `required`, `placeholder`, `autoInvalidOff`, `value`              | same                                                                                   | Copy as-is. `autoInvalidOff` only has an effect with the `@helvetia-design/angular` integration.                                                                                                                                                                                                              |
| `typeahead`                                                                                                              | `searchable`                                                                           | Rename. Flag every occurrence with a **"check behaviour"** note: the legacy select searched by typing into the input itself, `ds-select` shows a search box inside the dropdown. When `typeahead` appears together with `selectionOptional` or `remote`, say that `searchable` alone does not reproduce them. |
| `balTabindex`                                                                                                            | _(no equivalent)_                                                                      | Do not rewrite and do not turn it into `tabindex`: on `ds-select` a host `tabindex` lands on the hidden native select, not the visible trigger. Leave it in place and report each occurrence by file and line as "no `ds-*` equivalent, needs manual rework".                                                 |
| `freeSolo`, `selectionOptional`, `filter`, `remote`, `loading`, `maxLength`, `noDataLabel`, `autocomplete`, `scrollable` | _(no equivalent)_                                                                      | Do not rewrite. Leave each in place and report each occurrence by file and line as "no `ds-*` equivalent, needs manual rework". Do not add a comment to the consumer's code.                                                                                                                                  |
| `inverted` (`@internal`)                                                                                                 | _(no equivalent)_                                                                      | Drop silently. It was never public API. Do not mention it in the summary.                                                                                                                                                                                                                                     |
| _(none — new prop)_                                                                                                      | `required` (defaults `true`)                                                           | Do not set this. The legacy select defaulted to `false`, so a migrated select inside a form now validates as required. Mention once, not per occurrence, that the default changed and that the consumer can set `required="false"` where it should not apply.                                                 |
| _(none — new props)_                                                                                                     | `label`, `description`, `invalidText`, `color`, `clearable`, `options`, `optionGroups` | New capabilities, nothing to migrate from legacy. Leave unset. `ds-select-optgroup` is likewise new.                                                                                                                                                                                                          |

### Props: `bal-select-option` → `ds-select-option`

| old                             | new (`ds-select-option`) | handling                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`, `disabled`             | same                     | Copy as-is.                                                                                                                                                                                                                                                                                                                                       |
| `label`                         | slotted text             | `ds-select-option` has no `label` prop, only a default slot. Rewrite `<bal-select-option label="A" value="a">` to `<ds-select-option value="a">A</ds-select-option>`. When the option already has slotted text, keep it and drop `label`. When both exist and differ, keep the slotted text and report the option by file and line as a conflict. |
| `for` (auto-generated id)       | _(no equivalent)_        | Drop silently. It was never public API.                                                                                                                                                                                                                                                                                                           |
| _(content with child elements)_ | text only                | The legacy select rendered option content as `innerHTML`. Rewrite the tag, keep the content, and report each option whose content contains child elements by file and line as a behaviour change that needs a manual check.                                                                                                                       |

### Tags and imports

- **HTML**: `<bal-select>` becomes `<ds-select>`, including the closing tag. `<bal-select-option>` becomes `<ds-select-option>`, including the closing tag.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalSelect` and/or `BalSelectOption` from `@baloise/ds-angular`, replace only the ones used with `DsSelect`/`DsSelectOption` from `@helvetia-design/angular`, keeping the rest on the `@baloise` import.
- **React**: `<BalSelect>`/`</BalSelect>` becomes `<DsSelect>`/`</DsSelect>`, `<BalSelectOption>`/`</BalSelectOption>` becomes `<DsSelectOption>`/`</DsSelectOption>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSelect` and `BalSelectOption` and leave the rest on the `@baloise` import.

### Events

Only `bal-select` emits events; `bal-select-option` has none.

| old                                    | new               | handling                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`                            | `dsChange`        | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. The detail for an empty single select changes from `undefined` to `null`: note it once per migrated handler. |
| `balFocus`                             | `dsFocus`         | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Flag with **"check behaviour"**: it now fires when the dropdown opens, and the event is synthetic, so `target` and `relatedTarget` are missing.        |
| `balBlur`                              | `dsBlur`          | Same shapes as `balFocus`, targeting `blur`. Flag with **"check behaviour"**: it now fires when the dropdown closes, with a synthetic event.                                                                                                                                  |
| `balInputClick`                        | `dsClick`         | Same shapes: `addEventListener`, `(balInputClick)`, `onBalInputClick` become `dsClick`, `(dsClick)`, `onDsClick`. Flag with **"check behaviour"**: it now fires for a click anywhere on the field, label and description included, not only on the input.                     |
| `balInput`, `balKeyPress`, `balCancel` | _(no equivalent)_ | Do not rewrite. Leave each handler in place and report each by file and line as "no `ds-*` equivalent, needs manual rework". `balCancel` was only emitted by the removed `cancel()` method.                                                                                   |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

Legacy `balChange` was emitted for user changes only. `ds-select` also emits `dsChange` when `value` is set from code and the selection actually changes (setting the same value again emits nothing). Mention this once, not per handler, and tell the consumer to verify handlers that write `value`.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event or calls a method without ever naming `bal-select`.

The scan does not list a file that only listens or calls methods and never uses `bal-select`/`bal-select-option`/`BalSelect`/`BalSelectOption`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

| old                                                  | new               | handling                                                                                                                                                                             |
| ---------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `open()`, `close()`                                  | same              | Unchanged.                                                                                                                                                                           |
| `setFocus()`                                         | `setFocus()`      | Unchanged call. It now focuses the select trigger instead of the input.                                                                                                              |
| `getValue()`, `clear()`, `cancel()`, `select(value)` | _(no equivalent)_ | Do not rewrite. Leave each call in place and report each by file and line as "no `ds-*` equivalent, needs manual rework"; the consumer reads or writes the `value` property instead. |
| `setAriaForm()` (`@internal`)                        | _(no equivalent)_ | Drop any reference silently, without a summary mention.                                                                                                                              |

`ds-select` also has `setBlur()`. It needs no migration.

## 4. Report

Print a per-file summary of what changed, including: every `typeahead` rewritten to `searchable` with its "check behaviour" note; every prop left in place as having no `ds-*` equivalent (`balTabindex`, `freeSolo`, `selectionOptional`, `filter`, `remote`, `loading`, `maxLength`, `noDataLabel`, `autocomplete`, `scrollable`); every option whose `label` and slotted text conflict; every option with child elements; every `balFocus`, `balBlur` and `balInputClick` rewrite with its "check behaviour" note; every `balChange` handler with the `undefined` to `null` note; every left-in-place `balInput`, `balKeyPress` and `balCancel` handler; every left-in-place `getValue()`, `clear()`, `cancel()` and `select()` call; every type reference such as `HTMLBalSelectElement`, `HTMLBalSelectOptionElement` or `BalEvents.BalSelectChange` that the scan cannot see (these resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed); the one-time note about `ds-select`'s new `required` default being left alone; the one-time note that an empty value is now `null`, which matters for code that checks `value.length` or `=== undefined`; the one-time note that programmatic `value` changes now emit `dsChange`; and the one-time note that `bal-field`/`bal-field-label`/`bal-field-control`/`bal-field-message` wrappers were left untouched because collapsing them is a separate, future migration. End with the note that files which only listen or call methods, and have no scanned `.html` of the same name beside them, were not scanned. Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
