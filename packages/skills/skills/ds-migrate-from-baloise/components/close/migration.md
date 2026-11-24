# close

Migrate every `bal-close` usage to `ds-close`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-close` only.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-close.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-close` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-close`) | new (`ds-close`) | handling |
| --- | --- | --- |
| `size="small"` | `size="md"` | `md` is the only `ds-close` size and the closest to legacy small. Do not write `size="sm"`, `ds-close` rejects it. Also rewrite `size='small'`, `size={"small"}`, and `size={'small'}`. |
| `size="medium"` | `size="md"` | Rewrite to the short value. Also rewrite `size='medium'`, `size={"medium"}`, and `size={'medium'}`. |
| `size=""` or `size` omitted | omit `size` | Drop `size`. Leave it unset. |
| `[size]="x"`, `[attr.size]="x"`, `size={x}` | `size` | Dynamic value. Do not guess the mapping. HTML: copy the binding unchanged and list the file and line in the report for manual review. React and Angular: copy it when the expression's type only admits `md`. Otherwise apply Unmapped props and handlers (`SKILL.md`). The report says that `small` and `medium` are now `md`. |
| `inverted` | `inverted` | Copy as-is, including `inverted="true"`, `inverted={true}`, and `[inverted]="x"`. |
| _(none)_ | `disabled` | New prop. Nothing to migrate from. Leave it unset. |
| _(none)_ | `button` | New prop. Nothing to migrate from. Leave it unset. |
| _(none)_ | `buttonColor`, `buttonSize` | New props, only applicable with `button`. Nothing to migrate from. Leave them unset. |

### Tags and imports

- **HTML**: `<bal-close>` becomes `<ds-close>`, including the closing tag.
- **Angular**: `<bal-close>` becomes `<ds-close>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalClose` from `@baloise/ds-angular`, move only `BalClose` to `import { DsClose } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalClose` with `DsClose` in `imports:` lists too.
- **React**: `<BalClose>` becomes `<DsClose>` and `</BalClose>` becomes `</DsClose>`. Import `DsClose` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalClose` to `import { DsClose } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

There are no event changes. Neither `bal-close` nor `ds-close` emits a custom event. A click on the host element still bubbles as a native `click`. Leave existing `click` handlers unchanged.

### Methods

Neither component has a public method a consumer calls. There is no sibling-file rule for this component.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every dynamic `size` binding, with the framework outcome (copied in HTML, copied or removed (Unmapped) in React and Angular).
2. Every selector that targets the legacy internals and that the scan cannot see. The legacy `bal-close` rendered `data-testid="bal-close"`, the BEM classes `bal-close__button` and `bal-close__button__icon`, and a nested `bal-icon`. `ds-close` renders its button inside shadow DOM as `<button id="close" part="button">`. Tests that query the test id or those classes break, and styles for them need `ds-close::part(button)`. Do not rewrite those selectors yourself. Report them.

Coverage only, written to the file:

3. Every `size="small"` or `"medium"` rewritten to `"md"`. Legacy small has no size of its own in `ds-close`.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
