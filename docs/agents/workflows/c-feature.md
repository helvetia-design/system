<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

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
  →  ds-changeset (minor)
  →  Figma drift check     (only if it applies — see ../ds-team.md)
  →  issue-manager · ds-pr-body ∥ ds-issue-reply  →  ⛔ GATE  →  post   (see ../ds-team.md → GitHub)
  →  human reviews and commits
```

**A planner dispatch is always preceded by grilling** (Workflow A step 0), here too — a new
public prop is a permanent API decision. The branch that skips the planner skips the grilling
with it: a change whose shape is already settled does not need a design tree.

`ds-modify-component`, not `ds-implement-component` — backward compatibility and impact
assessment are the point. A new prop reaches stories (`ds-manage-stories`) and tests; a new
visual state reaches tokens too.

**A form component's value, event or disabled/validity behaviour reaches the frameworks too.**
The component-engineer runs `ds-framework-wrappers` to check the Angular value-accessor wrapper
still fits (and adds one if a shipped form component lacks it); the test-engineer extends its `apps/integration-angular` and
`apps/integration-react` tests (see ownership note ³).

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
