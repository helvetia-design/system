/**
 * Resolves a `--ds-*` CSS custom property straight to its Figma variable id(s) — entirely
 * locally, from Base.tokens.json, with zero Figma API calls. Every token this repo has ever
 * pushed to Figma already carries its real variable id in
 * `$extensions["com.figma.variableId"]` (see lib/write.mjs's `assignVariableIds` / `figmaVariableName`
 * — that's the push side writing it; this is the read side consuming it). This file exists
 * because `ds-code-to-figma`'s Phase 1 token-resolution step used to answer "does a Figma
 * variable exist for this CSS var?" by enumerating Figma's *entire* `Design Tokens` /
 * `Design Responsive Tokens` collections (1,900+ variables) through `use_figma` and loosely
 * name-matching — slow, token-expensive, and redundant: the answer was already sitting in this
 * repo's own JSON.
 *
 * `tokenNameToCssVar` below is a deliberate duplicate of
 * packages/tokens/src/css-naming.ts's function of the same name — reimplemented here rather
 * than imported because this file runs as plain Node ESM (same constraint `tokens.mjs`'s own
 * header documents: this whole directory runs outside Style Dictionary's TS toolchain, see
 * docs/adr/0020-figma-sync-action-standalone-script.md). Keep the two in sync if the naming
 * transform ever changes; `test/css-token-lookup.test.mjs` cross-checks a sample against the
 * real compiled output to catch drift.
 */
import { kebabCase } from 'change-case'
import { flattenTokens, loadTokenFile } from './tokens.mjs'

/** Mirrors packages/tokens/src/css-naming.ts's tokenNameToCssVar exactly — see file header. */
export function tokenNameToCssVar(pathSegments, prefix = 'ds') {
  let tokenName = kebabCase([prefix, ...pathSegments].join(' '))

  if (pathSegments.includes('🧩 Component')) {
    tokenName = tokenName.replace('-component', '')
  }
  if (/-?([0-9]+)-(xl|xs)/.test(tokenName)) {
    tokenName = tokenName.replace(/-?([0-9]+)-(xl|xs)/, '-$1$2')
  }
  if (tokenName.includes('--')) {
    tokenName = tokenName.replace(/--+/g, '-')
  }
  return tokenName
}

/**
 * Builds the full `--ds-*` → token-metadata index from a `Base.tokens.json` path, once. Returns
 * a Map keyed by the bare CSS var name (no leading `--`) to
 * `{ path, cssVar, variableId, figmaScopes, type, description }` — `variableId` is a single
 * string for most tokens, or `{ mobile, tablet, desktop[, device] }` for a responsive-dimension
 * token, or `{ offsetX, offsetY, blur, spread, color }` / `{ color, width, style }` /
 * `{ fontFamily, fontSize, fontWeight, lineHeight }` for shadow/border/typography — same shapes
 * `lib/write.mjs` and `apps/toky/src/tokens/figma-map.ts` already use, not a new convention.
 * `variableId` is `undefined` for a token never pushed to Figma yet — treat that as the same
 * "resolve with the user, don't invent one" hard stop Phase 1 already applies to any missing
 * token, not a reason to fall back to a live Figma search.
 *
 * @param {string} basePath absolute or cwd-relative path to Base.tokens.json
 */
const RESPONSIVE_BREAKPOINTS = ['mobile', 'tablet', 'desktop']

function isResponsiveVariableId(variableId) {
  return typeof variableId === 'object' && variableId !== null && RESPONSIVE_BREAKPOINTS.every(bp => bp in variableId)
}

export function buildCssVarIndex(basePath) {
  const tree = loadTokenFile(basePath)
  const tokens = flattenTokens(tree)
  const index = new Map()

  for (const token of tokens) {
    const cssVar = tokenNameToCssVar(token.path)
    const entry = {
      path: token.path,
      cssVar: `--${cssVar}`,
      variableId: token.variableId,
      figmaScopes: token.figmaScopes,
      type: token.type,
      description: token.description,
    }
    index.set(cssVar, entry)

    // A responsive-dimension token's component code reads its 3 breakpoint values through
    // `-mobile`/`-tablet`/`-desktop`-suffixed CSS var names, not the bare one (see
    // packages/tokens/src/css-value.ts's RESPONSIVE_DIMENSION_SUFFIX_BY_BREAKPOINT and
    // formatter.ts's `ds/css/variables-responsive`) — the bare name above is the auto-switching
    // "Device"/collapsed variable (token.variableId.device, present once MVP-scoped), not what
    // `@include mobile`/`desktop`/etc. breakpoint mixins actually bind to in SCSS.
    if (isResponsiveVariableId(token.variableId)) {
      for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
        const suffixedVar = `${cssVar}-${breakpoint}`
        index.set(suffixedVar, {
          ...entry,
          cssVar: `--${suffixedVar}`,
          variableId: token.variableId[breakpoint],
          breakpoint,
        })
      }
    }
  }

  return index
}

/**
 * Convenience wrapper for the common case: look up one or more real `--ds-*` var names (with or
 * without the leading `--`) against an index built from `buildCssVarIndex`. Returns one entry per
 * input name, in order, `null` for anything not found (never synced, or not a real token name —
 * both are the caller's hard-stop case, not this function's to decide).
 *
 * @param {Map<string, object>} index from buildCssVarIndex
 * @param {string[]} cssVarNames
 */
export function resolveCssVars(index, cssVarNames) {
  return cssVarNames.map(name => index.get(name.replace(/^--/, '')) ?? null)
}

// CLI: `node css-token-lookup.mjs <Base.tokens.json path> --var <name> [--var <name> ...]`
// or `--all` to dump the whole index as JSON. Lets the skill resolve tokens with one Bash call
// instead of writing ad hoc Node/Figma-plugin code per run.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [basePath, ...rest] = process.argv.slice(2)
  if (!basePath) {
    console.error('Usage: css-token-lookup.mjs <Base.tokens.json path> [--var <cssVarName> ...] [--all]')
    process.exit(1)
  }
  const index = buildCssVarIndex(basePath)

  if (rest.includes('--all')) {
    console.log(JSON.stringify(Object.fromEntries(index), null, 2))
  } else {
    const names = []
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--var') names.push(rest[++i])
    }
    const results = Object.fromEntries(names.map(name => [name, index.get(name.replace(/^--/, '')) ?? null]))
    console.log(JSON.stringify(results, null, 2))
  }
}
