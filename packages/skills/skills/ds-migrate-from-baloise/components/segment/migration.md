# segment

Migrate every `bal-segment` usage to `ds-segment`, and every `bal-segment-item` usage to `ds-segment-item`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. `bal-segment-item` finds its parent with `this.el.closest('bal-segment')` and `bal-segment` finds its children with `querySelectorAll('bal-segment-item')`; rewriting only one side would silently break that wiring. `ds-segment` finds its items through its slotted `ds-segment-item` children, so the parent and its items are always rewritten in the same pass.

`bal-field`, `bal-field-label`, `bal-field-control`, and `bal-field-message` — the wrapper a legacy segment is often shown inside — are out of scope. They have no `ds-*` tag replacement and no migration for them exists yet. Leave every `bal-field*` tag exactly as it is: not scanned, not rewritten, not flagged.

The scan does not match the ambient `HTMLBalSegmentElement`, `HTMLBalSegmentItemElement`, `BalProps.BalSegment*` or `BalEvents.BalSegment*` types. Those are Report items, not rewrites. Search for them yourself in each file with a finding.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-segment.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-segment` or `bal-segment-item` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-segment` including its items before rewriting it, since `disabled` and `invalid` cascade from the group down to its items. This step is finished when every finding matches the mapping.

### Props: `bal-segment` → `ds-segment`

| old                                        | new (`ds-segment`)                                                                                                          | handling                                                                                                                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`, `disabled`, `invalid`, `vertical` | same                                                                                                                        | Copy as-is. The legacy `value` was typed `string \| number \| boolean`, the new one is `any`; the runtime value is the same.                                                                                                                                |
| `autoInvalidOff`                           | `autoInvalidOff`                                                                                                            | Copy as-is. It only has an effect with the `@helvetia-design/angular` integration.                                                                                                                                                                          |
| `expanded`                                 | `wide`                                                                                                                      | Rename. Both make the segment use the whole width, but the new `wide` is documented as items expanding equally. Flag every occurrence with a **"check behaviour"** note.                                                                                    |
| `scrollable`                               | _(no equivalent)_                                                                                                           | Do not rewrite. Leave it in place and report each occurrence by file and line as "no `ds-*` equivalent, needs manual rework". Do not add a comment to the consumer's code.                                                                                  |
| _(none — new prop)_                        | `required` (defaults `true`)                                                                                                | Do not set this. The legacy segment had no such prop, so a migrated segment inside a form now validates as required. Mention once, not per occurrence, that the default changed and that the consumer can set `required="false"` where it should not apply. |
| _(none — new props)_                       | `label`, `description`, `invalidText`, `name`, `readonly`, `loading`, `iconOnly`, `allowEmptySelection`, `verticalOnMobile` | New capabilities, nothing to migrate from legacy. Leave unset.                                                                                                                                                                                              |

### Props: `bal-segment-item` → `ds-segment-item`

| old                                | new (`ds-segment-item`)      | handling                                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`, `value`                   | same                         | Copy as-is. Label text written as slotted content (`<bal-segment-item>Text</bal-segment-item>`) carries over unchanged, since `ds-segment-item` has a default slot.                                                                                                                                                     |
| `disabled`                         | _(no equivalent)_            | Drop it and report each occurrence by file and line as lost: a single item can no longer be disabled, only the whole `ds-segment`. Do not move it onto the group, because that would disable every item.                                                                                                                |
| `invalid`                          | _(no equivalent)_            | Drop it and report each occurrence by file and line as lost. Validity is only set on the `ds-segment`.                                                                                                                                                                                                                  |
| `checked`, `focused` (`@internal`) | _(no equivalent)_            | Drop silently. These were never public API. Do not mention them in the summary.                                                                                                                                                                                                                                         |
| _(none — missing `value`)_         | `value`                      | The legacy item generated a default `value` (`bal-si-<n>`) when none was set. `ds-segment-item` has no default, so an item without `value` has an undefined value. Do not add one: the consumer's expected values are unknown. Report each `bal-segment-item` without a `value` by file and line as a behaviour change. |
| _(none — new props)_               | `icon`, `svg`, `description` | New capabilities, nothing to migrate from legacy. Leave unset.                                                                                                                                                                                                                                                          |

### Tags and imports

- **HTML**: `<bal-segment>` becomes `<ds-segment>`, including the closing tag. `<bal-segment-item>` becomes `<ds-segment-item>`, including the closing tag.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalSegment` and/or `BalSegmentItem` from `@baloise/ds-angular`, replace only the ones used with `DsSegment`/`DsSegmentItem` from `@helvetia-design/angular`, keeping the rest on the `@baloise` import.
- **React**: `<BalSegment>`/`</BalSegment>` becomes `<DsSegment>`/`</DsSegment>`, `<BalSegmentItem>`/`</BalSegmentItem>` becomes `<DsSegmentItem>`/`</DsSegmentItem>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSegment` and `BalSegmentItem` and leave the rest on the `@baloise` import.

### Events

Only `bal-segment` emits events; `bal-segment-item` has none.

| old         | new        | handling                                                                                                                                                                                                  |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. The detail is the segment value in both. |
| `balFocus`  | `dsFocus`  | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Detail stays `FocusEvent`.                                                         |
| `balBlur`   | `dsBlur`   | Same shapes as `balFocus`, targeting `blur`.                                                                                                                                                              |

`balSelect` and `balVertical` were `@internal` and never part of the public API. Drop any reference silently, without a summary mention.

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event without ever naming `bal-segment`.

The scan does not list a file that only listens and never uses `bal-segment`/`bal-segment-item`/`BalSegment`/`BalSegmentItem`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

Neither `bal-segment` nor `bal-segment-item` had a public method, and neither has `ds-segment`/`ds-segment-item`. `setAriaForm()` and `setFocus()` on the legacy tags were `@internal`. Drop any reference silently, without a summary mention.

## 4. Report

Print a per-file summary of what changed, including: every `expanded` rewritten to `wide` with its "check behaviour" note; every `scrollable` left in place as having no `ds-*` equivalent; every dropped item `disabled` or `invalid` as lost; every `bal-segment-item` without a `value`; every type reference such as `HTMLBalSegmentElement` or `BalEvents.BalSegmentChange` that the scan cannot see (these resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed); the one-time note about `ds-segment`'s new `required` default being left alone; and the one-time note that `bal-field`/`bal-field-label`/`bal-field-control`/`bal-field-message` wrappers were left untouched because collapsing them is a separate, future migration. End with the note that files which only listen, and have no scanned `.html` of the same name beside them, were not scanned. Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
