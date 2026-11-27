---
'@helvetia-design/core': patch
---

**forms**: Input, textarea, number-input, datepicker, checkbox, checkbox-group, radio-group, segment and toggle now submit their visible value correctly with native forms. `ds-checkbox-group` now submits one entry per checked option (was a joined string); radios inside `ds-radio-group` no longer submit their own entries.
**forms**: `required="false"` is now honoured (previously read as `true`).
**forms**: Disabled controls reflect their state and honour a disabled fieldset, so they're excluded from submission.
**radio-group/checkbox-group**: A radio/checkbox keeps its own disabled/readonly state even inside an enabled group; readonly radios are skipped in arrow-key navigation; a disabled group no longer submits its checked options.
**pagination/radio-group/segment**: Keyboard interaction is blocked when disabled or read-only; also fixes pagination's ellipsis, empty state and focus order.
