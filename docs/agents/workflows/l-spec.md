<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow L — Spec only

**Plan and publish a spec. Nothing is built.** Use when the human wants the decision recorded on
GitHub before (or instead of) a build. To build from it later, start Workflow A or C and say
"spec #N" (see A step 0).

```text
0 grill the human           →  docs/plans/components/<name>-brief.md
1 plan ∥ a11y-plan          →  ⛔ GATE: plan approved by a human
2 ⛔ human types /to-spec   →  spec issue on GitHub
→  end   (no build, no tickets)
```

Steps 0 and 1 are Workflow A's, unchanged: `grilling` by the orchestrator, then
`ds-plan-component` ∥ `ds-a11y-plan`, then the gate, with out-of-scope findings filed as issues and
answers written to the brief's `## Gate decisions`.

**2 · Spec** — `to-spec` is user-invoked only (`disable-model-invocation`), so no agent can run it.
After the gate the orchestrator prints one line and stops:

> Plan approved. Type `/to-spec` to publish the spec.

The human runs it in the main session. It synthesizes from the conversation and the brief (it asks
no questions except to confirm the **test seams**), publishes the issue and applies `ready-for-agent`.
A grilled, gated plan meets the Definition of Ready.

**After it is published**, the orchestrator adds `Spec: #N` as the first line of the plan file and
reports the issue number. The spec holds the behavioural "what and why" — no file paths, tokens or
wrapper lists. Those stay in the gitignored plan, which is why both exist.

**Rules**

- Writes nothing but the brief and the plan files. No component source, tests or docs.
- No `to-tickets`, no build-or-ticket question. This workflow ends at the spec.
- Needs the `mattpocock-skills` plugin (`CONTRIBUTING.md` → Getting Started).
