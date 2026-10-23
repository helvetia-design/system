import { Component, Element, h, Host, Prop } from '@stencil/core'
import { Logger, LogInstance, Type } from '@utils'
import { HTMLStencilElement } from '@stencil/core/internal'
import { DsComponentInterface } from '@global'

/**
 * Card subtitle renders a subtitle heading for cards with an optional inverted style.
 *
 * @slot - The subtitle text.
 * @part card-subtitle - The card subtitle element.
 */
@Component({
  tag: 'ds-card-subtitle',
  styleUrl: 'card-subtitle.host.scss',
  shadow: true,
})
export class CardSubtitle implements DsComponentInterface {
  log!: LogInstance

  @Logger('card-subtitle')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * If `true` the card text color becomes white.
   */
  @Prop()
  @Type('boolean')
  readonly inverted: boolean = false

  /**
   * If `true` the card text color is bold.
   */
  @Prop()
  @Type('boolean')
  readonly bold: boolean = false

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    return (
      <Host
        class={{
          'ds-card-header': true,
        }}
      >
        <span
          class={{
            'ds-text': true,
            'is-bold': this.bold,
            'is-inverted': this.inverted,
          }}
        >
          <slot></slot>
        </span>
      </Host>
    )
  }
}
