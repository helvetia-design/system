# label

Migrate every `bal-label` usage to `ds-label`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one element and no child tags. `bal-field`, `bal-field-label` and `bal-data-label` are different components and are not part of this migration.

`ds-label` renders in shadow DOM and behaves differently by default. `bal-label` was single-line (`white-space: pre`) and only wrapped with `multiline`. `ds-label` wraps by default and `noWrap` truncates with an ellipsis. It is also `display: block` where `bal-label` was inline. No markup change is needed for this. Mention it once in the report.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-label.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-label` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-label`)    | new (`ds-label`)       | handling                                                                                                                                                                                                                            |
| -------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `htmlFor`            | `htmlFor`              | Copy as-is, including bindings.                                                                                                                                                                                                     |
| `htmlId`             | `htmlId`               | Copy as-is, including bindings.                                                                                                                                                                                                     |
| `required`           | `required`             | Copy as-is, including `required="false"` and `required={false}`. The default is still `true`.                                                                                                                                       |
| `noWrap`             | `noWrap`               | Copy as-is, including bindings.                                                                                                                                                                                                     |
| `valid`, `invalid`   | `valid`, `invalid`     | Copy as-is, including bindings.                                                                                                                                                                                                     |
| `disabled`           | `disabled`             | Copy as-is, including bindings.                                                                                                                                                                                                     |
| `readonly`           | `disabled`             | `bal-label` styled `readonly` like `disabled`. Rename to `disabled`, keeping the value or binding. When `disabled` is already on the same element, drop `readonly`. List every rename for the summary.                              |
| `multiline`          | _(now the default)_    | Drop the attribute, since `ds-label` wraps by default. When the value is a binding (`[multiline]`, `multiline={x}`), drop it too and flag the occurrence, because a binding that resolved to `false` now wraps.                     |
| `size="small"`       | `size="sm"`            | Rewrite static values: `small` to `sm`, `large` to `lg`, `x-large` to `xl`, `xx-large` to `2xl`, `xxx-large` to `3xl`. Drop `size=""`. Leave bindings (`[size]`, `size={x}`) unchanged and flag them, the value set is different.   |
| `weight`             | _(no equivalent prop)_ | Leave the attribute in place, do not drop it. `ds-label` has no weight, so `weight="regular"` has no effect after the migration. In strictly typed React or Angular templates it may not compile. Flag every occurrence for review. |
| `hovered`, `pressed` | _(internal)_           | Were `@internal`, not a consumer API. Leave them in place and flag them.                                                                                                                                                            |

### Tags and imports

- **HTML**: `<bal-label>` becomes `<ds-label>`, including the closing tag.
- **Angular**: `<bal-label>` becomes `<ds-label>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalLabel` from `@baloise/ds-angular`, move only that symbol to `import { DsLabel } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well.
- **React**: `<BalLabel>` becomes `<DsLabel>` and `</BalLabel>` becomes `</DsLabel>`. Import `DsLabel` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalLabel` to `import { DsLabel } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

Neither `bal-label` nor `ds-label` has a public event. Nothing to rewrite.

### Methods

`setAriaForm()` and `configChanged()` were `@internal` and are not a consumer API. `ds-label` has no `setAriaForm()`.

### Lost linking inside `bal-field`

A `bal-label` inside `bal-field` got its `for` and `id` from the field. `ds-label` is not linked by a parent, so it needs an explicit `htmlFor` that matches the control's `id`. Do not add it: the scan cannot see the control. For every migrated label without `htmlFor`, list it in the summary.

## 4. Report

Print a per-file summary of what changed. End with the items below, each with file and line:

- every `readonly` renamed to `disabled`
- every `multiline` binding that was dropped
- every dynamic `size` binding left unchanged
- every `weight`, `hovered` and `pressed` left for manual review
- every migrated label without `htmlFor`, which may have been linked by `bal-field`

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
