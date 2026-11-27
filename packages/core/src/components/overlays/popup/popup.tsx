import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
  writeTask,
} from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { DsComponentInterface, DsConfigObserver, DsConfigState, ListenToConfig } from '@global'
import { FocusHandler, Logger, type LogInstance, dsBrowser, isEscapeKey, wait, OneOf, Type } from '@utils'
import {
  POPUP_PLACEMENTS,
  POPUP_ROLES,
  type PopupPlacement,
  type PopupRole,
  type PopupPresentDetail,
  type PopupDismissDetail,
} from './popup.interfaces'

// ─── Group registry ───────────────────────────────────────────────────────────
// Module-level map so same-group popups can dismiss each other.
const popupGroups = new Map<string, Set<HTMLDsPopupElement>>()

// Open popups in opening order, so Escape only closes the topmost closable one.
const openPopups: Popup[] = []

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([tabindex^="-"]),input:not([type=hidden]):not([disabled]):not([tabindex^="-"]),select:not([disabled]):not([tabindex^="-"]),textarea:not([disabled]):not([tabindex^="-"]),a[href]:not([tabindex^="-"]),[tabindex]:not([tabindex^="-"])'

/**
 * Popup displays anchored overlay content positioned relative to a trigger element.
 * Serves as a primitive for dropdowns, hints, menus, datepickers, and autocompletes.
 *
 * Trigger wiring:
 *   Programmatic — set the `trigger` property to an HTMLElement; call `present()` / `dismiss()`.
 *   Declarative  — add `data-popup="<id>"` to any trigger element and set matching `id` on popup.
 *
 * @slot - The popup content.
 * @part panel    - The floating panel container.
 * @part backdrop - The optional full-screen backdrop overlay.
 * @part close    - The optional close button (visible when closable).
 */
@Component({
  tag: 'ds-popup',
  styleUrl: 'popup.host.scss',
  shadow: true,
})
export class Popup implements DsComponentInterface, DsConfigObserver {
  private arrowEl: HTMLDivElement | undefined
  private cleanupPositioner?: () => void
  private currentTrigger: HTMLElement | undefined = undefined
  private didLoad = false
  private focusHandler = new FocusHandler()
  private transitionQueue: Promise<void> = Promise.resolve()

  log!: LogInstance

  @Logger('popup')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  @State() animated = true
  @State() isOpen = false

  panelEl: HTMLDivElement | undefined

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * If `true` the popup is open.
   */
  @Prop({ reflect: true, mutable: true })
  @Type('boolean')
  open: boolean = false

  @Watch('open')
  openChanged(newValue: boolean) {
    newValue ? this.runPresent() : this.runDismiss()
  }

  /**
   * The trigger element. Setting this wires up aria-haspopup and aria-expanded automatically.
   */
  @Prop()
  readonly trigger: HTMLElement | undefined = undefined

  @Watch('trigger')
  triggerChanged(newTrigger: HTMLElement | undefined, oldTrigger: HTMLElement | undefined) {
    if (oldTrigger) {
      oldTrigger.removeAttribute('aria-haspopup')
      oldTrigger.removeAttribute('aria-expanded')
    }
    if (newTrigger) {
      newTrigger.setAttribute('aria-haspopup', this.panelRole)
      newTrigger.setAttribute('aria-expanded', 'false')
    }
  }

  /**
   * Preferred placement of the popup relative to the trigger.
   */
  @Prop()
  @OneOf(POPUP_PLACEMENTS)
  readonly placement: PopupPlacement = 'bottom'

  /**
   * Offset in pixels between the trigger element and the popup panel.
   */
  @Prop()
  @Type('number')
  readonly offset: number = 8

  /**
   * ARIA role applied to the panel and the aria-haspopup value set on the trigger.
   * Use "dialog" for rich content, "listbox" or "menu" for interactive option lists.
   */
  @Prop()
  @OneOf(POPUP_ROLES)
  readonly panelRole: PopupRole = 'dialog'

  /**
   * If `true`, the popup can be dismissed via the Escape key and shows a close button.
   */
  @Prop()
  @Type('boolean')
  readonly closable: boolean = false

  /**
   * If `true`, clicking outside the popup panel dismisses it.
   */
  @Prop()
  @Type('boolean')
  readonly backdropDismiss: boolean = false

  /**
   * If `true`, a full-screen backdrop overlay is rendered behind the popup panel.
   */
  @Prop()
  @Type('boolean')
  readonly backdrop: boolean = false

  /**
   * Group name for mutual-exclusion. Only one popup within the same group is open at a time.
   */
  @Prop()
  @Type('string')
  readonly group: string | undefined = undefined

  /**
   * Accessible label for the popup panel (sets aria-label on the panel element).
   */
  @Prop()
  @Type('string')
  readonly label: string = ''

  /**
   * If `true`, renders a small arrow indicator pointing from the panel toward the trigger.
   */
  @Prop()
  @Type('boolean')
  readonly arrow: boolean = false

  /**
   * Override the automatic focus-trap behaviour.
   * When undefined, trapping is enabled when `backdrop` is `true` and disabled otherwise.
   */
  @Prop()
  @Type('boolean')
  readonly trapFocus: boolean | undefined = undefined

  /**
   * EVENTS
   * ─────────────────────────────────────────────────────
   */

  /** Emitted before the popup opens. */
  @Event() dsWillPresent!: EventEmitter<PopupPresentDetail>

  /** Emitted after the popup is fully open. */
  @Event() dsDidPresent!: EventEmitter<PopupPresentDetail>

  /** Emitted before the popup closes. */
  @Event() dsWillDismiss!: EventEmitter<PopupDismissDetail>

  /** Emitted after the popup is fully closed. */
  @Event() dsDidDismiss!: EventEmitter<PopupDismissDetail>

  /**
   * LIFECYCLE
   * ─────────────────────────────────────────────────────
   */

  connectedCallback(): void {
    this.registerGroup()
    // Reconnecting after a DOM move: componentDidLoad only runs once, but disconnectedCallback cleared the trigger state.
    if (this.didLoad) this.restoreTriggerState()
  }

  componentDidLoad(): void {
    this.didLoad = true
    if (this.trigger) {
      this.trigger.setAttribute('aria-haspopup', this.panelRole)
      this.trigger.setAttribute('aria-expanded', 'false')
    }
    this.wireDeclarativeTriggers()
    if (this.open) {
      this.runPresent()
    }
  }

  disconnectedCallback(): void {
    this.removeFromOpenStack()
    this.cleanupPositioner?.()
    this.focusHandler.disconnect()
    for (const trigger of new Set([this.trigger, this.currentTrigger, ...this.declarativeTriggers])) {
      trigger?.removeAttribute('aria-haspopup')
      trigger?.removeAttribute('aria-expanded')
    }
    this.unregisterGroup()
  }

  /**
   * PUBLIC LISTENERS
   * ─────────────────────────────────────────────────────
   */

  @Listen('click', { target: 'document' })
  async listenToClick(ev: MouseEvent): Promise<void> {
    // Declarative trigger: element with data-popup matching this element's id.
    if (this.el.id) {
      const closest = (ev.target as HTMLElement).closest<HTMLElement>('[data-popup]')
      if (closest && this.isDeclarativeTrigger(closest)) {
        this.currentTrigger = closest
        await this.toggle()
        return
      }
    }

    // Click-outside dismiss using composedPath so shadow DOM clicks are detected.
    if (this.backdropDismiss && this.isOpen) {
      const path = ev.composedPath() as EventTarget[]
      const insidePanel = path.includes(this.panelEl as EventTarget)
      const effectiveTrigger = this.currentTrigger ?? this.trigger
      const insideTrigger = effectiveTrigger ? path.includes(effectiveTrigger) : false
      if (!insidePanel && !insideTrigger) {
        await this.dismiss()
      }
    }
  }

  @Listen('keydown', { target: 'document' })
  listenToKeyDown(ev: KeyboardEvent): void {
    if (!this.isOpen || !this.closable || !isEscapeKey(ev)) return
    const topmostClosable = [...openPopups].reverse().find(popup => popup.closable)
    if (topmostClosable !== this) return

    // preventDefault also stops a surrounding native <dialog> (ds-modal, ds-drawer) from closing on the same Escape.
    ev.preventDefault()
    ev.stopPropagation()
    this.dismiss()
  }

  /**
   * PUBLIC METHODS
   * ─────────────────────────────────────────────────────
   */

  /** Opens the popup. */
  @Method()
  async present(): Promise<void> {
    this.open = true
  }

  /** Closes the popup. */
  @Method()
  async dismiss(): Promise<void> {
    this.open = false
  }

  /** Toggles the popup open or closed. */
  @Method()
  async toggle(): Promise<void> {
    this.open ? this.dismiss() : this.present()
  }

  /**
   * @internal
   */
  @Method()
  @ListenToConfig()
  async configChanged(state: DsConfigState): Promise<void> {
    this.animated = state.animated
  }

  /**
   * EVENT HANDLERS
   * ─────────────────────────────────────────────────────
   */

  private handleCloseClick = (): void => {
    this.dismiss()
  }

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  private get shouldTrapFocus(): boolean {
    if (this.trapFocus !== undefined) return this.trapFocus
    return this.backdrop
  }

  private isDeclarativeTrigger(el: HTMLElement): boolean {
    return !!this.el.id && el.getAttribute('data-popup') === this.el.id
  }

  private get declarativeTriggers(): HTMLElement[] {
    if (!this.el.id || !dsBrowser.hasDocument) return []
    return Array.from(document.querySelectorAll<HTMLElement>('[data-popup]')).filter(el =>
      this.isDeclarativeTrigger(el),
    )
  }

  private wireDeclarativeTriggers(): void {
    this.declarativeTriggers.forEach(trigger => {
      trigger.setAttribute('aria-haspopup', this.panelRole)
      trigger.setAttribute('aria-expanded', 'false')
    })
  }

  private restoreTriggerState(): void {
    this.wireDeclarativeTriggers()
    if (this.trigger) {
      this.trigger.setAttribute('aria-haspopup', this.panelRole)
      this.trigger.setAttribute('aria-expanded', 'false')
    }
    if (!this.isOpen) return

    if (!openPopups.includes(this)) openPopups.push(this)
    const trigger = this.currentTrigger ?? this.trigger
    if (trigger) {
      trigger.setAttribute('aria-haspopup', this.panelRole)
      trigger.setAttribute('aria-expanded', 'true')
      this.startPositioner(trigger)
    }
    if (this.shouldTrapFocus) this.enableFocusTrap(trigger)
  }

  private enableFocusTrap(trigger: HTMLElement | undefined): void {
    this.focusHandler.enable({
      target: this.panelEl,
      restoreElement: trigger ?? null,
      allowOutsideClick: this.isOutsideClickAllowed,
    })
  }

  private isOutsideClickAllowed = (ev: MouseEvent | TouchEvent): boolean => {
    if (this.backdropDismiss) return true
    const effectiveTrigger = this.currentTrigger ?? this.trigger
    return ev.composedPath().some(target => {
      if (target === effectiveTrigger) return true
      return target instanceof HTMLElement ? this.isDeclarativeTrigger(target) : false
    })
  }

  private removeFromOpenStack(): void {
    const index = openPopups.indexOf(this)
    if (index !== -1) openPopups.splice(index, 1)
  }

  private isFocusInside(): boolean {
    let active = document.activeElement
    if (!active || active === document.body) return true
    while (active) {
      if (this.el.contains(active)) return true
      active = active.shadowRoot?.activeElement ?? null
    }
    return false
  }

  private runPresent(): void {
    this.transitionQueue = this.transitionQueue.then(() => this.doPresent()).catch(() => undefined)
  }

  private runDismiss(): void {
    this.transitionQueue = this.transitionQueue.then(() => this.doDismiss()).catch(() => undefined)
  }

  private async doPresent(): Promise<void> {
    if (this.isOpen) return
    const trigger = this.currentTrigger ?? this.trigger

    await this.dismissGroupSiblings()
    this.dsWillPresent.emit({ trigger })

    if (trigger) {
      trigger.setAttribute('aria-haspopup', this.panelRole)
      trigger.setAttribute('aria-expanded', 'true')
      // Compute initial position while panel is still invisible so there is no flash.
      await this.updatePosition(trigger)
      this.startPositioner(trigger)
    }

    this.isOpen = true
    openPopups.push(this)

    // The panel stays visibility:hidden until the is-open class renders, and hidden elements cannot take focus.
    await new Promise<void>(resolve => writeTask(() => resolve()))
    if (this.animated) await wait(300)

    if (this.shouldTrapFocus) this.enableFocusTrap(trigger)
    this.focusPanel()
    this.dsDidPresent.emit({ trigger })
  }

  private async doDismiss(): Promise<void> {
    if (!this.isOpen) return
    const trigger = this.currentTrigger ?? this.trigger

    this.dsWillDismiss.emit({ trigger })

    this.cleanupPositioner?.()
    this.cleanupPositioner = undefined

    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false')
    }

    this.isOpen = false
    this.removeFromOpenStack()

    if (this.animated) await wait(300)

    const focusWasInside = this.isFocusInside()
    if (this.shouldTrapFocus) {
      this.focusHandler.disable({ returnFocus: focusWasInside })
      if (focusWasInside) this.focusHandler.restoreFocus()
    } else if (focusWasInside) {
      trigger?.focus()
    }
    this.dsDidDismiss.emit({ trigger })
  }

  private startPositioner(trigger: HTMLElement): void {
    if (!this.panelEl) return
    this.cleanupPositioner = autoUpdate(trigger, this.panelEl, () => this.updatePosition(trigger), {
      ancestorScroll: true,
      ancestorResize: true,
      elementResize: true,
      layoutShift: true,
      animationFrame: false,
    })
  }

  private async updatePosition(trigger: HTMLElement): Promise<void> {
    if (!this.panelEl) return
    const { x, y, placement, middlewareData } = await computePosition(trigger, this.panelEl, {
      placement: this.placement,
      strategy: 'fixed',
      middleware: [
        dsBrowser.hasWindow && !window.frameElement ? shift() : undefined,
        flip(),
        offset(this.offset),
        this.arrow && this.arrowEl ? arrow({ element: this.arrowEl }) : undefined,
      ].filter(Boolean) as NonNullable<Parameters<typeof computePosition>[2]>['middleware'],
    })
    Object.assign(this.panelEl.style, { left: `${x}px`, top: `${y}px` })
    this.panelEl.dataset['placement'] = placement.split('-')[0]

    if (this.arrow && this.arrowEl && middlewareData.arrow) {
      const { x: ax, y: ay } = middlewareData.arrow
      Object.assign(this.arrowEl.style, {
        left: ax != null ? `${ax}px` : '',
        top: ay != null ? `${ay}px` : '',
      })
    }
  }

  private focusPanel(): void {
    if (!this.panelEl) return
    const slotted = this.panelEl.querySelector('slot')?.assignedElements({ flatten: true }) ?? []
    for (const el of slotted) {
      const focusable = this.findFocusable(el)
      if (focusable) {
        focusable.focus({ preventScroll: true })
        return
      }
    }
    this.panelEl.focus({ preventScroll: true })
  }

  private findFocusable(el: globalThis.Element): HTMLElement | undefined {
    if (el instanceof HTMLElement && el.matches(FOCUSABLE_SELECTOR)) return el
    const children = Array.from(el.shadowRoot ? el.shadowRoot.children : el.children)
    for (const child of children) {
      const candidates = child instanceof HTMLSlotElement ? child.assignedElements({ flatten: true }) : [child]
      for (const candidate of candidates) {
        const focusable = this.findFocusable(candidate)
        if (focusable) return focusable
      }
    }
    return undefined
  }

  private registerGroup(): void {
    if (!this.group) return
    if (!popupGroups.has(this.group)) popupGroups.set(this.group, new Set())
    popupGroups.get(this.group)!.add(this.el as unknown as HTMLDsPopupElement)
  }

  private unregisterGroup(): void {
    if (!this.group) return
    popupGroups.get(this.group)?.delete(this.el as unknown as HTMLDsPopupElement)
  }

  private async dismissGroupSiblings(): Promise<void> {
    if (!this.group) return
    const siblings = popupGroups.get(this.group)
    if (!siblings) return
    for (const sibling of siblings) {
      if (sibling !== (this.el as unknown as HTMLDsPopupElement)) {
        await sibling.dismiss()
      }
    }
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    return (
      <Host class={{ 'is-open': this.isOpen, 'is-animated': this.animated, 'is-closable': this.closable }}>
        {this.backdrop && <div part="backdrop" />}
        <div
          part="panel"
          ref={el => (this.panelEl = el)}
          role={this.panelRole}
          aria-modal={this.panelRole === 'dialog' && this.shouldTrapFocus ? 'true' : undefined}
          aria-label={this.label || undefined}
          tabindex="-1"
          data-testid="ds-popup-panel"
        >
          {this.arrow && <div part="arrow" ref={el => (this.arrowEl = el as HTMLDivElement)} />}
          {this.closable && <ds-close part="close" onClick={this.handleCloseClick} />}
          <slot />
        </div>
      </Host>
    )
  }
}
