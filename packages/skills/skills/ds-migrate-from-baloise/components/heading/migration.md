# heading

Migrate every `bal-heading` usage to `ds-heading`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder holds only `bal-heading`. It has no child tags. The component keeps its name. The old tag is `bal-heading`, the new tag is `ds-heading`.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-heading.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan finds the tag and the `BalHeading` binding. It does not find type references such as `BalProps.BalHeadingLevel`, `BalProps.BalHeadingVisualLevel`, or `BalProps.BalHeadingColor`. Those resolve from the ambient `BalProps` namespace rather than an import, and `@helvetia-design/core` does not export the matching `HeadingLevel`, `HeadingVisualLevel`, or `HeadingColor` types yet, so there is nothing to rewrite them to. Leave them and check them by hand.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-heading` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-heading`)                                                                                      | new (`ds-heading`)      | handling                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `level="display"`, `"display-2"`, `"h1"`–`"h5"`, `"span"`, `"p"`                                         | same                    | Copy as-is. These are the only values `ds-heading` still accepts for `level`.                                                                                                                                                                                                                         |
| `level` holding a size token                                                                             | `level` + `visualLevel` | Legacy `level` also accepted size tokens, and decoupled the tag from the size. Split it per the table below so both the rendered tag and the font size stay the same. Report each split.                                                                                                              |
| `visualLevel="display"`, `"display-2"`, `"h1"`–`"h5"`                                                    | same                    | Copy as-is.                                                                                                                                                                                                                                                                                           |
| `visualLevel` holding a size token                                                                       | renamed size token      | Rename the value per the size-token table below. The tag is unaffected.                                                                                                                                                                                                                               |
| `autoLevel`                                                                                              | `autoLevel`             | Same handling as `visualLevel`: semantic values copy as-is, size tokens are renamed.                                                                                                                                                                                                                  |
| `noWrap`                                                                                                 | `noWrap`                | Copy as-is, in every form (`no-wrap`, `[noWrap]="x"`, `noWrap={x}`).                                                                                                                                                                                                                                  |
| `subtitle`                                                                                               | `subtitle`              | Copy as-is.                                                                                                                                                                                                                                                                                           |
| `shadow`                                                                                                 | `shadow`                | Copy as-is.                                                                                                                                                                                                                                                                                           |
| `inverted`                                                                                               | `inverted`              | Copy as-is.                                                                                                                                                                                                                                                                                           |
| `space="none"`, `"bottom"`, `"top"`, `"all"`                                                             | same                    | Copy as-is. Both components use the same four values. See the Report about the legacy default margin when `space` is unset.                                                                                                                                                                           |
| `color` omitted or `color=""`                                                                            | omit `color`            | Legacy `''` resolved to no colour class. Leave `color` unset.                                                                                                                                                                                                                                         |
| `color="primary"`                                                                                        | `color="primary"`       | Copy as-is.                                                                                                                                                                                                                                                                                           |
| `color="info"` / `color="blue"`                                                                          | `color="primary"`       | Legacy collapsed both onto `primary` before painting, so the visible colour does not change. Also rewrite the `'…'`, `{"…"}`, and `{'…'}` forms.                                                                                                                                                      |
| `color="white"`                                                                                          | `inverted`              | HTML and Angular: write `inverted="true"`. React: write `inverted`. When `inverted` is already true, drop `color` and keep it. When `inverted` is false, replace that false value with the true form and drop `color`. Do **not** write `color="inverted"`: it passes validation and paints no class. |
| `color="success"` / `color="warning"` / `color="danger"`                                                 | _(no equivalent value)_ | Drop `color`. The heading renders in the default colour. Do not pick a substitute. Report each one by file, line, and old value. Also drop the `'…'`, `{"…"}`, and `{'…'}` forms.                                                                                                                     |
| `[level]="x"`, `[attr.level]="x"`, `level={x}`, and the same for `visualLevel`, `autoLevel`, and `color` | leave the binding       | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary, saying which values the caller must now pass.                                                                                                                                         |

Size tokens in `level` split across two props, because legacy `HEADING_TAGS` and `HEADING_SIZES` disagreed. `level="x-large"` rendered an `h2` at the size `h3` normally gets, so `level="h2"` alone would enlarge the text.

| legacy `level` | new `level` | new `visualLevel` |
| -------------- | ----------- | ----------------- |
| `xxxxx-large`  | `h1`        | `5xl`             |
| `xxxx-large`   | `h1`        | `4xl`             |
| `xxx-large`    | `h1`        | `3xl`             |
| `xx-large`     | `h1`        | `2xl`             |
| `x-large`      | `h2`        | `xl`              |
| `large`        | `h3`        | `lg`              |
| `medium`       | `h4`        | `md`              |
| `normal`       | `h5`        | `base`            |

In `visualLevel` and `autoLevel` the same tokens are only renamed, never split: `xxxxx-large` to `5xl`, `xxxx-large` to `4xl`, `xxx-large` to `3xl`, `xx-large` to `2xl`, `x-large` to `xl`, `large` to `lg`, `medium` to `md`, and `normal` to `base`.

Children of `bal-heading` are default-slot content in both components. Leave them unchanged.

### Tags and imports

- **HTML**: `<bal-heading>` becomes `<ds-heading>`, including the closing tag.
- **Angular**: `<bal-heading>` becomes `<ds-heading>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalHeading` from `@baloise/ds-angular`, move only `BalHeading` to `import { DsHeading } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalHeading` with `DsHeading` in `imports:` lists too.
- **React**: `<BalHeading>` becomes `<DsHeading>` and `</BalHeading>` becomes `</DsHeading>`. Import `DsHeading` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalHeading` and leave the others on the `@baloise` import.

### Events

Neither component emits events and neither has public methods. There is nothing to rewrite and no handler to add.

## 4. Report

Print a per-file summary of what changed, including every `level` that was split into `level` and `visualLevel`, every renamed size token, every `color="white"` rewritten to `inverted`, every `info` and `blue` collapsed to `primary`, every dropped `success`, `warning`, and `danger`, and every dynamic binding left for the caller.

Also list each loss:

- every dropped `color="success"`, `color="warning"`, or `color="danger"`, with its file, line, and old value, now rendered in the default colour
- every type reference such as `BalProps.BalHeadingLevel` that the scan cannot see. These resolve from the ambient `BalProps` namespace and stop compiling once `@baloise/ds-core` is removed from the project

Also report these rendering differences, so the consumer can check them. Do not add attributes to compensate:

- **Lost selectors.** `ds-heading` uses shadow DOM and exposes only `part="heading"` on the inner element. The legacy component rendered in the light DOM and set the classes `bal-heading`, `bal-heading__text`, `bal-heading--level-*`, `bal-heading--space-*`, `bal-heading__text--color-*`, `bal-heading__text--size-*`, `bal-heading__text--subtitle`, `bal-heading__text--shadow`, and `bal-heading__text--no-wrap`, plus the test id `data-testid="bal-heading"`. Styles and tests that query any of them break. Do not rewrite those selectors yourself. Report them.
- **Default spacing.** The legacy stylesheet gave every heading that was not the last child an automatic bottom margin (`--bal-space-x-small`, or `--bal-space-normal` at `level="display"`) without any `space` attribute. `ds-heading` applies margin only from `space`. List each heading that relied on that implicit margin.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
