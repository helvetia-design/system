---
'@helvetia-design/core': minor
'@helvetia-design/tokens': patch
---

**tooltip**: Dismiss on Escape, stay open while the pointer is over it, keep the trigger's existing accessible description.
**tooltip**: Long content now wraps and stays inside the viewport instead of overflowing.
**tooltip**: Fixed a leak where it (and the progress bar) kept window/trigger listeners after being removed.
**hint**: Trigger's tooltip is disabled while its panel is open.
**hint**: Styled through renamed tokens — `--hint-trigger-color-background-*` → `--hint-trigger-color-icon-*`, `--hint-trigger-p` → `--hint-trigger-padding` — update custom CSS using these. Adds a pressed-state color and a max-width token.
