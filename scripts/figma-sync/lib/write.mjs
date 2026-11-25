/**
 * Builds the payloads for Figma's `POST /v1/files/:key/variables`, as a
 * two-pass write (docs/plans/figma-sync-action-plan.md §2 "Reference
 * handling"): pass 1 creates every not-yet-synced variable and writes
 * every literal mode-value; pass 2 writes alias mode-values, once pass 1's
 * response has resolved every temp id to a real one. Pure/testable — no
 * network calls live here, only in lib/figma.mjs.
 */
import { buildTokenIndex, pathKey, resolveAliasTarget } from './alias.mjs'
import {
  BORDER_SUB_PROPERTIES,
  BORDER_SUB_PROPERTY_RESOLVED_TYPE,
  BORDER_SUB_PROPERTY_SUFFIX,
  figmaBorderSubEntriesFor,
  figmaResponsiveDimensionDeviceVariableName,
  figmaResponsiveDimensionSubEntriesFor,
  figmaLiteralValueFor,
  flattenVariableId,
  figmaShadowSubValuesFor,
  figmaTypographySubEntriesFor,
  isDeviceEligibleResponsiveDimensionToken,
  isPushableToken,
  isSyncableBorderToken,
  isSyncableResponsiveDimensionToken,
  isSyncableShadowToken,
  isSyncableTypographyToken,
  isTempId,
  resolvedTypeForToken,
  RESPONSIVE_DIMENSION_SUB_PROPERTIES,
  RESPONSIVE_DIMENSION_SUB_PROPERTY_RESOLVED_TYPE,
  RESPONSIVE_DIMENSION_SUB_PROPERTY_SUFFIX,
  SHADOW_SUB_PROPERTIES,
  SHADOW_SUB_PROPERTY_RESOLVED_TYPE,
  SHADOW_SUB_PROPERTY_SUFFIX,
  subPropertiesForVariableIdShape,
  TYPOGRAPHY_SUB_PROPERTIES,
  TYPOGRAPHY_SUB_PROPERTY_RESOLVED_TYPE,
  TYPOGRAPHY_SUB_PROPERTY_SUFFIX,
} from './figma-value.mjs'

// Figma rejects "." in a variable name (e.g. a Size token literally named "0.875") even though "/"
// is fine — it's the path's own group separator — so only "." gets swapped, per segment, for "_".
export function figmaVariableName(path) {
  return path.map(segment => segment.replaceAll('.', '_')).join('/')
}

export function figmaShadowSubVariableName(path, subProperty) {
  return `${figmaVariableName(path)}/${SHADOW_SUB_PROPERTY_SUFFIX[subProperty]}`
}

export function figmaBorderSubVariableName(path, subProperty) {
  return `${figmaVariableName(path)}/${BORDER_SUB_PROPERTY_SUFFIX[subProperty]}`
}

export function figmaTypographySubVariableName(path, subProperty) {
  return `${figmaVariableName(path)}/${TYPOGRAPHY_SUB_PROPERTY_SUFFIX[subProperty]}`
}

export function figmaResponsiveDimensionSubVariableName(path, subProperty) {
  return `${figmaVariableName(path)}/${RESPONSIVE_DIMENSION_SUB_PROPERTY_SUFFIX[subProperty]}`
}

// A shadow, border, or typography token's Figma identity is several variableIds, not 1 —
// $extensions.com.figma.variableId is an object ({offsetX, offsetY, blur, spread, color} for
// shadow; {color, width, style} for border; {fontFamily, fontSize, fontWeight, lineHeight} for
// typography) instead of the single string every other type uses.
function isCompositeVariableIdSet(id) {
  return typeof id === 'object' && id !== null
}

// A composite target's own variableId has no single Figma variable a plain (non-composite) token's
// alias could point at — which sub-property would it mean? — EXCEPT a Device-eligible responsive
// dimension token: its 'device' id, when present, IS exactly that single collapsed variable (see
// isDeviceEligibleResponsiveDimensionToken in figma-value.mjs). Returns undefined when there's no
// single id to alias against, same "not eligible, skip rather than guess" policy used everywhere
// else in this file.
function singleAliasTargetId(targetVariableId) {
  if (!isCompositeVariableIdSet(targetVariableId)) return targetVariableId
  return targetVariableId.device
}

// Keeps the sub-ids a composite token already carries and completes each missing one — name-matched
// if Figma already has it (an interrupted earlier run), else a fresh temp id — so existing variables
// are never touched or recreated.
function completeSubIds(token, subProperties, subVariableName, nameIndex) {
  const key = pathKey(token.path)
  return Object.fromEntries(
    subProperties.map(sub => [
      sub,
      token.variableId[sub] ?? nameIndex.get(subVariableName(token.path, sub)) ?? `temp-${key}-${sub}`,
    ]),
  )
}

// A name match on an id another token still commits is that token's variable under its old name
// (renamed in code, not yet in Figma), so it is not a match.
function withoutIds(nameIndex, ids) {
  return new Map([...nameIndex].filter(([, id]) => !ids.has(id)))
}

// A reference token (lib/alias.mjs's buildTokenIndex) lives in another source's collection: it is
// aliased by its committed variableId and never gets an entry in idByPath.
function aliasTargetIdFor(target, idByPath) {
  if (!target.isReference) return idByPath.get(pathKey(target.path))
  if (!target.variableId) {
    throw new Error(
      `Reference token ${pathKey(target.path)} has no com.figma.variableId — sync the reference source to Figma first.`,
    )
  }
  return target.variableId
}

/**
 * Assigns every Base token the id its Figma payload entries should use:
 * its existing `variableId`; failing that, a Figma variable already
 * carrying the same computed name (docs/adr/0001-figma-variable-identity-key.md's
 * documented path/name *fallback* match, for a token that's never
 * round-tripped an id — e.g. it was already created in Figma under this
 * exact name by an earlier partial run); failing that, a fresh temp id.
 * A composite token that already has some sub-ids keeps them and completes only the missing ones the
 * same way. Computed once against Base — a brand override reuses Base's variableId,
 * it never mints its own (docs/adr/0012-brand-modes-not-collections.md) —
 * and reused for every brand's mode-values.
 *
 * @param {import('./tokens.mjs').Token[]} baseTokens
 * @param {Map<string, string>} existingNameIndex Figma variable name -> real id, scoped to the brand collection
 * @param {Map<string, string>} existingResponsiveNameIndex Figma variable name -> real id, scoped to the "Design Responsive Tokens" collection — only consulted for a Device-eligible responsive dimension token's 4th 'device' id, which lives in that separate collection
 */
export function assignVariableIds(baseTokens, existingNameIndex = new Map(), existingResponsiveNameIndex = new Map()) {
  const committedIds = new Set(committedVariableIds(baseTokens))
  const nameIndex = withoutIds(existingNameIndex, committedIds)
  const responsiveNameIndex = withoutIds(existingResponsiveNameIndex, committedIds)
  const idByPath = new Map()
  for (const token of baseTokens) {
    const key = pathKey(token.path)

    if (isSyncableShadowToken(token)) {
      if (isCompositeVariableIdSet(token.variableId)) {
        idByPath.set(key, completeSubIds(token, SHADOW_SUB_PROPERTIES, figmaShadowSubVariableName, nameIndex))
        continue
      }
      // Path/name fallback match, per sub-property — only used if every one
      // of the 5 sub-variables already exists under its expected name
      // (e.g. an earlier partial run got interrupted after creating some of
      // them); otherwise every sub-property gets a fresh temp id, rather
      // than mixing real and temp ids within one shadow token's identity.
      const bySubProperty = Object.fromEntries(
        SHADOW_SUB_PROPERTIES.map(sub => [sub, nameIndex.get(figmaShadowSubVariableName(token.path, sub))]),
      )
      const allFound = SHADOW_SUB_PROPERTIES.every(sub => bySubProperty[sub])
      idByPath.set(
        key,
        allFound ? bySubProperty : Object.fromEntries(SHADOW_SUB_PROPERTIES.map(sub => [sub, `temp-${key}-${sub}`])),
      )
      continue
    }

    if (isSyncableBorderToken(token)) {
      if (isCompositeVariableIdSet(token.variableId)) {
        idByPath.set(key, completeSubIds(token, BORDER_SUB_PROPERTIES, figmaBorderSubVariableName, nameIndex))
        continue
      }
      // Path/name fallback match, per sub-property — same "all-or-nothing" reasoning as shadow's.
      const bySubProperty = Object.fromEntries(
        BORDER_SUB_PROPERTIES.map(sub => [sub, nameIndex.get(figmaBorderSubVariableName(token.path, sub))]),
      )
      const allFound = BORDER_SUB_PROPERTIES.every(sub => bySubProperty[sub])
      idByPath.set(
        key,
        allFound ? bySubProperty : Object.fromEntries(BORDER_SUB_PROPERTIES.map(sub => [sub, `temp-${key}-${sub}`])),
      )
      continue
    }

    if (isSyncableTypographyToken(token)) {
      if (isCompositeVariableIdSet(token.variableId)) {
        // A typography token committed before a sub-property was added (e.g. letterSpacing) carries
        // fewer ids than TYPOGRAPHY_SUB_PROPERTIES lists, same as a composite token that lost an id
        // to an unknown-id drop (see dropUnknownVariableIds).
        idByPath.set(key, completeSubIds(token, TYPOGRAPHY_SUB_PROPERTIES, figmaTypographySubVariableName, nameIndex))
        continue
      }
      // Path/name fallback match, per sub-property — same "all-or-nothing" reasoning as shadow's.
      const bySubProperty = Object.fromEntries(
        TYPOGRAPHY_SUB_PROPERTIES.map(sub => [sub, nameIndex.get(figmaTypographySubVariableName(token.path, sub))]),
      )
      const allFound = TYPOGRAPHY_SUB_PROPERTIES.every(sub => bySubProperty[sub])
      idByPath.set(
        key,
        allFound
          ? bySubProperty
          : Object.fromEntries(TYPOGRAPHY_SUB_PROPERTIES.map(sub => [sub, `temp-${key}-${sub}`])),
      )
      continue
    }

    if (isSyncableResponsiveDimensionToken(token)) {
      const deviceEligible = isDeviceEligibleResponsiveDimensionToken(token)
      // 'device' lives in a separate collection from mobile/tablet/desktop and is only assigned
      // for MVP-scoped tokens — resolved independently of the "all 3 siblings or none" group below,
      // so a token whose siblings already round-tripped a real id can still pick up a fresh 'device'
      // id the first time it becomes Device-eligible, without touching the siblings' own ids.
      const deviceId = deviceEligible
        ? (responsiveNameIndex.get(figmaResponsiveDimensionDeviceVariableName(token.path)) ?? `temp-${key}-device`)
        : undefined

      if (isCompositeVariableIdSet(token.variableId)) {
        const completed = completeSubIds(
          token,
          RESPONSIVE_DIMENSION_SUB_PROPERTIES,
          figmaResponsiveDimensionSubVariableName,
          nameIndex,
        )
        const device = deviceEligible ? (token.variableId.device ?? deviceId) : token.variableId.device
        idByPath.set(key, device ? { ...completed, device } : completed)
        continue
      }
      // Path/name fallback match, per sub-property — same "all-or-nothing" reasoning as shadow's.
      const bySubProperty = Object.fromEntries(
        RESPONSIVE_DIMENSION_SUB_PROPERTIES.map(sub => [
          sub,
          nameIndex.get(figmaResponsiveDimensionSubVariableName(token.path, sub)),
        ]),
      )
      const allFound = RESPONSIVE_DIMENSION_SUB_PROPERTIES.every(sub => bySubProperty[sub])
      const resolved = allFound
        ? bySubProperty
        : Object.fromEntries(RESPONSIVE_DIMENSION_SUB_PROPERTIES.map(sub => [sub, `temp-${key}-${sub}`]))
      if (deviceEligible) resolved.device = deviceId
      idByPath.set(key, resolved)
      continue
    }

    const fallbackId = nameIndex.get(figmaVariableName(token.path))
    idByPath.set(key, token.variableId ?? fallbackId ?? `temp-${key}`)
  }
  return idByPath
}

/**
 * Every already-committed variableId a run is about to write against — used to catch, before any
 * POST goes out, a token tree that was round-tripped against a *different* Figma file than
 * `figmaFileKey` currently points at (e.g. testing against a sandbox file with the production
 * tokens directory instead of TOKENS_DIR_OVERRIDE, see pull.mjs's file header). Pass 1 alone can't
 * catch this — a stale id is only ever referenced (never re-created) — so a mismatch otherwise
 * surfaces as a confusing 400 from Figma partway through pass 2, after pass 1 has already written.
 *
 * @param {import('./tokens.mjs').Token[]} baseTokens
 * @returns {string[]} every real (non-empty) variableId baseTokens already carries, including each
 *   sub-property id of a composite (shadow/border/typography/responsive dimension) token
 */
export function committedVariableIds(baseTokens) {
  const ids = []
  for (const token of baseTokens) {
    if (!token.variableId) continue
    if (isCompositeVariableIdSet(token.variableId)) {
      ids.push(...Object.values(token.variableId).filter(Boolean))
    } else {
      ids.push(token.variableId)
    }
  }
  return ids
}

/**
 * Removes every committed variableId that Figma doesn't have from the in-memory tokens, so the token
 * is name-matched or recreated this run and its new id is backfilled — the same way pass 0 handles a
 * type mismatch. A plain id drops the whole `variableId`; a composite id drops only the missing
 * sub-ids, and the whole `variableId` once none remain.
 *
 * @param {import('./tokens.mjs').Token[]} baseTokens
 * @param {Record<string, unknown>} remoteVariablesById
 * @returns {string[]} the dropped ids
 */
export function dropUnknownVariableIds(baseTokens, remoteVariablesById) {
  const dropped = []
  for (const token of baseTokens) {
    if (!token.variableId) continue
    if (!isCompositeVariableIdSet(token.variableId)) {
      if (remoteVariablesById[token.variableId]) continue
      dropped.push(token.variableId)
      delete token.variableId
      continue
    }
    for (const [sub, id] of Object.entries(token.variableId)) {
      if (!id || remoteVariablesById[id]) continue
      dropped.push(id)
      delete token.variableId[sub]
    }
    if (Object.keys(token.variableId).length === 0) delete token.variableId
  }
  return dropped
}

const DIFFERENT_FILE_UNKNOWN_ID_SHARE = 0.5

/**
 * True when most committed ids are unknown to Figma, which points at a token tree round-tripped
 * against another file rather than a few ids deleted in Figma.
 */
export function isLikelyDifferentFigmaFile(committedCount, unknownCount) {
  return committedCount > 0 && unknownCount / committedCount > DIFFERENT_FILE_UNKNOWN_ID_SHARE
}

/**
 * Committed variableIds of this source whose Figma variable lives in a collection the source does
 * not own, e.g. a core id copied into an extension token. Any write to them (including pass 0's
 * type-mismatch DELETE) would change another source's variable.
 *
 * @param {import('./tokens.mjs').Token[]} baseTokens
 * @param {Record<string, { variableCollectionId: string }>} remoteVariablesById
 * @param {Set<string>} ownCollectionIds
 * @returns {string[]}
 */
export function findForeignCollectionVariableIds(baseTokens, remoteVariablesById, ownCollectionIds) {
  return committedVariableIds(baseTokens).filter(id => {
    const remote = remoteVariablesById[id]
    return remote && !ownCollectionIds.has(remote.variableCollectionId)
  })
}

/**
 * @param {object} params
 * @param {import('./tokens.mjs').Token[]} params.baseTokens
 * @param {Record<string, import('./tokens.mjs').Token[]>} params.brandTokensByName e.g. { Base: [...], OrangeVacations: [...] }
 * @param {Map<string, string | Record<string, string>>} params.idByPath from assignVariableIds
 * @param {string} params.collectionId the brand collection ("Design Tokens")
 * @param {Record<string, string>} params.modeIdByBrand
 * @param {string} [params.responsiveCollectionId] the responsive collection ("Design Responsive
 *   Tokens") — only needed when at least one Device-eligible responsive dimension token is present
 *   (isDeviceEligibleResponsiveDimensionToken); its Device variable is created there, not in `collectionId`
 * @param {import('./tokens.mjs').Token[]} [params.referenceTokens] read-only fallback for references (lib/alias.mjs)
 */
export function buildCreatePassPayload({
  baseTokens,
  brandTokensByName,
  idByPath,
  collectionId,
  modeIdByBrand,
  responsiveCollectionId,
  referenceTokens = [],
}) {
  const variables = []
  const seenVariableIds = new Set()

  for (const token of baseTokens) {
    const key = pathKey(token.path)
    const variableId = idByPath.get(key)

    if (isSyncableShadowToken(token)) {
      for (const sub of SHADOW_SUB_PROPERTIES) {
        const subId = variableId[sub]
        if (!isTempId(subId) || seenVariableIds.has(subId)) continue
        seenVariableIds.add(subId)
        variables.push({
          action: 'CREATE',
          id: subId,
          name: figmaShadowSubVariableName(token.path, sub),
          variableCollectionId: collectionId,
          resolvedType: SHADOW_SUB_PROPERTY_RESOLVED_TYPE[sub],
          scopes: token.figmaScopes ?? ['ALL_SCOPES'],
          description: token.description ?? '',
        })
      }
      continue
    }

    if (isSyncableBorderToken(token)) {
      for (const sub of BORDER_SUB_PROPERTIES) {
        const subId = variableId[sub]
        if (!isTempId(subId) || seenVariableIds.has(subId)) continue
        seenVariableIds.add(subId)
        variables.push({
          action: 'CREATE',
          id: subId,
          name: figmaBorderSubVariableName(token.path, sub),
          variableCollectionId: collectionId,
          resolvedType: BORDER_SUB_PROPERTY_RESOLVED_TYPE[sub],
          scopes: token.figmaScopes ?? ['ALL_SCOPES'],
          description: token.description ?? '',
        })
      }
      continue
    }

    if (isSyncableTypographyToken(token)) {
      for (const sub of TYPOGRAPHY_SUB_PROPERTIES) {
        const subId = variableId[sub]
        if (!isTempId(subId) || seenVariableIds.has(subId)) continue
        seenVariableIds.add(subId)
        variables.push({
          action: 'CREATE',
          id: subId,
          name: figmaTypographySubVariableName(token.path, sub),
          variableCollectionId: collectionId,
          resolvedType: TYPOGRAPHY_SUB_PROPERTY_RESOLVED_TYPE[sub],
          scopes: token.figmaScopes ?? ['ALL_SCOPES'],
          description: token.description ?? '',
        })
      }
      continue
    }

    if (isSyncableResponsiveDimensionToken(token)) {
      for (const sub of RESPONSIVE_DIMENSION_SUB_PROPERTIES) {
        const subId = variableId[sub]
        if (!isTempId(subId) || seenVariableIds.has(subId)) continue
        seenVariableIds.add(subId)
        variables.push({
          action: 'CREATE',
          id: subId,
          name: figmaResponsiveDimensionSubVariableName(token.path, sub),
          variableCollectionId: collectionId,
          resolvedType: RESPONSIVE_DIMENSION_SUB_PROPERTY_RESOLVED_TYPE[sub],
          scopes: token.figmaScopes ?? ['ALL_SCOPES'],
          description: token.description ?? '',
        })
      }
      // The Device variable (MVP scope, isDeviceEligibleResponsiveDimensionToken) — lives in
      // responsiveCollectionId, not collectionId, and unlike the 3 siblings above never gets a
      // literal mode-value here: all 3 of its breakpoint modes are always a VARIABLE_ALIAS to the
      // matching sibling, written in pass 2 once the siblings' real ids are known
      // (buildAliasPassPayload).
      const deviceId = variableId.device
      if (deviceId && isTempId(deviceId) && !seenVariableIds.has(deviceId)) {
        seenVariableIds.add(deviceId)
        variables.push({
          action: 'CREATE',
          id: deviceId,
          name: figmaResponsiveDimensionDeviceVariableName(token.path),
          variableCollectionId: responsiveCollectionId,
          resolvedType: 'FLOAT',
          scopes: token.figmaScopes ?? ['ALL_SCOPES'],
          description: token.description ?? '',
        })
      }
      continue
    }

    // Not a temp id — either the token already carried a variableId, or
    // assignVariableIds linked it to an existing Figma variable by name.
    // Either way, nothing to CREATE.
    if (!isTempId(variableId)) continue
    if (seenVariableIds.has(variableId)) continue
    seenVariableIds.add(variableId)

    variables.push({
      action: 'CREATE',
      id: variableId,
      name: figmaVariableName(token.path),
      variableCollectionId: collectionId,
      resolvedType: resolvedTypeForToken(token),
      scopes: token.figmaScopes ?? ['ALL_SCOPES'],
      description: token.description ?? '',
    })
  }

  // Border/typography sub-values may be references (docs/plans/border-token-type-plan.md
  // decision 4, docs/plans/typography-token-type-plan.md decision 4) — figmaBorderSubEntriesFor/
  // figmaTypographySubEntriesFor tag each as reference-or-literal rather than following it, but
  // still need this index: letterSpacing's percentage always needs its fontSize literal (via
  // resolveLiteral), and the alias pass below looks up a reference sub-value's target token here.
  const tokenIndex = buildTokenIndex(baseTokens, referenceTokens)

  const variableModeValues = []
  for (const [brandName, tokens] of Object.entries(brandTokensByName)) {
    const modeId = modeIdByBrand[brandName]
    for (const token of tokens) {
      // Resolved from its per-breakpoint mobile/tablet/desktop values regardless of what the
      // token's own top-level $value looks like — a responsive dimension token's $value can itself
      // be a reference (mirroring mobile) while still carrying per-breakpoint overrides, so this
      // can't wait behind the `token.value.kind === 'reference'` check below. Only literal
      // breakpoints are written here — a breakpoint that's itself a `{reference}` is bound as a
      // VARIABLE_ALIAS in pass 2 instead (buildAliasPassPayload), once its target's real id is
      // known, rather than flattened to a copy of the target's value.
      if (isSyncableResponsiveDimensionToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const subEntries = figmaResponsiveDimensionSubEntriesFor(token.responsive)
        for (const sub of RESPONSIVE_DIMENSION_SUB_PROPERTIES) {
          const entry = subEntries[sub]
          if (entry.kind === 'reference') continue // pass 2
          variableModeValues.push({ variableId: variableId[sub], modeId, value: entry.value })
        }
        continue
      }

      if (token.value.kind === 'reference') continue // pass 2

      if (isSyncableShadowToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const subValues = figmaShadowSubValuesFor(token.value.value)
        for (const sub of SHADOW_SUB_PROPERTIES) {
          variableModeValues.push({ variableId: variableId[sub], modeId, value: subValues[sub] })
        }
        continue
      }

      if (isSyncableBorderToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const subEntries = figmaBorderSubEntriesFor(token.value.value)
        for (const sub of BORDER_SUB_PROPERTIES) {
          const entry = subEntries[sub]
          if (entry.kind === 'reference') continue // pass 2
          variableModeValues.push({ variableId: variableId[sub], modeId, value: entry.value })
        }
        continue
      }

      if (isSyncableTypographyToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const subEntries = figmaTypographySubEntriesFor(token.value.value, tokenIndex)
        for (const sub of TYPOGRAPHY_SUB_PROPERTIES) {
          const entry = subEntries[sub]
          if (entry.kind === 'reference') continue // pass 2
          variableModeValues.push({ variableId: variableId[sub], modeId, value: entry.value })
        }
        continue
      }

      // A standalone LineHeight `number` token (Global.Font.LineHeight.*, Alias.Text.LineHeight.*,
      // Component.*.LineHeight) is sent as a percentage string ("150%") for Figma's line-height
      // convention, same as typography's own lineHeight sub-value above — see figmaLiteralValueFor.
      variableModeValues.push({
        variableId: idByPath.get(pathKey(token.path)),
        modeId,
        value: figmaLiteralValueFor(token, token.value.value),
      })
    }
  }

  return { variables, variableModeValues }
}

/**
 * Pass 2: alias mode-values only. Call after `resolveTempIds` has patched
 * `idByPath` with pass 1's real ids — every variable this run touches
 * (existing or freshly created) has a real id by the time this runs.
 *
 * @param {object} params
 * @param {import('./tokens.mjs').Token[]} params.baseTokens
 * @param {Record<string, import('./tokens.mjs').Token[]>} params.brandTokensByName
 * @param {Map<string, string | Record<string, string>>} params.idByPath
 * @param {Record<string, string>} params.modeIdByBrand
 * @param {Record<string, string>} [params.modeIdByBreakpoint] Mobile/Tablet/Desktop mode ids in the
 *   responsive collection — only needed when a Device-eligible responsive dimension token is present
 * @param {import('./tokens.mjs').Token[]} [params.referenceTokens] read-only fallback for references (lib/alias.mjs)
 */
export function buildAliasPassPayload({
  baseTokens,
  brandTokensByName,
  idByPath,
  modeIdByBrand,
  modeIdByBreakpoint = {},
  referenceTokens = [],
}) {
  const tokenIndex = buildTokenIndex(baseTokens, referenceTokens)
  const variableModeValues = []

  // Device variables (MVP scope, isDeviceEligibleResponsiveDimensionToken) are written once per
  // token, not once per brand below — there's exactly one Device variable regardless of brand, and
  // its 3 breakpoint-mode values always alias the matching Mobile/Tablet/Desktop sibling (never a
  // literal; brand variance flows through the sibling's own brand modes, not a per-brand Device
  // value). RESPONSIVE_DIMENSION_SUB_PROPERTY_SUFFIX doubles as the sub-key -> breakpoint-mode-name
  // lookup here (its values, 'Mobile'/'Tablet'/'Desktop', are exactly the responsive collection's
  // mode names too).
  for (const token of baseTokens) {
    if (!isSyncableResponsiveDimensionToken(token) || !isDeviceEligibleResponsiveDimensionToken(token)) continue
    const variableId = idByPath.get(pathKey(token.path))
    const deviceId = variableId.device
    if (!deviceId) continue
    for (const sub of RESPONSIVE_DIMENSION_SUB_PROPERTIES) {
      const breakpointModeId = modeIdByBreakpoint[RESPONSIVE_DIMENSION_SUB_PROPERTY_SUFFIX[sub]]
      variableModeValues.push({
        variableId: deviceId,
        modeId: breakpointModeId,
        value: { type: 'VARIABLE_ALIAS', id: variableId[sub] },
      })
    }
  }

  for (const [brandName, tokens] of Object.entries(brandTokensByName)) {
    const modeId = modeIdByBrand[brandName]
    for (const token of tokens) {
      // Handled separately from the rest of this loop (which keys off `token.value.kind ===
      // 'reference'`, never true for a responsive dimension token's own top-level $value — decision
      // 4 keeps it a literal mirroring mobile) — a responsive dimension token's own variableId is a
      // {mobile, tablet, desktop} object, not a single string, so it must never reach the
      // single-id push at the bottom of this loop. Only the breakpoints buildCreatePassPayload left
      // for pass 2 (each a direct `{reference}`) are bound here, one VARIABLE_ALIAS per breakpoint.
      if (isSyncableResponsiveDimensionToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const subEntries = figmaResponsiveDimensionSubEntriesFor(token.responsive)
        for (const sub of RESPONSIVE_DIMENSION_SUB_PROPERTIES) {
          const entry = subEntries[sub]
          if (entry.kind !== 'reference') continue
          const target = tokenIndex.get(pathKey(entry.path))
          if (!target) {
            throw new Error(
              `Token ${pathKey(token.path)}'s ${sub} breakpoint references ${pathKey(entry.path)}, which does not exist.`,
            )
          }
          // Same "target must resolve to a single Figma variable" policy as the generic case below
          // — a breakpoint referencing another composite (shadow/border/typography/responsive
          // dimension) token has no single id to alias against unless it's itself Device-eligible,
          // so it's left unsynced rather than miswritten.
          const targetVariableId = aliasTargetIdFor(target, idByPath)
          const aliasId = singleAliasTargetId(targetVariableId)
          if (!aliasId) continue
          variableModeValues.push({
            variableId: variableId[sub],
            modeId,
            value: { type: 'VARIABLE_ALIAS', id: aliasId },
          })
        }
        continue
      }

      // Handled separately from the rest of this loop for the same reason as the responsive
      // dimension block above — a border token's own top-level $value is an object ({color, width,
      // style}, each possibly a `{reference}` string), never itself a `{reference}` string, so
      // `token.value.kind` is always 'literal' here and would otherwise never reach the generic
      // `token.value.kind === 'reference'` branch below. (A border token that IS itself a whole-
      // composite reference — e.g. `Zurich.Border.Composite.Grey` aliasing the entirety of
      // `Alias.Border.Composite.Grey` — has `token.value.kind === 'reference'` and is handled by
      // that generic branch instead, via its own isSyncableBorderToken check.)
      if (isSyncableBorderToken(token) && token.value.kind === 'literal') {
        const variableId = idByPath.get(pathKey(token.path))
        const subEntries = figmaBorderSubEntriesFor(token.value.value)
        for (const sub of BORDER_SUB_PROPERTIES) {
          const entry = subEntries[sub]
          if (entry.kind !== 'reference') continue
          const target = tokenIndex.get(pathKey(entry.path))
          if (!target) {
            throw new Error(
              `Token ${pathKey(token.path)}'s ${sub} references ${pathKey(entry.path)}, which does not exist.`,
            )
          }
          // Same "target must resolve to a single Figma variable" policy as the generic case below.
          const targetVariableId = aliasTargetIdFor(target, idByPath)
          const aliasId = singleAliasTargetId(targetVariableId)
          if (!aliasId) continue
          variableModeValues.push({
            variableId: variableId[sub],
            modeId,
            value: { type: 'VARIABLE_ALIAS', id: aliasId },
          })
        }
        continue
      }

      // Handled separately from the rest of this loop for the same reason as border's own block
      // above — a typography token's own top-level $value is an object, never itself a
      // `{reference}` string, so `token.value.kind` is always 'literal' here. letterSpacing is
      // excluded (never tagged 'reference' by figmaTypographySubEntriesFor): it's always a
      // percentage derived from two inputs (its own dimension and the composite's fontSize), not a
      // 1:1 copy of another variable's value, so there's no single Figma variable it could alias.
      if (isSyncableTypographyToken(token) && token.value.kind === 'literal') {
        const variableId = idByPath.get(pathKey(token.path))
        const subEntries = figmaTypographySubEntriesFor(token.value.value, tokenIndex)
        for (const sub of TYPOGRAPHY_SUB_PROPERTIES) {
          const entry = subEntries[sub]
          if (entry.kind !== 'reference') continue
          const target = tokenIndex.get(pathKey(entry.path))
          if (!target) {
            throw new Error(
              `Token ${pathKey(token.path)}'s ${sub} references ${pathKey(entry.path)}, which does not exist.`,
            )
          }
          const targetVariableId = aliasTargetIdFor(target, idByPath)
          const aliasId = singleAliasTargetId(targetVariableId)
          if (!aliasId) continue
          variableModeValues.push({
            variableId: variableId[sub],
            modeId,
            value: { type: 'VARIABLE_ALIAS', id: aliasId },
          })
        }
        continue
      }

      if (token.value.kind !== 'reference') continue

      const target = resolveAliasTarget(token, tokenIndex)

      if (isSyncableShadowToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const targetVariableId = aliasTargetIdFor(target, idByPath)
        for (const sub of SHADOW_SUB_PROPERTIES) {
          variableModeValues.push({
            variableId: variableId[sub],
            modeId,
            value: { type: 'VARIABLE_ALIAS', id: targetVariableId[sub] },
          })
        }
        continue
      }

      if (isSyncableBorderToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const targetVariableId = aliasTargetIdFor(target, idByPath)
        for (const sub of BORDER_SUB_PROPERTIES) {
          variableModeValues.push({
            variableId: variableId[sub],
            modeId,
            value: { type: 'VARIABLE_ALIAS', id: targetVariableId[sub] },
          })
        }
        continue
      }

      if (isSyncableTypographyToken(token)) {
        const variableId = idByPath.get(pathKey(token.path))
        const targetVariableId = aliasTargetIdFor(target, idByPath)
        for (const sub of TYPOGRAPHY_SUB_PROPERTIES) {
          variableModeValues.push({
            variableId: variableId[sub],
            modeId,
            value: { type: 'VARIABLE_ALIAS', id: targetVariableId[sub] },
          })
        }
        continue
      }

      // A responsive dimension token is handled above as `token` — it never reaches here as one
      // (this generic branch only sees `token.value.kind === 'reference'`, never true for a
      // responsive dimension token's own $value, decision 4). It *can* reach here as `target`,
      // though — e.g. a Component token (Component.Badge.Size.Base.Height) referencing a Device
      // responsive dimension token (Device.Text.Size.2XL) by whole value — which idByPath resolves
      // to a {mobile, tablet, desktop[, device]} object, not a single id on its own. If the target
      // is Device-eligible, its 'device' id IS the single collapsed variable to alias to; otherwise
      // there's no single Figma variable this could point at (which breakpoint would it mean?), so
      // it's skipped, same "not eligible" policy as an unsyncable shadow/border/typography target.
      const targetVariableId = aliasTargetIdFor(target, idByPath)
      const aliasId = singleAliasTargetId(targetVariableId)
      if (!aliasId) continue

      variableModeValues.push({
        variableId: idByPath.get(pathKey(token.path)),
        modeId,
        value: { type: 'VARIABLE_ALIAS', id: aliasId },
      })
    }
  }

  return { variableModeValues }
}

/**
 * Pass 3: description-only UPDATEs for already-synced variables (decision 9
 * — push always writes JSON's $description into Figma, including for
 * variables that already existed before this run and so never go through
 * buildCreatePassPayload's CREATE branch). Call after `resolveTempIds`, so
 * every variable this run touches — freshly created or pre-existing — has a
 * real id in `idByPath`. Base tokens only: description isn't per-brand.
 *
 * @param {object} params
 * @param {import('./tokens.mjs').Token[]} params.baseTokens
 * @param {Map<string, string | Record<string, string>>} params.idByPath
 * @param {Record<string, { description?: string }>} params.remoteVariablesById Figma's current
 *   local-variables meta.variables, keyed by id — this run's own CREATEs won't appear here yet
 *   (they didn't exist when this was fetched), so their description is always "different from
 *   remote" and gets folded into this pass redundantly with buildCreatePassPayload's CREATE —
 *   harmless, since Figma's UPDATE with the same description is a no-op.
 */
// Figma's REST API returns descriptions HTML-encoded (`&#39;`, `&quot;`, …) though they are stored
// and written as plain text — compare decoded, or every description with such a character is
// rewritten on every run. `&amp;` last, so `&amp;lt;` decodes to `&lt;`, not `<`.
function decodeHtmlEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function buildDescriptionUpdatePayload({ baseTokens, idByPath, remoteVariablesById }) {
  const variables = []
  const seenVariableIds = new Set()

  function pushIfChanged(id, description) {
    if (!id || isTempId(id) || seenVariableIds.has(id)) return
    seenVariableIds.add(id)
    const remoteDescription = decodeHtmlEntities(remoteVariablesById[id]?.description ?? '')
    if (remoteDescription === description) return
    variables.push({ action: 'UPDATE', id, description })
  }

  for (const token of baseTokens) {
    const key = pathKey(token.path)
    const variableId = idByPath.get(key)
    const description = token.description ?? ''

    if (
      isSyncableShadowToken(token) ||
      isSyncableBorderToken(token) ||
      isSyncableTypographyToken(token) ||
      isSyncableResponsiveDimensionToken(token)
    ) {
      const subProperties = subPropertiesForVariableIdShape(variableId)
      for (const sub of subProperties) {
        pushIfChanged(variableId[sub], description)
      }
      continue
    }

    pushIfChanged(variableId, description)
  }

  return { variables }
}

/**
 * Pass 4: name-only UPDATEs for already-synced variables whose token path has been renamed in
 * JSON since it was last pushed — mirrors buildDescriptionUpdatePayload's shape exactly (same
 * "call after resolveTempIds", same per-sub-property loop for composite types), but for `name`
 * instead of `description`. Without this, a token whose path changes (e.g. Global.Color.Black ->
 * Global.Color.BlackRename) keeps its existing variableId (identity is the id, not the path — see
 * docs/adr/0001-figma-variable-identity-key.md) and so never goes through buildCreatePassPayload's
 * CREATE branch, which is the only other place a Figma variable's `name` is ever written — leaving
 * the stale pre-rename name in Figma forever, silently, since every other check (mode-values,
 * description) still matches.
 *
 * @param {object} params
 * @param {import('./tokens.mjs').Token[]} params.baseTokens
 * @param {Map<string, string | Record<string, string>>} params.idByPath
 * @param {Record<string, { name?: string }>} params.remoteVariablesById Figma's current
 *   local-variables meta.variables, keyed by id — this run's own CREATEs won't appear here yet, but
 *   they already got their correct (post-rename) name from buildCreatePassPayload, so skipping an id
 *   with no remote entry (rather than treating `undefined !== expectedName` as a diff) is correct,
 *   not just harmless.
 */
export function buildNameUpdatePayload({ baseTokens, idByPath, remoteVariablesById }) {
  const variables = []
  const seenVariableIds = new Set()

  function pushIfChanged(id, expectedName) {
    if (!id || isTempId(id) || seenVariableIds.has(id)) return
    seenVariableIds.add(id)
    const remoteName = remoteVariablesById[id]?.name
    if (remoteName === undefined || remoteName === expectedName) return
    variables.push({ action: 'UPDATE', id, name: expectedName })
  }

  for (const token of baseTokens) {
    const key = pathKey(token.path)
    const variableId = idByPath.get(key)

    if (isSyncableShadowToken(token)) {
      for (const sub of SHADOW_SUB_PROPERTIES) {
        pushIfChanged(variableId[sub], figmaShadowSubVariableName(token.path, sub))
      }
      continue
    }

    if (isSyncableBorderToken(token)) {
      for (const sub of BORDER_SUB_PROPERTIES) {
        pushIfChanged(variableId[sub], figmaBorderSubVariableName(token.path, sub))
      }
      continue
    }

    if (isSyncableTypographyToken(token)) {
      for (const sub of TYPOGRAPHY_SUB_PROPERTIES) {
        pushIfChanged(variableId[sub], figmaTypographySubVariableName(token.path, sub))
      }
      continue
    }

    if (isSyncableResponsiveDimensionToken(token)) {
      for (const sub of RESPONSIVE_DIMENSION_SUB_PROPERTIES) {
        pushIfChanged(variableId[sub], figmaResponsiveDimensionSubVariableName(token.path, sub))
      }
      if (variableId.device) {
        pushIfChanged(variableId.device, figmaResponsiveDimensionDeviceVariableName(token.path))
      }
      continue
    }

    pushIfChanged(variableId, figmaVariableName(token.path))
  }

  return { variables }
}

/**
 * Finds tokens whose existing Figma variable(s) carry a different `resolvedType` than this run
 * expects — Figma can't change a variable's type after creation, so such a token has to be deleted
 * and recreated (e.g. LineHeight tokens moving from FLOAT to the "150%" STRING). Token-level, not
 * per-variable: a composite token's sub-variables are deleted and recreated together, since the
 * ones that still match would otherwise collide by name with their own recreated siblings.
 *
 * @param {import('./tokens.mjs').Token[]} baseTokens
 * @param {Record<string, { resolvedType: string }>} remoteVariablesById
 * @param {Map<string, string | Record<string, string>>} [idByPath] from assignVariableIds, so a variable
 *   a token only reaches by name is checked too; without it, only committed variableIds are
 * @returns {{ token: import('./tokens.mjs').Token, ids: string[] }[]} `ids` are every variableId of the
 *   token that exists in Figma (the ones to DELETE)
 */
export function findResolvedTypeMismatches(baseTokens, remoteVariablesById, idByPath) {
  const mismatches = []
  for (const token of baseTokens) {
    const variableId = idByPath?.get(pathKey(token.path)) ?? token.variableId
    if (!isPushableToken(token) || !variableId) continue
    const flattened = flattenVariableId(variableId).filter(({ id }) => !isTempId(id))
    const mismatched = flattened.some(({ id, subProperty }) => {
      const remote = remoteVariablesById[id]
      return remote && remote.resolvedType !== expectedResolvedTypeFor(token, subProperty)
    })
    if (mismatched) {
      mismatches.push({ token, ids: flattened.map(({ id }) => id).filter(id => remoteVariablesById[id]) })
    }
  }
  return mismatches
}

function expectedResolvedTypeFor(token, subProperty) {
  if (isSyncableShadowToken(token)) return SHADOW_SUB_PROPERTY_RESOLVED_TYPE[subProperty]
  if (isSyncableBorderToken(token)) return BORDER_SUB_PROPERTY_RESOLVED_TYPE[subProperty]
  if (isSyncableTypographyToken(token)) return TYPOGRAPHY_SUB_PROPERTY_RESOLVED_TYPE[subProperty]
  if (isSyncableResponsiveDimensionToken(token)) {
    return subProperty === 'device' ? 'FLOAT' : RESPONSIVE_DIMENSION_SUB_PROPERTY_RESOLVED_TYPE[subProperty]
  }
  return resolvedTypeForToken(token)
}

/**
 * Patches `idByPath` in place so every temp id assigned by
 * `assignVariableIds` is replaced with pass 1's real Figma id — pass 2 and
 * the newly-created-id collection below must never see a temp id again.
 */
export function resolveTempIds(idByPath, tempIdToRealId) {
  for (const [key, id] of idByPath) {
    if (isCompositeVariableIdSet(id)) {
      const subProperties = subPropertiesForVariableIdShape(id)
      const resolved = Object.fromEntries(
        subProperties.map(sub => [sub, id[sub] in tempIdToRealId ? tempIdToRealId[id[sub]] : id[sub]]),
      )
      idByPath.set(key, resolved)
      continue
    }
    if (id in tempIdToRealId) idByPath.set(key, tempIdToRealId[id])
  }
}

/**
 * Tokens whose Figma identity changed this run, as `{ path, variableId }` — what
 * docs/adr/0017-direct-commit-variableid-backfill.md's write-back commit needs. Two kinds: tokens
 * that had no `variableId` at the start of the run, and composite tokens whose id set was missing
 * sub-ids (added since, e.g. letterSpacing or `device`, or dropped as unknown) — for those,
 * `variableId` is the full completed id set, existing ids included, since the backfill replaces the
 * whole value. Call only after `resolveTempIds`, so every entry already holds a real Figma id, never
 * a temp one.
 */
export function collectNewlyCreatedIds(baseTokens, idByPath) {
  return baseTokens
    .filter(token => {
      if (!isPushableToken(token)) return false
      if (!token.variableId) return true
      const completed = idByPath.get(pathKey(token.path))
      if (!isCompositeVariableIdSet(token.variableId) || !isCompositeVariableIdSet(completed)) return false
      return Object.entries(completed).some(([sub, id]) => token.variableId[sub] !== id)
    })
    .map(token => ({ path: token.path, variableId: idByPath.get(pathKey(token.path)) }))
}
