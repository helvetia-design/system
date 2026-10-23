# notification

Migrate every `bal-notification` usage to `ds-notification`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has no child elements. Rewrite `bal-notification` only. Leave slotted content in place, including `<h2>`, `<strong>`, and `<p>` children. Do not move a slotted title into `heading`; the report step flags the styling change instead.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-notification.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-notification` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Props

| old (`bal-notification`)                                               | new (`ds-notification`)   | handling                                                                                                                                                        |
| ---------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color="info"` / `"success"` / `"warning"` / `"danger"`                | same                      | Copy as-is, including the `'...'`, `{"..."}`, and `{'...'}` forms.                                                                                              |
| `color="primary"`                                                      | `color="info"`            | `ds-notification` marks `primary` as deprecated in favour of `info`. Also rewrite the `'...'`, `{"..."}`, and `{'...'}` forms.                                  |
| `color=""` / no `color`                                                | omit `color`              | Drop an empty `color`. Leave a missing `color` unset.                                                                                                           |
| `light` (no `color`, or `color=""`)                                    | `color="outline-default"` | Drop `light`. Also rewrite `light="true"` and `light={true}`.                                                                                                   |
| `light` with `color="danger"`                                          | `color="outline-red"`     | Drop `light`.                                                                                                                                                   |
| `light` with `color="success"`                                         | `color="outline-green"`   | Drop `light`.                                                                                                                                                   |
| `light` with `color="warning"`                                         | `color="outline-yellow"`  | Drop `light`.                                                                                                                                                   |
| `light` with `color="info"` / `"primary"`                              | _(no equivalent)_         | `ds-notification` has no `outline-info`. Do not guess. Rewrite the tag and import only, leave `light` and `color` unchanged, and list the usage in the summary. |
| `light="false"`, `light={false}`                                       | omit `light`              | Drop `light`. Apply the `color` rows above.                                                                                                                     |
| `[color]`, `[light]`, `color={...}`, `light={...}`, `:color`, `:light` | leave the expression      | The mapping cannot be resolved statically. Rewrite the tag and import only, leave the binding unchanged, and list the usage in the summary as "check manually". |
| `noIcon` / `no-icon`                                                   | same                      | Copy as-is.                                                                                                                                                     |
| _(none)_                                                               | `heading`                 | New prop. Nothing to migrate from. Leave it unset.                                                                                                              |
| _(none)_                                                               | `closable`                | New prop. Nothing to migrate from. Leave it unset.                                                                                                              |
| _(none)_                                                               | `alert`                   | New prop. Nothing to migrate from. Leave it unset.                                                                                                              |
| _(none)_                                                               | `size="sm"`               | New prop. Nothing to migrate from. Leave `size` unset.                                                                                                          |

### Tags and imports

- **HTML**: `<bal-notification>` becomes `<ds-notification>`, including the closing tag.
- **Angular**: `<bal-notification>` becomes `<ds-notification>` in `.html` templates and in inline `template:` strings, including the closing tag. When a file imports `BalNotification` from `@baloise/ds-angular`, move only `BalNotification` to `import { DsNotification } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import.
- **React**: `<BalNotification>` becomes `<DsNotification>` and `</BalNotification>` becomes `</DsNotification>`. Import `DsNotification` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalNotification` to `import { DsNotification } from '@helvetia-design/react'` and leave the other symbols on the `@baloise` import.

### Events

There are no event changes. `bal-notification` emits no custom event. Leave existing event bindings unchanged. `ds-notification` adds `dsCloseClick` and `dsDidLoad`. Nothing to migrate from.

## 4. Report

Print a per-file summary of what changed, including every `light` that became an `outline-*` colour, every `primary` that became `info`, every `light` with `info` or `primary` left unchanged, and every usage with a dynamic `color` or `light` binding that needs a manual check. Also report what the scan cannot see or what changes silently:

- Ambient type references `BalProps.BalNotificationColor`. Grep for them and rename by hand.
- Slotted `<h2>`, `<strong>`, `<b>`, `<span>` and `<p>` children lose the title and body styling that legacy applied to direct children, because `ds-notification` uses shadow DOM and wraps the slot in a `<span>`. Tell the user to check the result visually. `heading` is the intended replacement for a title, but moving it is a manual choice.
- Legacy `bal-notification*` classes and `data-testid="bal-notification-content"` no longer match.
- The element now has `role="status"` with `aria-live="polite"`. Legacy had no role.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
