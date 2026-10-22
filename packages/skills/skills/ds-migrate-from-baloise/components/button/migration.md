# button

Migrate every `bal-button` usage to `ds-button`, and every `bal-button-group` usage to `ds-button-group`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

Both legacy tags are migrated together, not separately. Each group styles its own children by tag or class: `bal-button-group` sizes `.bal-button` children (full width on mobile for `direction` `auto` and `column`), and `ds-button-group` does the same through `::slotted(ds-button)` and `::slotted(.ds-button)`. Rewriting the children while leaving a `bal-button-group` parent — or the reverse — silently drops that layout, because neither group recognises the other's children. Parent and children are always rewritten in the same pass.

`brandIcon` and `brandSize` are new `ds-button` capabilities with no legacy counterpart. Leave them unset; do not invent values for them.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-button.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-button` or `bal-button-group` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping.

### Shape: four colour names mean different things on each side

`color` is not a straight copy. Four legacy names exist on the new side too, but describe a different look, so mapping by name would silently restyle the button. Map by appearance, the way `components/icon/migration.md` maps `size="large"` to `size="xl"` rather than to the name-matching `lg`.

The evidence, resolving both sides down to their token values:

- Legacy base `.button` is `background: transparent` with `border-color: var(--bal-color-border-primary)` — an outlined button. New `secondary` is `--ds-global-color-neutral` (transparent) with `--ds-alias-border-composite-primary`. The same thing.
- Legacy `tertiary` and `text` only override the border to `var(--bal-link-border-color)`, which is `transparent`. That is a fully transparent button, which is new `ghost` (transparent surface, `border-composite-transparent`). New `tertiary` is a grey-1 **filled** button — a different look.
- Legacy `light` is a grey-2 fill with a grey-2 border. New `tertiary` is a grey-1 fill with a grey-1 border. Nearest match.
- Legacy `info` and `primary-light` have **no CSS rules at all** in the legacy stylesheet. They fell through to the base default, so they rendered as outlined buttons.
- Legacy `info-light` is an info-1 background with an info-5 border. New `info` is an info-1 surface with an info-1 border. Nearest match.

| old `color`                                                            | new `color`                                                | handling                                                                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `primary`, `secondary`, `link`, `success`, `warning`, `danger`         | same                                                       | Copy as-is.                                                                                           |
| `tertiary`                                                             | `ghost`                                                    | **Name collision.** Legacy `tertiary` is transparent; new `tertiary` is grey-filled. Report each one. |
| `text` (deprecated)                                                    | `ghost`                                                    | Legacy styles `.is-text` identically to `.is-tertiary`.                                               |
| `light`                                                                | `tertiary`                                                 | **Name collision.** The legacy grey fill is what new `tertiary` now is. Report each one.              |
| `info` (deprecated)                                                    | `secondary`                                                | **Name collision.** Legacy `info` had no styling and rendered outlined. New `info` is blue-tinted.    |
| `primary-light` (deprecated)                                           | `secondary`                                                | Legacy had no styling and rendered outlined.                                                          |
| `info-light` (deprecated)                                              | `info`                                                     | **Name collision.** The legacy tint is what new `info` now is. Report each one.                       |
| `tertiary-purple`, `tertiary-red`, `tertiary-yellow`, `tertiary-green` | `brand-purple`, `brand-red`, `brand-yellow`, `brand-green` | Rename. Both sides are a colour-1 tint.                                                               |

Rewrite the `color='…'`, `color={"…"}`, and `color={'…'}` forms as well as `color="…"`. When `color` is bound to a non-literal expression, leave the expression alone and say in the summary that its values must be remapped by hand against this table.

### Shape: a named submit button stops submitting its name and value

In plain HTML a submit button's `name` and `value` are sent with the form, so the server can tell which button was pressed. `bal-button` rendered a real `<button type="submit" name="…" value="…">` in the page, so this worked.

`ds-button` renders its `<button>` inside a shadow root, where it cannot act as the form's submitter. It calls `this.internals.form?.requestSubmit()` with no submitter argument and never calls `setFormValue()`, so no `name`/`value` pair is appended. `name` and `value` are still public props and are still placed on the inner button, so nothing warns about this.

```html
<!-- before: clicking Save submits action=save -->
<bal-button element-type="submit" name="action" value="save">Save</bal-button>

<!-- after: the form still submits, but `action` is absent from the data -->
<ds-button element-type="submit" name="action" value="save">Save</ds-button>
```

Still rewrite the tag — the button keeps working, and a `(dsClick)` or `onDsClick` handler is unaffected. But flag every occurrence that has `element-type="submit"` together with `name` or `value` with exactly this note: **"name/value no longer reach the submitted form data"**. A button without `element-type="submit"`, or one with neither `name` nor `value`, needs no flag.

### Props: `bal-button` → `ds-button`

| old                                                                                                                                                                                    | new (`ds-button`)        | handling                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `elementType`, `disabled`, `href`, `target`, `rel`, `download`, `shadow`, `square`, `flat`, `inverted`, `iconTurn`, `noWrap`, `a11yControls`, `a11yTitle`, `a11yLabel`, `a11yHaspopup` | same                     | Copy as-is, including the `="false"` and bound forms.                                                                                                                                                                                                                                                                                                                 |
| `color`                                                                                                                                                                                | `color`                  | See the colour table above.                                                                                                                                                                                                                                                                                                                                           |
| `size` omitted or `size=""`                                                                                                                                                            | omit `size`              | Both defaults are 48px (legacy `.button` is `min-height: 3rem`, `--ds-button-size-base-min-height` is 48). Leave `size` unset.                                                                                                                                                                                                                                        |
| `size="small"`                                                                                                                                                                         | `size="sm"`              | 32px on both sides. Also rewrite `size='small'`, `size={"small"}`, and `size={'small'}`.                                                                                                                                                                                                                                                                              |
| `expanded`                                                                                                                                                                             | `wide`                   | Rename. Same meaning: the button fills the available width.                                                                                                                                                                                                                                                                                                           |
| `loading`                                                                                                                                                                              | `loading`                | Copy as-is. Behaviour change: `ds-button` also disables the native button while loading, where `bal-button` only hid the label and stayed clickable. Mention once, not per occurrence.                                                                                                                                                                                |
| `outlined`                                                                                                                                                                             | `outlined`               | Copy as-is. It has no visual effect on either side — `is-outlined` has no CSS in either design system. Mention once that it is inert.                                                                                                                                                                                                                                 |
| `rounded`                                                                                                                                                                              | _(no equivalent)_        | Drop it. Legacy `is-rounded` was real styling (a pill-shaped button); nothing replaces it. Mention each dropped occurrence.                                                                                                                                                                                                                                           |
| `isActive`                                                                                                                                                                             | _(no equivalent)_        | Drop it. Legacy `is-active` was real styling (a forced pressed look); the new pressed state is internal only. Mention each dropped occurrence.                                                                                                                                                                                                                        |
| `balPopup` / the `bal-popup` attribute                                                                                                                                                 | the `ds-popup` attribute | Rewrite the bare attribute `bal-popup` to `ds-popup`; it still sets `aria-haspopup="true"`. Drop `[balPopup]` and `balPopup={…}` property bindings — the legacy prop was never reflected to the attribute, so those bindings did nothing on either side.                                                                                                              |
| `icon`, `iconRight`                                                                                                                                                                    | same                     | Copy the value, then apply the `name` rule from `components/icon/migration.md`: legacy `bal-icon` rewrote any name starting with `alert` to `alert-triangle` and any starting with `info` to `info-circle`, and `ds-icon` does not. Follow that row for the literal forms and for the non-literal case.                                                               |
| `name`, `value`                                                                                                                                                                        | same                     | Copy as-is. `ds-button`'s `value` is `string` where the legacy prop was `string \| number`. An HTML attribute is already a string and needs nothing; rewrite only the bound numeric forms, so React `value={7}` becomes `value="7"` and Angular `[value]="7"` becomes `value="7"`. Leave a non-literal binding alone. Flag per the named-submit-button section above. |
| `hovered`, `pressed`                                                                                                                                                                   | _(no equivalent)_        | Internal legacy props. Drop both silently.                                                                                                                                                                                                                                                                                                                            |
| _(none — new props)_                                                                                                                                                                   | `brandIcon`, `brandSize` | New capabilities, nothing to migrate from legacy. Leave unset.                                                                                                                                                                                                                                                                                                        |

`bal-button` renders an `<a>` when `href` is anything other than `undefined`, including `href=""`. `ds-button` renders an `<a>` only when `href` is non-empty, so a literal `href=""` becomes a `<button>` instead of an empty link. Rewrite it unchanged and mention each `href=""` occurrence.

### Props: `bal-button-group` → `ds-button-group`

| old                                     | new (`ds-button-group`)           | handling                                                                                                                            |
| --------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `position="right"`, `position="center"` | `align="right"`, `align="center"` | Rename the prop, keep the value.                                                                                                    |
| `position="left"`                       | `align="left"`                    | Rename. `left` is missing from the legacy type but the legacy stylesheet has a `position-left` modifier, so it occurs in real code. |
| `position` omitted or `position=""`     | omit `align`                      | Both sides default to left-aligned. Leave `align` unset.                                                                            |
| `direction`, `reverse`                  | same                              | Copy as-is. `direction` takes the same `auto`, `row`, and `column` values on both sides.                                            |
| _(none — new prop)_                     | `wide`                            | New capability. Leave unset.                                                                                                        |

### Tags and imports

- **HTML**: `<bal-button>` becomes `<ds-button>` and `<bal-button-group>` becomes `<ds-button-group>`, including the closing tags.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalButton`, `BalButtonGroup`, or `BalButtonBundle` from `@baloise/ds-angular`, replace them with `import { DsButton, DsButtonGroup } from '@helvetia-design/angular'`, keeping only the symbols actually used. `BalButtonBundle` is the legacy array `[BalButton, BalButtonGroup]`; the new package ships no bundles, so expand it into the two standalone components wherever it appears, including inside an `imports:` array. When the existing `@baloise/ds-angular` import also binds other symbols, move only the button ones and leave the rest on the `@baloise` import.
- **React**: `<BalButton>`/`</BalButton>` becomes `<DsButton>`/`</DsButton>`, and `<BalButtonGroup>`/`</BalButtonGroup>` becomes `<DsButtonGroup>`/`</DsButtonGroup>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used; when the existing `@baloise/ds-react` import also binds other symbols, move only the button ones and leave the rest on the `@baloise` import.

Leave the slotted label content in place. Both components project their children.

### Events

| old            | new           | handling                                                                                                                                                                              |
| -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balClick`     | `dsClick`     | Rewrite `addEventListener('balClick'` to `addEventListener('dsClick'`. Angular: `(balClick)` becomes `(dsClick)`. React: `onBalClick` becomes `onDsClick`. Detail stays `MouseEvent`. |
| `balNavigate`  | `dsNavigate`  | Same three shapes. Detail stays `MouseEvent`. Emitted only when `href` is set, on both sides.                                                                                         |
| `balFocus`     | `dsFocus`     | Same three shapes. Detail stays `void`.                                                                                                                                               |
| `balBlur`      | `dsBlur`      | Same three shapes. Detail stays `void`.                                                                                                                                               |
| `balDidRender` | `dsDidRender` | Same three shapes. Detail stays `void`.                                                                                                                                               |

No handler body needs rewriting beyond the event name — every detail shape is unchanged.

In each file that has a finding, also rewrite these five listeners where they are not on the element itself, including `addEventListener`. For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event without ever naming `bal-button`.

The scan does not list a file that only listens and never uses `bal-button`/`bal-button-group`/`BalButton`/`BalButtonGroup`/`BalButtonBundle`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

`bal-button` and `bal-button-group` declare no public methods, so there are no call sites to migrate or flag.

## 4. Report

Print a per-file summary of what changed, including: every `color` rewritten across the four name collisions (`tertiary` to `ghost`, `light` to `tertiary`, `info` to `secondary`, `info-light` to `info`), called out by name so a reviewer does not read them as mistakes; every `color` left as a non-literal expression for manual remapping; every `element-type="submit"` with `name` or `value`, flagged "name/value no longer reach the submitted form data"; every dropped `rounded` and `isActive`; every dropped `[balPopup]`/`balPopup={…}` binding; every numeric `value` written as a string; every `href=""` that is now a `<button>` instead of an `<a>`; and every `BalButtonBundle` expanded into `DsButton` and `DsButtonGroup`. Add the one-time notes that `loading` now also disables the button and that `outlined` is inert on both sides. End with the note that files which only listen, and have no scanned `.html` of the same name beside them, were not scanned.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
