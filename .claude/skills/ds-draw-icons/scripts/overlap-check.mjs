#!/usr/bin/env node
// No-tracing guard: fails if any of our icons contains >= COVER of the points of one Streamline subpath.
//
//   node overlap-check.mjs [--icons <packages/assets/src/icons>]
//   node overlap-check.mjs --self-test
//
// Ours = every name in draw/source/*.svg; checked are those sources and their flattened svg/<name>.svg.
// Streamline = every other svg/*.svg (74 on a 16 viewBox, 4 on 14, 1 on 28). Every file is mapped from its OWN
// viewBox into unit space, so a 14-grid source that rescales a 16-viewBox Streamline path still matches. A point
// (end or control) is snapped to a 1/STEP cell and matches that cell or a neighbour, so rescale and 3-decimal
// rounding noise can't split a copied point across a cell edge.
// Why subpath coverage, not a shared-point count: Streamline is drawn on 14 too, so fresh grid-native primitives
// share corners with it — a 0.5-inset rounded square shared 8 points with dashboard.svg, over the old count of 6.
// Coverage separates (self-test, 2026-11-27): unrelated Streamline icons cover <= 33% of each other's subpaths,
// fresh 14-grid primitives <= 40%, while a copy, a lifted sub-shape or a rescaled copy covers 100%. Streamline's own
// families (upload/download, the circle in *-circle) reuse whole sub-shapes and score 50–100%: that is what a copy is.
// shortcut: exact-ish point matching, a nudged copy slips through; the human no-tracing rule stays primary.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { SKILL, parseSvg, toPath, points, normalize, transform, toSvgD, listSvgs } from './lib.mjs'
import { flattenSvg } from './flatten.mjs'

export const COVER = 0.75 // fail when this share of one Streamline subpath's points is in ours
const MIN_POINTS = 4 // subpaths with fewer distinct points (a bare line) carry no shape to copy
const STEP = 1600 // cell = 0.01 at 16 units (0.00875 at 14)
const VERB_POINTS = [1, 1, 2, 2, 3, 0] // toCmds(): move, line, quad, conic, cubic, close
const VERB_ARGS = [2, 2, 4, 5, 6, 0]

// Every subpath of a file as a Set of snapped points, in unit space from the file's own viewBox.
export function subpathsOf(text) {
  const { root, shapes } = parseSvg(text)
  const subs = []
  for (const s of shapes) {
    if (s.inDefs || (s.inMask && /^(#fff(fff)?|white)$/i.test(s.own.fill || ''))) continue
    const c = normalize(toPath(s), root, 1).toCmds()
    for (let i = 0; i < c.length;) {
      const verb = c[i++]
      if (verb === 0) subs.push(new Set())
      for (let j = 0; j < VERB_POINTS[verb] * 2; j += 2)
        subs.at(-1).add(`${Math.round(c[i + j] * STEP)},${Math.round(c[i + j + 1] * STEP)}`)
      i += VERB_ARGS[verb]
    }
  }
  return subs
}

const NEAR = [-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dy => [dx, dy]))
const has = (set, k) => {
  const [x, y] = k.split(',').map(Number)
  return NEAR.some(([dx, dy]) => set.has(`${x + dx},${y + dy}`))
}

// candidates, references: [{ label, text }] → [{ label, ref, cover, size }] worst-covered Streamline subpath per candidate
export function check(candidates, references) {
  const refs = references.map(r => ({ label: r.label, subs: subpathsOf(r.text).filter(s => s.size >= MIN_POINTS) }))
  return candidates.map(c => {
    const ours = new Set(subpathsOf(c.text).flatMap(s => [...s]))
    let best = { label: c.label, ref: '-', cover: 0, size: 0 }
    for (const r of refs)
      for (const sub of r.subs) {
        let n = 0
        for (const k of sub) n += has(ours, k)
        const cover = n / sub.size
        if (cover > best.cover || (cover === best.cover && sub.size > best.size))
          best = { label: c.label, ref: r.label, cover, size: sub.size }
      }
    return best
  })
}

const pct = r => `${Math.round(r.cover * 100)}% of a ${r.size}-pt subpath${r.cover ? ` (${r.ref})` : ''}`

function selfTest(icons) {
  const svgDir = path.join(icons, 'svg')
  const refs = listSvgs(svgDir).map(f => ({ label: f, text: fs.readFileSync(path.join(svgDir, f), 'utf8') }))
  assert.ok(refs.length > 0, `no Streamline files in ${svgDir}`)
  const copy = { label: 'copy', text: refs.find(r => r.label === 'check.svg')?.text ?? refs[0].text }
  // one sub-shape lifted from a Streamline file and placed into an otherwise fresh source
  const lifted = refs[0].text.match(/ d="(M[^MZz"]+[Zz]?)/)[1]
  const partial = {
    label: 'partial',
    text: `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="${lifted}"/></svg>`,
  }
  // the same Streamline path rescaled onto a 14 viewBox, rounded like flatten output: must still match
  const k = 14 / 16
  const copy14 = {
    label: 'copy on 14',
    text: `<svg viewBox="0 0 14 14">${parseSvg(copy.text)
      .shapes.map(s => `<path d="${toSvgD(transform(normalize(toPath(s), parseSvg(copy.text).root), k, 0, 0))}"/>`)
      .join('')}</svg>`,
  }
  // a fresh 14-grid source in draw-icons format, and its flattened output
  const source14 =
    '<svg viewBox="0 0 14 14" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2.5" width="11" height="9" rx="1"/><path d="M4 6h6"/><circle cx="7" cy="9" r="0.5"/></svg>'
  const fresh = { label: 'fresh 14', text: source14 }
  const flat = { label: 'fresh 14 flattened', text: flattenSvg(source14) }
  // grid-native primitives that coincide point-for-point with parts of Streamline (it is drawn on 14 too):
  // shared corners alone must not fail
  const S = b => `<svg viewBox="0 0 14 14">${b}</svg>`
  const prims = [
    S('<rect x="0.5" y="0.5" width="13" height="13" rx="1.5"/>'),
    flattenSvg(S('<circle cx="7" cy="7" r="6.25" fill="none" stroke="#000" stroke-width="1.5"/>')),
    S('<circle cx="7" cy="7" r="7"/>'),
  ].map((text, i) => ({ label: `primitive ${i + 1}`, text }))
  const [c, p, c14, f, ff, ...pr] = check([copy, partial, copy14, fresh, flat, ...prims], refs)
  for (const r of [c, p, c14]) assert.ok(r.cover >= COVER, `${r.label} should fail: ${pct(r)}`)
  for (const r of [f, ff, ...pr]) assert.ok(r.cover < COVER, `${r.label} should pass: ${pct(r)}`)
  // separation: Streamline against the other Streamline files (its own families reuse whole sub-shapes)
  const cross = refs
    .map(
      (r, i) =>
        check(
          [r],
          refs.filter((_, j) => j !== i),
        )[0],
    )
    .sort((x, y) => x.cover - y.cover)
  const below = cross.filter(x => x.cover < COVER)
  console.log(
    `self-test ok (cover ${COVER}, ${refs.length} Streamline files)\n` +
      [c, p, c14, f, ff, ...pr].map(r => `  ${r.cover >= COVER ? 'fail' : 'pass'} ${r.label}: ${pct(r)}`).join('\n') +
      `\n  Streamline vs Streamline: ${below.length} below, max ${pct(below.at(-1))}; ` +
      `${cross.length - below.length} at/above (shared family parts)`,
  )
}

function main(argv) {
  const opt = f => {
    const i = argv.indexOf(f)
    return i === -1 ? undefined : argv.splice(i, 2)[1]
  }
  const icons = path.resolve(opt('--icons') || path.resolve(SKILL, '../../../packages/assets/src/icons'))
  if (argv.includes('--self-test')) return selfTest(icons)
  const srcDir = path.join(icons, 'draw', 'source'),
    svgDir = path.join(icons, 'svg')
  const ours = new Set(listSvgs(srcDir))
  if (!ours.size) {
    console.log(`Nothing to check: no sources in ${srcDir}`)
    return
  }
  const read = (dir, f) => ({
    label: path.relative(icons, path.join(dir, f)),
    text: fs.readFileSync(path.join(dir, f), 'utf8'),
  })
  const candidates = [
    ...[...ours].map(f => read(srcDir, f)),
    ...listSvgs(svgDir)
      .filter(f => ours.has(f))
      .map(f => read(svgDir, f)),
  ]
  const references = listSvgs(svgDir)
    .filter(f => !ours.has(f))
    .map(f => read(svgDir, f))
  let failed = 0
  for (const r of check(candidates, references)) {
    const bad = r.cover >= COVER
    failed += bad
    console.log(`${bad ? '✗' : '✓'} ${r.label}  max ${pct(r)}`)
  }
  console.log(`\n${candidates.length} checked against ${references.length} Streamline files · cover ${COVER}`)
  if (failed) {
    console.error(`${failed} file(s) share too many coordinates with Streamline: redraw from scratch, don't trace.`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2))
