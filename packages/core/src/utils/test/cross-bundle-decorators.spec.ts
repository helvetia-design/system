import { BUILD } from '@stencil/core/internal/app-data'
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, test, vi } from 'vitest'
import type * as Entry from '../../index'
import { Loggable, Logger, LogInstance } from '../log'
import { OneOf, Type } from '../property-decorators'

// Mirrors how Stencil 4.45 registerInstance exposes the host ref on a lazy instance of another bundle.
const createCrossBundleInstance = <T extends object>(Cls: new () => T, hostEl: HTMLElement) => {
  const instance = new Cls()
  Object.defineProperty(instance, '__stencil__getHostRef', {
    value: () => ({ $hostElement$: hostEl }),
  })
  return instance
}

let originalLazyLoad: boolean | undefined

beforeAll(() => {
  originalLazyLoad = BUILD.lazyLoad
  BUILD.lazyLoad = true
})

afterAll(() => {
  BUILD.lazyLoad = originalLazyLoad
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (window as any).DesignSystem
})

describe('package entry', () => {
  test('exports the utils extension components import', () => {
    expectTypeOf<typeof Entry.Logger>().toEqualTypeOf<typeof Logger>()
    expectTypeOf<typeof Entry.OneOf>().toEqualTypeOf<typeof OneOf>()
    expectTypeOf<typeof Entry.Type>().toEqualTypeOf<typeof Type>()
    expectTypeOf<Entry.LogInstance>().toEqualTypeOf<LogInstance>()
    expectTypeOf<Entry.Loggable>().toEqualTypeOf<Loggable>()
    expectTypeOf<Entry.DsComponentInterface>().toHaveProperty('el')
  })
})

describe('validators on an instance from another bundle', () => {
  class Extension {
    @OneOf(['a', 'b'])
    @Type('string')
    variant: unknown

    componentDidLoad?(): void
  }

  const load = (value: unknown) => {
    const host = document.createElement('ext-card')
    const instance = createCrossBundleInstance(Extension, host)
    instance.variant = value
    instance.componentDidLoad?.()
    return host
  }

  test('report an invalid value using the host read from __stencil__getHostRef', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const host = load('c')

    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0][0]).toContain('[ext-card] Property "variant" must be one of [a, b]')
    expect(error.mock.calls[0][1]).toBe(host)
  })

  test('report a wrong type', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const host = load(1)

    const typeError = error.mock.calls.find(c => String(c[0]).includes('must be of type "string"'))
    expect(typeError?.[0]).toContain('[ext-card] Property "variant"')
    expect(typeError?.[1]).toBe(host)
  })

  test('stay silent for a valid value', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    load('a')

    expect(error).not.toHaveBeenCalled()
  })
})

describe('Logger exported for extension components', () => {
  const enableLogger = () => {
    ;(window as any).DesignSystem = {
      config: { logger: { components: ['ext-card'], custom: true, lifecycle: false, render: false, event: false } },
    }
  }

  test('passes a working log function to createLogger', () => {
    enableLogger()
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const connectedCallback = vi.fn()

    class Extension {
      log?: LogInstance
      connectedCallback() {
        connectedCallback()
      }
      @Logger('ext-card')
      createLogger(log: LogInstance) {
        this.log = log
      }
      render() {
        return null
      }
    }

    const instance = new Extension()
    instance.connectedCallback()
    instance.log?.('hello')

    expect(connectedCallback).toHaveBeenCalledTimes(1)
    expect(consoleLog).toHaveBeenCalledWith(' ➡️ [ext-card] - hello')
  })

  test.each([
    ['Logger first', true],
    ['validators first', false],
  ])('keeps validators running when combined on one class (%s)', (_, loggerFirst) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    class LoggerFirst {
      log?: LogInstance
      @Logger('ext-card')
      createLogger(log: LogInstance) {
        this.log = log
      }
      @OneOf(['a', 'b'])
      variant: unknown
      componentDidLoad?(): void
      render() {
        return null
      }
    }

    class ValidatorsFirst {
      @OneOf(['a', 'b'])
      variant: unknown
      log?: LogInstance
      @Logger('ext-card')
      createLogger(log: LogInstance) {
        this.log = log
      }
      componentDidLoad?(): void
      render() {
        return null
      }
    }

    const host = document.createElement('ext-card')
    const instance = createCrossBundleInstance(loggerFirst ? LoggerFirst : ValidatorsFirst, host)
    instance.variant = 'c'
    instance.componentDidLoad?.()

    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0][1]).toBe(host)
  })
})
