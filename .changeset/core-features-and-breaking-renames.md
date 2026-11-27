---
'@helvetia-design/core': minor
---

**New features and prop/API changes.**

- **carousel**: per-breakpoint `itemsPerView` string (e.g. `"1 tablet:2 desktop:3"`); new large-below controls variant with round scroll buttons centered under the track.
- **card**: `href` renders a keyboard-accessible stretched link.
- **accordion**: new `disabled` prop.
- **stack/grid**: `align="stretch"` on `ds-stack`; `row-gap-{none…4xl}` classes on `ds-grid`.
- **close**: removed `sm` size (14×14 hit target was below WCAG 2.5.8's 24×24 minimum).
- **button**: `brandIcon` variant greys out when disabled and shows a spinner in place of the icon while loading; `brandSize` now only accepts `lg` (`sm` removed); `size` is ignored when `brandIcon` is set.
- **popup**: `role` prop renamed to `panelRole` (attribute `panel-role`) — **breaking**, replace `role` with `panel-role`.
- **logo**: `color` prop replaced by boolean `inverted` — **breaking**, migrate `color="inverted"` → `inverted`, drop `color="primary"`.
- **a11y**: accessible names added to hint, drawer, popup, snackbar, logo, radio, toggle and carousel items (`a11yLabel` on `ds-logo`, `alt` on `ds-carousel-item`); fixes app-navbar `aria-expanded`; visible button text stays the accessible name; restores link styles in `.ds-content`.
- **button/close/hint/tooltip**: icon-only triggers now show a `ds-tooltip` with the accessible name instead of the native title tooltip; adds `tooltipPlacement` to `ds-button`.
- Exports `Logger`, `Loggable`, `LogInstance`, the property validator decorators and `DsComponentInterface` from the package entry.
- **testing**: adds SSR screenshot helpers `setupSsrVisualTest`, `holdHydration`, `assertHydrated`, `waitForServerMarkup`, `visualBaseline`.
