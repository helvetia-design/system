---
'@helvetia-design/core': minor
---

**carousel**: Accepts a per-breakpoint `itemsPerView` string, e.g. `"1 tablet:2 desktop:3"`.
**carousel**: New large-below controls variant with round scroll buttons centered under the track.
**carousel**: Now styled through its own design tokens; `--carousel-scroll-fade-bg` is renamed to `--carousel-scroll-fade-background` — update custom CSS using it. Inactive scroll button is slightly more visible (opacity 0.35 → 0.4).
**carousel**: Tile edge-fade now aligns with the track edge when no arrow buttons are shown.
**carousel**: Removed an unused color variant and background styling on tiles.
**carousel**: Tile items can now be selected with Enter and Space.
**carousel**: Can be scrolled to a preset/changed value and emits `dsChange` on swipe/arrow navigation; sets up before first render to avoid a redundant re-render.
**tabs/carousel/segment**: No longer throw in environments without `ResizeObserver`/`IntersectionObserver`, such as jsdom.
