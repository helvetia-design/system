# radio

Migrate every `bal-radio` usage to `ds-radio`, and every `bal-radio-group` usage to `ds-radio-group`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. `bal-radio-group` drives its children with `this.el.querySelectorAll('bal-radio')`; rewriting the children to `ds-radio` while leaving a `bal-radio-group` parent untouched would silently break that cascade, because the old group would stop finding its own children. `ds-radio-group` has the matching `querySelectorAll('ds-radio')` wiring, so the parent and its children are always rewritten in the same pass.

`bal-radio-icon` is the third tag in the legacy folder. It is the legacy indicator that a consumer places inside a tile body, and `ds-radio` has no equivalent because the ds tile draws its own indicator. Decide `hideTrigger` first, as Shape: round icon and `hideTrigger` describes, because the decision reads those tags. Then, inside a migrated `ds-radio`, delete every `<bal-radio-icon>` (React `<BalRadioIcon />`) and its import when it becomes unused. Leave the rest of the tile body (`bal-stack`, `bal-icon`, `bal-content`, `bal-label`, `bal-text` and so on) unchanged for its own migration, and list those tags in the report as children of the tile. A `bal-radio-icon` outside any radio is rare. It stays in place and is reported as "no `ds-*` equivalent, needs manual rework". Do not add a comment to the consumer's code.

The scan also lists `newBalRadioOption`, the helper that builds the dropped `options` array (see Props below), because a file can call it without ever naming a tag. The scan also lists `BalRadioBundle` and the `BalEvents.BalRadio*` and `BalRadio*CustomEvent` types. It lists `HTMLBalRadioElement` too. It does not match the ambient `BalProps.BalRadio*` types. Search for them yourself in each file with a finding. `SKILL.md` "Legacy types and bundles" says how to rewrite all of them.

Apply `shared/field.md` in the Rewrite step to every migrated `ds-radio-group` that sits inside a `bal-field`, in the same pass. It moves the label, description and message of the wrapper onto the control and removes the wrapper tags. A `bal-field` around a control that is still a legacy `bal-*` tag stays unchanged. `components/field/migration.md` migrates `bal-form-grid`, `bal-form-col` and every `bal-field` that is left.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-radio.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

A finding with `setValue: true` is a `.setValue(` call whose receiver is typed `HTMLBalRadioGroupElement`. The call is in the scanned file or in the same-basename `.ts` beside a scanned `.html`. Rewrite it as Methods describes. The flag is only present when it is true.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-radio` or `bal-radio-group` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-radio-group` (not just a scanned child tag) before deciding how to rewrite it. `interface` cascades from the group down to its children, and the tile layout props (`tile`, `hideTrigger`, `cols*`) are decided at group level. This step is finished when every finding matches the mapping.

### Shape: `interface` no longer exists — it splits three ways

Legacy `interface` (`'radio' | 'button' | 'tile'`) lived on `bal-radio` and, when set on `bal-radio-group`, cascaded to every child. Neither `ds-radio` nor `ds-radio-group` has an `interface` prop. Each value becomes a different change:

| old `interface` | new | handling |
| --- | --- | --- |
| omitted, `"radio"` | omit `tile` | Default on both sides. Copy every other prop as-is. |
| `"tile"` | `tile` on `ds-radio-group`, plus `hideTrigger` when no child tile body has a `bal-radio-icon` | Boolean attribute, same meaning: a bordered card layout. See Shape: round icon and `hideTrigger` below for when to add `hideTrigger`, and the `color` row below for the tile colour. |
| `"button"` | `tile` on `ds-radio-group` | See Shape: button below. This is a visual approximation, not an exact match. |

`ds-radio-group` overwrites `tile`, `hideTrigger`, `cols`, `colsTablet` and `colsMobile` on every child, also on children added later through `slotchange`, so `*ngFor` children are covered. A value written on a child inside a group is lost. Write these props on the group only and drop `interface` from every child inside a group. A child-level `interface="tile"` or `"button"` inside a group whose own `interface` is unset moves to the group. When the children of one group carry different `interface` values, or values that differ from the group, report it. A group renders all children the same way. A standalone `bal-radio` outside any group keeps `tile` and `hideTrigger` on itself, because no group overwrites it.

### Shape: round icon and `hideTrigger`

Legacy `bal-radio` draws its round `bal-radio-icon` for every `interface` except `tile`. `ds-radio` shows the icon in every mode and hides it only when `tile` and `hideTrigger` are both set. Decide `hideTrigger` before you delete any `bal-radio-icon`, because the decision reads those tags.

This decision applies only to a group or standalone radio that ends up with `interface="tile"`. Never add `hideTrigger` for `"button"`, `"radio"` or an omitted `interface`. A child showed the round icon when its tile body holds a `bal-radio-icon` (`<BalRadioIcon />` in React), or when its own `interface` is not `tile` inside a group whose own `interface` is unset. Then:

- No child showed the icon: add `hideTrigger` to the group.
- Every child showed the icon: write no `hideTrigger`. The ds tile draws its own icon in place of the deleted `bal-radio-icon`.
- Only some children showed the icon: a group renders all children the same way, so write no `hideTrigger` and report the group.

A `"tile"` group built from `options` gets `hideTrigger`, unless an option's `html` contains `bal-radio-icon`. A standalone `bal-radio` follows the same rule with its own tile body.

### Shape: `interface="button"` becomes `tile`

The legacy `button` look (set on `bal-radio-group`, cascading to children) is an auto-width, inline-flowing row of bordered buttons, with the selected one filled solid dark-navy with white text. `tile` does not reproduce that: tile mode is always a block-level card, either full width (no `cols`) or an equal-width grid cell (`cols` set) — never auto-width to its own label text — and its selected state is a border plus a soft color tint, never a solid fill.

Rewrite anyway, as the closest available approximation: add `tile` to the group only. Do not add `hideTrigger`, because legacy `button` kept its round icon. Carry over `color` on individual children as the `tile-color` attribute (see the `color` row below). Flag every occurrence with a **"slight design deviation"** note: sizing behavior changed from auto-width/inline to fixed/grid-width block, and the selected-state fill changed from solid to border-plus-tint.

### Props: `bal-radio` → `ds-radio`

| old | new (`ds-radio`) | handling |
| --- | --- | --- |
| `name`, `value`, `label`, `checked`, `disabled`, `readonly`, `required`, `invalid` | same | Copy as-is. `checked` was never a legacy prop on `bal-radio` itself, but `ds-radio` accepts it; leave any existing usage. |
| `color` | `tile-color` attribute | Write it as an attribute in every framework. Static `color="red"` becomes `tile-color="red"`. Angular `[color]="x"` becomes `[attr.tile-color]="x"`, or `[attr.tile-color]="x ? x : null"` when `x` can be `''`, so no empty attribute is set. React `color={x}` becomes `tile-color={x}`, with `undefined` for an empty value. Never write the `tileColor` property or a `[tileColor]` binding on a child. `tileColor` is not reflected, and the group reads only the `tile-color` attribute of a child, so a property is replaced by the group's value. Only meaningful when `tile` is set. Legacy also accepted `color=""`; `ds-radio` only knows `purple`, `green`, `yellow` and `red`, so drop an empty `color` instead of writing `tile-color=""`. A single static colour shared by every child of a group may move to the group's `tileColor` instead. |
| `colSize` / `colSizeTablet` / `colSizeMobile` (`@internal`), `col-size*` attributes, Angular `[attr.col-size*]` and `[colSize*]` bindings | _(none on the child)_ | Drop from the child. The group's `cols` / `colsTablet` / `colsMobile` (from `columns*`) decide the layout. When all children of a group agree and the group has no `columns*`, write that value as the group's `cols*`. Otherwise report each child value that differs from the group's columns or from its siblings. |
| `labelHidden` | _(no equivalent)_ | Drop it. `ds-radio` always renders its label slot. Mention each dropped occurrence. |
| `flat` | _(no equivalent)_ | Drop it. Mention each dropped occurrence. |
| `nonSubmit` | _(no equivalent)_ | Drop it. `ds-radio` is always submitted with the form. Mention each dropped occurrence. |
| `hovered`, `pressed` (`@internal`) | _(no equivalent)_ | Drop silently. These were never public API. |
| _(none — new prop)_ | `labelPosition` | New capability (`left`, `top`, `right`), nothing to migrate from legacy. Leave unset. |
| _(none — new slots)_ | `helper`, `hint` | New capabilities, nothing to migrate from legacy. Leave unset. |

### Props: `bal-radio-group` → `ds-radio-group`

| old | new (`ds-radio-group`) | handling |
| --- | --- | --- |
| `name`, `value`, `vertical`, `disabled`, `readonly`, `invalid`, `autoInvalidOff`, `allowEmptySelection` | same | Copy as-is. |
| `columns` / `columnsTablet` / `columnsMobile` | `cols` / `colsTablet` / `colsMobile` | Rename. Set on the group only. The group overwrites `cols*` on every child. |
| `options` (array of `newBalRadioOption(...)`) | _(no equivalent)_ | Drop it. `ds-radio-group` only supports slotted `ds-radio` children, not a declarative array. This cannot be auto-generated from an arbitrary JS array at scan time — flag every `options`/`newBalRadioOption` occurrence for manual conversion into slotted children. |
| `verticalOnMobile` | _(no equivalent)_ | Drop it. Mention each dropped occurrence. |
| `expanded` | _(no equivalent)_ | Drop it. Mention each dropped occurrence. |
| _(none — new prop)_ | `required` (defaults `true`) | Do not set this on a group without a label. Its only effect is an "(optional)" suffix next to the group's own `label` prop. When the group sits inside a `bal-field` with a label, `shared/field.md` sets `label` and `required` on the group. Outside a `bal-field`, leave the new default alone. `ds-radio-group` is excluded from the required default rule in `SKILL.md`. Mention once, not per-occurrence, that this new prop exists. |
| _(none — new props)_ | `label`, `description`, `invalidText`, `loading`, `labelPosition`, `color` | New capabilities, nothing to migrate from legacy. Leave unset. `color` here is the group's input colour, not the tile colour: do not carry a child's `color` onto the group. |
| `interface` (`"tile"`, `"button"`) | `"tile"`: `tile`, plus `hideTrigger` as Shape: round icon and `hideTrigger` describes. `"button"`: `tile` | Set on the group only, as Shape describes. The group overwrites both on every child. |
| _(none — new prop)_ | `tileColor` | A fallback for children without a `tile-color` attribute. It does not override a child's `tile-color`. |

### Tags and imports

- **HTML**: `<bal-radio>` becomes `<ds-radio>`, including the closing tag. `<bal-radio-group>` becomes `<ds-radio-group>`, including the closing tag. Delete every `<bal-radio-icon>` inside a migrated `<ds-radio>`, after the `hideTrigger` decision. Leave a `<bal-radio-icon>` outside any radio alone.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalRadio` and/or `BalRadioGroup` from `@baloise/ds-angular`, replace only the ones used with `DsRadio`/`DsRadioGroup` from `@helvetia-design/angular`, keeping the rest on the `@baloise` import. A `...BalRadioBundle` spread in `imports: [...]` becomes `DsRadio` and `DsRadioGroup`. Keep the spread, and add the `Ds*` symbols next to it, while the template still has a group left in place or a `bal-radio-icon` outside a radio. A multi-family bundle such as `BalFormBundle` stays, and the `Ds*` symbols are added next to it. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- **React**: `<BalRadio>`/`</BalRadio>` becomes `<DsRadio>`/`</DsRadio>`, `<BalRadioGroup>`/`</BalRadioGroup>` becomes `<DsRadioGroup>`/`</DsRadioGroup>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used. Remove `BalRadioIcon` from the `@baloise/ds-react` import when no `<BalRadioIcon />` is left. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalRadio` and `BalRadioGroup` and leave the rest on the `@baloise` import.

### Events

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. The detail is a boolean on `bal-radio`/`ds-radio`. On the group it was `number \| string \| boolean` and is now typed `any \| null`; the runtime value is the same. |
| `balFocus` | `dsFocus` | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Detail stays `FocusEvent`. |
| `balBlur` | `dsBlur` | Same shapes as `balFocus`, targeting `blur`. |

Retype handler parameters as `SKILL.md` "Legacy types and bundles" describes. A legacy type such as `BalEvents.BalRadioGroupCustomEvent<string>` or `BalRadioCustomEvent<boolean>` becomes `DsRadioGroupCustomEvent` on a `ds-radio-group` and `DsRadioCustomEvent` on a `ds-radio`. Keep the type argument.

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event or calls a method without ever naming `bal-radio`.

The scan does not list a file that only listens and never uses `bal-radio`/`bal-radio-group`/`BalRadio`/`BalRadioGroup`/`newBalRadioOption`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

`setFocus()` exists on both `bal-radio` and `ds-radio` and keeps its signature. There is nothing to rewrite.

`getInputElement()` and `getOption()` do not exist on `ds-radio`. Apply Unmapped props and handlers (`SKILL.md`).

`getOptionByValue()` does not exist on `ds-radio-group`. Apply Unmapped props and handlers (`SKILL.md`). It is tied to the dropped `options` array, so report every call site alongside the `options` occurrence it belongs to.

`setValue()` on `bal-radio-group` is never dropped silently. The legacy types declare it publicly as `setValue(value: number | string | boolean)`. Angular apps call it through a typed ref in the `.ts` beside the template, for example `this.planGroup?.nativeElement.setValue('basic')` with `@ViewChild('planGroup') planGroup?: ElementRef<HTMLBalRadioGroupElement>`. The scan flags these calls with `setValue: true`. `ds-radio-group` has no `setValue()`. Rewrite each call by how the group is bound, and report each rewrite:

- The group has `formControlName` or `formControl`: call `setValue(…)` or `patchValue(…)` on the bound control, for example `this.form.controls.plan.setValue('basic')`. Write `this.form.controls['plan']` when the form is an untyped `FormGroup`, the way the file already reads its controls.
- The group has `ngModel`: assign the bound model property, for example `this.plan = 'basic'`.
- The group has no forms binding: assign `el.value = …` on the element. `ds-radio-group` has no `control` prop and always syncs its radios from `value`, so the radios update. Assigning `value` does not emit `dsChange`, so `dsChange` handlers do not run.

The scan cannot follow every alias of a ref, so in every file that names `HTMLBalRadioGroupElement`, also search for `.setValue(` yourself.

Where the ref stays in use, retype it from `HTMLBalRadioGroupElement` to `HTMLDsRadioGroupElement`.

`setBlur()`, `setButtonTabindex()`, `updateState()` and `setAriaForm()` on `bal-radio`, and `setAriaForm()` on `bal-radio-group`, were all `@internal` and never part of the public API. Drop any reference silently, without a mention in the report.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `interface="button"` rewritten to `tile`, with its "slight design deviation" note.
2. Every `interface="tile"` group or standalone radio that got `hideTrigger`, because no child showed the legacy round icon. Every group where only some children showed it, which got no `hideTrigger`.
3. Every child `interface`, `colSize*` or `col-size*` value that differs from its siblings or from the group, with what was written on the group (`tile`, `hideTrigger`, `cols*`). Every group whose children had `colSize*` and no group `columns*`, with the `cols*` written or the reason none was.
4. Every dropped `labelHidden`. `ds-radio` always renders its label slot.
5. Every dropped `flat`.
6. Every dropped `nonSubmit`. `ds-radio` is always submitted with the form.
7. Every dropped `verticalOnMobile`.
8. Every dropped `expanded`.
9. Every dropped `options` or `newBalRadioOption`, flagged for manual conversion to slotted children, together with any `getOptionByValue()` call site tied to it and its Unmapped props and handlers outcome.
10. Every `getInputElement()` or `getOption()` call, with its Unmapped props and handlers outcome.
11. Every `setValue()` call on a `bal-radio-group` ref, with the rewrite it got: the form control, the model property, or `el.value`. For `el.value`, note that no `dsChange` fires, so `dsChange` handlers do not run.
12. Every `bal-radio-icon` or `BalRadioIcon` removed from a tile, with file and line, and the legacy tags left in that tile body (for example `bal-stack`, `bal-icon`, `bal-content`) as children of the tile for their own migrations. Every `bal-radio-icon` outside a radio left in place.
13. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalRadio*` type such as `BalProps.BalRadioInterface` left in place, each detail alias such as `BalEvents.BalRadioChangeDetail` written out, each `BalRadioBundle` spread kept because a group or a `bal-radio-icon` outside a radio is left, and each multi-family bundle kept.
14. One-time note: files which only listen or only call a method, and have no scanned `.html` of the same name beside them, were not scanned.
15. One-time note: the scan reports `setValue()` on a ref typed `HTMLBalRadioGroupElement` in every scanned file. It does not report other method calls or listeners in a file that has no finding and no scanned `.html` of the same name beside it.

Coverage only, written to the file:

16. Every empty `color` dropped.
17. One-time note, for groups outside a `bal-field` only: `ds-radio-group` has a new `required` prop that defaults to `true`, and the migration left it unset. It is inert unless the consumer later adopts the group's own `label` prop.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
