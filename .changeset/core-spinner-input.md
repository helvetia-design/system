---
'@helvetia-design/core': patch
---

**spinner**: Reserves its size before the animation loads — no shift on hydration or when disabled.
**spinner**: Slows down for `prefers-reduced-motion`.
**spinner**: Cleans up its animation and pending frames properly when removed or re-triggered.
**spinner**: Visible label now gets correct typography and color, including inverted.
**input**: A masked input stays empty instead of showing "undefined" when cleared or valueless.
**input**: Shows the inverted loading spinner style on disabled fields.
**item**: Disabled link items no longer carry `href`, are announced as disabled links; accordion items can now be disabled.
**item**: A link with a bare `download` attribute now saves the file instead of opening it.
**item**: Accordion no longer nests the label heading inside its own heading; `label-level` now sets the accordion's heading level.
