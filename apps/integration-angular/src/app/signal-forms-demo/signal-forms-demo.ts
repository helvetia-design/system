import { JsonPipe } from '@angular/common'
import { Component, signal } from '@angular/core'
import {
  disabled,
  form,
  FormField,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  readonly,
  required,
  validate,
} from '@angular/forms/signals'
import {
  DsCheckbox,
  DsCheckboxGroup,
  DsCounter,
  DsDatepicker,
  DsFileUpload,
  DsInput,
  DsNumberInput,
  DsPhoneInput,
  DsRadio,
  DsRadioGroup,
  DsSegment,
  DsSegmentItem,
  DsSelect,
  DsSlider,
  DsTextarea,
  DsToggle,
} from '@helvetia-design/angular'

interface Model {
  name: string
  accepted: boolean
  country: string | string[] | null
  fruits: string[]
  phone: string | null
  date: string | null
  amount: number | null
  slider: number
  counter: number
  comment: string | null
  segment: string | null
  radio: string | null
  files: File[]
  rangeSlider: number
  rangeCounter: number
  collision: number
  code: string
}

const initialModel = (): Model => ({
  name: 'Alice',
  accepted: false,
  country: null,
  fruits: [],
  phone: '+41791234567',
  date: '2024-01-15',
  amount: 5,
  slider: 60,
  counter: 3,
  comment: 'Hello',
  segment: 'basic',
  radio: 'basic',
  files: [new File(['a'], 'a.txt')],
  rangeSlider: 60,
  rangeCounter: 3,
  collision: 60,
  code: 'ABC',
})

@Component({
  selector: 'app-signal-forms-demo',
  imports: [
    JsonPipe,
    DsCheckbox,
    DsCheckboxGroup,
    DsCounter,
    DsDatepicker,
    DsFileUpload,
    DsInput,
    DsNumberInput,
    DsPhoneInput,
    DsRadio,
    DsRadioGroup,
    DsSegment,
    DsSegmentItem,
    DsSelect,
    DsSlider,
    DsTextarea,
    DsToggle,
    FormField,
  ],
  templateUrl: './signal-forms-demo.html',
})
export class SignalFormsDemo {
  protected readonly nameDisabled = signal(false)
  protected readonly commentReadonly = signal(false)
  protected readonly allDisabled = signal(false)

  protected readonly model = signal<Model>(initialModel())

  protected readonly options = [
    { label: 'Switzerland', value: 'ch' },
    { label: 'Germany', value: 'de' },
  ]

  protected readonly f = form(this.model, p => {
    required(p.name, { message: 'Name is required' })
    minLength(p.name, 3, { message: 'At least 3 characters' })
    maxLength(p.name, 20, { message: 'At most 20 characters' })
    min(p.amount, 0, { message: 'Must be at least 0' })
    max(p.amount, 10, { message: 'Must be at most 10' })
    validate(p.accepted, ({ value }) => (value() ? null : { kind: 'accepted', message: 'Must be accepted' }))
    required(p.country, { message: 'Country is required' })
    required(p.phone, { message: 'Phone is required' })
    required(p.date, { message: 'Date is required' })
    validate(p.slider, ({ value }) => (value() >= 50 ? null : { kind: 'min', message: 'Value must be at least 50' }))
    validate(p.counter, ({ value }) => (value() % 2 === 1 ? null : { kind: 'odd', message: 'Must be odd' }))
    required(p.comment, { message: 'Comment is required' })
    required(p.segment, { message: 'Segment is required' })
    required(p.radio, { message: 'Radio is required' })
    // `required()` doesn't treat an empty array as empty, so check the length explicitly.
    validate(p.files, ({ value }) => (value().length > 0 ? null : { kind: 'required', message: 'Files are required' }))
    min(p.rangeSlider, 50, { message: 'Slider min 50' })
    max(p.rangeSlider, 80, { message: 'Slider max 80' })
    min(p.rangeCounter, 2, { message: 'Counter min 2' })
    max(p.rangeCounter, 5, { message: 'Counter max 5' })
    min(p.collision, 50, { message: 'Collision min 50' })
    max(p.collision, 80, { message: 'Collision max 80' })
    pattern(p.code, /^[A-Z]+$/, { message: 'Uppercase letters only' })
    readonly(p.comment, () => this.commentReadonly())
    disabled(p.accepted, () => this.allDisabled())
    disabled(p.country, () => this.allDisabled())
    disabled(p.fruits, () => this.allDisabled())
    disabled(p.phone, () => this.allDisabled())
    disabled(p.date, () => this.allDisabled())
    disabled(p.amount, () => this.allDisabled())
    disabled(p.slider, () => this.allDisabled())
    disabled(p.counter, () => this.allDisabled())
    disabled(p.comment, () => this.allDisabled())
    disabled(p.segment, () => this.allDisabled())
    disabled(p.radio, () => this.allDisabled())
    disabled(p.files, () => this.allDisabled())
    disabled(p.code, () => this.allDisabled())
    disabled(p.name, () => this.nameDisabled() || this.allDisabled())
  })

  protected setName(value: string) {
    this.f.name().value.set(value)
  }

  protected setPhone() {
    this.f.phone().value.set('+41798765432')
  }

  protected setDate() {
    this.f.date().value.set('2025-12-24')
  }

  protected setSlider() {
    this.f.slider().value.set(75)
  }

  protected setCounter() {
    this.f.counter().value.set(7)
  }

  protected setComment() {
    this.f.comment().value.set('Carol')
  }

  protected setSegment() {
    this.f.segment().value.set('premium')
  }

  protected setRadio() {
    this.f.radio().value.set('premium')
  }

  protected setFiles() {
    this.f.files().value.set([new File(['b'], 'b.txt'), new File(['c'], 'c.txt')])
  }

  protected clearFiles() {
    this.f.files().value.set([])
  }

  protected toggleReadonly() {
    this.commentReadonly.update(v => !v)
  }

  protected setCode(value: string) {
    this.f.code().value.set(value)
  }

  protected toggleAllDisabled() {
    this.allDisabled.update(v => !v)
  }

  protected setRangeSliderOutOfRange() {
    this.f.rangeSlider().value.set(90)
  }

  protected setRangeCounterOutOfRange() {
    this.f.rangeCounter().value.set(9)
  }

  protected toggleDisabled() {
    this.nameDisabled.update(v => !v)
  }

  protected reset() {
    this.f().reset(initialModel())
  }

  protected touchAll() {
    this.f().markAsTouched()
  }
}
