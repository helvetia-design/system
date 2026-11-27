---
'@helvetia-design/core': minor
---

**button**

- `brandIcon` variant greys out when disabled and shows a spinner while loading. Breaking: `brandSize` now only accepts `lg` (`sm` removed); `size` is ignored when `brandIcon` is set.
- Icon-only triggers (button/close/hint) show a `ds-tooltip` with the accessible name instead of the native title; adds `tooltipPlacement`.
- Keeps focus and announces "`<name>`, loading" while loading.
- Blocked in disabled fieldsets and while loading; link buttons without `download` open their `href` instead of saving it.
