// Shared helpers for flatten.mjs and overlap-check.mjs.
// canvaskit-wasm = Google's Skia (stroker + PathOps): maintained, robust stroke expansion and boolean ops, keeps curves.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import CanvasKitInit from 'canvaskit-wasm'

export const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const ck = await CanvasKitInit()

const SHAPES = ['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect']
const attrsOf = s => Object.fromEntries([...s.matchAll(/([:\w-]+)\s*=\s*"([^"]*)"/g)].map(m => [m[1], m[2]]))

// Flat walk of an SVG: root attrs + every shape with the attrs it inherits from its ancestors and whether it sits in a <mask>.
export function parseSvg(text) {
  const clean = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[\s\S]*?\?>/g, '')
  const stack = []
  const shapes = []
  let root = null
  for (const [, close, tag, rest, self] of clean.matchAll(/<\s*(\/?)([\w:-]+)([^>]*?)(\/?)\s*>/g)) {
    if (close) {
      stack.pop()
      continue
    }
    const own = attrsOf(rest)
    if (tag === 'svg' && !root) root = own
    const inherited = Object.assign({}, ...stack.map(s => s.attrs), own)
    if (SHAPES.includes(tag))
      shapes.push({
        tag,
        own,
        attrs: inherited,
        inMask: stack.some(s => s.tag === 'mask'),
        inDefs: stack.some(s => ['defs', 'clipPath'].includes(s.tag)),
      })
    if (!self) stack.push({ tag, attrs: tag === 'mask' ? {} : own })
  }
  if (!root) throw new Error('No <svg> root element')
  return { root, shapes }
}

const n = v => (v === undefined || v === '' ? 0 : Number(v))

export function toD({ tag, own: a }) {
  switch (tag) {
    case 'path':
      return a.d || ''
    case 'line':
      return `M${n(a.x1)} ${n(a.y1)}L${n(a.x2)} ${n(a.y2)}`
    case 'polyline':
    case 'polygon':
      return (
        'M' +
        (a.points || '')
          .trim()
          .split(/[\s,]+/)
          .reduce((s, v, i) => s + (i % 2 ? ` ${v}` : i ? `L${v}` : v), '') +
        (tag === 'polygon' ? 'Z' : '')
      )
    case 'circle':
    case 'ellipse': {
      const cx = n(a.cx),
        cy = n(a.cy),
        rx = n(a.rx ?? a.r),
        ry = n(a.ry ?? a.r)
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`
    }
    case 'rect': {
      const x = n(a.x),
        y = n(a.y),
        w = n(a.width),
        h = n(a.height)
      const rx = Math.min(n(a.rx ?? a.ry), w / 2),
        ry = Math.min(n(a.ry ?? a.rx), h / 2)
      if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`
      return (
        `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}` +
        `H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`
      )
    }
  }
  return ''
}

export function toPath(shape) {
  const p = ck.Path.MakeFromSVGString(toD(shape))
  if (!p) throw new Error(`Unparseable <${shape.tag}>`)
  if (shape.attrs['fill-rule'] === 'evenodd') p.setFillType(ck.FillType.EvenOdd)
  return p
}

// Points per verb in toCmds(): move, line, quad, conic (+weight), cubic, close.
const ARGS = [2, 2, 4, 5, 6, 0]

// Every absolute coordinate pair (end and control points) of a path.
export function points(p) {
  const c = p.toCmds()
  const out = []
  for (let i = 0; i < c.length;) {
    const verb = c[i++],
      k = ARGS[verb]
    for (let j = 0; j < (verb === 3 ? 4 : k); j += 2) out.push([c[i + j], c[i + j + 1]])
    i += k
  }
  return out
}

// Affine map x' = x*s + tx (same for y); conic weights untouched.
export function transform(p, s, tx, ty) {
  const c = Array.from(p.toCmds())
  for (let i = 0; i < c.length;) {
    const verb = c[i++],
      k = ARGS[verb]
    for (let j = 0; j < (verb === 3 ? 4 : k); j += 2) {
      c[i + j] = c[i + j] * s + tx
      c[i + j + 1] = c[i + j + 1] * s + ty
    }
    i += k
  }
  return ck.Path.MakeFromCmds(c)
}

// Path data rounded to 3 decimals. Conics (Skia's arcs) become one cubic each: toSVGString() would split them into dozens of quads.
export function toSvgD(p) {
  const c = p.toCmds(),
    r = v => String(Math.round(v * 1000) / 1000),
    xy = (x, y) => `${r(x)} ${r(y)}`
  let d = '',
    px = 0,
    py = 0
  for (let i = 0; i < c.length;) {
    const verb = c[i++],
      a = c.slice(i, i + ARGS[verb])
    i += ARGS[verb]
    if (verb === 0) d += `M${xy(a[0], a[1])}`
    else if (verb === 1) d += `L${xy(a[0], a[1])}`
    else if (verb === 2) d += `Q${xy(a[0], a[1])} ${xy(a[2], a[3])}`
    else if (verb === 3) {
      const k = (4 * a[4]) / (3 * (1 + a[4])) // rational quadratic → cubic, exact enough for arcs up to 90°
      d += `C${xy(px + k * (a[0] - px), py + k * (a[1] - py))} ${xy(a[2] + k * (a[0] - a[2]), a[3] + k * (a[1] - a[3]))} ${xy(a[2], a[3])}`
    } else if (verb === 4) d += `C${xy(a[0], a[1])} ${xy(a[2], a[3])} ${xy(a[4], a[5])}`
    else d += 'Z'
    if (verb !== 5) [px, py] = verb === 3 ? [a[2], a[3]] : a.slice(-2)
  }
  return d
}

// Map an SVG's viewBox onto 0 0 size size (uniform scale, centred).
export function normalize(p, root, size = 16) {
  const [x, y, w, h] = (root.viewBox || `0 0 ${root.width} ${root.height}`).split(/[\s,]+/).map(Number)
  const k = size / Math.max(w, h)
  return k === 1 && !x && !y ? p : transform(p, k, -x * k + (size - w * k) / 2, -y * k + (size - h * k) / 2)
}

export const listSvgs = dir =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter(f => f.endsWith('.svg'))
        .sort()
    : []
