import { Component, Element, Event, EventEmitter, h, Host, Listen, Method, Prop, State } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { ariaBooleanToString, Logger, type LogInstance, hasValue, OneOf, Type } from '@utils'
import { DsComponentInterface, DsConfigObserver, DsConfigState, ListenToConfig } from '@global'
import {
  ACCORDION_SUMMARY_LEVELS,
  ACCORDION_MARKERS,
  ACCORDION_MARKER_POSITIONS,
  ACCORDION_BUTTON_COLORS,
  ACCORDION_BUTTON_SIZES,
  type AccordionSummaryLevel,
  type AccordionMarker,
  type AccordionMarkerPosition,
  type AccordionButtonColor,
  type AccordionButtonSize,
  type AccordionToggleDetail,
  type AccordionToggle,
} from './accordion.interfaces'

/**
 * Accordion displays collapsible content sections with open/close toggle buttons and optional animations.
 * Perfect for organizing large amounts of content into logical, expandable groups.
 *
 * @slot content - The content slot defines the collapsible content of the accordion, which is hidden by default and becomes visible when the accordion is opened.
 * @slot summary - The summary slot defines the summary of the accordion, which is always visible and serves as the toggle button to open or close the accordion.
 * @part accordion - The accordion container element.
 * @part header - The header element that contains the summary and marker.
 * @part summary - The summary element that serves as the toggle button.
 * @part marker - The marker element that indicates the open/close state of the accordion.
 * @part content - The content element that contains the collapsible content of the accordion.
 *
 * @variant is-list - List row look with bottom border, row padding, hover and active backgrounds. Place in `ds-list > li`.
 * @variant is-inverted - Inverted color scheme for use on dark backgrounds such as the primary surface.
 */
@Component({
  tag: 'ds-accordion',
  styleUrl: 'accordion.host.scss',
  shadow: true,
})
export class Accordion implements DsComponentInterface, DsConfigObserver {
  private accordionId = `ds-accordion-${accordionIds++}`

  @State() animated = true
  @State() isAnimating = false

  @Element() el!: HTMLStencilElement

  log!: LogInstance

  @Logger('accordion')
  createLogger(log: LogInstance) {
    this.log = log
  }

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * If `true` the accordion is open.
   */
  @Prop({ reflect: true, mutable: true })
  @Type('boolean')
  open: boolean = false

  /**
   * The name of the group the accordion belongs to. Accordions with the same group name will automatically
   * close when another accordion in the same group is opened.
   */
  @Prop({ reflect: true })
  @Type('string')
  readonly group: string = ''

  /**
   * If `true`, the accordion renders as a list row: bottom border, row padding, hover and active backgrounds.
   * Place it in `ds-list > li`. Incompatible with `button` and the `button*`, `summaryTitle` and
   * `summaryVisualLevel` props: `list` wins when combined.
   */
  @Prop()
  @Type('boolean')
  readonly list: boolean = false

  /**
   * If `true`, the accordion uses an inverted color scheme for use on dark backgrounds such as the primary surface.
   */
  @Prop()
  @Type('boolean')
  readonly inverted: boolean = false

  /**
   * The heading level of the summary
   */
  @Prop()
  @OneOf(ACCORDION_SUMMARY_LEVELS)
  readonly summaryLevel: AccordionSummaryLevel = 'h3'

  /**
   * The visual heading level of the summary.
   */
  @Prop()
  @OneOf(ACCORDION_SUMMARY_LEVELS)
  readonly summaryVisualLevel?: AccordionSummaryLevel

  /**
   * If `true` the summary is styled as a title.
   */
  @Prop()
  @Type('boolean')
  readonly summaryTitle: boolean = false

  /**
   * The marker variant. Only applies if `button` is `false`.
   * If `''` the default marker is used, if `plus` a plus icon is used and if `plus-minus`
   * a plus icon for closed and a minus icon for open state is used.
   */
  @Prop()
  @OneOf(ACCORDION_MARKERS)
  readonly marker?: AccordionMarker

  /**
   * The position of the marker. Only applies if `button` is `false`.
   */
  @Prop()
  @OneOf(ACCORDION_MARKER_POSITIONS)
  readonly markerPosition?: AccordionMarkerPosition

  /**
   * Displays the summary as a button and hides the default marker.
   */
  @Prop()
  @Type('boolean')
  readonly button: boolean = false

  /**
   * If `true` the button is expanded to full width. Only applies if `button` is `true`.
   */
  @Prop()
  @Type('boolean')
  readonly buttonWide: boolean = false

  /**
   * The color of the button. Only applies if `button` is `true`.
   */
  @Prop()
  @OneOf(ACCORDION_BUTTON_COLORS)
  readonly buttonColor: AccordionButtonColor = 'primary'

  /**
   * The size of the button. Only applies if `button` is `true`.
   */
  @Prop()
  @OneOf(ACCORDION_BUTTON_SIZES)
  readonly buttonSize?: AccordionButtonSize

  /**
   * Label of the open trigger button
   */
  @Prop()
  @Type('string')
  readonly buttonLabelOpen: string = ''

  /**
   * BalIcon of the open trigger button
   */
  @Prop()
  @Type('string')
  readonly buttonIconOpen: string = ''

  /**
   * Label of the close trigger button
   */
  @Prop()
  @Type('string')
  readonly buttonLabelClose: string = ''

  /**
   * BalIcon of the close trigger button
   */
  @Prop()
  @Type('string')
  readonly buttonIconClose: string = ''

  /**
   * Emitted when the input value has changed.
   */
  @Event() dsToggle!: EventEmitter<AccordionToggleDetail>

  /**
   * Emitted when the accordion is opened.
   */
  @Event() dsOpened!: EventEmitter<AccordionToggleDetail>

  /**
   * Emitted when the accordion is closed.
   */
  @Event() dsClosed!: EventEmitter<AccordionToggleDetail>

  /**
   * PUBLIC LISTENERS
   * ─────────────────────────────────────────────────────
   */

  @Listen('dsOpened', { target: 'window' })
  listenToDsOpened(event: AccordionToggle) {
    const { id, group } = event.detail

    // ignore self
    if (id === this.accordionId) return

    // only react if same group (or no group = global)
    if ((this.group && group !== this.group) || !hasValue(this.group)) return

    this.open = false
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
    this.animated = state.animated
  }

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  private handleToggle(event: MouseEvent, open: boolean) {
    // check if target is link or button and ignore toggle if so,
    // to allow nested interactive elements in the summary
    const target = event.target as HTMLElement
    const interactiveElement = target.closest('a, button, input, ds-toggle, ds-checkbox')
    if (interactiveElement && interactiveElement !== (event.currentTarget as HTMLElement)) {
      return
    }

    if (this.animated) {
      this.isAnimating = true
    } else {
      this.isAnimating = false
    }

    this.open = open

    this.dsToggle.emit({ id: this.accordionId, group: this.group, open })

    if (open) {
      this.dsOpened.emit({ id: this.accordionId, group: this.group, open })
    } else {
      this.dsClosed.emit({ id: this.accordionId, group: this.group, open })
    }
  }

  private handleContentTransitionEnd = (_event: TransitionEvent) => {
    if (this.animated) {
      this.isAnimating = false
    }
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    const isButton = this.button && !this.list
    const hasButtonIcon = !this.list && (!!this.buttonIconOpen || !!this.buttonIconClose)
    const MarkerIcon = (
      <ds-icon
        id="marker"
        part="marker"
        class={{
          'has-marker-plus': this.marker === 'plus' || (this.marker === 'plus-minus' && !this.open),
          'has-marker-minus': this.marker === 'plus-minus' && this.open,
        }}
        name={
          this.marker === 'plus' ? 'plus' : this.marker !== 'plus-minus' ? 'caret-down' : this.open ? 'minus' : 'plus'
        }
      ></ds-icon>
    )

    return (
      <Host
        class={{
          'is-button': hasButtonIcon,
          'is-list': this.list,
          'is-inverted': this.inverted,
          'is-title': !this.list && (this.summaryTitle === true || hasValue(this.summaryVisualLevel)),
          [`is-${this.summaryVisualLevel}`]: !this.list && !!this.summaryVisualLevel,
          'is-animated': !!this.animated,
          'is-animating': !!this.animated && this.isAnimating,
        }}
      >
        {/* ---------------------------------------- */}
        {/* Summary                                  */}
        {/* ---------------------------------------- */}
        <this.summaryLevel id="header" part="header">
          <button
            type="button"
            aria-expanded={ariaBooleanToString(this.open)}
            aria-controls="content"
            id="summary"
            part="summary"
            onClick={ev => this.handleToggle(ev, !this.open)}
            class={{
              'ds-button': isButton,
              'is-wide': !this.list && this.buttonWide,
              [`is-${this.buttonColor}`]: !this.list && !!this.buttonColor,
              [`is-${this.buttonSize}`]: !this.list && !!this.buttonSize,
              'is-inverted': isButton && this.inverted,
              'has-marker-left': this.markerPosition === 'left',
            }}
          >
            {/* ---------------------------------------- */}
            {/* Summary Button Icon                      */}
            {/* ---------------------------------------- */}
            {hasButtonIcon ? (
              <ds-icon
                id="marker"
                part="marker"
                name={this.open ? this.buttonIconOpen : this.buttonIconClose}
              ></ds-icon>
            ) : (
              isButton && MarkerIcon
            )}
            {/* ---------------------------------------- */}
            {/* Summary Label                            */}
            {/* ---------------------------------------- */}
            <span id="label" class={{ 'is-button': isButton }}>
              <slot name="summary">{this.open ? this.buttonLabelOpen : this.buttonLabelClose}</slot>
            </span>
            {/* ---------------------------------------- */}
            {/* Summary Marker                           */}
            {/* ---------------------------------------- */}
            {!isButton && this.marker !== 'none' && !hasButtonIcon && MarkerIcon}
          </button>
        </this.summaryLevel>
        {/* ---------------------------------------- */}
        {/* Content                                  */}
        {/* ---------------------------------------- */}
        <div
          id="content"
          role="region"
          aria-labelledby="summary"
          part="content"
          hidden={!this.open}
          onTransitionEnd={this.handleContentTransitionEnd}
        >
          <div id="inner">
            <slot name="content" />
            <slot />
          </div>
        </div>
      </Host>
    )
  }
}

let accordionIds = 1
