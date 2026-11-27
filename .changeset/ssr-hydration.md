---
'@helvetia-design/core': patch
---

**SSR / hydration** (cross-component)

- The global reset stylesheet now reaches declarative shadow roots in SSR markup (no more UA margins; adds ~2.5 KB per shadow root).
- Invalid prop values log a warning during SSR instead of failing `renderToString`.
- `tabs`/`steps`/`data`/`modal`/`hint` labels and content keep their slot in server-rendered markup (no hydration shift).
- `.lcp-wait` elements keep their own `display` after load.
