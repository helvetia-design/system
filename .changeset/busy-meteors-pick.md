---
'@helvetia-design/core': minor
---

**accordion**: Add `list` prop for list rows (`ds-list > li > ds-accordion[list]`) and boolean `inverted` prop, with new `--ds-accordion-list-*`, `--ds-accordion-marker-color-*` and inverted summary tokens. `ds-list` `size="lg"` and `inverted` cascade into list rows. `list` ignores `button`, `buttonColor`, `buttonSize`, `buttonWide`, `buttonIcon*`, `summaryTitle` and `summaryVisualLevel`. A nested list needs `<section slot="content"><ds-list>…</ds-list></section>` because a bare nested `<li>` closes the outer `<li>` in HTML. OrangeVacations list rows get sky-5 hover text (was primary-5)
