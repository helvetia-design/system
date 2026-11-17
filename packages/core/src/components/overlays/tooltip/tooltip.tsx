import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { DsComponentInterface } from '@global'
import { Logger, type LogInstance, dsBrowser, OneOf, Type } from '@utils'
import {
  TOOLTIP_PLACEMENTS,
  type TooltipPlacement,
  type TooltipDidAnimateDetail,
  type TooltipWillAnimateDetail,
} from './tooltip.interfaces'

let tooltipIds = 0

/** SSR/no-DOM fallback, kept in sync with `--ds-tooltip-offset` (`Alias.Space.Gap.XS`). */
const DEFAULT_OFFSET = 8

/**
 * Tooltip displays contextual information when users hover over, focus on, or tap a trigger element.
 *
 * @slot - The tooltip content text.
 * @part container - The floating tooltip container element.
 * @part content - The inner content wrapper element.
 */
@Component({
  tag: 'ds-tooltip',
  styleUrl: 'tooltip.host.scss',
  shadow: true,
})
export class Tooltip implements DsComponentInterface {
  private tooltipId = `ds-tooltip-${tooltipIds++}`
  private containerEl: HTMLDivElement | undefined
  private cleanup?: () => void
  private trigger: HTMLElement | undefined
  private handlePresent = () => this.present()
  private handleDismiss = () => this.dismiss()

  log!: LogInstance

  @Logger('tooltip')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  /**
   * Internal presented state
   */
  @State() presented = false

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * Id of the reference element. Defaults to the trigger element.
   */
  @Prop()
  @Type('string')
  readonly reference: string = ''

  /**
   * Preferred placement of the tooltip relative to the trigger.
   */
  @Prop()
  @OneOf(TOOLTIP_PLACEMENTS)
  readonly placement: TooltipPlacement = 'bottom'

  /**
   * Offset in pixels from the trigger element to the tooltip.
   * Defaults to the `--ds-tooltip-offset` token when not set.
   */
  @Prop()
  @Type('number')
  readonly offset: number | undefined = undefined

  /**
   * Defines the maximum width of the tooltip content in pixels.
   */
  @Prop()
  @Type('number')
  readonly contentWidth: number | undefined = undefined

  /**
   * When true, the tooltip is shown immediately on load without user interaction.
   */
  @Prop()
  @Type('boolean')
  readonly open: boolean = false

  @Watch('contentWidth')
  contentWidthChanged(newValue: number | undefined) {
    if (newValue === undefined) {
      this.el.style.removeProperty('--tooltip-max-width')
    } else {
      this.el.style.setProperty('--tooltip-max-width', `${newValue}px`)
    }
  }

  /**
   * Emitted before the animation starts.
   */
  @Event() dsWillAnimate!: EventEmitter<TooltipWillAnimateDetail>

  /**
   * Emitted after the animation has finished.
   */
  @Event() dsDidAnimate!: EventEmitter<TooltipDidAnimateDetail>

  componentDidLoad(): void {
    this.contentWidthChanged(this.contentWidth)

    const trigger = this.triggerElement
    if (!trigger) return

    this.trigger = trigger
    trigger.setAttribute('aria-describedby', this.tooltipId)

    trigger.addEventListener('mouseenter', this.handlePresent)
    trigger.addEventListener('focus', this.handlePresent)
    trigger.addEventListener('mouseleave', this.handleDismiss)
    trigger.addEventListener('blur', this.handleDismiss)

    if (this.open) {
      this.present()
    }
  }

  disconnectedCallback(): void {
    if (this.cleanup) {
      this.cleanup()
      this.cleanup = undefined
    }

    if (this.trigger) {
      this.trigger.removeAttribute('aria-describedby')
      this.trigger.removeEventListener('mouseenter', this.handlePresent)
      this.trigger.removeEventListener('focus', this.handlePresent)
      this.trigger.removeEventListener('mouseleave', this.handleDismiss)
      this.trigger.removeEventListener('blur', this.handleDismiss)
      this.trigger = undefined
    }
  }

  /**
   * PUBLIC METHODS
   * ─────────────────────────────────────────────────────
   */

  /**
   * Shows the tooltip and positions it relative to the trigger element.
   */
  @Method()
  async present(): Promise<boolean> {
    const trigger = this.triggerElement
    if (!trigger || !this.containerEl) return false

    this.dsWillAnimate.emit(true)

    this.presented = true

    if (this.cleanup) {
      this.cleanup()
    }

    this.cleanup = autoUpdate(trigger, this.containerEl, () => this.update(), {
      ancestorScroll: true,
      ancestorResize: true,
      elementResize: false,
      layoutShift: true,
      animationFrame: false,
    })

    this.dsDidAnimate.emit(true)
    return true
  }

  /**
   * Hides the tooltip and cleans up the position updater.
   */
  @Method()
  async dismiss(): Promise<boolean> {
    if (!this.containerEl) return false

    this.dsWillAnimate.emit(false)

    if (this.cleanup) {
      this.cleanup()
      this.cleanup = undefined
    }

    this.presented = false

    this.dsDidAnimate.emit(false)
    return true
  }

  /**
   * Recomputes the tooltip position using floating-ui.
   */
  @Method()
  async update(): Promise<boolean> {
    const trigger = this.triggerElement
    if (!trigger || !this.containerEl) return false

    const { x, y, placement } = await computePosition(trigger, this.containerEl, {
      placement: this.placement,
      strategy: 'fixed',
      middleware: [
        dsBrowser.hasWindow && !window.frameElement ? shift() : undefined,
        flip(),
        offset(this.resolveOffset()),
      ].filter(Boolean) as any[],
    })

    Object.assign(this.containerEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    })

    this.containerEl.dataset['placement'] = placement.split('-')[0]

    return true
  }

  /**
   * GETTERS
   * ─────────────────────────────────────────────────────
   */

  private get triggerElement(): HTMLElement | null {
    if (!dsBrowser.hasDocument) return null
    const selector = `[id="${this.reference}"]`
    // Scoped to the tooltip's own (shadow) root so components can reference triggers inside their shadow DOM
    const root = this.el.getRootNode() as Document | ShadowRoot
    return (root.querySelector?.(selector) as HTMLElement | null) ?? document.querySelector(selector)
  }

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  /**
   * Resolves the trigger-to-tooltip distance in pixels.
   *
   * The `offset` prop wins when set, otherwise the value comes from the
   * `--_tooltip-offset` variable (fed by the `--ds-tooltip-offset` token).
   * floating-ui needs a number, so the computed value has to be read and
   * converted here instead of being used as a `var()` in the stylesheet.
   */
  private resolveOffset(): number {
    if (this.offset !== undefined) {
      return this.offset
    }

    try {
      const value = getComputedStyle(this.el).getPropertyValue('--_tooltip-offset').trim()
      const amount = Number.parseFloat(value)

      if (!Number.isNaN(amount)) {
        if (value.endsWith('rem')) {
          const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
          return Number.isNaN(rootFontSize) ? DEFAULT_OFFSET : amount * rootFontSize
        }
        return amount
      }
    } catch {
      // Ignore errors, e.g. if getComputedStyle is not available
    }

    return DEFAULT_OFFSET
  }

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  /**
   * Resolves the trigger-to-tooltip distance in pixels.
   *
   * The `offset` prop wins when set, otherwise the value comes from the
   * `--_tooltip-offset` variable (fed by the `--ds-tooltip-offset` token).
   * floating-ui needs a number, so the computed value has to be read and
   * converted here instead of being used as a `var()` in the stylesheet.
   */
  private resolveOffset(): number {
    if (this.offset !== undefined) {
      return this.offset
    }

    try {
      const value = getComputedStyle(this.el).getPropertyValue('--_tooltip-offset').trim()
      const amount = Number.parseFloat(value)

      if (!Number.isNaN(amount)) {
        if (value.endsWith('rem')) {
          const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
          return Number.isNaN(rootFontSize) ? DEFAULT_OFFSET : amount * rootFontSize
        }
        return amount
      }
    } catch {
      // Ignore errors, e.g. if getComputedStyle is not available
    }

    return DEFAULT_OFFSET
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    return (
      <Host id={this.tooltipId} role="tooltip" aria-hidden={`${!this.presented}`}>
        <div part="container" ref={el => (this.containerEl = el)}>
          <div part="content" data-testid="ds-tooltip-content">
            <slot></slot>
          </div>
        </div>
      </Host>
    )
  }
}
