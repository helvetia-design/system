#!/usr/bin/env node
// Mechanical pass for ds-scout-component: render a marked element of a foreign page at our
// breakpoints, dump its subtree, snap every measured value to DS tokens, capture hover/focus
// diffs, contrast and an optional anatomy overlay. Judgment (mapping, ladder, naming) stays
// with the magpie agent.
//
// node scout.mjs <url> <selector> --name <slug> [--remove <css>]... [--anatomy "3:Card,7:Heading"]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { brandSiblings, candidatesFor, contrast, familyOf, preferFor, snapColor, snapPx } from './snap.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const TOKENS_JSON = join(ROOT, 'packages/tokens/dist/docs/base.tokens.json')
const TOKENS_CSS = join(ROOT, 'packages/tokens/dist/css/base.tokens.css')
// 320 + our breakpoints Tablet, Desktop, DesktopXL. 1280/1920 dropped, they added nothing.
const WIDTHS = [320, 769, 1024, 1440]
// Known consent overlays, hidden on every run so hover states aren't intercepted. Extend as sites turn up.
// cspell:disable-next-line
const DEFAULT_REMOVE = ['#usercentrics-cmp-ui', '#usercentrics-root', '#onetrust-consent-sdk', '#CybotCookiebotDialog']
const BREAKPOINT_NAMES = {
  320: 'Mobile',
  769: 'Tablet',
  1024: 'Desktop',
  1280: 'DesktopLG',
  1440: 'DesktopXL',
  1920: 'Desktop2XL',
}
const STATE_WIDTH = 1440 // must be in WIDTHS
const MAX_NODES = 300
const SETTLE_MS = 300

const PROPS = [
  'display',
  'position',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'grid-template-columns',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'row-gap',
  'column-gap',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'background-color',
  'box-shadow',
  'opacity',
  'transform',
  'outline-width',
  'outline-style',
  'outline-color',
  'outline-offset',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'color',
  'text-decoration-line',
  'text-transform',
]
const TYPO = new Set([
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'color',
  'text-decoration-line',
  'text-transform',
])
const DEFAULTS = new Set([
  '0px',
  'none',
  'normal',
  'auto',
  'rgba(0, 0, 0, 0)',
  'static',
  'visible',
  '1',
  'nowrap',
  'row',
  'stretch',
  'block',
])

function parseArgs(argv) {
  const [url, selector, ...rest] = argv
  const opts = { url, selector, remove: [...DEFAULT_REMOVE], anatomy: [] }
  for (let i = 0; i < rest.length; i += 2) {
    const [k, v] = [rest[i], rest[i + 1]]
    if (k === '--name') opts.name = v
    else if (k === '--remove') opts.remove.push(v)
    else if (k === '--anatomy')
      opts.anatomy = v
        .split(',')
        .map(p => p.split(':'))
        .map(([id, label]) => ({ id: +id, label: label.trim() }))
    else throw new Error(`unknown option ${k}`)
  }
  if (!url || !selector || !/^[a-z0-9-]+$/.test(opts.name ?? '')) {
    throw new Error(
      'usage: scout.mjs <url> <selector> --name <kebab-slug> [--remove <css>]... [--anatomy "id:Label,…"]',
    )
  }
  return opts
}

/** Alias/Device/Global color + dimension tokens. Component tokens are left out: borrowing them is a layering error. */
function tokenList() {
  const out = []
  const walk = o => {
    if (o?.$value !== undefined && o.name) {
      if (!o.path[0].includes('Component') && (o.$type === 'color' || o.$type === 'dimension'))
        out.push({ name: o.name, type: o.$type })
      return
    }
    for (const v of Object.values(o ?? {})) if (v && typeof v === 'object') walk(v)
  }
  walk(JSON.parse(readFileSync(TOKENS_JSON, 'utf8')))
  return out
}

/** Resolve every token per width in a blank page, so responsive (Device) tokens get their real value. */
async function resolveTokens(browser, list) {
  const page = await browser.newPage()
  await page.setContent(
    `<style>${readFileSync(TOKENS_CSS, 'utf8')}</style><div id="p" style="position:absolute"></div>`,
  )
  const byWidth = {}
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 800 })
    byWidth[w] = await page.evaluate(list => {
      const p = document.getElementById('p')
      const rootStyle = getComputedStyle(document.documentElement)
      return list.flatMap(t => {
        const raw = rootStyle.getPropertyValue(`--${t.name}`).trim()
        if (!raw) return []
        p.removeAttribute('style')
        p.style.position = 'absolute'
        if (t.type === 'dimension') {
          if (!/^-?[\d.]+(px|rem|em)$/.test(raw)) return []
          p.style.width = raw
          return [{ name: t.name, px: parseFloat(getComputedStyle(p).width) }]
        }
        p.style.color = raw
        return [{ name: t.name, color: getComputedStyle(p).color }]
      })
    }, list)
  }
  await page.close()
  return byWidth
}

// Runs in the page: tag the marked subtree (light DOM + open shadow roots) with stable ids.
function tagSubtree({ selector, max }) {
  const root = document.querySelector(selector)
  if (!root) return null
  const els = []
  const nodes = []
  const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex]'
  const visit = (el, depth, parentId, inShadow) => {
    if (els.length >= max) return
    const id = els.length
    els.push(el)
    el.setAttribute('data-scout-id', String(id))
    const keepAttr = a =>
      el.tagName.toLowerCase().startsWith('bal-') || /^(role|aria-|href|type|tabindex|alt)/.test(a.name)
    nodes.push({
      id,
      parentId,
      depth,
      inShadow,
      tag: el.tagName.toLowerCase(),
      classes: [...el.classList],
      attrs: Object.fromEntries(
        [...el.attributes]
          .filter(a => a.name !== 'class' && a.name !== 'data-scout-id' && keepAttr(a))
          .map(a => [a.name, a.value]),
      ),
      text: [...el.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent.trim())
        .join(' ')
        .slice(0, 60),
      interactive: el.matches(FOCUSABLE),
    })
    if (el.shadowRoot) for (const c of el.shadowRoot.children) visit(c, depth + 1, id, true)
    for (const c of el.children) visit(c, depth + 1, id, inShadow)
  }
  visit(root, 0, null, false)
  window.__scoutEls = els
  return nodes
}

// Runs in the page: computed styles + box of tagged elements (or of `ids` only).
function dumpStyles({ props, ids }) {
  const els = window.__scoutEls
  const rootBox = els[0].getBoundingClientRect()
  const pick = ids ?? els.map((_, i) => i)
  const out = {}
  const effectiveBg = el => {
    for (let e = el; e; e = e.parentElement ?? e.getRootNode().host) {
      const bg = getComputedStyle(e).backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg
    }
    return 'rgb(255, 255, 255)'
  }
  for (const i of pick) {
    const el = els[i]
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
    const styles = Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p)]))
    const kids = [...el.children].map(c => c.getBoundingClientRect()).filter(b => b.width > 0)
    out[i] = {
      visible,
      box: {
        x: Math.round(r.x - rootBox.x),
        y: Math.round(r.y - rootBox.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      },
      cols: new Set(kids.map(b => Math.round(b.x))).size,
      hasText,
      bg: hasText ? effectiveBg(el) : undefined,
      styles,
    }
  }
  return out
}

/** Drop defaults and noise: typography only where the node owns text, border color/style only with a width. */
function relevant(node, styles) {
  const out = {}
  for (const [p, v] of Object.entries(styles)) {
    if (DEFAULTS.has(v)) continue
    if (TYPO.has(p) && !node.hasText) continue
    const side = /^border-(top|right|bottom|left)-(color|style)$/.exec(p)
    if (side && styles[`border-${side[1]}-width`] === '0px') continue
    if (p.startsWith('outline-') && styles['outline-style'] === 'none') continue
    out[p] = v
  }
  return out
}

function snapAll(styles, candidates) {
  const snap = {}
  for (const [p, v] of Object.entries(styles)) {
    const fam = familyOf(p)
    if (!fam) continue
    if (fam === 'surface' || fam.endsWith('color')) snap[p] = { value: v, ...snapColor(v, candidates[fam]) }
    else if (/^-?[\d.]+px$/.test(v) && parseFloat(v) !== 0)
      snap[p] = { value: v, ...snapPx(parseFloat(v), candidates[fam], { prefer: preferFor(p) }) }
  }
  return snap
}

function familyCandidates(tokens) {
  const families = ['space', 'radius', 'text-size', 'border-width', 'surface', 'text-color', 'border-color']
  return Object.fromEntries(families.map(f => [f, candidatesFor(f, tokens)]))
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (!existsSync(TOKENS_JSON) || !existsSync(TOKENS_CSS)) {
    console.error('Built tokens missing. Run `pnpm tokens` first.')
    process.exit(2)
  }
  const outDir = join(ROOT, 'docs/plans/magpie', opts.name)
  mkdirSync(outDir, { recursive: true })

  // Installed Chrome first: WAFs (e.g. the Baloise style guide site) answer bundled headless Chromium with 406.
  const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  try {
    const tokensByWidth = await resolveTokens(browser, tokenList())
    const page = await browser.newPage({ viewport: { width: STATE_WIDTH, height: 900 } })
    await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.locator(opts.selector).first().waitFor({ state: 'visible', timeout: 30_000 })
    await page.waitForTimeout(1_000) // web components hydrate after load
    // A style, not node removal: consent banners are often injected after load.
    if (opts.remove.length) await page.addStyleTag({ content: `${opts.remove.join(',')}{display:none!important}` })

    const nodes = await page.evaluate(tagSubtree, { selector: opts.selector, max: MAX_NODES })
    if (!nodes) throw new Error(`selector matched nothing: ${opts.selector}`)
    const root = page.locator('[data-scout-id="0"]')

    // 1. Every width: styles, snaps, screenshot.
    const widths = {}
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 900 })
      await page.waitForTimeout(SETTLE_MS)
      const familyTokens = familyCandidates(tokensByWidth[w])
      const dump = await page.evaluate(dumpStyles, { props: PROPS })
      const perNode = {}
      for (const [id, d] of Object.entries(dump)) {
        if (!d.visible) {
          perNode[id] = { visible: false }
          continue
        }
        const styles = relevant(d, d.styles)
        perNode[id] = {
          box: d.box,
          cols: d.cols,
          styles,
          snap: snapAll(styles, familyTokens),
          ...(d.bg && { bg: d.bg }),
        }
      }
      await root.scrollIntoViewIfNeeded()
      await root.screenshot({ path: join(outDir, `${w}.png`) })
      widths[w] = perNode
    }

    // 2. Switch points: layout or token changes between consecutive widths.
    const switchPoints = []
    const sig = n =>
      n?.visible === false
        ? { visible: 'hidden' }
        : {
            'visible': 'shown',
            'cols': n.cols,
            'display': n.styles.display,
            'flex-direction': n.styles['flex-direction'],
            'grid-columns': n.styles['grid-template-columns']?.split(' ').length,
            ...Object.fromEntries(Object.entries(n.snap).map(([p, s]) => [p, s.token ?? s.value])),
          }
    for (let i = 1; i < WIDTHS.length; i++) {
      const [a, b] = [WIDTHS[i - 1], WIDTHS[i]]
      for (const { id } of nodes) {
        const [sa, sb] = [sig(widths[a][id]), sig(widths[b][id])]
        for (const k of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
          if (sa[k] !== sb[k])
            switchPoints.push({
              id,
              prop: k,
              from: sa[k] ?? null,
              to: sb[k] ?? null,
              between: [a, b],
              ourBreakpoint: BREAKPOINT_NAMES[b],
            })
        }
      }
    }

    // 3. Hover + keyboard focus diffs at desktop, one per distinct interactive element. Never clicks.
    await page.setViewportSize({ width: STATE_WIDTH, height: 900 })
    await page.waitForTimeout(SETTLE_MS)
    const familyTokens = familyCandidates(tokensByWidth[STATE_WIDTH])
    const subtreeOf = id => {
      const ids = new Set([id])
      for (const n of nodes) if (ids.has(n.parentId)) ids.add(n.id)
      return [...ids]
    }
    const seen = new Set()
    const states = []
    for (const n of nodes.filter(n => n.interactive)) {
      const key = `${n.tag}.${n.classes.join('.')}`
      if (seen.has(key)) continue
      seen.add(key)
      const ids = subtreeOf(n.id)
      const el = page.locator(`[data-scout-id="${n.id}"]`)
      await page.mouse.move(0, 0)
      await page.waitForTimeout(SETTLE_MS)
      const rest = await page.evaluate(dumpStyles, { props: PROPS, ids })
      for (const state of ['hover', 'focus']) {
        if (state === 'hover') {
          const err = await el
            .hover({ timeout: 5_000 })
            .catch(e => e.message.split('\n').find(l => l.includes('intercepts')) ?? e.message.split('\n')[0])
          if (err) {
            states.push({ id: n.id, state, error: `${err.trim()} — rerun with --remove <selector>` })
            continue
          }
        } else {
          await page.mouse.move(0, 0)
          await page.keyboard.press('Shift') // last input = keyboard, so :focus-visible applies
          await el.evaluate(e => e.focus())
        }
        await page.waitForTimeout(SETTLE_MS)
        const now = await page.evaluate(dumpStyles, { props: PROPS, ids })
        const diff = {}
        for (const i of ids) {
          for (const p of PROPS) {
            if (rest[i].styles[p] === now[i].styles[p]) continue
            const s = snapAll({ [p]: now[i].styles[p] }, familyTokens)[p]
            ;(diff[i] ??= {})[p] = { rest: rest[i].styles[p], [state]: now[i].styles[p], ...(s && { snap: s }) }
          }
        }
        const box = await el.boundingBox()
        const file = `state-${n.id}-${state}.png`
        if (box)
          await page.screenshot({
            path: join(outDir, file),
            clip: {
              x: Math.max(0, box.x - 8),
              y: Math.max(0, box.y - 8),
              width: box.width + 16,
              height: box.height + 16,
            },
          })
        states.push({ id: n.id, state, diff, screenshot: file })
        await el.evaluate(e => e.blur())
      }
    }

    // 4. Contrast of every text-owning node against its effective background.
    const desk = widths[STATE_WIDTH]
    const contrastRows = []
    const seenPairs = new Set()
    for (const { id } of nodes) {
      const d = desk[id]
      if (!d?.bg || !d.styles.color) continue
      const size = parseFloat(d.styles['font-size']),
        weight = +d.styles['font-weight']
      const large = size >= 24 || (size >= 18.66 && weight >= 700)
      const k = `${d.styles.color}|${d.bg}|${large}`
      if (seenPairs.has(k)) continue
      seenPairs.add(k)
      const ratio = contrast(d.styles.color, d.bg)
      contrastRows.push({
        id,
        fg: d.styles.color,
        bg: d.bg,
        ratio,
        required: large ? 3 : 4.5,
        pass: ratio >= (large ? 3 : 4.5),
      })
    }

    // 5. Brand-color axis: a surface on a Brand* token → contrast of its texts on all 4 brands.
    const colorOf = name => tokensByWidth[STATE_WIDTH].find(t => t.name === name)?.color
    const brandAxis = []
    for (const { id } of nodes) {
      const s = desk[id]?.snap?.['background-color']
      const sib = brandSiblings(s?.token)
      if (!sib) continue
      const texts = [...new Set(contrastRows.filter(r => r.bg === s.value).map(r => r.fg))]
      brandAxis.push({
        id,
        token: s.token,
        variants: Object.fromEntries(
          Object.entries(sib).map(([brand, token]) => {
            const bg = colorOf(token)
            return [
              brand,
              {
                token,
                color: bg,
                texts: bg ? texts.map(fg => ({ fg, ratio: contrast(fg, bg), pass: contrast(fg, bg) >= 4.5 })) : [],
              },
            ]
          }),
        ),
      })
    }

    // 6. Anatomy overlay: numbered callouts on the parts the agent picked (second run).
    let anatomy
    if (opts.anatomy.length) {
      await page.mouse.move(0, 0)
      await page.evaluate(parts => {
        for (const [n, { id }] of parts.entries()) {
          const r = window.__scoutEls[id].getBoundingClientRect()
          const box = document.createElement('div')
          box.setAttribute('data-scout-overlay', '')
          box.style.cssText = `position:absolute;z-index:2147483647;pointer-events:none;outline:2px solid #e0007a;left:${r.left + scrollX}px;top:${r.top + scrollY}px;width:${r.width}px;height:${r.height}px`
          const badge = document.createElement('span')
          badge.textContent = String(n + 1)
          badge.style.cssText =
            'position:absolute;left:-2px;top:-20px;background:#e0007a;color:#fff;font:700 12px/18px sans-serif;min-width:18px;text-align:center;border-radius:4px 4px 0 0'
          box.append(badge)
          document.body.append(box)
        }
      }, opts.anatomy)
      const b = await root.boundingBox()
      await page.screenshot({
        path: join(outDir, 'anatomy.png'),
        fullPage: true,
        clip: {
          x: Math.max(0, b.x - 24),
          y: Math.max(0, b.y + (await page.evaluate(() => scrollY)) - 24),
          width: b.width + 48,
          height: b.height + 48,
        },
      })
      anatomy = opts.anatomy.map((p, i) => ({ n: i + 1, ...p, tag: nodes[p.id]?.tag, classes: nodes[p.id]?.classes }))
    }

    // 7. Summary the agent reads first.
    const flat = status =>
      WIDTHS.flatMap(w =>
        Object.entries(widths[w]).flatMap(([id, n]) =>
          Object.entries(n.snap ?? {})
            .filter(([, s]) => s.status === status)
            .map(([prop, s]) => ({
              id: +id,
              width: w,
              prop,
              value: s.value,
              nearest: s.nearest,
              delta: s.delta ?? s.deltaE,
            })),
        ),
      )
    const summary = {
      nodes: nodes.length,
      balTags: [...new Set(nodes.map(n => n.tag).filter(t => t.startsWith('bal-')))],
      customClasses: [
        ...new Set(
          nodes.flatMap(n => n.classes).filter(c => !/^(bal|is|has|m|p|mt|mb|ml|mr|pt|pb|pl|pr|mx|my|px|py)-/.test(c)),
        ),
      ],
      noToken: flat('no-token'),
      drift: flat('drift'),
      globalLayerHits: WIDTHS.flatMap(w =>
        Object.entries(widths[w]).flatMap(([id, n]) =>
          Object.entries(n.snap ?? {})
            .filter(([, s]) => s.global && s.token)
            .map(([prop, s]) => ({ id: +id, width: w, prop, token: s.token })),
        ),
      ),
      ambiguous: Object.entries(desk).flatMap(([id, n]) =>
        Object.entries(n.snap ?? {})
          .filter(([, s]) => s.ties?.length)
          .map(([prop, s]) => ({ id: +id, prop, token: s.token, ties: s.ties })),
      ),
      switchPoints: switchPoints.length,
      contrastFails: contrastRows.filter(r => !r.pass),
      brandAxis: brandAxis.length > 0,
    }

    const result = {
      source: { url: opts.url, selector: opts.selector, date: new Date().toISOString(), removed: opts.remove },
      widths: WIDTHS,
      breakpoints: BREAKPOINT_NAMES,
      summary,
      nodes,
      perWidth: widths,
      switchPoints,
      states,
      contrast: contrastRows,
      brandAxis,
      ...(anatomy && { anatomy }),
    }
    const file = join(outDir, 'scout.json')
    writeFileSync(file, JSON.stringify(result, null, 2))
    console.log(
      JSON.stringify(
        {
          out: relative(ROOT, file),
          ...summary,
          noToken: summary.noToken.length,
          drift: summary.drift.length,
          contrastFails: summary.contrastFails.length,
          ambiguous: summary.ambiguous.length,
          globalLayerHits: summary.globalLayerHits.length,
        },
        null,
        2,
      ),
    )
  } finally {
    await browser.close()
  }
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})
