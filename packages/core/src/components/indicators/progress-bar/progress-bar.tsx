import { Component, Element, Host, Method, Prop, State, h } from '@stencil/core'
import { Logger, type LogInstance, hasValue, OneOf, Type } from '@utils'
import { HTMLStencilElement } from '@stencil/core/internal'
import {
  ListenToConfig,
  type DsComponentInterface,
  type DsConfigObserver,
  type DsConfigState,
  type DsLanguage,
  defaultConfig,
} from '@global'
import { i18nDsProgressBar } from './progress-bar.i18n'
import {
  PROGRESS_BAR_BACKGROUNDS,
  PROGRESS_BAR_COLORS,
  ProgressBarBackground,
  ProgressBarColor,
} from './progress-bar.interfaces'

/**
 * Progress bar displays a track with a filled line that shows the completion of a task as a percentage value.
 *
 * @part line - The filled progress indicator element.
 */
@Component({
  tag: 'ds-progress-bar',
  styleUrl: 'progress-bar.host.scss',
  shadow: true,
})
export class ProgressBar implements DsComponentInterface, DsConfigObserver {
  log!: LogInstance

  @Logger('progress-bar')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  @State() language: DsLanguage = defaultConfig.language
  // A consumer-set aria-label wins over the generated one. Undefined means "none set".
  @State() consumerLabel?: string

  private labelObserver?: MutationObserver

  private animated = true

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * The background color
   */
  @Prop()
  @OneOf(PROGRESS_BAR_BACKGROUNDS)
  readonly background: ProgressBarBackground = 'dark'

  /**
   * The progress bar color
   */
  @Prop()
  @OneOf(PROGRESS_BAR_COLORS)
  readonly color: ProgressBarColor = 'primary'

  /**
   * The value of the bar in percentage. So min is 0 and 100 would be the max value.
   */
  @Prop({ reflect: true })
  @Type('number')
  readonly value: number = 0

  /**
   * LIFECYCLE
   * ─────────────────────────────────────────────────────
   */

  connectedCallback(): void {
    this.readConsumerLabel()
    // aria-labelledby needs no handling: it outranks aria-label natively
    if (typeof MutationObserver === 'undefined') return
    this.labelObserver = new MutationObserver(() => this.readConsumerLabel())
    this.labelObserver.observe(this.el, { attributes: true, attributeFilter: ['aria-label'] })
  }

  disconnectedCallback(): void {
    this.labelObserver?.disconnect()
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
  async configChanged(state: DsConfigState) {
    this.animated = state.animated
    this.language = state.language
  }

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  private get generatedLabel(): string {
    return i18nDsProgressBar[this.language].progress
  }

  // Rule: a name is ours when it equals the purpose word of any language, so server-rendered HTML in another
  // language is not mistaken for the consumer's. Anything else is the consumer's and wins.
  private readConsumerLabel() {
    const attr = this.el.getAttribute('aria-label')
    if (attr === this.consumerLabel) return
    const isGenerated = attr !== null && Object.values(i18nDsProgressBar).some(i18n => i18n.progress === attr)
    this.consumerLabel = isGenerated || attr === null ? undefined : attr
    // Stencil skips attributes whose rendered value did not change, so restore our name after the consumer removed theirs.
    if (attr === null) this.el.setAttribute('aria-label', this.generatedLabel)
  }

  private get clampedValue(): number {
    return Number.isNaN(this.value) ? 0 : Math.max(0, Math.min(100, this.value))
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    const value = this.clampedValue
    return (
      <Host
        role="progressbar"
        aria-label={this.consumerLabel ?? this.generatedLabel}
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax="100"
        class={{
          'is-light': hasValue(this.background) && this.background === 'light',
          'is-dark': !hasValue(this.background) || this.background === 'dark',
          'is-primary': !hasValue(this.color) || this.color === 'primary',
          'is-purple': hasValue(this.color) && this.color === 'purple',
          'is-yellow': hasValue(this.color) && this.color === 'yellow',
          'is-red': hasValue(this.color) && this.color === 'red',
          'is-green': hasValue(this.color) && this.color === 'green',
        }}
      >
        <div
          id="line"
          part="line"
          class={{
            'is-animated': this.animated,
            'is-full': value === 100,
          }}
          // percentage, not px: a rounded clientWidth made the line overflow the track by sub-pixels
          style={{ width: `${value}%` }}
        ></div>
      </Host>
    )
  }
}
