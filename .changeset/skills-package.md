---
'@helvetia-design/core': minor
---

**skills**: Migrated Baloise checkbox and radio groups keep their visual markers (check mark / round icon) and correctly hide/show the trigger for tile layouts.
**skills**: Migrated carousel items only get wrapped in a link or button when the legacy markup did.
**skills**: `bal-popover` now migrates to `ds-popup`; `bal-nav` and `bal-stage` are reported as migratable.
**skills**: Scans now correctly handle a nested template literal containing an apostrophe.
**skills**: Cleanup keeps `css/core` when a core class sits in interpolations, quoted keys, `HostBinding` or `Renderer2` calls.
**skills**: Cleanup no longer reports ready while an `HTMLBal*Element` type remains.
**skills**: Button migration binds color to the same condition as the nav-highlight check, so the current nav entry stays highlighted.
**skills**: Cleanup only skips build-output folders that sit directly beside the `package.json` producing them, so source folders like `src/app/coverage` are scanned.
**skills**: Content migration now tells consumers to move `horizontal-reverse` to `row-reverse` and `vertical-reverse` to `column-reverse`.
**skills**: Migration maps `close`, `text`, `button`, `tag` and `badge` to today's props and values.
**skills**: Cleanup marks the legacy config call as legacy-config and points to Assets instead of asking for manual deletion.
**skills**: Migration lists `bal-check`, `bal-switch` and `bal-radio-icon` under byHand, so Detect stops suggesting checkbox/radio for them.
