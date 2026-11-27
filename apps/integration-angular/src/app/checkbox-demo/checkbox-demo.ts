import { Component, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms'
import { DsCheckbox } from '@helvetia-design/angular'

const requiredWithMessage = (message: string): ValidatorFn => {
  return (control): ValidationErrors | null => (control.value === true ? null : { required: message })
}

@Component({
  selector: 'app-checkbox-demo',
  imports: [DsCheckbox, ReactiveFormsModule],
  templateUrl: './checkbox-demo.html',
})
export class CheckboxDemo {
  protected readonly checked = signal(false)

  protected onChange(event: CustomEvent<boolean>) {
    this.checked.set(event.detail)
  }

  protected readonly reactiveForm = new FormGroup({
    accepted: new FormControl<boolean>(true, {
      nonNullable: true,
      validators: requiredWithMessage('This field is required'),
    }),
  })

  protected readonly autoInvalidOffForm = new FormGroup({
    accepted: new FormControl<boolean>(true, {
      nonNullable: true,
      validators: requiredWithMessage('This field is required'),
    }),
  })

  protected toggleReactiveFormDisabled() {
    const control = this.reactiveForm.controls.accepted
    if (control.disabled) {
      control.enable()
    } else {
      control.disable()
    }
  }

  protected isBoolean(value: unknown) {
    return typeof value === 'boolean'
  }

  protected setReactiveFormValue() {
    this.reactiveForm.controls.accepted.setValue(true)
  }
}
