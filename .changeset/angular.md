---
'@helvetia-design/angular': minor
---

**angular**

- `ds-checkbox` gets a value accessor (`formControlName` binds checked as a boolean); `ds-checkbox-group` turns on control mode when bound, so its form value is an array.
- Value accessors ignore change/blur events bubbling up from nested controls.
- Form components no longer log NG0912 ID-collision warnings in dev mode.
