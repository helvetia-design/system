# Batch: several component migrations on one set of files

A batch migrates every `bal-*` component in a set of files in one run, with one confirmation. **Scope** and the cascade question in **Manual** and **Detect** start it. Both hand over a file set and the `scan-migratable.mjs` JSON for it.

A batch exists because a parent and its nested children must change together. Migrating only the parent leaves its nested `bal-*` children in place inside the new `ds-*` parent — a mixed `bal-`/`ds-` tree, not an error, so nothing fails loudly. `ds-button-group` styles `::slotted(ds-button)` and `ds-checkbox-group` queries `ds-checkbox`: a migrated parent around a legacy, un-migrated nested child loses layout or wiring silently. A batch migrates the parent and every nested and sibling `bal-*` component in the same files together, so none of them is left stranded inside an already-migrated parent.

`<project-root>` is the consumer project root that contains the app lockfile. Every path in this file is relative to it.

## 1. Collect

1. For every `.html` in the file set, add the `.ts` with the same basename in the same folder, when it exists. For every `.ts`, add the `.html` the same way. Angular splits one component across both files, and the class file often names a legacy symbol that the template does not.
2. Run the migratable scan on the file set:

   ```bash
   node <this-skill-directory>/scripts/scan-migratable.mjs <project-root> <path> [<path> ...]
   ```

   When the JSON has an `unmatched` list, those paths are not source files or folders under `<project-root>`. Fix the paths and run the scan again before you continue.

3. The migration list is every entry in `suggested`. Run the scanner of every migration in the list on the same paths, as in step 4 below. The file set is every file that at least one of these scanners reports. Do not filter by `files`: it counts only what Detect sees. The component scanners also match test commands and other component-specific forms, so the file set still comes from the scanners.

If `suggested` is empty, report that the files use no component with an available migration, show `notYet`, and stop.

Done when the file set and the migration list are fixed.

## 2. Shared files

For each file in the set, search the project outside the set for imports of it. Search for the path without its extension, as it appears in an import specifier, and for the Angular selector when the file is a component class. For each hit, note the importing file.

A file imported from outside the set is shared. Migrating it changes those other pages too. Do not drop it. The user decides in the next step.

Done when every file in the set has been checked.

## 3. Show and confirm

Show, in this order:

1. The file set, grouped by folder.
2. The migration list in rewrite order (see Order below), each with its `total`.
3. `notYet` with each `total`. These stay `bal-*`.
4. The shared files, each with its importers.
5. The legacy config calls to delete, when the batch will leave no `bal-*` component. Run the Scan section of `shared/legacy-config.md`. Its `scan-migratable.mjs` call runs without path arguments. A component in the migration list does not count as left when its `total` there equals its `total` in the batch scan, because then every usage lies in the file set. A report-only migration such as `nav` or `stage`, and a component with a usage that its migration file leaves in place or reports as not migrated, always counts as left. Every other component counts as left.

When the migration list has more than eight entries, the batch is too large. Do not ask whether to continue. Split the file set into parts by folder, so that the files of each part use at most eight migrations. Split a folder that still uses more than eight by file. A part that is a single file, together with the sibling files that step 1.1 adds, cannot be split further. It is exempt from the limit. Show the parts, each with its folders or files and its migrations. Then run the first part as its own batch, from step 1 with its paths and with its own confirmation. The user starts each next part with **Scope**.

Then ask for one yes/no for this batch or part: migrate every listed component in every listed file? Before the answer, the user may exclude files or components. Remove them from the file set or the migration list. On no, stop with the files unchanged.

Editing starts only after the yes. Done when the user has answered.

## 4. Rewrite

### Order

Run the migrations in this order. Structural parents first, because their `migration.md` rules restructure the children. Leaves last.

1. `card`, `modal`, `list`, `accordion`, `tabs`, `steps`, `navbar`, `sheet`, `popup`, `popover`
2. every other migration in the list, alphabetical
3. `field`, `button`, `close`, `icon`, `text`, `heading`, `badge`, `tag`, `divider`

Skip every name the migration list does not contain.

`field` runs after every form control migration. Each control migration removes the `bal-field` around its own controls, following `shared/field.md`. The `field` migration then handles the grid, every `bal-field` that is left and every `bal-ng-error` whose target is a `ds-*` control, also outside a `bal-field`.

`dropdown`, `form`, `table` and `time-input` run in the alphabetical middle group. `time-input` rewrites the `bal-field` around its own native input to the CSS field markup, so it has to run before `field` too, which would leave a `bal-field` around a native input in place.

### Per migration

For each migration, in order:

1. Read `components/<name>/migration.md`. Read one at a time. Do not keep the earlier ones open.
2. Run its scanner on the file set:

   ```bash
   node <this-skill-directory>/scripts/scan-bal-<name>.mjs <project-root> <file> [<file> ...]
   ```

   For `app`, run `scan-bal-app.mjs <project-root>` without file arguments instead. Its legacy config calls usually sit in a startup file outside the file set, and they hold the values for the Config section of `components/app/migration.md`. Rewrite only the `bal-app` usages in the file set.

3. Apply its **Rewrite** step to those findings only. Skip its **Scan** display, its **Confirm** step and its stop.
4. For a form control migration, apply `shared/field.md` in the same pass, as `SKILL.md` describes.
5. Skip the icon import and Registration rules from `shared/icons.md` and every rule from `shared/legacy-config.md`. Steps 6 and 7 run them once for the whole batch. Keep applying the icon name rule to icon props that the migration file copies.
6. Note the outcome of every numbered item of its **Report** step, then of every `F` item of `shared/field.md` when step 4 applied, with file and line. Do this before moving to the next migration.

A rule in a `migration.md` that names a sibling or child by its `bal-*` tag also matches the `ds-*` tag an earlier migration in this batch already wrote. The card rule "wrap the `bal-close` next to the title in `ds-card-header`" also wraps a `ds-close`.

When a migration fails or the user interrupts, stop the loop. Go to step 8 and list the migrations that did not run.

Done when every migration in the list has run.

## 5. Imports

Each migration moves only its own symbols and leaves the others on the `@baloise/ds-angular` or `@baloise/ds-react` import. In every file the batch touched, delete each `@baloise/ds-angular` and `@baloise/ds-react` import that has no specifier left. Leave an import that still binds a symbol.

Done when no touched file has an empty legacy import.

## 6. Icons

Follow `shared/icons.md` once for the union of every file the batch touched:

- Run its **Scan** with those files as arguments.
- Run the final icon scan from its **Report** section, `scan-icon-imports.mjs <project-root>` without file arguments, so it covers the whole project.
- Apply every rule, including Registration. The legacy registration usually sits in a startup file outside the file set. Edit it there.
- Note the outcome of every `I` item from its **Report** section.

When the icon scan reports `total` 0, write each `I` item as `none found`.

Done when every icon rule has been applied to the touched files.

## 7. Legacy config

Follow `shared/legacy-config.md` once for the whole project. Run its `scan-bal-app.mjs <project-root>` call without path arguments, even when `app` ran in this batch, and do not reuse the findings of a scan on the file set. The batch rewrite has already happened, so run its `scan-migratable.mjs` call again without path arguments, and count every component it lists as left. Then apply its **Decide** section and note the outcome of every `L` item.

When a `bal-*` component is left, name the remaining components with their `total` under L7.

Done when every legacy config call is deleted or reported as staying.

## 8. Report

Append one section to `ds-migration-report.md` as `shared/report.md` describes. Its title is `<date> batch: <name>, <name>, ...`, with the migrations that ran, in order.

**Needs your attention** lists every attention line of every migration, of `shared/field.md`, `shared/icons.md` and `shared/legacy-config.md`, then three batch lines. Each batch line is written as `None.` when it has nothing:

1. `notYet` components left in the file set, with their files. A `notYet` child inside a migrated parent belongs here, because the parent may now style or query it by its `ds-*` tag.
2. The shared files, with their importers outside the set.
3. The migrations that did not run, when the batch stopped early.

Write one coverage checklist per source, each under its own heading:

- `### Coverage checklist: <name>` for every migration that ran, in order. It holds that migration's numbered items, then its `F` items when `shared/field.md` applied.
- `### Coverage checklist: icons` with the `I` items.
- `### Coverage checklist: legacy config` with the `L` items.

Follow the checklist rules in `shared/report.md` for every line. **Files changed** has one line per file, naming every migration that changed it.

In chat, show the **Needs your attention** lines and the pointer line from `shared/report.md`, counted over every checklist in the section.

Leave every change unstaged for the consumer to review, including `ds-migration-report.md`. Stop. Do not run `git add` or `git commit`.

Done when every checklist has a line for each of its items, the chat shows only the attention lines and the pointer line, and the working tree is still unstaged.
