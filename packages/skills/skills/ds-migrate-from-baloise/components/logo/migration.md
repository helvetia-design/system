# logo

Migrate every `bal-logo` usage to `ds-logo`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one element and no child tags. `ds-logo` renders in shadow DOM. Mention the size note at the end of the report once, not per finding.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-logo.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-logo` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-logo`) | new (`ds-logo`)   | handling                                                                                                                                                                                                              |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color="blue"`   | `color="primary"` | Rewrite static values: `blue` to `primary`, `white` to `inverted`. Keep the attribute even when it was the default. Leave bindings (`[color]`, `color={x}`) unchanged and flag them, the value set is different.      |
| `size="small"`   | `size="sm"`       | Rewrite the static value `small` to `sm`. Drop `size=""`, since an omitted `size` is the responsive default on both sides. Leave bindings (`[size]`, `size={x}`) unchanged and flag them, the value set is different. |
| `brand`          | `brand`           | Copy `baloise`, `helvetia` and bindings as-is. Drop `brand=""`, since an omitted `brand` follows the app config on both sides.                                                                                        |
| `animated`       | `animated`        | Copy as-is, including bindings.                                                                                                                                                                                       |

`ds-logo` also has `size="lg"`. The legacy component had no equivalent, so nothing maps to it.

### Tags and imports

- **HTML**: `<bal-logo>` becomes `<ds-logo>`, including the closing tag.
- **Angular**: `<bal-logo>` becomes `<ds-logo>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalLogo` from `@baloise/ds-angular`, move only that symbol to `import { DsLogo } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Rename it in `imports: [...]` as well.
- **React**: `<BalLogo>` becomes `<DsLogo>` and `</BalLogo>` becomes `</DsLogo>`. Import `DsLogo` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalLogo` to `import { DsLogo } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

Neither `bal-logo` nor `ds-logo` has a public event. Nothing to rewrite.

### Methods

`configChanged()` was not a consumer API. Neither component has another public method.

### Type references

The ambient `BalProps.BalLogoColor`, `BalProps.BalLogoSize` and `BalProps.BalLogoBrand` types are not findings, because the scan cannot see them. Do not rewrite them. Report them in step 4 when you come across them.

## 4. Report

Print a per-file summary of what changed. End with the items below, each with file and line:

- every dynamic `color` binding left unchanged
- every dynamic `size` binding left unchanged
- every `BalProps.BalLogo*` type reference that needs a manual check
- every legacy selector that no longer applies, such as `.bal-logo--white`, `.bal-logo--size-small`, `.bal-logo--animated` and `.bal-logo__animated-wrapper`. `ds-logo` renders in shadow DOM, so these are lost. The animated container is styleable through `part="animated"`, and the logo takes `--logo-color`, `--logo-height`, `--logo-width`, `--logo-animation-duration` and `--logo-animation-easing`

Then state once: `ds-logo` sets its height from tokens, 24 px on mobile and 32 px on desktop by default, 24 px for `sm` and 32 px for `lg`. The legacy small logo was 22 px, so a small logo can render 2 px taller.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
