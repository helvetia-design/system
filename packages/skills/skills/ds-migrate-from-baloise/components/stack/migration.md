# stack

Migrate every `bal-stack` usage to `ds-stack`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-stack` only. Both components render the default slot.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-stack.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan finds the tag and the `BalStack` binding. It does not find type references such as `BalProps.BalStackLayout`. Those types have no `ds-*` equivalent and are not rewritten.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-stack` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Direction

The default changed. `bal-stack` lays out as a row when it has no `layout` and no `direction`. `ds-stack` lays out as a column. `layout` is gone and `direction` replaces it with different values.

| old (`bal-stack`)                                                                                                         | new (`ds-stack`)             | handling                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(neither `layout` nor `direction`)_, `layout=""`                                                                         | `direction="row"`            | Add it, so the layout does not flip to a column. Skip it when a dynamic `layout` or `direction` binding is on the element, and list that usage for review.     |
| `layout="horizontal"`                                                                                                     | `direction="row"`            | Rename the attribute and the value. Also handle the single-quoted and `{"…"}` / `{'…'}` forms.                                                                 |
| `layout="vertical"`                                                                                                       | `direction="column"`         | Same.                                                                                                                                                          |
| `layout="horizontal-reverse"`                                                                                             | `direction="row-reverse"`    | Same.                                                                                                                                                          |
| `layout="vertical-reverse"`                                                                                               | `direction="column-reverse"` | Same.                                                                                                                                                          |
| `direction="row"` / `"column"` (deprecated)                                                                               | same                         | Copy as-is. Both values are valid on `ds-stack`.                                                                                                               |
| `[layout]="x"`, `[attr.layout]="x"`, `layout={x}`, `:layout="x"`, `v-bind:layout="x"`, and the same forms for `direction` | _(none)_                     | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line for manual review. The element also gets no added `direction`. |

### Sizes

`space`, `space-row` (React / Angular: `spaceRow`), `space-column` (`spaceColumn`), `px` and `py` keep their names. The values changed to short names.

| old value      | new value                                          |
| -------------- | -------------------------------------------------- |
| `xx-small`     | `2xs`                                              |
| `x-small`      | `xs`                                               |
| `small`        | `sm`                                               |
| `normal`       | `base`                                             |
| `medium`       | `md`                                               |
| `large`        | `lg`                                               |
| `x-large`      | `xl`                                               |
| `xx-large`     | `2xl`                                              |
| `auto`, `none` | same (`auto` is valid for the `space*` props only) |

Rewrite static values only, in every quoting form. Map `xx-large` to `2xl` and `xx-small` to `2xs` yourself. `ds-stack` does map the old names at runtime with a deprecation warning, but rewriting them avoids the warning.

Dynamic bindings (`[space]="x"`, `space={x}`, `:space="x"`, and the same for the other props) stay unchanged and are listed for manual review.

`space-column` needs extra care. In `bal-stack` it is a legacy bug: the prop sets the row gap, the same as `space-row`. `ds-stack` applies a real column gap. Rename the value as above, keep the attribute, and list every `space-column` usage, static or dynamic, so the consumer can check the spacing.

### Other props

`align`, `fit-content` (`fitContent`) and `use-wrap` (`useWrap`) are copied as-is. The internal `alignment` prop is also copied. `ds-stack` adds a `p` prop for padding on all sides. It has no legacy equivalent, so nothing is added.

### Tags and imports

- **HTML**: `<bal-stack>` becomes `<ds-stack>`, including the closing tag.
- **Angular**: `<bal-stack>` becomes `<ds-stack>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalStack` from `@baloise/ds-angular`, move only `BalStack` to `import { DsStack } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalStack` with `DsStack` in `imports:` lists too.
- **React**: `<BalStack>` becomes `<DsStack>` and `</BalStack>` becomes `</DsStack>`. Import `DsStack` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalStack` to `import { DsStack } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

There are no event changes. Neither `bal-stack` nor `ds-stack` emits a custom event.

### Methods

Neither component has a public method a consumer calls. There is no sibling-file rule for this component.

## 4. Report

Print a per-file summary of what changed, including every `direction="row"` that was added, every dynamic `layout`, `direction`, `space*`, `px` or `py` binding left for manual review.

List every `space-column` usage too, static ones included. Legacy `bal-stack` applied it as a row gap, `ds-stack` applies a column gap, so the spacing can change.

Also list each loss: every type reference such as `BalProps.BalStackLayout` that the scan cannot see.

When at least one stack was migrated, add one line, not one per usage: the scan cannot see `.bal-stack` and `.bal-stack--*` selectors, and they do not carry over to `ds-stack`, which renders in shadow DOM.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
