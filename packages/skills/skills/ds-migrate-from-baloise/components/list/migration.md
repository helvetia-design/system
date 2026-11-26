# list

Migrate every `bal-list` usage to `ds-list`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has eight elements and the new side has two or three tags. `bal-list` becomes `ds-list` and `bal-list-item` becomes `ds-item`, not `ds-list-item`. A `bal-list-item accordion` is not a `ds-item`: it becomes `<li><ds-accordion list>` inside the `ds-list`. The other six have no `ds-*` equivalent and disappear into `ds-item` or `ds-accordion`: `bal-list-item-title` becomes the `label` prop, `bal-list-item-subtitle` becomes the `description` prop, `bal-list-item-icon` becomes `slot="icon"`, `bal-list-item-content` becomes `slot="content"`, `bal-list-item-accordion-head` becomes `slot="summary"` on `ds-accordion` with its props, and `bal-list-item-accordion-body` becomes `slot="content"` on `ds-accordion`. Leave slotted content in place, including legacy tags such as `bal-icon`, `bal-button`, and `bal-text`. Those belong to their own migrations.

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
- `accordion`, with `bal-list-item-accordion-head` and `bal-list-item-accordion-body` children: not a `ds-item`. It is a row: replace `<bal-list-item accordion>` with `<li>` and put `<ds-accordion list>` inside. See Accordion rows below.
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

### Accordion rows

An accordion item becomes `<li><ds-accordion list>`. The head content moves into `slot="summary"` and the body into `slot="content"`. Mixed lists are rewritten row by row: `ds-item` rows and `<li><ds-accordion list>` rows sit side by side in one `ds-list`. Report each mixed list.

- **Head, static title only:** `<span slot="summary">Title</span>`.
- **Head, anything else:** wrap the head's children (icon children, static title and subtitle text unwrapped from their legacy tags, content children) in order in one `<div slot="summary">`. A non-static title stays as an element inside that div and is reported.
- **Title `level="h1"` to `"h5"`:** copy it to `summary-level` on `ds-accordion`. When absent, apply the heading rule in `components/accordion/migration.md` and always report the `summary-level` reminder (default `h3`, the legacy title default was `h5`).
- **Title `visualLevel`:** drop it. `list` overrides the visual level. Report each one.
- **Body:** one element child takes `slot="content"`, otherwise wrap in `<div slot="content">`. A `bal-list` nested in the body becomes a `<ds-list>` wrapped in `<section slot="content">`, and its accordion items are rewritten by this same row rule. Never put `slot="content"` on the `ds-list` itself: in HTML, `innerHTML` and SSR the first nested `<li>` would close the outer `<li>`, because custom elements, `div`, `p` and `address` do not stop the `li` start-tag rule. `section` does.

```html
<!-- before -->
<bal-list-item accordion>
  <bal-list-item-accordion-head icon="plus">
    <bal-list-item-title>Coverage</bal-list-item-title>
  </bal-list-item-accordion-head>
  <bal-list-item-accordion-body><p>Details</p></bal-list-item-accordion-body>
</bal-list-item>

<!-- after -->
<li>
  <ds-accordion list marker="plus">
    <span slot="summary">Coverage</span>
    <p slot="content">Details</p>
  </ds-accordion>
</li>
```

### Props (`bal-list` to `ds-list`)

| old (`bal-list`) | new (`ds-list`) | handling |
| --- | --- | --- |
| `background="light"`, `background=""`, omitted | omit | Default on both sides. Drop the attribute. |
| `background="dark"` | `inverted` | HTML and Angular: write `inverted="true"`. React: write `inverted`. `ds-list` paints no background of its own, it only recolours text, borders, and focus for a dark surface. Report each one so the consumer supplies that surface. |
| `background="color"` | _(no equivalent value)_ | Drop `background`. Legacy painted a branded background on the list itself and `inverted` is not that. Do not pick a substitute. Report each one by file, line, and old value. |
| `size="large"` | `size="lg"` | Rename the value. Also rewrite `size='large'`, `size={"large"}`, and `size={'large'}`. |
| `size="small"` | _(no equivalent value)_ | Drop `size`. `ds-list` has only `lg` and the unset default. Do not pick a substitute. Report each one by file, line, and old value. |
| `size=""`, omitted | omit | Default. Drop the attribute. |
| `border`, `border="true"`, `border={true}` | _(no equivalent prop)_ | Drop it in every form. `ds-item` always draws a bottom divider. Report each dropped `border` as a rendering difference: lists that had none now show dividers. |
| `disabled` | _(no equivalent prop)_ | Drop it. The legacy prop only suppressed hover on the rows. `ds-item` `disabled` greys the row out and blocks the link or button, so it means something else, so do not map it. Report each dropped `disabled`. |
| `accordionOneLevel` / `accordion-one-level` | `group` | See Accordion groups below. |
| `[background]`, `[size]`, `[border]`, `size={x}` | see handling | Dynamic value. Do not guess the mapping. HTML: leave the binding unchanged and list the file and line in the report for manual review. React and Angular: `background` has no target with the same value type, because `inverted` is a boolean, and `border` has no target at all. Apply Unmapped props and handlers (`SKILL.md`) to both. Copy a `size` binding when the expression's type only admits `lg`. Otherwise apply Unmapped props and handlers (`SKILL.md`). The report names the new props: `inverted` (boolean), `ordered` (boolean), and `size` with the single value `lg`. |
| _(none)_ | `ordered` | New prop. `bal-list` always rendered an unordered list, so leave `ordered` unset. |

### Props (`bal-list-item` to `ds-item`)

| old (`bal-list-item`) | new (`ds-item`) | handling |
| --- | --- | --- |
| `href` non-empty | `href` | Copy the value and write `variant="link"`. See Shape. |
| `href=""`, omitted | omit | Legacy rendered a link for any non-undefined `href`, including the empty string. `ds-item` needs `variant`, so an empty `href` becomes a plain item. Report each `href=""`. |
| `target="_self"`, omitted | omit | Same default on both sides. |
| `target="_blank"` / `"_parent"` / `"_top"` | `target` | Copy as-is. Both sides accept the same four values. |
| `rel` | `rel` | Copy as-is. |
| `download` | `download` | Copy as-is, including the bare attribute form. Consider `action-icon="download"` per the icon rules below. |
| `clickable` without `href` | `variant="button"` | See Shape. |
| `clickable` together with `href` | `variant="link"` | `href` wins, as it did in the legacy render. Report each dropped `clickable`. |
| `disabled` | `disabled` | Copy as-is, in every form. Unlike `bal-list` `disabled`, this one means the same thing on both sides. |
| `accordion` | `<li><ds-accordion list>` | See Shape and Accordion rows. |
| `disabled` on an accordion row | _(no equivalent prop)_ | `ds-accordion` has no `disabled`. Apply Unmapped props and handlers (`SKILL.md`) and report it. |
| `selected` | _(no equivalent prop)_ | Apply Unmapped props and handlers (`SKILL.md`). `ds-item` has no selected state. |
| `subAccordionItem` / `sub-accordion-item` | _(no equivalent prop)_ | Apply Unmapped props and handlers (`SKILL.md`). Nesting is now a `ds-list` inside a `<section slot="content">` of the parent `ds-accordion`. |
| `[href]`, `[disabled]`, `[clickable]`, `href={x}` | see handling | Dynamic value. Do not guess the mapping. A bound `clickable` or `href` cannot be resolved to a static `variant` at scan time. HTML: leave the binding unchanged and list the file and line in the report for manual review. React and Angular: copy an `href` binding when the expression's type only admits a string, and a `disabled` binding when it only admits a boolean. `clickable` has no `ds-item` prop. Apply Unmapped props and handlers (`SKILL.md`) to it and to every binding whose type does not fit. The report says that the consumer sets `variant` by hand: `default`, `link`, or `button` (accordion rows are `<li><ds-accordion list>`). |
| _(none)_ | `inverted` | New per-item prop. `ds-list` `inverted` already cascades to its items, so leave it unset. |

### Props (`bal-list-item-title` to `label`)

| old (`bal-list-item-title`) | new (on `ds-item`) | handling |
| --- | --- | --- |
| static text child | `label="…"` | Lift the text onto the enclosing `ds-item` and drop the element. Collapse surrounding whitespace, keep the text otherwise verbatim. |
| interpolation, a binding, or nested markup | _(not lifted)_ | Leave the element untouched as a child of `ds-item` and report file and line. The label must be set by hand. |
| two or more titles in one item | _(ambiguous)_ | `ds-item` has one `label`. Report, do not rewrite. |
| `level="h5"`, omitted | omit `labelLevel` | Same default on both sides: `ds-item` renders `h5` when `labelLevel` is unset. |
| `level="h1"` to `"h4"` | `labelLevel` | Copy the value onto the enclosing `ds-item`. |
| `visualLevel="h1"` to `"h5"` | `labelSize` | Copy the value onto the enclosing `ds-item`. |
| `visualLevel="xxx-large"` / `"xx-large"` / `"x-large"` / `"large"` / `"normal"` | `labelSize="3xl"` / `"2xl"` / `"xl"` / `"lg"` / `"base"` | Rename the token, the same renames `components/heading/migration.md` applies to `visualLevel`. |
| `visualLevel="xxxxx-large"` / `"xxxx-large"` / `"medium"` | _(no equivalent value)_ | `labelSize` has no `5xl`, `4xl`, or `md`. Drop it. Do not pick a neighbouring size. Report each one by file, line, and old value. |
| `[level]`, `[visualLevel]`, `level={x}` | `labelLevel` / `labelSize` on the item | Dynamic value. Do not guess the mapping. When the title is lifted, rename the binding, keep the expression and move it onto the enclosing `ds-item`: `level` becomes `labelLevel` and `visualLevel` becomes `labelSize`. HTML: write the renamed binding and list the file and line in the report for manual review. React and Angular: write it when the expression's type only admits the new values. `labelLevel` takes `h1` to `h5`. `labelSize` takes `h1` to `h5`, `3xl`, `2xl`, `xl`, `lg`, and `base`. Otherwise apply Unmapped props and handlers (`SKILL.md`). The report names the value mapping for `labelSize`: `xxx-large` to `3xl`, `xx-large` to `2xl`, `x-large` to `xl`, `large` to `lg`, `normal` to `base`, and no value for `xxxxx-large`, `xxxx-large` and `medium`. |

### Props (`bal-list-item-subtitle` to `description`)

`bal-list-item-subtitle` has no props. A static text child becomes `description="…"` on the enclosing `ds-item` and the element is dropped. Content that is not static text is left in place and reported, under the same rule as the title. Two or more subtitles in one item is ambiguous: report, do not rewrite.

### Props (`bal-list-item-icon` to `slot="icon"`)

| old (`bal-list-item-icon`) | new (on `ds-item`) | handling |
| --- | --- | --- |
| the element, without `right` | `slot="icon"` | Move the children into the icon slot and drop the element. One element child takes the `slot` attribute; text or several children get a `div`. |
| `right` holding exactly one `<bal-icon name="download">`, on a link or button item | `action-icon="download"` | Delete the element and write the prop. This is the only trailing icon that maps mechanically. |
| `right` in any other form | _(no trailing slot)_ | `ds-item` has no trailing slot. Report, do not rewrite: leave the element as a child of `ds-item` and name the file, the line, and the icon. |
| `[right]="x"`, `right={x}` | see handling | Dynamic value. Do not guess the mapping. `right` has no `ds-item` target. HTML: leave the element and its binding unchanged as a child of `ds-item`, the same as `right` in any other form. React and Angular: migrate the element to `slot="icon"` like an element without `right`, and apply Unmapped props and handlers (`SKILL.md`) to the `right` binding. List the file and line in the report for manual review: a leading icon is `slot="icon"` and the only trailing values are `default`, `link`, `link-external`, and `download`. |

### Props (`bal-list-item-content` to `slot="content"`)

| old (`bal-list-item-content`) | new (on `ds-item`) | handling |
| --- | --- | --- |
| the element | `slot="content"` | Titles and subtitles inside it follow their own rules first. Every remaining child moves into the content slot and the element is dropped. |
| `contentAlignment` / `content-alignment` | _(no equivalent)_ | Drop it. `ds-item` has no alignment prop. Mention each dropped `contentAlignment` in the report. |
| markup interleaved around the title and subtitle | _(ambiguous)_ | Splitting it between `label`, `description`, and `slot="content"` is a judgement call. Report, do not rewrite. |
| two or more content elements in one item | _(ambiguous)_ | Report, do not rewrite. |

### Props (`bal-list-item-accordion-head`)

| old (`bal-list-item-accordion-head`) | new (on `ds-accordion`) | handling |
| --- | --- | --- |
| the element | `slot="summary"` | Drop the element. Its children follow Accordion rows. |
| `accordionOpen`, `accordion-open="true"` | `open` | HTML and Angular: write `open="true"`. React: write `open`. |
| `accordionOpen="false"`, omitted | omit | Default on both sides. |
| `icon="plus"` **or the attribute absent** | `marker="plus"` | The legacy default was `plus` and the new default marker is a caret, so write `marker="plus"` even when the attribute was absent. Report the ones that were implicit. |
| `icon="nav-go-down"` | omit `marker` | That is the new default caret. Write nothing. |
| _(none)_ | `markerPosition` | New prop. Legacy always put the marker on the right and so does the new default. Leave it unset. |

### Props (`bal-list-item-accordion-body`)

| old (`bal-list-item-accordion-body`) | new (on `ds-accordion`) | handling |
| --- | --- | --- |
| the element | `slot="content"` | Drop the element and slot its children. One element child takes the `slot` attribute; text or several children get a `div`. |
| `accordionGroup` / `accordion-group` | `group` | Hoist the value unchanged onto the enclosing `ds-accordion`. |
| `contentSpace` / `content-space` | _(no equivalent)_ | Drop it. `ds-accordion[list]` spaces slotted content itself. Mention each dropped `contentSpace` in the report. |
| `contentAlignment` | _(no equivalent)_ | Drop it. Mention each dropped `contentAlignment` in the report. |

### Accordion groups

`accordionOneLevel` on `bal-list` meant one open item at a time, propagated recursively to nested lists. `group` on `ds-accordion` does the same for every accordion that shares a group name, so the behaviour survives only if a name exists.

Take the name in this order: the body's own `accordionGroup` value when it has one, otherwise the list's own `id` or `data-testid`. When neither exists, report and do not rewrite. Say that `accordionOneLevel` was dropped and that the consumer must choose one `group` name and set it on every `ds-accordion` in that list.

Never invent a group name. The group is page-global, so two unrelated lists given the same generated name would close each other's accordions.

### Tags and imports

- **HTML**: `<bal-list>` becomes `<ds-list>` and `<bal-list-item>` becomes `<ds-item>`, including the closing tags. The other six tags are removed as described under Shape.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalList`, `BalListItem`, `BalListItemTitle`, `BalListItemSubtitle`, `BalListItemIcon`, `BalListItemContent`, `BalListItemAccordionHead`, `BalListItemAccordionBody`, or `BalListBundle` from `@baloise/ds-angular`, replace all of them with `import { DsList, DsItem } from '@helvetia-design/angular'`, plus `DsAccordion` when an accordion row was written, and leave the other symbols on the `@baloise` import. `BalListBundle` was an array of the eight legacy classes; in an `imports:` list it becomes `DsList, DsItem`, plus `DsAccordion` when used.
- **React**: `<BalList>` becomes `<DsList>` and `<BalListItem>` becomes `<DsItem>`, including the closing tags. The other six are removed as described under Shape. Import `DsList` and `DsItem` from `@helvetia-design/react`, plus `DsAccordion` when an accordion row was written (`<li><DsAccordion list>`). When the existing `@baloise/ds-react` import also binds other symbols, move only the `BalList*` symbols and leave the others on the `@baloise` import.

### Events

Rewrite only handlers that are attached to the `bal-list` or `bal-list-item` element being migrated. Never rewrite a handler on another element, and never rename these by search and replace across the file.

| old | new | handling |
| --- | --- | --- |
| `balNavigate` on a `clickable` item | `dsClick` | Rewrite `addEventListener('balNavigate'` to `addEventListener('dsClick'`. Angular: `(balNavigate)` becomes `(dsClick)`. React: `onBalNavigate` becomes `onDsClick`. Both details are a `MouseEvent`. |
| `balNavigate` on an `href` item | _(no equivalent)_ | `ds-item` wires `dsClick` only for `variant="button"`, so the handler would never fire on a link. Apply Unmapped props and handlers (`SKILL.md`). |
| `balAccordionChange` | `dsToggle` | Same shapes, and move the listener from the head onto the `ds-accordion`. Cross-reference `components/accordion/migration.md` Events. |
| event `detail` | object | Legacy sent the new open state as a boolean. `ds-accordion` sends `{ group, id, open }`. Every handler that used the value directly must read `.detail.open`. Report each handler. |
| `balGroupStateChanged` | _(no equivalent)_ | Removed. Apply Unmapped props and handlers (`SKILL.md`). |
| `balWillAnimate` | _(no equivalent)_ | Removed. `ds-accordion` emits nothing before the transition. Drop the binding and report it. |
| `balDidAnimate` | _(no equivalent)_ | Removed. `ds-accordion` emits nothing after the transition. Drop the binding and report it. |
| _(none)_ | `dsOpened`, `dsClosed` | New events on `ds-accordion`. Nothing to migrate from. |

### Methods

`present()`, `dismiss()`, and `toggle()` do not exist on `ds-accordion`. Calling them throws at runtime.

| old | new |
| --- | --- |
| `el.present()` | `el.open = true` |
| `el.dismiss()` | `el.open = false` |
| `el.toggle()` | `el.open = !el.open` |

The element reference must now point at the `ds-accordion`, not the row. See `components/accordion/migration.md` Methods. Unlike the legacy methods, assigning `open` emits no event. When the surrounding code relied on `balAccordionChange` firing afterwards, call the handler directly and report it.

`dismiss(true)` and `dismiss(false)` have no counterpart. `ds-accordion` has no `dismiss()` method, and `open` has no `ignoreNested` equivalent: nested items keep their own state. `configChanged()` was `@internal` and has no counterpart either. For both, apply Unmapped props and handlers (`SKILL.md`).

### Files to edit beyond the scan

In each file that has a finding, also rewrite `balNavigate`, `balAccordionChange`, `balGroupStateChanged`, `balWillAnimate`, and `balDidAnimate` listeners and `present()`, `dismiss()`, and `toggle()` calls that are not on the element itself, including `addEventListener`.

For every finding in a `.html` file, also open the file with the same name and a `.ts` extension in the same folder, and apply the Events and Methods rules there. That is the Angular case where the template holds the tag and the class file holds `@ViewChild` with `present()` or an event handler, and the class file never names `bal-list`. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

The scan does not list a file that only listens or only calls a method and never uses `bal-list` or `BalList`, and that has no scanned `.html` of the same name beside it. Say so in the report.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every title or subtitle left in place because it was not static text. The label must be set by hand.
2. Every dropped `href=""`. The item is now a plain item, not a link.
3. Every trailing icon left in place, with its file, line, and icon. `ds-item` has no trailing slot.
4. Every `background="dark"` turned into `inverted`. The consumer supplies the dark surface.
5. Every dropped `border`.
6. Every dropped `disabled`. The legacy prop only suppressed hover on the rows.
7. Every dropped `contentAlignment`.
8. Every `selected`, with its Unmapped props and handlers outcome.
9. Every `subAccordionItem`, with its Unmapped props and handlers outcome. Nesting is now a `ds-list` inside a `<section slot="content">` of the parent `ds-accordion`.
10. Every dynamic binding, with the framework outcome (copied, renamed or left in HTML, copied, renamed or removed (Unmapped) in React and Angular).
11. Every renamed event handler (`dsToggle`). A `balAccordionChange` handler that used the detail directly must now read `.detail.open`.
12. Every orphaned `balNavigate` or `balGroupStateChanged` handler, with its Unmapped props and handlers outcome.
13. Every rewritten `present()`, `dismiss()` or `toggle()` call. Assigning `open` emits no event.
14. Every `dismiss(true)`, `dismiss(false)` or `configChanged()` call, with its Unmapped props and handlers outcome.
15. Every dropped `background="color"`, with its file, line, and old value.
16. Every dropped `size="small"`, with its file, line, and old value.
17. Every unmappable `visualLevel` token, with its file, line, and old value.
18. Every `accordionOneLevel` dropped with no `group` name available, with the list that needs one.
19. Every type reference such as `BalProps.BalListSize` or `BalEvents.BalListAccordionChangeDetail` that the scan cannot see. These resolve from the ambient namespaces and stop compiling once `@baloise/ds-core` is removed from the project.
20. One-time note: `ds-item` always draws a bottom divider. Lists that had no `border` now show them.
21. Every migrated `clickable` or `href` item, which gains a trailing icon it did not have. A `link` or `button` item always renders a trailing icon, defaulting to `caret-right`, and no value switches it off.
22. Every list that relied on `background="dark"` or `background="color"`. `inverted` recolours text, borders, and focus but paints no background, so the list now needs that surface from the page.
23. One-time note: `ds-list` renders a real `ul` or `ol` in shadow DOM, so only `ds-item` or `li` elements belong as direct children. Anything else slotted there changes the list semantics.
24. Every accordion whose head had no visible text and now has no accessible name. The legacy accordion head carried a localised open and close `title` from its own translations in eleven languages, and `ds-accordion` has no translations.
25. Every selector that targets the legacy elements and that the scan cannot see. `ds-list` uses shadow DOM and exposes only `part="list"`. `ds-item` exposes the `part` values `item`, `label`, `description`, and `action-icon`. `ds-accordion` exposes `header`, `summary`, `marker`, and `content`. The legacy components rendered in the light DOM and set the classes `bal-list`, `bal-list--nested`, `bal-list--disabled`, `bal-list--border`, `bal-list--size-*`, `bal-list--background-*`, `bal-list__item` with its `disabled`, `selected`, `clickable`, `accordion`, `sub-accordion`, `animated`, `active`, `expanding`, `expanded`, `collapsing`, and `collapsed` modifiers, `bal-list__item__title`, `bal-list__item__subtitle`, `bal-list__item__icon`, `bal-list__item__icon--right`, `bal-list__item__content`, `bal-list__item__accordion-head`, `bal-list__item__accordion-head__icon`, `bal-list__item__accordion-body`, and `bal-list__item__accordion-body__content`. Styles and tests that query any of them break. Do not rewrite those selectors yourself. Report them.
26. One-time note: files which only listen or only call a method, and have no scanned `.html` of the same name beside them, were not scanned.
27. Every mixed list (`ds-item` rows and `<li><ds-accordion list>` rows in one `ds-list`).
28. Every accordion row with a `summary-level` to check: the default is `h3`, the legacy title default was `h5`. Match the heading outline.
29. Every dropped `disabled` on an accordion row. `ds-accordion` has no `disabled`.
30. Every dropped title `visualLevel` on an accordion row. `list` overrides the visual level.
31. Every accordion head whose subtitle, icon or content went into the summary with no description styling.

Coverage only, written to the file:

32. Every lifted `label` and `description`.
33. Every `clickable` or `href` turned into a variant.
34. Every dropped `clickable`.
35. Every trailing icon turned into `action-icon="download"`.
36. Every implicit `marker="plus"` written out.
37. Every hoisted `group`.
38. Every dropped `contentSpace`.
39. Every `bal-list-item accordion` rewritten to `<li><ds-accordion list>`.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
