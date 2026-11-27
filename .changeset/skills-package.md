---
'@helvetia-design/skills': minor
---

Migrated Baloise checkbox and radio groups keep their visual markers (check mark / round icon) and correctly hide/show the trigger for tile layouts.
Migrated carousel items only get wrapped in a link or button when the legacy markup did.
`bal-popover` now migrates to `ds-popup`; `bal-nav` and `bal-stage` are reported as migratable.
Scans now correctly handle a nested template literal containing an apostrophe.
Cleanup keeps `css/core` when a core class sits in interpolations, quoted keys, `HostBinding` or `Renderer2` calls.
Cleanup no longer reports ready while an `HTMLBal*Element` type remains.
Button migration binds color to the same condition as the nav-highlight check, so the current nav entry stays highlighted.
Cleanup only skips build-output folders that sit directly beside the `package.json` producing them, so source folders like `src/app/coverage` are scanned.
Content migration now tells consumers to move `horizontal-reverse` to `row-reverse` and `vertical-reverse` to `column-reverse`.
Migration maps `close`, `text`, `button`, `tag` and `badge` to today's props and values.
Cleanup marks the legacy config call as legacy-config and points to Assets instead of asking for manual deletion.
Migration lists `bal-check`, `bal-switch` and `bal-radio-icon` under byHand, so Detect stops suggesting checkbox/radio for them.
