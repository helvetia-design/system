// Run by `orca plugin test .` (node:test).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { applyHook, parseWorkflow, setStep, WORKFLOW_ICONS } from './board.mjs'

const cli = new URL('./board.mjs', import.meta.url).pathname

const md = [
  '- **B — Bug fix:** `🧙 reproduce (red) → 🧙 fix (green) → 🧚 drift check → 🗺️ pr-body ∥ reply`',
  '- **E′ — Removal** (later major): `⛔ gate → 🧙 remove`',
].join('\n')

test('parses steps, parallel items and inherited agents from a step line', () => {
  const { name, steps } = parseWorkflow(md, 'B')
  assert.equal(name, 'Bug fix')
  assert.deepEqual(
    steps.map(s => s.items.map(i => `${i.agent}:${i.action}`)),
    [
      ['component-engineer:reproduce (red)'],
      ['component-engineer:fix (green)'],
      ['ux-designer:drift check'],
      ['issue-manager:pr-body', 'issue-manager:reply'],
    ],
  )
  assert.equal(parseWorkflow(md, 'E′').steps[0].items[0].agent, 'human')
  assert.throws(() => parseWorkflow(md, 'Z'))
})

test('dispatch takes the next open item of that agent; stop finishes it', () => {
  const board = { steps: parseWorkflow(md, 'B').steps }
  const items = board.steps.flatMap(s => s.items)
  const dispatch = {
    hook_event_name: 'PreToolUse',
    tool_name: 'Agent',
    tool_input: { subagent_type: 'component-engineer', description: 'red test' },
  }
  assert.ok(applyHook(board, dispatch))
  assert.equal(items[0].status, 'working')
  assert.ok(applyHook(board, { hook_event_name: 'SubagentStop', agent_type: 'component-engineer' }))
  assert.equal(items[0].status, 'done')
  assert.ok(applyHook(board, dispatch))
  assert.equal(items[1].status, 'working')
  assert.equal(applyHook(board, { hook_event_name: 'PreToolUse', tool_name: 'Bash' }), false)
})

test('set marks a whole step or one item and refuses unknown refs and statuses', () => {
  const board = { steps: parseWorkflow(md, 'B').steps }
  setStep(board, '4.2', 'skipped')
  assert.deepEqual(
    board.steps[3].items.map(i => i.status),
    ['todo', 'skipped'],
  )
  setStep(board, 3, 'human', 'approve')
  assert.equal(board.steps[2].items[0].info, 'approve')
  assert.throws(() => setStep(board, 9, 'done'))
  assert.throws(() => setStep(board, 1, 'nope'))
})

test('each Claude session gets its own board, and hooks route by session_id', () => {
  const project = mkdtempSync(join(tmpdir(), 'fellowship-cli-'))
  const run = (session, args, input) =>
    execFileSync('node', [cli, ...args], {
      input,
      env: { ...process.env, CLAUDE_PROJECT_DIR: project, CLAUDE_CODE_SESSION_ID: session },
    })
  const read = session => JSON.parse(readFileSync(join(project, '.ds-team', 'boards', `${session}.json`), 'utf8'))

  run('s1', ['start', 'B', 'ds-progress-bar'])
  run('s2', ['start', 'C', 'ds-tag'])
  const dispatch = {
    hook_event_name: 'PreToolUse',
    tool_name: 'Agent',
    tool_input: { subagent_type: 'component-engineer' },
  }
  run('', ['hook'], JSON.stringify({ ...dispatch, session_id: 's2' }))

  assert.equal(read('s1').steps[0].items[0].status, 'todo')
  assert.equal(read('s2').component, 'ds-tag')
  assert.ok(
    read('s2')
      .steps.flatMap(s => s.items)
      .some(i => i.status === 'working'),
  )
  run('s1', ['clear'])
  assert.throws(() => read('s1'))
})

test('every workflow in AGENTS.md has an emoji', () => {
  const agents = readFileSync(new URL('../../AGENTS.md', import.meta.url), 'utf8')
  const letters = [...agents.matchAll(/^- \*\*(\S+) — /gm)].map(m => m[1])
  assert.ok(letters.length > 10)
  assert.deepEqual(
    letters.filter(l => !WORKFLOW_ICONS[l]),
    [],
  )
})
