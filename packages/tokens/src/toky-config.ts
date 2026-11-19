export const TOKEN_LAYER_KEYS = ['🌐 Global', '🔗 Alias', '📱 Device', '🧩 Component'] as const

export type TokenLayerKey = (typeof TOKEN_LAYER_KEYS)[number]

/** Instance-specific settings of a Toky deployment and of the Figma sync for one token source. */
export interface TokyConfig {
  repo: { owner: string; name: string; ref: string }
  tokensDir: string
  tokenFile: string
  syncStatePath: string
  /** `null` for a source without brands; brand discovery is then skipped. */
  brandsIndexPath: string | null
  figmaCollection: string
  /** `null` for a source without responsive tokens. */
  figmaResponsiveCollection: string | null
  /** Modes of `figmaCollection` besides the brand modes discovered from `tokensDir`. */
  figmaModes: string[]
  editableLayers: TokenLayerKey[]
  /** Tokens that may be referenced but are never created, updated, or deleted. */
  referenceTokens: { package: string; file: string } | null
  team: string
  previewUrl: string
}

export type TokyConfigOverrides = Partial<Omit<TokyConfig, 'repo'>> & { repo?: Partial<TokyConfig['repo']> }

export const CORE_TOKY_CONFIG: TokyConfig = {
  repo: { owner: 'helvetia-design', name: 'system', ref: 'main' },
  tokensDir: 'packages/tokens/tokens',
  tokenFile: 'Base.tokens.json',
  syncStatePath: 'packages/tokens/.figma-sync-state.json',
  brandsIndexPath: 'packages/tokens/src/index.ts',
  figmaCollection: 'Design Tokens',
  figmaResponsiveCollection: 'Design Responsive Tokens',
  figmaModes: ['Base'],
  editableLayers: [...TOKEN_LAYER_KEYS],
  referenceTokens: null,
  team: 'toky',
  previewUrl: 'http://localhost:4000/playground.html',
}

const nonEmptyString = { type: 'string', minLength: 1 } as const
const nullableString = { type: ['string', 'null'], minLength: 1 } as const

/** JSON schema of a `toky.config.json` override file, for editor support. `resolveTokyConfig` is the enforcing check. */
export const TOKY_CONFIG_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  additionalProperties: false,
  properties: {
    $schema: { type: 'string' },
    repo: {
      type: 'object',
      additionalProperties: false,
      properties: { owner: nonEmptyString, name: nonEmptyString, ref: nonEmptyString },
    },
    tokensDir: nonEmptyString,
    tokenFile: { type: 'string', pattern: '^[^/]+\\.tokens\\.json$' },
    syncStatePath: nonEmptyString,
    brandsIndexPath: nullableString,
    figmaCollection: nonEmptyString,
    figmaResponsiveCollection: nullableString,
    figmaModes: { type: 'array', minItems: 1, items: nonEmptyString, uniqueItems: true },
    editableLayers: { type: 'array', items: { enum: [...TOKEN_LAYER_KEYS] }, uniqueItems: true },
    referenceTokens: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: ['package', 'file'],
      properties: { package: nonEmptyString, file: nonEmptyString },
    },
    team: nonEmptyString,
    previewUrl: { type: 'string', format: 'uri' },
  },
} as const

export class TokyConfigError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid Toky config:\n${issues.map(issue => `  - ${issue}`).join('\n')}`)
    this.name = 'TokyConfigError'
  }
}

type Issues = string[]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function checkKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, issues: Issues) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push(`${path}${key}: unknown property`)
  }
}

function checkString(value: unknown, path: string, issues: Issues, nullable = false) {
  if (nullable && value === null) return
  if (typeof value !== 'string' || value.length === 0) {
    issues.push(`${path}: expected a non-empty string${nullable ? ' or null' : ''}`)
  }
}

function checkStringList(value: unknown, path: string, issues: Issues, allowed?: readonly string[]) {
  if (!Array.isArray(value)) {
    issues.push(`${path}: expected an array`)
    return
  }
  value.forEach((item, index) => {
    if (allowed ? !allowed.includes(item) : typeof item !== 'string' || item.length === 0) {
      issues.push(
        `${path}[${index}]: ${allowed ? `expected one of ${allowed.join(', ')}` : 'expected a non-empty string'}`,
      )
    }
  })
  if (new Set(value).size !== value.length) issues.push(`${path}: contains duplicates`)
}

function validateOverrides(overrides: unknown): Issues {
  const issues: Issues = []
  if (!isRecord(overrides)) return ['expected an object']
  checkKeys(overrides, Object.keys(TOKY_CONFIG_SCHEMA.properties), '', issues)

  const { repo, referenceTokens } = overrides
  if (repo !== undefined) {
    if (isRecord(repo)) {
      checkKeys(repo, ['owner', 'name', 'ref'], 'repo.', issues)
      for (const key of ['owner', 'name', 'ref'] as const) {
        if (repo[key] !== undefined) checkString(repo[key], `repo.${key}`, issues)
      }
    } else {
      issues.push('repo: expected an object')
    }
  }
  for (const key of ['tokensDir', 'syncStatePath', 'figmaCollection', 'team'] as const) {
    if (overrides[key] !== undefined) checkString(overrides[key], key, issues)
  }
  for (const key of ['brandsIndexPath', 'figmaResponsiveCollection'] as const) {
    if (overrides[key] !== undefined) checkString(overrides[key], key, issues, true)
  }
  if (overrides.tokenFile !== undefined) {
    const pattern = new RegExp(TOKY_CONFIG_SCHEMA.properties.tokenFile.pattern)
    if (typeof overrides.tokenFile !== 'string' || !pattern.test(overrides.tokenFile)) {
      issues.push('tokenFile: expected a file name ending in .tokens.json')
    }
  }
  if (overrides.figmaModes !== undefined) {
    checkStringList(overrides.figmaModes, 'figmaModes', issues)
    if (Array.isArray(overrides.figmaModes) && overrides.figmaModes.length === 0) {
      issues.push('figmaModes: expected at least one mode')
    }
  }
  if (overrides.editableLayers !== undefined) {
    checkStringList(overrides.editableLayers, 'editableLayers', issues, TOKEN_LAYER_KEYS)
  }
  if (referenceTokens !== undefined && referenceTokens !== null) {
    if (isRecord(referenceTokens)) {
      checkKeys(referenceTokens, ['package', 'file'], 'referenceTokens.', issues)
      checkString(referenceTokens.package, 'referenceTokens.package', issues)
      checkString(referenceTokens.file, 'referenceTokens.file', issues)
    } else {
      issues.push('referenceTokens: expected an object or null')
    }
  }
  if (overrides.previewUrl !== undefined) {
    if (typeof overrides.previewUrl !== 'string' || !URL.canParse(overrides.previewUrl)) {
      issues.push('previewUrl: expected an absolute URL')
    }
  }
  return issues
}

/** Merges overrides (for example a parsed `toky.config.json`) onto the core defaults and validates the result. */
export function resolveTokyConfig(overrides: unknown = {}): TokyConfig {
  const issues = validateOverrides(overrides)
  if (issues.length > 0) throw new TokyConfigError(issues)

  const { $schema: _schema, repo, ...rest } = overrides as TokyConfigOverrides & { $schema?: string }
  return {
    ...CORE_TOKY_CONFIG,
    ...rest,
    repo: { ...CORE_TOKY_CONFIG.repo, ...repo },
    figmaModes: [...(rest.figmaModes ?? CORE_TOKY_CONFIG.figmaModes)],
    editableLayers: [...(rest.editableLayers ?? CORE_TOKY_CONFIG.editableLayers)],
  }
}
