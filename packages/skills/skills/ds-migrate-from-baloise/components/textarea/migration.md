# textarea

Migrate every `bal-textarea` usage to `ds-textarea`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child tags. `bal-textarea` is the only tag in this migration.

A surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is handled by `shared/field.md` in the Rewrite step, in the same pass. `components/field/migration.md` migrates `bal-form-grid` and `bal-form-col`.

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

| old (`bal-textarea`) | new (`ds-textarea`) | handling |
| --- | --- | --- |
| `name`, `invalid`, `autocapitalize`, `autocomplete`, `autofocus`, `debounce`, `placeholder`, `maxLength`, `minLength`, `disabled`, `readonly`, `cols`, `rows`, `wrap`, `inputmode`, `value`, `autoInvalidOff` | same | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. The `wrap` values (`hard`, `soft`, `off`) are the same. |
| `required` set | `required` | Copy as-is. |
| `required` omitted | `required` set to false | Follow the required default rule in `SKILL.md`. Report each file where this was added. |
| `clickable` | _(no equivalent prop)_ | Apply Unmapped props and handlers (`SKILL.md`). It has no effect after the migration. The click is now reported by the new `dsClick` event, so the consumer can replace the pattern, but do not do it yourself. |
| _(none)_ | `label`, `description`, `color`, `invalidText` | New props. Nothing to migrate from. Leave them unset. |
| The default of `autocapitalize` changed from `none` to `off`. Both are valid HTML values with the same effect, so copy a set value as-is and do not add one. |

### Slots

The legacy default slot was rendered as the text content of the native `<textarea>`. In `ds-textarea` the default slot holds the field and surrounding elements, and `value` is the source of the text. Do not move text between the tags into `value` yourself. Leave it in place and list each `bal-textarea` that has child content as "slot content needs manual rework".

`ds-textarea` adds an `invalid-text` slot. Nothing to migrate from. Leave it unset.

### Tags and imports

- **HTML**: `<bal-textarea>` becomes `<ds-textarea>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalTextarea` from `@baloise/ds-angular`, move only that symbol to `import { DsTextarea } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsTextarea` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working. `bal-textarea` has no own bundle. Only multi-family bundles such as `BalFormBundle` or `BalComponentBundle` hold it. They stay, and `DsTextarea` is added next to them, as `SKILL.md` "Legacy types and bundles" describes.
- **React**: `<BalTextarea>` becomes `<DsTextarea>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalTextarea` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

`ds-textarea` emits the same five events, and adds `dsClick`.

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Detail: `string \| null`, legacy `string \| undefined`. |
| `balInput` | `dsInput` | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms. Detail: `string \| null`. |
| `balBlur` | `dsBlur` | Same shapes. |
| `balFocus` | `dsFocus` | Same shapes. |
| `balKeyPress` | `dsKeyPress` | Same shapes. |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

When the value in `balChange` or `balInput` is read, note that it is `string | undefined` in legacy and `string | null` in `ds-textarea`. A cleared field now yields `null`. Do not edit the handler, report it.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalTextarea*` and the wrapper type `BalTextareaCustomEvent` become `DsTextareaCustomEvent`. Write a detail alias such as `BalEvents.BalTextareaChangeDetail` out as the new detail type, `string | null` for `dsChange` and `dsInput`. `HTMLBalTextareaElement` becomes `HTMLDsTextareaElement`. The scan lists the `BalEvents.*` and `Bal*CustomEvent` types. It lists the `HTMLBal*Element` types too. It does not list `BalProps.*`, so search for them yourself in each file with a finding.

### Methods

`setFocus()`, `setBlur()` and `getInputElement()` keep their names. `setAriaForm()` on `bal-textarea` was `@internal` and never part of the public API. Drop any reference silently, without a mention in the report.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `setAriaForm` calls and for `balChange`, `balInput`, `balBlur`, `balFocus`, and `balKeyPress`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every handler that needs manual rework.
2. Every piece of slot content that needs manual rework.
3. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalTextarea*` type left in place, each detail alias such as `BalEvents.BalTextareaChangeDetail` written out, and each multi-family bundle such as `BalFormBundle` or `BalComponentBundle` kept with `DsTextarea` added next to it.
4. Every unsupported `clickable`, with its Unmapped props and handlers outcome.
5. Every handler or form binding that reads the value. A cleared field now yields `null` where legacy yielded `undefined`. Code that checks `=== undefined` needs review.
6. One-time note: `ds-textarea` has `label`, `description` and `color`. Fields may need a `label` now. Do not add one yourself, and do not add attributes to compensate.
7. Every selector that targeted the legacy element and that the scan cannot see (classes starting with `bal-textarea` and the `bal-textarea-input` test id). Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Coverage only, written to the file:

8. Every `required` that was set to false.
9. Every event handler that was renamed.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
