<!-- Part of the DS team docs. Agents, budget, status board, handoffs and shared rules: ../ds-team.md -->

# Workflow D — Component into Figma

Mirror a shipped component into the Figma library. Runs **after** the component exists in code;
it never leads.

```text
component exists in code
  →  architect · ds-plan-figma-component      (variant axes, anatomy, token table, gate questions)
  →  plan lists code findings (dead slot, wrong token, bad ARIA, @part text)?
       yes  →  ⛔ PAUSE: hand off (local file or GitHub issue)  →  session ends
               fix runs in its own session (/fix), ticks findings + updates the plan rows it changed
               →  /figma resumes at the gate — Figma mirrors the fixed code
  →  every value resolves to a token?
       no  →  token-engineer · ds-manage-tokens   (hard stop until it does)
  →  every token has its Figma variable (incl. Device for responsive)?
       no  →  token-engineer · ds-sync-figma-tokens  →  human publishes library
  →  ⛔ GATE: variant grouping + count + the plan's open questions
  →  ux-designer · ds-figma-mapping  →  ds-figma-component-set (default variant only)
  →  ⛔ default variant approved
  →  ux-designer · fan-out → ds-figma-review → ds-figma-copy-me → ds-figma-anatomy → ds-figma-measurements
       review still failing after 3 repairs  →  hard stop, report
     ∥  documentation-engineer · ds-design-guidelines + ds-manage-stories   (writes and places)
  →  ⛔ human approves the Figma sections, reviews and commits
```

**1 · Plan** — `ds-plan-figma-component`. Read-only, code-side only. Note what this does _not_
need: resolving a CSS var to a Figma variable id requires **no Figma access**, because
`scripts/figma-sync` already backfilled those ids into `Base.tokens.json`
(ADR-0017). The architect's real limits are different — no Bash (cannot measure on the dev
server) and Write only under `docs/plans/components/` (cannot create the mapping file), which is why step 3 exists.

**1a · Pause for findings.** Code findings in the plan stop the run before the gate: Figma
mirrors code, so building on a known defect builds the defect twice. Batch every finding into
one handoff and ask the human which kind:

| Handoff    | Who writes it                                     | The handoff                                  | Fix session starts with                         |
| ---------- | ------------------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| **Local**  | orchestrator                                      | `docs/plans/components/<name>-findings.md`   | `/fix docs/plans/components/<name>-findings.md` |
| **GitHub** | 🗺️ issue-manager · `ds-issue-write` → ⛔ → `post` | one issue per finding (or one for the batch) | `/fix #N`                                       |

Local is private and fast and needs no `gh`; it is gitignored like every plan, so it lives only
on this machine. GitHub is durable, visible to the team, and the fix PR closes it with
`Closes #N`.

Either way, the orchestrator then appends a `## Paused` block to
`docs/plans/components/<name>-brief.md` — `blocked by: <findings path or #N>`, the plan path,
the step to resume at (the gate) — and ends the run. The findings file lists each finding as
`file:line`, the defect, and the planner's recommendation; nothing else. When the planner
proposes new `@part` wording (Anatomy), the final text goes in the finding, so the fix session
writes it into the JSDoc — `ComponentParts` reads only that, and Figma's legend copies it.

The run's last message is the handoff, ready to paste into another Claude session: the two
commands, each alone in its own fenced code block so the UI offers a copy button, the fix
first:

````markdown
**Paste in a new session to fix:**

```text
/fix docs/plans/components/ds-progress-bar-findings.md
```

**When the fix is done, paste in a new session to resume Figma:**

```text
/figma ds-progress-bar
```
````

GitHub handoff: the first block is `/fix #N` (one block per issue when the batch was split).
The path is repo-relative, so it works in any session started in this checkout.

**Resume** (`/figma <name>` in a new session): the brief's `## Paused` block routes it. Confirm
the fix landed (the findings file's items are ticked and resolved in the diff, or the issue is
closed or its PR merged), delete the `## Paused` block, and continue at the gate. The fix
session already updated the plan rows it changed (anatomy, token table, findings section —
`ds-modify-component` / `ds-repair-component` do this when the findings file names a plan), so
**no ⚔️ re-dispatch**. Re-dispatch ⚔️ only when the fix changed a variant axis or the fix
session reports a plan row it could not update — that re-plan re-reads the whole plan (~50k).

**2 · Tokens first.** A value with no token behind it is a hard stop, not a hardcoded Figma
value. Figma cannot represent an untokenized value without lying about it, and a hardcode will
not follow the next token change.

> **Gate.** A human approves the variant grouping, the variant count and every open question
> in the plan (numeric props, how responsive values are drawn in Measurements) before anything
> is built — one round-trip, not a question per stretch. Figma's ceiling is 500 variants per set, and discovering the overrun mid-build is the
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

**7 · Document.** Anatomy and Measurements are built in Figma by the ux-designer. Guidelines are
one 📜 documentation-engineer dispatch: it runs `ds-design-guidelines` and places the result
with `ds-manage-stories` in the same pass — two cold starts over the same sources cost ~50k. It
never touches Figma, so it runs in parallel with the fan-out stretch. The per-part description
is the `@part` JSDoc text: the Figma legend and `ComponentParts` both copy it, so the two
surfaces cannot drift and no extra engineer dispatch is needed afterwards.

**Dispatch.** One fresh ux-designer per stretch between checkpoints (map + default variant ⛔ →
fan-out + review + copy me + anatomy + measurements), not one agent resumed across them — a resumed agent
re-pays its whole history every turn. `<name>.figma.md` plus the plan file are the handoff, so the
dispatch prompt names the step and those two paths; it does not restate the plan's decisions.

**Two stretches, matching the board.** The step line in `AGENTS.md` has one 🧚 item per
dispatch, because the board hook marks the agent's next open item per dispatch — a step per
skill puts dispatches on the wrong cards. Anatomy and measurements write sections of the same
doc frame from the same `.figma.md` and plan, so the second stretch builds them in turn after
copy me; a dispatch per section re-reads those files and the Figma skills each time (~70k
tokens). Each section keeps its own checkpoint line in `.figma.md`.

**Re-run `ds-figma-review` when the code changes.** A new prop, a new enum value or a renamed
token silently makes the Figma component a lie, and Figma has no test suite to catch it. A
library that drifts is worse than no library, because designers trust it.
