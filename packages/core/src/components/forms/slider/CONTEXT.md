# Slider (ds-slider)

`ds-slider` is the web-component-only migration of the old
`bal-input-slider`: a form control backed by the **noUiSlider** library
(rendered on a plain `<div part="slider">`, no native `<input>` anywhere in
the shadow root), using the same `Field` wrapper/`AttachInternals()` pattern
as `ds-input`/`ds-number-input`. Shared vocabulary:

- **Model value** — `value: number`, always a concrete number, never `null`
  or `''`. A slider can never truly be "empty" (it always resolves to a
  real value), so there is no empty/nullable state to represent. When no
  `value` is supplied it defaults to `min`.
- **Slider** — the noUiSlider-owned `<div id="slider" part="slider">`. It is
  the single source of interaction (pointer drag, keyboard) and carries
  noUiSlider's own built-in ARIA (`role="slider"`, `aria-valuemin/max/now`,
  `tabindex`) on its handle. `ds-slider` wires `aria-labelledby`/
  `aria-describedby` onto the handle to connect it to the `Field`'s label/
  description, the same way `ds-select`'s `SelectPickerController` wires its
  trigger — see `connectLabelToTrigger()` in `select.picker.ts` for the
  precedent.
- **Picker controller** — `SliderPickerController`
  (`slider.picker.ts`) wraps the noUiSlider instance, mirroring
  `SelectPickerController`'s shape (init in `componentDidLoad`, `destroy()`
  in `disconnectedCallback`, `setValue()`/`setDisabled()`/`focus()`/
  `blur()`/`updateRange()` as its public API). `slider.utils.ts`
  stays pure functions only (`clampValue`, `resolveInitialValue`,
  step/decimals helpers).
- **No `FormControl`** — unlike `ds-input`/`ds-number-input`, this component
  does not use the shared `FormControl` helper (`form-control.ts`), because
  `FormControl` assumes a real `nativeEl: HTMLInputElement |
HTMLTextAreaElement` to focus/blur/read from. `ds-slider` manages
  `internals.setFormValue()`, `initialValue`/reset, and click-passthrough
  directly in `slider.tsx`, the same way `ds-select` does.
- **Event mapping** — noUiSlider's own event set replaces native
  `input`/`change`: `update` (fires continuously, incl. every drag/keyboard
  step) maps to `dsInput`; `set` (fires once per discrete interaction —
  pointer release, a completed keyboard step, or a programmatic `.set()`
  call) maps to `dsChange`. `set` was chosen over noUiSlider's `change`
  event because `change` only fires for real user interaction — a
  programmatic `.set()` call (used by `picker.setValue()` and by
  `DsSlider`'s `fill()` test helper) never fires it, only `update` +
  `set`. This preserves
  [ADR-0010](../../../../../docs/adr/0010-ds-slider-change-commit.md)'s
  commit-on-discrete-interaction semantics with a different event source;
  see [ADR-0007](../../../../../docs/adr/0007-ds-slider-nouislider.md) for why
  the event source changed at all.
- **Programmatic sets don't re-emit events** — `SliderPickerController`
  guards `setValue()` with a `suppressEvents` flag so an external `value`
  prop change (e.g. an Angular `ControlValueAccessor.writeValue()`) does not
  cascade back into firing `dsInput`/`dsChange`, mirroring how the old
  native input's JSX-driven attribute updates never dispatched DOM events
  either. Only real user interaction — or a test calling
  `target.noUiSlider.set()` directly, bypassing the controller — emits
  those events.
- **Value precision** — noUiSlider is configured with a `format: { to, from
}` pair that rounds to the decimal precision implied by `step` (e.g.
  `step="0.5"` → 1 decimal, `step="1"` → integers), so emitted values never
  carry floating-point noise from internal percentage math.
- **Clamping** — `min`/`max` are typed as `@Type('number')` (not `string`,
  unlike `ds-input`/`ds-number-input`'s pass-through min/max) because the
  component's own logic depends on them: `value` is clamped into
  `[min, max]` via `@Watch('min')`/`@Watch('max')`, so the component's state
  of truth never drifts from what noUiSlider renders.
- **Post-mount prop reactivity** — `@Watch('value')`/`@Watch('min')`/
  `@Watch('max')`/`@Watch('step')` push changes into the live noUiSlider
  instance (`picker.setValue()`/`picker.updateRange()`), since noUiSlider
  (unlike a JSX-rendered native input) does not pick up prop changes for
  free through Stencil's vdom diff — its config is frozen after `.create()`
  until explicitly updated.
- **Continuous mode** — `step` defaults to `1`. A continuous/free-form
  slider is expressed via the standard HTML-derived convention `step="any"`,
  which maps to omitting noUiSlider's `step` option entirely (its default is
  already continuous) — not a special `0` sentinel (the old component's
  `step = 0` convention is dropped).
- **`readonly` behaves as `disabled`** — noUiSlider has no native concept of
  read-only either. `ds-slider` follows the existing `ds-checkbox`
  convention (`disabled={this.disabled || this.readonly}`) and treats the
  two as equivalent for this control. Disabling is done via noUiSlider's own
  attribute-based mechanism (`setAttribute('disabled', '')` /
  `removeAttribute('disabled')` on the slider target — there is no
  `.disable()`/`.enable()` JS call).
- **Commit-on-`change`, not blur** — diverges from the shared `FormControl`
  blur-commit convention; see
  [ADR-0010](../../../../../docs/adr/0010-ds-slider-change-commit.md).
- **`color` vs. `brand-color`** — general naming convention for bal→ds
  migrations: if an old `bal-*` component had a `color` prop meaning brand/
  theme color, it is renamed to `brand-color` on the `ds-*` version, freeing
  up `color` for the `Field`-state semantics (`primary | success | warning |
danger`) shared with `ds-input`/`ds-number-input`. `bal-input-slider` had
  no brand `color` prop, but `ds-slider` gained its own `brand-color`
  (`yellow | purple | red | green | ''`) — unlike the bal-era meaning, it only
  recolors the `.noUi-connect` fill (via a `linear-gradient` from the `-4`
  shade on the left to the `-2` shade on the right), leaving track, thumb,
  and label/description untouched. It's independent of `color`/`invalid`,
  which still drive the `Field`-state classes.
- **No tick marks in this MVP** — the old component's `hasTicks` prop (BEM
  `<div>`s per step) is dropped; visuals are out of scope for this pass. A
  future visual pass should evaluate noUiSlider's `pips` feature for tick
  marks rather than resurrecting the old div-based approach.
- **Dual-thumb (min+max range) is out of scope** — this component is
  single-thumb only, matching `bal-input-slider`'s original scope exactly,
  even though noUiSlider itself supports multi-handle ranges.
- **Visual design** — `slider.host.scss` overrides noUiSlider's stock
  cosmetic defaults (grey/bordered track, white bordered handle, teal
  connect) via `.noUi-target`/`.noUi-connect`/`.noUi-handle` selectors, using
  lightweight `--slider-*` SCSS component variables that point
  directly at **global color tokens** — the same pattern `ds-checkbox`/
  `ds-radio`/`ds-toggle` use (`--ds-global-color-primary-5` for the
  checked/active fill, `--ds-global-color-grey-3` for the unchecked/inactive
  fill), not a dedicated `packages/tokens` entry. `connect: 'lower'` (set in
  `slider.picker.ts`) renders the active/filled track segment via
  noUiSlider's own `.noUi-connect` element; the remainder shows the plain
  track background — this is the "progress bar" look, not a second DS
  concept. The shared `form.container()` mixin (`form.mixin.scss`) gained a
  `$bordered: false` parameter for this component's unboxed look, reusable
  by any future no-box control. noUiSlider's own base CSS
  (`nouislider/dist/nouislider.css`) is still imported for the structural
  position plumbing pointer-dragging depends on; only its cosmetic layer is
  overridden.
