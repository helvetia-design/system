---
'@helvetia-design/core': patch
---

**forms** (input, textarea, number-input, datepicker, checkbox, checkbox-group, radio-group, segment, toggle, counter, phone-input, slider, select)

- `dsChange`/`dsInput`/`dsFocus`/`dsBlur` fire only on real user interaction.
- Native forms submit the visible value after input, programmatic changes and reset; `ds-checkbox-group` now submits one entry per checked option (was a joined string); `ds-radio` children no longer submit their own entries.
- `required="false"` is honoured.
- Disabled controls reflect `disabled` and honour disabled fieldsets so they aren't submitted; grouped radios/checkboxes keep their own disabled/readonly state; disabled/readonly controls block keyboard interaction.
- Masked input stays empty instead of showing "undefined"; a value set while focused survives blur; `debounce` no longer compounds its delay on reconnect/prop changes.
