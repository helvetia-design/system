---
'@helvetia-design/core': patch
---

**Overlay fixes (tooltip, popup, modal, app-navbar).**

- `tooltip`: dismiss on Escape, stay open while the pointer is over it, preserve the trigger's existing `aria-describedby`; disabled while a hint panel it belongs to is open; no longer leaks leftover window/trigger listeners after unmount (shared with progress bar).
- Stacked overlays now share one scroll lock.
- `popup`: focus moves in on open, Escape closes only the topmost popup, backdrop clicks allowed with a focus trap, `aria-modal` set only when focus is trapped, trigger ARIA kept after DOM moves.
- `modal`: closes only when both press and release happen on the backdrop, not the dialog padding.
- `app-navbar`: releases scroll lock and focus trap when the sidebar closes on a breakpoint change or when overflow ends.
