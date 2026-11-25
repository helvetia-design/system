# Phone Field (ds-phone-input)

`ds-phone-input` is a form control (see
[docs/plans/ds-phone-input-plan.md](../../../../../docs/plans/ds-phone-input-plan.md))
for entering an international phone number: a country picker (flag +
calling code) paired with a national-number text field, formatted via
`libphonenumber-js`. It is **standalone** — its own native `<input>` and
`Field` wrapper (`packages/core/src/components/forms/input/field.util.tsx`), a
sibling to `ds-input`/`ds-select` rather than composing either. Shared
vocabulary:

- **Model value** — the canonical `value`, an **E.164 string**
  (e.g. `+41791234567`). Self-contained (encodes the country), unambiguous,
  what a form submits. Never the thing the user directly edits.
- **National number** — the digits displayed and typed into the number
  field (e.g. `79 123 45 67`), always relative to the currently selected
  country. Its display is the international grouping without the calling
  code already shown by the country picker. A national trunk prefix (such
  as Swiss `0`) may remain while typing but is removed on blur; a
  significant leading zero (such as an Italian landline's `0`) remains.
  Reformatted live via `AsYouType` while typing, and again on blur for a
  stable final form. Carried alongside `value`/`country` in
  `dsChange`/`dsInput` event payloads as `nationalNumber` so consumers don't
  need to re-derive it from the E.164 string.
- **`initialCountry`** — uncontrolled seed for the starting country,
  read once. **`country`** — the live/controlled current selection,
  readable and settable after first render, updated by user interaction or
  externally, and re-validated against `countries` whenever either changes.
  Entering an international `+` or `00` calling code in the number field
  also updates `country` and removes that calling code from the visible
  national number.
  Distinct props because a form control that lets a user actively repick
  its country needs "starting state" and "current state" to not be the same
  slot. Picking a country re-formats any already-typed national number for
  it, which can change `value` immediately — before the number field ever
  blurs. `dsChange` (the component's one "value changed" signal) fires from
  that path too, not only from blur, whenever it actually changes `value`;
  `dsCountryChange` fires alongside it but never carries `value` itself.
- **`countries`** — the available-country allow-list,
  `string | string[]` (comma-separated attribute or array prop); `undefined`
  means all countries. If `country` names a country outside `countries`,
  the component logs a dev warning and falls back to `countries`' first
  entry — a developer misconfiguration, not a user-facing error state (the
  DS's `invalid`/error-state vocabulary stays reserved for
  application/user validation, which this component explicitly does not
  perform).
- **Country picker** — a bespoke internal button + `aria-haspopup="listbox"`
  popup (not an extension of `ds-select`); see
  [docs/adr/0023-ds-phone-input-bespoke-country-picker.md](../../../../../docs/adr/0023-ds-phone-input-bespoke-country-picker.md).
  Country display names come from `Intl.DisplayNames`, keyed off the
  existing `language` `FieldInterface` prop — no shipped translation
  dataset.
- **Flags are supplementary, not the accessible name.** Each flag SVG is
  `aria-hidden`; the country's localized name is always present as visible/
  accessible text next to it. Flags are bundled as inline SVG strings in
  `@helvetia-design/assets`, the same build-time approach as `ds-icon` — every
  country ships in every consumer's bundle, no runtime asset path or
  consumer-side asset copy needed — see
  [docs/adr/0033-ds-phone-input-bundled-svg-flags.md](../../../../../docs/adr/0033-ds-phone-input-bundled-svg-flags.md).
- **No validation.** The component formats for display; it never calls
  `isValidPhoneNumber`/`isPossiblePhoneNumber` or otherwise judges
  correctness. That is application responsibility. Uses
  `libphonenumber-js/min` (formatting-only metadata for all countries, no
  extended validation data) accordingly.
