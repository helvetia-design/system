# Datepicker (ds-datepicker)

`ds-datepicker` is a form control that mirrors `ds-input`'s field structure and look,
adding a calendar-icon trigger that opens a date-picker popup. Shared vocabulary:

- **Model value** — the canonical `value` (ISO `YYYY-MM-DD` string). Locale-
  independent, sortable, form-safe. This is what a form submits and what
  attribute reflection exposes.
- **Display value** — the localized string the user sees and types in the masked
  field (e.g. `13.07.2026` for CH). Derived from DS locale config; never the
  model value. Display ⇄ model conversion is native `Date` only (no Luxon) —
  Switzerland used Local Mean Time until June 1894, and the native `Date`
  engine and Luxon's `Intl`-based engine can disagree on the pre-1894 offset,
  shifting the calendar day by one if a `Date` crosses between them. See the
  comment on `nativeDateToISO` in `datepicker.mask.ts`.
- **Trigger** — the calendar-icon `<button>` at the end of the field. It is the
  **only** gesture that opens/toggles the popup; focusing the text input just
  places the typing cursor. `disabled` turns both off; `readonly` is display-only.
- **Popup** — the calendar dialog, rendered **inside the shadow root** with
  air-datepicker's stylesheet adopted via `adoptedStyleSheets`. Open/close and
  outside-click are owned by `ds-datepicker` (not air-datepicker's document listener).

Library choices (air-datepicker, imask) and the shadow-root integration are
recorded in [docs/adr/0001-ds-datepicker-external-datepicker-libraries.md](../../../../../docs/adr/0001-ds-datepicker-external-datepicker-libraries.md).
