# Changelog

All notable changes to this project will be documented in this file.

> 👋 **Welcome to the Helvetia Design System!** Coming from the Baloise Design System? Have a look at our
> [migration guide](https://helvetia-design.vercel.app/?path=/docs/development-migrations-from-baloise--from-baloise) to get started.

## 1.0.0

### ✨ Features

- **tokens**: Style app-navbar through own Component tokens for container padding and max-widths, sidebar z-index, backdrop color/opacity, panel shadow and border, sidebar item divider/focus radius, sidebar actions margin, brand focus padding and desktop menu underline (`--ds-app-navbar-default-container-max-width-*`, `--ds-app-navbar-default-sidebar-*`, `--ds-app-navbar-default-menu-item-underline-*`, …). Title, sidebar item and menu item typography now come from composite `Typo` tokens (`--ds-app-navbar-default-title-typo-*`, `-sidebar-item-typo-*`, `-menu-item-typo-base|selected-*`), replacing the standalone font leaves. `--ds-app-navbar-light-background` is renamed to `--ds-app-navbar-light-layout-background`; `--ds-app-navbar-*-sidebar-panel-border-top` is split into `-border-width` / `-border-color`. Adds Alias tokens `--ds-alias-border-width-hairline`, `--ds-alias-space-margin-xl`, `--ds-alias-size-control-fixed` and `--ds-alias-size-icon-sm`. Fix the desktop menu underline referencing a non-existent token, which made the hover/selected indicator invisible — it now renders at 2px. ( [#225](https://github.com/helvetia-design/system/pull/225))

- **tokens**: Style modal through own Component tokens for text color, backdrop color, viewport margin, title close-button clearance and actions gap (`--ds-modal-color-text`, `--ds-modal-backdrop-color-background`, `--ds-modal-margin`, `--ds-modal-title-padding-end`, `--ds-modal-actions-gap`), and add Alias token `--ds-alias-space-gap-2xl`. `modal-width` no longer defaults to `640`, so `--ds-modal-width` / `--modal-width` now apply when the property is not set. Modal text color is now explicitly `--ds-alias-text-color-primary` instead of inherited. ( [#225](https://github.com/helvetia-design/system/pull/225))

- **testing**: Add SSR screenshot helpers setupSsrVisualTest, holdHydration, assertHydrated, waitForServerMarkup and visualBaseline ( [#331](https://github.com/helvetia-design/system/pull/331))

- **picture**: Add a radius design token for picture with a new is-sm size variant ( [#308](https://github.com/helvetia-design/system/pull/308))

- **tokens**: Rename hint trigger CSS props (--hint-trigger-color-background-* → --hint-trigger-color-icon-*, --hint-trigger-p → --hint-trigger-padding), apply pressed trigger color, and add --hint-max-width token ( [#225](https://github.com/helvetia-design/system/pull/225))

- **carousel**: Add large-below controls variant with round scroll buttons centered under the track ( [#310](https://github.com/helvetia-design/system/pull/310))

- **close**: Remove sm size from ds-close (14×14 hit target was below WCAG 2.5.8's 24×24 minimum) ( [#225](https://github.com/helvetia-design/system/pull/225))

- **tokens**: Export the raw Base.tokens.json, the Style Dictionary setup and the Toky config for a second token source ( [#324](https://github.com/helvetia-design/system/pull/324))

- **tokens**: Style app-footer through own Component tokens for inline padding, container max-widths, tight gap, language picker typography and social icon color (`--ds-app-footer-padding-x`, `--ds-app-footer-width-default|fluid|compact`, `--ds-app-footer-gap-sm`, `--ds-app-footer-language-typo-*`, `--ds-app-footer-social-icon-color`). `--ds-app-footer-social-icon-size` now resolves through `--ds-alias-size-icon-fixed`. Fix language picker color referencing an undefined private variable. No visual change. ( [#225](https://github.com/helvetia-design/system/pull/225))

- **logo**: Replace the `color` prop with a boolean `inverted` prop. Migrate `color="inverted"` to `inverted` and drop `color="primary"` ( [#309](https://github.com/helvetia-design/system/pull/309))

- **tokens**: Add required letterSpacing, textDecoration and textTransform to typography tokens, with new LetterSpacing, TextDecoration and TextTransform primitives ( [#225](https://github.com/helvetia-design/system/pull/225))

- **styles**: Add letter-spacing-*, text-decoration-* and text-transform-* utility classes from the Alias text tokens ( [#225](https://github.com/helvetia-design/system/pull/225))

- **tokens**: Style carousel and carousel-item through own Component tokens (radius, gaps, padding, scroll button size/radius/inset/gap/opacity, edge-fade width, tile backgrounds), rename `--carousel-scroll-fade-bg` → `--carousel-scroll-fade-background` (token `--ds-carousel-scroll-fade-bg` → `--ds-carousel-scroll-fade-background`), remove unused `--ds-carousel-dot-*` tokens, and add Alias tokens `--ds-alias-size-control-md`, `--ds-alias-size-fade-base`, `--ds-alias-opacity-disabled-subtle`. Inactive tile scroll button opacity changes from 0.35 to 0.4. ( [#225](https://github.com/helvetia-design/system/pull/225))

- **divider**: Replace `color="inverted"` with a boolean `inverted` prop that combines with every color. `--ds-divider-color-inverted` is renamed to `--ds-divider-color-inverted-default`, and `--ds-divider-color-inverted-primary` and `--ds-divider-color-inverted-secondary` are added ( [#309](https://github.com/helvetia-design/system/pull/309))

- **button/close/hint/tooltip**: Show a ds-tooltip with the accessible name on icon-only triggers (a11yTitle on ds-button, ds-close, ds-hint) instead of the native title tooltip, and add the tooltipPlacement prop to ds-button ( [#278](https://github.com/helvetia-design/system/pull/278))

### 🩹 Fixes

- **core**: Stacked overlays share one scroll lock ( [#247](https://github.com/helvetia-design/system/pull/247))

- **number-input**: Treat a stray comma as the decimal mark in a period-decimal locale (de-CH/fr-CH) ( [#244](https://github.com/helvetia-design/system/pull/244))

- **core/tabs/carousel/segment**: Render ds-tabs, ds-carousel and ds-segment without throwing in environments that lack ResizeObserver or IntersectionObserver, such as jsdom ( [#264](https://github.com/helvetia-design/system/pull/264))

- **styles**: Remove the unbuilt UnoCSS preset export and its stale /preset doc example so the package installs and imports cleanly outside the monorepo ( [#243](https://github.com/helvetia-design/system/pull/243))

- **skills**: Baloise migration scans find HTMLBal*Element types, so Cleanup no longer reports ready while one is left ( [#252](https://github.com/helvetia-design/system/pull/252))

- **core/tag**: Reflect the position prop to an attribute so card positioning also works when it is set as a property (React/Angular) ( [#276](https://github.com/helvetia-design/system/pull/276))

- **core/forms**: Honour the `required="false"` attribute on form controls, which Stencil read as true on form-associated components ( [#279](https://github.com/helvetia-design/system/pull/279))

- **file-upload**: Match accept entries like the native input (extensions, type wildcards, exact MIME types) and keep only one file of a multi-file drop when multiple is false ( [#315](https://github.com/helvetia-design/system/pull/315))

- **skills**: Baloise button migration binds color to the same condition as a11yCurrent, so the current nav entry stays highlighted ( [#275](https://github.com/helvetia-design/system/pull/275))

- **content**: The `row-reverse` and `column-reverse` directions render reversed, and the deprecated `horizontal-reverse` and `vertical-reverse` layouts work again ( [#259](https://github.com/helvetia-design/system/pull/259))

- **skills**: Migration scanners and the Cleanup gate skip build-output folder names only directly beside the package.json that produces them, so source folders like src/app/coverage are scanned ( [#251](https://github.com/helvetia-design/system/pull/251))

- **tooltip/slider/tabs/modal/drawer/carousel**: Keep tooltip, slider, tabs, modal, drawer and carousel working after the element is moved in the DOM ( [#314](https://github.com/helvetia-design/system/pull/314))

- **pagination**: Pad the dots pill so 4 or 5 dots no longer touch its edge ( [#267](https://github.com/helvetia-design/system/pull/267))

- **core/item**: Link items with a bare download attribute save the file instead of opening it ( [#299](https://github.com/helvetia-design/system/pull/299))

- **table**: Widen the ag-grid-community peer range to 33-36 and build as CommonJS so the package installs cleanly next to current AG Grid outside the monorepo ( [#243](https://github.com/helvetia-design/system/pull/243))

- **core**: waitForDesignSystem applies its config to `ds-*` components instead of matching none ( [#253](https://github.com/helvetia-design/system/pull/253))

- **select/datepicker**: Select and datepicker rebuild their dropdown/calendar/mask after being moved in the DOM ( [#249](https://github.com/helvetia-design/system/pull/249))

- **core/datepicker**: Include the visible month and year in the accessible name of the calendar view switch button ( [#250](https://github.com/helvetia-design/system/pull/250))

- **data**: Fix disabled data item text contrast by removing the opacity fade ( [#273](https://github.com/helvetia-design/system/pull/273))

- **skills**: Baloise content migration tells consumers to move `horizontal-reverse` to `row-reverse` and `vertical-reverse` to `column-reverse` ( [#259](https://github.com/helvetia-design/system/pull/259))

- **core/hint/tooltip**: Disable the hint trigger tooltip while the hint panel is open ( [#334](https://github.com/helvetia-design/system/pull/334))

- **card**: Make the ds-card host the positioned ancestor so light-DOM popups anchored via offsetParent align with their trigger ( [#271](https://github.com/helvetia-design/system/pull/271))

- **logo**: Default ds-logo brand to helvetia, baloise is secondary ( [#225](https://github.com/helvetia-design/system/pull/225))

- - **tokens**: Promote pagination dots badge min/max-width from hardcoded literals to design tokens ( [#225](https://github.com/helvetia-design/system/pull/225))

- **pagination/radio-group/segment**: Block keyboard interaction when disabled or readonly, fix pagination ellipsis, empty state and focus order ( [#313](https://github.com/helvetia-design/system/pull/313))

- **app-navbar**: Fix slotted brand link color contrast in the default (dark) variant ( [#273](https://github.com/helvetia-design/system/pull/273))

- **core/card**: Keep the card corner position of badges and positioned tags nested inside ds-card-header ( [#276](https://github.com/helvetia-design/system/pull/276))

- **pagination**: Fix dots gap token not applying to the ≤5-page dot row (CSS specificity) ( [#225](https://github.com/helvetia-design/system/pull/225))

- **spinner**: Destroy the Lottie animation and cancel pending animation frames when the spinner is removed or re-animated ( [#319](https://github.com/helvetia-design/system/pull/319))

- **input**: Show the inverted loading spinner on disabled fields ( [#309](https://github.com/helvetia-design/system/pull/309))

- **input/textarea/datepicker**: Keep the value an app sets while focused on blur instead of reverting to the stale typed value ( [#246](https://github.com/helvetia-design/system/pull/246))

- **tooltip**: Fix tooltip and progress bar leaving leftover window and trigger listeners after unmount ( [#248](https://github.com/helvetia-design/system/pull/248))

- **core/select**: Select opens on a mouse click when the browser asks for reduced motion ( [#263](https://github.com/helvetia-design/system/pull/263))

- **carousel**: Align tile edge-fade with the track edge when no arrow buttons are rendered ( [#265](https://github.com/helvetia-design/system/pull/265))

- **core/button**: Link buttons open their href instead of saving it as a file when no download is set ( [#262](https://github.com/helvetia-design/system/pull/262))

- **core/slider**: Fix duplicated slider thumb and track after SSR hydration ( [#331](https://github.com/helvetia-design/system/pull/331))

- **toast**: Start toast timer only once shown, pause it on keyboard focus, and fix early close after repeated pause ( [#316](https://github.com/helvetia-design/system/pull/316))

### 🧱 Updated Dependencies

- **deps**: dependency updates ( [#250](https://github.com/helvetia-design/system/pull/250))
  - @stencil/react-output-target: 1.6.5 → 1.8.0
  - @swc/helpers: 0.5.23 → 0.5.24
  - focus-trap: 8.2.3 → 8.2.4
  - slim-select: 4.6.0 → 4.6.2

### ❤️ Thank You

- [@dependabot](https://github.com/dependabot)
- [@Gerd-Emmanuel](https://github.com/Gerd-Emmanuel)
- [@hirsch88](https://github.com/hirsch88)

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
