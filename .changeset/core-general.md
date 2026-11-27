---
'@helvetia-design/core': minor
---

**core**: Stacked overlays now share a single scroll lock.
**core**: Form controls emit change/input/focus/blur only on real user interaction, not programmatically.
**core**: SSR output now includes the global reset stylesheet in each shadow root (~+2.5 KB per shadow root), removing leftover UA margins.
**core**: Re-initializing the design system no longer discards the existing global config.
**core**: `waitForDesignSystem` now correctly matches `ds-*` elements.
**core**: Invalid prop values are now logged as a warning during SSR instead of crashing it.
**core**: Fixed `debounce` piling up extra delay after reconnects/prop changes.
**core**: Exports `Logger`, `Loggable`, `LogInstance`, the property validator decorators and `DsComponentInterface`.
