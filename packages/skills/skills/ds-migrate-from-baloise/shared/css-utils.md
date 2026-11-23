# CSS utility classes

The **CSS utils** menu item applies these rules. They rewrite the legacy Baloise utility classes in the consumer's markup to their Helvetia names and delete the Baloise utilities line once no legacy utility class is left. They also rewrite the plain classes of the Baloise `css/core` stylesheet, such as `table`, `link` and `field`. `SKILL.md` says when each part runs. Component migrations do not rewrite utility classes.

Init loads the Helvetia utilities directly below the Baloise utilities line. Both stylesheets stay loaded until this step deletes the Baloise line, and the Helvetia line wins where names collide. So a class the scan does not touch keeps its look until then.

## Class map

`css-utils-map.json` in this folder lists the legacy classes that differ in Helvetia. Its `core` block lists the classes of the Baloise `css/core` stylesheet. Every other class of the Baloise utilities and of `css/core` has the same name in Helvetia and stays unchanged. That includes the spacing aliases such as `mb-small` and `p-normal`, and `has-buttons` and `is-striped`.

| group | meaning | handling |
| --- | --- | --- |
| `variant` | renamed variant prefix, same breakpoint (`widescreen:` is now `desktop-lg:`) | Write the mapped token. |
| `structure` | grid and container classes (`grid` is now `ds-grid`, `col` is now `ds-col`) | Write the mapped token. |
| `renamed` | same value, new name (`border-primary-hovered` is now `border-primary-hover`) | Write the mapped token. |
| `approximated` | closest class, visibly different value (`shadow-small` to `shadow`) | Write the mapped token. Report it. |
| `lost` | no counterpart, `to` is `null` | Leave the token. Report it. |
| `core` | `css/core` class with a `ds-*` counterpart (`table` is now `ds-table`) | Write the mapped token. |
| `core-lost` | `css/core` class without counterpart (`file`, `select`), `to` is `null` | Leave the token. Report it. |

A token can carry a variant prefix and a base class. The scan maps both and prints one move with the whole token, such as `widescreen:shadow-small` to `desktop-lg:shadow`, under the stronger group: `lost`, then `core-lost`, `approximated`, `renamed`, `core`, `structure` and `variant`. A `css/core` class has no variant, so only a token without a variant prefix is `core` or `core-lost`. A token is `lost` when its variant prefix is lost (`widescreen-only:`, `high-definition-only:`), when its base class is lost, or when Helvetia has the base class but not that variant of it, such as `desktop:w-full`.

The grid modifiers stay. `is-multiline`, `is-half` and the responsive column sizes such as `widescreen:is-half` are the same on `ds-grid` and `ds-col`, so only `grid`, `col` and `container` change. `ds-container` has no `is-detail-page` and no `is-blog-page`. When one element holds `container` with one of them, in one class string or in separate class contexts such as `class` and `:class`, the scan does not rename either token and prints the pair as one `lost` move, such as `container is-detail-page`. The other tokens of that string are still mapped.

The `core` classes follow the same pair rule. `table is-striped is-hoverable` becomes `ds-table is-striped is-hoverable`, because `ds-table` has both modifiers. `ds-table` has no `is-bordered`, so `table is-bordered` is one `core-lost` move. Other pairs are `button is-tertiary-red`, `field has-addons`, `field is-grouped`, `input is-danger` and `list has-bullet-check`. Helvetia sets the validation state on `ds-field`, so `input`, `textarea` and `help` with `is-danger`, `is-success`, `is-warning` or `is-disabled` are such pairs. A modifier alone, such as `class="is-selected"` on an app element, is never reported.

Helvetia keeps the Baloise form markup: `ds-field` around `ds-label`, `ds-control` and `ds-help`, and `ds-input` or `ds-textarea` inside `ds-control`. It styles `ds-control`, `ds-input`, `ds-textarea` and `ds-help` only inside a `ds-field`. The Baloise `select` class sits on a wrapper around the native `<select>`, while Helvetia styles the `<select>` inside `ds-control` itself, so `select` is `core-lost`.

The map is idempotent: no mapped value is itself a key, so a second run changes nothing.

## Scan

When the user gave a path list, pass those paths. Otherwise pass no files, so the scan covers the whole project.

```bash
node <this-skill-directory>/scripts/scan-css-utils.mjs <project-root> [<file> ...]
```

The script prints one JSON object, `{ total, files: [{ file, findings: [{ line, snippet, classes: [{ from, to, group }] }] }], dynamic }`, and does not edit files. `files` has one entry per file, and its `findings` list every line with a class move. `total` counts those lines. `dynamic` lists the places the scan found but cannot rewrite, each with `file`, `line`, `snippet` and `reason`. A place whose only mapped classes are `core` or `core-lost` classes also has `group: 'core'`. A place whose mapped classes mix `css/core` classes with other classes has `core: true` instead, and so does an `interpolation` or `template substitution` place whose `{{ … }}` or `${…}` part holds a string literal with a `css/core` class, such as `{{ striped ? 'table is-striped' : 'table' }}`. A place has at most one of the two. Pass paths relative to `<project-root>`. When the JSON has an `unmatched` list, those arguments are not source files under `<project-root>`. Fix the paths and run the scan again before you continue.

The scan reads source files (`.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.vue`, `.html`, `.htm`) and stylesheets (`.css`, `.scss`, `.sass`, `.less`). In source files it reads these class contexts:

- `class="…"`, `class='…'` and unquoted `class=…` in HTML, Vue and Angular templates, also inside an Angular inline `template:`
- static `ngClass="…"`, Angular `routerLinkActive="…"` and Vue `active-class="…"` and `exact-active-class="…"`
- `className="…"`, `className={'…'}`, `className={"…"}` and ``className={`…`}`` in JSX, the literals of a `className` expression without a call, such as `className={ok ? 'table' : ''}`, and JSX `class={…}`
- Angular `[class]`, `[ngClass]` and `[routerLinkActive]`, and Vue `:class`, `v-bind:class`, `:active-class` and `:exact-active-class`, with a string, an array, or an object whose keys are quoted or bare names (`{ container: wide }`)
- Angular `[class.<name>]`, `@HostBinding('class.<name>')`, and the string literals on the line of an `@HostBinding('class')` member, such as `@HostBinding('class') cls = 'table'`
- `classList.add`, `remove`, `toggle` and `contains`, Renderer2 `addClass` and `removeClass`, and the arguments after `'class'` in `setAttribute(…, 'class', …)`, with string arguments
- Angular `host: { class: '…' }` and `'[class.<name>]'` host keys

Comments are skipped. In `.html`, `.htm` and `.vue`, only `<!--` is a comment outside `<script>` and `<style>`.

Show the findings grouped by file, with path, line, snippet and each `from` to `to`. End with the total per group, then the `dynamic` list.

`dynamic` holds every place the scan found but cannot rewrite, with one of these reasons:

- `template substitution` or `interpolation`: a class context with `${…}` or `{{ … }}`, such as ``className={`mb-small ${extra}`}`` or `class="mb-{{ size }}"`. The static parts are still in `files`. The substituted value may hold a legacy class. The string literals inside the substitution, such as `'table'` in `{{ on ? 'table' : '' }}`, are not rewritten. When one of them holds a `css/core` class, the place has `core: true`. A template literal outside a class context, such as ``cx(`shadow-small ${x}`)``, is listed with this reason when its static text holds a mapped class.
- `string concatenation`: a class context built with `+`, such as `className={'mb-small ' + extra}`.
- `non-literal class binding`: a variable, a computed key (`[key]: cond`) or a spread inside `[ngClass]`, `[class]` or `:class`, such as `:class="classes"`, or a mapped object key inside a call in `className`, bare or quoted, such as `className={cx({ grid: on })}` or `className={cx({ 'table': on })}`. Only a mapped object key adds a `classes` field to the place, with the same `from`, `to` and `group` entries as a finding. Such a place provably holds a Baloise class.
- `string literal outside a class context`: a string that contains a mapped class, in code or in a bound attribute such as `:title="'radius-large'"`, `[attr.class]` or Vue `v-bind="{ class: 'grid' }"`. Examples are `const round = 'radius-normal p-small'` and the arguments of `cx(…)`. A literal that holds only unchanged classes, such as `'mt-normal'`, is not listed. A literal whose only mapped classes are `css/core` classes, such as `type: 'button'` or `color="'link'"`, is not listed either, for this reason and for `template substitution`. These words are common code values.
- `selector`: a string that selects a mapped class, such as `querySelector('.grid')`, `By.css('.container')` or `'class.grid'`. A `css/core` class counts only in a compound that starts with a class, such as `'.table td'`, because a string like `'header.title'` is usually a translation key.
- `selector in a stylesheet`: a selector of a mapped class, such as `.grid > .col` or `.border-primary-hovered`, in a stylesheet or a `<style>` block. The step never edits stylesheets. An `@extend .grid` line can show up here too; rewriting `@extend` is out of scope.
- `class input`: a static attribute whose name ends in `Class` or `-class`, such as `styleClass="shadow-small"` on a PrimeNG component or `body-class="container"`. The component places these classes itself, so check where they land before you rewrite them by hand.
- `possibly commented`: a class context in a `.tsx`, `.jsx` or `.js` file behind a `//` on the same line or inside `/* … */`. It is a real comment, or JSX text that the scan did not detect as JSX. Check which.

The scan does not see a `css/core` class alone in a plain code string, such as `cx('table', x)` or a variable that holds `'table'`. This gap is on purpose, because words like `button` and `link` are common code values. A string that mixes it with a mapped utility class, such as `'table shadow-small'`, is listed with `core: true`. The consumer checks such places by hand before **Cleanup** removes the `css/core` line.

Every `dynamic` place is listed for the consumer to review. Every place without `group` keeps the Baloise utilities line, as the next sections say. The exception is a `non-literal class binding` place without `classes` that the user confirmed in **CSS utils** step 1 of `SKILL.md`. A place with `group: 'core'` keeps the legacy `css/core` line instead, which **Cleanup** removes. A place with `core: true` keeps both lines.

## Rewrite

For every move in `files[].findings[].classes` with a `to`, replace `from` with `to` on that line, inside the class context only. Keep the order of the classes, the whitespace and every other class on the element. In a `className` template literal, rewrite only the static text, never a `${…}` part. In `[class.<name>]`, rewrite the name. In an `[ngClass]` or `:class` object, rewrite the key and keep its condition. Quote a bare key when its new name has a hyphen or a colon, such as `{ 'ds-container': wide }`.

When a rewrite would put a class on an element that already has it, write it once. `list is-list` becomes `ds-list`, not `ds-list ds-list`.

Do not rewrite a `core` move when the project's own stylesheet defines that class, that is when `dynamic` has a `selector in a stylesheet` place with `group: 'core'` for the same class, such as `.table td`. The app's own rule would stop matching. List each such class for the consumer.

Leave every `lost` and `core-lost` token unchanged, including a `container is-detail-page` or `table is-bordered` pair. Leave every `dynamic` place unchanged. Never rewrite a string the scan did not list, even when it looks like a class, because the same word can be an element id or a CSS value (`display: 'grid'`).

## Legacy utilities line

After the rewrite, run the scan again without file arguments, so it covers the whole project.

This decision ignores every `core` and `core-lost` move and every `dynamic` place with `group: 'core'`. Those classes depend on the legacy `css/core` line, not on the Baloise utilities line. A `dynamic` place with `core: true` counts here, because it can also hold a utility class. **Cleanup** keeps that line while one of them is left.

A `dynamic` place with reason `non-literal class binding` that the user confirmed in **CSS utils** step 1 of `SKILL.md` does not count here. Match it by file, line and reason, not by snippet, because the rewrite may change static classes on the same line. Every other `dynamic` place counts, whatever its reason.

**A class move, a `lost` move or a `dynamic` place is left**, apart from the confirmed places: keep the Baloise utilities line. Report why, with the number of remaining moves, lost moves and dynamic places. A remaining move with a `to` sits in a file outside the scanned paths or was not rewritten. A `dynamic` place that is clearly not a class, such as `role="grid"` or `display: 'grid'`, still counts, and so does a `selector in a stylesheet`. List each one so the consumer can review it. The line goes only after the consumer has fixed or removed every such place and a new scan is clean.

**No class move, no `lost` move and no `dynamic` place is left**, apart from the confirmed places: delete the Baloise utilities lines that the confirmation in `SKILL.md` covered. Do not delete a line that the confirmation did not cover; report it instead. Find them in `imports` of:

```bash
node <this-skill-directory>/scripts/detect-baloise.mjs <project-root>
```

A Baloise utilities line is an `imports` entry for `@baloise/ds-styles/css/utilities/all` or a category file under `@baloise/ds-styles/css/utilities/`, with or without `.css`, in any form: a CSS or SCSS `@import` or `@use`, an HTML `<link>`, a TS or JS side-effect import, or an `angular.json` styles entry. For each line:

1. Delete the line. In `angular.json`, delete the string and keep the array valid JSON.
2. When the line directly above is a comment that mentions the legacy Baloise utilities, such as `/* TODO: remove the legacy Baloise utilities once no legacy utility class is left */`, delete it too. Keep any other comment. The comment above the bundled block (`/* TODO: remove these legacy Baloise imports once the Helvetia migration is verified */`) also covers `font`, `structure` and `core`, so it stays. **Cleanup** deletes it once only `structure` and `core` lines are left below it.
3. Never touch the `@helvetia-design/styles/css/utilities` line.

When `imports` still holds an uncommented `@baloise/ds-styles/css/all` line, that file bundles the utilities with normalize, font, structure and core. Do not edit it. Report that it still loads the legacy utilities.

When `imports` holds no Baloise utilities line, there is nothing to delete. Write U6 as `none found`.

## Report

These items form the checklist of the `css-utils` section. Each one gets its own line in `ds-migration-report.md`, as `shared/report.md` describes.

Needs your attention when found:

- U1. Every class rewritten from `approximated`, and where.
- U2. Every `lost` move left unchanged, and where, including `container` pairs with `is-detail-page` or `is-blog-page`.
- U3. Every `dynamic` place, with its reason, and where. Mark each `non-literal class binding` place that the user confirmed as free of Baloise classes as "confirmed by the user", with file and line.
- U4. When the Baloise utilities line stays, the reason, with the number of lost moves and dynamic places.
- U5. Every uncommented bundled `@baloise/ds-styles/css/all` line, with the note that it still loads the legacy utilities.
- U6. Every Baloise utilities line deleted, with file and line, and every utilities TODO comment deleted with it.

Coverage only, written to the file:

- U7. Every class rewritten from `renamed`.
- U8. Every token rewritten from `variant`.
- U9. Every class rewritten from `structure`.

Needs your attention when found, for the `css/core` classes:

- U10. Every `core-lost` move left unchanged, and where, including pairs such as `table is-bordered` or `input is-danger`. The legacy `css/core` line stays until it is gone.
- U11. Every `ds-control`, `ds-input`, `ds-textarea` or `ds-help` written outside a `ds-field`, and where. Helvetia styles them only inside one.

Coverage only, written to the file:

- U12. Every class rewritten from `core`.
