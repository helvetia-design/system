import { afterEach, describe, expect, test, vi } from 'vitest'
import { Config, config } from './config'
import { defaultConfig } from './config.default'
import { DsConfigObserver } from './observable/observer'
import { setupDsConfig } from './initialize'
import { initializeDesignSystem } from '../initialize'

const win = window as any

afterEach(() => {
  delete win.DesignSystem
  config.reset({ ...defaultConfig })
})

describe('setupDsConfig', () => {
  test('uses the module singleton on the first call', () => {
    setupDsConfig({ brand: 'baloise' }, win)

    expect(win.DesignSystem.config).toBe(config)
  })

  test('keeps the first instance, applies the second userConfig and keeps omitted values', () => {
    setupDsConfig({ brand: 'baloise', language: 'fr' }, win)
    const first = win.DesignSystem.config
    setupDsConfig({ brand: 'helvetia' }, win)

    expect(win.DesignSystem.config).toBe(first)
    expect(first.brand).toBe('helvetia')
    expect(first.language).toBe('fr')
  })

  test('keeps a foreign Config instance and applies values to it', () => {
    const foreign = new Config()
    win.DesignSystem = { config: foreign }

    setupDsConfig({ brand: 'helvetia', language: 'it' }, win)

    expect(win.DesignSystem.config).toBe(foreign)
    expect(foreign.brand).toBe('helvetia')
    expect(foreign.language).toBe('it')
  })

  test('only relies on reset of a foreign instance', () => {
    const foreign = { reset: vi.fn() }
    win.DesignSystem = { config: foreign }

    setupDsConfig({ brand: 'helvetia' }, win)

    expect(win.DesignSystem.config).toBe(foreign)
    expect(foreign.reset).toHaveBeenCalledTimes(1)
    expect(foreign.reset.mock.calls[0][0].brand).toBe('helvetia')
  })

  test('replaces a plain config object with the module singleton', () => {
    win.DesignSystem = { config: { brand: 'helvetia' } }

    setupDsConfig({ language: 'fr' }, win)

    expect(win.DesignSystem.config).toBe(config)
    expect(config.language).toBe('fr')
  })

  test('notifies component observers of the first instance on the second call', () => {
    setupDsConfig({ brand: 'baloise' }, win)
    const observer: DsConfigObserver = { configChanged: vi.fn() }
    win.DesignSystem.config.attachComponent(observer)
    vi.mocked(observer.configChanged).mockClear()

    setupDsConfig({ brand: 'helvetia' }, win)

    expect(observer.configChanged).toHaveBeenCalledTimes(1)
    expect(vi.mocked(observer.configChanged).mock.calls[0][0].brand).toBe('helvetia')
    win.DesignSystem.config.detachComponent(observer)
  })
})

describe('initializeDesignSystem', () => {
  test('keeps the first config instance when called twice', () => {
    initializeDesignSystem({ brand: 'baloise' }, undefined, win)
    const first = win.DesignSystem.config
    initializeDesignSystem({ brand: 'helvetia' }, undefined, win)

    expect(win.DesignSystem.config).toBe(first)
    expect(first.brand).toBe('helvetia')
  })

  test('DesignSystem.initialize applies a plain config object assigned to window', () => {
    initializeDesignSystem({ brand: 'baloise' }, undefined, win)
    win.DesignSystem.config = { brand: 'helvetia', language: 'fr' }

    win.DesignSystem.initialize()

    expect(win.DesignSystem.config).toBe(config)
    expect(config.brand).toBe('helvetia')
    expect(config.language).toBe('fr')
  })
})
