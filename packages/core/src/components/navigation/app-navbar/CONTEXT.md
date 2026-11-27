# Navigation Pattern (ds-navbar)

### Three-Section Horizontal Layout

The navbar component (`ds-navbar`) uses a **three-section layout**:

1. **Brand** (`slot="brand"`) — Logo, wordmark, or branding element (left, always visible)
2. **Menu** (`slot="menu-start"` + `slot="menu-end"`) — Navigation links (center and right on desktop)
3. **Actions** (part of `slot="menu-end"`) — Action buttons, login, etc. (right on desktop)

**Desktop Layout (≥ tablet breakpoint `--ds-alias-breakpoint-tablet`):**

```
[Brand] ·· [Menu-Start Links] [Menu-End Links/Buttons]
```

**Mobile Layout (< tablet breakpoint):**

```
[Brand] [Hamburger Button]
         ↓ opens dialog ↓
        [Menu-Start + Menu-End + Actions, stacked vertically]
```

### Responsive Behavior

- **Breakpoint detection:** Use `@ListenToBreakpoints()` decorator (see `snackbar.tsx` pattern)
- **State tracking:** `@State() isMobile = dsBreakpoints.isMobile` — syncs with viewport size
- **Conditional rendering:** Mobile menu (hamburger + dialog) only renders when `isMobile === true`
- **Auto-close on resize:** When viewport crosses into desktop breakpoint, menu closes automatically

### Mobile Menu Implementation

- **Native `<dialog>` element:** Full-height modal panel (not overlay div)
- **Focus trap:** Automatic via native `<dialog>` (no manual library needed)
- **Scroll lock:** Automatic via native `<dialog>` (prevents body scroll when open)
- **Internal scrolling:** Dialog content scrolls internally (`overflow-y: auto`) when taller than viewport
- **Close triggers:**
  - Click `<a>` tag inside menu (link navigation)
  - Click hamburger button again (toggle)
  - Press Esc key (native dialog behavior)
  - Viewport resize to desktop (auto-close)

### Semantic Navigation Structure

- **Element:** `<nav role="navigation" aria-label="Main navigation">`
- **Links:** Consumer provides native `<a>` tags in slots (no wrapper components, no tabs)
- **SEO benefit:** Semantic structure crawlable by search engines; native links are indexable
- **Hamburger button:** `<button>` with `aria-label`, `aria-expanded`, `aria-controls` attributes

### Public API

**Props:**

- `open: boolean` (default `false`) — Controls mobile menu visibility; synchronized with internal state

**Methods:**

- `toggleMenu()` → `Promise<void>` — Toggle menu open/closed
- `openMenu()` → `Promise<void>` — Open menu
- `closeMenu()` → `Promise<void>` — Close menu

**Events:**

- `dsMenuOpenStart` — Emitted when menu starts opening
- `dsMenuOpenEnd` — Emitted when menu finishes opening
- `dsMenuCloseStart` — Emitted when menu starts closing
- `dsMenuCloseEnd` — Emitted when menu finishes closing

### Mobile Drawer Implementation

The navbar uses a right-side drawer menu on mobile/tablet viewports. The drawer is implemented with an `<aside role="dialog">` that:

- **Slides in from the right** using CSS transforms (GPU-accelerated)
- **Uses focus-trap library** for keyboard accessibility and focus management
- **Closes via multiple triggers:** ESC key, backdrop click, close button, burger button click, or menu link click
- **Prevents background interaction:** aria-hidden on nav, document scroll locked, focus trapped in drawer
- **Respects prefers-reduced-motion:** Transitions become instant (0.01s) for users with motion preferences

**Drawer Structure:**

```
<aside role="dialog" aria-modal="true" aria-labelledby="drawer-title">
  <div class="drawer-backdrop"></div>
  <div class="drawer-panel">
    <div class="drawer-header">
      <h2 id="drawer-title">Menu</h2>
      <button class="drawer-close">×</button>
    </div>
    <div class="drawer-content">
      <slot name="menu-start"></slot>
      <slot name="menu-end"></slot>
    </div>
  </div>
</aside>
```

**CSS Variables:**

- `--navbar-drawer-max-width` (default: 400px) — Drawer panel width
- `--navbar-drawer-slide-duration` (default: 300ms) — Animation duration for slide-in/out
- `--navbar-drawer-backdrop-color` — Backdrop overlay color (RGB)
- `--navbar-drawer-backdrop-opacity` (default: 0.5) — Backdrop opacity when open

**ARIA Attributes:**

- `aside[aria-modal="true"]` — Announces drawer as modal dialog
- `aside[aria-labelledby="drawer-title"]` — Links drawer to its title heading
- `button[aria-expanded]` — Indicates menu open/closed state
- `button[aria-controls="drawer-menu"]` — Links burger button to drawer

**Keyboard Behavior:**

- **Tab/Shift+Tab:** Navigate within drawer only (focus trapped)
- **Escape:** Close drawer and return focus to burger button
- **Enter/Space:** Activate links and buttons within drawer

**Responsive Behavior:**

- **Mobile/Tablet (≤tablet breakpoint):** Drawer visible, burger button visible
- **Desktop (>tablet breakpoint):** Drawer hidden, burger button hidden, menu content shown inline
- Auto-closes drawer when viewport resizes from mobile to desktop

### State Management Pattern

- **`isMobile: boolean`** — Breakpoint state (synced via `@ListenToBreakpoints()`)
- **`isMenuOpen: boolean`** — Mobile menu visibility state
- **Prop watchers:** Changes to `open` prop sync to `isMenuOpen` and emit lifecycle events
- **Side effects:** Close menu automatically when `isMobile` changes from `true` → `false` (viewport resize)

### Design Differences from Predecessor (bal-navbar)

| Aspect      | bal-navbar                                         | ds-navbar                                              |
| ----------- | -------------------------------------------------- | ------------------------------------------------------ |
| Structure   | Sub-components (bal-navbar-brand, bal-navbar-menu) | Named slots (brand, menu-start, menu-end)              |
| Navigation  | `bal-tabs` component with JS-based routing         | Native `<a>` tags (semantic, SEO-friendly)             |
| Mobile menu | Custom scroll lock + event coordination            | Native `<dialog>` (automatic focus trap + scroll lock) |
| API         | Multiple interfaces (app/simple), custom props     | Single interface (MVP), slot-based                     |
| Scope       | Full-featured (colors, variants, containers)       | MVP (structure, responsive, accessibility)             |

### Implemented Features (MVP+)

- [x] Mobile drawer menu with focus trap and keyboard support
- [x] Accessible right-side drawer with backdrop
- [x] ARIA modal dialog attributes and announcements
- [x] prefers-reduced-motion support for animations
- [x] CSS variables for drawer customization (width, duration, colors)

### Future Enhancements (Out of Scope)

- [ ] Color themes and styling variants
- [ ] Website-context navbar as a separate `ds-web-navbar` component (resolved as a naming strategy in ADR-0026; not yet built) — this component is `ds-app-navbar`, scoped to application usage
- [ ] Container width options (fluid, compact, etc.)
- [ ] Custom hamburger icon or styling
- [ ] Sub-components if composition needs evolve
- [ ] Animated hamburger icon transitions (current: SVG path swap)
