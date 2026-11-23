#!/usr/bin/env node
// Phase 4 check: prints the `use_figma` code that checks the built component set(s).
//   node .claude/skills/ds-code-to-figma/scripts/figma-check-set.mjs <component> > /tmp/check.js
// Then pass the printed code, unchanged, as `use_figma`'s `code` (file key: figma.config.json →
// componentLibraryFileKey). It returns { rows }; paste them into the validation file as they are.
//
// Covers the whole family: the owner's sets and every sub-component's (each member's own
// `<name>.figma.md`). A member without a mapping file becomes a `fail` row.
//
// SPEC comes from the mapping file only where the mapping is the decision (sets, axes, options,
// component states, text props). Rules come from the skill, never from the mapping: text defaults
// are checked against the naming rule, reactions against PHASE-3-BUILD.md → Interactions, and focus
// is never a state.
import fs from 'node:fs'
import path from 'node:path'
import { REPO_ROOT, resolveComponentDir, readMapping, findMembers } from './lib/mapping.mjs'

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: figma-check-set.mjs <component name | folder | mapping file>')
  process.exit(2)
}

const componentDir = resolveComponentDir(arg)
const componentsRoot = path.join(REPO_ROOT, 'packages/core/src/components')
const [category, family] = path.relative(componentsRoot, componentDir).split(path.sep)
const familyDir = path.join(componentsRoot, category, family)

// PHASE-3-BUILD.md → Interactions (the rule, not the mapping).
const REACTIONS = [
  { from: 'default', trigger: 'ON_HOVER', to: 'hover' },
  { from: 'default', trigger: 'ON_PRESS', to: 'active' },
  { from: 'hover', trigger: 'ON_PRESS', to: 'active' },
]

const members = []
const missingMappings = []
let figmaPage = null
for (const member of findMembers(familyDir)) {
  const file = path.join(path.dirname(member.file), `${member.name}.figma.md`)
  if (!fs.existsSync(file)) {
    missingMappings.push({ tag: member.tag, file: path.relative(REPO_ROOT, file) })
    continue
  }
  const map = readMapping(file)
  const missing = ['sets', 'figmaPage', 'props'].filter(k => !map[k])
  if (missing.length) {
    console.error(`${file}: missing or unparsable ${missing.join(', ')}; YAML errors: ${JSON.stringify(map.__errors)}`)
    process.exit(1)
  }
  figmaPage = figmaPage || map.figmaPage
  members.push({
    tag: member.tag,
    sets: map.sets.map((s, i) => ({ id: s.figmaMasterNodeId, name: s.name, isDefault: i === 0 })),
    variantAxes: map.props
      .filter(p => p.figmaPropertyType === 'variant')
      .map(p => ({ name: p.figmaProperty, options: (p.figmaOptions || p.options).map(String) })),
    state: map.states?.options ? { options: map.states.options.map(String) } : null,
    componentStates: Object.entries(map.componentStates || {}).map(([k, c]) => ({
      name: c.figmaProperty || k,
      interactive: c.interactive === true,
    })),
    textProps: map.props
      .filter(p => p.figmaPropertyType === 'text')
      .map(p => ({ name: p.figmaProperty, node: p.node })),
    reactions: REACTIONS,
    // Optional: figmaCheck: { conditionalLayers: [{ name, when: { axis: [values] } }], allowedCombos: [...] }.
    // Values become strings, so an unquoted YAML `false` still matches the variant name's `false`.
    conditionalLayers: (map.figmaCheck?.conditionalLayers || []).map(l => ({
      name: l.name,
      when: Object.fromEntries(Object.entries(l.when || {}).map(([a, v]) => [a, [].concat(v).map(String)])),
    })),
    allowedCombos: (map.figmaCheck?.allowedCombos || []).map(String),
  })
}
if (!members.length) {
  console.error(`No mapping file in ${path.relative(REPO_ROOT, familyDir)}`)
  process.exit(1)
}

const SPEC = { figmaPage, members, missingMappings }
const body = fs.readFileSync(new URL('./figma-check-set.figma.js', import.meta.url), 'utf8')
process.stdout.write(`const SPEC = ${JSON.stringify(SPEC, null, 2)}\n\n${body}`)
