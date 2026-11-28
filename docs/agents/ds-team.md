# DS Team — The Fellowship of the Brick 🧱

> _One Brick to rule them all,_\
> _One Brick to find them,_\
> _One Brick to bring them all,_\
> _And in the tokens bind them._

How the design system agents work together. The **orchestrator is the main session**, not an
agent — it dispatches the agents below and holds no component context of its own.

## Orchestrator budget

The orchestrator routes. It does not investigate.

The orchestrator is the most expensive agent in a run: every turn re-reads its whole context,
and every agent return, gate and status board is a turn. Keep that context _short_:

- **One workflow per session.** When the run's workflow closes, or a different one starts (a
  B spun out of a D, a retro, a review), tell the human to start a fresh session. Handoff
  files, `.figma.md` and the unstaged diff carry the state; the old context only adds cost.
- **Relay, don't repeat.** Pass an agent's report on to the human in a few lines: verdict,
  links, open decisions. Detail stays in the files the agent named.
- **Don't `Read` a component source file end-to-end.** `Grep`/`Glob` for the one fact a routing
  or clarifying decision actually needs. A planner is about to read that file properly; reading
  it first pays for it twice and changes nothing about where the work goes.
- **Grill the human before dispatching a planner** — the `grilling` skill, to an empty frontier,
  written out as a brief (Workflow A step 0). This is where requirement contradictions and
  assumed scale get caught: "a country select" is not "every ISO country", and a planner that has
  to ask "is this the right component?" has already spent a full planning run. Only the
  orchestrator can do this; `grilling` waits on user answers and subagents have no user channel.
- **Don't restate a plan in a dispatch prompt.** Point at `docs/plans/components/<name>-plan.md` and name
  only the deltas and the scope fence. The agent reads the file. (Keep the scope fence — telling
  an agent which files are _not_ its job is what stops it writing another agent's tests.)
- **Agents hand over files; the orchestrator passes paths.** Planners write their own plan files
  for this reason.
- **One agent, one suite.** Each agent runs the narrowest suite covering its own files and nothing
  more — no whole-package builds, no re-running another agent's suite "to be safe".
  `ds-validate-component` does the cross-cutting pass once, in step 7.
- **Dispatch the plan's whole file list, not just the obvious part.** Per-component `CONTEXT.md`,
  the framework barrels, the ADR and the changeset are named in the plan from the start; leaving
  them unassigned turns them into an extra agent run after the tests are already green.
- **Out-of-scope findings become issues at the plan gate, not just a plan line.** Plans are
  gitignored and overwritten by the next run, so a defect that lives only there is lost. Every
  planner returns an "Out-of-scope findings" list next to its blocking decisions; the orchestrator
  dispatches 🗺️ issue-manager · `ds-issue-write` to draft one GitHub issue per finding, shows the
  drafts at the gate, re-dispatches it with `post` on the human's OK, and links the numbers in
  the brief.
- **Continue an agent instead of starting a new one — while its history is small.** When the
  same agent comes back for the next step (🧙 render check → modify → changeset, 📜 stories →
  recipe), `SendMessage` it: a fresh dispatch re-reads every file the first one already read.
  **Exception: 🧚 ux-designer.** Its Figma runs grow past 100k tokens and a resumed agent
  re-pays that history every turn, so it is one fresh dispatch per stretch between checkpoints
  (Workflow D → Dispatch). A small follow-up (flip a checkpoint, fix one value) may still resume it.
- **Don't message a running agent with a hint it probably covers.** A `SendMessage` that lands
  after the agent's last step resumes it for a whole second run (~40k for 🧝). Read its report
  first; send the hint only if the report shows it was missed.
- **Small jobs ride along.** The changeset goes in the last 🧙 dispatch's prompt, or a
  SendMessage to it, never a dispatch of its own. The token audit rides with 🧝's tokens step
  when there is one. Checkpoint flips in `<name>.figma.md` ("anatomy: approved") ride with the
  next 🧚 dispatch; resume a large agent for one only when no later dispatch is coming.
- **Batch findings, then fan out once.** When a run collects code findings (a planner's
  out-of-scope list, an audit, a review), gather them all **before** dispatching 🧙, and run
  🛡️ a11y-audit, 🧙 polish-audit, `pnpm spell` and code-review in that gathering pass. One 🧙 pass fixes the
  batch; then 🧪 ∥ 🛡️ ∥ 📜 run **once**, last. Dispatching tests or docs between fix rounds
  pays for the same MDX or test file again every time a later finding changes the behavior.
- **Skip what can't apply, by rule.** Layout-only CSS (no color, no interaction, no
  semantics) skips 🛡️ a11y-test and a11y-audit. No `<name>.figma.md` skips the drift check.
  No new or changed token skips 🧝's tokens step. Name the skip and the reason on the board.
- **A known-broken environment is a documented fact, not a discovery.** Before an agent
  investigates a failing suite, check `packages/playwright/CONTEXT.md` (SSR hydration failure,
  missing visual baselines for a new component) and `packages/core/CONTEXT.md` "Testing
  Requirements" (no component-level unit specs — Vitest covers pure helpers only). All are recorded
  there. Re-proving one costs a full Playwright run and changes nothing.

## The agents

| Agent                       | Model  | Writes                                                                                                                                                                                        | Read-only |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: |
| ⚔️ `architect`              | opus   | `docs/plans/components/**` — plans only, never production code                                                                                                                                |           |
| 🧙 `component-engineer`     | sonnet | `packages/core/src/components/**`, `test/*.visual.html`, `test/*.style.html`, `.spec.ts`, `.component.play.ts`, `*.po.ts` (test-first), framework wrappers², ADRs, package `CONTEXT.md` files |           |
| 🧪 `test-engineer`          | sonnet | `.visual.play.ts`, `.ssr.play.ts`, `.variants.ts`, framework integration tests³; coverage review of 🧙's tests (findings only)                                                                |           |
| 🛡️ `a11y-expert`            | opus   | `.a11y.play.ts` (axe + keyboard/focus/ARIA state), a11y reports                                                                                                                               |           |
| 🧝 `token-engineer`         | opus   | `packages/tokens/tokens/*.json`, token refs in SCSS                                                                                                                                           |           |
| 📜 `documentation-engineer` | sonnet | `apps/storybook/src/**`                                                                                                                                                                       |           |
| 🧚 `ux-designer`            | opus   | the Figma file, `<name>.figma.md`, `<name>.figma-validation.md`                                                                                                                               |           |
| 🗺️ `issue-manager`          | sonnet | `docs/plans/github/**` drafts; GitHub issues, comments, labels and PR bodies — after a gate                                                                                                   |           |
| 🐦‍⬛ `magpie`                 | opus   | `docs/plans/magpie/**`, `docs/plans/components/<name>-brief.md` — scouts a foreign element, never production code                                                                             |           |

Plus 👑 the **orchestrator** — the main session, which dispatches but owns no files.

**Model per dispatch.** The Model column is the default. Text-only or mechanical skills on an
opus agent go out with the Agent tool's `model: "sonnet"` override: 🧚 `ds-design-guidelines`
(writes one markdown file, no Figma) and 🛡️ `ds-a11y-test` (writes tests from a known
contract). Planning, Figma builds and audits keep opus.

**Display names — The Fellowship of the Brick 🧱** (every component is a building block) (labels in the banner, board and reports; dispatch still uses the agent's `name`):
👑 Guild Master · ⚔️ Sir Plans-a-Lot · 🧙 Brick Wizard · 🧪 Potion Taster · 🛡️ Tab Knight ·
🧝 J.R.R. Token · 📜 Scroll Keeper · 🧚 Pixel Fairy · 🗺️ Quest Master · 🐦‍⬛ Loot Raven

² **Framework wrappers and the other cross-package files** are the component-engineer's, because
they change in lockstep with the component's public API:

- **The hand-authored framework layer**, via `ds-framework-wrappers`: every new component in
  `packages/react/src/wrappers.ts` **and** `wrappers.server.ts`; every form component's Angular
  value-accessor wrapper (`packages/angular/src/forms/ds-<name>.ts`) and its export — without
  it `formControlName` and `ngModel` silently do nothing; deprecation JSDoc on both.
- `docs/adr/**`, `packages/*/CONTEXT.md` and the component's own `CONTEXT.md`

³ **Framework integration tests** are the test-engineer's — for **every form component**, and for
any component whose events or wrappers change. They prove the wrapper works in a real app, which
no core suite can:

| App                        | Writes                                                                                     | Proves                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `apps/integration-angular` | `src/app/<name>-demo/**`, its entry in `src/app/app.ts` + `app.html`, `e2e/<name>.spec.ts` | `ngModel` and reactive form: initial value, user change, `setValue`, disabled, touched + invalid |
| `apps/integration-react`   | the component's block in `src/Root.tsx`, its tests in `e2e/app.spec.ts`                    | renders without console errors, event updates React state                                        |

Model: `select-demo` + `e2e/select.spec.ts`, and the `ds-phone-input` test in the React
`app.spec.ts`. Run after `pnpm app:angular` / `pnpm app:react`'s build step has built core +
the framework package: `pnpm --filter integration-angular play:run e2e/<name>.spec.ts`, and
`pnpm --filter integration-react build && pnpm --filter integration-react play:run`.

`packages/core/src/index.ts` exports `Components` plus a few shared interfaces — a new component
needs no entry there unless the plan names a public interface type. Generated files
(`components.d.ts`, Angular `generated/*`, `apps/storybook/.storybook/story-paths.json` from
`scripts/build-docs.mjs`) are never hand-edited and never assigned.

Each agent's symbol + display name is its label in a run: it prefixes every dispatch, status line, completion
report and the Agent tool's `description` (`⚔️ Sir Plans-a-Lot: plan ds-x for Figma`). The agent's identity is
still its `name`.

The kickoff banner (format and step lines in the root `AGENTS.md`) comes first, once per run;
the status board follows it.

### Status board

Right after the kickoff banner, the orchestrator runs
`node scripts/fellowship-board/board.mjs start <X> <component>` (e.g. `start B ds-progress-bar`).
It builds this session's **live board** from the workflow's step line, and its output names the
board to keep:

- **`board: live`** (running in Orca): the 🧱 Fellowship panel is the status board. Print no
  markdown board; keep the live board current instead.
- **`board: written, but no Orca`**: keep the live board current _and_ print the markdown board
  below.

Hooks keep the live board current for every dispatch (🔄) and return (✅). The orchestrator
marks what no hook sees, with `board.mjs set <step>[.<item>] <status> [info]`. Steps and items
number from 1 as in the step line (`→` step, `∥` item):

| When                                    | `set`                                  |
| --------------------------------------- | -------------------------------------- |
| a gate opens                            | `set 3 human "approve the plan"`       |
| the human passes it                     | `set 3 done`                           |
| a 👑 step starts / ends                 | `set 1 working "grill"` · `set 1 done` |
| an agent fails or reports `BLOCKED`     | `set 5 blocked "<why>"`                |
| a step is skipped by rule (drift check) | `set 6 skipped "no .figma.md"`         |

The markdown board, for runs without Orca: the **full** board when a gate opens and when the
run ends — one row per agent in the current workflow, nothing else in the message before it.
Agents not in the workflow are left out. On a dispatch or a return, print only the rows that
changed, under the heading: every full board stays in context for the rest of the session.

| Status | Meaning                                           |
| :----: | ------------------------------------------------- |
|   🔄   | working — dispatched, not yet returned            |
|   ⏳   | waiting — on another agent (name it) or on a gate |
|   🙋   | needs the human — a gate or a blocking question   |
|   ✅   | done — returned, its output accepted              |
|   ⛔   | blocked — failed or reported `BLOCKED`; say why   |
|   ⬜   | not started                                       |

Print it as rendered markdown (not a code block): a heading, a workflow line, then a table.
Heading: `## 🧱 Fellowship of the Brick · <component>` (component in backticks), then `**Workflow <X> · step <n>**`.
Columns: status emoji · agent emoji + bold display name (never the raw `name`) · info.

```markdown
## 🧱 Fellowship of the Brick · `ds-country-select`

**Workflow A · step 4**

|     | Agent                  | Info                                                   |
| :-: | ---------------------- | ------------------------------------------------------ |
| ✅  | ⚔️ **Sir Plans-a-Lot** | plan → docs/plans/components/ds-country-select-plan.md |
| ✅  | 🧝 **J.R.R. Token**    | 3 Component tokens added                               |
| 🔄  | 🧙 **Brick Wizard**    | implementing ds-country-select.tsx                     |
| ⏳  | 🧪 **Potion Taster**   | waits on 🧙                                            |
| ⏳  | 🛡️ **Tab Knight**      | waits on 🧙                                            |
| ⬜  | 📜 **Scroll Keeper**   | not started                                            |
| 🙋  | **Human**              | gate: approve the plan                                 |
```

Display names: ⚔️ Sir Plans-a-Lot, 🧝 J.R.R. Token, 🧙 Brick Wizard, 🧪 Potion Taster,
🛡️ Tab Knight, 📜 Scroll Keeper, 🧚 Pixel Fairy, 🗺️ Quest Master, 🐦‍⬛ Loot Raven, 👑 Guild Master.
A human gate is a `Human` row: ⛔ for a stop point, 🙋 when the board needs an answer.

The info column is one line: the file or step the agent is on, the artifact it handed over,
or the agent it waits on. Parallel agents show 🔄 together — that is the point of the board.

File ownership is **disjoint by design** — that is what makes the parallel steps below safe.
An agent that finds a defect outside its own files reports it; it never reaches across.

**Behavior tests are written test-first by their author.** The component-engineer implements
in `mattpocock-skills:tdd` cycles — one red → green cycle per seam in the plan's `## Test seams`
(human-approved at the plan gate) — so it owns `.spec.ts`, `.component.play.ts` and the Page
Object. The test-engineer reviews that coverage **read-only** (every seam tested, every
reachable state and enum variant, no `tdd` anti-pattern, mounted through the PO; no numeric
threshold) and reports gaps as findings for the engineer's repair round. It owns the visual
layer — `.variants.ts`, `.visual.play.ts`, `.ssr.play.ts` — and the framework integration
tests.

**Touch — the DS must work on phones and tablets** (new and changed components; shipped ones via
a Workflow K sweep). Three parts, three owners, Playwright emulation only:

| Part                                                        | Owner                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tap works, nothing hover-only, gestures have an alternative | 🧙 — `@touch`-tagged TDD seams from the plan's `## Touch`, run in `⚙️ Component / 👆 Touch`; 🧪 reviews |
| Target size ≥ 24×24 px (WCAG 2.5.8)                         | 🛡️ — `expectMinTargetSize()` in `.a11y.play.ts`                                                         |
| Layout on phone + tablet (one breakpoint)                   | 🧪 — the `📱 Mobile Chrome` visual project                                                              |

Shared Playwright helpers (`PageObject` base, `functions/`) are the test-engineer's; per-component
`*.po.ts` files stay the component-engineer's.

**The test/a11y split is by file, with no overlap.** Everything needed for WCAG 2.2 AA —
axe scans, keyboard map, focus order and management, ARIA state transitions — goes in
`.a11y.play.ts`, the a11y-expert's file. `.component.play.ts` covers behavior, events and
props, and is the component-engineer's. The two never write into each other, so they can run in
parallel; the `♿️ A11Y` Playwright project is an ordinary suite with an extra `a11y()` scan
helper, so keyboard tests work there unchanged.

a11y-expert and test-engineer consume the component-engineer's Page Object read-only. A missing PO locator is reported,
not edited — use a local locator meanwhile.

Shipped components still keep their keyboard tests in `.component.play.ts` (15 of them). They
stay where they are; only new a11y coverage follows the rule above.

## Skills per agent

Each agent file's Workflow table lists its skills — that is the source of truth. A skill that
writes has exactly one owner; one that only reads, reports or runs checks
(`ds-validate-*`, `ds-audit-tokens`, `ds-ui-polish-audit`, `ds-changeset`) can be shared with any agent whose tools
run it. Only the component-engineer runs `ds-lint-component --fix`. `ds-update-screenshots` is
user-invoked only.

## Handoff artifacts

Agents hand over **files, never prose**. This keeps the orchestrator's context small and makes
a run resumable.

| Artifact                                                               | Written by                           | Read by                                                      |
| ---------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `docs/plans/components/<component>-brief.md`                           | orchestrator, or magpie (Workflow G) | every agent, first — `## Gate decisions` overrides the plans |
| `docs/plans/magpie/<name>/` (screenshots, `anatomy.png`, `scout.json`) | magpie                               | architect, a11y-expert, token-engineer, ux-designer          |
| `docs/plans/components/<component>-plan.md`                            | architect¹                           | component-engineer, test-engineer, docs                      |
| `docs/plans/components/<component>-a11y-plan.md`                       | a11y-expert¹                         | component-engineer, test-engineer                            |
| `docs/plans/components/<component>-figma-plan.md`                      | architect¹                           | ux-designer                                                  |
| `test/<name>.visual.html`                                              | component-engineer                   | **human review**, test-engineer                              |
| `<family>.token-check.md`                                              | token-engineer                       | token-engineer, architect                                    |
| a11y audit findings                                                    | a11y-expert                          | component-engineer                                           |
| coverage-review findings                                               | test-engineer                        | component-engineer                                           |
| `<name>.figma.md`                                                      | ux-designer                          | ux-designer, next family that nests it                       |
| `<name>.figma-validation.md`                                           | ux-designer                          | ux-designer, component-engineer                              |
| anatomy + do's/don'ts copy                                             | ux-designer                          | documentation-engineer                                       |
| `docs/plans/github/*.md` (issue, reply, PR drafts)                     | issue-manager                        | **human gate**, then issue-manager in `post` mode            |

¹ Each planner **writes its own plan file** — the architect's `Write` is scoped to
`docs/plans/components/**` and nothing else — and returns only a summary: the path, the blocking
decisions needing human approval, any token gaps, and the out-of-scope findings to file as issues. They write different files, so they stay
safe to run in parallel. Returning the plan body so the orchestrator can write it back out pays
for the same content twice, once as input and once as output.

**`docs/plans/components/` is gitignored, and that is the whole lifecycle.** A component plan is
a handoff, not a document: it never lands in the PR, never needs a cleanup step, and the next run
overwrites it. No agent ever deletes a plan — it is exactly what you want when a run resumes or
review finds a gap. Anything in a plan that must outlive the task belongs in the component's
`CONTEXT.md` or an ADR under `docs/adr/`; the plan's own file list names those.

`docs/plans/` itself stays tracked, for cross-component project plans (the migrations). Keeping
the two apart matters: source comments across this repo cite `docs/plans/*-plan.md` files that
were deleted after execution, and a throwaway component plan must never become a citation target.

---

# Workflows

One file per workflow — read only the one the run needs. The step lines for the kickoff banner
are in the root `AGENTS.md`.

| Workflow                 | File                                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| A — New component        | [workflows/a-new-component.md](workflows/a-new-component.md)               |
| B — Bug fix              | [workflows/b-bug-fix.md](workflows/b-bug-fix.md)                           |
| C — Feature              | [workflows/c-feature.md](workflows/c-feature.md)                           |
| D — Component into Figma | [workflows/d-component-into-figma.md](workflows/d-component-into-figma.md) |
| E / E′ — Deprecation     | [workflows/e-deprecation.md](workflows/e-deprecation.md)                   |
| G — Recreate from a site | [workflows/g-recreate.md](workflows/g-recreate.md)                         |
| H — PR review            | [workflows/h-pr-review.md](workflows/h-pr-review.md)                       |
| I — PR rescue            | [workflows/i-pr-rescue.md](workflows/i-pr-rescue.md)                       |
| J — CI failure triage    | [workflows/j-ci-triage.md](workflows/j-ci-triage.md)                       |
| K — Audit sweep          | [workflows/k-audit-sweep.md](workflows/k-audit-sweep.md)                   |
| L — Spec only            | [workflows/l-spec.md](workflows/l-spec.md)                                 |

## GitHub — the closing step of A, B, C and E, and Workflow F

Everything the team writes on GitHub goes through 🗺️ issue-manager, in two dispatches:

1. **Draft** — `ds-pr-body` always; `ds-issue-reply` (`in-progress`) too when the run started
   from an issue. Drafts land in `docs/plans/github/` (gitignored).
2. **⛔ Gate** — the orchestrator shows the draft paths; the human edits or approves.
3. **Post** — re-dispatch (or `SendMessage` the same agent) with `post` and the approved paths.
   No PR yet → the agent reports the `gh pr create --body-file …` line for the human instead.

`Closes #N` is the PR body's first line, so the PR and issue cross-link and merging closes the
issue — only when the PR targets the default branch (`ds-pr-body` checks).

**Workflow F — Triage** (standalone, no component): 🗺️ `ds-issue-triage` drafts a decision table
plus replies → ⛔ gate → 🗺️ `post` applies labels and comments. Never closes issues.

## Figma drift check — the closing step of B, C and E

The orchestrator runs it after the changeset, **only when both hold**:

1. a `<name>.figma.md` sits next to a changed `.tsx` — the component is in the Figma library;
2. the change touched the Figma surface: a prop, enum value, slot or `@part` changed; a
   Component token was added, renamed or re-pointed; or `test/<name>.visual.html` changed.

A behavior-only fix — events, keyboard, logic, a11y attributes — skips it.

**Dispatch:** one fresh 🧚 ux-designer · `ds-figma-review`, pointed at `<name>.figma.md` and
the changed files. It repairs Figma and updates `<name>.figma.md`; a code-side defect it finds
is a finding for the owner, not a Figma workaround. A new token with no Figma variable goes
first to 🧝 token-engineer · `ds-sync-figma-tokens`, as in Workflow D step 2.

**Figma MCP not authorized** → do not skip silently. The final report names the drift as open
("`ds-<name>`: Figma out of date — `<what changed>`") so the human can run it later.

---

## External references

shadcn/ui answers _what to build_; Swiss Post and Ionic answer _how_ (mechanics only, never design). Precedence and take/never-take lists: `ds-plan-component` (architect) and `ds-implement-component` (component-engineer). Workflows A and C only.

## Rules that hold in every workflow

- **Composition markup** (recipes, stories, `visual.html`, a magpie brief) uses no CSS utility
  classes (`m-*`, `p-*`, `bg-*`, `flex`…). Columns are `ds-grid` / `ds-col` with its own
  modifiers (`is-one-quarter`, `tablet:is-half`, `gap-md`). Spacing and alignment come from
  `ds-stack` and `ds-content` props (`space`, `direction`, `align`, `p`/`px`/`py`). Only when
  none of those fit is it a component or token gap — never a utility class.
- **CSS version before web component.** Where a layout component has a CSS-class version (its
  🌍 HTML story shows it), composition markup uses the class on a semantic element
  (`<section class="ds-stack has-space-lg">`) instead of `<ds-stack>`. Use the web component
  only when no class version exists or behaviour needs it.
- **No local visual suites, no Docker.** `play:visual` runs in CI only. Locally, agents run
  `play:components` / `play:a11y` and check the look in a browser with Playwright (MCP or a
  scratch script) on the dev server. A visual diff is CI's to report; new baselines come from
  `ds-update-screenshots`.
- **Fresh builds before tests.** Run `pnpm styles` before Playwright when a CSS-only component
  or any SCSS in `packages/styles` changed; a stale `packages/core/www` build fails tests falsely.
- **Revert build drift.** `scripts/build-docs.mjs` rewrites the tracked
  `apps/storybook/src/assets/data/components.json` and `brand-icons.json`. Revert both after a
  docs build unless the change altered a component's public API. In that case, keep them and
  say so in the report. `packages/core/src/components.d.ts` is tracked and regenerated by every
  Stencil build: keep its diff when it follows a changed prop, event, slot, `@part` or JSDoc
  lead (it carries the lead text), revert it when it only reflects an unrelated rebuild.
- **No agent commits, pushes or merges.** Changes are left unstaged for human review.
- **Stop what you start.** Kill any dev server or background process you started before you
  return. One left running wakes you, and then the orchestrator, when it exits — each a paid turn.
- **Visual baselines are approved by a human.** A failing visual test is reported as a diff;
  `ds-update-screenshots` is user-invoked only. Never `pnpm play:update`.
- **Evidence or it didn't happen.** "Tests pass" without the output is not a result. A check
  that didn't run is named, with the reason.
- Never weaken, skip or delete a test to make a suite pass.
- **Source beats docs.** Where `CONTEXT.md`, an ADR or a doc page disagrees with the code, the
  code wins and the doc gets fixed.
- **Pipe long output to a file and read the tail.** A full Stencil or Playwright run does not
  belong in an agent's context.
- Agents run in parallel only within the fan-out steps, where file sets are disjoint.
  Two agents never write the same file.
