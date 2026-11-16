# field → form

Migrate every `bal-form-grid` usage to `<div class="ds-form">` and every `bal-form-col` usage to `<div class="ds-form-col">`. Remove every `bal-field` wrapper that is left around a `ds-*` control. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Every `ds-*` form control renders its own field: label, description, invalid text and the `start` and `end` slots. A `ds-*` control inside `bal-field` therefore renders a second field. The component migrations (`input`, `textarea`, `number-input`, `select`, `dropdown`, `date`, `checkbox`, `radio`, `segment`, `input-slider`, `input-stepper`, `file-upload`) apply `shared/field.md` in the same pass as the control, so no run leaves a `ds-*` control inside `bal-field`. The `time-input` migration rewrites the `bal-field` around its native input to the CSS field markup itself. Run this migration after them. Running it first only converts the grid, and every `bal-field` around a legacy `bal-*` control stays unchanged.

The legacy folder has the child tags `bal-field-label`, `bal-field-control`, `bal-field-message`, `bal-field-hint`, `bal-form-grid` and `bal-form-col`. The scan also lists the Angular `bal-ng-error`, which `shared/field.md` moves into the `invalid-text` slot of its control. `bal-form`, the form element wrapper, is a different component and is not part of this migration. The scan does not list it.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-field.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`. An `invalidateOn` finding is the `forms` key of the legacy config call. Read it for the `bal-ng-error` rule in `shared/field.md` and do not rewrite it.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, or every finding is an `invalidateOn` line, say there are no `bal-field`, `bal-form-grid` or `bal-ng-error` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Grid and columns

`bal-form-grid` has no props. `bal-form-col` has one prop, `size`. Legacy rendered `touch:is-12` plus `is-N`, and `touch` means below the desktop breakpoint in both systems. A column therefore stacks to full width below desktop and takes its legacy width from desktop up.

| old | new |
| --- | --- |
| `bal-form-grid` | `<div class="ds-form">` |
| `bal-form-col`, `size` omitted, `full`, `fullwidth` | `<div class="ds-form-col">` |
| `size="half"` | `<div class="ds-form-col desktop:is-6">` |
| `size="one-third"` | `<div class="ds-form-col desktop:is-4">` |
| `size="two-thirds"` | `<div class="ds-form-col desktop:is-8">` |
| `size="one-quarter"` | `<div class="ds-form-col desktop:is-3">` |
| `size="three-quarters"` | `<div class="ds-form-col desktop:is-9">` |

- Use `className` in React and `class` in Angular and HTML. Keep any `class` or `className` the element already has and add the new classes to it.
- Rename the closing tags too.
- A dynamic `size` (`[size]`, `:size`, `size={x}`) is not mapped. Leave that `bal-form-col` in place and report it.
- In React, `BalFormGrid` and `BalFormCol` become the `div` elements above. Delete the symbols from the `@baloise/ds-react` import when the file has no usage left. In Angular, delete `BalFormGrid` and `BalFormCol` from the `@baloise/ds-angular` import and from `imports: [...]`.
- `BalFieldBundle` and `BalFormGridBundle` have no `Ds*` symbols. Remove a `...BalFieldBundle` or `...BalFormGridBundle` spread, and the bundle from the `@baloise/ds-angular` import, once no tag of that bundle is left in the template. Keep it while a `bal-field` or a `bal-form-col` stays in place. A multi-family bundle such as `BalFormBundle` stays. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- The `ds-form` and `ds-form-col` classes come from `@helvetia-design/styles`, which Init has already imported.

### Fields

Apply every rule in `shared/field.md` to each remaining `bal-field`. That file covers the label, message, `required`, hints, icons, props without a target, a `bal-field` that stays in place and a `bal-field-message` that sits next to a control outside any `bal-field`. In this run, that last rule applies to every `bal-field-message` that directly follows a `ds-*` control and is not inside a `bal-field`. Apply the `bal-ng-error` row of `shared/field.md` to every `bal-ng-error` finding whose target is a `ds-*` control, also outside a `bal-field`.

### Types

`ds-form` and `ds-form-col` are CSS classes, so they have no event or element types. A handler typed `BalEvents.BalField*` or `BalFieldCustomEvent` has no target type, and neither has a ref typed `HTMLBalField*Element` or `HTMLBalFormGridElement` or `HTMLBalFormColElement`. Leave them in place and report them. The scan lists the `BalEvents.*` and `Bal*CustomEvent` types. It lists the `HTMLBal*Element` types too. It does not list `BalProps.*`, so search for them yourself in each file with a finding.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found. The `F1.`, `F2.`, ... items from the Report section of `shared/field.md` follow them.

Needs your attention when found:

1. Every `bal-form-col` with a dynamic `size` left in place.
2. Every legacy type left in place and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalEvents.BalField*`, `BalFieldCustomEvent`, `HTMLBalField*Element` or `HTMLBalFormGridElement` or `HTMLBalFormColElement` type, which has no target, and each `BalFieldBundle`, `BalFormGridBundle` or multi-family bundle kept.

Coverage only, written to the file:

3. Every `bal-form-grid` rewritten to `<div class="ds-form">`.
4. Every `bal-form-col` rewritten to `<div class="ds-form-col">`, with its `desktop:is-N` class.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
