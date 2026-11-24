import { Component, h, Host, Prop, Element } from '@stencil/core'
import { Logger, type LogInstance, hasValue, OneOf, Type } from '@utils'
import {
  CARD_ALIGNMENTS,
  CARD_IMAGE_TEASERS,
  CARD_SPACES,
  CARD_COLORS,
  type CardAlignment,
  type CardImageTeaser,
  type CardSpace,
  type CardColor,
} from './card.interfaces'
import { DsComponentInterface } from '@global'
import { HTMLStencilElement } from '@stencil/core/internal'
import { BUTTON_TARGETS, type ButtonTarget } from '../../actions/button/button.interfaces'

/**
 * Card groups related content together in a contained, visually distinct container with optional header and footer.
 *
 * @slot - The main card content.
 * @slot header - Content displayed in the card header.
 * @slot footer - Content displayed in the card footer.
 * @part card - The card container element.
 * @part link - The link stretched over the whole card, only rendered if `href` is set.
 * @attachment ds-badge top-right - Optional badge as the first child of the default slot, centered on the card's top-right corner.
 * @attachment ds-tag top-left position=left - Optional tag as the first child of the default slot, centered on the card's top edge, aligned left.
 * @attachment ds-tag top-center position=center - Optional tag as the first child of the default slot, centered on the card's top edge.
 * @attachment ds-tag top-right position=right - Optional tag as the first child of the default slot, centered on the card's top edge, aligned right.
 */
@Component({
  tag: 'ds-card',
  styleUrl: 'card.host.scss',
  shadow: true,
})
export class Card implements DsComponentInterface {
  log!: LogInstance

  @Logger('card')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * If `true` the card loses its shadow.
   */
  @Prop()
  @Type('boolean')
  readonly flat: boolean = false

  /**
   * If `true` the card gets a tile look, it has a brand icon on the left
   */
  @Prop()
  @Type('boolean')
  readonly tile: boolean = false

  /**
   * If `true` the card gets a smaller padding.
   */
  @Prop()
  @Type('boolean')
  readonly dense: boolean = false

  /**
   * If `true` the card image is displayed as a teaser, which means
   * it is displayed with a large image.
   */
  @Prop()
  @OneOf(CARD_IMAGE_TEASERS)
  readonly imageTeaser?: CardImageTeaser = undefined

  /**
   * If `true` the card background color becomes blue.
   */
  @Prop()
  @Type('boolean')
  readonly inverted: boolean = false

  /**
   * If `true` the card has a hover effect. Set `href` as well to make the card a keyboard accessible link.
   */
  @Prop()
  @Type('boolean')
  readonly clickable: boolean = false

  /**
   * If `true` the card gets a light background to indicate a selection.
   */
  @Prop()
  @Type('boolean')
  readonly selected: boolean = false

  /**
   * If `true` the card uses 100% of the available height.
   */
  @Prop()
  @Type('boolean')
  readonly fullheight: boolean = false

  /**
   * Defines the text alignment of the card content.
   */
  @Prop()
  @OneOf(CARD_ALIGNMENTS)
  readonly align?: CardAlignment

  /**
   * Defines the space of the card content.
   */
  @Prop()
  @OneOf(CARD_SPACES)
  readonly space?: CardSpace

  /**
   * Defines the color of the card.
   */
  @Prop()
  @OneOf(CARD_COLORS)
  readonly color?: CardColor

  /**
   * Specifies the URL of the page the card links to. A link is stretched over the whole card,
   * so the card becomes focusable and operable by keyboard.
   */
  @Prop()
  @Type('string')
  readonly href: string = ''

  /**
   * Specifies where to display the linked URL.
   * Only applies when an `href` is provided.
   */
  @Prop()
  @OneOf(BUTTON_TARGETS)
  readonly target?: ButtonTarget

  /**
   * Specifies the relationship of the target object to the link object.
   * The value is a space-separated list of [link types](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types).
   */
  @Prop()
  @Type('string')
  readonly rel: string = ''

  /**
   * Accessible name of the card link. Defaults to the text of the `ds-card-title`.
   * Only applies when an `href` is provided.
   */
  @Prop()
  @Type('string')
  readonly a11yLabel: string = ''

  private get colorTypeClass(): string {
    return !hasValue(this.color) ? '' : `${this.inverted ? 'primary' : this.color}`
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    const isImageTeaser = this.imageTeaser !== undefined && this.imageTeaser !== null
    const hasLink = hasValue(this.href)
    const linkLabel = hasLink
      ? this.a11yLabel || this.el.querySelector('ds-card-title')?.textContent?.trim() || undefined
      : undefined

    return (
      <Host
        class={{
          [`is-image-teaser`]: isImageTeaser,
          [`is-image-teaser-${this.imageTeaser}`]: isImageTeaser,
          [`is-dense`]: this.dense,
          [`is-${this.colorTypeClass}`]: hasValue(this.color),
          [`has-space-${this.space}`]: hasValue(this.space),
          [`is-fullheight`]: this.fullheight,
          [`is-flat`]: !!this.flat,
          [`is-tile`]: !!this.tile,
          [`is-clickable`]: !!this.clickable || hasLink,
          [`has-link`]: hasLink,
          [`is-selected`]: !!this.selected,
        }}
      >
        <slot name="picture"></slot>
        <article
          id="card"
          part="card"
          class={{
            [`is-fullheight`]: this.fullheight,
            [`align-${this.align}`]: hasValue(this.align),
          }}
        >
          <slot></slot>
        </article>
        {hasLink && (
          <a
            id="link"
            part="link"
            href={this.href}
            target={this.target}
            rel={this.rel || undefined}
            aria-label={linkLabel}
          ></a>
        )}
      </Host>
    )
  }
}
