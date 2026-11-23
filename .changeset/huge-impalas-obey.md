---
'@helvetia-design/core': patch
---

**core**: Add the global reset stylesheet to declarative shadow roots rendered by renderToString, so native elements no longer keep UA margins in SSR markup. SSR output grows by about 2.5 KB per shadow root
