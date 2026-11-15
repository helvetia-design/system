import { dsBrowser } from './browser'

export class ScrollHandler {
  static disableSmoothScrolling() {
    this.setScrollBehavior('auto')
  }

  static enableSmoothScrolling() {
    this.setScrollBehavior('smooth')
  }

  private static setScrollBehavior(behavior: 'auto' | 'smooth') {
    if (dsBrowser.hasDocument) {
      const doc = document
      const body = document.body

      body.style.scrollBehavior = behavior

      const html = doc.firstChild?.nextSibling as HTMLElement
      const styles = getComputedStyle(html)

      if (styles.scrollBehavior === 'smooth') {
        html.style.scrollBehavior = behavior
      }
    }
  }

  // Shared across all instances so stacked overlays (drawer -> modal, etc.) lock/unlock once as a group.
  private static lockCount = 0
  private static x: number | undefined = undefined
  private static y: number | undefined = undefined

  private target: HTMLElement | Document | undefined
  private disabled = false

  connect(el?: HTMLElement) {
    if (el) {
      this.target = el
    } else {
      if (dsBrowser.hasDocument) {
        this.target = document
      }
    }
  }

  disconnect() {
    if (this.disabled) {
      this.enable()
    }
    this.target = undefined
  }

  isDisabled() {
    return this.disabled
  }

  enable() {
    if (this.disabled && this.target) {
      if (dsBrowser.hasWindow && dsBrowser.hasDocument) {
        this.disabled = false
        ScrollHandler.lockCount--
        if (ScrollHandler.lockCount > 0) return

        document.documentElement.style.overflow = ''
        document.body.classList.remove('noscroll')
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        if (ScrollHandler.x !== undefined && ScrollHandler.y !== undefined) {
          window.scrollTo(ScrollHandler.x, ScrollHandler.y)
          ScrollHandler.x = undefined
          ScrollHandler.y = undefined
        }
      }
    }
  }

  disable() {
    if (!this.disabled && this.target) {
      if (dsBrowser.hasWindow && dsBrowser.hasDocument) {
        if (ScrollHandler.lockCount === 0) {
          ScrollHandler.x = window.pageXOffset || document.documentElement.scrollLeft
          ScrollHandler.y = window.pageYOffset || document.documentElement.scrollTop

          document.documentElement.style.overflow = 'hidden'
          document.body.classList.add('noscroll')
          document.body.style.position = 'fixed'
          document.body.style.top = `-${ScrollHandler.y}px`
          document.body.style.width = `100%`
        }

        ScrollHandler.lockCount++
        this.disabled = true
      }
    }
  }
}
