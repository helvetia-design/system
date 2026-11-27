---
'@helvetia-design/core': patch
'@helvetia-design/tokens': patch
---

**tooltip**

- Dismiss on Escape, stay open while the pointer is over it, keep the trigger's existing `aria-describedby`.
- Long content wraps at new `--ds-tooltip-max-width` and stays in the viewport via new `--ds-tooltip-gutter`.
- Disabled while its hint panel is open.
- No longer leaks window/trigger listeners after unmount.
- Keeps working after the element is moved in the DOM.
