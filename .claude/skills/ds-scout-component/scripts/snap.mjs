// Pure snap math for ds-scout-component: measured CSS value → nearest DS token.
// No browser, no I/O — tested by scripts/test/scout-snap.test.ts.

export const PX_TOLERANCE = 2
export const DELTA_E = { token: 3, drift: 10 }
export const BRANDS = ['green', 'purple', 'red', 'yellow']

// Computed-style property → token family. Order inside each family: Alias/Device first, Global last.
export const FAMILIES = {
  'space': [/^ds-alias-space-/, /^ds-device-space-/, /^ds-global-dimension-space-/],
  'radius': [/^ds-alias-radius-/, /^ds-global-dimension-radius-/],
  'text-size': [/^ds-alias-text-size-/, /^ds-device-text-size-/, /^ds-global-font-size-/],
  'border-width': [/^ds-alias-border-width-/, /^ds-global-dimension-border-/],
  'surface': [/^ds-alias-surface-/, /^ds-global-color-/],
  'text-color': [/^ds-alias-text-color-/, /^ds-global-color-/],
  'border-color': [/^ds-alias-border-color-/, /^ds-alias-interaction-focus-/, /^ds-global-color-/],
}

export function familyOf(prop) {
  if (/^(padding|margin)-/.test(prop) || /^(row-|column-)?gap$/.test(prop)) return 'space'
  if (/radius$/.test(prop)) return 'radius'
  if (prop === 'font-size') return 'text-size'
  if (/^(border-[a-z]+|outline)-width$/.test(prop)) return 'border-width'
  if (prop === 'background-color') return 'surface'
  if (prop === 'color') return 'text-color'
  if (/^(border-[a-z]+|outline)-color$/.test(prop)) return 'border-color'
  return null
}

// Per-device tokens (-mobile/-tablet/-desktop) are being retired for responsive ones.
const RETIRED = /-(mobile|tablet|desktop)$/

/** Candidates of one family, ranked: layer index (Alias/Device before Global). */
export function candidatesFor(family, tokens) {
  const rules = FAMILIES[family] ?? []
  const out = []
  for (const t of tokens) {
    if (RETIRED.test(t.name)) continue
    const layer = rules.findIndex(r => r.test(t.name))
    if (layer >= 0) out.push({ ...t, layer })
  }
  return out
}

// prefer: name fragment of the property's own token group ("padding" for padding-top), used as tie-break.
function best(scored, prefer) {
  const miss = s => (prefer && s.name.includes(`-${prefer}-`) ? 0 : 1)
  scored.sort((a, b) => a.delta - b.delta || a.layer - b.layer || miss(a) - miss(b))
  const [first] = scored
  if (!first) return null
  // Ambiguous: another token of the same layer is just as close.
  const ties = scored.filter(s => s !== first && s.layer === first.layer && Math.abs(s.delta - first.delta) < 0.01)
  return { first, ties: ties.map(t => t.name) }
}

/** px value → { token, status: token|drift|no-token, delta, global, ties, negative } — negative values (gutters) snap on |px|. */
export function snapPx(px, candidates, { tol = PX_TOLERANCE, prefer } = {}) {
  const abs = Math.abs(px)
  const hit = best(
    candidates.filter(c => typeof c.px === 'number').map(c => ({ ...c, delta: Math.abs(c.px - abs) })),
    prefer,
  )
  if (!hit) return { status: 'no-token', delta: null }
  const { first, ties } = hit
  const status = first.delta < 0.5 ? 'token' : first.delta <= tol ? 'drift' : 'no-token'
  return {
    token: status === 'no-token' ? null : first.name,
    nearest: first.name,
    status,
    delta: round(abs - first.px),
    global: first.name.startsWith('ds-global-'),
    ties,
    ...(px < 0 && { negative: true }),
  }
}

/** Token group a property prefers on a tie: padding-top → "padding", column-gap → "gap". */
export function preferFor(prop) {
  return /^(padding|margin)/.exec(prop)?.[1] ?? (/gap$/.test(prop) ? 'gap' : undefined)
}

/** "rgb(1, 2, 3)" / "rgba(1, 2, 3, 0.5)" / "#rrggbb" → [r, g, b, a] or null */
export function parseColor(str) {
  if (!str) return null
  const hex = /^#([0-9a-f]{6})$/i.exec(str.trim())
  if (hex) return [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)).concat(1)
  const m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(str.trim())
  if (!m) return null
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
  return [+m[1], +m[2], +m[3], a]
}

function toLab([r, g, b]) {
  const lin = c => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const f = t => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047)
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B)
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

/** CIE ΔE 2000 color difference of two [r, g, b] triples. */
export function deltaE(c1, c2) {
  const [L1, a1, b1] = toLab(c1)
  const [L2, a2, b2] = toLab(c2)
  const rad = Math.PI / 180
  const C1 = Math.hypot(a1, b1),
    C2 = Math.hypot(a2, b2)
  const Cb7 = ((C1 + C2) / 2) ** 7
  const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + 25 ** 7)))
  const ap1 = a1 * (1 + G),
    ap2 = a2 * (1 + G)
  const Cp1 = Math.hypot(ap1, b1),
    Cp2 = Math.hypot(ap2, b2)
  const h = (b, a) => (b === 0 && a === 0 ? 0 : (Math.atan2(b, a) / rad + 360) % 360)
  const hp1 = h(b1, ap1),
    hp2 = h(b2, ap2)
  const dL = L2 - L1,
    dC = Cp2 - Cp1
  let dh = 0
  if (Cp1 * Cp2 !== 0) dh = hp2 - hp1 > 180 ? hp2 - hp1 - 360 : hp2 - hp1 < -180 ? hp2 - hp1 + 360 : hp2 - hp1
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh / 2) * rad)
  const Lb = (L1 + L2) / 2,
    Cb = (Cp1 + Cp2) / 2
  let hb = hp1 + hp2
  if (Cp1 * Cp2 !== 0)
    hb = Math.abs(hp1 - hp2) > 180 ? (hp1 + hp2 + (hp1 + hp2 < 360 ? 360 : -360)) / 2 : (hp1 + hp2) / 2
  const T =
    1 -
    0.17 * Math.cos((hb - 30) * rad) +
    0.24 * Math.cos(2 * hb * rad) +
    0.32 * Math.cos((3 * hb + 6) * rad) -
    0.2 * Math.cos((4 * hb - 63) * rad)
  const dTheta = 30 * Math.exp(-(((hb - 275) / 25) ** 2))
  const RC = 2 * Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7))
  const SL = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2)
  const SC = 1 + 0.045 * Cb,
    SH = 1 + 0.015 * Cb * T
  const RT = -Math.sin(2 * dTheta * rad) * RC
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))
}

/** color string → { token, status, deltaE, global, ties } */
export function snapColor(str, candidates, th = DELTA_E) {
  const c = parseColor(str)
  if (!c) return { status: 'no-token', deltaE: null }
  const hit = best(
    candidates
      .map(t => ({ ...t, rgba: parseColor(t.color) }))
      .filter(t => t.rgba && Math.abs(t.rgba[3] - c[3]) < 0.05)
      .map(t => ({ ...t, delta: deltaE(c, t.rgba) })),
  )
  if (!hit) return { status: 'no-token', deltaE: null }
  const { first, ties } = hit
  const status = first.delta <= th.token ? 'token' : first.delta <= th.drift ? 'drift' : 'no-token'
  return {
    token: status === 'no-token' ? null : first.name,
    nearest: first.name,
    status,
    deltaE: round(first.delta),
    global: first.name.startsWith('ds-global-'),
    ties,
  }
}

/** WCAG 2.x contrast ratio of two color strings (alpha ignored). */
export function contrast(fg, bg) {
  const L = s => {
    const [r, g, b] = parseColor(s).map(c => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [a, b] = [L(fg), L(bg)].sort((x, y) => y - x)
  return round((a + 0.05) / (b + 0.05))
}

/** "ds-alias-surface-green-light" → { green: …-green-light, purple: …-purple-light, … } or null */
export function brandSiblings(tokenName) {
  const m = new RegExp(`^(ds-alias-surface-)(${BRANDS.join('|')})(-.*)?$`).exec(tokenName ?? '')
  if (!m) return null
  return Object.fromEntries(BRANDS.map(b => [b, `${m[1]}${b}${m[3] ?? ''}`]))
}

export function round(n) {
  return Math.round(n * 100) / 100
}
