import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildTokenIndex, resolveAliasTarget } from '../lib/alias.mjs'
import { buildBootstrapPayload, resolveBootstrapIds } from '../lib/bootstrap.mjs'
import { resolveReferenceTokensFile, resolveSyncInputs } from '../lib/config.mjs'
import { findCollectionAndModes, findCollectionIdsByName } from '../lib/figma.mjs'
import { flattenTokens, listBrandNames } from '../lib/tokens.mjs'
import {
  assignVariableIds,
  buildAliasPassPayload,
  buildCreatePassPayload,
  buildDescriptionUpdatePayload,
  buildNameUpdatePayload,
  collectNewlyCreatedIds,
  committedVariableIds,
  findForeignCollectionVariableIds,
  resolveTempIds,
} from '../lib/write.mjs'

const systemRoot = resolve(__dirname, '../../..')

const EXTENSION_OVERRIDES = {
  repo: { name: 'extensions' },
  tokenFile: 'Extensions.tokens.json',
  brandsIndexPath: null,
  figmaCollection: 'Extension Tokens',
  figmaResponsiveCollection: null,
  figmaModes: ['Default'],
  editableLayers: ['🧩 Component'],
  referenceTokens: { package: '@helvetia-design/tokens', file: 'tokens/Base.tokens.json' },
}

const color = (hex: string) => ({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 1, hex })

const REFERENCE_TREE = {
  '🔗 Alias': {
    Color: {
      Primary: {
        $type: 'color',
        $value: color('#005EFF'),
        $extensions: { 'com.figma.variableId': 'VariableID:core:1' },
      },
      Unsynced: { $type: 'color', $value: color('#000000') },
    },
  },
  '🧩 Component': {
    Shared: {
      Padding: {
        $type: 'dimension',
        $value: { value: 8, unit: 'px' },
        $extensions: { 'com.figma.variableId': 'VariableID:core:2' },
      },
    },
  },
}

function writeExtensionRepo(overrides: object = EXTENSION_OVERRIDES) {
  const root = mkdtempSync(join(tmpdir(), 'figma-sync-extension-'))
  mkdirSync(join(root, 'packages/tokens/tokens'), { recursive: true })
  writeFileSync(join(root, 'packages/tokens/package.json'), JSON.stringify({ name: 'ds-ext-tokens' }))
  writeFileSync(join(root, 'packages/tokens/toky.config.json'), JSON.stringify(overrides))
  writeFileSync(join(root, 'packages/tokens/tokens/Extensions.tokens.json'), '{}')

  const corePackage = join(root, 'packages/tokens/node_modules/@helvetia-design/tokens')
  mkdirSync(join(corePackage, 'tokens'), { recursive: true })
  writeFileSync(join(corePackage, 'package.json'), JSON.stringify({ name: '@helvetia-design/tokens' }))
  writeFileSync(join(corePackage, 'tokens/Base.tokens.json'), JSON.stringify(REFERENCE_TREE))
  return root
}

function extensionEnv(root: string, extra: Record<string, string> = {}) {
  return { TOKY_CONFIG_PATH: join(root, 'packages/tokens/toky.config.json'), TOKENS_ROOT: root, ...extra }
}

describe('resolveSyncInputs', () => {
  it('resolves the core source without TOKY_CONFIG_PATH, at the paths the scripts used before', () => {
    const inputs = resolveSyncInputs({})

    expect(inputs.tokensDir).toBe(join(systemRoot, 'packages/tokens/tokens'))
    expect(inputs.tokenFilePath).toBe(join(systemRoot, 'packages/tokens/tokens/Base.tokens.json'))
    expect(inputs.syncStateFile).toBe(join(systemRoot, 'packages/tokens/.figma-sync-state.json'))
    expect(inputs.repoTokenFilePath).toBe('packages/tokens/tokens/Base.tokens.json')
    expect(inputs.repoSyncStatePath).toBe('packages/tokens/.figma-sync-state.json')
    expect(inputs.hasBrands).toBe(true)
    expect(inputs.collectionName).toBe('Design Tokens')
    expect(inputs.responsiveCollectionName).toBe('Design Responsive Tokens')
    expect(inputs.modeNames).toEqual(['Base'])
    expect(resolveReferenceTokensFile(inputs, {})).toBeNull()
  })

  it('keeps TOKENS_DIR_OVERRIDE and the collection-name env overrides working', () => {
    const inputs = resolveSyncInputs({
      TOKENS_DIR_OVERRIDE: '/tmp/scratch/tokens',
      FIGMA_COLLECTION_NAME: 'Sandbox',
      FIGMA_RESPONSIVE_COLLECTION_NAME: 'Sandbox Responsive',
    })

    expect(inputs.tokenFilePath).toBe('/tmp/scratch/tokens/Base.tokens.json')
    expect(inputs.syncStateFile).toBe('/tmp/scratch/.figma-sync-state.json')
    expect(inputs.collectionName).toBe('Sandbox')
    expect(inputs.responsiveCollectionName).toBe('Sandbox Responsive')
  })

  it('reads an extension source from TOKY_CONFIG_PATH, relative to TOKENS_ROOT', () => {
    const root = writeExtensionRepo()
    const inputs = resolveSyncInputs(extensionEnv(root))

    expect(inputs.tokenFilePath).toBe(join(root, 'packages/tokens/tokens/Extensions.tokens.json'))
    expect(inputs.syncStateFile).toBe(join(root, 'packages/tokens/.figma-sync-state.json'))
    expect(inputs.repoTokenFilePath).toBe('packages/tokens/tokens/Extensions.tokens.json')
    expect(inputs.repoSyncStatePath).toBe('packages/tokens/.figma-sync-state.json')
    expect(inputs.hasBrands).toBe(false)
    expect(inputs.collectionName).toBe('Extension Tokens')
    expect(inputs.responsiveCollectionName).toBeNull()
    expect(inputs.modeNames).toEqual(['Default'])
  })

  it('keeps the responsive collection null even when FIGMA_RESPONSIVE_COLLECTION_NAME is set', () => {
    const root = writeExtensionRepo()
    const inputs = resolveSyncInputs(extensionEnv(root, { FIGMA_RESPONSIVE_COLLECTION_NAME: 'Sandbox' }))
    expect(inputs.responsiveCollectionName).toBeNull()
  })

  it('rejects an invalid toky.config.json', () => {
    const root = writeExtensionRepo({ figmaModes: [] })
    expect(() => resolveSyncInputs(extensionEnv(root))).toThrow(/Invalid Toky config/)
  })
})

describe('resolveReferenceTokensFile', () => {
  it("finds the reference package in the token package's node_modules", () => {
    const root = writeExtensionRepo()
    const inputs = resolveSyncInputs(extensionEnv(root))

    expect(resolveReferenceTokensFile(inputs, {})).toBe(
      join(root, 'packages/tokens/node_modules/@helvetia-design/tokens/tokens/Base.tokens.json'),
    )
  })

  it('prefers REFERENCE_TOKENS_FILE', () => {
    const root = writeExtensionRepo()
    const inputs = resolveSyncInputs(extensionEnv(root))

    expect(resolveReferenceTokensFile(inputs, { REFERENCE_TOKENS_FILE: '/tmp/core/Base.tokens.json' })).toBe(
      '/tmp/core/Base.tokens.json',
    )
  })

  it('fails when the reference package is not installed', () => {
    const root = writeExtensionRepo({
      ...EXTENSION_OVERRIDES,
      referenceTokens: { package: 'missing-pkg', file: 'x.json' },
    })
    const inputs = resolveSyncInputs(extensionEnv(root))

    expect(() => resolveReferenceTokensFile(inputs, {})).toThrow(/missing-pkg is not installed/)
  })

  it('fails when the reference file does not exist in the package', () => {
    const root = writeExtensionRepo({
      ...EXTENSION_OVERRIDES,
      referenceTokens: { package: '@helvetia-design/tokens', file: 'tokens/Missing.tokens.json' },
    })
    const inputs = resolveSyncInputs(extensionEnv(root))

    expect(() => resolveReferenceTokensFile(inputs, {})).toThrow(/does not exist/)
  })
})

describe('brandless source', () => {
  it('lists brands relative to the configured token file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'figma-sync-brands-'))
    writeFileSync(join(dir, 'Extensions.tokens.json'), '{}')
    writeFileSync(join(dir, 'Base.tokens.json'), '{}')

    expect(listBrandNames(dir, 'Extensions.tokens.json')).toEqual(['Base'])
  })

  it('bootstraps the collection with a single Default mode', () => {
    const bootstrap = buildBootstrapPayload([], 'Extension Tokens', ['Default'])

    expect(bootstrap.variableCollections).toEqual([
      {
        action: 'CREATE',
        id: 'temp-collection-bootstrap',
        name: 'Extension Tokens',
        initialModeId: 'temp-mode-Default',
      },
    ])
    expect(bootstrap.variableModes).toEqual([
      {
        action: 'UPDATE',
        id: 'temp-mode-Default',
        name: 'Default',
        variableCollectionId: 'temp-collection-bootstrap',
      },
    ])
    expect(
      resolveBootstrapIds(bootstrap, { 'temp-collection-bootstrap': 'C:ext', 'temp-mode-Default': 'm-default' }),
    ).toEqual({ collectionId: 'C:ext', modeIdByBrand: { Default: 'm-default' } })
  })

  it('resolves the collection by name and its Default mode, ignoring the core collection', () => {
    const meta = {
      variables: {},
      variableCollections: {
        core: {
          id: 'C:core',
          name: 'Design Tokens',
          modes: [{ modeId: 'm-base', name: 'Base' }],
          defaultModeId: 'm-base',
        },
        ext: {
          id: 'C:ext',
          name: 'Extension Tokens',
          modes: [{ modeId: 'm-default', name: 'Default' }],
          defaultModeId: 'm-default',
        },
      },
    }

    expect(findCollectionAndModes(meta, [], 'Extension Tokens', ['Default'])).toEqual({
      collectionId: 'C:ext',
      modeIdByBrand: { Default: 'm-default' },
    })
    expect(() => findCollectionAndModes(meta, [], 'Extension Tokens', ['Base'])).toThrow(/No Figma mode named "Base"/)
  })
})

describe('reference resolution', () => {
  const referenceTokens = flattenTokens(REFERENCE_TREE)

  it('resolves a path in the own tree first', () => {
    const ownTokens = flattenTokens({
      '🧩 Component': {
        Shared: { Padding: { $type: 'dimension', $value: { value: 4, unit: 'px' } } },
        Card: { Padding: { $type: 'dimension', $value: '{🧩 Component.Shared.Padding}' } },
      },
    })
    const index = buildTokenIndex(ownTokens, referenceTokens)
    const target = resolveAliasTarget(ownTokens[1], index)

    expect(target.value).toEqual({ kind: 'literal', value: { value: 4, unit: 'px' } })
    expect(target.isReference).toBeUndefined()
  })

  it('falls back to the reference tree', () => {
    const ownTokens = flattenTokens({
      '🧩 Component': { Card: { Color: { $type: 'color', $value: '{🔗 Alias.Color.Primary}' } } },
    })
    const target = resolveAliasTarget(ownTokens[0], buildTokenIndex(ownTokens, referenceTokens))

    expect(target.isReference).toBe(true)
    expect(target.variableId).toBe('VariableID:core:1')
  })

  it('fails when a reference resolves in neither tree', () => {
    const ownTokens = flattenTokens({
      '🧩 Component': { Card: { Color: { $type: 'color', $value: '{🔗 Alias.Color.Missing}' } } },
    })

    expect(() => resolveAliasTarget(ownTokens[0], buildTokenIndex(ownTokens, referenceTokens))).toThrow(
      /references 🔗 Alias\.Color\.Missing, which does not exist/,
    )
  })
})

describe('write payloads for an extension source', () => {
  const referenceTokens = flattenTokens(REFERENCE_TREE)
  const referenceIds = new Set(committedVariableIds(referenceTokens))

  function syncExtension(tree: object) {
    const baseTokens = flattenTokens(tree)
    const brandTokensByName = { Default: baseTokens }
    const modeIdByBrand = { Default: 'm-default' }
    const idByPath = assignVariableIds(baseTokens)
    const createPass = buildCreatePassPayload({
      baseTokens,
      brandTokensByName,
      idByPath,
      collectionId: 'C:ext',
      modeIdByBrand,
      referenceTokens,
    })
    const tempIdToRealId = Object.fromEntries(
      createPass.variables.map((variable, i) => [variable.id, `VariableID:ext:${i + 1}`]),
    )
    resolveTempIds(idByPath, tempIdToRealId)
    const aliasPass = buildAliasPassPayload({ baseTokens, brandTokensByName, idByPath, modeIdByBrand, referenceTokens })
    const remoteVariablesById = { 'VariableID:ext:existing': { name: 'Old/Name', description: 'old' } }
    return {
      baseTokens,
      idByPath,
      createPass,
      aliasPass,
      descriptionPass: buildDescriptionUpdatePayload({ baseTokens, idByPath, remoteVariablesById }),
      namePass: buildNameUpdatePayload({ baseTokens, idByPath, remoteVariablesById }),
    }
  }

  const EXTENSION_TREE = {
    '🧩 Component': {
      PolicyCard: {
        Padding: { $type: 'dimension', $value: '{🧩 Component.Shared.Padding}' },
        Border: { $type: 'color', $value: '{🔗 Alias.Color.Primary}' },
        Radius: {
          $type: 'dimension',
          $value: { value: 4, unit: 'px' },
          $description: 'renamed',
          $extensions: { 'com.figma.variableId': 'VariableID:ext:existing' },
        },
      },
      ClaraChat: { MaxHeight: { $type: 'dimension', $value: { value: 384, unit: 'px' } } },
    },
  }

  it('aliases a reference token by its variableId from the reference file', () => {
    const { aliasPass } = syncExtension(EXTENSION_TREE)

    expect(aliasPass.variableModeValues).toEqual([
      {
        variableId: 'VariableID:ext:1',
        modeId: 'm-default',
        value: { type: 'VARIABLE_ALIAS', id: 'VariableID:core:2' },
      },
      {
        variableId: 'VariableID:ext:2',
        modeId: 'm-default',
        value: { type: 'VARIABLE_ALIAS', id: 'VariableID:core:1' },
      },
    ])
  })

  it('never creates, updates, deletes, or writes a value to a reference variable', () => {
    const { createPass, aliasPass, descriptionPass, namePass, baseTokens, idByPath } = syncExtension(EXTENSION_TREE)

    const writtenIds = [
      ...createPass.variables.map(v => v.id),
      ...createPass.variableModeValues.map(v => v.variableId),
      ...aliasPass.variableModeValues.map(v => v.variableId),
      ...descriptionPass.variables.map(v => v.id),
      ...namePass.variables.map(v => v.id),
      ...collectNewlyCreatedIds(baseTokens, idByPath).map(entry => entry.variableId),
    ]
    expect(writtenIds.length).toBeGreaterThan(0)
    expect(writtenIds.filter(id => referenceIds.has(id))).toEqual([])
    expect(createPass.variables.every(v => v.action !== 'CREATE' || v.variableCollectionId === 'C:ext')).toBe(true)
    expect(committedVariableIds(baseTokens).filter(id => referenceIds.has(id))).toEqual([])
  })

  it('creates own variables only in the extension collection', () => {
    const { createPass } = syncExtension(EXTENSION_TREE)

    expect(createPass.variables.map(v => [v.name, v.variableCollectionId])).toEqual([
      ['🧩 Component/PolicyCard/Padding', 'C:ext'],
      ['🧩 Component/PolicyCard/Border', 'C:ext'],
      ['🧩 Component/ClaraChat/MaxHeight', 'C:ext'],
    ])
  })

  it('fails when a referenced reference token has no variableId', () => {
    expect(() =>
      syncExtension({
        '🧩 Component': { Card: { Color: { $type: 'color', $value: '{🔗 Alias.Color.Unsynced}' } } },
      }),
    ).toThrow(/Reference token 🔗 Alias\.Color\.Unsynced has no com\.figma\.variableId/)
  })

  it('fails when a reference resolves nowhere', () => {
    expect(() =>
      syncExtension({
        '🧩 Component': { Card: { Color: { $type: 'color', $value: '{🔗 Alias.Color.Missing}' } } },
      }),
    ).toThrow(/does not exist/)
  })
})

describe('findForeignCollectionVariableIds', () => {
  const meta = {
    variableCollections: {
      core: { id: 'C:core', name: 'Design Tokens', modes: [], defaultModeId: '' },
      ext: { id: 'C:ext', name: 'Extension Tokens', modes: [], defaultModeId: '' },
    },
    variables: {
      'VariableID:core:1': { id: 'VariableID:core:1', variableCollectionId: 'C:core', resolvedType: 'COLOR' },
      'VariableID:ext:1': { id: 'VariableID:ext:1', variableCollectionId: 'C:ext', resolvedType: 'FLOAT' },
    },
  }

  it("flags a copied core variableId whose type changed, so pass 0 never deletes core's variable", () => {
    const baseTokens = flattenTokens({
      '🧩 Component': {
        Card: {
          Gap: {
            $type: 'dimension',
            $value: { value: 4, unit: 'px' },
            $extensions: { 'com.figma.variableId': 'VariableID:core:1' },
          },
          Padding: {
            $type: 'dimension',
            $value: { value: 8, unit: 'px' },
            $extensions: { 'com.figma.variableId': 'VariableID:ext:1' },
          },
        },
      },
    })
    const ownCollectionIds = findCollectionIdsByName(meta, ['Extension Tokens', null])

    expect([...ownCollectionIds]).toEqual(['C:ext'])
    expect(findForeignCollectionVariableIds(baseTokens, meta.variables, ownCollectionIds)).toEqual([
      'VariableID:core:1',
    ])
  })

  it('accepts ids in the source collection and its responsive collection', () => {
    const baseTokens = flattenTokens({
      A: { $type: 'color', $value: color('#000000'), $extensions: { 'com.figma.variableId': 'VariableID:core:1' } },
    })
    const ownCollectionIds = findCollectionIdsByName(meta, ['Design Tokens', 'Design Responsive Tokens'])

    expect(findForeignCollectionVariableIds(baseTokens, meta.variables, ownCollectionIds)).toEqual([])
  })
})

describe('conflict-check.mjs for a source that was never synced', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    process.exitCode = undefined
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function runConflictCheck(root: string, collections: Record<string, unknown>) {
    vi.resetModules()
    Object.assign(process.env, extensionEnv(root), { FIGMA_API_TOKEN: 'figma-token', FIGMA_FILE_KEY: 'file-key' })
    delete process.env.PR_NUMBER
    delete process.env.GITHUB_TOKEN
    delete process.env.TOKENS_DIR_OVERRIDE
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ meta: { variables: {}, variableCollections: collections } })),
    )
    vi.stubGlobal('fetch', fetchMock)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await import('../conflict-check.mjs')
    await new Promise(resolve => setTimeout(resolve, 0))

    return { fetchMock, output: log.mock.calls.flat().join('\n'), error }
  }

  it('reports no conflicts without a baseline, without asking Figma', async () => {
    const root = writeExtensionRepo()
    const { fetchMock, output, error } = await runConflictCheck(root, {})

    expect(error).not.toHaveBeenCalled()
    expect(process.exitCode).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(output).toContain('No conflicts detected')
  })

  it('reports no conflicts when the source collection does not exist yet', async () => {
    const root = writeExtensionRepo()
    writeFileSync(
      join(root, 'packages/tokens/.figma-sync-state.json'),
      JSON.stringify({ lastSyncedCommit: 'sha', lastSyncedAt: '2026-01-01T00:00:00Z', entries: {} }),
    )
    const { fetchMock, output, error } = await runConflictCheck(root, {
      core: {
        id: 'C:core',
        name: 'Design Tokens',
        modes: [{ modeId: 'm-base', name: 'Base' }],
        defaultModeId: 'm-base',
      },
    })

    expect(error).not.toHaveBeenCalled()
    expect(process.exitCode).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(output).toContain('No conflicts detected')
  })
})
