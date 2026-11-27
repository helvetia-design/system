---
'@helvetia-design/core': patch
---

**SSR/hydration and DOM-move resilience fixes.**

- `datepicker`: renders a single calendar after SSR hydration in inline and popup mode; includes the visible month/year in the calendar view switch button's accessible name.
- `slider`: fixes duplicated thumb/track after SSR hydration.
- Adds the global reset stylesheet to declarative shadow roots rendered by `renderToString`, so native elements no longer keep UA margins in SSR markup (SSR output grows ~2.5 KB per shadow root).
- Logs invalid prop values as a warning during SSR instead of failing `renderToString`.
- `tabs`/`steps`/`data`/`modal`/`hint`: labels, modal header/body and hint titles stay in their named slot in server-rendered markup, so they no longer shift on hydration.
- `.lcp-wait` elements keep their own `display` after load instead of resetting to the parent's value.
- `initializeDesignSystem` keeps the existing `window.DesignSystem.config` instance when run again (e.g. from a second bundle); `waitForDesignSystem` now applies its config to `ds-*` components instead of matching none.
- `tooltip`/`slider`/`tabs`/`modal`/`drawer`/`carousel` keep working after the element is moved in the DOM; `select`/`datepicker` rebuild their dropdown/calendar/mask after a DOM move.
