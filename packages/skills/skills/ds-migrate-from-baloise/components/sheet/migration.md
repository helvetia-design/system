# sheet

Migrate every `bal-sheet` usage to `ds-sheet`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-sheet` only. Both components render the default slot.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-sheet.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan finds the tag and the `BalSheet` binding. It does not find type references such as `BalProps.BalSheetContainer`. That type has no `ds-*` equivalent and is not rewritten.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-sheet` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-sheet`)                                                                                                           | new (`ds-sheet`)  | handling                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `container-size="fluid"` / `"compact"` (React / Angular: `containerSize`)                                                   | same              | Copy as-is. Also keep the single-quoted and `{"…"}` / `{'…'}` forms.                                                                                                                                            |
| _(no `container-size`)_, `container-size=""`                                                                                | same              | Copy as-is. Both components use the default width, so nothing is added.                                                                                                                                         |
| `container-size="detail-page"` / `"blog-page"`                                                                              | _(no equivalent)_ | Do not rewrite. Leave it in place and record the file, line, and old value for the summary. `ds-sheet` only accepts `fluid` and `compact`, and `@OneOf` logs a warning for any other value.                     |
| `[containerSize]="x"`, `[attr.container-size]="x"`, `containerSize={x}`, `:container-size="x"`, `v-bind:container-size="x"` | same              | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line for manual review. The value may be `detail-page` or `blog-page` at runtime, which `ds-sheet` does not support. |

### Tags and imports

- **HTML**: `<bal-sheet>` becomes `<ds-sheet>`, including the closing tag.
- **Angular**: `<bal-sheet>` becomes `<ds-sheet>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalSheet` from `@baloise/ds-angular`, move only `BalSheet` to `import { DsSheet } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalSheet` with `DsSheet` in `imports:` lists too.
- **React**: `<BalSheet>` becomes `<DsSheet>` and `</BalSheet>` becomes `</DsSheet>`. Import `DsSheet` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSheet` to `import { DsSheet } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

There are no event changes. Neither `bal-sheet` nor `ds-sheet` emits a custom event.

### Methods

Neither component has a public method a consumer calls. There is no sibling-file rule for this component.

## 4. Report

Print a per-file summary of what changed, including every dynamic `containerSize` binding left for manual review and every static `container-size` value left in place.

Also list each loss:

- every `container-size="detail-page"` and `"blog-page"` with its file, line, and old value, because `ds-sheet` has no such width
- every type reference such as `BalProps.BalSheetContainer` that the scan cannot see

When at least one sheet was migrated, add one line, not one per usage: the scan cannot see custom `--bal-sheet-background`, `--bal-sheet-radius`, `--bal-sheet-shadow` and `--bal-sheet-position-bottom` overrides or `.bal-sheet` and `.bal-sheet__container` selectors, and neither carries over to `ds-sheet`, which renders in shadow DOM. The variables are renamed to `--sheet-background`, `--sheet-radius`, `--sheet-shadow` and `--sheet-position-bottom`. The host no longer sets font family, weight and size, so content inherits them from its surroundings.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
