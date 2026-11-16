# dropdown → select

Migrate every `bal-dropdown` usage to `ds-select`, and every `bal-option` usage to `ds-select-option`. `bal-option-list` has no counterpart: it is removed where it wraps the options of a `bal-dropdown`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The three legacy tags are migrated together, not separately. A legacy `bal-dropdown` reads its options from its `bal-option` children, and `ds-select` reads its slotted `ds-select-option` children the same way, so a dropdown and its options are always rewritten in the same pass.

Apply `shared/field.md` in the Rewrite step to every migrated `ds-select` that sits inside a `bal-field`, in the same pass. It moves the label, description and message of the wrapper onto the control and removes the wrapper tags. A `bal-field` around a control that is still a legacy `bal-*` tag stays unchanged. `components/field/migration.md` migrates `bal-form-grid`, `bal-form-col` and every `bal-field` that is left.

The scan also lists `newBalOption`, `BalDropdownBundle`, the `BalEvents.BalDropdown*` and `BalEvents.BalOption*` types and the bare `BalDropdownCustomEvent`, `BalOptionCustomEvent` and `BalOptionListCustomEvent` types. It lists the `HTMLBalDropdownElement`, `HTMLBalOptionElement` and `HTMLBalOptionListElement` types too. It does not match `BalProps.BalDropdown*` and `BalProps.BalOptionListFilter`. Search for them yourself in each file with a finding. `SKILL.md` "Legacy types and bundles" says how to rewrite all of them.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-dropdown.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-dropdown`, `bal-option` or `bal-option-list` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-dropdown` including its options before rewriting it. This step is finished when every finding matches the mapping.

### Props: `bal-dropdown` → `ds-select`

| old | new (`ds-select`) | handling |
| --- | --- | --- |
| `name`, `invalid`, `multiple`, `disabled`, `readonly`, `required`, `placeholder`, `clearable`, `value` | same | Copy as-is. A set `required` is copied as-is. |
| `options` | `options` | Copy the binding and rewrite the array as described in "Options as a prop" below. |
| `chips` | _(no equivalent)_ | A multiple `ds-select` always shows the selected values as chips. Apply Unmapped props and handlers (`SKILL.md`). Report every multiple dropdown without `chips`, because it showed a comma-separated list before and shows chips now. |
| `tabindex` (attribute) | _(no equivalent)_ | The legacy dropdown passed it to its input. Do not copy it, because on `ds-select` a host `tabindex` lands on the hidden native select, not the visible trigger. Apply Unmapped props and handlers (`SKILL.md`). |
| `autocomplete`, `contentHeight`, `filter`, `icon`, `inlineLabel`, `loading`, `size`, `theme` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| `inverted` (`@internal`) | _(no equivalent)_ | Drop silently. It was never public API. Do not mention it in the report. |
| `required` omitted | `required` set to false | Follow the required default rule in `SKILL.md`. Report each file where this was added. |
| _(none, new props)_ | `label`, `description`, `invalidText`, `color`, `searchable`, `optionGroups`, `autoInvalidOff` | New capabilities, nothing to migrate from legacy. Leave unset, unless `shared/field.md` sets them. `ds-select-optgroup` is likewise new. |

### Props: `bal-option` → `ds-select-option`

| old | new (`ds-select-option`) | handling |
| --- | --- | --- |
| `value`, `disabled` | same | Copy as-is. |
| `label` | slotted text | `ds-select-option` has no `label` prop, only a default slot, and `ds-select` shows its text both in the list and in the field. Rewrite `<bal-option label="A" value="a"></bal-option>` to `<ds-select-option value="a">A</ds-select-option>`. When the option already has slotted text, keep it and drop `label`. A `label` binding and slotted text with the same expression (`[label]="o.label"` and `{{ o.label }}`) count as equal. When both exist and differ, keep the slotted text and report the option by file and line as a conflict, because the legacy dropdown showed `label` in the field and the slotted content in the list. |
| `multiline`, `invalid`, `hidden`, `selected`, `focused` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). The legacy dropdown overwrote `selected` and `focused` from its own `value`, so the selection comes from `value` on `ds-select`. |
| _(content with child elements)_ | text only | The legacy option rendered its slotted markup. `ds-select` reads only the text of a `ds-select-option`. Rewrite the tag, keep the content, and report each option whose content contains child elements by file and line as a behaviour change that needs a manual check. |

### `bal-option-list`

`bal-option-list` is the list that `bal-dropdown` renders itself. `ds-select` has no list element.

- When a `bal-option-list` sits directly inside a `bal-dropdown` and wraps its options, remove its opening and closing tags and keep its children. Report every attribute it carried (`filter`, `contentHeight`, `multiple`, `required`, `disabled`, `labelledby`, `focusIndex`) as dropped.
- Leave any other `bal-option-list` unchanged and report it, including the `bal-option` children inside it. Do not migrate a `bal-option` that is not inside a `bal-dropdown`. Keep the `BalOptionList` and `BalOption` imports and the `BalDropdownBundle` spread while such a tag is left.
- A ref to a removed `bal-option-list` (`HTMLBalOptionListElement`, `#list`) loses its element. Apply Unmapped props and handlers (`SKILL.md`) to every method call on it, such as `filterByContent()`, `focusFirst()` or `getSelectedValues()`.

### Options as a prop

The legacy `options` prop takes `BalOption[]`, usually built with `newBalOption({ value, label }, { disabled, invalid, selected, focused, hidden, multiline })` from `@baloise/ds-core`. `ds-select` takes `SelectOption[]`, which is `{ label: string; value: string; disabled?: boolean }`.

- Rewrite each `newBalOption({ value, label })` call to the object literal `{ value, label }`. Copy `disabled` from the second argument into the literal.
- `invalid`, `selected`, `focused`, `hidden` and `multiline` in the second argument have no equivalent. Remove them. When the value is not a literal, keep it in a `// TODO(ds-migrate): <name> had no ds-* target: <expression>` comment on the line above. Report each one.
- `SelectOption.value` is a string. Report every option whose `value` is not a string as "will not compile, needs manual rework".
- Remove `newBalOption` from the `@baloise/ds-core` import once no call is left. Drop the whole import line when no binding is left.
- Retype an options array as `SelectOption[]` with `import type { SelectOption } from '@helvetia-design/core'`. Merge it into an existing import from that module.
- The legacy dropdown showed `options` and its `bal-option` children together. `ds-select` ignores its slotted options while `options` is not empty. Report every dropdown that sets both.

### Tags and imports

- **HTML**: `<bal-dropdown>` becomes `<ds-select>`, including the closing tag. `<bal-option>` becomes `<ds-select-option>`, including the closing tag. A wrapping `<bal-option-list>` is removed as described above.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalDropdown`, `BalOption` and/or `BalOptionList` from `@baloise/ds-angular`, replace `BalDropdown` with `DsSelect` and `BalOption` with `DsSelectOption` from `@helvetia-design/angular`, keeping only the ones used. Remove `BalOptionList` once no `bal-option-list` tag is left in that template. A `...BalDropdownBundle` spread in `imports: [...]` becomes `DsSelect` and `DsSelectOption`. A multi-family bundle such as `BalFormBundle` stays, and the `Ds*` symbols are added next to it. `SKILL.md` "Legacy types and bundles" has the full bundle rule. `DsSelect` registers the value accessor, so `formControlName`, `[formControl]` and `ngModel` keep working.
- **React**: `<BalDropdown>`/`</BalDropdown>` becomes `<DsSelect>`/`</DsSelect>`, `<BalOption>`/`</BalOption>` becomes `<DsSelectOption>`/`</DsSelectOption>`, and a wrapping `<BalOptionList>` is removed. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalDropdown` and `BalOption`, drop `BalOptionList` once it is unused, and leave the rest on the `@baloise` import.

### Events

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Detail: `string \| string[] \| null`. The detail for an empty single dropdown changes from `undefined` to `null`: note it once per migrated handler. |
| `balFocus` | `dsFocus` | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Flag with **"check behaviour"**: it fired when the input got focus, and now fires when the dropdown opens. The event is synthetic, so `target` and `relatedTarget` are missing. Detail: `FocusEvent`. |
| `balBlur` | `dsBlur` | Same shapes as `balFocus`, targeting `blur`. Flag with **"check behaviour"**: it now fires when the dropdown closes, with a synthetic event. Detail: `FocusEvent`. |
| `balOptionChange` | _(no equivalent)_ | Emitted by `bal-option`. Apply Unmapped props and handlers (`SKILL.md`). Point the consumer to `dsChange` on the `ds-select`. |
| `balOptionFocus` (`@internal`) | _(no equivalent)_ | Drop any binding silently, without a mention in the report. |

`ds-select` also emits `dsClick`. It needs no migration.

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

Legacy `balChange` was emitted for user changes and for `select()` and `clear()` calls only. `ds-select` also emits `dsChange` when `value` is set from code and the selection actually changes (setting the same value again emits nothing). Mention this once, not per handler, and tell the consumer to verify handlers that write `value`.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalDropdown*` and `BalDropdownCustomEvent` become `DsSelectCustomEvent`. Use the detail from the table above as the type argument, so a legacy `BalDropdownCustomEvent<string | string[] | undefined>` becomes `DsSelectCustomEvent<string | string[] | null>`. Write a detail alias such as `BalEvents.BalDropdownChangeDetail` out as `string | string[] | null`. `HTMLBalDropdownElement` becomes `HTMLDsSelectElement`, and `HTMLBalOptionElement` becomes `HTMLDsSelectOptionElement`. `BalEvents.BalOption*`, `BalOptionCustomEvent`, `BalOptionListCustomEvent` and `HTMLBalOptionListElement` have no `Ds*` counterpart. Leave them where they are, on a handler or ref kept by Unmapped props and handlers, and report each one.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there. This is the Angular case where the template holds the tag and the class file handles the event or calls a method without ever naming `bal-dropdown`.

The scan does not list a file that only listens or calls methods and never uses `bal-dropdown`/`bal-option`/`bal-option-list`/`BalDropdown`/`BalOption`/`BalOptionList`/`newBalOption`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

| old | new | handling |
| --- | --- | --- |
| `open()`, `close()` | same | Unchanged. |
| `setFocus()` | `setFocus()` | Unchanged call. It now focuses the select trigger instead of the input. |
| `getValue()`, `clear()`, `select(value)` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). In the report, say that the consumer reads or writes the `value` property instead. |
| `select(selected)` on `bal-option` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). In the report, say that the consumer writes `value` on the `ds-select` instead. |
| `setAriaForm()`, `configChanged()` (`@internal`) | _(no equivalent)_ | Drop any reference silently, without a mention in the report. |

`ds-select` also has `setBlur()`. It needs no migration.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `bal-dropdown` prop or attribute with no `ds-*` equivalent, with its Unmapped props and handlers outcome: `autocomplete`, `chips`, `contentHeight`, `filter`, `icon`, `inlineLabel`, `loading`, `size`, `theme` and `tabindex`. Name file and line for each.
2. Every multiple dropdown without `chips`, which now shows its values as chips.
3. Every `bal-option` prop with no `ds-*` equivalent, with its Unmapped props and handlers outcome: `multiline`, `invalid`, `hidden`, `selected`, `focused`.
4. Every option whose `label` and slotted text conflict.
5. Every option with child elements.
6. Every `bal-option-list` left in place, with the `bal-option` children inside it, and every attribute dropped from a removed `bal-option-list`.
7. Every `options` rewrite: each option key removed from a `newBalOption` call, each option `value` that is not a string, and each dropdown that sets both `options` and child options.
8. Every `balFocus` and `balBlur` rewrite, with its "check behaviour" note.
9. Every `balChange` handler, with the note that the detail for an empty single dropdown is now `null` instead of `undefined`.
10. Every `balOptionChange` handler, with its Unmapped props and handlers outcome.
11. Every `getValue()`, `clear()` and `select()` call on a dropdown, every `select()` call on an option, and every method call on a removed `bal-option-list`, with its Unmapped props and handlers outcome.
12. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalDropdown*` and `BalProps.BalOptionListFilter` type left in place, each `BalEvents.BalOption*`, `BalOptionCustomEvent`, `BalOptionListCustomEvent` and `HTMLBalOptionListElement` left in place, each detail alias such as `BalEvents.BalDropdownChangeDetail` written out, each `BalDropdownBundle` spread kept because a legacy tag is left, and each multi-family bundle kept.
13. One-time note: an empty value is now `null`. This matters for code that checks `value.length` or `=== undefined`.
14. One-time note: programmatic `value` changes now emit `dsChange`. Verify handlers that write `value`.
15. One-time note: files which only listen or call methods, and have no scanned `.html` of the same name beside them, were not scanned.

Coverage only, written to the file:

16. Every `required` that was set to false.
17. Every `bal-option-list` wrapper removed.
18. Every `newBalOption` call rewritten to an object literal.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
