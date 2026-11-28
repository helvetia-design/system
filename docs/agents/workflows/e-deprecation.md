<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow E — Deprecation

Retire a prop, enum value, event, slot, `@part`, token or whole component without breaking
consumers. Policy: `docs/ARCHITECTURE.md` → Deprecation Policy. **Two runs, separated by
releases:** deprecate now (minor), remove in a later major (E′). Never both in one run.

```text
E · deprecate
0 grill the human           →  brief: what goes, its replacement, the removal major
1 architect · ds-plan-component  (deprecation plan)  →  ⛔ GATE
2 component-engineer · ds-modify-component           (TDD: old API keeps working + warns)
3 token-engineer · ds-manage-tokens                  (only if tokens are deprecated)
4 test ∥ docs                                         (parallel, disjoint files)
5 ds-validate-component ∥ code-review  →  6 ds-changeset (minor)  →  7 Figma drift check
8 issue-manager · ds-pr-body ∥ ds-issue-reply  →  ⛔ GATE  →  post
→  human reviews and commits

E′ · remove — a later major, after the window in ARCHITECTURE.md
⛔ GATE: human confirms the window has passed
→  component-engineer removes  →  token-engineer removes  →  test ∥ docs
→  ds-validate-component  →  ds-changeset (major)  →  Figma drift check
→  issue-manager · ds-pr-body ∥ ds-issue-reply  →  ⛔ GATE  →  post
```

**0 · Grill** — always: a deprecation is a public API decision. Settle three things in the
brief: what exactly is deprecated, what replaces it (or "nothing — drop it"), and the major in
which it is removed. No replacement and no removal version means no deprecation yet.

**1 · Plan** — the architect lists every consumer-facing surface the deprecated thing reaches:
the prop/enum/event/slot/part, `--ds-<name>-*` tokens and public `--` CSS variables, Angular
and React wrapper inputs/outputs, Storybook stories and controls, and other components that use
it internally. Internal users migrate in this run; consumers migrate on their own schedule.
Out-of-scope findings become issues as usual.

**2 · Deprecate** — the component-engineer, from the plan, test-first (`tdd`): a red → green
cycle per seam — the old API still works and warns, the replacement works. Existing tests
stay; none deleted.

- `@deprecated Use <replacement> instead. Removed in <major>.` JSDoc on the member, so it
  reaches `components.d.ts`, the wrappers and the editor.
- The old API **keeps working**, mapped onto the replacement where one exists. A deprecation
  that changes behavior is a breaking change — back to A.
- One console warning per instance through the component's `Loggable` logger, naming the
  component, the old API, the replacement and the removal major. It must also fire for an
  initial attribute value, not only on `@Watch`.
- Internal usages in other components move to the replacement.

**3 · Tokens** — `ds-manage-tokens` Phase 5: the old token stays, resolves to the new one,
and is marked deprecated in its `$description`.

**4 · Test ∥ docs**

| Agent                  | Skill               | Writes                                                                                               |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| test-engineer          | `ds-test-component` | coverage review of step 2's tests (findings → repair); visual sections for the replacement, if any   |
| documentation-engineer | `ds-manage-stories` | deprecated member out of controls and examples; a deprecation note with old → new markup on its page |

**5 · Review** — `code-review` (mattpocock-skills) run by the orchestrator on the diff, beside `ds-validate-component`; findings routed to the owner.

**6 · Changeset** — minor, summary names the deprecated member, its replacement and the
removal major.

**7 · Figma drift check** — the deprecated value or prop is **removed from Figma now**, not at
E′: new designs must stop using it while code still renders it. `ds-figma-review` treats a
`@deprecated` code value as expected-absent.

**E′ · Remove.** No grilling and no planner — the decisions were made at E; the brief and the
E changeset are the record. The human gate only confirms the window has passed. Removing a
test that covers the removed API is the one case where deleting a test is the change itself,
not weakening the suite — the owner of the file (component-engineer for `.spec.ts`,
`.component.play.ts`, PO; test-engineer for visual/SSR/variants) names each one it deletes. Changeset: **major**.

**Optional · Retro** — the orchestrator's last line is "Type `/retro` to review how this run went." `retro` is user-invoked only (mattpocock-skills); no agent runs it.
