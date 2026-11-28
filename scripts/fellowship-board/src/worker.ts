// Reads every <focused workspace>/.ds-team/boards/*.json and pushes them to the panel on change.
import { mkdirSync, readdirSync, readFileSync, rmSync, watch, type FSWatcher } from 'node:fs'
import { join } from 'node:path'
import type { OrcaWorkerApi } from 'orca/worker'
import type { Board } from './protocol'

const boardsDir = (root: string) => join(root, '.ds-team', 'boards')

export function readBoards(root: string | null): Board[] {
  if (!root) return []
  let names: string[]
  try {
    names = readdirSync(boardsDir(root)).filter(n => n.endsWith('.json'))
  } catch {
    return []
  }
  const boards: Board[] = []
  for (const name of names) {
    try {
      const board = JSON.parse(readFileSync(join(boardsDir(root), name), 'utf8')) as Board
      boards.push({ ...board, id: name.slice(0, -'.json'.length) })
    } catch {
      // A board being replaced right now: the next change event reads it.
    }
  }
  return boards.sort((a, b) => b.updatedAt - a.updatedAt)
}

async function rootOf(orca: OrcaWorkerApi, id: string | undefined): Promise<string | null> {
  if (!id) return null
  const { workspaces } = await orca.host.call('workspace.list')
  return workspaces.find(w => w.id === id)?.path ?? null
}

let root: string | null = null
let watcher: FSWatcher | null = null

export default function activate(orca: OrcaWorkerApi): void {
  root = null

  const push = () => orca.panels.post('board.changed', { boards: readBoards(root) })

  const follow = (next: string | null) => {
    if (next === root && watcher) return
    watcher?.close()
    watcher = null
    root = next
    if (root) {
      try {
        // Created up front so a session that starts its first board later is still seen.
        mkdirSync(boardsDir(root), { recursive: true })
        watcher = watch(boardsDir(root), push)
      } catch {
        // Read-only or vanished workspace: the panel shows no boards.
      }
    }
    push()
  }

  orca.events.on('workspace.changed', async ({ context }) => {
    follow(await rootOf(orca, context?.workspaceId))
  })

  orca.panels.handle('board.get', async () => {
    follow(await rootOf(orca, (await orca.host.call('workspace.readContext'))?.workspaceId))
    return { boards: readBoards(root) }
  })

  orca.panels.handle('board.clear', ({ id }) => {
    // The id names a file: refuse anything that could leave the boards folder.
    if (root && /^[\w-]+$/.test(id)) rmSync(join(boardsDir(root), `${id}.json`), { force: true })
    return { boards: readBoards(root) }
  })
}

export function deactivate(): void {
  watcher?.close()
  watcher = null
}
