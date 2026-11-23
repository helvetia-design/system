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
- **A known-broken environment is a documented fact, not a discovery.** Before an agent
  investigates a failing suite, check the package's `CONTEXT.md` — the SSR hydration failure,
  missing visual baselines for a new component, and `newSpecPage` being unusable are all recorded
  there. Re-proving one costs a full Playwright run and changes nothing.

Measured cost of ignoring this, for one component (`ds-country-select`, Workflow A): **~1.05M
tokens across ~500 agent tool calls** — roughly 535k to plan and implement, 510k to test, document
and repair. The orchestrator's duplicate read of `phone-input.tsx` and its re-emission of the
returned plan were ~35k of that and produced no new information; rediscovering known-broken
environment facts was ~80k more, and is now recorded in the package `CONTEXT.md` files instead.

## The agents

| Agent                       | Model  | Writes                                                                                         | Read-only |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------------- | :-------: |
| 🏛️ `architect`              | opus   | `docs/plans/components/**` — plans only, never production code                                 |           |
| 🧩 `component-engineer`     | sonnet | `packages/core/src/components/**`, `index.ts`, `test/*.visual.html`, `test/*.style.html`       |           |
| 🧪 `test-engineer`          | sonnet | `.spec.ts`, `.component.play.ts`, `.visual.play.ts`, `.ssr.play.ts`, `.variants.ts`, `*.po.ts` |           |
| ♿️ `a11y-expert`            | opus   | `.a11y.play.ts` (axe + keyboard/focus/ARIA state), a11y reports                                |           |
| 🧬 `token-engineer`         | opus   | `packages/tokens/tokens/*.json`, token refs in SCSS                                            |           |
| 📖 `documentation-engineer` | sonnet | `apps/storybook/src/**`                                                                        |           |
| 🎨 `ux-designer`            | opus   | the Figma file, `<name>.figma.md`, `<name>.figma-validation.md`                                |           |

Plus 🐙 the **orchestrator** — the main session, which dispatches but owns no files.

Each agent's symbol is its label everywhere in a run: the orchestrator prefixes a dispatch and
a status line with it, and an agent prefixes its own completion report. One glance says who is
talking in a transcript where seven of them are. The symbol is cosmetic — the agent's identity
is its `name`, which never changes.

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

| Artifact                                          | Written by         | Read by                                 |
| ------------------------------------------------- | ------------------ | --------------------------------------- |
| `docs/plans/components/<component>-brief.md`      | orchestrator       | architect, a11y-expert                  |
| `docs/plans/components/<component>-plan.md`       | architect¹         | component-engineer, test-engineer, docs |
| `docs/plans/components/<component>-a11y-plan.md`  | a11y-expert¹       | component-engineer, test-engineer       |
| `docs/plans/components/<component>-figma-plan.md` | architect¹         | ux-designer                             |
| `test/<name>.visual.html`                         | component-engineer | **human review**, test-engineer         |
| `<family>.token-check.md`                         | token-engineer     | token-engineer, architect               |
| a11y audit findings                               | a11y-expert        | component-engineer                      |
| `<name>.figma.md`                                 | ux-designer        | ux-designer, next family that nests it  |
| `<name>.figma-validation.md`                      | ux-designer        | ux-designer, component-engineer         |
| anatomy + do's/don'ts copy                        | ux-designer        | documentation-engineer                  |

¹ Each planner **writes its own plan file** — the architect's `Write` is scoped to
`docs/plans/components/**` and nothing else — and returns only a summary: the path, the blocking
decisions needing human approval, and any token gaps. They write different files, so they stay
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

# Workflow A — New component

Full pipeline. Use for a new component or a breaking change.

```text
0 grill the human           →  docs/plans/components/<name>-brief.md
1 plan ∥ a11y-plan          →  ⛔ GATE: plan approved by a human
2 implement                 →  3 tokens  (only if step 2 reported gaps)
                               ⛔ GATE: human opens test/<name>.visual.html
4 test ∥ a11y-test ∥ docs      (parallel, disjoint files)
5 token-audit ∥ a11y-audit  →  6 repair, routed by owner
7 a11y-verify ∥ validate    →  8 changeset (minor)  →  human reviews and commits

step 7 failures loop back to step 6
```

**0 · Grill** — the orchestrator runs the `mattpocock-skills:grilling` skill with the human
**before dispatching any planner**, and writes the settled decisions to `docs/plans/components/<name>-brief.md`.

This step is the orchestrator's and can never be an agent's: `grilling` interviews the user in
rounds and waits for answers, and a subagent has no channel to the user. An agent that hits an
unsettled requirement must come back and ask for this step — it cannot run it.

Work the design tree to an empty frontier: scope and scale, the real data set, which props are
actually variants, what is explicitly out. Facts are the orchestrator's job — dispatch `Explore`
for anything in the repo rather than asking the human. Decisions are the human's.

**Write the brief; do not carry the answers in context.** Same rule as every other handoff: the
planners read the file, and the orchestrator passes the path. Restating a grilling round inside
two dispatch prompts pays for it twice and loses the "out of scope" half, which is the half that
stops a planner designing for the complete domain.

Skip it only for a change whose shape is already settled — a prop added to a shipped component,
a plan being re-run after a rejected gate. A new component is never that.

**1 · Plan** — `ds-plan-component` ∥ `ds-a11y-plan`, both pointed at the brief. Each writes its own file under
`docs/plans/components/`, nothing else — no shared writes. The keyboard map does not depend on the prop
list, so these genuinely run at the same time.

Both still clear a **cheap gate** (`ds-plan-component` Phase 0): a request that contradicts
itself, or that assumes a scale nobody asked for, comes back as a question instead of a plan.
With a brief in hand that gate is a formality — which is the point; it is the net the grilling
step was supposed to catch everything in. And
when the component mirrors a pattern that already ships, the a11y-expert audits the model and
plans the **delta** rather than re-deriving the whole pattern.

The architect also checks [shadcn/ui](https://ui.shadcn.com/docs/components) for the matching
component as prior art on API shape — see "External prior art" below.

> **Gate.** A human approves the plan before any code is written. The engineer must not
> design the component itself.

**2 · Implement** — `ds-implement-component`. Writes component source, the `index.ts`
export, and `test/<name>.visual.html` (plus `.style.html` for a CSS-only/hybrid component).
Creates an _empty_ Storybook folder and generates no tests. It **reads tokens and
never creates them**: a missing token is referenced by the name it should have, with no
fallback and nothing hardcoded, and reported as a blocking handoff.

**3 · Tokens** — only if step 2 reported missing tokens. `ds-manage-tokens` →
`ds-validate-tokens`. The token-engineer owns the final name and reports any it corrected so
the engineer's SCSS reference can follow.

> **Gate — a human looks at the component.** Run `pnpm start` and open
> `/components/<category>/<name>/test/<name>.visual.html`. Every variant, state and size is on
> that one page because the engineer built it that way. Approve it before any test is written:
> a screenshot baseline taken over an unreviewed component bakes the bug into the baseline, and
> every later visual run then defends it.

**4 · Build out — three in parallel.** The three file sets are disjoint, so one dispatch each,
no second round:

| Agent                  | Skill                   | Writes                                            |
| ---------------------- | ----------------------- | ------------------------------------------------- |
| test-engineer          | `ds-test-component`     | unit, interaction, visual, SSR, PO                |
| documentation-engineer | `ds-document-component` | `apps/storybook/src/**`                           |
| a11y-expert            | `ds-a11y-test`          | `.a11y.play.ts` — axe + keyboard/focus/ARIA state |

The a11y-expert may start before the Page Object exists: it uses local locators and reports
the PO gap rather than waiting or editing `.po.ts`.

`ds-test-component` **reads** the approved fixture and writes the variant list from it:

```
test/<name>.visual.html        ← component-engineer, human-approved
  └─ test/<name>.variants.ts   → TAG + HOST_VARIANTS
       ├─ .visual.play.ts      (host suite)
       └─ .ssr.play.ts         (same variants, same baselines)
```

One list, two suites — the SSR test calls `visualBaseline(TAG)`, so it compares against the
_visual_ test's snapshots. That is why both must iterate the same `HOST_VARIANTS`: a variant
added to one and not the other produces a missing-baseline failure rather than a diff.

`.ssr.play.ts` is generated only when the component has a `.host.scss` — a CSS-only component
renders as plain classed HTML with no shadow root to hydrate, so there is nothing for an SSR
test to assert (`form`, `link`, `table`, `grid`, `picture`, `time-input` have none).

It writes neither the fixture nor `.a11y.play.ts`, and it errors out if the fixture is missing,
which keeps the gate above from being skipped.

**5 · Review — parallel, read-only.** `ds-audit-tokens` ∥ `ds-a11y-audit`. Both produce
findings files and converge on one repair round. (A `code-reviewer` agent joins here once
`ds-review-component` exists.)

**6 · Repair** — route findings by owner: source → component-engineer (`ds-repair-component`),
tokens → token-engineer (`ds-manage-tokens`). Both verify each finding before acting; an
invalid finding is reported as `INVALID` with its reason, not silently applied.

**7 · Verify** — `ds-a11y-verify` for per-criterion WCAG sign-off, `ds-validate-component` for
the suites. Report axe-clean and WCAG 2.2 AA conformance as separate claims.

**8 · Ship** — `ds-changeset`, minor. Everything is left **unstaged**; the human commits.

---

# Workflow B — Bug fix

**The escape hatch. One agent, no pipeline.** Routing a one-line fix through eight phases is
how a team like this gets abandoned.

```text
bug report
  →  component-engineer · ds-modify-component
       1 reproduce as a failing test
       2 grep every caller
       3 fix the root cause once
  →  does the fix cross an ownership line?
       no (the common case)  →  validate
       yes                   →  escalate only the row that applies  →  validate
  →  ds-validate-component     (repro test passes, suite stays green)
  →  ds-changeset (patch)      →  human reviews and commits
```

`ds-modify-component` reproduces the defect as a failing test first, greps every caller before
editing anything shared, and fixes the root cause once.

**Escalate only when the fix crosses an ownership line:**

| Trigger                                        | Add                                                         |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Breaking public API change                     | architect — needs an approved plan first                    |
| A needed token does not exist                  | token-engineer                                              |
| The fix needs an **a11y decision** or sign-off | a11y-expert — audits and verifies; the engineer still fixes |
| A new suite, new test file, or variant matrix  | test-engineer                                               |
| The fix adds a `visual.html` section           | test-engineer — must regenerate `.variants.ts`              |
| Public API or behavior visibly changed         | documentation-engineer                                      |

Default to no escalation. Add an agent because the work crosses into its files, not because
the pipeline has a slot for it.

**A bug with an a11y dimension is still a bug.** The a11y-expert writes tests and findings; it
never edits component source. Escalate when the _decision_ is an a11y one — which ARIA
attribute, which APG pattern, whether a disabled control should stay focusable — not merely
because the symptom touches accessibility. Fixing a click handler that ignores `disabled`
needs no escalation; deciding between native `disabled` and `aria-disabled` does, because
that changes whether assistive tech can still find the control.

**When the report is already an a11y defect, the audit comes first.** The diagram's
fix-then-escalate order assumes the engineer can see the correct behaviour. For "keyboard
navigation is broken in select" it cannot: what Arrow/Home/End/Escape/type-ahead _should_ do
comes from the APG Combobox pattern, not from reading the current code. Run it in this order
instead:

1. **a11y-expert · `ds-a11y-audit`** — which keys are missing or wrong, against the named APG
   pattern, as findings with `file:line`. Read-only.
2. **component-engineer · `ds-repair-component`** — fixes from that findings file, verifying
   each finding before acting. `ds-repair-component`, not `ds-modify-component`: the work
   starts from findings and reports a per-finding `RESOLVED` / `INVALID` / `BLOCKED` status.
3. **a11y-expert · `ds-a11y-test`** — one keyboard test per row of the corrected map, in
   `.a11y.play.ts`.
4. **a11y-expert · `ds-a11y-verify`** — per-criterion sign-off. Keyboard operability of a
   custom widget is one of the things axe cannot check, so this step is the only evidence.

Fixing first and auditing after means the engineer invents a keyboard contract and the audit
then disputes it — two rounds of work and a plausible-but-wrong interaction model in between.

---

# Workflow C — Feature on an existing component

Between A and B. Additive change to a component that already ships.

```text
feature request
  →  public API changes?   yes  →  grill the human  →  architect · ds-plan-component  →  ⛔ GATE
                           no   →  straight to the engineer
  →  component-engineer · ds-modify-component
  →  needs a new token?    yes  →  token-engineer · ds-manage-tokens
  →  build out only what the change touches:
       test-engineer (new prop or state)
       ∥ a11y-expert (new interaction, colour or state)
       ∥ documentation-engineer · ds-manage-stories
  →  visual or token surface changed?
       yes  →  ds-audit-tokens and/or ds-a11y-audit
               + ds-a11y-verify if a colour changed  →  repair by owner
  →  ds-changeset (minor)  →  human reviews and commits
```

**A planner dispatch is always preceded by grilling** (Workflow A step 0), here too — a new
public prop is a permanent API decision. The branch that skips the planner skips the grilling
with it: a change whose shape is already settled does not need a design tree.

`ds-modify-component`, not `ds-implement-component` — backward compatibility and impact
assessment are the point. A new prop reaches stories (`ds-manage-stories`) and tests; a new
visual state reaches tokens too.

**"Public API changes?" means a new prop, event, method or slot** — those need the architect
and the gate. **Adding a value to an existing enum does not.** Widening `BADGE_COLORS` is
additive, has one obvious shape, and goes straight to the engineer. Sending it through a plan
and a human gate is the same over-routing Workflow B exists to avoid.

**A new enum value fans out further than it looks.** For a new badge color, every one of these
is a separate owner's file:

| Artifact                                             | Owner                                        |
| ---------------------------------------------------- | -------------------------------------------- |
| `BADGE_COLORS` + `.host.scss` variant class          | component-engineer                           |
| `Component.Badge.<Color>.Color.Text` / `.Background` | token-engineer (`ds-manage-tokens`)          |
| the new swatch in `test/badge.visual.html`           | component-engineer                           |
| the `COLORS` array in `test/badge.a11y.play.ts`      | **a11y-expert** — contrast is the risk       |
| the story / `Variants` page                          | documentation-engineer (`ds-manage-stories`) |

**A new color always reaches the a11y-expert**, even though no interaction changed. A colour
pair is a contrast claim: text ≥ 4.5:1, UI ≥ 3:1, in the normal _and_ inverted rendering. The
`S3` trigger for a11y is therefore "new interaction **or new colour/state**", and the review
step must include `ds-a11y-verify`, not only `ds-a11y-audit` — the audit reads source and
cannot resolve a token chain to a computed ratio, so it will correctly report contrast as
`NOT_VERIFIED` and nothing else will check it.

Where the colour must also exist in Figma, `ds-code-to-figma` is a separate user-invoked run
after the tokens land.

---

# Workflow D — Component into Figma

Mirror a shipped component into the Figma library. Runs **after** the component exists in code;
it never leads.

```text
component exists in code
  →  architect · ds-plan-figma-component      (variant axes, anatomy, token table)
  →  every value resolves to a token?
       no  →  token-engineer · ds-manage-tokens   (hard stop until it does)
  →  ⛔ GATE: variant grouping + variant count approved
  →  ux-designer · ds-figma-mapping  →  ds-figma-component-set  →  ds-figma-review
       still failing after 3 repairs  →  hard stop, report
  →  ux-designer · ds-figma-copy-me           (always; never skipped)
  →  ds-figma-anatomy ∥ ds-figma-measurements ∥ ds-design-guidelines
  →  documentation-engineer · ds-manage-stories   (places the copy)
  →  human reviews and commits
```

**1 · Plan** — `ds-plan-figma-component`. Read-only, code-side only. Note what this does _not_
need: resolving a CSS var to a Figma variable id requires **no Figma access**, because
`scripts/figma-sync` already backfilled those ids into `Base.tokens.json`
(ADR-0017). The architect's real limits are different — no Bash (cannot measure on the dev
server) and no Write (cannot create the mapping file), which is why step 3 exists.

**2 · Tokens first.** A value with no token behind it is a hard stop, not a hardcoded Figma
value. Figma cannot represent an untokenized value without lying about it, and a hardcode will
not follow the next token change.

> **Gate.** A human approves the variant grouping and the variant count before anything is
> built. Figma's ceiling is 500 variants per set, and discovering the overrun mid-build is the
> expensive place to find it.

**3 · Map** — `ds-figma-mapping` creates `<name>.figma.md`: resolves every CSS var to its Figma
variable **id** locally (the ids are already in `Base.tokens.json`; never enumerate Figma's
1,900+ variables to answer "does this exist"), records the anatomy and nested component keys,
then measures the rendered component and gets the measurements triage confirmed. This file is
the contract every later step reads.

**4 · Build** — `ds-figma-component-set`. The default variant is built and approved **alone**
before the fan-out: a wrong binding replicated across 200 variants is 200 fixes.

**5 · Review** — `ds-figma-review`. The enum check runs in **both directions** — "Figma has
every code value" and "code has every Figma value" fail on different changes. Repairs Figma, not
code; a code-side defect is a finding for the component-engineer or token-engineer.

**6 · Copy me** — `ds-figma-copy-me`, always. Unlike Anatomy it is never conditional: one
unmodified instance of the default variant, which is the thing a designer actually drags out.

**7 · Document.** Anatomy and Measurements are built in Figma; `ds-design-guidelines` writes the
do's/don'ts and anatomy copy but **places nothing** — `apps/storybook/src/**` is the
documentation-engineer's. The per-part description is written once, in `ds-figma-anatomy`, and
reused verbatim in Storybook so the two surfaces cannot drift.

**Re-run `ds-figma-review` when the code changes.** A new prop, a new enum value or a renamed
token silently makes the Figma component a lie, and Figma has no test suite to catch it. A
library that drifts is worse than no library, because designers trust it.

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
