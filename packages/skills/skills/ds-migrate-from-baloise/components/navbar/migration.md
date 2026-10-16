# navbar

Migrate every `bal-navbar` usage to `ds-app-navbar`. Init has already added the `@helvetia-design/*` packages. This task rewrites usages only.

The legacy folder has one root and four consumer child tags: `bal-navbar-brand`, `bal-navbar-menu`, `bal-navbar-menu-start` and `bal-navbar-menu-end`. `ds-app-navbar` has no child components. It has the slots `brand`, `title`, `menu-start`, `menu-end` and `actions`, and it draws its own hamburger button. Only the root is a tag-for-tag rename. The children become plain elements with a `slot` attribute, or disappear. Leave slotted content in place, including legacy tags such as `bal-button`, `bal-logo` and `bal-icon`. Those belong to their own migrations.

The scan lists the root, the four child tags, and the React and Angular symbols `BalNavbar`, `BalNavbarBrand`, `BalNavbarMenu`, `BalNavbarMenuStart` and `BalNavbarMenuEnd`. It does not match the ambient `BalProps.BalNavbarInterface` or `BalEvents.BalNavbar*` types. Those are Report items, not rewrites.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-navbar.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-navbar` usages to migrate and stop.

## 2. Confirm

Ask for one yes/no: rewrite every listed usage?

On no, stop with the files unchanged.

On yes, continue. Editing starts only after that answer.

Done when the user has answered.

## 3. Rewrite

Edit each finding yourself, using the mapping below. Read the whole element when attributes continue past the snippet's first line. This step is finished when every finding matches the mapping or is reported as not migrated.

### Skip `interface="simple"`

Before editing a `bal-navbar`, read its `interface`. `ds-app-navbar` is for application use only. The legacy `simple` interface (the sales-funnel navbar) has no counterpart, and a rewrite would change how the navbar behaves.

- `interface` omitted, `interface="app"`, `[interface]="'app'"` or `interface={'app'}`: migrate.
- `interface="simple"`, or any dynamic value such as `[interface]="x"` or `interface={x}`: do not migrate. Leave the whole navbar as it is, including its child tags and the `@baloise` imports that only that navbar needs. List it by file and line as "not migrated".

When a file has both kinds of navbar, migrate the app ones and keep the `@baloise` import for the symbols the remaining ones still use.

### Props

| old (`bal-navbar`)                                 | new (`ds-app-navbar`) | handling                                                                                                                             |
| -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `light`                                            | `light`               | Copy as-is, in every form (`light`, `[light]="x"`, `light={x}`).                                                                     |
| `container="fluid"` or `"compact"`                 | `container`           | Copy as-is.                                                                                                                          |
| `container=""`                                     | _(drop)_              | The empty value was the default. Drop the attribute.                                                                                 |
| `container="detail-page"`, `"blog-page"`, `"wide"` | _(no equivalent)_     | Drop it. `ds-app-navbar` accepts `default`, `fluid` and `compact`. List each one by file and line as "needs manual rework".          |
| `container` with a dynamic value                   | `container`           | Copy the binding unchanged and list it by file and line, so the consumer checks that it only yields `default`, `fluid` or `compact`. |
| `interface="app"`                                  | _(drop)_              | `ds-app-navbar` is the app navbar. Drop the attribute. For `simple`, see above.                                                      |
| _(none)_                                           | `open`                | New. Nothing to migrate from. Leave it unset.                                                                                        |
| _(none)_                                           | `title` slot          | New. Nothing to migrate from. Leave it empty.                                                                                        |

### Child tags

| old                     | new                       | handling                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bal-navbar-brand`      | `<a slot="brand">`        | Rename the element to `a`, closing tag included, and add `slot="brand"`. Move `href`, `rel` and `target` onto the `<a>` unchanged. When the brand has no `href`, use `<div slot="brand">` instead, because an `<a>` without `href` is neither a link nor focusable. Drop `logo`, `logoSize`, `logoBrand`, `logoLabel`, `logoClickable`, `simple`, `animated` and `interface` in every form. Do not build a logo. List each dropped prop by file and line as "needs manual rework". |
| `bal-navbar-menu`       | _(drop the element)_      | Remove the opening and closing tag and keep its children in place as direct children of the navbar. Drop its `interface` attribute with it. Then apply the unslotted-children rule below.                                                                                                                                                                                                                                                                                          |
| `bal-navbar-menu-start` | `<div slot="menu-start">` | Rename the element to `div`, closing tag included, and add `slot="menu-start"`. Drop `interface`.                                                                                                                                                                                                                                                                                                                                                                                  |
| `bal-navbar-menu-end`   | `<div slot="menu-end">`   | Rename the element to `div`, closing tag included, and add `slot="menu-end"`. Drop `interface`.                                                                                                                                                                                                                                                                                                                                                                                    |

**Unslotted children.** `ds-app-navbar` has no default slot, so any direct child of the navbar without a valid `slot` attribute does not render. This applies to what sat inside `bal-navbar-menu` and to anything placed directly inside `bal-navbar`, such as loose links, buttons or tabs. After the rewrite, check every direct child of each migrated navbar. Do not leave one unslotted and do not delete it. Either wrap it in `<div slot="menu-start">` or `<div slot="menu-end">` when its position in the legacy menu makes the side clear, or leave it and list it by file and line as "needs manual rework".

The legacy brand drew the hamburger button and the animation itself. `ds-app-navbar` draws its own hamburger and has no `animated` prop, so nothing replaces them.

### Tags and imports

- **HTML**: `<bal-navbar>` becomes `<ds-app-navbar>`, including the closing tag, and the child tags follow the table above.
- **Angular**: apply the same rewrite in `.html` templates and in inline `template:` strings, including closing tags. When a file imports `BalNavbar` from `@baloise/ds-angular`, move only `BalNavbar` to `import { DsAppNavbar } from '@helvetia-design/angular'` and leave the other symbols on the `@baloise` import. Replace `BalNavbar` with `DsAppNavbar` in `imports:` lists too. Remove `BalNavbarBrand`, `BalNavbarMenu`, `BalNavbarMenuStart` and `BalNavbarMenuEnd` from the `@baloise` import and from `imports:` lists. They have no replacement.
- **React**: `<BalNavbar>` becomes `<DsAppNavbar>` and `</BalNavbar>` becomes `</DsAppNavbar>`. Import `DsAppNavbar` from `@helvetia-design/react`. When the existing `@baloise/ds-react` import also binds other symbols, move only `BalNavbar` and leave the others on the `@baloise` import. The children become the plain elements from the table above, for example `<BalNavbarMenuStart>` becomes `<div slot="menu-start">`. Remove `BalNavbarBrand`, `BalNavbarMenu`, `BalNavbarMenuStart` and `BalNavbarMenuEnd` from the `@baloise/ds-react` import. When the import binds nothing else, delete the whole import line.

Apply the "move only" and "remove" rules per file. A file that still holds a navbar that was not migrated keeps the symbols that navbar uses.

### Events

Do not rewrite handlers. The events are not one-to-one, so list each one by file and line, together with this mapping.

The legacy events are emitted by `bal-navbar-brand` and reach a listener on `bal-navbar` only by bubbling. `ds-app-navbar` emits the `dsMenu*` events on its own host. A listener that sits on the brand must move to the navbar, so say so in the report entry.

| old                                                     | new                                      | handling                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `balWillAnimate` (detail `boolean`, `true` = opening)   | `dsMenuOpenStart` and `dsMenuCloseStart` | One event became two, and the `boolean` detail is gone. The consumer picks the one that matches the old `true` or `false` branch. |
| `balDidAnimate` (detail `boolean`, `true` = opening)    | `dsMenuOpenEnd` and `dsMenuCloseEnd`     | Same split.                                                                                                                       |
| `balNavigate` (click on the brand, detail `MouseEvent`) | _(no equivalent)_                        | The brand is now a plain `<a slot="brand">`. Listen for `click` on it.                                                            |

Framework spellings: Angular `(balWillAnimate)` is `(dsMenuOpenStart)` and `(dsMenuCloseStart)`, React `onBalWillAnimate` is `onDsMenuOpenStart` and `onDsMenuCloseStart`, and `addEventListener('balWillAnimate'` is `addEventListener('dsMenuOpenStart'` and `addEventListener('dsMenuCloseStart'`. The same applies to `balDidAnimate`.

In each file with a finding, also look for these listeners where they are not on the element, including `addEventListener`. The scan does not list a file that only listens and never uses a navbar tag or symbol.

### Methods

Do not rewrite these. Report each call with file and line.

- `toggleMenu()` on the navbar is now `toggleSidebar()`. `openSidebar()` and `closeSidebar()` are new. The legacy method toggled the brand, so it only worked while the brand existed.
- `toggle()` on `bal-navbar-brand` has no equivalent. Call `toggleSidebar()` on `ds-app-navbar`.

## 4. Report

Print a per-file summary of what changed. End with the items below, each with file and line:

- every navbar that was not migrated because of `interface="simple"` or a dynamic `interface`, with its child tags and imports left in place
- every dropped `container` value (`detail-page`, `blog-page`, `wide`) and every dynamic `container` binding
- every dropped `bal-navbar-brand` prop (`logo`, `logoSize`, `logoBrand`, `logoLabel`, `logoClickable`, `simple`, `animated`), so the consumer builds the brand content in the `brand` slot
- every direct child of a migrated navbar that is still without a `slot`, because it does not render
- every `bal-navbar-brand` that had no `href` and became a `<div slot="brand">`
- every `balWillAnimate` and `balDidAnimate` listener, with the new event names, and every `balNavigate` listener, with `click` on the brand as the replacement
- every `toggleMenu()` and brand `toggle()` call, with `toggleSidebar()` as the replacement
- every `BalProps.BalNavbarInterface` and `BalEvents.BalNavbar*` type reference that needs a manual check
- every legacy selector that no longer applies, such as `.bal-navbar`, `.bal-navbar__nav`, `.bal-navbar__brand`, `.bal-navbar__menu`, `.bal-navbar--is-light` and the `is-simple` and `context-*` modifiers. `ds-app-navbar` renders in shadow DOM, so these are lost. The navbar is styleable through `part="nav"`, `part="hamburger"` and `part="sidebar"`

Leave every change unstaged for the consumer to review. Stop. Do not run `git add` or `git commit`.

Done when the summary is printed and the working tree is still unstaged.
