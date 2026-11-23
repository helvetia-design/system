import { Component, Element, h, Host, Prop } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { DsComponentInterface } from '@global'
import { Logger, type LogInstance, Type } from '@utils'

/**
 * Autocomplete option declares a single suggestion as HTML markup, as an alternative to the
 * `options` prop on `ds-autocomplete` — useful for backend-only apps and easier migration,
 * where the consumer would rather render option markup than write JavaScript.
 * The element itself renders nothing visible; `ds-autocomplete` reads its `disabled` state and
 * text content and renders the actual panel option itself.
 *
 * @slot - The option's label text, which is also the value submitted when the option is picked.
 */
@Component({
  tag: 'ds-autocomplete-option',
  styleUrl: 'autocomplete-option.host.scss',
  shadow: true,
})
export class DsAutocompleteOption implements DsComponentInterface {
  log!: LogInstance
  @Logger('autocomplete-option')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * If `true`, the option cannot be picked.
   */
  @Prop()
  @Type('boolean')
  readonly disabled: boolean = false

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    return (
      <Host aria-hidden="true">
        <slot></slot>
      </Host>
    )
  }
}
