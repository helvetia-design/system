---
name: ds-migrate-from-baloise
description: Migrate a consuming app from the Baloise Design System (bal-*) to the Helvetia Design System (ds-*). Use when bootstrapping Helvetia packages alongside Baloise, or when migrating components, CSS utilities, or assets.
---

# ds-migrate-from-baloise

This skill edits files in the consumer's repository and leaves every change unstaged, including the report file `ds-migration-report.md` that `shared/report.md` describes. Reviewing and committing is the consumer's job. This skill never runs `git add` or `git commit`.

## Menu

On invocation, present this menu and wait for one choice:

1. **Init** — bootstrap Helvetia packages alongside the existing Baloise install
2. **Components** — migrate a specific `bal-*` component to `ds-*`
3. **CSS utils** — rewrite legacy Baloise utility classes and delete the Baloise utilities line once none is left
4. **Assets** — migrate legacy icons in files that no component migration touches, and delete the legacy config call once no `bal-*` component is left

Then follow only the matching section below. Stop when that section says to stop.

### Init

Bootstrap the Helvetia packages alongside the existing Baloise install. Do not remove or edit existing `@baloise/*` dependencies or imports.

Scan `<project-root>`, the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/detect-baloise.mjs <project-root>
```

The script prints one JSON object. It resolves the current `latest` dist-tag with `npm view @helvetia-design/core dist-tags`. Use `version` and `aliases` from that JSON. Do not hardcode a version.

The walk skips `node_modules`, `dist`, `build`, `out`, `.next`, `.angular`, `.git`, `.claude`, and `coverage` at any depth.

If `status` is `nothing-to-migrate`, tell the user: no Baloise Design System installation detected, nothing to migrate. Stop. Do not edit files and do not install.

If `status` is `error`, tell the user `message` and stop. Do not edit files and do not install.

If `status` is `ready`, show the detected framework, package manager, version, aliases, and bootstrap files, then ask for one yes/no. On no, stop without editing. On yes:

1. Add each entry in `aliases` to the `dependencies` object of `packageJsonPath` (relative to `<project-root>`). Create `dependencies` if it is missing. Do not change or remove existing keys. If an `@helvetia-design/*` key is already present, leave its value unchanged and report both the existing value and the value from the JSON.
2. From `<project-root>`, run `installCommand` exactly (`pnpm install`, `yarn install`, or `npm install`). Do not add extra package arguments.
3. Insert the new CSS/JS import next to the existing `@baloise/*` one:
   - When inserting or replacing a SCSS line, match the at-rule of the line it sits beside or replaces (`@import` or `@use`) — never hardcode `@import` for a project wired with `@use`.
   - First handle these `@baloise/ds-styles/css/*` forms (with or without the `.css` extension), per the rules below. Then apply the generic bootstrap rule to every remaining `bootstrap` import. The real top-level files in the v19 line are `normalize`, `font`, `structure`, `core`, `basic`, `mixins`, `baloise-design-system`, and `all` — there is no top-level `utilities` file.
     - `normalize`
     - `font`, `structure`, `core`
     - The Baloise **utilities** line, in any of its real forms: `css/utilities/all`, one of the nine category files under `css/utilities/` (`background`, `border`, `elevation`, `flex`, `grid`, `interaction`, `layout`, `sizing`, `spacing`, `typography`), or the bundled `css/all` (see below)
   - `normalize`: comment out the original line in place (wrap it as `/* @import '@baloise/ds-styles/css/normalize.css'; */`, or the equivalent for its syntax). Immediately below the commented line, insert both, using the matching at-rule:

     ```scss
     @import '@helvetia-design/tokens/css/base';
     @import '@helvetia-design/styles/css/design-system';
     ```

   - `font`, `structure`, `core`: leave these three lines unchanged and keep them. Immediately above the first of the three (or, if `normalize` was on the line directly above, immediately below the two new imports), insert one comment noting they must be removed manually once the migration is verified, e.g. `/* TODO: remove these legacy Baloise imports once the Helvetia migration is verified */`. Insert that comment once, not once per line.
   - Baloise **utilities** line (`css/utilities/all`, any of the nine category files, or `css/utilities/<name>`): do not duplicate this line. Replace it in place with the `@helvetia-design/styles/css/utilities` equivalent, using the matching at-rule or the equivalent local form for the project's `framework`. This avoids both utility stylesheets being loaded and clashing.
   - Bundled `css/all`: this one file already contains normalize + font + structure + core + utilities together, so — unlike `font`/`structure`/`core` — it cannot be left in place: that would duplicate the utility classes too. Treat it like `normalize`: comment out the original line in place, and immediately below it insert all three, using the matching at-rule:

     ```scss
     @import '@helvetia-design/tokens/css/base';
     @import '@helvetia-design/styles/css/design-system';
     @import '@helvetia-design/styles/css/utilities';
     ```

   - For every other `imports` entry with `kind` `bootstrap`, add the `@helvetia-design` equivalent immediately below that line. Leave the original line unchanged.
   - When the line is HTML, CSS, or a side-effect import, duplicate the line. In the duplicate only, apply this package map: `@baloise/ds-core` → `@helvetia-design/core`, `@baloise/ds-react` → `@helvetia-design/react`, `@baloise/ds-angular` → `@helvetia-design/angular`, and `@baloise/ds-styles` → `@helvetia-design/styles`.
   - When the line is JSON, such as an `angular.json` styles entry, insert a sibling string with that same package replacement. Keep the file valid JSON. Do not copy surrounding keys, and do not duplicate the whole file when the match is only one string.
   - If that duplicate would still be an `http://` or `https://` URL, do not write the URL. Insert the local form below instead.
   - Do not duplicate `kind` `reference` lines. Those are component and icon imports; **Components** migrates them.
   - If there is no `bootstrap` import, insert the local form immediately after the first `reference` line, without editing that line.
   - Skip the insert when the same `@helvetia-design` line is already the next line.
   - Local form when `framework` is `html`:

     ```html
     <link rel="stylesheet" href="node_modules/@helvetia-design/styles/dist/css/design-system.css" />
     <script type="module" src="node_modules/@helvetia-design/core/dist/design-system/design-system.esm.js"></script>
     ```

   - Local form when `framework` is `react` or `angular`, inserted into a `.ts`/`.tsx`/`.js`/`.jsx` file:

     ```ts
     import '@helvetia-design/styles/css/design-system'
     ```

   - Local form when the target file is `.scss`/`.sass` instead (regardless of `framework`): use `@import '@helvetia-design/styles/css/design-system';`, or `@use` if that is the at-rule already used by Baloise lines in that same file.

4. Write the Init section of `ds-migration-report.md` as `shared/report.md` describes. Create the file when it is missing, so this section is its first entry. Under `### Setup`, list the resolved `version`, the aliases written, and the install command. Under `### Files changed`, list every file touched. Every existing `@helvetia-design/*` value that step 1 left unchanged goes under **Needs your attention**, with both values. In chat, show the whole section (attention lines, Setup, and Files changed) and end with the line `Report written to ds-migration-report.md.`
5. Stop. Do not run `git add` or `git commit`. Leave every change unstaged for the consumer to review.

### Components

Present this menu and wait for one choice:

1. **Manual** — choose from every available component migration
2. **Detect** — scan the project and suggest applicable component migrations

Every component migration also migrates the legacy icons in the files it touches. Follow `shared/icons.md` alongside the chosen file:

- After the file's Scan step, run the icon scan from `shared/icons.md` for every file with a finding, and show its findings with the component findings. The file's single confirmation covers both.
- In the Rewrite step, apply the icon rules to those files as well.
- In the Report step, append the `I1.`, `I2.`, ... items from the Report section of `shared/icons.md` to the checklist, after the component items.

Every Report step writes to `ds-migration-report.md` as `shared/report.md` describes, and shows only the items that need attention in chat.

Every form component migration also removes the legacy field wrapper around the controls it migrates. Follow `shared/field.md` alongside the chosen file:

- In the Rewrite step, apply its rules to every migrated control that sits inside `bal-field` or `bal-field-control`, or that a `bal-field-message` directly follows, in the same pass.
- In the Report step, append the `F1.`, `F2.`, ... items from the Report section of `shared/field.md` to the checklist, after the component items and before the icon items.

Every component migration also decides about the legacy config call. Follow `shared/legacy-config.md` after the icon rules:

- After the file's Scan step, run its Scan section. When no `bal-*` component will be left, show each legacy config call with the component findings as a call to delete. The file's single confirmation covers it.
- In the Rewrite step, after the icon and field rules, apply its Decide section.
- In the Report step, append the `L1.`, `L2.`, ... items from the Report section of `shared/legacy-config.md` to the checklist, after the icon items.

#### Manual

List every file matching `components/*.md` or `components/*/migration.md` in this skill folder. Build a picker from each file's title (the first Markdown heading). Dispatch to the chosen file's instructions.

If that list is empty, report that no component migrations are available yet, then stop.

#### Detect

`<project-root>` is the consumer project root that contains the app lockfile. When the skill is invoked from that root, use the current directory.

```bash
node <this-skill-directory>/scripts/scan-migratable.mjs <project-root>
```

The script prints one JSON object. `suggested` contains used `bal-*` components that have a migration, with their usage total. `notYet` contains used components for which this skill has no migration.

Show `notYet`, if it is not empty, as used components that cannot be migrated by this version of the skill. Do not offer them as choices.

If `suggested` is empty, report that none of the used components has an available migration, then stop.

Build a picker from every entry in `suggested`, showing its `name` and `total`. Wait for one choice, then dispatch to `components/<name>/migration.md`.

### CSS utils

Rewrite the legacy Baloise utility classes in the project to their Helvetia names, following `shared/css-utils.md`, and delete the Baloise utilities line once no legacy class is left. Component migrations do not rewrite utility classes. This step covers them for the whole project or for a path list.

1. Ask whether to scan the whole project or a list of paths. Run the Scan section of `shared/css-utils.md`, with the paths when the user gave any. Show the findings grouped by file (path, line, snippet, and each class move), the total per group, and the `dynamic` list. Then decide whether the Baloise utilities line can go: it can when a whole-project scan (the same one, when no paths were given) reports no `lost` move, no `dynamic` place and no move outside the scanned files. In that case, list each Baloise utilities line that the Legacy utilities line section of `shared/css-utils.md` would delete after the findings.
2. When step 1 listed class moves with a `to`, ask one yes/no: rewrite every listed class and delete every listed line? When it listed only lines to delete, ask one yes/no: delete every listed line? On no, stop with the files unchanged. When it listed neither, say that nothing can be rewritten or deleted, naming the `lost` moves and `dynamic` places, and skip to step 5.
3. Apply the Rewrite section of `shared/css-utils.md` to every listed move.
4. Apply the Legacy utilities line section of `shared/css-utils.md`. It scans the whole project again and deletes only the lines that step 2 confirmed.
5. Append a `css-utils` section to `ds-migration-report.md` as `shared/report.md` describes. Its checklist holds the `U1.`, `U2.`, ... items from the Report section of `shared/css-utils.md`.
6. Stop. Do not run `git add` or `git commit`. Leave every change unstaged for the consumer to review.

### Assets

Migrate every legacy icon left in the project, following `shared/icons.md`. Component migrations already handle the icons in the files they touch. This step covers the rest, such as a constants file that imports `balBrandIcon*` symbols but has no `bal-*` tag. It also deletes the legacy config call once no `bal-*` component is left, following `shared/legacy-config.md`.

1. Run the icon scan from `shared/icons.md` without file arguments, so it covers the whole project. Show the findings grouped by file (path, line, snippet) and end with the total count. Then run the Scan section of `shared/legacy-config.md`. No component is being migrated here, so every `bal-*` component that `scan-migratable.mjs` reports counts as left. List each call it marks for deletion after the icon findings.
2. When step 1 listed icon findings, ask one yes/no: rewrite every listed usage and delete every listed call? When it listed only calls to delete, ask one yes/no: delete every listed call? On no, stop with the files unchanged. When it listed neither, say there are no legacy icons left to migrate and skip step 3.
3. When the icon scan found anything, apply every rule in `shared/icons.md` to the listed files.
4. Apply the Decide section of `shared/legacy-config.md`.
5. Append an `assets` section to `ds-migration-report.md` as `shared/report.md` describes. Its checklist holds the `I1.`, `I2.`, ... items from the Report section of `shared/icons.md`, then the `L1.`, `L2.`, ... items from the Report section of `shared/legacy-config.md`. Skip the final whole-project scan of `shared/icons.md`, which this step already is.
6. Stop. Do not run `git add` or `git commit`. Leave every change unstaged for the consumer to review.
