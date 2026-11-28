# Fellowship board

Live DS-team status board as an Orca sidebar panel: the workflow's steps as a flow, each
agent's step a card that turns green when done.

- `board.mjs` writes one board per Claude session to `<repo>/.ds-team/boards/<session id>.json`
  (gitignored), so parallel sessions never clash. The CLI takes the id from
  `CLAUDE_CODE_SESSION_ID`, the hook from its input's `session_id`. `start` drops boards
  untouched for 24 h. Steps come from the workflow's
  step line in `AGENTS.md` (`→` = step, `∥` = parallel items).
  - `start <workflow> <component>`: new board, e.g. `start B ds-progress-bar`.
  - `set <step>[.<item>] <todo|working|waiting|human|done|blocked|skipped> [info]`: gates,
    blocks, skips and 👑 steps, e.g. `set 3 human "approve the plan"`.
  - `clear`.
  - `hook`, from `.claude/settings.json`: an `Agent` dispatch marks that agent's next open item
    `working`; `SubagentStop` marks it `done`.
- The Orca plugin (`orca-plugin.json`, `src/`) reads every board of the focused workspace and
  redraws on every write. With more than one, a switcher lists them with their most urgent
  status (🙋 needs you first). **Clear** in a board's header deletes its file.

```bash
orca plugin dev load ./scripts/fellowship-board --approve <fingerprint>  # Orca prints it
orca plugin test ./scripts/fellowship-board
```
