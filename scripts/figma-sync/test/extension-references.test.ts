import { describe, expect, it } from 'vitest'
import {
  buildExtensionReferenceCommentBody,
  collectReferencePaths,
  EXTENSION_REFERENCE_COMMENT_MARKER,
  findRemovedExtensionReferences,
} from '../lib/extension-references.mjs'
import { flattenTokens } from '../lib/tokens.mjs'

function coreTree(...names: string[]) {
  return { Core: Object.fromEntries(names.map(name => [name, { $type: 'color', $value: '#000000' }])) }
}

const core = (...names: string[]) => flattenTokens(coreTree(...names))

function extension(tree: Record<string, unknown>) {
  return flattenTokens({ Ext: tree })
}

const colorRef = (target: string) => ({ $type: 'color', $value: `{${target}}` })

describe('findRemovedExtensionReferences', () => {
  it('reports a whole-value reference to a core token removed in head', () => {
    const findings = findRemovedExtensionReferences({
      extensionTokens: extension({ Brand: colorRef('Core.Red') }),
      baseTokens: core('Red', 'Blue'),
      headTokens: core('Blue'),
    })
    expect(findings).toEqual([{ extensionTokenPath: ['Ext', 'Brand'], referencePath: ['Core', 'Red'] }])
  })

  it('reports the old path when a core token is renamed', () => {
    const findings = findRemovedExtensionReferences({
      extensionTokens: extension({ Brand: colorRef('Core.Red') }),
      baseTokens: core('Red'),
      headTokens: core('Crimson'),
    })
    expect(findings.map(f => f.referencePath)).toEqual([['Core', 'Red']])
  })

  it('ignores a reference that still exists in head', () => {
    const findings = findRemovedExtensionReferences({
      extensionTokens: extension({ Brand: colorRef('Core.Red') }),
      baseTokens: core('Red'),
      headTokens: core('Red', 'Blue'),
    })
    expect(findings).toEqual([])
  })

  it('ignores a reference that is already missing on base', () => {
    const findings = findRemovedExtensionReferences({
      extensionTokens: extension({ Brand: colorRef('Core.Gone') }),
      baseTokens: core('Red'),
      headTokens: core('Red'),
    })
    expect(findings).toEqual([])
  })

  it('ignores a reference to an own extension token whose path core removes', () => {
    const extensionTokens = extension({ Brand: colorRef('Core.Red'), Alias: colorRef('Ext.Brand') })
    const findings = findRemovedExtensionReferences({
      extensionTokens,
      baseTokens: [...core('Red'), ...extensionTokens],
      headTokens: core('Red'),
    })
    expect(findings).toEqual([])
  })

  it('reports border sub-value and responsive breakpoint references', () => {
    const findings = findRemovedExtensionReferences({
      extensionTokens: extension({
        Border: {
          $type: 'border',
          $value: { color: '{Core.Red}', width: '1px', style: 'solid' },
        },
        Space: {
          $type: 'dimension',
          $value: '8px',
          $extensions: { 'com.helvetia.responsive': { mobile: '{Core.Small}', desktop: '{Core.Large}' } },
        },
      }),
      baseTokens: core('Red', 'Small', 'Large'),
      headTokens: core('Large'),
    })
    expect(findings).toEqual([
      { extensionTokenPath: ['Ext', 'Border'], referencePath: ['Core', 'Red'] },
      { extensionTokenPath: ['Ext', 'Space'], referencePath: ['Core', 'Small'] },
    ])
  })

  it('reports duplicates once and sorts by extension token then reference', () => {
    const findings = findRemovedExtensionReferences({
      extensionTokens: extension({
        Zeta: colorRef('Core.A'),
        Alpha: {
          $type: 'border',
          $value: { color: '{Core.B}', width: '{Core.A}', style: '{Core.A}' },
        },
      }),
      baseTokens: core('A', 'B'),
      headTokens: core(),
    })
    expect(findings.map(f => [f.extensionTokenPath.join('.'), f.referencePath.join('.')])).toEqual([
      ['Ext.Alpha', 'Core.A'],
      ['Ext.Alpha', 'Core.B'],
      ['Ext.Zeta', 'Core.A'],
    ])
  })
})

describe('collectReferencePaths', () => {
  it('returns no paths for a plain literal', () => {
    const [token] = extension({ Plain: { $type: 'color', $value: '#ffffff' } })
    expect(collectReferencePaths(token)).toEqual([])
  })

  it('finds references inside an array value', () => {
    const [token] = extension({
      Shadow: { $type: 'shadow', $value: [{ color: '{Core.Red}' }, { color: '{Core.Blue}' }] },
    })
    expect(collectReferencePaths(token)).toEqual([
      ['Core', 'Red'],
      ['Core', 'Blue'],
    ])
  })
})

describe('buildExtensionReferenceCommentBody', () => {
  it('lists each extension token with the removed core token', () => {
    const body = buildExtensionReferenceCommentBody([
      { extensionTokenPath: ['Ext', 'Brand'], referencePath: ['Core', 'Red'] },
    ])
    expect(body).toBe(
      `${EXTENSION_REFERENCE_COMMENT_MARKER}\n### 🔍 Figma Extension Reference Check\n\n` +
        '1 extension token(s) in `helvetia-design/extensions` reference core tokens this PR removes or renames. ' +
        'The next extension sync fails until extensions is updated. ' +
        'This does not block the merge (see docs/adr/0018-non-blocking-conflict-check.md).\n\n' +
        '| Extension token | Removed core token |\n| --- | --- |\n| `Ext.Brand` | `Core.Red` |',
    )
  })

  it('escapes pipe characters in token names', () => {
    const body = buildExtensionReferenceCommentBody([
      { extensionTokenPath: ['Ext', 'A|B'], referencePath: ['Core', 'Red'] },
    ])
    expect(body).toContain('| `Ext.A\\|B` | `Core.Red` |')
  })

  it('returns a resolved body without findings', () => {
    const body = buildExtensionReferenceCommentBody([])
    expect(body).toContain(EXTENSION_REFERENCE_COMMENT_MARKER)
    expect(body).toContain('No extension token references')
  })
})
