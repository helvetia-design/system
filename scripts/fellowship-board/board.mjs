#!/usr/bin/env node
// Writes this Claude session's DS-team board to <project>/.ds-team/boards/<session id>.json;
// the Orca plugin in this folder draws every board of the workspace. Steps come from the
// workflow's step line in AGENTS.md.
//
//   node scripts/fellowship-board/board.mjs start B ds-progress-bar   # steps from AGENTS.md
//   node scripts/fellowship-board/board.mjs set 3 human "approve the plan"   # step 3, all items
//   node scripts/fellowship-board/board.mjs set 6.2 done                     # step 6, item 2
//   node scripts/fellowship-board/board.mjs clear
//   (stdin hook JSON) | node scripts/fellowship-board/board.mjs hook
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const STATUSES = ['todo', 'working', 'waiting', 'human', 'done', 'blocked', 'skipped']

/** Step-line emoji (without variation selectors) → agent `name`. */
const EMOJI = {
  '👑': 'orchestrator',
  '⚔': 'architect',
  '🧙': 'component-engineer',
  '🧪': 'test-engineer',
  '🛡': 'a11y-expert',
  '🧝': 'token-engineer',
  '📜': 'documentation-engineer',
  '🧚': 'ux-designer',
  '🗺': 'issue-manager',
  '🐦‍⬛': 'magpie',
  '⛔': 'human',
}

/** Workflow letter → emoji, so a board is recognizable without remembering the letters. */
export const WORKFLOW_ICONS = {
  'A': '🏗️',
  'B': '🐛',
  'C': '✨',
  'D': '🎨',
  'E': '⚠️',
  'E′': '🗑️',
  'F': '🏷️',
  'G': '🪞',
  'H': '🔍',
  'I': '🛟',
  'J': '🚦',
  'K': '🧹',
  'L': '📝',
}

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
export const BOARDS = join(root, '.ds-team', 'boards')
/** Boards untouched this long are dropped on the next `start`: their session is long gone. */
const STALE_MS = 24 * 60 * 60 * 1000
/** One board per Claude session, so parallel sessions in one checkout never clash. */
const fileOf = session => join(BOARDS, `${session || 'default'}.json`)
const agentsMd = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'AGENTS.md')

/** Reads workflow `letter`'s step line from AGENTS.md markdown into `{ name, steps }`. */
export function parseWorkflow(markdown, letter) {
  for (const line of markdown.split('\n')) {
    const m = line.match(/^- \*\*(\S+) — ([^*]+?)(?::)?\*\*[^`]*`([^`]+)`/)
    if (!m || m[1] !== letter) continue
    let agent = 'orchestrator'
    const steps = m[3].split('→').map(step => ({
      items: step.split('∥').map(raw => {
        const text = raw.trim().replace(/\uFE0F/g, '')
        const emoji = Object.keys(EMOJI).find(e => text.startsWith(e))
        // An item without an emoji ("pr-body ∥ reply") belongs to the agent before it.
        if (emoji) agent = EMOJI[emoji]
        const action = (emoji ? text.slice(emoji.length) : text).trim()
        return { agent, action, status: 'todo', info: '', at: 0 }
      }),
    }))
    return { name: m[2].trim(), steps }
  }
  throw new Error(`workflow "${letter}" not found in AGENTS.md`)
}

function load(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function save(file, board) {
  board.updatedAt = Date.now()
  mkdirSync(BOARDS, { recursive: true })
  // Write then rename so the Orca worker never reads half a file.
  writeFileSync(`${file}.tmp`, JSON.stringify(board, null, 2))
  renameSync(`${file}.tmp`, file)
}

function mark(item, status, info) {
  if (!STATUSES.includes(status)) throw new Error(`status must be one of ${STATUSES.join('|')}`)
  Object.assign(item, { status, info: info || item.info, at: Date.now() })
}

/** Applies a Claude Code hook event; false when it changes nothing. */
export function applyHook(board, e) {
  const items = board.steps.flatMap(s => s.items)
  if (e.hook_event_name === 'PreToolUse' && e.tool_name === 'Agent') {
    const agent = e.tool_input?.subagent_type
    const item = items.find(i => i.agent === agent && ['todo', 'waiting'].includes(i.status))
    if (!item) return false
    mark(item, 'working', e.tool_input?.description)
    return true
  }
  if (e.hook_event_name === 'SubagentStop' && e.agent_type) {
    const item = items.find(i => i.agent === e.agent_type && i.status === 'working')
    if (!item) return false
    mark(item, 'done')
    return true
  }
  return false
}

/** `set 3 human …` marks every item of step 3; `set 3.2 done` only its second item. */
export function setStep(board, ref, status, info) {
  const [s, i] = String(ref).split('.').map(Number)
  const step = board.steps[s - 1]
  if (!step) throw new Error(`no step ${s} (1–${board.steps.length})`)
  const items = i ? [step.items[i - 1]] : step.items
  if (!items[0]) throw new Error(`no item ${ref}`)
  for (const item of items) mark(item, status, info)
  return board
}

function main([cmd, ...args]) {
  if (cmd === 'hook') {
    // A hook must never break the session: no board or a foreign agent is a no-op.
    try {
      const e = JSON.parse(readFileSync(0, 'utf8'))
      const file = fileOf(e.session_id)
      const board = load(file)
      if (board && applyHook(board, e)) save(file, board)
    } catch {}
    return
  }

  const file = fileOf(process.env.CLAUDE_CODE_SESSION_ID)
  if (cmd === 'start') {
    const [workflow, component] = args
    if (!workflow || !component) throw new Error('usage: start <workflow> <component>')
    const { name, steps } = parseWorkflow(readFileSync(agentsMd, 'utf8'), workflow)
    mkdirSync(BOARDS, { recursive: true })
    for (const old of readdirSync(BOARDS, { withFileTypes: true }).filter(d => d.isFile())) {
      const path = join(BOARDS, old.name)
      if (Date.now() - statSync(path).mtimeMs > STALE_MS) rmSync(path, { force: true })
    }
    save(file, { workflow, icon: WORKFLOW_ICONS[workflow], name, component, steps })
    // The orchestrator reads this line to pick its board (docs/agents/ds-team.md → Status board).
    console.log(
      process.env.ORCA_APP_VERSION
        ? 'board: live — Orca draws it in the 🧱 Fellowship panel; keep it current with `set`'
        : 'board: written, but no Orca to draw it — print the markdown status board too',
    )
    return
  }
  if (cmd === 'clear') return rmSync(file, { force: true })

  const board = load(file)
  if (!board) throw new Error(`no board at ${file}; run "start" first`)
  if (cmd === 'set') return save(file, setStep(board, args[0], args[1], args.slice(2).join(' ')))
  throw new Error(`unknown command "${cmd}" (start|set|clear|hook)`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(process.argv.slice(2))
  } catch (err) {
    console.error(`board: ${err.message}`)
    process.exit(1)
  }
}
