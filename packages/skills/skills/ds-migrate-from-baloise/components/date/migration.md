# date

Migrate every `bal-date` usage to `ds-datepicker`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder holds `bal-date-calendar` and `bal-date-calendar-cell`. Both are internal parts of `bal-date`, rendered inside its shadow tree. They are not consumer tags, and `ds-datepicker` has no equivalent. The scan does not list them. Rewrite `bal-date` only.

The component is renamed. The old tag is `bal-date`, the new tag is `ds-datepicker`.

A surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is handled by `shared/field.md` in the Rewrite step, in the same pass. `components/field/migration.md` migrates `bal-form-grid` and `bal-form-col`.

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

| old (`bal-date`) | new (`ds-datepicker`) | handling |
| --- | --- | --- |
| `name`, `invalid`, `disabled`, `readonly`, `freeSolo`, `placeholder`, `autocomplete`, `value`, `min`, `max`, `defaultDate`, `allowedDates`, `debounce`, `autoInvalidOff` | same | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. |
| `min-year`, `max-year` (`minYearProp`, `maxYearProp` in React and Angular) | same | Copy as-is, in every form (`min-year="1990"`, `[attr.min-year]="x"`, `minYearProp={x}`, `[minYearProp]="x"`). Legacy and `ds-datepicker` use the same attribute and property names. |
| `required` set | `required` | Copy as-is. |
| `required` omitted | `required` set to false | Follow the required default rule in `SKILL.md`. Report each file where this was added. |
| `triggerIcon`, `closeOnSelect` | _(no equivalent)_ | Drop it in every form (bare, `="true"`, `="false"`, `{true}`, `[closeOnSelect]="x"`). Report each dropped prop as a behaviour difference. `ds-datepicker` opens the popup only from the calendar button, which is what `triggerIcon` did, and always closes it after a selection, so only `closeOnSelect` set to false loses behaviour. |
| `allowInvalidValue` | _(no equivalent)_ | Drop it in every form. Report each one as a logic change, see Report. Legacy emitted the string `INVALID_VALUE` from `balChange` for invalid input. `ds-datepicker` never does. |
| _(none)_ | `label`, `description`, `color`, `loading`, `inline` | New props. Nothing to migrate from. Leave them unset. |

### Tags and imports

- **HTML**: `<bal-date>` becomes `<ds-datepicker>`, including the closing tag.
- **Angular**: `<bal-date>` becomes `<ds-datepicker>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalDate` from `@baloise/ds-angular`, move only `BalDate` to `import { DsDatepicker } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalDate` with `DsDatepicker` in `imports:` lists too. `DsDatepicker` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working. `bal-date` has no own bundle. Only multi-family bundles such as `BalFormBundle` or `BalComponentBundle` hold it. They stay, and `DsDatepicker` is added next to them, as `SKILL.md` "Legacy types and bundles" describes.
- **React**: `<BalDate>` becomes `<DsDatepicker>` and `</BalDate>` becomes `</DsDatepicker>`. Import `DsDatepicker` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalDate` and leave the others on the `@baloise` import.

### Events

| old (`bal-date`) | new (`ds-datepicker`) | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Detail: `string \| null`, legacy `string \| undefined`. |
| `balInput` | `dsInput` | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms. Detail: `string \| null`. |
| `balBlur` | `dsBlur` | Same shapes. |
| `balFocus` | `dsFocus` | Same shapes. |
| `balInputClick` | `dsClick` | Same shapes: `(balInputClick)` becomes `(dsClick)` and `onBalInputClick` becomes `onDsClick`. |
| `balIconClick` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| `balWillAnimate`, `balDidAnimate` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |

Rewrite only handlers that are attached to the `bal-date` element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

When the value in `balChange` or `balInput` is read, note that it is `string | undefined` in legacy and `string | null` in `ds-datepicker`. A cleared field now yields `null`. Do not edit the handler, report it.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalDate*` and `BalDateCustomEvent` become `DsDatepickerCustomEvent`. Write a detail alias such as `BalEvents.BalDateChangeDetail` out as the new detail type, `string | null` for `dsChange` and `dsInput`. `HTMLBalDateElement` becomes `HTMLDsDatepickerElement`. The scan lists the `BalEvents.BalDate*` and `BalDateCustomEvent` types, but not the `BalDateCalendar*` ones. It lists the `HTMLBal*Element` types too. It does not list `BalProps.*`, so search for them yourself in each file with a finding.

### Methods

`setFocus()`, `setBlur()`, and `getInputElement()` keep their names. `open()`, `close()`, `toggle()`, `select()`, and `setAriaForm()` do not exist on `ds-datepicker`. Apply Unmapped props and handlers (`SKILL.md`). `select(date)` can often be replaced by setting `value`, say so in the report, but do not write that replacement.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for those calls and for `balChange`, `balInput`, `balIconClick`, and `INVALID_VALUE`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every dropped `allowInvalidValue`.
2. Every `balIconClick`, `balWillAnimate` and `balDidAnimate` handler, with its Unmapped props and handlers outcome.
3. Every `open()`, `close()`, `toggle()`, `select()` and `setAriaForm()` call, with its Unmapped props and handlers outcome. Say that `select(date)` can often be replaced by setting `value`.
4. Every place that compares against the string `INVALID_VALUE`. Search the consumer code for it, because `ds-datepicker` never emits it.
5. Every file where `allowInvalidValue` was dropped, reviewed for logic that relies on `INVALID_VALUE`.
6. Every handler or form binding that reads the value. A cleared field now yields `null` where `bal-date` yielded `undefined`, so code that checks `=== undefined` needs review.
7. Every field without `triggerIcon`. `bal-date` opened the popup on a click into the input, and `ds-datepicker` opens it only from the calendar button. Do not add attributes to compensate.
8. Every dropped `closeOnSelect` that was set to false. `ds-datepicker` closes the popup after every selection, so that behaviour is lost.
9. One-time note: `ds-datepicker` has `label`, `description`, and `color`. Fields may need a `label` now. Do not add one yourself.
10. Every selector that targets the legacy elements and that the scan cannot see. The legacy component set the classes `bal-date`, `bal-date__icon`, `bal-date__icon--is-clickable`, `bal-date__popup`, and `bal-date__popup--is-visible` on its host and its parts, and rendered `bal-input-date`, `bal-input-group`, and `bal-date-calendar` inside. Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.
11. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalDate*` type left in place, each detail alias such as `BalEvents.BalDateChangeDetail` written out, and each multi-family bundle such as `BalFormBundle` or `BalComponentBundle` kept with `DsDatepicker` added next to it.

Coverage only, written to the file:

12. Every `required` that was set to false.
13. Every dropped `triggerIcon`.
14. Every dropped `closeOnSelect`.
15. Every event handler that was renamed.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
