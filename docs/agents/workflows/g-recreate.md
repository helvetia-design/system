<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow G — Recreate from another site

Someone marks an element on a foreign page (often a legacy Baloise page) and wants it in the
DS. 🐦‍⬛ magpie works out what it is; the gate decides what it becomes; an existing workflow builds it.

```text
url + selector (Orca annotation or DevTools), optional screenshot
  →  🐦‍⬛ magpie · ds-scout-component   →  docs/plans/components/<name>-brief.md
                                          docs/plans/magpie/<name>/ (screenshots, anatomy.png, scout.json)
  →  ⛔ GATE: name, rung, open questions  →  orchestrator appends ## Gate decisions to the brief
  →  route by rung
```

**The brief replaces step 0 of A and C.** It already carries what grilling would collect —
model component, delta, variants, responsive behavior, measurements — plus a **render check**:
magpie rendered its own recipe on the dev server and measured it against the source. No
separate render-check dispatch. The gate walks only the brief's **Decide** list with the human
(the `grilling` skill, scoped to those questions). The **Defaulted** list is shown, not asked.
The answers are appended as `## Gate decisions`.

**NO-TOKEN at the gate, not mid-build.** Every NO-TOKEN row the recipe needs, and every value a
component can't size or style yet (e.g. a 48px `img` in an icon slot), is decided at the gate:
🔮 token gap, a rung-2 delta, or accepted as a workaround on purpose. Finding it later costs a
blocked agent run.

## Route by rung

| Rung (gate decision) | Route                                                                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Composition        | 📜 documentation-engineer · `ds-document-guidelines` — the brief's recipe as a simple page/story: Banner with its Lead inside, canvas, "When to use", no "How it is built" or "Decisions" (no utility classes — `ds-team.md` → Rules) → `ds-validate-documentation`. No code, no changeset, no Figma. |
| 2 Variant            | Workflow C. A new enum value or class the brief names exactly (file + value) goes straight to 🧙 component-engineer; a new prop, event or slot enters at ⚔️ architect · `ds-plan-component` (grill skipped)                                                                                           |
| 3 HTML+CSS pattern   | Workflow C, entering at ⚔️ architect; target `packages/styles` (🧙 component-engineer owns it)                                                                                                                                                                                                        |
| 4 New web component  | Workflow A, entering at step 1 ⚔️ plan ∥ 🛡️ a11y-plan (grill skipped)                                                                                                                                                                                                                                 |

**A composite runs its delta first.** Rung 1 + a rung-2 delta (a card + list composition that
needs a new list variant) goes through C for the variant, then the composition recipe — the
recipe can only use the variant once it exists.

**One 📜 dispatch for a composite.** The delta's docs (Variants page, stories) and the rung-1
recipe page go to the same documentation-engineer run, or a SendMessage to it. Two dispatches
read the same sources twice.

**NO-TOKEN rows go to 🔮 token-engineer inside the routed workflow**, at its tokens step. The
brief lists them; magpie never proposes a hardcoded value.

**Brand-color axis.** When the brief says one Brand* surface was detected, the gate decides
whether all four ship. Its contrast table is magpie's measurement, not a sign-off — 🛡️
a11y-expert still verifies in the routed workflow.
