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

| old `color` | new `color` | handling |
| --- | --- | --- |
| `primary`, `secondary`, `link`, `success`, `warning`, `danger` | same | Copy as-is. |
| `tertiary` | `ghost` | **Name collision.** Legacy `tertiary` is transparent; new `tertiary` is grey-filled. Report each one. |
| `text` (deprecated) | `ghost` | Legacy styles `.is-text` identically to `.is-tertiary`. |
| `light` | `tertiary` | **Name collision.** The legacy grey fill is what new `tertiary` now is. Report each one. |
| `info` (deprecated) | `secondary` | **Name collision.** Legacy `info` had no styling and rendered outlined. New `info` is blue-tinted. |
| `primary-light` (deprecated) | `secondary` | Legacy had no styling and rendered outlined. |
| `info-light` (deprecated) | `info` | **Name collision.** The legacy tint is what new `info` now is. Report each one. |
| `tertiary-purple`, `tertiary-red`, `tertiary-yellow`, `tertiary-green` | `brand-purple`, `brand-red`, `brand-yellow`, `brand-green` | Rename. Both sides are a colour-1 tint. |

Rewrite the `color='…'`, `color={"…"}`, and `color={'…'}` forms as well as `color="…"`. When `color` is bound to a non-literal expression, do not guess the mapping. HTML: leave the expression alone. React and Angular: keep it when the expression's type only admits `primary`, `secondary`, `link`, `success`, `warning` or `danger`, the names that keep their meaning in this table. A type that admits `tertiary` or `info` compiles but changes the look, so it does not fit. Otherwise apply Unmapped props and handlers (`SKILL.md`). Say in the report that its values must be remapped by hand against this table.

### Shape: the current navigation entry keeps its highlight through `color`

Legacy `is-active` forced the pressed look of the button's own colour. A navbar used it to show the current page. `ds-button` has no style for `aria-current`, so the `a11yCurrent` rewrite in the `isActive` row alone leaves every navigation entry looking the same. On a navigation entry with `isActive`, bind `color` to the same condition as `a11yCurrent`, so the current entry gets a different colour than the others.

The other entries keep `<mapped>`, the colour the colour table above gives the button. An omitted `color` maps to `primary`, because `primary` is the default on both sides. The current entry gets `<current>`, which is `primary`. When `<mapped>` is `primary`, `<current>` is `secondary` instead.

Leave `inverted` as it is. An inverted button only has four looks of its own: `secondary`, `tertiary`, `ghost` and `link`. Every other colour (`primary`, `success`, `warning`, `danger`, `info`, every `brand-*`) shares one filled inverted look. So on an inverted button, `<current>` is `primary` when `<mapped>` is `secondary`, `tertiary`, `ghost` or `link`, and `secondary` otherwise.

- React: `color={cond ? '<current>' : '<mapped>'}`.
- Angular: `[color]="cond ? '<current>' : '<mapped>'"`.
- HTML with JavaScript: `el.color = cond ? '<current>' : '<mapped>'`.
- A true literal sets `color="<current>"`. A static navbar entry without `color` becomes `color="secondary"`.

The binding replaces the button's existing `color`. It never adds a second one. It uses only names of the new side, so the non-literal rule above does not apply to it. When the legacy `color` is itself a non-literal expression, there is no `<mapped>` to write. Apply the non-literal rule above to it, add no binding, and report the entry as a highlight to restore by hand.

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

| old | new (`ds-button`) | handling |
| --- | --- | --- |
| `elementType`, `disabled`, `href`, `target`, `rel`, `download`, `shadow`, `square`, `flat`, `inverted`, `iconTurn`, `noWrap`, `a11yControls`, `a11yTitle`, `a11yLabel`, `a11yHaspopup` | same | Copy as-is, including the `="false"` and bound forms. |
| `color` | `color` | See the colour table above. |
| `size` omitted or `size=""` | omit `size` | Both defaults are 48px (legacy `.button` is `min-height: 3rem`, `--ds-button-size-base-min-height` is 48). Leave `size` unset. |
| `size="small"` | `size="sm"` | 32px on both sides. Also rewrite `size='small'`, `size={"small"}`, and `size={'small'}`. |
| `expanded` | `wide` | Rename. Same meaning: the button fills the available width. |
| `loading` | `loading` | Copy as-is. Behaviour change: `ds-button` also disables the native button while loading, where `bal-button` only hid the label and stayed clickable. Mention once, not per occurrence. |
| `outlined` | `outlined` | Copy as-is. It has no visual effect on either side — `is-outlined` has no CSS in either design system. Mention once that it is inert. |
| `rounded` | _(no equivalent)_ | Drop it. Legacy `is-rounded` was real styling (a pill-shaped button); nothing replaces it. Mention each dropped occurrence. |
| `isActive` | `a11yCurrent` on a navigation entry, otherwise _(no equivalent)_ | Rewrite it only when the button is a navigation entry. It is one when it has `href`, its click handler navigates, or it sits in a navbar or nav menu. A static `is-active` or `isActive` (true literal) becomes `aria-current="page"` in HTML and `a11yCurrent="page"` in React and Angular. `ds-button` reads the HTML `aria-current` once on load and moves it to the native element. A bound value becomes `a11yCurrent={cond ? 'page' : undefined}` in React and `[a11yCurrent]="cond ? 'page' : ''"` in Angular. In HTML with JavaScript, a value that changes becomes `el.a11yCurrent = cond ? 'page' : ''`. Do not use `setAttribute('aria-current', …)`, because `ds-button` reads it only on load. Remove a false literal. `ds-button` forwards `a11yCurrent` as `aria-current` to the native element. The forced pressed look of legacy `is-active` is gone. On a navigation entry, also rewrite `color` as the current-navigation-entry section above describes. When the button is not a navigation entry, drop `isActive`. Its pressed look is lost. Mention each occurrence. |
| `balPopup` / the `bal-popup` attribute | leave the attribute | Leave the `bal-popup` attribute in every form (bare, `bal-popup="<id>"`, `[attr.bal-popup]`, `setAttribute('bal-popup', …)`) unchanged. The popup migration rewrites it to `data-popup`, because `ds-popup` finds its trigger through `data-popup="<id>"`. Report each one. Drop `[balPopup]` and `balPopup={…}` property bindings. The legacy prop was never reflected to the attribute, so those bindings did nothing on either side. |
| `icon`, `iconRight` | same | Copy the value, then apply the icon name rule from `shared/icons.md`. |
| `name`, `value` | same | Copy as-is. `ds-button`'s `value` is `string` where the legacy prop was `string \| number`. An HTML attribute is already a string and needs nothing; rewrite only the bound numeric forms, so React `value={7}` becomes `value="7"` and Angular `[value]="7"` becomes `value="7"`. A non-literal `value` binding: HTML copies it unchanged. React and Angular copy it when the expression's type only admits strings. Otherwise apply Unmapped props and handlers (`SKILL.md`). Flag per the named-submit-button section above. |
| `hovered`, `pressed` | _(no equivalent)_ | Internal legacy props. Drop both silently. |
| _(none — new props)_ | `brandIcon`, `brandSize` | New capabilities, nothing to migrate from legacy. Leave unset. |

`bal-button` renders an `<a>` when `href` is anything other than `undefined`, including `href=""`. `ds-button` renders an `<a>` only when `href` is non-empty, so a literal `href=""` becomes a `<button>` instead of an empty link. Rewrite it unchanged and mention each `href=""` occurrence.

### Props: `bal-button-group` → `ds-button-group`

| old | new (`ds-button-group`) | handling |
| --- | --- | --- |
| `position="right"`, `position="center"` | `align="right"`, `align="center"` | Rename the prop, keep the value. |
| `position="left"` | `align="left"` | Rename. `left` is missing from the legacy type but the legacy stylesheet has a `position-left` modifier, so it occurs in real code. |
| `position` omitted or `position=""` | omit `align` | Both sides default to left-aligned. Leave `align` unset. |
| `direction`, `reverse` | same | Copy as-is. `direction` takes the same `auto`, `row`, and `column` values on both sides. |
| _(none — new prop)_ | `wide` | New capability. Leave unset. |

### Tags and imports

- **HTML**: `<bal-button>` becomes `<ds-button>` and `<bal-button-group>` becomes `<ds-button-group>`, including the closing tags.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalButton`, `BalButtonGroup`, or `BalButtonBundle` from `@baloise/ds-angular`, replace them with `import { DsButton, DsButtonGroup } from '@helvetia-design/angular'`, keeping only the symbols actually used. `BalButtonBundle` is the legacy array `[BalButton, BalButtonGroup]`; the new package ships no bundles, so expand it into the two standalone components wherever it appears, including inside an `imports:` array. When the existing `@baloise/ds-angular` import also binds other symbols, move only the button ones and leave the rest on the `@baloise` import.
- **React**: `<BalButton>`/`</BalButton>` becomes `<DsButton>`/`</DsButton>`, and `<BalButtonGroup>`/`</BalButtonGroup>` becomes `<DsButtonGroup>`/`</DsButtonGroup>`. Import the renamed symbols from `@helvetia-design/react`, keeping only the ones actually used; when the existing `@baloise/ds-react` import also binds other symbols, move only the button ones and leave the rest on the `@baloise` import.

Leave the slotted label content in place. Both components project their children.

### Events

| old | new | handling |
| --- | --- | --- |
| `balClick` | `dsClick` | Rewrite `addEventListener('balClick'` to `addEventListener('dsClick'`. Angular: `(balClick)` becomes `(dsClick)`. React: `onBalClick` becomes `onDsClick`. Detail stays `MouseEvent`. |
| `balNavigate` | `dsNavigate` | Same three shapes. Detail stays `MouseEvent`. Emitted only when `href` is set, on both sides. |
| `balFocus` | `dsFocus` | Same three shapes. Detail stays `void`. |
| `balBlur` | `dsBlur` | Same three shapes. Detail stays `void`. |
| `balDidRender` | `dsDidRender` | Same three shapes. Detail stays `void`. |

No handler body needs rewriting beyond the event name — every detail shape is unchanged.

Retype handler parameters and refs as `SKILL.md` "Legacy types and bundles" describes. `BalEvents.BalButtonCustomEvent` and the bare `BalButtonCustomEvent` become `DsButtonCustomEvent`, and `HTMLBalButtonElement` becomes `HTMLDsButtonElement`. The scan lists the `BalEvents.BalButton*` and `BalButton*CustomEvent` types. It lists `HTMLBalButtonElement` too. It does not list `BalProps.*`, so search for them yourself in each file with a finding.

In each file that has a finding, also rewrite these five listeners where they are not on the element itself, including `addEventListener`. For every finding in a `.html` file, also open the same-basename `.ts` file beside it and apply these rules there — the Angular case where the template holds the tag and the class file handles the event without ever naming `bal-button`.

The scan does not list a file that only listens and never uses `bal-button`/`bal-button-group`/`BalButton`/`BalButtonGroup`/`BalButtonBundle`, and that has no scanned `.html` of the same name beside it. Say so in the report.

### Methods

`bal-button` and `bal-button-group` declare no public methods, so there are no call sites to migrate or flag.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `color` rewritten from `tertiary` to `ghost`, called out by name so a reviewer does not read it as a mistake.
2. Every `color` rewritten from `light` to `tertiary`, called out by name.
3. Every `color` rewritten from `info` to `secondary`, called out by name.
4. Every `color` rewritten from `info-light` to `info`, called out by name.
5. Every `color` left as a non-literal expression for manual remapping, with the framework outcome (left in HTML, kept or removed (Unmapped) in React and Angular).
6. Every `element-type="submit"` with `name` or `value`, flagged "name/value no longer reach the submitted form data".
7. Every dropped `rounded`.
8. Every `isActive` on a navigation entry rewritten to `a11yCurrent`, flagged "the forced pressed look is gone", with the `color` binding that now marks the current entry, or "highlight not restored, non-literal `color`" when no binding was added. Every other `isActive` dropped, flagged "pressed look lost, check whether it was a toggle".
9. Every `href=""` that is now a `<button>` instead of an `<a>`.
10. One-time note: `loading` now also disables the button.
11. One-time note: files which only listen, and have no scanned `.html` of the same name beside them, were not scanned.
12. Every `bal-popup` trigger attribute left in place: the popup migration rewrites the trigger to `data-popup`. Until then the legacy `bal-popup` still reads it.
13. Every legacy type left and every bundle kept, as `SKILL.md` "Legacy types and bundles" describes: each `BalProps.BalButton*` type left in place, each legacy type argument kept because the Events table names no detail, and each multi-family bundle kept with `DsButton` or `DsButtonGroup` added next to it.

Coverage only, written to the file:

14. Every dropped `[balPopup]` or `balPopup={…}` binding.
15. Every numeric `value` written as a string, and every non-literal `value` binding with its outcome: copied, or removed (Unmapped).
16. Every `BalButtonBundle` expanded into `DsButton` and `DsButtonGroup`.
17. One-time note: `outlined` is inert on both sides.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
