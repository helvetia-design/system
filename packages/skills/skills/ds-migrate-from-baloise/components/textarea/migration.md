# textarea

Migrate every `bal-textarea` usage to `ds-textarea`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child tags. `bal-textarea` is the only tag in this migration.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-textarea.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-textarea` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props of `bal-textarea` → `ds-textarea`

| old (`bal-textarea`)                                                                                                                                                                                          | new (`ds-textarea`)                            | handling                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `invalid`, `autocapitalize`, `autocomplete`, `autofocus`, `debounce`, `placeholder`, `maxLength`, `minLength`, `disabled`, `readonly`, `cols`, `rows`, `wrap`, `inputmode`, `value`, `autoInvalidOff` | same                                           | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. The `wrap` values (`hard`, `soft`, `off`) are the same.                                                                            |
| `required` set                                                                                                                                                                                                | `required`                                     | Copy as-is.                                                                                                                                                                                                                                                                                                                 |
| `required` omitted                                                                                                                                                                                            | `required` set to false                        | The default flipped. `bal-textarea` was optional, `ds-textarea` is required. Add `required="false"` (HTML), `[required]="false"` (Angular), or `required={false}` (React) so the field stays optional. Report each file where this was added.                                                                               |
| `clickable`                                                                                                                                                                                                   | _(no equivalent prop)_                         | Leave the attribute in place, do not drop it. It has no effect after the migration, and in strictly typed React or Angular templates it may not compile. The click is now reported by the new `dsClick` event, so the consumer can replace the pattern, but do not do it yourself. Flag every occurrence for manual review. |
| _(none)_                                                                                                                                                                                                      | `label`, `description`, `color`, `invalidText` | New props. Nothing to migrate from. Leave them unset.                                                                                                                                                                                                                                                                       |

The default of `autocapitalize` changed from `none` to `off`. Both are valid HTML values with the same effect, so copy a set value as-is and do not add one.

### Slots

The legacy default slot was rendered as the text content of the native `<textarea>`. In `ds-textarea` the default slot holds the field and surrounding elements, and `value` is the source of the text. Do not move text between the tags into `value` yourself. Leave it in place and list each `bal-textarea` that has child content as "slot content needs manual rework".

`ds-textarea` adds an `invalid-text` slot. Nothing to migrate from. Leave it unset.

### Tags and imports

- **HTML**: `<bal-textarea>` becomes `<ds-textarea>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalTextarea` from `@baloise/ds-angular`, move only that symbol to `import { DsTextarea } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsTextarea` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working.
- **React**: `<BalTextarea>` becomes `<DsTextarea>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalTextarea` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

`ds-textarea` emits the same five events, and adds `dsClick`.

| old           | new          | handling                                                                                                                                                            |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`   | `dsChange`   | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| `balInput`    | `dsInput`    | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms.                                                                   |
| `balBlur`     | `dsBlur`     | Same shapes.                                                                                                                                                        |
| `balFocus`    | `dsFocus`    | Same shapes.                                                                                                                                                        |
| `balKeyPress` | `dsKeyPress` | Same shapes.                                                                                                                                                        |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

When the value in `balChange` or `balInput` is read, note that it is `string | undefined` in legacy and `string | null` in `ds-textarea`. A cleared field now yields `null`. Do not edit the handler, report it.

The detail types `BalEvents.BalTextarea*Detail` and the wrapper type `BalTextareaCustomEvent` are not rewritten. List each use as "type needs manual rework".

### Methods

`setFocus()`, `setBlur()` and `getInputElement()` keep their names. `setAriaForm()` on `bal-textarea` was `@internal` and never part of the public API. Drop any reference silently, without a summary mention.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `setAriaForm` calls and for `balChange`, `balInput`, `balBlur`, `balFocus`, and `balKeyPress`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Print a per-file summary of what changed, including every `required` that was set to false, every event handler that was renamed, and every handler, slot content, type, and unsupported prop (`clickable`) that needs manual rework.

Report this logic change the scan cannot see, so the consumer can check it:

- **Empty value**: a cleared field now yields `null` where legacy yielded `undefined`. Code that checks `=== undefined` needs review. List each handler or form binding that reads the value.

Also report the rendering difference, so the consumer can check it. Do not add attributes to compensate:

- `ds-textarea` has `label`, `description`, and `color`. Fields may need a `label` now. Do not add one yourself.

Also list every selector that targeted the legacy element and that the scan cannot see (classes starting with `bal-textarea` and the `bal-textarea-input` test id). Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
