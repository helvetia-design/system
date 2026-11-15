# Changelog

All notable changes to this project will be documented in this file.

> 👋 **Welcome to the Helvetia Design System!** Coming from the Baloise Design System? Have a look at our
> [migration guide](https://helvetia-design.vercel.app/?path=/docs/development-migrations-from-baloise--from-baloise) to get started.

## 0.1.0 (2026-11-13)

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
