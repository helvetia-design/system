#!/usr/bin/env node
// Measure the Streamline set as AGGREGATE metrics only (brief gate decision 1 exception) — phase 0 replaces the
// DNA v1 estimates with these. Prints distributions, never coordinates or per-icon geometry.
//
//   node measure.mjs [--icons <packages/assets/src/icons>]
//   node measure.mjs --self-test
//
// Every file is normalized to the 14 grid from its own viewBox and rasterized at PX px/unit. Thickness and gap are
// read off a distance transform: a ridge pixel (local max) of the ink is the middle of a stroke, of the background
// the middle of a gap. Gaps count only inside the ink's bounding box and up to MAX_GAP wide (wider = open space).
// Skipped: the social logos (sourced, not Core Solid) and any name in draw/source/ (ours).
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { SKILL, ck, parseSvg, toPath, normalize, listSvgs } from './lib.mjs'

const GRID = 14
const PX = 20 // px per grid unit: 0.05-unit resolution
const MAX_GAP = 4
const SOCIAL = [
  'facebook',
  'github',
  'instagram',
  'linkedin',
  'pinterest',
  'tiktok',
  'whats-app',
  'x',
  'xing',
  'youtube',
]

function inkPath(text) {
  const { root, shapes } = parseSvg(text)
  let ink = null
  for (const s of shapes) {
    if (s.inDefs || s.inMask) continue
    const p = toPath(s).makeAsWinding()
    ink = ink ? ck.Path.MakeFromOp(ink, p, ck.PathOp.Union) : p
  }
  if (!ink) throw new Error('no shapes')
  return normalize(ink, root, GRID)
}

function raster(p) {
  const n = GRID * PX
  const surface = ck.MakeSurface(n, n)
  const canvas = surface.getCanvas()
  const paint = new ck.Paint()
  paint.setAntiAlias(false)
  canvas.scale(PX, PX)
  canvas.drawPath(p, paint)
  const px = canvas.readPixels(0, 0, {
    width: n,
    height: n,
    colorType: ck.ColorType.RGBA_8888,
    alphaType: ck.AlphaType.Unpremul,
    colorSpace: ck.ColorSpace.SRGB,
  })
  surface.delete()
  const ink = new Uint8Array(n * n)
  for (let i = 0; i < ink.length; i++) ink[i] = px[i * 4 + 3] > 127 ? 1 : 0
  return { ink, n }
}

// Exact Euclidean distance (px) from each pixel with mask=1 to the nearest pixel with mask=0 (Felzenszwalb).
function edt(mask, n) {
  const INF = 1e9
  const f = new Float64Array(n * n)
  for (let i = 0; i < f.length; i++) f[i] = mask[i] ? INF : 0
  const line = (get, set) => {
    const d = new Float64Array(n),
      v = new Int32Array(n),
      z = new Float64Array(n + 1)
    let k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    for (let q = 1; q < n; q++) {
      let s
      while ((s = (get(q) + q * q - (get(v[k]) + v[k] * v[k])) / (2 * q - 2 * v[k])) <= z[k]) k--
      k++
      v[k] = q
      z[k] = s
      z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++
      d[q] = (q - v[k]) ** 2 + get(v[k])
    }
    for (let q = 0; q < n; q++) set(q, d[q])
  }
  for (let x = 0; x < n; x++)
    line(
      y => f[y * n + x],
      (y, val) => (f[y * n + x] = val),
    )
  for (let y = 0; y < n; y++)
    line(
      x => f[y * n + x],
      (x, val) => (f[y * n + x] = val),
    )
  return f.map(Math.sqrt)
}

// Widths (grid units) at the ridge of a distance field: a run of w px has its middle pixel at (w+1)/2 from outside.
function ridgeWidths(dt, n, keep = () => true) {
  const out = []
  for (let y = 1; y < n - 1; y++)
    for (let x = 1; x < n - 1; x++) {
      const v = dt[y * n + x]
      if (!v || !keep(x, y)) continue
      let ridge = true
      for (let dy = -1; dy <= 1 && ridge; dy++)
        for (let dx = -1; dx <= 1; dx++) if (dt[(y + dy) * n + x + dx] > v) ridge = false
      if (ridge) out.push((2 * v - 1) / PX)
    }
  return out
}

const q = (a, p) => {
  if (!a.length) return NaN
  const s = [...a].sort((x, y) => x - y)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]
}

// Radius of the circle through the start, middle and end of each curve segment (conics = Skia arcs, cubics).
function curveRadii(p) {
  const c = p.toCmds(),
    ARGS = [2, 2, 4, 5, 6, 0],
    out = []
  let px = 0,
    py = 0
  for (let i = 0; i < c.length;) {
    const verb = c[i++],
      a = c.slice(i, i + ARGS[verb])
    i += ARGS[verb]
    let m = null,
      e = null
    if (verb === 3) {
      const w = a[4]
      m = [(px + 2 * w * a[0] + a[2]) / (2 + 2 * w), (py + 2 * w * a[1] + a[3]) / (2 + 2 * w)]
      e = [a[2], a[3]]
    } else if (verb === 2) {
      m = [(px + 2 * a[0] + a[2]) / 4, (py + 2 * a[1] + a[3]) / 4]
      e = [a[2], a[3]]
    } else if (verb === 4) {
      m = [(px + 3 * a[0] + 3 * a[2] + a[4]) / 8, (py + 3 * a[1] + 3 * a[3] + a[5]) / 8]
      e = [a[4], a[5]]
    }
    if (m) {
      const A = Math.hypot(m[0] - px, m[1] - py),
        B = Math.hypot(e[0] - m[0], e[1] - m[1]),
        C = Math.hypot(e[0] - px, e[1] - py)
      const area2 = Math.abs((m[0] - px) * (e[1] - py) - (m[1] - py) * (e[0] - px))
      if (area2 > 1e-6 && C > 0.05) out.push((A * B * C) / (2 * area2))
    }
    if (verb !== 5 && verb !== undefined) [px, py] = verb === 0 || verb === 1 ? a.slice(-2) : e
  }
  return out
}

export function measure(text) {
  const p = inkPath(text)
  const { ink, n } = raster(p)
  const [l, t, r, b] = p.computeTightBounds()
  const bx = [l, t, r, b].map(v => v * PX)
  let area = 0,
    cx = 0,
    cy = 0
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (ink[y * n + x]) {
        area++
        cx += x + 0.5
        cy += y + 0.5
      }
  const bg = ink.map(v => 1 - v)
  const thick = ridgeWidths(edt(ink, n), n)
  const gaps = ridgeWidths(edt(bg, n), n, (x, y) => x > bx[0] && x < bx[2] && y > bx[1] && y < bx[3]).filter(
    g => g <= MAX_GAP,
  )
  const cmds = p.toCmds()
  let verbs = 0,
    subpaths = 0
  for (let i = 0; i < cmds.length;) {
    const verb = cmds[i++]
    i += [2, 2, 4, 5, 6, 0][verb]
    verbs++
    if (verb === 0) subpaths++
  }
  const units = area / PX / PX
  return {
    radii: curveRadii(p).filter(v => v <= 3),
    thickMin: q(thick, 0.05),
    thickMed: q(thick, 0.5),
    gapMin: q(gaps, 0.05),
    gapMed: q(gaps, 0.5),
    fill: units / GRID / GRID,
    fillBox: units / ((r - l) * (b - t)),
    padding: Math.min(l, t, GRID - r, GRID - b),
    dx: cx / area / PX - GRID / 2,
    dy: cy / area / PX - GRID / 2,
    verbs,
    subpaths,
  }
}

const f2 = v => (Number.isFinite(v) ? v.toFixed(2) : '–')

export function table(results) {
  const col = (k, fn = x => x) => results.map(r => fn(r[k])).filter(Number.isFinite)
  const rows = [
    ['shape thickness, min (p5) per icon', col('thickMin')],
    ['shape thickness, median per icon', col('thickMed')],
    ['gap, min (p5) per icon', col('gapMin')],
    ['gap, median per icon', col('gapMed')],
    ['curve radius ≤ 3, all curves', results.flatMap(r => r.radii)],
    ['fill ratio of 14×14', col('fill')],
    ['fill ratio of own bbox', col('fillBox')],
    ['bbox padding (min side)', col('padding')],
    ['optical centre offset x (+ = right)', col('dx')],
    ['optical centre offset y (+ = down)', col('dy')],
    ['optical centre offset |d|', results.map(r => Math.hypot(r.dx, r.dy))],
    ['path commands', col('verbs')],
    ['subpaths', col('subpaths')],
  ]
  const head = '| metric (14-grid units) | n | min | p25 | median | p75 | max |\n|---|--:|--:|--:|--:|--:|--:|'
  const body = rows.map(
    ([k, a]) => `| ${k} | ${a.length} | ${[0, 0.25, 0.5, 0.75, 1].map(p => f2(q(a, p))).join(' | ')} |`,
  )
  const modes = Object.entries(
    results
      .flatMap(r => r.radii)
      .reduce(
        (m, v) => ((m[(Math.round(v * 4) / 4).toFixed(2)] = (m[(Math.round(v * 4) / 4).toFixed(2)] || 0) + 1), m),
        {},
      ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, c]) => `${k} ×${c}`)
    .join(', ')
  return `${head}\n${body.join('\n')}\n\ncurve radius modes (0.25 buckets): ${modes}`
}

function selfTest() {
  // ring: 14 box, outer 2..12, inner 3.5..10.5 → thickness 1.5; two 1-unit gaps between bars; rounded corner r 1
  const ring = measure(
    '<svg viewBox="0 0 14 14"><path fill-rule="evenodd" d="M2 2H12V12H2ZM3.5 3.5V10.5H10.5V3.5Z"/></svg>',
  )
  assert.ok(Math.abs(ring.thickMed - 1.5) < 0.1, `ring thickness ${ring.thickMed}`)
  assert.ok(Math.abs(ring.padding - 2) < 1e-6, `ring padding ${ring.padding}`)
  assert.ok(Math.abs(ring.fill - 51 / 196) < 0.01, `ring fill ${ring.fill}`)
  assert.ok(Math.hypot(ring.dx, ring.dy) < 0.05, 'ring is centred')
  const bars = measure(
    '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="2" height="12"/><rect x="5" y="2" width="2" height="12"/><rect x="8" y="2" width="2" height="12"/></svg>',
  )
  // 16 viewBox → 14: gap 1 → 0.875, bar 2 → 1.75
  assert.ok(Math.abs(bars.gapMed - 0.875) < 0.1, `bars gap ${bars.gapMed}`)
  assert.ok(Math.abs(bars.thickMed - 1.75) < 0.1, `bars thickness ${bars.thickMed}`)
  assert.ok(bars.dx < -0.5, 'bars sit left of centre')
  const round = measure('<svg viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="1"/></svg>')
  assert.ok(round.radii.length === 4 && round.radii.every(r => Math.abs(r - 1) < 0.01), `radii ${round.radii}`)
  console.log('self-test ok: thickness, gap, padding, fill, centre, radius')
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest()
  const i = argv.indexOf('--icons')
  const icons = path.resolve(i === -1 ? path.resolve(SKILL, '../../../packages/assets/src/icons') : argv[i + 1])
  const ours = new Set(listSvgs(path.join(icons, 'draw', 'source')))
  const svgDir = path.join(icons, 'svg')
  const files = listSvgs(svgDir).filter(f => !ours.has(f) && !SOCIAL.includes(f.replace(/(@\d+)?\.svg$/, '')))
  const results = []
  for (const f of files) {
    try {
      results.push(measure(fs.readFileSync(path.join(svgDir, f), 'utf8')))
    } catch (e) {
      console.error(`skipped ${f}: ${e.message}`)
    }
  }
  console.log(`${results.length} Streamline icons, normalized to the ${GRID} grid, ${PX} px/unit\n`)
  console.log(table(results))
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2))
