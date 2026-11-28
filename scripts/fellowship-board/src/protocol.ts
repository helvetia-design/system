// The panel <-> worker contract. The panel is plain HTML (src/panel.html), so this types the worker.
export type Status = 'todo' | 'working' | 'waiting' | 'human' | 'done' | 'blocked' | 'skipped'
export type Item = { agent: string; action: string; status: Status; info: string; at: number }
/** What board.mjs writes to <workspace>/.ds-team/boards/<session>.json: one entry per `→` step. */
export type Board = {
  /** The file name without .json: the Claude session id. */
  id: string
  workflow: string
  /** The workflow's emoji (board.mjs WORKFLOW_ICONS); older boards have none. */
  icon?: string
  name: string
  component: string
  steps: { items: Item[] }[]
  updatedAt: number
}

declare module 'orca' {
  interface PluginRequests {
    /** The focused workspace's boards, most recently updated first. */
    'board.get': { output: { boards: Board[] } }
    /** Deletes one board (its session's file); answers the boards left. */
    'board.clear': { input: { id: string }; output: { boards: Board[] } }
  }
  interface PluginPanelEvents {
    /** Posted when a board file changes or the focused workspace moves. */
    'board.changed': { boards: Board[] }
  }
}
