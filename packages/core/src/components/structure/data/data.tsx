import { Component, Element, h, Host, Prop, Watch } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { DsComponentInterface } from '@global'
import { Logger, type LogInstance, Type } from '@utils'

/**
 * Data displays a list of label-value pairs in a organized, accessible format.
 * Supports vertical and horizontal layouts with dividers always shown in vertical layout.
 *
 * @slot - The content of the data list (typically ds-data-item elements).
 */
@Component({
  tag: 'ds-data',
  styleUrl: 'data.host.scss',
  shadow: true,
})
export class Data implements DsComponentInterface {
  log!: LogInstance

  @Logger('data')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  /**
   * If `true` the data list is horizontal instead of vertical.
   */
  @Prop({ reflect: true })
  @Type('boolean')
  readonly horizontal: boolean = false

  @Watch('horizontal')
  horizontalChanged() {
    this.syncItems()
  }

  componentDidLoad() {
    this.syncItems()
  }

  /**
   * Marks the direct ds-data-item children as stacked while horizontal.
   * `:host-context()` is not supported in Firefox/Safari, so the item cannot detect this itself.
   */
  private syncItems = () => {
    this.el.querySelectorAll(':scope > ds-data-item').forEach(item => {
      item.classList.toggle('is-stacked', this.horizontal)
    })
  }

  render() {
    return (
      <Host
        class={{
          'is-horizontal': this.horizontal,
        }}
      >
        <div class="data-container">
          <slot onSlotchange={this.syncItems}></slot>
        </div>
      </Host>
    )
  }
}
