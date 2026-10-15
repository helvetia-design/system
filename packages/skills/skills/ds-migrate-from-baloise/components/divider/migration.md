# divider

Migrate every `bal-divider` usage to `ds-divider`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-divider` only.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-divider.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan finds the tag and the `BalDivider` binding. It does not find type references such as `BalDividerLayout` or `BalProps.BalDividerColor`. Those have no `ds-*` equivalent and are not rewritten.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-divider` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-divider`)                                                                                                                              | new (`ds-divider`)      | handling                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout="horizontal"` / `layout="vertical"`                                                                                                      | same                    | Copy as-is.                                                                                                                                                                                                             |
| `layout=""`                                                                                                                                      | omit `layout`           | Drop `layout`. The default is `horizontal`.                                                                                                                                                                             |
| `space="none"`                                                                                                                                   | same                    | Copy as-is.                                                                                                                                                                                                             |
| `space="xx-small"`                                                                                                                               | `space="2xs"`           | Rewrite to the short value. Also rewrite the single-quoted and `{"…"}` / `{'…'}` forms.                                                                                                                                 |
| `space="x-small"`                                                                                                                                | `space="xs"`            | Same handling.                                                                                                                                                                                                          |
| `space="small"`                                                                                                                                  | `space="sm"`            | Same handling.                                                                                                                                                                                                          |
| `space="normal"`                                                                                                                                 | `space="base"`          | Same handling.                                                                                                                                                                                                          |
| `space="medium"`                                                                                                                                 | `space="md"`            | Same handling.                                                                                                                                                                                                          |
| `space="large"`                                                                                                                                  | `space="lg"`            | Same handling.                                                                                                                                                                                                          |
| `space="x-large"`                                                                                                                                | `space="xl"`            | Same handling.                                                                                                                                                                                                          |
| `space="xx-large"`                                                                                                                               | `space="2xl"`           | Same handling.                                                                                                                                                                                                          |
| `space="xxx-large"`                                                                                                                              | `space="3xl"`           | Same handling.                                                                                                                                                                                                          |
| `space=""`                                                                                                                                       | omit `space`            | Drop `space`. The default is `none`.                                                                                                                                                                                    |
| `[space]="x"`, `[attr.space]="x"`, `space={x}`                                                                                                   | `space`                 | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary for manual review: the new values are `none`, `2xs`, `xs`, `sm`, `base`, `md`, `lg`, `xl`, `2xl`, `3xl`. |
| `color="grey"`                                                                                                                                   | omit `color`            | Drop `color`. The default `default` already matches. Also drop the single-quoted and `{"grey"}` / `{'grey'}` forms.                                                                                                     |
| `color="primary"`                                                                                                                                | `color="primary"`       | Copy as-is.                                                                                                                                                                                                             |
| `color="white"`                                                                                                                                  | `color="inverted"`      | Rewrite to `inverted`. Also rewrite the single-quoted and `{"white"}` / `{'white'}` forms.                                                                                                                              |
| `color="primary-light"`, `primary-dark`, `grey-light`, `grey-dark`, `warning`, `success`, `danger`, `danger-dark`, `danger-darker`, `light-blue` | _(no equivalent value)_ | Drop `color`. The divider renders in the default color. Do not pick a near match. Record the file, line, and the old value for the summary.                                                                             |
| `[color]="x"`, `[attr.color]="x"`, `color={x}`                                                                                                   | `color`                 | Dynamic value. Leave the binding unchanged and list the file and line for manual review: the new values are `primary`, `secondary`, `default`, `inverted`.                                                              |
| `borderStyle="dashed"`                                                                                                                           | `dashed`                | HTML and Angular: write `dashed="true"`. React: write `dashed`. Also rewrite the single-quoted and `{"dashed"}` / `{'dashed'}` forms.                                                                                   |
| `borderStyle="solid"`, `borderStyle=""`                                                                                                          | omit `dashed`           | Drop `borderStyle`. The default is `dashed=false`.                                                                                                                                                                      |
| `[borderStyle]="x"`, `[attr.borderStyle]="x"`, `borderStyle={x}`                                                                                 | `dashed`                | Dynamic value. Do not generate a comparison expression. Leave the binding unchanged and list the file and line for manual review: `dashed` is a boolean.                                                                |

### Tags and imports

- **HTML**: `<bal-divider>` becomes `<ds-divider>`, including the closing tag.
- **Angular**: `<bal-divider>` becomes `<ds-divider>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalDivider` from `@baloise/ds-angular`, move only `BalDivider` to `import { DsDivider } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalDivider` with `DsDivider` in `imports:` lists too.
- **React**: `<BalDivider>` becomes `<DsDivider>` and `</BalDivider>` becomes `</DsDivider>`. Import `DsDivider` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalDivider` to `import { DsDivider } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

There are no event changes. Neither `bal-divider` nor `ds-divider` emits a custom event.

### Methods

Neither component has a public method a consumer calls. There is no sibling-file rule for this component.

### Children

`bal-divider` rendered its slotted children. `ds-divider` has no slot, so children are no longer displayed. Still rewrite the tag. When the element has non-empty children, leave them in place and list the file and line for the summary so the consumer can move the content beside the divider. Do not move it yourself.

## 4. Report

Print a per-file summary of what changed, including every `space` and `color` value rewritten, every `borderStyle` rewritten to `dashed`, and every dynamic `space`, `color`, or `borderStyle` binding left for manual review.

Also list each loss:

- every `color` value with no `ds-divider` equivalent, with its file, line, and old value, now rendered in the default color
- every divider that had children, which are no longer displayed
- every type reference such as `BalDividerLayout` that the scan cannot see

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
