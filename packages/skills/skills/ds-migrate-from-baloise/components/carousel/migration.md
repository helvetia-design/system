# carousel

Migrate every `bal-carousel` usage to `ds-carousel`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one child element: `bal-carousel-item` becomes `ds-carousel-item`. Legacy items had no identifier; `ds-carousel-item` requires a unique `name`, so the rewrite synthesizes one. Legacy product tiles (`color` and `label` both set on the item) rendered their own link or button; `ds-carousel-item` renders neither, so the rewrite moves that markup into the slot. `controls` and `interface` both shrink to a smaller set of values on the new side, described under Shape and under Props below.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-carousel.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-carousel` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line, and read the whole `bal-carousel` (not just the scanned child tag) before deciding how to rewrite it. This step is finished when every finding matches the mapping.

### Shape: synthesizing item names and rewriting `value`

Legacy `bal-carousel-item` had no identifying attribute. `ds-carousel-item` requires a unique `name` (`@Required()` — the component throws without one). For every `bal-carousel` being migrated, assign each direct-child `bal-carousel-item` a `name` positionally, in source order: `name="item-1"`, `name="item-2"`, `name="item-3"`, and so on. Do this even when the parent has no `value` at all.

Legacy `value` on `bal-carousel` is a 0-based slide **index**. `ds-carousel`'s `value` is the active item's **name** (a string). Rewrite accordingly:

- A literal numeric `value` (`value="1"`, `value={1}`, a plain number) becomes the synthesized name at that position: index `0` → `item-1`, index `1` → `item-2`, and so on.
- No `value` attribute, or `value="0"` / `value={0}` (the legacy default): omit `value` entirely on `ds-carousel`. It already defaults to the first item's name, same effective behavior as the legacy default index.
- A `value` bound to a variable, prop, or expression cannot be resolved to a position at scan time. Do not guess the mapping. HTML: leave the expression untouched, and report it. React and Angular: keep it when the expression's type only admits strings or `null`. A legacy index state of type `number` does not fit. Otherwise apply Unmapped props and handlers (`SKILL.md`). The report says that the surrounding state must now hold the item's **name** (string), not an index, and must stay in sync with the synthesized names above.

```html
<!-- before -->
<bal-carousel value="1">
  <bal-carousel-item src="a.jpg"></bal-carousel-item>
  <bal-carousel-item src="b.jpg"></bal-carousel-item>
  <bal-carousel-item src="c.jpg"></bal-carousel-item>
</bal-carousel>

<!-- after -->
<ds-carousel value="item-2">
  <ds-carousel-item name="item-1" src="a.jpg"></ds-carousel-item>
  <ds-carousel-item name="item-2" src="b.jpg"></ds-carousel-item>
  <ds-carousel-item name="item-3" src="c.jpg"></ds-carousel-item>
</ds-carousel>
```

### Shape: `bal-carousel-item` link and button rewrite

Legacy `bal-carousel-item` rendered its own `<a>` or `<button>` only when the item had both `color` and `label`. The compiled render logic in `@baloise/ds-core` (`bal-carousel-item.js`) reads `const isProduct = !!this.color && !!this.label;`. The gate is read statically, before any `color="white"` drop: a literal attribute with a non-empty value counts as set, and so does an attribute bound to an expression, because the migration cannot read its runtime value. Legacy read it at runtime, and `label` defaults to `''`, so an expression that is empty rendered a plain host. Treat an expression-bound `color` or `label` as set, and report the item, so the consumer confirms the wrapper belongs there. `ds-carousel-item` renders neither element and is always a plain host, so the rewrite slots the interactive element itself, and only for product tiles.

When the item does not have both `color` and `label`, add no wrapper. Legacy rendered a plain host with the slot and ignored `href`, `target`, `rel`, `download`, `elementType`, the form `name` and `value`. Rewrite the item as plain slot content and drop those attributes in every framework, HTML included, because a form `name` would clash with the synthesized `name`. This is a row-prescribed drop, so the cleanup bullets of Unmapped props and handlers (`SKILL.md`) apply to declarations that become unused.

```html
<!-- before -->
<bal-carousel-item value="3" label="Car">
  <ds-card>...</ds-card>
</bal-carousel-item>

<!-- after -->
<ds-carousel-item name="item-1">
  <ds-card>...</ds-card>
</ds-carousel-item>
```

When the item has both `color` and `label` and an `href`: wrap the item's slot content in a literal `<a>`, carrying over `href`, `target`, `rel`, and `download` unchanged, and add the new `navigation` prop to `ds-carousel-item` (it marks the item as "a consumer-provided `<a>` makes this tile interactive"). The `label` moves into the slot per the `label` row, here inside the `<a>` before any existing slot content.

```html
<!-- before -->
<bal-carousel-item color="green" label="Auto" href="/auto" target="_self"></bal-carousel-item>

<!-- after -->
<ds-carousel-item name="item-1" color="green" navigation>
  <a href="/auto" target="_self">Auto</a>
</ds-carousel-item>
```

When the item has both `color` and `label` but no `href`: wrap the slot content in a literal `<button>` instead, with the `label` moved in the same way. Legacy rendered this button for every such item, because `elementType` defaults to `button`. Set `type` to the item's `elementType`, or to `button` when it has none. Carry over `name` (the button's form name, distinct from the `name` synthesized above for `ds-carousel-item` itself) and `value` (the button's form value) only when they are set. Do not add `navigation` in this case. The new component's documentation never shows a button-wrapped tile, so flag every occurrence for manual visual and behavior review.

### `controls`

| old | new (`ds-carousel`) | handling |
| --- | --- | --- |
| `controls="dots"` | `controls="dots"` | Copy as-is. |
| `controls="large"` | `controls="large"` | Copy as-is. |
| `controls="none"` | `controls="none"` | Copy as-is. |
| `controls="small"` | `controls="large"` | `ds-carousel` has only one arrow-button size. Rewrite to `large`, the nearest shape (prev/next arrow buttons). Mention the size change in the report. |
| `controls="tabs"` | _(no equivalent)_ | `ds-carousel` has no tab-style pagination (a row of buttons showing each item's label). Drop the attribute — it falls back to the `dots` default — and flag every occurrence for manual review. |

### `interface` → `variant`

| old (`interface`) | new (`variant`) | handling |
| --- | --- | --- |
| omitted, `interface=""` | omit `variant` | `slide` is the default on both sides. |
| `interface="image"` | omit `variant` | `slide` is the nearest match (one item visible at a time, scroll-snap). The legacy `aspectRatio` prop enforced a fixed image aspect ratio via padding; `ds-carousel-item` has no such prop — the `<img>` now sizes by its natural content. Mention every `aspectRatio` found (see Props below). |
| `interface="card"` | `variant="tile"` | `tile` is the nearest match (multiple items, horizontal scroll, edge-fade on overflow). The legacy bleed-margin and shadow styling is superseded by the new tile styling — nothing for the consumer to do, just mention the visual change in the report. |
| `interface="product"` | `variant="tile"` | Same as `card`. The legacy fixed-width colored product buttons are superseded by the new tile + item `color` styling (see Props below) — mention the visual change in the report. |

### Other `bal-carousel` props

| old | new (`ds-carousel`) | handling |
| --- | --- | --- |
| `steps` | `steps` | Copy as-is. |
| `itemsPerView` / `items-per-view` | `itemsPerView` / `items-per-view` | Copy as-is. Legacy accepted `'auto' \| 1 \| 2 \| 3 \| 4`; new accepts `'auto' \| number`, a superset — any legacy value is still valid. |
| `controlsOverflow` / `controls-overflow` | _(no equivalent)_ | Drop it. Controls always overlay the track now, matching the legacy `controlsOverflow={true}` look regardless of the old value. Mention each dropped occurrence. |
| `inverted` | _(no equivalent)_ | Drop it. `ds-carousel` has no dark-background variant. Mention each dropped occurrence. |
| `fullHeight` / `full-height` | _(no equivalent)_ | Drop it. Mention each dropped occurrence. |
| `aspectRatio` / `aspect-ratio` | _(no equivalent)_ | Drop it. See the `interface="image"` note above. Mention each dropped occurrence. |
| `controlsSticky` / `controls-sticky` | _(no equivalent)_ | Drop it. Only ever had an effect together with `controls="tabs"`, itself dropped. Mention each dropped occurrence. |
| `scrollY` / `scroll-y` | _(no equivalent)_ | Drop only when explicitly `false` (blocked vertical touch scrolling) and mention it — the default `true` matches current behavior, nothing to report. |
| `border` | _(no equivalent)_ | Drop it. `ds-carousel` has no bottom-border variant. Mention each dropped occurrence. |
| `htmlRole` / `html-role` | _(no equivalent)_ | Drop it. Already `@deprecated` in the legacy component; ARIA roles are automatic now. Mention each dropped occurrence. |
| `space` | _(no public prop)_ | Drop it. Track gap is customizable only through the `--carousel-gap` CSS custom property, not a component prop. Mention each dropped occurrence and point at the CSS variable. |

### `bal-carousel-item` props

| old | new (`ds-carousel-item`) | handling |
| --- | --- | --- |
| `src` | `src` | Copy as-is. |
| `color="green"` / `"yellow"` / `"red"` / `"purple"` | same value | Copy as-is. |
| `color="white"` | _(no equivalent)_ | Drop it. `ds-carousel-item`'s `color` has no `white` value. Mention each dropped occurrence. |
| `svg` | _(no equivalent prop)_ | Drop it. The new pattern is slotting a `<ds-brand-icon src="...">` component instead of inline SVG markup. Do not attempt to auto-generate that markup from the raw SVG string — flag every occurrence for manual rewrite. |
| `label` | slot text, or dropped | On a product tile (`color` and `label` both set), legacy showed the label as visible text before the slot. Move the `label` value into the slot as plain text, inside the wrapper and before any existing slot content, and drop the attribute. On every other item, legacy used `label` only as the host's aria-label. Drop `label` and report the lost custom aria-label. These items now get an automatic `aria-label="Slide N"` instead. |
| `htmlRole` / `html-role` | _(no equivalent)_ | Drop it. Already `@deprecated`. Mention each dropped occurrence. |
| `elementType`, item `name` (form name), `value` (form value), `href`, `target`, `rel`, `download` | — | Handled under Shape above, not here. They determine the wrapper only on product tiles (`color` and `label` both set) and are dropped on every other item. |

### Tags and imports

- **HTML**: `<bal-carousel>` becomes `<ds-carousel>`, including the closing tag. `<bal-carousel-item>` becomes `<ds-carousel-item>`, including the closing tag.
- **Angular**: the same tag rewrites in `.html` templates and in inline `template:` strings. When a file imports `BalCarousel`, `BalCarouselItem`, or `BalCarouselBundle` from `@baloise/ds-angular`, replace all of them with `import { DsCarousel, DsCarouselItem } from '@helvetia-design/angular'`, keeping only the classes actually used in that file, and leave the other symbols on the `@baloise` import. `BalCarouselBundle` was `[BalCarousel, BalCarouselItem]`; in an `imports:` list it becomes the individual `DsCarousel`/`DsCarouselItem` classes actually used.
- **React**: `<BalCarousel>` becomes `<DsCarousel>` and `</BalCarousel>` becomes `</DsCarousel>`, same for `BalCarouselItem`. Import `DsCarousel` and `DsCarouselItem` from `@helvetia-design/react`, keeping only the ones actually used. When the existing `@baloise/ds-react` import also binds other symbols, move only the carousel symbols and leave the rest on the `@baloise` import.

### Events

| old | new | handling |
| --- | --- | --- |
| `balChange` | `dsChange` | Rewrite `addEventListener('balChange'` to `addEventListener('dsChange'`. Angular: `(balChange)` becomes `(dsChange)`. React: `onBalChange` becomes `onDsChange`. |
| event `detail` | `{ value: string }` | Legacy sent the new slide index as a number. `ds-carousel` sends the active item's name (`item-N`). When the handler body is in the same file (inline arrow, named function, Angular class method bound by `(balChange)`, `addEventListener` callback), rewrite every `.detail` read to `.detail.value`, for example `({ detail }) => f(detail)` becomes `({ detail }) => f(detail.value)`. When the handler uses the read as a number (`Number(...)`, arithmetic, a numeric state setter), `.detail.value` alone gives `'item-2'` or `NaN`. Convert the synthesized name back to the 0-based index instead: `setSlide(event.detail)` becomes `setSlide(Number(event.detail.value.slice('item-'.length)) - 1)`. A parameter typed `CustomEvent<number>` becomes `CustomEvent<{ value: string }>`. Report each rewritten handler, because the bound `value` must now hold the name, not the index. A handler in another file, one whose body you cannot see, or one also bound to an element you did not migrate stays as it is and is reported. |
| `balNavigate` | `click` | Legacy fired it only on product tiles with an `href`. On those tiles, rewritten into a wrapped `<a>` per the Shape section, move the listener onto that element. On every other item, a button-wrapped product tile included, legacy never fired the event, so remove the binding and apply the cleanup bullets of Unmapped props and handlers. Rewrites for the `<a>`: `addEventListener('balNavigate'` → `addEventListener('click'`, Angular `(balNavigate)` → `(click)`, React `onBalNavigate` → `onClick`. |
| `balFocus` | `focus` | Legacy fired it on every product tile. Move the listener onto the wrapped `<a>` or `<button>`, targeting `focus`. On every other item, remove the binding as for `balNavigate`. |
| `balBlur` | `blur` | Same rule as `balFocus`, targeting `blur`. |

### Methods

`previous()` and `next()` do not exist on `ds-carousel`, and there is no direct replacement. Calling them throws at runtime. Scrolling to a slide only happens from real user interaction inside the component: an arrow click, a drag, the keyboard, or a click on a tile. Setting `el.value = 'item-N'` updates the active dot and highlight, but does not scroll the track into view. Apply Unmapped props and handlers (`SKILL.md`) to every `previous()` and `next()` call. A standalone call becomes the TODO comment. A used result gets the placeholder, and its type is `void`, the legacy return type without the `Promise`. Name the `el.value` option in the report.

`setFocus()` on `bal-carousel-item` does not exist on `ds-carousel-item`. Apply Unmapped props and handlers (`SKILL.md`) to every call, the same way.

### Files to edit beyond the scan

In each file that has a finding, also rewrite `balChange`, `balNavigate`, `balFocus`, and `balBlur` listeners and `previous()`, `next()`, and `setFocus()` calls that are not on the element itself, including `addEventListener`.

For every finding in a `.html` file, also open the file with the same name and a `.ts` extension in the same folder, and apply the Events and Methods rules there. That is the Angular case where the template holds the tag and the class file holds `@ViewChild` with `next()`/`previous()` or an event handler, and the class file never names `bal-carousel`.

The scan does not list a file that only listens or only calls a method and never uses `bal-carousel` or `BalCarousel`, and that has no scanned `.html` of the same name beside it. Say so in the report.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every non-literal `value`, with its outcome: left (HTML), kept because its type only admits strings or `null`, or removed (Unmapped). The surrounding state must now hold the item name, not an index.
2. Every `controls="small"` rewritten to `large`.
3. Every dropped `controls="tabs"`.
4. Every `interface="image"` collapsed to the default `variant`, with the note that the images lost their fixed aspect ratio.
5. Every `interface="card"` collapsed to `variant="tile"`, with the note that the card bleed styling changed.
6. Every `interface="product"` collapsed to `variant="tile"`, with the note that the product button styling changed.
7. Every dropped `controlsOverflow`.
8. Every dropped `inverted`.
9. Every dropped `fullHeight`.
10. Every dropped `aspectRatio`.
11. Every dropped `scrollY` that was `false`.
12. Every dropped `border`.
13. Every dropped `space`, with a pointer to the `--carousel-gap` CSS custom property.
14. Every product tile rewritten into a wrapped `<button>`, flagged for visual and behaviour review.
15. Every dropped `color="white"`.
16. Every dropped `svg`, with the guidance to slot a `ds-brand-icon` instead.
17. Every `label` dropped from an item that is not a product tile. The custom aria-label is lost.
18. Every `balNavigate`, `balFocus` or `balBlur` rewritten to a native event on the wrapped element, and every such binding removed from an item where legacy never fired it.
19. Every handler whose `detail` read was rewritten to `detail.value`. The value is now the item name (`item-N`), not a 0-based index, so state that stores an index must change. Also every handler left as it is because its body is in another file, named by file and line.
20. Every `previous()`, `next()` or `setFocus()` call, with its Unmapped props and handlers outcome. For `previous()` and `next()`, name the `el.value = 'item-N'` option, which moves the active dot but does not scroll.
21. Every item treated as a product tile because its `color` or `label` is bound to an expression, whose runtime value the migration cannot read. When that expression is empty at runtime, legacy rendered a plain host, so the wrapper does not belong.
22. One-time note: files which only listen or only call a method, and have no scanned `.html` of the same name beside them, were not scanned.

Coverage only, written to the file:

23. Every synthesized `ds-carousel-item` name.
24. Every `value` rewritten from an index to a name.
25. Every dropped `controlsSticky`.
26. Every dropped `htmlRole`.
27. Every product tile rewritten into a wrapped `<a>`, with `navigation` added.
28. Every `label` moved into a product tile's slot as plain text.
29. Every `href`, `target`, `rel`, `download`, `elementType`, form `name` or `value` dropped from an item without both `color` and `label`, which legacy ignored.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
