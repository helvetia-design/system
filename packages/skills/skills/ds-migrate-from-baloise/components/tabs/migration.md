# tabs

Migrate every `bal-tabs` usage to `ds-tabs`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one child, `bal-tab-item`. It is part of this migration, but it does not map one-to-one. `bal-tab-item` was tab header and panel content in one element. `ds-tabs` splits them into `ds-tab` (header) and `ds-tab-panel` (content), or drops the panel in navigation mode.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-tabs.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-tabs` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element, including its `bal-tab-item` children, when attributes or children continue past the snippet's first line. This step is finished when every finding matches the mapping or is left in place and reported.

When a finding is in an Angular `x.component.html`, also open the `x.component.ts` with the same basename. The class often calls `select()` or `getOptionByValue()` or handles `balChange` without naming the tag, so the scan cannot see it.

### Groups left in place

Decide per `bal-tabs` group before editing anything in it. A `bal-tabs` nested inside a `bal-tab-item` is its own group: decide for the innermost group first, then the outer one. Leave the whole group unchanged, including its tag, and report it, when any of these is true:

- It has an `accordion` attribute. `ds-tabs` cannot open and close its items. `ds-accordion` is the replacement, see `components/accordion/migration.md`.
- It has an `options` attribute. `ds-tabs` builds its tabs from `ds-tab` children, so the tabs and panels must be rebuilt as children by hand. The whole group stays `bal-*`, including the `bal-tabs` tag.
- Any `bal-tab-item` has a static `disabled` or `invisible` (a bare attribute, `true`, `"true"` or `{true}`), or a dynamic one. `ds-tab` supports neither, so deleting the attribute would enable or show the tab without a warning.
- It has `handleAsTabList` and a `bal-tab-item` with `href`. Legacy treated that group as a tab list of links. `ds-tabs` is either panels or navigation, never both.
- Its items are mixed, some with `href` and some without. `ds-tabs` cannot mix the modes.
- A loop produces its items and the loop body cannot be mapped: spread props, a component other than `BalTabItem` / `bal-tab-item`, conditional rendering of the item, an `href` present on only some iterations, or a dynamic label in an unsupported form.
- A `bal-tab-item` without `href` has no `value`. In panels mode it has nothing to link, so do not invent a name. Navigation mode takes a slug of the `label` instead, see Navigation mode.
- A `bal-tab-item` has a dynamic label that the rules in Panels mode cannot rewrite.
- A `bal-tab-item` has a dynamic `active` and `bal-tabs` has no `value`. Without a `value` there is nothing to keep, and `ds-tabs` cannot take an expression from `active`.

A group left in place is never half migrated. The parent tag and every item stay `bal-*`, so a `ds-tabs` without `ds-tab` children is never produced. Report the group with file, line and the reason.

### Two modes

`ds-tabs` decides its mode by its children. With `ds-tab-panel` children it is in **panels mode**. Without them it is in **navigation mode**. For a group that is not left in place:

- No `bal-tab-item` has `href`: panels mode.
- Every `bal-tab-item` has `href`: navigation mode.

### Panels mode

Split each static `bal-tab-item` into a `ds-tab` and a `ds-tab-panel`. Put the `ds-tab` elements first, then the `ds-tab-panel` elements, as direct children of `ds-tabs`. Keep the order.

```html
<bal-tabs value="b">
  <bal-tab-item value="a" label="One">Content A</bal-tab-item>
  <bal-tab-item value="b" label="Two">Content B</bal-tab-item>
</bal-tabs>
```

becomes

```html
<ds-tabs value="b">
  <ds-tab name="a">One</ds-tab>
  <ds-tab name="b">Two</ds-tab>
  <ds-tab-panel for="a">Content A</ds-tab-panel>
  <ds-tab-panel for="b">Content B</ds-tab-panel>
</ds-tabs>
```

The old `value` becomes `name` on the `ds-tab` and `for` on its `ds-tab-panel`. Keep the value form (`value="a"`, `value={id}`, `[value]="id"`) on both.

`ds-tab` has no `label` prop. The old `label` becomes the text content of the `ds-tab`. A static `label="One"` becomes `One`. A dynamic label is rewritten only where the syntax is unambiguous: Angular `[label]="expr"` becomes `{{ expr }}`, Vue `:label="expr"` becomes `{{ expr }}`, React `label={expr}` becomes `{expr}`. Any other dynamic form keeps the whole group in place and is reported.

Leave the content of the item as the content of the panel. In a group where some items have content, an item with `noPanel`, or with no content, gets a `ds-tab` and no panel. Clicking that tab selects it and hides every panel, so report each `noPanel` item. A group where no item has content is a different case, see Panels mode without content.

### Items built in a loop

A loop over `bal-tab-item` is rewritten together with its parent. Never rename only the parent. `ds-tabs` builds its state from direct `ds-tab` children, so a `ds-tabs` that still holds `bal-tab-item` loops would be empty.

- **React `.map()`**: the one `.map()` becomes two. The first produces `DsTab`, the second, over the same source, produces `DsTabPanel`. The content of the loop body becomes the content of the panel, and the panel is empty when the item had no content. Keep `key` on both.
- **Angular `*ngFor` and `@for`**: repeat the loop once for the tabs and once for the panels. Keep `trackBy` and `track`.
- **Vue `v-for`**: repeat the loop once for the tabs and once for the panels. Keep `:key`.

Static items and loop items in one group keep their order. All tabs come first, then all panels. Props map as in the static case. A prop without an equivalent, such as `icon` or `bubble`, is deleted and reported. It does not block the rewrite. A loop whose items all have `href` is navigation mode: it becomes one `ds-tab` loop that wraps an `<a>`, with no panel loop. A loop that cannot be mapped keeps its whole group in place, see Groups left in place.

```tsx
<BalTabs value={tab} onBalChange={event => setParam('tab', String(event.detail ?? x))}>
  {profileTabs.map(entry => (
    <BalTabItem key={entry.value} value={entry.value} label={entry.label} icon={entry.icon} />
  ))}
</BalTabs>
```

becomes

```tsx
<DsTabs value={tab} onDsChange={event => setParam('tab', String(event.detail.value ?? x))}>
  {profileTabs.map(entry => (
    <DsTab key={entry.value} name={entry.value}>
      {entry.label}
    </DsTab>
  ))}
  {profileTabs.map(entry => (
    <DsTabPanel key={entry.value} for={entry.value} />
  ))}
</DsTabs>
```

The deleted `icon` is reported. The panels are empty because the items had no content, see the next section.

### Panels mode without content

When no item has `href` and no item has content (every item is empty or has `noPanel`), the app renders its content itself from `value`. Produce one empty `ds-tab-panel` per item, with `for` set to the item name. This keeps `ds-tabs` in panels mode, so the tabs stay clickable and `dsChange` fires. Without any panel `ds-tabs` is in navigation mode, where tabs are not clickable and `dsChange` never fires. This is the supported pattern for state-driven tabs.

```html
<bal-tabs value="a">
  <bal-tab-item value="a" label="One"></bal-tab-item>
  <bal-tab-item value="b" label="Two"></bal-tab-item>
</bal-tabs>
```

becomes

```html
<ds-tabs value="a">
  <ds-tab name="a">One</ds-tab>
  <ds-tab name="b">Two</ds-tab>
  <ds-tab-panel for="a"></ds-tab-panel>
  <ds-tab-panel for="b"></ds-tab-panel>
</ds-tabs>
```

Report each such group with two notes. The selected empty panel keeps its padding, so set `--tab-panel-p` to `0` when it shows. The `aria-controls` of each tab points at an empty panel, not at the content the app renders. A group where some items have content keeps the `noPanel` rule above.

### Navigation mode

Rewrite each `bal-tab-item` with `href` to a `ds-tab` that wraps an `<a>`. There is no panel. `ds-tab` still requires a `name`, so take it from the old `value`. When the item has none, use a unique slug of the `label`. Navigation mode does not otherwise read it, so a generated one is harmless here.

```html
<bal-tabs>
  <bal-tab-item label="One" href="/one"></bal-tab-item>
  <bal-tab-item label="Two" href="/two" target="_blank" rel="noopener"></bal-tab-item>
</bal-tabs>
```

becomes

```html
<ds-tabs>
  <ds-tab name="one"><a href="/one">One</a></ds-tab>
  <ds-tab name="two"><a href="/two" target="_blank" rel="noopener">Two</a></ds-tab>
</ds-tabs>
```

The text of the `<a>` is the old `label`, with the same dynamic-label rule as in panels mode. `href`, `target` and `rel` move to the `<a>`. Do not set `aria-current`. The consumer's router sets it, and `ds-tabs` reads it from the slotted `<a>` to find the selected tab. Report each navigation group so the consumer checks that.

### Props on `bal-tabs`

| old (`bal-tabs`) | new (`ds-tabs`) | handling |
| --- | --- | --- |
| `value` | `value` | Copy as-is. It is the `name` of the selected `ds-tab`, which equals the old item `value`. A dynamic value stays untouched. Navigation mode ignores it, so say that in the report. |
| `fullwidth` | `fullwidth` | Copy as-is. |
| `inverted` | `inverted` | Copy as-is. |
| `verticalColSize` | `verticalColSize` | Copy as-is. The values are the same. |
| `vertical`, `vertical="true"`, `[vertical]="true"`, `vertical={true}` or any boolean expression | `vertical` | Copy as-is. |
| `vertical="mobile"` / `"tablet"` | _(no equivalent)_ | Delete the attribute. `ds-tabs` is vertical at every width or never. Mention each one as a visual change. |
| `optionalTabSelection` | _(no equivalent)_ | Delete the attribute. Report it as a functional change: `ds-tabs` selects the first tab when `value` is not set, so "no tab selected" is gone. |
| `clickable` | _(no equivalent)_ | Delete the attribute. Report it as a functional change when it was `false`. |
| `accordion`, `options` | _(no equivalent)_ | The group stays in place. See Groups left in place. |
| `float`, `overflow`, `context`, `iconPosition`, `expanded`, `spaceless`, `border`, `debounce`, `selectOnMobile`, `dimInactiveElements` | _(no equivalent)_ | Delete the attribute. Mention each one as a visual change. Do not map `expanded` to `fullwidth`: the legacy meaning is not the same. Do not pick a replacement. |
| `handleAsTabList` | _(no equivalent)_ | Without `href` items, delete it and mention it. With `href` items the group stays in place. |
| _(none)_ | `color`, `label` | New props. Nothing to migrate from. Leave `color` unset. In navigation mode, suggest a `label` (see Report). |

### Props on `bal-tab-item`

| old (`bal-tab-item`) | new | handling |
| --- | --- | --- |
| `value` | `name` (and `for` on the panel) | See Panels mode. |
| `label` | text content of the `ds-tab` | See Panels mode and Navigation mode. |
| `href`, `rel`, `target` | on the slotted `<a>` | See Navigation mode. |
| `noPanel` | no `ds-tab-panel` | See Panels mode. |
| `active` | `value` on `ds-tabs` | Panels mode, static `active`: when `bal-tabs` has no `value`, set `value` to this item's `name` and delete `active`. When it has one, the old code let `active` win, but keep the `value`, delete `active`, and report the conflict. Dynamic `active` with a `value` on `bal-tabs`: delete `active`, keep `value`, and report that the consumer checks that `value` matches the item that was active. Dynamic `active` without a `value`: the group stays in place. Navigation mode: delete `active` and report it, the router sets `aria-current`. |
| `icon`, `svg`, `bubble`, `subLabel`, `a11yControls`, `prevent` | _(no equivalent)_ | Delete the attribute, also in a loop. Mention each one. The slotted `<a>` is left to the consumer's router. |
| `disabled`, `invisible` | _(no equivalent)_ | A static `true` keeps the group in place, see Groups left in place. `false` is deleted. A dynamic value keeps the group in place and the group is reported. |
| `balNavigate`, `balKeyDown` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). In the report, say that the router or a click handler on the `<a>` replaces it. |
| `getOptions()`, `setActive()` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). When the code uses the result, the placeholder type is `BalTabOption` for `getOptions()` and `void` for `setActive()`, the legacy return types without the `Promise`. |

### Tags and imports

- **HTML**: `<bal-tabs>` becomes `<ds-tabs>`, including the closing tag. `bal-tab-item` is rewritten as described in the two modes.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalTabs`, `BalTabItem` or `BalTabsBundle` from `@baloise/ds-angular`, replace all of them with `import { DsTabs, DsTab, DsTabPanel } from '@helvetia-design/angular'`, listing only the symbols the file's templates now use (navigation mode needs no `DsTabPanel`, the panels mode without content does). Leave the other symbols on the `@baloise` import. `BalTabsBundle` was an array of both legacy classes. In an `imports:` list it becomes the same symbols.
- **React**: `<BalTabs>` becomes `<DsTabs>` and `</BalTabs>` becomes `</DsTabs>`. `BalTabItem` is rewritten as in the two modes, to `DsTab` and `DsTabPanel`, also for the pattern without content. Import only the used symbols from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalTabs` and `BalTabItem` and leave the rest on the `@baloise` import.
- **Types**: `BalTabOption` has no equivalent, because there is no `options` prop. Leave it in place and report it.

When a group is left in place, its imports stay on `@baloise` too.

### Events and methods

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| event `detail` | `event.detail.value` | Legacy `detail` was the tab `value` string. `dsChange` `detail` is `{ value }`. See Reading `detail` below. |
| `dsChange` timing | see handling | `dsChange` fires on a user click or key press only, in panels mode only. Setting `value` in code does not emit it. Mention every `balChange` listener that relied on a programmatic change. |
| `balWillAnimate`, `balDidAnimate` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). |
| `select(tab)` | `value` | Set `value` on `ds-tabs` to the tab's `value`. React: `ref.current.value = tab.value`, or set the state variable that feeds `value` when the element is controlled. Angular: set the property bound to `[value]`, or `el.value = ...`. HTML: `el.value = ...`. Setting `value` does not emit `dsChange`. |
| `getOptionByValue(value)` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). When the code uses the result, the placeholder type is `BalTabOption`, the legacy return type without the `Promise`. |
| `renderLine()`, `closeAccordion()` | _(no equivalent)_ | Apply Unmapped props and handlers (`SKILL.md`). When the code uses the result, the placeholder type is `void`, the legacy return type without the `Promise`. |
| _(none)_ | `dsTabSelect` | Internal event from `ds-tab`. Nothing to migrate from. Leave it unset. |

Rewrite `balChange` listeners only on a migrated element. `balChange` is emitted by many other legacy components, so never rewrite a listener on an element you did not migrate. The scan does not list a file that only listens and never uses `bal-tabs`, `bal-tab-item`, `BalTabs`, `BalTabItem`, `BalTabsBundle` or `BalTabOption`.

#### Reading `detail`

When the handler body is in the same file, rewrite every read of `event.detail` to `event.detail.value`. That covers an inline arrow, a named function, an Angular class method bound by `(balChange)` (open the sibling `.ts`) and an `addEventListener` callback. Examples:

- `String(event.detail ?? x)` becomes `String(event.detail.value ?? x)`.
- `({ detail }) => f(detail)` becomes `({ detail }) => f(detail.value)`.
- Angular `(balChange)="onTab($event.detail)"` becomes `(dsChange)="onTab($event.detail.value)"`.

When the handler parameter carries the legacy type, such as `CustomEvent<string>` or `BalTabsCustomEvent<string>`, change it to `CustomEvent<{ value: string }>`, otherwise `detail.value` fails to typecheck. An inline JSX arrow takes its type from `onDsChange` and needs no annotation.

A handler defined in another file, or passed through as a prop or variable whose body you cannot see, stays as it is and is reported. The same holds for a handler that is also bound to an element you did not migrate, such as a group left in place or another component's `balChange`. Rewriting it would break that binding, so leave it and report it.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every navigation group, with the `aria-current` the router must set.
2. Every deleted `vertical="mobile"` and `vertical="tablet"`, as a visual change.
3. Every deleted `optionalTabSelection`, as a functional change. `ds-tabs` selects the first tab when `value` is not set.
4. Every deleted `clickable`, as a functional change when it was `false`.
5. Every deleted `prevent`. The slotted `<a>` is left to the consumer's router.
6. Every deleted `icon`, `svg`, `bubble` and `subLabel`, also inside a loop.
7. Every deleted `a11yControls`.
8. Every deleted layout prop, as a visual change.
9. Every static `active` dropped because `value` was set.
10. Every dynamic `active` dropped. The consumer checks that `value` matches the item that was active.
11. Every group migrated without content (empty `ds-tab-panel` per item), with two notes. The selected empty panel keeps its padding, so set `--tab-panel-p` to `0` if it shows. The `aria-controls` of each tab points at an empty panel, not at the content the app renders.
12. Every `balChange` handler whose body is in another file, is not visible, or is also bound to an element that was not migrated, so its `detail` reads were not rewritten to `detail.value`. Name file and line.
13. Every `balChange` listener that relied on a programmatic change. `dsChange` fires on a user click or key press only.
14. Every group left in place because of `accordion`. Point to `ds-accordion`. Name file and line.
15. Every group left in place because of `options`, the whole group including the `bal-tabs` tag. Name file and line.
16. Every group left in place because of a static or dynamic `disabled` or `invisible` item. Name file and line.
17. Every group left in place because of `handleAsTabList` with `href`. Name file and line.
18. Every group left in place because it mixes items. Name file and line.
19. Every group left in place because its loop body cannot be mapped, with the reason. Name file and line.
20. Every panels-mode group left in place because an item has no `value`. Name file and line.
21. Every group left in place because an item has a dynamic label that could not be rewritten. Name file and line.
22. Every group left in place because of a dynamic `active` without a `value` on `bal-tabs`. Name file and line.
23. Every call to `getOptionByValue()`, `renderLine()`, `closeAccordion()`, `getOptions()` or `setActive()`, with its Unmapped props and handlers outcome.
24. Every `balNavigate`, `balKeyDown`, `balWillAnimate` or `balDidAnimate` listener, with its Unmapped props and handlers outcome.
25. Every left-in-place `BalTabOption` reference.
26. Every ambient type reference `BalProps.BalTabs*` and `BalEvents.BalTabs*`. The scan cannot see them. Grep for them and rename by hand. It does list `HTMLBalTabsElement` and `HTMLBalTabItemElement`. The scan does list `Components.BalTabs`, because it matches the bare `BalTabs` symbol. Treat it as a type reference too.
27. Every legacy `bal-tabs__*` class, the `bal-tab-item` class and `data-testid` selector. They no longer match, because `ds-tabs` uses shadow DOM.
28. One-time note: in navigation mode, `ds-tabs` takes an accessible `label` for its `<nav>` landmark. Nothing was added. Suggest the consumer adds one that fits the page.

Coverage only, written to the file:

29. Every `bal-tab-item` split into a tab and panel.
30. Every `noPanel` item.
31. Every static `active` moved to `value`.
32. Every loop rewritten together with its parent, with the file and line.
33. Every `detail` read rewritten to `detail.value`.
34. Every `select(tab)` call rewritten to set `value`.
35. Every import that changed.
36. One-time note: keyboard and roles. In panels mode, arrow keys, Home and End move the tab, and the roles stay `tablist` and `tab`. Navigation mode renders links.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
