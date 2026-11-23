# Legacy config call

Every component migration applies these rules at its end, and so does the **Assets** menu item. They decide when the legacy config call goes. `SKILL.md` says when each part runs.

The legacy config call is `initializeBaloiseDesignSystem`, `useBaloiseDesignSystem`, `provideBaloiseDesignSystem` or `BaloiseDesignSystemModule.forRoot`. `BaloiseDesignSystemModule.forRoot(config)` is the NgModule form from `@baloise/ds-angular-legacy` and takes the same `{ defaults, forms }` config as `provideBaloiseDesignSystem`. It fills the global config that every `bal-*` component reads. The `bal-*` components read `language`, `region`, `allowedLanguages` and `fallbackLanguage` only from there. `ds-root` and `DsRootProvider` configure only the `ds-*` components. So the call stays as long as one `bal-*` component is left. The same holds for `updateBalLanguage`, which changes the language of the `bal-*` components only. This file is the only place that deletes them.

## Scan

Find the legacy config calls:

```bash
node <this-skill-directory>/scripts/scan-bal-app.mjs <project-root>
```

The `app` migration already ran this script in its Scan step. Reuse those findings instead of running it again.

Keep only the call sites of the four calls, not the import lines. For `BaloiseDesignSystemModule`, the call site is the `BaloiseDesignSystemModule.forRoot(...)` entry in an NgModule `imports` array. Also keep every bare `BaloiseDesignSystemModule` entry in another NgModule `imports` array, such as a feature module that imports only the `bal-*` components. It is not a call, but it goes together with the call. Also keep every `updateBalLanguage` call site, because it goes together with the call. The other findings are `bal-app` usages, which the `app` migration handles. When no call site is listed, there is nothing to delete. Skip the rest of this file and write each of its Report items as `none found`.

Then answer one question: is a `bal-*` component left? Run:

```bash
node <this-skill-directory>/scripts/scan-migratable.mjs <project-root>
```

When **Detect** already ran this script and no file has changed since, reuse its JSON instead.

Every component that `suggested`, `notYet` or `byHand` lists counts as left, with one exception. `byHand` lists legacy tags such as `bal-check`, `bal-switch` and `bal-radio-icon` that no migration rewrites; they still render `bal-*` and need the legacy config. Entries in `types` are legacy type namespaces, not components, and do not count as left. In a component migration, the component being migrated does not count when this migration rewrites every usage of it. A usage that its migration file leaves in place or reports as not migrated, such as a `bal-navbar` with `interface="simple"`, counts as a `bal-*` component left. Judge that from the component findings and the migration file's rules. A `toast` entry that comes only from a `bal-notices` that this run deleted does not count either.

When no `bal-*` component is left, show each legacy config call and each `updateBalLanguage` call (path, line, snippet) as a call to delete, before the confirmation that covers the edits.

## Decide

Check the answer again after the Rewrite step. When the Rewrite left a usage of the migrated component in place or reported it as not migrated, a `bal-*` component is left, even if the Scan said otherwise.

**A `bal-*` component is left**: leave every legacy config call and its import unchanged, and every `updateBalLanguage` call too. Report that the call stays until the last `bal-*` component is migrated.

**No `bal-*` component is left**: delete the call, in this order:

1. Make sure every config value in the call is already on `ds-root` or `DsRootProvider`. Carry each missing value over by the Config table in `components/app/migration.md`. React and Angular calls hold the values under `defaults`. When the call has no `brand` key, carry `brand: 'baloise'`, because that was the legacy default. Skip it when `ds-root`, `DsRootProvider` or an existing `initializeDesignSystem` call already sets `brand`.
2. When the project has no `ds-root` and no `DsRootProvider`, carry the values into `initializeDesignSystem({ … })` from `@helvetia-design/core` at startup instead, including `brand: 'baloise'` when the call had no `brand` key, unless an existing `initializeDesignSystem` call already sets `brand`. Merge into an existing `initializeDesignSystem` call. Report each value and where it went. Never drop a value without reporting it.
3. Let the Registration rules in `shared/icons.md` carry over the custom icons from the `icons` value.
4. Delete the whole call. For `BaloiseDesignSystemModule.forRoot(...)`, delete the entry from the NgModule `imports` array, and also every bare `BaloiseDesignSystemModule` entry kept by the Scan. Delete every import specifier that only the deleted call used. That includes the call's own specifier and named `balIcon*` imports from `@baloise/ds-icons` that only its `icons` value used. Delete an import when no specifier is left on it. Delete a namespace import such as `import * as balIcons from '@baloise/ds-icons'` when nothing else in the file uses it.
5. Delete every `updateBalLanguage(...)` call. Keep the new call next to it (`DsConfigService.setLanguage()` or `updateDsLanguage()`). When a `ds-*` call is missing, add it by the Language switch section of `components/app/migration.md` first. Delete the `updateBalLanguage` import specifier, and a `BalLanguage` type import that only the deleted calls used. Keep a `BalLanguage` import that other code still uses.

`logger`, `httpFormSubmit` and every key under `forms` have no new home. Report each one that goes with the call.

## Report

These items come last, after the `I` items of `shared/icons.md` and, in the **Assets** step, after the `A` items of `shared/fonts-favicons.md`. Each one gets its own line in `ds-migration-report.md`, as `shared/report.md` describes. The `icons` value stays or goes with the call.

Needs your attention when found:

- L1. Every legacy config call deleted.
- L2. Every config value carried over with a deleted call, and where it went.
- L3. Every `logger` deleted with the call.
- L4. Every `httpFormSubmit` deleted with the call.
- L5. Every `forms` key deleted with the call, with the note from the `forms.*` row of the Config table in `components/app/migration.md`.
- L6. Every `updateBalLanguage` call deleted, with the `ds-*` language call that stays next to it.

Coverage only, written to the file:

- L7. Every legacy config call and `updateBalLanguage` call that stayed, with the note that it stays until the last `bal-*` component is migrated.
