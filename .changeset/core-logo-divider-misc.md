---
'@helvetia-design/core': minor
---

**logo**: Breaking: `color` prop replaced by boolean `inverted` — change `color="inverted"` to `inverted`; `color="primary"` removed.
**logo**: Defaults to the Helvetia brand; Baloise is now secondary.
**divider**: Breaking: `color="inverted"` replaced by boolean `inverted`, combinable with any color; `--ds-divider-color-inverted` renamed to `--ds-divider-color-inverted-default` (new `-inverted-primary`/`-inverted-secondary` added).
**stack/grid**: `ds-stack` gains `align="stretch"`; `ds-grid` gains `row-gap-{none…4xl}` classes.
**accordion**: Adds a `disabled` prop.
**accordion**: Emits `dsToggle`/`dsClosed` when a sibling in the group closes.
**list/item**: Link variant now emits `dsClick`.
**picture**: Adds a radius token and a new `is-sm` size variant.
