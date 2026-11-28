// Runs src/worker.ts's activate(orca) over a mock host and a real board file in a temp folder.
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assert, mockHost, mountWorker, test } from 'orca/testing'
import * as main from './worker'

const board = { workflow: 'B', name: 'Bug fix', component: 'ds-progress-bar', steps: [], updatedAt: 1 }
const newer = { ...board, component: 'ds-tag', updatedAt: 2 }

test('answers every session board of the focused workspace, newest first, and clears them when focus leaves', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fellowship-'))
  mkdirSync(join(root, '.ds-team', 'boards'), { recursive: true })
  writeFileSync(join(root, '.ds-team', 'boards', 's1.json'), JSON.stringify(board))
  writeFileSync(join(root, '.ds-team', 'boards', 's2.json'), JSON.stringify(newer))
  const host = mockHost({
    results: {
      'workspace.readContext': { workspaceId: 'w1', branch: 'main', displayName: 'main', terminals: [] },
      'workspace.list': {
        workspaces: [{ id: 'w1', kind: 'folder', name: 'main', path: root, branch: 'main', hostId: 'local' }],
        truncated: false,
      },
    },
  })
  const worker = await mountWorker(main, { host, events: ['workspace.changed'] })
  assert.deepEqual(await worker.request('board.get'), {
    boards: [
      { ...newer, id: 's2' },
      { ...board, id: 's1' },
    ],
  })

  await worker.emit('workspace.changed', { context: null })
  assert.deepEqual(worker.posts.at(-1), { event: 'board.changed', payload: { boards: [] } })
  assert.deepEqual(worker.refusals, [])
  await worker.deactivate()
})

test('board.clear deletes one board and ignores ids that leave the boards folder', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fellowship-'))
  mkdirSync(join(root, '.ds-team', 'boards'), { recursive: true })
  writeFileSync(join(root, '.ds-team', 'boards', 's1.json'), JSON.stringify(board))
  writeFileSync(join(root, '.ds-team', 'secret.json'), '{}')
  const host = mockHost({
    results: {
      'workspace.readContext': { workspaceId: 'w1', branch: 'main', displayName: 'main', terminals: [] },
      'workspace.list': {
        workspaces: [{ id: 'w1', kind: 'folder', name: 'main', path: root, branch: 'main', hostId: 'local' }],
        truncated: false,
      },
    },
  })
  const worker = await mountWorker(main, { host, events: ['workspace.changed'] })
  await worker.request('board.get')
  await worker.request('board.clear', { id: '../secret' })
  assert.ok(existsSync(join(root, '.ds-team', 'secret.json')))
  assert.deepEqual(await worker.request('board.clear', { id: 's1' }), { boards: [] })
  await worker.deactivate()
})
