---
'@helvetia-design/core': minor
---

**angular**: Form value accessors no longer react to change/blur events bubbling up from nested form controls.
**angular**: Form components no longer log spurious NG0912 ID-collision warnings in dev mode.
**angular/checkbox**: `ds-checkbox-group` bound to a form now behaves as an array-valued control automatically.
**angular/checkbox**: `ds-checkbox` now has a value accessor, so `formControlName` binds its checked state as a boolean.
