# time-input

Migrate every `bal-time-input` usage to a native `<input type="time" class="ds-time-input">` inside the Helvetia CSS field markup. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Helvetia has no time input element. `ds-time-input` is a CSS class from `@helvetia-design/styles`, which Init has already imported. `.ds-time-input` alone only sets CSS variables. The styles apply inside the field markup, because the selectors are `.ds-field .ds-time-input` and `.ds-field .ds-control input[type=time]`, and the border and the state colors come from `.ds-field` and `.ds-control`. So every migrated input gets this structure, also when the legacy element had no `bal-field` around it:

```html
<div class="ds-field">
  <label class="ds-label" for="start-time">Start</label>
  <div class="ds-control">
    <input type="time" id="start-time" class="ds-time-input" name="start" aria-describedby="start-time-help" />
  </div>
  <p class="ds-help" id="start-time-help">Format HH:MM</p>
</div>
```

`shared/field.md` does not apply to this migration, although `bal-time-input` is a form control. That file moves the legacy field onto the props of a `ds-*` control, and the target here renders no field and has no props. The section "Field" below rewrites the `bal-field` around a time input to the CSS field markup instead, and the report has no `F` items. The required default rule in `SKILL.md` does not apply either, because the native `required` defaults to false like the legacy one.

The legacy component has no child tags. It rendered a clock icon and a localized `HH:MM` placeholder. The native input shows the browser's own picker and format, so neither carries over.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-time-input.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan also lists the `BalEvents.BalTimeInput*` and `BalTimeInputCustomEvent` types. It lists the `HTMLBalTimeInputElement` type too. It does not match `BalProps.*` types. Search for them yourself in each file with a finding. Legacy Angular has no `BalTimeInputBundle`. `BalFormBundle` and `BalComponentBundle` contain `BalTimeInput` and stay.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-time-input` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element and its enclosing `bal-field` when the snippet does not show them. This step is finished when every finding matches the mapping.

In React write `className`, `htmlFor` and `readOnly`. In Angular and HTML write `class`, `for` and `readonly`.

### Id

The `<label>` and the help text point at the input by `id`. Use the `id` of the `bal-time-input` when it has a static one. Otherwise use its static `name` or `formControlName`, and add a numeric suffix when that id is already used in the file. The help text gets `<id>-help`. When the element sits in a loop (`*ngFor`, `@for`, `.map(`) or has no static name, bind the id with the loop index or a value of the item, such as `[id]="'time-' + i"` and `[attr.aria-describedby]="'time-' + i + '-help'"`, and report it.

### Props: `bal-time-input` → `<input type="time" class="ds-time-input">`

| old | new | handling |
| --- | --- | --- |
| `name`, `required`, `disabled`, `readonly` | same native attributes | Copy as-is, bindings included. `disabled` also puts `is-disabled` on the `ds-field`, see State. `readonly` gets no state class, see State. |
| `name` omitted | _(nothing)_ | Write no `name`. The legacy element generated `bal-time-input-<n>`. |
| `value` | `value` | HTML and Angular: copy as-is, bindings included. React: see "React value" below. |
| `invalid` | `aria-invalid="true"` on the input and `is-danger` on the `ds-field` | The danger border comes from `.ds-field.is-danger`, so the input alone shows no state. Static `invalid` writes both. Angular `[invalid]="x"` becomes `[attr.aria-invalid]="x ? 'true' : null"` on the input and `[class.is-danger]="x"` on the `ds-field`. React `invalid={x}` becomes `aria-invalid={x ? true : undefined}` on the input and ``className={`ds-field${x ? ' is-danger' : ''}`}`` on the field. |
| `aria-label`, `title`, `tabindex`, `data-hj-allow` | same, on the input | The legacy element copied these four onto its inner input. Copy them as-is. |
| `id` | `id` on the input | See Id above. |
| `class`, `style` and other attributes on the legacy element | same, on the `ds-field` | The legacy host was the outer box, so they go on the `<div class="ds-field">`. Merge `class` with `ds-field`. |
| `debounce` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| `autoInvalidOff` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). In Angular it also decides the State rule below. |

### React value

React controls an `<input>` that has `value`. The input then shows only what the state holds, so the handler that receives each edit has to write the new value back into that state.

- When the element has `onBalInput` or `onBalChange`, keep `value` and report the element: the consumer checks that the handler sets the state behind `value` from `event.currentTarget.value`. Without that the input does not change while typing.
- When it has neither, write `defaultValue` instead of `value`, and report it: later changes of the bound value no longer reach the input.

### State

The legacy Angular value accessor of `@baloise/ds-angular` set `invalid` on the time input and on its `bal-field` while a bound control was touched and invalid, unless `autoInvalidOff` was set. It also set `disabled` on both when the control was disabled. A native input with `formControlName`, `[formControl]` or `ngModel` uses Angular's own `DefaultValueAccessor`, which sets neither class nor `aria-invalid`.

- Angular, bound control without `autoInvalidOff`: bind the state from the control on the new markup. With `formControlName="start"` inside `[formGroup]="form"`, write `[class.is-danger]="form.get('start')?.touched && form.get('start')?.invalid"` and `[class.is-disabled]="form.get('start')?.disabled"` on the `ds-field`, and `[attr.aria-invalid]="form.get('start')?.touched && form.get('start')?.invalid ? 'true' : null"` on the input. Use the control reference that the template already has for `[formControl]`. For `ngModel`, add a template reference such as `#start="ngModel"` and use `start.touched && start.invalid`. Report every binding added.
- Angular, bound control with `autoInvalidOff`: add nothing. The `[invalid]` mapping above already covers the state the app set itself.
- `disabled` without a bound control: put `is-disabled` on the `ds-field` together with `disabled` on the input, bound the same way when `disabled` is bound.
- `readonly`: the legacy element greyed a read-only input out like a disabled one. The CSS field has no read-only state, and `is-disabled` would block pointer events. Write `readonly` only, and report the element.
- Angular needs `ReactiveFormsModule` for `formControlName` and `[formControl]`, and `FormsModule` for `ngModel`, in `imports: [...]`. The legacy element needed them too. When the component does not import the one it needs, add it and report it.

### Field

Rewrite a `bal-field` whose only control is this `bal-time-input` to the CSS field markup. The `bal-field` becomes the `<div class="ds-field">`, and `bal-field-control` becomes the `<div class="ds-control">`. A `bal-time-input` inside `bal-field-control` without a `bal-field` gets a new `ds-field` around it. A `bal-time-input` without either gets the whole structure.

| legacy part | new | handling |
| --- | --- | --- |
| text of `bal-field-label`, or of a `bal-label` inside it | `<label class="ds-label" for="<id>">` before the `ds-control` | Keep the text and any markup. Drop `htmlFor`. Without a field label and without `aria-label`, write no `<label>` and report that the input has no accessible name. |
| `required="false"` on `bal-field` or `bal-field-label` | _(nothing)_ | The legacy label showed a localized "(optional)" suffix for it. The CSS label has none. Report it. `required` on the field never reached the legacy native input, so do not copy it onto the input. |
| `size`, `weight` on `bal-field-label` | _(nothing)_ | Dropped. Report each one. |
| `invalid`, `disabled` on `bal-field` | the State classes and attributes | The legacy field passed them on to the control. Map them as if the `bal-time-input` carried them, unless it already does. |
| `readonly` on `bal-field` | `readonly` on the input | Same as `readonly` on the control. |
| `valid` on `bal-field` | `is-success` on the `ds-field` | A binding becomes `[class.is-success]="x"` in Angular and a conditional class in React. |
| one `bal-field-message` | `<p class="ds-help" id="<id>-help">` after the `ds-control`, and `aria-describedby="<id>-help"` on the input | Keep the text and the condition it was rendered under. `color="danger"` also sets `is-danger` on the `ds-field` and `aria-invalid="true"` on the input, under the same condition as the message. `color="success"` sets `is-success`, `color="warning"` sets `is-warning`. Without `color` add no state class. Drop `noReservedSpace`, `invalid`, `valid`, `disabled` and `readonly` on the message. |
| `bal-field-hint` | `ds-hint` as the last child of the `ds-control` | Follow the `bal-field-hint` row of `shared/field.md` for its props and imports. Report it for a visual check of the placement. |
| `horizontal`, `inverted`, `loading` on `bal-field`; `iconLeft`, `iconRight`, `expandedOnMobile` on `bal-field-control` | _(nothing)_ | Dropped. Report each one. |
| `bal-field` with another control next to the time input, or with more than one `bal-field-message` | _(no rewrite)_ | Leave the `bal-field` and the `bal-time-input` unchanged and report them. |

Delete `BalField`, `BalFieldLabel`, `BalFieldControl`, `BalFieldMessage` and `BalFieldHint` from the `@baloise/ds-react` and `@baloise/ds-angular` imports and from Angular `imports: [...]` when the file has no usage left. Remove a `...BalFieldBundle` spread once the template has no `bal-field*` tag left.

### Tags and imports

- **HTML**: `<bal-time-input ...></bal-time-input>` becomes the field markup above. The input is a void element, so the closing tag goes.
- **Angular**: the same rewrite in `.html` templates and in inline `template:` strings. Delete `BalTimeInput` from the `@baloise/ds-angular` import and from `imports: [...]` once the template has no `bal-time-input` left. Add no `Ds*` symbol, because the target is a native element. `formControlName`, `[formControl]` and `[(ngModel)]` stay on the input and keep working through Angular's `DefaultValueAccessor`, which also writes the value on every `input` event like the legacy accessor did on `balInput`. A multi-family bundle such as `BalFormBundle` stays. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- **React**: `<BalTimeInput ... />` becomes the field markup with `<input type="time" className="ds-time-input" />`. Delete `BalTimeInput` from the `@baloise/ds-react` import when the file has no usage left. Drop the whole import line when no binding is left. Add no import.

### Events

The new events are the native events of the input. The legacy `detail` is gone: the value is now `event.target.value`, and for focus, blur, click and key events the native event is the event itself.

| old | new | handling |
| --- | --- | --- |
| `balInput` | `input` | `addEventListener('balInput'` becomes `addEventListener('input'`, `(balInput)` becomes `(input)`, and React `onBalInput` becomes `onInput`. Rewrite the detail as below. |
| `balChange` | `change` | `addEventListener('change'` and `(change)` in Angular. React has no native `change` prop, so `onBalChange` becomes `onChange`, which React fires on every edit. Flag every handler with **"check behaviour"**: the legacy event fired once on blur when the value differed, the native `change` fires when the browser commits a new value, and React `onChange` fires on every edit. |
| `balFocus`, `balBlur` | `focus`, `blur` | Same shapes: `(focus)`, `(blur)`, `onFocus`, `onBlur`. The legacy detail was the native `FocusEvent`. |
| `balKeyPress` | `keypress` | Same shapes: `(keypress)`, `onKeyPress`. The legacy detail was the native `KeyboardEvent`. |
| `balClick` | `click` | Same shapes: `(click)`, `onClick`. Flag every handler with **"check behaviour"**: the legacy element declared `balClick` but never emitted it, so the handler never ran before and runs on every click now. |

Rewrite the detail access in each handler:

- Value events (`balInput`, `balChange`): in HTML, `event.detail` becomes `event.target.value`. In React, `e.detail` becomes `e.currentTarget.value`. In Angular, `$event.detail` in the template becomes the `value` of a template reference on the input, such as `#startTime` and `onChange(startTime.value)`. When the template passes `$event` to a class method that reads `event.detail`, pass the reference value instead and change the parameter type to `string`. The empty value is now `''` instead of `undefined`.
- Native event details (`balFocus`, `balBlur`, `balKeyPress`, `balClick`): `event.detail` becomes `event`, and `$event.detail` becomes `$event`.

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there. That is the Angular case where the template holds the tag and the class file handles the event or calls a method without ever naming `bal-time-input`.

The scan does not list a file that only listens or calls methods and never uses `bal-time-input` or `BalTimeInput`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

| old | new | handling |
| --- | --- | --- |
| `setFocus()` | `focus()` | `ref.setFocus()` becomes `ref.focus()`. It is synchronous now, so an `await` before it is dropped. |
| `getInputElement()` | the ref | The ref is the input now. `await ref.getInputElement()` becomes `ref`. |
| `setBlur()` (`@internal`) | `blur()` | `ref.setBlur()` becomes `ref.blur()`. |
| `configChanged()`, `setAriaForm()` (`@internal`) | _(none)_ | Drop any reference silently, without a mention in the report. |

### Types

The target is a native element, so there is no `Ds*` type. This file gives its own type rule, which wins over `SKILL.md` "Legacy types and bundles" for the event types:

- `BalEvents.BalTimeInputCustomEvent<T>`, the bare `BalTimeInputCustomEvent<T>` and the event aliases become the native event type of the new event: `Event` for `input` and `change`, `FocusEvent` for `focus` and `blur`, `KeyboardEvent` for `keypress` and `MouseEvent` for `click`. In React handlers use `React.FormEvent<HTMLInputElement>`, `React.ChangeEvent<HTMLInputElement>`, `React.FocusEvent<HTMLInputElement>`, `React.KeyboardEvent<HTMLInputElement>` and `React.MouseEvent<HTMLInputElement>`.
- A parameter that now receives the value from a template reference is typed `string`.
- A detail alias becomes its type written out: `BalEvents.BalTimeInputChangeDetail` and `BalEvents.BalTimeInputInputDetail` become `string`, the other four become the native event type above.
- `HTMLBalTimeInputElement` becomes `HTMLInputElement`, including `ElementRef<HTMLBalTimeInputElement>` and `useRef<HTMLBalTimeInputElement>`. An Angular `@ViewChild(BalTimeInput)` has no class left to query. Rewrite it to a template reference such as `@ViewChild('startTime') startTime?: ElementRef<HTMLInputElement>`. Then apply the Methods rules to the calls on the ref.
- `BalProps.*` stays unchanged and is reported.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found. `shared/field.md` does not apply, so no `F` items follow.

Needs your attention when found:

1. Every `bal-field` left unchanged with its `bal-time-input`, because it holds another control or more than one message.
2. Every input without a field label and without `aria-label`, which has no accessible name now.
3. Every Angular input bound with `formControlName`, `[formControl]` or `ngModel` that got state bindings from the control, and every `ReactiveFormsModule` or `FormsModule` added to `imports: [...]`.
4. Every React element whose `value` was kept with a handler or rewritten to `defaultValue`.
5. Every `balChange` handler, with its "check behaviour" note.
6. Every `balClick` handler, with its "check behaviour" note.
7. Every `debounce` and `autoInvalidOff`, with its Unmapped props and handlers outcome.
8. Every `readonly` input, which no longer looks greyed out.
9. Every `required="false"` on a `bal-field` or `bal-field-label` whose "(optional)" suffix is lost.
10. Every dropped field prop: `size` and `weight` on `bal-field-label`, `horizontal`, `inverted` and `loading` on `bal-field`, `iconLeft`, `iconRight` and `expandedOnMobile` on `bal-field-control`.
11. Every `bal-field-hint` moved to `ds-hint`, flagged for a visual check of the placement.
12. Every id bound in a loop or built without a static name.
13. Every `BalProps.*` type left in place and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes.
14. One-time note, when at least one time input was migrated: the legacy clock icon and the localized `HH:MM` placeholder are gone, the browser now shows its own picker and time format, and the empty value is now `''` instead of `undefined`.
15. One-time note: files which only listen or call methods, and have no scanned `.html` of the same name beside them, were not scanned.

Coverage only, written to the file:

16. Every `bal-time-input` rewritten to the field markup with `<input type="time" class="ds-time-input">`.
17. Every `bal-field` rewritten to `<div class="ds-field">`, and every message rewritten to `<p class="ds-help">`.
18. Every `balInput`, `balFocus`, `balBlur` and `balKeyPress` handler rewritten to its native event, with its detail access.
19. Every `setFocus()`, `getInputElement()` and `setBlur()` call rewritten.
20. Every legacy event type, detail alias and `HTMLBalTimeInputElement` rewritten to its native type.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
