---
'@helvetia-design/angular': minor
---

**Angular form control fixes.**

- Adds a value accessor to `ds-checkbox` so `formControlName` binds its checked state as a boolean.
- `ds-checkbox-group` turns on control mode when a form binds it, so the form value is an array and `setValue` updates the checkboxes.
- Value accessors ignore change/blur events bubbling up from nested form controls.
- Form components no longer log NG0912 component ID collisions in dev mode.
