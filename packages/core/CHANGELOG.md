# Changelog

All notable changes to this project will be documented in this file.

> 👋 **Welcome to the Helvetia Design System!** Coming from the Baloise Design System? Have a look at our
> [migration guide](https://helvetia-design.vercel.app/?path=/docs/development-migrations-from-baloise--from-baloise) to get started.

## 0.2.1

### 🩹 Fixes

- **progress-bar**: Fixes the bar showing empty on first paint and server-side render, animating from 0 on first update, and vanishing in Windows High Contrast mode ( [`30d51b7`](https://github.com/helvetia-design/system/commit/30d51b73e98a407a84ea403fea5f3aa0a7df8896))

### ❤️ Thank You

- [@hirsch88](https://github.com/hirsch88)

## 0.2.0

### ✨ Features

- **angular**: Form value accessors no longer react to change/blur events bubbling up from nested form controls. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **angular**: Form components no longer log spurious NG0912 ID-collision warnings in dev mode.
  **angular/checkbox**: `ds-checkbox-group` bound to a form now behaves as an array-valued control automatically.
  **angular/checkbox**: `ds-checkbox` now has a value accessor, so `formControlName` binds its checked state as a boolean.

- **context**: New `@helvetia-design/context` package ships this repo's agent docs/skills so other repos can read them instead of copying them in. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))

- **a11y**: Correct accessible names added across hint, drawer, popup, snackbar, logo, radio, toggle, carousel items; fixes app-navbar's `aria-expanded`; visible button text used as accessible name; link styles restored in `.ds-content`. Adds `a11yLabel` to `ds-logo`, `alt` to `ds-carousel-item`. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **a11y**: Icon-only triggers on button/close/hint/tooltip now show a tooltip with the accessible name instead of the native title tooltip; `ds-button` gains `tooltipPlacement`.

- **button**: brand-icon variant's `brandSize` now only accepts `lg` (unset = base) — `sm` removed; `size` is ignored when `brandIcon` is set. Disabled now greys out the brand icon; loading shows a spinner in its place. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **button**: Disabled while loading or inside a disabled fieldset; stays focused while loading.
  **button**: While loading, keeps focus and announces "<name>, loading" via a live region instead of leaking the spinner's label into the accessible name.
  **button**: A link button with no `download` set now opens its `href` instead of saving it as a file.
  **close**: Removed the `sm` size — its 14×14 hit target was below WCAG's 24×24 minimum.

- **card**: Adds `href` for a keyboard-accessible stretched link on clickable cards. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **card**: Wide teaser layout now applies to `image-teaser="wide-left"`; removed an undocumented legacy color mapping (legacy colors now map via the Baloise migration skill's color table).
  **card**: Now the positioned ancestor for light-DOM popups anchored inside it, so they align with their trigger.
  **card**: Corner-positioned badges/tags nested in `ds-card-header` keep their position.

- **carousel**: Accepts a per-breakpoint `itemsPerView` string, e.g. `"1 tablet:2 desktop:3"`. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **carousel**: New large-below controls variant with round scroll buttons centered under the track.
  **carousel**: Now styled through its own design tokens; `--carousel-scroll-fade-bg` is renamed to `--carousel-scroll-fade-background` — update custom CSS using it. Inactive scroll button is slightly more visible (opacity 0.35 → 0.4).
  **carousel**: Tile edge-fade now aligns with the track edge when no arrow buttons are shown.
  **carousel**: Removed an unused color variant and background styling on tiles.
  **carousel**: Tile items can now be selected with Enter and Space.
  **carousel**: Can be scrolled to a preset/changed value and emits `dsChange` on swipe/arrow navigation; sets up before first render to avoid a redundant re-render.
  **tabs/carousel/segment**: No longer throw in environments without `ResizeObserver`/`IntersectionObserver`, such as jsdom.

- **core**: Stacked overlays now share a single scroll lock. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **core**: Form controls emit change/input/focus/blur only on real user interaction, not programmatically.
  **core**: SSR output now includes the global reset stylesheet in each shadow root (~+2.5 KB per shadow root), removing leftover UA margins.
  **core**: Re-initializing the design system no longer discards the existing global config.
  **core**: `waitForDesignSystem` now correctly matches `ds-*` elements.
  **core**: Invalid prop values are now logged as a warning during SSR instead of crashing it.
  **core**: Fixed `debounce` piling up extra delay after reconnects/prop changes.
  **core**: Exports `Logger`, `Loggable`, `LogInstance`, the property validator decorators and `DsComponentInterface`.

- **logo**: `color` prop replaced by boolean `inverted` — change `color="inverted"` to `inverted`; `color="primary"` removed. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **logo**: Defaults to the Helvetia brand; Baloise is now secondary.
  **divider**: `color="inverted"` replaced by boolean `inverted`, combinable with any color; `--ds-divider-color-inverted` renamed to `--ds-divider-color-inverted-default` (new `-inverted-primary`/`-inverted-secondary` added).
  **stack/grid**: `ds-stack` gains `align="stretch"`; `ds-grid` gains `row-gap-{none…4xl}` classes.
  **accordion**: Adds a `disabled` prop.
  **accordion**: Emits `dsToggle`/`dsClosed` when a sibling in the group closes.
  **list/item**: Link variant now emits `dsClick`.
  **picture**: Adds a radius token and a new `is-sm` size variant.

- **app-navbar**: Now styled through its own design tokens; `--ds-app-navbar-light-background` is renamed to `--ds-app-navbar-light-layout-background` — update custom CSS using it. Also fixes the desktop menu underline, which wasn't rendering. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **app-navbar**: Releases its scroll lock and focus trap when the sidebar closes, including on a breakpoint change.
  **app-navbar**: Fixed brand link color contrast in the default (dark) variant.
  **app-footer**: Now styled through its own design tokens (no visible change), and fixes the language picker's text color.
  **app-footer**: Legal text now switches together with the links when the language changes.

- **modal**: Now styled through its own design tokens; `modal-width` no longer defaults to 640px, so a custom width now actually applies. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **modal**: Closes only when both press and release happen on the backdrop, not when starting on the dialog padding.
  **popup**: `role` prop is renamed to `panelRole` (attribute `panel-role`) so the role only applies to the panel — update any `ds-popup` usage of `role`.
  **popup**: Moves focus in on open, Escape closes only the topmost popup, backdrop clicks work with a focus trap, `aria-modal` only set when focus is trapped, trigger keeps ARIA after DOM moves.
  **alert**: No longer throws when created without a close/action handler.
  **alert-container**: Alerts added while `removeAll` is in progress are no longer dropped.
  **alert/toast/snackbar**: IDs are now generated with a counter instead of `crypto.randomUUID` (unavailable outside secure contexts).
  **toast/snackbar**: Clicking the action button now navigates to `actionHref`.
  **toast**: Timer starts only once shown, pauses on keyboard focus, no longer closes early after repeated pausing.
  **tooltip/slider/tabs/modal/drawer/carousel**: Keep working correctly after being moved in the DOM.
  **tabs/steps/data/modal/hint**: Server-rendered content stays in its named slot, no hydration shift.

- **styles**: Removed the unbuilt UnoCSS preset export and its stale doc example, so the package installs cleanly outside the monorepo. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **styles**: Added `letter-spacing-*`, `text-decoration-*` and `text-transform-*` utility classes.
  **number-input**: A stray comma is now read as the decimal separator in German/French Swiss locales.

- **testing**: Adds `getFormEntries`/`resetForm` helpers for native form tests. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **testing**: Adds SSR screenshot helpers.
  **deps**: Routine dependency updates (Stencil, SWC helpers, DOMPurify, focus-trap, libphonenumber-js, slim-select).

- **tokens**: Figma variable sync is more reliable: keeps name-matched variables, pins the backfill to the synced commit, recovers from unknown variable IDs. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **tokens**: PRs that remove/rename a core token still referenced by extension tokens now get a warning.
  **tokens**: Token build now fails on base-build errors instead of silently copying partial CSS.
  **tokens**: Raw `Base.tokens.json`, the Style Dictionary setup and the Toky config are now exported as a second token source.
  **tokens**: Typography tokens gained required `letterSpacing`, `textDecoration`, `textTransform` values.
  **tokens**: Pagination's dots badge sizing now comes from tokens instead of hardcoded values.

- **tooltip**: Dismiss on Escape, stay open while the pointer is over it, keep the trigger's existing accessible description. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **tooltip**: Long content now wraps and stays inside the viewport instead of overflowing.
  **tooltip**: Fixed a leak where it (and the progress bar) kept window/trigger listeners after being removed.
  **hint**: Trigger's tooltip is disabled while its panel is open.
  **hint**: Styled through renamed tokens — `--hint-trigger-color-background-*` → `--hint-trigger-color-icon-*`, `--hint-trigger-p` → `--hint-trigger-padding` — update custom CSS using these. Adds a pressed-state color and a max-width token.

- **skills**: Migrated Baloise checkbox and radio groups keep their visual markers (check mark / round icon) and correctly hide/show the trigger for tile layouts. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
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

### 🩹 Fixes

- **datepicker**: Renders a single calendar after SSR hydration in inline and popup mode. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **datepicker**: Calendar view-switch button's accessible name now includes the visible month and year.
  **select/datepicker**: Rebuild their dropdown/calendar/mask correctly after being moved in the DOM.
  **select**: Opens on a mouse click even when the browser requests reduced motion.
  **slider**: Fixed a duplicated thumb/track after SSR hydration.

- **file-upload**: `accept` now matches like the native input (extensions, type wildcards, exact MIME types); with `multiple` off, only one file from a multi-file drop is kept. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **file-upload**: Submits selected files with the surrounding form and restores the initial files on form reset.
  **table**: Widened the `ag-grid-community` peer range (33–36) and builds as CommonJS.
  **content**: `row-reverse`/`column-reverse` now actually render reversed; deprecated `horizontal-reverse`/`vertical-reverse` work again.
  **data**: Fixed disabled item text contrast.
  **data**: Fixed horizontal layout in Firefox/Safari.
  **brand-icon**: Recolors direct-child/uppercase-hex SVG fills correctly, including for button brand colors.
  **root**: `.lcp-wait` elements keep their own `display` value after load.
  **tag**: `position` prop now also reflects to an attribute, so card positioning works when set as a property (React/Angular).

- **forms**: Input, textarea, number-input, datepicker, checkbox, checkbox-group, radio-group, segment and toggle now submit their visible value correctly with native forms. `ds-checkbox-group` now submits one entry per checked option (was a joined string); radios inside `ds-radio-group` no longer submit their own entries. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **forms**: `required="false"` is now honoured (previously read as `true`).
  **forms**: Disabled controls reflect their state and honour a disabled fieldset, so they're excluded from submission.
  **radio-group/checkbox-group**: A radio/checkbox keeps its own disabled/readonly state even inside an enabled group; readonly radios are skipped in arrow-key navigation; a disabled group no longer submits its checked options.
  **pagination/radio-group/segment**: Keyboard interaction is blocked when disabled or read-only; also fixes pagination's ellipsis, empty state and focus order.

- **pagination**: Padded the dots pill so 4–5 dots no longer touch its edge. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **pagination**: Fixed the dots gap not applying to rows of 5 or fewer pages.

- **spinner**: Reserves its size before the animation loads — no shift on hydration or when disabled. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))
  **spinner**: Slows down for `prefers-reduced-motion`.
  **spinner**: Cleans up its animation and pending frames properly when removed or re-triggered.
  **spinner**: Visible label now gets correct typography and color, including inverted.
  **input**: A masked input stays empty instead of showing "undefined" when cleared or valueless.
  **input**: Shows the inverted loading spinner style on disabled fields.
  **item**: Disabled link items no longer carry `href`, are announced as disabled links; accordion items can now be disabled.
  **item**: A link with a bare `download` attribute now saves the file instead of opening it.
  **item**: Accordion no longer nests the label heading inside its own heading; `label-level` now sets the accordion's heading level.

- **playwright**: Declares its dependencies, ships type definitions and builds as CommonJS, so it installs and imports correctly outside this monorepo. ( [`6c7bedd`](https://github.com/helvetia-design/system/commit/6c7bedd913e158d64d74500e28746e86207a05c1))

### ❤️ Thank You

- [@alinalaura](https://github.com/alinalaura)
- [@davidheimgartner](https://github.com/davidheimgartner)
- [@Envaya](https://github.com/Envaya)
- [@Gerd-Emmanuel](https://github.com/Gerd-Emmanuel)
- [@hirsch88](https://github.com/hirsch88)
- [@VanHoangTran](https://github.com/VanHoangTran)

## 0.1.0

### ✨ Features

- **core/button**: Add the a11yCurrent prop to ds-button and forward aria-current to the native element ( [#204](https://github.com/helvetia-design/system/pull/204))

### 🩹 Fixes

- **core/input**: Document the start and end slots of ds-input ( [#215](https://github.com/helvetia-design/system/pull/215))

- **core/form**: Let ds-input, ds-select, ds-datepicker and the other field-based form controls shrink below the native input width, so narrow .ds-form-col columns no longer overflow or wrap ( [#150](https://github.com/helvetia-design/system/pull/150))

- **ds-stack**: Replace the invalid size `xxl` with `2xl` in the `space`, `space-row`, `space-column`, `p`, `px` and `py` props. `xxl` never produced any spacing because no matching style existed, and it is no longer accepted; use `2xl`. The legacy size `xx-small` now resolves to `2xs` instead of `3xs`, which also affects `ds-divider`, where `3xs` is not a valid space. ( [#108](https://github.com/helvetia-design/system/pull/108))

- **core/counter**: Document the `invalid-text` slot of ds-counter, which it already rendered through the shared field ( [#217](https://github.com/helvetia-design/system/pull/217))

- **ds-heading, ds-card-subtitle**: Remove the `color` prop and the `HeadingColor` type (breaking). `color="primary"` was identical to the default and `color="inverted"` never painted a colour, so use the existing `inverted` prop instead. In CSS-only mode, the `is-primary` class is removed. **skills**: Update the ds-heading migration so legacy `color` values are dropped and `white` becomes `inverted`. ( [#110](https://github.com/helvetia-design/system/pull/110))

- **core/stack**: Add reverse direction classes to ds-stack ( [#107](https://github.com/helvetia-design/system/pull/107))

### 🧱 Updated Dependencies

- **deps**: dependency updates ( [#123](https://github.com/helvetia-design/system/pull/123))
  - dompurify: 3.4.16 → 3.4.17

### ❤️ Thank You

- [@alinalaura](https://github.com/alinalaura)
- [@dependabot](https://github.com/dependabot)
- [@Gerd-Emmanuel](https://github.com/Gerd-Emmanuel)

## 0.0.6

🎉 First official release of the Helvetia Design System, built on the foundation of the Baloise Design System.

### ✨ What's New

- **Multi-brand token architecture** — tokens defined once and synced across web, iOS, Android, and Figma
- **Shadow DOM style isolation** — components ship sealed-off styling that drops cleanly into any app
- **SSR support** — render components to HTML on the server, no framework required
- **More CSS-only components** — a growing set of components that work without JavaScript
- **Improved accessibility** — components updated to better meet WCAG 2.2 AA
- **React integration** — new `useModal`, `useToast`, `useSnackbar` hooks and `DsRootProvider`
- **Cyber Resilience Act readiness** — SBOM generation, automated dependency scanning, documented security policy

See the [What's New](https://helvetia-design.vercel.app/?path=/docs/what-s-new--what-s-new) page for the full rundown.

### ❤️ Thank You

- [@dependabot](https://github.com/dependabot)
- [@hirsch88](https://github.com/hirsch88)
- [@alinalaura](https://github.com/alinalaura)
- [@Envaya](https://github.com/Envaya)
- [@triggertoo](https://github.com/triggertoo)
- [@MarlonLeu](https://github.com/MarlonLeu)
