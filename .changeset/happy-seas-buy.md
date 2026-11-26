---
'@helvetia-design/core': minor
---

**list/item**: Remove the accordion use case from `ds-item` and `ds-list`, with no deprecation period (this is a removal, not an additive change): `variant="accordion"`, `accordionGroup`, `accordionMarker`, `accordionMarkerPosition`, `accordionOpen`, the `dsAccordionToggle`/`dsAccordionOpened`/`dsAccordionClosed` events, the `accordion-content` slot and part, the `accordion` part, the `accordion` and `nested-accordion` list variants, the CSS-only `li details` accordion in `ul.ds-list` and the `--ds-list-item-accordion-padding-y` token. Migrate to `<li><ds-accordion list>` with `slot="summary"`, `slot="content"`, `group` and `dsToggle`
