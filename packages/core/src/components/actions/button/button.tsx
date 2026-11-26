import { Component, Element, Event, EventEmitter, h, Host, Listen, Method, Prop, State, Watch } from '@stencil/core'
import { AttachInternals, HTMLStencilElement } from '@stencil/core/internal'
import {
  defaultConfig,
  DsComponentInterface,
  DsConfigObserver,
  DsConfigState,
  DsLanguage,
  ListenToConfig,
} from '@global'
import {
  ariaBooleanToString,
  inheritAttributes,
  Logger,
  type LogInstance,
  type Attributes,
  hasValue,
  OneOf,
  Required,
  Type,
} from '@utils'
import {
  BUTTON_BRAND_SIZES,
  BUTTON_COLORS,
  BUTTON_ELEMENT_TYPES,
  BUTTON_SIZES,
  BUTTON_TARGETS,
  type ButtonBrandSize,
  type ButtonColor,
  type ButtonElementType,
  type ButtonSize,
  type ButtonTarget,
  ButtonBlurDetail,
  ButtonClickDetail,
  ButtonDidRenderDetail,
  ButtonFocusDetail,
  ButtonNavigateDetail,
} from './button.interfaces'
import { i18nDsSpinner } from '../../indicators/spinner/spinner.i18n'
import { type IconColor } from '../../media/brand-icon/brand-icon.interfaces'
import { TOOLTIP_PLACEMENTS, type TooltipPlacement } from '../../overlays/tooltip/tooltip.interfaces'

/**
 * Button provides a clickable element for triggering actions, submitting forms, or navigating — supporting text, icons, or both.
 *
 * @slot - Button label text and/or icon children. Rendered inside a `<span part="label">` wrapper.
 * @part native - The native `<button>` or `<a>` element.
 * @part spinner - The loading spinner shown when `loading` is true.
 * @part icon - The leading icon wrapper (or the brand icon wrapper when `brandIcon` is set).
 * @part label - The text label wrapper (`<span>`).
 * @part icon-right - The trailing icon wrapper.
 * @attachment ds-badge top-right - Optional badge in the default slot, pinned just outside the button's top-right corner.
 */
@Component({
  tag: 'ds-button',
  styleUrl: 'button.host.scss',
  shadow: true,
  formAssociated: true,
})
export class Button implements DsComponentInterface, DsConfigObserver {
  log!: LogInstance

  @Logger('button')
  createLogger(log: LogInstance) {
    this.log = log
  }

  private inheritAttributes: Attributes = {}
  @AttachInternals() internals!: ElementInternals

  @Element() el!: HTMLStencilElement

  @State() language: DsLanguage = defaultConfig.language
  @State() announcement = ''

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * The color to use from your application's color palette.
   */
  @Prop()
  @OneOf(BUTTON_COLORS)
  readonly color: ButtonColor = 'primary'

  /**
   * The type of button.
   */
  @Prop({ reflect: true })
  @Required()
  @OneOf(BUTTON_ELEMENT_TYPES)
  readonly elementType: ButtonElementType = 'button'

  /**
   * If `true`, the user cannot interact with the button.
   */
  @Prop({ reflect: true })
  @Type('boolean')
  readonly disabled: boolean = false

  /**
   * Size of the button. Ignored when `brandIcon` is set — use `brandSize` instead.
   */
  @Prop()
  @OneOf(BUTTON_SIZES)
  readonly size?: ButtonSize

  /**
   * Specifies the URL of the page the link goes to
   */
  @Prop()
  @Type('string')
  readonly href: string = ''

  /**
   * Specifies where to display the linked URL.
   * Only applies when an `href` is provided.
   */
  @Prop()
  @Required()
  @OneOf(BUTTON_TARGETS)
  readonly target: ButtonTarget = '_self'

  /**
   * Specifies the relationship of the target object to the link object.
   * The value is a space-separated list of [link types](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types).
   */
  @Prop()
  @Type('string')
  readonly rel: string = ''

  /**
   * This attribute instructs browsers to download a URL instead of navigating to
   * it, so the user will be prompted to save it as a local file. If the attribute
   * has a value, it is used as the pre-filled file name in the Save prompt
   * (the user can still change the file name if they want).
   */
  @Prop()
  @Type('string')
  readonly download?: string

  /**
   * If `true` adds a box shadow to improve readability on image background
   * */
  @Prop()
  @Type('boolean')
  readonly shadow: boolean = false

  /**
   * If `true` the width of the buttons is limited
   */
  @Prop()
  @Type('boolean')
  readonly square: boolean = false

  /**
   * If `true` the button has a full width
   */
  @Prop()
  @Type('boolean')
  readonly wide: boolean = false

  /**
   * If `true` the button has no padding and a reduced height
   */
  @Prop()
  @Type('boolean')
  readonly flat: boolean = false

  /**
   * If `true` the button is inverted
   */
  @Prop({ reflect: true })
  @Type('boolean')
  readonly inverted: boolean = false

  /**
   * If `true` the label is hidden and a loading spinner is shown instead.
   */
  @Prop({ reflect: true })
  @Type('boolean')
  readonly loading: boolean = false
  @Watch('loading')
  loadingChanged() {
    this.announcement = this.getAnnouncement()
  }

  // /**
  //  * If `true` the button is a popup.
  //  */
  // @Prop() dsPopup = undefined

  /**
   * Name of the left button icon
   */
  @Prop()
  @Type('string')
  readonly icon: string = ''

  /**
   * If `true` the icon turns
   */
  @Prop()
  @Type('boolean')
  readonly iconTurn: boolean = false

  /**
   * Name of the right button icon
   */
  @Prop()
  @Type('string')
  readonly iconRight: string = ''

  /**
   * A brand icon shown above the label instead of the regular leading/trailing icons.
   * Accepts either a URL to an SVG file or raw `<svg>` markup.
   * When set, `icon` and `iconRight` are ignored.
   */
  @Prop()
  @Type('string')
  readonly brandIcon: string = ''

  /**
   * Size of the brand icon. Unset renders the base size.
   */
  @Prop()
  @OneOf(BUTTON_BRAND_SIZES)
  readonly brandSize: ButtonBrandSize

  /**
   * The label of the button will not break
   */
  @Prop()
  @Type('boolean')
  readonly noWrap: boolean = false

  /**
   * The name of the button, which is submitted with the form data.
   */
  @Prop({ reflect: true })
  @Type('string')
  readonly name: string = ''

  /**
   * The value of the button, which is submitted with the form data.
   */
  @Prop()
  @Type('string')
  readonly value: string = ''

  /**
   * A11y attributes for the native button element.
   */
  @Prop()
  @Type('string')
  readonly a11yControls: string = ''

  /**
   * A11y attributes for the native button element. Maps to `aria-current`, e.g. `page` for the current navigation entry.
   */
  @Prop({ mutable: true })
  @Type('string')
  a11yCurrent: string = ''

  /**
   * A11y attributes for the native button element.
   */
  @Prop()
  @Type('string')
  readonly a11yTitle: string = ''

  /**
   * Placement of the tooltip that shows the `a11yTitle` on hover and focus.
   */
  @Prop()
  @OneOf(TOOLTIP_PLACEMENTS)
  readonly tooltipPlacement: TooltipPlacement = 'bottom'

  /**
   * A11y attributes for the native button element.
   */
  @Prop()
  @Type('string')
  readonly a11yLabel: string = ''

  /**
   * A11y attributes for the native button element.
   */
  @Prop({ mutable: true })
  @Type('string')
  a11yHaspopup: string = ''

  /**
   * Emitted when the link element has clicked.
   */
  @Event() dsClick!: EventEmitter<ButtonClickDetail>

  /**
   * Emitted when the link element has clicked.
   */
  @Event() dsNavigate!: EventEmitter<ButtonNavigateDetail>

  /**
   * Emitted when the button has focus.
   */
  @Event() dsFocus!: EventEmitter<ButtonFocusDetail>

  /**
   * Emitted when the button loses focus.
   */
  @Event() dsBlur!: EventEmitter<ButtonBlurDetail>

  /**
   * Emitted when the button has been  rendered.
   */
  @Event() dsDidRender!: EventEmitter<ButtonDidRenderDetail>

  /**
   * LIFECYCLE
   * ─────────────────────────────────────────────────────
   */

  componentWillLoad() {
    this.inheritAttributes = inheritAttributes(this.el, [
      'title',
      'aria-label',
      'aria-controls',
      'aria-current',
      'aria-hidden',
      'tabindex',
      'aria-haspopup',
    ])

    if (!this.a11yCurrent && this.inheritAttributes['aria-current']) {
      this.a11yCurrent = this.inheritAttributes['aria-current']
    }
    delete this.inheritAttributes['aria-current']

    this.announcement = this.getAnnouncement()

    if (this.el.hasAttribute('ds-popup') && !this.a11yHaspopup) {
      this.a11yHaspopup = 'true'
    }
  }

  @Method()
  @ListenToConfig()
  async configChanged(state: DsConfigState): Promise<void> {
    this.language = state.language
  }

  componentDidRender() {
    this.dsDidRender.emit()
  }

  /**
   * PUBLIC LISTENERS
   * ─────────────────────────────────────────────────────
   */

  @Listen('click', { capture: true, target: 'document' })
  listenToClick(ev: UIEvent) {
    if (this.isInert && ev.target && ev.target === this.el) {
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  /**
   * EVENT HANDLERS
   * ─────────────────────────────────────────────────────
   */

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  // light-DOM text without aria-hidden/hidden subtrees; not a full accessible-name computation
  private getSlottedText(node: Node): string {
    return Array.from(node.childNodes)
      .map(child => {
        if (child.nodeType === Node.TEXT_NODE) return child.textContent ?? ''
        const el = child as Element
        if (
          el.nodeType !== Node.ELEMENT_NODE ||
          el.getAttribute('aria-hidden') === 'true' ||
          el.hasAttribute('hidden')
        ) {
          return ''
        }
        return this.getSlottedText(el)
      })
      .join('')
      .replace(/\s+/g, ' ')
  }

  // snapshot of "<accessible name>, <loading text>" taken when loading turns true; separator is language-neutral
  private getAnnouncement() {
    if (!this.loading) return ''
    const name = (
      this.a11yLabel ||
      this.inheritAttributes['aria-label'] ||
      this.a11yTitle ||
      this.inheritAttributes['title'] ||
      this.getSlottedText(this.el) ||
      ''
    ).trim()
    const loading = i18nDsSpinner[this.language].loading
    return name ? `${name}, ${loading}` : loading
  }

  private get isIconInverted() {
    return this.inverted
  }

  private get hasBrandIcon() {
    return hasValue(this.brandIcon)
  }

  private get isBrandIconSvg() {
    return this.brandIcon.trim().startsWith('<')
  }

  private get brandIconColor(): IconColor {
    const match = this.color.match(/^brand-(purple|red|yellow|green)$/)
    return match ? (match[1] as IconColor) : undefined
  }

  private get leftIconAttrs() {
    if (!hasValue(this.icon) || this.loading) {
      return {
        style: { display: 'none' },
      }
    }
    return {}
  }

  private get leftRightAttrs() {
    if (!hasValue(this.iconRight) || this.loading) {
      return {
        style: { display: 'none' },
      }
    }
    return {}
  }

  private get loadingAttrs() {
    if (!this.loading) {
      return {
        style: { display: 'none' },
      }
    }
    return {}
  }

  // loading keeps the native control focusable (WCAG 2.4.3), so activation is blocked here instead of via `disabled`
  private get isInert() {
    return this.disabled || this.loading
  }

  private handleHostClick = (ev: MouseEvent) => {
    if (this.isInert) {
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  private handleFocus = () => {
    this.dsFocus.emit()
  }

  private handleBlur = () => {
    this.dsBlur.emit()
  }

  private handleClick = (ev: MouseEvent) => {
    if (!this.isInert) {
      if (this.elementType === 'submit') {
        this.internals.form?.requestSubmit()
      }
      if (this.elementType === 'reset') {
        this.internals.form?.reset()
      }

      this.dsClick.emit(ev)

      if (hasValue(this.href)) {
        this.dsNavigate.emit(ev)
      }
    }
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    const { elementType, download, href, rel, target, name, value } = this
    const size = this.hasBrandIcon ? undefined : this.size || undefined
    const TagType = !hasValue(this.href) ? 'button' : 'a'
    const attrs =
      TagType === 'button'
        ? { type: elementType, name, value }
        : {
            download,
            href,
            rel,
            target,
          }

    const ariaAttributes = {
      // the internal tooltip replaces the native title tooltip when a11yTitle is set
      'title': this.a11yTitle ? undefined : this.inheritAttributes['title'],
      'aria-label':
        this.a11yLabel || this.inheritAttributes['aria-label'] || this.a11yTitle || this.inheritAttributes['title'],
      'aria-controls': this.a11yControls || this.inheritAttributes['aria-controls'],
      'aria-current': this.a11yCurrent || undefined,
      'aria-haspopup': this.a11yHaspopup || this.inheritAttributes['aria-haspopup'],
    }

    return (
      <Host
        onClick={this.handleHostClick}
        class={{
          'is-wide': this.wide,
          [`is-${this.color || 'primary'}`]: true,
          [`is-${size}`]: hasValue(size),
          [`is-inverted`]: this.inverted,
          [`is-disabled`]: this.disabled,
          [`is-loading`]: this.loading,
          [`is-flat`]: this.flat,
          [`is-square`]: this.square,
          [`has-shadow`]: this.shadow,
          [`has-no-wrap`]: this.noWrap,
          [`has-brand-icon`]: this.hasBrandIcon,
          [`has-brand-icon-lg`]: this.hasBrandIcon && this.brandSize === 'lg',
        }}
      >
        <TagType
          {...attrs}
          {...this.inheritAttributes}
          type={this.elementType}
          id="button"
          part="native"
          disabled={this.disabled}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onClick={this.handleClick}
          aria-busy={ariaBooleanToString(!!this.loading)}
          aria-disabled={ariaBooleanToString(this.disabled || this.loading)}
          {...ariaAttributes}
        >
          {this.loading ? (
            // aria-hidden keeps the progressbar label out of the button's accessible name; the live region announces instead
            <ds-spinner
              aria-hidden="true"
              {...this.loadingAttrs}
              part="spinner"
              size={this.hasBrandIcon ? undefined : 'sm'}
              deactivated={!this.loading}
            />
          ) : (
            ''
          )}
          {this.hasBrandIcon ? (
            // the spinner above replaces the brand icon while loading
            <ds-brand-icon
              {...(this.loading ? { style: { display: 'none' } } : {})}
              part="icon"
              disabled={this.disabled}
              svg={this.isBrandIconSvg ? this.brandIcon : ''}
              src={this.isBrandIconSvg ? '' : this.brandIcon}
              size={this.brandSize}
              color={this.brandIconColor}
            />
          ) : hasValue(this.icon) ? (
            <ds-icon
              {...this.leftIconAttrs}
              part="icon"
              class={this.square ? '' : 'icon-left'}
              name={this.icon}
              size={size}
              turn={this.iconTurn}
              inverted={this.isIconInverted}
            />
          ) : (
            ''
          )}
          <span part="label">
            <slot />
          </span>
          {!this.hasBrandIcon && hasValue(this.iconRight) ? (
            <ds-icon
              {...this.leftRightAttrs}
              part="icon-right"
              class="icon-right"
              name={this.iconRight}
              size={size}
              turn={this.iconTurn}
              inverted={this.isIconInverted}
            />
          ) : (
            ''
          )}
        </TagType>
        {/* always in the DOM so the text change is announced; outside the native control to stay out of its name */}
        <span class="live-region" role="status">
          {this.announcement}
        </span>
        {hasValue(this.a11yTitle) ? (
          <ds-tooltip reference="button" placement={this.tooltipPlacement}>
            {this.a11yTitle}
          </ds-tooltip>
        ) : (
          ''
        )}
      </Host>
    )
  }
}
