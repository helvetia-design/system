<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow A — New component

Full pipeline. Use for a new component, or a breaking change that cannot go through a
deprecation first (Workflow E).

```text
0 grill the human           →  docs/plans/components/<name>-brief.md
1 plan ∥ a11y-plan          →  ⛔ GATE: plan approved by a human
2 implement (tdd)           →  3 tokens  (only if step 2 reported gaps)
                               ⛔ GATE: human opens test/<name>.visual.html
4 coverage-review + visual ∥ a11y-test ∥ docs   (parallel, disjoint files)
5 token-audit ∥ a11y-audit ∥ polish-audit ∥ code-review  →  6 repair, routed by owner
7 a11y-verify ∥ validate    →  8 changeset (minor)  →  9 🗺️ pr-body ∥ reply → ⛔ GATE → post  →  human reviews and commits

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

**Always-ask checklist.** These recur on every component and otherwise come back as plan-gate
decisions or as silent engineer deviations — settle them in step 0:

| Applies to         | Question                                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| every component    | Which shipped component is the model? What's the delta from it?              |
| every component    | New user-facing strings (incl. visually hidden labels, live-region text)?    |
| form controls      | Value type and `dsChange` detail shape (plain value like `ds-select`?)       |
| form controls      | Unknown / disallowed value: clear, fall back, or keep?                       |
| form controls      | `required` default and native validity (`setValidity`) — follow `CONTEXT.md` |
| form controls      | `readonly` vs `disabled` semantics                                           |
| overlays / popups  | Placement and flip; open state in `visual.html`                              |
| mirrors of a model | Fix the model's known defects now, or file them (see out-of-scope findings)? |

**Use the human's words.** Write only what was said into the brief; anything the orchestrator
adds (an extra match rule, a default) is a question first. Name the term each concept gets
when two could collide — on `ds-country-select` "filter" meant the popup search to one side and
the `countries` allow-list to the other, and cost a gate round.

**Check for leftovers of a discarded run** before grilling a new component: an existing
`packages/core/src/components/<category>/<name>/` folder, `--ds-<name>-*` variables in
`packages/tokens/dist`, a stale `docs/plans/components/<name>-*.md`. Name them in the brief so the
engineer removes or reuses them instead of every agent reasoning about them.

**Write the brief; do not carry the answers in context.** Same rule as every other handoff: the
planners read the file, and the orchestrator passes the path. Restating a grilling round inside
two dispatch prompts pays for it twice and loses the "out of scope" half, which is the half that
stops a planner designing for the complete domain.

Skip it only for a change whose shape is already settled — a prop added to a shipped component,
a plan being re-run after a rejected gate. A new component is never that.

**Starting from a spec (`spec #N`, from Workflow L).** The spec is the settled shape: read it
(`gh issue view N`) instead of re-grilling, and write the brief from it — Implementation
Decisions and Testing Decisions as decisions, Out of Scope as the out-of-scope list. Grill only
what the spec leaves open, including the always-ask checklist rows it does not answer. The
plan's first line is `Spec: #N`; the PR closes it (`ds-pr-body`).

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

At the gate the orchestrator, from the planners' summaries only:

1. puts the blocking decisions to the human, each with the planner's recommendation;
2. drafts one issue per **out-of-scope finding** and files them on the human's OK;
3. writes the answers into the brief's `## Gate decisions` section — the single record of what
   overrides the plans. Plan files stay the planners' and are not patched.

Every agent from step 2 on reads **brief → plan → a11y plan**, in that order, and the brief wins
where they differ. The orchestrator's dispatch names that order; it does not restate decisions.

**2 · Implement** — `ds-implement-component`, test-first: setup (empty component + PO
skeleton), then one red → green `tdd` cycle per seam in the plan's `## Test seams`, starting
with "renders with defaults". Writes component source, `.spec.ts`, `.component.play.ts`, the
Page Object, the `index.ts` export, and `test/<name>.visual.html` (plus `.style.html` for a
CSS-only/hybrid component). Reports red and green output per seam; no refactoring inside the
loop — that is step 5 → 6.
Then `ds-framework-wrappers` for the React lists and, for a form component, the Angular
wrapper. Creates an _empty_ Storybook folder. It **reads tokens and
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

| Agent                  | Skill                   | Writes                                                                                                                            |
| ---------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| test-engineer          | `ds-test-component`     | coverage review of step 2's tests (findings only); visual, SSR, variants; Angular + React integration tests for a form component³ |
| documentation-engineer | `ds-document-component` | `apps/storybook/src/**`                                                                                                           |
| a11y-expert            | `ds-a11y-test`          | `.a11y.play.ts` — axe + keyboard/focus/ARIA state                                                                                 |

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

It writes neither the fixture, the behavior tests, the PO nor `.a11y.play.ts`, and it errors
out if the fixture is missing, which keeps the gate above from being skipped.

**Coverage review** — before generating, the test-engineer reviews the engineer's `.spec.ts`,
`.component.play.ts` and PO read-only: every plan seam tested, every reachable state and enum
variant covered, no `tdd` anti-pattern, mounted through the PO. No numeric threshold. Gaps are
findings, routed to step 6 with the audits — the engineer fixes its own tests.

**5 · Review — parallel, read-only.** `ds-audit-tokens` ∥ `ds-a11y-audit` ∥ `ds-ui-polish-audit`
(🧙, report only) ∥ the `code-review`
skill (mattpocock-skills), run by the orchestrator on the diff: Standards against
`docs/STYLE_GUIDE.md` and `docs/ARCHITECTURE.md`, Spec against the brief and plan (or spec #N).
The audits produce findings files; `code-review` reports inline. All converge on one repair round.

**6 · Repair** — route findings by owner: source and behavior-test gaps → component-engineer (`ds-repair-component`),
tokens → token-engineer (`ds-manage-tokens`). Both verify each finding before acting; an
invalid finding is reported as `INVALID` with its reason, not silently applied.

**7 · Verify** — `ds-a11y-verify` for per-criterion WCAG sign-off, `ds-validate-component` for
the suites. Report axe-clean and WCAG 2.2 AA conformance as separate claims.

**8 · Ship** — `ds-changeset`, minor. **The run's only changeset**, covering every package the
run touched (core, tokens, angular, react); no earlier step writes one.

**Optional · Retro** — the orchestrator's last line is "Type `/retro` to review how this run went." `retro` is user-invoked only (mattpocock-skills); no agent runs it.
