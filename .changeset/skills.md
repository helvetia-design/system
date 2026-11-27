---
'@helvetia-design/skills': minor
---

**skills** (Baloise migration tooling)

- Maps `bal-popover`→`ds-popup`, and `close`/`text`/`button`/`tag`/`badge` props; handles checkbox/radio group tile/trigger/icon migration, carousel item wrapping, and the content reverse-layout rename.
- Cleanup recognizes core classes in interpolations, quoted keys, `HostBinding` and `Renderer2` calls; flags legacy config calls; scans source folders like `src/app/coverage`; catches leftover `HTMLBal*Element` types; no longer loses track of a file after a template literal with an apostrophe.
