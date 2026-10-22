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
- It has an `options` attribute. `ds-tabs` builds its tabs from `ds-tab` children, so the tabs and panels must be rebuilt as children by hand. Rename the tag only.
- Any `bal-tab-item` has a static `disabled` or `invisible` (a bare attribute, `true`, `"true"` or `{true}`). `ds-tab` supports neither, so deleting the attribute would silently enable or show the tab.
- It has `handleAsTabList` and a `bal-tab-item` with `href`. Legacy treated that group as a tab list of links. `ds-tabs` is either panels or navigation, never both.
- Its items are mixed, some with `href` and some without. `ds-tabs` cannot mix the modes.
- No item has `href` and no panel would be produced, because every item has `noPanel` or no content. Without a `ds-tab-panel` child `ds-tabs` switches to navigation mode, and its tabs would then expect an `<a>`.

A `bal-tab-item` without `value` has nothing to link, so leave it in place and report it. Do not invent a name. Items produced by `*ngFor`, `v-for`, `.map()` or any other loop are dynamic. Leave them in place, only rename the surrounding tag, and report each one: the tabs and panels must be rebuilt as a pair by hand.

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

`ds-tab` has no `label` prop. The old `label` becomes the text content of the `ds-tab`. A static `label="One"` becomes `One`. A dynamic label is rewritten only where the syntax is unambiguous: Angular `[label]="expr"` becomes `{{ expr }}`, React `label={expr}` becomes `{expr}`. Any other dynamic form leaves the whole item in place and is reported.

Leave the content of the item as the content of the panel. An item with `noPanel`, or with no content, gets a `ds-tab` and no panel. Clicking that tab selects it and hides every panel, so report each `noPanel` item.

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

| old (`bal-tabs`)                                                                                                                       | new (`ds-tabs`)   | handling                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                                                                                                                                | `value`           | Copy as-is. It is the `name` of the selected `ds-tab`, which equals the old item `value`. A dynamic value stays untouched. Navigation mode ignores it, so say that in the report. |
| `fullwidth`                                                                                                                            | `fullwidth`       | Copy as-is.                                                                                                                                                                       |
| `inverted`                                                                                                                             | `inverted`        | Copy as-is.                                                                                                                                                                       |
| `verticalColSize`                                                                                                                      | `verticalColSize` | Copy as-is. The values are the same.                                                                                                                                              |
| `vertical`, `vertical="true"`, `[vertical]="true"`, `vertical={true}` or any boolean expression                                        | `vertical`        | Copy as-is.                                                                                                                                                                       |
| `vertical="mobile"` / `"tablet"`                                                                                                       | _(no equivalent)_ | Delete the attribute. `ds-tabs` is vertical at every width or never. Mention each one as a visual change.                                                                         |
| `optionalTabSelection`                                                                                                                 | _(no equivalent)_ | Delete the attribute. Report it as a functional change: `ds-tabs` selects the first tab when `value` is not set, so "no tab selected" is gone.                                    |
| `clickable`                                                                                                                            | _(no equivalent)_ | Delete the attribute. Report it as a functional change when it was `false`.                                                                                                       |
| `accordion`, `options`                                                                                                                 | _(no equivalent)_ | The group stays in place. See Groups left in place.                                                                                                                               |
| `float`, `overflow`, `context`, `iconPosition`, `expanded`, `spaceless`, `border`, `debounce`, `selectOnMobile`, `dimInactiveElements` | _(no equivalent)_ | Delete the attribute. Mention each one as a visual change. Do not map `expanded` to `fullwidth`: the legacy meaning is not the same. Do not pick a replacement.                   |
| `handleAsTabList`                                                                                                                      | _(no equivalent)_ | Without `href` items, delete it and mention it. With `href` items the group stays in place.                                                                                       |
| _(none)_                                                                                                                               | `color`, `label`  | New props. Nothing to migrate from. Leave `color` unset. In navigation mode, suggest a `label` (see Report).                                                                      |

### Props on `bal-tab-item`

| old (`bal-tab-item`)                                           | new                             | handling                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`                                                        | `name` (and `for` on the panel) | See Panels mode.                                                                                                                                                                                                                                                                                                                                       |
| `label`                                                        | text content of the `ds-tab`    | See Panels mode and Navigation mode.                                                                                                                                                                                                                                                                                                                   |
| `href`, `rel`, `target`                                        | on the slotted `<a>`            | See Navigation mode.                                                                                                                                                                                                                                                                                                                                   |
| `noPanel`                                                      | no `ds-tab-panel`               | See Panels mode.                                                                                                                                                                                                                                                                                                                                       |
| `active`                                                       | `value` on `ds-tabs`            | Panels mode: when `bal-tabs` has no `value`, set `value` to this item's `name` and delete `active`. When it has one, the old code let `active` win, but keep the `value`, delete `active`, and report the conflict. Navigation mode: delete `active` and report it, the router sets `aria-current`. A dynamic `active` stays in place and is reported. |
| `icon`, `svg`, `bubble`, `subLabel`, `a11yControls`, `prevent` | _(no equivalent)_               | Delete the attribute. Mention each one. The slotted `<a>` is left to the consumer's router.                                                                                                                                                                                                                                                            |
| `disabled`, `invisible`                                        | _(no equivalent)_               | A static `true` keeps the group in place, see Groups left in place. `false` is deleted. A dynamic value stays in place and the group is reported.                                                                                                                                                                                                      |
| `balNavigate`, `balKeyDown`                                    | _(no equivalent)_               | Leave the listener in place and report it. Say that the router or a click handler on the `<a>` replaces it.                                                                                                                                                                                                                                            |
| `getOptions()`, `setActive()`                                  | _(no equivalent)_               | Leave the call in place and report it.                                                                                                                                                                                                                                                                                                                 |

### Tags and imports

- **HTML**: `<bal-tabs>` becomes `<ds-tabs>`, including the closing tag. `bal-tab-item` is rewritten as described in the two modes.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalTabs`, `BalTabItem` or `BalTabsBundle` from `@baloise/ds-angular`, replace all of them with `import { DsTabs, DsTab, DsTabPanel } from '@helvetia-design/angular'`, listing only the symbols the file's templates now use (navigation mode needs no `DsTabPanel`). Leave the other symbols on the `@baloise` import. `BalTabsBundle` was an array of both legacy classes. In an `imports:` list it becomes the same symbols.
- **React**: `<BalTabs>` becomes `<DsTabs>` and `</BalTabs>` becomes `</DsTabs>`. `BalTabItem` is rewritten as in the two modes, to `DsTab` and `DsTabPanel`. Import only the used symbols from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalTabs` and `BalTabItem` and leave the rest on the `@baloise` import.
- **Types**: `BalTabOption` has no equivalent, because there is no `options` prop. Leave it in place and report it.

When a group is left in place, its imports stay on `@baloise` too.

### Events and methods

| old                                | new               | handling                                                                                                                                                                                    |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balChange`                        | `dsChange`        | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`.                            |
| event `detail`                     | see handling      | Legacy `detail` was the tab `value` string. `dsChange` `detail` is `{ value }`. Leave each handler body as it is and mention every listener that reads `detail`.                            |
| `dsChange` timing                  | see handling      | `dsChange` fires on a user click or key press only, in panels mode only. Setting `value` in code does not emit it. Mention every `balChange` listener that relied on a programmatic change. |
| `balWillAnimate`, `balDidAnimate`  | _(no equivalent)_ | Leave the listener in place and report it.                                                                                                                                                  |
| `select(tab)`                      | _(no equivalent)_ | Leave the call in place and report it. Set `value` on `ds-tabs` to change the tab.                                                                                                          |
| `getOptionByValue(value)`          | _(no equivalent)_ | Leave the call in place and report it.                                                                                                                                                      |
| `renderLine()`, `closeAccordion()` | _(no equivalent)_ | Leave the call in place and report it.                                                                                                                                                      |
| _(none)_                           | `dsTabSelect`     | Internal event from `ds-tab`. Nothing to migrate from. Leave it unset.                                                                                                                      |

Rewrite `balChange` listeners only on a migrated element. `balChange` is emitted by many other legacy components, so never rewrite a listener on an element you did not migrate. The scan does not list a file that only listens and never uses `bal-tabs`, `bal-tab-item`, `BalTabs`, `BalTabItem`, `BalTabsBundle` or `BalTabOption`.

## 4. Report

Print a per-file summary of what changed, including every `bal-tab-item` split into a tab and panel, every navigation group and the `aria-current` the router must set, every `noPanel` item, every deleted `vertical="mobile"`, `vertical="tablet"`, `optionalTabSelection`, `clickable`, `prevent`, `icon`, `svg`, `bubble`, `subLabel`, `a11yControls` and layout prop, every `active` moved to `value` or dropped, every `balChange` listener whose detail is no longer the tab value string or that relied on a programmatic change, and every import that changed.

Also report what was left in place:

- Groups with `accordion` (point to `ds-accordion`), `options`, a static `disabled` or `invisible` item, `handleAsTabList` with `href`, mixed items, or no panel at all, each with the reason.
- Tabs built in a loop, with the note that the tabs and panels must be rebuilt as children by hand.
- Items without `value` and items with a dynamic label that could not be rewritten.
- `select()`, `getOptionByValue()`, `renderLine()`, `closeAccordion()`, `getOptions()`, `setActive()`, `balNavigate`, `balKeyDown`, `balWillAnimate`, `balDidAnimate` and `BalTabOption`.

Also report what the scan cannot see:

- Ambient type references `BalProps.BalTabs*`, `BalEvents.BalTabs*`, `HTMLBalTabsElement` and `HTMLBalTabItemElement`. Grep for them and rename by hand. The scan does list `Components.BalTabs`, because it matches the bare `BalTabs` symbol. Treat it as a type reference too.
- Legacy `bal-tabs__*` classes, the `bal-tab-item` class and `data-testid` selectors no longer match, because `ds-tabs` uses shadow DOM.
- In navigation mode, `ds-tabs` takes an accessible `label` for its `<nav>` landmark. Nothing was added. Suggest the consumer adds one that fits the page.
- Keyboard and roles. In panels mode, arrow keys, Home and End move the tab, and the roles stay `tablist` and `tab`. Navigation mode renders links.

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
