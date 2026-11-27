---
'@helvetia-design/core': minor
---

**tokens**: Figma variable sync is more reliable: keeps name-matched variables, pins the backfill to the synced commit, recovers from unknown variable IDs.
**tokens**: PRs that remove/rename a core token still referenced by extension tokens now get a warning.
**tokens**: Token build now fails on base-build errors instead of silently copying partial CSS.
**tokens**: Raw `Base.tokens.json`, the Style Dictionary setup and the Toky config are now exported as a second token source.
**tokens**: Typography tokens gained required `letterSpacing`, `textDecoration`, `textTransform` values.
**tokens**: Pagination's dots badge sizing now comes from tokens instead of hardcoded values.
