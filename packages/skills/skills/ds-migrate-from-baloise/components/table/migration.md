# table

Migrate every `bal-table` usage that wraps a native `<table>` to the `ds-table` CSS class on that `<table>`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

`bal-table` is a light DOM wrapper without its own table styles. It renders its children unchanged and sets three classes on itself: `bal-table`, `ag-theme-alpine`, and `bal-table--is-fullwidth` when `expanded` is true. The table styles came from the legacy `css/core` class `table` on the inner `<table>`. Helvetia has no table element. `ds-table` is a CSS class from `@helvetia-design/styles`, which Init has already imported. So the wrapper goes, and the inner `<table>` gets the class.

A `bal-table` that wraps an AG Grid is not migrated. The `ag-theme-alpine` class on the wrapper themed the grid, and the Helvetia AG Grid theme in `@helvetia-design/ag-grid` is outside the scope of this skill. That `bal-table` stays unchanged and goes under "Needs your attention".

The legacy component has no child tags, no events and no public methods.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-table.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan finds the tag and the `BalTable` binding. It lists the `HTMLBalTableElement` type too.

Show that list to the user grouped by file (path, line, snippet) and end with the total count. Read the content of every `bal-table` before you show the list, and mark each one that stays unchanged because of the AG Grid rule or the unknown content rule below.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-table` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element and its content when the snippet does not show them. This step is finished when every finding matches the mapping.

### Decide per `bal-table`

| content of the `bal-table` | handling |
| --- | --- |
| one native `<table>`, optionally with whitespace or comments around it | Migrate it with the rules below. |
| an AG Grid: an `ag-grid-angular` element, an `AgGridReact` element, any element with an `ag-theme-*` class, or an element that a script in the same file or its same-basename `.ts` passes to `createGrid(` | Leave the `bal-table` and its content unchanged. Report it: the legacy wrapper set `ag-theme-alpine` on itself, the Helvetia AG Grid theme in `@helvetia-design/ag-grid` is outside the scope of this skill, and **Cleanup** stays incomplete while this `bal-table` is left. |
| anything else: a component, a loop that renders several tables, more than one element, or text | Leave the `bal-table` unchanged and report it with what it contains. |

### Props: `bal-table` → `<table class="ds-table">`

| old | new | handling |
| --- | --- | --- |
| _(the wrapper)_ | `ds-table` on the inner `<table>` | Remove the `bal-table` opening and closing tags and keep the `<table>`. Add `ds-table` to its `class` (`className` in React). Write the class only once. |
| `expanded` omitted or `false` | _(nothing)_ | Add nothing. |
| `expanded`, `expanded="true"` | `is-wide` on the inner `<table>` | `.ds-table.is-wide` sets `width: 100%` on the table. Add `is-wide` next to `ds-table`. |
| bound `expanded` | conditional `is-wide` | Angular: `[expanded]="x"` becomes `[class.is-wide]="x"` on the `<table>`, and `[expanded]="true"` becomes the static class. React: `expanded={x}` becomes ``className={`… ds-table${x ? ' is-wide' : ''}`}``, and `expanded={true}` becomes the static class. HTML has no binding. |
| `id`, `class`, `style`, `data-*` and other attributes on the wrapper | a `<div>` that keeps them | Do not drop them. Replace the wrapper with a `<div>` that carries them, instead of removing it, and put `ds-table` on the inner `<table>` as above. Report each one, because a selector or a script may target the wrapper. |

Leave every other class on the `<table>` unchanged, including the legacy `table`, `is-striped`, `is-hoverable`, `is-narrow`, `is-bordered`, `is-fullwidth` and utility classes such as `w-full`. Component migrations do not rewrite those. **CSS utils** maps `table` to `ds-table`, writes `ds-table` only once, and reports `is-bordered` and `is-fullwidth` as lost. Until it runs, the legacy `css/core` rules for `table` still apply next to `ds-table`.

### Tags and imports

- **HTML**: `<bal-table>` and `</bal-table>` are removed, or become `<div>` and `</div>` when the wrapper keeps attributes.
- **Angular**: the same rewrite in `.html` templates and in inline `template:` strings. Delete `BalTable` from the `@baloise/ds-angular` import and from `imports: [...]` once the template has no `bal-table` left. Add no `Ds*` symbol, because `ds-table` is a CSS class. A multi-family bundle such as `BalComponentBundle` stays. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- **React**: `<BalTable>`/`</BalTable>` are removed, or become `<div>`/`</div>` when the wrapper keeps attributes. Delete `BalTable` from the `@baloise/ds-react` import when the file has no usage left. Drop the whole import line when no binding is left. Add no import.

### Types

`ds-table` is a CSS class, so it has no element type. A ref typed `HTMLBalTableElement` pointed at the wrapper, which is gone. When the ref only reads the table, retype it as `HTMLTableElement` and move the ref onto the `<table>`. When it uses anything that only the wrapper had, leave it in place and report it. `bal-table` has no events, so it has no `BalEvents.BalTable*` or `BalTableCustomEvent` type.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there. That is the Angular case where the template holds the tag and the class file holds the ref.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `bal-table` around an AG Grid, left unchanged. Name file and line, say that `@helvetia-design/ag-grid` is outside the scope of this skill, and say that **Cleanup** stays incomplete while it is left.
2. Every `bal-table` with other content than one native `<table>`, left unchanged, with what it contains.
3. Every wrapper replaced by a `<div>` because it carried attributes, with the attributes.
4. Every `HTMLBalTableElement` ref left in place, and every multi-family bundle kept, as `SKILL.md` "Legacy types and bundles" describes.
5. One-time note, when at least one `bal-table` was migrated: the legacy `table` class and its modifiers stay on the `<table>` until **CSS utils** runs, and selectors in the project's own stylesheets that target `bal-table` or `.bal-table` no longer match.

Coverage only, written to the file:

6. Every `bal-table` removed and its `<table>` given `ds-table`.
7. Every `expanded` rewritten to `is-wide`.
8. Every `HTMLBalTableElement` ref retyped to `HTMLTableElement`.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
