# Toggle Field (ds-toggle)

`ds-toggle` uses the shared `Field` wrapper
(`packages/core/src/components/input/field.util.tsx`) with `role="field"`
purely for the `invalid`/`invalidText` description block and color-state
classes — it does **not** pass `label` through to `Field`. `Field`'s `label`
prop renders an explicit heading (`<label htmlFor>`/`<legend>`) separate from
its `children`; `ds-toggle`'s own accessible name has always come from its
default slot content, implicitly associated by wrapping it inside the
switch's own `<label>` (nested inside `Field`'s `children`, unchanged by the
migration). `ds-toggle` is the first `Field` consumer to omit the `label`
prop deliberately, to avoid a control carrying two distinct label-shaped
things at once. See
[docs/adr/0031-ds-toggle-field-migration-no-label.md](../../../../../docs/adr/0031-ds-toggle-field-migration-no-label.md).
