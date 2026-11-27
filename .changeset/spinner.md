---
'@helvetia-design/core': patch
---

**spinner**

- Respects `prefers-reduced-motion`.
- Reserves the logo spinner's size before the Lottie animation loads (no shift on hydration).
- Destroys the Lottie animation and cancels pending frames on removal/re-animation.
- Applies label typography and color, including inverted.
