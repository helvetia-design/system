# hint

Migrate every `bal-hint` usage to `ds-hint`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has two child elements. `bal-hint-title` becomes `ds-hint-title` and `bal-hint-text` becomes `ds-hint-text`. Both still exist as direct children of `ds-hint`, so the rewrite is a rename. Do not fold the title into the new `label` prop. `bal-field-hint` is a different component and is not part of this migration.

The panel behaves differently on touch viewports: `ds-hint` opens a `ds-drawer` (bottom sheet) there, where `bal-hint` opened a fullscreen popup. The `closeLabel` button now lives in that drawer. No markup change is needed for this.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-hint.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-hint` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-hint`) | new (`ds-hint`)        | handling                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closeLabel`     | `closeLabel`           | Copy as-is, including bindings (`[closeLabel]`, `closeLabel={label}`). The button is now shown in the drawer on touch viewports.                                                                                                                                    |
| `small`          | _(no equivalent prop)_ | Leave the attribute in place, do not drop it. `ds-hint` has no way to hide the close button on larger viewports, so it has no effect after the migration. In strictly typed React or Angular templates it may not compile. Flag every occurrence for manual review. |
| _(none)_         | `label`                | New prop (title text). Leave unset, keep `bal-hint-title` as `ds-hint-title`.                                                                                                                                                                                       |
| _(none)_         | `placement`            | New prop (desktop popup placement, default `right`). Leave unset.                                                                                                                                                                                                   |
| _(none)_         | `triggerLabel`         | New prop (accessible label of the trigger button). Leave unset.                                                                                                                                                                                                     |

### Tags and imports

- **HTML**: `<bal-hint>` becomes `<ds-hint>`, `<bal-hint-title>` becomes `<ds-hint-title>`, and `<bal-hint-text>` becomes `<ds-hint-text>`, including the closing tags.
- **Angular**: the same tag renames in `.html` templates and in inline `template:` strings, including the closing tags. When a file imports `BalHint`, `BalHintTitle` or `BalHintText` from `@baloise/ds-angular`, move only those symbols to `import { DsHint, DsHintTitle, DsHintText } from '@helvetia-design/angular'` (only the ones the file used) and leave the other symbols on the `@baloise` import. Rename them in `imports: [...]` as well.
- **React**: `<BalHint>`, `<BalHintTitle>` and `<BalHintText>` become `<DsHint>`, `<DsHintTitle>` and `<DsHintText>`, including the closing tags. Import them from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only the `BalHint*` symbols to `import { DsHint } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

Neither `bal-hint` nor `ds-hint` has a public event. Nothing to rewrite.

### Methods

`toggle()`, `present()` and `dismiss()` keep those names. `configChanged()` was `@internal` and is not a consumer API.

## 4. Report

Print a per-file summary of what changed, including every `small` left for manual review. Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
