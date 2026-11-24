import { EventEmitter } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import { dsBrowser } from './browser'
import type { DsConfig } from '@global'

declare const __zone_symbol__requestAnimationFrame: any
declare const requestAnimationFrame: any

// Reads the live config directly off `window` instead of importing `useDsConfig` from '@global',
// which would pull in a module cycle that isn't resolved yet when this file's exports are called
// eagerly at other modules' top level (e.g. breakpoints.subject.ts -> window-resize.listener.ts).
const getDsConfig = (): DsConfig | undefined => {
  const win = window as any
  return win && win.DesignSystem && win.DesignSystem.config
}

/**
 * Request Largest Contentful Paint (LCP) callback
 */
export const rLCP = (callback: () => void, timeout = 3000) => {
  let isLargestContentPatinDone = false
  if (!dsBrowser.isSafari && dsBrowser.hasWindow && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver(entryList => {
      const entries = entryList.getEntries()
      const lcpEntry = entries[entries.length - 1] // Get the last (largest) entry
      if (lcpEntry) {
        // Disconnect the observer as we only need the LCP
        observer.disconnect()

        // Load the script after LCP
        isLargestContentPatinDone = true
        rIC(() => callback())
      }
    })

    // Start observing for Largest Contentful Paint (LCP) entries
    observer.observe({ type: 'largest-contentful-paint', buffered: true })

    setTimeout(() => {
      if (!isLargestContentPatinDone) {
        observer.disconnect()
        callback()
      }
    }, timeout)
  } else {
    setTimeout(callback, 32)
  }
}

export const rOnLoad = (callback: () => void, timeout = 32) => {
  let called = false

  const callOnce = () => {
    if (!called) {
      called = true
      callback()
    }
  }

  if (dsBrowser.hasWindow) {
    const timer = setTimeout(callOnce, timeout)
    window.addEventListener('load', () => {
      clearTimeout(timer)
      callOnce()
    })
  } else {
    setTimeout(callOnce, 32)
  }
}

export const rIC = (callback: () => void, timeout = 5000) => {
  if (dsBrowser.hasWindow && 'requestIdleCallback' in window) {
    ;(window as any).requestIdleCallback(callback, { timeout })
  } else {
    setTimeout(callback, 32)
  }
}

export const wait = (ms = 0): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms)
  })
}

export const debounceEvent = (ev: EventEmitter, wait: number): EventEmitter => {
  const original = (ev as any)._original || ev
  return {
    _original: original,
    emit: debounce(original.emit.bind(original), wait),
  } as EventEmitter
}

export const debounce = (func: (...args: any[]) => void, wait = 0) => {
  let timer: any
  return (...args: any[]): any => {
    clearTimeout(timer)
    timer = setTimeout(func, wait, ...args)
  }
}

export const hasTagName = (element: any, tag: string) => {
  return element && element.tagName && element.tagName === tag.toUpperCase()
}

export const isDescendant = (
  parent: HTMLElement | HTMLStencilElement | undefined,
  child: HTMLElement | HTMLStencilElement | EventTarget | undefined | null,
) => {
  let node = (child as any).parentNode
  while (node != null) {
    if (node == parent) {
      return true
    }
    node = node.parentNode
  }
  return false
}

const ROOT_SELECTORS = ['ds-root', 'ds-app'] as const

export const getRootElement = (doc: Document) => {
  for (const selector of ROOT_SELECTORS) {
    const el = doc.querySelector(selector)
    if (el) {
      return el
    }
  }
  return doc.body
}

/**
 * @deprecated Use `getRootElement()` instead. `ds-app` is a compatibility alias of `ds-root`.
 */
export const getAppRoot = (doc: Document) => getRootElement(doc)

/**
 * Waits for a component to be ready for
 * both custom element and non-custom element builds.
 * If non-custom element build, el.componentOnReady
 * will be used.
 * For custom element builds, we wait a frame
 * so that the inner contents of the component
 * have a chance to render.
 *
 * Use this utility rather than calling
 * el.componentOnReady yourself.
 */
export const componentOnReady = (el: any, callback: any) => {
  if (el.componentOnReady !== null && el.componentOnReady !== undefined) {
    el.componentOnReady().then((resolvedEl: any) => callback(resolvedEl))
  } else {
    raf(() => callback(el))
  }
}

/**
 * Patched version of requestAnimationFrame that avoids ngzone
 * Use only when you know ngzone should not run
 */
export const raf = (h: any) => {
  if (typeof __zone_symbol__requestAnimationFrame === 'function') {
    return __zone_symbol__requestAnimationFrame(h)
  }
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(h)
  }
  return setTimeout(h)
}

export const addEventListener = (el: any, eventName: string, callback: any, opts?: any) => {
  if (dsBrowser.hasWindow) {
    const config = getDsConfig()
    if (config && config._ael) {
      return config._ael(el, eventName, callback, opts)
    }
  }

  return el.addEventListener(eventName, callback, opts)
}

export const removeEventListener = (el: any, eventName: string, callback: any, opts?: any) => {
  if (dsBrowser.hasWindow) {
    const config = getDsConfig()
    if (config && config._rel) {
      return config._rel(el, eventName, callback, opts)
    }
  }

  return el.removeEventListener(eventName, callback, opts)
}

export const shallowReady = (el: any | undefined): Promise<any> => {
  if (el) {
    return new Promise(resolve => componentOnReady(el, resolve))
  }
  return Promise.resolve()
}

export const deepReady = async (el: any | undefined, full = false): Promise<void> => {
  const element = el as any
  if (element) {
    if (element.componentOnReady !== null && element.componentOnReady !== undefined) {
      const stencilEl = await element.componentOnReady()
      if (!full && stencilEl !== null && stencilEl !== undefined) {
        return
      }
    }
    await Promise.all(Array.from(element.children).map(child => deepReady(child, full)))
  }
}

export const waitForComponent = async (el: HTMLElement | HTMLStencilElement | null) => {
  await deepReady(el, true)
  await waitAfterFramePaint()
  await waitAfterIdleCallback()
}

export const waitForDesignSystem = async (el: any | null, _config?: DsConfig): Promise<void> => {
  const config: any = {
    animated: false,
    ..._config,
  }
  const element = el as any
  if (element !== null && element !== undefined) {
    await deepReady(element, true)

    const webComponents = Array.prototype.slice
      .call(element.querySelectorAll('*'))
      .filter(el => el.tagName.match(/^ds-/i))

    await Promise.all(
      webComponents.map(c => {
        if (c.configChanged !== null && c.configChanged !== undefined) {
          return c.configChanged(config)
        }
      }),
    )
  }

  await Promise.all([waitAfterFramePaint(), waitAfterLargestContentfulPaintCallback(), waitAfterIdleCallback()])
}

export const waitAfterFramePaint = () => {
  return new Promise(resolve => raf(() => runHighPrioritizedTask(resolve)))
}

export const waitAfterIdleCallback = () => {
  return new Promise(resolve => rIC(() => runHighPrioritizedTask(resolve)))
}

export const waitAfterLargestContentfulPaintCallback = () => {
  return new Promise(resolve => rLCP(() => runHighPrioritizedTask(resolve)))
}

export const waitOnLoadEventCallback = () => {
  return new Promise(resolve => rOnLoad(() => runHighPrioritizedTask(resolve)))
}

export const runHighPrioritizedTask = (callback: (value: unknown) => void) => {
  if (dsBrowser.hasWindow && 'MessageChannel' in window) {
    const messageChannel = new (window as any).MessageChannel()
    messageChannel.port1.onmessage = callback
    messageChannel.port2.postMessage(undefined)
  } else {
    setTimeout(callback, 32)
  }
}
