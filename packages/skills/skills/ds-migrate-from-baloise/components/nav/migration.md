# nav (report only)

Report every `bal-nav` usage. This migration rewrites nothing. It lists every usage in `ds-migration-report.md` with the reason and the suggested replacement, so the consumer can rebuild the header by hand.

`bal-nav` is configured by JSON props: `options` (`BalProps.BalNavOptions`), `logo` (`BalProps.BalNavLogoLink`) and `buttons` (`BalProps.BalNavMetaButtons`). From them it renders a meta bar, a menu bar and flyouts with link grids. `ds-app-navbar` has only the slots `brand`, `title`, `menu-start`, `menu-end` and `actions`. It has no meta bar, no flyout and no link grid. An automatic rewrite would lose the whole navigation, so the skill only reports it.

The legacy folder has seven child tags that `bal-nav` renders itself: `bal-nav-link`, `bal-nav-link-grid`, `bal-nav-link-grid-col`, `bal-nav-link-group`, `bal-nav-menu-bar`, `bal-nav-menu-flyout` and `bal-nav-meta-bar`. An app rarely writes them, but the scan lists them when it does.

The scan lists the root, the seven child tags, and the React and Angular symbols `BalNav`, `BalNavLink`, `BalNavLinkGrid`, `BalNavLinkGridCol`, `BalNavLinkGroup`, `BalNavMenuBar`, `BalNavMenuFlyout` and `BalNavMetaBar`. It lists `HTMLBalNav*Element` types too. It does not match `bal-navbar`, `BalNavbar*` or the `balNavigate` event. Those belong to the `navbar` migration and other components. It does not match the ambient `BalProps.BalNav*` and `BalEvents.BalNav*` types. Search for them yourself in each file with a finding.

This migration edits no source file. `SKILL.md` says how the icon and legacy config rules apply to a report-only migration.

## 1. Scan

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-bal-nav.mjs <project-root>
```

The script prints one JSON object. `total` is the number of findings. `files` groups them by path. Each finding has `line` and `snippet`.

Show that list to the user grouped by file (path, line, snippet) and end with the total count. Say that no `ds-*` component replaces `bal-nav`, and that the next step only writes report entries.

Done when the user has seen every finding and the total. If `total` is 0, say there are no `bal-nav` usages to report and stop.

## 2. Confirm

Ask for one yes/no: write a report entry for every listed usage? No source file is edited.

On no, stop with the files unchanged.

On yes, continue.

Done when the user has answered.

## 3. Rewrite

Nothing is rewritten. Every `bal-nav`, its child tags, its imports and its types stay as they are. For every finding, read the whole element and collect what the report needs: the file and line, where the `options`, `logo` and `buttons` values come from, and every `balNavItemClick` handler.

Angular splits a component across `x.component.html` and `x.component.ts`, and the class file often calls `configChanged()` through `@ViewChild` or `viewChild`, or holds the `balNavItemClick` handler, without ever naming the tag, so the scan cannot see it. For every `.html` finding, open the same-basename `.ts` file beside it and check it for `configChanged()` calls and for a `balNavItemClick` handler. React and plain HTML callers hold the element in a ref or a query result, so look for calls on that variable in the same file.

### Suggested replacement

Rebuild the header by hand with `ds-app-navbar`:

- Put the logo link into the `brand` slot, as `<a slot="brand" href="…">` around a `ds-logo`.
- Put the top-level links from `options` into `<div slot="menu-start">` or `<div slot="menu-end">`, as plain `<a>` links.
- Put the meta buttons from `buttons` into the `actions` slot.
- Flyouts and link grids have no `ds-*` equivalent. Link to an overview page instead, or build the flyout as an app component.
- Move tracking from `balNavItemClick` to `click` listeners on the rebuilt links.

`components/navbar/migration.md` shows the `ds-app-navbar` markup, the imports and the slot names.

### Props, children and events

| old (`bal-nav`) | suggested `ds-*` building block | handling |
| --- | --- | --- |
| `logo` | `<a slot="brand">` with `ds-logo` | Report it. Take `href`, `target` and `ariaLabel` from the object. |
| `options` | `<div slot="menu-start">` with plain `<a>` links | Report it. Each top-level item becomes one link. `mainLinkItems`, `sectionLinkItems` and `serviceLinkItems` have no target. |
| `buttons` | `actions` slot with `ds-button` elements | Report it. A button with `popupId` opened a `bal-popup`. Name that popup in the report. |
| `bal-nav-meta-bar` | `ds-app-navbar` | Report it. The meta bar and the menu bar collapse into one bar. |
| `bal-nav-menu-bar` | `menu-start` / `menu-end` slots | Report it. |
| `bal-nav-menu-flyout`, `bal-nav-link-grid`, `bal-nav-link-grid-col`, `bal-nav-link-group` | _(none)_ | Report it. The consumer builds the flyout or links to an overview page. |
| `bal-nav-link` | plain `<a>` | Report it. |
| `balNavItemClick` | `click` listener on each rebuilt link | Report it with its handler. The detail held `label`, `value`, `href`, `rel`, `data` and `target` of the clicked item. |
| `configChanged()` | _(none)_ | Report it. `ds-app-navbar` reads the `ds-root` config itself. |

### Tags and imports

- **HTML**: `<bal-nav>` stays.
- **Angular**: `<bal-nav>` stays in the template, and `BalNav` stays in the `@baloise/ds-angular` import and in `imports: [...]`.
- **React**: `<BalNav>` stays, and `BalNav` stays in the `@baloise/ds-react` import.

While a `bal-nav` is left, **Detect** keeps suggesting `nav`, the legacy config call stays, and **Cleanup** stays `incomplete`. They clear once the consumer has rebuilt the header and removed `bal-nav`.

## 4. Report

Write the report as `shared/report.md` describes, with the per-file summary under Files changed. Files changed lists no file, because this migration edits none. Every item below gets its own line in the coverage checklist, found or none found.

Needs your attention when found:

1. Every `bal-nav`, not migrated. Name file and line, say that `ds-app-navbar` has no meta bar, flyout or link grid, and give the suggested replacement from the Rewrite step.
2. Every `options`, `logo` and `buttons` value, with the file and line of the object or binding it comes from, as the input for the rebuild.
3. Every `buttons` entry with `popupId`, with the popup it opens.
4. Every `balNavItemClick` handler, with the suggestion to move the tracking to `click` listeners on the rebuilt links.
5. Every child tag written by the app, not migrated, with its suggested building block from the table.
6. Every `BalNav*` symbol, `HTMLBalNav*Element` type and `BalProps.BalNav*` or `BalEvents.BalNav*` type. They stay until the rebuild and keep **Detect** and **Cleanup** listing `nav`.
7. Every selector in the project's own styles that targets `bal-nav` or a `bal-nav__*` class. It stops matching once the header is rebuilt.
8. One-time note, when at least one `bal-nav` is left: **Cleanup** stays `incomplete` and the legacy config call stays until the consumer has rebuilt the header by hand.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every numbered item has its line in `ds-migration-report.md`, the chat shows only the attention items and the pointer line, and the working tree is still unstaged.
