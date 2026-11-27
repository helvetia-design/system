---
'@helvetia-design/core': patch
---

**core/alert-container/toast/snackbar**: Generate alert IDs with a counter instead of crypto.randomUUID, which is unavailable outside secure contexts
