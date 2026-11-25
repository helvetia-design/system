# Modal Overlay Pattern (ds-modal)

`ds-modal` (`packages/core/src/components/overlays/modal/`) is shadow DOM and slot-based
(`header`/`body`/`actions` slots, or the `ds-modal-header`/`ds-modal-body`
sub-components). `ModalController`/`ModalOptions`
(`modal.interfaces.ts`/`modal.controller.ts`) support mounting a framework
component inside a modal via a **component overlay** concept, deliberately
modeled on Ionic core's own `ComponentRef`/`FrameworkDelegate` pair (which
the old, now-deprecated `bal-modal` also used) rather than invented fresh:

- **Component ref**: the function/class/tag-name identifying what to mount
  inside the overlay (`ComponentRef` in `utils/framework-delegate.ts`).
  Core never instantiates it directly — that would violate "No
  framework-specific code" above.
- **Framework delegate**: the per-framework adapter (`attachViewToDom`/
  `removeViewFromDom`) that knows how to instantiate a component ref and
  hand back its root DOM node, passed as `ModalOptions.delegate`. Core
  calls the delegate; it never contains framework code itself. Because
  `ds-modal` is shadow DOM (unlike the old non-shadow `bal-modal`), a
  delegate must mount its component as a **direct light-DOM child of
  `<ds-modal>` with `slot="body"`** — shadow-DOM slot projection only
  distributes direct light-DOM children, so nested elements inside the
  mounted component's own template are not re-distributed to `ds-modal`'s
  other named slots (`header`/`actions`); those remain for
  static/declarative usage only. `attachComponent`/`detachComponent`
  (also in `utils/framework-delegate.ts`) apply this without a delegate
  (string tag or `HTMLElement` ref, no framework instantiation needed) and
  are what `ModalControllerImpl.create()` calls when `options.component`
  is set.
- **Accessible name**: because a component-overlay modal's mounted
  component only ever fills the `body` slot, its `header` slot is always
  empty, so `ds-modal`'s default `aria-labelledby="modal-title"` resolves
  to no accessible name (browsers don't fall back to `aria-label` just
  because the referenced element is empty). `ModalOptions.label` /
  `DsModalService.create()`'s `options.label` set `ds-modal`'s `label` prop, which replaces
  `aria-labelledby` with `aria-label` on the dialog. Always pass `label`
  when opening a component-overlay modal; it's optional for
  declarative/slotted usage, which keeps using the `header` slot.
- **Modal ref**: a handle scoped to one specific presented modal instance,
  used to dismiss _that_ modal and carry data back to its opener. Replaces
  the old `bal-modal`/Ionic `OverlayBaseController` pattern of a global
  top-of-stack `dismiss()`, which dismissed whatever overlay happened to be
  on top rather than the one the caller meant — a real bug class with
  nested/concurrent overlays. `packages/core` only exposes
  `dismiss(id?, data?, role?)` (still name/top-of-stack based); the scoped
  ref itself is `packages/angular`'s `DsModalRef`. `ModalControllerImpl.create()`
  owns detaching the mounted component via `detachComponent` on `dsDidDismiss`
  (and removing `<ds-modal>` itself from `root`), so this cleanup happens
  regardless of whether a caller ever holds onto a `DsModalRef`. See
  [docs/adr/0022-modal-overlay-component-delegate-pattern.md](../../../../../docs/adr/0022-modal-overlay-component-delegate-pattern.md).
  _Avoid_: global dismiss, top-of-stack dismiss.
