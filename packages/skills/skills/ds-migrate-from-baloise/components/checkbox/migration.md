# checkbox

Migrate every `bal-checkbox` usage to `ds-checkbox`, and every `bal-checkbox-group` usage to `ds-checkbox-group`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. `bal-checkbox-group` drives its children with `this.el.querySelectorAll('bal-checkbox')`; rewriting the children to `ds-checkbox` while leaving a `bal-checkbox-group` parent untouched would silently break that cascade, because the old group would stop finding its own children. `ds-checkbox-group` has the matching `querySelectorAll('ds-checkbox')` wiring, so the parent and its children are always rewritten in the same pass.

`bal-check` and `bal-switch` are two more tags in the legacy folder. They are display-only indicators, not form controls, and `ds-*` has no equivalent. The scan lists them so they are not missed, but they are never rewritten. `scan-migratable.mjs` counts them under `byHand` as `check` and `switch`, not under `suggested`, so they must be replaced by hand. See "Legacy indicators: `bal-check` and `bal-switch`" below.

Apply `shared/field.md` in the Rewrite step to every migrated `ds-checkbox`, `ds-checkbox-group` or `ds-toggle` (a `bal-checkbox` with `interface="switch"` becomes `ds-toggle`) that sits inside a `bal-field`, in the same pass. It moves the label, description and message of the wrapper onto the control and removes the wrapper tags. A `bal-field` around a control that is still a legacy `bal-*` tag stays unchanged. `components/field/migration.md` migrates `bal-form-grid`, `bal-form-col` and every `bal-field` that is left.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-checkbox.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`. The scan also matches bare `newBalCheckboxOption` calls, since a file can build the dropped `options` array (see Props below) without ever naming a tag. It also matches `bal-check`, `bal-switch`, `BalCheck` and `BalSwitch`. It lists `BalCheckboxBundle` and the `BalEvents.BalCheckbox*` and `BalCheckbox*CustomEvent` types too. It lists `HTMLBalCheckboxElement` too. It does not match the ambient `BalProps.BalCheckbox*` types, so search for them yourself in each file with a finding. `SKILL.md` "Legacy types and bundles" says how to rewrite all of them.

Some findings carry one extra flag. A flag is only present when it is true, so most findings have only `line` and `snippet`. A forms binding below means `formControlName`, `formControl` or `ngModel` in any binding form, such as `[formControl]` or `[(ngModel)]`. A bound `value` means Angular `[value]` or React `value={…}`.

- `switchGroup: true` sits on a group's opening tag. The group has `interface="switch"` or a switch child, and it has a bound `value` or a forms binding. Rewrite it as "Switch group with a bound value" describes, not as a `ds-checkbox-group`.
- `unboundControl: true` sits on a group's opening tag. The group has a forms binding or a bound `value`, but no `control`. Add `control`, as "Bound groups need `control`" describes.
- `formsBinding: true` sits on a `bal-checkbox` opening tag with a forms binding. Rewrite it as "Single checkbox with a forms binding (Angular)" describes.
- `setValue: true` sits on a `.setValue(` call whose receiver is typed `HTMLBalCheckboxGroupElement`. The call is in the scanned file or in the same-basename `.ts` beside a scanned `.html`. Rewrite it as Methods describes.

The flags only cover what the scan can see in the tag. Still read every group yourself before you rewrite it.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-checkbox` or `bal-checkbox-group` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-checkbox-group` (not just a scanned child tag) before deciding how to rewrite it. `interface` cascades from the group down to its children, and the tile layout props (`tile`, `hideTrigger`, `cols*`) are decided at group level. This step is finished when every finding matches the mapping.

### Shape: `interface` no longer exists — it splits three ways

Legacy `interface` (`'checkbox' | 'switch' | 'button' | 'tile'`) lived on `bal-checkbox` and, when set on `bal-checkbox-group`, cascaded to every child. Neither `ds-checkbox` nor `ds-checkbox-group` has an `interface` prop. Each value becomes a different change:

| old `interface` | new | handling |
| --- | --- | --- |
| omitted, `"checkbox"` | omit `tile` | Default on both sides. Copy every other prop as-is. |
| `"tile"` | `tile` + `hideTrigger` on `ds-checkbox-group` | A bordered card layout. Legacy drew no indicator on a tile. See Shape: tile below. See the `color` row below for the tile colour. |
| `"switch"` | tag becomes `ds-toggle` | See Shape: switch below. This is a tag change, not a prop rewrite. |
| `"button"` | `tile` on `ds-checkbox-group` | See Shape: button below. This is a visual approximation, not an exact match. |

`ds-checkbox-group` overwrites `tile`, `hideTrigger`, `cols`, `colsTablet` and `colsMobile` on every `ds-checkbox` child, also on children added later through `slotchange`, so `*ngFor` and `.map` children are covered. A value written on a child inside a group is lost. Write these props on the group only and drop `interface` from every child inside a group. A child-level `interface="tile"` or `"button"` inside a group whose own `interface` is unset moves to the group when every non-switch child carries the same value. When the children of one group carry different `interface` values, or values that differ from the group, write nothing on the group and report it. A group renders all children the same way. A child with `interface="switch"` still becomes a `ds-toggle` as Shape: switch describes, because the group does not touch a `ds-toggle`. A standalone `bal-checkbox` outside any group keeps `tile` and `hideTrigger` on itself, as the Shape sections below map them, because no group overwrites it. A wrapper `ds-checkbox-group` that the migration adds around a single checkbox (a forms binding, a `bal-field` label or a following `bal-field-message`) gets the checkbox's `name`, `tile` and `hideTrigger` instead of the checkbox, as the Shape sections below map them. The wrapper also overwrites `name` on its child, and without its own `name` it writes a generated id there, so the form would submit the checkbox under that id. It defaults `tile` to `false` and would overwrite that too.

### Shape: `interface="switch"` becomes a `ds-toggle`

`ds-toggle` is a separate, real, form-associated component — it renders a genuine `<input type="checkbox">` under the hood, with the same event contract as `ds-checkbox` (`dsChange` with a boolean detail, `dsFocus`/`dsBlur` with `FocusEvent`). Rewrite the tag itself, not just a prop:

```html
<!-- before -->
<bal-checkbox-group>
  <bal-checkbox interface="switch" name="notify" checked>Notifications</bal-checkbox>
</bal-checkbox-group>

<!-- after -->
<ds-checkbox-group>
  <ds-toggle name="notify" checked>Notifications</ds-toggle>
</ds-checkbox-group>
```

Carry over `name`, `value`, `checked`, `disabled`, `readonly`, `required`, `invalid`, `autoInvalidOff`, and the label content unchanged — `ds-toggle` has all of them. Drop `interface`, `tile`, `color`, `flat`, `labelHidden`, and `nonSubmit`, and write no `tile-color`: `ds-toggle` has no concept of any of them (it is never a tile, and it is always submitted with the form).

A switch inside a group needs one of three rules. Read the whole group first.

- The group has a bound `value` or a forms binding (scan flag `switchGroup`). Follow "Switch group with a bound value" below. The group does not become a `ds-checkbox-group`.
- The group has `control`, but no bound `value` and no forms binding. Examples are `control value="news"` or `control` with a `balChange` handler on the group. Still rewrite the tag to `ds-toggle`, and report it with exactly this note: **"visual benefit persists, but value binding breaks"**. `ds-checkbox-group` finds its children with `this.el.querySelectorAll('ds-checkbox')`, so it never sees a `ds-toggle`. The static `value` no longer checks the toggle, and the group's `dsChange` array no longer includes it.
- Any other group is used only for layout, label or fieldset. This is the common case, and the legacy `Switch` story is one. It needs no report, because nothing read the switch state through the group.

### Shape: `interface="tile"` becomes `tile` + `hideTrigger`

Legacy `bal-checkbox` drew no indicator on a tile. Its selected state was only the border color. A `bal-check` that the consumer put in the tile body was the only indicator such a tile showed. `ds-checkbox` shows its trigger in every mode and hides it only when both `tile` and `hideTrigger` are set.

So `"tile"` always becomes `tile` + `hideTrigger`. Never add `hideTrigger` for `"button"`. A plain tile then shows no indicator, as in legacy. A `bal-check` left in the tile body stays, and it is the tile's one indicator. Without `hideTrigger` that tile would show two. When the consumer later replaces that `bal-check` by hand, removing `hideTrigger` lets `ds-checkbox` draw its own trigger.

### Shape: `interface="button"` becomes `tile`

The legacy `button` look (set on `bal-checkbox-group`, cascading to children) is an auto-width, inline-flowing row of bordered buttons, with the selected one filled solid dark-navy with white text. Legacy drew a `bal-check` in each button, inverted when checked. `tile` does not reproduce the layout: `ds-checkbox-group`'s tile mode is always a block-level card, either full width (no `cols`) or an equal-width grid cell (`cols` set) — never auto-width to its own label text — and its selected state is a border plus a soft color tint, never a solid fill.

Rewrite anyway, as the closest available approximation: add `tile` to the group only. Do not add `hideTrigger`. The `ds-checkbox` trigger then draws the check mark that legacy drew. A standalone `bal-checkbox` outside any group keeps `tile` on itself. Carry over `color` on individual children as the `tile-color` attribute (see the `color` row below). `bal-checkbox-group` has no `color`, so only children carry it. Flag every occurrence with a **"slight design deviation"** note: sizing behavior changed from auto-width/inline to fixed/grid-width block, and the selected-state fill changed from solid to border-plus-tint. The check mark stays.

### Switch group with a bound value

A group with `interface="switch"` or switch children, and with a bound `value` or a forms binding, does not become a `ds-checkbox-group`. That group only queries `ds-checkbox`, so it shows every `ds-toggle` as unchecked. Without `control` it also does not intercept child events. The toggle's boolean `dsChange` then reaches the group's handler instead of the value array.

Rewrite the group like this instead:

- The group tag becomes `<div role="group" class="flex flex-direction-column gap-2xs">`. In React, write `className`. The three utility classes come from `@helvetia-design/styles`. They stack the toggles with the same 4px gap as a vertical `ds-checkbox-group`.
- When the group has a field label from a surrounding `bal-field`, put that text on the div as `aria-label`. `shared/field.md` removes the wrapper as usual.
- The label can also come from a label element right before the group, such as a `bal-label` or `BalLabel` with the group's heading text. Give that label an `id` and put `aria-labelledby` with that `id` on the div. Or put its text on the div as `aria-label`.
- Drop `interface`, `control`, `value` and the forms binding from the group, together with its `balChange` handler. Also drop `vertical`, because the div already stacks the toggles vertically. Move the group's `name` to every child that has none.
- Each switch child becomes a standalone `ds-toggle` with its own `checked` binding, derived from the array. A switch child is a child with its own `interface="switch"`, or any child of a group with `interface="switch"`, because the group's `interface` cascades. Only a child without its own `interface="switch"` in a group without `interface="switch"` becomes a standalone `ds-checkbox`, with the same bindings. It keeps its own `tile` and `hideTrigger`, and the group's `interface` moves onto it, because no group overwrites it. `"tile"` gives it `tile` and `hideTrigger`. `"button"` gives it `tile` only.

React:

```tsx
// before
<BalCheckboxGroup name="topics" value={topics} interface="switch" onBalChange={e => onTopicsChange(e.detail ?? [])}>
  <BalCheckbox value="news">News</BalCheckbox>
</BalCheckboxGroup>

// after
<div role="group" className="flex flex-direction-column gap-2xs">
  <DsToggle
    name="topics"
    value="news"
    checked={topics.includes('news')}
    onDsChange={e => onTopicsChange(e.detail ? [...topics, 'news'] : topics.filter(t => t !== 'news'))}
  >
    News
  </DsToggle>
</div>
```

Angular with a forms binding: bind `[checked]` to the form control's value, and handle `(dsChange)` with a small method in the same-basename `.ts`. The method patches the array. Use the form group that the template already binds.

```html
<!-- before -->
<bal-checkbox-group formControlName="topics" interface="switch">
  <bal-checkbox value="news">News</bal-checkbox>
</bal-checkbox-group>

<!-- after -->
<div role="group" class="flex flex-direction-column gap-2xs">
  <ds-toggle
    value="news"
    [checked]="form.controls.topics.value?.includes('news')"
    (dsChange)="toggleTopic('news', $event.detail)"
  >
    News
  </ds-toggle>
</div>
```

```ts
toggleTopic(topic: string, checked: boolean) {
  const topics = this.form.controls.topics
  const current = topics.value ?? []
  topics.setValue(checked ? [...current, topic] : current.filter(value => value !== topic))
  topics.markAsDirty()
}
```

With `ngModel`, the method assigns the bound model property instead. With Angular `[value]` and a `(balChange)` handler, bind `[checked]` to the bound array and call the old handler with the new array from the method.

Report every restructured group.

### Bound groups need `control`

`ds-checkbox-group` has a `control` prop that defaults to `false`. Only with `control` does the group sync its children from `value` and emit its own `dsChange` with the value array. Without it, assigning `value` does nothing, and the child's boolean `dsChange` bubbles up through the group. The Angular `DsCheckboxGroup` wrapper registers its value accessor on `value` and `dsChange`, but it does not set `control`. A bound group without `control` is broken in both directions.

So every `ds-checkbox-group` with `formControlName`, `formControl`, `ngModel` or a bound `value` gets `control`, whether or not the legacy group had it. The scan flags the groups that lack it with `unboundControl`. Report every group where you added `control`.

### Single checkbox with a forms binding (Angular)

`@helvetia-design/angular` exports value accessors for `DsCheckboxGroup` and `DsToggle`, but not for `DsCheckbox`. `formControlName`, `formControl` or `ngModel` on a `ds-checkbox` throws "No value accessor" at runtime. Rewrite a `bal-checkbox` with a forms binding (scan flag `formsBinding`) one of two ways:

- With `interface="switch"`, rewrite it to `ds-toggle` and keep the binding on it. `DsToggle` has a value accessor, and the value stays a boolean.
- Otherwise, wrap it in `<ds-checkbox-group control>` and move the binding to the group. The checkbox keeps its `value`. Its `name` moves to the wrapper. With `interface="tile"`, `tile` and `hideTrigger` go on the wrapper, not on the checkbox. With `interface="button"`, only `tile` goes on the wrapper. The form value changes from a boolean to an array: unchecked is `[]`, checked is `[value]`. A checkbox without `value` puts `'on'` into the array. Change the form control's initial value from `false` to `[]` and from `true` to `[value]` in the same-basename `.ts`, and fix every place that reads it as a boolean. `Validators.requiredTrue` becomes `Validators.required`, which fails on an empty array. Report the type change.

```html
<!-- before -->
<bal-checkbox formControlName="terms" value="accepted">I accept the terms</bal-checkbox>

<!-- after -->
<ds-checkbox-group formControlName="terms" control>
  <ds-checkbox value="accepted">I accept the terms</ds-checkbox>
</ds-checkbox-group>
```

```ts
// before
terms: new FormControl(false, Validators.requiredTrue)

// after
terms: new FormControl<string[]>([], Validators.required)
```

Until `DsCheckbox` has a value accessor, this is the only path that works. A single checkbox inside a `bal-field` gets the same wrapper from `shared/field.md`, and the binding moves to that wrapper in the same way.

### Legacy indicators: `bal-check` and `bal-switch`

`bal-check` and `bal-switch` draw a check mark or a switch from `checked`, `disabled`, `invalid` and `inverted`. `hovered` and `pressed` are internal. They are not form controls, and `ds-*` has no equivalent. Leave every `bal-check`, `bal-switch`, `BalCheck` and `BalSwitch` exactly as it is, and keep their symbols on the `@baloise` import. Report each one by file and line as "no `ds-*` equivalent, needs manual rework". Do not add a comment to the consumer's code. `scan-migratable.mjs` keeps listing them under `byHand` until someone replaces them by hand, and while they are left the legacy config call stays (see `shared/legacy-config.md`). A `bal-check` in a migrated tile body also stays. It is the tile's only indicator, because the tile got `hideTrigger`. When you replace it by hand, delete it and remove `hideTrigger`.

### Props: `bal-checkbox` → `ds-checkbox`

| old | new (`ds-checkbox`) | handling |
| --- | --- | --- |
| `name`, `value`, `checked`, `disabled`, `readonly`, `required`, `autoInvalidOff`, `invalid` | same | Copy as-is. |
| `color` | `tile-color` attribute | Write it as an attribute in every framework. Static `color="red"` becomes `tile-color="red"`. Angular `[color]="x"` becomes `[attr.tile-color]="x"`, or `[attr.tile-color]="x ? x : null"` when `x` can be `''`, so no empty attribute is set. React `color={x}` becomes `tile-color={x}`, with `undefined` for an empty value. Never write the `tileColor` property or a `[tileColor]` binding on a child. `tileColor` is not reflected, and the group reads only the `tile-color` attribute of a child, so a property is replaced by the group's value. Only meaningful when `tile` is set. Legacy also accepted `color=""`; `ds-checkbox` only knows `purple`, `green`, `yellow` and `red`, so drop an empty `color` instead of writing `tile-color=""`. A single static colour shared by every child of a group may move to the group's `tileColor` instead. |
| `colSize` / `colSizeTablet` / `colSizeMobile` (`@internal`), `col-size*` attributes, Angular `[attr.col-size*]` and `[colSize*]` bindings | _(none on the child)_ | Drop from the child. The group's `cols` / `colsTablet` / `colsMobile` (from `columns*`) decide the layout. When all children of a group agree and the group has no `columns*`, write that value as the group's `cols*`. Otherwise report each child value that differs from the group's columns or from its siblings. |
| `labelHidden` | _(no equivalent)_ | Drop it. `ds-checkbox` always renders its label slot. Mention each dropped occurrence. |
| `flat` | _(no equivalent)_ | Drop it. Mention each dropped occurrence. |
| `nonSubmit` | _(no equivalent)_ | Drop it. `ds-checkbox` is always `formAssociated` and always submitted with the form. Mention each dropped occurrence. |
| `hovered`, `pressed` (`@internal`) | _(no equivalent)_ | Drop silently. These were never public API. |

### Props: `bal-checkbox-group` → `ds-checkbox-group`

| old | new (`ds-checkbox-group`) | handling |
| --- | --- | --- |
| `control`, `name`, `vertical`, `disabled`, `readonly`, `invalid`, `value`, `autoInvalidOff` | same | Copy as-is. Add `control` when the group has a forms binding or a bound `value`; see Bound groups need `control`. |
| `columns` / `columnsTablet` / `columnsMobile` | `cols` / `colsTablet` / `colsMobile` | Rename. Set on the group only. The group overwrites `cols*` on every child. |
| `options` (array of `newBalCheckboxOption(...)`) | _(no equivalent)_ | Drop it. `ds-checkbox-group` only supports slotted `ds-checkbox`/`ds-toggle` children, not a declarative array. This cannot be auto-generated from an arbitrary JS array at scan time — flag every `options`/`newBalCheckboxOption` occurrence for manual conversion into slotted children. |
| `verticalOnMobile` | _(no equivalent)_ | Drop it. Mention each dropped occurrence. |
| `expanded` | _(no equivalent)_ | Drop it. Mention each dropped occurrence. |
| _(none — new prop)_ | `required` (defaults `true`) | Do not set this on a group without a label. Its only effect is an "(optional)" suffix next to the group's own `label` prop. When the group sits inside a `bal-field` with a label, `shared/field.md` sets `label` and `required` on the group. Outside a `bal-field`, leave the new default alone. `ds-checkbox-group` is excluded from the required default rule in `SKILL.md`. Mention once, not per-occurrence, that this new prop exists. |
| _(none — new props)_ | `label`, `description`, `invalidText`, `loading`, `color` | New capabilities, nothing to migrate from legacy. `bal-checkbox-group` had neither `label` nor `color`. Leave them unset. `color` here is the group's input colour, not the tile colour. Do not carry a child's `color` onto the group's `color`. |
| `interface` (`"tile"`, `"button"`, `"switch"`) | `tile`, `hideTrigger` | Set on the group only, as Shape describes. `"tile"` becomes `tile` + `hideTrigger`. `"button"` becomes `tile` only. The group overwrites both on every child. `"switch"` follows Shape: switch. |
| _(none — new prop)_ | `tileColor` | A fallback for children without a `tile-color` attribute. It does not override a child's `tile-color`. |

### Tags and imports

- **Not rewritten**: `<bal-check>`, `<bal-switch>`, `BalCheck` and `BalSwitch` stay as they are. A switch group with a bound value becomes a `div`, not a `ds-checkbox-group`.
- **HTML**: `<bal-checkbox>` becomes `<ds-checkbox>` (or `<ds-toggle>` per the Shape section above), including the closing tag. `<bal-checkbox-group>` becomes `<ds-checkbox-group>`, including the closing tag.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalCheckbox` and/or `BalCheckboxGroup` from `@baloise/ds-angular`, replace only the ones used with `DsCheckbox`/`DsCheckboxGroup` from `@helvetia-design/angular`, keeping the rest on the `@baloise` import. A checkbox rewritten to `ds-toggle` instead imports `DsToggle`. `BalCheckboxBundle` is the legacy array `[BalCheckbox, BalCheckboxGroup, BalCheck, BalSwitch]`. A `...BalCheckboxBundle` spread in `imports: [...]` becomes the `DsCheckbox`, `DsCheckboxGroup` and `DsToggle` symbols the template uses. Keep the spread, and add the `Ds*` symbols next to it, while the template still has a `bal-check` or `bal-switch`, which always stay (see Not rewritten). A multi-family bundle such as `BalFormBundle` stays, and the `Ds*` symbols are added next to it. `SKILL.md` "Legacy types and bundles" has the full bundle rule.
- **React**: `<BalCheckbox>`/`</BalCheckbox>` becomes `<DsCheckbox>`/`</DsCheckbox>` (or `<DsToggle>`/`</DsToggle>` per Shape), `<BalCheckboxGroup>`/`</BalCheckboxGroup>` becomes `<DsCheckboxGroup>`/`</DsCheckboxGroup>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used; when the existing `@baloise/ds-react` import also binds other symbols, move only the checkbox ones and leave the rest on the `@baloise` import.

### Events

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. Same detail shape on both sides: boolean for `bal-checkbox`/`ds-checkbox`/`ds-toggle`, `any[]` for `bal-checkbox-group`/`ds-checkbox-group`. The handler body stays; retype its parameter as described below the table. |
| `balFocus` | `dsFocus` | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Detail stays `FocusEvent`. |
| `balBlur` | `dsBlur` | Same shapes as `balFocus`, targeting `blur`. |

Retype handler parameters as `SKILL.md` "Legacy types and bundles" describes. A legacy type such as `BalEvents.BalCheckboxCustomEvent<boolean>` or `BalCheckboxGroupCustomEvent<any[]>` takes its new type from the element the handler is bound to after the rewrite: `DsCheckboxCustomEvent` on a `ds-checkbox`, `DsToggleCustomEvent` on a `ds-toggle`, and `DsCheckboxGroupCustomEvent` on a `ds-checkbox-group`. Keep the type argument when it still matches the detail, and use `any[]` for a group.

In each file that has a finding, also rewrite `balChange`, `balFocus`, and `balBlur` listeners that are not on the element itself, including `addEventListener`. For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event without ever naming `bal-checkbox`.

The scan does not list a file that only listens and never uses `bal-checkbox`/`bal-checkbox-group`/`BalCheckbox`/`BalCheckboxGroup`/`newBalCheckboxOption`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

`setFocus()`, `setBlur()`, `getInputElement()`, and `getOption()` do not exist on `ds-checkbox` or `ds-toggle`. Apply Unmapped props and handlers (`SKILL.md`). The retyped ref makes every such call fail `tsc`.

`getOptionByValue()` does not exist on `ds-checkbox-group`. Apply Unmapped props and handlers (`SKILL.md`). It is tied to the dropped `options` array, so report every call site alongside the `options` occurrence it belongs to.

`setValue()` on `bal-checkbox-group` is never dropped silently. The legacy types declare it publicly as `setValue(value: any[])`. Angular apps call it through a typed ref in the `.ts` beside the template, for example `this.topicsGroup?.nativeElement.setValue(['news'])` with `@ViewChild('topicsGroup') topicsGroup?: ElementRef<HTMLBalCheckboxGroupElement>`. The scan flags these calls with `setValue: true`. `ds-checkbox-group` has no `setValue()`. Rewrite each call by how the group is bound, and report each rewrite:

- The group has `formControlName` or `formControl`: call `setValue(…)` or `patchValue(…)` on the bound control, for example `this.form.controls.topics.setValue(['news'])`. Write `this.form.controls['topics']` when the form is an untyped `FormGroup`, the way the file already reads its controls. This relies on the `control` from Bound groups need `control`.
- The group has `ngModel`: assign the bound model property, for example `this.topics = ['news']`.
- The group has no forms binding: assign `el.value = […]` on the element, and add `control` to the group. Without `control` the assignment does nothing. Assigning `value` does not emit `dsChange`, so `dsChange` handlers do not run.

The scan cannot follow every alias of a ref, so in every file that names `HTMLBalCheckboxGroupElement`, also search for `.setValue(` yourself.

Where the ref stays in use, retype it from `HTMLBalCheckboxGroupElement` to `HTMLDsCheckboxGroupElement`.

`updateState()` and `setAriaForm()` on `bal-checkbox` were `@internal` and never part of the public API. Drop any reference silently, without a mention in the report.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every switch group with a bound `value` or a forms binding, restructured to `<div role="group">` with standalone `ds-toggle` children. Name the new `checked` bindings and handlers.
2. Every switch inside a `control`-mode group without a bound `value` or forms binding, flagged "visual benefit persists, but value binding breaks".
3. Every Angular single checkbox with a forms binding, wrapped in `ds-checkbox-group control`. Its form value changed from a boolean to an array, so the initial value, validators and readers need review.
4. Every `ds-checkbox-group` where the migration added `control` because it has a forms binding, a bound `value` or a rewritten `setValue()` call. Leave out the wrapper groups around a single checkbox, which item 3 already reports.
5. Every `setValue()` call on a `bal-checkbox-group` ref, with the rewrite it got: the form control, the model property, or `el.value` plus `control`. For `el.value`, note that no `dsChange` fires.
6. Every `bal-check`, `bal-switch`, `BalCheck` or `BalSwitch` left in place because it has no `ds-*` equivalent. Name file and line for each.
7. Every `interface="button"` rewritten to `tile`, with its "slight design deviation" note.
8. Every `interface="tile"` group or standalone checkbox that got `hideTrigger`. Name each tile body that still holds a `bal-check`, which is now its only indicator.
9. Every child `interface`, `colSize*` or `col-size*` value that differs from its siblings or from the group, with what was written on the group (`tile`, `hideTrigger`, `cols*`). Every group whose children had `colSize*` and no group `columns*`, with the `cols*` written or the reason none was.
10. Every dropped `labelHidden`. The label is now visible.
11. Every dropped `flat`.
12. Every dropped `nonSubmit`. The checkbox is now always submitted with the form.
13. Every dropped `verticalOnMobile`.
14. Every dropped `expanded`.
15. Every dropped `options` or `newBalCheckboxOption`, flagged for manual conversion to slotted children, together with every `getOptionByValue()` call tied to it and its Unmapped props and handlers outcome.
16. Every `setFocus()`, `setBlur()`, `getInputElement()` or `getOption()` call, with its Unmapped props and handlers outcome.
17. One-time note: the scan reports `setValue()` on a ref typed `HTMLBalCheckboxGroupElement` in every scanned file. It does not report other method calls or listeners in a file that has no finding and no scanned `.html` of the same name beside it.
18. Every legacy type left or written out and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalCheckbox*` type left in place, each detail alias such as `BalEvents.BalCheckboxChangeDetail` written out, each `BalCheckboxBundle` spread kept because a `bal-check` or `bal-switch` is left, and each multi-family bundle kept.

Coverage only, written to the file:

19. Every `interface="switch"` rewritten to `ds-toggle`.
20. One-time note, for groups outside a `bal-field` only: `ds-checkbox-group` defaults its new `required` prop to `true`, and the migration left it alone. It only shows once the group gets a `label`.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
