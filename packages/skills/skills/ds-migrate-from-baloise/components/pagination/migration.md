# pagination

Migrate every `bal-pagination` usage to `ds-pagination`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The scan lists the `bal-pagination` tag, the React and Angular symbol `BalPagination`, and the four `@baloise/ds-testing` Cypress commands `balPaginationFindPages`, `balPaginationFindCurrentPage`, `balPaginationFindNextButton` and `balPaginationFindPreviousButton`. The commands are listed because they appear in test files that never name the tag. They are Report items, not rewrites. The scan does not match the ambient `BalProps.BalPaginationSize`, `BalProps.BalPaginationInterface`, `BalProps.BalPaginationAlignment`, or `BalEvents.BalPagination*` types either. Search for them yourself in each file with a finding.

The legacy folder has no child tags, and `bal-pagination` renders only `bal-icon` inside its own tree. The component keeps its name. The old tag is `bal-pagination`, the new tag is `ds-pagination`.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-pagination.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-pagination` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-pagination`)                                                                | new (`ds-pagination`)               | handling                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`, `totalPages`, `pageRange`, `disabled`, `sticky`, `top`                       | same                                | Copy as-is, in every form (`disabled`, `disabled="true"`, `[disabled]="x"`, `disabled={x}`). No legacy prop is lost in this migration.                                                                                                                                                                                      |
| `align="start"` / `align="end"`                                                       | same                                | Copy as-is, including the `'…'`, `{"…"}`, and `{'…'}` forms.                                                                                                                                                                                                                                                                |
| `align=""` or omitted                                                                 | omit `align`                        | Centre is the default on both sides. Legacy `''` emitted no alignment class, and `ds-pagination` centres when `align` is unset.                                                                                                                                                                                             |
| `align="center"`                                                                      | omit `align`                        | Legacy typed `align` as `'' \| 'end' \| 'start'`, but its JSDoc advertised "start, center or end", so `align="center"` occurs in real code. It never had a style — the nav was centred already. `ds-pagination` validates against `end` and `start` and logs an error for anything else. Drop it and report each one.       |
| `size="small"`                                                                        | `size="sm"`                         | Rename the value. Also rewrite `size='small'`, `size={"small"}`, and `size={'small'}`.                                                                                                                                                                                                                                      |
| `size=""` or omitted                                                                  | omit `size`                         | Legacy `''` meant the default size.                                                                                                                                                                                                                                                                                         |
| `interface="small"`                                                                   | `variant="dots"`                    | The prop and the value both rename. Do not confuse this with `size="small"`, which is a different prop that also used the word "small". The behaviour is identical: with five or fewer pages both render dots instead of page numbers, and above five both render the `2 / 20` counter. Also rewrite the other quote forms. |
| `interface=""` or omitted                                                             | omit `variant`                      | Legacy `''` meant the default page-number layout.                                                                                                                                                                                                                                                                           |
| _(none)_                                                                              | `label`, `textPrevious`, `textNext` | New props. Nothing to migrate from — both components fall back to the same built-in translations. Leave them unset.                                                                                                                                                                                                         |
| `[size]="x"`, `[attr.size]="x"`, `size={x}`, and the same for `interface` and `align` | leave the binding                   | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary, saying that `small` must now be passed as `sm` for `size`, that `interface` is now `variant` and takes `dots`, and that `center` is no longer a value for `align`.                                          |

### Tags and imports

- **HTML**: `<bal-pagination>` becomes `<ds-pagination>`, including the closing tag.
- **Angular**: the same tag rename in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalPagination` from `@baloise/ds-angular`, move only that symbol to `import { DsPagination } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well.
- **React**: `<BalPagination>` becomes `<DsPagination>`, including the closing tag. Import it from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalPagination` and leave the others on the `@baloise` import. If the file already imports from `@helvetia-design/react`, add to that import instead of creating a second one.

### Events

| old         | new        | handling                                                                                                                                                            |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange` | `dsChange` | HTML: `addEventListener('balChange'` becomes `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |

Rewrite only handlers that are attached to the element being migrated. `balChange` is emitted by many other legacy components, so never rewrite a handler on another element, and never rename it by search and replace across the file.

Do not edit handler bodies. The detail is the new page number on both sides, a plain `number` and not an object, so there is nothing to report for it.

### Methods

`next()` and `previous()` keep their names, their signatures, and their behaviour: each moves one page and emits the change event, and each does nothing at the first or last page. There is nothing to rewrite and nothing to report. `configChanged()` is internal config plumbing on both sides and consumers do not call it.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often holds the event handler, or reaches the element through `@ViewChild` or `viewChild`, without ever naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `balChange` handlers and for the ambient `BalProps.BalPagination*` and `BalEvents.BalPagination*` types. React and plain HTML callers hold the element in a ref or a query result, so look for `next()` and `previous()` calls on that variable in the same file to confirm nothing else needs changing.

## 4. Report

Print a per-file summary of what changed, including every `size="small"` renamed to `size="sm"`, every `interface="small"` rewritten to `variant="dots"`, every dropped `align="center"`, every `balChange` handler renamed, and every dynamic binding left for the caller.

Report these changes the scan cannot see, so the consumer can check them:

- **Legacy Cypress commands**: `balPaginationFindPages`, `balPaginationFindCurrentPage`, `balPaginationFindNextButton` and `balPaginationFindPreviousButton` from `@baloise/ds-testing` resolve through the legacy test ids and have no `ds-*` equivalent. Do not rewrite them and do not invent a replacement. List each call by file and line as "no longer available, needs manual rework".
- **Lost selectors**: `ds-pagination` uses shadow DOM and exposes the parts `navigation`, `previous`, `next`, `list`, `page` and `ellipsis`. The legacy component rendered in the light DOM and set the test ids `bal-pagination-controls-left`, `bal-pagination-controls-right`, `bal-pagination-list` and `bal-pagination-page-number`, the classes `bal-pagination`, `bal-pagination--is-sticky`, `bal-pagination__nav`, `bal-pagination__nav--align-start`, `bal-pagination__nav--align-end`, `bal-pagination__nav--context-small`, `bal-pagination__nav__pagination-previous`, `bal-pagination__nav__pagination-next`, `bal-pagination__nav__pagination-list`, `bal-pagination__nav__pagination-list__dot` and `bal-pagination__nav__pagination-list__more`, and a nested `bal-icon` in each arrow button. The page buttons were native `<button>` elements carrying the global `@baloise/ds-styles` classes `button`, `is-square`, `is-primary`, `is-text` and `is-small`, so overrides written against those break too. Tests and styles that query any of them break, including the selector `.bal-pagination__nav__pagination-list > li > button`. Do not rewrite those selectors yourself. Report them.
- **Type references**: the ambient `BalProps.BalPaginationSize`, `BalProps.BalPaginationInterface`, `BalProps.BalPaginationAlignment`, `BalEvents.BalPaginationChangeDetail` and `BalEvents.BalPaginationChange` resolve from the global `BalProps` and `BalEvents` namespaces rather than an import, so the scan cannot see them. `@helvetia-design/core` does not export the matching `PaginationSize`, `PaginationVariant`, `PaginationAlignment` or `PaginationChangeDetail` types yet, so there is nothing to rewrite them to. List each use and leave it.
- **Navigation landmark name**: `bal-pagination` hardcoded `aria-label="pagination"`. `ds-pagination` uses the `label` prop and falls back to a translated name, so the accessible name of the landmark changes. Tests that query by that accessible name need a check. Set `label` yourself only if it needs to be something specific.
- **`value` is now reflected and mutable**: the legacy component tracked the page in private state and never wrote back to the `value` prop. `ds-pagination` assigns to `value` and reflects it to the attribute when the page changes. Code that reads `el.value` expecting the value it originally set, or that treats the attribute as read-only, needs a check.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
