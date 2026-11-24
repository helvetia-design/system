# Cleanup

The **Cleanup** menu item applies these rules. It runs last, after every `bal-*` component is migrated, and again once a kept line is gone. It deletes the legacy `structure` and `core` imports that Init kept, the Init TODO comment above them, and the legacy `@baloise/ds-*` dependencies. `SKILL.md` says when each part runs.

Once no `bal-*` component is left, no `ds-*` component uses the legacy `structure` and `core` styles. So Cleanup deletes every active single-line `structure` or `core` import of a shape Init keeps, with or without the TODO comment above it. The `core` line also styles plain classes such as `table`, `link` and `field`. It stays until **CSS utils** has rewritten them, so run **CSS utils** before Cleanup.

## Scan

```bash
node <this-skill-directory>/scripts/scan-cleanup.mjs <project-root>
```

The script prints one JSON object and does not edit files. It first runs `scan-migratable.mjs` on the whole project, including `.vue`, `.js`, `.mjs` and `.htm` files. It also lists under `hidden` every line with a `bal-*` tag that `scan-migratable.mjs` cannot see, such as a tag inside a string literal (`el.innerHTML = '<bal-tag>'`), with `file`, `line` and `snippet`. When `suggested`, `notYet`, `types`, `byHand` or `hidden` lists anything, it prints `status` `incomplete` and the lists under `outstanding`, and nothing else. `byHand` lists legacy tags without a `ds-*` equivalent (`bal-check`, `bal-switch`, `bal-radio-icon`) and appears only when it is not empty. `types` are the legacy type namespaces such as `BalEvents` that `scan-migratable.mjs` lists. They block Cleanup, because the dependency removal would break every file that still imports them.

Then it runs the **CSS utils** scan, `scan-css-utils.mjs`, on the whole project. While that scan reports a `core` or `core-lost` move or a `dynamic` place with `group: 'core'` or `core: true` and a reason other than `selector in a stylesheet`, every `css/core` line that would go to `remove.lines` goes to `keep.lines` with `reason` `css-utils`. The `structure` lines still go.

Without an outstanding entry, `status` is `ready`, or `nothing-to-clean-up` when both `remove` lists are empty. `packageManager` and `installCommand` come from the `packageManager` field or the nearest lockfile at or above `<project-root>`, as in Init. `installCommand` can be `bun install`.

The script reads the source files listed in the Init section of `SKILL.md`, every stylesheet (`.css`, `.scss`, `.sass`, `.less`), every `.json` file and every `.yml` or `.yaml` file. It skips lockfiles and the folders that Init lists. Build tooling outside these files can still name a legacy package, so the consumer checks it before confirming.

The script sorts every line that names an `@baloise/ds-*` package into one list:

- `remove.lines` with `kind` `import`: an active line that is exactly one statement naming `@baloise/ds-styles/css/structure` or `@baloise/ds-styles/css/core`, with or without `dist/`, `.min` and `.css`. The statement is `@import '<path>';` or `@use '<path>';` with one path, `import '<path>'`, a complete `<link>` tag on one line, or, in `angular.json` and `project.json`, a line that holds only the JSON string.
- `remove.lines` with `kind` `todo`: the Init comment `TODO: remove these legacy Baloise imports once the Helvetia migration is verified`, in its `//`, `/* */` or `<!-- -->` form, when every active legacy line directly below it is in `remove.lines`, or when no legacy line is below it.
- `keep.lines` with `reason` `legacy-below`: that TODO comment when a kept legacy line is still directly below it. It goes in a later Cleanup run, once that line is gone.
- `keep.lines` with `reason` `assets`: an active `css/font` or `sass/font` line of `@baloise/ds-styles`, and every active `@baloise/ds-fonts`, `@baloise/ds-favicons`, `@baloise/ds-icons` or `@baloise/ds-brand-icons` reference. Run **Assets** first.
- `keep.lines` with `reason` `css-utils`: an active `@baloise/ds-styles/css/utilities/...` line, and a `css/core` line while the CSS utils scan reports a `core` or `core-lost` move or a `dynamic` place with `group: 'core'` or `core: true`. Run **CSS utils** first. It rewrites only the `core` moves. The consumer fixes the `core-lost` moves, such as `file` or `table is-bordered`, and the `dynamic` places by hand. A `selector in a stylesheet` does not keep the line, because the app's own stylesheet does not use `css/core`.
- `keep.lines` with `reason` `legacy-config`: an active import or export line that names `initializeBaloiseDesignSystem`, `useBaloiseDesignSystem`, `provideBaloiseDesignSystem`, `BaloiseDesignSystemModule` or `updateBalLanguage`, also as the `from` line of a multi-line import. Run **Assets** first. Its Decide step in `shared/legacy-config.md` carries the brand, language and region values over to `ds-root`, `DsRootProvider` or `initializeDesignSystem` and then deletes the call and its import. Deleting the import by hand loses those values.
- `keep.lines` with `reason` `manual`: every other active legacy reference. That includes a `structure` or `core` line of any other shape, such as an `@import` list, a multi-line `<link>`, an `angular.json` object entry, a Vite `additionalData` string or a `package.json` script, and `css/all`, `bal-notices.js`, tsconfig `types` or `paths`, and legacy keys in `overrides` or `resolutions`. Cleanup does not delete it. The consumer decides. The toast and snackbar migrations normally delete a `bal-notices.js` import, so one left here is one they kept.
- `commented`: every commented-out legacy line, such as the `normalize` or `css/all` line that Init commented out, and every YAML line that starts with `#`. In YAML only `#` starts a comment.

The CSS utils scan does not see a `css/core` class alone in a plain code string, such as `cx('table', x)` or a variable that holds `'table'`. Before confirming Cleanup, the consumer checks such places, because the `css/core` line goes without them.

A line that holds the Init TODO comment after code is classified by its code, not as the TODO.

A key directly inside a dependency field of `package.json` (`dependencies`, `devDependencies`, `optionalDependencies` or `peerDependencies`) is no legacy reference, even when a one-line `package.json` holds it next to a script. Every other `package.json` line that names a legacy package is.

`remove.dependencies` and `keep.dependencies` hold every `@baloise/ds-*` key in a dependency field of each `package.json`, with `packageJsonPath` and `field`. A package declared in two fields has one entry per field. `keep.dependencies` adds `reason` and `usedBy`:

- `used`: a line in `keep.lines` still names the package. `usedBy` lists those lines as `<file>:<line>`. A line counts for the `package.json` files in its folder or above. When none of those declares the package, such as a workspace library that imports what only the app declares, it counts for every `package.json` that declares it. Delete or migrate the lines first.
- `manual`: a legacy package that no step of this skill migrates, such as `@baloise/ds-testing`. The consumer decides.

`unreadable` lists every `package.json` that is not valid JSON. The script reads neither its dependencies nor its lines.

## Lines

1. Delete every line in `remove.lines` exactly, the whole line. Delete nothing else.
2. In `angular.json` and `project.json`, delete the string and keep the file valid JSON. When the deleted string was the last entry of its array, delete the comma at the end of the entry above it.
3. Never touch a line in `keep.lines` or `commented`, and never touch an `@helvetia-design/*` line.

## Dependencies

1. Delete every key in `remove.dependencies` from its `field` in its `package.json`. Leave every other key and the order of the remaining keys unchanged, and keep the file valid JSON.
2. When a field is empty after that, leave it as an empty object.
3. Never delete a key in `keep.dependencies`, and never edit a file in `unreadable`.
4. When at least one dependency was deleted, run `installCommand` exactly from `<project-root>`. Do not add package arguments. When none was deleted, do not run it.

## Report

These items form the checklist of the `cleanup` section. Each one gets its own line in `ds-migration-report.md`, as `shared/report.md` describes.

Needs your attention when found:

- C1. Every legacy line kept, with file and line and the step that removes it: **Assets** for `assets` and `legacy-config`, **CSS utils** for `css-utils`, the consumer for `manual`. For a `css/core` line kept as `css-utils`, **CSS utils** rewrites the `core` moves, and the consumer fixes the `core-lost` moves and the `dynamic` places with `group: 'core'` or `core: true` by hand.
- C2. Every dependency kept, with its manifest, field and `reason`, and the `usedBy` lines for `used`.
- C3. Every `package.json` in `unreadable`, with the note that its dependencies were not checked.
- C4. The install command, when it failed, with its error.

Coverage only, written to the file:

- C5. Every legacy import line deleted, with file and line.
- C6. The Init TODO comment deleted or kept, and why.
- C7. Every dependency deleted, with its manifest and field.
- C8. The install command run, or not run because no dependency was deleted.
- C9. Every commented-out legacy line left in place, with file and line.
