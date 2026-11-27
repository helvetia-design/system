---
'@helvetia-design/core': patch
---

**Misc component fixes.**

- `button`: keeps focus and announces "`<button name>`, `<loading text>`" via a polite live region when loading starts (spinner no longer leaks its label into the accessible name); link buttons open their `href` instead of saving it as a file when no `download` is set.
- `item`: removes `href` from disabled link items and announces them as disabled links; disables accordion items; accordion items no longer nest the label heading inside the accordion heading (`label-level` now sets the accordion's heading level); bare `download` attribute now saves the file instead of opening it.
- `tag`: reflects the `position` prop to an attribute so card positioning also works when set as a property (React/Angular).
- `card`: applies the wide teaser layout to `image-teaser="wide-left"`, removes the undocumented mapping of legacy colors like `blue`/`purple-3` (use the Baloise migration skill's color table instead); hosts the positioned ancestor so light-DOM popups anchored via `offsetParent` align with their trigger; keeps badge/positioned-tag corner position when nested inside `ds-card-header`.
- `brand-icon`: recolors direct-child and uppercase-hex SVG fills when setting color, also for `ds-button` brand colors.
- `logo`: defaults brand to `helvetia` (`baloise` is secondary).
- `data`: fixes disabled item text contrast (removed opacity fade); fixes horizontal layout in Firefox/Safari (no longer relying on unsupported `:host-context`).
- `spinner`: respects `prefers-reduced-motion`; reserves the logo spinner size before the Lottie animation loads (no shift on hydration or when disabled); destroys the Lottie animation and cancels pending animation frames on removal/re-animation; applies label typography and color, including inverted.
- `toast`/`snackbar`: navigates to `actionHref` on action click; starts the timer only once shown, pauses on keyboard focus, fixes early close after repeated pause; generates alert IDs with a counter instead of `crypto.randomUUID` (unavailable outside secure contexts); `removeAll` no longer drops alerts added while it's in flight; no longer throws when created without `closeHandler`/`actionHandler`.
- `pagination`: pads the dots pill so 4–5 dots don't touch its edge; fixes the dots gap token not applying to the ≤5-page dot row (CSS specificity); fixes ellipsis, empty state and focus order.
- `select`: opens on a mouse click when the browser asks for reduced motion.
- `content`: `row-reverse`/`column-reverse` render reversed again; deprecated `horizontal-reverse`/`vertical-reverse` work again.
- `tabs`/`carousel`/`segment`: render without throwing in environments lacking `ResizeObserver`/`IntersectionObserver` (e.g. jsdom).
- `carousel`: selects tile items with Enter and Space; aligns tile edge-fade with the track edge when no arrow buttons render; removes an unused color variant and default/selected background styling from tiles.
