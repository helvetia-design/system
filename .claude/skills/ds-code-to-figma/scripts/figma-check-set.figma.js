// Phase 4 check body — runs inside `use_figma` (Plugin API). Never run it by hand: generate the
// full script with `node scripts/figma-check-set.mjs <component>`, which puts `SPEC` above this.
// Read-only: it changes nothing in the file. Returns { rows } — one row per check and set:
// { set, check, verdict: pass | fail | review, found, expected, details }.

const rows = []
const row = (set, check, verdict, found, expected, details = '') =>
  rows.push({ set, check, verdict, found: String(found), expected: String(expected), details })
const sample = (list, n = 5) =>
  list.length > n ? `${list.slice(0, n).join('; ')} … (+${list.length - n})` : list.join('; ')
const sentenceCase = s => s.charAt(0).toUpperCase() + s.slice(1)
const cleanKey = k => k.replace(/#[^#]*$/, '')
const parseVariant = name => Object.fromEntries(name.split(', ').map(p => p.split('=')))

const page = figma.root.children.find(p => p.name === SPEC.figmaPage)
await figma.setCurrentPageAsync(page)

const variableCache = new Map()
const getVariable = async id => {
  if (!variableCache.has(id)) variableCache.set(id, await figma.variables.getVariableByIdAsync(id))
  return variableCache.get(id)
}

// Family members whose mapping file is missing (e.g. a sub-component not built yet).
for (const m of SPEC.missingMappings || []) row(m.tag, 'mapping file', 'fail', 'missing', m.file)

for (const M of SPEC.members)
  for (const setSpec of M.sets) {
    const set = await figma.getNodeByIdAsync(setSpec.id)
    if (!set || set.type !== 'COMPONENT_SET') {
      row(setSpec.name, 'node', 'fail', 'not found', setSpec.id)
      continue
    }
    const S = set.name
    const variants = set.children.filter(c => c.type === 'COMPONENT')
    const props = set.variantGroupProperties
    // This set's own variant axes (`axes:` on its `sets:` entry), else every axis of the mapping file.
    const setAxes = setSpec.axes ? M.variantAxes.filter(a => setSpec.axes.includes(a.name)) : M.variantAxes

    // 1. Axes: names, and no focus option (user decision 19.11.2026).
    const axes = Object.keys(props)
    const wantAxes = [...setAxes.map(a => a.name), ...(M.state ? ['state'] : []), ...M.componentStates.map(c => c.name)]
    const extraAxes = axes.filter(a => !wantAxes.includes(a))
    const missingAxes = wantAxes.filter(a => !axes.includes(a))
    row(
      S,
      'variant axes',
      extraAxes.length || missingAxes.length ? 'fail' : 'pass',
      axes.join(', '),
      wantAxes.join(', '),
      [missingAxes.length && `missing: ${missingAxes.join(', ')}`, extraAxes.length && `extra: ${extraAxes.join(', ')}`]
        .filter(Boolean)
        .join('; '),
    )

    // 2. Options per axis: the first set that has the axis (the default set, unless `axes:` says otherwise)
    //    has every mapping option; later sets a subset (e.g. ButtonInverted).
    for (const axis of setAxes) {
      const found = props[axis.name]?.values || []
      const extra = found.filter(v => !axis.options.includes(v))
      const full = M.sets.find(s => !s.axes || s.axes.includes(axis.name)) === setSpec
      const missing = full ? axis.options.filter(v => !found.includes(v)) : []
      row(
        S,
        `options \`${axis.name}\``,
        extra.length || missing.length ? 'fail' : 'pass',
        found.join(' · '),
        full ? axis.options.join(' · ') : `subset of ${axis.options.join(' · ')}`,
        [missing.length && `missing: ${missing.join(', ')}`, extra.length && `extra: ${extra.join(', ')}`]
          .filter(Boolean)
          .join('; '),
      )
    }
    if (M.state) {
      const found = props.state?.values || []
      const bad = found.includes('focus') || found.join() !== M.state.options.join()
      row(
        S,
        'options `state`',
        bad ? 'fail' : 'pass',
        found.join(' · '),
        M.state.options.join(' · '),
        found.includes('focus') ? 'focus is never a state' : '',
      )
    }

    // 3. Variant combinations: every expected variant exists, nothing extra.
    //    Blocked component state: `true` only with state=default. Interactive: `true` on every state.
    //    At most one component state `true` at a time (unless M.allowedCombos lists it).
    const ownOptions = setAxes.map(a => [a.name, props[a.name]?.values || []])
    let combos = [{}]
    for (const [name, values] of ownOptions) combos = combos.flatMap(c => values.map(v => ({ ...c, [name]: v })))
    const expected = []
    for (const base of combos) {
      const falseAll = Object.fromEntries(M.componentStates.map(c => [c.name, 'false']))
      // figmaCheck.stateless: options of an axis that have no hover / active (e.g. a non-interactive variant).
      const noInteraction = Object.entries(M.stateless || {}).some(([a, vals]) => vals.includes(base[a]))
      const stateOptions = M.state ? (noInteraction ? ['default'] : M.state.options) : null
      for (const st of stateOptions || [null]) expected.push({ ...base, ...(st ? { state: st } : {}), ...falseAll })
      for (const cs of M.componentStates) {
        const states = !M.state ? [null] : cs.interactive ? stateOptions : ['default']
        for (const st of states)
          expected.push({ ...base, ...(st ? { state: st } : {}), ...falseAll, [cs.name]: 'true' })
      }
    }
    const key = o =>
      Object.keys(o)
        .sort()
        .map(k => `${k}=${o[k]}`)
        .join(', ')
    const expectedKeys = new Set(expected.map(key))
    const foundKeys = new Set(variants.map(v => key(parseVariant(v.name))))
    const missingCombos = [...expectedKeys].filter(k => !foundKeys.has(k))
    const extraCombos = [...foundKeys].filter(k => !expectedKeys.has(k) && !(M.allowedCombos || []).includes(k))
    row(
      S,
      'variant combinations',
      missingCombos.length || extraCombos.length ? 'fail' : 'pass',
      variants.length,
      expectedKeys.size,
      [
        missingCombos.length && `missing: ${sample(missingCombos)}`,
        extraCombos.length && `extra: ${sample(extraCombos)}`,
      ]
        .filter(Boolean)
        .join(' | '),
    )

    // 4. Text properties: default = property name in sentence case (PHASE-2-PROPOSE.md → Naming),
    //    and bound on every variant where the mapping's node exists.
    const defs = set.componentPropertyDefinitions
    const textDefs = Object.entries(defs).filter(([, d]) => d.type === 'TEXT')
    const wantText = M.textProps.map(t => t.name)
    const foundText = textDefs.map(([k]) => cleanKey(k))
    row(
      S,
      'text properties',
      wantText.every(t => foundText.includes(t)) && foundText.every(t => wantText.includes(t)) ? 'pass' : 'fail',
      foundText.join(', ') || 'none',
      wantText.join(', ') || 'none',
    )
    for (const [k, d] of textDefs) {
      const name = cleanKey(k)
      row(
        S,
        `text default \`${name}\``,
        d.defaultValue === sentenceCase(name) ? 'pass' : 'fail',
        d.defaultValue,
        sentenceCase(name),
      )
      const nodeName = M.textProps.find(t => t.name === name)?.node
      let withNode = 0,
        bound = 0
      const unbound = []
      for (const v of variants) {
        const nodes = v.findAll(n => n.type === 'TEXT' && (!nodeName || n.name === nodeName))
        if (!nodes.length) continue
        withNode++
        if (nodes.some(n => n.componentPropertyReferences?.characters === k)) bound++
        else unbound.push(v.name)
      }
      row(
        S,
        `text binding \`${name}\``,
        bound === withNode ? 'pass' : 'fail',
        bound,
        withNode,
        unbound.length ? `unbound: ${sample(unbound)}` : '',
      )
    }

    // 5. Reactions (PHASE-3-BUILD.md → Interactions), per row: in the all-false group and in each
    //    interactive component state's group. Every other variant has none.
    if (M.state && M.reactions.length) {
      const byKey = new Map(variants.map(v => [key(parseVariant(v.name)), v]))
      let ok = 0,
        want = 0
      const problems = []
      for (const v of variants) {
        const p = parseVariant(v.name)
        const trues = M.componentStates.filter(c => p[c.name] === 'true')
        const inGroup = trues.length === 0 || (trues.length === 1 && trues[0].interactive)
        const expectedHere = inGroup
          ? M.reactions.filter(r => r.from === p.state && byKey.has(key({ ...p, state: r.to })))
          : []
        const found = (v.reactions || []).flatMap(r =>
          (r.actions || (r.action ? [r.action] : [])).map(a => ({
            trigger: r.trigger?.type,
            dest: a.destinationId,
            nav: a.navigation,
          })),
        )
        want += expectedHere.length
        for (const r of expectedHere) {
          const dest = byKey.get(key({ ...p, state: r.to })).id
          if (found.some(f => f.trigger === r.trigger && f.dest === dest && f.nav === 'CHANGE_TO')) ok++
          else problems.push(`${v.name}: missing ${r.trigger} → ${r.to}`)
        }
        if (found.length > expectedHere.length) problems.push(`${v.name}: ${found.length - expectedHere.length} extra`)
      }
      row(S, 'reactions', ok === want && !problems.length ? 'pass' : 'fail', ok, want, sample(problems, 3))
    }

    // 6. Paint bindings: every visible solid fill / stroke on the variants' own layers is bound to a
    //    Foundation library variable (remote). Nested instances are skipped — their main component
    //    owns their paints. Unbound paints → fail; a local (non-library) variable → fail.
    const unboundPaints = [],
      localVars = []
    const walk = (node, v) => {
      for (const field of ['fills', 'strokes']) {
        const paints = node[field]
        if (!Array.isArray(paints)) continue
        paints.forEach((p, i) => {
          if (p.type !== 'SOLID' || p.visible === false) return
          if (!p.boundVariables?.color) unboundPaints.push(`${v.name} › ${node.name} ${field}[${i}]`)
          else localVars.push(p.boundVariables.color.id)
        })
      }
      if ('children' in node && node.type !== 'INSTANCE') node.children.forEach(c => walk(c, v))
    }
    variants.forEach(v => walk(v, v))
    const localNames = []
    for (const id of new Set(localVars)) {
      const variable = await getVariable(id)
      if (variable && !variable.remote) localNames.push(variable.name)
    }
    row(
      S,
      'paint bindings',
      unboundPaints.length || localNames.length ? 'fail' : 'pass',
      `${unboundPaints.length} unbound, ${localNames.length} local`,
      '0 unbound, 0 local',
      [unboundPaints.length && `unbound: ${sample(unboundPaints)}`, localNames.length && `local: ${sample(localNames)}`]
        .filter(Boolean)
        .join(' | '),
    )

    // 7. Numeric bindings: non-zero spacing / radius / stroke weight / font size, and the width /
    //    height of fixed-size layers, without a variable. `review`, not fail: some are documented
    //    literals (mapping `tokens:` → bind: false). Compare each against that list before calling it
    //    fine. Not checked: line height and letter spacing (they sync as STRING variables, which
    //    Figma can't bind — documented literals, TODO.md); nested instances' own size (their main
    //    component or the parent's padding sets it); absolute layers (overlays such as tooltip-anchor).
    const fields = [
      'paddingLeft',
      'paddingRight',
      'paddingTop',
      'paddingBottom',
      'itemSpacing',
      'topLeftRadius',
      'strokeWeight',
      'minWidth',
      'minHeight',
      'fontSize',
    ]
    const unboundNums = new Map()
    // A field counts as bound when the field itself or its per-side / per-corner fields are.
    const sideFields = {
      strokeWeight: ['strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight'],
      topLeftRadius: ['cornerRadius', 'topLeftRadius'],
    }
    const walkNum = (node, isRoot) => {
      for (const f of fields) {
        const value = node[f]
        if (typeof value !== 'number' || value === 0) continue
        if (f === 'strokeWeight' && !(node.strokes || []).length) continue
        const bv = node.boundVariables || {}
        const bound = [f, ...(sideFields[f] || [])].some(k => bv[k])
        if (!bound) {
          const k = `${isRoot ? '(variant root)' : node.name}.${f}=${value}`
          unboundNums.set(k, (unboundNums.get(k) || 0) + 1)
        }
      }
      const sizable = ['COMPONENT', 'FRAME', 'RECTANGLE', 'ELLIPSE', 'VECTOR'].includes(node.type)
      if (sizable && node.layoutPositioning !== 'ABSOLUTE') {
        // A layer that scales or stretches with its parent (constraints SCALE / STRETCH, e.g. the
        // spinner's logo inside the token-sized `inner`) follows the parent's size: not a literal.
        const follows = c => c === 'SCALE' || c === 'STRETCH'
        for (const [f, sizing, constraint] of [
          ['width', node.layoutSizingHorizontal, node.constraints?.horizontal],
          ['height', node.layoutSizingVertical, node.constraints?.vertical],
        ]) {
          if (sizing !== 'FIXED' || !node[f] || (node.boundVariables || {})[f]) continue
          if (!isRoot && node.parent?.layoutMode === 'NONE' && follows(constraint)) continue
          const k = `${isRoot ? '(variant root)' : node.name}.${f}=${Math.round(node[f] * 100) / 100}`
          unboundNums.set(k, (unboundNums.get(k) || 0) + 1)
        }
      }
      if ('children' in node && node.type !== 'INSTANCE') node.children.forEach(c => walkNum(c, false))
    }
    variants.forEach(v => walkNum(v, true))
    const numList = [...unboundNums].map(([k, n]) => `${k} (×${n})`)
    row(S, 'numeric bindings', numList.length ? 'review' : 'pass', numList.length, 0, sample(numList, 8))

    // 8. Layers that exist only in some variants (M.conditionalLayers), e.g. the tooltip anchor.
    for (const layer of M.conditionalLayers || []) {
      const wrong = []
      let present = 0
      for (const v of variants) {
        const p = parseVariant(v.name)
        const should = Object.entries(layer.when).every(([axis, values]) =>
          [].concat(values).map(String).includes(p[axis]),
        )
        const has = !!v.findOne(n => n.name === layer.name)
        if (has) present++
        if (has !== should) wrong.push(`${v.name}: ${has ? 'has it' : 'missing'}`)
      }
      row(
        S,
        `layer \`${layer.name}\``,
        wrong.length ? 'fail' : 'pass',
        present,
        variants.filter(v =>
          Object.entries(layer.when).every(([a, vals]) =>
            [].concat(vals).map(String).includes(parseVariant(v.name)[a]),
          ),
        ).length,
        sample(wrong, 3),
      )
    }
  }

return { rows }
