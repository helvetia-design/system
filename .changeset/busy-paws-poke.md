---
'@helvetia-design/core': patch
---

**core/tabs/carousel/segment**: Render ds-tabs, ds-carousel and ds-segment without throwing in environments that lack ResizeObserver or IntersectionObserver, such as jsdom
