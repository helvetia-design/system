import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core'
import { NG_VALUE_ACCESSOR } from '@angular/forms'
import { DsCheckboxInputs, DsCheckboxOutputs } from '../generated/meta'
import { DsCheckbox as DsCheckboxElement } from '../generated/proxies'
import { withValueAccessor } from './value-accessor'

/**
 * Wraps the generated `ds-checkbox` proxy with `ControlValueAccessor` support (value: `boolean`, change
 * event: `dsChange`) via the `withValueAccessor` mixin — see `value-accessor.ts` for what that wires up.
 * Consumers only ever import `DsCheckbox` to use `<ds-checkbox>` at all, so registering `NG_VALUE_ACCESSOR`
 * here — rather than on a separate directive — means `formControlName`/`ngModel` work without any extra
 * opt-in step.
 *
 * `inputs`/`outputs` are re-declared rather than inherited: Angular's compiler resolves a component's inputs
 * and outputs statically from its own `@Component` decorator at build time. `DsCheckboxInputs`/`DsCheckboxOutputs`
 * are generated from `../generated/proxies.ts` (see `packages/core/config/generate-angular-meta.mjs`), so this
 * stays in sync automatically whenever `ds-checkbox`'s props/events change — no manual list to maintain.
 */
@Component({
  selector: 'ds-checkbox',
  host: { 'data-ds-form-control': '' },
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: DsCheckboxInputs,
  outputs: DsCheckboxOutputs,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsCheckbox),
      multi: true,
    },
  ],
})
export class DsCheckbox extends withValueAccessor<HTMLDsCheckboxElement, 'checked'>({
  changeEvent: 'dsChange',
  blurEvent: 'dsBlur',
  valueProp: 'checked',
})(DsCheckboxElement) {}
