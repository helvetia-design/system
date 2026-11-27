---
'@helvetia-design/core': minor
---

**tokens**: Move several components onto their own Component-layer tokens and add new Alias tokens.

- **app-navbar**: container padding/max-width, sidebar z-index/panel/divider/focus/actions, brand focus padding, desktop menu underline tokens. Title and menu/sidebar item typography now use composite `Typo` tokens. `--ds-app-navbar-light-background` → `--ds-app-navbar-light-layout-background`; sidebar panel border split into width/color. Fixes the desktop menu underline (was invisible, now renders at 2px).
- **modal**: text color, backdrop color, viewport margin, title clearance, actions gap tokens. `modal-width` no longer defaults to 640, so `--ds-modal-width`/`--modal-width` apply correctly. Text color now explicit.
- **hint**: trigger color/padding tokens renamed (`--hint-trigger-color-background-*` → `--hint-trigger-color-icon-*`, `--hint-trigger-p` → `--hint-trigger-padding`), pressed state color, new `--hint-max-width`.
- **carousel**: radius/gap/padding/scroll-button/edge-fade tokens. `--carousel-scroll-fade-bg` → `--carousel-scroll-fade-background`. Removed unused `--ds-carousel-dot-*`. Inactive scroll-button opacity 0.35 → 0.4.
- **app-footer**: padding/max-width/gap/typography/icon tokens. Fixes a language-picker color referencing an undefined variable (no visual change).
- **divider**: `color="inverted"` replaced by boolean `inverted`, combinable with every color; `--ds-divider-color-inverted` → `--ds-divider-color-inverted-default`, adds `-primary`/`-secondary`.
- **typography**: adds required `letterSpacing`, `textDecoration`, `textTransform` to typography tokens, plus matching utility classes.
- **picture**: adds a radius token and `is-sm` size variant.
- Exposes the raw `Base.tokens.json`, Style Dictionary setup and Toky config as a second token source for consumers.
