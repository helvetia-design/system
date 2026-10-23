---
'@helvetia-design/core': patch
'@helvetia-design/skills': patch
---

**ds-heading, ds-card-subtitle**: Remove the `color` prop and the `HeadingColor` type (breaking). `color="primary"` was identical to the default and `color="inverted"` never painted a colour, so use the existing `inverted` prop instead. In CSS-only mode, the `is-primary` class is removed. **skills**: Update the ds-heading migration so legacy `color` values are dropped and `white` becomes `inverted`.
