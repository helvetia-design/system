import { describe, expect, it } from 'vitest'
import { CORE_TOKY_CONFIG, resolveTokyConfig } from '@helvetia-design/tokens/toky-config'
import { localBaseTokensPath, readLocalBaseTokensDocument } from './local'

describe('local token mode', () => {
  it('resolves the core token file inside this monorepo', () => {
    expect(localBaseTokensPath(CORE_TOKY_CONFIG)).toMatch(/packages\/tokens\/tokens\/Base\.tokens\.json$/)
  })

  it('refuses a token source other than core with a clear message', async () => {
    const extensions = resolveTokyConfig({ repo: { name: 'extensions' }, tokenFile: 'Extensions.tokens.json' })
    expect(() => localBaseTokensPath(extensions)).toThrow(/TOKY_LOCAL_TOKENS only works for the core token source/)
    await expect(readLocalBaseTokensDocument(extensions)).rejects.toThrow(/helvetia-design\/extensions/)
  })
})
