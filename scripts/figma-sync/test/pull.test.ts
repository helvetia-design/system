import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

const TOKENS_COLLECTION = 'c-tokens'
const RESPONSIVE_COLLECTION = 'c-responsive'

type FigmaVariable = { id: string; name: string; resolvedType: string }
type PostBody = { variables?: { action: string; id: string }[]; variableModeValues?: unknown[] }

function stringToken(value: string, variableId?: string) {
  return {
    $type: 'string',
    $value: value,
    ...(variableId ? { $extensions: { 'com.figma.variableId': variableId } } : {}),
  }
}

function setUpTokens(tokens: Record<string, object>, baselineIds: string[]) {
  const root = mkdtempSync(join(tmpdir(), 'figma-sync-pull-'))
  const tokensDir = join(root, 'tokens')
  mkdirSync(tokensDir)
  writeFileSync(join(tokensDir, 'Base.tokens.json'), JSON.stringify({ Label: tokens }))
  const entries = Object.fromEntries(baselineIds.map(id => [id, { tokenPath: [], resolvedValue: null }]))
  writeFileSync(join(root, '.figma-sync-state.json'), JSON.stringify({ entries }))
  const runnerTemp = join(root, 'runner')
  mkdirSync(runnerTemp)
  process.env.TOKENS_DIR_OVERRIDE = tokensDir
  process.env.RUNNER_TEMP = runnerTemp
  return runnerTemp
}

function figmaFetchMock(variables: FigmaVariable[]) {
  let realIdCounter = 0
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/variables/local')) {
      return Response.json({
        meta: {
          variables: Object.fromEntries(
            variables.map(v => [
              v.id,
              { ...v, variableCollectionId: TOKENS_COLLECTION, valuesByMode: {}, scopes: ['ALL_SCOPES'] },
            ]),
          ),
          variableCollections: {
            [TOKENS_COLLECTION]: {
              id: TOKENS_COLLECTION,
              name: 'Design Tokens',
              modes: [{ modeId: 'm-base', name: 'Base' }],
              defaultModeId: 'm-base',
            },
            [RESPONSIVE_COLLECTION]: {
              id: RESPONSIVE_COLLECTION,
              name: 'Design Responsive Tokens',
              modes: ['Mobile', 'Tablet', 'Desktop'].map(name => ({ modeId: `m-${name}`, name })),
              defaultModeId: 'm-Mobile',
            },
          },
        },
      })
    }
    if (init?.method === 'POST' && url.endsWith('/variables')) {
      const body = JSON.parse(init.body as string) as PostBody
      const tempIdToRealId = Object.fromEntries(
        (body.variables ?? []).filter(v => v.action === 'CREATE').map(v => [v.id, `real-${++realIdCounter}`]),
      )
      return Response.json({ meta: { tempIdToRealId } })
    }
    throw new Error(`Unexpected fetch call: ${init?.method ?? 'GET'} ${url}`)
  })
}

function postBodies(fetchMock: ReturnType<typeof figmaFetchMock>): PostBody[] {
  return fetchMock.mock.calls
    .filter(([, init]) => init?.method === 'POST')
    .map(([, init]) => JSON.parse(init?.body as string) as PostBody)
}

function readNewIds(runnerTemp: string) {
  return JSON.parse(readFileSync(join(runnerTemp, 'figma-sync-new-ids.json'), 'utf-8'))
}

let logSpy: ReturnType<typeof vi.spyOn>
let errorSpy: ReturnType<typeof vi.spyOn>

async function runPull() {
  await import('../pull.mjs')
  await vi.waitFor(() => {
    const done = logSpy.mock.calls.some(([message]) => String(message).startsWith('Done'))
    if (!done && errorSpy.mock.calls.length === 0) throw new Error('pull.mjs still running')
  })
}

beforeEach(() => {
  vi.resetModules()
  process.env.DRY_RUN = 'false'
  process.env.FIGMA_API_TOKEN = 'figma-token'
  process.env.FIGMA_FILE_KEY = 'file-key'
  delete process.env.GITHUB_OUTPUT
  delete process.env.TOKY_CONFIG_PATH
  delete process.env.TOKENS_ROOT
  delete process.env.REFERENCE_TOKENS_FILE
  delete process.env.FIGMA_COLLECTION_NAME
  delete process.env.FIGMA_RESPONSIVE_COLLECTION_NAME
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  process.env = { ...originalEnv }
  process.exitCode = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('pull.mjs name-matched ids', () => {
  it('keeps a baseline variable that a token without variableId reaches by name and backfills its id', async () => {
    const runnerTemp = setUpTokens({ A: stringToken('a', 'v1'), B: stringToken('b') }, ['v1', 'v2'])
    const fetchMock = figmaFetchMock([
      { id: 'v1', name: 'Label/A', resolvedType: 'STRING' },
      { id: 'v2', name: 'Label/B', resolvedType: 'STRING' },
    ])
    vi.stubGlobal('fetch', fetchMock)

    await runPull()

    expect(process.exitCode).toBeUndefined()
    const deletedIds = postBodies(fetchMock).flatMap(body =>
      (body.variables ?? []).filter(v => v.action === 'DELETE').map(v => v.id),
    )
    expect(deletedIds).not.toContain('v2')
    expect(readNewIds(runnerTemp)).toEqual([{ path: ['Label', 'B'], variableId: 'v2' }])
  })
})

describe('pull.mjs unknown committed ids', () => {
  it('recreates and backfills a token whose committed id Figma does not have', async () => {
    const runnerTemp = setUpTokens(
      { A: stringToken('a', 'v1'), B: stringToken('b', 'v2'), C: stringToken('c', 'v3'), D: stringToken('d', 'v4') },
      ['v1', 'v2', 'v3', 'v4'],
    )
    const fetchMock = figmaFetchMock([
      { id: 'v1', name: 'Label/A', resolvedType: 'STRING' },
      { id: 'v2', name: 'Label/B', resolvedType: 'STRING' },
      { id: 'v3', name: 'Label/C', resolvedType: 'STRING' },
    ])
    vi.stubGlobal('fetch', fetchMock)

    await runPull()

    expect(process.exitCode).toBeUndefined()
    const creates = postBodies(fetchMock).flatMap(body => (body.variables ?? []).filter(v => v.action === 'CREATE'))
    expect(creates).toEqual([expect.objectContaining({ id: 'temp-Label.D' })])
    expect(readNewIds(runnerTemp)).toEqual([{ path: ['Label', 'D'], variableId: 'real-1' }])
  })

  it('fails before any POST when most committed ids are unknown', async () => {
    setUpTokens(
      { A: stringToken('a', 'v1'), B: stringToken('b', 'v2'), C: stringToken('c', 'v3'), D: stringToken('d', 'v4') },
      ['v1', 'v2', 'v3', 'v4'],
    )
    const fetchMock = figmaFetchMock([{ id: 'v1', name: 'Label/A', resolvedType: 'STRING' }])
    vi.stubGlobal('fetch', fetchMock)

    await runPull()

    expect(process.exitCode).toBe(1)
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/round-tripped/) }))
    expect(postBodies(fetchMock)).toEqual([])
  })
})

describe('pull.mjs pass 0 for a name-matched variable', () => {
  it('deletes a name-matched variable of another type first and creates a temp id instead of reusing it', async () => {
    const runnerTemp = setUpTokens({ A: stringToken('a') }, [])
    const fetchMock = figmaFetchMock([{ id: 'v5', name: 'Label/A', resolvedType: 'FLOAT' }])
    vi.stubGlobal('fetch', fetchMock)

    await runPull()

    expect(process.exitCode).toBeUndefined()
    const [first, second] = postBodies(fetchMock)
    expect(first.variables).toEqual([expect.objectContaining({ action: 'DELETE', id: 'v5' })])
    expect(second.variables).toEqual([expect.objectContaining({ action: 'CREATE', id: 'temp-Label.A' })])
    expect(readNewIds(runnerTemp)).toEqual([{ path: ['Label', 'A'], variableId: 'real-1' }])
  })
})

describe('pull.mjs dry run', () => {
  async function runDryRun() {
    delete process.env.DRY_RUN
    await import('../pull.mjs')
    const plannedLine = (prefix: string) =>
      logSpy.mock.calls.map(([message]) => String(message)).find(m => m.startsWith(`  ${prefix}:`))
    await vi.waitFor(() => {
      if (!plannedLine('description update') && errorSpy.mock.calls.length === 0) {
        throw new Error('pull.mjs still running')
      }
    })
    expect(errorSpy).not.toHaveBeenCalled()
    return plannedLine
  }

  it('plans deleting only the baseline variables whose token was removed', async () => {
    setUpTokens({ A: stringToken('a', 'v1'), B: stringToken('b', 'v2') }, ['v1', 'v2', 'v3'])
    const fetchMock = figmaFetchMock([
      { id: 'v1', name: 'Label/A', resolvedType: 'STRING' },
      { id: 'v2', name: 'Label/B', resolvedType: 'STRING' },
      { id: 'v3', name: 'Label/C', resolvedType: 'STRING' },
    ])
    vi.stubGlobal('fetch', fetchMock)

    const plannedLine = await runDryRun()

    expect(plannedLine('delete')).toBe('  delete: 1: Label/C')
    expect(postBodies(fetchMock)).toEqual([])
  })

  it('plans recreating a name-matched variable of another type', async () => {
    setUpTokens({ A: stringToken('a') }, [])
    const fetchMock = figmaFetchMock([{ id: 'v5', name: 'Label/A', resolvedType: 'FLOAT' }])
    vi.stubGlobal('fetch', fetchMock)

    const plannedLine = await runDryRun()

    expect(plannedLine('recreate (type changed)')).toBe('  recreate (type changed): 1: Label/A')
    expect(plannedLine('create')).toBe('  create: 1: Label/A')
    expect(postBodies(fetchMock)).toEqual([])
  })
})
