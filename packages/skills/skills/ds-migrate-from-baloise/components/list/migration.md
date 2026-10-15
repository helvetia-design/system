# list

Migrate every `bal-list` usage to `ds-list`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has eight elements and the new side has two. `bal-list` becomes `ds-list` and `bal-list-item` becomes `ds-item`, not `ds-list-item`. The other six have no `ds-*` equivalent and disappear into `ds-item`: `bal-list-item-title` becomes the `label` prop, `bal-list-item-subtitle` becomes the `description` prop, `bal-list-item-icon` becomes `slot="icon"`, `bal-list-item-content` becomes `slot="content"`, `bal-list-item-accordion-head` becomes `variant="accordion"` with the accordion props, and `bal-list-item-accordion-body` becomes `slot="accordion-content"`. Leave slotted content in place, including legacy tags such as `bal-icon`, `bal-button`, and `bal-text`. Those belong to their own migrations.

Only static text is ever lifted into a prop. A title or a subtitle that contains interpolation, a framework binding, or any nested markup is left exactly where it is, as a child of the new `ds-item`, and reported by file and line. Never guess a label.

Read the Shape section before rewriting anything. A rewrite that only renames the two surviving tags leaves every title and subtitle behind as an unstyled child of `ds-item`, which renders but is no longer the item's label.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-list.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

The scan matches the eight legacy tags and their `BalList*` symbols, plus `BalListBundle`. It does not match the ambient type names `BalProps.BalListSize`, `BalProps.BalListBackground`, `BalProps.BalListContentAlignment`, `BalProps.BalListContentSpacing`, `BalProps.BalListItemTarget`, `BalProps.BalListItemAccordionHeadIcon`, or the `BalEvents.BalListItem*Detail` and `BalEvents.BalListAccordionChangeDetail` aliases. Those resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed, so they are a Report item, not a rewrite.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-list` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-list-item` (not just the scanned child tag) before deciding how to collapse it. This step is finished when every finding matches the mapping.

### Shape: six child tags collapse into props and slots

Decide the variant of each `bal-list-item` before writing any prop. The legacy component picked its rendered element the same way, and `href` was checked first.

- `href` is set and non-empty, with or without `clickable`: `variant="link"`. Report every `clickable` dropped this way.
- `clickable` without `href`: `variant="button"`.
- `accordion`, with `bal-list-item-accordion-head` and `bal-list-item-accordion-body` children: `variant="accordion"`.
- none of those: no `variant`, which is the `default`.

Then collapse the children. When a slot target has exactly one element child, put the `slot` attribute on that child instead of adding a wrapper `div`. When it has text or several children, wrap them in a `div`.

```html
<!-- before -->
<bal-list border background="dark">
  <bal-list-item clickable>
    <bal-list-item-icon><bal-icon name="account"></bal-icon></bal-list-item-icon>
    <bal-list-item-content>
      <bal-list-item-title level="h4">Policy number</bal-list-item-title>
      <bal-list-item-subtitle>12.345.678</bal-list-item-subtitle>
    </bal-list-item-content>
  </bal-list-item>
</bal-list>

<!-- after -->
<ds-list inverted="true">
  <ds-item variant="button" label="Policy number" description="12.345.678" label-level="h4">
    <bal-icon name="account" slot="icon"></bal-icon>
  </ds-item>
</ds-list>
```

A title or subtitle that is not static text is never lifted. It stays as a child of `ds-item` and is reported:

```html
<!-- before -->
<bal-list-item>
  <bal-list-item-title>{{ policy.name }}</bal-list-item-title>
</bal-list-item>

<!-- after -->
<ds-item>
  <bal-list-item-title>{{ policy.name }}</bal-list-item-title>
</ds-item>
```

An accordion item keeps its head content under the normal icon and content rules, and moves the body into `slot="accordion-content"`. A `bal-list` nested inside a `bal-list-item-accordion-body` becomes a `ds-list` carrying `slot="accordion-content"`.

```html
<!-- before -->
<bal-list-item accordion>
  <bal-list-item-accordion-head icon="plus">
    <bal-list-item-title>Coverage</bal-list-item-title>
  </bal-list-item-accordion-head>
  <bal-list-item-accordion-body><p>Details</p></bal-list-item-accordion-body>
</bal-list-item>

<!-- after -->
<ds-item variant="accordion" label="Coverage" accordion-marker="plus">
  <p slot="accordion-content">Details</p>
</ds-item>
```

### Props (`bal-list` to `ds-list`)

| old (`bal-list`)                                 | new (`ds-list`)         | handling                                                                                                                                                                                                                              |
| ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background="light"`, `background=""`, omitted   | omit                    | Default on both sides. Drop the attribute.                                                                                                                                                                                            |
| `background="dark"`                              | `inverted`              | HTML and Angular: write `inverted="true"`. React: write `inverted`. `ds-list` paints no background of its own, it only recolours text, borders, and focus for a dark surface. Report each one so the consumer supplies that surface.  |
| `background="color"`                             | _(no equivalent value)_ | Drop `background`. Legacy painted a branded background on the list itself and `inverted` is not that. Do not pick a substitute. Report each one by file, line, and old value.                                                         |
| `size="large"`                                   | `size="lg"`             | Rename the value. Also rewrite `size='large'`, `size={"large"}`, and `size={'large'}`.                                                                                                                                                |
| `size="small"`                                   | _(no equivalent value)_ | Drop `size`. `ds-list` has only `lg` and the unset default. Do not pick a substitute. Report each one by file, line, and old value.                                                                                                   |
| `size=""`, omitted                               | omit                    | Default. Drop the attribute.                                                                                                                                                                                                          |
| `border`, `border="true"`, `border={true}`       | _(no equivalent prop)_  | Drop it in every form. `ds-item` always draws a bottom divider. Report each dropped `border` as a rendering difference: lists that had none now show dividers.                                                                        |
| `disabled`                                       | _(no equivalent prop)_  | Drop it. The legacy prop only suppressed hover on the rows. `ds-item` `disabled` greys the row out and blocks the link or button, so it means something else, so do not map it. Report each dropped `disabled`.                       |
| `accordionOneLevel` / `accordion-one-level`      | `accordionGroup`        | See Accordion groups below.                                                                                                                                                                                                           |
| `[background]`, `[size]`, `[border]`, `size={x}` | leave the binding       | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary for manual review: the new props are `inverted` (boolean), `ordered` (boolean), and `size` with the single value `lg`. |
| _(none)_                                         | `ordered`               | New prop. `bal-list` always rendered an unordered list, so leave `ordered` unset.                                                                                                                                                     |

### Props (`bal-list-item` to `ds-item`)

| old (`bal-list-item`)                             | new (`ds-item`)        | handling                                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `href` non-empty                                  | `href`                 | Copy the value and write `variant="link"`. See Shape.                                                                                                                                                                                                                                   |
| `href=""`, omitted                                | omit                   | Legacy rendered a link for any non-undefined `href`, including the empty string. `ds-item` needs `variant`, so an empty `href` becomes a plain item. Report each `href=""`.                                                                                                             |
| `target="_self"`, omitted                         | omit                   | Same default on both sides.                                                                                                                                                                                                                                                             |
| `target="_blank"` / `"_parent"` / `"_top"`        | `target`               | Copy as-is. Both sides accept the same four values.                                                                                                                                                                                                                                     |
| `rel`                                             | `rel`                  | Copy as-is.                                                                                                                                                                                                                                                                             |
| `download`                                        | `download`             | Copy as-is, including the bare attribute form. Consider `action-icon="download"` per the icon rules below.                                                                                                                                                                              |
| `clickable` without `href`                        | `variant="button"`     | See Shape.                                                                                                                                                                                                                                                                              |
| `clickable` together with `href`                  | `variant="link"`       | `href` wins, as it did in the legacy render. Report each dropped `clickable`.                                                                                                                                                                                                           |
| `disabled`                                        | `disabled`             | Copy as-is, in every form. Unlike `bal-list` `disabled`, this one means the same thing on both sides.                                                                                                                                                                                   |
| `accordion`                                       | `variant="accordion"`  | See Shape.                                                                                                                                                                                                                                                                              |
| `selected`                                        | _(no equivalent prop)_ | Leave the attribute in place, do not drop it. `ds-item` has no selected state, so it has no effect after the migration, and in strictly typed React or Angular templates it may not compile. Flag every occurrence for manual review.                                                   |
| `subAccordionItem` / `sub-accordion-item`         | _(no equivalent prop)_ | Leave the attribute in place, do not drop it. Nesting is now a `ds-list` inside `slot="accordion-content"`, so it has no effect after the migration, and in strictly typed React or Angular templates it may not compile. Flag every occurrence for manual review.                      |
| `[href]`, `[disabled]`, `[clickable]`, `href={x}` | leave the binding      | Dynamic value. Do not guess the mapping. A bound `clickable` or `href` cannot be resolved to a static `variant` at scan time. Leave the binding unchanged and list the file and line in the summary for manual review: the new values are `default`, `link`, `button`, and `accordion`. |
| _(none)_                                          | `inverted`             | New per-item prop. `ds-list` `inverted` already cascades to its items, so leave it unset.                                                                                                                                                                                               |

### Props (`bal-list-item-title` to `label`)

| old (`bal-list-item-title`)                                                     | new (on `ds-item`)                                       | handling                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| static text child                                                               | `label="…"`                                              | Lift the text onto the enclosing `ds-item` and drop the element. Collapse surrounding whitespace, keep the text otherwise verbatim.                                                                                                         |
| interpolation, a binding, or nested markup                                      | _(not lifted)_                                           | Leave the element untouched as a child of `ds-item` and report file and line. The label must be set by hand.                                                                                                                                |
| two or more titles in one item                                                  | _(ambiguous)_                                            | `ds-item` has one `label`. Report, do not rewrite.                                                                                                                                                                                          |
| `level="h5"`, omitted                                                           | omit `labelLevel`                                        | Same default on both sides: `ds-item` renders `h5` when `labelLevel` is unset.                                                                                                                                                              |
| `level="h1"` to `"h4"`                                                          | `labelLevel`                                             | Copy the value onto the enclosing `ds-item`.                                                                                                                                                                                                |
| `visualLevel="h1"` to `"h5"`                                                    | `labelSize`                                              | Copy the value onto the enclosing `ds-item`.                                                                                                                                                                                                |
| `visualLevel="xxx-large"` / `"xx-large"` / `"x-large"` / `"large"` / `"normal"` | `labelSize="3xl"` / `"2xl"` / `"xl"` / `"lg"` / `"base"` | Rename the token, the same renames `components/heading/migration.md` applies to `visualLevel`.                                                                                                                                              |
| `visualLevel="xxxxx-large"` / `"xxxx-large"` / `"medium"`                       | _(no equivalent value)_                                  | `labelSize` has no `5xl`, `4xl`, or `md`. Drop it. Do not pick a neighbouring size. Report each one by file, line, and old value.                                                                                                           |
| `[level]`, `[visualLevel]`, `level={x}`                                         | leave the binding                                        | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary for manual review: `labelLevel` takes `h1` to `h5` and `labelSize` takes `h1` to `h5`, `3xl`, `2xl`, `xl`, `lg`, and `base`. |

### Props (`bal-list-item-subtitle` to `description`)

`bal-list-item-subtitle` has no props. A static text child becomes `description="…"` on the enclosing `ds-item` and the element is dropped. Content that is not static text is left in place and reported, under the same rule as the title. Two or more subtitles in one item is ambiguous: report, do not rewrite.

### Props (`bal-list-item-icon` to `slot="icon"`)

| old (`bal-list-item-icon`)                                                         | new (on `ds-item`)       | handling                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| the element, without `right`                                                       | `slot="icon"`            | Move the children into the icon slot and drop the element. One element child takes the `slot` attribute; text or several children get a `div`.                                                                                                         |
| `right` holding exactly one `<bal-icon name="download">`, on a link or button item | `action-icon="download"` | Delete the element and write the prop. This is the only trailing icon that maps mechanically.                                                                                                                                                          |
| `right` in any other form                                                          | _(no trailing slot)_     | `ds-item` has no trailing slot. Report, do not rewrite: leave the element as a child of `ds-item` and name the file, the line, and the icon.                                                                                                           |
| `[right]="x"`, `right={x}`                                                         | leave the binding        | Dynamic value. Do not guess the mapping. Leave the binding unchanged and list the file and line in the summary for manual review: a leading icon is `slot="icon"` and the only trailing values are `default`, `link`, `link-external`, and `download`. |

### Props (`bal-list-item-content` to `slot="content"`)

| old (`bal-list-item-content`)                    | new (on `ds-item`) | handling                                                                                                                                   |
| ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| the element                                      | `slot="content"`   | Titles and subtitles inside it follow their own rules first. Every remaining child moves into the content slot and the element is dropped. |
| `contentAlignment` / `content-alignment`         | _(no equivalent)_  | Drop it. `ds-item` has no alignment prop. Mention each dropped `contentAlignment` in the summary.                                          |
| markup interleaved around the title and subtitle | _(ambiguous)_      | Splitting it between `label`, `description`, and `slot="content"` is a judgement call. Report, do not rewrite.                             |
| two or more content elements in one item         | _(ambiguous)_      | Report, do not rewrite.                                                                                                                    |

### Props (`bal-list-item-accordion-head`)

| old (`bal-list-item-accordion-head`)      | new (on `ds-item`)        | handling                                                                                                                                                                        |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the element                               | `variant="accordion"`     | Drop the element. Its children follow the icon, title, subtitle, and content rules.                                                                                             |
| `accordionOpen`, `accordion-open="true"`  | `accordionOpen`           | HTML and Angular: write `accordion-open="true"`. React: write `accordionOpen`.                                                                                                  |
| `accordionOpen="false"`, omitted          | omit                      | Default on both sides.                                                                                                                                                          |
| `icon="plus"` **or the attribute absent** | `accordionMarker="plus"`  | The legacy default was `plus` and the new default marker is a caret, so write `accordion-marker="plus"` even when the attribute was absent. Report the ones that were implicit. |
| `icon="nav-go-down"`                      | omit `accordionMarker`    | That is the new default caret. Write nothing.                                                                                                                                   |
| _(none)_                                  | `accordionMarkerPosition` | New prop. Legacy always put the marker on the right and so does the new default. Leave it unset.                                                                                |

### Props (`bal-list-item-accordion-body`)

| old (`bal-list-item-accordion-body`) | new (on `ds-item`)         | handling                                                                                                                    |
| ------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| the element                          | `slot="accordion-content"` | Drop the element and slot its children. One element child takes the `slot` attribute; text or several children get a `div`. |
| `accordionGroup` / `accordion-group` | `accordionGroup`           | Hoist the value unchanged onto the enclosing `ds-item`.                                                                     |
| `contentSpace` / `content-space`     | _(no equivalent)_          | Drop it. `ds-item` spaces slotted content itself. Mention each dropped `contentSpace` in the summary.                       |
| `contentAlignment`                   | _(no equivalent)_          | Drop it. Mention each dropped `contentAlignment` in the summary.                                                            |

### Accordion groups

`accordionOneLevel` on `bal-list` meant one open item at a time, propagated recursively to nested lists. `accordionGroup` on `ds-item` does the same for every item that shares a group name, so the behaviour survives only if a name exists.

Take the name in this order: the body's own `accordionGroup` value when it has one, otherwise the list's own `id` or `data-testid`. When neither exists, report and do not rewrite. Say that `accordionOneLevel` was dropped and that the consumer must choose one `accordion-group` name and set it on every accordion `ds-item` in that list.

Never invent a group name. The group is page-global, so two unrelated lists given the same generated name would close each other's items.

### Tags and imports

- **HTML**: `<bal-list>` becomes `<ds-list>` and `<bal-list-item>` becomes `<ds-item>`, including the closing tags. The other six tags are removed as described under Shape.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalList`, `BalListItem`, `BalListItemTitle`, `BalListItemSubtitle`, `BalListItemIcon`, `BalListItemContent`, `BalListItemAccordionHead`, `BalListItemAccordionBody`, or `BalListBundle` from `@baloise/ds-angular`, replace all of them with `import { DsList, DsItem } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. `BalListBundle` was an array of the eight legacy classes; in an `imports:` list it becomes `DsList, DsItem`.
- **React**: `<BalList>` becomes `<DsList>` and `<BalListItem>` becomes `<DsItem>`, including the closing tags. The other six are removed as described under Shape. Import `DsList` and `DsItem` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only the `BalList*` symbols and leave the others on the `@baloise` import.

### Events

Rewrite only handlers that are attached to the `bal-list` or `bal-list-item` element being migrated. Never rewrite a handler on another element, and never rename these by search and replace across the file.

| old                                 | new                                      | handling                                                                                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balNavigate` on a `clickable` item | `dsClick`                                | Rewrite `addEventListener('balNavigate'` to `addEventListener('dsClick'`. Angular: `(balNavigate)` becomes `(dsClick)`. React: `onBalNavigate` becomes `onDsClick`. Both details are a `MouseEvent`.                      |
| `balNavigate` on an `href` item     | _(no equivalent)_                        | `ds-item` wires `dsClick` only for `variant="button"`, so the handler would never fire on a link. Do not rewrite or remove the handler. List each one by file and line as "event no longer emitted, needs manual rework". |
| `balAccordionChange`                | `dsAccordionToggle`                      | Same shapes, and move the listener from the head onto the `ds-item`.                                                                                                                                                      |
| event `detail`                      | object                                   | Legacy sent the new open state as a boolean. `ds-item` sends `{ group, id, open }`. Every handler that used the value directly must read `.detail.open`. Report each handler.                                             |
| `balGroupStateChanged`              | _(no equivalent)_                        | Removed. Do not rewrite or remove the handler. List each one by file and line as "event no longer emitted, needs manual rework".                                                                                          |
| `balWillAnimate`                    | _(no equivalent)_                        | Removed. `ds-item` emits nothing before the transition. Drop the binding and report it.                                                                                                                                   |
| `balDidAnimate`                     | _(no equivalent)_                        | Removed. `ds-item` emits nothing after the transition. Drop the binding and report it.                                                                                                                                    |
| _(none)_                            | `dsAccordionOpened`, `dsAccordionClosed` | New events. Nothing to migrate from.                                                                                                                                                                                      |

### Methods

`present()`, `dismiss()`, and `toggle()` do not exist on `ds-item`. Calling them throws at runtime.

| old            | new                                    |
| -------------- | -------------------------------------- |
| `el.present()` | `el.accordionOpen = true`              |
| `el.dismiss()` | `el.accordionOpen = false`             |
| `el.toggle()`  | `el.accordionOpen = !el.accordionOpen` |

Unlike the legacy methods, assigning `accordionOpen` emits no event. When the surrounding code relied on `balAccordionChange` firing afterwards, call the handler directly and report it.

`dismiss(true)` and `dismiss(false)` lose the `ignoreNested` argument: nested items keep their own state. `configChanged()` was `@internal` and is not a consumer API. For both, list each call by file and line as "method no longer available, needs manual rework".

### Files to edit beyond the scan

In each file that has a finding, also rewrite `balNavigate`, `balAccordionChange`, `balGroupStateChanged`, `balWillAnimate`, and `balDidAnimate` listeners and `present()`, `dismiss()`, and `toggle()` calls that are not on the element itself, including `addEventListener`.

For every finding in a `.html` file, also open the file with the same name and a `.ts` extension in the same folder, and apply the Events and Methods rules there. That is the Angular case where the template holds the tag and the class file holds `@ViewChild` with `present()` or an event handler, and the class file never names `bal-list`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

The scan does not list a file that only listens or only calls a method and never uses `bal-list` or `BalList`, and that has no scanned `.html` of the same name beside it. Say so in the report.

## 4. Report

Print a per-file summary of what changed, including every lifted `label` and `description`, every title or subtitle left in place because it was not static text, every `clickable` or `href` turned into a variant, every dropped `clickable` and `href=""`, every trailing icon turned into `action-icon="download"` and every one left in place, every implicit `accordion-marker="plus"` written out, every hoisted `accordion-group`, every `background="dark"` turned into `inverted`, every dropped `border`, `disabled`, `contentAlignment`, and `contentSpace`, every flagged `selected` and `subAccordionItem`, every dynamic binding left for the caller, every renamed and every orphaned event handler, and every rewritten method call.

Also list each loss:

- every dropped `background="color"`, `size="small"`, and unmappable `visualLevel` token, with its file, line, and old value
- every `accordionOneLevel` dropped with no group name available, with the list that needs one
- every type reference such as `BalProps.BalListSize` or `BalEvents.BalListAccordionChangeDetail` that the scan cannot see. These resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed from the project

Also report these rendering differences, so the consumer can check them. Do not add attributes to compensate:

- **Dividers.** `ds-item` always draws a bottom divider. Lists that had no `border` now show them.
- **Trailing caret.** A `link` or `button` item always renders a trailing icon, defaulting to `caret-right`. There is no value that switches it off, so every migrated `clickable` or `href` item gains an icon it did not have.
- **No surface.** `inverted` recolours text, borders, and focus but paints no background. A list that relied on `background="dark"` or `background="color"` now needs that surface from the page.
- **List semantics.** `ds-list` renders a real `ul` or `ol` in shadow DOM and `ds-item` carries the matching role, so only `ds-item` belongs as a direct child. Anything else slotted there changes the list semantics.
- **Accessible name.** The legacy accordion head carried a localised open and close `title` from its own translations in eleven languages. `ds-item` has no translations, so an accordion whose head had no visible text now has no accessible name. Report every one of these.
- **Lost selectors.** `ds-list` uses shadow DOM and exposes only `part="list"`; `ds-item` exposes `part` values `item`, `label`, `description`, `accordion`, `accordion-content`, and `action-icon`. The legacy components rendered in the light DOM and set the classes `bal-list`, `bal-list--nested`, `bal-list--disabled`, `bal-list--border`, `bal-list--size-*`, `bal-list--background-*`, `bal-list__item` with its `disabled`, `selected`, `clickable`, `accordion`, `sub-accordion`, `animated`, `active`, `expanding`, `expanded`, `collapsing`, and `collapsed` modifiers, `bal-list__item__title`, `bal-list__item__subtitle`, `bal-list__item__icon`, `bal-list__item__icon--right`, `bal-list__item__content`, `bal-list__item__accordion-head`, `bal-list__item__accordion-head__icon`, `bal-list__item__accordion-body`, and `bal-list__item__accordion-body__content`. Styles and tests that query any of them break. Do not rewrite those selectors yourself. Report them.

End with the note that files which only listen or only call a method, and have no scanned `.html` of the same name beside them, were not scanned. Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
