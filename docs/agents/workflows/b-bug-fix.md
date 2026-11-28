<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow B — Bug fix

**The escape hatch. One agent, no pipeline.** Routing a one-line fix through eight phases is
how a team like this gets abandoned.

```text
bug report
  →  component-engineer · ds-modify-component
       1 reproduce as a failing test  (red — tdd skill)
       2 grep every caller
       3 fix the root cause once      (green)
  →  does the fix cross an ownership line?
       no (the common case)  →  validate
       yes                   →  escalate only the row that applies  →  validate
  →  ds-validate-component     (repro test passes, suite stays green)
  →  ds-changeset (patch)
  →  Figma drift check         (only if it applies — see ../ds-team.md)
  →  issue-manager · ds-pr-body ∥ ds-issue-reply  →  ⛔ GATE  →  post   (see ../ds-team.md → GitHub)
  →  human reviews and commits
```

`ds-modify-component` reproduces the defect as a failing test first (red), greps every caller
before editing anything shared, and fixes the root cause once (green) — one `tdd` cycle. It
names the seam the test sits at in its report; the human confirms it at review. `.spec.ts`,
`.component.play.ts` and the Page Object are the engineer's own files, so a new behavior test
or file is no escalation.

**Escalate only when the fix crosses an ownership line:**

| Trigger                                        | Add                                                         |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Breaking public API change                     | stop — it is Workflow E (deprecate first), or A if it can't |
| A needed token does not exist                  | token-engineer                                              |
| The fix needs an **a11y decision** or sign-off | a11y-expert — audits and verifies; the engineer still fixes |
| The fix adds a `visual.html` section           | test-engineer — must regenerate `.variants.ts`              |
| Framework integration tests need a change      | test-engineer                                               |
| Public API or behavior visibly changed         | documentation-engineer                                      |

Default to no escalation. Add an agent because the work crosses into its files, not because
the pipeline has a slot for it.

**More than one finding → batch, then fix once.** When the findings arrive from a planner
(Workflow D step 1), an audit or a review, collect them all first, then dispatch one
component-engineer pass over the batch, then 🧪 ∥ 🛡️ ∥ 📜 once. A fix that changes behavior
(an accessible name, a clamp, a default) makes every test and doc written between rounds stale,
and each stale file costs a second dispatch.

**Started from a Figma-plan findings file** (Workflow D pause)? The engineer ticks each
finding and updates the plan rows its fix changed (anatomy, token table), so `/figma` resumes at
the gate without re-dispatching ⚔️. A `@part` text finding is written into the JSDoc verbatim.

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
