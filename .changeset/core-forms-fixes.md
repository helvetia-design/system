---
'@helvetia-design/core': patch
---

**Form control fixes.**

- Form controls emit `dsChange`/`dsInput`/`dsFocus`/`dsBlur` only on real user interaction.
- Native forms submit the visible value of input, textarea, number-input, datepicker, checkbox, checkbox-group, radio-group, segment and toggle after user input, programmatic changes and form reset; `ds-checkbox-group` submits one entry per checked option instead of a joined string; `ds-radio` children no longer submit their own entries.
- Honour `required="false"` (Stencil was reading it as true on form-associated components).
- `file-upload`: matches `accept` like the native input (extensions, type wildcards, exact MIME types), keeps only one file of a multi-file drop when `multiple` is false, submits selected files with the surrounding form and restores initial files on reset.
- Disabled/readonly fixes: all form controls reflect `disabled` and honour disabled fieldsets so they aren't submitted; radios/checkboxes keep their own disabled/readonly state inside an enabled group and skip readonly radios in arrow-key navigation; checked options of a disabled control group are no longer submitted; pagination/radio-group/segment block keyboard interaction when disabled or readonly.
- `debounce` on form components no longer adds up its delay after reconnects or prop changes.
- Masked input stays empty instead of showing "undefined" when content is deleted or has no digits.
- `number-input`: treats a stray comma as the decimal mark in a period-decimal locale (de-CH/fr-CH).
- input/textarea/datepicker: keep a value the app sets while focused, instead of reverting to the stale typed value on blur.
- Adds `getFormEntries`/`resetForm` testing helpers for native form tests.
