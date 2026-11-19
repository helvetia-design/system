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

| old (`bal-logo`) | new (`ds-logo`) | handling |
| --- | --- | --- |
| `color` omitted, `color=""`, `color="blue"` | omit `color` | Drop `color`. `ds-logo` has no `color` prop and renders `primary` by default. Also drop `color='blue'`, `color={"blue"}`, and `color={'blue'}`. |
| `color="white"` | `inverted` | HTML and Angular: write `inverted="true"`. React: write `inverted`. Also rewrite `color='white'`, `color={"white"}`, and `color={'white'}`. When `inverted` is already present, drop `color` and keep a single `inverted`. Do **not** write `color="inverted"`: `ds-logo` has no `color` prop. |
| `[color]="x"`, `[attr.color]="x"`, `color={x}` | `inverted` | Dynamic value. Do not generate a comparison expression. `inverted` is a boolean, so the value type differs. HTML: leave the binding unchanged and list the file and line for manual review. React and Angular: apply Unmapped props and handlers (`SKILL.md`). The report says that `color="white"` is now `inverted` set to true. |
| `size="small"` | `size="sm"` | Rewrite the static value `small` to `sm`. Drop `size=""`, since an omitted `size` is the responsive default on both sides. A binding (`[size]`, `size={x}`): HTML keeps it and flags it, because the value set is different. React and Angular keep it when the expression's type only admits `sm` or `lg`. Otherwise apply Unmapped props and handlers (`SKILL.md`). |
| `brand` | `brand` | Copy `baloise`, `helvetia` and bindings as-is. Drop `brand=""`, since an omitted `brand` follows the app config on both sides. |
| `animated` | `animated` | Copy as-is, including bindings. |

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

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every dynamic `color` binding, kept or removed (Unmapped). Name file and line.
2. Every dynamic `size` binding, kept or removed (Unmapped). Name file and line.
3. Every `BalProps.BalLogo*` type reference that needs a manual check.
4. Every legacy selector that no longer applies, such as `.bal-logo--white`, `.bal-logo--size-small`, `.bal-logo--animated` and `.bal-logo__animated-wrapper`. `ds-logo` renders in shadow DOM, so these are lost. The animated container is styleable through `part="animated"`, and the logo takes `--logo-color`, `--logo-height`, `--logo-width`, `--logo-animation-duration` and `--logo-animation-easing`.
5. One-time note: `ds-logo` sets its height from tokens, 24 px on mobile and 32 px on desktop by default, 24 px for `sm` and 32 px for `lg`. The legacy small logo was 22 px, so a small logo can render 2 px taller.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
