# Field wrapper inside a component migration

Every `ds-*` form control renders its own field: label, description, invalid text, and the `start` and `end` slots. The legacy wrapper `bal-field` > `bal-field-label` + `bal-field-control` + `bal-field-message` does not fit around it, so a migrated control must leave that wrapper in the same pass. Every form component migration applies these rules to each migrated control that sits inside `bal-field` or `bal-field-control`. `components/field/migration.md` applies them to every `bal-field` that is left over. `SKILL.md` says when each part runs.

The rules need the control to be `ds-*` already or to be migrated in the same pass. A `bal-field` around a control that is still a legacy `bal-*` tag stays unchanged, because the legacy control has no `label` prop. Report it with the name of the component migration that has to run first. A `bal-field` around a native element (`<input>`, `<select>`, `<textarea>`) also stays in place and is reported, because a native element cannot take the field props.

## Scan

No separate scan for most rules. In a component migration, the Scan step of that file already lists the controls. Read the enclosing `bal-field` of each finding while you rewrite it.

When a file of a migrated Angular control contains `bal-ng-error`, run the field scan once:

```bash
node <this-skill-directory>/scripts/scan-bal-field.mjs <project-root>
```

Read its `bal-ng-error` findings. The snippet of each opening tag carries `controlName`, `error` and `group`. Also read its `invalidateOn` findings. They come from the legacy config call and decide between `touched` and `dirty`.

## Rules

Apply these in order to one control and its enclosing `bal-field`. Static values become attributes. Interpolations and expressions become bound props (`[label]` in Angular, `:label` in Vue, `label={...}` in React).

| legacy part | handling on the migrated control |
| --- | --- |
| text of `bal-field-label`, or of a `bal-label` or `ds-label` inside it | `label` on the control. Markup that is not plain text becomes a child with `slot="label"`. The control only renders its label when the `label` prop is set, so also set `label` and flag the occurrence. |
| `size`, `weight`, `htmlFor` on `bal-field-label` | Dropped. `ds-*` links its own label. Report `size` and `weight`. |
| `required` on `bal-field` or `bal-field-label`, or on neither | Only a `required` on `bal-field` or `bal-field-label` counts. A `required` on the control itself is the control's own prop and stays as written. The legacy `bal-field-label` defaults `required` to true and shows the "(optional)" suffix only for an explicit `required="false"`. When the field level is set to true, put `required` on the control. When it is an explicit `required="false"`, set `required="false"` on the control and report nothing. A binding stays a binding. When neither carries `required`, set `required="false"` explicitly, so the control has no native validation, like the legacy one. Report that the control now shows the "(optional)" suffix next to its label, which the legacy label did not show. Report every `required` that is true, because `ds-*` forwards it to the native control and native validation applies now. The required default rule in `SKILL.md` adds `required="false"` only when neither level carries `required`, so the field level comes first. When the control already carries a `required="false"` from that rule, for example because an earlier run left the `bal-field` in place, and the field level says true, replace it. |
| `invalid`, `disabled`, `readonly` on `bal-field` or `bal-field-label` | Copy to the control only when the control does not carry it already. `disabled` on the field cascaded to the control in the legacy system. |
| `valid` on `bal-field` or `bal-field-label` | A static `valid` becomes `color="success"` on controls that have `color`. A binding is reported. `ds-segment` and `ds-toggle` have no `color`, so report the lost `valid` there. |
| `loading` on `bal-field` or `bal-field-control` | `loading` on controls that have it (`ds-input`, `ds-datepicker`, `ds-file-upload`, `ds-checkbox-group`, `ds-radio-group`, `ds-segment`). Report it on any other control, including `ds-toggle`. |
| `horizontal`, `inverted` on `bal-field` | Dropped. `ds-*` has no equivalent. Report every occurrence. |
| `bal-field-control` | Removed. Its children stay. `iconLeft` becomes an icon with `slot="start"` and `iconRight` an icon with `slot="end"`, as a child of the control, with the name rule from `shared/icons.md`. In React write `<DsIcon slot="start" name="…" />` and import `DsIcon` from `@helvetia-design/react`. In Angular write `<ds-icon slot="start" name="…">` and add `DsIcon` to `imports: [...]`. In HTML write `<ds-icon slot="start" name="…">`. `expandedOnMobile` is dropped and reported. |
| `bal-field-message` with `color="danger"`, or rendered only on an error | `invalidText` on the control. The message shows only while the control is `invalid`, so flag it when the control has no `invalid` binding. `{err && <BalFieldMessage>{err}</BalFieldMessage>}` becomes `invalidText={err}`. For an Angular control bound to a form, follow the Angular form binding row instead. A `bal-field-message` that contains `bal-ng-error` follows the `bal-ng-error` row instead. |
| `bal-field-message` with `color="success"` or `"warning"` | `description` on the control, plus `color` with the same value on the control. A message rendered only under a condition (`{tooLow && <BalFieldMessage color="warning">…</BalFieldMessage>}`) becomes a conditional binding on both props, for example `description={tooLow ? '…' : undefined}` and `color={tooLow ? 'warning' : undefined}`. Interpolated text is not markup and needs no slot. A `bal-field-message` that contains `bal-ng-error` follows the `bal-ng-error` row instead. |
| `bal-field-message` with `color=""` or no `color` | `description` on the control. A `bal-field-message` that contains `bal-ng-error` follows the `bal-ng-error` row instead. |
| Angular control bound with `[formControl]`, `formControlName` or `ngModel` | `@helvetia-design/angular` binds the control's validation state. While the control is touched and invalid it sets `invalid` and sets `invalidText` to the first error value when that is a string, otherwise to the error key (`required`, `minlength`, `email`). Otherwise it writes `''`. A plain `invalidText`, including one mapped from a danger `bal-field-message`, does not survive. Put a danger message in a child with `slot="invalid-text"` instead, which overrides the prop. Any non-empty child in that slot marks the control invalid, so the child keeps the condition the legacy message had, or gets `@if (<control>.touched && <control>.invalid)` (`*ngIf` in older templates) when the legacy message had none. When the app builds its message text in code, set `autoInvalidOff` and bind `[invalid]` and `[invalidText]` from the form control instead. When the control has a validator (a `required` or `[required]` true, `minlength`, `pattern`, `email`, or `Validators.*` in the component class) and no message at all, change nothing and report that the control shows the raw validator key as error text. A `bal-ng-error` is a message of its own and follows the `bal-ng-error` row. A control gets one `slot="invalid-text"` child at most. When a danger message and `bal-ng-error` both target one control, the `bal-ng-error` chain fills that child, and the danger message stays in place and is reported. Inside a `bal-field`, the whole `bal-field` stays in place, as the `bal-ng-error` row describes. |
| `bal-ng-error` (Angular) | The target is the `ds-*` control whose `formControlName` matches `controlName` within the same `formGroup`, or the control bound to `<group>.get('<controlName>')` when `group` is set. `<control>` is `<group>.get('<controlName>')` when `group` is set. Otherwise it is `<form>.get('<path>')`, where `<form>` is the `[formGroup]` binding and `<path>` joins the enclosing `formGroupName` values and `controlName` with dots, for example `form.get('email')`. When an enclosing container is `formArrayName` or a bound `[formGroupName]` or `[formArrayName]`, build the path as an array instead, with each bound expression as its own element, for example `form.get(['items', i, 'name'])`. The legacy component resolved `controlName` against the nearest `ControlContainer`, so the path keeps its target. All `bal-ng-error` of one control become one child `<span slot="invalid-text">` of that control. Inside it, an `@if` / `@else if` chain has one branch per `bal-ng-error`, in template order, with the text unchanged. The chain shows one message at a time. The legacy system showed at most one `bal-ng-error` with `error` at a time, and a `bal-ng-error` without `error` showed next to it. The branch condition is `<control>?.touched && <control>?.hasError('<error>')`. A `bal-ng-error` without `error` gets `<control>?.touched && <control>?.invalid` and goes last in the chain. When the legacy config call sets `forms.invalidateOn: 'dirty'`, use `dirty` instead of `touched`. In templates without control flow, write one `ng-container *ngIf` per branch inside the span. Each condition also negates the `hasError` checks of every earlier branch, for example `form.get('email')?.touched && form.get('email')?.hasError('email') && !form.get('email')?.hasError('required')`, so that only one message shows. A `bal-field-message` that contains only `bal-ng-error` children is removed, whatever its `color`. It is an error message, not a `description`. A `bal-field-message` with other content next to `bal-ng-error` stays in place and is reported. A single `ds-checkbox` gets the span on its wrapping `ds-checkbox-group`, as in the single-checkbox row. Leave the `bal-ng-error`, and the `bal-field-message` around it, in place and report it when `controlName` does not resolve to a control in the template, when the target is still a legacy `bal-*` control, or when the target has no `invalid-text` slot (`ds-checkbox` without a group, `ds-radio`). When such a `bal-ng-error`, a `bal-field-message` with other content next to `bal-ng-error`, or a danger message next to a `bal-ng-error` chain is left in place inside a `bal-field`, leave the whole `bal-field` in place and report it, because a `bal-field` that is not empty around a `ds-*` control renders a second field. Outside a `bal-field`, only the message stays in place. Remove every `BalNgError*` symbol from the `@baloise/ds-angular` import and from `imports: [...]` once the file has no `bal-ng-error` left. A `...BalFormBundle` spread stays, because it is a multi-family bundle. |
| `noReservedSpace`, and `disabled`, `invalid`, `valid`, `readonly` on a message | Dropped. |
| message with markup content | A child with `slot="description"` or `slot="invalid-text"`. The prop of the same name must also be set, so flag it. A `bal-field-message` that contains `bal-ng-error` follows the `bal-ng-error` row instead. |
| more than one `bal-field-message` | Leave the whole `bal-field` in place and report it. A `bal-field-message` that only wraps `bal-ng-error` does not count, because the `bal-ng-error` row removes it. |
| `bal-field-hint` | `ds-hint` directly after the control: `subject` becomes its `label`, the content becomes its body. `closeLabel` copies as-is. `hideTitleOnDesktop` and `small` have no equivalent. Report them and flag the placement for visual review. Import `DsHint` from `@helvetia-design/react` or `@helvetia-design/angular`, and add `DsHint` to Angular `imports: [...]`. Do not follow the `BalHint`-only rules of `components/hint/migration.md` for the import, because a `bal-field-hint` has no `BalHint` symbol to move. |
| a single `ds-checkbox` inside `bal-field` with a field label | Wrap it in `ds-checkbox-group` and put `label`, `description` and `invalidText` on the group. `ds-checkbox` only has its own text as `label`. Copy the checkbox's `invalid` binding to the group as well, because the group shows `invalidText` only while the group itself is `invalid`. When the checkbox has a forms binding (`formControlName`, `formControl` or `ngModel`), move the binding to the wrapping `ds-checkbox-group` and add `control`. Report the boolean-to-array type change as "Single checkbox with a forms binding (Angular)" in `components/checkbox/migration.md` describes. Move the checkbox's `name`, and its `tile` and `hideTrigger`, to the wrapping group, because the group overwrites them on its children. `tile` comes from legacy `interface="tile"` or `"button"`. `hideTrigger` comes from legacy `interface="tile"` only. |
| `ds-checkbox-group`, `ds-radio-group` | Same field props as the inputs (`label`, `description`, `invalidText`, `color`, `loading`, `required`). A single `ds-radio` never sits alone, it always has a group. |
| `ds-segment` | `label`, `description`, `invalidText` and `loading` exist. There is no `color`. A danger message becomes `invalidText`. A success or warning message becomes `description` only, and the lost `color` is reported. |
| `ds-toggle` | The toggle renders no field label and no description. Its `label` prop is not rendered, because the component passes `label=""` to its field. Its text is the default slot, so the field label becomes the text of the `ds-toggle` only when the toggle has no text of its own. Otherwise report the field label as lost. A danger message becomes `invalidText`, or a child with `slot="invalid-text"` for markup. `invalid`, `disabled`, `readonly` and `required` copy as usual. The `helper` slot is listed in the toggle docs, but the component never renders it, so do not use it. A non-danger message, `valid`, `color` and `loading` have no target on `ds-toggle`. Report each one as lost, never drop it silently. The toggle defaults `required` to false and shows no "(optional)" suffix, so set `required` only when the field level says true and skip the "(optional)" report. |
| general rule for every control | A message, `valid` state or `loading` that the target control cannot carry is reported as lost with the file, the line and the control. |
| `bal-field-message` outside a `bal-field` | A `bal-field-message` that is not inside a `bal-field` but directly follows a migrated control gets the same message mapping onto that control. It is often rendered conditionally, for example `{err && <BalFieldMessage color="danger">…</BalFieldMessage>}` after a `ds-checkbox`. A single `ds-checkbox` is wrapped in `ds-checkbox-group` as in the single-checkbox row, and its `name`, `tile` and `hideTrigger` move to that wrapper. A message with no control before it stays in place and is reported. |
| `bal-field` with more than one control, or with no form control | Leave it in place and report it. |

A legacy field with two `bal-ng-error` for one control:

```html
<bal-field>
  <bal-field-label>Email</bal-field-label>
  <bal-field-control>
    <bal-input formControlName="email"></bal-input>
  </bal-field-control>
  <bal-field-message>
    <bal-ng-error controlName="email" error="required">Please enter an email</bal-ng-error>
    <bal-ng-error controlName="email" error="email">Please enter a valid email</bal-ng-error>
  </bal-field-message>
</bal-field>
```

The migrated control, inside `<form [formGroup]="form">`:

<!-- prettier-ignore -->
```html
<ds-input label="Email" formControlName="email" [required]="false">
  <span slot="invalid-text">
    @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
      Please enter an email
    } @else if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
      Please enter a valid email
    }
  </span>
</ds-input>
```

Delete the `bal-field`, `bal-field-label`, `bal-field-control` and `bal-field-message` tags once they are empty. Delete the symbols `BalField`, `BalFieldLabel`, `BalFieldControl`, `BalFieldMessage`, `BalFieldHint` and `BalNgErrorComponent` from the `@baloise/ds-react` and `@baloise/ds-angular` imports when the file has no usage left, and remove them from Angular `imports: [...]` arrays.

## Report

These items follow the component's own checklist items and come before the `I` items of `shared/icons.md`. Each one gets its own line in `ds-migration-report.md`, as `shared/report.md` describes.

Needs your attention when found:

- F1. Every `bal-field` left in place, with the reason. For a legacy `bal-*` control, name the component migration to run first. For a native element, say so. For a `bal-field` kept because a `bal-ng-error`, a `bal-field-message` next to it or a danger message stays in place inside it, name that part.
- F2. Every `bal-field-message` outside a `bal-field` that has no control before it, left in place.
- F3. Every message, `valid` state, `loading` or field label that the target control cannot carry, as lost, with the control.
- F4. Every dynamic `valid` binding.
- F5. Every danger message on a control without an `invalid` binding.
- F6. Every markup label, description or invalid text that needs a matching prop.
- F7. Every control that now shows the "(optional)" suffix the legacy label did not show.
- F8. Every `required` that now reaches the native control. Native validation applies now.
- F9. Every `bal-field-hint` moved to `ds-hint`, flagged for visual review of the placement.
- F10. Every dropped `hideTitleOnDesktop` and `small` on `bal-field-hint`.
- F11. Every dropped `horizontal` and `inverted` on `bal-field`.
- F12. Every dropped `size` and `weight` on `bal-field-label`.
- F13. Every dropped `expandedOnMobile` on `bal-field-control`.
- F14. Every Angular control bound with `formControlName`, `[formControl]` or `ngModel` that has a validator but no error message of its own, because `@helvetia-design/angular` shows the raw validator key (`required`, `minlength`, ...) as error text. Also every danger message moved into a `slot="invalid-text"` child and every control that got `autoInvalidOff`. Name file, line and control.
- F15. Every migrated `bal-ng-error`, with file, line and control. Say that the messages now show in template order, while the legacy messages followed the validator order. Say that a validator which returns its message as a string makes the slot unnecessary. For a `bal-ng-error` without `error`, say that it showed next to the specific message in the legacy system and now shows only when no other branch matches.
- F16. Every `bal-ng-error` left in place outside a `bal-field` because its control cannot be resolved, is still a legacy `bal-*` control or has no `invalid-text` slot. Also every `bal-field-message` left in place outside a `bal-field` because it has other content next to `bal-ng-error`, and every danger message left in place outside a `bal-field` because a `bal-ng-error` chain fills the slot of its control. Inside a `bal-field`, F1 reports these.

Coverage only, written to the file:

- F17. Every field wrapper that was removed.
