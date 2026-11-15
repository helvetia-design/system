import { describe, expect, it } from 'vitest'
import { buildSyncState } from '../lib/baseline.mjs'
import { buildCommentBody, COMMENT_MARKER, findConflicts } from '../lib/conflict.mjs'
import { figmaValueFor } from '../lib/figma-value.mjs'

const modeId = 'm-base'

function state(resolvedValue) {
  return {
    lastSyncedCommit: 'sha1',
    lastSyncedAt: '2026-01-01T00:00:00Z',
    entries: {
      'VariableID:1:1': {
        tokenPath: ['A'],
        resolvedValue,
        lastModifiedSource: 'code',
        lastModifiedAt: '2026-01-01T00:00:00Z',
      },
    },
  }
}

const baselineNumber = { kind: 'literal', value: 16 }

function token(value) {
  return { path: ['A'], type: 'number', value: { kind: 'literal', value }, variableId: 'VariableID:1:1' }
}

describe('findConflicts', () => {
  it('returns nothing when there is no baseline yet', () => {
    expect(
      findConflicts({ existingState: null, currentBaseTokens: [token(24)], figmaVariablesById: {}, modeId }),
    ).toEqual([])
  })

  it('is not a conflict when only GitHub changed (Figma still matches baseline)', () => {
    const conflicts = findConflicts({
      existingState: state(baselineNumber),
      currentBaseTokens: [token(24)],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: 16 } } },
      modeId,
    })
    expect(conflicts).toEqual([])
  })

  it('is not a conflict when only Figma changed (GitHub still matches baseline)', () => {
    const conflicts = findConflicts({
      existingState: state(baselineNumber),
      currentBaseTokens: [token(16)],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: 32 } } },
      modeId,
    })
    expect(conflicts).toEqual([])
  })

  it('is a conflict when both GitHub and Figma changed since baseline, to different values', () => {
    const conflicts = findConflicts({
      existingState: state(baselineNumber),
      currentBaseTokens: [token(24)],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: 32 } } },
      modeId,
    })
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({
      variableId: 'VariableID:1:1',
      tokenPath: ['A'],
      baselineValue: 16,
      githubValue: 24,
      figmaValue: 32,
    })
  })

  it('is not flagged as a conflict if both sides changed to the exact same value', () => {
    const conflicts = findConflicts({
      existingState: state(baselineNumber),
      currentBaseTokens: [token(24)],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: 24 } } },
      modeId,
    })
    expect(conflicts).toEqual([])
  })

  it('skips a token with no variableId (never synced)', () => {
    const unsynced = { path: ['B'], type: 'number', value: { kind: 'literal', value: 1 } }
    expect(
      findConflicts({
        existingState: state(baselineNumber),
        currentBaseTokens: [unsynced],
        figmaVariablesById: {},
        modeId,
      }),
    ).toEqual([])
  })

  it('skips a reference-kind token (out of scope for this pass, see module doc)', () => {
    const ref = {
      path: ['A'],
      type: 'color',
      value: { kind: 'reference', path: ['Global', 'White'] },
      variableId: 'VariableID:1:1',
    }
    expect(
      findConflicts({
        existingState: state({ kind: 'reference', path: ['x'] }),
        currentBaseTokens: [ref],
        figmaVariablesById: {},
        modeId,
      }),
    ).toEqual([])
  })

  it('skips a token whose variableId has no live Figma variable (deleted, or never actually pushed)', () => {
    const conflicts = findConflicts({
      existingState: state(baselineNumber),
      currentBaseTokens: [token(24)],
      figmaVariablesById: {},
      modeId,
    })
    expect(conflicts).toEqual([])
  })

  it('is not a conflict for a LineHeight number token whose raw value is unchanged — baseline and GitHub both map to the same Figma percent as the live value', () => {
    const lineHeightToken = {
      path: ['Alias', 'Text', 'LineHeight', 'Base'],
      type: 'number',
      value: { kind: 'literal', value: 1.3 },
      variableId: 'VariableID:1:1',
    }
    const conflicts = findConflicts({
      existingState: state({ kind: 'literal', value: 1.3 }),
      currentBaseTokens: [lineHeightToken],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: 130 } } },
      modeId,
    })
    expect(conflicts).toEqual([])
  })

  it('is a conflict for a LineHeight number token when GitHub and Figma genuinely disagree, comparing in percent terms', () => {
    const lineHeightToken = {
      path: ['Alias', 'Text', 'LineHeight', 'Base'],
      type: 'number',
      value: { kind: 'literal', value: 1.4 },
      variableId: 'VariableID:1:1',
    }
    const conflicts = findConflicts({
      existingState: state({ kind: 'literal', value: 1.3 }),
      currentBaseTokens: [lineHeightToken],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: 150 } } },
      modeId,
    })
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ baselineValue: 130, githubValue: 140, figmaValue: 150 })
  })

  function colorToken(components, alpha = 1) {
    return {
      path: ['Global', 'Color', 'Brand'],
      type: 'color',
      value: { kind: 'literal', value: { colorSpace: 'srgb', components, alpha, hex: '#000000' } },
      variableId: 'VariableID:1:1',
    }
  }

  it('is not a conflict when a color only drifted by float32 round-tripping (same byte-rounded channels)', () => {
    const baselineColor = {
      kind: 'literal',
      value: { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], alpha: 1, hex: '#808080' },
    }
    const conflicts = findConflicts({
      existingState: state(baselineColor),
      currentBaseTokens: [colorToken([0.5, 0.5, 0.5])],
      figmaVariablesById: {
        'VariableID:1:1': { valuesByMode: { [modeId]: { r: 0.5000000074505806, g: 0.5, b: 0.5, a: 1 } } },
      },
      modeId,
    })
    expect(conflicts).toEqual([])
  })

  it('is a conflict when a color genuinely disagrees beyond byte-rounding tolerance', () => {
    const baselineColor = {
      kind: 'literal',
      value: { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], alpha: 1, hex: '#808080' },
    }
    const conflicts = findConflicts({
      existingState: state(baselineColor),
      currentBaseTokens: [colorToken([0.6, 0.5, 0.5])],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: { r: 0.9, g: 0.5, b: 0.5, a: 1 } } } },
      modeId,
    })
    expect(conflicts).toHaveLength(1)
  })
})

describe('acceptance scenario: a value-only sync refreshes the baseline, so the next PR sees no conflict', () => {
  it("finds no conflict on a second PR that never touched the token, after the first PR's value-only change synced", () => {
    const staleColor = { colorSpace: 'srgb', components: [0.5, 0, 0], alpha: 1, hex: '#800000' }
    const newColor = { colorSpace: 'srgb', components: [0.6, 0, 0], alpha: 1, hex: '#990000' }
    const colorTokenAfterPr1 = {
      path: ['Global', 'Color', 'Brand'],
      type: 'color',
      value: { kind: 'literal', value: newColor },
      variableId: 'VariableID:1:1',
    }

    // PR1 merged a value-only change (no variableId added/removed) — the sync pushed `newColor`
    // to Figma and (per this fix) rebuilt the baseline from the full current tree.
    const refreshedState = buildSyncState({
      existingState: state({ kind: 'literal', value: staleColor }),
      baseTokens: [colorTokenAfterPr1],
      mergeCommitSha: 'pr1-merge-sha',
      syncedAt: '2026-02-01T00:00:00Z',
    })

    // PR2 opens untouched — Figma already reflects PR1's value, since the same sync wrote it there.
    const conflicts = findConflicts({
      existingState: refreshedState,
      currentBaseTokens: [colorTokenAfterPr1],
      figmaVariablesById: { 'VariableID:1:1': { valuesByMode: { [modeId]: figmaValueFor('color', newColor) } } },
      modeId,
    })

    expect(conflicts).toEqual([])
  })
})

describe('buildCommentBody', () => {
  it('always includes the marker, for find-or-update on re-runs', () => {
    expect(buildCommentBody([])).toContain(COMMENT_MARKER)
    expect(buildCommentBody([{ tokenPath: ['A'], baselineValue: 1, githubValue: 2, figmaValue: 3 }])).toContain(
      COMMENT_MARKER,
    )
  })

  it('reports "no conflicts" clearly when the list is empty', () => {
    expect(buildCommentBody([])).toMatch(/No conflicts detected/)
  })

  it('lists each conflicting token path in the body', () => {
    const body = buildCommentBody([
      { tokenPath: ['🌐 Global', 'Spacing', 'Lg'], baselineValue: 16, githubValue: 24, figmaValue: 32 },
    ])
    expect(body).toContain('🌐 Global.Spacing.Lg')
    expect(body).toMatch(/1 token\(s\)/)
  })
})
