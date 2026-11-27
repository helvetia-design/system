---
'@helvetia-design/core': minor
---

**popup**

- Breaking: `role` prop renamed to `panelRole` (attribute `panel-role`).
- Focus moves in on open; Escape closes only the topmost popup; backdrop clicks allowed with a focus trap; `aria-modal` set only when focus is trapped; trigger ARIA kept after DOM moves.
