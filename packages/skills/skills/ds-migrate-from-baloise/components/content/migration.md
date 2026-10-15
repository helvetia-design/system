# content

Migrate every `bal-content` usage to `ds-content`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-content` only.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-content.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-content` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-content`)                  | new (`ds-content`)       | handling                                                                                                                                                                                           |
| ------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout="horizontal"`                | `direction="row"`        | Rename the prop and the value. Also rewrite `layout='horizontal'`, `layout={"horizontal"}`, and `layout={'horizontal'}`.                                                                           |
| `layout="vertical"`                  | `direction="column"`     | Rename the prop and the value. Also rewrite `layout='vertical'`, `layout={"vertical"}`, and `layout={'vertical'}`.                                                                                 |
| `layout=""` or `layout` omitted      | omit `direction`         | Drop `layout`. Leave `direction` unset.                                                                                                                                                            |
| `[layout]="x"`, `layout={x}`         | `direction`              | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary for manual review: the new prop is `direction` with `row` and `column`.             |
| `direction`, `alignment`             | `direction`, `alignment` | Undocumented legacy props with the same name and values. Copy as-is.                                                                                                                               |
| `align="start"`, `"center"`, `"end"` | `align`                  | Copy as-is, including the `'...'`, `{"..."}`, and `{'...'}` forms. The value set is unchanged. See the text alignment note in the report step.                                                     |
| `[align]="x"`, `align={x}`           | `align`                  | Copy as-is.                                                                                                                                                                                        |
| `space="none"`                       | `space="none"`           | Copy as-is.                                                                                                                                                                                        |
| `space="xxx-small"`                  | `space="3xs"`            | Rewrite to the short value. Also rewrite the `'...'`, `{"..."}`, and `{'...'}` forms.                                                                                                              |
| `space="xx-small"`                   | `space="2xs"`            | Same.                                                                                                                                                                                              |
| `space="x-small"`                    | `space="xs"`             | Same.                                                                                                                                                                                              |
| `space="small"`                      | `space="sm"`             | Same.                                                                                                                                                                                              |
| `space="normal"`                     | `space="base"`           | Same.                                                                                                                                                                                              |
| `space=""` or `space` omitted        | omit `space`             | Drop `space`. Leave it unset. The default gap is the same `0.25rem` in both components.                                                                                                            |
| `[space]="x"`, `space={x}`           | `space`                  | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary for manual review: the new values are `none`, `3xs`, `2xs`, `xs`, `sm`, and `base`. |
| _(none)_                             | `textAlign`              | New prop (`left`, `center`, `right`). Nothing to migrate from. Leave it unset.                                                                                                                     |

### Tags and imports

- **HTML**: `<bal-content>` becomes `<ds-content>`, including the closing tag.
- **Angular**: `<bal-content>` becomes `<ds-content>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalContent` from `@baloise/ds-angular`, move only `BalContent` to `import { DsContent } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalContent` with `DsContent` in `imports:` lists too.
- **React**: `<BalContent>` becomes `<DsContent>` and `</BalContent>` becomes `</DsContent>`. Import `DsContent` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalContent` to `import { DsContent } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

Neither `bal-content` nor `ds-content` emits a custom event. Leave existing event handlers unchanged.

### Methods

Neither component has a public method a consumer calls. There is no sibling-file rule for this component.

## 4. Report

Print a per-file summary of what changed, including every `layout` rewritten to `direction`, every `space` value shortened, and every dynamic `layout` or `space` binding left for manual review.

Also report the rendering differences the scan cannot see, so the consumer can check them. Do not add attributes to compensate:

- The legacy `align="center"` and `align="end"` also set `text-align` to `center` and `right`. `ds-content` `align` only positions the children, so the text alignment is no longer set. The new `textAlign` prop (`left`, `center`, `right`) restores it. List every `align` usage that was not `start`.
- The legacy `bal-content` with `layout="horizontal"` keeps `align-items: flex-start`. `ds-content` with `direction="row"` centers the children vertically. List every file that was rewritten to `direction="row"`.

Also list every selector that targeted the legacy host and that the scan cannot see. The legacy `bal-content` set the classes `bal-content`, `bal-content--layout-*`, `bal-content--align-*`, and `bal-content--space-*` on the host. `ds-content` sets `ds-stack-content`, `as-row`, `as-col`, `align-*`, `text-*`, and `has-space-*` instead. Tests and styles that query the old classes break. Do not rewrite those selectors yourself. Report them.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
