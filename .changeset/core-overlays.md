---
'@helvetia-design/core': minor
---

**modal**: Now styled through its own design tokens; `modal-width` no longer defaults to 640px, so a custom width now actually applies.
**modal**: Closes only when both press and release happen on the backdrop, not when starting on the dialog padding.
**popup**: Breaking: `role` prop is renamed to `panelRole` (attribute `panel-role`) so the role only applies to the panel — update any `ds-popup` usage of `role`.
**popup**: Moves focus in on open, Escape closes only the topmost popup, backdrop clicks work with a focus trap, `aria-modal` only set when focus is trapped, trigger keeps ARIA after DOM moves.
**alert**: No longer throws when created without a close/action handler.
**alert-container**: Alerts added while `removeAll` is in progress are no longer dropped.
**alert/toast/snackbar**: IDs are now generated with a counter instead of `crypto.randomUUID` (unavailable outside secure contexts).
**toast/snackbar**: Clicking the action button now navigates to `actionHref`.
**toast**: Timer starts only once shown, pauses on keyboard focus, no longer closes early after repeated pausing.
**tooltip/slider/tabs/modal/drawer/carousel**: Keep working correctly after being moved in the DOM.
**tabs/steps/data/modal/hint**: Server-rendered content stays in its named slot, no hydration shift.
