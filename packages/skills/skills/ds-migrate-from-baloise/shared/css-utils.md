# CSS utility classes

The **CSS utils** menu item applies these rules. They rewrite the legacy Baloise utility classes in the consumer's markup to their Helvetia names and delete the Baloise utilities line once no legacy class is left. `SKILL.md` says when each part runs. Component migrations do not rewrite utility classes.

Init loads the Helvetia utilities directly below the Baloise utilities line. Both stylesheets stay loaded until this step deletes the Baloise line, and the Helvetia line wins where names collide. So a class the scan does not touch keeps its look until then.

## Class map

`css-utils-map.json` in this folder lists the legacy classes that differ in Helvetia. Every class not listed has the same name on both sides and stays unchanged. That includes the spacing aliases such as `mb-small` and `p-normal`.

| group          | meaning                                                                       | handling                           |
| -------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `variant`      | renamed variant prefix, same breakpoint (`widescreen:` is now `desktop-lg:`)  | Write the mapped token.            |
| `structure`    | grid and container classes (`grid` is now `ds-grid`, `col` is now `ds-col`)   | Write the mapped token.            |
| `renamed`      | same value, new name (`border-primary-hovered` is now `border-primary-hover`) | Write the mapped token.            |
| `approximated` | closest class, visibly different value (`shadow-small` to `shadow`)           | Write the mapped token. Report it. |
| `lost`         | no counterpart, `to` is `null`                                                | Leave the token. Report it.        |

A token can carry a variant prefix and a base class. The scan maps both and prints one move with the whole token, such as `widescreen:shadow-small` to `desktop-lg:shadow`, under the stronger group: `lost`, then `approximated`, `renamed`, `structure` and `variant`. A token is `lost` when its variant prefix is lost (`widescreen-only:`, `high-definition-only:`), when its base class is lost, or when Helvetia has the base class but not that variant of it, such as `desktop:w-full`.

The grid modifiers stay. `is-multiline`, `is-half` and the responsive column sizes such as `widescreen:is-half` are the same on `ds-grid` and `ds-col`, so only `grid`, `col` and `container` change. `ds-container` has no `is-detail-page` and no `is-blog-page`. When one class string holds `container` with one of them, the scan does not rename either token and prints the pair as one `lost` move, such as `container is-detail-page`. The other tokens of that string are still mapped.

The map is idempotent: no mapped value is itself a key, so a second run changes nothing.

## Scan

When the user gave a path list, pass those paths. Otherwise pass no files, so the scan covers the whole project.

```bash
node <this-skill-directory>/scripts/scan-css-utils.mjs <project-root> [<file> ...]
```

The script prints one JSON object and does not edit files. `files` lists every line with a class move, each with `line`, `snippet` and `classes: [{ from, to, group }]`. `dynamic` lists the places the scan found but cannot rewrite, each with `file`, `line`, `snippet` and `reason`. Pass paths relative to `<project-root>`. When the JSON has an `unmatched` list, those arguments are not source files under `<project-root>`. Fix the paths and run the scan again before you continue.

The scan reads source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.html` and the other script extensions) and stylesheets (`.css`, `.scss`, `.sass`, `.less`). In source files it reads these class contexts:

- `class="…"`, `class='…'` and unquoted `class=…` in HTML, Vue and Angular templates, also inside an Angular inline `template:`
- `className="…"`, `className={'…'}`, `className={"…"}` and ``className={`…`}`` in JSX
- Angular `[class]` and `[ngClass]`, and Vue `:class` and `v-bind:class`, with a string, an array, or an object whose keys are quoted or bare names (`{ container: wide }`)
- Angular `[class.<name>]` and `@HostBinding('class.<name>')`
- `classList.add`, `remove`, `toggle` and `contains` with string arguments
- Angular `host: { class: '…' }` and `'[class.<name>]'` host keys

Comments are skipped. In `.html` and `.vue`, only `<!--` is a comment outside `<script>` and `<style>`.

Show the findings grouped by file, with path, line, snippet and each `from` to `to`. End with the total per group, then the `dynamic` list.

`dynamic` holds every place the scan found but cannot rewrite, with one of these reasons:

- `template substitution` or `interpolation`: a class context with `${…}` or `{{ … }}`, such as ``className={`mb-small ${extra}`}`` or `class="mb-{{ size }}"`. The static parts are still in `files`. The substituted value may hold a legacy class. A template literal outside a class context, such as ``cx(`shadow-small ${x}`)``, is listed with this reason when its static text holds a mapped class.
- `string concatenation`: a class context built with `+`, such as `className={'mb-small ' + extra}`.
- `non-literal class binding`: a variable, a computed key (`[key]: cond`) or a spread inside `[ngClass]`, `[class]` or `:class`, such as `:class="classes"`.
- `string literal outside a class context`: a string that contains a mapped class, in code or in a bound attribute such as `:title="'radius-large'"` or `[attr.class]`. Examples are `const round = 'radius-normal p-small'` and the arguments of `cx(…)`. A literal that holds only unchanged classes, such as `'mt-normal'`, is not listed.
- `selector`: a string that selects a mapped class, such as `querySelector('.grid')`, `By.css('.container')` or `'class.grid'`.
- `selector in a stylesheet`: a selector of a mapped class, such as `.grid > .col` or `.border-primary-hovered`, in a stylesheet or a `<style>` block. The step never edits stylesheets. An `@extend .grid` line can show up here too; rewriting `@extend` is out of scope.
- `possibly commented`: a class context in a `.tsx`, `.jsx` or `.js` file behind a `//` on the same line. It is a real comment, or JSX text such as `https://x.ch`. Check which.

Every `dynamic` place is listed for the consumer to review, and every one keeps the Baloise utilities line, as the next sections say.

## Rewrite

For every move in `files` with a `to`, replace `from` with `to` on that line, inside the class context only. Keep the order of the classes, the whitespace and every other class on the element. In a `className` template literal, rewrite only the static text, never a `${…}` part. In `[class.<name>]`, rewrite the name. In an `[ngClass]` or `:class` object, rewrite the key and keep its condition. Quote a bare key when its new name has a hyphen or a colon, such as `{ 'ds-container': wide }`.

Leave every `lost` token unchanged, including a `container is-detail-page` pair. Leave every `dynamic` place unchanged. Never rewrite a string the scan did not list, even when it looks like a class, because the same word can be an element id or a CSS value (`display: 'grid'`).

## Legacy utilities line

After the rewrite, run the scan again without file arguments, so it covers the whole project.

**A `lost` move or a `dynamic` place is left**: keep the Baloise utilities line. Report why, with the number of lost moves and the number of dynamic places. A `dynamic` place that is clearly not a class, such as `role="grid"` or `display: 'grid'`, still counts, and so does a `selector in a stylesheet`. List each one so the consumer can review it. The line goes only after the consumer has fixed or removed every such place and a new scan is clean.

**No `lost` move and no `dynamic` place is left**: delete the Baloise utilities lines that the confirmation in `SKILL.md` covered. When the scan before the rewrite did not list them, list them now and ask one yes/no before you delete them. Find them in `imports` of:

```bash
node <this-skill-directory>/scripts/detect-baloise.mjs <project-root>
```

A Baloise utilities line is an `imports` entry for `@baloise/ds-styles/css/utilities/all` or a category file under `@baloise/ds-styles/css/utilities/`, with or without `.css`, in any form: a CSS or SCSS `@import` or `@use`, an HTML `<link>`, a TS or JS side-effect import, or an `angular.json` styles entry. For each line:

1. Delete the line. In `angular.json`, delete the string and keep the array valid JSON.
2. When the line directly above is a comment that mentions the legacy Baloise utilities, such as `/* TODO: remove the legacy Baloise utilities once no legacy utility class is left */`, delete it too. Keep any other comment. The comment above the bundled block (`/* TODO: remove these legacy Baloise imports once the Helvetia migration is verified */`) also covers `font`, `structure` and `core`, so it stays.
3. Never touch the `@helvetia-design/styles/css/utilities` line.

When `imports` still holds an uncommented `@baloise/ds-styles/css/all` line, that file bundles the utilities with normalize, font, structure and core. Do not edit it. Report that it still loads the legacy utilities.

When `imports` holds no Baloise utilities line, there is nothing to delete. Write U6 as `none found`.

## Report

These items form the checklist of the `css-utils` section. Each one gets its own line in `ds-migration-report.md`, as `shared/report.md` describes.

Needs your attention when found:

- U1. Every class rewritten from `approximated`, and where.
- U2. Every `lost` move left unchanged, and where, including `container` pairs with `is-detail-page` or `is-blog-page`.
- U3. Every `dynamic` place, with its reason, and where.
- U4. When the Baloise utilities line stays, the reason, with the number of lost moves and dynamic places.
- U5. Every uncommented bundled `@baloise/ds-styles/css/all` line, with the note that it still loads the legacy utilities.
- U6. Every Baloise utilities line deleted, with file and line, and every utilities TODO comment deleted with it.

Coverage only, written to the file:

- U7. Every class rewritten from `renamed`.
- U8. Every token rewritten from `variant`.
- U9. Every class rewritten from `structure`.
