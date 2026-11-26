#!/usr/bin/env node
// No-tracing guard: fails if any of our icons shares >= THRESHOLD coordinate pairs with a Streamline icon.
//
//   node overlap-check.mjs [--icons <packages/assets/src/icons>] [--threshold N]
//   node overlap-check.mjs --self-test
//
// Ours = every name in draw/source/*.svg; checked are those sources and their flattened svg/<name>.svg.
// Streamline = every other svg/*.svg. All files are mapped to a 16 viewBox; a pair is an end or control
// point rounded to 0.01. THRESHOLD = 6: measured on the 79 Streamline files, unrelated icons share 0–4 pairs
// (round coordinates like 8,8 coincide), while the smallest Streamline file has 14 and copying any one
// sub-shape (a corner, a dot) carries 6+. A fresh 16-grid source shares <= 3.
// shortcut: exact-ish point matching, a nudged copy slips through; the human no-tracing rule stays primary.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { SKILL, parseSvg, toPath, points, normalize, listSvgs } from './lib.mjs'

export const THRESHOLD = 6

export function pairsOf(text) {
  const { root, shapes } = parseSvg(text)
  const set = new Set()
  for (const s of shapes) {
    if (s.inDefs || (s.inMask && /^(#fff(fff)?|white)$/i.test(s.own.fill || ''))) continue
    for (const [x, y] of points(normalize(toPath(s), root))) set.add(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return set
}

const shared = (a, b) => {
  let n = 0
  for (const k of a) if (b.has(k)) n++
  return n
}

// candidates, references: [{ label, text }] → [{ label, ref, n }] worst match per candidate
export function check(candidates, references) {
  const refs = references.map(r => ({ ...r, pairs: pairsOf(r.text) }))
  return candidates.map(c => {
    const pairs = pairsOf(c.text)
    return refs.reduce(
      (best, r) => {
        const n = shared(pairs, r.pairs)
        return n > best.n ? { label: c.label, ref: r.label, n } : best
      },
      { label: c.label, ref: '-', n: 0 },
    )
  })
}

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
  const fresh = {
    label: 'fresh',
    text: '<svg viewBox="0 0 16 16"><path d="M8 2L12 2A2 2 0 0 1 14 4L14 12A2 2 0 0 1 12 14L4 14A2 2 0 0 1 2 12L2 4A2 2 0 0 1 4 2Z"/><path d="M5.5 8h5"/><circle cx="8" cy="8" r="6"/></svg>',
  }
  const [c, p, f] = check([copy, partial, fresh], refs)
  assert.ok(c.n >= THRESHOLD, `copied path should fail, shared ${c.n}`)
  assert.ok(p.n >= THRESHOLD, `lifted sub-shape should fail, shared ${p.n}`)
  assert.ok(f.n < THRESHOLD, `fresh path should pass, shared ${f.n} with ${f.ref}`)
  console.log(
    `self-test ok: copy ${c.n}, lifted sub-shape ${p.n}, fresh ${f.n} (threshold ${THRESHOLD}, ${refs.length} Streamline files)`,
  )
}

function main(argv) {
  const opt = f => {
    const i = argv.indexOf(f)
    return i === -1 ? undefined : argv.splice(i, 2)[1]
  }
  const icons = path.resolve(opt('--icons') || path.resolve(SKILL, '../../../packages/assets/src/icons'))
  if (argv.includes('--self-test')) return selfTest(icons)
  const threshold = Number(opt('--threshold') ?? THRESHOLD)
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
    const bad = r.n >= threshold
    failed += bad
    console.log(`${bad ? '✗' : '✓'} ${r.label}  max ${r.n} shared pairs${r.n ? ` (${r.ref})` : ''}`)
  }
  console.log(`\n${candidates.length} checked against ${references.length} Streamline files · threshold ${threshold}`)
  if (failed) {
    console.error(`${failed} file(s) share too many coordinates with Streamline: redraw from scratch, don't trace.`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2))
