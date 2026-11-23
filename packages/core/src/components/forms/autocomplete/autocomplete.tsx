import {
  AttrDeserialize,
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core'
import { AttachInternals, HTMLStencilElement } from '@stencil/core/internal'
import { DsComponentInterface, defaultConfig, DsConfigState, DsLanguage, ListenToConfig } from '@global'
import {
  debounceEvent,
  deserializeBooleanAttribute,
  inheritAttributes,
  isArrowDownKey,
  isArrowUpKey,
  isEndKey,
  isEnterKey,
  isEscapeKey,
  isHomeKey,
  isTabKey,
  Logger,
  type LogInstance,
  OneOf,
  setFormValue,
  stopEventBubbling,
  Type,
  watchInvalidTextSlot,
} from '@utils'
import { ClearButton } from '../input/clear-button.util'
import { Field, FieldInterface } from '../input/field.util'
import { INPUT_COLORS, InputColor } from '../input/input.interfaces'
import { AutocompleteChangeDetail, AutocompleteInputDetail, AutocompleteOption } from './autocomplete.interfaces'
import { i18nDsAutocomplete } from './autocomplete.i18n'

let AutocompleteIds = 0

/**
 * Autocomplete renders a text field with a panel of filtered suggestions. Unlike `ds-select`
 * the user may submit text that is not in the list — the suggestions only speed up typing.
 *
 * @slot - Optional ds-autocomplete-option elements, as an HTML-only alternative to the `options` prop. Ignored whenever `options` is non-empty.
 * @slot invalid-text - Overrides the `invalidText` prop with custom markup, shown instead of the description when `invalid` is `true`.
 * @part inner - The inner wrapper element containing label, control, and description.
 * @part label - The label element.
 * @part control - The control container wrapping the text field.
 * @part description - The description / validation message element.
 * @part input - The native HTML input element.
 * @part clear - The clear button.
 * @part panel - The suggestion panel.
 * @part option - A single option inside the suggestion panel.
 */
@Component({
  tag: 'ds-autocomplete',
  styleUrl: 'autocomplete.host.scss',
  shadow: true,
  formAssociated: true,
})
export class DsAutocomplete implements DsComponentInterface, FieldInterface {
  private inheritedAttributes: { [k: string]: any } = {}
  private inputEl: HTMLInputElement | undefined
  private initialValue: string | null = null
  private disconnectInvalidTextSlotWatcher?: () => void

  inputId = `ds-autocomplete-${AutocompleteIds++}`

  log!: LogInstance
  @Logger('autocomplete')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  @AttachInternals() internals!: ElementInternals

  @State() language: DsLanguage = defaultConfig.language
  @State() hasInvalidTextSlotContent = false
  @State() open = false
  @State() activeIndex = -1
  @State() slottedOptions: AutocompleteOption[] = []

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * The value of the field. This is whatever the user typed, which is not necessarily
   * one of the options.
   */
  @Prop({ mutable: true, reflect: true })
  @Type('string')
  value: string | null = null

  @Watch('value')
  protected valueChanged() {
    this.syncFormValue()
  }

  /**
   * The name of the control, which is submitted with the form data.
   */
  @Prop({ reflect: true })
  @Type('string')
  readonly name: string = this.inputId

  /**
   * The list of suggestions. Use the default slot with `ds-autocomplete-option`
   * children instead when writing HTML only. If both are set, `options` wins.
   */
  @Prop()
  readonly options: AutocompleteOption[] = []

  /**
   * The label of the field, which is displayed above the input.
   */
  @Prop()
  @Type('string')
  readonly label: string = ''

  /**
   * The description of the field, which is displayed below the input.
   */
  @Prop()
  @Type('string')
  readonly description: string = ''

  /**
   * Defines the color of the field. The default value is `primary`.
   */
  @Prop()
  @OneOf(INPUT_COLORS)
  readonly color: InputColor = 'primary'

  /**
   * If `true` the component gets a invalid style.
   */
  @Prop()
  @Type('boolean')
  readonly invalid: boolean = false

  /**
   * The text to display when the field is in an invalid state.
   */
  @Prop()
  @Type('string')
  readonly invalidText: string = ''

  /**
   * If `true`, the user must fill in a value before submitting a form.
   */
  @Prop()
  @Type('boolean')
  readonly required: boolean = true

  @AttrDeserialize('required')
  private deserializeRequired(value: unknown): boolean {
    return deserializeBooleanAttribute(value)
  }

  /**
   * If `true`, the element is not mutable, focusable, or even submitted with the form.
   */
  @Prop()
  @Type('boolean')
  readonly disabled: boolean = false

  /**
   * If `true` the element can not be mutated, meaning the user can not edit the control.
   */
  @Prop()
  @Type('boolean')
  readonly readonly: boolean = false

  /**
   * If `true`, a button to empty the field is shown while it has a value.
   */
  @Prop()
  @Type('boolean')
  readonly clearable: boolean = false

  /**
   * Instructional text that shows before the field has a value.
   */
  @Prop()
  @Type('string')
  readonly placeholder: string = ''

  /**
   * Milliseconds to wait before `dsChange` is emitted while typing.
   */
  @Prop()
  @Type('number')
  readonly debounce: number = 0

  @Watch('debounce')
  protected debounceChanged() {
    this.dsChange = debounceEvent(this.dsChange, this.debounce)
  }

  /**
   * Emitted on every keystroke or paste in the field.
   */
  @Event() dsInput!: EventEmitter<AutocompleteInputDetail>

  /**
   * Emitted when the value changes, either by picking an option or by leaving the field.
   */
  @Event() dsChange!: EventEmitter<AutocompleteChangeDetail>

  /**
   * Emitted when the field receives focus.
   */
  @Event() dsFocus!: EventEmitter<FocusEvent>

  /**
   * Emitted when the field loses focus.
   */
  @Event() dsBlur!: EventEmitter<FocusEvent>

  /**
   * LIFECYCLE
   * ─────────────────────────────────────────────────────
   */

  connectedCallback() {
    this.debounceChanged()
    this.disconnectInvalidTextSlotWatcher = watchInvalidTextSlot(this.el, hasContent => {
      this.hasInvalidTextSlotContent = hasContent
    })
  }

  componentWillLoad() {
    this.inheritedAttributes = inheritAttributes(this.el, ['aria-label', 'tabindex', 'title', 'data-hj-allow'])
    this.initialValue = this.value
  }

  componentDidLoad() {
    this.readOptionsFromSlot()
    this.syncFormValue()
  }

  disconnectedCallback() {
    this.disconnectInvalidTextSlotWatcher?.()
  }

  /**
   * PUBLIC LISTENERS
   * ─────────────────────────────────────────────────────
   */

  @Listen('click', { capture: true, target: 'document' })
  listenToClick(ev: MouseEvent) {
    if ((this.disabled || this.readonly) && ev.target === this.el) {
      stopEventBubbling(ev)
    }

    if (this.open && ev.target !== this.el && !this.el.contains(ev.target as Node)) {
      this.closePanel()
    }
  }

  @Listen('reset', { target: 'document' })
  listenToReset(ev: UIEvent) {
    const form = ev.target as HTMLElement
    if (form?.contains(this.el)) {
      this.value = this.initialValue
      this.closePanel()
    }
  }

  /**
   * PUBLIC METHODS
   * ─────────────────────────────────────────────────────
   */

  /**
   * @internal define config for the component
   */
  @Method()
  @ListenToConfig()
  async configChanged(state: DsConfigState): Promise<void> {
    this.language = state.language
  }

  /**
   * Sets focus on the field.
   */
  @Method()
  async setFocus() {
    this.inputEl?.focus()
  }

  /**
   * Removes focus from the field.
   * @internal
   */
  @Method()
  async setBlur() {
    this.inputEl?.blur()
  }

  /**
   * Returns the native `<input>` element used under the hood.
   */
  @Method()
  async getInputElement(): Promise<HTMLInputElement | undefined> {
    return this.inputEl
  }

  /**
   * EVENT HANDLERS
   * ─────────────────────────────────────────────────────
   */

  private handleInput = (ev: InputEvent) => {
    const input = ev.target as HTMLInputElement
    this.value = input.value
    this.activeIndex = -1
    this.open = true
    this.dsInput.emit(this.value)
    this.dsChange.emit(this.value)
  }

  private handleFocus = (ev: FocusEvent) => {
    if (!this.disabled && !this.readonly) {
      this.open = true
    }
    this.dsFocus.emit(ev)
  }

  private handleBlur = (ev: FocusEvent) => {
    this.closePanel()
    this.dsBlur.emit(ev)
  }

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled || this.readonly) {
      return
    }

    const visible = this.getVisibleOptions()

    if (isTabKey(ev)) {
      this.closePanel()
      return
    }

    if (isEscapeKey(ev)) {
      if (this.open) {
        stopEventBubbling(ev)
        this.closePanel()
      }
      return
    }

    if (isEnterKey(ev)) {
      // Only swallow Enter while an option is highlighted, so the field can still submit its form.
      const active = visible[this.activeIndex]
      if (this.open && active) {
        ev.preventDefault()
        this.pickOption(active)
      }
      return
    }

    if (isArrowDownKey(ev)) {
      ev.preventDefault()
      if (!this.open) {
        this.open = true
        return
      }
      this.moveActive(visible, 1)
      return
    }

    if (isArrowUpKey(ev)) {
      ev.preventDefault()
      if (!this.open) {
        this.open = true
        return
      }
      this.moveActive(visible, -1)
      return
    }

    if (!this.open) {
      return
    }

    if (isHomeKey(ev)) {
      ev.preventDefault()
      this.activeIndex = visible.length > 0 ? 0 : -1
      return
    }

    if (isEndKey(ev)) {
      ev.preventDefault()
      this.activeIndex = visible.length - 1
    }
  }

  // Keeps the field focused when an option is clicked, so blur does not close the panel first.
  private handleOptionMouseDown = (ev: MouseEvent) => {
    ev.preventDefault()
  }

  private handleClear = () => {
    this.value = null
    this.activeIndex = -1
    this.dsInput.emit(this.value)
    this.dsChange.emit(this.value)
    this.inputEl?.focus()
  }

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  private pickOption(option: AutocompleteOption) {
    if (option.disabled) {
      return
    }
    this.value = option.label
    this.closePanel()
    this.dsChange.emit(this.value)
    this.inputEl?.focus()
  }

  private closePanel() {
    this.open = false
    this.activeIndex = -1
  }

  private moveActive(visible: AutocompleteOption[], step: number) {
    if (visible.length === 0) {
      this.activeIndex = -1
      return
    }
    const next = this.activeIndex + step
    this.activeIndex = next < 0 ? visible.length - 1 : next >= visible.length ? 0 : next
  }

  private getAvailableOptions(): AutocompleteOption[] {
    return this.options.length > 0 ? this.options : this.slottedOptions
  }

  private getVisibleOptions(): AutocompleteOption[] {
    const query = (this.value ?? '').trim().toLowerCase()
    const available = this.getAvailableOptions()
    if (query === '') {
      return available
    }
    return available.filter(option => option.label.toLowerCase().includes(query))
  }

  // Reads ds-autocomplete-option light-DOM children (the HTML-only alternative to the
  // options prop) into the same shape that prop uses.
  private readOptionsFromSlot() {
    const slot = this.el.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])')
    if (!slot) return

    this.slottedOptions = slot
      .assignedElements({ flatten: true })
      .filter(el => el.tagName.toLowerCase() === 'ds-autocomplete-option')
      .map(el => ({
        label: el.textContent?.trim() ?? '',
        disabled: (el as HTMLDsAutocompleteOptionElement).disabled,
      }))
  }

  private handleSlotChange = () => {
    this.readOptionsFromSlot()
  }

  private syncFormValue() {
    setFormValue(this.internals, this.value)
  }

  private optionId(index: number) {
    return `option-${index}`
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  // Splits the label around the first case-insensitive match, so the matching part can be
  // wrapped in <mark>. Deliberately avoids innerHTML, unlike the APL highlight pipe.
  private renderLabel(label: string) {
    const query = (this.value ?? '').trim()
    if (query === '') {
      return label
    }
    const start = label.toLowerCase().indexOf(query.toLowerCase())
    if (start === -1) {
      return label
    }
    const end = start + query.length
    return [label.slice(0, start), <mark>{label.slice(start, end)}</mark>, label.slice(end)]
  }

  render() {
    const isInvalid = this.invalid || this.hasInvalidTextSlotContent
    const i18n = i18nDsAutocomplete[this.language]
    const visible = this.getVisibleOptions()
    const active = visible[this.activeIndex]
    const expanded = this.open && !this.disabled && !this.readonly

    return (
      <Field
        disabled={this.disabled}
        color={this.color}
        invalid={isInvalid}
        label={this.label}
        description={this.description}
        invalidText={this.invalidText}
        required={this.required}
        language={this.language}
        inputId="input"
        cssClasses={{ 'is-open': expanded }}
      >
        <input
          id="input"
          part="input"
          name={this.name}
          ref={el => (this.inputEl = el as HTMLInputElement)}
          type="text"
          role="combobox"
          // Native autofill must stay off, otherwise the browser's own dropdown competes
          // with the suggestion panel.
          autocomplete="off"
          aria-expanded={expanded ? 'true' : 'false'}
          aria-controls="listbox"
          aria-autocomplete="list"
          aria-activedescendant={active ? this.optionId(this.activeIndex) : undefined}
          aria-describedby="description"
          aria-invalid={isInvalid ? 'true' : 'false'}
          disabled={this.disabled}
          readonly={this.readonly}
          required={this.required}
          placeholder={this.placeholder}
          value={this.value ?? ''}
          onInput={ev => this.handleInput(ev as InputEvent)}
          onKeyDown={this.handleKeyDown}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          {...this.inheritedAttributes}
        />
        {this.clearable && (
          <ClearButton
            value={this.value}
            disabled={this.disabled}
            readonly={this.readonly}
            language={this.language}
            onClick={this.handleClear}
          />
        )}
        <div id="panel" part="panel" aria-hidden={expanded ? 'false' : 'true'} inert={expanded ? undefined : true}>
          <div id="listbox" role="listbox" aria-label={this.label || i18n.suggestions}>
            {expanded &&
              visible.map((option, index) => (
                <div
                  id={this.optionId(index)}
                  part="option"
                  role="option"
                  aria-selected={option.label === this.value ? 'true' : 'false'}
                  aria-disabled={option.disabled ? 'true' : 'false'}
                  class={{
                    'option': true,
                    'is-active': index === this.activeIndex,
                    'is-disabled': !!option.disabled,
                  }}
                  onMouseDown={this.handleOptionMouseDown}
                  onClick={() => this.pickOption(option)}
                  onMouseEnter={() => (this.activeIndex = index)}
                >
                  {this.renderLabel(option.label)}
                </div>
              ))}
          </div>
          {expanded && visible.length === 0 && <div class="no-results">{i18n.noResults}</div>}
        </div>
        <slot onSlotchange={this.handleSlotChange}></slot>
      </Field>
    )
  }
}
