// Naming-anatomy rules, ported from the retired ds-token-lint skill. Four of the original
// five rules, same logic (the "font-" prefix rule was dropped — see CATEGORY_WORDS).
// Only the entry point changed: instead of taking one Component-layer key chosen by the
// user on the CLI, ds-token-check's scan.js derives which key(s) a
// family's CODE actually touches (see deriveComponentKeys in scan.js) and calls
// checkNamingForKey once per derived key. See packages/tokens/CONTEXT.md "Token Naming
// Anatomy" for the canonical order this enforces: component-variant-element-category-property-state.

// Closed vocabulary for interaction/visual states. A sibling group is treated as a
// "state group" once at least half its children match this set — any child outside
// the set is then flagged as a likely typo (e.g. "Hoverr", "Actve").
const STATE_WORDS = new Set(['Base', 'Hover', 'Active', 'Disabled', 'Focus', 'Selected'])

// Closed vocabulary for the "category" segment in the canonical anatomy. Typography is
// deliberately excluded: it belongs in a composite `typography` token (`Typo`), whose
// generated sub-names (`-typo-font-family`, `-typo-line-height`, `-typo-text-decoration`,
// …) are canonical by construction. A former "font- prefix" rule that renamed standalone
// typography leaves (e.g. `LineHeight` → `Font.LineHeight`) was dropped for the same
// reason — the fix for those is a composite token, not a rename.
const CATEGORY_WORDS = new Set(['Color', 'Space'])

// Disallowed abbreviations in any path segment, keyed by their lowercased word form,
// mapped to the required full word.
const ABBREVIATIONS = { bg: 'background' }

function pascalToKebab(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function isPascalCase(key) {
  return /^[A-Z0-9][A-Za-z0-9]*$/.test(key)
}

function deriveCssVar(componentKebab, jsonPath) {
  const segments = jsonPath.map(pascalToKebab)
  return `--ds-${componentKebab}-${segments.join('-')}`
}

function collectLeaves(node, jsonPath, out) {
  if (!node || typeof node !== 'object') return
  if ('$value' in node) {
    out.push({ jsonPath: [...jsonPath], value: node.$value, type: node.$type })
    return
  }
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$')) continue
    collectLeaves(val, [...jsonPath, key], out)
  }
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}

function nearestStateWord(key) {
  let best = null
  let bestDist = Infinity
  for (const word of STATE_WORDS) {
    const dist = levenshtein(key.toLowerCase(), word.toLowerCase())
    if (dist < bestDist) {
      bestDist = dist
      best = word
    }
  }
  return { word: best, dist: bestDist }
}

function checkStateVocabulary(componentKebab, node, jsonPath, violations = []) {
  if (!node || typeof node !== 'object' || '$value' in node) return violations

  const childKeys = Object.keys(node).filter(k => !k.startsWith('$'))
  const stateLikeCount = childKeys.filter(k => STATE_WORDS.has(k)).length

  if (childKeys.length >= 2 && stateLikeCount >= Math.ceil(childKeys.length / 2)) {
    for (const key of childKeys) {
      if (STATE_WORDS.has(key)) continue
      const { word, dist } = nearestStateWord(key)
      if (dist > 0 && dist <= 2) {
        const currentPath = [...jsonPath, key]
        const proposedJsonPath = [...jsonPath, word]
        violations.push({
          type: 'state-typo',
          jsonPath: currentPath,
          proposedJsonPath,
          currentCssVar: deriveCssVar(componentKebab, currentPath),
          proposedCssVar: deriveCssVar(componentKebab, proposedJsonPath),
          message: `"${key}" looks like a misspelled state — sibling keys (${childKeys.filter(k => STATE_WORDS.has(k)).join(', ')}) suggest "${word}"`,
        })
      }
    }
  }

  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$')) continue
    checkStateVocabulary(componentKebab, val, [...jsonPath, key], violations)
  }
  return violations
}

function checkKeyCasing(componentKebab, node, jsonPath, violations = []) {
  if (!node || typeof node !== 'object' || '$value' in node) return violations

  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$')) continue

    if (!isPascalCase(key)) {
      const fixedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
      const currentPath = [...jsonPath, key]
      const proposedJsonPath = [...jsonPath, fixedKey]
      violations.push({
        type: 'key-casing',
        jsonPath: currentPath,
        proposedJsonPath,
        currentCssVar: deriveCssVar(componentKebab, currentPath),
        proposedCssVar: deriveCssVar(componentKebab, proposedJsonPath),
        message: `JSON key "${key}" is not PascalCase — the kebab-case CSS name derived from it may not match Style Dictionary's transform`,
      })
    }

    checkKeyCasing(componentKebab, val, [...jsonPath, key], violations)
  }
  return violations
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function looksLikeVariantGroup(siblingKeys) {
  if (siblingKeys.length < 2) return false
  const stateLikeCount = siblingKeys.filter(k => STATE_WORDS.has(k)).length
  return stateLikeCount < Math.ceil(siblingKeys.length / 2)
}

function classifySegments(rootNode, jsonPath) {
  const state = []
  const category = []
  const other = []
  let cursor = rootNode

  for (const seg of jsonPath) {
    const siblingKeys = cursor && typeof cursor === 'object' ? Object.keys(cursor).filter(k => !k.startsWith('$')) : []
    if (STATE_WORDS.has(seg) && !looksLikeVariantGroup(siblingKeys)) state.push(seg)
    else if (CATEGORY_WORDS.has(seg)) category.push(seg)
    else other.push(seg)
    cursor = cursor && typeof cursor === 'object' ? cursor[seg] : undefined
  }

  return { state, category, other }
}

function computeCanonicalOrder(rootNode, jsonPath) {
  const { state, category, other } = classifySegments(rootNode, jsonPath)

  if (other.length < 2) {
    if (state.length === 0) return null
    const nonState = jsonPath.filter(seg => !state.includes(seg))
    const required = [...nonState, ...state]
    return arraysEqual(required, jsonPath) ? null : required
  }

  const property = other[other.length - 1]
  const variantElement = other.slice(0, -1)
  const required = [...variantElement, ...category, property, ...state]
  return arraysEqual(required, jsonPath) ? null : required
}

function checkSegmentOrder(componentKebab, rootNode, leaves) {
  const violations = []
  for (const leaf of leaves) {
    const proposedJsonPath = computeCanonicalOrder(rootNode, leaf.jsonPath)
    if (!proposedJsonPath) continue

    violations.push({
      type: 'segment-order',
      jsonPath: leaf.jsonPath,
      proposedJsonPath,
      currentCssVar: deriveCssVar(componentKebab, leaf.jsonPath),
      proposedCssVar: deriveCssVar(componentKebab, proposedJsonPath),
      message:
        "Segment order doesn't match the canonical anatomy (component → variant → element → category → property → state) in packages/tokens/CONTEXT.md",
    })
  }
  return violations
}

function expandAbbreviatedSegment(segment) {
  const words = pascalToKebab(segment).split('-')
  let changed = false
  const expandedWords = words.map(word => {
    if (word in ABBREVIATIONS) {
      changed = true
      return ABBREVIATIONS[word]
    }
    return word
  })
  if (!changed) return null
  return expandedWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function checkAbbreviations(componentKebab, leaves) {
  const violations = []
  for (const leaf of leaves) {
    let changed = false
    const proposedJsonPath = leaf.jsonPath.map(segment => {
      const expanded = expandAbbreviatedSegment(segment)
      if (expanded === null) return segment
      changed = true
      return expanded
    })
    if (!changed) continue

    violations.push({
      type: 'abbreviation',
      jsonPath: leaf.jsonPath,
      proposedJsonPath,
      currentCssVar: deriveCssVar(componentKebab, leaf.jsonPath),
      proposedCssVar: deriveCssVar(componentKebab, proposedJsonPath),
      message: `"bg" is a disallowed abbreviation — use the full word "background"`,
    })
  }
  return violations
}

// Note: deliberately omits ds-token-lint's "color-variant-order" rule — that rule
// assumed every component's Color tree is still structured category-first (a
// migration-in-progress special case), which is subsumed by checkSegmentOrder's general
// anatomy check once a component's Color tree is fixed. Keeping both risked the exact
// "two rules propose conflicting restructurings" hazard the Font/category split already
// works around once; checkSegmentOrder alone is the long-term source of truth.

// Runs every rule against one Component-layer key's JSON subtree (e.g. data['🧩
// Component']['Tabs']). componentKebab is only used to render human-readable CSS var
// names in the report (e.g. "tabs"), not to re-derive the subtree.
function checkNamingForKey(componentKebab, componentNode) {
  const leaves = []
  collectLeaves(componentNode, [], leaves)

  return [
    ...checkStateVocabulary(componentKebab, componentNode, []),
    ...checkKeyCasing(componentKebab, componentNode, []),
    ...checkSegmentOrder(componentKebab, componentNode, leaves),
    ...checkAbbreviations(componentKebab, leaves),
  ]
}

module.exports = { checkNamingForKey, pascalToKebab, deriveCssVar }
