---
'@helvetia-design/core': patch
---

**Build/packaging/internal fixes.**

- `styles`: removes the unbuilt UnoCSS preset export and its stale `/preset` doc example so the package installs and imports cleanly outside the monorepo.
- `table`: widens the `ag-grid-community` peer range to 33–36 and builds as CommonJS so the package installs next to current AG Grid outside the monorepo.
- `tokens`: Figma sync keeps name-matched variables, pins the backfill commit to the synced sha, recovers from unknown `variableId`s; warns on PRs that remove or rename a core token referenced by extension tokens; awaits the base build and copy step so the tokens build fails on base errors and never copies partial CSS.
