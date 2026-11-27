---
'@helvetia-design/core': minor
---

**carousel**

- Per-breakpoint `itemsPerView` (e.g. `"1 tablet:2 desktop:3"`); new large-below controls variant.
- Restyled on own Component tokens. Breaking rename: `--carousel-scroll-fade-bg` → `--carousel-scroll-fade-background`.
- Tile items selectable with Enter/Space; `alt` added to `ds-carousel-item`; edge-fade aligns to the track edge without arrow buttons; removed an unused color variant.
- Keeps working after the element is moved in the DOM.
