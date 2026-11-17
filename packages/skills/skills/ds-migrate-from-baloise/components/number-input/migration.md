# number-input

Migrate every `bal-number-input` usage to `ds-number-input`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The scan lists the `bal-number-input` tag, the React and Angular symbol `BalNumberInput`, and the `BalEvents.BalNumberInput*` and `BalNumberInputCustomEvent` types. It lists the `HTMLBalNumberInputElement` type too. It does not match `BalProps.BalNumberInputInterface`. Search for it yourself in each file with a finding. `SKILL.md` "Legacy types and bundles" says how to rewrite all of them.

The legacy component has no slots. `ds-number-input` adds a default slot and an `invalid-text` slot. Nothing to migrate, leave them unused.

The legacy folder has no consumer child tags. `bal-input`, `bal-input-stepper` and `bal-input-slider` are different components and are not part of this migration. The scan does not list them. The surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is handled by `shared/field.md` in the Rewrite step, in the same pass.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-number-input.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-number-input` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-number-input`) | new (`ds-number-input`) | handling |
| --- | --- | --- |
| `name`, `invalid`, `decimal`, `onlyPositive`, `suffix`, `pattern`, `placeholder`, `disabled`, `readonly`, `exactNumber`, `min`, `max`, `debounce`, `autoInvalidOff` | same | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. |
| `value` | `value` | `value` is now `number \| null`. The legacy type was `number \| string`. Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. Copy an HTML attribute as-is. In React, rewrite a numeric string literal to a number, so `value="5"` becomes `value={5}`. In Angular, `value="5"` becomes `[value]="5"`. A non-literal binding: HTML copies it unchanged. React and Angular copy it when the expression's type only admits numbers or `null`. Otherwise apply Unmapped props and handlers (`SKILL.md`). |
| `required` set | `required` | Copy as-is. |
| `required` omitted | `required` set to false | Follow the required default rule in `SKILL.md`. Report each file where this was added. |
| _(none)_ | `label`, `description`, `color`, `invalidText` | New props. Nothing to migrate from. Leave them unset. |

### Tags and imports

- **HTML**: `<bal-number-input>` becomes `<ds-number-input>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalNumberInput` from `@baloise/ds-angular`, move only that symbol to `import { DsNumberInput } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsNumberInput` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working. `bal-number-input` has no own bundle. Only multi-family bundles such as `BalFormBundle` or `BalComponentBundle` hold it. They stay, and `DsNumberInput` is added next to them, as `SKILL.md` "Legacy types and bundles" describes.
- **React**: `<BalNumberInput>` becomes `<DsNumberInput>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalNumberInput` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Detail: `number \| null`, legacy `number \| undefined`. |
| `balInput` | `dsInput` | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms. Detail: `number \| null`. |
| `balBlur` | `dsBlur` | Same shapes. |
| `balFocus` | `dsFocus` | Same shapes. |
| `balKeyPress` | `dsKeyPress` | Same shapes. |
| _(none)_ | `dsClick` | New event. Nothing to migrate from. |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, `balFocus`, and `balKeyPress` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalNumberInput*` and `BalNumberInputCustomEvent` become `DsNumberInputCustomEvent`. Write a detail alias such as `BalEvents.BalNumberInputChangeDetail` out as the new detail type, `number | null` for `dsChange` and `dsInput`. `HTMLBalNumberInputElement` becomes `HTMLDsNumberInputElement`.

Do not edit handler bodies. `dsBlur`, `dsFocus` and `dsKeyPress` keep their `FocusEvent` and `KeyboardEvent` detail, so there is nothing to report for them. Report this detail change so the consumer can check it:

- `dsChange` and `dsInput` carry `number | null`. The legacy detail was `number | undefined`. List each handler that compares the detail with `undefined`, and each binding that expects `undefined` for an empty field.

### Methods

`getInputElement()` keeps its name and still resolves an `HTMLInputElement`, but that input now lives in the shadow DOM. Do not rewrite calls to it. List each call by file and line as "input is now in the shadow DOM, check the caller". `setAriaForm()` does not exist on `ds-number-input`. Apply Unmapped props and handlers (`SKILL.md`). `setFocus()` is unchanged.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `getInputElement` and `setAriaForm` calls and for `balChange`, `balInput`, `balBlur`, `balFocus`, and `balKeyPress`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every file where `shared/field.md` moved the label and message of a surrounding `bal-field` onto the `label`, `description` and `invalidText` props, and every `bal-field` left in place. The legacy input was linked to that label and message through `setAriaForm()` (`aria-labelledby`, `aria-describedby`). A `bal-field` left in place keeps a label that is no longer linked, which is a WCAG regression the scan cannot see.
2. Every `getInputElement()` call that needs a check, and every `setAriaForm()` call with its Unmapped props and handlers outcome.
3. Every handler that needs manual rework.
4. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalNumberInput*` type left in place, each detail alias such as `BalEvents.BalNumberInputChangeDetail` written out, and each multi-family bundle such as `BalFormBundle` or `BalComponentBundle` kept with `DsNumberInput` added next to it.
5. Every bound `value`, with its outcome: copied, or removed (Unmapped). Name each copied binding that can be `undefined`. `value` is now `number | null`. The legacy type was `number | string | undefined`.
6. Every usage without its own `pattern`. The legacy input always set an auto-generated `pattern` (thousand separators, decimals, `suffix`). `ds-number-input` only sets a `pattern` the consumer passes, so native pattern validation is gone for these usages.
7. Every selector that targeted the legacy element or its input and that the scan cannot see (`bal-number-input` classes, `data-testid="bal-number-input"`, `.input`, `.is-danger`, `.is-disabled`). The legacy input was in the light DOM, so tests and styles that query them break. The native input is reachable with `::part(input)` for styles, and the parts `prefix`, `suffix`, `decrement` and `increment` are reachable the same way. Do not rewrite those selectors yourself. Report them.
8. One-time note: `ds-number-input` renders increment and decrement buttons (`::part(increment)`, `::part(decrement)`). The legacy component had none. The field looks different, and layouts around it may need a check.

Coverage only, written to the file:

9. Every `required` that was set to false.
10. Every event handler that was renamed.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
