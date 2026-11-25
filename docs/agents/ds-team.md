# DS Team — agents, skills and workflows

How the design system agents work together. The **orchestrator is the main session**, not an
agent — it dispatches the agents below and holds no component context of its own.

## Orchestrator budget

The orchestrator routes. It does not investigate.

- **Never `Read` a component source file end-to-end.** `Grep`/`Glob` for the one fact a routing
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
  `ds-validate-component` does the cross-cutting pass once, in step 7. On `ds-country-select` four
  separate agents each ran the component suite.
- **Dispatch the plan's whole file list, not just the obvious part.** Per-component `CONTEXT.md`,
  the framework barrels, the ADR and the changeset are named in the plan from the start; leaving
  them unassigned turns them into an extra agent run after the tests are already green.
- **Out-of-scope findings become issues at the plan gate — never only a plan line.** Plans are
  gitignored and overwritten by the next run, so a defect that lives only there is lost. Every
  planner returns an "Out-of-scope findings" list next to its blocking decisions; the orchestrator
  drafts one GitHub issue per finding (label `needs-triage`, see `issue-tracker.md`), shows the
  drafts at the gate, files them on the human's OK with `gh issue create`, and links the numbers
  in the brief. On `ds-country-select` eight phone-input a11y defects and two hardcoded values
  surfaced this way and had nowhere to go.
- **A known-broken environment is a documented fact, not a discovery.** Before an agent
  investigates a failing suite, check `packages/playwright/CONTEXT.md` (SSR hydration failure,
  missing visual baselines for a new component) and `packages/core/CONTEXT.md` "Testing
  Requirements" (no component-level unit specs — Vitest covers pure helpers only). All are recorded
  there. Re-proving one costs a full Playwright run and changes nothing.

Measured cost of ignoring this, for one component (`ds-country-select`, Workflow A): **~1.05M
tokens across ~500 agent tool calls** — roughly 535k to plan and implement, 510k to test, document
and repair. The orchestrator's duplicate read of `phone-input.tsx` and its re-emission of the
returned plan were ~35k of that and produced no new information; rediscovering known-broken
environment facts was ~80k more, and is now recorded in the package `CONTEXT.md` files instead.

## The agents

| Agent                       | Model  | Writes                                                                                                                              | Read-only |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- | :-------: |
| 🏛️ `architect`              | opus   | `docs/plans/components/**` — plans only, never production code                                                                      |           |
| 🧩 `component-engineer`     | sonnet | `packages/core/src/components/**`, `test/*.visual.html`, `test/*.style.html`, framework wrappers², ADRs, package `CONTEXT.md` files |           |
| 🧪 `test-engineer`          | sonnet | `.spec.ts`, `.component.play.ts`, `.visual.play.ts`, `.ssr.play.ts`, `.variants.ts`, `*.po.ts`, framework integration tests³        |           |
| ♿️ `a11y-expert`            | opus   | `.a11y.play.ts` (axe + keyboard/focus/ARIA state), a11y reports                                                                     |           |
| 🧬 `token-engineer`         | opus   | `packages/tokens/tokens/*.json`, token refs in SCSS                                                                                 |           |
| 📖 `documentation-engineer` | sonnet | `apps/storybook/src/**`                                                                                                             |           |
| 🎨 `ux-designer`            | opus   | the Figma file, `<name>.figma.md`, `<name>.figma-validation.md`                                                                     |           |

Plus 🐙 the **orchestrator** — the main session, which dispatches but owns no files.

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

Each agent's symbol is its label everywhere in a run: the orchestrator prefixes a dispatch and
a status line with it — including the Agent tool's `description` field (`🏛️ Plan ds-x for
Figma`), which is the label the UI's running-agents list shows next to the agent name — and an agent prefixes its own completion report. One glance says who is
talking in a transcript where seven of them are. The symbol is cosmetic — the agent's identity
is its `name`, which never changes.

### Kickoff banner

The orchestrator's **very first output** on a DS-team request — before any tool call, including
reading this file — is one banner: the workflow, the target, and the agents in the order they
will run. Printed once per run, not per step. Its format and the per-workflow step lines live
only in `CLAUDE.md` (loaded every session, so the banner needs no read first). The status board
below follows it straight away.

### Status board

The orchestrator prints a status board **every time it dispatches an agent, an agent returns,
or a gate opens** — one row per agent in the current workflow, nothing else in the message
before it. Agents not in the workflow are left out.

| Status | Meaning                                           |
| :----: | ------------------------------------------------- |
|   🔄   | working — dispatched, not yet returned            |
|   ⏳   | waiting — on another agent (name it) or on a gate |
|   🙋   | needs the human — a gate or a blocking question   |
|   ✅   | done — returned, its output accepted              |
|   ⛔   | blocked — failed or reported `BLOCKED`; say why   |
|   ⬜   | not started                                       |

```text
DS team · ds-country-select · Workflow A step 4
🏛️ architect               ✅ plan → docs/plans/components/ds-country-select-plan.md
🧬 token-engineer          ✅ 3 Component tokens added
🧩 component-engineer      🔄 implementing ds-country-select.tsx
🧪 test-engineer           ⏳ waits on 🧩
♿️ a11y-expert             ⏳ waits on 🧩
📖 documentation-engineer  ⬜
🐙 orchestrator            🙋 —
```

The "what" column is one line: the file or step the agent is on, the artifact it handed over,
or the agent it waits on. Parallel agents show 🔄 together — that is the point of the board.

File ownership is **disjoint by design** — that is what makes the parallel steps below safe.
An agent that finds a defect outside its own files reports it; it never reaches across.

**One carve-out — the judgment and the test that encodes it stay together.** The
component-engineer may add the failing reproduction test for a bug it fixes to the _existing_
`.component.play.ts` or `.spec.ts`: a fix and its pinning test are one unit of work.
test-engineer still owns the files and everything larger — a new suite, a new file, a broad
variant matrix, `.variants.ts`.

**The test/a11y split is by file, with no overlap.** Everything needed for WCAG 2.2 AA —
axe scans, keyboard map, focus order and management, ARIA state transitions — goes in
`.a11y.play.ts`, the a11y-expert's file. `.component.play.ts` covers behavior, events and
props, and is test-engineer's. The two never write into each other, so they can run in
parallel; the `♿️ A11Y` Playwright project is an ordinary suite with an extra `a11y()` scan
helper, so keyboard tests work there unchanged.

a11y-expert consumes test-engineer's Page Object read-only. A missing PO locator is reported,
not edited — use a local locator meanwhile.

Shipped components still keep their keyboard tests in `.component.play.ts` (15 of them). They
stay where they are; only new a11y coverage follows the rule above.

## Skill × agent matrix

`W` = owner (writes) · `R` = shared, read or run only · `—` = not available

| Skill                           | Arch | Comp-Eng | Test-Eng | A11y | Token-Eng | Docs-Eng | UX  |
| ------------------------------- | :--: | :------: | :------: | :--: | :-------: | :------: | :-: |
| `ds-plan-component`             |  W   |    —     |    —     |  —   |     —     |    —     |  —  |
| `ds-implement-component`        |  —   |    W     |    —     |  —   |     —     |    —     |  —  |
| `ds-modify-component`           |  —   |    W     |    —     |  —   |     —     |    —     |  —  |
| `ds-repair-component`           |  —   |    W     |    —     |  —   |     —     |    —     |  —  |
| `ds-framework-wrappers`         |  —   |    W     |    —     |  —   |     —     |    —     |  —  |
| `ds-lint-component`             |  —   |    W¹    |    —     |  —   |     —     |    —     |  —  |
| `ds-test-component`             |  —   |    —     |    W     |  —   |     —     |    —     |  —  |
| `ds-update-screenshots`         |  —   |    —     |    W²    |  —   |     —     |    —     |  —  |
| `ds-a11y-plan`                  |  —   |    —     |    —     |  W   |     —     |    —     |  —  |
| `ds-a11y-audit`                 |  —   |    —     |    —     |  W   |     —     |    —     |  —  |
| `ds-a11y-test`                  |  —   |    —     |    —     |  W   |     —     |    —     |  —  |
| `ds-a11y-verify`                |  —   |    —     |    —     |  W   |     —     |    —     |  —  |
| `ds-audit-tokens`               |  ³   |    —     |    —     |  —   |     W     |    —     |  —  |
| `ds-manage-tokens`              |  —   |    —     |    —     |  —   |     W     |    —     |  —  |
| `ds-manage-brand`               |  —   |    —     |    —     |  —   |     W     |    —     |  —  |
| `ds-sync-figma-tokens`          |  —   |    —     |    —     |  —   |     W     |    —     |  —  |
| `ds-document-component`         |  —   |    —     |    —     |  —   |     —     |    W     |  —  |
| `ds-manage-stories`             |  —   |    —     |    —     |  —   |     —     |    W     |  —  |
| `ds-document-guidelines`        |  —   |    —     |    —     |  —   |     —     |    W     |  —  |
| `ds-code-to-figma`              |  —   |    —     |    —     |  —   |     —     |    —     | R⁴  |
| `ds-plan-figma-component`       |  W   |    —     |    —     |  —   |     —     |    —     |  —  |
| `ds-figma-mapping`              |  —   |    —     |    —     |  —   |     —     |    —     |  W  |
| `ds-figma-component-set`        |  —   |    —     |    —     |  —   |     —     |    —     |  W  |
| `ds-figma-copy-me`              |  —   |    —     |    —     |  —   |     —     |    —     |  W  |
| `ds-figma-anatomy`              |  —   |    —     |    —     |  —   |     —     |    —     |  W  |
| `ds-figma-measurements`         |  —   |    —     |    —     |  —   |     —     |    —     |  W  |
| `ds-figma-review`               |  —   |    —     |    —     |  —   |     —     |    —     |  W  |
| `ds-design-guidelines`          |  —   |    —     |    —     |  —   |     —     |    —     |  W  |
| **`ds-validate-component`**     |  —   |    R     |    R     |  R   |     —     |    —     |  —  |
| **`ds-validate-tokens`**        |  —   |    R     |    R     |  —   |     R     |    —     |  —  |
| **`ds-validate-documentation`** |  —   |    —     |    —     |  —   |     —     |    W     |  —  |
| **`ds-changeset`**              |  —   |    R     |    —     |  —   |     R     |    —     |  —  |

¹ `--fix` writes — only the component-engineer may use that flag.
² user-invoked only; posts a PR comment. Never triggered proactively.
³ cannot run it (no Bash) — the architect **reads** an existing `<family>.token-check.md`.
⁴ the **mechanics reference** (`conventions/`, `PHASE-*.md`) the eight Figma skills above read
from; not run end-to-end any more.

**Rule:** a skill that writes has exactly one owner. A skill that only reads, reports or runs
checks can be shared with any agent whose tools can execute it.

## Handoff artifacts

Agents hand over **files, never prose**. This keeps the orchestrator's context small and makes
a run resumable.

| Artifact                                          | Written by         | Read by                                                      |
| ------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `docs/plans/components/<component>-brief.md`      | orchestrator       | every agent, first — `## Gate decisions` overrides the plans |
| `docs/plans/components/<component>-plan.md`       | architect¹         | component-engineer, test-engineer, docs                      |
| `docs/plans/components/<component>-a11y-plan.md`  | a11y-expert¹       | component-engineer, test-engineer                            |
| `docs/plans/components/<component>-figma-plan.md` | architect¹         | ux-designer                                                  |
| `test/<name>.visual.html`                         | component-engineer | **human review**, test-engineer                              |
| `<family>.token-check.md`                         | token-engineer     | token-engineer, architect                                    |
| a11y audit findings                               | a11y-expert        | component-engineer                                           |
| `<name>.figma.md`                                 | ux-designer        | ux-designer, next family that nests it                       |
| `<name>.figma-validation.md`                      | ux-designer        | ux-designer, component-engineer                              |
| anatomy + do's/don'ts copy                        | ux-designer        | documentation-engineer                                       |

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
are in `CLAUDE.md`.

| Workflow                 | File                                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| A — New component        | [workflows/a-new-component.md](workflows/a-new-component.md)               |
| B — Bug fix              | [workflows/b-bug-fix.md](workflows/b-bug-fix.md)                           |
| C — Feature              | [workflows/c-feature.md](workflows/c-feature.md)                           |
| D — Component into Figma | [workflows/d-component-into-figma.md](workflows/d-component-into-figma.md) |
| E / E′ — Deprecation     | [workflows/e-deprecation.md](workflows/e-deprecation.md)                   |

## Figma drift check — the closing step of B, C and E

The orchestrator runs it after the changeset, **only when both hold**:

1. a `<name>.figma.md` sits next to a changed `.tsx` — the component is in the Figma library;
2. the change touched the Figma surface: a prop, enum value, slot or `@part` changed; a
   Component token was added, renamed or re-pointed; or `test/<name>.visual.html` changed.

A behavior-only fix — events, keyboard, logic, a11y attributes — skips it.

**Dispatch:** one fresh 🎨 ux-designer · `ds-figma-review`, pointed at `<name>.figma.md` and
the changed files. It repairs Figma and updates `<name>.figma.md`; a code-side defect it finds
is a finding for the owner, not a Figma workaround. A new token with no Figma variable goes
first to 🧬 token-engineer · `ds-sync-figma-tokens`, as in Workflow D step 2.

**Figma MCP not authorized** → do not skip silently. The final report names the drift as open
("`ds-<name>`: Figma out of date — `<what changed>`") so the human can run it later.

---

## External references

Three references, two questions. **shadcn answers what to build. Swiss Post and Ionic answer
how. Never swap them — only shadcn is a design reference.**

| Reference                                                   | Answers                                    | Used by                                         | Take                                                                                                                                                                                                 | Never take                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [shadcn/ui](https://ui.shadcn.com/docs/components)          | **What to build** — UX, anatomy, API shape | architect<br/>`ds-plan-component`               | Anatomy and sub-component split, which variants and states are worth having, composed vs. configured, edge cases its docs surface                                                                    | React, Radix, Tailwind, `cn()`, `class-variance-authority`, `asChild`, utility-class styling, hook APIs, any copied source |
| [Swiss Post DS](https://github.com/swisspost/design-system) | **How** — design-system architecture       | component-engineer<br/>`ds-implement-component` | Component-family decomposition, `@Prop()`/slot conventions for a DS, the token pipeline, Angular/React wrapper generation, versioning and changeset flow, Storybook structure, composite-widget a11y | **Any design or UX.** Swiss Post's brand, visual language and interaction choices                                          |
| [Ionic](https://github.com/ionic-team/ionic-framework)      | **How** — deep Stencil runtime             | component-engineer<br/>`ds-implement-component` | Slot forwarding, delegated focus, `formAssociated` and value accessors, overlay/portal and scroll-lock, output-target behavior, SSR and hydration, async `@Method()`                                 | **Any design or UX.** Mobile-first sizing, touch targets, density, gestures, theming system, `ios`/`md` modes, API naming  |

**Swiss Post vs. Ionic.** Swiss Post is the nearest peer — a Swiss enterprise design system
on Stencil, desktop web, multi-framework: the same problem shape as ours. Ionic is an app
framework, mobile-first, but the largest production Stencil codebase in the open. Go to
Swiss Post for how a _design system_ on Stencil is put together; go to Ionic for a hard
runtime problem at scale. When both have an answer, Swiss Post is usually the closer fit.

This system is desktop-oriented across 320px–2560px, so neither Stencil reference is ever
consulted for design — only for mechanisms this repo has no precedent for.

**Precedence, highest first:** this repo's existing components → `STYLE_GUIDE.md` and ADRs →
the ARIA Authoring Practices pattern → shadcn (design) / Swiss Post and Ionic (mechanics).
Where an external reference disagrees with anything above it, the higher one wins. A
precedent inside this repo always beats all three — if `ds-modal` already solves focus
return, copy `ds-modal`.

Cite them as references, never as justifications on their own. "shadcn does X", "Swiss Post
does Y" and "Ionic does Z" are not reasons.

Applies to Workflow A and C. Not to bug fixes (Workflow B) — a fix matches the component it's
fixing.

## Rules that hold in every workflow

- **No agent commits, pushes or merges.** Changes are left unstaged for human review.
- **Visual baselines are approved by a human.** A failing visual test is reported as a diff;
  `ds-update-screenshots` is user-invoked only. Never `pnpm play:update`.
- **Evidence or it didn't happen.** "Tests pass" without the output is not a result. A check
  that didn't run is named, with the reason.
- **Never weaken, skip or delete a test** to make a suite pass.
- **Source beats docs.** Where `CONTEXT.md`, an ADR or a doc page disagrees with the code, the
  code wins and the doc gets fixed.
- **Pipe long output to a file and read the tail.** A full Stencil or Playwright run does not
  belong in an agent's context.
- Agents run in parallel **only** within the fan-out steps above, where file sets are disjoint.
  Two agents never write the same file.
