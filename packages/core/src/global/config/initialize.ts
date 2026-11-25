import { dsBrowser } from '@utils'
import { Config, config, configFromLocalStorage } from './config'
import { configFromMetaTag } from './config.meta'

import { DsConfig } from './config.types'

export const setupDsConfig = (userConfig: DsConfig = {}, win = {} as any) => {
  if (Object.keys(win).length === 0 && dsBrowser.hasWindow) {
    win = window as any
  }

  win.DesignSystem = win.DesignSystem || {}

  const existing = win.DesignSystem.config
  const target: Config = typeof existing?.reset === 'function' ? existing : config

  target.reset({
    ...configFromMetaTag(win),
    ...configFromLocalStorage(win),
    ...userConfig,
    icons: {
      ...userConfig.icons,
    },
  })

  win.DesignSystem.config = target
}

export default setupDsConfig
