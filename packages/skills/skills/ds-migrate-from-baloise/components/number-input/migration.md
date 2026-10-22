# number-input

Migrate every `bal-number-input` usage to `ds-number-input`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The scan lists the `bal-number-input` tag and the React and Angular symbol `BalNumberInput`. It does not match the ambient `BalEvents.BalNumberInput*` or `BalProps.BalNumberInputInterface` types. Those are Report items, not rewrites. Search for them yourself in each file with a finding.

The legacy component has no slots. `ds-number-input` adds a default slot and an `invalid-text` slot. Nothing to migrate, leave them unused.

The legacy folder has no consumer child tags. `bal-input`, `bal-input-stepper` and `bal-input-slider` are different components and are not part of this migration. The scan does not list them. The surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is not part of it either: leave it untouched.

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

| old (`bal-number-input`)                                                                                                                                                     | new (`ds-number-input`)                        | handling                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`, `invalid`, `decimal`, `onlyPositive`, `suffix`, `pattern`, `placeholder`, `disabled`, `readonly`, `exactNumber`, `min`, `max`, `debounce`, `value`, `autoInvalidOff` | same                                           | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged.                                                                                                               |
| `required` set                                                                                                                                                               | `required`                                     | Copy as-is.                                                                                                                                                                                                                                                                                            |
| `required` omitted                                                                                                                                                           | `required` set to false                        | The default flipped. `bal-number-input` was optional, `ds-number-input` is required, and it passes `required` to the native input, so it changes form validation. Add `required="false"` (HTML), `[required]="false"` (Angular), or `required={false}` (React). Report each file where this was added. |
| _(none)_                                                                                                                                                                     | `label`, `description`, `color`, `invalidText` | New props. Nothing to migrate from. Leave them unset.                                                                                                                                                                                                                                                  |

### Tags and imports

- **HTML**: `<bal-number-input>` becomes `<ds-number-input>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalNumberInput` from `@baloise/ds-angular`, move only that symbol to `import { DsNumberInput } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsNumberInput` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working.
- **React**: `<BalNumberInput>` becomes `<DsNumberInput>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalNumberInput` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

| old           | new          | handling                                                                                                                                                            |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`   | `dsChange`   | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| `balInput`    | `dsInput`    | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms.                                                                   |
| `balBlur`     | `dsBlur`     | Same shapes.                                                                                                                                                        |
| `balFocus`    | `dsFocus`    | Same shapes.                                                                                                                                                        |
| `balKeyPress` | `dsKeyPress` | Same shapes.                                                                                                                                                        |
| _(none)_      | `dsClick`    | New event. Nothing to migrate from.                                                                                                                                 |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, `balFocus`, and `balKeyPress` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

The detail types `BalEvents.BalNumberInput*Detail` are not rewritten, and the scan does not find them. Search for them in each file with a finding and list each use as "type needs manual rework".

Do not edit handler bodies. `dsBlur`, `dsFocus` and `dsKeyPress` keep their `FocusEvent` and `KeyboardEvent` detail, so there is nothing to report for them. Report this detail change so the consumer can check it:

- `dsChange` and `dsInput` carry `number | null`. The legacy detail was `number | undefined`. List each handler that compares the detail with `undefined`, and each binding that expects `undefined` for an empty field.

### Methods

`getInputElement()` keeps its name and still resolves an `HTMLInputElement`, but that input now lives in the shadow DOM. Do not rewrite calls to it. List each call by file and line as "input is now in the shadow DOM, check the caller". `setAriaForm()` does not exist on `ds-number-input`. Do not remove calls to it and do not invent a replacement. List each call by file and line as "method no longer available, needs manual rework". `setFocus()` is unchanged.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `getInputElement` and `setAriaForm` calls and for `balChange`, `balInput`, `balBlur`, `balFocus`, and `balKeyPress`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Print a per-file summary of what changed, including every `required` that was set to false, every event handler that was renamed, and every method call, handler and detail-type use that needs manual rework.

Report the accessibility change first, because it is a WCAG regression and the scan cannot see it:

- **Label no longer linked**: the legacy input was linked to a surrounding `bal-field-label` and `bal-field-message` through `setAriaForm()` (`aria-labelledby`, `aria-describedby`). `ds-number-input` renders its own field and only sets `aria-describedby` to its own description. A label in a surrounding `bal-field` is no longer associated with the input. List every file where the surrounding `bal-field` carries a label or message, and tell the consumer to move it to the `label`, `description` and `invalidText` props of `ds-number-input`.

Report these other changes the scan cannot see, so the consumer can check them:

- **Value type**: `value` is `number | null`. The legacy type was `number | string | undefined`. List each bound value that is a string or that can be `undefined`.
- **Pattern**: the legacy input always set an auto-generated `pattern` (thousand separators, decimals, `suffix`). `ds-number-input` only sets a `pattern` the consumer passes. Native pattern validation is gone for every usage without its own `pattern`.
- **Shadow DOM**: the legacy input was in the light DOM. Selectors that reach into it break. List every selector that targeted the legacy element or its input and that the scan cannot see (`bal-number-input` classes, `data-testid="bal-number-input"`, `.input`, `.is-danger`, `.is-disabled`). Tests and styles that query them break. The native input is reachable with `::part(input)` for styles, and the parts `prefix`, `suffix`, `decrement` and `increment` are reachable the same way. Do not rewrite those selectors yourself. Report them.
- **Increment and decrement buttons**: `ds-number-input` renders increment and decrement buttons (`::part(increment)`, `::part(decrement)`). The legacy component had none. Tell the consumer the field looks different and layouts around it may need a check.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
