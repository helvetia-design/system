---
'@helvetia-design/skills': minor
---

**Baloise migration tooling fixes and additions.**

- Rewrites `bal-popover` to `ds-popup`, reports `bal-nav`/`bal-stage` so Detect no longer lists them as not migratable.
- Maps `close`, `text`, `button`, `tag` and `badge` to the props/values core has today.
- Checkbox/radio groups: writes tile/`hideTrigger`/`cols` on the group only, moves a single wrapped checkbox's `name` to its group, keeps the check mark on a migrated checkbox button group and hides the trigger on a tile group, keeps the round icon on a migrated radio button group and hides it on a tile group without `bal-radio-icon`.
- Carousel item: wraps a migrated item in a link/button only when legacy did, with color and label both set.
- Content migration: tells consumers to move `horizontal-reverse`→`row-reverse` and `vertical-reverse`→`column-reverse`.
- Button migration binds color to the same condition as `a11yCurrent`, so the current nav entry stays highlighted.
- Lists `bal-check`, `bal-switch`, `bal-radio-icon` under byHand so Detect stops suggesting checkbox/radio for them.
- Cleanup: keeps css/core while core classes sit in interpolations, quoted keys, `HostBinding` or `Renderer2` calls; marks the legacy config call as legacy-config pointing to Assets instead of a manual deletion; skips build-output folder names only directly beside the producing `package.json`, so source folders like `src/app/coverage` are scanned; finds `HTMLBal*Element` types so Cleanup no longer reports ready while one is left.
- Fixes scans losing track of a file after a nested template literal with an apostrophe.
