// ADR-0037 decision 6: every `$type: "typography"` token's `fontSize` must resolve, through any
// chain of `{reference}`s, to a 📱 Device.🔤 Text.Size.* token — no fixed/literal sizes, no size
// that only ever touches 🔗 Alias or 🌐 Global. Runs against the raw (pre-resolution) token tree,
// since by the time Style Dictionary resolves references the intermediate path is gone.
const DEVICE_TEXT_SIZE_PATH = ['📱 Device', '🔤 Text', 'Size']

type TokenNode = Record<string, unknown>

const isReference = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('{') && value.endsWith('}')

const parseReferencePath = (reference: string): string[] => reference.slice(1, -1).split('.')

const getNodeAtPath = (root: TokenNode, path: string[]): TokenNode | null => {
  let node: unknown = root
  for (const segment of path) {
    if (typeof node !== 'object' || node === null) return null
    node = (node as TokenNode)[segment]
  }
  return typeof node === 'object' && node !== null ? (node as TokenNode) : null
}

// Walks the reference chain starting at `value`, returning every intermediate path it passes
// through. An empty result means `value` was never a reference (a literal fontSize).
const resolveReferenceChain = (root: TokenNode, value: unknown): string[][] => {
  const chain: string[][] = []
  let current = value
  while (isReference(current)) {
    const path = parseReferencePath(current)
    chain.push(path)
    const node = getNodeAtPath(root, path)
    current = node?.['$value']
  }
  return chain
}

const touchesDeviceTextSize = (chain: string[][]): boolean =>
  chain.some(path => DEVICE_TEXT_SIZE_PATH.every((segment, i) => path[i] === segment))

// A typography token's own `$value` may be a whole-token alias (a reference string pointing at
// another typography token, e.g. `Hint.Heading → Heading.Level.3`) rather than the
// {fontFamily, ...} object directly. Follows that chain to the object that actually holds
// `fontSize`.
const resolveTypographyObject = (root: TokenNode, value: unknown): TokenNode | undefined => {
  let current = value
  while (isReference(current)) {
    const node = getNodeAtPath(root, parseReferencePath(current))
    current = node?.['$value']
  }
  return typeof current === 'object' && current !== null ? (current as TokenNode) : undefined
}

export interface TypographyFontSizeViolation {
  tokenPath: string
  fontSize: unknown
}

// Walks the whole token tree looking for `$type: "typography"` tokens and validates their
// `fontSize` sub-value. Returns one violation per offending token.
export const validateTypographyDeviceSize = (tokens: TokenNode): TypographyFontSizeViolation[] => {
  const violations: TypographyFontSizeViolation[] = []

  const walk = (node: unknown, path: string[]) => {
    if (typeof node !== 'object' || node === null) return
    const record = node as TokenNode

    if (record['$type'] === 'typography') {
      const fontSize = resolveTypographyObject(tokens, record['$value'])?.['fontSize']
      if (!touchesDeviceTextSize(resolveReferenceChain(tokens, fontSize))) {
        violations.push({ tokenPath: path.join('.'), fontSize })
      }
      return
    }

    for (const [key, child] of Object.entries(record)) {
      if (key.startsWith('$')) continue
      walk(child, [...path, key])
    }
  }

  walk(tokens, [])
  return violations
}
