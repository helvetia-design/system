# segment

Migrate every `bal-segment` usage to `ds-segment`, and every `bal-segment-item` usage to `ds-segment-item`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. `bal-segment-item` finds its parent with `this.el.closest('bal-segment')` and `bal-segment` finds its children with `querySelectorAll('bal-segment-item')`; rewriting only one side would silently break that wiring. `ds-segment` finds its items through its slotted `ds-segment-item` children, so the parent and its items are always rewritten in the same pass.

Apply `shared/field.md` in the Rewrite step to every migrated `ds-segment` that sits inside a `bal-field`, in the same pass. It moves the label, description and message of the wrapper onto the control and removes the wrapper tags. A `bal-field` around a control that is still a legacy `bal-*` tag stays unchanged. `components/field/migration.md` migrates `bal-form-grid`, `bal-form-col` and every `bal-field` that is left.

The scan also lists `BalSegmentBundle` and the `BalEvents.BalSegment*` and `BalSegment*CustomEvent` types. It lists the `HTMLBalSegmentElement` and `HTMLBalSegmentItemElement` types too. It does not match `BalProps.BalSegment*`. Search for them yourself in each file with a finding. `SKILL.md` "Legacy types and bundles" says how to rewrite all of them.

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

| old | new (`ds-segment`) | handling |
| --- | --- | --- |
| `value`, `disabled`, `invalid`, `vertical` | same | Copy as-is. The legacy `value` was typed `string \| number \| boolean`, the new one is `any`; the runtime value is the same. |
| `autoInvalidOff` | `autoInvalidOff` | Copy as-is. It only has an effect with the `@helvetia-design/angular` integration. |
| `expanded` | `wide` | Rename. Both make the segment use the whole width, but the new `wide` is documented as items expanding equally. Flag every occurrence with a **"check behaviour"** note. |
| `scrollable` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| _(none — new prop)_ | `required` (defaults `true`) | Do not set this outside a `bal-field`. Its only effect is an "(optional)" suffix next to the segment's own `label` prop. Inside a `bal-field` with a label, `shared/field.md` sets `label` and `required`. `ds-segment` is excluded from the required default rule in `SKILL.md`. Mention once, not per occurrence, that this new prop exists. |
| _(none — new props)_ | `label`, `description`, `invalidText`, `name`, `readonly`, `loading`, `iconOnly`, `allowEmptySelection`, `verticalOnMobile` | New capabilities, nothing to migrate from legacy. Leave unset. |

### Props: `bal-segment-item` → `ds-segment-item`

| old | new (`ds-segment-item`) | handling |
| --- | --- | --- |
| `label`, `value` | same | Copy as-is. Label text written as slotted content (`<bal-segment-item>Text</bal-segment-item>`) carries over unchanged, since `ds-segment-item` has a default slot. |
| `disabled` | _(no equivalent)_ | Drop it and report each occurrence by file and line as lost: a single item can no longer be disabled, only the whole `ds-segment`. Do not move it onto the group, because that would disable every item. |
| `invalid` | _(no equivalent)_ | Drop it and report each occurrence by file and line as lost. Validity is only set on the `ds-segment`. |
| `checked`, `focused` (`@internal`) | _(no equivalent)_ | Drop silently. These were never public API. Do not mention them in the report. |
| _(none — missing `value`)_ | `value` | The legacy item generated a default `value` (`bal-si-<n>`) when none was set. `ds-segment-item` has no default, so an item without `value` has an undefined value. Do not add one: the consumer's expected values are unknown. Report each `bal-segment-item` without a `value` by file and line as a behaviour change. |
| _(none — new props)_ | `icon`, `svg`, `description` | New capabilities, nothing to migrate from legacy. Leave unset. |

### Tags and imports

- **HTML**: `<bal-segment>` becomes `<ds-segment>`, including the closing tag. `<bal-segment-item>` becomes `<ds-segment-item>`, including the closing tag.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalSegment` and/or `BalSegmentItem` from `@baloise/ds-angular`, replace only the ones used with `DsSegment`/`DsSegmentItem` from `@helvetia-design/angular`, keeping the rest on the `@baloise` import. A `...BalSegmentBundle` spread in `imports: [...]` becomes `DsSegment` and `DsSegmentItem`. A multi-family bundle such as `BalFormBundle` stays, and the `Ds*` symbols are added next to it. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- **React**: `<BalSegment>`/`</BalSegment>` becomes `<DsSegment>`/`</DsSegment>`, `<BalSegmentItem>`/`</BalSegmentItem>` becomes `<DsSegmentItem>`/`</DsSegmentItem>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalSegment` and `BalSegmentItem` and leave the rest on the `@baloise` import.

### Events

Only `bal-segment` emits events; `bal-segment-item` has none.

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. The detail is the segment value in both, typed `any`. |
| `balFocus` | `dsFocus` | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Detail stays `FocusEvent`. |
| `balBlur` | `dsBlur` | Same shapes as `balFocus`, targeting `blur`. |

`balSelect` and `balVertical` were `@internal` and never part of the public API. Drop any reference silently, without a mention in the report.

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalSegment*` and `BalSegmentCustomEvent` become `DsSegmentCustomEvent`. Write a detail alias such as `BalEvents.BalSegmentChangeDetail` out as `any`. `HTMLBalSegmentElement` becomes `HTMLDsSegmentElement`, and `HTMLBalSegmentItemElement` becomes `HTMLDsSegmentItemElement`.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event without ever naming `bal-segment`.

The scan does not list a file that only listens and never uses `bal-segment`/`bal-segment-item`/`BalSegment`/`BalSegmentItem`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

Neither `bal-segment` nor `bal-segment-item` had a public method, and neither has `ds-segment`/`ds-segment-item`. `setAriaForm()` and `setFocus()` on the legacy tags were `@internal`. Drop any reference silently, without a mention in the report.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `expanded` rewritten to `wide`, with its "check behaviour" note.
2. Every `scrollable`, which has no `ds-*` equivalent, with its Unmapped props and handlers outcome. Name file and line for each.
3. Every dropped item `disabled`, as lost. A single item can no longer be disabled, only the whole `ds-segment`.
4. Every dropped item `invalid`, as lost. Validity is only set on the `ds-segment`.
5. Every `bal-segment-item` without a `value`.
6. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalSegment*` type left in place, each detail alias such as `BalEvents.BalSegmentChangeDetail` written out, each `BalSegmentBundle` spread kept because a legacy tag is left, and each multi-family bundle kept.
7. One-time note, for segments outside a `bal-field` only: `ds-segment` has a new `required` prop that defaults to `true`, and the migration left it unset. It is inert unless the consumer later sets the segment's own `label` prop.
8. One-time note: files which only listen, and have no scanned `.html` of the same name beside them, were not scanned.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
