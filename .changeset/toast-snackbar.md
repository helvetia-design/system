---
'@helvetia-design/core': patch
---

**toast / snackbar**

- Action click navigates to `actionHref`.
- Timer starts only once shown, pauses on keyboard focus; fixes early close after repeated pause.
- Alert IDs use a counter instead of `crypto.randomUUID` (unavailable outside secure contexts).
- `removeAll` no longer drops alerts added while it's running; no longer throws without `closeHandler`/`actionHandler`.
