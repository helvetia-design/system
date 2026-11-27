---
'@helvetia-design/core': patch
---

**file-upload**: `accept` now matches like the native input (extensions, type wildcards, exact MIME types); with `multiple` off, only one file from a multi-file drop is kept.
**file-upload**: Submits selected files with the surrounding form and restores the initial files on form reset.
**table**: Widened the `ag-grid-community` peer range (33–36) and builds as CommonJS.
**content**: `row-reverse`/`column-reverse` now actually render reversed; deprecated `horizontal-reverse`/`vertical-reverse` work again.
**data**: Fixed disabled item text contrast.
**data**: Fixed horizontal layout in Firefox/Safari.
**brand-icon**: Recolors direct-child/uppercase-hex SVG fills correctly, including for button brand colors.
**root**: `.lcp-wait` elements keep their own `display` value after load.
**tag**: `position` prop now also reflects to an attribute, so card positioning works when set as a property (React/Angular).
