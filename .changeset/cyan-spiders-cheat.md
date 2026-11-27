---
'@helvetia-design/core': patch
---

**core/forms**: Submit the visible value of ds-input, ds-textarea, ds-number-input, ds-datepicker, ds-checkbox, ds-checkbox-group, ds-radio-group, ds-segment and ds-toggle with native forms after user input, programmatic value changes and form reset. ds-checkbox-group now submits one entry per checked option instead of a joined string, and ds-radio children no longer submit their own entries
