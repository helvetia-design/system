---
'@helvetia-design/core': patch
---

**ds-stack**: Replace the invalid size `xxl` with `2xl` in the `space`, `space-row`, `space-column`, `p`, `px` and `py` props. `xxl` never produced any spacing because no matching style existed, and it is no longer accepted; use `2xl`. The legacy size `xx-small` now resolves to `2xs` instead of `3xs`, which also affects `ds-divider`, where `3xs` is not a valid space.
