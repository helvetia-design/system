# 34. `ds-angular` supports Signal Forms through its existing `ControlValueAccessor`s

Package: `packages/angular`

Date: 2026-10-15

## Status

Accepted

## Context

Angular's Signal Forms (`@angular/forms/signals`, bound with `[formField]`) accept three kinds of hosts: native form elements, custom controls implementing `FormValueControl`/`FormCheckboxControl`, and components that provide a `ControlValueAccessor` (documented as a backwards-compatibility path). Every form wrapper in `packages/angular/src/forms` already provides `NG_VALUE_ACCESSOR` on the class consumers import (see "Reactive-forms integration" in `packages/angular/CONTEXT.md`).

Binding them with `[formField]` worked for value, touched, disabled and reset without changes, but not for the error display: `[formField]` supplies an `InteropNgControl` with no `events` stream, so `DsValueAccessor` derived `invalid`/`invalidText` once at init; it also pushes field state (`invalid`, `pattern`, ...) onto the wrapper inputs, racing that derivation and sending a `RegExp[]` into string props; and its errors are objects, so the message resolved to the error key.

## Decision

Keep the `ControlValueAccessor` wrappers as the only integration and extend `DsValueAccessor`/`withValueAccessor` (see CONTEXT.md, "Signal-forms integration"): derive invalid state reactively when the bound control is not an `AbstractControl` (public API, so no import from `@angular/forms/signals`; deliberately not "has no `events`", which would flip silently if Angular added one to its internal interop object), read `.message` from signal-forms errors, and guard the `invalid` and `pattern` setters against pushes while a signal-forms control is bound. Other pushed inputs (`disabled`, `required`, `readonly`, `min`, `max`, `minLength`, `maxLength`) are accepted as they are, so `min()`/`max()` validators also set the value range of `ds-slider`/`ds-counter` and win over an explicit `[min]`/`[max]`.

## Consequences

- No new wrapper, no extra import for consumers; one change in `value-accessor.ts` covers all 13 wrappers.
- Not a native Signal Forms integration: no `model()`-based inputs, and the package stays on `@angular/forms` peer API only.
- `min()`/`max()` behave differently from reactive forms (they set the range); `required()` needs `validate()` for array-valued fields. Both are documented in CONTEXT.md.
- The pushes of `invalid`/`pattern` rely on Angular's internal input-writing mechanism; a change there needs re-verification via `signal-forms.spec.ts`.
- Rejected: rewriting the wrappers as `FormValueControl`/`FormCheckboxControl` (every wrapper would be rewritten for little gain over the interop path), and suppressing the `min`/`max` push for slider/counter (would require repeating the range next to every validator and drop the native attributes on `ds-number-input`).
