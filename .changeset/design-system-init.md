---
'@helvetia-design/core': patch
---

**core init**

- `initializeDesignSystem` keeps the existing config instance when run again (e.g. a second bundle).
- `waitForDesignSystem` applies its config to `ds-*` components instead of matching none.
