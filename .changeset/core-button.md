---
'@helvetia-design/core': minor
---

**button**: brand-icon variant's `brandSize` now only accepts `lg` (unset = base) — `sm` removed; `size` is ignored when `brandIcon` is set. Disabled now greys out the brand icon; loading shows a spinner in its place.
**button**: Disabled while loading or inside a disabled fieldset; stays focused while loading.
**button**: While loading, keeps focus and announces "<name>, loading" via a live region instead of leaking the spinner's label into the accessible name.
**button**: A link button with no `download` set now opens its `href` instead of saving it as a file.
**close**: Removed the `sm` size — its 14×14 hit target was below WCAG's 24×24 minimum.
