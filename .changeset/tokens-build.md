---
'@helvetia-design/core': patch
---

**tokens build** (internal)

- Figma sync keeps name-matched variables, pins the backfill commit, recovers from unknown `variableId`s.
- Warns on PRs that remove or rename a core token referenced by extension tokens.
- Token build awaits the base build/copy step so it fails on base errors instead of copying partial CSS.
