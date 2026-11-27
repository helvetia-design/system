import { Component, Element, Event, EventEmitter, h, Host, Listen, Method, Prop, State, Watch } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { Logger, type LogInstance, stopEventBubbling, byTagName, directChildren, OneOf, Type, raf } from '@utils'
import {
  DsComponentInterface,
  DsConfigObserver,
  DsConfigState,
  DsLanguage,
  DsRegion,
  ListenToConfig,
  defaultConfig,
} from '@global'
import {
  CAROUSEL_CONTROLS,
  CarouselControls,
  CAROUSEL_VARIANTS,
  CarouselVariant,
  CarouselChangeDetail,
} from '../carousel.interfaces'
import { i18nDsCarousel } from './carousel.i18n'

/**
 * Carousel coordinates ds-carousel-item children into a scrollable, accessible slide interface. Supports an image slider and a product tile strip.
 *
 * @slot - ds-carousel-item children.
 * @part track - The scrollable item track.
 */
@Component({
  tag: 'ds-carousel',
  styleUrl: 'carousel.host.scss',
  shadow: true,
})
export class Carousel implements DsComponentInterface, DsConfigObserver {
  log!: LogInstance

  @Logger('carousel')
  createLogger(log: LogInstance) {
    this.log = log
  }

  @Element() el!: HTMLStencilElement

  @State() language: DsLanguage = defaultConfig.language
  @State() region: DsRegion = defaultConfig.region
  @State() private activeIndex = 0
  @State() private itemCount = 0
  @State() private canScrollLeft = false
  @State() private canScrollRight = false
  @State() private dragging = false

  /**
   * PUBLIC PROPERTY API
   * ─────────────────────────────────────────────────────
   */

  /**
   * Control style. `dots` shows dot pagination with prev/next arrows (image variant). `large` shows large side arrows (product variant). `large-below` shows large round arrow buttons centered below the track. `none` hides all controls.
   */
  @Prop()
  @OneOf(CAROUSEL_CONTROLS)
  readonly controls: CarouselControls = 'dots'

  /**
   * Visual variant. `slide` uses scroll-snap and shows one slide at a time. `tile` shows multiple items with free scrolling.
   */
  @Prop()
  @OneOf(CAROUSEL_VARIANTS)
  readonly variant: CarouselVariant = 'slide'

  /**
   * Number of items visible at once. `auto` sizes items by content. A number divides the container width equally. A string sets it per breakpoint with `ds-col` prefixes, e.g. `"1 tablet:2 desktop:3"`.
   */
  @Prop()
  readonly itemsPerView: number | 'auto' | string = 'auto'

  @Watch('itemsPerView')
  itemsPerViewChanged() {
    this.setup()
  }

  /**
   * Accessible label for the carousel region.
   */
  @Prop()
  @Type('string')
  readonly label: string = ''

  /**
   * Number of items to advance per arrow click.
   */
  @Prop()
  @Type('number')
  readonly steps: number = 1

  /**
   * Name of the currently selected ds-carousel-item.
   */
  @Prop({ mutable: true, reflect: true })
  @Type('string')
  value?: string | null

  @Watch('value')
  valueChanged() {
    // Sync selection/activeIndex now so the post-render updateChildren() has nothing left to change.
    this.updateChildren()
    // Internal changes (observer, activateItem, setup default) already have the track where it needs to be.
    if (this.isInternalValueChange) return
    this.scrollToActive()
  }

  /**
   * Emitted when the selected item changes.
   */
  @Event() dsChange!: EventEmitter<CarouselChangeDetail>

  private trackEl?: HTMLElement
  private resizeObserver?: ResizeObserver
  private intersectionObserver?: IntersectionObserver
  private intersectionInitialized = false
  private momentumAnimId = 0
  private dragStartX = 0
  private dragStartScrollLeft = 0
  private velocityHistory: Array<{ x: number; t: number }> = []
  // True while a programmatic scroll (from scrollToActive) is in flight. While the browser
  // animates toward the target, it visually passes through intermediate slides, which would
  // otherwise cross the IntersectionObserver's 50% threshold and briefly reassign `value` to
  // whichever slide is mid-transit — causing the active dot to jump backward before catching up.
  private isProgrammaticScroll = false
  private programmaticScrollTimeout = 0
  private snapRestoreTimeout = 0
  // True while `value` is being assigned by the component itself, so the value watcher doesn't scroll.
  private isInternalValueChange = false
  private hasPresetValue = false

  /**
   * LIFECYCLE
   * ─────────────────────────────────────────────────────
   */

  connectedCallback() {
    // Reconnecting after a DOM move: componentDidLoad only runs once, but disconnectedCallback tore down the observers.
    if (this.trackEl) {
      this.initScroll()
      this.initIntersection()
    }
  }

  componentWillLoad() {
    // State (itemCount, value default, activeIndex) is set here, not in componentDidLoad, to avoid a second render pass.
    this.hasPresetValue = !!this.value
    this.setup()
  }

  componentDidLoad() {
    this.initScroll()
    this.initIntersection()
    if (this.hasPresetValue) this.scrollToActive('instant')
  }

  componentDidUpdate() {
    this.updateChildren()
    if (this.variant === 'tile') this.checkOverflow()
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect()
    this.intersectionObserver?.disconnect()
    this.trackEl?.removeEventListener('scroll', this.checkOverflow)
    this.trackEl?.removeEventListener('scrollend', this.handleScrollEnd)
    this.trackEl?.removeEventListener('scrollend', this.restoreSnap)
    cancelAnimationFrame(this.momentumAnimId)
    clearTimeout(this.programmaticScrollTimeout)
    clearTimeout(this.snapRestoreTimeout)
  }

  /**
   * PUBLIC LISTENERS
   * ─────────────────────────────────────────────────────
   */

  @Listen('dsCarouselItemSelect')
  listenToDsCarouselItemSelect(ev: CustomEvent<{ name: string }>) {
    stopEventBubbling(ev)
    this.activateItem(ev.detail.name)
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
    this.language = state.language
    this.region = state.region
  }

  /**
   * EVENT HANDLERS
   * ─────────────────────────────────────────────────────
   */

  private handleKeyDown = (ev: KeyboardEvent) => {
    const items = this.getItems()
    const currentIndex = items.findIndex(i => i.name === this.value)
    const isForward = ev.key === 'ArrowRight'
    const isBackward = ev.key === 'ArrowLeft'

    if (ev.key === 'Home') {
      ev.preventDefault()
      this.activateItem(items[0]?.name)
    } else if (ev.key === 'End') {
      ev.preventDefault()
      this.activateItem(items[items.length - 1]?.name)
    } else if (isForward) {
      ev.preventDefault()
      this.activateItem(items[(currentIndex + 1) % items.length]?.name)
    } else if (isBackward) {
      ev.preventDefault()
      this.activateItem(items[(currentIndex - 1 + items.length) % items.length]?.name)
    }
  }

  private handleSlotChange = () => {
    this.setup()
    this.initIntersection()
  }

  private scrollPrev = () => {
    const el = this.trackEl
    if (!el) return
    if (this.variant === 'slide') {
      el.scrollBy({ left: -(el.clientWidth * this.steps), behavior: 'smooth' })
      return
    }
    const items = this.getItems()
    const firstVisible = this.getFirstVisibleIndex(items, el)
    const target = items[Math.max(firstVisible - this.steps, 0)]
    if (!target) return
    const fadeWidth = this.getFadeWidthPx()
    const dx = target.getBoundingClientRect().left - el.getBoundingClientRect().left - fadeWidth
    el.scrollBy({ left: dx, behavior: 'smooth' })
  }

  private scrollNext = () => {
    const el = this.trackEl
    if (!el) return
    if (this.variant === 'slide') {
      el.scrollBy({ left: el.clientWidth * this.steps, behavior: 'smooth' })
      return
    }
    const items = this.getItems()
    const firstVisible = this.getFirstVisibleIndex(items, el)
    const target = items[Math.min(firstVisible + this.steps, items.length - 1)]
    if (!target) return
    const fadeWidth = this.getFadeWidthPx()
    const dx = target.getBoundingClientRect().left - el.getBoundingClientRect().left - fadeWidth
    el.scrollBy({ left: dx, behavior: 'smooth' })
  }

  private getFirstVisibleIndex(items: HTMLDsCarouselItemElement[], trackEl: HTMLElement): number {
    const trackLeft = trackEl.getBoundingClientRect().left
    for (let i = 0; i < items.length; i++) {
      if (items[i].getBoundingClientRect().left >= trackLeft - 2) return i
    }
    return 0
  }

  private getFadeWidthPx(): number {
    const outer = this.trackEl?.parentElement
    if (!outer) return 0
    return parseFloat(getComputedStyle(outer, '::before').width) || 0
  }

  private checkOverflow = () => {
    const el = this.trackEl
    if (!el) return
    this.canScrollLeft = el.scrollLeft > 0
    this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
  }

  private handlePointerDown = (ev: PointerEvent) => {
    const el = this.trackEl
    if (!el) return
    cancelAnimationFrame(this.momentumAnimId)
    this.dragging = true
    this.dragStartX = ev.clientX
    this.dragStartScrollLeft = el.scrollLeft
    this.velocityHistory = []
    // Disable CSS smooth-scroll during drag so track follows pointer exactly.
    // NOTE: setPointerCapture is intentionally deferred to the first pointermove.
    // Setting it here causes Chromium to retarget click away from interactive
    // children (carousel-items) when pointerdown and pointerup targets differ.
    el.style.scrollBehavior = 'auto'
    if (this.variant === 'slide') {
      // Suspend mandatory scroll-snap for the full drag + settle sequence. Set as an inline
      // style (not the .is-dragging CSS class) so it survives regardless of Stencil's render
      // timing — restoring snap while the post-release settle animation is still in flight
      // causes the browser to interrupt it mid-transit, leaving the track at a partial offset.
      clearTimeout(this.snapRestoreTimeout)
      el.removeEventListener('scrollend', this.restoreSnap)
      el.style.scrollSnapType = 'none'
    }
  }

  private restoreSnap = () => {
    if (this.trackEl) this.trackEl.style.scrollSnapType = ''
    clearTimeout(this.snapRestoreTimeout)
    this.trackEl?.removeEventListener('scrollend', this.restoreSnap)
  }

  private handlePointerMove = (ev: PointerEvent) => {
    if (!this.dragging || !this.trackEl) return
    const el = this.trackEl
    // Capture the pointer on first actual movement so dragging stays smooth
    // even when the pointer leaves the track — but only after a real drag starts.
    if (!el.hasPointerCapture(ev.pointerId)) {
      el.setPointerCapture(ev.pointerId)
    }
    const dx = ev.clientX - this.dragStartX
    el.scrollLeft = this.dragStartScrollLeft - dx
    this.velocityHistory.push({ x: ev.clientX, t: performance.now() })
    if (this.velocityHistory.length > 5) this.velocityHistory.shift()
  }

  private handlePointerUp = (ev: PointerEvent) => {
    if (!this.dragging || !this.trackEl) return
    const el = this.trackEl
    this.dragging = false
    el.style.scrollBehavior = ''
    el.releasePointerCapture(ev.pointerId)

    const velocity = this.calcVelocity()

    if (this.variant === 'slide') {
      const slideWidth = el.clientWidth
      const travelDx = this.dragStartScrollLeft - el.scrollLeft
      // Keep scroll-snap suspended until the settle animation actually finishes; a fallback
      // timeout covers browsers/cases where 'scrollend' never fires.
      clearTimeout(this.snapRestoreTimeout)
      this.snapRestoreTimeout = window.setTimeout(this.restoreSnap, 800)
      el.addEventListener('scrollend', this.restoreSnap, { once: true })
      // Commit next/prev if swipe is fast enough or covers > 25 % of slide width. The target is
      // computed from dragStartScrollLeft (the aligned position the drag began from), not the
      // current mid-drag scrollLeft — scrollNext/scrollPrev scroll by a relative clientWidth, which
      // would overshoot past the neighboring slide since the drag already moved partway there.
      if (velocity > 0.3 || travelDx < -(slideWidth * 0.25)) {
        el.scrollTo({ left: this.dragStartScrollLeft + slideWidth, behavior: 'smooth' })
      } else if (velocity < -0.3 || travelDx > slideWidth * 0.25) {
        el.scrollTo({ left: this.dragStartScrollLeft - slideWidth, behavior: 'smooth' })
      } else {
        el.scrollTo({ left: this.dragStartScrollLeft, behavior: 'smooth' })
      }
    } else {
      this.applyMomentum(velocity)
    }
  }

  // px/ms — positive means pointer moved left → content scrolled right
  private calcVelocity(): number {
    const h = this.velocityHistory
    if (h.length < 2) return 0
    const dt = h[h.length - 1].t - h[0].t
    return dt > 0 ? (h[0].x - h[h.length - 1].x) / dt : 0
  }

  private applyMomentum(velocity: number) {
    const el = this.trackEl
    if (!el) return
    // Convert px/ms to per-frame pixels at ~60 fps (16 ms/frame)
    let v = velocity * 16
    const friction = 0.94

    const step = () => {
      if (Math.abs(v) < 0.5) return
      el.scrollLeft += v
      v *= friction
      this.momentumAnimId = raf(step)
    }

    this.momentumAnimId = raf(step)
  }

  private handlePaginationChange = (ev: CustomEvent<number>) => {
    stopEventBubbling(ev)
    const items = this.getItems()
    const item = items[ev.detail - 1]
    if (item) this.activateItem(item.name)
  }

  /**
   * PRIVATE METHODS
   * ─────────────────────────────────────────────────────
   */

  private getItems(): HTMLDsCarouselItemElement[] {
    return directChildren<HTMLDsCarouselItemElement>(this.el, byTagName('DS-CAROUSEL-ITEM'))
  }

  private setup() {
    const items = this.getItems()
    this.itemCount = items.length

    // "1 tablet:2 desktop:3": bare token = base, `tablet:`/`desktop:` = from that breakpoint up
    const widths: Record<string, string | undefined> = { '': undefined, '-tablet': undefined, '-desktop': undefined }
    for (const token of String(this.itemsPerView).trim().split(/\s+/)) {
      const [, bp = '', n] = token.match(/^(?:(tablet|desktop):)?(\d+(?:\.\d+)?)$/) ?? []
      if (n) widths[bp && `-${bp}`] = n
    }

    items.forEach((item, i) => {
      item.index = i + 1
      item.carouselVariant = this.variant
      for (const [suffix, n] of Object.entries(widths)) {
        const name = `--carousel-item-width${suffix}`
        if (n) item.style.setProperty(name, `calc(100% / ${n})`)
        else item.style.removeProperty(name)
      }
    })

    if (!this.value && items.length) {
      this.setValue(items[0].name)
    }

    this.updateChildren()
  }

  private updateChildren() {
    const items = this.getItems()
    items.forEach(item => {
      item.carouselVariant = this.variant
      item.selected = item.name === this.value
    })
    this.activeIndex = items.findIndex(i => i.name === this.value)
  }

  private activateItem(name: string) {
    if (!name || name === this.value) return
    const items = this.getItems()
    this.setValue(name)
    // Update activeIndex synchronously alongside value so a re-render never observes
    // a stale activeIndex — ds-pagination is fed `value={activeIndex + 1}` and a lagging
    // activeIndex would briefly reset its disabled state, letting rapid clicks overshoot.
    this.activeIndex = items.findIndex(i => i.name === name)
    this.dsChange.emit({ value: name })
    this.scrollToActive()
  }

  private setValue(name: string) {
    this.isInternalValueChange = true
    this.value = name
    this.isInternalValueChange = false
  }

  private scrollToActive(behavior: ScrollBehavior = 'smooth') {
    const items = this.getItems()
    const active = items.find(i => i.name === this.value)
    if (!active) return

    if (this.variant === 'slide' && this.trackEl && behavior === 'smooth') {
      this.isProgrammaticScroll = true
      clearTimeout(this.programmaticScrollTimeout)
      // Fallback in case 'scrollend' doesn't fire (e.g. scroll is a no-op, or unsupported browser).
      this.programmaticScrollTimeout = window.setTimeout(this.handleScrollEnd, 800)
      this.trackEl.addEventListener('scrollend', this.handleScrollEnd, { once: true })
    }

    active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior })
  }

  private handleScrollEnd = () => {
    this.isProgrammaticScroll = false
    clearTimeout(this.programmaticScrollTimeout)
    this.trackEl?.removeEventListener('scrollend', this.handleScrollEnd)
  }

  private initScroll() {
    const el = this.trackEl
    if (!el || this.variant !== 'tile') return
    el.addEventListener('scroll', this.checkOverflow, { passive: true })
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.checkOverflow)
      // Fires once on observe(), which covers the initial overflow check.
      this.resizeObserver.observe(el)
    } else {
      requestAnimationFrame(this.checkOverflow)
    }
  }

  private initIntersection() {
    this.intersectionObserver?.disconnect()
    this.intersectionInitialized = false
    if (this.variant !== 'slide' || !this.trackEl) return
    if (typeof IntersectionObserver === 'undefined') return

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        // Skip the initial fire (triggered by observe()) so a preset value prop
        // is not overridden by whichever slide happens to be at scroll position 0.
        if (!this.intersectionInitialized) {
          this.intersectionInitialized = true
          return
        }
        // A programmatic scroll (triggered by pagination/keyboard nav) passes visually through
        // intermediate slides on its way to the target; ignore those transient crossings.
        if (this.isProgrammaticScroll) return
        const visible = entries.find(e => e.isIntersecting && e.intersectionRatio >= 0.5)
        if (!visible) return
        const items = this.getItems()
        const idx = items.findIndex(i => i === visible.target)
        if (idx !== -1) {
          const name = items[idx].name
          this.activeIndex = idx
          if (name !== this.value) {
            this.setValue(name)
            this.dsChange.emit({ value: name })
          }
        }
      },
      { root: this.trackEl, threshold: 0.5 },
    )

    this.getItems().forEach(item => this.intersectionObserver!.observe(item))
  }

  /**
   * RENDER
   * ─────────────────────────────────────────────────────
   */

  render() {
    const i18n = i18nDsCarousel[this.language]
    const isSlide = this.variant === 'slide'
    const showPagination = this.controls === 'dots'
    const showLargeArrows = this.controls === 'large'
    const showBelowArrows = this.controls === 'large-below'

    const prevBtn = (
      <button class="scroll-btn scroll-btn--prev" aria-label={i18n.scrollLeft} tabIndex={-1} onClick={this.scrollPrev}>
        <ds-icon name="caret-left" size="sm" />
      </button>
    )

    const nextBtn = (
      <button class="scroll-btn scroll-btn--next" aria-label={i18n.scrollRight} tabIndex={-1} onClick={this.scrollNext}>
        <ds-icon name="caret-right" size="sm" />
      </button>
    )

    const track = (
      <div
        class={{ 'carousel-track': true, 'is-dragging': this.dragging }}
        part="track"
        role="region"
        aria-label={this.label || i18n.scrollLeft}
        tabIndex={0}
        onKeyDown={this.handleKeyDown}
        onPointerDown={this.handlePointerDown}
        onPointerMove={this.handlePointerMove}
        onPointerUp={this.handlePointerUp}
        onPointerCancel={this.handlePointerUp}
        ref={el => {
          this.trackEl = el as HTMLElement
        }}
      >
        <slot onSlotchange={this.handleSlotChange} />
      </div>
    )

    const atStart = this.activeIndex === 0
    const atEnd = this.activeIndex === this.itemCount - 1

    // Slide: driven by activeIndex (updates via intersection observer). Tile: driven by
    // scroll position (activeIndex only tracks explicit selection, not continuous scroll).
    const belowPrevDisabled = isSlide ? atStart : !this.canScrollLeft
    const belowNextDisabled = isSlide ? atEnd : !this.canScrollRight

    const belowPrevBtn = (
      <button
        class={{ 'scroll-btn-below': true, 'scroll-btn-below--prev': true, 'is-disabled': belowPrevDisabled }}
        aria-label={i18n.scrollLeft}
        aria-disabled={belowPrevDisabled ? 'true' : undefined}
        onClick={belowPrevDisabled ? undefined : this.scrollPrev}
      >
        <ds-icon name="caret-left" size="sm" />
      </button>
    )

    const belowNextBtn = (
      <button
        class={{ 'scroll-btn-below': true, 'scroll-btn-below--next': true, 'is-disabled': belowNextDisabled }}
        aria-label={i18n.scrollRight}
        aria-disabled={belowNextDisabled ? 'true' : undefined}
        onClick={belowNextDisabled ? undefined : this.scrollNext}
      >
        <ds-icon name="caret-right" size="sm" />
      </button>
    )

    return (
      <Host
        class={{
          'is-slide': isSlide,
          'is-tile': !isSlide,
          'has-overflow': this.canScrollLeft || this.canScrollRight,
          'has-large-arrows': showLargeArrows,
          'can-scroll-left': this.canScrollLeft,
          'can-scroll-right': this.canScrollRight,
        }}
      >
        <div class="carousel-outer">
          {showLargeArrows && (isSlide ? !atStart && prevBtn : prevBtn)}
          {track}
          {showLargeArrows && (isSlide ? !atEnd && nextBtn : nextBtn)}
        </div>
        {showPagination && (
          <ds-pagination
            class="pagination"
            variant="dots"
            totalPages={this.itemCount}
            value={this.activeIndex + 1}
            textPrevious={i18n.scrollLeft}
            textNext={i18n.scrollRight}
            onDsChange={this.handlePaginationChange}
          />
        )}
        {showBelowArrows && (
          <div class="scroll-btn-below-group">
            {belowPrevBtn}
            {belowNextBtn}
          </div>
        )}
      </Host>
    )
  }
}
