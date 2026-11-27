---
'@helvetia-design/core': minor
---

**modal**

- Own Component tokens for text color, backdrop, viewport margin, title clearance, actions gap; `modal-width` no longer silently defaults to 640.
- Closes only when both press and release land on the backdrop, not the dialog padding.
- Header/body keep their slot in server-rendered markup (no hydration shift).
