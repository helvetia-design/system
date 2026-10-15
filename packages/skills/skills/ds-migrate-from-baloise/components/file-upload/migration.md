# file-upload

Migrate every `bal-file-upload` usage to `ds-file-upload`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. `components/file-list.tsx` is rendered inside the legacy shadow tree and is not a consumer tag. Rewrite `bal-file-upload` only. Leave slotted content in place.

Legacy `label` is the text inside the drop zone. In `ds-file-upload`, `label` is the field label above the control and the drop-zone text is `dropZoneLabel`. A plain copy would silently change what the user sees, so `label` is renamed. `subTitle` and `getInputElement()` have no equivalent and are reported, not dropped.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-file-upload.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-file-upload` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-file-upload`)                                                                                                                                                      | new (`ds-file-upload`) | handling                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`                                                                                                                                                                      | `dropZoneLabel`        | Rename the attribute and keep the value, including expressions and bindings (`[label]` becomes `[dropZoneLabel]`). Legacy `label` was the drop-zone text. `ds-file-upload` `label` is the field label. Mention each rename in the summary, including a `label` that was only the legacy default text. |
| `name`, `value`, `multiple`, `disabled`, `readonly`, `loading`, `required`, `accept`, `maxFiles`, `maxFileSize`, `maxBundleSize`, `hasFileList`, `invalid`, `autoInvalidOff` | same                   | Copy as-is, including bindings (`[value]`, `[maxFileSize]`, `value={files}`).                                                                                                                                                                                                                         |
| `subTitle`                                                                                                                                                                   | _(no equivalent prop)_ | Leave the attribute in place, do not drop it. `ds-file-upload` has no way to override the file-size subtitle, so it has no effect after the migration. Flag every occurrence for manual review.                                                                                                       |
| _(none)_                                                                                                                                                                     | `dropZoneLabel`        | New prop, aside from the `label` row. Nothing else to migrate from.                                                                                                                                                                                                                                   |
| _(none)_                                                                                                                                                                     | `description`          | New prop. Leave unset.                                                                                                                                                                                                                                                                                |
| _(none)_                                                                                                                                                                     | `invalidText`          | New prop (and the `invalid-text` slot). Leave unset.                                                                                                                                                                                                                                                  |
| _(none)_                                                                                                                                                                     | `color`                | New prop. Leave unset.                                                                                                                                                                                                                                                                                |

### Tags and imports

- **HTML**: `<bal-file-upload>` becomes `<ds-file-upload>`, including the closing tag.
- **Angular**: `<bal-file-upload>` becomes `<ds-file-upload>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalFileUpload` from `@baloise/ds-angular`, move only `BalFileUpload` to `import { DsFileUpload } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename `BalFileUpload` to `DsFileUpload` in `imports: [...]` as well.
- **React**: `<BalFileUpload>` becomes `<DsFileUpload>` and `</BalFileUpload>` becomes `</DsFileUpload>`. Import `DsFileUpload` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalFileUpload` to `import { DsFileUpload } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

| old               | new              | handling                                                                                                                                                                                                |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`       | `dsChange`       | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. The detail is still the full `File[]`. |
| `balFilesAdded`   | `dsFilesAdded`   | Same shapes: `addEventListener('balFilesAdded'`, `(balFilesAdded)`, and `onBalFilesAdded` become `dsFilesAdded`, `(dsFilesAdded)`, and `onDsFilesAdded`.                                                |
| `balFilesRemoved` | `dsFilesRemoved` | Same shapes with `balFilesRemoved`, `(balFilesRemoved)`, and `onBalFilesRemoved`.                                                                                                                       |
| `balRejectedFile` | `dsRejectedFile` | Same shapes with `balRejectedFile`, `(balRejectedFile)`, and `onBalRejectedFile`. The detail is still `{ file, reasons }`.                                                                              |
| `balInputClick`   | `dsInputClick`   | Same shapes with `balInputClick`, `(balInputClick)`, and `onBalInputClick`.                                                                                                                             |
| `balBlur`         | `dsBlur`         | Same shapes with `balBlur`, `(balBlur)`, and `onBalBlur`.                                                                                                                                               |
| `balFocus`        | `dsFocus`        | Same shapes with `balFocus`, `(balFocus)`, and `onBalFocus`.                                                                                                                                            |

In each file that has a finding, also rewrite these listeners when they are not on the element, including `addEventListener`. The scan does not list a file that only listens and never uses `bal-file-upload` or `BalFileUpload`.

### Methods

`clear()` and `setFocus()` keep those names. `getInputElement()` does not exist on `ds-file-upload`. Leave each call in place and flag it for manual review. `setBlur()` was `@internal` and is also gone.

### Types

`FileUploadRejectionReason` was an `enum` in `@baloise/ds-core`. In `ds-file-upload` it is a string union (`'BAD_EXTENSION' | 'FILE_TOO_BIG' | 'FILE_SIZE_SUM_TOO_BIG' | 'TOO_MANY_FILES' | 'DUPLICATED_FILE'`), so `FileUploadRejectionReason.BAD_EXTENSION` no longer compiles. Do not rewrite these. Mention each file that uses the enum or a `BalEvents.BalFileUpload*Detail` type in the summary.

## 4. Report

Print a per-file summary of what changed, including every `label` renamed to `dropZoneLabel`, every `subTitle` left for manual review, every `getInputElement()` call left for manual review, and every file that uses the `FileUploadRejectionReason` enum or a `BalEvents.BalFileUpload*Detail` type. Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
