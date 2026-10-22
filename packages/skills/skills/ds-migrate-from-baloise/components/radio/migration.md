# radio

Migrate every `bal-radio` usage to `ds-radio`, and every `bal-radio-group` usage to `ds-radio-group`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. `bal-radio-group` drives its children with `this.el.querySelectorAll('bal-radio')`; rewriting the children to `ds-radio` while leaving a `bal-radio-group` parent untouched would silently break that cascade, because the old group would stop finding its own children. `ds-radio-group` has the matching `querySelectorAll('ds-radio')` wiring, so the parent and its children are always rewritten in the same pass.

`bal-radio-icon` is the third tag in the legacy folder. It is an internal visual child that `bal-radio` renders itself, and `ds-radio` has no equivalent. The scan lists it so it is not missed, but it is **never rewritten**: leave every `bal-radio-icon` and `BalRadioIcon` exactly as it is and report each one by file and line as "no `ds-*` equivalent, needs manual rework". Do not add a comment to the consumer's code.

The scan also lists `newBalRadioOption`, the helper that builds the dropped `options` array (see Props below), because a file can call it without ever naming a tag. The scan does not match the ambient `HTMLBalRadioElement`, `BalProps.BalRadio*` or `BalEvents.BalRadio*` types. Those are Report items, not rewrites. Search for them yourself in each file with a finding.

`bal-field`, `bal-field-label`, `bal-field-control`, and `bal-field-message` — the wrapper every legacy radio story is shown inside — are out of scope. They have no `ds-*` tag replacement and no migration for them exists yet. Leave every `bal-field*` tag exactly as it is: not scanned, not rewritten, not flagged.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-radio.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-radio` or `bal-radio-group` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-radio-group` (not just a scanned child tag) before deciding how to rewrite it, since `interface` cascades from the group down to its children. This step is finished when every finding matches the mapping.

### Shape: `interface` no longer exists — it splits three ways

Legacy `interface` (`'radio' | 'button' | 'tile'`) lived on `bal-radio` and, when set on `bal-radio-group`, cascaded to every child. Neither `ds-radio` nor `ds-radio-group` has an `interface` prop. Each value becomes a different change:

| old `interface`    | new                    | handling                                                                                                |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| omitted, `"radio"` | omit `tile`            | Default on both sides. Copy every other prop as-is.                                                     |
| `"tile"`           | `tile`                 | Boolean attribute, same meaning: a bordered card layout. See the `color` row below for the tile colour. |
| `"button"`         | `tile` + `hideTrigger` | See Shape: button below. This is a visual approximation, not an exact match.                            |

### Shape: `interface="button"` becomes `tile` + `hideTrigger`

The legacy `button` look (set on `bal-radio-group`, cascading to children) is an auto-width, inline-flowing row of bordered buttons, with the selected one filled solid dark-navy with white text. Neither `tile` nor `hideTrigger` reproduces that: tile mode is always a block-level card, either full width (no `cols`) or an equal-width grid cell (`cols` set) — never auto-width to its own label text — and its selected state is a border plus a soft color tint, never a solid fill.

Rewrite anyway, as the closest available approximation: add `tile` and `hideTrigger` to the group and to every child. Carry over `color` on individual children as `tileColor`. Flag every occurrence with a **"slight design deviation"** note: sizing behavior changed from auto-width/inline to fixed/grid-width block, and the selected-state fill changed from solid to border-plus-tint.

### Props: `bal-radio` → `ds-radio`

| old                                                                                | new (`ds-radio`)                                   | handling                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `value`, `label`, `checked`, `disabled`, `readonly`, `required`, `invalid` | same                                               | Copy as-is. `checked` was never a legacy prop on `bal-radio` itself, but `ds-radio` accepts it; leave any existing usage.                                                                             |
| `color`                                                                            | `tileColor`                                        | Rename. Only meaningful when `tile` is set. Legacy also accepted `color=""`; `ds-radio` only knows `purple`, `green`, `yellow` and `red`, so drop an empty `color` instead of writing `tileColor=""`. |
| `colSize` / `colSizeTablet` / `colSizeMobile` (`@internal`)                        | `cols` / `colsTablet` / `colsMobile` (`@internal`) | Rename. Internal layout props set by a parent group; rewrite if found directly on a child.                                                                                                            |
| `labelHidden`                                                                      | _(no equivalent)_                                  | Drop it. `ds-radio` always renders its label slot. Mention each dropped occurrence.                                                                                                                   |
| `flat`                                                                             | _(no equivalent)_                                  | Drop it. Mention each dropped occurrence.                                                                                                                                                             |
| `nonSubmit`                                                                        | _(no equivalent)_                                  | Drop it. `ds-radio` is always submitted with the form. Mention each dropped occurrence.                                                                                                               |
| `hovered`, `pressed` (`@internal`)                                                 | _(no equivalent)_                                  | Drop silently. These were never public API.                                                                                                                                                           |
| _(none — new prop)_                                                                | `labelPosition`                                    | New capability (`left`, `top`, `right`), nothing to migrate from legacy. Leave unset.                                                                                                                 |
| _(none — new slots)_                                                               | `helper`, `hint`                                   | New capabilities, nothing to migrate from legacy. Leave unset.                                                                                                                                        |

### Props: `bal-radio-group` → `ds-radio-group`

| old                                                                                                     | new (`ds-radio-group`)                                                     | handling                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `value`, `vertical`, `disabled`, `readonly`, `invalid`, `autoInvalidOff`, `allowEmptySelection` | same                                                                       | Copy as-is.                                                                                                                                                                                                                                                                                                                                                                                         |
| `columns` / `columnsTablet` / `columnsMobile`                                                           | `cols` / `colsTablet` / `colsMobile`                                       | Rename.                                                                                                                                                                                                                                                                                                                                                                                             |
| `options` (array of `newBalRadioOption(...)`)                                                           | _(no equivalent)_                                                          | Drop it. `ds-radio-group` only supports slotted `ds-radio` children, not a declarative array. This cannot be auto-generated from an arbitrary JS array at scan time — flag every `options`/`newBalRadioOption` occurrence for manual conversion into slotted children.                                                                                                                              |
| `verticalOnMobile`                                                                                      | _(no equivalent)_                                                          | Drop it. Mention each dropped occurrence.                                                                                                                                                                                                                                                                                                                                                           |
| `expanded`                                                                                              | _(no equivalent)_                                                          | Drop it. Mention each dropped occurrence.                                                                                                                                                                                                                                                                                                                                                           |
| _(none — new prop)_                                                                                     | `required` (defaults `true`)                                               | Do not set this. Its only effect is an "(optional)" suffix next to the group's own `label` prop. Since `bal-field` is left untouched and the migrated group's `label` stays unset, setting `required="false"` would render an orphaned "(optional)" suffix. Mention once, not per-occurrence, that this new prop exists and is inert unless the consumer later adopts the group's own `label` prop. |
| _(none — new props)_                                                                                    | `label`, `description`, `invalidText`, `loading`, `labelPosition`, `color` | New capabilities, nothing to migrate from legacy. Leave unset. `color` here is the group's input colour, not the tile colour: do not carry a child's `color` onto the group.                                                                                                                                                                                                                        |
| _(none — new props)_                                                                                    | `tile`, `hideTrigger`, `tileColor`                                         | Cascade from the group to every child `ds-radio`. A group-level `interface="tile"` therefore needs only `tile` on the group, not on each child.                                                                                                                                                                                                                                                     |

### Tags and imports

- **HTML**: `<bal-radio>` becomes `<ds-radio>`, including the closing tag. `<bal-radio-group>` becomes `<ds-radio-group>`, including the closing tag. Leave `<bal-radio-icon>` alone.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalRadio` and/or `BalRadioGroup` from `@baloise/ds-angular`, replace only the ones used with `DsRadio`/`DsRadioGroup` from `@helvetia-design/angular`, keeping the rest on the `@baloise` import.
- **React**: `<BalRadio>`/`</BalRadio>` becomes `<DsRadio>`/`</DsRadio>`, `<BalRadioGroup>`/`</BalRadioGroup>` becomes `<DsRadioGroup>`/`</DsRadioGroup>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalRadio` and `BalRadioGroup` and leave the rest on the `@baloise` import.

### Events

| old         | new        | handling                                                                                                                                                                                                                                                                                                                             |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. The detail is a boolean on `bal-radio`/`ds-radio`. On the group it was `number \| string \| boolean` and is now typed `any \| null`; the runtime value is the same. |
| `balFocus`  | `dsFocus`  | Same shapes as `balChange`: `addEventListener`, `(balFocus)`, `onBalFocus` become `dsFocus`, `(dsFocus)`, `onDsFocus`. Detail stays `FocusEvent`.                                                                                                                                                                                    |
| `balBlur`   | `dsBlur`   | Same shapes as `balFocus`, targeting `blur`.                                                                                                                                                                                                                                                                                         |

Rewrite only handlers that are attached to the element being migrated. `balChange`, `balFocus` and `balBlur` are emitted by many other legacy components, so never rewrite a handler on another element, and never rename them by search and replace across the file.

For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event or calls a method without ever naming `bal-radio`.

The scan does not list a file that only listens and never uses `bal-radio`/`bal-radio-group`/`BalRadio`/`BalRadioGroup`/`newBalRadioOption`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

`setFocus()` exists on both `bal-radio` and `ds-radio` and keeps its signature. There is nothing to rewrite.

`getInputElement()` and `getOption()` do not exist on `ds-radio`. Flag every call site for manual review; there is no replacement.

`getOptionByValue()` does not exist on `ds-radio-group`. It is tied to the dropped `options` array — flag every call site alongside the `options` occurrence it belongs to.

`setBlur()`, `setButtonTabindex()`, `updateState()` and `setAriaForm()` on `bal-radio`, and `setValue()` and `setAriaForm()` on `bal-radio-group`, were all `@internal` and never part of the public API. Drop any reference silently, without a summary mention.

## 4. Report

Print a per-file summary of what changed, including: every `interface="button"` rewritten to `tile` + `hideTrigger` with its "slight design deviation" note; every dropped `labelHidden`, `flat`, `nonSubmit`, `verticalOnMobile`, and `expanded`, and every empty `color` dropped; every dropped `options`/`newBalRadioOption` flagged for manual conversion to slotted children, together with any `getOptionByValue()` call site tied to it; every `getInputElement()` or `getOption()` call flagged as having no replacement; every `bal-radio-icon`/`BalRadioIcon` left in place as having no `ds-*` equivalent; every type reference such as `HTMLBalRadioElement`, `BalProps.BalRadioInterface` or `BalEvents.BalRadioChange` that the scan cannot see (these resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed); the one-time note about `ds-radio-group`'s new `required` default being left alone; and the one-time note that `bal-field`/`bal-field-label`/`bal-field-control`/`bal-field-message` wrappers were left untouched because collapsing them is a separate, future migration. End with the note that files which only listen or only call a method, and have no scanned `.html` of the same name beside them, were not scanned. Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
