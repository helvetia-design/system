#!/usr/bin/env node
// Flatten draw-icons build output (strokes, filled silhouettes, <mask> cut-outs) into ONE fill-only <path>
// on a 14 viewBox (the DNA grid, so sources are not rescaled), in the shape of packages/assets/src/icons/svg/*.svg.
//
//   node flatten.mjs [names…] [--in <dir>] [--out <dir>]   default in: packages/assets/src/icons/draw, out: …/icons/svg
import fs from 'node:fs'
import path from 'node:path'
import { SKILL, ck, parseSvg, toPath, normalize, toSvgD, listSvgs } from './lib.mjs'

const ICONS = path.resolve(SKILL, '../../../packages/assets/src/icons')
const SIZE = 14 // DNA v1 grid; ds-icon scales via CSS
const CAP = { round: 'Round', butt: 'Butt', square: 'Square' }
const JOIN = { round: 'Round', miter: 'Miter', bevel: 'Bevel' }

const union = (a, b) => (a ? ck.Path.MakeFromOp(a, b, ck.PathOp.Union) : b)

export function flattenSvg(text) {
  const { root, shapes } = parseSvg(text)
  let ink = null,
    cut = null
  for (const s of shapes) {
    if (s.inDefs) continue
    const a = s.attrs
    if (s.inMask && /^(#fff(fff)?|white)$/i.test(s.own.fill || '')) continue // the mask's "keep everything" backdrop
    const p = toPath(s)
    const stroked =
      a.stroke && a.stroke !== 'none' && Number(a['stroke-width'] ?? 1) > 0
        ? p
            .makeStroked({
              width: Number(a['stroke-width'] ?? 1),
              cap: ck.StrokeCap[CAP[a['stroke-linecap'] || 'butt']],
              join: ck.StrokeJoin[JOIN[a['stroke-linejoin'] || 'miter']],
              miter_limit: Number(a['stroke-miterlimit'] ?? 4),
              precision: 16, // stroker tolerance is in user units; a 14-unit icon needs it much finer than the default
            })
            ?.makeAsWinding()
        : null
    // shortcut: a mask is applied to the whole icon, fine for draw-icons output (one masked group), upgrade if inputs nest masks.
    if (s.inMask) {
      if (stroked) cut = union(cut, stroked)
      continue
    }
    if (a.fill !== 'none') ink = union(ink, p.makeAsWinding())
    if (stroked) ink = union(ink, stroked)
  }
  if (!ink) throw new Error('nothing to fill')
  ink = ck.Path.MakeFromOp(ink, cut || ck.Path.MakeFromSVGString(''), ck.PathOp.Difference) // PathOps output is simplified: no overlaps
  ink = normalize(ink, root, SIZE)
  const d = toSvgD(ink)
  const b = ink.getBounds()
  if (b[0] < -0.01 || b[1] < -0.01 || b[2] > SIZE + 0.01 || b[3] > SIZE + 0.01)
    console.warn(`  ! ink leaves the ${SIZE}×${SIZE} box: ${Array.from(b, v => v.toFixed(2))}`)
  return `<svg fill="#000D6E" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" focusable="false" aria-hidden="true"><path fill-rule="evenodd" d="${d}" clip-rule="evenodd"/></svg>`
}

function main(argv) {
  const opt = f => {
    const i = argv.indexOf(f)
    return i === -1 ? undefined : argv.splice(i, 2)[1]
  }
  const out = path.resolve(opt('--out') || path.join(ICONS, 'svg'))
  const inDir = path.resolve(opt('--in') || path.join(ICONS, 'draw'))
  const names = argv.flatMap(a => a.split(',')).filter(Boolean)
  const files = listSvgs(inDir)
    .filter(f => !names.length || names.some(n => f === `${n}.svg` || f.startsWith(`${n}@`)))
    .map(f => path.join(inDir, f))
  if (!files.length) {
    console.error(
      `No SVGs to flatten in ${inDir}${names.length ? ` matching ${names.join(', ')}` : ''}. Run draw-icons build first.`,
    )
    process.exit(1)
  }
  fs.mkdirSync(out, { recursive: true })
  let failed = 0
  for (const f of files) {
    const dest = path.join(out, path.basename(f))
    try {
      fs.writeFileSync(dest, flattenSvg(fs.readFileSync(f, 'utf8')))
      console.log(`✓ ${path.relative(process.cwd(), dest)}`)
    } catch (e) {
      failed++
      console.error(`✗ ${path.basename(f)}: ${e.message}`)
    }
  }
  process.exit(failed ? 1 : 0)
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2))
