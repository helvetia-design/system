# form

Migrate every `bal-form` usage to the native element it rendered: `<form>` when `native` is true, otherwise `<div>`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

`bal-form` is a light DOM wrapper. It renders one inner element around its children: a `<form>` when `native` is true, a `<div>` when it is false, which is the default. The inner element gets `formClass` as its `class`. Only the inner `<form>` gets `novalidate`, so `novalidate` without `native` had no effect. Helvetia has no form element, so the rewrite collapses the wrapper and its inner element into one native element. `.ds-form` is the form grid, which `components/field/migration.md` writes for `bal-form-grid`. It is not the target of `bal-form`.

`bal-form` is not `bal-form-grid` or `bal-form-col`. The scan does not list those, and `components/field/migration.md` migrates them. The legacy component has no child tags and no events.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-form.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan finds the tag and the `BalForm` binding. It does not list `BalFormBundle`, which is a multi-family bundle and stays. It lists the `HTMLBalFormElement` type too. It does not find calls of `scrollToFirstInvalidField()`. Search for them yourself in each file with a finding and in the same-basename `.ts` beside every `.html` finding.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-form` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props: `bal-form` → `<form>` or `<div>`

| old | new | handling |
| --- | --- | --- |
| `native` omitted or `false` | `<div>` | The legacy wrapper rendered a `<div>`, so write a `<div>`. Do not write a `<form>`, because a form changes how Enter and submit buttons behave, and in Angular it attaches the forms directives described below. |
| `native`, `native="true"`, `[native]="true"`, `native={true}` | `<form>` | Write a `<form>`. |
| bound `native` (`[native]="x"`, `native={x}`) | _(no target)_ | One native element cannot switch between `<form>` and `<div>`. Leave the `bal-form` unchanged and report it. |
| `formClass` | `class` (`className` in React) | Merge it with a `class` that the `bal-form` already carries, so the new element has one `class`. A bound `[formClass]="x"` becomes `[class]="x"` in Angular, which keeps a static `class` on the same element. A bound `formClass={x}` becomes `className={x}` in React, joined with a static class in a template literal. |
| `novalidate` on a `<form>` result | `novalidate` (`noValidate` in React) | A literal true becomes the static attribute: `novalidate` in HTML and Angular, `noValidate` in React. Angular has no `novalidate` DOM property, so `[novalidate]="true"` also becomes the static `novalidate`, and a bound `[novalidate]="x"` becomes `[attr.novalidate]="x ? '' : null"`. React `noValidate={x}` stays bound. A literal false is dropped. |
| `novalidate` on a `<div>` result | _(nothing)_ | It had no effect on the legacy `<div>`. Drop it in every form, also a binding, because Angular fails with NG8002 on `[novalidate]` on a `<div>`. Report each one. |
| `id`, `style`, `data-*`, `#ref`, `[formGroup]`, `(ngSubmit)`, `(submit)` and every other attribute or directive | same, on the new element | Keep them on the new element. `[formGroup]` and `(ngSubmit)` worked on the `bal-form` host because a `submit` event from the inner form bubbled up, and they work the same way on the new element. |

### Angular form directives

`FormsModule` and `ReactiveFormsModule` both import Angular's `ɵNgNoValidate` directive. It adds `novalidate` to every `<form>` that has neither `ngNoForm` nor `ngNativeValidate`. `FormsModule` also attaches `NgForm` to every `<form>` without `[formGroup]` or `ngNoForm`, and `NgForm` cancels the native submit. The legacy inner `<form>` was rendered by Stencil, so none of these directives touched it.

- A `<form>` result whose `bal-form` had no `novalidate` in a component that imports `FormsModule` or `ReactiveFormsModule`: add `ngNativeValidate`, so native validation still runs. Report each one.
- A `<form>` result without `[formGroup]` in a component that imports `FormsModule`: report it, because a submit no longer reloads the page or posts to `action`.
- A `<div>` result is never touched by these directives.

### Tags and imports

- **HTML**: `<bal-form>` becomes `<form>` or `<div>`, including the closing tag.
- **Angular**: the same rewrite in `.html` templates and in inline `template:` strings. Delete `BalForm` from the `@baloise/ds-angular` import and from `imports: [...]` once the template has no `bal-form` left. Add no `Ds*` symbol, because the target is a native element. A multi-family bundle such as `BalFormBundle` or `BalComponentBundle` stays. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- **React**: `<BalForm>`/`</BalForm>` becomes `<form>`/`</form>` or `<div>`/`</div>`. Delete `BalForm` from the `@baloise/ds-react` import when the file has no usage left. Drop the whole import line when no binding is left. Add no import.

### Methods

| old | new | handling |
| --- | --- | --- |
| `scrollToFirstInvalidField()` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). Neither `@helvetia-design/core` nor `@helvetia-design/angular` has a replacement. In the report, say that the consumer scrolls to the first element with `aria-invalid="true"` or `:invalid` in the form instead. |

`@baloise/ds-core` also exports a standalone function `scrollToFirstInvalidField(options)`. It is not a method of this component. Leave each import and call of it unchanged and report it, because it keeps the legacy dependency.

### Types

The new element is native, so it has no event type. `bal-form` has no events, so there is no `BalEvents.BalForm*` or `BalFormCustomEvent` type. Every `HTMLBalFormElement` becomes `HTMLFormElement` when the result is a `<form>` and `HTMLDivElement` when it is a `<div>`, including `ElementRef<HTMLBalFormElement>`. An Angular `@ViewChild(BalForm)` that queries by the class has no class left to query. Rewrite it to a template reference, such as `@ViewChild('form') form?: ElementRef<HTMLFormElement>`, and add `#form` to the element when it has no reference yet. Then apply the Methods rules to the calls on the ref.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there. That is the Angular case where the template holds the tag and the class file holds the ref and calls `scrollToFirstInvalidField()` without ever naming `bal-form`.

The scan does not list a file that only calls `scrollToFirstInvalidField()` and never uses `bal-form` or `BalForm`, and that has no scanned `.html` of the same name beside it. Say so in the report.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `bal-form` with a bound `native`, left unchanged.
2. Every `scrollToFirstInvalidField()` call, with its Unmapped props and handlers outcome and the note that the consumer scrolls to the first invalid field by hand.
3. Every import or call of the standalone `scrollToFirstInvalidField` function from `@baloise/ds-core`, left unchanged because it keeps the legacy dependency.
4. Every `novalidate` dropped from a `<div>` result, because it had no effect.
5. Every `<form>` result that got `ngNativeValidate`.
6. Every `<form>` result without `[formGroup]` in an Angular component that imports `FormsModule`, where `NgForm` now cancels the native submit.
7. Every `@ViewChild(BalForm)` rewritten to a template reference.
8. Every legacy type left and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalFormBundle` and other multi-family bundle kept.
9. One-time note: files that only call `scrollToFirstInvalidField()`, and have no scanned `.html` of the same name beside them, were not scanned.

Coverage only, written to the file:

10. Every `bal-form` rewritten to `<form>`.
11. Every `bal-form` rewritten to `<div>`.
12. Every `formClass` merged into `class`.
13. Every `HTMLBalFormElement` retyped to `HTMLFormElement` or `HTMLDivElement`.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
