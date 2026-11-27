---
'@helvetia-design/core': minor
---

**app-navbar**: Now styled through its own design tokens; `--ds-app-navbar-light-background` is renamed to `--ds-app-navbar-light-layout-background` — update custom CSS using it. Also fixes the desktop menu underline, which wasn't rendering.
**app-navbar**: Releases its scroll lock and focus trap when the sidebar closes, including on a breakpoint change.
**app-navbar**: Fixed brand link color contrast in the default (dark) variant.
**app-footer**: Now styled through its own design tokens (no visible change), and fixes the language picker's text color.
**app-footer**: Legal text now switches together with the links when the language changes.
