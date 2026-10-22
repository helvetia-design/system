# shape

Migrate every `bal-shape` usage to `ds-shape`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-shape` only. Neither component renders a slot.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-shape.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan finds the tag and the `BalShape` binding. It does not find type references such as `BalProps.BalShapeColor`, `BalProps.BalShapeVariation` or `BalProps.BalShapeRotation`. Those have no `ds-*` equivalent and are not rewritten.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-shape` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-shape`)                                                                                      | new (`ds-shape`)  | handling                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variation="1"` / `"2"` / `"3"`                                                                        | same              | Copy as-is.                                                                                                                                                                                                                                        |
| `rotation="0"` / `"90"` / `"180"` / `"270"`                                                            | same              | Copy as-is.                                                                                                                                                                                                                                        |
| `color="green"`, `green-light`, `red`, `red-light`, `purple`, `purple-light`, `yellow`, `yellow-light` | same              | Copy as-is. Also keep the single-quoted and `{"…"}` / `{'…'}` forms.                                                                                                                                                                               |
| _(no `color`)_                                                                                         | `color="green"`   | The default changed. `bal-shape` rendered green, `ds-shape` renders purple. Add `color="green"` to every static usage without a `color` attribute, so the shape looks the same. Record each file and line for the summary. React: `color="green"`. |
| `color` with any other static value (including `""`)                                                   | _(no equivalent)_ | Do not rewrite. Leave it in place and record the file, line, and old value for the summary. `bal-shape` rendered every unknown value in grey, `ds-shape` renders it in the default alias green instead, and `@OneOf` logs a warning.               |
| `[color]="x"`, `[attr.color]="x"`, `color={x}`                                                         | `color`           | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line for manual review. A shape that previously had no value bound now renders purple, and the valid values are the eight listed above.                 |
| `[variation]="x"`, `[rotation]="x"`, `variation={x}`, `rotation={x}`                                   | same              | Copy as-is. The accepted values are unchanged.                                                                                                                                                                                                     |

### Tags and imports

- **HTML**: `<bal-shape>` becomes `<ds-shape>`, including the closing tag.
- **Angular**: `<bal-shape>` becomes `<ds-shape>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalShape` from `@baloise/ds-angular`, move only `BalShape` to `import { DsShape } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalShape` with `DsShape` in `imports:` lists too.
- **React**: `<BalShape>` becomes `<DsShape>` and `</BalShape>` becomes `</DsShape>`. Import `DsShape` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalShape` to `import { DsShape } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

There are no event changes. Neither `bal-shape` nor `ds-shape` emits a custom event.

### Methods

Neither component has a public method a consumer calls. There is no sibling-file rule for this component.

## 4. Report

Print a per-file summary of what changed, including every `color="green"` that was added, every dynamic `color` binding left for manual review, and every static `color` value left in place.

Also list each loss:

- every static `color` value with no `ds-shape` equivalent, with its file, line, and old value, which `bal-shape` rendered in grey
- every type reference such as `BalProps.BalShapeColor` that the scan cannot see

When at least one shape was migrated, add one line, not one per usage: `ds-shape` no longer rounds its corners below the desktop breakpoint, where `bal-shape` used a normal border radius.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
