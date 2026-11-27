# CONTEXT — packages/assets (Fonts, Icons, Images)

This document captures domain language, architectural patterns, and key concepts specific to the assets package.

## Overview

**packages/assets** contains all static brand and UI assets for the design system:

- **Fonts** — Brand typography (typefaces, weights, variants)
- **Icons** — SVG icon library for UI components
- **Images** — Brand logos, illustrations, and supporting graphics
- **Asset configuration** — Metadata and build scripts for asset processing

All assets are self-contained (no external CDNs) and versioned with the design system.

## Core Concepts

### Font Assets

- **Brand fonts** — Primary typeface(s) for the Helvetia brand
- **Font weights** — Regular, bold, and any variants needed by components
- **Web font formats** — WOFF2 (modern), with fallbacks for older browsers
- **Font variable** — If using variable fonts, a single file with all weights

Fonts are served from the distributed package and referenced via `@font-face` in global CSS.

### Icon System

- **SVG icons** — All icons are vector-based SVG for crispness at any size
- **Naming convention** — Icons follow a consistent naming scheme (e.g., `icon-check`, `icon-arrow-right`)
- **Sizes** — New icons are drawn on a 14 grid (Streamline ships on 16 and 14) and rendered by `ds-icon` at 14px (`sm`), 16px
  (default), 24px (`md`), 32px (`lg`) and 40px (`xl`)
- **Icon library** — Icons can be consumed as:
  - SVG files directly
  - Icon components (e.g., `<ds-icon name="check">`)
  - CSS background images

### Icon Authoring

- **Owner** — ✏️ icon-manager, with the `ds-draw-icons` skill; new icons go through Workflow H
  (`docs/agents/workflows/h-new-icon.md`). Only concepts Streamline lacks are drawn; existing
  Streamline icons are never redrawn.
- **Style** — `icons.yaml` holds the icon DNA (DNA v1 "Helvetia Core Solid": `style: filled`,
  `grid: 14`, `sizes`); its prose rules are in the `ds-draw-icons` skill.
- **Sources** — `src/icons/draw/source/` and `source/parts/` are committed; the raw draw-icons
  build output in `src/icons/draw/` is not. `dir` is never `src/icons/svg`: draw-icons `build`
  deletes the top-level SVGs of `dir`.
- **Output** — a flatten step writes one fill-only `<path>` with `viewBox="0 0 14 14"` to
  `src/icons/svg/<name>.svg`, the same shape as every existing icon.
- **No tracing** — Streamline icons are a style reference, viewed as renders only; an overlap
  check fails any source that shares geometry with a Streamline file.

### Flag System

- **Source** — country flag SVGs come from the third-party `country-flag-icons` npm package
  (`3x2` aspect-ratio set), not hand-authored like the UI icons above. `scripts/build-svg.mjs` syncs
  them into `src/flags/svg` before running the same scan/optimize/write pipeline used for `icons`,
  `brand-icons`, and `maps` — so `country-flag-icons` stays the single source of truth and never
  needs manual re-copying.
- **Naming convention** — one string constant per ISO-3166-1 alpha-2 code:
  `Flag<PascalCase(code)>` (e.g. `FlagCh`, `FlagDe`), generated into `src/flags/svg.ts` and exported
  as the `Flags` namespace from `src/flags/index.ts`, alongside a `svg.json` list of codes.
  Consistent with the `Icon<Name>`/`Icons` pattern above.
- **Consumption** — internal only, by `ds-phone-input`'s `getFlagSvg(code)` lookup
  (`packages/core/src/components/forms/phone-input/flag.ts`), rendered inline the same way `ds-icon`
  renders its icons. There is no public `<ds-flag>` element and, unlike icons, flags aren't
  registered through the overridable `DsConfig`/`updateDsIcons()`-style config path — they're a
  fixed set, not consumer-extensible. See
  [docs/adr/0033-ds-phone-input-bundled-svg-flags.md](../../docs/adr/0033-ds-phone-input-bundled-svg-flags.md).

### Asset Metadata

Each asset type may have:

- **license** — Attribution and usage rights
- **source** — Where the asset came from (e.g., Figma, designer, external library)
- **version** — When the asset was updated
- **supported-sizes** — For icons, which sizes are officially supported

## Notable Patterns

### Font Configuration

Fonts are declared in CSS with metadata:

```css
@font-face {
  font-family: 'Brand Font';
  src: url('/fonts/brand-font-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* Show fallback while loading */
}

@font-face {
  font-family: 'Brand Font';
  src: url('/fonts/brand-font-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### Icon Naming

Icons follow a hierarchical naming pattern:

- `icon-<name>` — basic icon (e.g., `icon-check`, `icon-close`)
- `icon-<name>-<variant>` — variant (e.g., `icon-arrow-right`, `icon-arrow-up`)
- `icon-<category>-<name>` — categorized (e.g., `icon-social-facebook`)

### Asset Publishing

Assets are packaged and published as part of the npm release process. Consumers can:

- Import assets directly: `import checkIcon from '@helvetia-design/assets/icons/check.svg'`
- Reference asset URLs: `@helvetia-design/assets/fonts/brand-font.woff2`
- Load the self-hosted fonts in SCSS through the `./fonts/scss` export: `@use '@helvetia-design/assets/fonts/scss' with ($font-path: '/assets/fonts')`. Always set `$font-path`, because its default is a www.baloise.ch URL.
- Use asset-based components: `<ds-icon name="check">`

## Key Constraints

- **Self-contained** — No external CDN dependencies; all assets shipped with the package
- **Licensed and attributed** — All assets must have clear licensing and attribution
- **Web-optimized** — Assets are minified and compressed for web delivery
- **Consistent naming** — Follow the established naming conventions for discoverability
- **Versioned with system** — Asset updates trigger a version bump in the release process

## Related Contexts

See [CONTEXT-MAP.md](../../CONTEXT-MAP.md) for:

- [[packages/core|packages/core/CONTEXT.md]] — Components that consume icons/fonts
- [[root|CONTEXT.md]] — Repository-level concepts
