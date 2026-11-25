<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow D — Component into Figma

Mirror a shipped component into the Figma library. Runs **after** the component exists in code;
it never leads.

```text
component exists in code
  →  architect · ds-plan-figma-component      (variant axes, anatomy, token table)
  →  every value resolves to a token?
       no  →  token-engineer · ds-manage-tokens   (hard stop until it does)
  →  every token has its Figma variable (incl. Device for responsive)?
       no  →  token-engineer · ds-sync-figma-tokens  →  human publishes library
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
server) and Write only under `docs/plans/components/` (cannot create the mapping file), which is why step 3 exists.

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

**Dispatch.** One fresh ux-designer per stretch between checkpoints (map → default variant ⛔ →
fan-out + review + copy me + measurements), not one agent resumed across them — a resumed agent
re-pays its whole history every turn. `<name>.figma.md` plus the plan file are the handoff, so the
dispatch prompt names the step and those two paths; it does not restate the plan's decisions.

**Re-run `ds-figma-review` when the code changes.** A new prop, a new enum value or a renamed
token silently makes the Figma component a lie, and Figma has no test suite to catch it. A
library that drifts is worse than no library, because designers trust it.
