import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { Component, Element, Event, EventEmitter, h, Host, Listen, Method, Prop, State, Watch } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { DsComponentInterface } from '@global'
import { Logger, type LogInstance, dsBrowser, isEscapeKey, OneOf, Type } from '@utils'
import {
  TOOLTIP_PLACEMENTS,
  type TooltipPlacement,
  type TooltipDidAnimateDetail,
  type TooltipWillAnimateDetail,
} from './tooltip.interfaces'

let tooltipIds = 0

/** SSR/no-DOM fallback, kept in sync with `--ds-tooltip-offset` and `--ds-tooltip-gutter` (`Alias.Space.Gap.XS`). */
const DEFAULT_OFFSET = 8

/** Grace period that lets the pointer travel from the trigger onto the tooltip (WCAG 1.4.13 hoverable). */
const HOVER_DISMISS_DELAY = 100

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
  private dismissTimer: ReturnType<typeof setTimeout> | undefined
  private handlePresent = () => this.present()
  private handleDismiss = () => this.dismiss()
  private handleDelayedDismiss = () => this.scheduleDismiss()
  private handleContainerMouseEnter = () => this.clearDismissTimer()

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
   * Defaults to the `--ds-tooltip-max-width` token; always capped to the viewport.
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

  /**
   * When true, the tooltip never presents, even on hover/focus of the trigger.
   */
  @Prop()
  @Type('boolean')
  readonly disabled: boolean = false

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

  connectedCallback(): void {
    // Reconnecting after a DOM move: componentDidLoad only runs once, but disconnectedCallback detached the trigger.
    if (this.containerEl && !this.trigger) this.attachTrigger()
  }

  componentDidLoad(): void {
    this.contentWidthChanged(this.contentWidth)
    this.attachTrigger()
  }

  disconnectedCallback(): void {
    this.clearDismissTimer()

    if (this.cleanup) {
      this.cleanup()
      this.cleanup = undefined
    }

    if (this.trigger) {
      this.removeDescribedBy(this.trigger)
      this.trigger.removeEventListener('mouseenter', this.handlePresent)
      this.trigger.removeEventListener('focus', this.handlePresent)
      this.trigger.removeEventListener('mouseleave', this.handleDelayedDismiss)
      this.trigger.removeEventListener('blur', this.handleDismiss)
      this.trigger = undefined
    }
  }

  /**
   * PUBLIC LISTENERS
   * ─────────────────────────────────────────────────────
   */

  @Listen('keydown', { target: 'document' })
  listenToKeyDown(ev: KeyboardEvent): void {
    if (!this.presented) return

    if (isEscapeKey(ev)) {
      this.dismiss()
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
    if (!trigger || !this.containerEl || this.disabled) return false

    this.clearDismissTimer()

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

    this.clearDismissTimer()

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
        offset(this.resolveOffset()),
        flip(),
        dsBrowser.hasWindow && !window.frameElement
          ? shift({ padding: this.resolvePx('--_tooltip-gutter') })
          : undefined,
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

  private attachTrigger(): void {
    const trigger = this.triggerElement
    if (!trigger) return

    this.trigger = trigger
    this.addDescribedBy(trigger)

    trigger.addEventListener('mouseenter', this.handlePresent)
    trigger.addEventListener('focus', this.handlePresent)
    trigger.addEventListener('mouseleave', this.handleDelayedDismiss)
    trigger.addEventListener('blur', this.handleDismiss)

    if (this.open) {
      this.present()
    }
  }

  private addDescribedBy(trigger: HTMLElement): void {
    const ids = this.describedByIds(trigger)
    if (!ids.includes(this.tooltipId)) {
      trigger.setAttribute('aria-describedby', [...ids, this.tooltipId].join(' '))
    }
  }

  private removeDescribedBy(trigger: HTMLElement): void {
    const ids = this.describedByIds(trigger).filter(id => id !== this.tooltipId)
    if (ids.length > 0) {
      trigger.setAttribute('aria-describedby', ids.join(' '))
    } else {
      trigger.removeAttribute('aria-describedby')
    }
  }

  private describedByIds(trigger: HTMLElement): string[] {
    return (trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  }

  private scheduleDismiss(): void {
    this.clearDismissTimer()
    if (!this.presented) return

    this.dismissTimer = setTimeout(() => {
      if (!this.isTriggerFocused()) this.dismiss()
    }, HOVER_DISMISS_DELAY)
  }

  private isTriggerFocused(): boolean {
    const root = this.trigger?.getRootNode() as Document | ShadowRoot | undefined
    return !!this.trigger && root?.activeElement === this.trigger
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== undefined) {
      clearTimeout(this.dismissTimer)
      this.dismissTimer = undefined
    }
  }

  /**
   * Resolves the trigger-to-tooltip distance in pixels.
   *
   * The `offset` prop wins when set, otherwise the value comes from the
   * `--_tooltip-offset` variable (fed by the `--ds-tooltip-offset` token).
   * floating-ui needs a number, so the computed value has to be read and
   * converted here instead of being used as a `var()` in the stylesheet.
   */
  private resolveOffset(): number {
    return this.offset !== undefined ? this.offset : this.resolvePx('--_tooltip-offset')
  }

  /** Reads a length custom property (px or rem) as a number; falls back to `DEFAULT_OFFSET`. */
  private resolvePx(property: string): number {
    try {
      const value = getComputedStyle(this.el).getPropertyValue(property).trim()
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
        <div
          part="container"
          ref={el => (this.containerEl = el)}
          onMouseEnter={this.handleContainerMouseEnter}
          onMouseLeave={this.handleDelayedDismiss}
        >
          <div part="content" data-testid="ds-tooltip-content">
            <slot></slot>
          </div>
        </div>
      </Host>
    )
  }
}
