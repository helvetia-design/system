# select

Migrate every `bal-select` usage to `ds-select`, and every `bal-select-option` usage to `ds-select-option`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. A legacy `bal-select` reads its options from its `bal-select-option` children, and `ds-select` reads its slotted `ds-select-option` children the same way, so a select and its options are always rewritten in the same pass.

Apply `shared/field.md` in the Rewrite step to every migrated `ds-select` that sits inside a `bal-field`, in the same pass. It moves the label, description and message of the wrapper onto the control and removes the wrapper tags. A `bal-field` around a control that is still a legacy `bal-*` tag stays unchanged. `components/field/migration.md` migrates `bal-form-grid`, `bal-form-col` and every `bal-field` that is left.

The scan also lists `BalSelectBundle` and the `BalEvents.BalSelect*` and `BalSelect*CustomEvent` types. It lists the `HTMLBalSelectElement` and `HTMLBalSelectOptionElement` types too. It does not match `BalProps.BalSelect*`. Search for them yourself in each file with a finding. `SKILL.md` "Legacy types and bundles" says how to rewrite all of them.

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

| old | new (`ds-select`) | handling |
| --- | --- | --- |
| `name`, `invalid`, `multiple`, `disabled`, `readonly`, `required`, `placeholder`, `autoInvalidOff`, `value` | same | Copy as-is. A set `required` is copied as-is. `autoInvalidOff` only has an effect with the `@helvetia-design/angular` integration. |
| `typeahead` | `searchable` | Rename. Flag every occurrence with a **"check behaviour"** note: the legacy select searched by typing into the input itself, `ds-select` shows a search box inside the dropdown. When `typeahead` appears together with `selectionOptional` or `remote`, say that `searchable` alone does not reproduce them. |
| `balTabindex` | _(no equivalent)_ | Do not turn it into `tabindex`, because on `ds-select` a host `tabindex` lands on the hidden native select, not the visible trigger. Apply Unmapped props and handlers (`SKILL.md`). |
| `freeSolo`, `selectionOptional`, `filter`, `remote`, `loading`, `maxLength`, `noDataLabel`, `autocomplete`, `scrollable` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| `inverted` (`@internal`) | _(no equivalent)_ | Drop silently. It was never public API. Do not mention it in the report. |
| `required` omitted | `required` set to false | Follow the required default rule in `SKILL.md`. Report each file where this was added. |
| _(none — new props)_ | `label`, `description`, `invalidText`, `color`, `clearable`, `options`, `optionGroups` | New capabilities, nothing to migrate from legacy. Leave unset. `ds-select-optgroup` is likewise new. |

### Props: `bal-select-option` → `ds-select-option`

| old | new (`ds-select-option`) | handling |
| --- | --- | --- |
| `value`, `disabled` | same | Copy as-is. |
| `label` | slotted text | `ds-select-option` has no `label` prop, only a default slot. Rewrite `<bal-select-option label="A" value="a">` to `<ds-select-option value="a">A</ds-select-option>`. When the option already has slotted text, keep it and drop `label`. When both exist and differ, keep the slotted text and report the option by file and line as a conflict. |
| `for` (auto-generated id) | _(no equivalent)_ | Drop silently. It was never public API. |
| _(content with child elements)_ | text only | The legacy select rendered option content as `innerHTML`. Rewrite the tag, keep the content, and report each option whose content contains child elements by file and line as a behaviour change that needs a manual check. |

### Tags and imports

- **HTML**: `<bal-select>` becomes `<ds-select>`, including the closing tag. `<bal-select-option>` becomes `<ds-select-option>`, including the closing tag.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalSelect` and/or `BalSelectOption` from `@baloise/ds-angular`, replace only the ones used with `DsSelect`/`DsSelectOption` from `@helvetia-design/angular`, keeping the rest on the `@baloise` import. A `...BalSelectBundle` spread in `imports: [...]` becomes `DsSelect` and `DsSelectOption`. A multi-family bundle such as `BalFormBundle` stays, and the `Ds*` symbols are added next to it. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- **React**: `<BalSelect>`/`</BalSelect>` becomes `<DsSelect>`/`</DsSelect>`, `<BalSelectOption>`/`</BalSelectOption>` becomes `<DsSelectOption>`/`</DsSelectOption>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSelect` and `BalSelectOption` and leave the rest on the `@baloise` import.

### Events

Only `bal-select` emits events; `bal-select-option` has none.

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Detail: `string \| string[] \| null`. The detail for an empty single select changes from `undefined` to `null`: note it once per migrated handler. |
| `balFocus` | `dsFocus` | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Flag with **"check behaviour"**: it now fires when the dropdown opens, and the event is synthetic, so `target` and `relatedTarget` are missing. Detail: `FocusEvent`. |
| `balBlur` | `dsBlur` | Same shapes as `balFocus`, targeting `blur`. Flag with **"check behaviour"**: it now fires when the dropdown closes, with a synthetic event. Detail: `FocusEvent`. |
| `balInputClick` | `dsClick` | Same shapes: `addEventListener`, `(balInputClick)`, `onBalInputClick` become `dsClick`, `(dsClick)`, `onDsClick`. Flag with **"check behaviour"**: it now fires for a click anywhere on the field, label and description included, not only on the input. Detail: `MouseEvent`. |
| `balInput`, `balKeyPress`, `balCancel` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). `balCancel` was only emitted by the removed `cancel()` method. |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

Legacy `balChange` was emitted for user changes only. `ds-select` also emits `dsChange` when `value` is set from code and the selection actually changes (setting the same value again emits nothing). Mention this once, not per handler, and tell the consumer to verify handlers that write `value`.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalSelect*` and `BalSelectCustomEvent` become `DsSelectCustomEvent`. Use the detail from the table above as the type argument, so a legacy `BalSelectCustomEvent<string | string[] | undefined>` becomes `DsSelectCustomEvent<string | string[] | null>`. Write a detail alias such as `BalEvents.BalSelectChangeDetail` out as `string | string[] | null`. `HTMLBalSelectElement` becomes `HTMLDsSelectElement`, and `HTMLBalSelectOptionElement` becomes `HTMLDsSelectOptionElement`.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event or calls a method without ever naming `bal-select`.

The scan does not list a file that only listens or calls methods and never uses `bal-select`/`bal-select-option`/`BalSelect`/`BalSelectOption`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

| old | new | handling |
| --- | --- | --- |
| `open()`, `close()` | same | Unchanged. |
| `setFocus()` | `setFocus()` | Unchanged call. It now focuses the select trigger instead of the input. |
| `getValue()`, `clear()`, `cancel()`, `select(value)` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). When the code uses the result, the placeholder type is `string[]` for `getValue()` and `void` for the others, the legacy return types without the `Promise`. In the report, say that the consumer reads or writes the `value` property instead. |
| `setAriaForm()` (`@internal`) | _(no equivalent)_ | Drop any reference silently, without a mention in the report. |

`ds-select` also has `setBlur()`. It needs no migration.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `typeahead` rewritten to `searchable`, with its "check behaviour" note. When `typeahead` sat together with `selectionOptional` or `remote`, say that `searchable` alone does not reproduce them.
2. Every prop with no `ds-*` equivalent, with its Unmapped props and handlers outcome: `balTabindex`, `freeSolo`, `selectionOptional`, `filter`, `remote`, `loading`, `maxLength`, `noDataLabel`, `autocomplete`, `scrollable`. Name file and line for each.
3. Every option whose `label` and slotted text conflict.
4. Every option with child elements.
5. Every `balFocus`, `balBlur` and `balInputClick` rewrite, with its "check behaviour" note.
6. Every `balChange` handler, with the note that the detail for an empty single select is now `null` instead of `undefined`.
7. Every `balInput`, `balKeyPress` and `balCancel` handler, with its Unmapped props and handlers outcome.
8. Every `getValue()`, `clear()`, `cancel()` and `select()` call, with its Unmapped props and handlers outcome.
9. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalSelect*` type left in place, each detail alias such as `BalEvents.BalSelectChangeDetail` written out, each `BalSelectBundle` spread kept because a legacy tag is left, and each multi-family bundle kept.
10. One-time note: an empty value is now `null`. This matters for code that checks `value.length` or `=== undefined`.
11. One-time note: programmatic `value` changes now emit `dsChange`. Verify handlers that write `value`.
12. One-time note: files which only listen or call methods, and have no scanned `.html` of the same name beside them, were not scanned.

Coverage only, written to the file:

13. Every `required` that was set to false.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
