#!/usr/bin/env node
/**
 * Entry point for figma-sync.yml's sync job (docs/plans/figma-sync-action-plan.md §5).
 *
 * Defaults to a dry run (resolves every brand, reports what Pull would do,
 * writes nothing) unless DRY_RUN=false is set explicitly — this is the
 * safety default so a local/manual invocation can never accidentally write
 * to a real Figma file. figma-sync.yml sets DRY_RUN=false for the real run.
 *
 * Run with: node scripts/figma-sync/pull.mjs
 *
 * TOKENS_DIR_OVERRIDE (optional): point at a scratch tokens directory
 * instead of packages/tokens/tokens — for local sandbox-Figma-file testing
 * only, where the real committed variableIds (which belong to the real
 * production file) would otherwise get rejected by an empty/different
 * target file. Never set in figma-sync.yml.
 *
 * TOKY_CONFIG_PATH (optional): the token source's toky.config.json (lib/config.mjs). Unset means
 * core. TOKENS_ROOT is the checkout its paths are relative to (default: this repo).
 * REFERENCE_TOKENS_FILE overrides the config's referenceTokens file.
 */
import { appendFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { loadSyncStateFile } from './lib/baseline.mjs'
import {
  buildBootstrapPayload,
  buildResponsiveBootstrapPayload,
  resolveBootstrapIds,
  resolveResponsiveBootstrapIds,
} from './lib/bootstrap.mjs'
import { resolveReferenceTokensFile, resolveSyncInputs } from './lib/config.mjs'
import { buildDeleteVariablesPayload, findRemovedVariableIds } from './lib/deletion.mjs'
import {
  buildNameIndex,
  findCollectionAndModes,
  findCollectionIdsByName,
  findResponsiveCollectionAndModes,
  getLocalVariables,
  postVariables,
} from './lib/figma.mjs'
import { isDeviceEligibleResponsiveDimensionToken, isSyncableResponsiveDimensionToken } from './lib/figma-value.mjs'
import { brandFilePath, flattenTokens, listBrandNames, loadTokenFile, mergeBrandTree } from './lib/tokens.mjs'
import {
  assignVariableIds,
  buildAliasPassPayload,
  buildCreatePassPayload,
  buildDescriptionUpdatePayload,
  buildNameUpdatePayload,
  collectNewlyCreatedIds,
  committedVariableIds,
  findForeignCollectionVariableIds,
  findResolvedTypeMismatches,
  resolveTempIds,
} from './lib/write.mjs'

function resolveBrandTrees(inputs) {
  const base = loadTokenFile(inputs.tokenFilePath)
  const baseTokens = flattenTokens(base)
  const brandNames = inputs.hasBrands ? listBrandNames(inputs.tokensDir, inputs.tokenFile) : []

  const brandTokensByName = Object.fromEntries(inputs.modeNames.map(modeName => [modeName, baseTokens]))
  for (const brandName of brandNames) {
    const override = loadTokenFile(brandFilePath(inputs.tokensDir, brandName))
    brandTokensByName[brandName] = flattenTokens(mergeBrandTree(base, override))
  }

  const referenceTokensFile = resolveReferenceTokensFile(inputs)
  const referenceTokens = referenceTokensFile ? flattenTokens(loadTokenFile(referenceTokensFile)) : []

  return { baseTokens, brandNames, brandTokensByName, referenceTokens, referenceTokensFile }
}

function summarizeBrand(brandName, tokens) {
  const withId = tokens.filter(t => t.variableId).length
  console.log(
    `  ${brandName}: ${tokens.length} tokens (${withId} existing variableId, ${tokens.length - withId} to create)`,
  )
}

async function dryRun(
  { baseTokens, brandNames, brandTokensByName, referenceTokens, referenceTokensFile },
  inputs,
  figmaToken,
  figmaFileKey,
) {
  console.log(`Resolved token trees (dry run — no writes):`)
  for (const [brandName, tokens] of Object.entries(brandTokensByName)) {
    summarizeBrand(brandName, tokens)
  }
  if (referenceTokensFile) {
    console.log(`  Reference tokens (read-only): ${referenceTokens.length} from ${referenceTokensFile}`)
    assertReferencesResolve(baseTokens, brandTokensByName, referenceTokens)
  }

  if (!figmaToken || !figmaFileKey) {
    console.log('\nFIGMA_API_TOKEN/FIGMA_FILE_KEY not set — skipping live Figma comparison (local dry run).')
    return
  }

  const localVariables = await getLocalVariables(figmaFileKey, figmaToken)
  const { variables } = localVariables
  const tokenVariableIds = new Set(committedVariableIds(baseTokens))
  const sourceCollectionIds = findCollectionIdsByName(localVariables, [
    inputs.collectionName,
    inputs.responsiveCollectionName,
  ])

  const missingInFigma = [...tokenVariableIds].filter(id => !variables[id])
  const missingInTokens = Object.values(variables)
    .filter(v => sourceCollectionIds.has(v.variableCollectionId))
    .filter(v => !tokenVariableIds.has(v.id))

  console.log(`\nFigma file has ${Object.keys(variables).length} variables.`)
  if (missingInFigma.length > 0) {
    console.log(
      `  ${missingInFigma.length} token variableId(s) not found in Figma — FIGMA_FILE_KEY is likely the wrong file; a real run would stop: ${missingInFigma.slice(0, 10).join(', ')}${missingInFigma.length > 10 ? ', …' : ''}`,
    )
  }
  if (missingInTokens.length > 0) {
    console.log(
      `  ${missingInTokens.length} Figma variable(s) with no matching token (orphaned or not yet round-tripped; never deleted by Pull).`,
    )
  }

  const collectionExists = name => Object.values(localVariables.variableCollections).some(c => c.name === name)
  if (
    !collectionExists(inputs.collectionName) ||
    (inputs.responsiveCollectionName !== null && !collectionExists(inputs.responsiveCollectionName))
  ) {
    console.log('  A collection is missing — a real run would bootstrap it first; planned writes not computed.')
    return
  }
  printPlannedWrites({ baseTokens, brandNames, brandTokensByName, referenceTokens }, inputs, localVariables)
}

/**
 * What a real run would write — the same payload builders as writePull, without posting. Composite
 * tokens (responsive, shadow, border, typography) that only gain a sub-variable, e.g. a `device` id,
 * show up here; they don't in the per-brand "to create" counts above.
 */
function printPlannedWrites({ baseTokens, brandNames, brandTokensByName, referenceTokens }, inputs, localVariables) {
  const { variables } = localVariables
  const { collectionId, modeIdByBrand } = findCollectionAndModes(
    localVariables,
    brandNames,
    inputs.collectionName,
    inputs.modeNames,
  )
  const responsiveCollectionId =
    inputs.responsiveCollectionName === null
      ? undefined
      : findResponsiveCollectionAndModes(localVariables, inputs.responsiveCollectionName).collectionId
  const idByPath = assignVariableIds(
    baseTokens,
    buildNameIndex(localVariables, collectionId),
    responsiveCollectionId ? buildNameIndex(localVariables, responsiveCollectionId) : new Map(),
  )
  const mismatches = findResolvedTypeMismatches(baseTokens, variables)
  const removedIds = findRemovedVariableIds(loadSyncStateFile(inputs.syncStateFile), baseTokens)
  const deletable = removedIds.filter(id => variables[id])
  const creates = buildCreatePassPayload({
    baseTokens,
    brandTokensByName,
    idByPath,
    collectionId,
    modeIdByBrand,
    responsiveCollectionId,
    referenceTokens,
  }).variables
  const descriptions = buildDescriptionUpdatePayload({ baseTokens, idByPath, remoteVariablesById: variables }).variables
  const renames = buildNameUpdatePayload({ baseTokens, idByPath, remoteVariablesById: variables }).variables

  const list = items => (items.length ? `: ${items.slice(0, 20).join(', ')}${items.length > 20 ? ', …' : ''}` : '')
  console.log('\nPlanned writes (a real run with DRY_RUN=false):')
  console.log(`  recreate (type changed): ${mismatches.length}${list(mismatches.map(m => m.token.path.join('/')))}`)
  console.log(`  create: ${creates.length}${list(creates.map(v => v.name))}`)
  console.log(`  delete: ${deletable.length}${list(deletable.map(id => variables[id].name))}`)
  console.log(`  rename: ${renames.length}${list(renames.map(v => `${variables[v.id]?.name} -> ${v.name}`))}`)
  console.log(
    `  description update: ${descriptions.length}${list(descriptions.map(v => variables[v.id]?.name ?? v.id))}`,
  )
}

/**
 * Resolves the brand collection ("Design Tokens"), bootstrapping it if this file has never had one
 * under that name — same one-time bootstrap the responsive collection below gets, independently,
 * since a file might already have one collection but not the other (e.g. this feature shipped after
 * the brand collection was already bootstrapped).
 */
async function resolveBrandCollection(
  localVariables,
  brandNames,
  { collectionName, modeNames },
  figmaFileKey,
  figmaToken,
) {
  const exists = Object.values(localVariables.variableCollections).some(c => c.name === collectionName)
  if (!exists) {
    console.log(
      `No Figma variable collection named "${collectionName}" found — bootstrapping one with a mode per brand…`,
    )
    const bootstrap = buildBootstrapPayload(brandNames, collectionName, modeNames)
    const bootstrapResult = await postVariables(figmaFileKey, figmaToken, {
      variableCollections: bootstrap.variableCollections,
      variableModes: bootstrap.variableModes,
    })
    const resolved = resolveBootstrapIds(bootstrap, bootstrapResult.tempIdToRealId ?? {})
    console.log(
      `Bootstrapped collection ${resolved.collectionId} with modes: ${Object.entries(resolved.modeIdByBrand)
        .map(([b, id]) => `${b}=${id}`)
        .join(', ')}`,
    )
    return resolved
  }
  return findCollectionAndModes(localVariables, brandNames, collectionName, modeNames)
}

/**
 * Resolves the responsive collection ("Design Responsive Tokens" — MVP scope, Device variables for
 * Device-layer Text.Size/Space/Container.Space only, see lib/figma-value.mjs's DEVICE_ELIGIBLE_PATH_PREFIXES),
 * bootstrapping it if this file has never had one under that name.
 */
async function resolveResponsiveCollection(localVariables, collectionName, figmaFileKey, figmaToken) {
  const exists = Object.values(localVariables.variableCollections).some(c => c.name === collectionName)
  if (!exists) {
    console.log(
      `No Figma variable collection named "${collectionName}" found — bootstrapping one with Mobile/Tablet/Desktop modes…`,
    )
    const bootstrap = buildResponsiveBootstrapPayload(collectionName)
    const bootstrapResult = await postVariables(figmaFileKey, figmaToken, {
      variableCollections: bootstrap.variableCollections,
      variableModes: bootstrap.variableModes,
    })
    const resolved = resolveResponsiveBootstrapIds(bootstrap, bootstrapResult.tempIdToRealId ?? {})
    console.log(
      `Bootstrapped responsive collection ${resolved.collectionId} with modes: ${Object.entries(
        resolved.modeIdByBreakpoint,
      )
        .map(([b, id]) => `${b}=${id}`)
        .join(', ')}`,
    )
    return resolved
  }
  return findResponsiveCollectionAndModes(localVariables, collectionName)
}

/**
 * Fails before any POST if a reference resolves in neither tree, if a reference token carries no
 * variableId, or (with `localVariables`) if that id is not in this Figma file. Builds the alias pass against the current
 * ids only for its checks; temp ids are skipped.
 */
function assertReferencesResolve(baseTokens, brandTokensByName, referenceTokens, localVariables) {
  const { variableModeValues } = buildAliasPassPayload({
    baseTokens,
    brandTokensByName,
    idByPath: assignVariableIds(baseTokens),
    modeIdByBrand: {},
    referenceTokens,
  })
  const missing = [
    ...new Set(
      variableModeValues
        .map(({ value }) => value.id)
        .filter(id => localVariables && !id.startsWith('temp-') && !localVariables.variables[id]),
    ),
  ]
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} alias target variableId(s) don't exist in this Figma file (e.g. ${missing.slice(0, 5).join(', ')}). ` +
        `Likely causes: the reference source deleted or recreated a referenced variable since the pinned ` +
        `version (version skew — bump the reference package, e.g. @helvetia-design/tokens, in the token ` +
        `repo), or the reference tokens were synced to a different file than FIGMA_FILE_KEY.`,
    )
  }
}

/**
 * @returns {{
 *   newIds: { path: string[], variableId: string }[],
 *   removedIds: string[],
 * }}
 */
async function writePull(
  { baseTokens, brandNames, brandTokensByName, referenceTokens },
  inputs,
  figmaToken,
  figmaFileKey,
) {
  const localVariables = await getLocalVariables(figmaFileKey, figmaToken)

  // Fail fast, before any POST, if the tokens tree already carries variableIds this file has never
  // seen — almost always TOKENS_DIR_OVERRIDE was meant to be set (testing against a sandbox file
  // with the production tokens directory). Left undetected, this surfaces later as a cryptic 400
  // from Figma's alias pass, after the create pass has already written.
  const unknownIds = committedVariableIds(baseTokens).filter(id => !localVariables.variables[id])
  if (unknownIds.length > 0) {
    throw new Error(
      `${unknownIds.length} committed variableId(s) don't exist in file ${figmaFileKey} (e.g. ${unknownIds
        .slice(0, 5)
        .join(', ')}). This usually means the tokens directory was round-tripped against a ` +
        `different Figma file — set TOKENS_DIR_OVERRIDE to a scratch tokens directory for sandbox-` +
        `file testing, or point FIGMA_FILE_KEY at the file these variableIds actually belong to.`,
    )
  }

  if (referenceTokens.length > 0)
    assertReferencesResolve(baseTokens, brandTokensByName, referenceTokens, localVariables)
  if (
    inputs.responsiveCollectionName === null &&
    baseTokens.some(
      token => isSyncableResponsiveDimensionToken(token) && isDeviceEligibleResponsiveDimensionToken(token),
    )
  ) {
    throw new Error('This token source has no responsive collection, but contains Device-eligible responsive tokens.')
  }

  const foreignIds = findForeignCollectionVariableIds(
    baseTokens,
    localVariables.variables,
    findCollectionIdsByName(localVariables, [inputs.collectionName, inputs.responsiveCollectionName]),
  )
  if (foreignIds.length > 0) {
    throw new Error(
      `${foreignIds.length} committed variableId(s) belong to a Figma collection other than "${inputs.collectionName}"` +
        `${inputs.responsiveCollectionName ? ` or "${inputs.responsiveCollectionName}"` : ''} (e.g. ${foreignIds
          .slice(0, 5)
          .join(', ')}). Remove the copied com.figma.variableId from these tokens; this run never writes ` +
        `to another source's variables.`,
    )
  }

  // Figma can't change a variable's resolvedType after creation, so a token whose existing
  // variable(s) no longer match the type this run expects (e.g. LineHeight FLOAT -> "150%" STRING)
  // is deleted here, in its own POST ahead of everything else — a same-name CREATE in the same
  // batch would collide with the not-yet-deleted original — then handled as a brand-new token
  // below: no variableId, so it gets a fresh one, which the backfill commit writes back.
  const mismatches = findResolvedTypeMismatches(baseTokens, localVariables.variables)
  if (mismatches.length > 0) {
    const staleIds = mismatches.flatMap(({ ids }) => ids)
    console.log(
      `Pass 0: recreating ${mismatches.length} token(s) whose Figma variable type changed (${staleIds.length} variable(s) deleted)…`,
    )
    await postVariables(figmaFileKey, figmaToken, buildDeleteVariablesPayload(staleIds))
    for (const id of staleIds) delete localVariables.variables[id]
    for (const { token } of mismatches) delete token.variableId
  }

  const { collectionId, modeIdByBrand } = await resolveBrandCollection(
    localVariables,
    brandNames,
    inputs,
    figmaFileKey,
    figmaToken,
  )
  const { collectionId: responsiveCollectionId, modeIdByBreakpoint } =
    inputs.responsiveCollectionName === null
      ? { collectionId: undefined, modeIdByBreakpoint: {} }
      : await resolveResponsiveCollection(localVariables, inputs.responsiveCollectionName, figmaFileKey, figmaToken)

  // Path/name fallback match (docs/adr/0001-figma-variable-identity-key.md)
  // — a token with no committed variableId might already exist in Figma
  // under this exact name (e.g. an earlier partial run got interrupted
  // after creating it but before its id was backfilled to GitHub). Linking
  // to it avoids a duplicate-name 400 from Figma and the duplicate
  // variable it would otherwise create. Scoped per collection — a Device
  // variable's name-fallback match only makes sense against the responsive
  // collection's own variables, not the brand collection's.
  const nameIndex = buildNameIndex(localVariables, collectionId)
  const responsiveNameIndex = responsiveCollectionId
    ? buildNameIndex(localVariables, responsiveCollectionId)
    : new Map()
  const idByPath = assignVariableIds(baseTokens, nameIndex, responsiveNameIndex)

  // Deletions (docs/adr/0019-pull-auto-deletes-figma-variables.md) are
  // baseline-relative — only a variableId this Action previously synced
  // and that's now gone from the tree is safe to delete; a Figma variable
  // with no matching token that was *never* in the baseline is left alone
  // (it's the plugin's Push flow's job to pick that up, not this Action's
  // to delete). Merged into pass 1: deletions don't depend on temp-id
  // resolution, so there's no ordering reason to keep them in a separate call.
  // Baseline-relative (findRemovedVariableIds only ever compares against the
  // last-synced state, never Figma's live state), so a stale baseline entry
  // whose variable Figma no longer has (deleted out of band, or the
  // collection it lived in got recreated/renamed) is still "removed" here —
  // it still needs to drop out of the baseline below — but must not be
  // queued as a DELETE: Figma's POST /variables is atomic, and a DELETE
  // against a nonexistent id 400s the *entire* batch, taking this run's
  // creates and mode-values down with it.
  const existingState = loadSyncStateFile(inputs.syncStateFile)
  const removedIds = findRemovedVariableIds(existingState, baseTokens)
  const deletableIds = removedIds.filter(id => localVariables.variables[id])
  const staleBaselineIds = removedIds.filter(id => !localVariables.variables[id])
  if (deletableIds.length > 0) {
    console.log(`Deleting ${deletableIds.length} Figma variable(s) whose token was removed from GitHub…`)
  }
  if (staleBaselineIds.length > 0) {
    console.log(
      `Dropping ${staleBaselineIds.length} stale baseline entr${staleBaselineIds.length === 1 ? 'y' : 'ies'} whose variable no longer exists in Figma (e.g. ${staleBaselineIds.slice(0, 5).join(', ')}).`,
    )
  }

  const createPass = buildCreatePassPayload({
    baseTokens,
    brandTokensByName,
    idByPath,
    collectionId,
    modeIdByBrand,
    responsiveCollectionId,
    referenceTokens,
  })
  const deletePass = buildDeleteVariablesPayload(deletableIds)
  createPass.variables.push(...deletePass.variables)

  console.log(
    `Pass 1: creating ${createPass.variables.length - deletePass.variables.length} variable(s), deleting ${deletePass.variables.length}, writing ${createPass.variableModeValues.length} literal mode-value(s)…`,
  )
  const createResult = await postVariables(figmaFileKey, figmaToken, createPass)
  resolveTempIds(idByPath, createResult.tempIdToRealId ?? {})

  const aliasPass = buildAliasPassPayload({
    baseTokens,
    brandTokensByName,
    idByPath,
    modeIdByBrand,
    modeIdByBreakpoint,
    referenceTokens,
  })
  console.log(`Pass 2: writing ${aliasPass.variableModeValues.length} alias mode-value(s)…`)
  if (aliasPass.variableModeValues.length > 0) {
    await postVariables(figmaFileKey, figmaToken, aliasPass)
  }

  const descriptionPass = buildDescriptionUpdatePayload({
    baseTokens,
    idByPath,
    remoteVariablesById: localVariables.variables,
  })
  // Merged with the description pass: a rename UPDATE and a description UPDATE never conflict
  // (different fields on the same variable), so there's no ordering reason to keep them in
  // separate POSTs — same "merge when there's no dependency" reasoning pass 1 uses for deletions.
  const namePass = buildNameUpdatePayload({
    baseTokens,
    idByPath,
    remoteVariablesById: localVariables.variables,
  })
  const metadataPass = { variables: [...descriptionPass.variables, ...namePass.variables] }
  console.log(
    `Pass 3: updating ${descriptionPass.variables.length} variable description(s), renaming ${namePass.variables.length} variable(s)…`,
  )
  if (metadataPass.variables.length > 0) {
    await postVariables(figmaFileKey, figmaToken, metadataPass)
  }

  const newIds = collectNewlyCreatedIds(baseTokens, idByPath)
  console.log(`Done — ${newIds.length} token(s) got a new variableId this run.`)
  return { newIds, removedIds }
}

async function main() {
  const inputs = resolveSyncInputs()
  const resolved = resolveBrandTrees(inputs)
  const figmaToken = process.env.FIGMA_API_TOKEN
  const figmaFileKey = process.env.FIGMA_FILE_KEY
  const dryRunMode = process.env.DRY_RUN !== 'false'

  if (dryRunMode) {
    await dryRun(resolved, inputs, figmaToken, figmaFileKey)
    return
  }

  if (!figmaToken || !figmaFileKey) {
    throw new Error('DRY_RUN=false requires FIGMA_API_TOKEN and FIGMA_FILE_KEY to be set.')
  }

  const { newIds, removedIds } = await writePull(resolved, inputs, figmaToken, figmaFileKey)

  // docs/adr/0017-direct-commit-variableid-backfill.md's write-back step reads these. The JSON
  // payload itself goes to a file, not an output/env var directly — a full-tree first sync can
  // produce thousands of entries, and passing that much JSON through as a step output turns into
  // an environment variable for the next step; GitHub Actions/the OS both cap how much an env var
  // (and total env) can hold, and this blows past it ("Argument list too long" spawning the next
  // step's shell). A file path is always short enough to pass safely.
  //
  // Written unconditionally (not just when GITHUB_OUTPUT is set) — this used to be CI-only, which
  // meant a local `DRY_RUN=false` run computed newIds/removedIds, logged a count, and then
  // silently discarded them on exit: `figma-sync:backfill:local` had nothing to read, every time,
  // by construction. Base.tokens.json/.figma-sync-state.json never got patched locally, so the
  // same tokens looked "newly created" again on the next run (harmless, thanks to pull.mjs's own
  // name-fallback match in writePull, but it meant the ids never made it into git).
  const outDir = process.env.RUNNER_TEMP ?? tmpdir()
  const newIdsFile = resolve(outDir, 'figma-sync-new-ids.json')
  const removedIdsFile = resolve(outDir, 'figma-sync-removed-ids.json')

  if (newIds.length > 0) {
    writeFileSync(newIdsFile, JSON.stringify(newIds))
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `new_ids_file=${newIdsFile}\n`)
  }
  if (removedIds.length > 0) {
    writeFileSync(removedIdsFile, JSON.stringify(removedIds))
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `removed_ids_file=${removedIdsFile}\n`)
  }

  if (!process.env.GITHUB_OUTPUT && (newIds.length > 0 || removedIds.length > 0)) {
    console.log('\nTo write these back to Base.tokens.json / .figma-sync-state.json locally, run:')
    console.log(
      `  NEW_IDS_FILE=${newIds.length > 0 ? newIdsFile : ''} REMOVED_IDS_FILE=${
        removedIds.length > 0 ? removedIdsFile : ''
      } TOKENS_DIR_OVERRIDE=packages/tokens/tokens node scripts/figma-sync/backfill-commit.mjs`.replace(/\s+/g, ' '),
    )
    console.log(
      '  (TOKENS_DIR_OVERRIDE is required here — without it, backfill-commit.mjs tries a direct\n' +
        '  remote commit to GitHub via the REST API instead of writing local files.)',
    )
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
