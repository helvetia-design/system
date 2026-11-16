# input-slider

Migrate every `bal-input-slider` usage to `ds-slider`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no consumer child tags. `bal-input` and `bal-input-stepper` are different components and are not part of this migration. The scan does not list them. The surrounding `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` wrapper is handled by `shared/field.md` in the Rewrite step, in the same pass.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-input-slider.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-input-slider` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-input-slider`) | new (`ds-slider`) | handling |
| --- | --- | --- |
| `name`, `invalid`, `min`, `max`, `debounce`, `disabled`, `readonly`, `value`, `autoInvalidOff` | same | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). Keep form bindings such as `[(ngModel)]`, `formControlName`, and `[formControl]` unchanged. |
| `required` set | `required` | Copy as-is. `ds-slider` `required` only drives the "(optional)" suffix of its `label`, so the migration does not add `required="false"`. `ds-slider` is excluded from the required default rule in `SKILL.md`. Inside a `bal-field` with a label, `shared/field.md` decides it. |
| `step` omitted or `0` | `step="any"` | The meaning of `0` was "no steps", which is continuous. `ds-slider` defaults to `'1'`, so an omitted `step` would silently snap to whole numbers. Replace `0` with `any`, or add `step="any"` when it was omitted. Report each file where this was added. |
| `step` with a numeric literal | `step` as a string | `step` is a string on `ds-slider`. `step="5"` stays. Angular `[step]="5"` becomes `step="5"`, React `step={5}` becomes `step="5"`, otherwise strictly typed templates no longer compile. |
| `step` bound to an expression | `step` | `step` is now a string. HTML: copy the binding unchanged and flag it for manual review. React and Angular: copy it when the expression's type only admits strings. Otherwise apply Unmapped props and handlers (`SKILL.md`). The report says that the value must now be a string, or `"any"` where the legacy value was `0`. |
| `balTabindex` | `tabindex` | `ds-slider` takes a native `tabindex` from the host. HTML `balTabindex="1"` becomes `tabindex="1"`, Angular `[balTabindex]="x"` becomes `[attr.tabindex]="x"`, React `balTabindex={1}` becomes `tabIndex={1}`. |
| `hasTicks` | _(no equivalent prop)_ | Apply Unmapped props and handlers (`SKILL.md`). It has no effect after the migration. |
| _(none)_ | `label`, `description`, `color`, `brandColor`, `invalidText` | New props. Nothing to migrate from. Leave them unset. |

### Tags and imports

- **HTML**: `<bal-input-slider>` becomes `<ds-slider>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalInputSlider` from `@baloise/ds-angular`, move only that symbol to `import { DsSlider } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well. `DsSlider` brings its own `ControlValueAccessor`, so `ngModel` and reactive forms keep working. `bal-input-slider` has no own bundle. Only multi-family bundles such as `BalFormBundle` or `BalComponentBundle` hold it. They stay, and `DsSlider` is added next to them, as `SKILL.md` "Legacy types and bundles" describes.
- **React**: `<BalInputSlider>` becomes `<DsSlider>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalInputSlider` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Detail: `number`, legacy `string \| number \| null`. |
| `balInput` | `dsInput` | Same shapes: `(balInput)`, `onBalInput`, and `addEventListener('balInput'` become the `ds` forms. Detail: `number`. |
| `balBlur` | `dsBlur` | Same shapes. |
| `balFocus` | `dsFocus` | Same shapes. |
| `balKeyPress` | _(none)_ | No equivalent. Apply Unmapped props and handlers (`SKILL.md`). |

`ds-slider` adds `dsClick`. There is nothing to migrate from.

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balInput`, `balBlur`, and `balFocus` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalInputSlider*` and `BalInputSliderCustomEvent` become `DsSliderCustomEvent`, because the type follows the new tag `ds-slider`. Write a detail alias such as `BalEvents.BalInputSliderChangeDetail` out as the new detail type, `number` for `dsChange` and `dsInput`. `HTMLBalInputSliderElement` becomes `HTMLDsSliderElement`. The scan lists the `BalEvents.*` and `Bal*CustomEvent` types. It lists the `HTMLBal*Element` types too. It does not list `BalProps.*`, so search for them yourself in each file with a finding.

When the value in `balChange` or `balInput` is read, note that it was `string | number | null` in legacy and is always a `number` in `ds-slider`. Do not edit the handler, report it.

### Methods

`setFocus()` keeps its name. `getInputElement()` keeps its name too, but it now resolves the noUiSlider handle (`HTMLElement`) instead of an `HTMLInputElement`. Do not rewrite calls to it. List each call by file and line as "return type changed, check the caller". `setAriaForm()` does not exist on `ds-slider`. Apply Unmapped props and handlers (`SKILL.md`).

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls these methods through `@ViewChild` or `viewChild` without naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `getInputElement` and `setAriaForm` calls and for `balChange`, `balInput`, and `balKeyPress`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every unsupported `hasTicks`, with its Unmapped props and handlers outcome.
2. Every `balKeyPress` handler, with its Unmapped props and handlers outcome.
3. Every dynamic `step` binding, with the framework outcome (copied in HTML, copied or removed (Unmapped) in React and Angular). The value must now be a string, or `"any"`.
4. Every `getInputElement()` call, listed as "return type changed, check the caller".
5. Every `setAriaForm()` call, with its Unmapped props and handlers outcome.
6. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalInputSlider*` type left in place, each detail alias such as `BalEvents.BalInputSliderChangeDetail` written out, and each multi-family bundle such as `BalFormBundle` or `BalComponentBundle` kept with `DsSlider` added next to it.
7. Every static or bound value that can be empty. A slider can never be empty, so a legacy `value=""`, `null` or `undefined` now resolves to `min`.
8. One-time note: handlers and form controls now receive a `number`, never a string or `null`.
9. Every selector that targets the legacy element and that the scan cannot see, such as classes starting with `bal-input-slider` and `data-testid="bal-input-slider"`. Tests and styles that query them break. Do not rewrite those selectors yourself. Report them.

Coverage only, written to the file:

10. Every `step="any"` that was added or substituted.
11. Every `step` literal turned into a string.
12. Every `balTabindex` that was renamed.
13. Every event handler that was renamed.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
